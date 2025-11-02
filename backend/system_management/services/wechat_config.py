"""
企业微信配置管理
提供企业微信凭证的加密存储和管理功能
"""
from django.conf import settings
from django.core.cache import cache
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import logging

logger = logging.getLogger(__name__)


class WeChatConfig:
    """企业微信配置管理类"""
    
    # 缓存键前缀
    CACHE_KEY_PREFIX = 'wechat_config'
    
    def __init__(self):
        """初始化配置管理器"""
        self.corp_id = settings.WECHAT_CORP_ID
        self.agent_id = settings.WECHAT_AGENT_ID
        self._secret = settings.WECHAT_SECRET
        self._cipher = self._get_cipher()
    
    def _get_cipher(self):
        """
        获取加密器
        使用 Django SECRET_KEY 派生加密密钥
        """
        # 使用 PBKDF2HMAC 从 Django SECRET_KEY 派生加密密钥
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'wechat_config_salt',  # 固定盐值
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(
            kdf.derive(settings.SECRET_KEY.encode())
        )
        return Fernet(key)
    
    def encrypt_secret(self, secret: str) -> str:
        """
        加密企业微信 Secret
        
        Args:
            secret: 明文 Secret
            
        Returns:
            加密后的 Secret（Base64 编码）
        """
        try:
            encrypted = self._cipher.encrypt(secret.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"加密 Secret 失败: {e}")
            raise
    
    def decrypt_secret(self, encrypted_secret: str) -> str:
        """
        解密企业微信 Secret
        
        Args:
            encrypted_secret: 加密的 Secret（Base64 编码）
            
        Returns:
            明文 Secret
        """
        try:
            encrypted = base64.urlsafe_b64decode(encrypted_secret.encode())
            decrypted = self._cipher.decrypt(encrypted)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"解密 Secret 失败: {e}")
            raise
    
    def get_corp_id(self) -> str:
        """获取企业 ID"""
        return self.corp_id
    
    def get_agent_id(self) -> str:
        """获取应用 ID"""
        return self.agent_id
    
    def get_secret(self) -> str:
        """获取应用 Secret（明文）"""
        return self._secret
    
    def validate_config(self) -> tuple[bool, str]:
        """
        验证配置是否完整
        
        Returns:
            (是否有效, 错误信息)
        """
        if not self.corp_id:
            return False, "企业 ID (WECHAT_CORP_ID) 未配置"
        
        if not self.agent_id:
            return False, "应用 ID (WECHAT_AGENT_ID) 未配置"
        
        if not self._secret:
            return False, "应用 Secret (WECHAT_SECRET) 未配置"
        
        return True, ""
    
    def get_config_dict(self) -> dict:
        """
        获取配置字典（不包含敏感信息）
        
        Returns:
            配置字典
        """
        return {
            'corp_id': self.corp_id,
            'agent_id': self.agent_id,
            'secret_configured': bool(self._secret),
        }
    
    @classmethod
    def clear_cache(cls):
        """清除所有企业微信相关缓存"""
        # 清除访问令牌缓存
        cache.delete(f'{cls.CACHE_KEY_PREFIX}:access_token')
        logger.info("企业微信配置缓存已清除")


# 全局配置实例
wechat_config = WeChatConfig()
