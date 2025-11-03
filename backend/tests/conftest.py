"""
pytest配置文件
提供共享的fixtures和测试配置
"""
import pytest
from django.contrib.auth import get_user_model
from system_management.models import Department, Role

User = get_user_model()


@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """
    数据库设置
    """
    pass


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=999,
        defaults={
            'name': '测试部门',
            'parent': None,
            'order': 1
        }
    )
    return department


@pytest.fixture
def test_role(db):
    """创建测试角色"""
    role, _ = Role.objects.get_or_create(
        code='test_role',
        defaults={
            'name': '测试角色',
            'description': '用于测试的角色'
        }
    )
    return role


@pytest.fixture
def test_user(db, test_department):
    """创建普通测试用户"""
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'phone': '13800138000',
            'department': test_department,
            'first_name': '测试',
            'last_name': '用户',
            'is_active': True,
            'is_staff': False,
            'is_superuser': False
        }
    )
    if created or not user.check_password('testpass123'):
        user.set_password('testpass123')
        user.save()
    return user


@pytest.fixture
def admin_user(db, test_department):
    """创建管理员测试用户"""
    user, created = User.objects.get_or_create(
        username='adminuser',
        defaults={
            'phone': '13800138001',
            'department': test_department,
            'first_name': '管理员',
            'last_name': '用户',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created or not user.check_password('adminpass123'):
        user.set_password('adminpass123')
        user.save()
    return user


@pytest.fixture
def api_client():
    """创建API测试客户端"""
    from django.test import Client
    return Client()


@pytest.fixture
def authenticated_client(api_client, test_user):
    """创建已认证的API客户端"""
    # 登录用户
    login_data = {
        "login_type": "username_password",
        "username": "testuser",
        "password": "testpass123"
    }
    response = api_client.post(
        '/api/auth/login/',
        data=login_data,
        content_type='application/json'
    )
    
    if response.status_code == 200:
        token = response.json()['data']['access_token']
        api_client.defaults = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
    
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """创建管理员已认证的API客户端"""
    # 登录管理员
    login_data = {
        "login_type": "username_password",
        "username": "adminuser",
        "password": "adminpass123"
    }
    response = api_client.post(
        '/api/auth/login/',
        data=login_data,
        content_type='application/json'
    )
    
    if response.status_code == 200:
        token = response.json()['data']['access_token']
        api_client.defaults = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
    
    return api_client


# Pytest标记
def pytest_configure(config):
    """配置pytest标记"""
    config.addinivalue_line(
        "markers", "unit: 标记为单元测试"
    )
    config.addinivalue_line(
        "markers", "integration: 标记为集成测试"
    )
    config.addinivalue_line(
        "markers", "e2e: 标记为端到端测试"
    )
    config.addinivalue_line(
        "markers", "slow: 标记为慢速测试"
    )
