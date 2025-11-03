"""
开店计划管理 - 缓存服务
实现计划统计数据的Redis缓存、基础数据缓存和缓存失效更新机制
"""

from django.core.cache import cache
from django.conf import settings
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from typing import Dict, List, Optional, Any, Callable
import json
import hashlib
from datetime import timedelta
from .models import StorePlan, RegionalPlan, BusinessRegion, StoreType, PlanExecutionLog


class CacheKeyGenerator:
    """缓存键生成器"""
    
    PREFIX = 'store_planning'
    
    @classmethod
    def plan_detail(cls, plan_id: int) -> str:
        """计划详情缓存键"""
        return f"{cls.PREFIX}:plan:detail:{plan_id}"
    
    @classmethod
    def plan_list(cls, filters: Dict = None) -> str:
        """计划列表缓存键"""
        if filters:
            # 将过滤条件转换为稳定的字符串
            filter_str = json.dumps(filters, sort_keys=True)
            filter_hash = hashlib.md5(filter_str.encode()).hexdigest()
            return f"{cls.PREFIX}:plan:list:{filter_hash}"
        return f"{cls.PREFIX}:plan:list:all"
    
    @classmethod
    def plan_statistics(cls, plan_id: int) -> str:
        """计划统计数据缓存键"""
        return f"{cls.PREFIX}:plan:statistics:{plan_id}"
    
    @classmethod
    def dashboard_data(cls, user_id: Optional[int] = None) -> str:
        """仪表板数据缓存键"""
        if user_id:
            return f"{cls.PREFIX}:dashboard:user:{user_id}"
        return f"{cls.PREFIX}:dashboard:global"
    
    @classmethod
    def dashboard_widgets(cls, widget_type: str, time_range: int, user_id: Optional[int] = None) -> str:
        """仪表板小部件缓存键"""
        user_suffix = f":user:{user_id}" if user_id else ":global"
        return f"{cls.PREFIX}:dashboard:widgets:{widget_type}:{time_range}{user_suffix}"
    
    @classmethod
    def regional_statistics(cls) -> str:
        """区域统计缓存键"""
        return f"{cls.PREFIX}:statistics:regional"
    
    @classmethod
    def store_type_statistics(cls) -> str:
        """门店类型统计缓存键"""
        return f"{cls.PREFIX}:statistics:store_type"
    
    @classmethod
    def business_regions(cls, active_only: bool = True) -> str:
        """经营区域列表缓存键"""
        suffix = "active" if active_only else "all"
        return f"{cls.PREFIX}:base_data:regions:{suffix}"
    
    @classmethod
    def store_types(cls, active_only: bool = True) -> str:
        """门店类型列表缓存键"""
        suffix = "active" if active_only else "all"
        return f"{cls.PREFIX}:base_data:store_types:{suffix}"
    
    @classmethod
    def plan_progress(cls, plan_id: int) -> str:
        """计划进度缓存键"""
        return f"{cls.PREFIX}:plan:progress:{plan_id}"
    
    @classmethod
    def monthly_statistics(cls, year: int, month: int) -> str:
        """月度统计缓存键"""
        return f"{cls.PREFIX}:statistics:monthly:{year}:{month}"
    
    @classmethod
    def performance_ranking(cls, ranking_type: str, time_period: str) -> str:
        """绩效排名缓存键"""
        return f"{cls.PREFIX}:ranking:{ranking_type}:{time_period}"


