"""
企业微信集成模块视图
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import WechatDepartment, WechatUser, WechatSyncLog, WechatMessage
from .serializers import (
    WechatDepartmentSerializer, WechatUserSerializer, WechatSyncLogSerializer,
    WechatMessageSerializer, SyncRequestSerializer, MessageSendSerializer,
    LocalUserMessageSerializer
)
from .services.wechat_sync_service import WechatSyncService
from .services.wechat_message_service import WechatMessageService
from .mixins import PermissionRequiredMixin


logger = logging.getLogger(__name__)


class WechatSyncViewSet(PermissionRequiredMixin, viewsets.GenericViewSet):
    """企业微信同步管理视图集"""
    permission_classes = [IsAuthenticated]
    required_permissions = {
        'sync_departments': 'wechat.sync.department',
        'sync_users': 'wechat.sync.user',
        'sync_all': 'wechat.sync.all',
        'sync_logs': 'wechat.sync.view',
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.sync_service = WechatSyncService()
    
    @extend_schema(
        summary="同步企业微信部门",
        description="从企业微信同步部门信息到本地数据库",
        responses={200: WechatSyncLogSerializer}
    )
    @action(detail=False, methods=['post'])
    def sync_departments(self, request):
        """同步企业微信部门"""
        try:
            sync_log = self.sync_service.sync_departments(triggered_by=request.user)
            serializer = WechatSyncLogSerializer(sync_log)
            
            return Response({
                'code': 0,
                'message': '部门同步完成',
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"部门同步失败: {e}")
            return Response({
                'code': 2001,
                'message': f'部门同步失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="同步企业微信用户",
        description="从企业微信同步用户信息到本地数据库",
        responses={200: WechatSyncLogSerializer}
    )
    @action(detail=False, methods=['post'])
    def sync_users(self, request):
        """同步企业微信用户"""
        try:
            sync_log = self.sync_service.sync_users(triggered_by=request.user)
            serializer = WechatSyncLogSerializer(sync_log)
            
            return Response({
                'code': 0,
                'message': '用户同步完成',
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"用户同步失败: {e}")
            return Response({
                'code': 2002,
                'message': f'用户同步失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="全量同步企业微信数据",
        description="同步企业微信的部门和用户信息到本地数据库",
        responses={200: WechatSyncLogSerializer}
    )
    @action(detail=False, methods=['post'])
    def sync_all(self, request):
        """全量同步企业微信数据"""
        try:
            sync_log = self.sync_service.sync_all(triggered_by=request.user)
            serializer = WechatSyncLogSerializer(sync_log)
            
            return Response({
                'code': 0,
                'message': '全量同步完成',
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"全量同步失败: {e}")
            return Response({
                'code': 2003,
                'message': f'全量同步失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="获取同步日志",
        description="获取企业微信同步日志列表",
        parameters=[
            OpenApiParameter('sync_type', str, description='同步类型过滤'),
            OpenApiParameter('status', str, description='同步状态过滤'),
        ],
        responses={200: WechatSyncLogSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def sync_logs(self, request):
        """获取同步日志"""
        queryset = WechatSyncLog.objects.all().order_by('-started_at')
        
        # 过滤参数
        sync_type = request.query_params.get('sync_type')
        if sync_type:
            queryset = queryset.filter(sync_type=sync_type)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = WechatSyncLogSerializer(page, many=True)
            return self.get_paginated_response({
                'code': 0,
                'message': '获取成功',
                'data': serializer.data
            })
        
        serializer = WechatSyncLogSerializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': serializer.data
        })


class WechatDepartmentViewSet(PermissionRequiredMixin, viewsets.ReadOnlyModelViewSet):
    """企业微信部门视图集"""
    queryset = WechatDepartment.objects.all().order_by('order', 'wechat_dept_id')
    serializer_class = WechatDepartmentSerializer
    permission_classes = [IsAuthenticated]
    required_permissions = {
        'list': 'wechat.department.view',
        'retrieve': 'wechat.department.view',
    }
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sync_status', 'parent_id']
    
    @method_decorator(cache_page(60 * 5))  # 缓存5分钟
    def list(self, request, *args, **kwargs):
        """获取企业微信部门列表"""
        response = super().list(request, *args, **kwargs)
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': response.data
        })


class WechatUserViewSet(PermissionRequiredMixin, viewsets.ReadOnlyModelViewSet):
    """企业微信用户视图集"""
    queryset = WechatUser.objects.all().order_by('name')
    serializer_class = WechatUserSerializer
    permission_classes = [IsAuthenticated]
    required_permissions = {
        'list': 'wechat.user.view',
        'retrieve': 'wechat.user.view',
    }
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sync_status', 'status']
    
    @method_decorator(cache_page(60 * 5))  # 缓存5分钟
    def list(self, request, *args, **kwargs):
        """获取企业微信用户列表"""
        response = super().list(request, *args, **kwargs)
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': response.data
        })


class WechatMessageViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    """企业微信消息视图集"""
    queryset = WechatMessage.objects.all().order_by('-created_at')
    serializer_class = WechatMessageSerializer
    permission_classes = [IsAuthenticated]
    required_permissions = {
        'list': 'wechat.message.view',
        'retrieve': 'wechat.message.view',
        'send_message': 'wechat.message.send',
        'send_to_users': 'wechat.message.send',
        'retry_failed': 'wechat.message.send',
    }
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['message_type', 'status', 'business_type']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.message_service = WechatMessageService()
    
    def list(self, request, *args, **kwargs):
        """获取企业微信消息列表"""
        response = super().list(request, *args, **kwargs)
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': response.data
        })
    
    @extend_schema(
        summary="发送企业微信消息",
        description="发送文本或文本卡片消息到企业微信",
        request=MessageSendSerializer,
        responses={200: WechatMessageSerializer}
    )
    @action(detail=False, methods=['post'])
    def send_message(self, request):
        """发送企业微信消息"""
        serializer = MessageSendSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'code': 1001,
                'message': '参数错误',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            
            if data['message_type'] == 'textcard':
                message = self.message_service.send_textcard_message(
                    title=data['title'],
                    description=data['content'],
                    url=data['url'],
                    to_users=data.get('to_users'),
                    to_departments=data.get('to_departments'),
                    to_tags=data.get('to_tags'),
                    business_type=data.get('business_type', ''),
                    business_id=data.get('business_id')
                )
            else:
                message = self.message_service.send_text_message(
                    content=data['content'],
                    to_users=data.get('to_users'),
                    to_departments=data.get('to_departments'),
                    to_tags=data.get('to_tags'),
                    business_type=data.get('business_type', ''),
                    business_id=data.get('business_id')
                )
            
            result_serializer = WechatMessageSerializer(message)
            return Response({
                'code': 0,
                'message': '消息发送完成',
                'data': result_serializer.data
            })
            
        except Exception as e:
            logger.error(f"发送企业微信消息失败: {e}")
            return Response({
                'code': 2004,
                'message': f'消息发送失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="向本地用户发送消息",
        description="向本地用户发送企业微信消息",
        request=LocalUserMessageSerializer,
        responses={200: WechatMessageSerializer}
    )
    @action(detail=False, methods=['post'])
    def send_to_users(self, request):
        """向本地用户发送消息"""
        serializer = LocalUserMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'code': 1001,
                'message': '参数错误',
                'data': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            
            message = self.message_service.send_to_local_users(
                message_type=data['message_type'],
                content=data['content'],
                local_user_ids=data['user_ids'],
                title=data.get('title', ''),
                url=data.get('url', ''),
                business_type=data.get('business_type', ''),
                business_id=data.get('business_id')
            )
            
            result_serializer = WechatMessageSerializer(message)
            return Response({
                'code': 0,
                'message': '消息发送完成',
                'data': result_serializer.data
            })
            
        except Exception as e:
            logger.error(f"向本地用户发送消息失败: {e}")
            return Response({
                'code': 2005,
                'message': f'消息发送失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="重试失败消息",
        description="重新发送状态为失败的企业微信消息",
        responses={200: dict}
    )
    @action(detail=False, methods=['post'])
    def retry_failed(self, request):
        """重试失败消息"""
        try:
            result = self.message_service.retry_failed_messages()
            
            return Response({
                'code': 0,
                'message': '重试完成',
                'data': {
                    'total_count': result['total_count'],
                    'success_count': result['success_count'],
                    'failed_count': result['failed_count']
                }
            })
            
        except Exception as e:
            logger.error(f"重试失败消息出错: {e}")
            return Response({
                'code': 2006,
                'message': f'重试失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)