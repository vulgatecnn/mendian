"""
刷新数据分析缓存的管理命令
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from data_analytics.services import DataAggregationService
from data_analytics.models import DataSyncLog


class Command(BaseCommand):
    help = '刷新数据分析缓存'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--cache-type',
            type=str,
            choices=['dashboard', 'store_map', 'funnel', 'plan_progress'],
            help='指定要刷新的缓存类型，不指定则刷新全部'
        )
        parser.add_argument(
            '--clear-only',
            action='store_true',
            help='仅清除缓存，不重新生成'
        )
    
    def handle(self, *args, **options):
        cache_type = options.get('cache_type')
        clear_only = options.get('clear_only', False)
        
        # 记录同步开始
        sync_log = DataSyncLog.objects.create(
            sync_type='cache_refresh',
            status='success',
            start_time=timezone.now(),
        )
        
        try:
            service = DataAggregationService()
            
            if clear_only:
                self.stdout.write(f'开始清除缓存: {cache_type or "全部"}')
                service.clear_cache(cache_type)
                self.stdout.write(
                    self.style.SUCCESS(f'缓存清除完成: {cache_type or "全部"}')
                )
            else:
                self.stdout.write(f'开始刷新缓存: {cache_type or "全部"}')
                service.refresh_cache(cache_type)
                self.stdout.write(
                    self.style.SUCCESS(f'缓存刷新完成: {cache_type or "全部"}')
                )
            
            # 更新同步日志
            sync_log.end_time = timezone.now()
            sync_log.records_processed = 1
            sync_log.records_success = 1
            sync_log.save()
            
        except Exception as e:
            # 记录错误
            sync_log.status = 'failed'
            sync_log.end_time = timezone.now()
            sync_log.records_failed = 1
            sync_log.error_details = {'error': str(e)}
            sync_log.save()
            
            self.stdout.write(
                self.style.ERROR(f'缓存操作失败: {e}')
            )
            raise CommandError(f'缓存操作失败: {e}')