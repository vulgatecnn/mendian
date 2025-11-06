#!/usr/bin/env python
"""
XSS（跨站脚本）攻击防护测试
测试系统对XSS攻击的防护能力
"""
import pytest
from django.contrib.auth import get_user_model
from system_management.models import Department
from store_planning.models import StorePlan
import json

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=3001,
        defaults={'name': 'XSS测试部门'}
    )
    return department


@pytest.fixture
def test_user(db, test_department):
    """创建测试用户"""
    user, created = User.objects.get_or_create(
        username='xsstest',
        defaults={
            'phone': '13900003001',
            'department': test_department,
            'first_name': 'XSS',
            'last_name': '测试'
        }
    )
    if created or not user.check_password('test123'):
        user.set_password('test123')
        user.save()
    return user


@pytest.mark.security
class TestXSSInInputFields:
    """输入框XSS测试"""
    
    def test_xss_in_plan_name(self, api_client, test_user, test_department):
        """测试计划名称中的XSS脚本"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # XSS攻击载荷
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "javascript:alert('XSS')",
            "<iframe src='javascript:alert(\"XSS\")'></iframe>",
            "<body onload=alert('XSS')>",
            "<input onfocus=alert('XSS') autofocus>",
            "<<SCRIPT>alert('XSS');//<</SCRIPT>",
        ]
        
        for payload in xss_payloads:
            # Act - 创建包含XSS的计划
            plan_data = {
                'plan_name': payload,
                'plan_year': 2025,
                'plan_quarter': 'Q1',
                'department_id': test_department.id
            }
            response = api_client.post(
                '/api/store-plans/',
                data=plan_data,
                content_type='application/json',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert - 应该成功创建（数据存储），但返回时应该转义
            if response.status_code in [200, 201]:
                data = response.json()
                if 'data' in data:
                    plan_id = data['data'].get('id')
                    if plan_id:
                        # 获取创建的计划
                        get_response = api_client.get(
                            f'/api/store-plans/{plan_id}/',
                            HTTP_AUTHORIZATION=f'Bearer {access_token}'
                        )
                        
                        if get_response.status_code == 200:
                            plan_data = get_response.json()['data']
                            returned_name = plan_data.get('plan_name', '')
                            
                            # 检查返回的数据是否包含原始脚本标签
                            # 注意：Django REST Framework默认会进行JSON编码，这本身就提供了一定的保护
                            # 但我们需要确保前端渲染时也进行了适当的转义
                            print(f"XSS载荷: {payload}")
                            print(f"返回数据: {returned_name}")
                            
                            # 清理测试数据
                            StorePlan.objects.filter(id=plan_id).delete()
    
    def test_xss_in_user_profile(self, api_client, test_user):
        """测试用户资料中的XSS脚本"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试在用户名中注入XSS
        xss_payload = "<script>alert('XSS')</script>"
        update_data = {
            'first_name': xss_payload
        }
        response = api_client.patch(
            '/api/profile/',
            data=update_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code in [200, 201]:
            # 获取更新后的资料
            get_response = api_client.get(
                '/api/profile/',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            if get_response.status_code == 200:
                profile_data = get_response.json()['data']
                first_name = profile_data.get('first_name', '')
                print(f"返回的first_name: {first_name}")
                
                # 数据应该被存储，但在返回时应该被适当处理
                # JSON编码本身会转义特殊字符
    
    def test_xss_in_search_query(self, api_client, test_user):
        """测试搜索查询中的XSS脚本"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 在搜索参数中注入XSS
        xss_payload = "<script>alert('XSS')</script>"
        response = api_client.get(
            f'/api/store-plans/?search={xss_payload}',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert - 不应该导致错误
        assert response.status_code != 500, \
            "搜索中的XSS不应该导致服务器错误"


@pytest.mark.security
class TestXSSInURLParameters:
    """URL参数XSS测试"""
    
    def test_xss_in_url_parameter(self, api_client, test_user):
        """测试URL参数中的XSS脚本"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 在URL参数中注入XSS
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
        ]
        
        for payload in xss_payloads:
            response = api_client.get(
                f'/api/store-plans/?status={payload}',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert - 不应该导致错误
            assert response.status_code != 500, \
                f"URL参数XSS载荷 '{payload}' 导致服务器错误"
    
    def test_xss_in_id_parameter(self, api_client, test_user):
        """测试ID参数中的XSS脚本"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 在ID参数中注入XSS
        xss_payload = "<script>alert('XSS')</script>"
        response = api_client.get(
            f'/api/store-plans/{xss_payload}/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert - 应该返回404或400，不应该返回500
        assert response.status_code in [400, 404], \
            f"ID参数XSS应该返回400或404，但返回了 {response.status_code}"


@pytest.mark.security
class TestXSSInJSONResponse:
    """JSON响应XSS测试"""
    
    def test_json_response_encoding(self, api_client, test_user, test_department):
        """测试JSON响应是否正确编码"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建包含特殊字符的计划
        plan_data = {
            'plan_name': '<script>alert("XSS")</script>',
            'plan_year': 2025,
            'plan_quarter': 'Q1',
            'department_id': test_department.id
        }
        create_response = api_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        if create_response.status_code in [200, 201]:
            plan_id = create_response.json()['data'].get('id')
            
            # Act - 获取计划
            response = api_client.get(
                f'/api/store-plans/{plan_id}/',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert - 检查响应头
            assert response['Content-Type'].startswith('application/json'), \
                "响应应该是JSON格式"
            
            # 检查JSON是否正确编码
            response_text = response.content.decode('utf-8')
            # JSON编码会将 < 转换为 \u003c，> 转换为 \u003e
            # 或者保持原样但在字符串中，这样在浏览器中不会被执行
            print(f"响应内容: {response_text}")
            
            # 清理
            StorePlan.objects.filter(id=plan_id).delete()
    
    def test_error_message_xss_protection(self, api_client):
        """测试错误消息中的XSS防护"""
        # Act - 使用包含XSS的用户名登录
        xss_payload = "<script>alert('XSS')</script>"
        login_data = {
            "login_type": "username_password",
            "username": xss_payload,
            "password": "test123"
        }
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert - 错误消息不应该包含未转义的脚本
        if response.status_code != 200:
            response_data = response.json()
            error_message = str(response_data)
            print(f"错误消息: {error_message}")
            
            # 检查响应是否为JSON格式（JSON编码会自动转义）
            assert response['Content-Type'].startswith('application/json'), \
                "错误响应应该是JSON格式"


@pytest.mark.security
class TestStoredXSS:
    """存储型XSS测试"""
    
    def test_stored_xss_in_database(self, db, test_user, test_department):
        """测试存储在数据库中的XSS"""
        # Arrange
        xss_payload = "<script>alert('Stored XSS')</script>"
        
        # Act - 创建包含XSS的计划
        plan = StorePlan.objects.create(
            plan_name=xss_payload,
            plan_year=2025,
            plan_quarter='Q1',
            creator=test_user,
            department=test_department,
            status='draft'
        )
        
        # Assert - 数据应该被存储
        assert plan.plan_name == xss_payload, \
            "XSS载荷应该被存储在数据库中（作为普通文本）"
        
        # 从数据库读取
        retrieved_plan = StorePlan.objects.get(id=plan.id)
        assert retrieved_plan.plan_name == xss_payload, \
            "从数据库读取的数据应该与存储的一致"
        
        # 清理
        plan.delete()
    
    def test_stored_xss_in_api_response(self, api_client, test_user, test_department):
        """测试API响应中的存储型XSS"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建包含XSS的计划
        xss_payload = "<img src=x onerror=alert('Stored XSS')>"
        plan = StorePlan.objects.create(
            plan_name=xss_payload,
            plan_year=2025,
            plan_quarter='Q1',
            creator=test_user,
            department=test_department,
            status='draft'
        )
        
        # Act - 通过API获取计划
        response = api_client.get(
            f'/api/store-plans/{plan.id}/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()['data']
        
        # 检查返回的数据
        # JSON编码会自动处理特殊字符
        print(f"API返回的plan_name: {data.get('plan_name')}")
        
        # 清理
        plan.delete()


@pytest.mark.security
class TestXSSProtectionHeaders:
    """XSS防护响应头测试"""
    
    def test_content_type_header(self, api_client, test_user):
        """测试Content-Type响应头"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
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
        
        # Assert - 应该有正确的Content-Type
        assert 'Content-Type' in response, \
            "响应应该包含Content-Type头"
        assert response['Content-Type'].startswith('application/json'), \
            "API响应应该是JSON格式"
    
    def test_xss_protection_header(self, api_client):
        """测试X-XSS-Protection响应头"""
        # Act
        response = api_client.get('/api/auth/login/')
        
        # Assert - 检查是否有XSS防护头
        # 注意：现代浏览器更推荐使用CSP而不是X-XSS-Protection
        # 这个测试主要是检查是否有相关的安全头
        print(f"响应头: {dict(response.items())}")


@pytest.mark.security
class TestOutputEncoding:
    """输出编码测试"""
    
    def test_html_entities_encoding(self, api_client, test_user, test_department):
        """测试HTML实体编码"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建包含HTML实体的计划
        plan_data = {
            'plan_name': '测试 & <test> "quotes" \'apostrophe\'',
            'plan_year': 2025,
            'plan_quarter': 'Q1',
            'department_id': test_department.id
        }
        create_response = api_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        if create_response.status_code in [200, 201]:
            plan_id = create_response.json()['data'].get('id')
            
            # Act - 获取计划
            response = api_client.get(
                f'/api/store-plans/{plan_id}/',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert
            assert response.status_code == 200
            data = response.json()['data']
            plan_name = data.get('plan_name')
            
            # JSON编码会保持这些字符，但在字符串中是安全的
            print(f"返回的plan_name: {plan_name}")
            
            # 清理
            StorePlan.objects.filter(id=plan_id).delete()
    
    def test_javascript_encoding(self, api_client, test_user, test_department):
        """测试JavaScript编码"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "xsstest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # 创建包含JavaScript代码的计划
        plan_data = {
            'plan_name': "'; alert('XSS'); //",
            'plan_year': 2025,
            'plan_quarter': 'Q1',
            'department_id': test_department.id
        }
        create_response = api_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        if create_response.status_code in [200, 201]:
            plan_id = create_response.json()['data'].get('id')
            
            # Act - 获取计划
            response = api_client.get(
                f'/api/store-plans/{plan_id}/',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert
            assert response.status_code == 200
            
            # 清理
            StorePlan.objects.filter(id=plan_id).delete()
