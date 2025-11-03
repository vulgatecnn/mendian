"""
基础数据管理视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import BusinessRegion, Supplier, LegalEntity, Customer, Budget
from .serializers import (
    BusinessRegionSerializer,
    SupplierSerializer,
    LegalEntitySerializer,
    CustomerSerializer,
    BudgetSerializer
)


class BusinessRegionViewSet(viewsets.ModelViewSet):
    """业务大区视图集"""
    
    queryset = BusinessRegion.objects.all()
    serializer_class = BusinessRegionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'manager']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['code', 'created_at']
    ordering = ['code']
    
    def perform_create(self, serializer):
        """创建时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """删除前检查关联"""
        instance = self.get_object()
        
        # 检查是否有关联的商务预算
        if instance.budgets.exists():
            return Response(
                {
                    'code': 1001,
                    'message': '该业务大区已被商务预算引用，无法删除',
                    'data': None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 检查是否有关联的门店（如果 store_archive 模块已实现）
        # 这里预留检查逻辑
        
        return super().destroy(request, *args, **kwargs)


class SupplierViewSet(viewsets.ModelViewSet):
    """供应商视图集"""
    
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['supplier_type', 'status']
    search_fields = ['name', 'code', 'contact_person', 'contact_phone']
    ordering_fields = ['code', 'created_at']
    ordering = ['code']
    
    def perform_create(self, serializer):
        """创建时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """删除前检查关联"""
        instance = self.get_object()
        
        # 检查是否有关联的工程单（如果 store_preparation 模块已实现）
        # 这里预留检查逻辑
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """获取合作中的供应商列表"""
        queryset = self.get_queryset().filter(status=Supplier.STATUS_COOPERATING)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': '成功',
            'data': serializer.data
        })


class LegalEntityViewSet(viewsets.ModelViewSet):
    """法人主体视图集"""
    
    queryset = LegalEntity.objects.all()
    serializer_class = LegalEntitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'code', 'credit_code', 'legal_representative']
    ordering_fields = ['code', 'created_at']
    ordering = ['code']
    
    def perform_create(self, serializer):
        """创建时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """删除前检查关联"""
        instance = self.get_object()
        
        # 检查是否有关联的跟进单（如果 store_expansion 模块已实现）
        # 这里预留检查逻辑
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def operating(self, request):
        """获取营运中的法人主体列表"""
        queryset = self.get_queryset().filter(status=LegalEntity.STATUS_OPERATING)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': '成功',
            'data': serializer.data
        })


class CustomerViewSet(viewsets.ModelViewSet):
    """客户视图集"""
    
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['customer_type', 'status']
    search_fields = ['name', 'code', 'contact_person', 'contact_phone']
    ordering_fields = ['code', 'created_at']
    ordering = ['code']
    
    def perform_create(self, serializer):
        """创建时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """删除前检查关联"""
        instance = self.get_object()
        
        # 检查是否有关联的门店（如果 store_archive 模块已实现）
        # 这里预留检查逻辑
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def cooperating(self, request):
        """获取合作中的客户列表"""
        queryset = self.get_queryset().filter(status=Customer.STATUS_COOPERATING)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': '成功',
            'data': serializer.data
        })


class BudgetViewSet(viewsets.ModelViewSet):
    """商务预算视图集"""
    
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business_region']
    search_fields = ['name', 'code']
    ordering_fields = ['code', 'valid_from', 'created_at']
    ordering = ['-valid_from', 'code']
    
    def perform_create(self, serializer):
        """创建时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """删除前检查关联"""
        instance = self.get_object()
        
        # 检查是否有关联的开店计划（如果 store_planning 模块已实现）
        # 这里预留检查逻辑
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """获取启用状态的预算列表"""
        queryset = self.get_queryset().filter(status=Budget.STATUS_ACTIVE)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': '成功',
            'data': serializer.data
        })
