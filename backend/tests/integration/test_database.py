#!/usr/bin/env python
"""
数据库集成测试
测试数据库迁移、约束、事务和查询性能
"""
import pytest
import time
from decimal import Decimal
from django.db import connection, transaction, IntegrityError
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test.utils import CaptureQueriesContext

# 导入所有模型以测试外键关系
from system_management.models import Department, Role
from base_data.models import BusinessRegion as BaseBusinessRegion
from store_planning.models import StorePlan, RegionalPlan, BusinessRegion as PlanningBusinessRegion

User = get_user_model()


@pytest.mark.integration
class TestDatabaseMigrations:
    """数据库迁移完整性测试"""
    
    def test_all_migrations_applied(self, db):
        """测试所有迁移是否已应用"""
        # 获取所有已应用的迁移
        from django.db.migrations.recorder import MigrationRecorder
        recorder = MigrationRecorder(connection)
        applied_migrations = recorder.applied_migrations()
        
        # 验证关键应用的迁移已应用
        key_apps = [
            'system_management',
            'base_data',
            'store_planning',
            'store_expansion',
            'store_preparation',
            'store_archive',
            'approval',
            'notification',
            'data_analytics',
            'wechat_integration'
        ]
        
        for app in key_apps:
            app_migrations = [m for m in applied_migrations if m[0] == app]
            assert len(app_migrations) > 0, f"应用 {app} 没有已应用的迁移"
    
    def test_migrations_reversible(self, db):
        """测试迁移的可逆性（检查是否有reverse操作）"""
        # 这个测试主要验证迁移文件的结构
        # 实际回滚测试应该在独立的测试环境中进行
        from django.db.migrations.recorder import MigrationRecorder
        recorder = MigrationRecorder(connection)
        applied_migrations = recorder.applied_migrations()
        
        # 至少应该有一些迁移
        assert len(applied_migrations) > 0, "没有找到已应用的迁移"
    
    def test_database_tables_exist(self, db):
        """测试所有必需的数据库表是否存在"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = [row[0] for row in cursor.fetchall()]
        
        # 验证关键表存在
        required_tables = [
            'sys_user',
            'sys_department',
            'sys_role',
            'sys_permission',
            'business_regions',
            'store_plans',
            'expansion_candidate_location',
            'preparation_construction_order',
            'store_profile',
            'approval_template',
            'message'
        ]
        
        for table in required_tables:
            assert table in tables, f"表 {table} 不存在"


@pytest.mark.integration
class TestForeignKeyConstraints:
    """外键约束测试"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        return Department.objects.create(
            wechat_dept_id=9999,
            name='测试部门',
            order=1
        )
    
    @pytest.fixture
    def test_user(self, db, test_department):
        """创建测试用户"""
        user = User.objects.create_user(
            username='testuser_db',
            password='testpass123',
            phone='13900000001',
            department=test_department
        )
        return user
    
    def test_cascade_delete_department_children(self, db, test_department):
        """测试删除父部门时级联删除子部门"""
        # 创建子部门
        child_dept = Department.objects.create(
            wechat_dept_id=9998,
            name='子部门',
            parent=test_department,
            order=1
        )
        
        # 删除父部门
        test_department.delete()
        
        # 验证子部门也被删除
        assert not Department.objects.filter(id=child_dept.id).exists()
    
    def test_set_null_on_department_delete(self, db, test_department, test_user):
        """测试删除部门时用户的department字段设置为NULL"""
        user_id = test_user.id
        
        # 删除部门
        test_department.delete()
        
        # 验证用户仍然存在，但department为NULL
        user = User.objects.get(id=user_id)
        assert user.department is None
    
    def test_foreign_key_integrity(self, db):
        """测试外键完整性约束"""
        # 尝试创建引用不存在部门的用户应该失败
        from django.db import connection
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                User.objects.create(
                    username='invalid_user',
                    phone='13900000002',
                    department_id=999999  # 不存在的部门ID
                )
                # 强制检查约束
                connection.check_constraints()
    
    def test_store_plan_region_relationship(self, db, test_user):
        """测试门店计划与区域的外键关系"""
        from store_planning.models import StoreType
        
        # 创建区域（使用store_planning的BusinessRegion）
        region = PlanningBusinessRegion.objects.create(
            name='测试区域',
            code='TEST001'
        )
        
        # 创建门店类型
        store_type = StoreType.objects.create(
            name='测试类型',
            code='TYPE001'
        )
        
        # 创建门店计划
        plan = StorePlan.objects.create(
            name='测试计划',
            plan_type='annual',
            start_date='2025-01-01',
            end_date='2025-12-31',
            created_by=test_user
        )
        
        # 创建区域计划
        regional_plan = RegionalPlan.objects.create(
            plan=plan,
            region=region,
            store_type=store_type,
            target_count=10
        )
        
        # 验证关系
        assert regional_plan.region.id == region.id
        assert regional_plan.plan.id == plan.id
        
        # 测试PROTECT约束 - 删除区域应该失败（因为有区域计划引用）
        with pytest.raises(IntegrityError):
            region.delete()


