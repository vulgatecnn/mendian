"""
开店计划管理 - 数据库查询优化
优化复杂查询的SQL语句，使用select_related和prefetch_related优化关联查询
"""

from django.db.models import Prefetch, Q, F, Count, Sum, Avg, Max, Min, Case, When, Value, IntegerField
from django.db.models.functions import Coalesce
from .models import StorePlan, RegionalPlan, PlanExecutionLog, PlanApproval, BusinessRegion, StoreType


class QueryOptimizer:
    """查询优化器 - 提供优化后的查询集"""
    
    @staticmethod
    def get_optimized_plan_list_queryset():
        """
        优化计划列表查询
        使用select_related预加载创建人信息
        使用prefetch_related预加载区域计划及其关联的区域和门店类型
        """
        return StorePlan.objects.select_related(
            'created_by'  # 预加载创建人信息，避免N+1查询
        ).prefetch_related(
            Prefetch(
                'regional_plans',
                queryset=RegionalPlan.objects.select_related(
                    'region',      # 预加载区域信息
                    'store_type'   # 预加载门店类型信息
                ).order_by('region__code', 'store_type__code')
            )
        ).annotate(
            # 添加聚合字段，避免在Python层面计算
            regional_count=Count('regional_plans')
        )
    
    @staticmethod
    def get_optimized_plan_detail_queryset():
        """
        优化计划详情查询
        预加载所有相关数据，包括执行日志和审批记录
        """
        return StorePlan.objects.select_related(
            'created_by'
        ).prefetch_related(
            # 预加载区域计划及其关联数据
            Prefetch(
                'regional_plans',
                queryset=RegionalPlan.objects.select_related(
                    'region',
                    'store_type'
                ).order_by('region__code', 'store_type__code')
            ),
            # 预加载最近的执行日志
            Prefetch(
                'execution_logs',
                queryset=PlanExecutionLog.objects.select_related(
                    'created_by',
                    'regional_plan__region',
                    'regional_plan__store_type'
                ).order_by('-created_at')[:50]  # 只加载最近50条
            ),
            # 预加载审批记录
            Prefetch(
                'approvals',
                queryset=PlanApproval.objects.select_related(
                    'submitted_by',
                    'approved_by'
                ).order_by('-submitted_at')
            )
        )
    
    @staticmethod
    def get_optimized_regional_plan_queryset():
        """
        优化区域计划查询
        预加载所有关联数据
        """
        return RegionalPlan.objects.select_related(
            'plan',           # 预加载主计划
            'plan__created_by',  # 预加载计划创建人
            'region',         # 预加载区域
            'store_type'      # 预加载门店类型
        )
    
    @staticmethod
    def get_optimized_execution_logs_queryset(plan=None):
        """
        优化执行日志查询
        预加载所有关联数据
        """
        queryset = PlanExecutionLog.objects.select_related(
            'plan',
            'plan__created_by',
            'created_by',
            'regional_plan',
            'regional_plan__region',
            'regional_plan__store_type'
        ).order_by('-created_at')
        
        if plan:
            queryset = queryset.filter(plan=plan)
        
        return queryset
    
    @staticmethod
    def get_optimized_approval_queryset(plan=None):
        """
        优化审批记录查询
        预加载所有关联数据
        """
        queryset = PlanApproval.objects.select_related(
            'plan',
            'plan__created_by',
            'submitted_by',
            'approved_by'
        ).order_by('-submitted_at')
        
        if plan:
            queryset = queryset.filter(plan=plan)
        
        return queryset
    
    @staticmethod
    def get_dashboard_statistics_queryset():
        """
        优化仪表板统计查询
        使用聚合函数在数据库层面计算统计数据
        """
        return StorePlan.objects.annotate(
            # 计算区域计划数量
            regional_plan_count=Count('regional_plans'),
            # 计算总目标和完成数（用于验证）
            calculated_target=Coalesce(Sum('regional_plans__target_count'), 0),
            calculated_completed=Coalesce(Sum('regional_plans__completed_count'), 0)
        ).select_related('created_by')
    
    @staticmethod
    def get_regional_statistics_queryset():
        """
        优化区域统计查询
        使用聚合函数计算区域级别的统计数据
        """
        return RegionalPlan.objects.select_related(
            'region',
            'store_type',
            'plan'
        ).filter(
            plan__status__in=['executing', 'completed']
        ).values(
            'region__id',
            'region__name',
            'region__code'
        ).annotate(
            total_target=Sum('target_count'),
            total_completed=Sum('completed_count'),
            plan_count=Count('plan', distinct=True),
            total_budget=Sum('budget_amount')
        ).order_by('-total_target')
    
    @staticmethod
    def get_store_type_statistics_queryset():
        """
        优化门店类型统计查询
        使用聚合函数计算门店类型级别的统计数据
        """
        return RegionalPlan.objects.select_related(
            'store_type',
            'plan'
        ).filter(
            plan__status__in=['executing', 'completed']
        ).values(
            'store_type__id',
            'store_type__name',
            'store_type__code'
        ).annotate(
            total_target=Sum('target_count'),
            total_completed=Sum('completed_count'),
            plan_count=Count('plan', distinct=True),
            total_budget=Sum('budget_amount')
        ).order_by('-total_target')
    
    @staticmethod
    def get_plan_progress_summary_queryset():
        """
        优化计划进度汇总查询
        在数据库层面计算进度相关指标
        """
        return StorePlan.objects.filter(
            status__in=['executing', 'completed']
        ).select_related(
            'created_by'
        ).annotate(
            # 计算完成率（在数据库层面）
            completion_percentage=Case(
                When(total_target_count=0, then=Value(0)),
                default=F('total_completed_count') * 100 / F('total_target_count'),
                output_field=IntegerField()
            ),
            # 计算剩余数量
            remaining_count=F('total_target_count') - F('total_completed_count')
        ).order_by('-created_at')
    
    @staticmethod
    def get_executing_plans_with_alerts():
        """
        优化执行中计划的预警查询
        使用注解添加预警相关的计算字段
        """
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        
        return StorePlan.objects.filter(
            status='executing'
        ).select_related(
            'created_by'
        ).annotate(
            # 计算剩余天数
            days_remaining=F('end_date') - Value(today),
            # 计算完成率
            completion_percentage=Case(
                When(total_target_count=0, then=Value(0)),
                default=F('total_completed_count') * 100 / F('total_target_count'),
                output_field=IntegerField()
            ),
            # 计算区域计划数量
            regional_plan_count=Count('regional_plans')
        ).prefetch_related(
            Prefetch(
                'regional_plans',
                queryset=RegionalPlan.objects.select_related(
                    'region',
                    'store_type'
                )
            )
        )
    
    @staticmethod
    def get_monthly_opening_statistics(year=None, month=None):
        """
        优化月度开业统计查询
        使用聚合函数在数据库层面计算统计数据
        """
        from django.utils import timezone
        
        queryset = PlanExecutionLog.objects.filter(
            action_type='store_opened'
        )
        
        if year:
            queryset = queryset.filter(created_at__year=year)
        if month:
            queryset = queryset.filter(created_at__month=month)
        
        return queryset.select_related(
            'plan',
            'regional_plan__region',
            'regional_plan__store_type'
        ).values(
            'created_at__year',
            'created_at__month'
        ).annotate(
            opening_count=Count('id'),
            unique_plans=Count('plan', distinct=True)
        ).order_by('created_at__year', 'created_at__month')
    
    @staticmethod
    def get_regional_plan_performance_ranking(limit=10):
        """
        优化区域计划绩效排名查询
        使用注解计算绩效指标并排序
        """
        return RegionalPlan.objects.filter(
            plan__status__in=['executing', 'completed']
        ).select_related(
            'region',
            'store_type',
            'plan',
            'plan__created_by'
        ).annotate(
            # 计算完成率
            completion_percentage=Case(
                When(target_count=0, then=Value(0)),
                default=F('completed_count') * 100 / F('target_count'),
                output_field=IntegerField()
            )
        ).order_by('-completion_percentage', '-completed_count')[:limit]
    
    @staticmethod
    def get_budget_utilization_statistics():
        """
        优化预算使用统计查询
        按区域和门店类型聚合预算数据
        """
        return RegionalPlan.objects.filter(
            plan__status__in=['executing', 'completed']
        ).values(
            'region__name',
            'store_type__name'
        ).annotate(
            total_budget=Sum('budget_amount'),
            total_target=Sum('target_count'),
            total_completed=Sum('completed_count'),
            avg_budget_per_store=Avg('budget_amount') / Avg('target_count')
        ).order_by('-total_budget')


