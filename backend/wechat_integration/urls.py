"""
企业微信集成模块 URL 配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WechatSyncViewSet, WechatDepartmentViewSet, 
    WechatUserViewSet, WechatMessageViewSet
)

app_name = 'wechat_integration'

# 创建路由器
router = DefaultRouter()

# 注册视图集
router.register(r'sync', WechatSyncViewSet, basename='wechat-sync')
router.register(r'departments', WechatDepartmentViewSet, basename='wechat-departments')
router.register(r'users', WechatUserViewSet, basename='wechat-users')
router.register(r'messages', WechatMessageViewSet, basename='wechat-messages')

urlpatterns = [
    path('v1/wechat/', include(router.urls)),
]