class CacheService:
    """缓存服务 - 统一的缓存操作接口"""
    
    # 缓存超时时间（秒）
    TIMEOUT_SHORT = 300      # 5分钟 - 用于频繁变化的数据
    TIMEOUT_MEDIUM = 1800    # 30分钟 - 用于一般统计数据
    TIMEOUT_LONG = 3600      # 1小时 - 用于基础数据
    TIMEOUT_VERY_LONG = 86400  # 24小时 - 用于很少变化的数据
    
    @classmethod
    def get(cls, key: str, default=None) -> Any:
        """获取缓存数据"""
        try:
            return cache.get(key, default)
        except Exception as e:
            import logging
            logging.error(f"Cache get error for key {key}: {str(e)}")
            return default
    
    @classmethod
    def set(cls, key: str, value: Any, timeout: int = TIMEOUT_MEDIUM) -> bool:
        """设置缓存数据"""
        try:
            cache.set(key, value, timeout)
            return True
        except Exception as e:
            import logging
            logging.error(f"Cache set error for key {key}: {str(e)}")
            return False
    
    @classmethod
    def delete(cls, key: str) -> bool:
        """删除缓存数据"""
        try:
            cache.delete(key)
            return True
        except Exception as e:
            import logging
            logging.error(f"Cache delete error for key {key}: {str(e)}")
            return False
    
    @classmethod
    def delete_pattern(cls, pattern: str) -> bool:
        """删除匹配模式的所有缓存键"""
        try:
            # 注意：这个功能需要Redis支持，如果使用其他缓存后端可能不支持
            from django.core.cache import caches
            cache_backend = caches['default']
            
            if hasattr(cache_backend, 'delete_pattern'):
                cache_backend.delete_pattern(pattern)
                return True
            else:
                # 如果不支持模式删除，记录警告
                import logging
                logging.warning(f"Cache backend does not support pattern deletion: {pattern}")
                return False
        except Exception as e:
            import logging
            logging.error(f"Cache delete pattern error for pattern {pattern}: {str(e)}")
            return False
    
    @classmethod
    def get_or_set(cls, key: str, callback: Callable, timeout: int = TIMEOUT_MEDIUM) -> Any:
        """获取缓存数据，如果不存在则通过回调函数生成并缓存"""
        value = cls.get(key)
        if value is None:
            value = callback()
            if value is not None:
                cls.set(key, value, timeout)
        return value
    
    @classmethod
    def invalidate_plan_caches(cls, plan_id: int) -> None:
        """使计划相关的所有缓存失效"""
        # 删除计划详情缓存
        cls.delete(CacheKeyGenerator.plan_detail(plan_id))
        
        # 删除计划统计缓存
        cls.delete(CacheKeyGenerator.plan_statistics(plan_id))
        
        # 删除计划进度缓存
        cls.delete(CacheKeyGenerator.plan_progress(plan_id))
        
        # 删除计划列表缓存（使用模式匹配）
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:plan:list:*")
        
        # 删除仪表板缓存
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:dashboard:*")
        
        # 删除统计缓存
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:statistics:*")
        
        # 删除排名缓存
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:ranking:*")
    
    @classmethod
    def invalidate_regional_caches(cls) -> None:
        """使区域相关的所有缓存失效"""
        # 删除区域统计缓存
        cls.delete(CacheKeyGenerator.regional_statistics())
        
        # 删除仪表板缓存
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:dashboard:*")
        
        # 删除计划列表缓存
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:plan:list:*")
    
    @classmethod
    def invalidate_base_data_caches(cls) -> None:
        """使基础数据缓存失效"""
        # 删除经营区域缓存
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:base_data:regions:*")
        
        # 删除门店类型缓存
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:base_data:store_types:*")
    
    @classmethod
    def refresh_all_caches(cls) -> None:
        """刷新所有缓存（清空所有缓存）"""
        cls.delete_pattern(f"{CacheKeyGenerator.PREFIX}:*")


class PlanCacheManager:
    """计划缓存管理器 - 处理计划相关的缓存逻辑"""
    
    @staticmethod
    def get_plan_detail(plan_id: int, fetch_callback: Callable) -> Dict:
        """获取计划详情（带缓存）"""
        cache_key = CacheKeyGenerator.plan_detail(plan_id)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_MEDIUM
        )
    
    @staticmethod
    def get_plan_statistics(plan_id: int, fetch_callback: Callable) -> Dict:
        """获取计划统计数据（带缓存）"""
        cache_key = CacheKeyGenerator.plan_statistics(plan_id)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_MEDIUM
        )
    
    @staticmethod
    def get_plan_progress(plan_id: int, fetch_callback: Callable) -> Dict:
        """获取计划进度（带缓存）"""
        cache_key = CacheKeyGenerator.plan_progress(plan_id)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_SHORT  # 进度数据变化较快，使用短缓存
        )
    
    @staticmethod
    def invalidate_plan(plan_id: int) -> None:
        """使计划缓存失效"""
        CacheService.invalidate_plan_caches(plan_id)


