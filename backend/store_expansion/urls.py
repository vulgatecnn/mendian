"""
拓店管理模块 URL 配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CandidateLocationViewSet,
    FollowUpRecordViewSet,
    ProfitFormulaViewSet,
)

app_name = 'store_expansion'

router = DefaultRouter()
router.register(r'locations', CandidateLocationViewSet, basename='location')
router.register(r'follow-ups', FollowUpRecordViewSet, basename='follow-up')

urlpatterns = [
    path('', include(router.urls)),
    # 盈利测算公式配置
    path('profit-formulas/', ProfitFormulaViewSet.as_view({'get': 'list'}), name='profit-formula-list'),
    path('profit-formulas/current/', ProfitFormulaViewSet.as_view({'put': 'update'}), name='profit-formula-update'),
    path('profit-formulas/reset/', ProfitFormulaViewSet.as_view({'post': 'reset'}), name='profit-formula-reset'),
]
