"""
审计日志服务
提供审计日志记录功能
"""
from typing import Optional, Dict, Any
from django.contrib.auth import get_user_model
from ..models import AuditLog


User = get_user_model()


class AuditLogger:
    """审计日志记录器"""
    
    # 操作类型常量
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_ENABLE = 'enable'
    ACTION_DISABLE = 'disable'
    ACTION_ASSIGN = 'assign'
    ACTION_REMOVE = 'remove'
    ACTION_LOGIN = 'login'
    ACTION_LOGOUT = 'logout'
    
    # 目标类型常量
    TARGET_USER = 'user'
    TARGET_ROLE = 'role'
    TARGET_PERMISSION = 'permission'
    TARGET_DEPARTMENT = 'department'
    
    @staticmethod
    def get_client_ip(request) -> str:
        """
        从请求中获取客户端IP地址
        
        参数:
            request: Django HttpRequest 对象
        
        返回:
            str: 客户端IP地址
        """
        # 尝试从 X-Forwarded-For 头获取（适用于代理/负载均衡场景）
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # X-Forwarded-For 可能包含多个IP，取第一个
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            # 直接从 REMOTE_ADDR 获取
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        
        return ip
    
    @classmethod
    def log(
        cls,
        request,
        action: str,
        target_type: str,
        target_id: int,
        details: Optional[Dict[str, Any]] = None,
        user: Optional[User] = None
    ) -> AuditLog:
        """
        记录审计日志
        
        参数:
            request: Django HttpRequest 对象（用于获取IP地址）
            action: 操作类型（如 'create', 'update', 'delete'）
            target_type: 操作对象类型（如 'user', 'role'）
            target_id: 操作对象ID
            details: 操作详情（字典格式，将存储为JSON）
            user: 操作人（可选，默认从request.user获取）
        
        返回:
            AuditLog: 创建的审计日志对象
        """
        # 获取操作人
        if user is None:
            user = request.user if request.user.is_authenticated else None
        
        # 获取IP地址
        ip_address = cls.get_client_ip(request)
        
        # 如果没有提供详情，使用空字典
        if details is None:
            details = {}
        
        # 创建审计日志
        audit_log = AuditLog.objects.create(
            user=user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address
        )
        
        return audit_log
    
    @classmethod
    def log_user_create(cls, request, user_id: int, details: Optional[Dict[str, Any]] = None):
        """记录用户创建操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_CREATE,
            target_type=cls.TARGET_USER,
            target_id=user_id,
            details=details or {}
        )
    
    @classmethod
    def log_user_update(cls, request, user_id: int, details: Optional[Dict[str, Any]] = None):
        """记录用户更新操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_UPDATE,
            target_type=cls.TARGET_USER,
            target_id=user_id,
            details=details or {}
        )
    
    @classmethod
    def log_user_delete(cls, request, user_id: int, details: Optional[Dict[str, Any]] = None):
        """记录用户删除操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_DELETE,
            target_type=cls.TARGET_USER,
            target_id=user_id,
            details=details or {}
        )
    
    @classmethod
    def log_user_enable(cls, request, user_id: int, details: Optional[Dict[str, Any]] = None):
        """记录用户启用操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_ENABLE,
            target_type=cls.TARGET_USER,
            target_id=user_id,
            details=details or {}
        )
    
    @classmethod
    def log_user_disable(cls, request, user_id: int, details: Optional[Dict[str, Any]] = None):
        """记录用户停用操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_DISABLE,
            target_type=cls.TARGET_USER,
            target_id=user_id,
            details=details or {}
        )
    
    @classmethod
    def log_role_create(cls, request, role_id: int, details: Optional[Dict[str, Any]] = None):
        """记录角色创建操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_CREATE,
            target_type=cls.TARGET_ROLE,
            target_id=role_id,
            details=details or {}
        )
    
    @classmethod
    def log_role_update(cls, request, role_id: int, details: Optional[Dict[str, Any]] = None):
        """记录角色更新操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_UPDATE,
            target_type=cls.TARGET_ROLE,
            target_id=role_id,
            details=details or {}
        )
    
    @classmethod
    def log_role_delete(cls, request, role_id: int, details: Optional[Dict[str, Any]] = None):
        """记录角色删除操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_DELETE,
            target_type=cls.TARGET_ROLE,
            target_id=role_id,
            details=details or {}
        )
    
    @classmethod
    def log_role_assign(cls, request, user_id: int, details: Optional[Dict[str, Any]] = None):
        """记录角色分配操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_ASSIGN,
            target_type=cls.TARGET_USER,
            target_id=user_id,
            details=details or {}
        )
    
    @classmethod
    def log_permission_assign(cls, request, role_id: int, details: Optional[Dict[str, Any]] = None):
        """记录权限分配操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_ASSIGN,
            target_type=cls.TARGET_ROLE,
            target_id=role_id,
            details=details or {}
        )


# 创建全局审计日志记录器实例
audit_logger = AuditLogger()

