"""
企业微信集成模块管理后台配置
"""
from django.contrib import admin
from .models import WechatDepartment, WechatUser, WechatSyncLog, WechatMessage


@admin.register(WechatDepartment)
class WechatDepartmentAdmin(admin.ModelAdmin):
    """企业微信部门管理"""
    list_display = ['wechat_dept_id', 'name', 'parent_id', 'sync_status', 'last_sync_at']
    list_filter = ['sync_status', 'last_sync_at']
    search_fields = ['name', 'wechat_dept_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WechatUser)
class WechatUserAdmin(admin.ModelAdmin):
    """企业微信用户管理"""
    list_display = ['wechat_user_id', 'name', 'mobile', 'position', 'status', 'sync_status']
    list_filter = ['status', 'sync_status', 'gender']
    search_fields = ['name', 'wechat_user_id', 'mobile']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WechatSyncLog)
class WechatSyncLogAdmin(admin.ModelAdmin):
    """企业微信同步日志管理"""
    list_display = ['sync_type', 'status', 'total_count', 'success_count', 'failed_count', 'started_at']
    list_filter = ['sync_type', 'status', 'started_at']
    readonly_fields = ['started_at', 'completed_at']


@admin.register(WechatMessage)
class WechatMessageAdmin(admin.ModelAdmin):
    """企业微信消息管理"""
    list_display = ['title', 'message_type', 'status', 'created_at', 'sent_at']
    list_filter = ['message_type', 'status', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'sent_at', 'wechat_msg_id']
