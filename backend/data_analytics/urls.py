"""
数据分析模块URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# 创建路由器
router = DefaultRouter()

# 注册视图集
# router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')
# router.register(r'reports', views.ReportViewSet, basename='reports')

app_name = 'data_analytics'

urlpatterns = [
    # API路由
    path('', include(router.urls)),
    
    # 经营大屏相关接口
    path('dashboard/', views.DashboardDataView.as_view(), name='dashboard-data'),
    path('store-map/', views.StoreMapDataView.as_view(), name='store-map-data'),
    path('follow-up-funnel/', views.FollowUpFunnelDataView.as_view(), name='follow-up-funnel-data'),
    path('plan-progress/', views.PlanProgressDataView.as_view(), name='plan-progress-data'),
    
    # 报表生成相关接口
    path('reports/generate/', views.GenerateReportView.as_view(), name='generate-report'),
    path('reports/status/<uuid:task_id>/', views.ReportStatusView.as_view(), name='report-status'),
    path('reports/download/<uuid:task_id>/', views.DownloadReportView.as_view(), name='download-report'),
    
    # 外部数据集成接口
    path('external/sales-data/', views.ExternalSalesDataView.as_view(), name='external-sales-data'),
    path('external/sync-status/', views.DataSyncStatusView.as_view(), name='data-sync-status'),
    
    # 缓存管理接口
    path('cache/refresh/', views.RefreshCacheView.as_view(), name='refresh-cache'),
]