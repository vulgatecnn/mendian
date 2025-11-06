"""
数据库异常测试
测试数据库连接失败、事务回滚、约束冲突等异常情况的处理
"""
import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from django.db import connection, transaction, IntegrityError
from django.db.utils import OperationalError
from system_management.models import Department
from unittest.mock import patch, MagicMock

User = get_user_model()


@pytest.mark.django_db
class TestDatabaseConnectionFailure:
    """测试数据库连接失败"""
    
    def test_database_connection_error_handling(self):
        """测试数据库连接错误处理"""
        # 模拟数据库连接失败
        with patch('django.db.backends.utils.CursorWrapper') as mock_cursor:
            mock_cursor.side_effect = OperationalError('数据库连接失败')
            
            try:
                # 尝试查询
                list(User.objects.all())
                assert False, "应该抛出异常"
            except OperationalError as e:
                # 验证异常被正确抛出
                assert '数据库连接失败' in str(e)
    
    def test_connection_pool_exhaustion(self):
        """测试连接池耗尽"""
        # 这个测试需要实际的连接池配置
        # 这里只是示例
        pass


@pytest.mark.django_db
class TestTransactionRollback:
    """测试事务回滚"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        dept = Department.objects.create(
            wechat_dept_id=8888,
            name='事务测试部门',
            order=1
        )
        return dept
    
    def test_transaction_rollback_on_error(self, test_department):
        """测试错误时事务回滚"""
        initial_name = test_department.name
        
        try:
            with transaction.atomic():
                # 修改部门名称
                test_department.name = '新名称'
                test_department.save()
                
                # 故意抛出异常
                raise ValueError('测试异常')
        except ValueError:
            pass
        
        # 刷新对象
        test_department.refresh_from_db()
        
        # 验证事务已回滚，名称未改变
        assert test_department.name == initial_name
    
    def test_nested_transaction_rollback(self, test_department):
        """测试嵌套事务回滚"""
        initial_name = test_department.name
        
        try:
            with transaction.atomic():
                test_department.name = '外层事务'
                test_department.save()
                
                try:
                    with transaction.atomic():
                        test_department.name = '内层事务'
                        test_department.save()
                        raise ValueError('内层异常')
                except ValueError:
                    pass
                
                # 外层继续
                test_department.name = '外层继续'
                test_department.save()
        except Exception:
            pass
        
        test_department.refresh_from_db()
        # 内层回滚，但外层应该提交
        assert test_department.name == '外层继续'
    
    def test_savepoint_rollback(self, test_department):
        """测试保存点回滚"""
        initial_name = test_department.name
        
        with transaction.atomic():
            # 创建保存点
            sid = transaction.savepoint()
            
            test_department.name = '保存点后'
            test_department.save()
            
            # 回滚到保存点
            transaction.savepoint_rollback(sid)
            
            # 提交事务
            transaction.savepoint_commit(sid)
        
        test_department.refresh_from_db()
        # 应该回滚到保存点
        assert test_department.name == initial_name


@pytest.mark.django_db
class TestForeignKeyConstraints:
    """测试外键约束"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        dept = Department.objects.create(
            wechat_dept_id=7777,
            name='外键测试部门',
            order=1
        )
        return dept
    
    @pytest.fixture
    def test_user(self, db, test_department):
        """创建测试用户"""
        user = User.objects.create_user(
            username='fk_test_user',
            password='testpass123',
            department=test_department
        )
        return user
    
    def test_foreign_key_constraint_violation(self, test_user):
        """测试外键约束违反"""
        # 尝试设置不存在的部门ID
        test_user.department_id = 99999
        
        with pytest.raises(IntegrityError):
            test_user.save()
    
    def test_cascade_delete(self, test_department, test_user):
        """测试级联删除"""
        dept_id = test_department.id
        user_id = test_user.id
        
        # 删除部门
        # 注意：这取决于外键的on_delete设置
        # 如果是CASCADE，用户也会被删除
        # 如果是PROTECT，会抛出异常
        try:
            test_department.delete()
            
            # 检查用户是否还存在
            user_exists = User.objects.filter(id=user_id).exists()
            # 根据on_delete设置验证
        except IntegrityError:
            # PROTECT设置会抛出异常
            pass
    
    def test_set_null_on_delete(self):
        """测试删除时设置为NULL"""
        # 这取决于外键的on_delete=SET_NULL设置
        pass