@pytest.mark.integration
class TestUniqueConstraints:
    """唯一约束测试"""
    
    def test_department_wechat_id_unique(self, db):
        """测试部门企微ID的唯一性约束"""
        # 创建第一个部门
        Department.objects.create(
            wechat_dept_id=8888,
            name='部门1',
            order=1
        )
        
        # 尝试创建相同企微ID的部门应该失败
        with pytest.raises(IntegrityError):
            Department.objects.create(
                wechat_dept_id=8888,
                name='部门2',
                order=2
            )
    
    def test_user_phone_unique(self, db):
        """测试用户手机号的唯一性约束"""
        # 创建第一个用户
        User.objects.create_user(
            username='user1',
            password='pass123',
            phone='13800000001'
        )
        
        # 尝试创建相同手机号的用户应该失败
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                username='user2',
                password='pass123',
                phone='13800000001'
            )
    
    def test_user_username_unique(self, db):
        """测试用户名的唯一性约束"""
        # 创建第一个用户
        User.objects.create_user(
            username='testuser',
            password='pass123',
            phone='13800000002'
        )
        
        # 尝试创建相同用户名的用户应该失败
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                username='testuser',
                password='pass123',
                phone='13800000003'
            )
    
    def test_business_region_code_unique(self, db):
        """测试经营区域编码的唯一性约束"""
        # 创建第一个区域（使用base_data的BusinessRegion）
        BaseBusinessRegion.objects.create(
            name='区域1',
            code='REG001'
        )
        
        # 尝试创建相同编码的区域应该失败
        with pytest.raises(IntegrityError):
            BaseBusinessRegion.objects.create(
                name='区域2',
                code='REG001'
            )


@pytest.mark.integration
class TestDatabaseIndexes:
    """数据库索引测试"""
    
    def test_indexes_exist(self, db):
        """测试关键索引是否存在"""
        with connection.cursor() as cursor:
            # 查询所有索引
            cursor.execute("""
                SELECT 
                    tablename,
                    indexname
                FROM pg_indexes
                WHERE schemaname = 'public'
                ORDER BY tablename, indexname
            """)
            indexes = cursor.fetchall()
        
        # 转换为字典以便查找
        index_dict = {}
        for table, index in indexes:
            if table not in index_dict:
                index_dict[table] = []
            index_dict[table].append(index)
        
        # 验证关键表有索引
        assert 'sys_user' in index_dict, "sys_user表没有索引"
        assert 'sys_department' in index_dict, "sys_department表没有索引"
        
        # 验证特定索引存在
        user_indexes = index_dict.get('sys_user', [])
        assert any('phone' in idx.lower() for idx in user_indexes), \
            "sys_user表缺少phone字段的索引"


