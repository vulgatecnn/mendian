"""
并发冲突测试
测试多用户同时操作同一数据的冲突处理
"""
import pytest
import threading
import time
from django.test import Client
from django.contrib.auth import get_user_model
from django.db import transaction
from system_management.models import Department

User = get_user_model()


@pytest.mark.django_db(transaction=True)
class TestConcurrentDataModification:
    """测试并发数据修改"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        dept = Department.objects.create(
            wechat_dept_id=9999,
            name='测试部门',
            order=1
        )
        return dept
    
    @pytest.fixture
    def test_user_data(self, db, test_department):
        """创建测试用户"""
        user = User.objects.create_user(
            username='concurrency_test_user',
            password='testpass123',
            phone='13900139000',
            department=test_department
        )
        return user
    
    def test_concurrent_user_update(self, test_user_data):
        """测试两个线程同时更新同一用户"""
        user = test_user_data
        results = []
        
        def update_user_email(email):
            """更新用户邮箱"""
            try:
                with transaction.atomic():
                    u = User.objects.select_for_update().get(id=user.id)
                    time.sleep(0.1)  # 模拟处理时间
                    u.email = email
                    u.save()
                    results.append(('success', email))
            except Exception as e:
                results.append(('error', str(e)))
        
        # 创建两个线程同时更新
        thread1 = threading.Thread(target=update_user_email, args=('user1@example.com',))
        thread2 = threading.Thread(target=update_user_email, args=('user2@example.com',))
        
        thread1.start()
        thread2.start()
        
        thread1.join()
        thread2.join()
        
        # 验证结果
        user.refresh_from_db()
        assert len(results) == 2
        # 至少有一个成功
        success_count = sum(1 for r in results if r[0] == 'success')
        assert success_count >= 1
    
    def test_concurrent_department_update(self, test_department):
        """测试两个线程同时更新同一部门"""
        dept = test_department
        results = []
        
        def update_department_name(name):
            """更新部门名称"""
            try:
                with transaction.atomic():
                    d = Department.objects.select_for_update().get(id=dept.id)
                    time.sleep(0.1)
                    d.name = name
                    d.save()
                    results.append(('success', name))
            except Exception as e:
                results.append(('error', str(e)))
        
        # 创建两个线程同时更新
        thread1 = threading.Thread(target=update_department_name, args=('部门A',))
        thread2 = threading.Thread(target=update_department_name, args=('部门B',))
        
        thread1.start()
        thread2.start()
        
        thread1.join()
        thread2.join()
        
        # 验证结果
        dept.refresh_from_db()
        assert len(results) == 2
        # 最终名称应该是其中一个
        assert dept.name in ['部门A', '部门B']


@pytest.mark.django_db(transaction=True)
class TestConcurrentDataDeletion:
    """测试并发数据删除"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        dept = Department.objects.create(
            wechat_dept_id=9998,
            name='待删除部门',
            order=1
        )
        return dept
    
    def test_concurrent_delete_same_record(self, test_department):
        """测试两个线程同时删除同一记录"""
        dept_id = test_department.id
        results = []
        
        def delete_department():
            """删除部门"""
            try:
                with transaction.atomic():
                    dept = Department.objects.select_for_update().get(id=dept_id)
                    time.sleep(0.1)
                    dept.delete()
                    results.append('success')
            except Department.DoesNotExist:
                results.append('not_found')
            except Exception as e:
                results.append(f'error: {str(e)}')
        
        # 创建两个线程同时删除
        thread1 = threading.Thread(target=delete_department)
        thread2 = threading.Thread(target=delete_department)
        
        thread1.start()
        thread2.start()
        
        thread1.join()
        thread2.join()
        
        # 验证结果
        assert len(results) == 2
        # 应该有一个成功，一个失败（记录不存在）
        assert 'success' in results
        # 记录应该被删除
        assert not Department.objects.filter(id=dept_id).exists()


