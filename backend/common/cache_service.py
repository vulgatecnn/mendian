"""
Redis 缓存服务
提供统一的缓存接口和常用缓存方法
"""
from functools import wraps
from django.core.cache import cache
from django.conf import settings
import json
import hashlib


class CacheService:
    """缓存服务类"""
    
    # 缓存超时时间常量（秒）
    TIMEOUT_SHORT = 300  # 5分钟
    TIMEOUT_MEDIUM = 1800  # 30分钟
    TIMEOUT_LONG = 3600  # 1小时
    TIMEOUT_VERY_LONG = 86400  # 24小时
    
    @staticmethod
    def get(key):
        """获取缓存"""
        return cache.get(key)
    
    @staticmethod
    def set(key, value, timeout=TIMEOUT_MEDIUM):
        """设置缓存"""
        return cache.set(key, value, timeout=timeout)
    
    @staticmethod
    def delete(key):
        """删除缓存"""
        return cache.delete(key)
    
    @staticmethod
    def delete_pattern(pattern):
        """删除匹配模式的所有缓存键"""
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            keys = redis_conn.keys(f"{settings.CACHES['default']['KEY_PREFIX']}:{pattern}")
            if keys:
                redis_conn.delete(*keys)
                return len(keys)
        except Exception as e:
            print(f"删除缓存模式失败: {str(e)}")
        return 0
    
    @staticmethod
    def get_or_set(key, callback, timeout=TIMEOUT_MEDIUM):
        """
        获取缓存，如果不存在则执行回调函数并缓存结果
        
        Args:
            key: 缓存键
            callback: 回调函数
            timeout: 超时时间
            
        Returns:
            缓存值或回调函数返回值
        """
        value = cache.get(key)
        if value is None:
            value = callback()
            cache.set(key, value, timeout=timeout)
        return value
    
    @staticmethod
    def generate_key(*args, **kwargs):
        """
        生成缓存键
        
        Args:
            *args: 位置参数
            **kwargs: 关键字参数
            
        Returns:
            缓存键字符串
        """
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_str = ':'.join(key_parts)
        
        # 如果键太长，使用 MD5 哈希
        if len(key_str) > 200:
            key_str = hashlib.md5(key_str.encode()).hexdigest()
        
        return key_str


