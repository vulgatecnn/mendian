"""
数据分析系统监控模块
提供系统性能监控、告警和健康检查功能
"""
import logging
import time
import psutil
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from django.db import models, connection
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from django.core.mail import send_mail

from .models import DataSyncLog, AnalyticsCache, ReportTask

logger = logging.getLogger(__name__)


class SystemMonitoringService:
    """系统监控服务"""
    
    def __init__(self):
        self.logger = logging.getLogger(f'{__name__}.{self.__class__.__name__}')
        
        # 性能阈值配置
        self.thresholds = {
            'response_time': 3.0,      # 响应时间阈值（秒）
            'memory_usage': 80.0,      # 内存使用率阈值（%）
            'cpu_usage': 80.0,         # CPU使用率阈值（%）
            'disk_usage': 85.0,        # 磁盘使用率阈值（%）
            'cache_hit_rate': 70.0,    # 缓存命中率阈值（%）
            'error_rate': 5.0,         # 错误率阈值（%）
        }
    
    def get_system_health_status(self) -> Dict:
        """
        获取系统健康状态
        
        Returns:
            系统健康状态字典
        """
        try:
            health_status = {
                'overall_status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'components': {},
                'alerts': [],
                'metrics': {}
            }
            
            # 检查数据库连接
            db_status = self._check_database_health()
            health_status['components']['database'] = db_status
            
            # 检查缓存系统
            cache_status = self._check_cache_health()
            health_status['components']['cache'] = cache_status
            
            # 检查系统资源
            system_status = self._check_system_resources()
            health_status['components']['system'] = system_status
            
            # 检查数据更新任务
            task_status = self._check_data_update_tasks()
            health_status['components']['data_tasks'] = task_status
            
            # 检查报表生成
            report_status = self._check_report_generation()
            health_status['components']['reports'] = report_status
            
            # 收集性能指标
            health_status['metrics'] = self._collect_performance_metrics()
            
            # 检查告警条件
            alerts = self._check_alert_conditions(health_status)
            health_status['alerts'] = alerts
            
            # 确定整体状态
            health_status['overall_status'] = self._determine_overall_status(health_status)
            
            return health_status
            
        except Exception as e:
            self.logger.error(f"获取系统健康状态失败: {e}")
            return {
                'overall_status': 'error',
                'timestamp': timezone.now().isoformat(),
                'error': str(e),
                'components': {},
                'alerts': [],
                'metrics': {}
            }
    
    def _check_database_health(self) -> Dict:
        """检查数据库健康状态"""
        try:
            start_time = time.time()
            
            # 测试数据库连接
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            response_time = time.time() - start_time
            
            # 检查数据库连接数
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT count(*) 
                    FROM pg_stat_activity 
                    WHERE state = 'active'
                """)
                active_connections = cursor.fetchone()[0]
            
            # 检查数据库大小
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database()))
                """)
                db_size = cursor.fetchone()[0]
            
            status = 'healthy'
            if response_time > self.thresholds['response_time']:
                status = 'warning'
            if response_time > self.thresholds['response_time'] * 2:
                status = 'critical'
            
            return {
                'status': status,
                'response_time': round(response_time, 3),
                'active_connections': active_connections,
                'database_size': db_size,
                'last_check': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"数据库健康检查失败: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'last_check': timezone.now().isoformat()
            }
    
    def _check_cache_health(self) -> Dict:
        """检查缓存系统健康状态"""
        try:
            start_time = time.time()
            
            # 测试缓存连接
            test_key = f"health_check_{int(time.time())}"
            cache.set(test_key, 'test_value', 60)
            cached_value = cache.get(test_key)
            cache.delete(test_key)
            
            response_time = time.time() - start_time
            
            # 计算缓存命中率
            cache_stats = self._get_cache_statistics()
            
            status = 'healthy'
            if response_time > 0.1:  # 缓存响应时间超过100ms
                status = 'warning'
            if cached_value != 'test_value':
                status = 'error'
            if cache_stats['hit_rate'] < self.thresholds['cache_hit_rate']:
                status = 'warning'
            
            return {
                'status': status,
                'response_time': round(response_time, 3),
                'hit_rate': cache_stats['hit_rate'],
                'total_keys': cache_stats['total_keys'],
                'memory_usage': cache_stats['memory_usage'],
                'last_check': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"缓存健康检查失败: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'last_check': timezone.now().isoformat()
            }
    
    def _check_system_resources(self) -> Dict:
        """检查系统资源状态"""
        try:
            # CPU使用率
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # 内存使用率
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # 磁盘使用率
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            
            # 网络IO
            network = psutil.net_io_counters()
            
            # 确定状态
            status = 'healthy'
            if (cpu_percent > self.thresholds['cpu_usage'] or 
                memory_percent > self.thresholds['memory_usage'] or 
                disk_percent > self.thresholds['disk_usage']):
                status = 'warning'
            
            if (cpu_percent > 95 or memory_percent > 95 or disk_percent > 95):
                status = 'critical'
            
            return {
                'status': status,
                'cpu_percent': round(cpu_percent, 2),
                'memory_percent': round(memory_percent, 2),
                'memory_available_gb': round(memory.available / (1024**3), 2),
                'disk_percent': round(disk_percent, 2),
                'disk_free_gb': round(disk.free / (1024**3), 2),
                'network_bytes_sent': network.bytes_sent,
                'network_bytes_recv': network.bytes_recv,
                'last_check': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"系统资源检查失败: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'last_check': timezone.now().isoformat()
            }
    
    def _check_data_update_tasks(self) -> Dict:
        """检查数据更新任务状态"""
        try:
            # 检查最近1小时的数据同步日志
            recent_time = timezone.now() - timedelta(hours=1)
            recent_logs = DataSyncLog.objects.filter(
                sync_type='cache_refresh',
                start_time__gte=recent_time
            ).order_by('-start_time')
            
            # 统计成功和失败的任务
            total_tasks = recent_logs.count()
            failed_tasks = recent_logs.filter(status='failed').count()
            success_rate = ((total_tasks - failed_tasks) / total_tasks * 100) if total_tasks > 0 else 100
            
            # 检查最后一次成功的数据更新时间
            last_success = recent_logs.filter(status='success').first()
            last_success_time = last_success.start_time if last_success else None
            
            # 确定状态
            status = 'healthy'
            if success_rate < 90:
                status = 'warning'
            if success_rate < 70 or not last_success_time:
                status = 'critical'
            
            # 检查是否有长时间未更新的情况
            if last_success_time and (timezone.now() - last_success_time).total_seconds() > 3600:  # 超过1小时
                status = 'warning'
            
            return {
                'status': status,
                'total_tasks_1h': total_tasks,
                'failed_tasks_1h': failed_tasks,
                'success_rate': round(success_rate, 2),
                'last_success_time': last_success_time.isoformat() if last_success_time else None,
                'last_check': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"数据更新任务检查失败: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'last_check': timezone.now().isoformat()
            }
    
    def _check_report_generation(self) -> Dict:
        """检查报表生成状态"""
        try:
            # 检查最近24小时的报表任务
            recent_time = timezone.now() - timedelta(hours=24)
            recent_tasks = ReportTask.objects.filter(
                created_at__gte=recent_time
            )
            
            total_tasks = recent_tasks.count()
            completed_tasks = recent_tasks.filter(status='completed').count()
            failed_tasks = recent_tasks.filter(status='failed').count()
            processing_tasks = recent_tasks.filter(status='processing').count()
            
            success_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 100
            
            # 检查是否有长时间处理中的任务
            long_processing_tasks = recent_tasks.filter(
                status='processing',
                created_at__lt=timezone.now() - timedelta(hours=2)
            ).count()
            
            # 确定状态
            status = 'healthy'
            if success_rate < 90 or long_processing_tasks > 0:
                status = 'warning'
            if success_rate < 70 or long_processing_tasks > 3:
                status = 'critical'
            
            return {
                'status': status,
                'total_tasks_24h': total_tasks,
                'completed_tasks': completed_tasks,
                'failed_tasks': failed_tasks,
                'processing_tasks': processing_tasks,
                'long_processing_tasks': long_processing_tasks,
                'success_rate': round(success_rate, 2),
                'last_check': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"报表生成检查失败: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'last_check': timezone.now().isoformat()
            }
    
    def _collect_performance_metrics(self) -> Dict:
        """收集性能指标"""
        try:
            metrics = {}
            
            # 数据库查询性能
            metrics['database'] = self._get_database_metrics()
            
            # 缓存性能
            metrics['cache'] = self._get_cache_statistics()
            
            # API响应时间（从日志中分析）
            metrics['api'] = self._get_api_metrics()
            
            # 数据量统计
            metrics['data_volume'] = self._get_data_volume_metrics()
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"收集性能指标失败: {e}")
            return {}
    
    def _get_database_metrics(self) -> Dict:
        """获取数据库性能指标"""
        try:
            with connection.cursor() as cursor:
                # 查询统计信息
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        n_tup_ins + n_tup_upd + n_tup_del as total_operations,
                        seq_scan,
                        seq_tup_read,
                        idx_scan,
                        idx_tup_fetch
                    FROM pg_stat_user_tables 
                    WHERE schemaname = 'public'
                    ORDER BY total_operations DESC
                    LIMIT 10
                """)
                
                table_stats = []
                for row in cursor.fetchall():
                    table_stats.append({
                        'table': f"{row[0]}.{row[1]}",
                        'total_operations': row[2],
                        'seq_scan': row[3],
                        'seq_tup_read': row[4],
                        'idx_scan': row[5],
                        'idx_tup_fetch': row[6]
                    })
                
                # 慢查询统计（如果启用了pg_stat_statements）
                try:
                    cursor.execute("""
                        SELECT 
                            calls,
                            total_time,
                            mean_time,
                            query
                        FROM pg_stat_statements 
                        WHERE query LIKE '%analytics%' OR query LIKE '%report%'
                        ORDER BY mean_time DESC
                        LIMIT 5
                    """)
                    slow_queries = cursor.fetchall()
                except:
                    slow_queries = []
                
                return {
                    'table_stats': table_stats,
                    'slow_queries_count': len(slow_queries),
                    'collected_at': timezone.now().isoformat()
                }
                
        except Exception as e:
            self.logger.warning(f"获取数据库指标失败: {e}")
            return {}
    
    def _get_cache_statistics(self) -> Dict:
        """获取缓存统计信息"""
        try:
            # 统计分析缓存的使用情况
            analytics_caches = AnalyticsCache.objects.all()
            total_caches = analytics_caches.count()
            expired_caches = analytics_caches.filter(expires_at__lt=timezone.now()).count()
            
            # 按类型统计
            cache_by_type = {}
            for cache_type in ['dashboard', 'store_map', 'funnel', 'plan_progress']:
                count = analytics_caches.filter(cache_type=cache_type).count()
                cache_by_type[cache_type] = count
            
            # 计算命中率（简化计算）
            hit_rate = ((total_caches - expired_caches) / total_caches * 100) if total_caches > 0 else 100
            
            return {
                'total_keys': total_caches,
                'expired_keys': expired_caches,
                'hit_rate': round(hit_rate, 2),
                'cache_by_type': cache_by_type,
                'memory_usage': 'N/A',  # Redis内存使用需要额外配置
                'collected_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.warning(f"获取缓存统计失败: {e}")
            return {
                'total_keys': 0,
                'expired_keys': 0,
                'hit_rate': 0,
                'cache_by_type': {},
                'memory_usage': 'N/A',
                'collected_at': timezone.now().isoformat()
            }
    
    def _get_api_metrics(self) -> Dict:
        """获取API性能指标"""
        try:
            # 从数据同步日志中分析API性能
            recent_time = timezone.now() - timedelta(hours=1)
            recent_logs = DataSyncLog.objects.filter(
                start_time__gte=recent_time,
                end_time__isnull=False
            )
            
            if not recent_logs.exists():
                return {
                    'avg_response_time': 0,
                    'total_requests': 0,
                    'error_rate': 0,
                    'collected_at': timezone.now().isoformat()
                }
            
            # 计算平均响应时间
            total_duration = 0
            total_requests = recent_logs.count()
            failed_requests = recent_logs.filter(status='failed').count()
            
            for log in recent_logs:
                if log.end_time and log.start_time:
                    duration = (log.end_time - log.start_time).total_seconds()
                    total_duration += duration
            
            avg_response_time = total_duration / total_requests if total_requests > 0 else 0
            error_rate = (failed_requests / total_requests * 100) if total_requests > 0 else 0
            
            return {
                'avg_response_time': round(avg_response_time, 3),
                'total_requests': total_requests,
                'failed_requests': failed_requests,
                'error_rate': round(error_rate, 2),
                'collected_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.warning(f"获取API指标失败: {e}")
            return {
                'avg_response_time': 0,
                'total_requests': 0,
                'error_rate': 0,
                'collected_at': timezone.now().isoformat()
            }
    
    def _get_data_volume_metrics(self) -> Dict:
        """获取数据量指标"""
        try:
            from store_archive.models import StoreProfile
            from store_expansion.models import FollowUpRecord
            from store_preparation.models import ConstructionOrder
            from .models import ExternalSalesData
            
            # 统计各模块的数据量
            metrics = {
                'stores_total': StoreProfile.objects.count(),
                'stores_operating': StoreProfile.objects.filter(status='operating').count(),
                'follow_ups_active': FollowUpRecord.objects.filter(
                    status__in=['investigating', 'calculating', 'approving', 'signing']
                ).count(),
                'constructions_active': ConstructionOrder.objects.filter(
                    status__in=['planning', 'in_progress']
                ).count(),
                'sales_data_7days': ExternalSalesData.objects.filter(
                    created_at__gte=timezone.now() - timedelta(days=7)
                ).count(),
                'analytics_caches': AnalyticsCache.objects.count(),
                'report_tasks_24h': ReportTask.objects.filter(
                    created_at__gte=timezone.now() - timedelta(hours=24)
                ).count(),
                'collected_at': timezone.now().isoformat()
            }
            
            return metrics
            
        except Exception as e:
            self.logger.warning(f"获取数据量指标失败: {e}")
            return {}
    
    def _check_alert_conditions(self, health_status: Dict) -> List[Dict]:
        """检查告警条件"""
        alerts = []
        
        try:
            # 检查系统资源告警
            system_status = health_status.get('components', {}).get('system', {})
            if system_status.get('cpu_percent', 0) > self.thresholds['cpu_usage']:
                alerts.append({
                    'type': 'system_resource',
                    'level': 'warning',
                    'message': f"CPU使用率过高: {system_status.get('cpu_percent')}%",
                    'timestamp': timezone.now().isoformat()
                })
            
            if system_status.get('memory_percent', 0) > self.thresholds['memory_usage']:
                alerts.append({
                    'type': 'system_resource',
                    'level': 'warning',
                    'message': f"内存使用率过高: {system_status.get('memory_percent')}%",
                    'timestamp': timezone.now().isoformat()
                })
            
            # 检查数据库告警
            db_status = health_status.get('components', {}).get('database', {})
            if db_status.get('response_time', 0) > self.thresholds['response_time']:
                alerts.append({
                    'type': 'database_performance',
                    'level': 'warning',
                    'message': f"数据库响应时间过长: {db_status.get('response_time')}秒",
                    'timestamp': timezone.now().isoformat()
                })
            
            # 检查缓存告警
            cache_status = health_status.get('components', {}).get('cache', {})
            if cache_status.get('hit_rate', 100) < self.thresholds['cache_hit_rate']:
                alerts.append({
                    'type': 'cache_performance',
                    'level': 'warning',
                    'message': f"缓存命中率过低: {cache_status.get('hit_rate')}%",
                    'timestamp': timezone.now().isoformat()
                })
            
            # 检查数据任务告警
            task_status = health_status.get('components', {}).get('data_tasks', {})
            if task_status.get('success_rate', 100) < 90:
                alerts.append({
                    'type': 'data_task_failure',
                    'level': 'critical',
                    'message': f"数据更新任务成功率过低: {task_status.get('success_rate')}%",
                    'timestamp': timezone.now().isoformat()
                })
            
            # 检查报表生成告警
            report_status = health_status.get('components', {}).get('reports', {})
            if report_status.get('long_processing_tasks', 0) > 0:
                alerts.append({
                    'type': 'report_processing',
                    'level': 'warning',
                    'message': f"有{report_status.get('long_processing_tasks')}个报表任务处理时间过长",
                    'timestamp': timezone.now().isoformat()
                })
            
            return alerts
            
        except Exception as e:
            self.logger.error(f"检查告警条件失败: {e}")
            return []
    
    def _determine_overall_status(self, health_status: Dict) -> str:
        """确定整体健康状态"""
        try:
            components = health_status.get('components', {})
            alerts = health_status.get('alerts', [])
            
            # 检查是否有错误状态的组件
            for component_status in components.values():
                if component_status.get('status') == 'error':
                    return 'error'
            
            # 检查是否有严重告警
            for alert in alerts:
                if alert.get('level') == 'critical':
                    return 'critical'
            
            # 检查是否有警告状态的组件
            for component_status in components.values():
                if component_status.get('status') in ['warning', 'critical']:
                    return 'warning'
            
            # 检查是否有警告告警
            for alert in alerts:
                if alert.get('level') == 'warning':
                    return 'warning'
            
            return 'healthy'
            
        except Exception as e:
            self.logger.error(f"确定整体状态失败: {e}")
            return 'error'
    
    def send_alert_notification(self, alert: Dict) -> bool:
        """
        发送告警通知
        
        Args:
            alert: 告警信息
            
        Returns:
            是否发送成功
        """
        try:
            # 获取告警接收人配置
            alert_recipients = getattr(settings, 'ANALYTICS_ALERT_RECIPIENTS', [])
            if not alert_recipients:
                self.logger.warning("未配置告警接收人")
                return False
            
            # 构建邮件内容
            subject = f"数据分析系统告警 - {alert.get('type', '未知类型')}"
            message = f"""
