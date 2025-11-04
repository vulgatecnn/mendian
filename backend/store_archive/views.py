"""
门店档案模块 - 视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from common.permissions import DataPermissionMixin, RegionPermissionMixin
from store_archive.models import StoreProfile
from store_archive.serializers import (
    StoreProfileListSerializer,
    StoreProfileDetailSerializer,
    StoreProfileCreateUpdateSerializer
)
from store_archive.services import StoreArchiveService


class StoreProfileFilter(filters.FilterSet):
    """门店档案过滤器"""
    
    store_name = filters.CharFilter(field_name='store_name', lookup_expr='icontains')
    store_code = filters.CharFilter(field_name='store_code', lookup_expr='icontains')
    province = filters.CharFilter(field_name='province')
    city = filters.CharFilter(field_name='city')
    district = filters.CharFilter(field_name='district')
    business_region = filters.NumberFilter(field_name='business_region')
    store_type = filters.ChoiceFilter(field_name='store_type', choices=StoreProfile.STORE_TYPE_CHOICES)
    operation_mode = filters.ChoiceFilter(field_name='operation_mode', choices=StoreProfile.OPERATION_MODE_CHOICES)
    status = filters.ChoiceFilter(field_name='status', choices=StoreProfile.STATUS_CHOICES)
    store_manager = filters.NumberFilter(field_name='store_manager')
    business_manager = filters.NumberFilter(field_name='business_manager')
    
    class Meta:
        model = StoreProfile
        fields = [
            'store_name',
            'store_code',
            'province',
            'city',
            'district',
            'business_region',
            'store_type',
            'operation_mode',
            'status',
            'store_manager',
            'business_manager',
        ]


@extend_schema_view(
    list=extend_schema(
        summary="获取门店档案列表",
        description="获取门店档案列表，支持多种条件过滤和分页",
        tags=["门店档案"]
    ),
    retrieve=extend_schema(
        summary="获取门店档案详情",
        description="根据ID获取门店档案详细信息",
        tags=["门店档案"]
    ),
    create=extend_schema(
        summary="创建门店档案",
        description="创建新的门店档案",
        tags=["门店档案"]
    ),
    update=extend_schema(
        summary="更新门店档案",
        description="更新门店档案信息",
        tags=["门店档案"]
    ),
    partial_update=extend_schema(
        summary="部分更新门店档案",
        description="部分更新门店档案信息",
        tags=["门店档案"]
    ),
    destroy=extend_schema(
        summary="删除门店档案",
        description="删除门店档案",
        tags=["门店档案"]
    ),
)
class StoreProfileViewSet(DataPermissionMixin, RegionPermissionMixin, viewsets.ModelViewSet):
    """门店档案视图集"""
    
    queryset = StoreProfile.objects.select_related(
        'business_region',
        'store_manager',
        'business_manager',
        'created_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_class = StoreProfileFilter
    search_fields = ['store_name', 'store_code', 'address']
    ordering_fields = ['created_at', 'updated_at', 'opening_date', 'store_code']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据操作返回不同的序列化器"""
        if self.action == 'list':
            return StoreProfileListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return StoreProfileCreateUpdateSerializer
        else:
            return StoreProfileDetailSerializer
    
    @extend_schema(
        summary="获取门店完整档案",
        description="获取门店完整档案信息，包括跟进历史、工程历史等关联数据",
        tags=["门店档案"],
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'success': {'type': 'boolean'},
                    'message': {'type': 'string'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'basic_info': {'type': 'object'},
                            'follow_up_info': {'type': 'object'},
                            'construction_info': {'type': 'object'},
                        }
                    }
                }
            }
        }
    )
    @action(detail=True, methods=['get'], url_path='full')
    def get_full_info(self, request, pk=None):
        """获取门店完整档案信息"""
        try:
            full_info = StoreArchiveService.get_store_full_info(pk)
            return Response({
                'success': True,
                'message': '获取成功',
                'data': full_info
            })
        except ValueError as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'获取失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def list(self, request, *args, **kwargs):
        """重写列表方法，返回统一格式"""
        response = super().list(request, *args, **kwargs)
        
        # 处理分页数据
        if isinstance(response.data, dict) and 'results' in response.data:
            # 分页数据
            return Response({
                'success': True,
                'message': '获取成功',
                'data': response.data['results'],
                'count': response.data.get('count'),
                'next': response.data.get('next'),
                'previous': response.data.get('previous')
            })
        else:
            # 非分页数据
            return Response({
                'success': True,
                'message': '获取成功',
                'data': response.data
            })
    
    def retrieve(self, request, *args, **kwargs):
        """重写详情方法，返回统一格式"""
        response = super().retrieve(request, *args, **kwargs)
        return Response({
            'success': True,
            'message': '获取成功',
            'data': response.data
        })
    
    def create(self, request, *args, **kwargs):
        """重写创建方法，返回统一格式"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'success': True,
            'message': '创建成功',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """重写更新方法，返回统一格式"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': '更新成功',
            'data': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """重写删除方法，返回统一格式"""
        instance = self.get_object()
        self.perform_destroy(instance)
        
        return Response({
            'success': True,
            'message': '删除成功',
            'data': None
        }, status=status.HTTP_200_OK)