class ComplexQueryOptimizer:
    """复杂查询优化器 - 处理多表关联和复杂统计"""
    
    @staticmethod
    def get_comprehensive_plan_analysis(plan_id):
        """
        获取计划的综合分析数据
        一次查询获取所有需要的数据，避免多次数据库访问
        """
        plan = StorePlan.objects.select_related(
            'created_by'
        ).prefetch_related(
            # 区域计划及其关联数据
            Prefetch(
                'regional_plans',
                queryset=RegionalPlan.objects.select_related(
                    'region',
                    'store_type'
                ).annotate(
                    completion_percentage=Case(
                        When(target_count=0, then=Value(0)),
                        default=F('completed_count') * 100 / F('target_count'),
                        output_field=IntegerField()
                    )
                )
            ),
            # 最近的执行日志
            Prefetch(
                'execution_logs',
                queryset=PlanExecutionLog.objects.select_related(
                    'created_by',
                    'regional_plan__region',
                    'regional_plan__store_type'
                ).order_by('-created_at')[:100]
            ),
            # 审批记录
            Prefetch(
                'approvals',
                queryset=PlanApproval.objects.select_related(
                    'submitted_by',
                    'approved_by'
                ).order_by('-submitted_at')
            )
        ).annotate(
            # 添加聚合统计
            regional_count=Count('regional_plans'),
            total_logs=Count('execution_logs'),
            total_approvals=Count('approvals')
        ).get(id=plan_id)
        
        return plan
    
    @staticmethod
    def get_cross_plan_regional_comparison():
        """
        跨计划的区域对比分析
        优化多计划、多区域的对比查询
        """
        return RegionalPlan.objects.filter(
            plan__status__in=['executing', 'completed']
        ).values(
            'region__id',
            'region__name',
            'plan__id',
            'plan__name',
            'plan__status'
        ).annotate(
            total_target=Sum('target_count'),
            total_completed=Sum('completed_count'),
            total_budget=Sum('budget_amount'),
            store_type_count=Count('store_type', distinct=True),
            avg_completion_rate=Avg(
                Case(
                    When(target_count=0, then=Value(0)),
                    default=F('completed_count') * 100.0 / F('target_count'),
                    output_field=IntegerField()
                )
            )
        ).order_by('region__name', 'plan__name')
    
    @staticmethod
    def get_time_based_progress_analysis(start_date, end_date):
        """
        基于时间的进度分析
        优化时间范围内的进度统计查询
        """
        return PlanExecutionLog.objects.filter(
            action_type='store_opened',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related(
            'plan',
            'regional_plan__region',
            'regional_plan__store_type'
        ).values(
            'created_at__date',
            'regional_plan__region__name',
            'regional_plan__store_type__name'
        ).annotate(
            daily_openings=Count('id')
        ).order_by('created_at__date')
    
    @staticmethod
    def get_plan_efficiency_metrics():
        """
        计划效率指标查询
        计算每个计划的效率相关指标
        """
        from django.db.models import DurationField, ExpressionWrapper
        from django.utils import timezone
        
        return StorePlan.objects.filter(
            status__in=['executing', 'completed']
        ).select_related(
            'created_by'
        ).annotate(
            # 计划持续天数
            plan_duration=ExpressionWrapper(
                F('end_date') - F('start_date'),
                output_field=DurationField()
            ),
            # 已执行天数
            days_elapsed=ExpressionWrapper(
                Value(timezone.now().date()) - F('start_date'),
                output_field=DurationField()
            ),
            # 区域计划数量
            regional_count=Count('regional_plans'),
            # 平均每个区域计划的目标
            avg_target_per_region=Avg('regional_plans__target_count'),
            # 总预算
            total_budget=Sum('regional_plans__budget_amount'),
            # 平均每店预算
            avg_budget_per_store=Case(
                When(total_target_count=0, then=Value(0)),
                default=Sum('regional_plans__budget_amount') / F('total_target_count'),
                output_field=IntegerField()
            )
        ).order_by('-created_at')
    
    @staticmethod
    def get_regional_trend_analysis(region_id, months=12):
        """
        区域趋势分析
        分析指定区域在过去N个月的表现趋势
        """
        from django.utils import timezone
        from datetime import timedelta
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=months * 30)
        
        return PlanExecutionLog.objects.filter(
            action_type='store_opened',
            regional_plan__region_id=region_id,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).select_related(
            'regional_plan__region',
            'regional_plan__store_type',
            'plan'
        ).values(
            'created_at__year',
            'created_at__month',
            'regional_plan__store_type__name'
        ).annotate(
            monthly_openings=Count('id'),
            unique_plans=Count('plan', distinct=True)
        ).order_by('created_at__year', 'created_at__month')


