from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """消息管理"""
    
    list_display = ['title', 'recipient', 'message_type', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'created_at']
    search_fields = ['title', 'content', 'recipient__real_name', 'recipient__username']
    readonly_fields = ['created_at', 'read_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('recipient', 'title', 'content', 'message_type')
        }),
        ('链接信息', {
            'fields': ('link',)
        }),
        ('状态信息', {
            'fields': ('is_read', 'read_at', 'created_at')
        }),
    )
    
    def has_add_permission(self, request):
        """禁止在管理后台添加消息"""
        return False
