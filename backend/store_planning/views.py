from django.shortcuts import render
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Prefetch

from .permissions import (
    plan_permission_required, 
    audit_sensitive_operation,
    require_plan_ownership_or_permission,
    check_data_scope_permission,
    batch_permission_required,
    rate_limit_permission
)

from .models import (
    BusinessRegion, StoreType, StorePlan, RegionalPlan, 
    PlanExecutionLog, PlanApproval
)
from .serializers import (
    BusinessRegionSerializer, 
    BusinessRegionListSerializer,
    StoreTypeSerializer,
    StoreTypeListSerializer,
    StorePlanSerializer,
    StorePlanCreateSerializer,
    StorePlanUpdateSerializer,
    StorePlanListSerializer,
    RegionalPlanSerializer,
    PlanExecutionLogSerializer,
    PlanApprovalSerializer,
    PlanImportSerializer,
    PlanExportSerializer,
    ImportResultSerializer
)
from .services import PlanBusinessService, PlanProgressService, PlanStatisticsService
from .import_export_service import PlanImportExportService
from .approval_service import PlanApprovalService
from .query_optimization import QueryOptimizer, ComplexQueryOptimizer
from system_management.services.audit_service import audit_logger


class BusinessRegionViewSet(viewsets.ModelViewSet):
    """经营区域管理API"""
    
    queryset = BusinessRegion.objects.all()
    serializer_class = BusinessRegionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['code']

    def get_serializer_class(self):
        """根据操作类型选择序列化器"""
        if self.action == 'list':
            return BusinessRegionListSerializer
        return BusinessRegionSerializer

    @plan_permission_required('store_planning.region.view')
    def list(self, request, *args, **kwargs):
        """获取经营区域列表"""
        return super().list(request, *args, **kwargs)
    
    @plan_permission_required('store_planning.region.view')
    def retrieve(self, request, *args, **kwargs):
        """获取经营区域详情"""
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        """获取查询集"""
        queryset = BusinessRegion.objects.all()
        
        # 支持按启用状态筛选
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            if is_active.lower() in ['true', '1']:
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in ['false', '0']:
                queryset = queryset.filter(is_active=False)
        
        return queryset

    @plan_permission_required('store_planning.region.create')
    @audit_sensitive_operation('region_create', 'region')
    def create(self, request, *args, **kwargs):
        """创建经营区域"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 检查编码是否已存在
        code = serializer.validated_data.get('code')
        if BusinessRegion.objects.filter(code=code).exists():
            return Response(
                {'error': f'区域编码 {code} 已存在'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        
        # 记录审计日志
        region = serializer.instance
        audit_logger.log_business_region_create(
            request=request,
            region_id=region.id,
            details={
                'region_name': region.name,
                'region_code': region.code,
                'description': region.description,
                'is_active': region.is_active
            }
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

    @plan_permission_required('store_planning.region.update')
    @audit_sensitive_operation('region_update', 'region')
    def update(self, request, *args, **kwargs):
        """更新经营区域"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # 记录更新前的数据
        old_data = {
            'region_name': instance.name,
            'region_code': instance.code,
            'description': instance.description,
            'is_active': instance.is_active
        }
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # 检查编码是否与其他区域冲突
        code = serializer.validated_data.get('code')
        if code and BusinessRegion.objects.filter(code=code).exclude(id=instance.id).exists():
            return Response(
                {'error': f'区域编码 {code} 已存在'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_update(serializer)
        
        # 记录审计日志
        region = serializer.instance
        new_data = {
            'region_name': region.name,
            'region_code': region.code,
            'description': region.description,
            'is_active': region.is_active
        }
        
        audit_logger.log_business_region_update(
            request=request,
            region_id=region.id,
            details={
                'old_data': old_data,
                'new_data': new_data,
                'changed_fields': list(serializer.validated_data.keys())
            }
        )
        
        return Response(serializer.data)

    @plan_permission_required('store_planning.region.update')
    @audit_sensitive_operation('region_partial_update', 'region')
    def partial_update(self, request, *args, **kwargs):
        """部分更新经营区域"""
        return super().partial_update(request, *args, **kwargs)

    @plan_permission_required('store_planning.region.delete', require_confirmation=True)
    @audit_sensitive_operation('region_delete', 'region')
    def destroy(self, request, *args, **kwargs):
        """删除经营区域"""
        instance = self.get_object()
        
        # 记录删除前的数据
        region_data = {
            'region_name': instance.name,
            'region_code': instance.code,
            'description': instance.description,
            'is_active': instance.is_active
        }
        
        region_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        
        # 记录审计日志
        audit_logger.log_business_region_delete(
            request=request,
            region_id=region_id,
            details=region_data
        )
        
        return response

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.region.update')
    @audit_sensitive_operation('region_toggle_active', 'region')
    def toggle_active(self, request, pk=None):
        """切换启用状态"""
        region = self.get_object()
        old_status = region.is_active
        region.is_active = not region.is_active
        region.save()
        
        # 记录审计日志
        action = audit_logger.ACTION_ENABLE if region.is_active else audit_logger.ACTION_DISABLE
        audit_logger.log(
            request=request,
            action=action,
            target_type=audit_logger.TARGET_BUSINESS_REGION,
            target_id=region.id,
            details={
                'region_name': region.name,
                'region_code': region.code,
                'old_status': old_status,
                'new_status': region.is_active
            }
        )
        
        serializer = self.get_serializer(region)
        return Response({
            'message': f'区域 {region.name} 已{"启用" if region.is_active else "禁用"}',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.region.view')
    def active_list(self, request):
        """获取启用的区域列表"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = BusinessRegionListSerializer(queryset, many=True)
        return Response(serializer.data)


class StoreTypeViewSet(viewsets.ModelViewSet):
    """门店类型管理API"""
    
    queryset = StoreType.objects.all()
    serializer_class = StoreTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['code']

    def get_serializer_class(self):
        """根据操作类型选择序列化器"""
        if self.action == 'list':
            return StoreTypeListSerializer
        return StoreTypeSerializer

    def get_queryset(self):
        """获取查询集"""
        queryset = StoreType.objects.all()
        
        # 支持按启用状态筛选
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            if is_active.lower() in ['true', '1']:
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in ['false', '0']:
                queryset = queryset.filter(is_active=False)
        
        return queryset

    @plan_permission_required('store_planning.store_type.view')
    def list(self, request, *args, **kwargs):
        """获取门店类型列表"""
        return super().list(request, *args, **kwargs)
    
    @plan_permission_required('store_planning.store_type.view')
    def retrieve(self, request, *args, **kwargs):
        """获取门店类型详情"""
        return super().retrieve(request, *args, **kwargs)

    @plan_permission_required('store_planning.store_type.create')
    @audit_sensitive_operation('store_type_create', 'store_type')
    def create(self, request, *args, **kwargs):
        """创建门店类型"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 检查编码是否已存在
        code = serializer.validated_data.get('code')
        if StoreType.objects.filter(code=code).exists():
            return Response(
                {'error': f'门店类型编码 {code} 已存在'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        
        # 记录审计日志
        store_type = serializer.instance
        audit_logger.log_store_type_create(
            request=request,
            store_type_id=store_type.id,
            details={
                'type_name': store_type.name,
                'type_code': store_type.code,
                'description': store_type.description,
                'is_active': store_type.is_active
            }
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

    @plan_permission_required('store_planning.store_type.update')
    @audit_sensitive_operation('store_type_update', 'store_type')
    def update(self, request, *args, **kwargs):
        """更新门店类型"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # 记录更新前的数据
        old_data = {
            'type_name': instance.name,
            'type_code': instance.code,
            'description': instance.description,
            'is_active': instance.is_active
        }
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # 检查编码是否与其他类型冲突
        code = serializer.validated_data.get('code')
        if code and StoreType.objects.filter(code=code).exclude(id=instance.id).exists():
            return Response(
                {'error': f'门店类型编码 {code} 已存在'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_update(serializer)
        
        # 记录审计日志
        store_type = serializer.instance
        new_data = {
            'type_name': store_type.name,
            'type_code': store_type.code,
            'description': store_type.description,
            'is_active': store_type.is_active
        }
        
        audit_logger.log_store_type_update(
            request=request,
            store_type_id=store_type.id,
            details={
                'old_data': old_data,
                'new_data': new_data,
                'changed_fields': list(serializer.validated_data.keys())
            }
        )
        
        return Response(serializer.data)

    @plan_permission_required('store_planning.store_type.update')
    @audit_sensitive_operation('store_type_partial_update', 'store_type')
    def partial_update(self, request, *args, **kwargs):
        """部分更新门店类型"""
        return super().partial_update(request, *args, **kwargs)

    @plan_permission_required('store_planning.store_type.delete', require_confirmation=True)
    @audit_sensitive_operation('store_type_delete', 'store_type')
    def destroy(self, request, *args, **kwargs):
        """删除门店类型"""
        instance = self.get_object()
        
        # 记录删除前的数据
        store_type_data = {
            'type_name': instance.name,
            'type_code': instance.code,
            'description': instance.description,
            'is_active': instance.is_active
        }
        
        store_type_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        
        # 记录审计日志
        audit_logger.log_store_type_delete(
            request=request,
            store_type_id=store_type_id,
            details=store_type_data
        )
        
        return response

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.store_type.update')
    @audit_sensitive_operation('store_type_toggle_active', 'store_type')
    def toggle_active(self, request, pk=None):
        """切换启用状态"""
        store_type = self.get_object()
        old_status = store_type.is_active
        store_type.is_active = not store_type.is_active
        store_type.save()
        
        # 记录审计日志
        action = audit_logger.ACTION_ENABLE if store_type.is_active else audit_logger.ACTION_DISABLE
        audit_logger.log(
            request=request,
            action=action,
            target_type=audit_logger.TARGET_STORE_TYPE,
            target_id=store_type.id,
            details={
                'type_name': store_type.name,
                'type_code': store_type.code,
                'old_status': old_status,
                'new_status': store_type.is_active
            }
        )
        
        serializer = self.get_serializer(store_type)
        return Response({
            'message': f'门店类型 {store_type.name} 已{"启用" if store_type.is_active else "禁用"}',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.store_type.view')
    def active_list(self, request):
        """获取启用的门店类型列表"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = StoreTypeListSerializer(queryset, many=True)
        return Response(serializer.data)


class StorePlanPagination(PageNumberPagination):
    """开店计划分页器"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class StorePlanViewSet(viewsets.ModelViewSet):
    """开店计划管理API"""
    
    queryset = StorePlan.objects.all()
    serializer_class = StorePlanSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StorePlanPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['plan_type', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'start_date', 'end_date', 'created_at', 'total_target_count', 'completion_rate']
    ordering = ['-created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.business_service = PlanBusinessService()
        self.progress_service = PlanProgressService()
        self.statistics_service = PlanStatisticsService()
        self.approval_service = PlanApprovalService()

    def get_serializer_class(self):
        """根据操作类型选择序列化器"""
        if self.action == 'list':
            return StorePlanListSerializer
        elif self.action == 'create':
            return StorePlanCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StorePlanUpdateSerializer
        return StorePlanSerializer

    @plan_permission_required('store_planning.plan.view')
    def list(self, request, *args, **kwargs):
        """获取计划列表"""
        return super().list(request, *args, **kwargs)
    
    @plan_permission_required('store_planning.plan.view')
    def retrieve(self, request, *args, **kwargs):
        """获取计划详情"""
        instance = self.get_object()
        
        # 检查数据范围权限
        if not check_data_scope_permission(request.user, instance, 'view'):
            return Response(
                {'error': '权限不足', 'message': '您没有权限查看此计划'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        """获取查询集，实现基于角色的数据访问控制"""
        # 使用优化后的查询集
        queryset = QueryOptimizer.get_optimized_plan_list_queryset()
        
        # 基于角色的数据访问控制
        user = self.request.user
        if not user.is_superuser and not user.has_permission('store_planning.system.config'):
            # 非超级管理员和系统管理员需要进行数据范围控制
            if user.has_permission('store_planning.regional_manager'):
                # 区域管理员只能查看自己负责区域的计划
                # 这里可以扩展为从用户配置中获取管理的区域
                # 目前简化处理，允许查看所有计划但会在详细权限检查中限制操作
                pass
            elif not user.has_permission('store_planning.plan.view'):
                # 没有查看权限的用户只能看到自己创建的计划
                queryset = queryset.filter(created_by=user)
        
        # 支持按年份筛选
        year = self.request.query_params.get('year', None)
        if year:
            try:
                year = int(year)
                queryset = queryset.filter(start_date__year=year)
            except ValueError:
                pass
        
        # 支持按区域筛选
        region_id = self.request.query_params.get('region_id', None)
        if region_id:
            try:
                region_id = int(region_id)
                queryset = queryset.filter(regional_plans__region_id=region_id).distinct()
            except ValueError:
                pass
        
        # 支持按门店类型筛选
        store_type_id = self.request.query_params.get('store_type_id', None)
        if store_type_id:
            try:
                store_type_id = int(store_type_id)
                queryset = queryset.filter(regional_plans__store_type_id=store_type_id).distinct()
            except ValueError:
                pass
        
        # 支持按创建人筛选
        created_by_id = self.request.query_params.get('created_by_id', None)
        if created_by_id:
            try:
                created_by_id = int(created_by_id)
                queryset = queryset.filter(created_by_id=created_by_id)
            except ValueError:
                pass
        
        return queryset

    @plan_permission_required('store_planning.plan.create')
    @audit_sensitive_operation('plan_create', 'plan')
    def create(self, request, *args, **kwargs):
        """创建开店计划"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # 设置创建人
            serializer.context['request'] = request
            plan = serializer.save(created_by=request.user)
            
            # 记录审计日志
            regional_plans_data = []
            for regional_plan in plan.regional_plans.all():
                regional_plans_data.append({
                    'region_name': regional_plan.region.name,
                    'store_type_name': regional_plan.store_type.name,
                    'target_count': regional_plan.target_count,
                    'contribution_rate': float(regional_plan.contribution_rate) if regional_plan.contribution_rate else None,
                    'budget_amount': float(regional_plan.budget_amount)
                })
            
            audit_logger.log_store_plan_create(
                request=request,
                plan_id=plan.id,
                details={
                    'plan_name': plan.name,
                    'plan_type': plan.plan_type,
                    'start_date': plan.start_date.strftime('%Y-%m-%d'),
                    'end_date': plan.end_date.strftime('%Y-%m-%d'),
                    'description': plan.description,
                    'total_target_count': plan.total_target_count,
                    'total_budget_amount': float(plan.total_budget_amount),
                    'regional_plans': regional_plans_data
                }
            )
            
            # 返回详细数据
            response_serializer = StorePlanSerializer(plan)
            headers = self.get_success_headers(response_serializer.data)
            
            return Response(
                {
                    'message': '计划创建成功',
                    'data': response_serializer.data
                },
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @plan_permission_required('store_planning.plan.update')
    @audit_sensitive_operation('plan_update', 'plan')
    def update(self, request, *args, **kwargs):
        """更新开店计划"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # 检查数据范围权限
        if not check_data_scope_permission(request.user, instance, 'edit'):
            return Response(
                {'error': '权限不足', 'message': '您没有权限修改此计划'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 记录更新前的数据
        old_data = {
            'plan_name': instance.name,
            'plan_type': instance.plan_type,
            'status': instance.status,
            'start_date': instance.start_date.strftime('%Y-%m-%d'),
            'end_date': instance.end_date.strftime('%Y-%m-%d'),
            'description': instance.description,
            'total_target_count': instance.total_target_count,
            'total_budget_amount': float(instance.total_budget_amount)
        }
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            serializer.context['request'] = request
            plan = serializer.save()
            
            # 记录更新后的数据
            new_data = {
                'plan_name': plan.name,
                'plan_type': plan.plan_type,
                'status': plan.status,
                'start_date': plan.start_date.strftime('%Y-%m-%d'),
                'end_date': plan.end_date.strftime('%Y-%m-%d'),
                'description': plan.description,
                'total_target_count': plan.total_target_count,
                'total_budget_amount': float(plan.total_budget_amount)
            }
            
            # 记录审计日志
            audit_logger.log_store_plan_update(
                request=request,
                plan_id=plan.id,
                details={
                    'old_data': old_data,
                    'new_data': new_data,
                    'changed_fields': list(serializer.validated_data.keys())
                }
            )
            
            # 返回详细数据
            response_serializer = StorePlanSerializer(plan)
            
            return Response({
                'message': '计划更新成功',
                'data': response_serializer.data
            })
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @plan_permission_required('store_planning.plan.delete', require_confirmation=True)
    @audit_sensitive_operation('plan_delete', 'plan')
    def destroy(self, request, *args, **kwargs):
        """删除开店计划"""
        instance = self.get_object()
        
        # 检查数据范围权限
        if not check_data_scope_permission(request.user, instance, 'delete'):
            return Response(
                {'error': '权限不足', 'message': '您没有权限删除此计划'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 只有草稿状态的计划才能删除
        if instance.status != 'draft':
            return Response(
                {'error': '只有草稿状态的计划才能删除'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 记录删除前的数据
        plan_data = {
            'plan_name': instance.name,
            'plan_type': instance.plan_type,
            'status': instance.status,
            'start_date': instance.start_date.strftime('%Y-%m-%d'),
            'end_date': instance.end_date.strftime('%Y-%m-%d'),
            'description': instance.description,
            'total_target_count': instance.total_target_count,
            'total_budget_amount': float(instance.total_budget_amount)
        }
        
        plan_id = instance.id
        plan_name = instance.name
        self.perform_destroy(instance)
        
        # 记录审计日志
        audit_logger.log_store_plan_delete(
            request=request,
            plan_id=plan_id,
            details=plan_data
        )
        
        return Response({
            'message': f'计划 "{plan_name}" 删除成功'
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    @plan_permission_required('store_planning.plan.view')
    def statistics(self, request, pk=None):
        """获取计划统计数据"""
        plan = self.get_object()
        statistics = self.statistics_service.get_plan_statistics(plan)
        
        return Response({
            'message': '获取统计数据成功',
            'data': statistics
        })

    @action(detail=True, methods=['get'])
    @plan_permission_required('store_planning.plan.view')
    def execution_logs(self, request, pk=None):
        """获取计划执行日志"""
        plan = self.get_object()
        # 使用优化后的执行日志查询
        logs = QueryOptimizer.get_optimized_execution_logs_queryset(plan=plan)
        
        # 分页
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = PlanExecutionLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PlanExecutionLogSerializer(logs, many=True)
        return Response({
            'message': '获取执行日志成功',
            'data': serializer.data
        })

    @action(detail=True, methods=['get'])
    @plan_permission_required('store_planning.plan.view')
    def approvals(self, request, pk=None):
        """获取计划审批记录"""
        plan = self.get_object()
        # 使用优化后的审批记录查询
        approvals = QueryOptimizer.get_optimized_approval_queryset(plan=plan)
        
        serializer = PlanApprovalSerializer(approvals, many=True)
        return Response({
            'message': '获取审批记录成功',
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    @rate_limit_permission(max_requests=60, time_window=60)
    @plan_permission_required('store_planning.dashboard.view')
    def dashboard(self, request):
        """获取仪表板数据"""
        # 获取查询参数
        refresh = request.query_params.get('refresh', 'false').lower() == 'true'
        
        dashboard_data = self.statistics_service.get_dashboard_data(
            user=request.user,
            force_refresh=refresh
        )
        
        return Response({
            'message': '获取仪表板数据成功',
            'data': dashboard_data
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.dashboard.view')
    def dashboard_widgets(self, request):
        """获取仪表板小部件数据"""
        widget_type = request.query_params.get('widget', 'all')
        time_range = request.query_params.get('time_range', '30')
        
        try:
            time_range = int(time_range)
        except ValueError:
            time_range = 30
        
        widgets_data = self.statistics_service.get_dashboard_widgets(
            widget_type=widget_type,
            time_range=time_range,
            user=request.user
        )
        
        return Response({
            'message': '获取仪表板小部件数据成功',
            'data': widgets_data
        })

    @action(detail=False, methods=['get'])
    @rate_limit_permission(max_requests=120, time_window=60)
    @plan_permission_required('store_planning.dashboard.view')
    def realtime_metrics(self, request):
        """获取实时指标数据"""
        metrics_data = self.statistics_service.get_realtime_metrics(request.user)
        
        return Response({
            'message': '获取实时指标成功',
            'data': metrics_data
        })

    @action(detail=False, methods=['post'])
    @plan_permission_required('store_planning.system.config')
    def refresh_dashboard_cache(self, request):
        """刷新仪表板缓存"""
        # 只有管理员可以手动刷新缓存
        if not request.user.is_staff:
            return Response(
                {'error': '权限不足'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.statistics_service.refresh_dashboard_cache()
        
        return Response({
            'message': '仪表板缓存刷新成功'
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.plan.view')
    def summary(self, request):
        """获取计划汇总信息"""
        queryset = self.get_queryset()
        
        # 基础统计
        total_count = queryset.count()
        status_counts = {}
        for status_code, status_name in StorePlan.STATUS_CHOICES:
            status_counts[status_code] = queryset.filter(status=status_code).count()
        
        # 执行中的计划汇总
        executing_plans = queryset.filter(status='executing')
        executing_summary = {
            'count': executing_plans.count(),
            'total_target': sum(p.total_target_count for p in executing_plans),
            'total_completed': sum(p.total_completed_count for p in executing_plans)
        }
        
        if executing_summary['total_target'] > 0:
            executing_summary['completion_rate'] = round(
                (executing_summary['total_completed'] / executing_summary['total_target']) * 100, 2
            )
        else:
            executing_summary['completion_rate'] = 0
        
        return Response({
            'message': '获取汇总信息成功',
            'data': {
                'total_count': total_count,
                'status_counts': status_counts,
                'executing_summary': executing_summary
            }
        })

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.plan.publish', require_confirmation=True)
    @audit_sensitive_operation('plan_publish', 'plan')
    def publish(self, request, pk=None):
        """发布计划"""
        plan = self.get_object()
        old_status = plan.status
        
        try:
            updated_plan = self.business_service.publish_plan(plan, request.user)
            
            # 记录审计日志
            audit_logger.log_store_plan_publish(
                request=request,
                plan_id=updated_plan.id,
                details={
                    'plan_name': updated_plan.name,
                    'old_status': old_status,
                    'new_status': updated_plan.status,
                    'published_at': updated_plan.published_at.strftime('%Y-%m-%d %H:%M:%S') if updated_plan.published_at else None,
                    'total_target_count': updated_plan.total_target_count,
                    'total_budget_amount': float(updated_plan.total_budget_amount)
                }
            )
            
            serializer = StorePlanSerializer(updated_plan)
            
            return Response({
                'message': f'计划 "{plan.name}" 发布成功',
                'data': serializer.data
            })
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.plan.submit_approval')
    @audit_sensitive_operation('plan_submit_approval', 'plan')
    def submit_for_approval(self, request, pk=None):
        """提交计划审批"""
        plan = self.get_object()
        approval_type = request.data.get('approval_type')
        additional_data = request.data.get('additional_data', {})
        
        if not approval_type:
            return Response(
                {'error': '请提供审批类型'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            approval = self.approval_service.submit_for_approval(
                plan=plan,
                approval_type=approval_type,
                submitted_by=request.user,
                additional_data=additional_data
            )
            
            # 记录审计日志
            audit_logger.log_plan_approval_submit(
                request=request,
                approval_id=approval.id,
                details={
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'approval_type': approval_type,
                    'submitted_by': request.user.username,
                    'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'additional_data': additional_data
                }
            )
            
            return Response({
                'message': f'计划 "{plan.name}" 审批申请提交成功',
                'data': {
                    'approval_id': approval.id,
                    'approval_type': approval.approval_type,
                    'approval_type_display': approval.get_approval_type_display(),
                    'status': approval.status,
                    'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S')
                }
            })
            
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.plan.cancel', require_confirmation=True)
    @audit_sensitive_operation('plan_cancel', 'plan')
    def cancel(self, request, pk=None):
        """取消计划"""
        plan = self.get_object()
        old_status = plan.status
        cancel_reason = request.data.get('cancel_reason', '').strip()
        
        if not cancel_reason:
            return Response(
                {'error': '取消计划必须提供取消原因'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_plan = self.business_service.cancel_plan(
                plan, cancel_reason, request.user
            )
            
            # 记录审计日志
            audit_logger.log_store_plan_cancel(
                request=request,
                plan_id=updated_plan.id,
                details={
                    'plan_name': updated_plan.name,
                    'old_status': old_status,
                    'new_status': updated_plan.status,
                    'cancel_reason': cancel_reason,
                    'cancelled_at': updated_plan.cancelled_at.strftime('%Y-%m-%d %H:%M:%S') if updated_plan.cancelled_at else None,
                    'total_target_count': updated_plan.total_target_count,
                    'total_completed_count': updated_plan.total_completed_count
                }
            )
            
            serializer = StorePlanSerializer(updated_plan)
            
            return Response({
                'message': f'计划 "{plan.name}" 取消成功',
                'data': serializer.data
            })
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.plan.execute')
    @audit_sensitive_operation('plan_start_execution', 'plan')
    def start_execution(self, request, pk=None):
        """开始执行计划"""
        plan = self.get_object()
        
        try:
            updated_plan = self.business_service.start_execution(plan, request.user)
            serializer = StorePlanSerializer(updated_plan)
            
            return Response({
                'message': f'计划 "{plan.name}" 开始执行',
                'data': serializer.data
            })
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.plan.complete')
    @audit_sensitive_operation('plan_complete', 'plan')
    def complete(self, request, pk=None):
        """完成计划"""
        plan = self.get_object()
        
        try:
            updated_plan = self.business_service.complete_plan(plan, request.user)
            serializer = StorePlanSerializer(updated_plan)
            
            return Response({
                'message': f'计划 "{plan.name}" 已完成',
                'data': serializer.data
            })
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    @plan_permission_required('store_planning.plan.view')
    def status_transitions(self, request, pk=None):
        """获取可用的状态转换"""
        plan = self.get_object()
        current_status = plan.status
        
        # 定义状态转换规则
        valid_transitions = {
            'draft': [
                {'status': 'published', 'label': '发布', 'action': 'publish'},
                {'status': 'cancelled', 'label': '取消', 'action': 'cancel'}
            ],
            'published': [
                {'status': 'executing', 'label': '开始执行', 'action': 'start_execution'},
                {'status': 'cancelled', 'label': '取消', 'action': 'cancel'}
            ],
            'executing': [
                {'status': 'completed', 'label': '完成', 'action': 'complete'},
                {'status': 'cancelled', 'label': '取消', 'action': 'cancel'}
            ],
            'completed': [],
            'cancelled': []
        }
        
        available_transitions = valid_transitions.get(current_status, [])
        
        return Response({
            'message': '获取状态转换成功',
            'data': {
                'current_status': current_status,
                'current_status_display': plan.get_status_display(),
                'available_transitions': available_transitions
            }
        })

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.plan.update_progress')
    @audit_sensitive_operation('plan_record_store_opening', 'plan')
    def record_store_opening(self, request, pk=None):
        """记录门店开业（自动更新进度）"""
        plan = self.get_object()
        
        if plan.status != 'executing':
            return Response(
                {'error': '只有执行中的计划才能记录门店开业'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取必要参数
        regional_plan_id = request.data.get('regional_plan_id')
        store_id = request.data.get('store_id')
        
        if not regional_plan_id or not store_id:
            return Response(
                {'error': '请提供区域计划ID和门店ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            regional_plan_id = int(regional_plan_id)
            store_id = int(store_id)
            
            # 获取区域计划
            regional_plan = RegionalPlan.objects.get(
                id=regional_plan_id, plan=plan
            )
            
            # 记录门店开业
            updated_regional_plan = self.progress_service.record_store_opening(
                regional_plan, store_id, request.user
            )
            
            # 重新获取计划数据
            plan.refresh_from_db()
            serializer = StorePlanSerializer(plan)
            
            return Response({
                'message': '门店开业记录成功，计划进度已更新',
                'data': serializer.data
            })
        except (ValueError, RegionalPlan.DoesNotExist, DjangoValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    @plan_permission_required('store_planning.plan.view')
    def progress(self, request, pk=None):
        """获取计划执行进度详情"""
        plan = self.get_object()
        progress_data = self.progress_service.get_plan_progress(plan)
        
        return Response({
            'message': '获取计划进度成功',
            'data': progress_data
        })

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.plan.update_progress')
    @audit_sensitive_operation('plan_update_progress', 'plan')
    def update_progress(self, request, pk=None):
        """批量更新计划进度"""
        plan = self.get_object()
        
        if plan.status != 'executing':
            return Response(
                {'error': '只有执行中的计划才能更新进度'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        progress_updates = request.data.get('progress_updates', [])
        if not progress_updates:
            return Response(
                {'error': '请提供进度更新数据'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_plan = self.progress_service.batch_update_progress(
                plan, progress_updates, request.user
            )
            
            serializer = StorePlanSerializer(updated_plan)
            return Response({
                'message': '批量更新进度成功',
                'data': serializer.data
            })
        except (ValueError, DjangoValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.plan.view')
    def progress_summary(self, request):
        """获取所有计划的进度汇总"""
        progress_summary = self.progress_service.get_all_plans_progress_summary(request.user)
        
        return Response({
            'message': '获取进度汇总成功',
            'data': progress_summary
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.statistics.view')
    def statistics_analysis(self, request):
        """获取统计分析数据"""
        # 获取查询参数
        analysis_type = request.query_params.get('type', 'overview')  # overview, region, store_type, time_series
        time_range = request.query_params.get('time_range', '30')  # 天数
        region_id = request.query_params.get('region_id')
        store_type_id = request.query_params.get('store_type_id')
        
        try:
            time_range = int(time_range)
        except ValueError:
            time_range = 30
        
        analysis_data = self.statistics_service.get_analysis_data(
            analysis_type=analysis_type,
            time_range=time_range,
            region_id=region_id,
            store_type_id=store_type_id,
            user=request.user
        )
        
        return Response({
            'message': '获取统计分析数据成功',
            'data': analysis_data
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.statistics.view')
    def completion_rate_analysis(self, request):
        """获取目标完成率分析"""
        # 获取查询参数
        group_by = request.query_params.get('group_by', 'region')  # region, store_type, month
        year = request.query_params.get('year', timezone.now().year)
        
        try:
            year = int(year)
        except ValueError:
            year = timezone.now().year
        
        completion_analysis = self.statistics_service.get_completion_rate_analysis(
            group_by=group_by,
            year=year,
            user=request.user
        )
        
        return Response({
            'message': '获取完成率分析成功',
            'data': completion_analysis
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.statistics.view')
    def alerts_check(self, request):
        """获取预警检查结果"""
        alerts_data = self.statistics_service.check_plan_alerts(request.user)
        
        return Response({
            'message': '获取预警信息成功',
            'data': alerts_data
        })

    @action(detail=True, methods=['get'])
    @plan_permission_required('store_planning.statistics.view')
    def regional_statistics(self, request, pk=None):
        """获取计划的区域统计分析"""
        plan = self.get_object()
        regional_stats = self.statistics_service.get_regional_statistics(plan)
        
        return Response({
            'message': '获取区域统计成功',
            'data': regional_stats
        })

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.statistics.view')
    def performance_ranking(self, request):
        """获取计划执行绩效排名"""
        # 获取查询参数
        ranking_type = request.query_params.get('type', 'completion_rate')  # completion_rate, efficiency, budget_utilization
        time_period = request.query_params.get('period', 'current_year')  # current_year, last_quarter, last_month
        limit = request.query_params.get('limit', '10')
        
        try:
            limit = int(limit)
        except ValueError:
            limit = 10
        
        ranking_data = self.statistics_service.get_performance_ranking(
            ranking_type=ranking_type,
            time_period=time_period,
            limit=limit,
            user=request.user
        )
        
        return Response({
            'message': '获取绩效排名成功',
            'data': ranking_data
        })


class RegionalPlanViewSet(viewsets.ModelViewSet):
    """区域计划管理API"""
    
    queryset = RegionalPlan.objects.all()
    serializer_class = RegionalPlanSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'region', 'store_type']
    ordering_fields = ['target_count', 'completed_count', 'completion_rate', 'created_at']
    ordering = ['plan', 'region__code', 'store_type__code']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.progress_service = PlanProgressService()

    def get_queryset(self):
        """获取查询集"""
        # 使用优化后的区域计划查询
        queryset = QueryOptimizer.get_optimized_regional_plan_queryset()
        
        # 基于角色的数据访问控制
        user = self.request.user
        if not user.is_superuser and not user.has_permission('store_planning.system.config'):
            # 非超级管理员只能查看有权限的计划的区域计划
            if not user.has_permission('store_planning.regional_plan.view'):
                queryset = queryset.filter(plan__created_by=user)
        
        return queryset

    @plan_permission_required('store_planning.regional_plan.view')
    def list(self, request, *args, **kwargs):
        """获取区域计划列表"""
        return super().list(request, *args, **kwargs)
    
    @plan_permission_required('store_planning.regional_plan.view')
    def retrieve(self, request, *args, **kwargs):
        """获取区域计划详情"""
        return super().retrieve(request, *args, **kwargs)

    @plan_permission_required('store_planning.regional_plan.create')
    def create(self, request, *args, **kwargs):
        """创建区域计划"""
        return Response(
            {'error': '区域计划只能通过主计划创建'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @plan_permission_required('store_planning.regional_plan.update')
    @audit_sensitive_operation('regional_plan_update', 'regional_plan')
    def update(self, request, *args, **kwargs):
        """更新区域计划"""
        instance = self.get_object()
        
        # 检查主计划状态
        if instance.plan.status not in ['draft']:
            return Response(
                {'error': '只有草稿状态的计划才能修改区域计划'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().update(request, *args, **kwargs)

    @plan_permission_required('store_planning.regional_plan.delete', require_confirmation=True)
    @audit_sensitive_operation('regional_plan_delete', 'regional_plan')
    def destroy(self, request, *args, **kwargs):
        """删除区域计划"""
        instance = self.get_object()
        
        # 检查主计划状态
        if instance.plan.status not in ['draft']:
            return Response(
                {'error': '只有草稿状态的计划才能删除区域计划'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 检查是否是最后一个区域计划
        if instance.plan.regional_plans.count() <= 1:
            return Response(
                {'error': '计划至少需要保留一个区域计划'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.regional_plan.update_progress')
    @audit_sensitive_operation('regional_plan_update_progress', 'regional_plan')
    def update_progress(self, request, pk=None):
        """更新区域计划进度"""
        regional_plan = self.get_object()
        
        # 检查主计划状态
        if regional_plan.plan.status not in ['executing']:
            return Response(
                {'error': '只有执行中的计划才能更新进度'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_completed_count = request.data.get('completed_count')
        if new_completed_count is None:
            return Response(
                {'error': '请提供完成数量'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_completed_count = int(new_completed_count)
            updated_regional_plan = self.progress_service.update_progress(
                regional_plan, new_completed_count, request.user
            )
            
            serializer = self.get_serializer(updated_regional_plan)
            return Response({
                'message': '进度更新成功',
                'data': serializer.data
            })
        except (ValueError, DjangoValidationError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class PlanApprovalViewSet(viewsets.ModelViewSet):
    """计划审批管理API"""
    
    queryset = PlanApproval.objects.all()
    serializer_class = PlanApprovalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'approval_type', 'status']
    ordering_fields = ['submitted_at', 'approved_at']
    ordering = ['-submitted_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.approval_service = PlanApprovalService()

    def get_queryset(self):
        """获取查询集"""
        # 使用优化后的审批查询
        queryset = QueryOptimizer.get_optimized_approval_queryset()
        
        # 基于角色的数据访问控制
        user = self.request.user
        if not user.is_superuser and not user.has_permission('store_planning.system.config'):
            # 非超级管理员只能查看自己提交的或需要自己审批的申请
            if not user.has_permission('store_planning.approval.view_all'):
                queryset = queryset.filter(
                    Q(submitted_by=user) | Q(approved_by=user)
                )
        
        return queryset

    @plan_permission_required('store_planning.approval.view')
    def list(self, request, *args, **kwargs):
        """获取审批列表"""
        return super().list(request, *args, **kwargs)
    
    @plan_permission_required('store_planning.approval.view')
    def retrieve(self, request, *args, **kwargs):
        """获取审批详情"""
        return super().retrieve(request, *args, **kwargs)

    @plan_permission_required('store_planning.approval.create')
    @audit_sensitive_operation('approval_create', 'approval')
    def create(self, request, *args, **kwargs):
        """提交审批申请"""
        plan_id = request.data.get('plan_id')
        approval_type = request.data.get('approval_type')
        additional_data = request.data.get('additional_data', {})
        
        if not plan_id or not approval_type:
            return Response(
                {'error': '请提供计划ID和审批类型'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            plan = StorePlan.objects.get(id=plan_id)
            
            # 使用审批服务提交审批申请
            approval = self.approval_service.submit_for_approval(
                plan=plan,
                approval_type=approval_type,
                submitted_by=request.user,
                additional_data=additional_data
            )
            
            # 记录审计日志
            audit_logger.log_plan_approval_submit(
                request=request,
                approval_id=approval.id,
                details={
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'approval_type': approval_type,
                    'submitted_by': request.user.username,
                    'submitted_at': approval.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'additional_data': additional_data
                }
            )
            
            serializer = self.get_serializer(approval)
            return Response({
                'message': '审批申请提交成功',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except StorePlan.DoesNotExist:
            return Response(
                {'error': '计划不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.approval.approve', require_confirmation=True)
    @audit_sensitive_operation('approval_approve', 'approval')
    def approve(self, request, pk=None):
        """审批通过"""
        approval = self.get_object()
        old_status = approval.status
        approval_notes = request.data.get('approval_notes', '').strip()
        
        try:
            # 使用审批服务处理审批通过
            updated_approval = self.approval_service.approve_plan(
                approval=approval,
                approved_by=request.user,
                approval_notes=approval_notes
            )
            
            # 记录审计日志
            audit_logger.log_plan_approval_approve(
                request=request,
                approval_id=updated_approval.id,
                details={
                    'plan_id': updated_approval.plan.id,
                    'plan_name': updated_approval.plan.name,
                    'approval_type': updated_approval.approval_type,
                    'old_status': old_status,
                    'new_status': updated_approval.status,
                    'approved_by': request.user.username,
                    'approval_notes': approval_notes,
                    'approved_at': updated_approval.approved_at.strftime('%Y-%m-%d %H:%M:%S') if updated_approval.approved_at else None
                }
            )
            
            serializer = self.get_serializer(updated_approval)
            return Response({
                'message': '审批通过成功',
                'data': serializer.data
            })
            
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.approval.reject', require_confirmation=True)
    @audit_sensitive_operation('approval_reject', 'approval')
    def reject(self, request, pk=None):
        """审批拒绝"""
        approval = self.get_object()
        old_status = approval.status
        rejection_reason = request.data.get('rejection_reason', '').strip()
        
        try:
            # 使用审批服务处理审批拒绝
            updated_approval = self.approval_service.reject_plan(
                approval=approval,
                approved_by=request.user,
                rejection_reason=rejection_reason
            )
            
            # 记录审计日志
            audit_logger.log_plan_approval_reject(
                request=request,
                approval_id=updated_approval.id,
                details={
                    'plan_id': updated_approval.plan.id,
                    'plan_name': updated_approval.plan.name,
                    'approval_type': updated_approval.approval_type,
                    'old_status': old_status,
                    'new_status': updated_approval.status,
                    'rejected_by': request.user.username,
                    'rejection_reason': rejection_reason,
                    'approved_at': updated_approval.approved_at.strftime('%Y-%m-%d %H:%M:%S') if updated_approval.approved_at else None
                }
            )
            
            serializer = self.get_serializer(updated_approval)
            return Response({
                'message': '审批拒绝成功',
                'data': serializer.data
            })
            
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @plan_permission_required('store_planning.approval.cancel')
    @audit_sensitive_operation('approval_cancel', 'approval')
    def cancel_approval(self, request, pk=None):
        """取消审批申请"""
        approval = self.get_object()
        old_status = approval.status
        
        try:
            # 使用审批服务处理取消申请
            updated_approval = self.approval_service.cancel_approval(
                approval=approval,
                cancelled_by=request.user
            )
            
            # 记录审计日志
            audit_logger.log(
                request=request,
                action=audit_logger.ACTION_CANCEL,
                target_type=audit_logger.TARGET_PLAN_APPROVAL,
                target_id=updated_approval.id,
                details={
                    'plan_id': updated_approval.plan.id,
                    'plan_name': updated_approval.plan.name,
                    'approval_type': updated_approval.approval_type,
                    'old_status': old_status,
                    'new_status': updated_approval.status,
                    'cancelled_by': request.user.username
                }
            )
            
            serializer = self.get_serializer(updated_approval)
            return Response({
                'message': '审批申请取消成功',
                'data': serializer.data
            })
            
        except DjangoValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.approval.view')
    def pending_approvals(self, request):
        """获取待审批列表"""
        approval_type = request.query_params.get('approval_type')
        
        try:
            pending_list = self.approval_service.get_pending_approvals(
                user=request.user,
                approval_type=approval_type
            )
            
            return Response({
                'message': '获取待审批列表成功',
                'data': pending_list
            })
            
        except Exception as e:
            return Response(
                {'error': f'获取待审批列表失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.approval.view')
    def my_approvals(self, request):
        """获取我提交的审批申请"""
        status_param = request.query_params.get('status')
        
        try:
            my_approvals = self.approval_service.get_my_approvals(
                user=request.user,
                status=status_param
            )
            
            return Response({
                'message': '获取我的审批申请成功',
                'data': my_approvals
            })
            
        except Exception as e:
            return Response(
                {'error': f'获取审批申请失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def approval_status(self, request):
        """获取计划审批状态"""
        plan_id = request.query_params.get('plan_id')
        approval_type = request.query_params.get('approval_type')
        
        if not plan_id:
            return Response(
                {'error': '请提供计划ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            plan = StorePlan.objects.get(id=plan_id)
            status_data = self.approval_service.get_approval_status(
                plan=plan,
                approval_type=approval_type
            )
            
            return Response({
                'message': '获取审批状态成功',
                'data': status_data
            })
            
        except StorePlan.DoesNotExist:
            return Response(
                {'error': '计划不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'获取审批状态失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def timeout_check(self, request):
        """检查审批超时"""
        try:
            timeout_list = self.approval_service.check_approval_timeout()
            
            return Response({
                'message': '获取超时审批列表成功',
                'data': {
                    'timeout_count': len(timeout_list),
                    'timeout_approvals': timeout_list
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'检查审批超时失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.approval.view')
    def statistics(self, request):
        """获取审批统计数据"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # 解析日期参数
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': '开始日期格式错误，请使用YYYY-MM-DD格式'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': '结束日期格式错误，请使用YYYY-MM-DD格式'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            statistics = self.approval_service.get_approval_statistics(
                start_date=start_date,
                end_date=end_date
            )
            
            return Response({
                'message': '获取审批统计数据成功',
                'data': statistics
            })
            
        except Exception as e:
            return Response(
                {'error': f'获取审批统计数据失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    @batch_permission_required('store_planning.approval.approve', max_batch_size=50)
    @plan_permission_required('store_planning.approval.approve', require_confirmation=True)
    @audit_sensitive_operation('approval_batch_approve', 'approval')
    def batch_approve(self, request):
        """批量审批"""
        approval_ids = request.data.get('approval_ids', [])
        approval_notes = request.data.get('approval_notes', '').strip()
        
        if not approval_ids:
            return Response(
                {'error': '请提供审批ID列表'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        success_count = 0
        error_count = 0
        success_approval_ids = []
        
        for approval_id in approval_ids:
            try:
                approval = PlanApproval.objects.get(id=approval_id)
                updated_approval = self.approval_service.approve_plan(
                    approval=approval,
                    approved_by=request.user,
                    approval_notes=approval_notes
                )
                
                results.append({
                    'approval_id': approval_id,
                    'success': True,
                    'message': '审批通过成功'
                })
                success_count += 1
                success_approval_ids.append(approval_id)
                
            except PlanApproval.DoesNotExist:
                results.append({
                    'approval_id': approval_id,
                    'success': False,
                    'error': '审批记录不存在'
                })
                error_count += 1
                
            except Exception as e:
                results.append({
                    'approval_id': approval_id,
                    'success': False,
                    'error': str(e)
                })
                error_count += 1
        
        # 记录批量审批的审计日志
        audit_logger.log(
            request=request,
            action=audit_logger.ACTION_APPROVE,
            target_type=audit_logger.TARGET_PLAN_APPROVAL,
            target_id=0,  # 批量操作使用0作为ID
            details={
                'operation': 'batch_approve',
                'total_count': len(approval_ids),
                'success_count': success_count,
                'error_count': error_count,
                'approval_ids': approval_ids,
                'success_approval_ids': success_approval_ids,
                'approval_notes': approval_notes,
                'approved_by': request.user.username
            }
        )
        
        return Response({
            'message': f'批量审批完成，成功{success_count}个，失败{error_count}个',
            'data': {
                'success_count': success_count,
                'error_count': error_count,
                'results': results
            }
        })

    @action(detail=False, methods=['post'])
    @batch_permission_required('store_planning.approval.reject', max_batch_size=50)
    @plan_permission_required('store_planning.approval.reject', require_confirmation=True)
    @audit_sensitive_operation('approval_batch_reject', 'approval')
    def batch_reject(self, request):
        """批量拒绝"""
        approval_ids = request.data.get('approval_ids', [])
        rejection_reason = request.data.get('rejection_reason', '').strip()
        
        if not approval_ids:
            return Response(
                {'error': '请提供审批ID列表'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not rejection_reason:
            return Response(
                {'error': '批量拒绝必须提供拒绝原因'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        success_count = 0
        error_count = 0
        success_approval_ids = []
        
        for approval_id in approval_ids:
            try:
                approval = PlanApproval.objects.get(id=approval_id)
                updated_approval = self.approval_service.reject_plan(
                    approval=approval,
                    approved_by=request.user,
                    rejection_reason=rejection_reason
                )
                
                results.append({
                    'approval_id': approval_id,
                    'success': True,
                    'message': '审批拒绝成功'
                })
                success_count += 1
                success_approval_ids.append(approval_id)
                
            except PlanApproval.DoesNotExist:
                results.append({
                    'approval_id': approval_id,
                    'success': False,
                    'error': '审批记录不存在'
                })
                error_count += 1
                
            except Exception as e:
                results.append({
                    'approval_id': approval_id,
                    'success': False,
                    'error': str(e)
                })
                error_count += 1
        
        # 记录批量拒绝的审计日志
        audit_logger.log(
            request=request,
            action=audit_logger.ACTION_REJECT,
            target_type=audit_logger.TARGET_PLAN_APPROVAL,
            target_id=0,  # 批量操作使用0作为ID
            details={
                'operation': 'batch_reject',
                'total_count': len(approval_ids),
                'success_count': success_count,
                'error_count': error_count,
                'approval_ids': approval_ids,
                'success_approval_ids': success_approval_ids,
                'rejection_reason': rejection_reason,
                'rejected_by': request.user.username
            }
        )
        
        return Response({
            'message': f'批量拒绝完成，成功{success_count}个，失败{error_count}个',
            'data': {
                'success_count': success_count,
                'error_count': error_count,
                'results': results
            }
        })

    @action(detail=False, methods=['post'])
    def sync_external_results(self, request):
        """同步外部审批结果"""
        approval_ids = request.data.get('approval_ids', [])
        
        try:
            sync_result = self.approval_service.sync_external_approval_results(approval_ids)
            
            return Response({
                'message': sync_result['message'],
                'data': sync_result
            })
            
        except Exception as e:
            return Response(
                {'error': f'同步外部审批结果失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def external_callback(self, request):
        """处理外部审批系统回调"""
        external_approval_id = request.data.get('external_approval_id')
        callback_data = request.data.get('callback_data', {})
        
        if not external_approval_id:
            return Response(
                {'error': '请提供外部审批ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = self.approval_service.handle_external_approval_callback(
                external_approval_id=external_approval_id,
                callback_data=callback_data
            )
            
            if result['success']:
                return Response({
                    'message': result['message'],
                    'data': result
                })
            else:
                return Response(
                    {'error': result['message']},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'处理外部审批回调失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def external_system_status(self, request):
        """获取外部审批系统状态"""
        try:
            status_info = self.approval_service.get_external_system_status()
            
            return Response({
                'message': '获取外部系统状态成功',
                'data': status_info
            })
            
        except Exception as e:
            return Response(
                {'error': f'获取外部系统状态失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        """手动发送审批通知"""
        approval_id = request.data.get('approval_id')
        action = request.data.get('action')
        
        if not approval_id or not action:
            return Response(
                {'error': '请提供审批ID和通知动作'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            approval = PlanApproval.objects.get(id=approval_id)
            
            # 发送通知
            from .notification_service import ApprovalNotificationService
            notification_service = ApprovalNotificationService()
            
            if action == 'submitted':
                result = notification_service.send_approval_submitted_notification(approval)
            elif action == 'approved':
                result = notification_service.send_approval_approved_notification(approval)
            elif action == 'rejected':
                result = notification_service.send_approval_rejected_notification(approval)
            elif action == 'cancelled':
                result = notification_service.send_approval_cancelled_notification(approval)
            elif action == 'timeout':
                result = notification_service.send_approval_timeout_notification(approval)
            else:
                return Response(
                    {'error': f'不支持的通知动作: {action}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'message': '通知发送完成',
                'data': result
            })
            
        except PlanApproval.DoesNotExist:
            return Response(
                {'error': '审批记录不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'发送通知失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def check_timeout_notifications(self, request):
        """检查并发送超时通知"""
        try:
            from .notification_service import check_approval_timeout_and_notify
            
            # 执行超时检查任务
            result = check_approval_timeout_and_notify.delay()
            
            return Response({
                'message': '超时检查任务已启动',
                'data': {
                    'task_id': result.id,
                    'status': 'started'
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'启动超时检查任务失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def notification_config(self, request):
        """获取通知配置信息"""
        try:
            from .notification_service import ApprovalNotificationService
            
            notification_service = ApprovalNotificationService()
            
            config_info = {
                'enabled_channels': notification_service.enabled_channels,
                'notification_config': {
                    'email': {
                        'enabled': notification_service.notification_config.get('email', {}).get('enabled', False)
                    },
                    'wechat': {
                        'enabled': notification_service.notification_config.get('wechat', {}).get('enabled', False)
                    },
                    'sms': {
                        'enabled': notification_service.notification_config.get('sms', {}).get('enabled', False)
                    },
                    'webhook': {
                        'enabled': notification_service.notification_config.get('webhook', {}).get('enabled', False)
                    }
                },
                'approval_config': notification_service.approval_config
            }
            
            return Response({
                'message': '获取通知配置成功',
                'data': config_info
            })
            
        except Exception as e:
            return Response(
                {'error': f'获取通知配置失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PlanImportExportViewSet(viewsets.GenericViewSet):
    """计划导入导出API"""
    
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.import_export_service = PlanImportExportService()
    
    @action(detail=False, methods=['post'])
    @plan_permission_required('store_planning.import.create')
    @audit_sensitive_operation('plan_import', 'import')
    def import_excel(self, request):
        """Excel数据导入API"""
        serializer = PlanImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # 获取上传的文件
            uploaded_file = serializer.validated_data['file']
            file_name = uploaded_file.name
            file_size = uploaded_file.size
            file_content = uploaded_file.read()
            
            # 执行导入
            import_result = self.import_export_service.import_plans_from_excel(
                file_content, request.user
            )
            
            # 记录审计日志
            audit_logger.log_plan_data_import(
                request=request,
                details={
                    'file_name': file_name,
                    'file_size': file_size,
                    'success': import_result['success'],
                    'total_rows': import_result.get('total_rows', 0),
                    'success_count': import_result.get('success_count', 0),
                    'error_count': import_result.get('error_count', 0),
                    'created_plans': import_result.get('created_plans', []),
                    'errors': import_result.get('errors', [])[:5]  # 只记录前5个错误
                }
            )
            
            # 序列化结果
            result_serializer = ImportResultSerializer(import_result)
            
            # 根据导入结果返回不同的状态码
            status_code = status.HTTP_200_OK if import_result['success'] else status.HTTP_400_BAD_REQUEST
            
            return Response({
                'message': '数据导入完成' if import_result['success'] else '数据导入失败',
                'data': result_serializer.data
            }, status=status_code)
            
        except Exception as e:
            # 记录导入失败的审计日志
            audit_logger.log_plan_data_import(
                request=request,
                details={
                    'success': False,
                    'error': str(e)
                }
            )
            
            return Response({
                'error': f'导入过程中发生错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    @plan_permission_required('store_planning.export.create')
    def export_excel(self, request):
        """Excel数据导出API"""
        serializer = PlanExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # 获取导出参数
            export_params = serializer.validated_data
            
            # 执行导出
            excel_content = self.import_export_service.export_plans_to_excel(
                **export_params
            )
            
            # 生成文件名
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'开店计划导出_{timestamp}.xlsx'
            
            # 记录审计日志
            audit_logger.log_plan_data_export(
                request=request,
                details={
                    'file_name': filename,
                    'export_params': {
                        'plan_ids': export_params.get('plan_ids'),
                        'start_date': export_params.get('start_date').strftime('%Y-%m-%d') if export_params.get('start_date') else None,
                        'end_date': export_params.get('end_date').strftime('%Y-%m-%d') if export_params.get('end_date') else None,
                        'plan_type': export_params.get('plan_type'),
                        'status': export_params.get('status'),
                        'include_regional_plans': export_params.get('include_regional_plans', True)
                    },
                    'file_size': len(excel_content)
                }
            )
            
            # 返回Excel文件
            response = HttpResponse(
                excel_content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            # 记录导出失败的审计日志
            audit_logger.log_plan_data_export(
                request=request,
                details={
                    'success': False,
                    'error': str(e)
                }
            )
            
            return Response({
                'error': f'导出过程中发生错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    @plan_permission_required('store_planning.import.view')
    def download_template(self, request):
        """下载导入模板API"""
        try:
            # 获取模板参数
            template_type = request.query_params.get('type', 'standard')
            include_sample = request.query_params.get('include_sample', 'true').lower() == 'true'
            
            # 生成模板文件
            if template_type in ['standard', 'quarterly', 'bulk', 'empty']:
                template_content = self.import_export_service.generate_advanced_import_template(
                    include_sample_data=include_sample,
                    template_type=template_type
                )
            else:
                # 默认使用标准模板
                template_content = self.import_export_service.generate_import_template()
            
            # 生成文件名
            template_names = {
                'standard': '标准导入模板',
                'quarterly': '季度计划导入模板',
                'bulk': '批量导入模板',
                'empty': '空白导入模板'
            }
            template_name = template_names.get(template_type, '导入模板')
            filename = f'开店计划{template_name}.xlsx'
            
            # 返回模板文件
            response = HttpResponse(
                template_content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            return Response({
                'error': f'生成模板时发生错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def template_types(self, request):
        """获取可用的模板类型"""
        try:
            template_types = self.import_export_service.get_template_types()
            
            return Response({
                'message': '获取模板类型成功',
                'data': template_types
            })
            
        except Exception as e:
            return Response({
                'error': f'获取模板类型时发生错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def export_statistics(self, request):
        """获取导出数据统计信息"""
        # 获取导出参数（与导出API相同的参数）
        plan_ids = request.query_params.getlist('plan_ids[]')
        if plan_ids:
            try:
                plan_ids = [int(pid) for pid in plan_ids]
            except ValueError:
                plan_ids = None
        
        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                start_date = None
        
        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                end_date = None
        
        plan_type = request.query_params.get('plan_type')
        status_param = request.query_params.get('status')
        
        try:
            # 获取统计信息
            statistics = self.import_export_service.get_export_statistics(
                plan_ids=plan_ids,
                start_date=start_date,
                end_date=end_date,
                plan_type=plan_type,
                status=status_param
            )
            
            return Response({
                'message': '获取导出统计信息成功',
                'data': statistics
            })
            
        except Exception as e:
            return Response({
                'error': f'获取统计信息时发生错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def import_guide(self, request):
        """获取导入指南"""
        guide_data = {
            'title': '开店计划Excel导入指南',
            'description': '请按照以下格式准备Excel文件进行批量导入',
            'required_columns': [
                {
                    'name': '计划名称',
                    'description': '开店计划的名称，必填',
                    'example': '2024年华东区开店计划'
                },
                {
                    'name': '计划类型',
                    'description': '计划类型，支持：年度计划、季度计划',
                    'example': '年度计划'
                },
                {
                    'name': '开始日期',
                    'description': '计划开始日期，格式：YYYY-MM-DD',
                    'example': '2024-01-01'
                },
                {
                    'name': '结束日期',
                    'description': '计划结束日期，格式：YYYY-MM-DD',
                    'example': '2024-12-31'
                },
                {
                    'name': '计划描述',
                    'description': '计划的详细描述，可选',
                    'example': '2024年华东区域开店计划'
                },
                {
                    'name': '经营区域',
                    'description': '经营区域名称，必填',
                    'example': '华东区'
                },
                {
                    'name': '区域编码',
                    'description': '经营区域编码，可选（与区域名称至少提供一个）',
                    'example': 'HD'
                },
                {
                    'name': '门店类型',
                    'description': '门店类型名称，必填',
                    'example': '直营店'
                },
                {
                    'name': '类型编码',
                    'description': '门店类型编码，可选（与类型名称至少提供一个）',
                    'example': 'ZY'
                },
                {
                    'name': '目标数量',
                    'description': '目标开店数量，必填，必须大于0',
                    'example': '50'
                },
                {
                    'name': '贡献率(%)',
                    'description': '贡献率百分比，可选，范围0-100',
                    'example': '30.5'
                },
                {
                    'name': '预算金额',
                    'description': '预算金额，可选，不能为负数',
                    'example': '5000000'
                }
            ],
            'business_rules': [
                '同一计划中，相同区域和门店类型的组合不能重复',
                '同一计划的总贡献率不能超过100%',
                '计划名称不能与现有计划重复',
                '结束日期必须晚于开始日期',
                '经营区域和门店类型必须在系统中已存在且启用'
            ],
            'tips': [
                '建议先下载导入模板，在模板基础上修改数据',
                '如果导入失败，请检查错误信息并修正数据后重新导入',
                '大批量数据建议分批导入，每次不超过1000行',
                '导入前请确保相关的经营区域和门店类型已在系统中创建'
            ]
        }
        
        return Response({
            'message': '获取导入指南成功',
            'data': guide_data
        })