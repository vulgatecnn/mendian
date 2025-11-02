"""
权限控制使用示例
展示如何在视图中使用权限验证装饰器
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.http import JsonResponse
from .permissions import permission_required
from .models import User, Role, Permission
from .serializers import UserSerializer, RoleSerializer


# ============================================================================
# 示例 1: 在函数视图中使用权限装饰器
# ============================================================================

@api_view(['GET'])
@permission_required('system.user.view')
def user_list_function_view(request):
    """
    用户列表视图（函数视图）
    需要 'system.user.view' 权限
    """
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_required('system.user.create')
def user_create_function_view(request):
    """
    创建用户视图（函数视图）
    需要 'system.user.create' 权限
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# 示例 2: 在 ViewSet 中使用权限装饰器
# ============================================================================

class UserViewSetExample(viewsets.ModelViewSet):
    """
    用户管理 ViewSet 示例
    展示如何在 ViewSet 中使用权限装饰器
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @permission_required('system.user.view')
    def list(self, request):
        """
        列表视图 - 需要查看权限
        GET /api/users/
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @permission_required('system.user.view')
    def retrieve(self, request, pk=None):
        """
        详情视图 - 需要查看权限
        GET /api/users/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @permission_required('system.user.create')
    def create(self, request):
        """
        创建视图 - 需要创建权限
        POST /api/users/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @permission_required('system.user.update')
    def update(self, request, pk=None):
        """
        更新视图 - 需要更新权限
        PUT /api/users/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @permission_required('system.user.delete')
    def destroy(self, request, pk=None):
        """
        删除视图 - 需要删除权限
        DELETE /api/users/{id}/
        """
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    @permission_required('system.user.update')
    def toggle_status(self, request, pk=None):
        """
        启用/停用用户 - 需要更新权限
        POST /api/users/{id}/toggle_status/
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'is_active': user.is_active,
            'message': f'用户已{"启用" if user.is_active else "停用"}'
        })
    
    @action(detail=True, methods=['post'])
    @permission_required('system.user.assign_role')
    def assign_roles(self, request, pk=None):
        """
        分配角色 - 需要分配角色权限
        POST /api/users/{id}/assign_roles/
        Body: {"role_ids": [1, 2, 3]}
        """
        user = self.get_object()
        role_ids = request.data.get('role_ids', [])
        
        # 清除现有角色
        user.roles.clear()
        
        # 分配新角色
        roles = Role.objects.filter(id__in=role_ids)
        user.roles.add(*roles)
        
        # 清除用户权限缓存
        user.clear_permission_cache()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'roles': RoleSerializer(user.roles.all(), many=True).data,
            'message': '角色分配成功'
        })


# ============================================================================
# 示例 3: 手动检查权限
# ============================================================================

@api_view(['GET'])
def dashboard_view(request):
    """
    仪表板视图 - 根据权限显示不同内容
    手动检查权限，不使用装饰器
    """
    if not request.user.is_authenticated:
        return Response({'error': '未认证'}, status=401)
    
    user = request.user
    
    # 获取用户所有权限
    permissions = user.get_permission_codes()
    
    # 根据权限构建响应数据
    dashboard_data = {
        'user': {
            'username': user.username,
            'is_superuser': user.is_superuser,
        },
        'permissions': list(permissions),
        'modules': []
    }
    
    # 根据权限显示不同模块
    if 'system.user.view' in permissions or user.is_superuser:
        dashboard_data['modules'].append({
            'name': '用户管理',
            'can_view': True,
            'can_create': 'system.user.create' in permissions or user.is_superuser,
            'can_update': 'system.user.update' in permissions or user.is_superuser,
            'can_delete': 'system.user.delete' in permissions or user.is_superuser,
        })
    
    if 'system.role.view' in permissions or user.is_superuser:
        dashboard_data['modules'].append({
            'name': '角色管理',
            'can_view': True,
            'can_create': 'system.role.create' in permissions or user.is_superuser,
            'can_update': 'system.role.update' in permissions or user.is_superuser,
            'can_delete': 'system.role.delete' in permissions or user.is_superuser,
        })
    
    return Response(dashboard_data)