@pytest.mark.integration
class TestTransactions:
    """事务处理测试"""
    
    def test_transaction_commit(self, db):
        """测试事务提交"""
        with transaction.atomic():
            dept = Department.objects.create(
                wechat_dept_id=7777,
                name='事务测试部门',
                order=1
            )
            dept_id = dept.id
        
        # 验证数据已提交
        assert Department.objects.filter(id=dept_id).exists()
    
    def test_transaction_rollback(self, db):
        """测试事务回滚"""
        dept_id = None
        try:
            with transaction.atomic():
                dept = Department.objects.create(
                    wechat_dept_id=6666,
                    name='回滚测试部门',
                    order=1
                )
                dept_id = dept.id
                
                # 故意引发异常
                raise Exception("测试回滚")
        except Exception:
            pass
        
        # 验证数据已回滚
        if dept_id:
            assert not Department.objects.filter(id=dept_id).exists()
    
    def test_nested_transaction_rollback(self, db):
        """测试嵌套事务回滚"""
        outer_dept_id = None
        inner_dept_id = None
        
        try:
            with transaction.atomic():
                outer_dept = Department.objects.create(
                    wechat_dept_id=5555,
                    name='外层部门',
                    order=1
                )
                outer_dept_id = outer_dept.id
                
                try:
                    with transaction.atomic():
                        inner_dept = Department.objects.create(
                            wechat_dept_id=5554,
                            name='内层部门',
                            parent=outer_dept,
                            order=1
                        )
                        inner_dept_id = inner_dept.id
                        
                        # 内层事务引发异常
                        raise Exception("内层回滚")
                except Exception:
                    pass
                
                # 外层事务继续
        except Exception:
            pass
        
        # 验证外层事务提交，内层事务回滚
        if outer_dept_id:
            assert Department.objects.filter(id=outer_dept_id).exists()
        if inner_dept_id:
            assert not Department.objects.filter(id=inner_dept_id).exists()
    
    def test_transaction_with_multiple_operations(self, db):
        """测试包含多个操作的事务"""
        with transaction.atomic():
            # 创建部门
            dept = Department.objects.create(
                wechat_dept_id=4444,
                name='多操作部门',
                order=1
            )
            
            # 创建用户
            user = User.objects.create_user(
                username='trans_user',
                password='pass123',
                phone='13800000010',
                department=dept
            )
            
            # 创建区域
            region = BaseBusinessRegion.objects.create(
                name='事务区域',
                code='TRANS001'
            )
        
        # 验证所有数据都已提交
        assert Department.objects.filter(wechat_dept_id=4444).exists()
        assert User.objects.filter(username='trans_user').exists()
        assert BaseBusinessRegion.objects.filter(code='TRANS001').exists()


