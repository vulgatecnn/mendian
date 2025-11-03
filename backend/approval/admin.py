from django.contrib import admin
from .models import ApprovalTemplate, ApprovalInstance, ApprovalNode


@admin.register(ApprovalTemplate)
class ApprovalTemplateAdmin(admin.ModelAdmin):
    """审批模板管理"""
    list_display = ['template_code', 'template_name', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['template_code', 'template_name']
    readonly_fields = ['created_by', 'created_at', 'updated_at']


@admin.register(ApprovalInstance)
class ApprovalInstanceAdmin(admin.ModelAdmin):
    """审批实例管理"""
    list_display = ['instance_no', 'title', 'template', 'status', 'initiator', 'initiated_at']
    list_filter = ['status', 'template', 'initiated_at']
    search_fields = ['instance_no', 'title']
    readonly_fields = ['instance_no', 'initiator', 'initiated_at', 'completed_at']


@admin.register(ApprovalNode)
class ApprovalNodeAdmin(admin.ModelAdmin):
    """审批节点管理"""
    list_display = ['instance', 'node_name', 'sequence', 'status', 'approved_by', 'approved_at']
    list_filter = ['status', 'node_type']
    search_fields = ['instance__title', 'node_name']
