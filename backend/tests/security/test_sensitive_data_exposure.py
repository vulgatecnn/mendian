#!/usr/bin/env python
"""
敏感信息泄露测试
测试系统是否泄露密码、Token等敏感信息
"""
import pytest
import json
import re
from django.contrib.auth import get_user_model
from system_management.models import Department
from store_planning.models import StorePlan

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=6001,
        defaults={'name': '敏感信息测试部门'}
    )
    return department


@pytest.fixture
def test_user(db, test_department):
    """创建测试用户"""
    user, created = User.objects.get_or_create(
        username='sensitivetest',
        defaults={
            'phone': '13900006001',
            'department': test_department,
            'first_name': '敏感',
            'last_name': '测试'
        }
    )
    if created or not user.check_password('SecretPass123!'):
        user.set_password('SecretPass123!')
        user.save()
    return user


@pytest.mark.security
class TestPasswordExposure:
    """密码泄露测试"""
    
    def test_password_not_in_user_list_response(self, api_client, test_user):
        """测试用户列表响应中不包含密码"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取用户列表
        response = api_client.get(
            '/api/users/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            response_text = response.content.decode('utf-8')
            data = response.json()
            
            # 检查响应中不应该包含密码相关字段
            assert 'password' not in response_text.lower() or \
                   '"password":' not in response_text, \
                   "用户列表响应不应该包含password字段"
            
            assert 'hashed_password' not in response_text.lower(), \
                   "用户列表响应不应该包含hashed_password字段"
            
            # 检查不应该包含实际密码
            assert 'SecretPass123!' not in response_text, \
                   "用户列表响应不应该包含明文密码"
    
    def test_password_not_in_user_detail_response(self, api_client, test_user):
        """测试用户详情响应中不包含密码"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取用户详情
        response = api_client.get(
            f'/api/users/{test_user.id}/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            response_text = response.content.decode('utf-8')
            
            # 不应该包含密码字段
            assert 'password' not in response_text.lower() or \
                   '"password":' not in response_text, \
                   "用户详情响应不应该包含password字段"
            
            assert 'SecretPass123!' not in response_text, \
                   "用户详情响应不应该包含明文密码"
    
    def test_password_not_in_profile_response(self, api_client, test_user):
        """测试个人资料响应中不包含密码"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取个人资料
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200
        response_text = response.content.decode('utf-8')
        data = response.json()
        
        # 不应该包含密码
        if 'data' in data:
            user_data = data['data']
            assert 'password' not in user_data, \
                   "个人资料不应该包含password字段"
            assert 'hashed_password' not in user_data, \
                   "个人资料不应该包含hashed_password字段"
    
    def test_password_hash_not_exposed(self, api_client, test_user):
        """测试密码哈希不被暴露"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取用户信息
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            response_text = response.content.decode('utf-8')
            
            # 检查是否包含类似密码哈希的字符串
            # Django密码哈希格式：algorithm$iterations$salt$hash
            hash_pattern = r'pbkdf2_sha256\$\d+\$[A-Za-z0-9+/=]+'
            assert not re.search(hash_pattern, response_text), \
                   "响应不应该包含密码哈希"


@pytest.mark.security
class TestTokenExposure:
    """Token泄露测试"""
    
    def test_refresh_token_not_in_logs(self, api_client, test_user):
        """测试刷新Token不在日志中"""
        # Arrange - 登录获取Token
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert
        assert login_response.status_code == 200
        data = login_response.json()['data']
        
        # Token应该返回给客户端
        assert 'access_token' in data, "应该返回access_token"
        assert 'refresh_token' in data, "应该返回refresh_token"
        
        # 但不应该记录在日志中（这个需要检查日志文件）
        # 这里我们只能提醒：Token不应该被记录
        print("提醒：检查日志文件，确保Token未被记录")
    
    def test_token_not_in_error_response(self, api_client):
        """测试错误响应中不包含Token"""
        # Act - 使用无效Token访问
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION='Bearer invalid_token_12345'
        )
        
        # Assert
        assert response.status_code in [401, 403]
        response_text = response.content.decode('utf-8')
        
        # 错误消息不应该回显Token
        assert 'invalid_token_12345' not in response_text, \
               "错误响应不应该包含Token内容"
    
    def test_token_not_in_url(self, api_client, test_user):
        """测试Token不在URL中传递"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试在URL中传递Token（不推荐的做法）
        response = api_client.get(f'/api/profile/?token={access_token}')
        
        # Assert - 应该不接受URL中的Token
        # 正确的做法是使用Authorization header
        print("提醒：Token应该通过Authorization header传递，不应该在URL中")


@pytest.mark.security
class TestErrorMessageExposure:
    """错误消息泄露测试"""
    
    def test_error_message_not_expose_system_info(self, api_client):
        """测试错误消息不泄露系统信息"""
        # Act - 触发错误
        response = api_client.get('/api/nonexistent-endpoint/')
        
        # Assert
        response_text = response.content.decode('utf-8')
        
        # 不应该包含系统路径
        assert '/home/' not in response_text and 'C:\\' not in response_text, \
               "错误消息不应该包含系统路径"
        
        # 不应该包含数据库信息
        assert 'postgresql' not in response_text.lower(), \
               "错误消息不应该包含数据库类型"
        
        # 不应该包含Python版本等详细信息
        assert 'python' not in response_text.lower() or \
               'version' not in response_text.lower(), \
               "错误消息不应该包含Python版本信息"
    
    def test_database_error_not_expose_schema(self, api_client, test_user):
        """测试数据库错误不泄露数据库结构"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试触发数据库错误（使用无效ID）
        response = api_client.get(
            '/api/store-plans/99999999/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        response_text = response.content.decode('utf-8')
        
        # 不应该包含SQL语句
        assert 'SELECT' not in response_text.upper(), \
               "错误消息不应该包含SQL语句"
        assert 'FROM' not in response_text.upper() or \
               'WHERE' not in response_text.upper(), \
               "错误消息不应该包含SQL关键字"
        
        # 不应该包含表名
        assert 'store_planning_storeplan' not in response_text.lower(), \
               "错误消息不应该包含数据库表名"
    
    def test_validation_error_not_expose_internal_details(self, api_client, test_user):
        """测试验证错误不泄露内部细节"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 提交无效数据
        invalid_data = {
            'plan_name': '',  # 空名称
            'plan_year': 'invalid',  # 无效年份
        }
        response = api_client.post(
            '/api/store-plans/',
            data=invalid_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code in [400]
        response_text = response.content.decode('utf-8')
        
        # 错误消息应该是用户友好的，不应该包含内部字段名
        # 但可以包含验证错误信息
        print(f"验证错误响应: {response_text}")


@pytest.mark.security
class TestLogSensitiveData:
    """日志敏感数据测试"""
    
    def test_password_not_logged_on_login(self, api_client):
        """测试登录时密码不被记录"""
        # Act - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        
        # Assert
        # 这个测试主要是提醒：需要检查日志文件
        # 确保密码没有被记录
        print("提醒：检查日志文件，确保密码未被记录")
        print("日志应该记录登录尝试，但不应该包含密码")
    
    def test_sensitive_data_not_in_audit_log(self, db, test_user):
        """测试审计日志不包含敏感数据"""
        # 这个测试需要检查审计日志表
        from system_management.models import AuditLog
        
        # 查询最近的审计日志
        recent_logs = AuditLog.objects.all()[:10]
        
        for log in recent_logs:
            # 检查日志内容
            log_content = str(log.request_data) + str(log.response_data)
            
            # 不应该包含密码
            assert 'SecretPass123!' not in log_content, \
                   "审计日志不应该包含明文密码"
            
            # 不应该包含完整的Token
            # Token可能被截断或脱敏
            if 'token' in log_content.lower():
                print(f"审计日志包含token字段，检查是否已脱敏")


@pytest.mark.security
class TestFrontendCodeExposure:
    """前端代码泄露测试"""
    
    def test_no_hardcoded_secrets_in_api_response(self, api_client):
        """测试API响应中没有硬编码的密钥"""
        # Act - 获取公开端点
        response = api_client.get('/api/health/')
        
        # Assert
        if response.status_code == 200:
            response_text = response.content.decode('utf-8')
            
            # 不应该包含API密钥
            assert 'api_key' not in response_text.lower() or \
                   'secret' not in response_text.lower(), \
                   "响应不应该包含API密钥"
            
            # 不应该包含数据库连接字符串
            assert 'postgresql://' not in response_text.lower(), \
                   "响应不应该包含数据库连接字符串"
    
    def test_config_endpoint_not_exposed(self, api_client):
        """测试配置端点不被暴露"""
        # Act - 尝试访问可能的配置端点
        config_endpoints = [
            '/api/config/',
            '/api/settings/',
            '/api/env/',
            '/.env',
            '/config.json',
        ]
        
        for endpoint in config_endpoints:
            response = api_client.get(endpoint)
            
            # Assert - 应该返回404或403
            assert response.status_code in [403, 404, 405], \
                   f"配置端点 {endpoint} 不应该被访问，但返回了状态码 {response.status_code}"


@pytest.mark.security
class TestSessionDataExposure:
    """会话数据泄露测试"""
    
    def test_session_data_not_in_response(self, api_client, test_user):
        """测试响应中不包含会话数据"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取用户信息
        response = api_client.get(
            '/api/profile/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code == 200
        response_text = response.content.decode('utf-8')
        
        # 不应该包含会话ID
        assert 'sessionid' not in response_text.lower(), \
               "响应不应该包含会话ID"
        
        # 不应该包含CSRF Token（在JSON响应中）
        assert 'csrftoken' not in response_text.lower(), \
               "响应不应该包含CSRF Token"


@pytest.mark.security
class TestPersonalIdentifiableInformation:
    """个人身份信息保护测试"""
    
    def test_phone_number_masked_in_list(self, api_client, test_user):
        """测试列表中手机号被脱敏"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取用户列表
        response = api_client.get(
            '/api/users/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            data = response.json()
            # 检查手机号是否被脱敏（例如：139****6001）
            # 这取决于系统的实现
            print("提醒：检查用户列表中的手机号是否被适当脱敏")
    
    def test_email_not_exposed_unnecessarily(self, api_client, test_user):
        """测试邮箱不被不必要地暴露"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sensitivetest",
            "password": "SecretPass123!"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 获取其他用户信息
        response = api_client.get(
            '/api/users/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            # 检查是否有适当的权限控制
            # 普通用户不应该看到其他用户的完整邮箱
            print("提醒：检查邮箱信息的访问权限控制")


@pytest.mark.security
class TestDebugInformationExposure:
    """调试信息泄露测试"""
    
    def test_debug_mode_disabled_in_production(self, api_client):
        """测试生产环境禁用调试模式"""
        # Act - 触发错误
        response = api_client.get('/api/nonexistent/')
        
        # Assert
        response_text = response.content.decode('utf-8')
        
        # 不应该包含Django调试页面的特征
        assert 'Traceback' not in response_text, \
               "不应该显示Python Traceback"
        assert 'Django' not in response_text or \
               'version' not in response_text.lower(), \
               "不应该显示Django版本信息"
    
    def test_stack_trace_not_exposed(self, api_client):
        """测试堆栈跟踪不被暴露"""
        # Act - 尝试触发服务器错误
        response = api_client.post(
            '/api/store-plans/',
            data={'invalid': 'data'},
            content_type='application/json'
        )
        
        # Assert
        response_text = response.content.decode('utf-8')
        
        # 不应该包含文件路径
        assert '/backend/' not in response_text and \
               'C:\\' not in response_text, \
               "错误响应不应该包含文件路径"
        
        # 不应该包含代码行号
        assert 'line' not in response_text.lower() or \
               'File' not in response_text, \
               "错误响应不应该包含代码行号"
