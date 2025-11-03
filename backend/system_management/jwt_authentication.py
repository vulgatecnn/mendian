"""
JWT认证类
"""
import logging
from typing import Optional, Tuple

from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions

from .authentication import JWTTokenManager

logger = logging.getLogger(__name__)
User = get_user_model()


class JWTAuthentication(authentication.BaseAuthentication):
    """
    JWT认证类
    
    支持从请求头中提取JWT令牌并验证用户身份
    """
    
    keyword = 'Bearer'
    
    def authenticate(self, request) -> Optional[Tuple[User, str]]:
        """
        认证请求
        
        Args:
            request: HTTP请求对象
            
        Returns:
            Optional[Tuple[User, str]]: (用户对象, 令牌) 或 None
        """
        auth_header = self.get_authorization_header(request)
        if not auth_header:
            return None
        
        try:
            # 解析认证头
            token = self.get_token_from_header(auth_header)
            if not token:
                return None
            
            # 验证令牌
            payload = JWTTokenManager.verify_token(token, 'access')
            if not payload:
                raise exceptions.AuthenticationFailed('令牌无效或已过期')
            
            # 获取用户
            user = self.get_user_from_payload(payload)
            if not user:
                raise exceptions.AuthenticationFailed('用户不存在')
            
            # 检查用户状态
            if not user.is_active:
                raise exceptions.AuthenticationFailed('用户已被停用')
            
            return (user, token)
        
        except exceptions.AuthenticationFailed:
            raise
        except Exception as e:
            logger.error(f"JWT认证失败: {e}", exc_info=True)
            raise exceptions.AuthenticationFailed('认证失败')
    
    def get_authorization_header(self, request) -> Optional[str]:
        """
        从请求头中获取Authorization字段
        
        Args:
            request: HTTP请求对象
            
        Returns:
            Optional[str]: Authorization头的值
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
        
        return auth_header
    
    def get_token_from_header(self, auth_header: str) -> Optional[str]:
        """
        从Authorization头中提取令牌
        
        Args:
            auth_header: Authorization头的值
            
        Returns:
            Optional[str]: JWT令牌
        """
        try:
            # 格式: "Bearer <token>"
            parts = auth_header.split()
            
            if len(parts) != 2:
                return None
            
            if parts[0] != self.keyword:
                return None
            
            return parts[1]
        
        except Exception:
            return None
    
    def get_user_from_payload(self, payload: dict) -> Optional[User]:
        """
        从JWT载荷中获取用户对象
        
        Args:
            payload: JWT载荷
            
        Returns:
            Optional[User]: 用户对象
        """
        try:
            user_id = payload.get('user_id')
            if not user_id:
                return None
            
            user = User.objects.get(id=user_id)
            return user
        
        except User.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"从JWT载荷获取用户失败: {e}", exc_info=True)
            return None
    
    def authenticate_header(self, request) -> str:
        """
        返回认证失败时的WWW-Authenticate头
        
        Args:
            request: HTTP请求对象
            
        Returns:
            str: WWW-Authenticate头的值
        """
        return f'{self.keyword} realm="api"'