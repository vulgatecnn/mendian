"""
基础数据管理 URL 配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'base_data'

router = DefaultRouter()
router.register(r'regions', views.BusinessRegionViewSet, basename='region')
router.register(r'suppliers', views.SupplierViewSet, basename='supplier')
router.register(r'entities', views.LegalEntityViewSet, basename='entity')
router.register(r'customers', views.CustomerViewSet, basename='customer')
router.register(r'budgets', views.BudgetViewSet, basename='budget')

urlpatterns = [
    path('', include(router.urls)),
]
