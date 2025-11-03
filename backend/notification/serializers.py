"""
消息通知序列化器
"""

from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    """消息序列化器"""
    
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    message_type_display = serializers.CharField(source='get_message_type_display', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'title', 'content', 'message_type', 'message_type_display',
            'link', 'is_read', 'read_at', 'created_at', 'recipient_name'
        ]
        read_only_fields = ['id', 'created_at', 'recipient_name', 'message_type_display']


class MessageListSerializer(serializers.ModelSerializer):
    """消息列表序列化器（简化版）"""
    
    message_type_display = serializers.CharField(source='get_message_type_display', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'title', 'message_type', 'message_type_display',
            'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'message_type_display']


class UnreadCountSerializer(serializers.Serializer):
    """未读消息数量序列化器"""
    
    unread_count = serializers.IntegerField(read_only=True)


class MarkReadSerializer(serializers.Serializer):
    """标记已读序列化器"""
    
    success = serializers.BooleanField(read_only=True)
    message = serializers.CharField(read_only=True)