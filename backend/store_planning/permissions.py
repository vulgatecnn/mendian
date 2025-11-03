"""
开店计划管理权限验证装饰器和工具函数
"""
from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status
from system_management.permissions import permission_required
from system_management.services.audit_service import AuditLogger
import logging

logger = logging.getLogger(__name__)


def plan_permission_required(permission_code, check_plan_status=None, require_confirmation=False):
    """
    开店计划管理专用权限验证装饰器
    
    参数:
        permission_code: 权限编码
        check_plan_status: 需要检查的计划状态列表，如 ['draft', 'published']
        require_confirmation: 是否需要二次确认（用于敏感操作）
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # 基础权限验证
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': '未认证', 'message': '请先登录'},
                    status=401
                )
            
            # 检查权限
            if not request.user.has_permission(permission_code):
                logger.warning(
                    f'权限验证失败: 用户={request.user.username}, '
                    f'权限={permission_code}, IP={_get_client_ip(request)}'
                )
                
                # 记录权限验证失败的审计日志
                AuditLogger.log(
                    request=request,
                    action='permission_denied',
                    target_type='api_access',
                    target_id=0,
                    details={
                        'permission_code': permission_code,
                        'view_name': view_func.__name__,
                        'method': request.method,
                        'path': request.path
                    }
                )
                
                return JsonResponse(
                    {'error': '权限不足', 'message': f'您没有权限执行此操作'},
                    status=403
                )
            
            # 状态检查（如果指定了需要检查的状态）
            if check_plan_status and hasattr(request, 'resolver_match'):
                plan_id = kwargs.get('pk') or kwargs.get('plan_id')
                if plan_id:
                    try:
                        from .models import StorePlan
                        plan = StorePlan.objects.get(id=plan_id)
                        if plan.status not in check_plan_status:
                            allowed_statuses = ', '.join([
                                dict(StorePlan.STATUS_CHOICES).get(s, s) 
                                for s in check_plan_status
                            ])
                            return JsonResponse(
                                {
                                    'error': '状态不符合要求',
                                    'message': f'只有{allowed_statuses}状态的计划才能执行此操作',
                                    'current_status': plan.get_status_display()
                                },
                                status=400
                            )
                    except Exception as e:
                        logger.error(f'状态检查失败: {str(e)}')
            
            # 敏感操作二次确认
            if require_confirmation:
                # 支持多种确认方式
                confirmation = None
                if hasattr(request, 'data'):
                    confirmation = request.data.get('confirmation') or request.data.get('confirm')
                
                # 检查确认值是否有效
                if not confirmation or str(confirmation).lower() not in ['true', '1', 'yes', 'confirm']:
                    return JsonResponse(
                        {
                            'error': '需要确认',
                            'message': '此操作需要二次确认，请在请求中包含 confirmation=true 参数',
                            'require_confirmation': True,
                            'operation': view_func.__name__
                        },
                        status=400
                    )
                
                # 记录二次确认操作
                logger.info(
                    f'敏感操作二次确认: 用户={request.user.username}, '
                    f'操作={view_func.__name__}, IP={_get_client_ip(request)}'
                )
            
            # 权限验证通过，执行原函数
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def check_data_scope_permission(user, plan, permission_type='view'):
    """
    检查数据范围权限
    用于实现基于角色的数据访问控制
    
    参数:
        user: 用户对象
        plan: 计划对象
        permission_type: 权限类型 ('view', 'edit', 'delete')
    
    返回:
        True: 有权限访问
        False: 无权限访问
    """
    # 超级管理员和系统管理员有全部权限
    if user.is_superuser or user.has_permission('store_planning.system.config'):
        logger.debug(f'数据范围权限检查通过: 用户={user.username}, 原因=超级管理员/系统管理员')
        return True
    
    # 检查是否是计划创建者
    if plan.created_by == user:
        logger.debug(f'数据范围权限检查通过: 用户={user.username}, 原因=计划创建者')
        return True
    
    # 检查区域管理员权限（如果用户有管理特定区域的权限）
    if user.has_permission('store_planning.regional_manager'):
        # 检查用户是否管理该计划涉及的区域
        # 这里可以扩展为从用户配置中获取管理的区域列表
        # 目前简化处理：区域管理员可以查看所有计划，但只能编辑/删除自己负责区域的计划
        if permission_type == 'view':
            logger.debug(f'数据范围权限检查通过: 用户={user.username}, 原因=区域管理员查看权限')
            return True
        else:
            # 对于编辑和删除操作，需要检查是否管理该计划的区域
            # TODO: 实现区域管理员与区域的关联检查
            logger.debug(f'数据范围权限检查: 用户={user.username}, 区域管理员编辑/删除权限需要进一步验证')
            # 暂时允许区域管理员编辑和删除
            return True
    
    # 检查是否有全局权限
    permission_map = {
        'view': 'store_planning.plan.view_all',
        'edit': 'store_planning.plan.update_all',
        'delete': 'store_planning.plan.delete_all'
    }
    
    global_permission = permission_map.get(permission_type)
    if global_permission and user.has_permission(global_permission):
        logger.debug(f'数据范围权限检查通过: 用户={user.username}, 原因=全局{permission_type}权限')
        return True
    
    # 检查基础权限（只能操作自己的数据）
    basic_permission_map = {
        'view': 'store_planning.plan.view',
        'edit': 'store_planning.plan.update',
        'delete': 'store_planning.plan.delete'
    }
    
    basic_permission = basic_permission_map.get(permission_type)
    if basic_permission and user.has_permission(basic_permission):
        # 有基础权限但不是创建者，不允许访问
        logger.warning(
            f'数据范围权限检查失败: 用户={user.username}, '
            f'权限类型={permission_type}, 原因=非计划创建者'
        )
        return False
    
    # 没有任何相关权限
    logger.warning(
        f'数据范围权限检查失败: 用户={user.username}, '
        f'权限类型={permission_type}, 原因=无相关权限'
    )
    return False


def audit_sensitive_operation(operation_type, target_type='plan'):
    """
    敏感操作审计装饰器
    
    参数:
        operation_type: 操作类型
        target_type: 目标类型
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # 执行原函数
            response = view_func(request, *args, **kwargs)
            
            # 记录敏感操作审计日志
            target_id = kwargs.get('pk', 0)
            details = {
                'operation_type': operation_type,
                'view_name': view_func.__name__,
                'method': request.method,
                'path': request.path,
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'response_status': getattr(response, 'status_code', 200)
            }
            
            # 添加请求数据（敏感信息需要过滤）
            if hasattr(request, 'data') and request.data:
                filtered_data = _filter_sensitive_data(request.data)
                details['request_data'] = filtered_data
            
            AuditLogger.log(
                request=request,
                action=operation_type,
                target_type=target_type,
                target_id=target_id,
                details=details
            )
            
            return response
        
        return wrapper
    return decorator


