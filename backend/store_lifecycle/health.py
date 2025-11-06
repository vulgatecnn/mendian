"""
系统健康检查视图
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import redis
import time


def health_check(request):
    """
    系统健康检查端点
    """
    health_status = {
        'status': 'healthy',
        'timestamp': int(time.time()),
        'version': getattr(settings, 'VERSION', '1.0.0'),
        'checks': {}
    }
    
    # 数据库连接检查
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = {'status': 'healthy'}
    except Exception as e:
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health_status['status'] = 'unhealthy'
    
    # Redis 连接检查
    try:
        cache.set('health_check', 'ok', 10)
        cache.get('health_check')
        health_status['checks']['redis'] = {'status': 'healthy'}
    except Exception as e:
        health_status['checks']['redis'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health_status['status'] = 'unhealthy'
    
    # 磁盘空间检查
    try:
        import shutil
        total, used, free = shutil.disk_usage('/')
        free_percent = (free / total) * 100
        
        if free_percent < 10:
            health_status['checks']['disk'] = {
                'status': 'warning',
                'free_percent': round(free_percent, 2),
                'message': 'Low disk space'
            }
        else:
            health_status['checks']['disk'] = {
                'status': 'healthy',
                'free_percent': round(free_percent, 2)
            }
    except Exception as e:
        health_status['checks']['disk'] = {
            'status': 'unknown',
            'error': str(e)
        }
    
    # 内存使用检查
    try:
        import psutil
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        if memory_percent > 90:
            health_status['checks']['memory'] = {
                'status': 'warning',
                'usage_percent': memory_percent,
                'message': 'High memory usage'
            }
        else:
            health_status['checks']['memory'] = {
                'status': 'healthy',
                'usage_percent': memory_percent
            }
    except ImportError:
        health_status['checks']['memory'] = {
            'status': 'unknown',
            'message': 'psutil not installed'
        }
    except Exception as e:
        health_status['checks']['memory'] = {
            'status': 'unknown',
            'error': str(e)
        }
    
    # 返回适当的 HTTP 状态码
    status_code = 200 if health_status['status'] == 'healthy' else 503
    
    return JsonResponse(health_status, status=status_code)