class DashboardCacheManager:
    """仪表板缓存管理器"""
    
    @staticmethod
    def get_dashboard_data(user_id: Optional[int], fetch_callback: Callable) -> Dict:
        """获取仪表板数据（带缓存）"""
        cache_key = CacheKeyGenerator.dashboard_data(user_id)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_MEDIUM
        )
    
    @staticmethod
    def get_dashboard_widgets(widget_type: str, time_range: int, 
                            user_id: Optional[int], fetch_callback: Callable) -> Dict:
        """获取仪表板小部件数据（带缓存）"""
        cache_key = CacheKeyGenerator.dashboard_widgets(widget_type, time_range, user_id)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_MEDIUM
        )
    
    @staticmethod
    def invalidate_dashboard() -> None:
        """使仪表板缓存失效"""
        CacheService.delete_pattern(f"{CacheKeyGenerator.PREFIX}:dashboard:*")


class StatisticsCacheManager:
    """统计数据缓存管理器"""
    
    @staticmethod
    def get_regional_statistics(fetch_callback: Callable) -> Dict:
        """获取区域统计数据（带缓存）"""
        cache_key = CacheKeyGenerator.regional_statistics()
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_LONG
        )
    
    @staticmethod
    def get_store_type_statistics(fetch_callback: Callable) -> Dict:
        """获取门店类型统计数据（带缓存）"""
        cache_key = CacheKeyGenerator.store_type_statistics()
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_LONG
        )
    
    @staticmethod
    def get_monthly_statistics(year: int, month: int, fetch_callback: Callable) -> Dict:
        """获取月度统计数据（带缓存）"""
        cache_key = CacheKeyGenerator.monthly_statistics(year, month)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_VERY_LONG  # 历史月度数据很少变化
        )
    
    @staticmethod
    def get_performance_ranking(ranking_type: str, time_period: str, 
                              fetch_callback: Callable) -> Dict:
        """获取绩效排名数据（带缓存）"""
        cache_key = CacheKeyGenerator.performance_ranking(ranking_type, time_period)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_MEDIUM
        )
    
    @staticmethod
    def invalidate_statistics() -> None:
        """使统计数据缓存失效"""
        CacheService.delete_pattern(f"{CacheKeyGenerator.PREFIX}:statistics:*")
        CacheService.delete_pattern(f"{CacheKeyGenerator.PREFIX}:ranking:*")


class BaseDataCacheManager:
    """基础数据缓存管理器"""
    
    @staticmethod
    def get_business_regions(active_only: bool, fetch_callback: Callable) -> List[Dict]:
        """获取经营区域列表（带缓存）"""
        cache_key = CacheKeyGenerator.business_regions(active_only)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_VERY_LONG  # 基础数据变化很少
        )
    
    @staticmethod
    def get_store_types(active_only: bool, fetch_callback: Callable) -> List[Dict]:
        """获取门店类型列表（带缓存）"""
        cache_key = CacheKeyGenerator.store_types(active_only)
        return CacheService.get_or_set(
            cache_key,
            fetch_callback,
            CacheService.TIMEOUT_VERY_LONG  # 基础数据变化很少
        )
    
    @staticmethod
    def invalidate_base_data() -> None:
        """使基础数据缓存失效"""
        CacheService.invalidate_base_data_caches()


# ==================== 信号处理器 - 自动缓存失效 ====================

@receiver(post_save, sender=StorePlan)
def invalidate_plan_cache_on_save(sender, instance, created, **kwargs):
    """计划保存时使相关缓存失效"""
    CacheService.invalidate_plan_caches(instance.id)


@receiver(post_delete, sender=StorePlan)
def invalidate_plan_cache_on_delete(sender, instance, **kwargs):
    """计划删除时使相关缓存失效"""
    CacheService.invalidate_plan_caches(instance.id)


