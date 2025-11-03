from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusinessRegionViewSet, 
    StoreTypeViewSet, 
    StorePlanViewSet, 
    RegionalPlanViewSet,
    PlanApprovalViewSet,
    PlanImportExportViewSet
)

# 创建路由器
router = DefaultRouter()
router.register(r'regions', BusinessRegionViewSet, basename='businessregion')
router.register(r'store-types', StoreTypeViewSet, basename='storetype')
router.register(r'plans', StorePlanViewSet, basename='storeplan')
router.register(r'regional-plans', RegionalPlanViewSet, basename='regionalplan')
router.register(r'approvals', PlanApprovalViewSet, basename='planapproval')
router.register(r'import-export', PlanImportExportViewSet, basename='planimportexport')

app_name = 'store_planning'

urlpatterns = [
    path('', include(router.urls)),
]