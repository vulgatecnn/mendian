"""
认证服务模块
实现多种登录方式和安全机制
"""
import jwt
import time
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple

from django.conf import settings
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.hashers import check_password
from django.core.cache import cache
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from .models import User
from .services.audit_service import audit_logger

logger = logging.getLogger(__name__)


class LoginAttemptTracker:
    """登录尝试跟踪器"""
    
    CACHE_PREFIX = 'login_attempt'
    MAX_ATTEMPTS = 5  # 最大失败次数
    LOCKOUT_DURATION = 30 * 60  # 锁定时长（30分钟）
    
    @classmethod
    def get_cache_key(cls, identifier: str) -> str:
        """获取缓存键"""
        return f"{cls.CACHE_PREFIX}:{identifier}"
    
    @classmethod
    def get_attempt_count(cls, identifier: str) -> int:
        """获取失败尝试次数"""
        cache_key = cls.get_cache_key(identifier)
        return cache.get(cache_key, 0)
    
    @classmethod
    def increment_attempt(cls, identifier: str) -> int:
        """增加失败尝试次数"""
        cache_key = cls.get_cache_key(identifier)
        current_count = cls.get_attempt_count(identifier)
        new_count = current_count + 1
        
        # 设置缓存，如果达到最大次数则锁定
        if new_count >= cls.MAX_ATTEMPTS:
            cache.set(cache_key, new_count, cls.LOCKOUT_DURATION)
        else:
            cache.set(cache_key, new_count, 300)  # 5分钟内有效
        
        return new_count
    
    @classmethod
    def clear_attempts(cls, identifier: str):
        """清除失败尝试记录"""
        cache_key = cls.get_cache_key(identifier)
        cache.delete(cache_key)
    
    @classmethod
    def is_locked(cls, identifier: str) -> bool:
        """检查是否被锁定"""
        return cls.get_attempt_count(identifier) >= cls.MAX_ATTEMPTS
    
    @classmethod
    def get_lockout_remaining_time(cls, identifier: str) -> int:
        """获取剩余锁定时间（秒）"""
        if not cls.is_locked(identifier):
            return 0
        
        cache_key = cls.get_cache_key(identifier)
        ttl = cache.ttl(cache_key)
        return max(0, ttl) if ttl is not None else 0


