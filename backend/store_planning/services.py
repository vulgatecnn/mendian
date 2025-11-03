"""
开店计划管理业务逻辑服务
"""

from django.db import transaction, models
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta
from typing import Dict, List, Optional, Tuple
from .models import (
    StorePlan, RegionalPlan, PlanExecutionLog, PlanApproval,
    BusinessRegion, StoreType
)
from .query_optimization import QueryOptimizer, ComplexQueryOptimizer
from .cache_service import (
    CacheService, PlanCacheManager, DashboardCacheManager,
    StatisticsCacheManager, BaseDataCacheManager
)


class PlanValidationService:
    """计划数据验证服务"""
    
    @staticmethod
    def validate_plan_dates(start_date, end_date) -> None:
        """验证计划日期范围"""
        if start_date >= end_date:
            raise ValidationError("结束日期必须晚于开始日期")
    
    @staticmethod
    def validate_contribution_rates(regional_plans_data: List[Dict]) -> None:
        """验证贡献率总和不超过100%"""
        total_contribution_rate = Decimal('0.00')
        
        for regional_plan in regional_plans_data:
            contribution_rate = regional_plan.get('contribution_rate')
            if contribution_rate is not None:
                total_contribution_rate += Decimal(str(contribution_rate))
        
        if total_contribution_rate > 100:
            raise ValidationError(
                f"总贡献率不能超过100%，当前为{total_contribution_rate}%"
            )
    
    @staticmethod
    def validate_region_store_combinations(regional_plans_data: List[Dict]) -> None:
        """验证区域和门店类型组合的唯一性"""
        combinations = set()
        
        for regional_plan in regional_plans_data:
            region_id = regional_plan.get('region_id') or regional_plan.get('region')
            store_type_id = regional_plan.get('store_type_id') or regional_plan.get('store_type')
            
            if hasattr(region_id, 'id'):
                region_id = region_id.id
            if hasattr(store_type_id, 'id'):
                store_type_id = store_type_id.id
                
            combination = (region_id, store_type_id)
            
            if combination in combinations:
                raise ValidationError("同一区域和门店类型的组合不能重复")
            combinations.add(combination)
    
    @staticmethod
    def validate_plan_status_transition(current_status: str, target_status: str) -> None:
        """验证计划状态转换的合法性"""
        valid_transitions = {
            'draft': ['published', 'cancelled'],
            'published': ['executing', 'cancelled'],
            'executing': ['completed', 'cancelled'],
            'completed': [],  # 已完成的计划不能再转换状态
            'cancelled': []   # 已取消的计划不能再转换状态
        }
        
        if target_status not in valid_transitions.get(current_status, []):
            raise ValidationError(
                f"计划状态不能从'{current_status}'转换为'{target_status}'"
            )


class PlanBusinessService:
    """计划业务逻辑服务"""
    
    def __init__(self):
        self.validation_service = PlanValidationService()
    
    @transaction.atomic
    def create_plan(self, plan_data: Dict, regional_plans_data: List[Dict], created_by) -> StorePlan:
        """创建开店计划"""
        # 数据验证
        self.validation_service.validate_plan_dates(
            plan_data['start_date'], 
            plan_data['end_date']
        )
        self.validation_service.validate_contribution_rates(regional_plans_data)
        self.validation_service.validate_region_store_combinations(regional_plans_data)
        
        # 创建主计划
        plan = StorePlan.objects.create(
            created_by=created_by,
            **plan_data
        )
        
        # 创建区域计划并计算汇总数据
        total_target_count = 0
        total_budget_amount = Decimal('0.00')
        
        for regional_plan_data in regional_plans_data:
            regional_plan = RegionalPlan.objects.create(
                plan=plan,
                **regional_plan_data
            )
            total_target_count += regional_plan.target_count
            total_budget_amount += regional_plan.budget_amount
        
        # 更新计划汇总数据
        plan.total_target_count = total_target_count
        plan.total_budget_amount = total_budget_amount
        plan.save(update_fields=['total_target_count', 'total_budget_amount'])
        
        # 记录执行日志
        self._log_plan_action(
            plan=plan,
            action_type='plan_created',
            description=f'创建计划：{plan.name}',
            user=created_by
        )
        
        return plan
    
    @transaction.atomic
    def update_plan(self, plan: StorePlan, plan_data: Dict, 
                   regional_plans_data: Optional[List[Dict]] = None, 
                   updated_by=None) -> StorePlan:
        """更新开店计划"""
        # 验证计划状态
        if plan.status not in ['draft']:
            raise ValidationError("只有草稿状态的计划才能修改")
        
        # 数据验证
        start_date = plan_data.get('start_date', plan.start_date)
        end_date = plan_data.get('end_date', plan.end_date)
        self.validation_service.validate_plan_dates(start_date, end_date)
        
        if regional_plans_data is not None:
            self.validation_service.validate_contribution_rates(regional_plans_data)
            self.validation_service.validate_region_store_combinations(regional_plans_data)
        
        # 更新主计划
        for field, value in plan_data.items():
            setattr(plan, field, value)
        plan.save()
        
        # 如果提供了区域计划数据，重新创建区域计划
        if regional_plans_data is not None:
            # 删除现有区域计划
            plan.regional_plans.all().delete()
            
            # 创建新的区域计划
            total_target_count = 0
            total_budget_amount = Decimal('0.00')
            
            for regional_plan_data in regional_plans_data:
                regional_plan = RegionalPlan.objects.create(
                    plan=plan,
                    **regional_plan_data
                )
                total_target_count += regional_plan.target_count
                total_budget_amount += regional_plan.budget_amount
            
            # 更新计划汇总数据
            plan.total_target_count = total_target_count
            plan.total_budget_amount = total_budget_amount
            plan.save(update_fields=['total_target_count', 'total_budget_amount'])
        
        # 记录执行日志
        self._log_plan_action(
            plan=plan,
            action_type='plan_updated',
            description=f'更新计划：{plan.name}',
            user=updated_by
        )
        
        return plan
    
    @transaction.atomic
    def publish_plan(self, plan: StorePlan, published_by=None) -> StorePlan:
        """发布计划"""
        # 验证状态转换
        self.validation_service.validate_plan_status_transition(
            plan.status, 'published'
        )
        
        # 验证计划数据完整性
        if not plan.regional_plans.exists():
            raise ValidationError("计划必须包含至少一个区域计划才能发布")
        
        # 更新状态
        plan.status = 'published'
        plan.published_at = timezone.now()
        plan.save(update_fields=['status', 'published_at'])
        
        # 记录执行日志
        self._log_plan_action(
            plan=plan,
            action_type='plan_published',
            description=f'发布计划：{plan.name}',
            user=published_by
        )
        
        return plan
    
    @transaction.atomic
    def cancel_plan(self, plan: StorePlan, cancel_reason: str, cancelled_by=None) -> StorePlan:
        """取消计划"""
        # 验证状态转换
        self.validation_service.validate_plan_status_transition(
            plan.status, 'cancelled'
        )
        
        if not cancel_reason.strip():
            raise ValidationError("取消计划必须提供取消原因")
        
        # 更新状态
        plan.status = 'cancelled'
        plan.cancelled_at = timezone.now()
        plan.cancel_reason = cancel_reason.strip()
        plan.save(update_fields=['status', 'cancelled_at', 'cancel_reason'])
        
        # 记录执行日志
        self._log_plan_action(
            plan=plan,
            action_type='plan_cancelled',
            description=f'取消计划：{plan.name}，原因：{cancel_reason}',
            user=cancelled_by
        )
        
        return plan
    
    @transaction.atomic
    def start_execution(self, plan: StorePlan, started_by=None) -> StorePlan:
        """开始执行计划"""
        # 验证状态转换
        self.validation_service.validate_plan_status_transition(
            plan.status, 'executing'
        )
        
        # 检查计划是否已到开始时间
        if plan.start_date > timezone.now().date():
            raise ValidationError("计划尚未到开始时间，不能开始执行")
        
        # 更新状态
        plan.status = 'executing'
        plan.save(update_fields=['status'])
        
        # 记录执行日志
        self._log_plan_action(
            plan=plan,
            action_type='plan_started',
            description=f'开始执行计划：{plan.name}',
            user=started_by
        )
        
        return plan
    
    @transaction.atomic
    def complete_plan(self, plan: StorePlan, completed_by=None) -> StorePlan:
        """完成计划"""
        # 验证状态转换
        self.validation_service.validate_plan_status_transition(
            plan.status, 'completed'
        )
        
        # 更新状态
        plan.status = 'completed'
        plan.save(update_fields=['status'])
        
        # 记录执行日志
        self._log_plan_action(
            plan=plan,
            action_type='plan_completed',
            description=f'完成计划：{plan.name}',
            user=completed_by
        )
        
        return plan
    
    def _log_plan_action(self, plan: StorePlan, action_type: str, 
                        description: str, user=None, 
                        regional_plan: Optional[RegionalPlan] = None,
                        store_id: Optional[int] = None,
                        previous_count: Optional[int] = None,
                        current_count: Optional[int] = None) -> PlanExecutionLog:
        """记录计划操作日志"""
        return PlanExecutionLog.objects.create(
            plan=plan,
            regional_plan=regional_plan,
            store_id=store_id,
            action_type=action_type,
            action_description=description,
            previous_count=previous_count,
            current_count=current_count,
            created_by=user
        )


