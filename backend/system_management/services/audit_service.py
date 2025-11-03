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
    ACTION_PUBLISH = 'publish'
    ACTION_CANCEL = 'cancel'
    ACTION_APPROVE = 'approve'
    ACTION_REJECT = 'reject'
    ACTION_SUBMIT = 'submit'
    ACTION_IMPORT = 'import'
    ACTION_EXPORT = 'export'
    
    # 目标类型常量
    TARGET_USER = 'user'
    TARGET_ROLE = 'role'
    TARGET_PERMISSION = 'permission'
    TARGET_DEPARTMENT = 'department'
    TARGET_STORE_PLAN = 'store_plan'
    TARGET_REGIONAL_PLAN = 'regional_plan'
    TARGET_BUSINESS_REGION = 'business_region'
    TARGET_STORE_TYPE = 'store_type'
    TARGET_PLAN_APPROVAL = 'plan_approval'
    
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
    
    # 开店计划相关审计日志方法
    @classmethod
    def log_store_plan_create(cls, request, plan_id: int, details: Optional[Dict[str, Any]] = None):
        """记录开店计划创建操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_CREATE,
            target_type=cls.TARGET_STORE_PLAN,
            target_id=plan_id,
            details=details or {}
        )
    
    @classmethod
    def log_store_plan_update(cls, request, plan_id: int, details: Optional[Dict[str, Any]] = None):
        """记录开店计划更新操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_UPDATE,
            target_type=cls.TARGET_STORE_PLAN,
            target_id=plan_id,
            details=details or {}
        )
    
    @classmethod
    def log_store_plan_delete(cls, request, plan_id: int, details: Optional[Dict[str, Any]] = None):
        """记录开店计划删除操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_DELETE,
            target_type=cls.TARGET_STORE_PLAN,
            target_id=plan_id,
            details=details or {}
        )
    
    @classmethod
    def log_store_plan_publish(cls, request, plan_id: int, details: Optional[Dict[str, Any]] = None):
        """记录开店计划发布操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_PUBLISH,
            target_type=cls.TARGET_STORE_PLAN,
            target_id=plan_id,
            details=details or {}
        )
    
    @classmethod
    def log_store_plan_cancel(cls, request, plan_id: int, details: Optional[Dict[str, Any]] = None):
        """记录开店计划取消操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_CANCEL,
            target_type=cls.TARGET_STORE_PLAN,
            target_id=plan_id,
            details=details or {}
        )
    
    @classmethod
    def log_business_region_create(cls, request, region_id: int, details: Optional[Dict[str, Any]] = None):
        """记录经营区域创建操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_CREATE,
            target_type=cls.TARGET_BUSINESS_REGION,
            target_id=region_id,
            details=details or {}
        )
    
    @classmethod
    def log_business_region_update(cls, request, region_id: int, details: Optional[Dict[str, Any]] = None):
        """记录经营区域更新操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_UPDATE,
            target_type=cls.TARGET_BUSINESS_REGION,
            target_id=region_id,
            details=details or {}
        )
    
    @classmethod
    def log_business_region_delete(cls, request, region_id: int, details: Optional[Dict[str, Any]] = None):
        """记录经营区域删除操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_DELETE,
            target_type=cls.TARGET_BUSINESS_REGION,
            target_id=region_id,
            details=details or {}
        )
    
    @classmethod
    def log_store_type_create(cls, request, store_type_id: int, details: Optional[Dict[str, Any]] = None):
        """记录门店类型创建操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_CREATE,
            target_type=cls.TARGET_STORE_TYPE,
            target_id=store_type_id,
            details=details or {}
        )
    
    @classmethod
    def log_store_type_update(cls, request, store_type_id: int, details: Optional[Dict[str, Any]] = None):
        """记录门店类型更新操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_UPDATE,
            target_type=cls.TARGET_STORE_TYPE,
            target_id=store_type_id,
            details=details or {}
        )
    
    @classmethod
    def log_store_type_delete(cls, request, store_type_id: int, details: Optional[Dict[str, Any]] = None):
        """记录门店类型删除操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_DELETE,
            target_type=cls.TARGET_STORE_TYPE,
            target_id=store_type_id,
            details=details or {}
        )
    
    @classmethod
    def log_plan_approval_submit(cls, request, approval_id: int, details: Optional[Dict[str, Any]] = None):
        """记录计划审批提交操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_SUBMIT,
            target_type=cls.TARGET_PLAN_APPROVAL,
            target_id=approval_id,
            details=details or {}
        )
    
    @classmethod
    def log_plan_approval_approve(cls, request, approval_id: int, details: Optional[Dict[str, Any]] = None):
        """记录计划审批通过操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_APPROVE,
            target_type=cls.TARGET_PLAN_APPROVAL,
            target_id=approval_id,
            details=details or {}
        )
    
    @classmethod
    def log_plan_approval_reject(cls, request, approval_id: int, details: Optional[Dict[str, Any]] = None):
        """记录计划审批拒绝操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_REJECT,
            target_type=cls.TARGET_PLAN_APPROVAL,
            target_id=approval_id,
            details=details or {}
        )
    
    @classmethod
    def log_plan_data_import(cls, request, details: Optional[Dict[str, Any]] = None):
        """记录计划数据导入操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_IMPORT,
            target_type=cls.TARGET_STORE_PLAN,
            target_id=0,  # 批量操作使用0作为ID
            details=details or {}
        )
    
    @classmethod
    def log_plan_data_export(cls, request, details: Optional[Dict[str, Any]] = None):
        """记录计划数据导出操作"""
        return cls.log(
            request=request,
            action=cls.ACTION_EXPORT,
            target_type=cls.TARGET_STORE_PLAN,
            target_id=0,  # 批量操作使用0作为ID
            details=details or {}
        )


# 创建全局审计日志记录器实例
audit_logger = AuditLogger()