def require_plan_ownership_or_permission(permission_code):
    """
    要求计划所有权或特定权限的装饰器
    
    参数:
        permission_code: 备用权限编码
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            plan_id = kwargs.get('pk')
            if not plan_id:
                return JsonResponse(
                    {'error': '参数错误', 'message': '缺少计划ID'},
                    status=400
                )
            
            try:
                from .models import StorePlan
                plan = StorePlan.objects.get(id=plan_id)
                
                # 检查是否是计划创建者或有特定权限
                if (plan.created_by == request.user or 
                    request.user.has_permission(permission_code) or
                    request.user.is_superuser):
                    return view_func(request, *args, **kwargs)
                else:
                    return JsonResponse(
                        {'error': '权限不足', 'message': '您只能操作自己创建的计划'},
                        status=403
                    )
                    
            except Exception as e:
                logger.error(f'权限检查失败: {str(e)}')
                return JsonResponse(
                    {'error': '系统错误', 'message': '权限检查失败'},
                    status=500
                )
        
        return wrapper
    return decorator


def _get_client_ip(request):
    """获取客户端IP地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def _filter_sensitive_data(data):
    """过滤敏感数据"""
    if not isinstance(data, dict):
        return data
    
    sensitive_keys = ['password', 'token', 'secret', 'key']
    filtered_data = {}
    
    for key, value in data.items():
        if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
            filtered_data[key] = '***'
        elif isinstance(value, dict):
            filtered_data[key] = _filter_sensitive_data(value)
        else:
            filtered_data[key] = value
    
    return filtered_data


