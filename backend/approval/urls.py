"""
审批中心URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ApprovalInstanceViewSet, ApprovalTemplateViewSet

app_name = 'approval'

router = DefaultRouter()
router.register(r'instances', ApprovalInstanceViewSet, basename='instance')
router.register(r'templates', ApprovalTemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
]