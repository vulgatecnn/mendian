"""
数据分析模块异步任务
"""
import logging
import os
import tempfile
from datetime import datetime, timedelta
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings

from .services import DataAggregationService, ROICalculationService, ReportGenerationService
from .models import DataSyncLog, ReportTask

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def refresh_analytics_cache(self, cache_type=None):
    """
    刷新数据分析缓存的异步任务
    
    Args:
        cache_type: 缓存类型，None表示刷新全部
    """
    try:
        logger.info(f"开始刷新分析缓存: {cache_type or '全部'}")
        
        service = DataAggregationService()
        service.refresh_cache(cache_type)
        
        logger.info(f"分析缓存刷新完成: {cache_type or '全部'}")
        
        return {
            'status': 'success',
            'cache_type': cache_type or 'all',
            'refreshed_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"刷新分析缓存失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='cache_refresh',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            error_details={'cache_type': cache_type, 'error': str(exc)}
        )
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"缓存刷新失败，将在60秒后重试 (第{self.request.retries + 1}次)")
            raise self.retry(exc=exc, countdown=60)
        
        raise exc


@shared_task(bind=True, max_retries=3)
def update_dashboard_data(self):
    """
    更新经营大屏数据的定时任务
    """
    try:
        logger.info("开始更新经营大屏数据")
        
        service = DataAggregationService()
        
        # 更新各模块数据
        service.get_dashboard_data()
        service.get_store_map_data()
        service.get_follow_up_funnel_data()
        service.get_plan_progress_data()
        
        # 记录成功日志
        DataSyncLog.objects.create(
            sync_type='cache_refresh',
            status='success',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=4,
            records_success=4,
            error_details={'updated_modules': ['dashboard', 'store_map', 'funnel', 'plan_progress']}
        )
        
        logger.info("经营大屏数据更新完成")
        
        return {
            'status': 'success',
            'updated_at': timezone.now().isoformat(),
            'modules': ['dashboard', 'store_map', 'funnel', 'plan_progress']
        }
        
    except Exception as exc:
        logger.error(f"更新经营大屏数据失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='cache_refresh',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            error_details={'error': str(exc)}
        )
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"大屏数据更新失败，将在300秒后重试 (第{self.request.retries + 1}次)")
            raise self.retry(exc=exc, countdown=300)
        
        raise exc


@shared_task(bind=True, max_retries=3)
def calculate_store_roi_batch(self, store_ids=None, period_months=12):
    """
    批量计算门店投资回报率的异步任务
    
    Args:
        store_ids: 门店ID列表，None表示计算所有门店
        period_months: 计算周期（月）
    """
    try:
        logger.info(f"开始批量计算门店ROI，门店数量: {len(store_ids) if store_ids else '全部'}")
        
        roi_service = ROICalculationService()
        
        # 如果没有指定门店，获取所有运营中的门店
        if not store_ids:
            from store_archive.models import StoreProfile
            store_ids = list(StoreProfile.objects.filter(
                status='operating'
            ).values_list('id', flat=True))
        
        results = []
        failed_stores = []
        
        for store_id in store_ids:
            try:
                roi_result = roi_service.calculate_store_roi(store_id, period_months)
                results.append(roi_result)
                
            except Exception as e:
                logger.error(f"计算门店 {store_id} ROI失败: {e}")
                failed_stores.append({
                    'store_id': store_id,
                    'error': str(e)
                })
        
        # 记录计算结果
        DataSyncLog.objects.create(
            sync_type='cache_refresh',
            status='success' if not failed_stores else 'partial',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=len(store_ids),
            records_success=len(results),
            records_failed=len(failed_stores),
            error_details={
                'calculated_stores': len(results),
                'failed_stores': len(failed_stores),
                'period_months': period_months,
                'failures': failed_stores[:10]  # 只记录前10个失败案例
            }
        )
        
        logger.info(f"门店ROI批量计算完成，成功: {len(results)}, 失败: {len(failed_stores)}")
        
        return {
            'status': 'success',
            'calculated_count': len(results),
            'failed_count': len(failed_stores),
            'results': results[:100],  # 只返回前100个结果
            'calculated_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"批量计算门店ROI失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='cache_refresh',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            error_details={'store_ids': store_ids, 'period_months': period_months, 'error': str(exc)}
        )
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"ROI计算失败，将在600秒后重试 (第{self.request.retries + 1}次)")
            raise self.retry(exc=exc, countdown=600)
        
        raise exc


