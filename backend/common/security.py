"""
安全加固模块
提供 API 限流、数据加密、权限控制等安全功能
"""
from django.core.cache import cache
from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.exceptions import Throttled
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import base64
import hashlib
import time
import re


class APIRateLimiter:
    """API 限流器"""
    
    @staticmethod
    def check_rate_limit(key, max_requests, time_window):
        """
        检查是否超过速率限制
        
        Args:
            key: 限流键（如用户ID、IP地址）
            max_requests: 最大请求数
            time_window: 时间窗口（秒）
            
        Returns:
            (是否允许, 剩余请求数, 重置时间)
        """
        cache_key = f'rate_limit:{key}'
        
        # 获取当前请求记录
        request_data = cache.get(cache_key)
        current_time = time.time()
        
        if request_data is None:
            # 首次请求
            request_data = {
                'count': 1,
                'reset_time': current_time + time_window
            }
            cache.set(cache_key, request_data, timeout=time_window)
            return True, max_requests - 1, request_data['reset_time']
        
        # 检查是否需要重置
        if current_time >= request_data['reset_time']:
            request_data = {
                'count': 1,
                'reset_time': current_time + time_window
            }
            cache.set(cache_key, request_data, timeout=time_window)
            return True, max_requests - 1, request_data['reset_time']
        
        # 检查是否超过限制
        if request_data['count'] >= max_requests:
            return False, 0, request_data['reset_time']
        
        # 增加计数
        request_data['count'] += 1
        remaining_time = int(request_data['reset_time'] - current_time)
        cache.set(cache_key, request_data, timeout=remaining_time)
        
        return True, max_requests - request_data['count'], request_data['reset_time']


class UserRateThrottle(SimpleRateThrottle):
    """用户级别限流"""
    scope = 'user'
    
    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
    
    def throttle_failure(self):
        """限流失败时的处理"""
        wait = self.wait()
        raise Throttled(
            detail=f'请求过于频繁，请在 {int(wait)} 秒后重试',
            wait=wait
        )


class AnonRateThrottle(SimpleRateThrottle):
    """匿名用户限流"""
    scope = 'anon'
    
    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            return None  # 已认证用户不受此限制
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }


class SensitiveAPIThrottle(SimpleRateThrottle):
    """敏感 API 限流（如登录、密码重置）"""
    scope = 'sensitive'
    rate = '5/hour'  # 每小时5次
    
    def get_cache_key(self, request, view):
        # 使用 IP 地址作为限流键
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class DataEncryption:
    """数据加密工具"""
    
    def __init__(self, secret_key=None):
        """
        初始化加密器
        
        Args:
            secret_key: 密钥（如果不提供，使用 Django SECRET_KEY）
        """
        if secret_key is None:
            secret_key = settings.SECRET_KEY
        
        # 使用 PBKDF2 从密钥派生加密密钥
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'store_lifecycle_salt',  # 应该使用随机盐并存储
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret_key.encode()))
        self.cipher = Fernet(key)
    
    def encrypt(self, data):
        """
        加密数据
        
        Args:
            data: 要加密的字符串
            
        Returns:
            加密后的字符串
        """
        if isinstance(data, str):
            data = data.encode()
        
        encrypted = self.cipher.encrypt(data)
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data):
        """
        解密数据
        
        Args:
            encrypted_data: 加密的字符串
            
        Returns:
            解密后的字符串
        """
        if isinstance(encrypted_data, str):
            encrypted_data = encrypted_data.encode()
        
        encrypted_data = base64.urlsafe_b64decode(encrypted_data)
        decrypted = self.cipher.decrypt(encrypted_data)
        return decrypted.decode()
    
    @staticmethod
    def hash_password(password, salt=None):
        """
        哈希密码（用于存储）
        
        Args:
            password: 明文密码
            salt: 盐值（如果不提供，自动生成）
            
        Returns:
            (哈希值, 盐值)
        """
        if salt is None:
            import os
            salt = base64.urlsafe_b64encode(os.urandom(16)).decode()
        
        # 使用 PBKDF2 哈希
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
            backend=default_backend()
        )
        
        hashed = base64.urlsafe_b64encode(
            kdf.derive(password.encode())
        ).decode()
        
        return hashed, salt
    
    @staticmethod
    def verify_password(password, hashed, salt):
        """
        验证密码
        
        Args:
            password: 明文密码
            hashed: 哈希值
            salt: 盐值
            
        Returns:
            是否匹配
        """
        new_hashed, _ = DataEncryption.hash_password(password, salt)
        return new_hashed == hashed