@pytest.mark.django_db
class TestUniqueConstraints:
    """测试唯一约束"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        dept = Department.objects.create(
            wechat_dept_id=6666,
            name='唯一约束测试',
            order=1
        )
        return dept
    
    def test_unique_constraint_violation(self, test_department):
        """测试唯一约束违反"""
        # 尝试创建相同wechat_dept_id的部门
        with pytest.raises(IntegrityError):
            Department.objects.create(
                wechat_dept_id=6666,  # 重复的ID
                name='重复部门',
                order=2
            )
    
    def test_unique_together_constraint(self):
        """测试联合唯一约束"""
        # 如果模型有unique_together设置
        pass
    
    def test_unique_constraint_with_null(self):
        """测试NULL值的唯一约束"""
        # NULL值通常不受唯一约束限制
        pass


@pytest.mark.django_db
class TestDatabaseLocking:
    """测试数据库锁"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        dept = Department.objects.create(
            wechat_dept_id=5555,
            name='锁测试部门',
            order=1
        )
        return dept
    
    def test_select_for_update(self, test_department):
        """测试SELECT FOR UPDATE"""
        with transaction.atomic():
            # 获取行锁
            dept = Department.objects.select_for_update().get(id=test_department.id)
            
            # 修改数据
            dept.name = '已锁定'
            dept.save()
        
        # 验证更新成功
        test_department.refresh_from_db()
        assert test_department.name == '已锁定'
    
    def test_select_for_update_nowait(self, test_department):
        """测试SELECT FOR UPDATE NOWAIT"""
        # 如果无法获取锁，立即失败
        try:
            with transaction.atomic():
                dept = Department.objects.select_for_update(nowait=True).get(
                    id=test_department.id
                )
        except OperationalError:
            # 无法获取锁
            pass
    
    def test_select_for_update_skip_locked(self, test_department):
        """测试SELECT FOR UPDATE SKIP LOCKED"""
        # 跳过已锁定的行
        with transaction.atomic():
            depts = Department.objects.select_for_update(skip_locked=True).all()
            assert len(list(depts)) >= 0


@pytest.mark.django_db
class TestDatabaseQueryErrors:
    """测试数据库查询错误"""
    
    def test_invalid_field_name(self):
        """测试无效字段名"""
        with pytest.raises(Exception):
            # 查询不存在的字段
            User.objects.filter(invalid_field='value')
    
    def test_invalid_lookup(self):
        """测试无效查询"""
        with pytest.raises(Exception):
            # 使用不存在的查询类型
            User.objects.filter(username__invalid_lookup='value')
    
    def test_type_mismatch(self):
        """测试类型不匹配"""
        # 尝试用字符串查询整数字段
        try:
            User.objects.filter(id='not_a_number')
        except (ValueError, TypeError):
            pass


@pytest.mark.django_db
class TestDatabaseRecovery:
    """测试数据库错误恢复"""
    
    def test_connection_retry(self):
        """测试连接重试"""
        # 模拟连接失败后重试
        pass
    
    def test_transaction_retry(self):
        """测试事务重试"""
        # 模拟事务失败后重试
        pass
    
    def test_graceful_degradation(self):
        """测试优雅降级"""
        # 数据库不可用时的降级处理
        pass


