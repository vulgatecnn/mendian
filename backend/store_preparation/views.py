"""
开店筹备管理模块视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone

from common.permissions import DataPermissionMixin
from .models import ConstructionOrder, Milestone, DeliveryChecklist
from .serializers import (
    ConstructionOrderSerializer,
    ConstructionOrderListSerializer,
    MilestoneSerializer,
    MilestoneListSerializer,
    AcceptanceSerializer,
    RectificationSerializer,
    DesignFileUploadSerializer
)


class ConstructionOrderViewSet(DataPermissionMixin, viewsets.ModelViewSet):
    """工程单视图集"""
    
    queryset = ConstructionOrder.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'acceptance_result', 'supplier']
    search_fields = ['order_no', 'store_name']
    ordering_fields = ['created_at', 'construction_start_date', 'construction_end_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据操作返回不同的序列化器"""
        if self.action == 'list':
            return ConstructionOrderListSerializer
        return ConstructionOrderSerializer
    
    def get_queryset(self):
        """获取查询集"""
        queryset = super().get_queryset()
        
        # 预加载关联数据
        queryset = queryset.select_related(
            'follow_up_record',
            'follow_up_record__location',
            'supplier',
            'created_by'
        ).prefetch_related('milestones')
        
        return queryset
    
    def perform_create(self, serializer):
        """创建工程单时设置创建人"""
        serializer.save(created_by=self.request.user)
    
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
    
    @action(detail=True, methods=['post'], url_path='milestones')
    def add_milestone(self, request, pk=None):
        """
        添加里程碑
        
        POST /api/preparation/construction/{id}/milestones/
        """
        construction_order = self.get_object()
        
        serializer = MilestoneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(construction_order=construction_order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'], url_path='milestones/(?P<milestone_id>[^/.]+)')
    def update_milestone(self, request, pk=None, milestone_id=None):
        """
        更新里程碑
        
        PUT /api/preparation/construction/{id}/milestones/{milestone_id}/
        """
        construction_order = self.get_object()
        
        try:
            milestone = construction_order.milestones.get(id=milestone_id)
        except Milestone.DoesNotExist:
            return Response(
                {'detail': '里程碑不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = MilestoneSerializer(milestone, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def acceptance(self, request, pk=None):
        """
        执行验收操作
        
        POST /api/preparation/construction/{id}/acceptance/
        
        请求体：
        {
            "acceptance_date": "2023-11-30",
            "acceptance_result": "passed",
            "acceptance_notes": "验收通过",
            "rectification_items": []
        }
        """
        construction_order = self.get_object()
        
        serializer = AcceptanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 更新工程单验收信息
        construction_order.acceptance_date = serializer.validated_data['acceptance_date']
        construction_order.acceptance_result = serializer.validated_data['acceptance_result']
        construction_order.acceptance_notes = serializer.validated_data.get('acceptance_notes', '')
        construction_order.rectification_items = serializer.validated_data.get('rectification_items', [])
        
        # 根据验收结果更新状态
        if construction_order.acceptance_result == ConstructionOrder.ACCEPTANCE_PASSED:
            construction_order.status = ConstructionOrder.STATUS_COMPLETED
            construction_order.actual_end_date = serializer.validated_data['acceptance_date']
        elif construction_order.acceptance_result == ConstructionOrder.ACCEPTANCE_FAILED:
            construction_order.status = ConstructionOrder.STATUS_RECTIFICATION
        
        construction_order.save()
        
        return Response({
            'message': '验收操作成功',
            'data': ConstructionOrderSerializer(construction_order).data
        })
    
    @action(detail=True, methods=['post'])
    def rectification(self, request, pk=None):
        """
        标记整改项
        
        POST /api/preparation/construction/{id}/rectification/
        
        请求体：
        {
            "rectification_items": [
                {
                    "description": "墙面需要重新粉刷",
                    "status": "pending",
                    "deadline": "2023-12-10",
                    "responsible_person": "张三"
                }
            ]
        }
        """
        construction_order = self.get_object()
        
        serializer = RectificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 更新整改项
        construction_order.rectification_items = serializer.validated_data['rectification_items']
        construction_order.status = ConstructionOrder.STATUS_RECTIFICATION
        construction_order.save()
        
        return Response({
            'message': '整改项标记成功',
            'data': ConstructionOrderSerializer(construction_order).data
        })
    
    @action(detail=True, methods=['post'], url_path='upload-design')
    def upload_design(self, request, pk=None):
        """
        上传设计图纸
        
        POST /api/preparation/construction/{id}/upload-design/
        
        请求体：
        {
            "file_name": "设计图纸.pdf",
            "file_url": "https://example.com/files/design.pdf",
            "file_size": 1024000,
            "file_type": "application/pdf"
        }
        """
        construction_order = self.get_object()
        
        serializer = DesignFileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 添加上传时间
        file_info = serializer.validated_data
        file_info['upload_time'] = timezone.now().isoformat()
        
        # 添加到设计图纸列表
        if not construction_order.design_files:
            construction_order.design_files = []
        
        construction_order.design_files.append(file_info)
        construction_order.save()
        
        return Response({
            'message': '设计图纸上传成功',
            'data': ConstructionOrderSerializer(construction_order).data
        })


class MilestoneViewSet(viewsets.ModelViewSet):
    """里程碑视图集"""
    
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['construction_order', 'status', 'reminder_sent']
    ordering_fields = ['planned_date', 'created_at']
    ordering = ['planned_date']
    
    def get_queryset(self):
        """获取查询集"""
        queryset = super().get_queryset()
        
        # 预加载关联数据
        queryset = queryset.select_related('construction_order')
        
        return queryset



class DeliveryChecklistViewSet(DataPermissionMixin, viewsets.ModelViewSet):
    """交付清单视图集"""
    
    queryset = DeliveryChecklist.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'construction_order']
    search_fields = ['checklist_no', 'store_name']
    ordering_fields = ['created_at', 'delivery_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据操作返回不同的序列化器"""
        if self.action == 'list':
            from .serializers import DeliveryChecklistListSerializer
            return DeliveryChecklistListSerializer
        from .serializers import DeliveryChecklistSerializer
        return DeliveryChecklistSerializer
    
    def get_queryset(self):
        """获取查询集"""
        queryset = super().get_queryset()
        
        # 预加载关联数据
        queryset = queryset.select_related(
            'construction_order',
            'created_by'
        )
        
        return queryset
    
    def perform_create(self, serializer):
        """创建交付清单时设置创建人"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def upload(self, request, pk=None):
        """
        上传交付文档
        
        POST /api/preparation/delivery/{id}/upload/
        
        请求体：
        {
            "document_name": "营业执照",
            "document_url": "https://example.com/files/license.pdf",
            "document_type": "application/pdf",
            "file_size": 1024000,
            "description": "门店营业执照"
        }
        """
        from .serializers import DocumentUploadSerializer
        
        delivery_checklist = self.get_object()
        
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # 添加上传时间
        document_info = serializer.validated_data
        document_info['upload_time'] = timezone.now().isoformat()
        
        # 添加到文档列表
        if not delivery_checklist.documents:
            delivery_checklist.documents = []
        
        delivery_checklist.documents.append(document_info)
        delivery_checklist.save()
        
        from .serializers import DeliveryChecklistSerializer
        return Response({
            'message': '文档上传成功',
            'data': DeliveryChecklistSerializer(delivery_checklist).data
        })
    
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_delivery(self, request, pk=None):
        """
        完成交付
        
        POST /api/preparation/delivery/{id}/complete/
        
        请求体：
        {
            "delivery_date": "2023-12-01"
        }
        """
        delivery_checklist = self.get_object()
        
        delivery_date = request.data.get('delivery_date')
        if not delivery_date:
            return Response(
                {'delivery_date': '交付日期不能为空'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 更新状态为已完成
        delivery_checklist.status = DeliveryChecklist.STATUS_COMPLETED
        delivery_checklist.delivery_date = delivery_date
        delivery_checklist.save()
        
        from .serializers import DeliveryChecklistSerializer
        return Response({
            'message': '交付完成',
            'data': DeliveryChecklistSerializer(delivery_checklist).data
        })
