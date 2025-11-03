"""
审批中心视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.core.exceptions import ValidationError as DjangoValidationError

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
    """审批实例视图集"""
    
    queryset = ApprovalInstance.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'create':
            return ApprovalInstanceCreateSerializer
        elif self.action == 'list':
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
    
    def perform_create(self, serializer):
        """创建审批实例"""
        # 设置发起人
        serializer.validated_data['initiator'] = self.request.user
        
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
                initiator=self.request.user,
                business_type=business_type,
                business_id=business_id,
                title=title
            )
            serializer.instance = instance
        except DjangoValidationError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


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