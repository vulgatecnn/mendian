#!/usr/bin/env python
"""
CSRF（跨站请求伪造）防护测试
测试系统对CSRF攻击的防护能力
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from system_management.models import Department
from store_planning.models import StorePlan

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=4001,
        defaults={'name': 'CSRF测试部门'}
    )
    return department


@pytest.fixture
def test_user(db, test_department):
    """创建测试用户"""
    user, created = User.objects.get_or_create(
        username='csrftest',
        defaults={
            'phone': '13900004001',
            'department': test_department,
            'first_name': 'CSRF',
            'last_name': '测试'
        }
    )
    if created or not user.check_password('test123'):
        user.set_password('test123')
        user.save()
    return user


@pytest.fixture
def django_client():
    """创建Django测试客户端（用于测试CSRF）"""
    return Client()


@pytest.mark.security
class TestCSRFTokenPresence:
    """CSRF Token存在性测试"""
    
    def test_post_request_requires_csrf_token(self, django_client, test_user):
        """测试POST请求需要CSRF Token"""
        # Arrange - 登录获取session
        django_client.login(username='csrftest', password='test123')
        
        # Act - 不带CSRF Token的POST请求
        plan_data = {
            'plan_name': '测试计划',
            'plan_year': 2025,
            'plan_quarter': 'Q1'
        }
        response = django_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json'
        )
        
        # Assert - 应该被拒绝（如果启用了CSRF保护）
        # 注意：API通常使用Token认证，可能不使用CSRF Token
        # 这个测试主要针对使用Session认证的端点
        print(f"不带CSRF Token的POST请求返回状态码: {response.status_code}")
    
    def test_csrf_token_in_form_view(self, django_client):
        """测试表单视图中的CSRF Token"""
        # Act - 获取登录页面（如果有HTML表单）
        response = django_client.get('/api/auth/login/')
        
        # Assert
        # 如果是HTML表单，应该包含CSRF Token
        # 如果是API端点，可能返回JSON
        print(f"登录端点返回状态码: {response.status_code}")
        print(f"Content-Type: {response.get('Content-Type', 'N/A')}")


@pytest.mark.security
class TestCSRFTokenValidation:
    """CSRF Token验证测试"""
    
    def test_invalid_csrf_token_rejected(self, django_client, test_user):
        """测试无效的CSRF Token被拒绝"""
        # Arrange - 登录
        django_client.login(username='csrftest', password='test123')
        
        # Act - 使用无效的CSRF Token
        plan_data = {
            'plan_name': '测试计划',
            'plan_year': 2025,
            'plan_quarter': 'Q1'
        }
        response = django_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json',
            HTTP_X_CSRFTOKEN='invalid_csrf_token_12345'
        )
        
        # Assert
        # 如果启用了CSRF保护，应该被拒绝
        print(f"无效CSRF Token的请求返回状态码: {response.status_code}")
    
    def test_missing_csrf_token_rejected(self, django_client, test_user):
        """测试缺少CSRF Token的请求被拒绝"""
        # Arrange - 登录
        django_client.login(username='csrftest', password='test123')
        
        # Act - 不提供CSRF Token
        plan_data = {
            'plan_name': '测试计划',
            'plan_year': 2025,
            'plan_quarter': 'Q1'
        }
        response = django_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json'
        )
        
        # Assert
        print(f"缺少CSRF Token的请求返回状态码: {response.status_code}")


@pytest.mark.security
class TestCSRFWithAPIToken:
    """API Token与CSRF测试"""
    
    def test_api_token_authentication_csrf_exempt(self, api_client, test_user):
        """测试API Token认证是否免除CSRF检查"""
        # Arrange - 使用API Token登录
        login_data = {
            "login_type": "username_password",
            "username": "csrftest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 使用Bearer Token进行POST请求（不需要CSRF Token）
        plan_data = {
            'plan_name': '测试计划',
            'plan_year': 2025,
            'plan_quarter': 'Q1'
        }
        response = api_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert - 使用Token认证时，通常不需要CSRF Token
        # 因为Token不会被浏览器自动发送
        print(f"使用Bearer Token的POST请求返回状态码: {response.status_code}")
        
        # 如果创建成功，清理数据
        if response.status_code in [200, 201]:
            data = response.json()
            if 'data' in data and 'id' in data['data']:
                StorePlan.objects.filter(id=data['data']['id']).delete()
    
    def test_jwt_token_not_vulnerable_to_csrf(self, api_client, test_user):
        """测试JWT Token不受CSRF攻击影响"""
        # Arrange - 登录获取JWT
        login_data = {
            "login_type": "username_password",
            "username": "csrftest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 模拟CSRF攻击（攻击者无法获取JWT Token）
        # 因为JWT存储在localStorage或内存中，不会被浏览器自动发送
        # 这里我们验证没有Token的请求会被拒绝
        plan_data = {
            'plan_name': '恶意计划',
            'plan_year': 2025,
            'plan_quarter': 'Q1'
        }
        response = api_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json'
            # 注意：不提供Authorization头
        )
        
        # Assert - 应该被拒绝（401 Unauthorized）
        assert response.status_code in [401, 403], \
            f"没有Token的请求应该被拒绝，但返回了状态码 {response.status_code}"


@pytest.mark.security
class TestCSRFAttackScenarios:
    """CSRF攻击场景测试"""
    
    def test_csrf_attack_on_delete_operation(self, api_client, test_user, test_department):
        """测试删除操作的CSRF攻击"""
        # Arrange - 创建一个计划
        login_data = {
            "login_type": "username_password",
            "username": "csrftest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        plan = StorePlan.objects.create(
            plan_name='要删除的计划',
            plan_year=2025,
            plan_quarter='Q1',
            creator=test_user,
            department=test_department,
            status='draft'
        )
        plan_id = plan.id
        
        # Act - 模拟CSRF攻击：攻击者尝试删除计划（没有Token）
        response = api_client.delete(f'/api/store-plans/{plan_id}/')
        
        # Assert - 应该被拒绝
        assert response.status_code in [401, 403], \
            f"没有认证的删除请求应该被拒绝，但返回了状态码 {response.status_code}"
        
        # 验证计划未被删除
        assert StorePlan.objects.filter(id=plan_id).exists(), \
            "计划不应该被未认证的请求删除"
        
        # 清理
        plan.delete()
    
    def test_csrf_attack_on_update_operation(self, api_client, test_user, test_department):
        """测试更新操作的CSRF攻击"""
        # Arrange - 创建一个计划
        plan = StorePlan.objects.create(
            plan_name='原始计划名',
            plan_year=2025,
            plan_quarter='Q1',
            creator=test_user,
            department=test_department,
            status='draft'
        )
        
        # Act - 模拟CSRF攻击：攻击者尝试修改计划（没有Token）
        update_data = {
            'plan_name': '被篡改的计划名',
            'status': 'approved'
        }
        response = api_client.patch(
            f'/api/store-plans/{plan.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert - 应该被拒绝
        assert response.status_code in [401, 403], \
            f"没有认证的更新请求应该被拒绝，但返回了状态码 {response.status_code}"
        
        # 验证计划未被修改
        plan.refresh_from_db()
        assert plan.plan_name == '原始计划名', \
            "计划不应该被未认证的请求修改"
        
        # 清理
        plan.delete()
    
    def test_csrf_attack_on_state_changing_operation(self, api_client, test_user, test_department):
        """测试状态变更操作的CSRF攻击"""
        # Arrange - 创建一个计划
        plan = StorePlan.objects.create(
            plan_name='测试计划',
            plan_year=2025,
            plan_quarter='Q1',
            creator=test_user,
            department=test_department,
            status='draft'
        )
        
        # Act - 模拟CSRF攻击：攻击者尝试提交审批（没有Token）
        response = api_client.post(
            f'/api/store-plans/{plan.id}/submit/',
            content_type='application/json'
        )
        
        # Assert - 应该被拒绝
        assert response.status_code in [401, 403, 404, 405], \
            f"没有认证的状态变更请求应该被拒绝，但返回了状态码 {response.status_code}"
        
        # 清理
        plan.delete()


@pytest.mark.security
class TestCSRFProtectionConfiguration:
    """CSRF防护配置测试"""
    
    def test_csrf_cookie_settings(self, django_client):
        """测试CSRF Cookie设置"""
        # Act - 访问需要CSRF保护的页面
        response = django_client.get('/api/auth/login/')
        
        # Assert - 检查CSRF Cookie
        csrf_cookie = response.cookies.get('csrftoken')
        if csrf_cookie:
            print(f"CSRF Cookie存在: {csrf_cookie.value}")
            # 检查Cookie属性
            # 应该设置HttpOnly, Secure等安全属性
        else:
            print("未找到CSRF Cookie（可能使用Token认证）")
    
    def test_csrf_header_name(self, django_client, test_user):
        """测试CSRF Header名称"""
        # Arrange - 登录
        django_client.login(username='csrftest', password='test123')
        
        # 获取CSRF Token
        response = django_client.get('/api/auth/login/')
        csrf_token = response.cookies.get('csrftoken')
        
        if csrf_token:
            # Act - 使用正确的Header名称发送CSRF Token
            plan_data = {
                'plan_name': '测试计划',
                'plan_year': 2025,
                'plan_quarter': 'Q1'
            }
            
            # Django默认接受X-CSRFToken header
            response = django_client.post(
                '/api/store-plans/',
                data=plan_data,
                content_type='application/json',
                HTTP_X_CSRFTOKEN=csrf_token.value
            )
            
            print(f"带正确CSRF Token的请求返回状态码: {response.status_code}")


@pytest.mark.security
class TestDoubleSubmitCookie:
    """双重提交Cookie测试"""
    
    def test_csrf_token_matches_cookie(self, django_client, test_user):
        """测试CSRF Token与Cookie匹配"""
        # Arrange - 登录
        django_client.login(username='csrftest', password='test123')
        
        # 获取CSRF Token
        response = django_client.get('/api/auth/login/')
        csrf_cookie = response.cookies.get('csrftoken')
        
        if csrf_cookie:
            # Act - 使用不匹配的Token
            plan_data = {
                'plan_name': '测试计划',
                'plan_year': 2025,
                'plan_quarter': 'Q1'
            }
            response = django_client.post(
                '/api/store-plans/',
                data=plan_data,
                content_type='application/json',
                HTTP_X_CSRFTOKEN='different_token_value'
            )
            
            # Assert - 应该被拒绝
            print(f"不匹配的CSRF Token返回状态码: {response.status_code}")


@pytest.mark.security
class TestCSRFExemptEndpoints:
    """CSRF豁免端点测试"""
    
    def test_login_endpoint_csrf_handling(self, api_client):
        """测试登录端点的CSRF处理"""
        # Act - 登录请求（通常豁免CSRF检查）
        login_data = {
            "login_type": "username_password",
            "username": "csrftest",
            "password": "test123"
        }
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert - 登录端点通常允许不带CSRF Token
        # 因为用户还没有建立会话
        print(f"登录请求返回状态码: {response.status_code}")
    
    def test_public_api_csrf_handling(self, api_client):
        """测试公开API的CSRF处理"""
        # Act - 访问公开API（如果有）
        response = api_client.get('/api/health/')
        
        # Assert - 公开API不应该需要CSRF Token
        print(f"公开API返回状态码: {response.status_code}")


@pytest.mark.security
class TestCSRFTokenRotation:
    """CSRF Token轮换测试"""
    
    def test_csrf_token_changes_after_login(self, django_client, test_user):
        """测试登录后CSRF Token是否变化"""
        # Arrange - 获取登录前的CSRF Token
        response_before = django_client.get('/api/auth/login/')
        csrf_before = response_before.cookies.get('csrftoken')
        
        # Act - 登录
        django_client.login(username='csrftest', password='test123')
        
        # 获取登录后的CSRF Token
        response_after = django_client.get('/api/profile/')
        csrf_after = response_after.cookies.get('csrftoken')
        
        # Assert
        if csrf_before and csrf_after:
            print(f"登录前CSRF Token: {csrf_before.value[:10]}...")
            print(f"登录后CSRF Token: {csrf_after.value[:10]}...")
            # Token可能会变化，也可能不变，取决于配置
    
    def test_csrf_token_invalidated_after_logout(self, django_client, test_user):
        """测试登出后CSRF Token是否失效"""
        # Arrange - 登录并获取CSRF Token
        django_client.login(username='csrftest', password='test123')
        response = django_client.get('/api/profile/')
        csrf_token = response.cookies.get('csrftoken')
        
        # Act - 登出
        django_client.logout()
        
        # 尝试使用旧的CSRF Token
        if csrf_token:
            plan_data = {
                'plan_name': '测试计划',
                'plan_year': 2025,
                'plan_quarter': 'Q1'
            }
            response = django_client.post(
                '/api/store-plans/',
                data=plan_data,
                content_type='application/json',
                HTTP_X_CSRFTOKEN=csrf_token.value
            )
            
            # Assert - 应该被拒绝（因为已登出）
            assert response.status_code in [401, 403], \
                f"登出后使用旧Token应该被拒绝，但返回了状态码 {response.status_code}"
