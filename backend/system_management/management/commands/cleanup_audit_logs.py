"""
清理过期审计日志的管理命令
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from system_management.models import AuditLog


class Command(BaseCommand):
    help = '清理过期的审计日志（默认保留365天）'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=365,
            help='保留最近N天的日志（默认365天）'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='仅显示将要删除的日志数量，不实际删除'
        )

    def handle(self, *args, **options):
        retention_days = options['days']
        dry_run = options['dry_run']
        
        # 计算截止日期
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        self.stdout.write(
            self.style.WARNING(
                f'查找 {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")} 之前的审计日志...'
            )
        )
        
        # 查询需要删除的日志
        expired_logs = AuditLog.objects.filter(created_at__lt=cutoff_date)
        count = expired_logs.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('没有需要清理的过期审计日志')
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f'找到 {count} 条过期审计日志')
        )
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'[模拟运行] 将删除 {count} 条日志（实际未删除）'
                )
            )
            return
        
        # 确认删除
        confirm = input(f'确认删除 {count} 条过期日志？(yes/no): ')
        if confirm.lower() != 'yes':
            self.stdout.write(
                self.style.WARNING('操作已取消')
            )
            return
        
        # 执行删除
        deleted_count, _ = expired_logs.delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'成功删除 {deleted_count} 条过期审计日志'
            )
        )

