"""
审批中心视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone

from .models import (
    ApprovalTemplate, ApprovalInstance, ApprovalNode, 
    ApprovalFollow, ApprovalComment
)
from .serializers import (
    ApprovalTemplateSerializer, ApprovalInstanceSerializer, ApprovalInstanceCreateSerializer,
    ApprovalInstanceListSerializer, ApprovalProcessSerializer, ApprovalWithdrawSerializer,
    ApprovalCommentCreateSerializer, ApprovalCommentSerializer
)
from .services.flow_engine import ApprovalFlowEngine
from .services.utils import ApprovalPermissionChecker, ApprovalValidator
# from .services.export_service import ApprovalExportService  # 暂时注释，需要安装xlsxwriter
from system_management.models import User


class ApprovalInstanceViewSet(viewsets.ModelViewSet):
    """
    审批实例视图集
    
    注意：审批模块使用自定义的数据权限过滤逻辑，
    基于审批人、抄送人、关注人等多维度进行权限控制，
    不使用通用的 DataPermissionMixin
    """
    
    queryset = ApprovalInstance.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'create':
            return ApprovalInstanceCreateSerializer
        elif self.action in ['list', 'my_pending', 'my_processed', 'my_cc', 'all']:
            return ApprovalInstanceListSerializer
        else:
            return ApprovalInstanceSerializer
    
    def get_queryset(self):
        """获取查询集"""
        queryset = super().get_queryset()
        
        # 根据用户权限过滤数据
        user = self.request.user
        
        # 如果是超级管理员，可以查看所有审批
        if user.is_superuser:
            return queryset
        
        # 普通用户只能查看与自己相关的审批
        return queryset.filter(
            Q(initiator=user) |  # 自己发起的
            Q(nodes__approvers__user=user) |  # 自己需要审批的
            Q(nodes__cc_users__user=user) |  # 抄送给自己的
            Q(follows__user=user)  # 自己关注的
        ).distinct()
    
    def create(self, request, *args, **kwargs):
        """创建审批实例"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 设置发起人
        serializer.validated_data['initiator'] = request.user
        
        # 使用流程引擎创建审批
        flow_engine = ApprovalFlowEngine()
        
        template = serializer.validated_data['template']
        form_data = serializer.validated_data['form_data']
        business_type = serializer.validated_data['business_type']
        business_id = serializer.validated_data['business_id']
        title = serializer.validated_data.get('title')
        
        try:
            instance = flow_engine.initiate_approval(
                template=template,
                form_data=form_data,
                initiator=request.user,
                business_type=business_type,
                business_id=business_id,
                title=title
            )
            
            # 使用详细序列化器返回完整信息
            response_serializer = ApprovalInstanceSerializer(instance, context={'request': request})
            
            return Response({
                'success': True,
                'message': '审批发起成功',
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except DjangoValidationError as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='my-pending')
    def my_pending(self, request):
        """我的待办审批"""
        user = request.user
        
        # 查询待审批的实例
        queryset = ApprovalInstance.objects.filter(
            nodes__approvers__user=user,
            nodes__status='in_progress',
            status__in=['pending', 'in_progress']
        ).distinct().order_by('-initiated_at')
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            # 统一返回格式
            return Response({
                'success': True,
                'data': paginated_response.data['results'],
                'count': paginated_response.data['count'],
                'next': paginated_response.data['next'],
                'previous': paginated_response.data['previous']
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='my-processed')
    def my_processed(self, request):
        """我的已办审批"""
        user = request.user
        
        # 查询已处理的实例
        queryset = ApprovalInstance.objects.filter(
            nodes__approvers__user=user,
            nodes__approvers__is_processed=True
        ).distinct().order_by('-initiated_at')
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='my-cc')
    def my_cc(self, request):
        """我的抄送审批"""
        user = request.user
        
        # 查询抄送给我的实例
        queryset = ApprovalInstance.objects.filter(
            nodes__cc_users__user=user
        ).distinct().order_by('-initiated_at')
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='my-initiated')
    def my_initiated(self, request):
        """我发起的审批"""
        user = request.user
        
        # 查询我发起的实例
        queryset = ApprovalInstance.objects.filter(
            initiator=user
        ).order_by('-initiated_at')
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """全部审批（根据权限过滤）"""
        queryset = self.get_queryset().order_by('-initiated_at')
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            # 统一返回格式
            return Response({
                'success': True,
                'data': paginated_response.data['results'],
                'count': paginated_response.data['count'],
                'next': paginated_response.data['next'],
                'previous': paginated_response.data['previous']
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """审批通过"""
        instance = self.get_object()
        current_node = instance.current_node
        
        if not current_node:
            return Response({
                'success': False,
                'message': '审批已完成或不存在当前节点',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查用户是否有权限审批
        approver_users = [approver.user for approver in current_node.approvers.all()]
        if request.user not in approver_users:
            return Response({
                'success': False,
                'message': '您没有权限处理此审批节点',
                'data': None
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            flow_engine = ApprovalFlowEngine()
            comment = request.data.get('comment', '')
            flow_engine.approve(current_node, request.user, comment)
            
            # 重新获取实例数据
            instance.refresh_from_db()
            serializer = ApprovalInstanceSerializer(instance, context={'request': request})
            
            return Response({
                'success': True,
                'message': '审批通过',
                'data': serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """审批拒绝"""
        instance = self.get_object()
        current_node = instance.current_node
        
        if not current_node:
            return Response({
                'success': False,
                'message': '审批已完成或不存在当前节点',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查用户是否有权限审批
        approver_users = [approver.user for approver in current_node.approvers.all()]
        if request.user not in approver_users:
            return Response({
                'success': False,
                'message': '您没有权限处理此审批节点',
                'data': None
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            flow_engine = ApprovalFlowEngine()
            reason = request.data.get('reason', '')
            if not reason:
                return Response({
                    'success': False,
                    'message': '拒绝原因不能为空',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            flow_engine.reject(current_node, request.user, reason)
            
            # 重新获取实例数据
            instance.refresh_from_db()
            serializer = ApprovalInstanceSerializer(instance, context={'request': request})
            
            return Response({
                'success': True,
                'message': '审批已拒绝',
                'data': serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """撤销审批"""
        instance = self.get_object()
        
        # 只有发起人可以撤销
        if instance.initiator != request.user:
            return Response({
                'success': False,
                'message': '只有发起人可以撤销审批',
                'data': None
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 只有待审批或审批中状态可以撤销
        if instance.status not in ['pending', 'in_progress']:
            return Response({
                'success': False,
                'message': '只有待审批或审批中的申请可以撤销',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            flow_engine = ApprovalFlowEngine()
            reason = request.data.get('reason', '发起人撤销')
            flow_engine.withdraw(instance, request.user)
            
            # 重新获取实例数据
            instance.refresh_from_db()
            serializer = ApprovalInstanceSerializer(instance, context={'request': request})
            
            return Response({
                'success': True,
                'message': '审批已撤销',
                'data': serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        """转交审批"""
        instance = self.get_object()
        current_node = instance.current_node
        
        if not current_node:
            return Response({
                'success': False,
                'message': '审批已完成或不存在当前节点',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查用户是否有权限转交
        approver_users = [approver.user for approver in current_node.approvers.all()]
        if request.user not in approver_users:
            return Response({
                'success': False,
                'message': '您没有权限转交此审批节点',
                'data': None
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            target_user_id = request.data.get('target_user_id') or request.data.get('target_user')
            reason = request.data.get('reason', '') or request.data.get('comment', '')
            
            if not target_user_id:
                return Response({
                    'success': False,
                    'message': '请指定转交目标用户',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            target_user = User.objects.get(id=target_user_id)
            flow_engine = ApprovalFlowEngine()
            flow_engine.transfer(current_node, request.user, target_user, reason)
            
            # 重新获取实例数据
            instance.refresh_from_db()
            serializer = ApprovalInstanceSerializer(instance, context={'request': request})
            
            return Response({
                'success': True,
                'message': '审批已转交',
                'data': serializer.data
            })
            
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': '目标用户不存在',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """关注审批"""
        instance = self.get_object()
        
        try:
            # 检查是否已经关注
            follow, created = ApprovalFollow.objects.get_or_create(
                instance=instance,
                user=request.user,
                defaults={'followed_at': timezone.now()}
            )
            
            if created:
                message = '关注成功'
            else:
                message = '您已经关注了此审批'
            
            return Response({
                'success': True,
                'message': message,
                'data': {'is_following': True}
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def unfollow(self, request, pk=None):
        """取消关注审批"""
        instance = self.get_object()
        
        try:
            ApprovalFollow.objects.filter(
                instance=instance,
                user=request.user
            ).delete()
            
            return Response({
                'success': True,
                'message': '取消关注成功',
                'data': {'is_following': False}
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        """添加评论"""
        instance = self.get_object()
        
        try:
            serializer = ApprovalCommentCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            comment = serializer.save(
                instance=instance,
                user=request.user
            )
            
            response_serializer = ApprovalCommentSerializer(comment)
            
            return Response({
                'success': True,
                'message': '评论添加成功',
                'data': response_serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)


class ApprovalTemplateViewSet(viewsets.ModelViewSet):
    """审批模板视图集"""
    
    queryset = ApprovalTemplate.objects.all()
    serializer_class = ApprovalTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """获取查询集"""
        queryset = super().get_queryset()
        
        # 支持按状态过滤
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 支持按模板编码搜索
        template_code = self.request.query_params.get('template_code')
        if template_code:
            queryset = queryset.filter(template_code__icontains=template_code)
        
        # 支持按模板名称搜索
        template_name = self.request.query_params.get('template_name')
        if template_name:
            queryset = queryset.filter(template_name__icontains=template_name)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """创建模板时设置创建人"""
        serializer.save(created_by=self.request.user)