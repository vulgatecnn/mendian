"""
集成测试 - 权限控制和角色验证API测试
测试权限控制和角色验证功能
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from system_management.models import Department, Role, Permission

User = get_user_model()


@pytest.fixture
def test_permission(db):
    """创建测试权限"""
    permission, _ = Permission.objects.get_or_create(
        code='test.view',
        defaults={
            'name': '查看测试',
            'module': 'test',
            'description': '测试权限'
        }
    )
    return permission


@pytest.fixture
def test_role_with_permission(db, test_permission):
    """创建带权限的测试角色"""
    role, _ = Role.objects.get_or_create(
        name='测试角色',
        defaults={'description': '用于测试的角色'}
    )
    role.permissions.add(test_permission)
    return role


@pytest.fixture
def user_with_role(db, test_department, test_role_with_permission):
    """创建带角色的测试用户"""
    user, created = User.objects.get_or_create(
        username='roleuser',
        defaults={
            'phone': '13800138001',
            'department': test_department,
            'first_name': '角色',
            'last_name': '用户'
        }
    )
    if created or not user.check_password('testpass123'):
        user.set_password('testpass123')
        user.save()
    user.roles.add(test_role_with_permission)
    return user


@pytest.mark.integration
class TestRolePermissionAPI:
    """角色权限API测试"""
    
    def test_get_user_roles(self, api_client, user_with_role):
        """测试获取用户角色列表"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "roleuser",
            "password": "testpass123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取个人信息（包含角色）
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()['data']
        # 检查是否包含角色信息（实际API返回role_names）
        assert 'role_names' in data or 'role_list' in data or 'roles' in data
        if 'role_names' in data:
            assert len(data['role_names']) > 0
    
    def test_user_has_permission(self, api_client, user_with_role, test_permission):
        """测试用户权限检查"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "roleuser",
            "password": "testpass123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 检查用户是否有权限
        # 注意：这里假设有权限检查API，实际API路径可能不同
        has_permission = user_with_role.has_permission(test_permission.code)
        
        # Assert
        assert has_permission is True
    
    def test_user_without_permission(self, api_client, test_user):
        """测试没有权限的用户"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "testuser",
            "password": "testpass123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 检查用户是否有权限
        has_permission = test_user.has_permission('test.view')
        
        # Assert
        assert has_permission is False


@pytest.mark.integration
class TestAccessControl:
    """访问控制测试"""
    
    def test_access_protected_resource_without_token(self, api_client):
        """测试未认证访问受保护资源"""
        # Act
        response = api_client.get('/api/profile/')
        
        # Assert
        assert response.status_code in [401, 403]
    
    def test_access_protected_resource_with_invalid_token(self, api_client):
        """测试使用无效令牌访问受保护资源"""
        # Act
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION='Bearer invalid_token_string'
        )
        
        # Assert
        assert response.status_code in [401, 403]
    
    def test_access_protected_resource_with_valid_token(self, api_client, test_user):
        """测试使用有效令牌访问受保护资源"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "testuser",
            "password": "testpass123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200


@pytest.mark.integration
class TestSuperuserAccess:
    """超级管理员访问测试"""
    
    def test_superuser_has_all_permissions(self, admin_user):
        """测试超级管理员拥有所有权限"""
        # Act
        has_permission = admin_user.has_permission('any.permission.code')
        
        # Assert
        assert has_permission is True
    
    def test_superuser_login(self, api_client, admin_user):
        """测试超级管理员登录"""
        # Arrange
        login_data = {
            "login_type": "username_password",
            "username": "adminuser",
            "password": "adminpass123"
        }
        
        # Act
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()['data']
        assert 'access_token' in data
        # 验证用户是超级管理员
        assert admin_user.is_superuser is True


@pytest.mark.integration
class TestRoleManagement:
    """角色管理测试"""
    
    def test_role_has_permissions(self, test_role_with_permission, test_permission):
        """测试角色包含权限"""
        # Act
        permissions = test_role_with_permission.permissions.all()
        
        # Assert
        assert test_permission in permissions
    
    def test_role_has_users(self, user_with_role, test_role_with_permission):
        """测试角色包含用户"""
        # Act
        users = test_role_with_permission.users.all()
        
        # Assert
        assert user_with_role in users
    
    def test_add_permission_to_role(self, db, test_role_with_permission):
        """测试向角色添加权限"""
        # Arrange
        new_permission = Permission.objects.create(
            code='test.edit',
            name='编辑测试',
            module='test'
        )
        
        # Act
        test_role_with_permission.permissions.add(new_permission)
        
        # Assert
        assert new_permission in test_role_with_permission.permissions.all()
    
    def test_remove_permission_from_role(self, test_role_with_permission, test_permission):
        """测试从角色移除权限"""
        # Act
        test_role_with_permission.permissions.remove(test_permission)
        
        # Assert
        assert test_permission not in test_role_with_permission.permissions.all()
