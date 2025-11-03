"""
开店筹备模块 Celery 任务
"""
from celery import shared_task
from .services.reminder_service import MilestoneReminderService


@shared_task(name='store_preparation.check_milestone_reminders')
def check_milestone_reminders():
    """
    检查并发送里程碑提醒
    
    定时任务：每天早上 9:00 执行
    """
    service = MilestoneReminderService()
    result = service.check_and_send_reminders()
    
    return {
        'task': 'check_milestone_reminders',
        'status': 'completed',
        'result': result
    }


@shared_task(name='store_preparation.check_overdue_milestones')
def check_overdue_milestones():
    """
    检查并更新逾期的里程碑状态
    
    定时任务：每天凌晨 1:00 执行
    """
    service = MilestoneReminderService()
    updated_count = service.check_overdue_milestones()
    
    return {
        'task': 'check_overdue_milestones',
        'status': 'completed',
        'updated_count': updated_count
    }