@shared_task
def cleanup_expired_cache():
    """
    清理过期缓存的定时任务
    """
    try:
        logger.info("开始清理过期缓存")
        
        from .models import AnalyticsCache
        
        # 删除过期的数据库缓存
        expired_count = AnalyticsCache.objects.filter(
            expires_at__lt=timezone.now()
        ).count()
        
        AnalyticsCache.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()
        
        logger.info(f"清理过期缓存完成，删除 {expired_count} 条记录")
        
        return {
            'status': 'success',
            'deleted_count': expired_count,
            'cleaned_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"清理过期缓存失败: {exc}")
        raise exc


@shared_task
def cleanup_old_sync_logs():
    """
    清理旧的同步日志的定时任务
    """
    try:
        logger.info("开始清理旧的同步日志")
        
        # 保留最近30天的日志
        cutoff_date = timezone.now() - timedelta(days=30)
        
        old_logs_count = DataSyncLog.objects.filter(
            created_at__lt=cutoff_date
        ).count()
        
        DataSyncLog.objects.filter(
            created_at__lt=cutoff_date
        ).delete()
        
        logger.info(f"清理旧同步日志完成，删除 {old_logs_count} 条记录")
        
        return {
            'status': 'success',
            'deleted_count': old_logs_count,
            'cleaned_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"清理旧同步日志失败: {exc}")
        raise exc


@shared_task(bind=True, max_retries=3)
def sync_external_sales_data(self, data_batch, batch_id=None, user_id=None):
    """
    同步外部销售数据的异步任务
    
    Args:
        data_batch: 销售数据批次
        batch_id: 批次ID
        user_id: 执行用户ID
    """
    start_time = timezone.now()
    
    try:
        logger.info(f"开始同步外部销售数据，数据量: {len(data_batch)}, 批次ID: {batch_id}")
        
        from .models import ExternalSalesData
        from .services import ExternalDataValidationService
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        user = User.objects.get(id=user_id) if user_id else None
        
        # 创建数据验证服务
        validation_service = ExternalDataValidationService()
        
        success_count = 0
        failed_count = 0
        failed_items = []
        processed_stores = set()
        
        for i, data_item in enumerate(data_batch):
            try:
                # 验证数据格式
                validation_result = validation_service.validate_sales_data(data_item)
                if not validation_result['is_valid']:
                    failed_count += 1
                    failed_items.append({
                        'index': i,
                        'store_id': data_item.get('store_id'),
                        'error': f"数据验证失败: {', '.join(validation_result['errors'])}"
                    })
                    continue
                
                validated_data = validation_result['data']
                
                # 匹配门店
                store_match_result = validation_service.match_store(
                    validated_data.get('store_id'),
                    validated_data.get('store_code')
                )
                
                if not store_match_result['found']:
                    failed_count += 1
                    failed_items.append({
                        'index': i,
                        'store_id': validated_data.get('store_id'),
                        'error': store_match_result['message']
                    })
                    continue
                
                store = store_match_result['store']
                processed_stores.add(store.id)
                
                # 创建或更新销售数据
                sales_data, created = ExternalSalesData.objects.update_or_create(
                    store=store,
                    data_date=validated_data['data_date'],
                    defaults={
                        'daily_revenue': validated_data['daily_revenue'],
                        'daily_orders': validated_data.get('daily_orders', 0),
                        'daily_customers': validated_data.get('daily_customers', 0),
                        'monthly_revenue': validated_data.get('monthly_revenue', 0),
                        'monthly_orders': validated_data.get('monthly_orders', 0),
                        'data_source': validated_data.get('data_source', 'external_api'),
                        'sync_status': 'success',
                        'sync_batch_id': batch_id or '',
                        'sync_message': '批量同步成功',
                    }
                )
                
                # 计算客单价和验证数据
                sales_data.calculate_average_order_value()
                sales_data.validate_data()
                sales_data.save()
                
                success_count += 1
                
            except Exception as e:
                failed_count += 1
                failed_items.append({
                    'index': i,
                    'store_id': data_item.get('store_id'),
                    'error': str(e)
                })
                logger.error(f"处理数据项 {i} 失败: {e}")
        
        end_time = timezone.now()
        
        # 记录同步结果
        DataSyncLog.objects.create(
            sync_type='sales_data',
            status='success' if failed_count == 0 else ('partial' if success_count > 0 else 'failed'),
            start_time=start_time,
            end_time=end_time,
            records_processed=len(data_batch),
            records_success=success_count,
            records_failed=failed_count,
            error_details={
                'batch_id': batch_id,
                'success_count': success_count,
                'failed_count': failed_count,
                'processed_stores': len(processed_stores),
                'failed_items': failed_items[:20],  # 只记录前20个失败案例
                'duration_seconds': (end_time - start_time).total_seconds()
            },
            created_by=user
        )
        
        logger.info(f"外部销售数据同步完成，成功: {success_count}, 失败: {failed_count}, 涉及门店: {len(processed_stores)}")
        
        return {
            'status': 'success',
            'batch_id': batch_id,
            'success_count': success_count,
            'failed_count': failed_count,
            'processed_stores': len(processed_stores),
            'duration_seconds': (end_time - start_time).total_seconds(),
            'synced_at': end_time.isoformat()
        }
        
    except Exception as exc:
        end_time = timezone.now()
        logger.error(f"同步外部销售数据失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='sales_data',
            status='failed',
            start_time=start_time,
            end_time=end_time,
            records_processed=len(data_batch) if data_batch else 0,
            records_failed=len(data_batch) if data_batch else 0,
            error_details={
                'batch_id': batch_id,
                'data_batch_size': len(data_batch) if data_batch else 0,
                'error': str(exc),
                'duration_seconds': (end_time - start_time).total_seconds()
            },
            created_by=User.objects.get(id=user_id) if user_id else None
        )
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"销售数据同步失败，将在300秒后重试 (第{self.request.retries + 1}次)")
            raise self.retry(exc=exc, countdown=300)
        
        raise exc


@shared_task(bind=True, max_retries=3)
def generate_report_task(self, task_id, report_type, filters, format_type, user_id):
    """
    生成报表的异步任务
    
    Args:
        task_id: 报表任务ID
        report_type: 报表类型 (plan, follow_up, preparation, assets)
        filters: 筛选条件
        format_type: 导出格式 (excel, pdf)
        user_id: 创建用户ID
    """
    try:
        logger.info(f"开始生成报表，任务ID: {task_id}, 类型: {report_type}")
        
        # 更新任务状态为处理中
        task = ReportTask.objects.get(task_id=task_id)
        task.status = 'processing'
        task.started_at = timezone.now()
        task.progress = 10
        task.save()
        
        # 创建报表生成服务实例
        report_service = ReportGenerationService()
        
        # 根据报表类型生成报表
        if report_type == 'plan':
            file_path = report_service.generate_plan_report(filters, format_type, task_id)
        elif report_type == 'follow_up':
            file_path = report_service.generate_follow_up_report(filters, format_type, task_id)
        elif report_type == 'preparation':
            file_path = report_service.generate_preparation_report(filters, format_type, task_id)
        elif report_type == 'assets':
            file_path = report_service.generate_assets_report(filters, format_type, task_id)
        else:
            raise ValueError(f"不支持的报表类型: {report_type}")
        
        # 获取文件大小
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        # 更新任务状态为完成
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.progress = 100
        task.file_path = file_path
        task.file_size = file_size
        task.save()
        
        # 记录成功日志
        DataSyncLog.objects.create(
            sync_type='report_generation',
            status='success',
            start_time=task.started_at,
            end_time=task.completed_at,
            records_processed=1,
            records_success=1,
            error_details={
                'task_id': str(task_id),
                'report_type': report_type,
                'file_size': file_size,
                'file_path': file_path
            }
        )
        
        logger.info(f"报表生成完成，任务ID: {task_id}, 文件路径: {file_path}")
        
        return {
            'status': 'success',
            'task_id': str(task_id),
            'file_path': file_path,
            'file_size': file_size,
            'completed_at': task.completed_at.isoformat()
        }
        
    except ReportTask.DoesNotExist:
        logger.error(f"报表任务不存在: {task_id}")
        raise
        
    except Exception as exc:
        logger.error(f"生成报表失败，任务ID: {task_id}, 错误: {exc}")
        
        # 更新任务状态为失败
        try:
            task = ReportTask.objects.get(task_id=task_id)
            task.status = 'failed'
            task.error_message = str(exc)
            task.completed_at = timezone.now()
            task.save()
            
            # 记录失败日志
            DataSyncLog.objects.create(
                sync_type='report_generation',
                status='failed',
                start_time=task.started_at or timezone.now(),
                end_time=timezone.now(),
                records_processed=1,
                records_failed=1,
                error_details={
                    'task_id': str(task_id),
                    'report_type': report_type,
                    'error': str(exc)
                }
            )
        except Exception as e:
            logger.error(f"更新任务状态失败: {e}")
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"报表生成失败，将在300秒后重试 (第{self.request.retries + 1}次)")
            raise self.retry(exc=exc, countdown=300)
        
        raise exc


