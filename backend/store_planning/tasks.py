"""
开店计划审批相关的Celery任务
"""

from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from datetime import datetime, timedelta
import logging

logger = get_task_logger(__name__)


@shared_task(bind=True, max_retries=3)
def send_approval_notification_task(self, approval_id: int, action: str):
    """发送审批通知任务"""
    
    try:
        from .models import PlanApproval
        from .notification_service import ApprovalNotificationService
        
        approval = PlanApproval.objects.get(id=approval_id)
        notification_service = ApprovalNotificationService()
        
        if action == 'submitted':
            result = notification_service.send_approval_submitted_notification(approval)
        elif action == 'approved':
            result = notification_service.send_approval_approved_notification(approval)
        elif action == 'rejected':
            result = notification_service.send_approval_rejected_notification(approval)
        elif action == 'cancelled':
            result = notification_service.send_approval_cancelled_notification(approval)
        elif action == 'timeout':
            result = notification_service.send_approval_timeout_notification(approval)
        else:
            raise ValueError(f"不支持的通知动作: {action}")
        
        if not result['success']:
            logger.warning(f"审批通知发送失败: {result}")
            
            # 如果发送失败且还有重试次数，则重试
            if self.request.retries < self.max_retries:
                raise self.retry(countdown=60 * (self.request.retries + 1))
        
        logger.info(f"审批通知发送成功: 审批ID={approval_id}, 动作={action}")
        return result
        
    except PlanApproval.DoesNotExist:
        logger.error(f"审批记录不存在: {approval_id}")
        return {'success': False, 'message': '审批记录不存在'}
        
    except Exception as e:
        logger.error(f"发送审批通知任务失败: {str(e)}")
        
        # 重试机制
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60 * (self.request.retries + 1))
        
        return {'success': False, 'message': str(e)}


@shared_task
def check_approval_timeout_task():
    """检查审批超时任务"""
    
    try:
        from .models import PlanApproval
        from .notification_service import ApprovalNotificationService
        from django.utils import timezone
        
        # 获取超时配置
        timeout_days = getattr(settings, 'PLAN_APPROVAL_TIMEOUT_DAYS', 7)
        timeout_date = timezone.now() - timedelta(days=timeout_days)
        
        # 查找超时的审批
        timeout_approvals = PlanApproval.objects.filter(
            status='pending',
            submitted_at__lt=timeout_date
        ).select_related('plan', 'submitted_by')
        
        if not timeout_approvals.exists():
            logger.info("没有发现超时的审批申请")
            return {
                'success': True,
                'message': '没有超时的审批申请',
                'timeout_count': 0
            }
        
        notification_service = ApprovalNotificationService()
        success_count = 0
        error_count = 0
        
        for approval in timeout_approvals:
            try:
                result = notification_service.send_approval_timeout_notification(approval)
                
                if result['success']:
                    success_count += 1
                    logger.info(f"审批超时通知发送成功: {approval.id}")
                else:
                    error_count += 1
                    logger.warning(f"审批超时通知发送失败: {approval.id} - {result}")
                    
            except Exception as e:
                error_count += 1
                logger.error(f"发送审批超时通知时发生错误: {approval.id} - {str(e)}")
        
        result = {
            'success': True,
            'message': f'检查了{timeout_approvals.count()}个超时审批，成功发送{success_count}个通知，失败{error_count}个',
            'timeout_count': timeout_approvals.count(),
            'success_count': success_count,
            'error_count': error_count
        }
        
        logger.info(result['message'])
        return result
        
    except Exception as e:
        logger.error(f"检查审批超时任务失败: {str(e)}")
        return {'success': False, 'message': str(e)}


@shared_task
def sync_external_approval_results_task():
    """同步外部审批结果任务"""
    
    try:
        from .approval_service import PlanApprovalService
        
        approval_service = PlanApprovalService()
        
        # 同步所有待处理的外部审批结果
        result = approval_service.sync_external_approval_results()
        
        logger.info(f"外部审批结果同步完成: {result['message']}")
        return result
        
    except Exception as e:
        logger.error(f"同步外部审批结果任务失败: {str(e)}")
        return {'success': False, 'message': str(e)}


@shared_task
def cleanup_old_approval_logs_task():
    """清理旧的审批日志任务"""
    
    try:
        from .models import PlanExecutionLog
        from django.utils import timezone
        
        # 获取清理配置
        cleanup_days = getattr(settings, 'APPROVAL_LOG_CLEANUP_DAYS', 90)
        cleanup_date = timezone.now() - timedelta(days=cleanup_days)
        
        # 删除旧的审批相关日志
        old_logs = PlanExecutionLog.objects.filter(
            action_type__in=[
                'approval_submitted',
                'approval_approved', 
                'approval_rejected',
                'approval_cancelled',
                'external_approval_approved',
                'external_approval_rejected'
            ],
            created_at__lt=cleanup_date
        )
        
        deleted_count = old_logs.count()
        old_logs.delete()
        
        result = {
            'success': True,
            'message': f'清理了{deleted_count}条旧的审批日志',
            'deleted_count': deleted_count
        }
        
        logger.info(result['message'])
        return result
        
    except Exception as e:
        logger.error(f"清理旧审批日志任务失败: {str(e)}")
        return {'success': False, 'message': str(e)}


@shared_task
def generate_approval_statistics_report_task():
    """生成审批统计报告任务"""
    
    try:
        from .approval_service import PlanApprovalService
        from datetime import datetime, timedelta
        
        approval_service = PlanApprovalService()
        
        # 生成上周的审批统计报告
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        
        statistics = approval_service.get_approval_statistics(
            start_date=start_date,
            end_date=end_date
        )
        
        # 这里可以将统计报告发送给管理员或保存到文件
        logger.info(f"审批统计报告生成完成: {statistics}")
        
        return {
            'success': True,
            'message': '审批统计报告生成成功',
            'statistics': statistics
        }
        
    except Exception as e:
        logger.error(f"生成审批统计报告任务失败: {str(e)}")
        return {'success': False, 'message': str(e)}


# 定时任务配置（需要在Celery Beat中配置）
CELERY_BEAT_SCHEDULE = {
    # 每小时检查一次审批超时
    'check-approval-timeout': {
        'task': 'store_planning.tasks.check_approval_timeout_task',
        'schedule': 3600.0,  # 每小时执行一次
    },
    
    # 每30分钟同步一次外部审批结果
    'sync-external-approval-results': {
        'task': 'store_planning.tasks.sync_external_approval_results_task',
        'schedule': 1800.0,  # 每30分钟执行一次
    },
    
    # 每天凌晨2点清理旧日志
    'cleanup-old-approval-logs': {
        'task': 'store_planning.tasks.cleanup_old_approval_logs_task',
        'schedule': {
            'hour': 2,
            'minute': 0,
        },
    },
    
    # 每周一上午9点生成审批统计报告
    'generate-approval-statistics-report': {
        'task': 'store_planning.tasks.generate_approval_statistics_report_task',
        'schedule': {
            'day_of_week': 1,  # 周一
            'hour': 9,
            'minute': 0,
        },
    },
}