class IndexOptimizationHelper:
    """索引优化助手 - 提供索引建议和查询分析"""
    
    @staticmethod
    def get_recommended_indexes():
        """
        返回推荐的数据库索引
        这些索引可以显著提升查询性能
        """
        return {
            'store_plans': [
                ('status', 'start_date', 'end_date'),  # 复合索引用于状态和日期范围查询
                ('created_by_id', 'status'),            # 复合索引用于按创建人和状态查询
                ('plan_type', 'status'),                # 复合索引用于按类型和状态查询
            ],
            'regional_plans': [
                ('plan_id', 'region_id', 'store_type_id'),  # 复合索引用于关联查询
                ('region_id', 'completed_count'),            # 复合索引用于区域统计
                ('store_type_id', 'completed_count'),        # 复合索引用于类型统计
            ],
            'plan_execution_logs': [
                ('plan_id', 'action_type', 'created_at'),    # 复合索引用于日志查询
                ('regional_plan_id', 'action_type'),         # 复合索引用于区域日志
                ('action_type', 'created_at'),               # 复合索引用于按类型和时间查询
            ],
            'plan_approvals': [
                ('plan_id', 'status'),                       # 复合索引用于审批状态查询
                ('submitted_by_id', 'status'),               # 复合索引用于提交人查询
                ('approved_by_id', 'status'),                # 复合索引用于审批人查询
            ]
        }
    
    @staticmethod
    def analyze_query_performance(queryset):
        """
        分析查询性能
        返回查询的SQL和执行计划
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # 获取SQL查询
            sql_query = str(queryset.query)
            logger.info(f"SQL Query: {sql_query}")
            
            # 获取查询计划（仅在开发环境）
            from django.conf import settings
            if settings.DEBUG:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute(f"EXPLAIN ANALYZE {sql_query}")
                    explain_result = cursor.fetchall()
                    logger.info(f"Query Plan: {explain_result}")
                    return {
                        'sql': sql_query,
                        'explain': explain_result
                    }
        except Exception as e:
            logger.error(f"Query analysis error: {str(e)}")
        
        return {'sql': str(queryset.query)}