class SensitiveDataMasking:
    """敏感数据脱敏"""
    
    @staticmethod
    def mask_phone(phone):
        """
        手机号脱敏
        
        Args:
            phone: 手机号
            
        Returns:
            脱敏后的手机号（如：138****8888）
        """
        if not phone or len(phone) < 11:
            return phone
        
        return f"{phone[:3]}****{phone[-4:]}"
    
    @staticmethod
    def mask_id_card(id_card):
        """
        身份证号脱敏
        
        Args:
            id_card: 身份证号
            
        Returns:
            脱敏后的身份证号（如：110***********1234）
        """
        if not id_card or len(id_card) < 18:
            return id_card
        
        return f"{id_card[:3]}***********{id_card[-4:]}"
    
    @staticmethod
    def mask_bank_card(bank_card):
        """
        银行卡号脱敏
        
        Args:
            bank_card: 银行卡号
            
        Returns:
            脱敏后的银行卡号（如：6222 **** **** 1234）
        """
        if not bank_card or len(bank_card) < 16:
            return bank_card
        
        return f"{bank_card[:4]} **** **** {bank_card[-4:]}"
    
    @staticmethod
    def mask_email(email):
        """
        邮箱脱敏
        
        Args:
            email: 邮箱地址
            
        Returns:
            脱敏后的邮箱（如：t***@example.com）
        """
        if not email or '@' not in email:
            return email
        
        parts = email.split('@')
        username = parts[0]
        domain = parts[1]
        
        if len(username) <= 2:
            masked_username = username[0] + '***'
        else:
            masked_username = username[0] + '***' + username[-1]
        
        return f"{masked_username}@{domain}"
    
    @staticmethod
    def mask_name(name):
        """
        姓名脱敏
        
        Args:
            name: 姓名
            
        Returns:
            脱敏后的姓名（如：张*、李**）
        """
        if not name:
            return name
        
        if len(name) == 2:
            return name[0] + '*'
        elif len(name) > 2:
            return name[0] + '*' * (len(name) - 1)
        else:
            return name


