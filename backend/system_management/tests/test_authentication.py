"""
认证服务测试
"""
import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from ..authentication import (
    LoginAttemptTracker,
    JWTTokenManager,
    SMSVerificationService,
    AuthenticationService
)
from ..models import User, Department

User = get_user_model()


class LoginAttemptTrackerTest(TestCase):
    """登录尝试跟踪器测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_track_login_attempts(self):
        """测试登录尝试跟踪"""
        identifier = 'testuser'
        
        # 初始状态
        self.assertEqual(LoginAttemptTracker.get_attempt_count(identifier), 0)
        self.assertFalse(LoginAttemptTracker.is_locked(identifier))
        
        # 增加失败次数
        for i in range(4):
            count = LoginAttemptTracker.increment_attempt(identifier)
            self.assertEqual(count, i + 1)
            self.assertFalse(LoginAttemptTracker.is_locked(identifier))
        
        # 第5次失败，账号被锁定
        count = LoginAttemptTracker.increment_attempt(identifier)
        self.assertEqual(count, 5)
        self.assertTrue(LoginAttemptTracker.is_locked(identifier))
        
        # 清除尝试记录
        LoginAttemptTracker.clear_attempts(identifier)
        self.assertEqual(LoginAttemptTracker.get_attempt_count(identifier), 0)
        self.assertFalse(LoginAttemptTracker.is_locked(identifier))


class JWTTokenManagerTest(TestCase):
    """JWT令牌管理器测试"""
    
    def setUp(self):
        """测试前准备"""
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        self.user = User.objects.create_user(
            username='testuser',
            phone='13800138000',
            password='testpass123',
            department=self.department
        )
    
    def test_generate_and_verify_tokens(self):
        """测试生成和验证令牌"""
        # 生成令牌
        tokens = JWTTokenManager.generate_tokens(self.user)
        
        self.assertIn('access_token', tokens)
        self.assertIn('refresh_token', tokens)
        self.assertIn('token_type', tokens)
        self.assertIn('expires_in', tokens)
        
        # 验证访问令牌
        access_payload = JWTTokenManager.verify_token(tokens['access_token'], 'access')
        self.assertIsNotNone(access_payload)
        self.assertEqual(access_payload['user_id'], self.user.id)
        self.assertEqual(access_payload['username'], self.user.username)
        self.assertEqual(access_payload['type'], 'access')
        
        # 验证刷新令牌
        refresh_payload = JWTTokenManager.verify_token(tokens['refresh_token'], 'refresh')
        self.assertIsNotNone(refresh_payload)
        self.assertEqual(refresh_payload['user_id'], self.user.id)
        self.assertEqual(refresh_payload['username'], self.user.username)
        self.assertEqual(refresh_payload['type'], 'refresh')
    
    def test_refresh_access_token(self):
        """测试刷新访问令牌"""
        # 生成初始令牌
        tokens = JWTTokenManager.generate_tokens(self.user)
        refresh_token = tokens['refresh_token']
        
        # 刷新访问令牌
        new_tokens = JWTTokenManager.refresh_access_token(refresh_token)
        
        self.assertIsNotNone(new_tokens)
        self.assertIn('access_token', new_tokens)
        self.assertIn('token_type', new_tokens)
        self.assertIn('expires_in', new_tokens)
        
        # 验证新的访问令牌
        new_payload = JWTTokenManager.verify_token(new_tokens['access_token'], 'access')
        self.assertIsNotNone(new_payload)
        self.assertEqual(new_payload['user_id'], self.user.id)


class SMSVerificationServiceTest(TestCase):
    """短信验证码服务测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_send_and_verify_code(self):
        """测试发送和验证验证码"""
        phone = '13800138000'
        
        # 发送验证码
        success, message = SMSVerificationService.send_verification_code(phone)
        self.assertTrue(success)
        self.assertEqual(message, '验证码已发送')
        
        # 获取验证码（从缓存中）
        cache_key = SMSVerificationService.get_cache_key(phone)
        code = cache.get(cache_key)
        self.assertIsNotNone(code)
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())
        
        # 验证正确的验证码
        self.assertTrue(SMSVerificationService.verify_code(phone, code))
        
        # 验证码使用后应该被删除
        self.assertFalse(SMSVerificationService.verify_code(phone, code))
        
        # 验证错误的验证码
        self.assertFalse(SMSVerificationService.verify_code(phone, '000000'))
    
    def test_send_interval_limit(self):
        """测试发送间隔限制"""
        phone = '13800138000'
        
        # 第一次发送
        success, message = SMSVerificationService.send_verification_code(phone)
        self.assertTrue(success)
        
        # 立即再次发送应该失败
        success, message = SMSVerificationService.send_verification_code(phone)
        self.assertFalse(success)
        self.assertIn('频繁', message)


