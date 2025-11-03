"""
企业微信集成 Celery 任务
"""
import logging
from celery import shared_task
from django.utils import timezone

from .services.wechat_sync_service import WechatSyncService


logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def sync_wechat_departments(self):
    """
    同步企业微信部门的定时任务
    """
    try:
        logger.info("开始执行企业微信部门同步定时任务")
        
        sync_service = WechatSyncService()
        sync_log = sync_service.sync_departments()
        
        if sync_log.status == 'success':
            logger.info(f"企业微信部门同步成功: 成功 {sync_log.success_count}, 失败 {sync_log.failed_count}")
            return {
                'status': 'success',
                'message': f'部门同步完成: 成功 {sync_log.success_count}, 失败 {sync_log.failed_count}',
                'sync_log_id': sync_log.id
            }
        else:
            logger.error(f"企业微信部门同步失败: {sync_log.error_message}")
            raise Exception(sync_log.error_message)
            
    except Exception as e:
        logger.error(f"企业微信部门同步任务执行失败: {e}")
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"将在 60 秒后重试 (第 {self.request.retries + 1} 次)")
            raise self.retry(countdown=60, exc=e)
        else:
            logger.error("企业微信部门同步任务重试次数已达上限")
            raise e


@shared_task(bind=True, max_retries=3)
def sync_wechat_users(self):
    """
    同步企业微信用户的定时任务
    """
    try:
        logger.info("开始执行企业微信用户同步定时任务")
        
        sync_service = WechatSyncService()
        sync_log = sync_service.sync_users()
        
        if sync_log.status == 'success':
            logger.info(f"企业微信用户同步成功: 成功 {sync_log.success_count}, 失败 {sync_log.failed_count}")
            return {
                'status': 'success',
                'message': f'用户同步完成: 成功 {sync_log.success_count}, 失败 {sync_log.failed_count}',
                'sync_log_id': sync_log.id
            }
        else:
            logger.error(f"企业微信用户同步失败: {sync_log.error_message}")
            raise Exception(sync_log.error_message)
            
    except Exception as e:
        logger.error(f"企业微信用户同步任务执行失败: {e}")
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"将在 60 秒后重试 (第 {self.request.retries + 1} 次)")
            raise self.retry(countdown=60, exc=e)
        else:
            logger.error("企业微信用户同步任务重试次数已达上限")
            raise e


@shared_task(bind=True, max_retries=3)
def sync_wechat_all(self):
    """
    全量同步企业微信数据的定时任务
    """
    try:
        logger.info("开始执行企业微信全量同步定时任务")
        
        sync_service = WechatSyncService()
        sync_log = sync_service.sync_all()
        
        if sync_log.status == 'success':
            logger.info(f"企业微信全量同步成功: 成功 {sync_log.success_count}, 失败 {sync_log.failed_count}")
            return {
                'status': 'success',
                'message': f'全量同步完成: 成功 {sync_log.success_count}, 失败 {sync_log.failed_count}',
                'sync_log_id': sync_log.id
            }
        else:
            logger.error(f"企业微信全量同步失败: {sync_log.error_message}")
            raise Exception(sync_log.error_message)
            
    except Exception as e:
        logger.error(f"企业微信全量同步任务执行失败: {e}")
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"将在 180 秒后重试 (第 {self.request.retries + 1} 次)")
            raise self.retry(countdown=180, exc=e)  # 全量同步失败后等待更长时间
        else:
            logger.error("企业微信全量同步任务重试次数已达上限")
            raise e


# 定时任务配置（需要在 settings.py 或 celery.py 中配置）
"""
在 settings.py 中添加以下配置来设置定时任务：

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # 每天凌晨 2 点执行全量同步
    'sync-wechat-all-daily': {
        'task': 'wechat_integration.tasks.sync_wechat_all',
        'schedule': crontab(hour=2, minute=0),
    },
    # 每 4 小时同步一次用户信息
    'sync-wechat-users-4hours': {
        'task': 'wechat_integration.tasks.sync_wechat_users',
        'schedule': crontab(minute=0, hour='*/4'),
    },
    # 每 6 小时同步一次部门信息
    'sync-wechat-departments-6hours': {
        'task': 'wechat_integration.tasks.sync_wechat_departments',
        'schedule': crontab(minute=0, hour='*/6'),
    },
}
"""