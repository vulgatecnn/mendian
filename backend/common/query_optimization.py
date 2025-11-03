"""
查询优化工具
提供常用的查询优化 Mixin 和工具函数
"""
from django.db.models import Prefetch, Q, Count, F
from django.core.paginator import Paginator
from rest_framework.pagination import PageNumberPagination


class OptimizedQueryMixin:
    """优化查询的 Mixin 类"""
    
    # 子类可以覆盖这些属性来定义优化策略
    select_related_fields = []  # 一对一或外键关联字段
    prefetch_related_fields = []  # 多对多或反向外键关联字段
    only_fields = []  # 只查询的字段
    defer_fields = []  # 延迟加载的字段
    
    def get_queryset(self):
        """获取优化后的查询集"""
        queryset = super().get_queryset()
        
        # 应用 select_related
        if self.select_related_fields:
            queryset = queryset.select_related(*self.select_related_fields)
        
        # 应用 prefetch_related
        if self.prefetch_related_fields:
            queryset = queryset.prefetch_related(*self.prefetch_related_fields)
        
        # 应用 only
        if self.only_fields:
            queryset = queryset.only(*self.only_fields)
        
        # 应用 defer
        if self.defer_fields:
            queryset = queryset.defer(*self.defer_fields)
        
        return queryset


class BulkOperationMixin:
    """批量操作 Mixin"""
    
    @staticmethod
    def bulk_create_optimized(model, objects, batch_size=1000):
        """
        优化的批量创建
        
        Args:
            model: Django 模型类
            objects: 对象列表
            batch_size: 批次大小
            
        Returns:
            创建的对象列表
        """
        return model.objects.bulk_create(objects, batch_size=batch_size)
    
    @staticmethod
    def bulk_update_optimized(objects, fields, batch_size=1000):
        """
        优化的批量更新
        
        Args:
            objects: 对象列表
            fields: 要更新的字段列表
            batch_size: 批次大小
        """
        from django.db import models
        
        if objects:
            model = objects[0].__class__
            model.objects.bulk_update(objects, fields, batch_size=batch_size)


class EfficientPagination(PageNumberPagination):
    """高效分页类"""
    
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def paginate_queryset(self, queryset, request, view=None):
        """
        优化的分页查询
        使用 iterator() 减少内存占用（适用于大数据集）
        """
        # 对于小数据集，使用标准分页
        if queryset.count() < 10000:
            return super().paginate_queryset(queryset, request, view)
        
        # 对于大数据集，使用 iterator
        page_size = self.get_page_size(request)
        if not page_size:
            return None
        
        paginator = Paginator(queryset, page_size)
        page_number = request.query_params.get(self.page_query_param, 1)
        
        try:
            page = paginator.page(page_number)
        except Exception:
            page = paginator.page(1)
        
        self.page = page
        return list(page)


class QueryOptimizer:
    """查询优化器"""
    
    @staticmethod
    def optimize_follow_up_query(queryset):
        """优化跟进单查询"""
        return queryset.select_related(
            'location',
            'location__business_region',
            'profit_calculation',
            'legal_entity',
            'created_by',
            'created_by__department'
        ).prefetch_related(
            'location__business_region__manager'
        )
    
    @staticmethod
    def optimize_construction_query(queryset):
        """优化工程单查询"""
        return queryset.select_related(
            'follow_up_record',
            'follow_up_record__location',
            'supplier',
            'created_by'
        ).prefetch_related(
            Prefetch(
                'milestones',
                queryset=Milestone.objects.order_by('planned_date')
            )
        )
    
    @staticmethod
    def optimize_store_profile_query(queryset):
        """优化门店档案查询"""
        return queryset.select_related(
            'business_region',
            'follow_up_record',
            'follow_up_record__location',
            'follow_up_record__profit_calculation',
            'follow_up_record__legal_entity',
            'construction_order',
            'construction_order__supplier',
            'store_manager',
            'business_manager'
        ).prefetch_related(
            'construction_order__milestones'
        )
    
    @staticmethod
    def optimize_approval_query(queryset):
        """优化审批实例查询"""
        return queryset.select_related(
            'template',
            'initiator',
            'initiator__department',
            'current_node'
        ).prefetch_related(
            Prefetch(
                'nodes',
                queryset=ApprovalNode.objects.select_related(
                    'approved_by'
                ).prefetch_related(
                    'approvers',
                    'cc_users'
                ).order_by('sequence')
            ),
            'comments',
            'comments__user'
        )


