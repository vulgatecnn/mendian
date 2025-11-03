"""
企业微信 API 客户端服务
"""
import requests
import json
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone


logger = logging.getLogger(__name__)


class WechatAPIError(Exception):
    """企业微信 API 错误"""
    def __init__(self, errcode: int, errmsg: str):
        self.errcode = errcode
        self.errmsg = errmsg
        super().__init__(f"企业微信API错误 [{errcode}]: {errmsg}")


class WechatClient:
    """企业微信 API 客户端"""
    
    def __init__(self):
        self.corp_id = settings.WECHAT_CORP_ID
        self.secret = settings.WECHAT_SECRET
        self.base_url = settings.WECHAT_API_BASE_URL
        self.timeout = settings.WECHAT_API_TIMEOUT
        
        if not self.corp_id or not self.secret:
            raise ValueError("企业微信配置不完整，请检查 WECHAT_CORP_ID 和 WECHAT_SECRET")
    
    def get_access_token(self) -> str:
        """
        获取访问令牌
        使用缓存避免频繁请求
        
        Returns:
            str: 访问令牌
            
        Raises:
            WechatAPIError: API 调用失败
        """
        # 尝试从缓存获取
        cache_key = settings.WECHAT_TOKEN_CACHE_KEY
        token = cache.get(cache_key)
        
        if token:
            logger.debug("从缓存获取企业微信访问令牌")
            return token
        
        # 缓存未命中，请求新令牌
        url = f"{self.base_url}/gettoken"
        params = {
            'corpid': self.corp_id,
            'corpsecret': self.secret
        }
        
        try:
            response = requests.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            if data.get('errcode', 0) != 0:
                raise WechatAPIError(data.get('errcode'), data.get('errmsg'))
            
            token = data['access_token']
            expires_in = data.get('expires_in', settings.WECHAT_TOKEN_EXPIRES_IN)
            
            # 缓存令牌，提前5分钟过期以避免边界问题
            cache.set(cache_key, token, expires_in - 300)
            
            logger.info("成功获取企业微信访问令牌")
            return token
            
        except requests.RequestException as e:
            logger.error(f"获取企业微信访问令牌失败: {e}")
            raise WechatAPIError(-1, f"网络请求失败: {e}")
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        发起 API 请求的通用方法
        
        Args:
            method: HTTP 方法
            endpoint: API 端点
            **kwargs: 请求参数
            
        Returns:
            Dict: API 响应数据
            
        Raises:
            WechatAPIError: API 调用失败
        """
        access_token = self.get_access_token()
        url = f"{self.base_url}/{endpoint}"
        
        # 添加访问令牌到参数
        if 'params' not in kwargs:
            kwargs['params'] = {}
        kwargs['params']['access_token'] = access_token
        
        # 设置超时
        kwargs.setdefault('timeout', self.timeout)
        
        try:
            response = requests.request(method, url, **kwargs)
            response.raise_for_status()
            
            data = response.json()
            
            # 检查业务错误码
            errcode = data.get('errcode', 0)
            if errcode != 0:
                errmsg = data.get('errmsg', '未知错误')
                
                # 如果是令牌过期，清除缓存并重试一次
                if errcode in [40014, 42001]:  # 令牌过期或无效
                    logger.warning("企业微信访问令牌过期，清除缓存并重试")
                    cache.delete(settings.WECHAT_TOKEN_CACHE_KEY)
                    
                    # 重新获取令牌并重试
                    access_token = self.get_access_token()
                    kwargs['params']['access_token'] = access_token
                    
                    response = requests.request(method, url, **kwargs)
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get('errcode', 0) != 0:
                        raise WechatAPIError(data.get('errcode'), data.get('errmsg'))
                else:
                    raise WechatAPIError(errcode, errmsg)
            
            return data
            
        except requests.RequestException as e:
            logger.error(f"企业微信API请求失败 [{method} {endpoint}]: {e}")
            raise WechatAPIError(-1, f"网络请求失败: {e}")
    
    def get_department_list(self, dept_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        获取部门列表
        
        Args:
            dept_id: 部门ID，不传则获取全部部门
            
        Returns:
            List[Dict]: 部门列表
        """
        params = {}
        if dept_id is not None:
            params['id'] = dept_id
        
        data = self._make_request('GET', 'department/list', params=params)
        return data.get('department', [])
    
    def get_user_list(self, dept_id: int, fetch_child: bool = False) -> List[Dict[str, Any]]:
        """
        获取部门成员列表
        
        Args:
            dept_id: 部门ID
            fetch_child: 是否递归获取子部门成员
            
        Returns:
            List[Dict]: 用户列表
        """
        params = {
            'department_id': dept_id,
            'fetch_child': 1 if fetch_child else 0
        }
        
        data = self._make_request('GET', 'user/list', params=params)
        return data.get('userlist', [])
    
    def get_user_detail(self, user_id: str) -> Dict[str, Any]:
        """
        获取用户详细信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            Dict: 用户详细信息
        """
        params = {'userid': user_id}
        data = self._make_request('GET', 'user/get', params=params)
        return data
    
    def send_message(self, message_data: Dict[str, Any]) -> str:
        """
        发送应用消息
        
        Args:
            message_data: 消息数据
            
        Returns:
            str: 消息ID
        """
        # 添加应用ID
        message_data['agentid'] = settings.WECHAT_AGENT_ID
        
        data = self._make_request('POST', 'message/send', json=message_data)
        return data.get('msgid', '')
    
    def send_text_message(self, 
                         content: str, 
                         to_users: Optional[List[str]] = None,
                         to_departments: Optional[List[int]] = None,
                         to_tags: Optional[List[int]] = None) -> str:
        """
        发送文本消息
        
        Args:
            content: 消息内容
            to_users: 接收用户ID列表
            to_departments: 接收部门ID列表
            to_tags: 接收标签ID列表
            
        Returns:
            str: 消息ID
        """
        message_data = {
            'msgtype': 'text',
            'text': {
                'content': content
            }
        }
        
        # 设置接收人
        if to_users:
            message_data['touser'] = '|'.join(to_users)
        if to_departments:
            message_data['toparty'] = '|'.join(map(str, to_departments))
        if to_tags:
            message_data['totag'] = '|'.join(map(str, to_tags))
        
        # 如果没有指定接收人，则发送给所有人
        if not any([to_users, to_departments, to_tags]):
            message_data['touser'] = '@all'
        
        return self.send_message(message_data)
    
    def send_textcard_message(self,
                             title: str,
                             description: str,
                             url: str,
                             btntxt: str = "详情",
                             to_users: Optional[List[str]] = None,
                             to_departments: Optional[List[int]] = None,
                             to_tags: Optional[List[int]] = None) -> str:
        """
        发送文本卡片消息
        
        Args:
            title: 标题
            description: 描述
            url: 跳转链接
            btntxt: 按钮文字
            to_users: 接收用户ID列表
            to_departments: 接收部门ID列表
            to_tags: 接收标签ID列表
            
        Returns:
            str: 消息ID
        """
        message_data = {
            'msgtype': 'textcard',
            'textcard': {
                'title': title,
                'description': description,
                'url': url,
                'btntxt': btntxt
            }
        }
        
        # 设置接收人
        if to_users:
            message_data['touser'] = '|'.join(to_users)
        if to_departments:
            message_data['toparty'] = '|'.join(map(str, to_departments))
        if to_tags:
            message_data['totag'] = '|'.join(map(str, to_tags))
        
        # 如果没有指定接收人，则发送给所有人
        if not any([to_users, to_departments, to_tags]):
            message_data['touser'] = '@all'
        
        return self.send_message(message_data)