class AuthenticationServiceTest(TestCase):
    """认证服务测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        self.user = User.objects.create_user(
            username='testuser',
            phone='13800138000',
            password='testpass123',
            department=self.department
        )
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_login_with_username_password(self):
        """测试用户名密码登录"""
        # 正确的用户名和密码
        success, message, user, tokens = AuthenticationService.login_with_username_password(
            'testuser', 'testpass123'
        )
        self.assertTrue(success)
        self.assertEqual(message, '登录成功')
        self.assertEqual(user.id, self.user.id)
        self.assertIsNotNone(tokens)
        
        # 错误的密码
        success, message, user, tokens = AuthenticationService.login_with_username_password(
            'testuser', 'wrongpass'
        )
        self.assertFalse(success)
        self.assertIn('错误', message)
        self.assertIsNone(user)
        self.assertIsNone(tokens)
        
        # 不存在的用户
        success, message, user, tokens = AuthenticationService.login_with_username_password(
            'nonexistent', 'testpass123'
        )
        self.assertFalse(success)
        self.assertIn('错误', message)
        self.assertIsNone(user)
        self.assertIsNone(tokens)
    
    def test_login_with_phone_password(self):
        """测试手机号密码登录"""
        # 正确的手机号和密码
        success, message, user, tokens = AuthenticationService.login_with_phone_password(
            '13800138000', 'testpass123'
        )
        self.assertTrue(success)
        self.assertEqual(message, '登录成功')
        self.assertEqual(user.id, self.user.id)
        self.assertIsNotNone(tokens)
        
        # 错误的密码
        success, message, user, tokens = AuthenticationService.login_with_phone_password(
            '13800138000', 'wrongpass'
        )
        self.assertFalse(success)
        self.assertIn('错误', message)
        self.assertIsNone(user)
        self.assertIsNone(tokens)
    
    def test_login_with_phone_sms(self):
        """测试手机号验证码登录"""
        phone = '13800138000'
        
        # 先发送验证码
        SMSVerificationService.send_verification_code(phone)
        cache_key = SMSVerificationService.get_cache_key(phone)
        code = cache.get(cache_key)
        
        # 使用正确的验证码登录
        success, message, user, tokens = AuthenticationService.login_with_phone_sms(
            phone, code
        )
        self.assertTrue(success)
        self.assertEqual(message, '登录成功')
        self.assertEqual(user.id, self.user.id)
        self.assertIsNotNone(tokens)
        
        # 使用错误的验证码
        success, message, user, tokens = AuthenticationService.login_with_phone_sms(
            phone, '000000'
        )
        self.assertFalse(success)
        self.assertIn('错误', message)
        self.assertIsNone(user)
        self.assertIsNone(tokens)


class AuthenticationAPITest(APITestCase):
    """认证API测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        self.client = APIClient()
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        self.user = User.objects.create_user(
            username='testuser',
            phone='13800138000',
            password='testpass123',
            department=self.department
        )
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_login_api_username_password(self):
        """测试用户名密码登录API"""
        url = reverse('login')
        data = {
            'login_type': 'username_password',
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['code'], 0)
        self.assertEqual(response_data['message'], '登录成功')
        self.assertIn('access_token', response_data['data'])
        self.assertIn('refresh_token', response_data['data'])
        self.assertIn('user', response_data['data'])
    
    def test_login_api_phone_password(self):
        """测试手机号密码登录API"""
        url = reverse('login')
        data = {
            'login_type': 'phone_password',
            'phone': '13800138000',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['code'], 0)
        self.assertEqual(response_data['message'], '登录成功')
    
    def test_login_api_invalid_credentials(self):
        """测试无效凭据登录API"""
        url = reverse('login')
        data = {
            'login_type': 'username_password',
            'username': 'testuser',
            'password': 'wrongpass'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response_data = response.json()
        self.assertEqual(response_data['code'], 1002)
        self.assertIn('错误', response_data['message'])
    
    def test_send_sms_code_api(self):
        """测试发送短信验证码API"""
        url = reverse('send-sms-code')
        data = {
            'phone': '13800138000'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['code'], 0)
        self.assertEqual(response_data['message'], '验证码已发送')
    
    def test_refresh_token_api(self):
        """测试刷新令牌API"""
        # 先登录获取令牌
        login_url = reverse('login')
        login_data = {
            'login_type': 'username_password',
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        login_response = self.client.post(login_url, login_data, format='json')
        login_response_data = login_response.json()
        refresh_token = login_response_data['data']['refresh_token']
        
        # 刷新令牌
        refresh_url = reverse('refresh-token')
        refresh_data = {
            'refresh_token': refresh_token
        }
        
        response = self.client.post(refresh_url, refresh_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['code'], 0)
        self.assertEqual(response_data['message'], '令牌刷新成功')
        self.assertIn('access_token', response_data['data'])
    
    def test_logout_api(self):
        """测试登出API"""
        # 先登录
        self.client.force_authenticate(user=self.user)
        
        url = reverse('logout')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['code'], 0)
        self.assertEqual(response_data['message'], '登出成功')
    
    def test_profile_api(self):
        """测试获取个人信息API"""
        # 先登录
        self.client.force_authenticate(user=self.user)
        
        url = reverse('profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['code'], 0)
        self.assertEqual(response_data['message'], '获取成功')
        self.assertEqual(response_data['data']['username'], 'testuser')
        self.assertEqual(response_data['data']['phone'], '13800138000')
    
    def test_change_password_api(self):
        """测试修改密码API"""
        # 先登录
        self.client.force_authenticate(user=self.user)
        
        url = reverse('change-password')
        data = {
            'old_password': 'testpass123',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['code'], 0)
        self.assertEqual(response_data['message'], '密码修改成功')
        
        # 验证密码已更改
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))