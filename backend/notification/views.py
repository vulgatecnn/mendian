"""
消息通知视图
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Message
from .serializers import (
    MessageSerializer, 
    MessageListSerializer, 
    UnreadCountSerializer,
    MarkReadSerializer
)
from .services import NotificationService


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    消息中心视图集
    
    提供消息列表查询、详情查看、已读标记等功能
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['message_type', 'is_read']
    
    def get_queryset(self):
        """只返回当前用户的消息"""
        return Message.objects.filter(recipient=self.request.user)
    
    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return MessageListSerializer
        return MessageSerializer
    
    def list(self, request, *args, **kwargs):
        """
        获取消息列表
        
        支持按消息类型和已读状态过滤
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # 支持搜索
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """获取消息详情"""
        instance = self.get_object()
        
        # 自动标记为已读
        if not instance.is_read:
            instance.mark_as_read()
        
        serializer = self.get_serializer(instance)
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        获取未读消息数量
        """
        count = NotificationService.get_unread_count(request.user)
        serializer = UnreadCountSerializer({'unread_count': count})
        
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        标记单条消息为已读
        """
        success = NotificationService.mark_message_as_read(pk, request.user)
        
        if success:
            serializer = MarkReadSerializer({
                'success': True,
                'message': '标记成功'
            })
            return Response({
                'code': 0,
                'message': '标记成功',
                'data': serializer.data
            })
        else:
            return Response({
                'code': 1001,
                'message': '消息不存在或无权限',
                'data': None
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        标记所有消息为已读
        """
        count = NotificationService.mark_all_as_read(request.user)
        
        serializer = MarkReadSerializer({
            'success': True,
            'message': f'成功标记 {count} 条消息为已读'
        })
        
        return Response({
            'code': 0,
            'message': '操作成功',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        获取最近的消息（用于首页显示）
        """
        queryset = self.get_queryset()[:5]  # 只取最近5条
        serializer = MessageListSerializer(queryset, many=True)
        
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': serializer.data
        })
