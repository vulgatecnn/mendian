"""
企业微信集成异常定义
定义企业微信集成相关的异常类
"""


class WeChatException(Exception):
    """企业微信集成基础异常"""
    
    def __init__(self, message: str, errcode: int = None):
        """
        初始化异常
        
        Args:
            message: 错误信息
            errcode: 企业微信错误码
        """
        self.message = message
        self.errcode = errcode
        super().__init__(self.message)
    
    def __str__(self):
        if self.errcode:
            return f"[{self.errcode}] {self.message}"
        return self.message


class WeChatConfigError(WeChatException):
    """企业微信配置错误"""
    pass


class WeChatTokenError(WeChatException):
    """企业微信令牌错误"""
    pass


class WeChatAPIError(WeChatException):
    """企业微信 API 调用错误"""
    pass


class WeChatTimeoutError(WeChatException):
    """企业微信 API 超时错误"""
    pass


class WeChatNetworkError(WeChatException):
    """企业微信网络错误"""
    pass


class WeChatSyncError(WeChatException):
    """企业微信同步错误"""
    pass
