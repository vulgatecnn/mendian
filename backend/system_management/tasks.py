"""
系统管理模块的 Celery 任务
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def cleanup_expired_audit_logs():
    """
    清理过期的审计日志
    保留最近365天的日志，删除更早的日志
    
    此任务应该通过 Celery Beat 定时执行（建议每天凌晨执行）
    
    返回:
        dict: 包含删除数量的字典
    """
    from .models import AuditLog
    
    # 计算365天前的日期
    retention_days = 365
    cutoff_date = timezone.now() - timedelta(days=retention_days)
    
    logger.info(f"开始清理 {cutoff_date} 之前的审计日志")
    
    try:
        # 查询需要删除的日志
        expired_logs = AuditLog.objects.filter(created_at__lt=cutoff_date)
        count = expired_logs.count()
        
        if count > 0:
            # 删除过期日志
            expired_logs.delete()
            logger.info(f"成功删除 {count} 条过期审计日志")
        else:
            logger.info("没有需要清理的过期审计日志")
        
        return {
            'success': True,
            'deleted_count': count,
            'cutoff_date': cutoff_date.isoformat(),
            'message': f'成功删除 {count} 条过期审计日志'
        }
    
    except Exception as e:
        logger.error(f"清理审计日志时发生错误: {str(e)}", exc_info=True)
        return {
            'success': False,
            'deleted_count': 0,
            'error': str(e),
            'message': f'清理审计日志失败: {str(e)}'
        }


@shared_task
def cleanup_audit_logs_by_count(max_records=1000000):
    """
    按记录数量清理审计日志
    如果日志总数超过指定数量，删除最旧的日志
    
    参数:
        max_records: 最大保留记录数，默认100万条
    
    返回:
        dict: 包含删除数量的字典
    """
    from .models import AuditLog
    
    logger.info(f"开始检查审计日志数量（最大保留 {max_records} 条）")
    
    try:
        # 获取当前日志总数
        total_count = AuditLog.objects.count()
        
        if total_count <= max_records:
            logger.info(f"当前日志数量 {total_count} 未超过限制，无需清理")
            return {
                'success': True,
                'deleted_count': 0,
                'total_count': total_count,
                'message': f'当前日志数量 {total_count} 未超过限制'
            }
        
        # 计算需要删除的数量
        delete_count = total_count - max_records
        
        # 获取最旧的日志ID列表
        oldest_log_ids = AuditLog.objects.order_by('created_at').values_list('id', flat=True)[:delete_count]
        
        # 删除最旧的日志
        deleted_count, _ = AuditLog.objects.filter(id__in=list(oldest_log_ids)).delete()
        
        logger.info(f"成功删除 {deleted_count} 条最旧的审计日志")
        
        return {
            'success': True,
            'deleted_count': deleted_count,
            'total_count': total_count,
            'remaining_count': total_count - deleted_count,
            'message': f'成功删除 {deleted_count} 条最旧的审计日志'
        }
    
    except Exception as e:
        logger.error(f"按数量清理审计日志时发生错误: {str(e)}", exc_info=True)
        return {
            'success': False,
            'deleted_count': 0,
            'error': str(e),
            'message': f'清理审计日志失败: {str(e)}'
        }