class PlanProgressService:
    """计划进度管理服务"""
    
    def __init__(self):
        self.business_service = PlanBusinessService()
    
    @transaction.atomic
    def update_progress(self, regional_plan: RegionalPlan, 
                       new_completed_count: int, updated_by=None) -> RegionalPlan:
        """更新区域计划进度"""
        if new_completed_count < 0:
            raise ValidationError("完成数量不能为负数")
        
        if new_completed_count > regional_plan.target_count:
            raise ValidationError("完成数量不能超过目标数量")
        
        previous_count = regional_plan.completed_count
        regional_plan.completed_count = new_completed_count
        regional_plan.save(update_fields=['completed_count'])
        
        # 更新主计划的汇总数据
        self._update_plan_totals(regional_plan.plan)
        
        # 记录执行日志
        self.business_service._log_plan_action(
            plan=regional_plan.plan,
            regional_plan=regional_plan,
            action_type='progress_updated',
            description=f'更新进度：{regional_plan.region.name}-{regional_plan.store_type.name}，'
                       f'从{previous_count}更新为{new_completed_count}',
            user=updated_by,
            previous_count=previous_count,
            current_count=new_completed_count
        )
        
        # 检查是否需要自动完成计划
        self._check_auto_complete_plan(regional_plan.plan)
        
        return regional_plan
    
    @transaction.atomic
    def record_store_opening(self, regional_plan: RegionalPlan, 
                           store_id: int, updated_by=None) -> RegionalPlan:
        """记录门店开业（自动更新进度）"""
        new_completed_count = regional_plan.completed_count + 1
        
        if new_completed_count > regional_plan.target_count:
            raise ValidationError("完成数量不能超过目标数量")
        
        previous_count = regional_plan.completed_count
        regional_plan.completed_count = new_completed_count
        regional_plan.save(update_fields=['completed_count'])
        
        # 更新主计划的汇总数据
        self._update_plan_totals(regional_plan.plan)
        
        # 记录执行日志
        self.business_service._log_plan_action(
            plan=regional_plan.plan,
            regional_plan=regional_plan,
            store_id=store_id,
            action_type='store_opened',
            description=f'门店开业：{regional_plan.region.name}-{regional_plan.store_type.name}，'
                       f'进度从{previous_count}更新为{new_completed_count}',
            user=updated_by,
            previous_count=previous_count,
            current_count=new_completed_count
        )
        
        # 检查是否需要自动完成计划
        self._check_auto_complete_plan(regional_plan.plan)
        
        return regional_plan
    
    def _update_plan_totals(self, plan: StorePlan) -> None:
        """更新计划的汇总数据"""
        total_completed = sum(
            rp.completed_count for rp in plan.regional_plans.all()
        )
        
        plan.total_completed_count = total_completed
        plan.save(update_fields=['total_completed_count'])
    
    def _check_auto_complete_plan(self, plan: StorePlan) -> None:
        """检查是否需要自动完成计划"""
        if (plan.status == 'executing' and 
            plan.total_completed_count >= plan.total_target_count):
            
            # 自动完成计划
            self.business_service.complete_plan(plan)

    def get_plan_progress(self, plan: StorePlan) -> Dict:
        """获取计划执行进度详情"""
        regional_plans = plan.regional_plans.select_related('region', 'store_type')
        
        progress_data = {
            'plan_id': plan.id,
            'plan_name': plan.name,
            'plan_status': plan.status,
            'overall_progress': {
                'total_target': plan.total_target_count,
                'total_completed': plan.total_completed_count,
                'completion_rate': plan.completion_rate,
                'remaining_count': plan.total_target_count - plan.total_completed_count
            },
            'regional_progress': [],
            'progress_trend': self._get_progress_trend(plan),
            'completion_forecast': self._calculate_completion_forecast(plan)
        }
        
        # 区域进度详情
        for rp in regional_plans:
            regional_progress = {
                'regional_plan_id': rp.id,
                'region_name': rp.region.name,
                'region_code': rp.region.code,
                'store_type_name': rp.store_type.name,
                'store_type_code': rp.store_type.code,
                'target_count': rp.target_count,
                'completed_count': rp.completed_count,
                'completion_rate': rp.completion_rate,
                'remaining_count': rp.target_count - rp.completed_count,
                'contribution_rate': float(rp.contribution_rate) if rp.contribution_rate else None,
                'budget_amount': float(rp.budget_amount),
                'is_on_track': self._is_regional_plan_on_track(rp),
                'progress_status': self._get_regional_progress_status(rp)
            }
            progress_data['regional_progress'].append(regional_progress)
        
        return progress_data

    def batch_update_progress(self, plan: StorePlan, progress_updates: List[Dict], updated_by=None) -> StorePlan:
        """批量更新计划进度"""
        with transaction.atomic():
            for update in progress_updates:
                regional_plan_id = update.get('regional_plan_id')
                new_completed_count = update.get('completed_count')
                
                if not regional_plan_id or new_completed_count is None:
                    raise ValidationError("每个更新项必须包含regional_plan_id和completed_count")
                
                try:
                    regional_plan = RegionalPlan.objects.get(
                        id=regional_plan_id, plan=plan
                    )
                    self.update_progress(regional_plan, new_completed_count, updated_by)
                except RegionalPlan.DoesNotExist:
                    raise ValidationError(f"区域计划ID {regional_plan_id} 不存在")
        
        plan.refresh_from_db()
        return plan

    def get_all_plans_progress_summary(self, user=None) -> Dict:
        """获取所有计划的进度汇总（使用优化查询）"""
        # 使用优化后的进度汇总查询
        plans_query = QueryOptimizer.get_plan_progress_summary_queryset()
        
        # 如果需要按用户过滤
        if user and not user.is_superuser:
            # 根据实际权限逻辑过滤
            pass
        
        summary_data = {
            'total_plans': plans_query.count(),
            'executing_plans': plans_query.filter(status='executing').count(),
            'completed_plans': plans_query.filter(status='completed').count(),
            'overall_statistics': {
                'total_target': 0,
                'total_completed': 0,
                'completion_rate': 0
            },
            'plans_summary': [],
            'alerts': []
        }
        
        total_target = 0
        total_completed = 0
        
        for plan in plans_query:
            days_remaining = (plan.end_date - timezone.now().date()).days if plan.end_date > timezone.now().date() else 0
            
            plan_summary = {
                'plan_id': plan.id,
                'plan_name': plan.name,
                'plan_status': plan.status,
                'target_count': plan.total_target_count,
                'completed_count': plan.total_completed_count,
                'completion_rate': plan.completion_rate,
                'start_date': plan.start_date,
                'end_date': plan.end_date,
                'created_by': plan.created_by.username if plan.created_by else None,
                'is_on_track': self._is_plan_on_track(plan),
                'days_remaining': days_remaining
            }
            
            summary_data['plans_summary'].append(plan_summary)
            total_target += plan.total_target_count
            total_completed += plan.total_completed_count
            
            # 检查预警条件
            if plan.status == 'executing':
                if plan.completion_rate < 30 and days_remaining < 30:
                    summary_data['alerts'].append({
                        'type': 'low_progress',
                        'plan_id': plan.id,
                        'plan_name': plan.name,
                        'message': f'计划"{plan.name}"进度较慢，完成率仅{plan.completion_rate}%，剩余{days_remaining}天'
                    })
                elif days_remaining < 0:
                    summary_data['alerts'].append({
                        'type': 'overdue',
                        'plan_id': plan.id,
                        'plan_name': plan.name,
                        'message': f'计划"{plan.name}"已超期{abs(days_remaining)}天'
                    })
        
        # 计算总体完成率
        if total_target > 0:
            summary_data['overall_statistics'] = {
                'total_target': total_target,
                'total_completed': total_completed,
                'completion_rate': round((total_completed / total_target) * 100, 2)
            }
        
        return summary_data

    def _get_progress_trend(self, plan: StorePlan) -> List[Dict]:
        """获取进度趋势数据（最近30天）"""
        from datetime import datetime, timedelta
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        # 获取执行日志中的进度更新记录
        logs = PlanExecutionLog.objects.filter(
            plan=plan,
            action_type__in=['store_opened', 'progress_updated'],
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).order_by('created_at')
        
        trend_data = []
        current_date = start_date
        cumulative_count = 0
        
        # 获取起始累计数量
        initial_logs = PlanExecutionLog.objects.filter(
            plan=plan,
            action_type__in=['store_opened', 'progress_updated'],
            created_at__date__lt=start_date
        ).order_by('-created_at')
        
        if initial_logs.exists():
            cumulative_count = initial_logs.first().current_count or 0
        
        # 按日期生成趋势数据
        while current_date <= end_date:
            day_logs = logs.filter(created_at__date=current_date)
            day_increment = 0
            
            for log in day_logs:
                if log.current_count and log.previous_count:
                    day_increment += (log.current_count - log.previous_count)
                elif log.action_type == 'store_opened':
                    day_increment += 1
            
            cumulative_count += day_increment
            
            trend_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'daily_increment': day_increment,
                'cumulative_count': cumulative_count
            })
            
            current_date += timedelta(days=1)
        
        return trend_data

    def _calculate_completion_forecast(self, plan: StorePlan) -> Dict:
        """计算完成预测"""
        if plan.status != 'executing':
            return {'forecast_available': False}
        
        # 计算平均日进度
        days_elapsed = (timezone.now().date() - plan.start_date).days
        if days_elapsed <= 0:
            return {'forecast_available': False}
        
        daily_average = plan.total_completed_count / days_elapsed
        remaining_count = plan.total_target_count - plan.total_completed_count
        
        if daily_average <= 0:
            return {
                'forecast_available': True,
                'forecast_completion_date': None,
                'days_to_completion': None,
                'is_on_schedule': False,
                'message': '当前进度为零，无法预测完成时间'
            }
        
        days_to_completion = remaining_count / daily_average
        forecast_date = timezone.now().date() + timedelta(days=int(days_to_completion))
        is_on_schedule = forecast_date <= plan.end_date
        
        return {
            'forecast_available': True,
            'forecast_completion_date': forecast_date.strftime('%Y-%m-%d'),
            'days_to_completion': int(days_to_completion),
            'is_on_schedule': is_on_schedule,
            'daily_average_progress': round(daily_average, 2),
            'message': f'按当前进度预计{int(days_to_completion)}天后完成' if is_on_schedule else f'按当前进度将延期{(forecast_date - plan.end_date).days}天'
        }

    def _is_regional_plan_on_track(self, regional_plan: RegionalPlan) -> bool:
        """判断区域计划是否按计划进行"""
        plan = regional_plan.plan
        if plan.status != 'executing':
            return True
        
        # 计算应有的进度
        total_days = (plan.end_date - plan.start_date).days
        elapsed_days = (timezone.now().date() - plan.start_date).days
        
        if total_days <= 0 or elapsed_days <= 0:
            return True
        
        expected_progress = (elapsed_days / total_days) * 100
        actual_progress = regional_plan.completion_rate
        
        # 允许10%的偏差
        return actual_progress >= (expected_progress - 10)

    def _get_regional_progress_status(self, regional_plan: RegionalPlan) -> str:
        """获取区域计划进度状态"""
        if regional_plan.completion_rate >= 100:
            return 'completed'
        elif regional_plan.completion_rate >= 80:
            return 'on_track'
        elif regional_plan.completion_rate >= 50:
            return 'moderate'
        elif regional_plan.completion_rate >= 20:
            return 'slow'
        else:
            return 'critical'

    def _is_plan_on_track(self, plan: StorePlan) -> bool:
        """判断计划是否按计划进行"""
        if plan.status == 'completed':
            return True
        elif plan.status != 'executing':
            return True
        
        # 计算应有的进度
        total_days = (plan.end_date - plan.start_date).days
        elapsed_days = (timezone.now().date() - plan.start_date).days
        
        if total_days <= 0 or elapsed_days <= 0:
            return True
        
        expected_progress = (elapsed_days / total_days) * 100
        actual_progress = plan.completion_rate
        
        # 允许15%的偏差
        return actual_progress >= (expected_progress - 15)