def batch_permission_required(permission_code, max_batch_size=100):
    """
    批量操作权限验证装饰器
    
    参数:
        permission_code: 权限编码
        max_batch_size: 最大批量操作数量
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # 基础权限验证
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': '未认证', 'message': '请先登录'},
                    status=401
                )
            
            # 检查权限
            if not request.user.has_permission(permission_code):
                logger.warning(
                    f'批量操作权限验证失败: 用户={request.user.username}, '
                    f'权限={permission_code}'
                )
                return JsonResponse(
                    {'error': '权限不足', 'message': '您没有权限执行批量操作'},
                    status=403
                )
            
            # 检查批量操作数量限制
            if hasattr(request, 'data'):
                # 尝试从不同的字段获取批量操作的ID列表
                batch_ids = (
                    request.data.get('ids') or 
                    request.data.get('plan_ids') or 
                    request.data.get('approval_ids') or
                    []
                )
                
                if len(batch_ids) > max_batch_size:
                    return JsonResponse(
                        {
                            'error': '批量操作数量超限',
                            'message': f'单次批量操作最多支持{max_batch_size}条记录',
                            'current_count': len(batch_ids),
                            'max_count': max_batch_size
                        },
                        status=400
                    )
                
                # 记录批量操作
                logger.info(
                    f'批量操作: 用户={request.user.username}, '
                    f'操作={view_func.__name__}, 数量={len(batch_ids)}'
                )
            
            # 权限验证通过，执行原函数
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def rate_limit_permission(max_requests=100, time_window=3600):
    """
    API访问频率限制装饰器
    
    参数:
        max_requests: 时间窗口内最大请求次数
        time_window: 时间窗口（秒）
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return view_func(request, *args, **kwargs)
            
            # 超级管理员不受限制
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            # 使用缓存记录访问频率
            from django.core.cache import cache
            cache_key = f'rate_limit:{request.user.id}:{view_func.__name__}'
            
            # 获取当前访问次数
            current_count = cache.get(cache_key, 0)
            
            if current_count >= max_requests:
                logger.warning(
                    f'API访问频率超限: 用户={request.user.username}, '
                    f'接口={view_func.__name__}, 次数={current_count}'
                )
                return JsonResponse(
                    {
                        'error': '访问频率超限',
                        'message': f'您在{time_window}秒内最多可以访问{max_requests}次此接口',
                        'retry_after': time_window
                    },
                    status=429
                )
            
            # 增加访问次数
            cache.set(cache_key, current_count + 1, time_window)
            
            # 执行原函数
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


# 权限验证中间件类
class PlanPermissionMiddleware:
    """
    开店计划管理权限验证中间件
    在请求处理前进行权限预检查
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # 预处理权限检查
        self._preprocess_permissions(request)
        
        response = self.get_response(request)
        
        # 后处理审计日志
        self._postprocess_audit(request, response)
        
        return response
    
    def _preprocess_permissions(self, request):
        """预处理权限检查"""
        # 如果是开店计划管理相关的API请求
        if request.path.startswith('/api/store-planning/'):
            # 确保用户已认证
            if not request.user.is_authenticated:
                return
            
            # 预加载用户权限（利用缓存）
            request.user_plan_permissions = self._get_user_plan_permissions(request.user)
    
    def _postprocess_audit(self, request, response):
        """后处理审计日志"""
        # 记录API访问日志（可选）
        if (request.path.startswith('/api/store-planning/') and 
            request.user.is_authenticated and
            hasattr(response, 'status_code')):
            
            # 只记录重要的操作
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                logger.info(
                    f'API访问: 用户={request.user.username}, '
                    f'方法={request.method}, 路径={request.path}, '
                    f'状态={response.status_code}, IP={_get_client_ip(request)}'
                )
    
    def _get_user_plan_permissions(self, user):
        """获取用户的计划管理权限"""
        if user.is_superuser:
            return ['*']
        
        # 获取用户的所有权限编码
        all_permissions = user.get_permission_codes()
        
        # 筛选出计划管理相关权限
        plan_permissions = [
            perm for perm in all_permissions 
            if perm.startswith('store_planning.')
        ]
        
        return plan_permissions