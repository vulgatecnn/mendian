"""
门店档案模块 - URL 路由配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from store_archive.views import StoreProfileViewSet

# 创建路由器
router = DefaultRouter()
router.register(r'stores', StoreProfileViewSet, basename='store-profile')

app_name = 'store_archive'

urlpatterns = [
    path('', include(router.urls)),
]
