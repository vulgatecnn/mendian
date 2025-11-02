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
    path('', include(router.urls)),
]