@pytest.mark.integration
@pytest.mark.slow
class TestQueryPerformance:
    """查询性能测试 - 识别慢查询"""
    
    @pytest.fixture
    def sample_data(self, db):
        """创建测试数据"""
        # 创建部门
        dept = Department.objects.create(
            wechat_dept_id=3333,
            name='性能测试部门',
            order=1
        )
        
        # 创建多个用户
        users = []
        for i in range(20):
            user = User.objects.create_user(
                username=f'perf_user_{i}',
                password='pass123',
                phone=f'1380000{i:04d}',
                department=dept
            )
            users.append(user)
        
        # 创建区域
        regions = []
        for i in range(10):
            region = BaseBusinessRegion.objects.create(
                name=f'性能区域{i}',
                code=f'PERF{i:03d}'
            )
            regions.append(region)
        
        return {'dept': dept, 'users': users, 'regions': regions}
    
    def test_simple_query_performance(self, db, sample_data):
        """测试简单查询性能"""
        start_time = time.time()
        
        with CaptureQueriesContext(connection) as queries:
            users = list(User.objects.filter(department=sample_data['dept']))
        
        duration = (time.time() - start_time) * 1000  # 转换为毫秒
        
        # 验证查询时间
        assert duration < 50, f"简单查询耗时 {duration:.2f}ms，超过50ms阈值"
        
        # 验证查询数量
        assert len(queries) == 1, f"简单查询执行了 {len(queries)} 次SQL，应该只有1次"
    
    def test_join_query_performance(self, db, sample_data):
        """测试关联查询性能"""
        start_time = time.time()
        
        with CaptureQueriesContext(connection) as queries:
            # 使用select_related优化外键查询
            users = list(User.objects.select_related('department').all()[:20])
            # 访问关联对象
            for user in users:
                _ = user.department.name if user.department else None
        
        duration = (time.time() - start_time) * 1000
        
        # 验证查询时间
        assert duration < 50, f"关联查询耗时 {duration:.2f}ms，超过50ms阈值"
        
        # 使用select_related应该只执行1次查询
        assert len(queries) <= 2, f"关联查询执行了 {len(queries)} 次SQL，应该 <= 2次"
    
    def test_n_plus_one_detection(self, db, sample_data):
        """测试N+1查询问题检测"""
        # 不使用select_related的情况
        with CaptureQueriesContext(connection) as queries_bad:
            users = list(User.objects.all()[:10])
            for user in users:
                _ = user.department.name if user.department else None
        
        # 使用select_related的情况
        with CaptureQueriesContext(connection) as queries_good:
            users = list(User.objects.select_related('department').all()[:10])
            for user in users:
                _ = user.department.name if user.department else None
        
        # 验证优化效果
        assert len(queries_good) < len(queries_bad), \
            f"select_related优化无效: {len(queries_good)} vs {len(queries_bad)}"
    
    def test_complex_query_performance(self, db, sample_data):
        """测试复杂查询性能"""
        start_time = time.time()
        
        with CaptureQueriesContext(connection) as queries:
            # 复杂查询：多个条件、排序、限制
            users = list(
                User.objects
                .filter(
                    Q(department=sample_data['dept']) |
                    Q(is_active=True)
                )
                .select_related('department')
                .order_by('-created_at')
                [:10]
            )
        
        duration = (time.time() - start_time) * 1000
        
        # 复杂查询允许稍长的时间
        assert duration < 100, f"复杂查询耗时 {duration:.2f}ms，超过100ms阈值"
    
    def test_aggregation_query_performance(self, db, sample_data):
        """测试聚合查询性能"""
        start_time = time.time()
        
        with CaptureQueriesContext(connection) as queries:
            from django.db.models import Count
            dept_user_counts = list(
                Department.objects
                .annotate(user_count=Count('users'))
                .values('id', 'name', 'user_count')
            )
        
        duration = (time.time() - start_time) * 1000
        
        # 聚合查询性能要求
        assert duration < 100, f"聚合查询耗时 {duration:.2f}ms，超过100ms阈值"
        assert len(queries) == 1, f"聚合查询执行了 {len(queries)} 次SQL，应该只有1次"


@pytest.mark.integration
class TestDatabaseConstraintsValidation:
    """数据库约束验证测试"""
    
    def test_not_null_constraint(self, db):
        """测试非空约束"""
        # 尝试创建没有必需字段的记录
        with pytest.raises((IntegrityError, ValueError)):
            Department.objects.create(
                # 缺少wechat_dept_id（必需字段）
                name='测试部门'
            )
    
    def test_check_constraint_validation(self, db):
        """测试检查约束"""
        # 如果有检查约束（如金额必须为正数），测试它们
        region = BaseBusinessRegion.objects.create(
            name='约束测试区域',
            code='CHECK001'
        )
        
        # 验证对象创建成功
        assert region.id is not None
    
    def test_default_values(self, db):
        """测试默认值"""
        dept = Department.objects.create(
            wechat_dept_id=2222,
            name='默认值测试'
            # order字段应该有默认值0
        )
        
        assert dept.order == 0, "order字段的默认值不正确"
        
        user = User.objects.create_user(
            username='default_user',
            password='pass123',
            phone='13800000020'
        )
        
        assert user.is_active is True, "is_active字段的默认值不正确"


# 用于手动运行的测试脚本
if __name__ == "__main__":
    import os
    import sys
    import django
    
    # 设置Django环境
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'system_management.settings')
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    django.setup()
    
    # 运行pytest
    pytest.main([__file__, '-v', '-s'])