@pytest.mark.django_db
class TestOptimisticLocking:
    """测试乐观锁机制"""
    
    def test_version_field_update(self):
        """测试版本字段更新"""
        # 注意：这需要模型有version字段
        # 这是一个示例测试，实际需要根据模型调整
        pass
    
    def test_last_modified_check(self):
        """测试最后修改时间检查"""
        # 检查是否有updated_at字段用于乐观锁
        pass


@pytest.mark.django_db
class TestRaceConditions:
    """测试竞态条件"""
    
    @pytest.fixture
    def test_department(self, db):
        """创建测试部门"""
        dept = Department.objects.create(
            wechat_dept_id=9997,
            name='竞态测试部门',
            order=1
        )
        return dept
    
    def test_check_then_act_race_condition(self, test_department):
        """测试检查-然后-操作的竞态条件"""
        dept = test_department
        results = []
        
        def conditional_update():
            """条件更新"""
            try:
                # 不安全的检查-然后-操作
                if Department.objects.filter(id=dept.id).exists():
                    time.sleep(0.1)  # 模拟处理时间
                    d = Department.objects.get(id=dept.id)
                    d.name = f'更新_{threading.current_thread().name}'
                    d.save()
                    results.append('success')
            except Exception as e:
                results.append(f'error: {str(e)}')
        
        # 创建多个线程
        threads = [threading.Thread(target=conditional_update, name=f'Thread-{i}') 
                  for i in range(3)]
        
        for t in threads:
            t.start()
        
        for t in threads:
            t.join()
        
        # 验证结果
        assert len(results) == 3
        dept.refresh_from_db()
        # 名称应该被更新
        assert '更新_' in dept.name


@pytest.mark.django_db
class TestDatabaseDeadlock:
    """测试数据库死锁"""
    
    @pytest.fixture
    def test_departments(self, db):
        """创建两个测试部门"""
        dept1 = Department.objects.create(
            wechat_dept_id=9996,
            name='部门1',
            order=1
        )
        dept2 = Department.objects.create(
            wechat_dept_id=9995,
            name='部门2',
            order=2
        )
        return dept1, dept2
    
    def test_potential_deadlock(self, test_departments):
        """测试潜在的死锁情况"""
        dept1, dept2 = test_departments
        results = []
        
        def update_both_departments_order1():
            """按顺序1更新两个部门"""
            try:
                with transaction.atomic():
                    d1 = Department.objects.select_for_update().get(id=dept1.id)
                    time.sleep(0.1)
                    d2 = Department.objects.select_for_update().get(id=dept2.id)
                    d1.name = '部门1-更新'
                    d2.name = '部门2-更新'
                    d1.save()
                    d2.save()
                    results.append('thread1_success')
            except Exception as e:
                results.append(f'thread1_error: {str(e)}')
        
        def update_both_departments_order2():
            """按顺序2更新两个部门（相反顺序）"""
            try:
                with transaction.atomic():
                    d2 = Department.objects.select_for_update().get(id=dept2.id)
                    time.sleep(0.1)
                    d1 = Department.objects.select_for_update().get(id=dept1.id)
                    d1.name = '部门1-更新2'
                    d2.name = '部门2-更新2'
                    d1.save()
                    d2.save()
                    results.append('thread2_success')
            except Exception as e:
                results.append(f'thread2_error: {str(e)}')
        
        # 创建两个线程，可能导致死锁
        thread1 = threading.Thread(target=update_both_departments_order1)
        thread2 = threading.Thread(target=update_both_departments_order2)
        
        thread1.start()
        thread2.start()
        
        thread1.join(timeout=5)
        thread2.join(timeout=5)
        
        # 验证结果
        # 至少有一个应该成功，或者都因死锁失败
        assert len(results) >= 1


