"""
数据分析服务模块
提供数据聚合、统计计算和缓存管理功能
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from decimal import Decimal
from django.db import models
from django.db.models import Count, Sum, Avg, Q, F, Case, When, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings

# 导入相关模型
from store_archive.models import StoreProfile
from store_planning.models import StorePlan, RegionalPlan, BusinessRegion, StoreType
from store_expansion.models import FollowUpRecord, CandidateLocation
from store_preparation.models import ConstructionOrder, DeliveryChecklist
from .models import AnalyticsCache, ExternalSalesData

logger = logging.getLogger(__name__)


class DataAggregationService:
    """数据聚合服务类"""
    
    # 缓存键前缀
    CACHE_PREFIX = 'analytics'
    
    # 缓存过期时间（秒）
    CACHE_TIMEOUT = {
        'dashboard': 300,  # 5分钟
        'store_map': 600,  # 10分钟
        'funnel': 300,     # 5分钟
        'plan_progress': 600,  # 10分钟
    }
    
    def __init__(self):
        self.logger = logging.getLogger(f'{__name__}.{self.__class__.__name__}')
    
    def _get_cache_key(self, cache_type: str, **kwargs) -> str:
        """生成缓存键"""
        key_parts = [self.CACHE_PREFIX, cache_type]
        for k, v in sorted(kwargs.items()):
            if v is not None:
                key_parts.append(f"{k}_{v}")
        return ':'.join(key_parts)
    
    def _get_cached_data(self, cache_key: str) -> Optional[Dict]:
        """获取缓存数据"""
        try:
            # 先从Redis缓存获取
            cached_data = cache.get(cache_key)
            if cached_data:
                return cached_data
            
            # 从数据库缓存获取
            try:
                cache_obj = AnalyticsCache.objects.get(
                    cache_key=cache_key,
                    expires_at__gt=timezone.now()
                )
                return cache_obj.cache_data
            except AnalyticsCache.DoesNotExist:
                return None
                
        except Exception as e:
            self.logger.warning(f"获取缓存数据失败: {e}")
            return None
    
    def _set_cached_data(self, cache_key: str, data: Dict, cache_type: str, timeout: int = None) -> None:
        """设置缓存数据"""
        try:
            if timeout is None:
                timeout = self.CACHE_TIMEOUT.get(cache_type, 300)
            
            # 设置Redis缓存
            cache.set(cache_key, data, timeout)
            
            # 设置数据库缓存
            expires_at = timezone.now() + timedelta(seconds=timeout)
            AnalyticsCache.objects.update_or_create(
                cache_key=cache_key,
                defaults={
                    'cache_data': data,
                    'cache_type': cache_type,
                    'expires_at': expires_at,
                }
            )
            
        except Exception as e:
            self.logger.error(f"设置缓存数据失败: {e}")
    
    def get_store_map_data(self, region_id: Optional[int] = None, 
                          time_range: Optional[Tuple[datetime, datetime]] = None) -> Dict:
        """
        获取开店地图数据
        
        Args:
            region_id: 业务区域ID，None表示全部区域
            time_range: 时间范围，(start_date, end_date)
            
        Returns:
            包含门店位置和统计数据的字典
        """
        cache_key = self._get_cache_key(
            'store_map',
            region_id=region_id,
            time_range=f"{time_range[0].date()}_{time_range[1].date()}" if time_range else None
        )
        
        # 尝试从缓存获取
        cached_data = self._get_cached_data(cache_key)
        if cached_data:
            return cached_data
        
        try:
            # 构建查询条件
            queryset = StoreProfile.objects.select_related(
                'business_region', 'follow_up_record', 'construction_order'
            )
            
            if region_id:
                queryset = queryset.filter(business_region_id=region_id)
            
            if time_range:
                queryset = queryset.filter(
                    created_at__range=time_range
                )
            
            # 获取门店位置数据
            stores_data = []
            for store in queryset:
                # 确定门店状态
                status = self._determine_store_status(store)
                
                store_data = {
                    'id': store.id,
                    'name': store.store_name,
                    'code': store.store_code,
                    'province': store.province,
                    'city': store.city,
                    'district': store.district,
                    'address': store.address,
                    'status': status,
                    'store_type': store.store_type,
                    'operation_mode': store.operation_mode,
                    'business_region': {
                        'id': store.business_region.id,
                        'name': store.business_region.name,
                        'code': store.business_region.code,
                    },
                    'opening_date': store.opening_date.isoformat() if store.opening_date else None,
                    'created_at': store.created_at.isoformat(),
                }
                stores_data.append(store_data)
            
            # 获取区域统计数据
            region_stats = self._get_region_statistics(region_id, time_range)
            
            # 获取状态统计数据
            status_stats = self._get_status_statistics(region_id, time_range)
            
            result = {
                'stores': stores_data,
                'region_statistics': region_stats,
                'status_statistics': status_stats,
                'total_count': len(stores_data),
                'last_updated': timezone.now().isoformat(),
            }
            
            # 缓存结果
            self._set_cached_data(cache_key, result, 'store_map')
            
            return result
            
        except Exception as e:
            self.logger.error(f"获取开店地图数据失败: {e}")
            raise
    
    def get_follow_up_funnel_data(self, region_id: Optional[int] = None,
                                 time_range: Optional[Tuple[datetime, datetime]] = None) -> Dict:
        """
        获取跟进漏斗数据
        
        Args:
            region_id: 业务区域ID
            time_range: 时间范围
            
        Returns:
            包含漏斗各阶段数据和转化率的字典
        """
        cache_key = self._get_cache_key(
            'funnel',
            region_id=region_id,
            time_range=f"{time_range[0].date()}_{time_range[1].date()}" if time_range else None
        )
        
        # 尝试从缓存获取
        cached_data = self._get_cached_data(cache_key)
        if cached_data:
            return cached_data
        
        try:
            # 构建查询条件
            queryset = FollowUpRecord.objects.select_related('location__business_region')
            
            if region_id:
                queryset = queryset.filter(location__business_region_id=region_id)
            
            if time_range:
                queryset = queryset.filter(created_at__range=time_range)
            
            # 定义漏斗阶段
            funnel_stages = [
                ('investigating', '调研中'),
                ('calculating', '测算中'),
                ('approving', '审批中'),
                ('signing', '签约中'),
                ('signed', '已签约'),
            ]
            
            # 统计各阶段数量
            stage_counts = {}
            total_count = queryset.count()
            
            for status_code, status_name in funnel_stages:
                count = queryset.filter(status=status_code).count()
                stage_counts[status_code] = {
                    'name': status_name,
                    'count': count,
                    'percentage': round((count / total_count * 100), 2) if total_count > 0 else 0
                }
            
            # 计算转化率
            conversion_rates = self._calculate_conversion_rates(stage_counts, funnel_stages)
            
            # 检查预警条件
            warning_stages = self._check_funnel_warnings(stage_counts, conversion_rates)
            
            result = {
                'stages': stage_counts,
                'conversion_rates': conversion_rates,
                'total_count': total_count,
                'warning_stages': warning_stages,
                'last_updated': timezone.now().isoformat(),
            }
            
            # 缓存结果
            self._set_cached_data(cache_key, result, 'funnel')
            
            return result
            
        except Exception as e:
            self.logger.error(f"获取跟进漏斗数据失败: {e}")
            raise
    
    def get_plan_progress_data(self, plan_id: Optional[int] = None,
                              contribution_rate_type: Optional[str] = None) -> Dict:
        """
        获取计划完成进度数据
        
        Args:
            plan_id: 计划ID，None表示当前活跃计划
            contribution_rate_type: 贡献率类型筛选
            
        Returns:
            包含计划完成进度分析的字典
        """
        cache_key = self._get_cache_key(
            'plan_progress',
            plan_id=plan_id,
            contribution_rate_type=contribution_rate_type
        )
        
        # 尝试从缓存获取
        cached_data = self._get_cached_data(cache_key)
        if cached_data:
            return cached_data
        
        try:
            # 获取计划查询集
            if plan_id:
                plans = StorePlan.objects.filter(id=plan_id)
            else:
                # 获取当前活跃的计划
                plans = StorePlan.objects.filter(
                    status__in=['published', 'executing'],
                    start_date__lte=timezone.now().date(),
                    end_date__gte=timezone.now().date()
                )
            
            plan_progress_data = []
            
            for plan in plans:
                # 获取区域计划数据
                regional_plans = plan.regional_plans.select_related(
                    'region', 'store_type'
                )
                
                if contribution_rate_type:
                    # 根据贡献率类型筛选
                    regional_plans = self._filter_by_contribution_rate_type(
                        regional_plans, contribution_rate_type
                    )
                
                # 按贡献率类型分组统计
                grouped_data = self._group_by_contribution_rate_type(regional_plans)
                
                plan_data = {
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'plan_type': plan.plan_type,
                    'status': plan.status,
                    'start_date': plan.start_date.isoformat(),
                    'end_date': plan.end_date.isoformat(),
                    'total_target_count': plan.total_target_count,
                    'total_completed_count': plan.total_completed_count,
                    'completion_rate': plan.completion_rate,
                    'grouped_progress': grouped_data,
                }
                
                plan_progress_data.append(plan_data)
            
            # 计算总体统计
            overall_stats = self._calculate_overall_plan_stats(plan_progress_data)
            
            result = {
                'plans': plan_progress_data,
                'overall_statistics': overall_stats,
                'last_updated': timezone.now().isoformat(),
            }
            
            # 缓存结果
            self._set_cached_data(cache_key, result, 'plan_progress')
            
            return result
            
        except Exception as e:
            self.logger.error(f"获取计划完成进度数据失败: {e}")
            raise
    
    def get_dashboard_data(self, user_permissions: Optional[Dict] = None) -> Dict:
        """
        获取经营大屏综合数据
        
        Args:
            user_permissions: 用户权限信息
            
        Returns:
            包含大屏所有数据的字典
        """
        cache_key = self._get_cache_key('dashboard', user_id=user_permissions.get('user_id') if user_permissions else None)
        
        # 尝试从缓存获取
        cached_data = self._get_cached_data(cache_key)
        if cached_data:
            return cached_data
        
        try:
            # 根据用户权限确定数据范围
            region_filter = None
            if user_permissions and 'allowed_regions' in user_permissions:
                region_filter = user_permissions['allowed_regions'][0] if user_permissions['allowed_regions'] else None
            
            # 获取各模块数据
            store_map_data = self.get_store_map_data(region_id=region_filter)
            funnel_data = self.get_follow_up_funnel_data(region_id=region_filter)
            plan_progress_data = self.get_plan_progress_data()
            
            # 获取关键指标
            key_metrics = self._get_key_metrics(region_filter)
            
            result = {
                'store_map': store_map_data,
                'follow_up_funnel': funnel_data,
                'plan_progress': plan_progress_data,
                'key_metrics': key_metrics,
                'last_updated': timezone.now().isoformat(),
            }
            
            # 缓存结果
            self._set_cached_data(cache_key, result, 'dashboard')
            
            return result
            
        except Exception as e:
            self.logger.error(f"获取经营大屏数据失败: {e}")
            raise
    
    def _determine_store_status(self, store: StoreProfile) -> str:
        """确定门店状态"""
        if store.status == 'operating':
            return 'opened'
        elif store.status == 'preparing':
            return 'preparing'
        elif store.construction_order:
            return 'construction'
        elif store.follow_up_record:
            return 'following'
        else:
            return 'planned'
    
    def _get_region_statistics(self, region_id: Optional[int], 
                              time_range: Optional[Tuple[datetime, datetime]]) -> List[Dict]:
        """获取区域统计数据"""
        queryset = BusinessRegion.objects.annotate(
            store_count=Count('storeprofile', filter=Q(storeprofile__isnull=False))
        )
        
        if region_id:
            queryset = queryset.filter(id=region_id)
        
        region_stats = []
        for region in queryset:
            # 获取该区域的门店状态统计
            store_status_stats = StoreProfile.objects.filter(
                business_region=region
            ).values('status').annotate(count=Count('id'))
            
            status_dict = {item['status']: item['count'] for item in store_status_stats}
            
            region_data = {
                'region_id': region.id,
                'region_name': region.name,
                'region_code': region.code,
                'total_stores': region.store_count,
                'status_breakdown': status_dict,
            }
            region_stats.append(region_data)
        
        return region_stats
    
    def _get_status_statistics(self, region_id: Optional[int],
                              time_range: Optional[Tuple[datetime, datetime]]) -> Dict:
        """获取状态统计数据"""
        queryset = StoreProfile.objects.all()
        
        if region_id:
            queryset = queryset.filter(business_region_id=region_id)
        
        if time_range:
            queryset = queryset.filter(created_at__range=time_range)
        
        status_stats = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        return {item['status']: item['count'] for item in status_stats}
    
    def _calculate_conversion_rates(self, stage_counts: Dict, funnel_stages: List[Tuple]) -> List[Dict]:
        """计算漏斗转化率"""
        conversion_rates = []
        
        for i in range(len(funnel_stages) - 1):
            current_stage = funnel_stages[i][0]
            next_stage = funnel_stages[i + 1][0]
            
            current_count = stage_counts[current_stage]['count']
            next_count = stage_counts[next_stage]['count']
            
            if current_count > 0:
                rate = round((next_count / current_count) * 100, 2)
            else:
                rate = 0
            
            conversion_rates.append({
                'from_stage': funnel_stages[i][1],
                'to_stage': funnel_stages[i + 1][1],
                'rate': rate,
                'from_count': current_count,
                'to_count': next_count,
            })
        
        return conversion_rates
    
    def _check_funnel_warnings(self, stage_counts: Dict, conversion_rates: List[Dict]) -> List[str]:
        """检查漏斗预警条件"""
        warnings = []
        
        # 检查转化率是否异常低（低于30%）
        for rate_data in conversion_rates:
            if rate_data['rate'] < 30 and rate_data['from_count'] > 10:
                warnings.append(f"{rate_data['from_stage']}到{rate_data['to_stage']}转化率过低: {rate_data['rate']}%")
        
        # 检查是否有阶段积压过多
        total_count = sum(stage['count'] for stage in stage_counts.values())
        for stage_code, stage_data in stage_counts.items():
            if stage_data['count'] > total_count * 0.4 and total_count > 50:
                warnings.append(f"{stage_data['name']}阶段积压过多: {stage_data['count']}个")
        
        return warnings
    
    def _filter_by_contribution_rate_type(self, queryset, contribution_rate_type: str):
        """根据贡献率类型筛选"""
        if contribution_rate_type == 'high':
            return queryset.filter(contribution_rate__gte=80)
        elif contribution_rate_type == 'medium':
            return queryset.filter(contribution_rate__gte=50, contribution_rate__lt=80)
        elif contribution_rate_type == 'low':
            return queryset.filter(contribution_rate__lt=50)
        else:
            return queryset
    
    def _group_by_contribution_rate_type(self, regional_plans) -> Dict:
        """按贡献率类型分组统计"""
        grouped_data = {
            'high': {'name': '高贡献率(≥80%)', 'target_count': 0, 'completed_count': 0, 'completion_rate': 0},
            'medium': {'name': '中贡献率(50-80%)', 'target_count': 0, 'completed_count': 0, 'completion_rate': 0},
            'low': {'name': '低贡献率(<50%)', 'target_count': 0, 'completed_count': 0, 'completion_rate': 0},
            'unknown': {'name': '未设置贡献率', 'target_count': 0, 'completed_count': 0, 'completion_rate': 0},
        }
        
        for plan in regional_plans:
            if plan.contribution_rate is None:
                group_key = 'unknown'
            elif plan.contribution_rate >= 80:
                group_key = 'high'
            elif plan.contribution_rate >= 50:
                group_key = 'medium'
            else:
                group_key = 'low'
            
            grouped_data[group_key]['target_count'] += plan.target_count
            grouped_data[group_key]['completed_count'] += plan.completed_count
        
        # 计算完成率
        for group_data in grouped_data.values():
            if group_data['target_count'] > 0:
                group_data['completion_rate'] = round(
                    (group_data['completed_count'] / group_data['target_count']) * 100, 2
                )
        
        return grouped_data
    
    def _calculate_overall_plan_stats(self, plan_progress_data: List[Dict]) -> Dict:
        """计算总体计划统计"""
        total_target = sum(plan['total_target_count'] for plan in plan_progress_data)
        total_completed = sum(plan['total_completed_count'] for plan in plan_progress_data)
        
        overall_completion_rate = 0
        if total_target > 0:
            overall_completion_rate = round((total_completed / total_target) * 100, 2)
        
        return {
            'total_plans': len(plan_progress_data),
            'total_target_count': total_target,
            'total_completed_count': total_completed,
            'overall_completion_rate': overall_completion_rate,
        }
    
    def _get_key_metrics(self, region_filter: Optional[int]) -> Dict:
        """获取关键指标"""
        # 构建基础查询
        store_queryset = StoreProfile.objects.all()
        follow_up_queryset = FollowUpRecord.objects.all()
        construction_queryset = ConstructionOrder.objects.all()
        
        if region_filter:
            store_queryset = store_queryset.filter(business_region_id=region_filter)
            follow_up_queryset = follow_up_queryset.filter(location__business_region_id=region_filter)
            construction_queryset = construction_queryset.filter(
                follow_up_record__location__business_region_id=region_filter
            )
        
        # 计算关键指标
        total_stores = store_queryset.count()
        operating_stores = store_queryset.filter(status='operating').count()
        follow_up_count = follow_up_queryset.filter(status__in=['investigating', 'calculating', 'approving', 'signing']).count()
        construction_count = construction_queryset.filter(status__in=['planning', 'in_progress']).count()
        
        # 本月新增门店
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_stores_this_month = store_queryset.filter(
            opening_date__gte=current_month_start.date()
        ).count()
        
        return {
            'total_stores': total_stores,
            'operating_stores': operating_stores,
            'follow_up_count': follow_up_count,
            'construction_count': construction_count,
            'new_stores_this_month': new_stores_this_month,
        }
    
    def clear_cache(self, cache_type: Optional[str] = None) -> None:
        """清除缓存"""
        try:
            if cache_type:
                # 清除特定类型的缓存
                cache_pattern = f"{self.CACHE_PREFIX}:{cache_type}:*"
                # Redis缓存清除
                cache.delete_many(cache.keys(cache_pattern))
                # 数据库缓存清除
                AnalyticsCache.objects.filter(cache_type=cache_type).delete()
            else:
                # 清除所有缓存
                cache_pattern = f"{self.CACHE_PREFIX}:*"
                cache.delete_many(cache.keys(cache_pattern))
                AnalyticsCache.objects.all().delete()
                
            self.logger.info(f"缓存清除成功: {cache_type or '全部'}")
            
        except Exception as e:
            self.logger.error(f"清除缓存失败: {e}")
    
    def refresh_cache(self, cache_type: Optional[str] = None) -> None:
        """刷新缓存"""
        try:
            # 先清除缓存
            self.clear_cache(cache_type)
            
            # 重新生成缓存
            if not cache_type or cache_type == 'dashboard':
                self.get_dashboard_data()
            
            if not cache_type or cache_type == 'store_map':
                self.get_store_map_data()
            
            if not cache_type or cache_type == 'funnel':
                self.get_follow_up_funnel_data()
            
            if not cache_type or cache_type == 'plan_progress':
                self.get_plan_progress_data()
                
            self.logger.info(f"缓存刷新成功: {cache_type or '全部'}")
            
        except Exception as e:
            self.logger.error(f"刷新缓存失败: {e}")


class ExternalDataValidationService:
    """外部数据验证服务"""
    
    def __init__(self):
        self.logger = logging.getLogger(f'{__name__}.{self.__class__.__name__}')
    
    def validate_sales_data(self, data: Dict) -> Dict:
        """
        验证销售数据格式和内容
        
        Args:
            data: 原始销售数据
            
        Returns:
            验证结果字典，包含is_valid、errors、data字段
        """
        errors = []
        validated_data = {}
        
        try:
            # 验证必需字段
            required_fields = ['store_id', 'data_date', 'daily_revenue']
            for field in required_fields:
                if field not in data or data[field] is None:
                    errors.append(f'缺少必需字段: {field}')
            
            if errors:
                return {'is_valid': False, 'errors': errors, 'data': {}}
            
            # 验证门店ID
            store_id = str(data['store_id']).strip()
            if not store_id:
                errors.append('门店ID不能为空')
            else:
                validated_data['store_id'] = store_id
            
            # 验证门店编码（如果提供）
            if 'store_code' in data and data['store_code']:
                validated_data['store_code'] = str(data['store_code']).strip()
            
            # 验证日期格式
            try:
                if isinstance(data['data_date'], str):
                    data_date = timezone.datetime.strptime(data['data_date'], '%Y-%m-%d').date()
                else:
                    data_date = data['data_date']
                
                # 检查日期是否合理（不能是未来日期）
                if data_date > timezone.now().date():
                    errors.append('数据日期不能是未来日期')
                
                # 检查日期是否过于久远（超过2年）
                if data_date < timezone.now().date() - timedelta(days=730):
                    errors.append('数据日期过于久远，请确认数据准确性')
                
                validated_data['data_date'] = data_date
                
            except (ValueError, TypeError):
                errors.append('日期格式错误，请使用 YYYY-MM-DD 格式')
            
            # 验证营业额
            try:
                daily_revenue = Decimal(str(data['daily_revenue']))
                if daily_revenue < 0:
                    errors.append('日营业额不能为负数')
                elif daily_revenue > 100000:  # 单日营业额超过10万可能异常
                    errors.append('日营业额过高，请确认数据准确性')
                validated_data['daily_revenue'] = daily_revenue
            except (ValueError, TypeError, InvalidOperation):
                errors.append('日营业额格式错误，请输入有效数字')
            
            # 验证订单数
            if 'daily_orders' in data:
                try:
                    daily_orders = int(data['daily_orders'])
                    if daily_orders < 0:
                        errors.append('日订单数不能为负数')
                    elif daily_orders > 10000:  # 单日订单数超过1万可能异常
                        errors.append('日订单数过高，请确认数据准确性')
                    validated_data['daily_orders'] = daily_orders
                except (ValueError, TypeError):
                    errors.append('日订单数格式错误，请输入有效整数')
            
            # 验证客流量
            if 'daily_customers' in data:
                try:
                    daily_customers = int(data['daily_customers'])
                    if daily_customers < 0:
                        errors.append('日客流量不能为负数')
                    validated_data['daily_customers'] = daily_customers
                except (ValueError, TypeError):
                    errors.append('日客流量格式错误，请输入有效整数')
            
            # 验证月度数据（可选）
            if 'monthly_revenue' in data and data['monthly_revenue'] is not None:
                try:
                    monthly_revenue = Decimal(str(data['monthly_revenue']))
                    if monthly_revenue < 0:
                        errors.append('月营业额不能为负数')
                    validated_data['monthly_revenue'] = monthly_revenue
                except (ValueError, TypeError, InvalidOperation):
                    errors.append('月营业额格式错误，请输入有效数字')
            
            if 'monthly_orders' in data and data['monthly_orders'] is not None:
                try:
                    monthly_orders = int(data['monthly_orders'])
                    if monthly_orders < 0:
                        errors.append('月订单数不能为负数')
                    validated_data['monthly_orders'] = monthly_orders
                except (ValueError, TypeError):
                    errors.append('月订单数格式错误，请输入有效整数')
            
            # 验证数据来源
            if 'data_source' in data and data['data_source']:
                validated_data['data_source'] = str(data['data_source']).strip()
            
            # 验证批次ID
            if 'batch_id' in data and data['batch_id']:
                validated_data['batch_id'] = str(data['batch_id']).strip()
            
            # 业务逻辑验证
            if 'daily_orders' in validated_data and 'daily_revenue' in validated_data:
                if validated_data['daily_orders'] > 0 and validated_data['daily_revenue'] == 0:
                    errors.append('有订单但营业额为0，数据可能异常')
                elif validated_data['daily_orders'] == 0 and validated_data['daily_revenue'] > 0:
                    errors.append('无订单但有营业额，数据可能异常')
            
            return {
                'is_valid': len(errors) == 0,
                'errors': errors,
                'data': validated_data
            }
            
        except Exception as e:
            self.logger.error(f"销售数据验证失败: {e}")
            return {
                'is_valid': False,
                'errors': [f'数据验证异常: {str(e)}'],
                'data': {}
            }
    
    def match_store(self, store_id: str, store_code: Optional[str] = None) -> Dict:
        """
        匹配门店信息
        
        Args:
            store_id: 门店ID或编码
            store_code: 门店编码（可选）
            
        Returns:
            匹配结果字典，包含found、store、message字段
        """
        try:
            from store_archive.models import StoreProfile
            
            store = None
            
            # 首先尝试通过ID匹配
            if store_id.isdigit():
                try:
                    store = StoreProfile.objects.get(id=int(store_id))
                except StoreProfile.DoesNotExist:
                    pass
            
            # 如果ID匹配失败，尝试通过门店编码匹配
            if not store:
                try:
                    store = StoreProfile.objects.get(store_code=store_id)
                except StoreProfile.DoesNotExist:
                    pass
            
            # 如果提供了额外的门店编码，尝试匹配
            if not store and store_code:
                try:
                    store = StoreProfile.objects.get(store_code=store_code)
                except StoreProfile.DoesNotExist:
                    pass
            
            # 尝试模糊匹配门店名称
            if not store:
                stores = StoreProfile.objects.filter(
                    models.Q(store_name__icontains=store_id) |
                    models.Q(store_code__icontains=store_id)
                )
                if stores.count() == 1:
                    store = stores.first()
                elif stores.count() > 1:
                    return {
                        'found': False,
                        'store': None,
                        'message': f'找到多个匹配的门店，请使用更精确的门店标识: {store_id}'
                    }
            
            if store:
                # 检查门店状态是否适合接收销售数据
                if store.status not in ['operating', 'preparing']:
                    return {
                        'found': True,
                        'store': store,
                        'message': f'门店状态为{store.get_status_display()}，可能不适合接收销售数据'
                    }
                
                return {
                    'found': True,
                    'store': store,
                    'message': '门店匹配成功'
                }
            else:
                return {
                    'found': False,
                    'store': None,
                    'message': f'未找到匹配的门店: {store_id}'
                }
                
        except Exception as e:
            self.logger.error(f"门店匹配失败: {e}")
            return {
                'found': False,
                'store': None,
                'message': f'门店匹配异常: {str(e)}'
            }
    
    def validate_batch_data(self, data_batch: List[Dict]) -> Dict:
        """
        验证批量销售数据
        
        Args:
            data_batch: 销售数据批次
            
        Returns:
            批量验证结果
        """
        try:
            if not data_batch:
                return {
                    'is_valid': False,
                    'message': '数据批次不能为空',
                    'valid_count': 0,
                    'invalid_count': 0,
                    'errors': []
                }
            
            if len(data_batch) > 1000:
                return {
                    'is_valid': False,
                    'message': '单次批量导入不能超过1000条记录',
                    'valid_count': 0,
                    'invalid_count': len(data_batch),
                    'errors': []
                }
            
            valid_records = []
            invalid_records = []
            batch_errors = []
            
            for i, record in enumerate(data_batch):
                validation_result = self.validate_sales_data(record)
                if validation_result['is_valid']:
                    valid_records.append({
                        'index': i,
                        'data': validation_result['data']
                    })
                else:
                    invalid_records.append({
                        'index': i,
                        'data': record,
                        'errors': validation_result['errors']
                    })
                    batch_errors.extend([f"记录{i+1}: {error}" for error in validation_result['errors']])
            
            return {
                'is_valid': len(invalid_records) == 0,
                'message': f'批量验证完成，有效记录{len(valid_records)}条，无效记录{len(invalid_records)}条',
                'valid_count': len(valid_records),
                'invalid_count': len(invalid_records),
                'valid_records': valid_records,
                'invalid_records': invalid_records,
                'errors': batch_errors
            }
            
        except Exception as e:
            self.logger.error(f"批量数据验证失败: {e}")
            return {
                'is_valid': False,
                'message': f'批量验证异常: {str(e)}',
                'valid_count': 0,
                'invalid_count': len(data_batch) if data_batch else 0,
                'errors': [str(e)]
            }


class ROICalculationService:
    """投资回报率计算服务"""
    
    def __init__(self):
        self.logger = logging.getLogger(f'{__name__}.{self.__class__.__name__}')
    
    def calculate_store_roi(self, store_id: int, period_months: int = 12) -> Dict:
        """
        计算门店投资回报率
        
        Args:
            store_id: 门店ID
            period_months: 计算周期（月）
            
        Returns:
            包含ROI计算结果的字典
        """
        try:
            store = StoreProfile.objects.get(id=store_id)
            
            # 获取投资成本
            investment_cost = self._get_investment_cost(store)
            
            # 获取销售收入
            revenue_data = self._get_store_revenue(store, period_months)
            
            # 获取运营成本（估算）
            operating_cost = self._estimate_operating_cost(store, period_months)
            
            # 计算净利润
            net_profit = revenue_data['total_revenue'] - operating_cost
            
            # 计算ROI
            if investment_cost > 0:
                roi = (net_profit / investment_cost) * 100
            else:
                roi = 0
            
            # 计算回本周期
            monthly_net_profit = net_profit / period_months if period_months > 0 else 0
            payback_period = investment_cost / monthly_net_profit if monthly_net_profit > 0 else 0
            
            # 计算年化ROI
            annual_roi = roi * (12 / period_months) if period_months > 0 else 0
            
            return {
                'store_id': store_id,
                'store_name': store.store_name,
                'store_code': store.store_code,
                'investment_cost': float(investment_cost),
                'total_revenue': float(revenue_data['total_revenue']),
                'operating_cost': float(operating_cost),
                'net_profit': float(net_profit),
                'roi': round(roi, 2),
                'annual_roi': round(annual_roi, 2),
                'payback_period_months': round(payback_period, 1),
                'period_months': period_months,
                'revenue_details': revenue_data,
                'calculated_at': timezone.now().isoformat(),
            }
            
        except StoreProfile.DoesNotExist:
            raise ValueError(f"门店不存在: {store_id}")
        except Exception as e:
            self.logger.error(f"计算门店ROI失败: {e}")
            raise
    
    def calculate_batch_roi(self, store_ids: List[int], period_months: int = 12) -> List[Dict]:
        """
        批量计算门店投资回报率
        
        Args:
            store_ids: 门店ID列表
            period_months: 计算周期（月）
            
        Returns:
            ROI计算结果列表
        """
        results = []
        
        for store_id in store_ids:
            try:
                roi_result = self.calculate_store_roi(store_id, period_months)
                results.append(roi_result)
            except Exception as e:
                self.logger.error(f"计算门店{store_id}的ROI失败: {e}")
                results.append({
                    'store_id': store_id,
                    'error': str(e),
                    'calculated_at': timezone.now().isoformat(),
                })
        
        return results
    
    def get_roi_comparison(self, store_id: int, comparison_periods: List[int] = [3, 6, 12]) -> Dict:
        """
        获取门店不同周期的ROI对比
        
        Args:
            store_id: 门店ID
            comparison_periods: 对比周期列表（月）
            
        Returns:
            ROI对比结果
        """
        try:
            store = StoreProfile.objects.get(id=store_id)
            
            roi_comparisons = []
            for period in comparison_periods:
                try:
                    roi_data = self.calculate_store_roi(store_id, period)
                    roi_comparisons.append({
                        'period_months': period,
                        'roi': roi_data['roi'],
                        'annual_roi': roi_data['annual_roi'],
                        'total_revenue': roi_data['total_revenue'],
                        'net_profit': roi_data['net_profit'],
                    })
                except Exception as e:
                    self.logger.warning(f"计算{period}月ROI失败: {e}")
            
            return {
                'store_id': store_id,
                'store_name': store.store_name,
                'roi_comparisons': roi_comparisons,
                'calculated_at': timezone.now().isoformat(),
            }
            
        except StoreProfile.DoesNotExist:
            raise ValueError(f"门店不存在: {store_id}")
        except Exception as e:
            self.logger.error(f"获取ROI对比失败: {e}")
            raise
    
    def get_roi_trend(self, store_id: int, months: int = 12) -> Dict:
        """
        获取门店ROI趋势分析
        
        Args:
            store_id: 门店ID
            months: 分析月数
            
        Returns:
            ROI趋势数据
        """
        try:
            store = StoreProfile.objects.get(id=store_id)
            
            # 获取每月的销售数据
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=months * 30)
            
            monthly_data = []
            current_date = start_date.replace(day=1)
            
            while current_date <= end_date:
                next_month = (current_date.replace(day=28) + timedelta(days=4)).replace(day=1)
                
                # 获取当月销售数据
                month_sales = ExternalSalesData.objects.filter(
                    store=store,
                    data_date__gte=current_date,
                    data_date__lt=next_month
                ).aggregate(
                    total_revenue=Coalesce(Sum('daily_revenue'), Decimal('0')),
                    total_orders=Coalesce(Sum('daily_orders'), 0)
                )
                
                # 计算当月ROI（简化计算）
                monthly_revenue = month_sales['total_revenue']
                investment_cost = self._get_investment_cost(store)
                monthly_operating_cost = self._estimate_operating_cost(store, 1)
                monthly_profit = monthly_revenue - monthly_operating_cost
                
                monthly_roi = 0
                if investment_cost > 0:
                    monthly_roi = (monthly_profit / investment_cost) * 100
                
                monthly_data.append({
                    'month': current_date.strftime('%Y-%m'),
                    'revenue': float(monthly_revenue),
                    'profit': float(monthly_profit),
                    'roi': round(monthly_roi, 2),
                    'orders': month_sales['total_orders'],
                })
                
                current_date = next_month
            
            return {
                'store_id': store_id,
                'store_name': store.store_name,
                'trend_period_months': months,
                'monthly_data': monthly_data,
                'calculated_at': timezone.now().isoformat(),
            }
            
        except StoreProfile.DoesNotExist:
            raise ValueError(f"门店不存在: {store_id}")
        except Exception as e:
            self.logger.error(f"获取ROI趋势失败: {e}")
            raise
    
    def _get_investment_cost(self, store: StoreProfile) -> Decimal:
        """获取门店投资成本"""
        total_cost = Decimal('0')
        
        # 从跟进单获取盈利测算数据
        if store.follow_up_record and store.follow_up_record.profit_calculation:
            calc = store.follow_up_record.profit_calculation
            total_cost = calc.total_investment
        
        return total_cost
    
    def _get_store_revenue(self, store: StoreProfile, period_months: int) -> Dict:
        """获取门店收入详情"""
        # 计算时间范围
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=period_months * 30)
        
        # 从外部销售数据获取收入
        sales_data = ExternalSalesData.objects.filter(
            store=store,
            data_date__range=[start_date, end_date]
        ).aggregate(
            total_revenue=Coalesce(Sum('daily_revenue'), Decimal('0')),
            total_orders=Coalesce(Sum('daily_orders'), 0),
            avg_order_value=Coalesce(Avg('average_order_value'), Decimal('0')),
            data_count=Count('id')
        )
        
        # 计算平均日营业额
        days_in_period = (end_date - start_date).days
        avg_daily_revenue = sales_data['total_revenue'] / days_in_period if days_in_period > 0 else 0
        
        return {
            'total_revenue': sales_data['total_revenue'],
            'total_orders': sales_data['total_orders'],
            'avg_order_value': sales_data['avg_order_value'],
            'avg_daily_revenue': avg_daily_revenue,
            'data_count': sales_data['data_count'],
            'period_days': days_in_period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }
    
    def _estimate_operating_cost(self, store: StoreProfile, period_months: int) -> Decimal:
        """估算门店运营成本"""
        try:
            # 基础运营成本估算（这里使用简化的估算方法）
            # 实际项目中应该从成本管理模块获取真实数据
            
            monthly_base_cost = Decimal('0')
            
            # 根据门店类型估算基础成本
            if hasattr(store, 'store_type'):
                store_type = store.store_type
                if store_type == 'flagship':  # 旗舰店
                    monthly_base_cost = Decimal('50000')  # 5万/月
                elif store_type == 'standard':  # 标准店
                    monthly_base_cost = Decimal('30000')  # 3万/月
                elif store_type == 'mini':  # 小型店
                    monthly_base_cost = Decimal('20000')  # 2万/月
                else:
                    monthly_base_cost = Decimal('25000')  # 默认2.5万/月
            else:
                monthly_base_cost = Decimal('25000')  # 默认2.5万/月
            
            # 根据地区调整成本（一线城市成本更高）
            if store.city in ['北京', '上海', '广州', '深圳']:
                monthly_base_cost *= Decimal('1.5')  # 一线城市成本增加50%
            elif store.city in ['杭州', '南京', '成都', '武汉', '西安']:
                monthly_base_cost *= Decimal('1.2')  # 新一线城市成本增加20%
            
            total_cost = monthly_base_cost * period_months
            
            return total_cost
            
        except Exception as e:
            self.logger.warning(f"估算运营成本失败: {e}")
            # 返回默认成本
            return Decimal('25000') * period_months


class ReportGenerationService:
    """报表生成服务类"""
    
    def __init__(self):
        self.logger = logging.getLogger(f'{__name__}.{self.__class__.__name__}')
    
    def generate_plan_report(self, filters: Dict, format_type: str, task_id: str) -> str:
        """
        生成开店计划报表
        
        Args:
            filters: 筛选条件
            format_type: 导出格式 (excel, pdf)
            task_id: 任务ID
            
        Returns:
            生成的文件路径
        """
        try:
            self.logger.info(f"开始生成开店计划报表，任务ID: {task_id}")
            
            # 更新进度
            self._update_task_progress(task_id, 20)
            
            # 获取计划数据
            from store_planning.models import StorePlan, RegionalPlan
            
            queryset = StorePlan.objects.select_related().prefetch_related(
                'regional_plans__region',
                'regional_plans__store_type'
            )
            
            # 应用筛选条件
            queryset = self._apply_plan_filters(queryset, filters)
            
            # 更新进度
            self._update_task_progress(task_id, 40)
            
            # 准备报表数据
            report_data = []
            for plan in queryset:
                for regional_plan in plan.regional_plans.all():
                    report_data.append({
                        '计划名称': plan.name,
                        '计划类型': plan.get_plan_type_display(),
                        '业务区域': regional_plan.region.name,
                        '门店类型': regional_plan.store_type.name if regional_plan.store_type else '',
                        '目标数量': regional_plan.target_count,
                        '完成数量': regional_plan.completed_count,
                        '完成率(%)': round(regional_plan.completion_rate, 2),
                        '贡献率(%)': regional_plan.contribution_rate or 0,
                        '计划开始日期': plan.start_date.strftime('%Y-%m-%d'),
                        '计划结束日期': plan.end_date.strftime('%Y-%m-%d'),
                        '计划状态': plan.get_status_display(),
                        '创建时间': plan.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    })
            
            # 更新进度
            self._update_task_progress(task_id, 60)
            
            # 生成统计汇总
            summary_data = self._generate_plan_summary(report_data)
            
            # 更新进度
            self._update_task_progress(task_id, 80)
            
            # 生成文件
            if format_type == 'excel':
                file_path = self._generate_excel_report(
                    report_data, 
                    summary_data, 
                    '开店计划报表', 
                    task_id
                )
            else:
                file_path = self._generate_pdf_report(
                    report_data, 
                    summary_data, 
                    '开店计划报表', 
                    task_id
                )
            
            # 更新进度
            self._update_task_progress(task_id, 90)
            
            self.logger.info(f"开店计划报表生成完成，文件路径: {file_path}")
            return file_path
            
        except Exception as e:
            self.logger.error(f"生成开店计划报表失败: {e}")
            raise
    
    def generate_follow_up_report(self, filters: Dict, format_type: str, task_id: str) -> str:
        """
        生成拓店跟进进度报表
        
        Args:
            filters: 筛选条件
            format_type: 导出格式
            task_id: 任务ID
            
        Returns:
            生成的文件路径
        """
        try:
            self.logger.info(f"开始生成拓店跟进进度报表，任务ID: {task_id}")
            
            # 更新进度
            self._update_task_progress(task_id, 20)
            
            # 获取跟进数据
            from store_expansion.models import FollowUpRecord
            
            queryset = FollowUpRecord.objects.select_related(
                'location__business_region',
                'assigned_to',
                'profit_calculation'
            ).prefetch_related('follow_up_logs')
            
            # 应用筛选条件
            queryset = self._apply_follow_up_filters(queryset, filters)
            
            # 更新进度
            self._update_task_progress(task_id, 40)
            
            # 准备报表数据
            report_data = []
            for record in queryset:
                # 计算跟进时长
                follow_up_days = (timezone.now().date() - record.created_at.date()).days
                
                # 检查是否超期
                is_overdue = self._check_follow_up_overdue(record)
                
                # 获取盈利测算数据
                roi_data = self._get_profit_calculation_data(record.profit_calculation)
                
                report_data.append({
                    '跟进单号': record.follow_up_no,
                    '点位名称': record.location.location_name,
                    '详细地址': f"{record.location.province}{record.location.city}{record.location.district}{record.location.address}",
                    '业务区域': record.location.business_region.name,
                    '跟进状态': record.get_status_display(),
                    '负责人': record.assigned_to.get_full_name() if record.assigned_to else '',
                    '预计投资额(万元)': roi_data.get('total_investment', 0),
                    '预计年收入(万元)': roi_data.get('annual_revenue', 0),
                    '预计ROI(%)': roi_data.get('roi', 0),
                    '回本周期(月)': roi_data.get('payback_period', 0),
                    '跟进天数': follow_up_days,
                    '是否超期': '是' if is_overdue else '否',
                    '创建时间': record.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    '最后更新': record.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                })
            
            # 更新进度
            self._update_task_progress(task_id, 60)
            
            # 生成统计汇总
            summary_data = self._generate_follow_up_summary(report_data)
            
            # 更新进度
            self._update_task_progress(task_id, 80)
            
            # 生成文件
            if format_type == 'excel':
                file_path = self._generate_excel_report(
                    report_data, 
                    summary_data, 
                    '拓店跟进进度报表', 
                    task_id
                )
            else:
                file_path = self._generate_pdf_report(
                    report_data, 
                    summary_data, 
                    '拓店跟进进度报表', 
                    task_id
                )
            
            # 更新进度
            self._update_task_progress(task_id, 90)
            
            self.logger.info(f"拓店跟进进度报表生成完成，文件路径: {file_path}")
            return file_path
            
        except Exception as e:
            self.logger.error(f"生成拓店跟进进度报表失败: {e}")
            raise
    
    def generate_preparation_report(self, filters: Dict, format_type: str, task_id: str) -> str:
        """
        生成筹备进度报表
        
        Args:
            filters: 筛选条件
            format_type: 导出格式
            task_id: 任务ID
            
        Returns:
            生成的文件路径
        """
        try:
            self.logger.info(f"开始生成筹备进度报表，任务ID: {task_id}")
            
            # 更新进度
            self._update_task_progress(task_id, 20)
            
            # 获取筹备数据
            from store_preparation.models import ConstructionOrder, DeliveryChecklist
            
            queryset = ConstructionOrder.objects.select_related(
                'follow_up_record__location__business_region',
                'supplier',
                'delivery_checklist'
            ).prefetch_related('milestones')
            
            # 应用筛选条件
            queryset = self._apply_preparation_filters(queryset, filters)
            
            # 更新进度
            self._update_task_progress(task_id, 40)
            
            # 准备报表数据
            report_data = []
            for order in queryset:
                # 计算工程进度
                progress_info = self._calculate_construction_progress(order)
                
                # 检查是否延期
                is_delayed = self._check_construction_delay(order)
                
                # 获取交付状态
                delivery_status = self._get_delivery_status(order)
                
                report_data.append({
                    '工程单号': order.order_no,
                    '门店名称': order.store_name,
                    '业务区域': order.follow_up_record.location.business_region.name,
                    '施工供应商': order.supplier.name if order.supplier else '',
                    '工程状态': order.get_status_display(),
                    '开工日期': order.construction_start_date.strftime('%Y-%m-%d') if order.construction_start_date else '',
                    '预计完工日期': order.construction_end_date.strftime('%Y-%m-%d') if order.construction_end_date else '',
                    '实际完工日期': order.actual_end_date.strftime('%Y-%m-%d') if order.actual_end_date else '',
                    '工程进度(%)': progress_info.get('progress', 0),
                    '是否延期': '是' if is_delayed else '否',
                    '延期天数': progress_info.get('delay_days', 0),
                    '验收结果': order.get_acceptance_result_display(),
                    '整改项数量': len(order.rectification_items),
                    '交付状态': delivery_status.get('status', ''),
                    '交付完成率(%)': delivery_status.get('completion_rate', 0),
                    '创建时间': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    '最后更新': order.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                })
            
            # 更新进度
            self._update_task_progress(task_id, 60)
            
            # 生成统计汇总
            summary_data = self._generate_preparation_summary(report_data)
            
            # 更新进度
            self._update_task_progress(task_id, 80)
            
            # 生成文件
            if format_type == 'excel':
                file_path = self._generate_excel_report(
                    report_data, 
                    summary_data, 
                    '筹备进度报表', 
                    task_id
                )
            else:
                file_path = self._generate_pdf_report(
                    report_data, 
                    summary_data, 
                    '筹备进度报表', 
                    task_id
                )
            
            # 更新进度
            self._update_task_progress(task_id, 90)
            
            self.logger.info(f"筹备进度报表生成完成，文件路径: {file_path}")
            return file_path
            
        except Exception as e:
            self.logger.error(f"生成筹备进度报表失败: {e}")
            raise
    
    def generate_assets_report(self, filters: Dict, format_type: str, task_id: str) -> str:
        """
        生成门店资产报表
        
        Args:
            filters: 筛选条件
            format_type: 导出格式
            task_id: 任务ID
            
        Returns:
            生成的文件路径
        """
        try:
            self.logger.info(f"开始生成门店资产报表，任务ID: {task_id}")
            
            # 更新进度
            self._update_task_progress(task_id, 20)
            
            # 由于资产管理模块可能还未完全实现，这里创建一个基础的示例报表
            # 实际实现时需要根据具体的资产模型进行调整
            
            from store_archive.models import StoreProfile
            
            queryset = StoreProfile.objects.select_related('business_region')
            
            # 应用筛选条件
            queryset = self._apply_assets_filters(queryset, filters)
            
            # 更新进度
            self._update_task_progress(task_id, 40)
            
            # 准备报表数据（示例数据结构）
            report_data = []
            for store in queryset:
                # 这里是示例数据，实际应该从资产管理模块获取
                report_data.append({
                    '门店编码': store.store_code,
                    '门店名称': store.store_name,
                    '业务区域': store.business_region.name,
                    '门店状态': store.get_status_display(),
                    '资产类型': '设备资产',  # 示例
                    '资产名称': 'POS机',    # 示例
                    '资产数量': 2,          # 示例
                    '单价(元)': 3000,       # 示例
                    '总价值(元)': 6000,     # 示例
                    '资产状态': '正常',     # 示例
                    '购置日期': store.opening_date.strftime('%Y-%m-%d') if store.opening_date else '',
                    '最后盘点日期': '',     # 示例
                    '备注': '示例资产数据',
                })
            
            # 更新进度
            self._update_task_progress(task_id, 60)
            
            # 生成统计汇总
            summary_data = self._generate_assets_summary(report_data)
            
            # 更新进度
            self._update_task_progress(task_id, 80)
            
            # 生成文件
            if format_type == 'excel':
                file_path = self._generate_excel_report(
                    report_data, 
                    summary_data, 
                    '门店资产报表', 
                    task_id
                )
            else:
                file_path = self._generate_pdf_report(
                    report_data, 
                    summary_data, 
                    '门店资产报表', 
                    task_id
                )
            
            # 更新进度
            self._update_task_progress(task_id, 90)
            
            self.logger.info(f"门店资产报表生成完成，文件路径: {file_path}")
            return file_path
            
        except Exception as e:
            self.logger.error(f"生成门店资产报表失败: {e}")
            raise
    
    def _update_task_progress(self, task_id: str, progress: int) -> None:
        """更新任务进度"""
        try:
            from .models import ReportTask
            ReportTask.objects.filter(task_id=task_id).update(progress=progress)
        except Exception as e:
            self.logger.warning(f"更新任务进度失败: {e}")
    
    def _apply_plan_filters(self, queryset, filters: Dict):
        """应用开店计划筛选条件"""
        if filters.get('date_range'):
            start_date, end_date = filters['date_range'].split(',')
            queryset = queryset.filter(
                start_date__gte=start_date,
                end_date__lte=end_date
            )
        
        if filters.get('regions'):
            queryset = queryset.filter(
                regional_plans__region__id__in=filters['regions']
            )
        
        if filters.get('store_types'):
            queryset = queryset.filter(
                regional_plans__store_type__id__in=filters['store_types']
            )
        
        if filters.get('statuses'):
            queryset = queryset.filter(status__in=filters['statuses'])
        
        return queryset.distinct()
    
    def _apply_follow_up_filters(self, queryset, filters: Dict):
        """应用跟进筛选条件"""
        if filters.get('date_range'):
            start_date, end_date = filters['date_range'].split(',')
            queryset = queryset.filter(
                created_at__date__range=[start_date, end_date]
            )
        
        if filters.get('regions'):
            queryset = queryset.filter(
                location__business_region__id__in=filters['regions']
            )
        
        if filters.get('statuses'):
            queryset = queryset.filter(status__in=filters['statuses'])
        
        if filters.get('assigned_users'):
            queryset = queryset.filter(assigned_to__id__in=filters['assigned_users'])
        
        return queryset
    
    def _apply_preparation_filters(self, queryset, filters: Dict):
        """应用筹备筛选条件"""
        if filters.get('date_range'):
            start_date, end_date = filters['date_range'].split(',')
            queryset = queryset.filter(
                construction_start_date__range=[start_date, end_date]
            )
        
        if filters.get('regions'):
            queryset = queryset.filter(
                follow_up_record__location__business_region__id__in=filters['regions']
            )
        
        if filters.get('statuses'):
            queryset = queryset.filter(status__in=filters['statuses'])
        
        return queryset
    
    def _apply_assets_filters(self, queryset, filters: Dict):
        """应用资产筛选条件"""
        if filters.get('regions'):
            queryset = queryset.filter(
                business_region__id__in=filters['regions']
            )
        
        if filters.get('store_types'):
            queryset = queryset.filter(store_type__in=filters['store_types'])
        
        return queryset
    
    def _generate_plan_summary(self, report_data: List[Dict]) -> Dict:
        """生成开店计划统计汇总"""
        if not report_data:
            return {}
        
        total_target = sum(item['目标数量'] for item in report_data)
        total_completed = sum(item['完成数量'] for item in report_data)
        avg_completion_rate = sum(item['完成率(%)'] for item in report_data) / len(report_data)
        
        return {
            '总计划数': len(report_data),
            '总目标数量': total_target,
            '总完成数量': total_completed,
            '平均完成率(%)': round(avg_completion_rate, 2),
            '整体完成率(%)': round((total_completed / total_target * 100), 2) if total_target > 0 else 0,
        }
    
    def _generate_follow_up_summary(self, report_data: List[Dict]) -> Dict:
        """生成跟进统计汇总"""
        if not report_data:
            return {}
        
        total_count = len(report_data)
        overdue_count = sum(1 for item in report_data if item['是否超期'] == '是')
        avg_follow_up_days = sum(item['跟进天数'] for item in report_data) / total_count
        avg_roi = sum(item['预计ROI(%)'] for item in report_data) / total_count
        
        return {
            '总跟进数': total_count,
            '超期数量': overdue_count,
            '超期率(%)': round((overdue_count / total_count * 100), 2) if total_count > 0 else 0,
            '平均跟进天数': round(avg_follow_up_days, 1),
            '平均预计ROI(%)': round(avg_roi, 2),
        }
    
    def _generate_preparation_summary(self, report_data: List[Dict]) -> Dict:
        """生成筹备统计汇总"""
        if not report_data:
            return {}
        
        total_count = len(report_data)
        delayed_count = sum(1 for item in report_data if item['是否延期'] == '是')
        completed_count = sum(1 for item in report_data if item['工程状态'] == '已完成')
        avg_progress = sum(item['工程进度(%)'] for item in report_data) / total_count
        
        return {
            '总工程数': total_count,
            '已完成数': completed_count,
            '延期数量': delayed_count,
            '延期率(%)': round((delayed_count / total_count * 100), 2) if total_count > 0 else 0,
            '按时完工率(%)': round(((total_count - delayed_count) / total_count * 100), 2) if total_count > 0 else 0,
            '平均工程进度(%)': round(avg_progress, 2),
        }
    
    def _generate_assets_summary(self, report_data: List[Dict]) -> Dict:
        """生成资产统计汇总"""
        if not report_data:
            return {}
        
        total_count = sum(item['资产数量'] for item in report_data)
        total_value = sum(item['总价值(元)'] for item in report_data)
        store_count = len(set(item['门店编码'] for item in report_data))
        
        return {
            '涉及门店数': store_count,
            '资产总数量': total_count,
            '资产总价值(元)': total_value,
            '平均单店资产价值(元)': round(total_value / store_count, 2) if store_count > 0 else 0,
        }
    
    def _check_follow_up_overdue(self, record) -> bool:
        """检查跟进是否超期"""
        # 简单的超期判断逻辑：超过30天未更新状态
        days_since_update = (timezone.now().date() - record.updated_at.date()).days
        return days_since_update > 30
    
    def _get_profit_calculation_data(self, profit_calc) -> Dict:
        """获取盈利测算数据"""
        if not profit_calc:
            return {
                'total_investment': 0,
                'annual_revenue': 0,
                'roi': 0,
                'payback_period': 0,
            }
        
        return {
            'total_investment': float(profit_calc.total_investment / 10000),  # 转换为万元
            'annual_revenue': float(profit_calc.annual_revenue / 10000),      # 转换为万元
            'roi': float(profit_calc.roi),
            'payback_period': float(profit_calc.payback_period),
        }
    
    def _calculate_construction_progress(self, order) -> Dict:
        """计算工程进度"""
        if not order.milestones.exists():
            return {'progress': 0, 'delay_days': 0}
        
        total_milestones = order.milestones.count()
        completed_milestones = order.milestones.filter(status='completed').count()
        progress = (completed_milestones / total_milestones * 100) if total_milestones > 0 else 0
        
        # 计算延期天数
        delay_days = 0
        if order.construction_end_date and order.actual_end_date:
            delay_days = (order.actual_end_date - order.construction_end_date).days
        elif order.construction_end_date and not order.actual_end_date:
            delay_days = (timezone.now().date() - order.construction_end_date).days
            delay_days = max(0, delay_days)  # 只计算正延期
        
        return {
            'progress': round(progress, 2),
            'delay_days': delay_days,
        }
    
    def _check_construction_delay(self, order) -> bool:
        """检查工程是否延期"""
        if not order.construction_end_date:
            return False
        
        if order.actual_end_date:
            return order.actual_end_date > order.construction_end_date
        else:
            return timezone.now().date() > order.construction_end_date
    
    def _get_delivery_status(self, order) -> Dict:
        """获取交付状态"""
        if not hasattr(order, 'delivery_checklist') or not order.delivery_checklist:
            return {'status': '未创建', 'completion_rate': 0}
        
        checklist = order.delivery_checklist
        if not checklist.delivery_items:
            return {'status': checklist.get_status_display(), 'completion_rate': 0}
        
        total_items = len(checklist.delivery_items)
        completed_items = sum(1 for item in checklist.delivery_items if item.get('status') == 'completed')
        completion_rate = (completed_items / total_items * 100) if total_items > 0 else 0
        
        return {
            'status': checklist.get_status_display(),
            'completion_rate': round(completion_rate, 2),
        }
    
    def _generate_excel_report(self, data: List[Dict], summary: Dict, title: str, task_id: str) -> str:
        """生成Excel报表"""
        import pandas as pd
        import os
        from django.conf import settings
        
        # 创建报表目录
        reports_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        # 生成文件名
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{title}_{timestamp}_{task_id[:8]}.xlsx"
        file_path = os.path.join(reports_dir, filename)
        
        # 创建Excel写入器
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            # 写入主数据
            if data:
                df = pd.DataFrame(data)
                df.to_excel(writer, sheet_name='报表数据', index=False)
            
            # 写入统计汇总
            if summary:
                summary_df = pd.DataFrame([summary])
                summary_df.to_excel(writer, sheet_name='统计汇总', index=False)
        
        return file_path
    
    def _generate_pdf_report(self, data: List[Dict], summary: Dict, title: str, task_id: str) -> str:
        """生成PDF报表"""
        # PDF生成功能需要额外的库支持，这里先返回Excel格式
        # 实际实现时可以使用reportlab或weasyprint等库
        self.logger.warning("PDF格式暂不支持，将生成Excel格式")
        return self._generate_excel_report(data, summary, title, task_id)