"""
URL configuration for store_lifecycle project.
门店生命周期管理系统路由配置
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Django 管理后台
    path('admin/', admin.site.urls),
    
    # API 文档
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # 系统管理模块 API
    path('api/', include('system_management.urls')),
    
    # 开店计划管理模块 API
    path('api/store-planning/', include('store_planning.urls')),
    
    # 基础数据管理模块 API
    path('api/base-data/', include('base_data.urls')),
    
    # 拓店管理模块 API
    path('api/expansion/', include('store_expansion.urls')),
    
    # 开店筹备管理模块 API
    path('api/preparation/', include('store_preparation.urls')),
    
    # 门店档案模块 API
    path('api/archive/', include('store_archive.urls')),
    
    # 审批中心模块 API
    path('api/approval/', include('approval.urls')),
    
    # 消息通知模块 API
    path('api/', include('notification.urls')),
    
    # 企业微信集成模块 API
    path('api/', include('wechat_integration.urls')),
    
    # 数据分析模块 API
    path('api/analytics/', include('data_analytics.urls')),
]
