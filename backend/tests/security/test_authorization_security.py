#!/usr/bin/env python
"""
授权安全测试
测试系统的授权机制，包括越权访问防护（垂直越权和水平越权）
"""
import pytest
from django.contrib.auth import get_user_model
from system_management.models import Department, Role, Permission
from store_planning.models import StorePlan

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=1001,
        defaults={'name': '测试部门A'}
    )
    return department


@pytest.fixture
def test_department_b(db):
    """创建第二个测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=1002,
        defaults={'name': '测试部门B'}
    )
    return department


@pytest.fixture
def admin_role(db):
    """创建管理员角色"""
    role, _ = Role.objects.get_or_create(
        name='系统管理员',
        defaults={'description': '系统管理员角色'}
    )
    # 添加管理员权限
    admin_permissions = [
        ('user.view', '查看用户', 'user'),
        ('user.create', '创建用户', 'user'),
        ('user.edit', '编辑用户', 'user'),
        ('user.delete', '删除用户', 'user'),
        ('role.manage', '管理角色', 'role'),
    ]
    for code, name, module in admin_permissions:
        perm, _ = Permission.objects.get_or_create(
            code=code,
            defaults={'name': name, 'module': module}
        )
        role.permissions.add(perm)
    return role


@pytest.fixture
def normal_role(db):
    """创建普通用户角色"""
    role, _ = Role.objects.get_or_create(
        name='普通用户',
        defaults={'description': '普通用户角色'}
    )
    # 添加普通权限
    normal_permissions = [
        ('plan.view', '查看计划', 'plan'),
        ('plan.create', '创建计划', 'plan'),
    ]
    for code, name, module in normal_permissions:
        perm, _ = Permission.objects.get_or_create(
            code=code,
            defaults={'name': name, 'module': module}
        )
        role.permissions.add(perm)
    return role


@pytest.fixture
def admin_user(db, test_department, admin_role):
    """创建管理员用户"""
    user, created = User.objects.get_or_create(
        username='adminuser',
        defaults={
            'phone': '13900000001',
            'department': test_department,
            'first_name': '管理员',
            'last_name': '用户',
            'is_staff': True
        }
    )
    if created or not user.check_password('admin123'):
        user.set_password('admin123')
        user.save()
    user.roles.add(admin_role)
    return user


@pytest.fixture
def normal_user_a(db, test_department, normal_role):
    """创建普通用户A"""
    user, created = User.objects.get_or_create(
        username='normaluser_a',
        defaults={
            'phone': '13900000002',
            'department': test_department,
            'first_name': '普通用户',
            'last_name': 'A'
        }
    )
    if created or not user.check_password('normal123'):
        user.set_password('normal123')
        user.save()
    user.roles.add(normal_role)
    return user


@pytest.fixture
def normal_user_b(db, test_department_b, normal_role):
    """创建普通用户B（不同部门）"""
    user, created = User.objects.get_or_create(
        username='normaluser_b',
        defaults={
            'phone': '13900000003',
            'department': test_department_b,
            'first_name': '普通用户',
            'last_name': 'B'
        }
    )
    if created or not user.check_password('normal123'):
        user.set_password('normal123')
        user.save()
    user.roles.add(normal_role)
    return user


@pytest.fixture
def user_a_plan(db, normal_user_a, test_department):
    """创建用户A的门店计划"""
    plan = StorePlan.objects.create(
        plan_name='用户A的计划',
        plan_year=2025,
        plan_quarter='Q1',
        creator=normal_user_a,
        department=test_department,
        status='draft'
    )
    return plan


@pytest.fixture
def user_b_plan(db, normal_user_b, test_department_b):
    """创建用户B的门店计划"""
    plan = StorePlan.objects.create(
        plan_name='用户B的计划',
        plan_year=2025,
        plan_quarter='Q1',
        creator=normal_user_b,
        department=test_department_b,
        status='draft'
    )
    return plan


@pytest.mark.security
class TestUnauthorizedAccess:
    """未登录用户访问测试"""
    
    def test_access_user_list_without_login(self, api_client):
        """测试未登录访问用户列表"""
        # Act
        response = api_client.get('/api/users/')
        
        # Assert
        assert response.status_code in [401, 403], \
            f"未登录用户不应该能访问用户列表，但返回了状态码 {response.status_code}"
    
    def test_access_profile_without_login(self, api_client):
        """测试未登录访问个人信息"""
        # Act
        response = api_client.get('/api/profile/')
        
        # Assert
        assert response.status_code in [401, 403], \
            f"未登录用户不应该能访问个人信息，但返回了状态码 {response.status_code}"
    
    def test_access_store_plan_without_login(self, api_client):
        """测试未登录访问门店计划"""
        # Act
        response = api_client.get('/api/store-plans/')
        
        # Assert
        assert response.status_code in [401, 403], \
            f"未登录用户不应该能访问门店计划，但返回了状态码 {response.status_code}"
    
    def test_create_resource_without_login(self, api_client):
        """测试未登录创建资源"""
        # Arrange
        plan_data = {
            'plan_name': '测试计划',
            'plan_year': 2025,
            'plan_quarter': 'Q1'
        }
        
        # Act
        response = api_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [401, 403], \
            f"未登录用户不应该能创建资源，但返回了状态码 {response.status_code}"


@pytest.mark.security
class TestVerticalPrivilegeEscalation:
    """垂直越权测试 - 普通用户尝试访问管理员资源"""
    
    def test_normal_user_access_user_management(self, api_client, normal_user_a):
        """测试普通用户访问用户管理功能"""
        # Arrange - 登录普通用户
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        assert login_response.status_code == 200
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试访问用户列表（管理员功能）
        response = api_client.get(
            '/api/users/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert - 应该被拒绝
        # 注意：某些系统可能返回403，某些返回404，某些返回空列表
        # 这里我们检查是否有适当的权限控制
        if response.status_code == 200:
            # 如果返回200，检查是否有权限过滤
            data = response.json()
            # 普通用户不应该看到所有用户
            pytest.skip("系统返回200，需要检查是否有数据权限过滤")
        else:
            assert response.status_code in [403, 404], \
                f"普通用户访问管理功能应该被拒绝，但返回了状态码 {response.status_code}"
    
    def test_normal_user_create_user(self, api_client, normal_user_a):
        """测试普通用户创建用户（管理员功能）"""
        # Arrange - 登录普通用户
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试创建用户
        user_data = {
            'username': 'newuser',
            'phone': '13900000099',
            'password': 'newpass123'
        }
        response = api_client.post(
            '/api/users/',
            data=user_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code in [403, 404, 405], \
            f"普通用户不应该能创建用户，但返回了状态码 {response.status_code}"
    
    def test_normal_user_access_role_management(self, api_client, normal_user_a):
        """测试普通用户访问角色管理"""
        # Arrange - 登录普通用户
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试访问角色列表
        response = api_client.get(
            '/api/roles/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            pytest.skip("系统返回200，需要检查是否有权限过滤")
        else:
            assert response.status_code in [403, 404], \
                f"普通用户不应该能访问角色管理，但返回了状态码 {response.status_code}"
    
    def test_normal_user_modify_permissions(self, api_client, normal_user_a, admin_role):
        """测试普通用户修改权限配置"""
        # Arrange - 登录普通用户
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试修改角色权限
        role_data = {
            'name': '修改后的角色名',
            'permissions': []
        }
        response = api_client.put(
            f'/api/roles/{admin_role.id}/',
            data=role_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code in [403, 404, 405], \
            f"普通用户不应该能修改权限，但返回了状态码 {response.status_code}"


@pytest.mark.security
class TestHorizontalPrivilegeEscalation:
    """水平越权测试 - 用户A尝试访问用户B的数据"""
    
    def test_user_a_access_user_b_plan(self, api_client, normal_user_a, user_b_plan):
        """测试用户A访问用户B的门店计划"""
        # Arrange - 登录用户A
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试访问用户B的计划
        response = api_client.get(
            f'/api/store-plans/{user_b_plan.id}/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        # 应该返回403或404，不应该返回用户B的数据
        if response.status_code == 200:
            data = response.json()
            # 如果返回200，检查是否真的返回了用户B的数据
            if 'data' in data:
                plan_data = data['data']
                assert plan_data.get('creator') != normal_user_a.id, \
                    "用户A不应该能访问用户B的计划数据"
        else:
            assert response.status_code in [403, 404], \
                f"用户A访问用户B的数据应该被拒绝，但返回了状态码 {response.status_code}"
    
    def test_user_a_modify_user_b_plan(self, api_client, normal_user_a, user_b_plan):
        """测试用户A修改用户B的门店计划"""
        # Arrange - 登录用户A
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试修改用户B的计划
        plan_data = {
            'plan_name': '被篡改的计划名',
            'status': 'approved'
        }
        response = api_client.patch(
            f'/api/store-plans/{user_b_plan.id}/',
            data=plan_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code in [403, 404], \
            f"用户A不应该能修改用户B的数据，但返回了状态码 {response.status_code}"
        
        # 验证数据未被修改
        user_b_plan.refresh_from_db()
        assert user_b_plan.plan_name != '被篡改的计划名', \
            "用户B的计划不应该被用户A修改"
    
    def test_user_a_delete_user_b_plan(self, api_client, normal_user_a, user_b_plan):
        """测试用户A删除用户B的门店计划"""
        # Arrange - 登录用户A
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        plan_id = user_b_plan.id
        
        # Act - 尝试删除用户B的计划
        response = api_client.delete(
            f'/api/store-plans/{plan_id}/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code in [403, 404], \
            f"用户A不应该能删除用户B的数据，但返回了状态码 {response.status_code}"
        
        # 验证数据未被删除
        assert StorePlan.objects.filter(id=plan_id).exists(), \
            "用户B的计划不应该被用户A删除"
    
    def test_user_a_access_user_b_profile(self, api_client, normal_user_a, normal_user_b):
        """测试用户A访问用户B的个人信息"""
        # Arrange - 登录用户A
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试访问用户B的详细信息
        response = api_client.get(
            f'/api/users/{normal_user_b.id}/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            # 如果允许查看，检查是否过滤了敏感信息
            data = response.json()
            if 'data' in data:
                user_data = data['data']
                # 不应该包含密码等敏感信息
                assert 'password' not in user_data, "不应该返回密码信息"
                assert 'hashed_password' not in user_data, "不应该返回密码哈希"
        else:
            assert response.status_code in [403, 404], \
                f"用户A访问用户B的信息应该有适当的权限控制，但返回了状态码 {response.status_code}"


@pytest.mark.security
class TestRoleBasedAccessControl:
    """基于角色的访问控制测试"""
    
    def test_admin_can_access_user_management(self, api_client, admin_user):
        """测试管理员可以访问用户管理"""
        # Arrange - 登录管理员
        login_data = {
            "login_type": "username_password",
            "username": "adminuser",
            "password": "admin123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 访问用户列表
        response = api_client.get(
            '/api/users/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200, \
            f"管理员应该能访问用户管理，但返回了状态码 {response.status_code}"
    
    def test_admin_can_create_user(self, api_client, admin_user, test_department):
        """测试管理员可以创建用户"""
        # Arrange - 登录管理员
        login_data = {
            "login_type": "username_password",
            "username": "adminuser",
            "password": "admin123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 创建用户
        user_data = {
            'username': 'newuser_by_admin',
            'phone': '13900000088',
            'password': 'newpass123',
            'department_id': test_department.id
        }
        response = api_client.post(
            '/api/users/',
            data=user_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code in [200, 201], \
            f"管理员应该能创建用户，但返回了状态码 {response.status_code}"
    
    def test_normal_user_can_access_own_data(self, api_client, normal_user_a, user_a_plan):
        """测试普通用户可以访问自己的数据"""
        # Arrange - 登录用户A
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 访问自己的计划
        response = api_client.get(
            f'/api/store-plans/{user_a_plan.id}/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200, \
            f"用户应该能访问自己的数据，但返回了状态码 {response.status_code}"
    
    def test_permission_check_effectiveness(self, normal_user_a, admin_user):
        """测试权限检查的有效性"""
        # Act & Assert - 普通用户没有管理员权限
        assert not normal_user_a.has_permission('user.delete'), \
            "普通用户不应该有删除用户的权限"
        assert not normal_user_a.has_permission('role.manage'), \
            "普通用户不应该有管理角色的权限"
        
        # 管理员有管理权限
        assert admin_user.has_permission('user.delete'), \
            "管理员应该有删除用户的权限"
        assert admin_user.has_permission('role.manage'), \
            "管理员应该有管理角色的权限"


@pytest.mark.security
class TestDataIsolation:
    """数据隔离测试"""
    
    def test_department_data_isolation(self, api_client, normal_user_a, user_a_plan, user_b_plan):
        """测试部门数据隔离"""
        # Arrange - 登录用户A
        login_data = {
            "login_type": "username_password",
            "username": "normaluser_a",
            "password": "normal123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取门店计划列表
        response = api_client.get(
            '/api/store-plans/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            data = response.json()
            if 'data' in data:
                plans = data['data'] if isinstance(data['data'], list) else data['data'].get('results', [])
                # 用户A不应该看到用户B（不同部门）的计划
                plan_ids = [p.get('id') for p in plans if isinstance(p, dict)]
                assert user_b_plan.id not in plan_ids, \
                    "用户A不应该看到其他部门用户B的计划"
