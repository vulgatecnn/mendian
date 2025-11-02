"""
权限控制模块
实现权限验证中间件和装饰器
"""
from django.core.cache import cache
from django.http import JsonResponse
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class PermissionMiddleware:
    """
    权限验证中间件
    在请求处理前加载用户权限信息
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # 如果用户已认证，加载权限信息
        if request.user.is_authenticated:
            self._load_user_permissions(request)
        
        response = self.get_response(request)
        return response
    
    def _load_user_permissions(self, request):
        """
        加载用户权限到请求对象
        使用缓存提高性能
        """
        user = request.user
        cache_key = f'user_permissions_{user.id}'
        
        # 尝试从缓存获取权限
        permissions = cache.get(cache_key)
        
        if permissions is None:
            # 缓存未命中，从数据库加载
            if user.is_superuser:
                # 超级管理员拥有所有权限
                permissions = ['*']
                logger.debug(f'加载超级管理员权限: 用户ID={user.id}')
            else:
                # 从用户角色获取权限集合
                permission_codes = user.get_permissions().values_list('code', flat=True)
                permissions = list(permission_codes)
                logger.debug(f'加载用户权限: 用户ID={user.id}, 权限数量={len(permissions)}')
            
            # 缓存权限信息（30分钟）
            cache.set(cache_key, permissions, 1800)
        
        # 将权限信息附加到请求对象
        request.user_permissions = set(permissions)


def permission_required(permission_code):
    """
    权限验证装饰器
    用于视图函数或类方法，验证用户是否具有指定权限
    
    使用示例:
        @permission_required('system.user.view')
        def user_list(request):
            ...
    
    参数:
        permission_code: 权限编码，如 'system.user.view'
    
    返回:
        如果用户有权限，执行原函数
        如果用户无权限，返回 403 错误
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # 检查用户是否已认证
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': '未认证', 'message': '请先登录'},
                    status=401
                )
            
            # 检查用户权限
            if not _check_permission(request.user, permission_code):
                logger.warning(
                    f'权限验证失败: 用户={request.user.username}, '
                    f'权限={permission_code}'
                )
                return JsonResponse(
                    {'error': '权限不足', 'message': f'您没有权限执行此操作'},
                    status=403
                )
            
            # 权限验证通过，执行原函数
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def _check_permission(user, permission_code):
    """
    检查用户是否具有指定权限
    
    参数:
        user: 用户对象
        permission_code: 权限编码
    
    返回:
        True: 用户具有权限
        False: 用户不具有权限
    """
    # 超级管理员拥有所有权限
    if user.is_superuser:
        return True
    
    # 检查用户是否具有该权限
    return user.has_permission(permission_code)
