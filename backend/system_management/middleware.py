"""
系统管理模块中间件
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.conf import settings
from rest_framework import status

from .authentication import JWTTokenManager

logger = logging.getLogger(__name__)


class JWTTokenValidationMiddleware(MiddlewareMixin):
    """
    JWT令牌验证中间件
    
    自动检查JWT令牌的有效性，处理令牌过期等情况
    """
    
    # 不需要验证令牌的路径
    EXEMPT_PATHS = [
        '/api/auth/login/',
        '/api/auth/send-sms-code/',
        '/api/auth/refresh-token/',
        '/api/docs/',
        '/api/schema/',
        '/admin/',
    ]
    
    def process_request(self, request):
        """
        处理请求，验证JWT令牌
        """
        # 检查是否为豁免路径
        if self.is_exempt_path(request.path):
            return None
        
        # 检查是否为OPTIONS请求（CORS预检）
        if request.method == 'OPTIONS':
            return None
        
        # 获取Authorization头
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
        
        # 提取JWT令牌
        token = self.extract_token(auth_header)
        if not token:
            return None
        
        # 验证令牌
        payload = JWTTokenManager.verify_token(token, 'access')
        if not payload:
            # 令牌无效或过期
            return JsonResponse({
                'code': 1002,
                'message': '令牌无效或已过期，请重新登录',
                'data': None
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # 令牌有效，将用户信息添加到请求中
        request.jwt_payload = payload
        
        return None
    
    def is_exempt_path(self, path):
        """
        检查路径是否豁免令牌验证
        
        Args:
            path: 请求路径
            
        Returns:
            bool: 是否豁免
        """
        for exempt_path in self.EXEMPT_PATHS:
            if path.startswith(exempt_path):
                return True
        return False
    
    def extract_token(self, auth_header):
        """
        从Authorization头中提取JWT令牌
        
        Args:
            auth_header: Authorization头的值
            
        Returns:
            str or None: JWT令牌
        """
        try:
            # 格式: "Bearer <token>"
            parts = auth_header.split()
            
            if len(parts) != 2:
                return None
            
            if parts[0] != 'Bearer':
                return None
            
            return parts[1]
        
        except Exception:
            return None


class SessionTimeoutMiddleware(MiddlewareMixin):
    """
    会话超时中间件
    
    处理Django会话的超时逻辑
    """
    
    def process_request(self, request):
        """
        处理请求，检查会话超时
        """
        # 检查是否为豁免路径
        if self.is_exempt_path(request.path):
            return None
        
        # 检查会话是否存在
        if not hasattr(request, 'session') or not request.session.session_key:
            return None
        
        # 检查会话是否过期
        if request.session.get_expiry_age() <= 0:
            # 会话已过期，清除会话
            request.session.flush()
            
            # 如果是API请求，返回JSON响应
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'code': 1002,
                    'message': '会话已过期，请重新登录',
                    'data': None
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return None
    
    def is_exempt_path(self, path):
        """
        检查路径是否豁免会话验证
        
        Args:
            path: 请求路径
            
        Returns:
            bool: 是否豁免
        """
        exempt_paths = [
            '/api/auth/login/',
            '/api/auth/send-sms-code/',
            '/api/auth/refresh-token/',
            '/api/docs/',
            '/api/schema/',
            '/admin/login/',
        ]
        
        for exempt_path in exempt_paths:
            if path.startswith(exempt_path):
                return True
        return False


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    安全头中间件
    
    添加安全相关的HTTP头
    """
    
    def process_response(self, request, response):
        """
        处理响应，添加安全头
        """
        # 防止点击劫持
        response['X-Frame-Options'] = 'DENY'
        
        # 防止MIME类型嗅探
        response['X-Content-Type-Options'] = 'nosniff'
        
        # XSS保护
        response['X-XSS-Protection'] = '1; mode=block'
        
        # 强制HTTPS（生产环境）
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # 内容安全策略
        response['Content-Security-Policy'] = "default-src 'self'"
        
        # 引用策略
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response