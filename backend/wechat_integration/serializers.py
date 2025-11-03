"""
企业微信集成模块序列化器
"""
from rest_framework import serializers
from .models import WechatDepartment, WechatUser, WechatSyncLog, WechatMessage


class WechatDepartmentSerializer(serializers.ModelSerializer):
    """企业微信部门序列化器"""
    local_department_name = serializers.CharField(
        source='local_department.name', 
        read_only=True
    )
    
    class Meta:
        model = WechatDepartment
        fields = [
            'id', 'wechat_dept_id', 'name', 'parent_id', 'order',
            'sync_status', 'local_department', 'local_department_name',
            'last_sync_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WechatUserSerializer(serializers.ModelSerializer):
    """企业微信用户序列化器"""
    local_user_name = serializers.CharField(
        source='local_user.get_full_name', 
        read_only=True
    )
    
    class Meta:
        model = WechatUser
        fields = [
            'id', 'wechat_user_id', 'name', 'mobile', 'department_ids',
            'position', 'gender', 'email', 'avatar', 'status',
            'sync_status', 'local_user', 'local_user_name',
            'last_sync_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WechatSyncLogSerializer(serializers.ModelSerializer):
    """企业微信同步日志序列化器"""
    triggered_by_name = serializers.CharField(
        source='triggered_by.get_full_name', 
        read_only=True
    )
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = WechatSyncLog
        fields = [
            'id', 'sync_type', 'status', 'total_count', 'success_count',
            'failed_count', 'error_message', 'details', 'started_at',
            'completed_at', 'triggered_by', 'triggered_by_name', 'duration'
        ]
        read_only_fields = ['id', 'started_at', 'completed_at']
    
    def get_duration(self, obj):
        """计算同步耗时（秒）"""
        if obj.completed_at and obj.started_at:
            delta = obj.completed_at - obj.started_at
            return int(delta.total_seconds())
        return None


class WechatMessageSerializer(serializers.ModelSerializer):
    """企业微信消息序列化器"""
    
    class Meta:
        model = WechatMessage
        fields = [
            'id', 'message_type', 'to_users', 'to_departments', 'to_tags',
            'title', 'content', 'url', 'status', 'wechat_msg_id',
            'error_message', 'business_type', 'business_id',
            'created_at', 'sent_at'
        ]
        read_only_fields = ['id', 'wechat_msg_id', 'created_at', 'sent_at']


class SyncRequestSerializer(serializers.Serializer):
    """同步请求序列化器"""
    sync_type = serializers.ChoiceField(
        choices=['department', 'user', 'full'],
        help_text='同步类型：department-部门，user-用户，full-全量'
    )


class MessageSendSerializer(serializers.Serializer):
    """消息发送序列化器"""
    message_type = serializers.ChoiceField(
        choices=['text', 'textcard'],
        help_text='消息类型：text-文本消息，textcard-文本卡片'
    )
    content = serializers.CharField(
        max_length=2048,
        help_text='消息内容'
    )
    title = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text='消息标题（文本卡片消息必填）'
    )
    url = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text='跳转链接（文本卡片消息必填）'
    )
    to_users = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        help_text='接收用户ID列表（企业微信用户ID）'
    )
    to_departments = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        help_text='接收部门ID列表（企业微信部门ID）'
    )
    to_tags = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        help_text='接收标签ID列表'
    )
    business_type = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text='业务类型'
    )
    business_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='业务ID'
    )
    
    def validate(self, attrs):
        """验证消息数据"""
        message_type = attrs.get('message_type')
        title = attrs.get('title')
        url = attrs.get('url')
        to_users = attrs.get('to_users', [])
        to_departments = attrs.get('to_departments', [])
        to_tags = attrs.get('to_tags', [])
        
        # 文本卡片消息必须有标题和链接
        if message_type == 'textcard':
            if not title:
                raise serializers.ValidationError('文本卡片消息必须提供标题')
            if not url:
                raise serializers.ValidationError('文本卡片消息必须提供跳转链接')
        
        # 必须指定至少一个接收人
        if not any([to_users, to_departments, to_tags]):
            raise serializers.ValidationError('必须指定至少一个接收人（用户、部门或标签）')
        
        return attrs


class LocalUserMessageSerializer(serializers.Serializer):
    """本地用户消息发送序列化器"""
    message_type = serializers.ChoiceField(
        choices=['text', 'textcard'],
        help_text='消息类型：text-文本消息，textcard-文本卡片'
    )
    content = serializers.CharField(
        max_length=2048,
        help_text='消息内容'
    )
    title = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text='消息标题（文本卡片消息必填）'
    )
    url = serializers.URLField(
        required=False,
        allow_blank=True,
        help_text='跳转链接（文本卡片消息必填）'
    )
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='接收用户ID列表（本地用户ID）'
    )
    business_type = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        help_text='业务类型'
    )
    business_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='业务ID'
    )
    
    def validate(self, attrs):
        """验证消息数据"""
        message_type = attrs.get('message_type')
        title = attrs.get('title')
        url = attrs.get('url')
        
        # 文本卡片消息必须有标题和链接
        if message_type == 'textcard':
            if not title:
                raise serializers.ValidationError('文本卡片消息必须提供标题')
            if not url:
                raise serializers.ValidationError('文本卡片消息必须提供跳转链接')
        
        return attrs