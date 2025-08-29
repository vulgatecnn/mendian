import { Request, Response, NextFunction } from 'express';
import { weChatService } from '@/services/wechat.service.js';
import { syncService } from '@/services/sync.service.js';
import { authService } from '@/services/auth.service.js';
import { logger } from '@/utils/logger.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '@/utils/errors.js';
import { wechatConfig } from '@/config/wechat.config.js';

export const wechatController = {
  /**
   * 生成企业微信OAuth授权URL
   * GET /api/v1/wechat/oauth/url
   */
  generateOAuthUrl: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { redirectTo, platform } = req.query;
      
      // 生成状态参数，包含重定向信息和平台信息
      const state = weChatService.generateOAuthState({
        redirectTo: redirectTo as string,
        platform: platform as string || 'web',
        timestamp: Date.now(),
      });
      
      const oauthUrl = weChatService.generateOAuthUrl(state);
      
      logger.info('Generated WeChat OAuth URL', {
        state,
        platform,
        redirectTo,
      });
      
      res.json({
        success: true,
        data: {
          oauthUrl,
          state,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 处理企业微信OAuth回调
   * GET /api/v1/wechat/oauth/callback
   */
  handleOAuthCallback: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        throw new BadRequestError('缺少授权码参数');
      }

      // 验证状态参数
      let stateData = null;
      if (state) {
        try {
          stateData = weChatService.validateOAuthState(state as string);
        } catch (error) {
          logger.warn('Invalid OAuth state parameter:', error);
          // 状态参数无效但不阻止登录流程
        }
      }

      // 处理企业微信登录
      const loginResult = await authService.handleWeChatCallback(code as string);
      
      logger.info('WeChat OAuth login successful', {
        userId: loginResult.user.id,
        username: loginResult.user.username,
        state: stateData,
      });

      // 根据平台返回不同的响应
      const platform = stateData?.platform || 'web';
      const redirectTo = stateData?.redirectTo || '/dashboard';
      
      if (platform === 'mobile' || req.get('User-Agent')?.includes('MicroMessenger')) {
        // 移动端或企业微信内嵌浏览器，直接跳转
        const redirectUrl = `${wechatConfig.redirectUri}?token=${loginResult.token}&redirectTo=${encodeURIComponent(redirectTo)}`;
        res.redirect(redirectUrl);
      } else {
        // Web端，返回JSON响应
        res.json({
          success: true,
          data: loginResult,
          redirectTo,
        });
      }
    } catch (error) {
      logger.error('WeChat OAuth callback error:', error);
      
      // 错误页面重定向或JSON响应
      if (req.get('User-Agent')?.includes('MicroMessenger')) {
        const errorUrl = `${wechatConfig.redirectUri}/error?message=${encodeURIComponent(error instanceof Error ? error.message : '登录失败')}`;
        res.redirect(errorUrl);
      } else {
        next(error);
      }
    }
  },

  /**
   * 获取当前用户的企业微信信息
   * GET /api/v1/wechat/user/profile
   */
  getUserProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('用户未登录');
      }

      // 从数据库获取用户信息
      const user = await authService.getCurrentUser(userId);
      
      if (!user.wechatId) {
        throw new NotFoundError('用户未绑定企业微信账号');
      }

      // 从企业微信获取最新信息
      const wechatUserInfo = await weChatService.getUserDetail(user.wechatId);
      
      res.json({
        success: true,
        data: {
          local: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            department: user.department,
            lastLoginAt: user.lastLoginAt,
          },
          wechat: {
            userId: wechatUserInfo.userId,
            name: wechatUserInfo.name,
            email: wechatUserInfo.email,
            mobile: wechatUserInfo.mobile,
            avatar: wechatUserInfo.avatar,
            department: wechatUserInfo.department,
            position: wechatUserInfo.position,
            gender: wechatUserInfo.gender,
            status: wechatUserInfo.status,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 同步企业微信数据
   * POST /api/v1/wechat/sync
   */
  syncData: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        type = 'incremental',
        syncUsers = true,
        syncDepartments = true,
        departmentIds,
        batchSize = 20,
      } = req.body;

      // 检查权限 - 只有管理员可以执行同步
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('ADMIN') && !userRoles.includes('SYSTEM_ADMIN')) {
        throw new UnauthorizedError('权限不足，只有管理员可以执行数据同步');
      }

      let result;
      const options = {
        syncUsers,
        syncDepartments,
        departmentIds,
        batchSize,
      };

      if (type === 'full') {
        result = await syncService.fullSync(options);
      } else {
        result = await syncService.incrementalSync(options);
      }

      logger.info('WeChat data sync completed', {
        type,
        result,
        requestedBy: req.user?.username,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取同步状态
   * GET /api/v1/wechat/sync/status
   */
  getSyncStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await syncService.getSyncStatus();
      
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取部门列表（从企业微信）
   * GET /api/v1/wechat/departments
   */
  getDepartments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId, useCache = true } = req.query;
      
      let departments;
      if (useCache === 'false') {
        // 直接从企业微信获取
        departments = await weChatService.getDepartmentList(
          departmentId ? parseInt(departmentId as string) : undefined
        );
      } else {
        // 从本地数据库获取（推荐）
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const query: any = {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            wechatId: true,
            name: true,
            parentId: true,
            level: true,
            fullPath: true,
            sortOrder: true,
            syncedAt: true,
          },
          orderBy: [
            { level: 'asc' },
            { sortOrder: 'asc' },
          ],
        };

        if (departmentId) {
          query.where.wechatId = departmentId;
        }

        departments = await prisma.department.findMany(query);
        await prisma.$disconnect();
      }
      
      res.json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取部门用户列表
   * GET /api/v1/wechat/departments/:departmentId/users
   */
  getDepartmentUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId } = req.params;
      const { fetchChild = false, useCache = true } = req.query;
      
      if (!departmentId) {
        throw new BadRequestError('部门ID不能为空');
      }

      let users;
      if (useCache === 'false') {
        // 直接从企业微信获取
        const userIds = await weChatService.getDepartmentUsers(
          parseInt(departmentId),
          fetchChild === 'true'
        );
        
        // 获取用户详细信息
        users = await weChatService.batchGetUserDetails(userIds);
      } else {
        // 从本地数据库获取（推荐）
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const department = await prisma.department.findUnique({
          where: { wechatId: departmentId },
        });
        
        if (!department) {
          throw new NotFoundError('部门不存在');
        }

        const query: any = {
          where: {
            departmentId: department.id,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            wechatId: true,
            username: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            jobTitle: true,
            department: {
              select: {
                id: true,
                name: true,
                wechatId: true,
              },
            },
            lastLoginAt: true,
          },
        };

        users = await prisma.user.findMany(query);
        await prisma.$disconnect();
      }
      
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 企业微信服务健康检查
   * GET /api/v1/wechat/health
   */
  healthCheck: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await weChatService.healthCheck();
      
      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取企业微信配置信息（仅限管理员）
   * GET /api/v1/wechat/config
   */
  getConfig: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 检查权限 - 只有管理员可以查看配置
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('ADMIN') && !userRoles.includes('SYSTEM_ADMIN')) {
        throw new UnauthorizedError('权限不足');
      }

      const config = {
        corpId: wechatConfig.corpId,
        agentId: wechatConfig.agentId,
        redirectUri: wechatConfig.redirectUri,
        cacheConfig: wechatConfig.cacheConfig,
        syncConfig: wechatConfig.syncConfig,
        devConfig: wechatConfig.devConfig,
      };
      
      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 清理缓存
   * DELETE /api/v1/wechat/cache
   */
  clearCache: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 检查权限
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('ADMIN') && !userRoles.includes('SYSTEM_ADMIN')) {
        throw new UnauthorizedError('权限不足');
      }

      await weChatService.cleanupCache();
      
      logger.info('WeChat cache cleared by admin', {
        requestedBy: req.user?.username,
      });
      
      res.json({
        success: true,
        message: '缓存清理完成',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取API统计信息
   * GET /api/v1/wechat/stats
   */
  getApiStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await weChatService.getApiStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};