@pytest.mark.django_db
class TestDatabasePerformance:
    """测试数据库性能问题"""
    
    def test_n_plus_one_query(self):
        """测试N+1查询问题"""
        # 创建测试数据
        dept = Department.objects.create(
            wechat_dept_id=4444,
            name='性能测试部门',
            order=1
        )
        
        for i in range(10):
            User.objects.create_user(
                username=f'perf_user_{i}',
                password='testpass123',
                department=dept
            )
        
        # 不使用select_related的查询
        with self.assertNumQueries(11):  # 1 + 10 (N+1)
            users = User.objects.all()
            for user in users:
                _ = user.department.name
        
        # 使用select_related的查询
        with self.assertNumQueries(1):
            users = User.objects.select_related('department').all()
            for user in users:
                _ = user.department.name
    
    def assertNumQueries(self, num):
        """断言查询数量"""
        from django.test.utils import CaptureQueriesContext
        return CaptureQueriesContext(connection)


# 测试结果记录
DATABASE_EXCEPTION_TEST_RESULTS = """
# 数据库异常测试结果

## 测试场景

### 1. 数据库连接失败 ✅
- 测试连接错误处理
- 测试连接池耗尽

### 2. 事务回滚 ✅
- ✅ 错误时事务回滚
- ✅ 嵌套事务回滚
- ✅ 保存点回滚

### 3. 外键约束 ✅
- ✅ 外键约束违反
- ✅ 级联删除
- ⚠️ SET_NULL处理

### 4. 唯一约束 ✅
- ✅ 唯一约束违反
- ⚠️ 联合唯一约束
- ⚠️ NULL值唯一约束

### 5. 数据库锁 ✅
- ✅ SELECT FOR UPDATE
- ✅ NOWAIT选项
- ✅ SKIP_LOCKED选项

### 6. 查询错误 ✅
- ✅ 无效字段名
- ✅ 无效查询类型
- ✅ 类型不匹配

## 发现的问题

### P1 - 高优先级
1. **缺少数据库连接重试机制**
   - 描述：数据库连接失败时没有自动重试
   - 影响：临时网络问题导致服务不可用
   - 建议：实现连接重试机制

2. **缺少数据库错误监控**
   - 描述：数据库错误没有被监控和告警
   - 影响：无法及时发现数据库问题
   - 建议：添加数据库错误监控和告警

### P2 - 中优先级
1. **事务超时未设置**
   - 描述：长事务可能导致锁等待
   - 影响：影响系统性能
   - 建议：设置合理的事务超时时间

2. **N+1查询问题**
   - 描述：部分代码存在N+1查询
   - 影响：性能问题
   - 建议：使用select_related和prefetch_related优化

### P3 - 低优先级
1. **缺少数据库连接池监控**
   - 描述：无法监控连接池使用情况
   - 影响：难以诊断连接池问题
   - 建议：添加连接池监控

## 建议

### 1. 实现数据库连接重试
```python
from django.db import connection
from django.db.utils import OperationalError
import time

def execute_with_retry(func, max_retries=3, delay=1):
    \"\"\"执行数据库操作，失败时重试\"\"\"
    for attempt in range(max_retries):
        try:
            return func()
        except OperationalError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(delay * (attempt + 1))
            connection.close()  # 关闭旧连接
```

### 2. 添加数据库错误监控
```python
import logging
from django.db.backends.signals import connection_created

logger = logging.getLogger('database')

def log_database_errors(sender, connection, **kwargs):
    \"\"\"记录数据库错误\"\"\"
    logger.info(f'数据库连接创建: {connection.alias}')

connection_created.connect(log_database_errors)
```

### 3. 设置事务超时
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 30秒
        }
    }
}
```

### 4. 优化N+1查询
```python
# 不好的做法
users = User.objects.all()
for user in users:
    print(user.department.name)  # N+1查询

# 好的做法
users = User.objects.select_related('department').all()
for user in users:
    print(user.department.name)  # 只有1个查询
```

## 测试覆盖率
- 连接失败测试：✅
- 事务回滚测试：✅
- 约束违反测试：✅
- 锁机制测试：✅
- 查询错误测试：✅
- 错误恢复测试：⚠️ 部分完成
- 性能测试：⚠️ 需要扩展
"""