@shared_task
def cleanup_old_report_files():
    """
    清理旧的报表文件的定时任务
    """
    try:
        logger.info("开始清理旧的报表文件")
        
        # 清理7天前的已完成报表文件
        cutoff_date = timezone.now() - timedelta(days=7)
        
        old_tasks = ReportTask.objects.filter(
            status='completed',
            completed_at__lt=cutoff_date,
            file_path__isnull=False
        )
        
        deleted_files = 0
        for task in old_tasks:
            if task.file_path and os.path.exists(task.file_path):
                try:
                    os.remove(task.file_path)
                    deleted_files += 1
                    logger.info(f"删除报表文件: {task.file_path}")
                except Exception as e:
                    logger.error(f"删除文件失败: {task.file_path}, 错误: {e}")
            
            # 清空文件路径
            task.file_path = ''
            task.save()
        
        logger.info(f"清理旧报表文件完成，删除 {deleted_files} 个文件")
        
        return {
            'status': 'success',
            'deleted_files': deleted_files,
            'cleaned_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"清理旧报表文件失败: {exc}")
        raise exc


@shared_task(bind=True, max_retries=3)
def generate_scheduled_reports(self, frequency='daily'):
    """
    生成定时报表的异步任务
    
    Args:
        frequency: 报表频率 (daily, weekly, monthly)
    """
    try:
        logger.info(f"开始生成定时报表，频率: {frequency}")
        
        from .models import ScheduledReport
        
        # 获取需要生成的定时报表
        scheduled_reports = ScheduledReport.objects.filter(
            is_active=True,
            frequency=frequency
        )
        
        generated_count = 0
        failed_count = 0
        
        for scheduled_report in scheduled_reports:
            try:
                # 检查是否需要生成（避免重复生成）
                if not _should_generate_report(scheduled_report):
                    continue
                
                # 创建报表任务
                task = ReportTask.objects.create(
                    report_type=scheduled_report.report_type,
                    filters=scheduled_report.filters,
                    format=scheduled_report.format,
                    created_by=scheduled_report.created_by
                )
                
                # 启动报表生成任务
                generate_report_task.delay(
                    str(task.task_id),
                    scheduled_report.report_type,
                    scheduled_report.filters,
                    scheduled_report.format,
                    scheduled_report.created_by.id
                )
                
                # 更新最后生成时间
                scheduled_report.last_generated = timezone.now()
                scheduled_report.save()
                
                generated_count += 1
                logger.info(f"定时报表生成任务已创建: {scheduled_report.name}")
                
                # 如果有收件人，发送邮件通知（可选实现）
                if scheduled_report.recipients:
                    _send_report_notification(scheduled_report, task)
                
            except Exception as e:
                failed_count += 1
                logger.error(f"生成定时报表失败: {scheduled_report.name}, 错误: {e}")
        
        # 记录生成结果
        DataSyncLog.objects.create(
            sync_type='scheduled_report',
            status='success' if failed_count == 0 else 'partial',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=len(scheduled_reports),
            records_success=generated_count,
            records_failed=failed_count,
            error_details={
                'frequency': frequency,
                'generated_count': generated_count,
                'failed_count': failed_count
            }
        )
        
        logger.info(f"定时报表生成完成，成功: {generated_count}, 失败: {failed_count}")
        
        return {
            'status': 'success',
            'frequency': frequency,
            'generated_count': generated_count,
            'failed_count': failed_count,
            'generated_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"生成定时报表失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='scheduled_report',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            error_details={'frequency': frequency, 'error': str(exc)}
        )
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"定时报表生成失败，将在600秒后重试 (第{self.request.retries + 1}次)")
            raise self.retry(exc=exc, countdown=600)
        
        raise exc


