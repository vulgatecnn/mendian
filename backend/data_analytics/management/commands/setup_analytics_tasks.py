"""
设置数据分析定时任务的管理命令
"""
from django.core.management.base import BaseCommand
from django_celery_beat.models import PeriodicTask, IntervalSchedule


class Command(BaseCommand):
    help = '设置数据分析模块的定时任务'

    def handle(self, *args, **options):
        """执行命令"""
        self.stdout.write('开始设置数据分析定时任务...')
        
        try:
            # 每5分钟更新一次大屏数据
            schedule_5min, created = IntervalSchedule.objects.get_or_create(
                every=5,
                period=IntervalSchedule.MINUTES,
            )
            if created:
                self.stdout.write(f'创建5分钟间隔调度: {schedule_5min}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='更新经营大屏数据',
                defaults={
                    'task': 'data_analytics.tasks.update_dashboard_data',
                    'interval': schedule_5min,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建大屏数据更新任务'))
            else:
                self.stdout.write('✓ 大屏数据更新任务已存在')
            
            # 每小时清理一次过期缓存
            schedule_1hour, created = IntervalSchedule.objects.get_or_create(
                every=1,
                period=IntervalSchedule.HOURS,
            )
            if created:
                self.stdout.write(f'创建1小时间隔调度: {schedule_1hour}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='清理过期缓存',
                defaults={
                    'task': 'data_analytics.tasks.cleanup_expired_cache',
                    'interval': schedule_1hour,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建缓存清理任务'))
            else:
                self.stdout.write('✓ 缓存清理任务已存在')
            
            # 每天清理一次旧日志
            schedule_1day, created = IntervalSchedule.objects.get_or_create(
                every=1,
                period=IntervalSchedule.DAYS,
            )
            if created:
                self.stdout.write(f'创建1天间隔调度: {schedule_1day}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='清理旧同步日志',
                defaults={
                    'task': 'data_analytics.tasks.cleanup_old_sync_logs',
                    'interval': schedule_1day,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建日志清理任务'))
            else:
                self.stdout.write('✓ 日志清理任务已存在')
            
            # 每天计算一次门店ROI
            task, created = PeriodicTask.objects.get_or_create(
                name='批量计算门店ROI',
                defaults={
                    'task': 'data_analytics.tasks.calculate_store_roi_batch',
                    'interval': schedule_1day,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建ROI计算任务'))
            else:
                self.stdout.write('✓ ROI计算任务已存在')
            
            # 每天清理一次旧报表文件
            task, created = PeriodicTask.objects.get_or_create(
                name='清理旧报表文件',
                defaults={
                    'task': 'data_analytics.tasks.cleanup_old_report_files',
                    'interval': schedule_1day,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建报表文件清理任务'))
            else:
                self.stdout.write('✓ 报表文件清理任务已存在')
            
            # 每天生成定时报表
            task, created = PeriodicTask.objects.get_or_create(
                name='生成每日定时报表',
                defaults={
                    'task': 'data_analytics.tasks.generate_scheduled_reports',
                    'interval': schedule_1day,
                    'enabled': True,
                    'kwargs': '{"frequency": "daily"}'
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建每日定时报表任务'))
            else:
                self.stdout.write('✓ 每日定时报表任务已存在')
            
            # 每周生成定时报表（周一执行）
            from django_celery_beat.models import CrontabSchedule
            weekly_schedule, created = CrontabSchedule.objects.get_or_create(
                minute=0,
                hour=8,
                day_of_week=1,  # 周一
                day_of_month='*',
                month_of_year='*',
            )
            if created:
                self.stdout.write(f'创建每周调度: {weekly_schedule}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='生成每周定时报表',
                defaults={
                    'task': 'data_analytics.tasks.generate_scheduled_reports',
                    'crontab': weekly_schedule,
                    'enabled': True,
                    'kwargs': '{"frequency": "weekly"}'
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建每周定时报表任务'))
            else:
                self.stdout.write('✓ 每周定时报表任务已存在')
            
            # 每月生成定时报表（每月1号执行）
            monthly_schedule, created = CrontabSchedule.objects.get_or_create(
                minute=0,
                hour=8,
                day_of_week='*',
                day_of_month=1,
                month_of_year='*',
            )
            if created:
                self.stdout.write(f'创建每月调度: {monthly_schedule}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='生成每月定时报表',
                defaults={
                    'task': 'data_analytics.tasks.generate_scheduled_reports',
                    'crontab': monthly_schedule,
                    'enabled': True,
                    'kwargs': '{"frequency": "monthly"}'
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建每月定时报表任务'))
            else:
                self.stdout.write('✓ 每月定时报表任务已存在')
            
            # 每15分钟执行一次系统健康检查
            schedule_15min, created = IntervalSchedule.objects.get_or_create(
                every=15,
                period=IntervalSchedule.MINUTES,
            )
            if created:
                self.stdout.write(f'创建15分钟间隔调度: {schedule_15min}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='系统健康检查',
                defaults={
                    'task': 'data_analytics.tasks.system_health_check',
                    'interval': schedule_15min,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建系统健康检查任务'))
            else:
                self.stdout.write('✓ 系统健康检查任务已存在')
            
            # 每30分钟监控业务指标
            schedule_30min, created = IntervalSchedule.objects.get_or_create(
                every=30,
                period=IntervalSchedule.MINUTES,
            )
            if created:
                self.stdout.write(f'创建30分钟间隔调度: {schedule_30min}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='业务指标监控',
                defaults={
                    'task': 'data_analytics.tasks.monitor_business_metrics',
                    'interval': schedule_30min,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建业务指标监控任务'))
            else:
                self.stdout.write('✓ 业务指标监控任务已存在')
            
            # 每10分钟检查资源扩缩容
            schedule_10min, created = IntervalSchedule.objects.get_or_create(
                every=10,
                period=IntervalSchedule.MINUTES,
            )
            if created:
                self.stdout.write(f'创建10分钟间隔调度: {schedule_10min}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='自动资源扩缩容',
                defaults={
                    'task': 'data_analytics.tasks.auto_scale_resources',
                    'interval': schedule_10min,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建自动资源扩缩容任务'))
            else:
                self.stdout.write('✓ 自动资源扩缩容任务已存在')
            
            # 每天凌晨2点执行数据验证
            validation_schedule, created = CrontabSchedule.objects.get_or_create(
                minute=0,
                hour=2,
                day_of_week='*',
                day_of_month='*',
                month_of_year='*',
            )
            if created:
                self.stdout.write(f'创建每日凌晨2点调度: {validation_schedule}')
            
            task, created = PeriodicTask.objects.get_or_create(
                name='验证外部销售数据质量',
                defaults={
                    'task': 'data_analytics.tasks.validate_external_sales_data',
                    'crontab': validation_schedule,
                    'enabled': True,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('✓ 创建数据质量验证任务'))
            else:
                self.stdout.write('✓ 数据质量验证任务已存在')
            
            self.stdout.write(self.style.SUCCESS('数据分析定时任务设置完成！'))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'设置定时任务失败: {e}')
            )
            raise