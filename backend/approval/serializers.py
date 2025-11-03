"""
审批中心序列化器
"""
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import (
    ApprovalTemplate, ApprovalInstance, ApprovalNode, 
    ApprovalNodeApprover, ApprovalNodeCC, ApprovalFollow, ApprovalComment
)
from .services.utils import ApprovalValidator
from system_management.serializers import UserSimpleSerializer


class ApprovalTemplateSerializer(serializers.ModelSerializer):
    """审批模板序列化器"""
    
    created_by_info = UserSimpleSerializer(source='created_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ApprovalTemplate
        fields = [
            'id', 'template_code', 'template_name', 'description',
            'form_schema', 'flow_config', 'status',
            'created_by', 'created_by_info', 'created_at', 'updated_at',
            'status_display'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def validate_template_code(self, value):
        """验证模板编码"""
        if self.instance and self.instance.template_code == value:
            return value
        
        if ApprovalTemplate.objects.filter(template_code=value).exists():
            raise serializers.ValidationError('模板编码已存在')
        
        return value
    
    def validate_form_schema(self, value):
        """验证表单配置"""
        try:
            ApprovalValidator.validate_form_schema(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        return value
    
    def validate_flow_config(self, value):
        """验证流程配置"""
        try:
            ApprovalValidator.validate_flow_config(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        return value


class ApprovalNodeApproverSerializer(serializers.ModelSerializer):
    """审批节点审批人序列化器"""
    
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    class Meta:
        model = ApprovalNodeApprover
        fields = ['id', 'user', 'user_info', 'is_processed', 'processed_at']


class ApprovalNodeCCSerializer(serializers.ModelSerializer):
    """审批节点抄送人序列化器"""
    
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    class Meta:
        model = ApprovalNodeCC
        fields = ['id', 'user', 'user_info', 'notified_at']


class ApprovalNodeSerializer(serializers.ModelSerializer):
    """审批节点序列化器"""
    
    approvers = ApprovalNodeApproverSerializer(many=True, read_only=True)
    cc_users = ApprovalNodeCCSerializer(many=True, read_only=True)
    approved_by_info = UserSimpleSerializer(source='approved_by', read_only=True)
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ApprovalNode
        fields = [
            'id', 'node_name', 'node_type', 'sequence', 'approver_config',
            'status', 'status_display', 'approval_result', 'approval_comment',
            'approved_by', 'approved_by_info', 'approved_at', 'created_at',
            'approvers', 'cc_users'
        ]
    
    def get_status_display(self, obj):
        """获取状态显示名称"""
        from .services.utils import ApprovalStatusHelper
        return ApprovalStatusHelper.get_node_status_display(obj.status)


class ApprovalCommentSerializer(serializers.ModelSerializer):
    """审批评论序列化器"""
    
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    class Meta:
        model = ApprovalComment
        fields = ['id', 'content', 'user', 'user_info', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ApprovalFollowSerializer(serializers.ModelSerializer):
    """审批关注序列化器"""
    
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    class Meta:
        model = ApprovalFollow
        fields = ['id', 'user', 'user_info', 'followed_at']
        read_only_fields = ['id', 'user', 'followed_at']


class ApprovalInstanceSerializer(serializers.ModelSerializer):
    """审批实例序列化器"""
    
    template_info = serializers.SerializerMethodField()
    initiator_info = UserSimpleSerializer(source='initiator', read_only=True)
    current_node_info = ApprovalNodeSerializer(source='current_node', read_only=True)
    nodes = ApprovalNodeSerializer(many=True, read_only=True)
    comments = ApprovalCommentSerializer(many=True, read_only=True)
    follows = ApprovalFollowSerializer(many=True, read_only=True)
    status_display = serializers.SerializerMethodField()
    is_followed = serializers.SerializerMethodField()
    
    class Meta:
        model = ApprovalInstance
        fields = [
            'id', 'instance_no', 'title', 'form_data', 'business_type', 'business_id',
            'status', 'status_display', 'final_result', 'initiated_at', 'completed_at',
            'template', 'template_info', 'initiator', 'initiator_info',
            'current_node', 'current_node_info', 'nodes', 'comments', 'follows',
            'is_followed'
        ]
        read_only_fields = [
            'id', 'instance_no', 'status', 'final_result', 'initiated_at', 'completed_at',
            'initiator', 'current_node'
        ]
    
    def get_template_info(self, obj):
        """获取模板信息"""
        return {
            'id': obj.template.id,
            'template_code': obj.template.template_code,
            'template_name': obj.template.template_name,
            'description': obj.template.description
        }
    
    def get_status_display(self, obj):
        """获取状态显示名称"""
        from .services.utils import ApprovalStatusHelper
        return ApprovalStatusHelper.get_status_display(obj.status)
    
    def get_is_followed(self, obj):
        """获取当前用户是否关注此审批"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.follows.filter(user=request.user).exists()
        return False


class ApprovalInstanceCreateSerializer(serializers.ModelSerializer):
    """审批实例创建序列化器"""
    
    class Meta:
        model = ApprovalInstance
        fields = ['template', 'title', 'form_data', 'business_type', 'business_id']
    
    def validate_template(self, value):
        """验证模板"""
        if value.status != 'active':
            raise serializers.ValidationError('审批模板已停用，无法发起审批')
        return value


class ApprovalProcessSerializer(serializers.Serializer):
    """审批处理序列化器"""
    
    ACTION_CHOICES = [
        ('approve', '通过'),
        ('reject', '拒绝'),
        ('transfer', '转交'),
        ('add_sign', '加签'),
    ]
    
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=500)
    target_users = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='转交或加签的目标用户ID列表'
    )
    
    def validate(self, attrs):
        """验证数据"""
        action = attrs.get('action')
        target_users = attrs.get('target_users', [])
        
        if action in ['transfer', 'add_sign'] and not target_users:
            raise serializers.ValidationError('转交或加签操作必须指定目标用户')
        
        if action == 'transfer' and len(target_users) != 1:
            raise serializers.ValidationError('转交操作只能指定一个目标用户')
        
        return attrs


class ApprovalWithdrawSerializer(serializers.Serializer):
    """审批撤销序列化器"""
    
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)


class ApprovalCommentCreateSerializer(serializers.ModelSerializer):
    """审批评论创建序列化器"""
    
    class Meta:
        model = ApprovalComment
        fields = ['content']
    
    def validate_content(self, value):
        """验证评论内容"""
        if not value.strip():
            raise serializers.ValidationError('评论内容不能为空')
        return value.strip()


class ApprovalInstanceListSerializer(serializers.ModelSerializer):
    """审批实例列表序列化器（简化版）"""
    
    template_name = serializers.CharField(source='template.template_name', read_only=True)
    initiator_name = serializers.SerializerMethodField()
    current_node_name = serializers.CharField(source='current_node.node_name', read_only=True)
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ApprovalInstance
        fields = [
            'id', 'instance_no', 'title', 'business_type', 'status', 'status_display',
            'initiated_at', 'completed_at', 'template_name', 'initiator_name',
            'current_node_name'
        ]
    
    def get_status_display(self, obj):
        """获取状态显示名称"""
        from .services.utils import ApprovalStatusHelper
        return ApprovalStatusHelper.get_status_display(obj.status)
    
    def get_initiator_name(self, obj):
        """获取发起人姓名"""
        return obj.initiator.get_full_name() or obj.initiator.username