def _should_generate_report(scheduled_report):
    """
    检查是否需要生成报表
    
    Args:
        scheduled_report: 定时报表配置
        
    Returns:
        bool: 是否需要生成
    """
    if not scheduled_report.last_generated:
        return True
    
    now = timezone.now()
    last_generated = scheduled_report.last_generated
    
    if scheduled_report.frequency == 'daily':
        # 每日报表：如果上次生成不是今天，则需要生成
        return last_generated.date() < now.date()
    elif scheduled_report.frequency == 'weekly':
        # 每周报表：如果距离上次生成超过7天，则需要生成
        return (now - last_generated).days >= 7
    elif scheduled_report.frequency == 'monthly':
        # 每月报表：如果不是同一个月，则需要生成
        return (last_generated.year, last_generated.month) != (now.year, now.month)
    
    return False


def _send_report_notification(scheduled_report, task):
    """
    发送报表生成通知邮件
    
    Args:
        scheduled_report: 定时报表配置
        task: 报表任务
    """
    try:
        # 这里可以实现邮件发送逻辑
        # 由于邮件功能可能需要额外配置，这里只记录日志
        logger.info(f"报表生成通知: {scheduled_report.name}, 任务ID: {task.task_id}")
        logger.info(f"收件人: {', '.join(scheduled_report.recipients)}")
        
        # 实际实现时可以使用Django的邮件功能
        # from django.core.mail import send_mail
        # send_mail(
        #     subject=f'定时报表生成通知 - {scheduled_report.name}',
        #     message=f'您的定时报表 "{scheduled_report.name}" 正在生成中，任务ID: {task.task_id}',
        #     from_email=settings.DEFAULT_FROM_EMAIL,
        #     recipient_list=scheduled_report.recipients,
        #     fail_silently=False,
        # )
        
    except Exception as e:
        logger.error(f"发送报表通知失败: {e}")


# 定时任务配置
def setup_periodic_tasks():
    """
    设置定时任务
    """
    from django_celery_beat.models import PeriodicTask, IntervalSchedule
    
    # 每5分钟更新一次大屏数据
    schedule_5min, _ = IntervalSchedule.objects.get_or_create(
        every=5,
        period=IntervalSchedule.MINUTES,
    )
    
    PeriodicTask.objects.get_or_create(
        name='更新经营大屏数据',
        defaults={
            'task': 'data_analytics.tasks.update_dashboard_data',
            'interval': schedule_5min,
            'enabled': True,
        }
    )
    
    # 每小时清理一次过期缓存
    schedule_1hour, _ = IntervalSchedule.objects.get_or_create(
        every=1,
        period=IntervalSchedule.HOURS,
    )
    
    PeriodicTask.objects.get_or_create(
        name='清理过期缓存',
        defaults={
            'task': 'data_analytics.tasks.cleanup_expired_cache',
            'interval': schedule_1hour,
            'enabled': True,
        }
    )
    
    # 每天清理一次旧日志
    schedule_1day, _ = IntervalSchedule.objects.get_or_create(
        every=1,
        period=IntervalSchedule.DAYS,
    )
    
    PeriodicTask.objects.get_or_create(
        name='清理旧同步日志',
        defaults={
            'task': 'data_analytics.tasks.cleanup_old_sync_logs',
            'interval': schedule_1day,
            'enabled': True,
        }
    )
    
    # 每天计算一次门店ROI
    PeriodicTask.objects.get_or_create(
        name='批量计算门店ROI',
        defaults={
            'task': 'data_analytics.tasks.calculate_store_roi_batch',
            'interval': schedule_1day,
            'enabled': True,
        }
    )
    
    # 每天清理一次旧报表文件
    PeriodicTask.objects.get_or_create(
        name='清理旧报表文件',
        defaults={
            'task': 'data_analytics.tasks.cleanup_old_report_files',
            'interval': schedule_1day,
            'enabled': True,
        }
    )
@share
d_task(bind=True, max_retries=3)
def calculate_roi_for_external_data(self, store_ids=None, period_months=12):
    """
    为有外部销售数据的门店计算ROI的异步任务
    
    Args:
        store_ids: 门店ID列表，None表示计算所有有销售数据的门店
        period_months: 计算周期（月）
    """
    try:
        logger.info(f"开始为外部销售数据门店计算ROI，周期: {period_months}个月")
        
        from .models import ExternalSalesData
        from store_archive.models import StoreProfile
        
        roi_service = ROICalculationService()
        
        # 如果没有指定门店，获取所有有销售数据的门店
        if not store_ids:
            store_ids = list(ExternalSalesData.objects.values_list(
                'store_id', flat=True
            ).distinct())
        
        results = []
        failed_stores = []
        
        for store_id in store_ids:
            try:
                # 检查门店是否有足够的销售数据
                sales_data_count = ExternalSalesData.objects.filter(
                    store_id=store_id,
                    data_date__gte=timezone.now().date() - timedelta(days=period_months * 30)
                ).count()
                
                if sales_data_count < 30:  # 至少需要30天的数据
                    logger.warning(f"门店 {store_id} 销售数据不足，跳过ROI计算")
                    continue
                
                roi_result = roi_service.calculate_store_roi(store_id, period_months)
                results.append(roi_result)
                
                logger.info(f"门店 {store_id} ROI计算完成: {roi_result['roi']}%")
                
            except Exception as e:
                logger.error(f"计算门店 {store_id} ROI失败: {e}")
                failed_stores.append({
                    'store_id': store_id,
                    'error': str(e)
                })
        
        # 记录计算结果
        DataSyncLog.objects.create(
            sync_type='roi_calculation',
            status='success' if not failed_stores else 'partial',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=len(store_ids),
            records_success=len(results),
            records_failed=len(failed_stores),
            error_details={
                'calculated_stores': len(results),
                'failed_stores': len(failed_stores),
                'period_months': period_months,
                'avg_roi': sum(r['roi'] for r in results) / len(results) if results else 0,
                'failures': failed_stores[:10]  # 只记录前10个失败案例
            }
        )
        
        logger.info(f"外部数据门店ROI计算完成，成功: {len(results)}, 失败: {len(failed_stores)}")
        
        return {
            'status': 'success',
            'calculated_count': len(results),
            'failed_count': len(failed_stores),
            'avg_roi': sum(r['roi'] for r in results) / len(results) if results else 0,
            'results': results[:50],  # 只返回前50个结果
            'calculated_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"批量计算外部数据门店ROI失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='roi_calculation',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            error_details={
                'store_ids': store_ids[:10] if store_ids else [],
                'period_months': period_months,
                'error': str(exc)
            }
        )
        
        # 重试机制
        if self.request.retries < self.max_retries:
            logger.info(f"ROI计算失败，将在600秒后重试 (第{self.request.retries + 1}次)")
            raise self.retry(exc=exc, countdown=600)
        
        raise exc