class PlanDashboardService:
    """计划仪表板数据服务"""
    
    def __init__(self):
        self.cache_timeout = 300  # 5分钟缓存
        self.cache_key_prefix = 'store_planning_dashboard'
    
    def get_dashboard_data(self, user=None, force_refresh=False) -> Dict:
        """获取仪表板数据（带缓存）"""
        if force_refresh:
            # 强制刷新时直接生成数据
            dashboard_data = self._generate_dashboard_data(user)
            # 更新缓存
            user_id = user.id if user else None
            DashboardCacheManager.get_dashboard_data(
                user_id,
                lambda: dashboard_data
            )
            return dashboard_data
        
        # 使用缓存管理器获取数据
        user_id = user.id if user else None
        return DashboardCacheManager.get_dashboard_data(
            user_id,
            lambda: self._generate_dashboard_data(user)
        )
    
    def get_dashboard_widgets(self, widget_type='all', time_range=30, user=None) -> Dict:
        """获取仪表板小部件数据（带缓存）"""
        user_id = user.id if user else None
        return DashboardCacheManager.get_dashboard_widgets(
            widget_type,
            time_range,
            user_id,
            lambda: self._generate_widgets_data(widget_type, time_range, user)
        )
    
    def get_realtime_metrics(self, user=None) -> Dict:
        """获取实时指标数据（不缓存）"""
        return self._generate_realtime_metrics(user)
    
    def refresh_dashboard_cache(self) -> None:
        """刷新仪表板缓存"""
        DashboardCacheManager.invalidate_dashboard()
    
    def _generate_dashboard_data(self, user=None) -> Dict:
        """生成仪表板数据"""
        # 基础统计
        total_plans = StorePlan.objects.count()
        executing_plans = StorePlan.objects.filter(status='executing')
        completed_plans = StorePlan.objects.filter(status='completed')
        
        # 执行中计划的汇总
        executing_summary = {
            'count': executing_plans.count(),
            'total_target': sum(p.total_target_count for p in executing_plans),
            'total_completed': sum(p.total_completed_count for p in executing_plans)
        }
        
        if executing_summary['total_target'] > 0:
            executing_summary['completion_rate'] = round(
                (executing_summary['total_completed'] / executing_summary['total_target']) * 100, 2
            )
        else:
            executing_summary['completion_rate'] = 0
        
        # 最近完成的计划
        recent_completed = completed_plans.order_by('-updated_at')[:5]
        
        # 预警信息
        alerts = self._get_dashboard_alerts()
        
        # 区域绩效概览
        regional_performance = self._get_regional_performance_overview()
        
        # 月度趋势
        monthly_trends = self._get_monthly_trends()
        
        return {
            'summary': {
                'total_plans': total_plans,
                'executing_plans': executing_plans.count(),
                'completed_plans': completed_plans.count(),
                'draft_plans': StorePlan.objects.filter(status='draft').count(),
                'cancelled_plans': StorePlan.objects.filter(status='cancelled').count()
            },
            'executing_summary': executing_summary,
            'recent_completed': [
                {
                    'id': p.id,
                    'name': p.name,
                    'completion_rate': p.completion_rate,
                    'completed_at': p.updated_at.strftime('%Y-%m-%d') if p.updated_at else None
                }
                for p in recent_completed
            ],
            'alerts': alerts,
            'regional_performance': regional_performance,
            'monthly_trends': monthly_trends,
            'last_updated': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def _generate_widgets_data(self, widget_type, time_range, user=None) -> Dict:
        """生成小部件数据"""
        widgets = {}
        
        if widget_type == 'all' or widget_type == 'progress_chart':
            widgets['progress_chart'] = self._get_progress_chart_data(time_range)
        
        if widget_type == 'all' or widget_type == 'regional_map':
            widgets['regional_map'] = self._get_regional_map_data()
        
        if widget_type == 'all' or widget_type == 'completion_funnel':
            widgets['completion_funnel'] = self._get_completion_funnel_data()
        
        if widget_type == 'all' or widget_type == 'performance_ranking':
            widgets['performance_ranking'] = self._get_performance_ranking_data()
        
        if widget_type == 'all' or widget_type == 'budget_overview':
            widgets['budget_overview'] = self._get_budget_overview_data()
        
        return {
            'widget_type': widget_type,
            'time_range': time_range,
            'widgets': widgets,
            'generated_at': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def _generate_realtime_metrics(self, user=None) -> Dict:
        """生成实时指标数据"""
        # 今日新增门店
        today = timezone.now().date()
        today_openings = PlanExecutionLog.objects.filter(
            action_type='store_opened',
            created_at__date=today
        ).count()
        
        # 本周新增门店
        week_start = today - timedelta(days=today.weekday())
        week_openings = PlanExecutionLog.objects.filter(
            action_type='store_opened',
            created_at__date__gte=week_start
        ).count()
        
        # 执行中计划的实时完成率
        executing_plans = StorePlan.objects.filter(status='executing')
        if executing_plans.exists():
            avg_completion_rate = sum(p.completion_rate for p in executing_plans) / executing_plans.count()
        else:
            avg_completion_rate = 0
        
        # 需要关注的计划数量
        attention_needed = executing_plans.filter(
            total_completed_count__lt=models.F('total_target_count') * 0.5
        ).count()
        
        return {
            'today_openings': today_openings,
            'week_openings': week_openings,
            'avg_completion_rate': round(avg_completion_rate, 2),
            'attention_needed_plans': attention_needed,
            'total_executing_plans': executing_plans.count(),
            'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def _get_dashboard_alerts(self) -> Dict:
        """获取仪表板预警信息"""
        alerts = {
            'critical': [],
            'warning': [],
            'info': []
        }
        
        executing_plans = StorePlan.objects.filter(status='executing')
        
        for plan in executing_plans:
            days_remaining = (plan.end_date - timezone.now().date()).days
            
            # 严重预警：超期或进度严重滞后
            if days_remaining < 0:
                alerts['critical'].append({
                    'type': 'overdue',
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'message': f'计划已超期{abs(days_remaining)}天'
                })
            elif plan.completion_rate < 20:
                alerts['critical'].append({
                    'type': 'low_progress',
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'message': f'进度严重滞后，完成率仅{plan.completion_rate}%'
                })
            
            # 警告：即将超期或进度偏慢
            elif days_remaining < 30 and plan.completion_rate < 70:
                alerts['warning'].append({
                    'type': 'time_pressure',
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'message': f'剩余{days_remaining}天，完成率{plan.completion_rate}%'
                })
            elif plan.completion_rate < 50:
                alerts['warning'].append({
                    'type': 'moderate_progress',
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'message': f'进度偏慢，完成率{plan.completion_rate}%'
                })
        
        # 信息提示：即将完成的计划
        near_completion = executing_plans.filter(
            total_completed_count__gte=models.F('total_target_count') * 0.9
        )
        
        for plan in near_completion:
            alerts['info'].append({
                'type': 'near_completion',
                'plan_id': plan.id,
                'plan_name': plan.name,
                'message': f'计划即将完成，完成率{plan.completion_rate}%'
            })
        
        return alerts
    
    def _get_regional_performance_overview(self) -> Dict:
        """获取区域绩效概览（使用优化查询）"""
        # 使用优化后的区域统计查询
        regional_stats_queryset = QueryOptimizer.get_regional_statistics_queryset()
        
        regional_stats = {}
        for stat in regional_stats_queryset:
            region_name = stat['region__name']
            regional_stats[region_name] = {
                'total_target': stat['total_target'],
                'total_completed': stat['total_completed'],
                'plans_count': stat['plan_count'],
                'completion_rate': (
                    round((stat['total_completed'] / stat['total_target']) * 100, 2)
                    if stat['total_target'] > 0 else 0
                )
            }
        
        # 按完成率排序，取前5名
        top_regions = sorted(
            regional_stats.items(),
            key=lambda x: x[1]['completion_rate'],
            reverse=True
        )[:5]
        
        return {
            'total_regions': len(regional_stats),
            'top_performing': [
                {
                    'region_name': region_name,
                    'completion_rate': stats['completion_rate'],
                    'total_target': stats['total_target'],
                    'total_completed': stats['total_completed']
                }
                for region_name, stats in top_regions
            ]
        }
    
    def _get_monthly_trends(self) -> Dict:
        """获取月度趋势数据"""
        # 获取最近12个月的数据
        monthly_data = []
        current_date = timezone.now().date().replace(day=1)
        
        for i in range(12):
            month_start = current_date.replace(month=current_date.month - i if current_date.month > i else current_date.month - i + 12,
                                             year=current_date.year if current_date.month > i else current_date.year - 1)
            
            # 获取该月的门店开业数量
            month_openings = PlanExecutionLog.objects.filter(
                action_type='store_opened',
                created_at__year=month_start.year,
                created_at__month=month_start.month
            ).count()
            
            monthly_data.append({
                'month': month_start.strftime('%Y-%m'),
                'openings': month_openings
            })
        
        # 反转列表，使其按时间顺序排列
        monthly_data.reverse()
        
        return {
            'data': monthly_data,
            'trend': self._calculate_trend(monthly_data)
        }
    
    def _get_progress_chart_data(self, time_range) -> Dict:
        """获取进度图表数据"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=time_range)
        
        # 按日统计门店开业数量
        daily_data = []
        current_date = start_date
        
        while current_date <= end_date:
            daily_openings = PlanExecutionLog.objects.filter(
                action_type='store_opened',
                created_at__date=current_date
            ).count()
            
            daily_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'openings': daily_openings
            })
            
            current_date += timedelta(days=1)
        
        return {
            'time_range': time_range,
            'daily_data': daily_data,
            'total_openings': sum(d['openings'] for d in daily_data)
        }
    
    def _get_regional_map_data(self) -> Dict:
        """获取区域地图数据"""
        regional_data = []
        
        regions = BusinessRegion.objects.filter(is_active=True)
        for region in regions:
            # 获取该区域的执行中计划统计
            regional_plans = RegionalPlan.objects.filter(
                region=region,
                plan__status='executing'
            )
            
            total_target = sum(rp.target_count for rp in regional_plans)
            total_completed = sum(rp.completed_count for rp in regional_plans)
            completion_rate = (total_completed / total_target * 100) if total_target > 0 else 0
            
            regional_data.append({
                'region_id': region.id,
                'region_name': region.name,
                'region_code': region.code,
                'total_target': total_target,
                'total_completed': total_completed,
                'completion_rate': round(completion_rate, 2),
                'plans_count': regional_plans.count()
            })
        
        return {
            'regions': regional_data,
            'legend': {
                'high_performance': '完成率 >= 80%',
                'medium_performance': '完成率 50-79%',
                'low_performance': '完成率 < 50%'
            }
        }
    
    def _get_completion_funnel_data(self) -> Dict:
        """获取完成漏斗数据"""
        # 统计各状态的计划数量
        status_counts = {}
        for status, _ in StorePlan.STATUS_CHOICES:
            status_counts[status] = StorePlan.objects.filter(status=status).count()
        
        # 构建漏斗数据
        funnel_data = [
            {'stage': '草稿', 'count': status_counts.get('draft', 0), 'status': 'draft'},
            {'stage': '已发布', 'count': status_counts.get('published', 0), 'status': 'published'},
            {'stage': '执行中', 'count': status_counts.get('executing', 0), 'status': 'executing'},
            {'stage': '已完成', 'count': status_counts.get('completed', 0), 'status': 'completed'}
        ]
        
        return {
            'funnel_data': funnel_data,
            'cancelled_count': status_counts.get('cancelled', 0),
            'total_plans': sum(status_counts.values())
        }
    
    def _get_performance_ranking_data(self) -> Dict:
        """获取绩效排名数据"""
        executing_plans = StorePlan.objects.filter(status='executing').select_related('created_by')
        
        # 按完成率排序
        top_performers = sorted(
            executing_plans,
            key=lambda p: p.completion_rate,
            reverse=True
        )[:10]
        
        ranking_data = []
        for i, plan in enumerate(top_performers, 1):
            ranking_data.append({
                'rank': i,
                'plan_id': plan.id,
                'plan_name': plan.name,
                'completion_rate': plan.completion_rate,
                'target_count': plan.total_target_count,
                'completed_count': plan.total_completed_count,
                'created_by': plan.created_by.username if plan.created_by else None
            })
        
        return {
            'top_performers': ranking_data,
            'total_executing_plans': executing_plans.count()
        }
    
    def _get_budget_overview_data(self) -> Dict:
        """获取预算概览数据"""
        executing_plans = StorePlan.objects.filter(status='executing')
        
        total_budget = sum(p.total_budget_amount for p in executing_plans)
        
        # 按区域统计预算分布
        regional_budget = {}
        for plan in executing_plans.prefetch_related('regional_plans__region'):
            for rp in plan.regional_plans.all():
                region_name = rp.region.name
                if region_name not in regional_budget:
                    regional_budget[region_name] = 0
                regional_budget[region_name] += float(rp.budget_amount)
        
        return {
            'total_budget': float(total_budget),
            'regional_distribution': [
                {'region': region, 'budget': budget}
                for region, budget in regional_budget.items()
            ],
            'currency': 'CNY'
        }
    
    def _calculate_trend(self, monthly_data) -> str:
        """计算趋势方向"""
        if len(monthly_data) < 2:
            return 'stable'
        
        recent_avg = sum(d['openings'] for d in monthly_data[-3:]) / 3
        earlier_avg = sum(d['openings'] for d in monthly_data[-6:-3]) / 3
        
        if recent_avg > earlier_avg * 1.1:
            return 'increasing'
        elif recent_avg < earlier_avg * 0.9:
            return 'decreasing'
        else:
            return 'stable'
    
    def _get_from_cache(self, cache_key):
        """从缓存获取数据"""
        try:
            from django.core.cache import cache
            return cache.get(cache_key)
        except:
            return None
    
    def _set_cache(self, cache_key, data):
        """设置缓存数据"""
        try:
            from django.core.cache import cache
            cache.set(cache_key, data, self.cache_timeout)
        except:
            pass


class PlanStatisticsService:
    """计划统计分析服务"""
    
    def __init__(self):
        self.dashboard_service = PlanDashboardService()
    
    def get_plan_statistics(self, plan: StorePlan) -> Dict:
        """获取计划统计数据（带缓存）"""
        return PlanCacheManager.get_plan_statistics(
            plan.id,
            lambda: self._calculate_plan_statistics(plan)
        )
    
    def _calculate_plan_statistics(self, plan: StorePlan) -> Dict:
        """计算计划统计数据（内部方法）"""
        regional_plans = plan.regional_plans.select_related('region', 'store_type')
        
        statistics = {
            'overall': {
                'total_target': plan.total_target_count,
                'total_completed': plan.total_completed_count,
                'completion_rate': plan.completion_rate,
                'total_budget': float(plan.total_budget_amount)
            },
            'by_region': {},
            'by_store_type': {},
            'regional_details': []
        }
        
        # 按区域统计
        region_stats = {}
        store_type_stats = {}
        
        for rp in regional_plans:
            region_name = rp.region.name
            store_type_name = rp.store_type.name
            
            # 区域统计
            if region_name not in region_stats:
                region_stats[region_name] = {
                    'target_count': 0,
                    'completed_count': 0,
                    'budget_amount': 0
                }
            
            region_stats[region_name]['target_count'] += rp.target_count
            region_stats[region_name]['completed_count'] += rp.completed_count
            region_stats[region_name]['budget_amount'] += float(rp.budget_amount)
            
            # 门店类型统计
            if store_type_name not in store_type_stats:
                store_type_stats[store_type_name] = {
                    'target_count': 0,
                    'completed_count': 0,
                    'budget_amount': 0
                }
            
            store_type_stats[store_type_name]['target_count'] += rp.target_count
            store_type_stats[store_type_name]['completed_count'] += rp.completed_count
            store_type_stats[store_type_name]['budget_amount'] += float(rp.budget_amount)
            
            # 区域详情
            statistics['regional_details'].append({
                'region_name': region_name,
                'store_type_name': store_type_name,
                'target_count': rp.target_count,
                'completed_count': rp.completed_count,
                'completion_rate': rp.completion_rate,
                'contribution_rate': float(rp.contribution_rate) if rp.contribution_rate else None,
                'budget_amount': float(rp.budget_amount)
            })
        
        # 计算完成率
        for region_name, stats in region_stats.items():
            stats['completion_rate'] = (
                round((stats['completed_count'] / stats['target_count']) * 100, 2)
                if stats['target_count'] > 0 else 0
            )
        
        for store_type_name, stats in store_type_stats.items():
            stats['completion_rate'] = (
                round((stats['completed_count'] / stats['target_count']) * 100, 2)
                if stats['target_count'] > 0 else 0
            )
        
        statistics['by_region'] = region_stats
        statistics['by_store_type'] = store_type_stats
        
        return statistics
    
    def get_dashboard_data(self, user=None, force_refresh=False) -> Dict:
        """获取仪表板数据（使用仪表板服务）"""
        return self.dashboard_service.get_dashboard_data(user, force_refresh)

    def get_dashboard_widgets(self, widget_type='all', time_range=30, user=None) -> Dict:
        """获取仪表板小部件数据"""
        return self.dashboard_service.get_dashboard_widgets(widget_type, time_range, user)

    def get_realtime_metrics(self, user=None) -> Dict:
        """获取实时指标数据"""
        return self.dashboard_service.get_realtime_metrics(user)

    def refresh_dashboard_cache(self) -> None:
        """刷新仪表板缓存"""
        return self.dashboard_service.refresh_dashboard_cache()

    def get_analysis_data(self, analysis_type: str = 'overview', time_range: int = 30, 
                         region_id: Optional[int] = None, store_type_id: Optional[int] = None,
                         user=None) -> Dict:
        """获取统计分析数据"""
        from datetime import datetime, timedelta
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=time_range)
        
        # 基础查询
        plans_query = StorePlan.objects.filter(
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        
        # 应用过滤条件
        if region_id:
            plans_query = plans_query.filter(regional_plans__region_id=region_id).distinct()
        if store_type_id:
            plans_query = plans_query.filter(regional_plans__store_type_id=store_type_id).distinct()
        
        if analysis_type == 'overview':
            return self._get_overview_analysis(plans_query, start_date, end_date)
        elif analysis_type == 'region':
            return self._get_region_analysis(plans_query, start_date, end_date)
        elif analysis_type == 'store_type':
            return self._get_store_type_analysis(plans_query, start_date, end_date)
        elif analysis_type == 'time_series':
            return self._get_time_series_analysis(plans_query, start_date, end_date)
        else:
            return self._get_overview_analysis(plans_query, start_date, end_date)

    def get_completion_rate_analysis(self, group_by: str = 'region', year: int = None, user=None) -> Dict:
        """获取目标完成率分析"""
        if year is None:
            year = timezone.now().year
        
        plans_query = StorePlan.objects.filter(
            start_date__year=year,
            status__in=['executing', 'completed']
        )
        
        if group_by == 'region':
            return self._get_completion_by_region(plans_query)
        elif group_by == 'store_type':
            return self._get_completion_by_store_type(plans_query)
        elif group_by == 'month':
            return self._get_completion_by_month(plans_query, year)
        else:
            return self._get_completion_by_region(plans_query)

    def check_plan_alerts(self, user=None) -> Dict:
        """检查计划预警"""
        alerts = {
            'critical_alerts': [],
            'warning_alerts': [],
            'info_alerts': [],
            'summary': {
                'total_alerts': 0,
                'critical_count': 0,
                'warning_count': 0,
                'info_count': 0
            }
        }
        
        # 获取执行中的计划
        executing_plans = StorePlan.objects.filter(status='executing').select_related('created_by')
        
        for plan in executing_plans:
            plan_alerts = self._check_single_plan_alerts(plan)
            
            for alert in plan_alerts:
                if alert['level'] == 'critical':
                    alerts['critical_alerts'].append(alert)
                elif alert['level'] == 'warning':
                    alerts['warning_alerts'].append(alert)
                else:
                    alerts['info_alerts'].append(alert)
        
        # 更新汇总信息
        alerts['summary'] = {
            'total_alerts': len(alerts['critical_alerts']) + len(alerts['warning_alerts']) + len(alerts['info_alerts']),
            'critical_count': len(alerts['critical_alerts']),
            'warning_count': len(alerts['warning_alerts']),
            'info_count': len(alerts['info_alerts'])
        }
        
        return alerts

    def get_regional_statistics(self, plan: StorePlan) -> Dict:
        """获取计划的区域统计分析"""
        regional_plans = plan.regional_plans.select_related('region', 'store_type')
        
        regional_stats = {
            'plan_info': {
                'id': plan.id,
                'name': plan.name,
                'status': plan.status,
                'total_target': plan.total_target_count,
                'total_completed': plan.total_completed_count,
                'completion_rate': plan.completion_rate
            },
            'regional_breakdown': [],
            'region_comparison': {},
            'store_type_comparison': {},
            'performance_metrics': {}
        }
        
        # 区域详细分解
        region_totals = {}
        store_type_totals = {}
        
        for rp in regional_plans:
            region_name = rp.region.name
            store_type_name = rp.store_type.name
            
            # 区域详细信息
            regional_stats['regional_breakdown'].append({
                'region_name': region_name,
                'store_type_name': store_type_name,
                'target_count': rp.target_count,
                'completed_count': rp.completed_count,
                'completion_rate': rp.completion_rate,
                'contribution_rate': float(rp.contribution_rate) if rp.contribution_rate else None,
                'budget_amount': float(rp.budget_amount),
                'performance_score': self._calculate_regional_performance_score(rp)
            })
            
            # 区域汇总
            if region_name not in region_totals:
                region_totals[region_name] = {'target': 0, 'completed': 0, 'budget': 0}
            region_totals[region_name]['target'] += rp.target_count
            region_totals[region_name]['completed'] += rp.completed_count
            region_totals[region_name]['budget'] += float(rp.budget_amount)
            
            # 门店类型汇总
            if store_type_name not in store_type_totals:
                store_type_totals[store_type_name] = {'target': 0, 'completed': 0, 'budget': 0}
            store_type_totals[store_type_name]['target'] += rp.target_count
            store_type_totals[store_type_name]['completed'] += rp.completed_count
            store_type_totals[store_type_name]['budget'] += float(rp.budget_amount)
        
        # 区域对比
        for region_name, totals in region_totals.items():
            completion_rate = (totals['completed'] / totals['target'] * 100) if totals['target'] > 0 else 0
            regional_stats['region_comparison'][region_name] = {
                'target_count': totals['target'],
                'completed_count': totals['completed'],
                'completion_rate': round(completion_rate, 2),
                'budget_amount': totals['budget']
            }
        
        # 门店类型对比
        for store_type_name, totals in store_type_totals.items():
            completion_rate = (totals['completed'] / totals['target'] * 100) if totals['target'] > 0 else 0
            regional_stats['store_type_comparison'][store_type_name] = {
                'target_count': totals['target'],
                'completed_count': totals['completed'],
                'completion_rate': round(completion_rate, 2),
                'budget_amount': totals['budget']
            }
        
        # 绩效指标
        regional_stats['performance_metrics'] = self._calculate_plan_performance_metrics(plan)
        
        return regional_stats

    def get_performance_ranking(self, ranking_type: str = 'completion_rate', 
                              time_period: str = 'current_year', limit: int = 10, user=None) -> Dict:
        """获取计划执行绩效排名"""
        # 根据时间周期过滤计划
        plans_query = self._filter_plans_by_period(time_period)
        
        ranking_data = {
            'ranking_type': ranking_type,
            'time_period': time_period,
            'rankings': [],
            'statistics': {}
        }
        
        if ranking_type == 'completion_rate':
            rankings = self._rank_by_completion_rate(plans_query, limit)
        elif ranking_type == 'efficiency':
            rankings = self._rank_by_efficiency(plans_query, limit)
        elif ranking_type == 'budget_utilization':
            rankings = self._rank_by_budget_utilization(plans_query, limit)
        else:
            rankings = self._rank_by_completion_rate(plans_query, limit)
        
        ranking_data['rankings'] = rankings
        ranking_data['statistics'] = self._calculate_ranking_statistics(plans_query)
        
        return ranking_data

    def _get_overview_analysis(self, plans_query, start_date, end_date) -> Dict:
        """获取概览分析数据"""
        total_plans = plans_query.count()
        executing_plans = plans_query.filter(status='executing')
        completed_plans = plans_query.filter(status='completed')
        
        total_target = sum(p.total_target_count for p in plans_query)
        total_completed = sum(p.total_completed_count for p in plans_query)
        
        return {
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            },
            'summary': {
                'total_plans': total_plans,
                'executing_plans': executing_plans.count(),
                'completed_plans': completed_plans.count(),
                'total_target': total_target,
                'total_completed': total_completed,
                'overall_completion_rate': round((total_completed / total_target * 100), 2) if total_target > 0 else 0
            },
            'trends': self._calculate_period_trends(plans_query, start_date, end_date)
        }

    def _get_region_analysis(self, plans_query, start_date, end_date) -> Dict:
        """获取区域分析数据"""
        from django.db.models import Sum
        
        # 按区域统计
        regional_stats = {}
        
        for plan in plans_query.prefetch_related('regional_plans__region'):
            for rp in plan.regional_plans.all():
                region_name = rp.region.name
                if region_name not in regional_stats:
                    regional_stats[region_name] = {
                        'target_count': 0,
                        'completed_count': 0,
                        'plan_count': 0,
                        'budget_amount': 0
                    }
                
                regional_stats[region_name]['target_count'] += rp.target_count
                regional_stats[region_name]['completed_count'] += rp.completed_count
                regional_stats[region_name]['budget_amount'] += float(rp.budget_amount)
        
        # 计算完成率
        for region_name, stats in regional_stats.items():
            stats['completion_rate'] = (
                round((stats['completed_count'] / stats['target_count']) * 100, 2)
                if stats['target_count'] > 0 else 0
            )
        
        return {
            'analysis_type': 'region',
            'regional_statistics': regional_stats,
            'top_performing_regions': sorted(
                regional_stats.items(),
                key=lambda x: x[1]['completion_rate'],
                reverse=True
            )[:5]
        }

    def _get_store_type_analysis(self, plans_query, start_date, end_date) -> Dict:
        """获取门店类型分析数据"""
        store_type_stats = {}
        
        for plan in plans_query.prefetch_related('regional_plans__store_type'):
            for rp in plan.regional_plans.all():
                store_type_name = rp.store_type.name
                if store_type_name not in store_type_stats:
                    store_type_stats[store_type_name] = {
                        'target_count': 0,
                        'completed_count': 0,
                        'plan_count': 0,
                        'budget_amount': 0
                    }
                
                store_type_stats[store_type_name]['target_count'] += rp.target_count
                store_type_stats[store_type_name]['completed_count'] += rp.completed_count
                store_type_stats[store_type_name]['budget_amount'] += float(rp.budget_amount)
        
        # 计算完成率
        for store_type_name, stats in store_type_stats.items():
            stats['completion_rate'] = (
                round((stats['completed_count'] / stats['target_count']) * 100, 2)
                if stats['target_count'] > 0 else 0
            )
        
        return {
            'analysis_type': 'store_type',
            'store_type_statistics': store_type_stats,
            'top_performing_types': sorted(
                store_type_stats.items(),
                key=lambda x: x[1]['completion_rate'],
                reverse=True
            )[:5]
        }

    def _get_time_series_analysis(self, plans_query, start_date, end_date) -> Dict:
        """获取时间序列分析数据"""
        from datetime import datetime, timedelta
        
        # 按周统计
        weekly_data = []
        current_date = start_date
        
        while current_date <= end_date:
            week_end = min(current_date + timedelta(days=6), end_date)
            
            # 获取该周的执行日志
            week_logs = PlanExecutionLog.objects.filter(
                plan__in=plans_query,
                action_type='store_opened',
                created_at__date__gte=current_date,
                created_at__date__lte=week_end
            )
            
            weekly_data.append({
                'week_start': current_date.strftime('%Y-%m-%d'),
                'week_end': week_end.strftime('%Y-%m-%d'),
                'stores_opened': week_logs.count(),
                'cumulative_opened': week_logs.count()  # 这里需要累计计算
            })
            
            current_date = week_end + timedelta(days=1)
        
        return {
            'analysis_type': 'time_series',
            'weekly_data': weekly_data,
            'trends': self._calculate_time_series_trends(weekly_data)
        }

    def _get_completion_by_region(self, plans_query) -> Dict:
        """按区域获取完成率分析"""
        region_completion = {}
        
        for plan in plans_query.prefetch_related('regional_plans__region'):
            for rp in plan.regional_plans.all():
                region_name = rp.region.name
                if region_name not in region_completion:
                    region_completion[region_name] = {
                        'total_target': 0,
                        'total_completed': 0,
                        'plans_count': 0
                    }
                
                region_completion[region_name]['total_target'] += rp.target_count
                region_completion[region_name]['total_completed'] += rp.completed_count
                region_completion[region_name]['plans_count'] += 1
        
        # 计算完成率
        for region_name, data in region_completion.items():
            data['completion_rate'] = (
                round((data['total_completed'] / data['total_target']) * 100, 2)
                if data['total_target'] > 0 else 0
            )
        
        return {
            'group_by': 'region',
            'completion_data': region_completion
        }

    def _get_completion_by_store_type(self, plans_query) -> Dict:
        """按门店类型获取完成率分析"""
        store_type_completion = {}
        
        for plan in plans_query.prefetch_related('regional_plans__store_type'):
            for rp in plan.regional_plans.all():
                store_type_name = rp.store_type.name
                if store_type_name not in store_type_completion:
                    store_type_completion[store_type_name] = {
                        'total_target': 0,
                        'total_completed': 0,
                        'plans_count': 0
                    }
                
                store_type_completion[store_type_name]['total_target'] += rp.target_count
                store_type_completion[store_type_name]['total_completed'] += rp.completed_count
                store_type_completion[store_type_name]['plans_count'] += 1
        
        # 计算完成率
        for store_type_name, data in store_type_completion.items():
            data['completion_rate'] = (
                round((data['total_completed'] / data['total_target']) * 100, 2)
                if data['total_target'] > 0 else 0
            )
        
        return {
            'group_by': 'store_type',
            'completion_data': store_type_completion
        }

    def _get_completion_by_month(self, plans_query, year) -> Dict:
        """按月份获取完成率分析"""
        monthly_completion = {}
        
        for month in range(1, 13):
            month_plans = plans_query.filter(
                start_date__month__lte=month,
                end_date__month__gte=month
            )
            
            total_target = sum(p.total_target_count for p in month_plans)
            total_completed = sum(p.total_completed_count for p in month_plans)
            
            monthly_completion[f'{year}-{month:02d}'] = {
                'total_target': total_target,
                'total_completed': total_completed,
                'completion_rate': (
                    round((total_completed / total_target) * 100, 2)
                    if total_target > 0 else 0
                ),
                'plans_count': month_plans.count()
            }
        
        return {
            'group_by': 'month',
            'year': year,
            'completion_data': monthly_completion
        }

    def _check_single_plan_alerts(self, plan: StorePlan) -> List[Dict]:
        """检查单个计划的预警"""
        alerts = []
        
        # 检查进度预警
        if plan.completion_rate < 30:
            alerts.append({
                'level': 'critical',
                'type': 'low_progress',
                'plan_id': plan.id,
                'plan_name': plan.name,
                'message': f'计划进度严重滞后，完成率仅{plan.completion_rate}%',
                'recommendation': '建议加快执行进度或调整计划目标'
            })
        elif plan.completion_rate < 50:
            alerts.append({
                'level': 'warning',
                'type': 'moderate_progress',
                'plan_id': plan.id,
                'plan_name': plan.name,
                'message': f'计划进度偏慢，完成率为{plan.completion_rate}%',
                'recommendation': '建议关注执行情况，适当调整资源配置'
            })
        
        # 检查时间预警
        days_remaining = (plan.end_date - timezone.now().date()).days
        if days_remaining < 0:
            alerts.append({
                'level': 'critical',
                'type': 'overdue',
                'plan_id': plan.id,
                'plan_name': plan.name,
                'message': f'计划已超期{abs(days_remaining)}天',
                'recommendation': '建议立即评估计划状态，考虑调整或取消'
            })
        elif days_remaining < 30 and plan.completion_rate < 80:
            alerts.append({
                'level': 'warning',
                'type': 'time_pressure',
                'plan_id': plan.id,
                'plan_name': plan.name,
                'message': f'计划剩余{days_remaining}天，但完成率仅{plan.completion_rate}%',
                'recommendation': '建议加快执行进度或考虑延期'
            })
        
        return alerts

    def _calculate_regional_performance_score(self, regional_plan: RegionalPlan) -> float:
        """计算区域计划绩效得分"""
        # 基础得分：完成率
        completion_score = regional_plan.completion_rate
        
        # 时间得分：是否按时完成
        plan = regional_plan.plan
        if plan.status == 'executing':
            total_days = (plan.end_date - plan.start_date).days
            elapsed_days = (timezone.now().date() - plan.start_date).days
            
            if total_days > 0 and elapsed_days > 0:
                expected_progress = (elapsed_days / total_days) * 100
                time_score = min(100, (regional_plan.completion_rate / expected_progress) * 100)
            else:
                time_score = 100
        else:
            time_score = 100
        
        # 综合得分（完成率70%，时间得分30%）
        performance_score = (completion_score * 0.7) + (time_score * 0.3)
        
        return round(performance_score, 2)

    def _calculate_plan_performance_metrics(self, plan: StorePlan) -> Dict:
        """计算计划绩效指标"""
        metrics = {
            'efficiency_score': 0,
            'time_performance': 0,
            'budget_utilization': 0,
            'overall_score': 0
        }
        
        # 效率得分
        if plan.total_target_count > 0:
            metrics['efficiency_score'] = round(plan.completion_rate, 2)
        
        # 时间绩效
        if plan.status in ['executing', 'completed']:
            total_days = (plan.end_date - plan.start_date).days
            if plan.status == 'completed':
                # 已完成计划，检查是否按时完成
                metrics['time_performance'] = 100 if plan.updated_at.date() <= plan.end_date else 80
            else:
                # 执行中计划，检查进度是否符合预期
                elapsed_days = (timezone.now().date() - plan.start_date).days
                if total_days > 0 and elapsed_days > 0:
                    expected_progress = (elapsed_days / total_days) * 100
                    metrics['time_performance'] = min(100, (plan.completion_rate / expected_progress) * 100)
        
        # 预算利用率（这里简化处理，实际应该根据实际支出计算）
        metrics['budget_utilization'] = plan.completion_rate  # 简化假设支出与完成率成正比
        
        # 综合得分
        metrics['overall_score'] = round(
            (metrics['efficiency_score'] * 0.4 + 
             metrics['time_performance'] * 0.3 + 
             metrics['budget_utilization'] * 0.3), 2
        )
        
        return metrics

    def _filter_plans_by_period(self, time_period: str):
        """根据时间周期过滤计划"""
        if time_period == 'current_year':
            return StorePlan.objects.filter(start_date__year=timezone.now().year)
        elif time_period == 'last_quarter':
            # 简化处理，获取最近3个月的计划
            three_months_ago = timezone.now().date() - timedelta(days=90)
            return StorePlan.objects.filter(start_date__gte=three_months_ago)
        elif time_period == 'last_month':
            one_month_ago = timezone.now().date() - timedelta(days=30)
            return StorePlan.objects.filter(start_date__gte=one_month_ago)
        else:
            return StorePlan.objects.filter(start_date__year=timezone.now().year)

    def _rank_by_completion_rate(self, plans_query, limit: int) -> List[Dict]:
        """按完成率排名"""
        plans = plans_query.select_related('created_by').order_by('-total_completed_count')[:limit]
        
        rankings = []
        for i, plan in enumerate(plans, 1):
            rankings.append({
                'rank': i,
                'plan_id': plan.id,
                'plan_name': plan.name,
                'completion_rate': plan.completion_rate,
                'target_count': plan.total_target_count,
                'completed_count': plan.total_completed_count,
                'created_by': plan.created_by.username if plan.created_by else None,
                'status': plan.status
            })
        
        return rankings

    def _rank_by_efficiency(self, plans_query, limit: int) -> List[Dict]:
        """按效率排名（完成数量/天数）"""
        rankings = []
        
        for plan in plans_query.select_related('created_by'):
            if plan.status in ['executing', 'completed']:
                if plan.status == 'completed':
                    days_taken = (plan.updated_at.date() - plan.start_date).days
                else:
                    days_taken = (timezone.now().date() - plan.start_date).days
                
                if days_taken > 0:
                    efficiency = plan.total_completed_count / days_taken
                    rankings.append({
                        'plan_id': plan.id,
                        'plan_name': plan.name,
                        'efficiency': round(efficiency, 2),
                        'completed_count': plan.total_completed_count,
                        'days_taken': days_taken,
                        'created_by': plan.created_by.username if plan.created_by else None,
                        'status': plan.status
                    })
        
        # 按效率排序
        rankings.sort(key=lambda x: x['efficiency'], reverse=True)
        
        # 添加排名
        for i, ranking in enumerate(rankings[:limit], 1):
            ranking['rank'] = i
        
        return rankings[:limit]

    def _rank_by_budget_utilization(self, plans_query, limit: int) -> List[Dict]:
        """按预算利用率排名"""
        rankings = []
        
        for plan in plans_query.select_related('created_by'):
            if plan.total_budget_amount > 0:
                # 简化处理：假设预算利用率与完成率成正比
                budget_utilization = plan.completion_rate
                rankings.append({
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'budget_utilization': budget_utilization,
                    'total_budget': float(plan.total_budget_amount),
                    'completion_rate': plan.completion_rate,
                    'created_by': plan.created_by.username if plan.created_by else None,
                    'status': plan.status
                })
        
        # 按预算利用率排序
        rankings.sort(key=lambda x: x['budget_utilization'], reverse=True)
        
        # 添加排名
        for i, ranking in enumerate(rankings[:limit], 1):
            ranking['rank'] = i
        
        return rankings[:limit]

    def _calculate_ranking_statistics(self, plans_query) -> Dict:
        """计算排名统计信息"""
        total_plans = plans_query.count()
        avg_completion_rate = sum(p.completion_rate for p in plans_query) / total_plans if total_plans > 0 else 0
        
        return {
            'total_plans': total_plans,
            'average_completion_rate': round(avg_completion_rate, 2),
            'top_performer_threshold': 80,  # 完成率80%以上为优秀
            'low_performer_threshold': 30   # 完成率30%以下为需要关注
        }

    def _calculate_period_trends(self, plans_query, start_date, end_date) -> Dict:
        """计算周期趋势"""
        # 简化处理，返回基本趋势信息
        return {
            'trend_direction': 'stable',  # stable, increasing, decreasing
            'trend_percentage': 0,
            'note': '趋势分析需要更多历史数据'
        }

    def _calculate_time_series_trends(self, weekly_data) -> Dict:
        """计算时间序列趋势"""
        if len(weekly_data) < 2:
            return {'trend': 'insufficient_data'}
        
        # 简单的趋势计算
        first_half = weekly_data[:len(weekly_data)//2]
        second_half = weekly_data[len(weekly_data)//2:]
        
        first_avg = sum(w['stores_opened'] for w in first_half) / len(first_half)
        second_avg = sum(w['stores_opened'] for w in second_half) / len(second_half)
        
        if second_avg > first_avg * 1.1:
            trend = 'increasing'
        elif second_avg < first_avg * 0.9:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'first_half_average': round(first_avg, 2),
            'second_half_average': round(second_avg, 2)
        }