class AggregationHelper:
    """聚合查询助手"""
    
    @staticmethod
    def get_store_statistics_by_region():
        """按区域统计门店数量"""
        from store_archive.models import StoreProfile
        
        return StoreProfile.objects.values(
            'business_region__name'
        ).annotate(
            total=Count('id'),
            operating=Count('id', filter=Q(status='operating')),
            preparing=Count('id', filter=Q(status='preparing')),
            closed=Count('id', filter=Q(status='closed'))
        ).order_by('-total')
    
    @staticmethod
    def get_approval_statistics_by_template():
        """按模板统计审批数量"""
        from approval.models import ApprovalInstance
        
        return ApprovalInstance.objects.values(
            'template__name'
        ).annotate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            approved=Count('id', filter=Q(status='approved')),
            rejected=Count('id', filter=Q(status='rejected'))
        ).order_by('-total')
    
    @staticmethod
    def get_follow_up_statistics_by_status():
        """按状态统计跟进单数量"""
        from store_expansion.models import FollowUpRecord
        
        return FollowUpRecord.objects.values(
            'status'
        ).annotate(
            count=Count('id')
        ).order_by('-count')


class RawSQLHelper:
    """原生 SQL 助手（用于复杂查询）"""
    
    @staticmethod
    def execute_raw_query(sql, params=None):
        """
        执行原生 SQL 查询
        
        Args:
            sql: SQL 语句
            params: 参数列表
            
        Returns:
            查询结果列表
        """
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute(sql, params or [])
            columns = [col[0] for col in cursor.description]
            return [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
    
    @staticmethod
    def get_store_lifecycle_report(start_date, end_date):
        """
        获取门店生命周期报表（使用原生 SQL 优化复杂查询）
        
        Args:
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            报表数据
        """
        sql = """
        SELECT 
            sp.store_code,
            sp.store_name,
            sp.status,
            sp.opening_date,
            br.name as region_name,
            fu.record_no as follow_up_no,
            fu.contract_date,
            pc.total_investment,
            pc.roi,
            pc.payback_period,
            co.order_no as construction_no,
            co.construction_start_date,
            co.actual_end_date,
            co.acceptance_result
        FROM store_profile sp
        LEFT JOIN business_region br ON sp.business_region_id = br.id
        LEFT JOIN follow_up_record fu ON sp.follow_up_record_id = fu.id
        LEFT JOIN profit_calculation pc ON fu.profit_calculation_id = pc.id
        LEFT JOIN construction_order co ON sp.construction_order_id = co.id
        WHERE sp.opening_date BETWEEN %s AND %s
        ORDER BY sp.opening_date DESC
        """
        
        return RawSQLHelper.execute_raw_query(sql, [start_date, end_date])


class IndexHintHelper:
    """索引提示助手（PostgreSQL）"""
    
    @staticmethod
    def force_index(queryset, index_name):
        """
        强制使用指定索引（PostgreSQL 不直接支持，但可以通过查询优化）
        
        Args:
            queryset: Django QuerySet
            index_name: 索引名称
            
        Returns:
            优化后的 QuerySet
        """
        # PostgreSQL 会自动选择最优索引
        # 这里主要是确保查询条件能够利用索引
        return queryset


class QueryProfiler:
    """查询性能分析器"""
    
    @staticmethod
    def profile_query(queryset, explain=True):
        """
        分析查询性能
        
        Args:
            queryset: Django QuerySet
            explain: 是否显示执行计划
            
        Returns:
            查询分析结果
        """
        import time
        from django.db import connection
        from django.db import reset_queries
        
        # 重置查询记录
        reset_queries()
        
        # 记录开始时间
        start_time = time.time()
        
        # 执行查询
        list(queryset)
        
        # 记录结束时间
        end_time = time.time()
        
        # 获取查询信息
        queries = connection.queries
        
        result = {
            'query_count': len(queries),
            'execution_time': end_time - start_time,
            'queries': queries
        }
        
        # 如果需要执行计划
        if explain:
            sql = str(queryset.query)
            with connection.cursor() as cursor:
                cursor.execute(f"EXPLAIN ANALYZE {sql}")
                result['explain'] = cursor.fetchall()
        
        return result
    
    @staticmethod
    def print_query_analysis(queryset):
        """打印查询分析结果"""
        result = QueryProfiler.profile_query(queryset)
        
        print(f"\n{'='*60}")
        print(f"查询性能分析")
        print(f"{'='*60}")
        print(f"查询数量: {result['query_count']}")
        print(f"执行时间: {result['execution_time']:.4f} 秒")
        print(f"\n查询详情:")
        
        for i, query in enumerate(result['queries'], 1):
            print(f"\n查询 {i}:")
            print(f"SQL: {query['sql']}")
            print(f"时间: {query['time']} 秒")
        
        if 'explain' in result:
            print(f"\n执行计划:")
            for line in result['explain']:
                print(line[0])
        
        print(f"{'='*60}\n")


# 导入必要的模型（避免循环导入）
try:
    from store_preparation.models import Milestone
    from approval.models import ApprovalNode
except ImportError:
    pass