# ============================================================================
# 示例 4: 获取当前用户权限
# ============================================================================

@api_view(['GET'])
def get_current_user_permissions(request):
    """
    获取当前用户的权限列表
    用于前端权限控制
    GET /api/permissions/current/
    """
    if not request.user.is_authenticated:
        return Response({'error': '未认证'}, status=401)
    
    user = request.user
    
    # 获取权限编码列表
    permission_codes = list(user.get_permission_codes())
    
    # 获取权限详细信息
    if user.is_superuser:
        permissions = Permission.objects.all()
    else:
        permissions = user.get_permissions()
    
    # 按模块分组
    permissions_by_module = {}
    for perm in permissions:
        if perm.module not in permissions_by_module:
            permissions_by_module[perm.module] = []
        permissions_by_module[perm.module].append({
            'code': perm.code,
            'name': perm.name,
            'description': perm.description
        })
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'is_superuser': user.is_superuser
        },
        'permission_codes': permission_codes,
        'permissions_by_module': permissions_by_module
    })


# ============================================================================
# 示例 5: 在中间件加载的权限基础上检查
# ============================================================================

@api_view(['GET'])
def quick_permission_check_view(request):
    """
    快速权限检查视图
    使用中间件加载的权限，避免额外数据库查询
    """
    if not request.user.is_authenticated:
        return Response({'error': '未认证'}, status=401)
    
    # 使用中间件加载的权限（已缓存在 request.user_permissions）
    user_permissions = getattr(request, 'user_permissions', set())
    
    # 快速检查权限（不需要数据库查询）
    can_view_users = 'system.user.view' in user_permissions
    can_create_users = 'system.user.create' in user_permissions
    can_view_roles = 'system.role.view' in user_permissions
    
    return Response({
        'can_view_users': can_view_users,
        'can_create_users': can_create_users,
        'can_view_roles': can_view_roles,
        'total_permissions': len(user_permissions)
    })


# ============================================================================
# 示例 6: 角色管理中的权限控制
# ============================================================================

class RoleViewSetExample(viewsets.ModelViewSet):
    """
    角色管理 ViewSet 示例
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    
    @permission_required('system.role.view')
    def list(self, request):
        """列表视图"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @permission_required('system.role.create')
    def create(self, request):
        """创建角色"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    @permission_required('system.role.assign_permission')
    def assign_permissions(self, request, pk=None):
        """
        分配权限给角色
        POST /api/roles/{id}/assign_permissions/
        Body: {"permission_codes": ["system.user.view", "system.user.create"]}
        """
        role = self.get_object()
        permission_codes = request.data.get('permission_codes', [])
        
        # 使用 Role 模型的方法（会自动清除相关用户的权限缓存）
        role.permissions.clear()
        role.add_permissions(permission_codes)
        
        return Response({
            'id': role.id,
            'name': role.name,
            'permissions': list(role.permissions.values('code', 'name')),
            'message': '权限分配成功'
        })
    
    @action(detail=True, methods=['post'])
    @permission_required('system.role.manage_members')
    def add_members(self, request, pk=None):
        """
        添加角色成员
        POST /api/roles/{id}/add_members/
        Body: {"user_ids": [1, 2, 3]}
        """
        role = self.get_object()
        user_ids = request.data.get('user_ids', [])
        
        # 使用 Role 模型的方法（会自动清除用户的权限缓存）
        role.add_users(user_ids)
        
        return Response({
            'id': role.id,
            'name': role.name,
            'member_count': role.get_member_count(),
            'message': '成员添加成功'
        })


# ============================================================================
# 使用说明
# ============================================================================

"""
在 urls.py 中注册这些视图：

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .example_views import (
    UserViewSetExample,
    RoleViewSetExample,
    user_list_function_view,
    dashboard_view,
    get_current_user_permissions,
)

router = DefaultRouter()
router.register(r'users', UserViewSetExample, basename='user')
router.register(r'roles', RoleViewSetExample, basename='role')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/users/list/', user_list_function_view),
    path('api/dashboard/', dashboard_view),
    path('api/permissions/current/', get_current_user_permissions),
]
"""