@shared_task
def validate_external_sales_data():
    """
    验证外部销售数据质量的定时任务
    """
    try:
        logger.info("开始验证外部销售数据质量")
        
        from .models import ExternalSalesData
        
        # 获取最近7天的销售数据
        recent_date = timezone.now().date() - timedelta(days=7)
        recent_sales_data = ExternalSalesData.objects.filter(
            created_at__date__gte=recent_date,
            is_validated=False
        )
        
        validated_count = 0
        invalid_count = 0
        
        for sales_data in recent_sales_data:
            is_valid = sales_data.validate_data()
            sales_data.save()
            
            if is_valid:
                validated_count += 1
            else:
                invalid_count += 1
                logger.warning(f"销售数据验证失败: {sales_data.store.store_name} - {sales_data.data_date}, 错误: {sales_data.validation_errors}")
        
        # 记录验证结果
        DataSyncLog.objects.create(
            sync_type='data_validation',
            status='success',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=recent_sales_data.count(),
            records_success=validated_count,
            records_failed=invalid_count,
            error_details={
                'validated_count': validated_count,
                'invalid_count': invalid_count,
                'validation_date_range': f"{recent_date} to {timezone.now().date()}"
            }
        )
        
        logger.info(f"销售数据质量验证完成，有效: {validated_count}, 无效: {invalid_count}")
        
        return {
            'status': 'success',
            'validated_count': validated_count,
            'invalid_count': invalid_count,
            'validated_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"验证外部销售数据质量失败: {exc}")
        raise exc

@s
hared_task
def system_health_check():
    """
    系统健康检查定时任务
    """
    try:
        logger.info("开始执行系统健康检查")
        
        from .monitoring import SystemMonitoringService
        
        monitoring_service = SystemMonitoringService()
        health_status = monitoring_service.get_system_health_status()
        
        # 记录健康检查结果
        DataSyncLog.objects.create(
            sync_type='system_health_check',
            status='success' if health_status['overall_status'] != 'error' else 'failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=1,
            records_success=1 if health_status['overall_status'] != 'error' else 0,
            records_failed=0 if health_status['overall_status'] != 'error' else 1,
            error_details={
                'overall_status': health_status['overall_status'],
                'components_status': {k: v.get('status') for k, v in health_status.get('components', {}).items()},
                'alerts_count': len(health_status.get('alerts', [])),
                'critical_alerts': [alert for alert in health_status.get('alerts', []) if alert.get('level') == 'critical']
            }
        )
        
        # 发送严重告警通知
        critical_alerts = [alert for alert in health_status.get('alerts', []) if alert.get('level') == 'critical']
        for alert in critical_alerts:
            monitoring_service.send_alert_notification(alert)
        
        logger.info(f"系统健康检查完成，状态: {health_status['overall_status']}, 告警数: {len(health_status.get('alerts', []))}")
        
        return {
            'status': 'success',
            'overall_status': health_status['overall_status'],
            'alerts_count': len(health_status.get('alerts', [])),
            'critical_alerts_count': len(critical_alerts),
            'checked_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"系统健康检查失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='system_health_check',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=1,
            records_failed=1,
            error_details={'error': str(exc)}
        )
        
        raise exc


@shared_task
def performance_optimization():
    """
    性能优化定时任务
    """
    try:
        logger.info("开始执行性能优化")
        
        from .monitoring import PerformanceOptimizationService
        
        optimization_service = PerformanceOptimizationService()
        
        # 执行数据库查询优化
        db_optimization = optimization_service.optimize_database_queries()
        
        # 执行缓存策略优化
        cache_optimization = optimization_service.optimize_cache_strategy()
        
        # 执行数据预计算
        precomputation = optimization_service.implement_data_precomputation()
        
        # 汇总优化结果
        total_optimizations = (
            len(db_optimization.get('optimizations_applied', [])) +
            len(cache_optimization.get('optimizations_applied', [])) +
            len(precomputation.get('precomputed_metrics', []))
        )
        
        total_recommendations = (
            len(db_optimization.get('recommendations', [])) +
            len(cache_optimization.get('recommendations', [])) +
            len(precomputation.get('recommendations', []))
        )
        
        # 记录优化结果
        DataSyncLog.objects.create(
            sync_type='performance_optimization',
            status='success',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=total_optimizations + total_recommendations,
            records_success=total_optimizations,
            error_details={
                'database_optimization': db_optimization,
                'cache_optimization': cache_optimization,
                'precomputation': precomputation,
                'total_optimizations': total_optimizations,
                'total_recommendations': total_recommendations
            }
        )
        
        logger.info(f"性能优化完成，应用优化: {total_optimizations}项，建议: {total_recommendations}项")
        
        return {
            'status': 'success',
            'total_optimizations': total_optimizations,
            'total_recommendations': total_recommendations,
            'database_optimization': db_optimization,
            'cache_optimization': cache_optimization,
            'precomputation': precomputation,
            'optimized_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"性能优化失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='performance_optimization',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=0,
            records_failed=1,
            error_details={'error': str(exc)}
        )
        
        raise exc


@shared_task
def monitor_business_metrics():
    """
    监控业务指标定时任务
    """
    try:
        logger.info("开始监控业务指标")
        
        from .services import DataAggregationService
        from .alert_rules import alert_rules
        from store_archive.models import StoreProfile
        from store_expansion.models import FollowUpRecord
        from store_planning.models import StorePlan
        from store_preparation.models import ConstructionOrder
        from .models import ExternalSalesData
        from django.db import models
        
        aggregation_service = DataAggregationService()
        current_time = timezone.now()
        today = current_time.date()
        yesterday = today - timedelta(days=1)
        last_week = today - timedelta(days=7)
        last_month = today - timedelta(days=30)
        
        all_alerts = []
        
        # 1. 门店开业进度监控
        if alert_rules.should_check_rule('store_opening_progress'):
            try:
                # 计算开店计划完成率
                total_plans = StorePlan.objects.filter(
                    plan_year=current_time.year
                ).aggregate(
                    total_target=models.Sum('target_count')
                )['total_target'] or 0
                
                completed_stores = StoreProfile.objects.filter(
                    opening_date__year=current_time.year
                ).count()
                
                completion_rate = (completed_stores / total_plans * 100) if total_plans > 0 else 100
                
                metrics = {
                    'completion_rate': completion_rate,
                    'total_plans': total_plans,
                    'completed_stores': completed_stores
                }
                
                alerts = alert_rules.evaluate_rule('store_opening_progress', metrics)
                all_alerts.extend(alerts)
                
            except Exception as e:
                logger.error(f"门店开业进度监控失败: {e}")
        
        # 2. 跟进转化率监控
        if alert_rules.should_check_rule('follow_up_conversion'):
            try:
                # 计算最近30天的跟进转化率
                recent_follow_ups = FollowUpRecord.objects.filter(
                    created_at__date__gte=last_month
                )
                
                total_follow_ups = recent_follow_ups.count()
                signed_follow_ups = recent_follow_ups.filter(
                    status='signed'
                ).count()
                
                conversion_rate = (signed_follow_ups / total_follow_ups * 100) if total_follow_ups > 0 else 0
                
                # 检查是否有长时间无进展的跟进
                stagnant_follow_ups = FollowUpRecord.objects.filter(
                    status__in=['investigating', 'calculating'],
                    updated_at__lt=current_time - timedelta(days=7)
                )
                
                days_without_progress = 0
                if stagnant_follow_ups.exists():
                    oldest_stagnant = stagnant_follow_ups.order_by('updated_at').first()
                    days_without_progress = (current_time.date() - oldest_stagnant.updated_at.date()).days
                
                metrics = {
                    'conversion_rate': conversion_rate,
                    'total_follow_ups': total_follow_ups,
                    'signed_follow_ups': signed_follow_ups,
                    'days_without_progress': days_without_progress,
                    'stagnant_count': stagnant_follow_ups.count()
                }
                
                alerts = alert_rules.evaluate_rule('follow_up_conversion', metrics)
                all_alerts.extend(alerts)
                
            except Exception as e:
                logger.error(f"跟进转化率监控失败: {e}")
        
        # 3. 筹备进度监控
        if alert_rules.should_check_rule('preparation_progress'):
            try:
                # 检查延期的筹备项目
                overdue_projects = ConstructionOrder.objects.filter(
                    status__in=['planning', 'in_progress'],
                    expected_completion_date__lt=today
                ).count()
                
                severely_overdue_projects = ConstructionOrder.objects.filter(
                    status__in=['planning', 'in_progress'],
                    expected_completion_date__lt=today - timedelta(days=30)
                ).count()
                
                metrics = {
                    'overdue_projects': overdue_projects,
                    'severely_overdue_projects': severely_overdue_projects
                }
                
                alerts = alert_rules.evaluate_rule('preparation_progress', metrics)
                all_alerts.extend(alerts)
                
            except Exception as e:
                logger.error(f"筹备进度监控失败: {e}")
        
        # 4. 数据质量监控
        if alert_rules.should_check_rule('data_quality'):
            try:
                # 检查外部数据同步状态
                recent_sync_logs = DataSyncLog.objects.filter(
                    sync_type='external_sales_data',
                    start_time__gte=current_time - timedelta(hours=24)
                )
                
                total_syncs = recent_sync_logs.count()
                failed_syncs = recent_sync_logs.filter(status='failed').count()
                sync_failure_rate = (failed_syncs / total_syncs * 100) if total_syncs > 0 else 0
                
                # 检查数据缺失率
                operating_stores = StoreProfile.objects.filter(status='operating').count()
                yesterday_sales_data = ExternalSalesData.objects.filter(
                    data_date=yesterday
                ).count()
                
                missing_data_rate = ((operating_stores - yesterday_sales_data) / operating_stores * 100) if operating_stores > 0 else 0
                
                # 检查数据更新延迟
                latest_sales_data = ExternalSalesData.objects.order_by('-data_date').first()
                data_delay_hours = 0
                if latest_sales_data:
                    data_delay = current_time.date() - latest_sales_data.data_date
                    data_delay_hours = data_delay.days * 24
                
                metrics = {
                    'sync_failure_rate': sync_failure_rate,
                    'missing_data_rate': missing_data_rate,
                    'data_delay_hours': data_delay_hours,
                    'total_syncs': total_syncs,
                    'failed_syncs': failed_syncs
                }
                
                alerts = alert_rules.evaluate_rule('data_quality', metrics)
                all_alerts.extend(alerts)
                
            except Exception as e:
                logger.error(f"数据质量监控失败: {e}")
        
        # 5. 报表生成监控
        if alert_rules.should_check_rule('report_generation'):
            try:
                # 检查最近24小时的报表生成情况
                recent_reports = ReportTask.objects.filter(
                    created_at__gte=current_time - timedelta(hours=24)
                )
                
                total_reports = recent_reports.count()
                failed_reports = recent_reports.filter(status='failed').count()
                report_failure_rate = (failed_reports / total_reports * 100) if total_reports > 0 else 0
                
                # 计算平均生成时间
                completed_reports = recent_reports.filter(
                    status='completed',
                    completed_at__isnull=False
                )
                
                avg_generation_time = 0
                if completed_reports.exists():
                    total_time = sum([
                        (report.completed_at - report.created_at).total_seconds()
                        for report in completed_reports
                    ])
                    avg_generation_time = total_time / completed_reports.count()
                
                # 检查定时报表
                missed_scheduled_reports = 0  # 这里需要根据实际的定时报表逻辑来计算
                
                metrics = {
                    'report_failure_rate': report_failure_rate,
                    'avg_generation_time': avg_generation_time,
                    'missed_scheduled_reports': missed_scheduled_reports,
                    'total_reports': total_reports,
                    'failed_reports': failed_reports
                }
                
                alerts = alert_rules.evaluate_rule('report_generation', metrics)
                all_alerts.extend(alerts)
                
            except Exception as e:
                logger.error(f"报表生成监控失败: {e}")
        
        # 记录监控结果
        DataSyncLog.objects.create(
            sync_type='business_metrics_monitoring',
            status='success',
            start_time=current_time,
            end_time=current_time,
            records_processed=len(alert_rules.get_enabled_rules()),
            records_success=len(alert_rules.get_enabled_rules()),
            error_details={
                'checked_rules': list(alert_rules.get_enabled_rules().keys()),
                'alerts': all_alerts,
                'alerts_count': len(all_alerts),
                'critical_alerts_count': len([a for a in all_alerts if a.get('level') == 'critical']),
                'warning_alerts_count': len([a for a in all_alerts if a.get('level') == 'warning'])
            }
        )
        
        # 发送告警通知
        if all_alerts:
            from .monitoring import SystemMonitoringService
            monitoring_service = SystemMonitoringService()
            
            sent_count = 0
            for alert in all_alerts:
                # 只发送critical和warning级别的告警
                if alert.get('level') in ['critical', 'warning']:
                    success = monitoring_service.send_alert_notification(alert)
                    if success:
                        sent_count += 1
            
            logger.info(f"业务指标监控完成，生成告警: {len(all_alerts)}个，发送通知: {sent_count}个")
        else:
            logger.info("业务指标监控完成，无告警")
        
        return {
            'status': 'success',
            'checked_rules': list(alert_rules.get_enabled_rules().keys()),
            'alerts_count': len(all_alerts),
            'critical_alerts_count': len([a for a in all_alerts if a.get('level') == 'critical']),
            'warning_alerts_count': len([a for a in all_alerts if a.get('level') == 'warning']),
            'alerts': all_alerts[:10],  # 只返回前10个告警
            'monitored_at': current_time.isoformat()
        }
        
    except Exception as exc:
        logger.error(f"业务指标监控失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='business_metrics_monitoring',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=0,
            records_failed=1,
            error_details={'error': str(exc)}
        )
        
        raise exc


@shared_task
def system_health_check():
    """
    系统健康检查任务
    """
    try:
        logger.info("开始执行系统健康检查")
        
        from .monitoring import SystemMonitoringService
        
        monitoring_service = SystemMonitoringService()
        health_status = monitoring_service.get_system_health_status()
        
        # 检查是否有告警需要发送
        alerts = health_status.get('alerts', [])
        sent_alerts = []
        
        for alert in alerts:
            # 检查告警级别，只发送critical和warning级别的告警
            if alert.get('level') in ['critical', 'warning']:
                success = monitoring_service.send_alert_notification(alert)
                sent_alerts.append({
                    'alert': alert,
                    'sent': success
                })
        
        # 记录健康检查结果
        DataSyncLog.objects.create(
            sync_type='system_health_check',
            status='success',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=1,
            records_success=1,
            error_details={
                'overall_status': health_status.get('overall_status'),
                'components_status': {
                    name: status.get('status') 
                    for name, status in health_status.get('components', {}).items()
                },
                'alerts_count': len(alerts),
                'sent_alerts_count': len(sent_alerts),
                'alerts': alerts,
                'sent_alerts': sent_alerts
            }
        )
        
        logger.info(f"系统健康检查完成，状态: {health_status.get('overall_status')}, 告警: {len(alerts)}个")
        
        return {
            'status': 'success',
            'overall_status': health_status.get('overall_status'),
            'alerts_count': len(alerts),
            'sent_alerts_count': len(sent_alerts),
            'health_status': health_status,
            'checked_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"系统健康检查失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='system_health_check',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=0,
            records_failed=1,
            error_details={'error': str(exc)}
        )
        
        raise exc


@shared_task
def auto_scale_resources():
    """
    自动资源扩缩容任务（降级策略）
    """
    try:
        logger.info("开始执行自动资源扩缩容检查")
        
        from .monitoring import SystemMonitoringService
        
        monitoring_service = SystemMonitoringService()
        health_status = monitoring_service.get_system_health_status()
        
        scaling_actions = []
        
        # 检查系统负载
        system_status = health_status.get('components', {}).get('system', {})
        cpu_percent = system_status.get('cpu_percent', 0)
        memory_percent = system_status.get('memory_percent', 0)
        
        # 高负载时启用降级策略
        if cpu_percent > 90 or memory_percent > 90:
            # 减少缓存更新频率
            scaling_actions.append({
                'action': 'reduce_cache_frequency',
                'reason': f'高系统负载 - CPU: {cpu_percent}%, 内存: {memory_percent}%',
                'applied': True
            })
            
            # 暂停非关键的预计算任务
            scaling_actions.append({
                'action': 'pause_precomputation',
                'reason': '系统负载过高，暂停预计算任务',
                'applied': True
            })
            
            # 增加缓存过期时间以减少计算频率
            from .services import DataAggregationService
            aggregation_service = DataAggregationService()
            
            # 临时调整缓存超时时间
            original_timeout = aggregation_service.CACHE_TIMEOUT.copy()
            for cache_type in aggregation_service.CACHE_TIMEOUT:
                aggregation_service.CACHE_TIMEOUT[cache_type] *= 2  # 缓存时间翻倍
            
            scaling_actions.append({
                'action': 'extend_cache_timeout',
                'reason': '延长缓存时间以减少系统负载',
                'original_timeout': original_timeout,
                'new_timeout': aggregation_service.CACHE_TIMEOUT,
                'applied': True
            })
        
        # 低负载时恢复正常策略
        elif cpu_percent < 50 and memory_percent < 50:
            # 恢复正常的缓存更新频率
            scaling_actions.append({
                'action': 'restore_normal_frequency',
                'reason': f'系统负载正常 - CPU: {cpu_percent}%, 内存: {memory_percent}%',
                'applied': True
            })
            
            # 恢复预计算任务
            scaling_actions.append({
                'action': 'resume_precomputation',
                'reason': '系统负载正常，恢复预计算任务',
                'applied': True
            })
        
        # 检查数据库连接数
        db_status = health_status.get('components', {}).get('database', {})
        active_connections = db_status.get('active_connections', 0)
        
        if active_connections > 80:  # 假设最大连接数为100
            scaling_actions.append({
                'action': 'limit_concurrent_queries',
                'reason': f'数据库连接数过高: {active_connections}',
                'applied': True
            })
        
        # 记录扩缩容结果
        DataSyncLog.objects.create(
            sync_type='auto_scaling',
            status='success',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=len(scaling_actions),
            records_success=len([a for a in scaling_actions if a.get('applied')]),
            error_details={
                'system_status': {
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory_percent,
                    'active_connections': active_connections
                },
                'scaling_actions': scaling_actions,
                'overall_status': health_status.get('overall_status')
            }
        )
        
        logger.info(f"自动资源扩缩容完成，执行操作: {len(scaling_actions)}个")
        
        return {
            'status': 'success',
            'scaling_actions': scaling_actions,
            'system_load': {
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'active_connections': active_connections
            },
            'scaled_at': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"自动资源扩缩容失败: {exc}")
        
        # 记录失败日志
        DataSyncLog.objects.create(
            sync_type='auto_scaling',
            status='failed',
            start_time=timezone.now(),
            end_time=timezone.now(),
            records_processed=0,
            records_failed=1,
            error_details={'error': str(exc)}
        )
        
        raise exc


# 更新定时任务配置
def setup_monitoring_periodic_tasks():
    """
    设置监控相关的定时任务
    """
    from django_celery_beat.models import PeriodicTask, IntervalSchedule, CrontabSchedule
    
    # 每15分钟执行一次系统健康检查
    schedule_15min, _ = IntervalSchedule.objects.get_or_create(
        every=15,
        period=IntervalSchedule.MINUTES,
    )
    
    PeriodicTask.objects.get_or_create(
        name='系统健康检查',
        defaults={
            'task': 'data_analytics.tasks.system_health_check',
            'interval': schedule_15min,
            'enabled': True,
        }
    )
    
    # 每小时执行一次性能优化
    schedule_1hour, _ = IntervalSchedule.objects.get_or_create(
        every=1,
        period=IntervalSchedule.HOURS,
    )
    
    PeriodicTask.objects.get_or_create(
        name='性能优化',
        defaults={
            'task': 'data_analytics.tasks.performance_optimization',
            'interval': schedule_1hour,
            'enabled': True,
        }
    )
    
    # 每30分钟监控业务指标
    schedule_30min, _ = IntervalSchedule.objects.get_or_create(
        every=30,
        period=IntervalSchedule.MINUTES,
    )
    
    PeriodicTask.objects.get_or_create(
        name='业务指标监控',
        defaults={
            'task': 'data_analytics.tasks.monitor_business_metrics',
            'interval': schedule_30min,
            'enabled': True,
        }
    )
    
    # 每10分钟检查资源扩缩容
    schedule_10min, _ = IntervalSchedule.objects.get_or_create(
        every=10,
        period=IntervalSchedule.MINUTES,
    )
    
    PeriodicTask.objects.get_or_create(
        name='自动资源扩缩容',
        defaults={
            'task': 'data_analytics.tasks.auto_scale_resources',
            'interval': schedule_10min,
            'enabled': True,
        }
    )
    
    # 每天凌晨2点执行数据验证
    schedule_daily_2am, _ = CrontabSchedule.objects.get_or_create(
        minute=0,
        hour=2,
        day_of_week='*',
        day_of_month='*',
        month_of_year='*',
    )
    
    PeriodicTask.objects.get_or_create(
        name='验证外部销售数据质量',
        defaults={
            'task': 'data_analytics.tasks.validate_external_sales_data',
            'crontab': schedule_daily_2am,
            'enabled': True,
        }
    )