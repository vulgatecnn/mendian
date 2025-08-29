/**
 * 企业微信用户同步定时任务
 * WeChat Work User Sync Scheduled Job
 */

import { CronJob } from 'cron';
import { wechatSyncService } from '../services/sync.service.js';
import { logger } from '../utils/logger.js';
import { validateWeChatConfig } from '../config/wechat.config.js';

export class UserSyncJob {
  private fullSyncJob: CronJob | null = null;
  private incrementalSyncJob: CronJob | null = null;

  constructor() {
    this.initializeJobs();
  }

  /**
   * 初始化定时任务
   */
  private initializeJobs(): void {
    // 检查企业微信配置
    if (!validateWeChatConfig()) {
      logger.warn('WeChat Work configuration not complete, skipping sync job initialization');
      return;
    }

    // 全量同步 - 每天凌晨2点执行
    this.fullSyncJob = new CronJob(
      '0 2 * * *', // 每天凌晨2点
      this.performFullSync.bind(this),
      null,
      false, // 不自动启动
      'Asia/Shanghai'
    );

    // 增量同步 - 每小时执行
    this.incrementalSyncJob = new CronJob(
      '0 * * * *', // 每小时整点
      this.performIncrementalSync.bind(this),
      null,
      false, // 不自动启动
      'Asia/Shanghai'
    );

    logger.info('User sync jobs initialized successfully');
  }

  /**
   * 执行全量同步
   */
  private async performFullSync(): Promise<void> {
    try {
      logger.info('Starting scheduled full sync');
      
      const result = await wechatSyncService.performFullSync({
        fullSync: true,
        batchSize: 100
      });

      if (result.success) {
        logger.info('Scheduled full sync completed successfully', {
          duration: result.duration,
          departmentStats: result.departmentStats,
          userStats: result.userStats
        });
      } else {
        logger.error('Scheduled full sync failed', {
          errors: result.errors,
          duration: result.duration
        });
      }
    } catch (error) {
      logger.error('Scheduled full sync failed with exception:', error);
    }
  }

  /**
   * 执行增量同步
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      logger.info('Starting scheduled incremental sync');
      
      const result = await wechatSyncService.performFullSync({
        fullSync: false,
        batchSize: 50
      });

      if (result.success) {
        logger.info('Scheduled incremental sync completed successfully', {
          duration: result.duration,
          departmentStats: result.departmentStats,
          userStats: result.userStats
        });
      } else {
        logger.error('Scheduled incremental sync failed', {
          errors: result.errors,
          duration: result.duration
        });
      }
    } catch (error) {
      logger.error('Scheduled incremental sync failed with exception:', error);
    }
  }

  /**
   * 启动所有定时任务
   */
  public start(): void {
    if (!validateWeChatConfig()) {
      logger.warn('WeChat Work configuration not complete, cannot start sync jobs');
      return;
    }

    try {
      if (this.fullSyncJob && !this.fullSyncJob.running) {
        this.fullSyncJob.start();
        logger.info('Full sync job started (daily at 2:00 AM)');
      }

      if (this.incrementalSyncJob && !this.incrementalSyncJob.running) {
        this.incrementalSyncJob.start();
        logger.info('Incremental sync job started (hourly)');
      }

      logger.info('All sync jobs started successfully');
    } catch (error) {
      logger.error('Failed to start sync jobs:', error);
    }
  }

  /**
   * 停止所有定时任务
   */
  public stop(): void {
    try {
      if (this.fullSyncJob) {
        this.fullSyncJob.stop();
        logger.info('Full sync job stopped');
      }

      if (this.incrementalSyncJob) {
        this.incrementalSyncJob.stop();
        logger.info('Incremental sync job stopped');
      }

      logger.info('All sync jobs stopped successfully');
    } catch (error) {
      logger.error('Failed to stop sync jobs:', error);
    }
  }

  /**
   * 获取任务状态
   */
  public getJobStatus(): {
    fullSyncRunning: boolean;
    incrementalSyncRunning: boolean;
    fullSyncNextRun: Date | null;
    incrementalSyncNextRun: Date | null;
  } {
    return {
      fullSyncRunning: this.fullSyncJob?.running || false,
      incrementalSyncRunning: this.incrementalSyncJob?.running || false,
      fullSyncNextRun: this.fullSyncJob?.nextDate()?.toDate() || null,
      incrementalSyncNextRun: this.incrementalSyncJob?.nextDate()?.toDate() || null
    };
  }

  /**
   * 手动触发全量同步
   */
  public async triggerFullSync(): Promise<void> {
    logger.info('Manual full sync triggered');
    await this.performFullSync();
  }

  /**
   * 手动触发增量同步
   */
  public async triggerIncrementalSync(): Promise<void> {
    logger.info('Manual incremental sync triggered');
    await this.performIncrementalSync();
  }

  /**
   * 重启任务
   */
  public restart(): void {
    this.stop();
    this.initializeJobs();
    this.start();
  }

  /**
   * 销毁任务
   */
  public destroy(): void {
    this.stop();
    this.fullSyncJob?.destroy();
    this.incrementalSyncJob?.destroy();
    this.fullSyncJob = null;
    this.incrementalSyncJob = null;
    logger.info('Sync jobs destroyed');
  }
}

// 导出单例实例
export const userSyncJob = new UserSyncJob();
export default userSyncJob;