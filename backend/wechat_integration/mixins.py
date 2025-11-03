"""
企业微信集成模块混入类
"""
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse


class PermissionRequiredMixin:
    """
    权限验证混入类
    用于 ViewSet 的权限控制
    """
    required_permissions = {}  # 格式: {'action_name': 'permission_code'}
    
    def check_permissions(self, request):
        """检查权限"""
        super().check_permissions(request)
        
        # 获取当前动作
        action = self.action
        
        # 检查是否需要特定权限
        if action in self.required_permissions:
            permission_code = self.required_permissions[action]
            
            # 检查用户权限
            if not request.user.is_authenticated:
                self.permission_denied(
                    request, 
                    message='未认证，请先登录'
                )
            
            if not request.user.has_permission(permission_code):
                self.permission_denied(
                    request,
                    message=f'您没有权限执行此操作 ({permission_code})'
                )
    
    def permission_denied(self, request, message=None, code=None):
        """权限拒绝处理"""
        if message is None:
            message = '权限不足'
        
        # 返回统一格式的错误响应
        raise PermissionDenied({
            'code': 1002,
            'message': message,
            'data': None
        })


from rest_framework.exceptions import PermissionDenied