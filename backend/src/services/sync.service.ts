/**
 * 企业微信用户部门同步服务
 * WeChat Work User & Department Sync Service
 */

import { PrismaClient } from '@prisma/client';
import { wechatWorkService, WeChatUserDetail, WeChatDepartment } from './wechat.service.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../config/redis.js';

interface SyncResult {
  success: boolean;
  departmentStats: {
    created: number;
    updated: number;
    skipped: number;
  };
  userStats: {
    created: number;
    updated: number;
    skipped: number;
  };
  errors: string[];
  duration: number;
}

interface SyncOptions {
  fullSync?: boolean;
  departmentOnly?: boolean;
  userOnly?: boolean;
  batchSize?: number;
}

class WeChatSyncService {
  private prisma: PrismaClient;
  private readonly syncLockKey = 'wechat:sync:lock';
  private readonly lastSyncKey = 'wechat:sync:last';

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 执行完整同步（部门 + 用户）
   */
  async performFullSync(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      departmentStats: { created: 0, updated: 0, skipped: 0 },
      userStats: { created: 0, updated: 0, skipped: 0 },
      errors: [],
      duration: 0
    };

    try {
      // 检查同步锁
      const lockAcquired = await this.acquireSyncLock();
      if (!lockAcquired) {
        throw new Error('Another sync process is running');
      }

      logger.info('Starting WeChat Work full sync');

      // 同步部门
      if (!options.userOnly) {
        const deptResult = await this.syncDepartments(options.fullSync);
        result.departmentStats = deptResult;
      }

      // 同步用户
      if (!options.departmentOnly) {
        const userResult = await this.syncUsers(options.fullSync, options.batchSize);
        result.userStats = userResult;
      }

      // 更新最后同步时间
      await redisClient.set(this.lastSyncKey, new Date().toISOString());

      result.success = true;
      logger.info('WeChat Work full sync completed successfully', {
        departmentStats: result.departmentStats,
        userStats: result.userStats
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      logger.error('WeChat Work sync failed:', error);
    } finally {
      await this.releaseSyncLock();
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * 同步部门架构
   */
  async syncDepartments(fullSync: boolean = false): Promise<SyncResult['departmentStats']> {
    const stats = { created: 0, updated: 0, skipped: 0 };

    try {
      logger.info('Starting department sync');

      const wechatDepartments = await wechatWorkService.getDepartmentList();
      
      if (!wechatDepartments || wechatDepartments.length === 0) {
        logger.warn('No departments found from WeChat Work API');
        return stats;
      }

      // 按层级排序，确保父部门先创建
      const sortedDepartments = this.sortDepartmentsByHierarchy(wechatDepartments);

      for (const wechatDept of sortedDepartments) {
        try {
          await this.syncSingleDepartment(wechatDept, stats);
        } catch (error) {
          logger.error(`Failed to sync department ${wechatDept.name}:`, error);
          continue;
        }
      }

      // 如果是全量同步，标记删除不存在的部门
      if (fullSync) {
        await this.markInactiveDepartments(wechatDepartments);
      }

      logger.info('Department sync completed', stats);
      return stats;

    } catch (error) {
      logger.error('Department sync failed:', error);
      throw error;
    }
  }

  /**
   * 同步单个部门
   */
  private async syncSingleDepartment(
    wechatDept: WeChatDepartment, 
    stats: SyncResult['departmentStats']
  ): Promise<void> {
    try {
      const existingDept = await this.prisma.department.findUnique({
        where: { wechatId: wechatDept.id.toString() }
      });

      const departmentData = {
        wechatId: wechatDept.id.toString(),
        name: wechatDept.name,
        parentId: wechatDept.parentid === 1 ? null : wechatDept.parentid.toString(),
        level: this.calculateDepartmentLevel(wechatDept, []),
        isActive: true,
        updatedAt: new Date()
      };

      if (existingDept) {
        // 检查是否需要更新
        const needsUpdate = 
          existingDept.name !== departmentData.name ||
          existingDept.parentId !== departmentData.parentId ||
          !existingDept.isActive;

        if (needsUpdate) {
          await this.prisma.department.update({
            where: { id: existingDept.id },
            data: departmentData
          });
          stats.updated++;
          logger.debug(`Updated department: ${wechatDept.name}`);
        } else {
          stats.skipped++;
        }
      } else {
        // 创建新部门
        await this.prisma.department.create({
          data: departmentData
        });
        stats.created++;
        logger.debug(`Created department: ${wechatDept.name}`);
      }

    } catch (error) {
      logger.error(`Error syncing department ${wechatDept.name}:`, error);
      throw error;
    }
  }

  /**
   * 同步用户信息
   */
  async syncUsers(fullSync: boolean = false, batchSize: number = 50): Promise<SyncResult['userStats']> {
    const stats = { created: 0, updated: 0, skipped: 0 };

    try {
      logger.info('Starting user sync');

      const wechatUsers = await wechatWorkService.getAllUsers();
      
      if (!wechatUsers || wechatUsers.length === 0) {
        logger.warn('No users found from WeChat Work API');
        return stats;
      }

      // 分批处理用户
      const batches = this.chunkArray(wechatUsers, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        logger.info(`Processing user batch ${i + 1}/${batches.length} (${batch.length} users)`);
        
        for (const wechatUser of batch) {
          try {
            await this.syncSingleUser(wechatUser, stats);
          } catch (error) {
            logger.error(`Failed to sync user ${wechatUser.name}:`, error);
            continue;
          }
        }

        // 批次间添加短暂延时
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 如果是全量同步，标记删除不存在的用户
      if (fullSync) {
        await this.markInactiveUsers(wechatUsers);
      }

      logger.info('User sync completed', stats);
      return stats;

    } catch (error) {
      logger.error('User sync failed:', error);
      throw error;
    }
  }

  /**
   * 同步单个用户
   */
  private async syncSingleUser(
    wechatUser: WeChatUserDetail, 
    stats: SyncResult['userStats']
  ): Promise<void> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { wechatId: wechatUser.userid }
      });

      // 查找用户主部门
      let departmentId: string | null = null;
      if (wechatUser.main_department) {
        const department = await this.prisma.department.findUnique({
          where: { wechatId: wechatUser.main_department.toString() }
        });
        departmentId = department?.id || null;
      }

      const userData = {
        wechatId: wechatUser.userid,
        username: wechatUser.userid, // 使用wechat userid作为username
        email: wechatUser.email,
        phone: wechatUser.mobile,
        name: wechatUser.name,
        avatar: wechatUser.avatar,
        departmentId,
        isActive: true,
        updatedAt: new Date()
      };

      if (existingUser) {
        // 检查是否需要更新
        const needsUpdate = 
          existingUser.name !== userData.name ||
          existingUser.email !== userData.email ||
          existingUser.phone !== userData.phone ||
          existingUser.avatar !== userData.avatar ||
          existingUser.departmentId !== userData.departmentId ||
          !existingUser.isActive;

        if (needsUpdate) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: userData
          });
          stats.updated++;
          logger.debug(`Updated user: ${wechatUser.name}`);
        } else {
          stats.skipped++;
        }
      } else {
        // 创建新用户
        await this.prisma.user.create({
          data: userData
        });
        stats.created++;
        logger.debug(`Created user: ${wechatUser.name}`);
      }

    } catch (error) {
      logger.error(`Error syncing user ${wechatUser.name}:`, error);
      throw error;
    }
  }

  /**
   * 标记不活跃部门
   */
  private async markInactiveDepartments(activeDepartments: WeChatDepartment[]): Promise<void> {
    try {
      const activeWechatIds = activeDepartments.map(d => d.id.toString());
      
      const result = await this.prisma.department.updateMany({
        where: {
          wechatId: { notIn: activeWechatIds },
          isActive: true
        },
        data: { isActive: false, updatedAt: new Date() }
      });

      if (result.count > 0) {
        logger.info(`Marked ${result.count} departments as inactive`);
      }
    } catch (error) {
      logger.error('Failed to mark inactive departments:', error);
    }
  }

  /**
   * 标记不活跃用户
   */
  private async markInactiveUsers(activeUsers: WeChatUserDetail[]): Promise<void> {
    try {
      const activeWechatIds = activeUsers.map(u => u.userid);
      
      const result = await this.prisma.user.updateMany({
        where: {
          wechatId: { notIn: activeWechatIds },
          isActive: true
        },
        data: { isActive: false, updatedAt: new Date() }
      });

      if (result.count > 0) {
        logger.info(`Marked ${result.count} users as inactive`);
      }
    } catch (error) {
      logger.error('Failed to mark inactive users:', error);
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<{
    isRunning: boolean;
    lastSyncTime: string | null;
    lastSyncDuration: number | null;
  }> {
    try {
      const isRunning = await redisClient.exists(this.syncLockKey) > 0;
      const lastSyncTime = await redisClient.get(this.lastSyncKey);
      
      // 从数据库获取统计信息
      const [userCount, departmentCount] = await Promise.all([
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.department.count({ where: { isActive: true } })
      ]);

      return {
        isRunning,
        lastSyncTime,
        lastSyncDuration: null, // TODO: 存储上次同步耗时
        userCount,
        departmentCount
      } as any;
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * 工具方法：按层级排序部门
   */
  private sortDepartmentsByHierarchy(departments: WeChatDepartment[]): WeChatDepartment[] {
    const deptMap = new Map<number, WeChatDepartment>();
    departments.forEach(dept => deptMap.set(dept.id, dept));

    const sorted: WeChatDepartment[] = [];
    const processed = new Set<number>();

    const processNode = (dept: WeChatDepartment) => {
      if (processed.has(dept.id)) return;
      
      // 先处理父部门
      if (dept.parentid !== 1 && deptMap.has(dept.parentid)) {
        const parent = deptMap.get(dept.parentid)!;
        if (!processed.has(parent.id)) {
          processNode(parent);
        }
      }
      
      sorted.push(dept);
      processed.add(dept.id);
    };

    departments.forEach(dept => processNode(dept));
    return sorted;
  }

  /**
   * 计算部门层级
   */
  private calculateDepartmentLevel(dept: WeChatDepartment, departments: WeChatDepartment[]): number {
    if (dept.parentid === 1) return 1;
    
    const parent = departments.find(d => d.id === dept.parentid);
    if (!parent) return 1;
    
    return this.calculateDepartmentLevel(parent, departments) + 1;
  }

  /**
   * 数组分批工具
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 获取同步锁
   */
  private async acquireSyncLock(): Promise<boolean> {
    try {
      const result = await redisClient.set(
        this.syncLockKey, 
        Date.now().toString(), 
        'EX', 
        3600, // 1小时过期
        'NX'  // 只在key不存在时设置
      );
      return result === 'OK';
    } catch (error) {
      logger.error('Failed to acquire sync lock:', error);
      return false;
    }
  }

  /**
   * 释放同步锁
   */
  private async releaseSyncLock(): Promise<void> {
    try {
      await redisClient.del(this.syncLockKey);
    } catch (error) {
      logger.error('Failed to release sync lock:', error);
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const wechatSyncService = new WeChatSyncService();
export default wechatSyncService;