class JWTTokenManager:
    """JWT令牌管理器"""
    
    SECRET_KEY = settings.SECRET_KEY
    ALGORITHM = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 2小时
    REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7天
    
    @classmethod
    def generate_tokens(cls, user: User) -> Dict[str, str]:
        """生成访问令牌和刷新令牌"""
        now = datetime.utcnow()
        
        # 访问令牌载荷
        access_payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': now + timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES),
            'iat': now,
            'type': 'access'
        }
        
        # 刷新令牌载荷
        refresh_payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': now + timedelta(days=cls.REFRESH_TOKEN_EXPIRE_DAYS),
            'iat': now,
            'type': 'refresh'
        }
        
        # 生成令牌
        access_token = jwt.encode(access_payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)
        refresh_token = jwt.encode(refresh_payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': cls.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    @classmethod
    def verify_token(cls, token: str, token_type: str = 'access') -> Optional[Dict[str, Any]]:
        """验证令牌"""
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            
            # 检查令牌类型
            if payload.get('type') != token_type:
                return None
            
            # 检查是否过期
            if payload.get('exp', 0) < time.time():
                return None
            
            return payload
        
        except jwt.ExpiredSignatureError:
            logger.warning("JWT令牌已过期")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT令牌无效: {e}")
            return None
    
    @classmethod
    def refresh_access_token(cls, refresh_token: str) -> Optional[Dict[str, str]]:
        """使用刷新令牌生成新的访问令牌"""
        payload = cls.verify_token(refresh_token, 'refresh')
        if not payload:
            return None
        
        try:
            user = User.objects.get(id=payload['user_id'])
            if not user.is_active:
                return None
            
            # 生成新的访问令牌
            now = datetime.utcnow()
            access_payload = {
                'user_id': user.id,
                'username': user.username,
                'exp': now + timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES),
                'iat': now,
                'type': 'access'
            }
            
            access_token = jwt.encode(access_payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)
            
            return {
                'access_token': access_token,
                'token_type': 'Bearer',
                'expires_in': cls.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
        
        except User.DoesNotExist:
            return None


class SMSVerificationService:
    """短信验证码服务"""
    
    CACHE_PREFIX = 'sms_code'
    CODE_EXPIRE_MINUTES = 5  # 验证码有效期5分钟
    SEND_INTERVAL = 60  # 发送间隔60秒
    
    @classmethod
    def get_cache_key(cls, phone: str) -> str:
        """获取缓存键"""
        return f"{cls.CACHE_PREFIX}:{phone}"
    
    @classmethod
    def get_send_cache_key(cls, phone: str) -> str:
        """获取发送间隔缓存键"""
        return f"{cls.CACHE_PREFIX}_send:{phone}"
    
    @classmethod
    def can_send_code(cls, phone: str) -> bool:
        """检查是否可以发送验证码"""
        send_cache_key = cls.get_send_cache_key(phone)
        return not cache.get(send_cache_key, False)
    
    @classmethod
    def generate_code(cls) -> str:
        """生成6位数字验证码"""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @classmethod
    def send_verification_code(cls, phone: str) -> Tuple[bool, str]:
        """
        发送验证码
        
        Returns:
            Tuple[bool, str]: (是否成功, 消息)
        """
        # 检查发送间隔
        if not cls.can_send_code(phone):
            return False, "验证码发送过于频繁，请稍后再试"
        
        # 生成验证码
        code = cls.generate_code()
        
        # 这里应该调用实际的短信服务API
        # 为了演示，我们只是记录日志
        logger.info(f"发送验证码到 {phone}: {code}")
        
        # 缓存验证码
        cache_key = cls.get_cache_key(phone)
        cache.set(cache_key, code, cls.CODE_EXPIRE_MINUTES * 60)
        
        # 设置发送间隔
        send_cache_key = cls.get_send_cache_key(phone)
        cache.set(send_cache_key, True, cls.SEND_INTERVAL)
        
        return True, "验证码已发送"
    
    @classmethod
    def verify_code(cls, phone: str, code: str) -> bool:
        """验证验证码"""
        cache_key = cls.get_cache_key(phone)
        cached_code = cache.get(cache_key)
        
        if not cached_code:
            return False
        
        if cached_code == code:
            # 验证成功后删除验证码
            cache.delete(cache_key)
            return True
        
        return False


class AuthenticationService:
    """认证服务"""
    
    @staticmethod
    def login_with_username_password(username: str, password: str, request=None) -> Tuple[bool, str, Optional[User], Optional[Dict]]:
        """
        用户名密码登录
        
        Returns:
            Tuple[bool, str, Optional[User], Optional[Dict]]: (是否成功, 消息, 用户对象, 令牌信息)
        """
        # 检查是否被锁定
        if LoginAttemptTracker.is_locked(username):
            remaining_time = LoginAttemptTracker.get_lockout_remaining_time(username)
            return False, f"账号已被锁定，请 {remaining_time // 60} 分钟后重试", None, None
        
        try:
            # 查找用户（支持用户名或手机号）
            user = None
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                try:
                    user = User.objects.get(phone=username)
                except User.DoesNotExist:
                    pass
            
            if not user:
                LoginAttemptTracker.increment_attempt(username)
                return False, "用户名或密码错误", None, None
            
            # 检查用户状态
            if not user.is_active:
                return False, "账号已被停用", None, None
            
            # 验证密码
            if not check_password(password, user.password):
                LoginAttemptTracker.increment_attempt(username)
                return False, "用户名或密码错误", None, None
            
            # 登录成功，清除失败记录
            LoginAttemptTracker.clear_attempts(username)
            
            # 更新最后登录时间
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # 生成令牌
            tokens = JWTTokenManager.generate_tokens(user)
            
            # 记录审计日志
            if request:
                audit_logger.log(
                    request=request,
                    action=audit_logger.ACTION_LOGIN,
                    target_type=audit_logger.TARGET_USER,
                    target_id=user.id,
                    details={
                        'login_method': 'username_password',
                        'username': user.username
                    }
                )
            
            return True, "登录成功", user, tokens
        
        except Exception as e:
            logger.error(f"用户名密码登录失败: {e}", exc_info=True)
            return False, "登录失败，请稍后重试", None, None
    
    @staticmethod
    def login_with_phone_password(phone: str, password: str, request=None) -> Tuple[bool, str, Optional[User], Optional[Dict]]:
        """
        手机号密码登录
        
        Returns:
            Tuple[bool, str, Optional[User], Optional[Dict]]: (是否成功, 消息, 用户对象, 令牌信息)
        """
        # 检查是否被锁定
        if LoginAttemptTracker.is_locked(phone):
            remaining_time = LoginAttemptTracker.get_lockout_remaining_time(phone)
            return False, f"账号已被锁定，请 {remaining_time // 60} 分钟后重试", None, None
        
        try:
            # 查找用户
            try:
                user = User.objects.get(phone=phone)
            except User.DoesNotExist:
                LoginAttemptTracker.increment_attempt(phone)
                return False, "手机号或密码错误", None, None
            
            # 检查用户状态
            if not user.is_active:
                return False, "账号已被停用", None, None
            
            # 验证密码
            if not check_password(password, user.password):
                LoginAttemptTracker.increment_attempt(phone)
                return False, "手机号或密码错误", None, None
            
            # 登录成功，清除失败记录
            LoginAttemptTracker.clear_attempts(phone)
            
            # 更新最后登录时间
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # 生成令牌
            tokens = JWTTokenManager.generate_tokens(user)
            
            # 记录审计日志
            if request:
                audit_logger.log(
                    request=request,
                    action=audit_logger.ACTION_LOGIN,
                    target_type=audit_logger.TARGET_USER,
                    target_id=user.id,
                    details={
                        'login_method': 'phone_password',
                        'phone': phone
                    }
                )
            
            return True, "登录成功", user, tokens
        
        except Exception as e:
            logger.error(f"手机号密码登录失败: {e}", exc_info=True)
            return False, "登录失败，请稍后重试", None, None
    
    @staticmethod
    def login_with_phone_sms(phone: str, sms_code: str, request=None) -> Tuple[bool, str, Optional[User], Optional[Dict]]:
        """
        手机号验证码登录
        
        Returns:
            Tuple[bool, str, Optional[User], Optional[Dict]]: (是否成功, 消息, 用户对象, 令牌信息)
        """
        try:
            # 验证短信验证码
            if not SMSVerificationService.verify_code(phone, sms_code):
                return False, "验证码错误或已过期", None, None
            
            # 查找用户
            try:
                user = User.objects.get(phone=phone)
            except User.DoesNotExist:
                return False, "手机号未注册", None, None
            
            # 检查用户状态
            if not user.is_active:
                return False, "账号已被停用", None, None
            
            # 更新最后登录时间
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # 生成令牌
            tokens = JWTTokenManager.generate_tokens(user)
            
            # 记录审计日志
            if request:
                audit_logger.log(
                    request=request,
                    action=audit_logger.ACTION_LOGIN,
                    target_type=audit_logger.TARGET_USER,
                    target_id=user.id,
                    details={
                        'login_method': 'phone_sms',
                        'phone': phone
                    }
                )
            
            return True, "登录成功", user, tokens
        
        except Exception as e:
            logger.error(f"手机号验证码登录失败: {e}", exc_info=True)
            return False, "登录失败，请稍后重试", None, None
    
    @staticmethod
    def login_with_wechat(wechat_code: str, request=None) -> Tuple[bool, str, Optional[User], Optional[Dict]]:
        """
        企业微信登录（移动端）
        
        Args:
            wechat_code: 企业微信授权码
            
        Returns:
            Tuple[bool, str, Optional[User], Optional[Dict]]: (是否成功, 消息, 用户对象, 令牌信息)
        """
        try:
            # 这里应该调用企业微信API获取用户信息
            # 为了演示，我们暂时跳过实际的API调用
            # 实际实现需要：
            # 1. 使用授权码换取用户信息
            # 2. 根据企业微信用户ID查找本地用户
            # 3. 如果用户不存在，可以考虑自动创建或返回错误
            
            # 模拟企业微信用户信息
            # wechat_user_info = wechat_client.get_user_info_by_code(wechat_code)
            # wechat_user_id = wechat_user_info.get('UserId')
            
            # 暂时返回未实现
            return False, "企业微信登录功能暂未实现", None, None
        
        except Exception as e:
            logger.error(f"企业微信登录失败: {e}", exc_info=True)
            return False, "登录失败，请稍后重试", None, None
    
    @staticmethod
    def logout(user: User, request=None):
        """
        用户登出
        
        Args:
            user: 用户对象
            request: 请求对象
        """
        try:
            # 记录审计日志
            if request:
                audit_logger.log(
                    request=request,
                    action=audit_logger.ACTION_LOGOUT,
                    target_type=audit_logger.TARGET_USER,
                    target_id=user.id,
                    details={
                        'username': user.username
                    }
                )
            
            # Django会话登出
            if request and hasattr(request, 'session'):
                django_logout(request)
            
            logger.info(f"用户 {user.username} 已登出")
        
        except Exception as e:
            logger.error(f"用户登出失败: {e}", exc_info=True)