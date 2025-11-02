"""
审计日志混入类
提供自动记录审计日志的功能
"""
from .services.audit_service import AuditLogger


class AuditLogMixin:
    """
    审计日志混入类
    为ViewSet提供自动审计日志记录功能
    
    使用方法:
        class MyViewSet(AuditLogMixin, viewsets.ModelViewSet):
            audit_target_type = 'user'  # 设置目标类型
            ...
    """
    
    # 子类需要设置的属性
    audit_target_type = None  # 目标类型，如 'user', 'role'
    
    def get_audit_details(self, instance, action):
        """
        获取审计日志详情
        子类可以重写此方法来自定义详情内容
        
        参数:
            instance: 操作的对象实例
            action: 操作类型
        
        返回:
            dict: 详情字典
        """
        details = {}
        
        # 根据操作类型添加不同的详情
        if action == AuditLogger.ACTION_CREATE:
            details['name'] = str(instance)
        elif action == AuditLogger.ACTION_UPDATE:
            details['name'] = str(instance)
        elif action == AuditLogger.ACTION_DELETE:
            details['name'] = str(instance)
        
        return details
    
    def perform_create(self, serializer):
        """创建对象时记录审计日志"""
        instance = serializer.save()
        
        # 记录审计日志
        if self.audit_target_type:
            details = self.get_audit_details(instance, AuditLogger.ACTION_CREATE)
            AuditLogger.log(
                request=self.request,
                action=AuditLogger.ACTION_CREATE,
                target_type=self.audit_target_type,
                target_id=instance.id,
                details=details
            )
        
        return instance
    
    def perform_update(self, serializer):
        """更新对象时记录审计日志"""
        instance = serializer.save()
        
        # 记录审计日志
        if self.audit_target_type:
            details = self.get_audit_details(instance, AuditLogger.ACTION_UPDATE)
            AuditLogger.log(
                request=self.request,
                action=AuditLogger.ACTION_UPDATE,
                target_type=self.audit_target_type,
                target_id=instance.id,
                details=details
            )
        
        return instance
    
    def perform_destroy(self, instance):
        """删除对象时记录审计日志"""
        # 先记录审计日志（因为删除后对象就不存在了）
        if self.audit_target_type:
            details = self.get_audit_details(instance, AuditLogger.ACTION_DELETE)
            AuditLogger.log(
                request=self.request,
                action=AuditLogger.ACTION_DELETE,
                target_type=self.audit_target_type,
                target_id=instance.id,
                details=details
            )
        
        # 执行删除
        instance.delete()

