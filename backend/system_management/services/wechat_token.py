"""
企业微信访问令牌管理
提供访问令牌的获取、缓存和自动刷新功能
"""
import requests
import time
import logging
from django.conf import settings
from django.core.cache import cache
from .cache_service import cache_service
from typing import Optional, Tuple
from .wechat_config import wechat_config

logger = logging.getLogger(__name__)


class WeChatTokenManager:
    """企业微信访问令牌管理器"""
    
    def __init__(self):
        """初始化令牌管理器"""
        self.config = wechat_config
        self.api_base_url = settings.WECHAT_API_BASE_URL
        self.token_cache_key = settings.WECHAT_TOKEN_CACHE_KEY
        self.token_expires_in = settings.WECHAT_TOKEN_EXPIRES_IN
        self.api_timeout = settings.WECHAT_API_TIMEOUT
    
    def get_access_token(self, force_refresh: bool = False) -> str:
        """
        获取访问令牌（带缓存和自动刷新）
        
        Args:
            force_refresh: 是否强制刷新令牌
            
        Returns:
            访问令牌
            
        Raises:
            Exception: 获取令牌失败时抛出异常
        """
        # 如果不强制刷新，先尝试从缓存获取
        if not force_refresh:
            cached_token_data = cache_service.get_wechat_token()
            if cached_token_data:
                token = cached_token_data.get('token')
                expires_at = cached_token_data.get('expires_at', 0)
                
                # 检查是否过期（提前 1 分钟判断）
                if time.time() < expires_at - 60:
                    logger.debug("从缓存获取访问令牌成功")
                    return token
                else:
                    logger.debug("缓存的访问令牌已过期")
        
        # 缓存中没有或需要刷新，从企业微信 API 获取
        logger.info("从企业微信 API 获取新的访问令牌")
        token = self._fetch_token_from_api()
        
        # 缓存令牌（提前 5 分钟过期，避免边界情况）
        cache_timeout = self.token_expires_in - 300
        cache_service.set_wechat_token(token, cache_timeout)
        
        return token
    
    def _get_cached_token(self) -> Optional[str]:
        """
        从缓存获取访问令牌（已废弃，使用 cache_service）
        
        Returns:
            访问令牌，如果缓存中没有则返回 None
        """
        # 这个方法已被 get_access_token 中的逻辑替代
        cached_token_data = cache_service.get_wechat_token()
        if cached_token_data:
            token = cached_token_data.get('token')
            expires_at = cached_token_data.get('expires_at', 0)
            
            # 检查是否过期（提前 1 分钟判断）
            if time.time() < expires_at - 60:
                return token
            else:
                logger.debug("缓存的访问令牌已过期")
        return None
    
    def _cache_token(self, token: str, timeout: int):
        """
        缓存访问令牌（已废弃，使用 cache_service）
        
        Args:
            token: 访问令牌
            timeout: 缓存超时时间（秒）
        """
        # 这个方法已被 get_access_token 中的逻辑替代
        cache_service.set_wechat_token(token, timeout)
        logger.info(f"访问令牌已缓存，有效期 {timeout} 秒")
    
    def _fetch_token_from_api(self) -> str:
        """
        从企业微信 API 获取访问令牌
        
        Returns:
            访问令牌
            
        Raises:
            Exception: API 调用失败时抛出异常
        """
        # 验证配置
        is_valid, error_msg = self.config.validate_config()
        if not is_valid:
            logger.error(f"企业微信配置无效: {error_msg}")
            raise ValueError(f"企业微信配置无效: {error_msg}")
        
        # 构建请求 URL
        url = f"{self.api_base_url}/gettoken"
        params = {
            'corpid': self.config.get_corp_id(),
            'corpsecret': self.config.get_secret(),
        }
        
        try:
            # 发送请求
            logger.debug(f"请求企业微信 API: {url}")
            response = requests.get(
                url,
                params=params,
                timeout=self.api_timeout
            )
            response.raise_for_status()
            
            # 解析响应
            data = response.json()
            
            # 检查错误码
            if data.get('errcode', 0) != 0:
                error_msg = data.get('errmsg', '未知错误')
                logger.error(f"企业微信 API 返回错误: errcode={data.get('errcode')}, errmsg={error_msg}")
                raise Exception(f"获取访问令牌失败: {error_msg}")
            
            # 获取访问令牌
            access_token = data.get('access_token')
            if not access_token:
                logger.error("企业微信 API 响应中没有 access_token")
                raise Exception("获取访问令牌失败: 响应中没有 access_token")
            
            logger.info("成功从企业微信 API 获取访问令牌")
            return access_token
            
        except requests.exceptions.Timeout:
            logger.error(f"请求企业微信 API 超时（超过 {self.api_timeout} 秒）")
            raise Exception(f"请求企业微信 API 超时")
        except requests.exceptions.RequestException as e:
            logger.error(f"请求企业微信 API 失败: {e}")
            raise Exception(f"请求企业微信 API 失败: {e}")
        except Exception as e:
            logger.error(f"获取访问令牌时发生未知错误: {e}")
            raise
    
    def refresh_token(self) -> str:
        """
        强制刷新访问令牌
        
        Returns:
            新的访问令牌
        """
        logger.info("强制刷新访问令牌")
        return self.get_access_token(force_refresh=True)
    
    def clear_token_cache(self):
        """清除访问令牌缓存"""
        cache_service.clear_wechat_token()
        logger.info("访问令牌缓存已清除")
    
    def validate_token(self, token: str) -> Tuple[bool, str]:
        """
        验证访问令牌是否有效
        
        Args:
            token: 访问令牌
            
        Returns:
            (是否有效, 错误信息)
        """
        # 简单验证：尝试调用一个轻量级 API
        url = f"{self.api_base_url}/get_api_domain_ip"
        params = {'access_token': token}
        
        try:
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
            if data.get('errcode', 0) == 0:
                return True, ""
            elif data.get('errcode') == 40014:
                return False, "访问令牌无效"
            elif data.get('errcode') == 42001:
                return False, "访问令牌已过期"
            else:
                return False, data.get('errmsg', '未知错误')
                
        except Exception as e:
            logger.error(f"验证访问令牌时发生错误: {e}")
            return False, str(e)


# 全局令牌管理器实例
token_manager = WeChatTokenManager()
