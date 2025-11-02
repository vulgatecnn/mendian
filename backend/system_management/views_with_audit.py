"""
带审计日志的视图示例
展示如何在业务操作中集成审计日志记录
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import User, Role
from .mixins import AuditLogMixin
from .services.audit_service import AuditLogger


class UserViewSetWithAudit(AuditLogMixin, viewsets.ModelViewSet):
    """
    用户管理ViewSet（带审计日志）
    
    此示例展示如何在用户管理操作中集成审计日志
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    audit_target_type = AuditLogger.TARGET_USER
    
    def get_audit_details(self, instance, action):
        """自定义审计日志详情"""
        details = {
            'username': instance.username,
            'phone': instance.phone,
            'department': instance.department.name if instance.department else None,
        }
        
        if action == AuditLogger.ACTION_UPDATE:
            # 可以添加更多更新相关的信息
            details['is_active'] = instance.is_active
        
        return details
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        启用/停用用户
        
        此操作会记录审计日志
        """
        user = self.get_object()
        old_status = user.is_active
        
        # 切换状态
        user.is_active = not user.is_active
        user.save()
        
        # 记录审计日志
        action_type = AuditLogger.ACTION_ENABLE if user.is_active else AuditLogger.ACTION_DISABLE
        details = {
            'username': user.username,
            'phone': user.phone,
            'old_status': '启用' if old_status else '停用',
            'new_status': '启用' if user.is_active else '停用',
        }
        
        AuditLogger.log(
            request=request,
            action=action_type,
            target_type=AuditLogger.TARGET_USER,
            target_id=user.id,
            details=details
        )
        
        return Response({
            'message': f"用户已{'启用' if user.is_active else '停用'}",
            'is_active': user.is_active
        })
    
    @action(detail=True, methods=['post'])
    def assign_roles(self, request, pk=None):
        """
        分配角色
        
        此操作会记录审计日志
        """
        user = self.get_object()
        role_ids = request.data.get('role_ids', [])
        
        # 获取旧角色列表
        old_roles = list(user.roles.values_list('id', 'name'))
        
        # 清除现有角色并分配新角色
        user.roles.clear()
        if role_ids:
            roles = Role.objects.filter(id__in=role_ids)
            user.roles.add(*roles)
        
        # 清除用户权限缓存
        user.clear_permission_cache()
        
        # 获取新角色列表
        new_roles = list(user.roles.values_list('id', 'name'))
        
        # 记录审计日志
        details = {
            'username': user.username,
            'phone': user.phone,
            'old_roles': [{'id': r[0], 'name': r[1]} for r in old_roles],
            'new_roles': [{'id': r[0], 'name': r[1]} for r in new_roles],
        }
        
        AuditLogger.log_role_assign(
            request=request,
            user_id=user.id,
            details=details
        )
        
        return Response({
            'message': '角色分配成功',
            'roles': [{'id': r[0], 'name': r[1]} for r in new_roles]
        })


class RoleViewSetWithAudit(AuditLogMixin, viewsets.ModelViewSet):
    """
    角色管理ViewSet（带审计日志）
    
    此示例展示如何在角色管理操作中集成审计日志
    """
    queryset = Role.objects.all()
    permission_classes = [IsAuthenticated]
    audit_target_type = AuditLogger.TARGET_ROLE
    
    def get_audit_details(self, instance, action):
        """自定义审计日志详情"""
        details = {
            'name': instance.name,
            'description': instance.description,
        }
        
        if action == AuditLogger.ACTION_CREATE:
            details['is_active'] = instance.is_active
        elif action == AuditLogger.ACTION_UPDATE:
            details['is_active'] = instance.is_active
            details['member_count'] = instance.get_member_count()
        elif action == AuditLogger.ACTION_DELETE:
            details['member_count'] = instance.get_member_count()
        
        return details
    
    def destroy(self, request, *args, **kwargs):
        """
        删除角色（带使用检查和审计日志）
        """
        role = self.get_object()
        
        # 检查角色是否被使用
        if role.is_in_use():
            return Response(
                {'error': '该角色已被分配给用户，无法删除'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 调用父类的destroy方法（会自动记录审计日志）
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def assign_permissions(self, request, pk=None):
        """
        分配权限
        
        此操作会记录审计日志
        """
        role = self.get_object()
        permission_codes = request.data.get('permission_codes', [])
        
        # 获取旧权限列表
        old_permissions = list(role.permissions.values_list('code', 'name'))
        
        # 清除现有权限并分配新权限
        role.permissions.clear()
        if permission_codes:
            from .models import Permission
            permissions = Permission.objects.filter(code__in=permission_codes)
            role.permissions.add(*permissions)
        
        # 清除所有拥有此角色的用户的权限缓存
        role._clear_users_permission_cache()
        
        # 获取新权限列表
        new_permissions = list(role.permissions.values_list('code', 'name'))
        
        # 记录审计日志
        details = {
            'role_name': role.name,
            'old_permissions': [{'code': p[0], 'name': p[1]} for p in old_permissions],
            'new_permissions': [{'code': p[0], 'name': p[1]} for p in new_permissions],
        }
        
        AuditLogger.log_permission_assign(
            request=request,
            role_id=role.id,
            details=details
        )
        
        return Response({
            'message': '权限分配成功',
            'permissions': [{'code': p[0], 'name': p[1]} for p in new_permissions]
        })
    
    @action(detail=True, methods=['post'])
    def add_members(self, request, pk=None):
        """
        添加角色成员
        
        此操作会记录审计日志
        """
        role = self.get_object()
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response(
                {'error': '请提供用户ID列表'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 添加成员
        users = User.objects.filter(id__in=user_ids)
        role.users.add(*users)
        
        # 清除新增用户的权限缓存
        for user in users:
            user.clear_permission_cache()
        
        # 记录审计日志
        details = {
            'role_name': role.name,
            'added_users': [
                {'id': u.id, 'username': u.username, 'phone': u.phone}
                for u in users
            ],
        }
        
        AuditLogger.log(
            request=request,
            action=AuditLogger.ACTION_ASSIGN,
            target_type=AuditLogger.TARGET_ROLE,
            target_id=role.id,
            details=details
        )
        
        return Response({
            'message': f'成功添加 {len(users)} 个成员',
            'member_count': role.get_member_count()
        })

