"""
消息通知 URL 配置
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet

# 创建路由器
router = DefaultRouter()
router.register(r'v1/messages', MessageViewSet, basename='message')

app_name = 'notification'

urlpatterns = [
    path('', include(router.urls)),
]