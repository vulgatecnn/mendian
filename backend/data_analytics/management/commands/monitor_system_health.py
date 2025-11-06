"""
系统健康监控管理命令
"""
import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from data_analytics.monitoring import SystemMonitoringService


class Command(BaseCommand):
    help = '监控系统健康状态'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--output-format',
            type=str,
            choices=['json', 'table'],
            default='table',
            help='输出格式：json 或 table'
        )
        parser.add_argument(
            '--send-alerts',
            action='store_true',
            help='发送告警通知'
        )
        parser.add_argument(
            '--component',
            type=str,
            choices=['database', 'cache', 'system', 'data_tasks', 'reports'],
            help='检查特定组件的健康状态'
        )
    
    def handle(self, *args, **options):
        output_format = options.get('output_format', 'table')
        send_alerts = options.get('send_alerts', False)
        component = options.get('component')
        
        self.stdout.write('开始系统健康检查...')
        
        try:
            monitoring_service = SystemMonitoringService()
            health_status = monitoring_service.get_system_health_status()
            
            if component:
                # 只显示特定组件的状态
                component_status = health_status.get('components', {}).get(component, {})
                if not component_status:
                    self.stdout.write(
                        self.style.ERROR(f'未找到组件: {component}')
                    )
                    return
                
                self._display_component_status(component, component_status, output_format)
            else:
                # 显示完整的健康状态
                self._display_health_status(health_status, output_format)
            
            # 发送告警通知
            if send_alerts and health_status.get('alerts'):
                self.stdout.write('\n发送告警通知...')
                for alert in health_status['alerts']:
                    success = monitoring_service.send_alert_notification(alert)
                    if success:
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ 告警通知已发送: {alert["type"]}')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'✗ 告警通知发送失败: {alert["type"]}')
                        )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'系统健康检查失败: {e}')
            )
            raise
    
    def _display_health_status(self, health_status, output_format):
        """显示完整的健康状态"""
        if output_format == 'json':
            self.stdout.write(json.dumps(health_status, indent=2, ensure_ascii=False))
            return
        
        # 表格格式显示
        overall_status = health_status.get('overall_status', 'unknown')
        status_color = self._get_status_color(overall_status)
        
        self.stdout.write(f'\n系统整体状态: {status_color(overall_status.upper())}')
        self.stdout.write(f'检查时间: {health_status.get("timestamp", "未知")}')
        
        # 显示组件状态
        self.stdout.write('\n组件状态:')
        self.stdout.write('-' * 60)
        components = health_status.get('components', {})
        for component_name, component_status in components.items():
            status = component_status.get('status', 'unknown')
            status_color = self._get_status_color(status)
            self.stdout.write(f'{component_name:15} {status_color(status.upper())}')
            
            # 显示关键指标
            if component_name == 'database':
                response_time = component_status.get('response_time', 0)
                connections = component_status.get('active_connections', 0)
                self.stdout.write(f'                响应时间: {response_time}s, 活跃连接: {connections}')
            
            elif component_name == 'cache':
                hit_rate = component_status.get('hit_rate', 0)
                total_keys = component_status.get('total_keys', 0)
                self.stdout.write(f'                命中率: {hit_rate}%, 缓存键数: {total_keys}')
            
            elif component_name == 'system':
                cpu = component_status.get('cpu_percent', 0)
                memory = component_status.get('memory_percent', 0)
                disk = component_status.get('disk_percent', 0)
                self.stdout.write(f'                CPU: {cpu}%, 内存: {memory}%, 磁盘: {disk}%')
            
            elif component_name == 'data_tasks':
                success_rate = component_status.get('success_rate', 0)
                total_tasks = component_status.get('total_tasks_1h', 0)
                self.stdout.write(f'                成功率: {success_rate}%, 1小时任务数: {total_tasks}')
            
            elif component_name == 'reports':
                success_rate = component_status.get('success_rate', 0)
                processing_tasks = component_status.get('processing_tasks', 0)
                self.stdout.write(f'                成功率: {success_rate}%, 处理中: {processing_tasks}')
        
        # 显示告警信息
        alerts = health_status.get('alerts', [])
        if alerts:
            self.stdout.write('\n告警信息:')
            self.stdout.write('-' * 60)
            for alert in alerts:
                level = alert.get('level', 'unknown')
                level_color = self._get_alert_level_color(level)
                self.stdout.write(f'{level_color(level.upper())}: {alert.get("message", "无详细信息")}')
        else:
            self.stdout.write(f'\n{self.style.SUCCESS("✓ 无告警信息")}')
        
        # 显示性能指标
        metrics = health_status.get('metrics', {})
        if metrics:
            self.stdout.write('\n性能指标:')
            self.stdout.write('-' * 60)
            
            # 数据库指标
            db_metrics = metrics.get('database', {})
            if db_metrics:
                self.stdout.write('数据库:')
                table_stats = db_metrics.get('table_stats', [])[:3]  # 显示前3个表
                for stat in table_stats:
                    self.stdout.write(f'  {stat["table"]}: {stat["total_operations"]} 操作')
            
            # API指标
            api_metrics = metrics.get('api', {})
            if api_metrics:
                self.stdout.write('API:')
                self.stdout.write(f'  平均响应时间: {api_metrics.get("avg_response_time", 0)}s')
                self.stdout.write(f'  错误率: {api_metrics.get("error_rate", 0)}%')
            
            # 数据量指标
            data_metrics = metrics.get('data_volume', {})
            if data_metrics:
                self.stdout.write('数据量:')
                self.stdout.write(f'  门店总数: {data_metrics.get("stores_total", 0)}')
                self.stdout.write(f'  运营门店: {data_metrics.get("stores_operating", 0)}')
                self.stdout.write(f'  活跃跟进: {data_metrics.get("follow_ups_active", 0)}')
    
    def _display_component_status(self, component_name, component_status, output_format):
        """显示特定组件的状态"""
        if output_format == 'json':
            self.stdout.write(json.dumps({component_name: component_status}, indent=2, ensure_ascii=False))
            return
        
        status = component_status.get('status', 'unknown')
        status_color = self._get_status_color(status)
        
        self.stdout.write(f'\n组件: {component_name}')
        self.stdout.write(f'状态: {status_color(status.upper())}')
        self.stdout.write(f'检查时间: {component_status.get("last_check", "未知")}')
        
        # 显示详细信息
        for key, value in component_status.items():
            if key not in ['status', 'last_check']:
                self.stdout.write(f'{key}: {value}')
    
    def _get_status_color(self, status):
        """获取状态对应的颜色样式"""
        color_map = {
            'healthy': self.style.SUCCESS,
            'warning': self.style.WARNING,
            'critical': self.style.ERROR,
            'error': self.style.ERROR,
        }
        return color_map.get(status, self.style.NOTICE)
    
    def _get_alert_level_color(self, level):
        """获取告警级别对应的颜色样式"""
        color_map = {
            'info': self.style.NOTICE,
            'warning': self.style.WARNING,
            'critical': self.style.ERROR,
        }
        return color_map.get(level, self.style.NOTICE)