def cache_result(key_prefix, timeout=CacheService.TIMEOUT_MEDIUM, key_builder=None):
    """
    缓存函数结果的装饰器
    
    Args:
        key_prefix: 缓存键前缀
        timeout: 超时时间
        key_builder: 自定义键生成函数
        
    Example:
        @cache_result('user:profile', timeout=1800)
        def get_user_profile(user_id):
            return User.objects.get(id=user_id)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            if key_builder:
                cache_key = f"{key_prefix}:{key_builder(*args, **kwargs)}"
            else:
                cache_key = f"{key_prefix}:{CacheService.generate_key(*args, **kwargs)}"
            
            # 尝试从缓存获取
            result = CacheService.get(cache_key)
            
            if result is None:
                # 缓存未命中，执行函数
                result = func(*args, **kwargs)
                CacheService.set(cache_key, result, timeout=timeout)
            
            return result
        return wrapper
    return decorator


class BaseDataCache:
    """基础数据缓存"""
    
    @staticmethod
    @cache_result('base_data:regions', timeout=CacheService.TIMEOUT_LONG)
    def get_business_regions():
        """获取业务大区列表"""
        from base_data.models import BusinessRegion
        return list(BusinessRegion.objects.filter(is_active=True).values(
            'id', 'code', 'name', 'manager_id'
        ))
    
    @staticmethod
    @cache_result('base_data:suppliers', timeout=CacheService.TIMEOUT_LONG)
    def get_active_suppliers():
        """获取活跃供应商列表"""
        from base_data.models import Supplier
        return list(Supplier.objects.filter(cooperation_status='active').values(
            'id', 'code', 'name', 'supplier_type', 'contact_person', 'contact_phone'
        ))
    
    @staticmethod
    @cache_result('base_data:entities', timeout=CacheService.TIMEOUT_LONG)
    def get_active_legal_entities():
        """获取活跃法人主体列表"""
        from base_data.models import LegalEntity
        return list(LegalEntity.objects.filter(operation_status='operating').values(
            'id', 'code', 'name', 'unified_social_credit_code'
        ))
    
    @staticmethod
    @cache_result('base_data:customers', timeout=CacheService.TIMEOUT_LONG)
    def get_active_customers():
        """获取活跃客户列表"""
        from base_data.models import Customer
        return list(Customer.objects.filter(cooperation_status='active').values(
            'id', 'code', 'name', 'contact_person', 'contact_phone'
        ))
    
    @staticmethod
    def invalidate_all():
        """清除所有基础数据缓存"""
        CacheService.delete_pattern('base_data:*')


class UserCache:
    """用户相关缓存"""
    
    @staticmethod
    @cache_result('user:permissions', timeout=CacheService.TIMEOUT_MEDIUM)
    def get_user_permissions(user_id):
        """获取用户权限列表"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.prefetch_related('roles__permissions').get(id=user_id)
            permissions = set()
            for role in user.roles.all():
                for permission in role.permissions.all():
                    permissions.add(permission.permission_code)
            return list(permissions)
        except User.DoesNotExist:
            return []
    
    @staticmethod
    @cache_result('user:data_scope', timeout=CacheService.TIMEOUT_MEDIUM)
    def get_user_data_scope(user_id):
        """获取用户数据权限范围"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.prefetch_related('roles').get(id=user_id)
            scopes = user.roles.values_list('data_scope', flat=True)
            
            # 返回最大权限
            if 'all' in scopes:
                return 'all'
            elif 'dept_and_sub' in scopes:
                return 'dept_and_sub'
            elif 'dept' in scopes:
                return 'dept'
            else:
                return 'self'
        except User.DoesNotExist:
            return 'self'
    
    @staticmethod
    def invalidate_user_cache(user_id):
        """清除用户相关缓存"""
        CacheService.delete(f'user:permissions:{user_id}')
        CacheService.delete(f'user:data_scope:{user_id}')
        CacheService.delete(f'home:stats:{user_id}')


class ApprovalCache:
    """审批相关缓存"""
    
    @staticmethod
    @cache_result('approval:templates', timeout=CacheService.TIMEOUT_MEDIUM)
    def get_active_templates():
        """获取活跃的审批模板列表"""
        from approval.models import ApprovalTemplate
        return list(ApprovalTemplate.objects.filter(is_active=True).values(
            'id', 'code', 'name', 'description'
        ))
    
    @staticmethod
    @cache_result('approval:template', timeout=CacheService.TIMEOUT_MEDIUM)
    def get_template_by_code(template_code):
        """根据编码获取审批模板"""
        from approval.models import ApprovalTemplate
        try:
            template = ApprovalTemplate.objects.get(code=template_code, is_active=True)
            return {
                'id': template.id,
                'code': template.code,
                'name': template.name,
                'form_schema': template.form_schema,
                'flow_config': template.flow_config
            }
        except ApprovalTemplate.DoesNotExist:
            return None
    
    @staticmethod
    def invalidate_template_cache(template_code=None):
        """清除审批模板缓存"""
        CacheService.delete('approval:templates')
        if template_code:
            CacheService.delete(f'approval:template:{template_code}')


class StatisticsCache:
    """统计数据缓存"""
    
    @staticmethod
    @cache_result('home:stats', timeout=CacheService.TIMEOUT_SHORT)
    def get_home_statistics(user_id):
        """获取首页统计数据"""
        from approval.models import ApprovalInstance, ApprovalNode
        from store_expansion.models import FollowUpRecord
        from store_preparation.models import Milestone
        from notification.models import Message
        from django.utils import timezone
        from datetime import timedelta
        
        # 待审批数量
        pending_approvals = ApprovalNode.objects.filter(
            approvers__id=user_id,
            status='in_progress'
        ).count()
        
        # 合同提醒数量（未来30天内到期）
        today = timezone.now().date()
        contract_reminders = FollowUpRecord.objects.filter(
            status='signed',
            contract_reminders__isnull=False
        ).count()  # 简化统计，实际需要解析 JSON 字段
        
        # 工程里程碑提醒数量（未来7天内到期）
        milestone_reminders = Milestone.objects.filter(
            status='pending',
            planned_date__lte=today + timedelta(days=7),
            planned_date__gte=today
        ).count()
        
        # 未读消息数量
        unread_messages = Message.objects.filter(
            recipient_id=user_id,
            is_read=False
        ).count()
        
        return {
            'pending_approvals': pending_approvals,
            'contract_reminders': contract_reminders,
            'milestone_reminders': milestone_reminders,
            'unread_messages': unread_messages
        }
    
    @staticmethod
    def invalidate_home_stats(user_id):
        """清除首页统计缓存"""
        CacheService.delete(f'home:stats:{user_id}')


class QueryCache:
    """查询结果缓存"""
    
    @staticmethod
    def cache_list_query(cache_key, queryset, timeout=CacheService.TIMEOUT_SHORT):
        """
        缓存列表查询结果
        
        Args:
            cache_key: 缓存键
            queryset: Django QuerySet
            timeout: 超时时间
            
        Returns:
            查询结果列表
        """
        result = CacheService.get(cache_key)
        
        if result is None:
            result = list(queryset.values())
            CacheService.set(cache_key, result, timeout=timeout)
        
        return result
    
    @staticmethod
    def cache_count_query(cache_key, queryset, timeout=CacheService.TIMEOUT_SHORT):
        """
        缓存计数查询结果
        
        Args:
            cache_key: 缓存键
            queryset: Django QuerySet
            timeout: 超时时间
            
        Returns:
            计数结果
        """
        result = CacheService.get(cache_key)
        
        if result is None:
            result = queryset.count()
            CacheService.set(cache_key, result, timeout=timeout)
        
        return result


# 缓存失效信号处理
def setup_cache_invalidation():
    """设置缓存失效信号"""
    from django.db.models.signals import post_save, post_delete
    from django.dispatch import receiver
    
    # 基础数据变更时清除缓存
    @receiver([post_save, post_delete], sender='base_data.BusinessRegion')
    def invalidate_region_cache(sender, instance, **kwargs):
        BaseDataCache.invalidate_all()
    
    @receiver([post_save, post_delete], sender='base_data.Supplier')
    def invalidate_supplier_cache(sender, instance, **kwargs):
        BaseDataCache.invalidate_all()
    
    @receiver([post_save, post_delete], sender='base_data.LegalEntity')
    def invalidate_entity_cache(sender, instance, **kwargs):
        BaseDataCache.invalidate_all()
    
    @receiver([post_save, post_delete], sender='base_data.Customer')
    def invalidate_customer_cache(sender, instance, **kwargs):
        BaseDataCache.invalidate_all()
    
    # 用户信息变更时清除缓存
    @receiver(post_save, sender='system_management.User')
    def invalidate_user_cache(sender, instance, **kwargs):
        UserCache.invalidate_user_cache(instance.id)
    
    # 审批模板变更时清除缓存
    @receiver([post_save, post_delete], sender='approval.ApprovalTemplate')
    def invalidate_approval_template_cache(sender, instance, **kwargs):
        ApprovalCache.invalidate_template_cache(instance.code)
    
    # 消息变更时清除统计缓存
    @receiver([post_save, post_delete], sender='notification.Message')
    def invalidate_message_stats(sender, instance, **kwargs):
        StatisticsCache.invalidate_home_stats(instance.recipient_id)