@receiver(post_save, sender=RegionalPlan)
def invalidate_regional_cache_on_save(sender, instance, created, **kwargs):
    """区域计划保存时使相关缓存失效"""
    CacheService.invalidate_plan_caches(instance.plan_id)
    CacheService.invalidate_regional_caches()


@receiver(post_delete, sender=RegionalPlan)
def invalidate_regional_cache_on_delete(sender, instance, **kwargs):
    """区域计划删除时使相关缓存失效"""
    CacheService.invalidate_plan_caches(instance.plan_id)
    CacheService.invalidate_regional_caches()


@receiver(post_save, sender=PlanExecutionLog)
def invalidate_progress_cache_on_log(sender, instance, created, **kwargs):
    """执行日志保存时使进度相关缓存失效"""
    if created and instance.action_type in ['store_opened', 'progress_updated']:
        CacheService.invalidate_plan_caches(instance.plan_id)


@receiver(post_save, sender=BusinessRegion)
@receiver(post_delete, sender=BusinessRegion)
def invalidate_region_base_data_cache(sender, instance, **kwargs):
    """经营区域变更时使基础数据缓存失效"""
    CacheService.invalidate_base_data_caches()
    CacheService.invalidate_regional_caches()


@receiver(post_save, sender=StoreType)
@receiver(post_delete, sender=StoreType)
def invalidate_store_type_base_data_cache(sender, instance, **kwargs):
    """门店类型变更时使基础数据缓存失效"""
    CacheService.invalidate_base_data_caches()


# ==================== 缓存预热 ====================

class CacheWarmer:
    """缓存预热器 - 在系统启动或定时任务中预加载常用数据"""
    
    @staticmethod
    def warm_base_data():
        """预热基础数据缓存"""
        from .serializers import BusinessRegionListSerializer, StoreTypeListSerializer
        
        # 预热经营区域数据
        regions = BusinessRegion.objects.filter(is_active=True)
        regions_data = BusinessRegionListSerializer(regions, many=True).data
        cache_key = CacheKeyGenerator.business_regions(active_only=True)
        CacheService.set(cache_key, regions_data, CacheService.TIMEOUT_VERY_LONG)
        
        # 预热门店类型数据
        store_types = StoreType.objects.filter(is_active=True)
        store_types_data = StoreTypeListSerializer(store_types, many=True).data
        cache_key = CacheKeyGenerator.store_types(active_only=True)
        CacheService.set(cache_key, store_types_data, CacheService.TIMEOUT_VERY_LONG)
    
    @staticmethod
    def warm_dashboard_data():
        """预热仪表板数据缓存"""
        from .services import PlanStatisticsService
        
        service = PlanStatisticsService()
        
        # 预热全局仪表板数据
        dashboard_data = service.get_dashboard_data(user=None, force_refresh=True)
        cache_key = CacheKeyGenerator.dashboard_data(user_id=None)
        CacheService.set(cache_key, dashboard_data, CacheService.TIMEOUT_MEDIUM)
    
    @staticmethod
    def warm_statistics():
        """预热统计数据缓存"""
        from .query_optimization import QueryOptimizer
        
        # 预热区域统计
        regional_stats = list(QueryOptimizer.get_regional_statistics_queryset())
        cache_key = CacheKeyGenerator.regional_statistics()
        CacheService.set(cache_key, regional_stats, CacheService.TIMEOUT_LONG)
        
        # 预热门店类型统计
        store_type_stats = list(QueryOptimizer.get_store_type_statistics_queryset())
        cache_key = CacheKeyGenerator.store_type_statistics()
        CacheService.set(cache_key, store_type_stats, CacheService.TIMEOUT_LONG)
    
    @staticmethod
    def warm_all():
        """预热所有常用缓存"""
        try:
            CacheWarmer.warm_base_data()
            CacheWarmer.warm_dashboard_data()
            CacheWarmer.warm_statistics()
            return True
        except Exception as e:
            import logging
            logging.error(f"Cache warming error: {str(e)}")
            return False