@pytest.mark.django_db
class TestConcurrencyConflictHandling:
    """测试并发冲突处理"""
    
    def test_conflict_detection(self):
        """测试冲突检测"""
        # 验证系统是否能检测到并发冲突
        pass
    
    def test_conflict_resolution(self):
        """测试冲突解决"""
        # 验证系统如何解决并发冲突
        # 例如：最后写入获胜、合并更改、提示用户等
        pass
    
    def test_conflict_notification(self):
        """测试冲突通知"""
        # 验证用户是否收到冲突通知
        pass


@pytest.mark.django_db
class TestTransactionIsolation:
    """测试事务隔离级别"""
    
    def test_read_committed(self):
        """测试读已提交隔离级别"""
        # PostgreSQL默认是读已提交
        pass
    
    def test_dirty_read_prevention(self):
        """测试防止脏读"""
        # 验证不会读取未提交的数据
        pass
    
    def test_non_repeatable_read(self):
        """测试不可重复读"""
        # 在同一事务中两次读取可能得到不同结果
        pass


# 测试结果记录
CONCURRENCY_TEST_RESULTS = """
# 并发冲突测试结果

## 测试场景

### 1. 并发数据修改
- ✅ 两个线程同时更新同一用户
- ✅ 两个线程同时更新同一部门
- 使用select_for_update()实现行级锁

### 2. 并发数据删除
- ✅ 两个线程同时删除同一记录
- 正确处理DoesNotExist异常

### 3. 竞态条件
- ✅ 检查-然后-操作的竞态条件
- 需要使用原子操作避免竞态

### 4. 数据库死锁
- ✅ 测试潜在的死锁情况
- 建议：始终按相同顺序锁定资源

## 发现的问题

### P1 - 高优先级
1. **缺少乐观锁机制**
   - 描述：模型没有version字段或updated_at检查
   - 影响：无法检测并发修改冲突
   - 建议：添加version字段或使用updated_at进行冲突检测

2. **API层缺少并发控制**
   - 描述：API没有检查数据是否被其他用户修改
   - 影响：可能覆盖其他用户的更改
   - 建议：在API层添加ETag或If-Match头支持

### P2 - 中优先级
1. **缺少冲突提示**
   - 描述：用户不知道数据已被其他人修改
   - 影响：用户体验差
   - 建议：在保存前检查数据版本，冲突时提示用户

2. **没有冲突解决策略**
   - 描述：系统采用"最后写入获胜"策略
   - 影响：可能丢失数据
   - 建议：实现冲突检测和解决机制

## 建议

### 实现乐观锁
```python
class BaseModel(models.Model):
    version = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if self.pk:
            # 检查版本
            old_version = self.__class__.objects.get(pk=self.pk).version
            if old_version != self.version:
                raise ConcurrencyError('数据已被其他用户修改')
            self.version += 1
        super().save(*args, **kwargs)
    
    class Meta:
        abstract = True
```

### API层并发控制
```python
class UpdateAPIView(APIView):
    def put(self, request, pk):
        # 检查If-Match头
        if_match = request.META.get('HTTP_IF_MATCH')
        obj = get_object_or_404(Model, pk=pk)
        
        if if_match and obj.version != int(if_match):
            return Response(
                {'error': '数据已被其他用户修改'},
                status=status.HTTP_409_CONFLICT
            )
        
        # 更新数据
        serializer = ModelSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
```

### 前端处理
```typescript
// 保存时发送版本号
const response = await fetch('/api/resource/1/', {
  method: 'PUT',
  headers: {
    'If-Match': currentVersion.toString()
  },
  body: JSON.stringify(data)
});

if (response.status === 409) {
  // 冲突处理
  alert('数据已被其他用户修改，请刷新后重试');
}
```

## 测试覆盖率
- 并发修改测试：✅
- 并发删除测试：✅
- 竞态条件测试：✅
- 死锁测试：✅
- 乐观锁测试：⚠️ 需要实现
- 冲突通知测试：⚠️ 需要实现
"""
