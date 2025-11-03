"""
开店筹备模块 URL 配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'store_preparation'

router = DefaultRouter()
router.register(r'construction', views.ConstructionOrderViewSet, basename='construction')
router.register(r'milestones', views.MilestoneViewSet, basename='milestone')
router.register(r'delivery', views.DeliveryChecklistViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),
]
