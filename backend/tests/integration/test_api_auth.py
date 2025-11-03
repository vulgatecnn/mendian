#!/usr/bin/env python
"""
认证API集成测试
测试用户认证相关的API端点
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from system_management.models import Department

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=999,
        defaults={'name': '测试部门'}
    )
    return department


@pytest.fixture
def test_user(db, test_department):
    """创建测试用户"""
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'phone': '13800138000',
            'department': test_department,
            'first_name': '测试',
            'last_name': '用户'
        }
    )
    if created or not user.check_password('testpass123'):
        user.set_password('testpass123')
        user.save()
    return user


@pytest.fixture
def api_client():
    """创建API客户端"""
    return Client()


class TestUserAuthentication:
    """用户认证测试"""
    
    def test_login_with_username_and_password(self, api_client, test_user):
        """测试使用用户名和密码登录"""
        # Arrange - 准备测试数据
        login_data = {
            "login_type": "username_password",
            "username": "testuser",
            "password": "testpass123"
        }
        
        # Act - 执行登录操作
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert - 验证结果
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data['data']
        assert 'refresh_token' in data['data']
        assert data['data']['user']['username'] == 'testuser'
        assert data['data']['token_type'] == 'Bearer'
        assert 'expires_in' in data['data']
    
    def test_login_with_invalid_password(self, api_client, test_user):
        """测试使用无效密码登录"""
        # Arrange
        login_data = {
            "login_type": "username_password",
            "username": "testuser",
            "password": "wrongpassword"
        }
        
        # Act
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 401
        data = response.json()
        assert '密码' in data['message'] or 'password' in data['message'].lower()
    
    def test_login_with_phone_and_password(self, api_client, test_user):
        """测试使用手机号和密码登录"""
        # Arrange
        login_data = {
            "login_type": "phone_password",
            "phone": "13800138000",
            "password": "testpass123"
        }
        
        # Act
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data['data']
        assert data['data']['user']['phone'] == '13800138000'
    
    def test_login_with_nonexistent_user(self, api_client):
        """测试使用不存在的用户登录"""
        # Arrange
        login_data = {
            "login_type": "username_password",
            "username": "nonexistentuser",
            "password": "somepassword"
        }
        
        # Act
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [401, 404]


class TestTokenManagement:
    """令牌管理测试"""
    
    def test_refresh_token(self, api_client, test_user):
        """测试刷新令牌"""
        # Arrange - 先登录获取令牌
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
        refresh_token = login_response.json()['data']['refresh_token']
        
        # Act - 刷新令牌
        refresh_data = {"refresh_token": refresh_token}
        response = api_client.post(
            '/api/auth/refresh-token/',
            data=refresh_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'access_token' in data['data']
        assert 'refresh_token' in data['data']
        assert data['data']['token_type'] == 'Bearer'
    
    def test_refresh_with_invalid_token(self, api_client):
        """测试使用无效令牌刷新"""
        # Arrange
        refresh_data = {"refresh_token": "invalid_token_string"}
        
        # Act
        response = api_client.post(
            '/api/auth/refresh-token/',
            data=refresh_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [400, 401]
    
    def test_logout(self, api_client, test_user):
        """测试登出"""
        # Arrange - 先登录
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
        
        # Act - 登出
        response = api_client.post(
            '/api/auth/logout/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert '成功' in data['message'] or 'success' in data['message'].lower()


class TestUserProfile:
    """用户信息测试"""
    
    def test_get_profile_with_valid_token(self, api_client, test_user):
        """测试使用有效令牌获取个人信息"""
        # Arrange - 先登录
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
        
        # Act - 获取个人信息
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['data']['username'] == 'testuser'
        assert data['data']['phone'] == '13800138000'
        assert 'department_name' in data['data']
    
    def test_get_profile_without_token(self, api_client):
        """测试未认证时获取个人信息"""
        # Act
        response = api_client.get('/api/profile/')
        
        # Assert
        assert response.status_code in [401, 403]


class TestSMSVerification:
    """短信验证码测试"""
    
    def test_send_sms_code(self, api_client, test_user):
        """测试发送短信验证码"""
        # Arrange
        sms_data = {"phone": "13800138000"}
        
        # Act
        response = api_client.post(
            '/api/auth/send-sms-code/',
            data=sms_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert '成功' in data['message'] or 'success' in data['message'].lower()
    
    def test_send_sms_code_with_invalid_phone(self, api_client):
        """测试使用无效手机号发送短信验证码"""
        # Arrange
        sms_data = {"phone": "invalid_phone"}
        
        # Act
        response = api_client.post(
            '/api/auth/send-sms-code/',
            data=sms_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [400, 422]


# 用于手动运行的测试脚本
if __name__ == "__main__":
    import os
    import sys
    import django
    
    # 设置Django环境
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    django.setup()
    
    # 运行pytest
    pytest.main([__file__, '-v'])
