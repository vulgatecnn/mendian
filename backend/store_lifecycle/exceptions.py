"""
自定义异常处理器
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    自定义异常处理器，统一返回格式
    """
    # 调用 DRF 默认的异常处理器
    response = exception_handler(exc, context)
    
    if response is not None:
        # 统一错误响应格式
        custom_response_data = {
            'code': response.status_code,
            'message': '请求失败',
            'data': None,
            'errors': response.data
        }
        
        # 记录错误日志
        logger.error(f"API Error: {exc}", exc_info=True)
        
        response.data = custom_response_data
    
    return response


class ErrorCode:
    """错误码定义"""
    # 通用错误
    SUCCESS = 0
    UNKNOWN_ERROR = 1000
    INVALID_PARAMS = 1001
    PERMISSION_DENIED = 1002
    
    # 企业微信集成错误
    WECHAT_API_ERROR = 2001
    WECHAT_TOKEN_EXPIRED = 2002
    WECHAT_SYNC_FAILED = 2003
    
    # 用户管理错误
    USER_NOT_FOUND = 3001
    USER_ALREADY_EXISTS = 3002
    USER_DISABLED = 3003
    
    # 角色管理错误
    ROLE_NOT_FOUND = 4001
    ROLE_IN_USE = 4002
    ROLE_NAME_EXISTS = 4003