数据分析系统告警通知

告警类型: {alert.get('type', '未知')}
告警级别: {alert.get('level', '未知')}
告警信息: {alert.get('message', '无详细信息')}
发生时间: {alert.get('timestamp', '未知')}

请及时处理相关问题。

系统自动发送，请勿回复。
            """
            
            # 发送邮件
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'system@example.com'),
                recipient_list=alert_recipients,
                fail_silently=False,
            )
            
            self.logger.info(f"告警通知发送成功: {alert.get('type')}")
            return True
            
        except Exception as e:
            self.logger.error(f"发送告警通知失败: {e}")
            return False


class PerformanceOptimizationService:
    """性能优化服务"""
    
    def __init__(self):
        self.logger = logging.getLogger(f'{__name__}.{self.__class__.__name__}')
    
    def optimize_database_queries(self) -> Dict:
        """优化数据库查询性能"""
        try:
            optimization_results = {
                'optimizations_applied': [],
                'recommendations': [],
                'performance_improvement': {}
            }
            
            # 分析慢查询
            slow_queries = self._analyze_slow_queries()
            if slow_queries:
                optimization_results['recommendations'].extend([
                    f"发现{len(slow_queries)}个慢查询，建议优化",
                    "考虑添加适当的数据库索引",
                    "优化复杂的JOIN查询"
                ])
            
            # 检查缺失的索引
            missing_indexes = self._check_missing_indexes()
            if missing_indexes:
                optimization_results['recommendations'].extend([
                    f"建议添加{len(missing_indexes)}个数据库索引以提升查询性能"
                ])
            
            # 清理过期数据
            cleanup_result = self._cleanup_expired_data()
            if cleanup_result['cleaned_records'] > 0:
                optimization_results['optimizations_applied'].append(
                    f"清理了{cleanup_result['cleaned_records']}条过期数据"
                )
            
            # 更新表统计信息
            self._update_table_statistics()
            optimization_results['optimizations_applied'].append("更新了数据库表统计信息")
            
            return optimization_results
            
        except Exception as e:
            self.logger.error(f"数据库查询优化失败: {e}")
            return {
                'error': str(e),
                'optimizations_applied': [],
                'recommendations': []
            }
    
    def optimize_cache_strategy(self) -> Dict:
        """优化缓存策略"""
        try:
            optimization_results = {
                'optimizations_applied': [],
                'cache_stats': {},
                'recommendations': []
            }
            
            # 清理过期缓存
            expired_count = self._cleanup_expired_cache()
            if expired_count > 0:
                optimization_results['optimizations_applied'].append(
                    f"清理了{expired_count}个过期缓存"
                )
            
            # 预热热点数据缓存
            prewarmed_count = self._prewarm_hot_data_cache()
            if prewarmed_count > 0:
                optimization_results['optimizations_applied'].append(
                    f"预热了{prewarmed_count}个热点数据缓存"
                )
            
            # 分析缓存使用情况
            cache_analysis = self._analyze_cache_usage()
            optimization_results['cache_stats'] = cache_analysis
            
            # 生成优化建议
            if cache_analysis.get('hit_rate', 100) < 70:
                optimization_results['recommendations'].append(
                    "缓存命中率较低，建议调整缓存策略或增加缓存时间"
                )
            
            if cache_analysis.get('memory_usage_percent', 0) > 80:
                optimization_results['recommendations'].append(
                    "缓存内存使用率较高，建议清理不常用的缓存或增加内存"
                )
            
            return optimization_results
            
        except Exception as e:
            self.logger.error(f"缓存策略优化失败: {e}")
            return {
                'error': str(e),
                'optimizations_applied': [],
                'recommendations': []
            }
    
    def implement_data_precomputation(self) -> Dict:
        """实现数据预计算"""
        try:
            precomputation_results = {
                'precomputed_metrics': [],
                'performance_improvement': {},
                'recommendations': []
            }
            
            # 预计算常用的统计指标
            from .services import DataAggregationService
            
            aggregation_service = DataAggregationService()
            
            # 预计算经营大屏数据
            start_time = time.time()
            dashboard_data = aggregation_service.get_dashboard_data()
            dashboard_time = time.time() - start_time
            
            precomputation_results['precomputed_metrics'].append({
                'metric': 'dashboard_data',
                'computation_time': round(dashboard_time, 3),
                'data_points': len(dashboard_data.get('store_map', {}).get('stores', []))
            })
            
            # 预计算地图数据
            start_time = time.time()
            map_data = aggregation_service.get_store_map_data()
            map_time = time.time() - start_time
            
            precomputation_results['precomputed_metrics'].append({
                'metric': 'store_map_data',
                'computation_time': round(map_time, 3),
                'data_points': len(map_data.get('stores', []))
            })
            
            # 预计算漏斗数据
            start_time = time.time()
            funnel_data = aggregation_service.get_follow_up_funnel_data()
            funnel_time = time.time() - start_time
            
            precomputation_results['precomputed_metrics'].append({
                'metric': 'follow_up_funnel_data',
                'computation_time': round(funnel_time, 3),
                'total_count': funnel_data.get('total_count', 0)
            })
            
            # 计算性能提升
            total_precomputation_time = dashboard_time + map_time + funnel_time
            precomputation_results['performance_improvement'] = {
                'total_precomputation_time': round(total_precomputation_time, 3),
                'estimated_response_improvement': '60-80%',
                'cache_duration': '5-10分钟'
            }
            
            # 生成建议
            if total_precomputation_time > 10:
                precomputation_results['recommendations'].append(
                    "预计算时间较长，建议优化数据查询或增加更多缓存层级"
                )
            
            precomputation_results['recommendations'].extend([
                "建议在业务低峰期执行预计算任务",
                "考虑实现增量更新机制以减少计算量",
                "监控预计算任务的执行状态和性能"
            ])
            
            return precomputation_results
            
        except Exception as e:
            self.logger.error(f"数据预计算失败: {e}")
            return {
                'error': str(e),
                'precomputed_metrics': [],
                'recommendations': []
            }
    
    def _analyze_slow_queries(self) -> List[Dict]:
        """分析慢查询"""
        try:
            with connection.cursor() as cursor:
                # 尝试从pg_stat_statements获取慢查询信息
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
                    )
                """)
                
                has_pg_stat_statements = cursor.fetchone()[0]
                
                if not has_pg_stat_statements:
                    return []
                
                cursor.execute("""
                    SELECT 
                        query,
                        calls,
                        total_time,
                        mean_time,
                        rows
                    FROM pg_stat_statements 
                    WHERE mean_time > 1000  -- 超过1秒的查询
                    ORDER BY mean_time DESC
                    LIMIT 10
                """)
                
                slow_queries = []
                for row in cursor.fetchall():
                    slow_queries.append({
                        'query': row[0][:200] + '...' if len(row[0]) > 200 else row[0],
                        'calls': row[1],
                        'total_time': row[2],
                        'mean_time': row[3],
                        'rows': row[4]
                    })
                
                return slow_queries
                
        except Exception as e:
            self.logger.warning(f"分析慢查询失败: {e}")
            return []
    
    def _check_missing_indexes(self) -> List[str]:
        """检查缺失的索引"""
        try:
            # 这里实现一个简化的索引检查逻辑
            # 实际项目中可以使用更复杂的分析工具
            
            missing_indexes = []
            
            # 检查常用查询字段是否有索引
            common_query_fields = [
                ('analytics_cache', 'cache_type'),
                ('analytics_cache', 'expires_at'),
                ('external_sales_data', 'data_date'),
                ('external_sales_data', 'sync_status'),
                ('report_tasks', 'status'),
                ('report_tasks', 'created_at'),
                ('data_sync_logs', 'sync_type'),
                ('data_sync_logs', 'start_time'),
            ]
            
            with connection.cursor() as cursor:
                for table, field in common_query_fields:
                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM pg_indexes 
                        WHERE tablename = %s 
                        AND indexdef LIKE %s
                    """, [table, f'%{field}%'])
                    
                    index_count = cursor.fetchone()[0]
                    if index_count == 0:
                        missing_indexes.append(f"{table}.{field}")
            
            return missing_indexes
            
        except Exception as e:
            self.logger.warning(f"检查缺失索引失败: {e}")
            return []
    
    def _cleanup_expired_data(self) -> Dict:
        """清理过期数据"""
        try:
            cleaned_records = 0
            
            # 清理过期的分析缓存
            expired_caches = AnalyticsCache.objects.filter(
                expires_at__lt=timezone.now()
            )
            cache_count = expired_caches.count()
            expired_caches.delete()
            cleaned_records += cache_count
            
            # 清理旧的同步日志（保留30天）
            old_logs = DataSyncLog.objects.filter(
                start_time__lt=timezone.now() - timedelta(days=30)
            )
            log_count = old_logs.count()
            old_logs.delete()
            cleaned_records += log_count
            
            # 清理已完成的旧报表任务（保留7天）
            old_tasks = ReportTask.objects.filter(
                status='completed',
                completed_at__lt=timezone.now() - timedelta(days=7)
            )
            task_count = old_tasks.count()
            old_tasks.delete()
            cleaned_records += task_count
            
            return {
                'cleaned_records': cleaned_records,
                'cache_cleaned': cache_count,
                'logs_cleaned': log_count,
                'tasks_cleaned': task_count
            }
            
        except Exception as e:
            self.logger.error(f"清理过期数据失败: {e}")
            return {'cleaned_records': 0}
    
    def _update_table_statistics(self) -> None:
        """更新数据库表统计信息"""
        try:
            with connection.cursor() as cursor:
                # 更新分析相关表的统计信息
                tables = [
                    'analytics_cache',
                    'external_sales_data',
                    'report_tasks',
                    'data_sync_logs'
                ]
                
                for table in tables:
                    cursor.execute(f"ANALYZE {table}")
                
                self.logger.info("数据库表统计信息更新完成")
                
        except Exception as e:
            self.logger.error(f"更新表统计信息失败: {e}")
    
    def _cleanup_expired_cache(self) -> int:
        """清理过期缓存"""
        try:
            # 清理数据库中的过期缓存
            expired_count = AnalyticsCache.objects.filter(
                expires_at__lt=timezone.now()
            ).count()
            
            AnalyticsCache.objects.filter(
                expires_at__lt=timezone.now()
            ).delete()
            
            return expired_count
            
        except Exception as e:
            self.logger.error(f"清理过期缓存失败: {e}")
            return 0
    
    def _prewarm_hot_data_cache(self) -> int:
        """预热热点数据缓存"""
        try:
            from .services import DataAggregationService
            
            aggregation_service = DataAggregationService()
            prewarmed_count = 0
            
            # 预热经营大屏数据
            try:
                aggregation_service.get_dashboard_data()
                prewarmed_count += 1
            except Exception as e:
                self.logger.warning(f"预热大屏数据失败: {e}")
            
            # 预热地图数据
            try:
                aggregation_service.get_store_map_data()
                prewarmed_count += 1
            except Exception as e:
                self.logger.warning(f"预热地图数据失败: {e}")
            
            # 预热漏斗数据
            try:
                aggregation_service.get_follow_up_funnel_data()
                prewarmed_count += 1
            except Exception as e:
                self.logger.warning(f"预热漏斗数据失败: {e}")
            
            # 预热计划进度数据
            try:
                aggregation_service.get_plan_progress_data()
                prewarmed_count += 1
            except Exception as e:
                self.logger.warning(f"预热计划进度数据失败: {e}")
            
            return prewarmed_count
            
        except Exception as e:
            self.logger.error(f"预热热点数据缓存失败: {e}")
            return 0
    
    def _analyze_cache_usage(self) -> Dict:
        """分析缓存使用情况"""
        try:
            total_caches = AnalyticsCache.objects.count()
            expired_caches = AnalyticsCache.objects.filter(
                expires_at__lt=timezone.now()
            ).count()
            
            hit_rate = ((total_caches - expired_caches) / total_caches * 100) if total_caches > 0 else 100
            
            # 按类型统计缓存使用情况
            cache_by_type = {}
            for cache_type in ['dashboard', 'store_map', 'funnel', 'plan_progress']:
                count = AnalyticsCache.objects.filter(cache_type=cache_type).count()
                expired_count = AnalyticsCache.objects.filter(
                    cache_type=cache_type,
                    expires_at__lt=timezone.now()
                ).count()
                
                cache_by_type[cache_type] = {
                    'total': count,
                    'expired': expired_count,
                    'hit_rate': ((count - expired_count) / count * 100) if count > 0 else 100
                }
            
            return {
                'total_caches': total_caches,
                'expired_caches': expired_caches,
                'hit_rate': round(hit_rate, 2),
                'cache_by_type': cache_by_type,
                'memory_usage_percent': 0,  # 需要Redis配置支持
                'analyzed_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"分析缓存使用情况失败: {e}")
            return {
                'total_caches': 0,
                'expired_caches': 0,
                'hit_rate': 0,
                'cache_by_type': {},
                'memory_usage_percent': 0,
                'analyzed_at': timezone.now().isoformat()
            }