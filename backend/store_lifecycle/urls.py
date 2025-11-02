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
]
