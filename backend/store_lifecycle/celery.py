"""
Celery 配置
用于异步任务和定时任务
"""
import os
from celery import Celery
from celery.schedules import crontab

# 设置 Django 设置模块
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')

# 创建 Celery 应用
app = Celery('store_lifecycle')

# 从 Django 设置中加载配置，使用 CELERY 命名空间
app.config_from_object('django.conf:settings', namespace='CELERY')

# 自动发现所有已注册应用中的任务
app.autodiscover_tasks()

# 配置定时任务
app.conf.beat_schedule = {
    # 每天凌晨2点清理过期审计日志
    'cleanup-expired-audit-logs': {
        'task': 'system_management.tasks.cleanup_expired_audit_logs',
        'schedule': crontab(hour=2, minute=0),  # 每天凌晨2点执行
    },
    # 每天早上9点检查里程碑提醒
    'check-milestone-reminders': {
        'task': 'store_preparation.check_milestone_reminders',
        'schedule': crontab(hour=9, minute=0),  # 每天早上9点执行
    },
    # 每天凌晨1点检查逾期里程碑
    'check-overdue-milestones': {
        'task': 'store_preparation.check_overdue_milestones',
        'schedule': crontab(hour=1, minute=0),  # 每天凌晨1点执行
    },
}

# 时区设置
app.conf.timezone = 'Asia/Shanghai'


@app.task(bind=True)
def debug_task(self):
    """调试任务"""
    print(f'Request: {self.request!r}')