class InputValidator:
    """输入验证器"""
    
    # 正则表达式模式
    PHONE_PATTERN = re.compile(r'^1[3-9]\d{9}$')
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    ID_CARD_PATTERN = re.compile(r'^\d{17}[\dXx]$')
    PASSWORD_PATTERN = re.compile(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$')
    
    @staticmethod
    def validate_phone(phone):
        """验证手机号"""
        return bool(InputValidator.PHONE_PATTERN.match(phone))
    
    @staticmethod
    def validate_email(email):
        """验证邮箱"""
        return bool(InputValidator.EMAIL_PATTERN.match(email))
    
    @staticmethod
    def validate_id_card(id_card):
        """验证身份证号"""
        return bool(InputValidator.ID_CARD_PATTERN.match(id_card))
    
    @staticmethod
    def validate_password(password):
        """
        验证密码强度
        要求：至少8位，包含字母和数字
        """
        return bool(InputValidator.PASSWORD_PATTERN.match(password))
    
    @staticmethod
    def sanitize_input(text, max_length=1000):
        """
        清理输入（防止 XSS）
        
        Args:
            text: 输入文本
            max_length: 最大长度
            
        Returns:
            清理后的文本
        """
        if not text:
            return text
        
        # 移除 HTML 标签
        text = re.sub(r'<[^>]+>', '', text)
        
        # 移除特殊字符
        text = re.sub(r'[<>"\']', '', text)
        
        # 限制长度
        if len(text) > max_length:
            text = text[:max_length]
        
        return text.strip()
    
    @staticmethod
    def validate_sql_injection(text):
        """
        检测 SQL 注入
        
        Args:
            text: 输入文本
            
        Returns:
            是否安全
        """
        # SQL 注入关键字
        sql_keywords = [
            'select', 'insert', 'update', 'delete', 'drop', 'create',
            'alter', 'exec', 'execute', 'script', 'union', 'declare'
        ]
        
        text_lower = text.lower()
        
        for keyword in sql_keywords:
            if keyword in text_lower:
                return False
        
        return True


class PermissionChecker:
    """权限检查器"""
    
    @staticmethod
    def check_permission(user, permission_code):
        """
        检查用户是否有指定权限
        
        Args:
            user: 用户对象
            permission_code: 权限编码
            
        Returns:
            是否有权限
        """
        if user.is_superuser:
            return True
        
        # 从缓存获取用户权限
        from common.cache_service import UserCache
        permissions = UserCache.get_user_permissions(user.id)
        
        return permission_code in permissions
    
    @staticmethod
    def check_data_permission(user, obj):
        """
        检查用户是否有数据权限
        
        Args:
            user: 用户对象
            obj: 数据对象
            
        Returns:
            是否有权限
        """
        if user.is_superuser:
            return True
        
        # 获取用户数据权限范围
        from common.cache_service import UserCache
        data_scope = UserCache.get_user_data_scope(user.id)
        
        if data_scope == 'all':
            return True
        
        # 检查创建人
        if hasattr(obj, 'created_by'):
            if data_scope == 'self':
                return obj.created_by == user
            
            if data_scope == 'dept':
                return obj.created_by.department == user.department
            
            if data_scope == 'dept_and_sub':
                # 检查是否在本部门或下级部门
                from system_management.models import Department
                user_dept_ids = Department.get_department_and_sub_ids(user.department)
                return obj.created_by.department_id in user_dept_ids
        
        return False
    
    @staticmethod
    def require_permission(permission_code):
        """
        权限装饰器
        
        Args:
            permission_code: 权限编码
            
        Example:
            @require_permission('store:create')
            def create_store(request):
                pass
        """
        from functools import wraps
        from rest_framework.exceptions import PermissionDenied
        
        def decorator(func):
            @wraps(func)
            def wrapper(request, *args, **kwargs):
                if not PermissionChecker.check_permission(request.user, permission_code):
                    raise PermissionDenied('您没有执行此操作的权限')
                return func(request, *args, **kwargs)
            return wrapper
        return decorator


class SecurityLogger:
    """安全日志记录器"""
    
    @staticmethod
    def log_login_attempt(username, ip_address, success, reason=None):
        """记录登录尝试"""
        from system_management.models import SecurityLog
        
        SecurityLog.objects.create(
            event_type='login_attempt',
            username=username,
            ip_address=ip_address,
            success=success,
            details={'reason': reason} if reason else {}
        )
    
    @staticmethod
    def log_permission_denied(user, resource, action, ip_address):
        """记录权限拒绝"""
        from system_management.models import SecurityLog
        
        SecurityLog.objects.create(
            event_type='permission_denied',
            user=user,
            ip_address=ip_address,
            success=False,
            details={
                'resource': resource,
                'action': action
            }
        )
    
    @staticmethod
    def log_data_access(user, resource_type, resource_id, action, ip_address):
        """记录数据访问"""
        from system_management.models import SecurityLog
        
        SecurityLog.objects.create(
            event_type='data_access',
            user=user,
            ip_address=ip_address,
            success=True,
            details={
                'resource_type': resource_type,
                'resource_id': resource_id,
                'action': action
            }
        )


class CSRFProtection:
    """CSRF 保护"""
    
    @staticmethod
    def generate_token():
        """生成 CSRF Token"""
        import secrets
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def validate_token(token, session_token):
        """验证 CSRF Token"""
        return token == session_token


class IPWhitelist:
    """IP 白名单"""
    
    @staticmethod
    def is_whitelisted(ip_address):
        """检查 IP 是否在白名单中"""
        whitelist = getattr(settings, 'IP_WHITELIST', [])
        
        if not whitelist:
            return True  # 如果没有配置白名单，允许所有 IP
        
        return ip_address in whitelist
    
    @staticmethod
    def check_ip_whitelist(view_func):
        """IP 白名单装饰器"""
        from functools import wraps
        from rest_framework.exceptions import PermissionDenied
        
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip_address = request.META.get('REMOTE_ADDR')
            
            if not IPWhitelist.is_whitelisted(ip_address):
                raise PermissionDenied('您的 IP 地址不在白名单中')
            
            return view_func(request, *args, **kwargs)
        
        return wrapper


# 安全配置建议
SECURITY_SETTINGS = {
    # API 限流配置
    'REST_FRAMEWORK': {
        'DEFAULT_THROTTLE_CLASSES': [
            'common.security.UserRateThrottle',
            'common.security.AnonRateThrottle',
        ],
        'DEFAULT_THROTTLE_RATES': {
            'user': '1000/hour',  # 认证用户每小时1000次
            'anon': '100/hour',   # 匿名用户每小时100次
            'sensitive': '5/hour'  # 敏感操作每小时5次
        }
    },
    
    # 密码策略
    'PASSWORD_POLICY': {
        'MIN_LENGTH': 8,
        'REQUIRE_UPPERCASE': True,
        'REQUIRE_LOWERCASE': True,
        'REQUIRE_DIGIT': True,
        'REQUIRE_SPECIAL_CHAR': False,
        'MAX_AGE_DAYS': 90,  # 密码有效期90天
        'HISTORY_COUNT': 5,  # 记住最近5个密码
    },
    
    # 会话配置
    'SESSION': {
        'COOKIE_SECURE': True,  # 仅通过 HTTPS 传输
        'COOKIE_HTTPONLY': True,  # 防止 JavaScript 访问
        'COOKIE_SAMESITE': 'Strict',  # 防止 CSRF
        'COOKIE_AGE': 3600,  # 会话超时1小时
    },
    
    # CORS 配置
    'CORS': {
        'ALLOWED_ORIGINS': [
            'https://example.com',
        ],
        'ALLOW_CREDENTIALS': True,
    },
    
    # 安全头配置
    'SECURITY_HEADERS': {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }
}
