"""
系统管理模块路由配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, 
    UserViewSet, 
    RoleViewSet, 
    AuditLogViewSet, 
    PermissionViewSet,
    CacheManagementViewSet
)
from .auth_views import (
    login_view,
    send_sms_code_view,
    refresh_token_view,
    logout_view,
    profile_view,
    update_profile_view,
    change_password_view,
    user_permissions_view
)

# 创建路由器
router = DefaultRouter()

# 注册 ViewSet
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'cache', CacheManagementViewSet, basename='cache')

urlpatterns = [
    # 认证相关路由
    path('auth/login/', login_view, name='login'),
    path('auth/send-sms-code/', send_sms_code_view, name='send-sms-code'),
    path('auth/refresh-token/', refresh_token_view, name='refresh-token'),
    path('auth/logout/', logout_view, name='logout'),
    
    # 个人中心路由
    path('profile/', profile_view, name='profile'),
    path('profile/update/', update_profile_view, name='update-profile'),
    path('profile/change-password/', change_password_view, name='change-password'),
    path('profile/permissions/', user_permissions_view, name='user-permissions'),
    
    # ViewSet 路由
    path('', include(router.urls)),
]
