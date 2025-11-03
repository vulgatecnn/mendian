"""
开店筹备管理模块 Admin 配置
"""
from django.contrib import admin
from .models import ConstructionOrder, Milestone, DeliveryChecklist


class MilestoneInline(admin.TabularInline):
    """里程碑内联编辑"""
    model = Milestone
    extra = 1
    fields = ['name', 'planned_date', 'actual_date', 'status', 'reminder_sent']


@admin.register(ConstructionOrder)
class ConstructionOrderAdmin(admin.ModelAdmin):
    """工程单管理"""
    list_display = [
        'order_no', 'store_name', 'status', 'supplier',
        'construction_start_date', 'construction_end_date',
        'acceptance_result', 'created_at'
    ]
    list_filter = ['status', 'acceptance_result', 'created_at']
    search_fields = ['order_no', 'store_name']
    readonly_fields = ['order_no', 'created_at', 'updated_at']
    inlines = [MilestoneInline]
    
    fieldsets = [
        ('基本信息', {
            'fields': ['order_no', 'store_name', 'follow_up_record']
        }),
        ('施工计划', {
            'fields': [
                'supplier', 'construction_start_date',
                'construction_end_date', 'actual_end_date'
            ]
        }),
        ('设计图纸', {
            'fields': ['design_files']
        }),
        ('验收信息', {
            'fields': [
                'status', 'acceptance_date', 'acceptance_result',
                'acceptance_notes', 'rectification_items'
            ]
        }),
        ('其他信息', {
            'fields': ['remark', 'created_by', 'created_at', 'updated_at']
        }),
    ]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    """里程碑管理"""
    list_display = [
        'construction_order', 'name', 'planned_date',
        'actual_date', 'status', 'reminder_sent'
    ]
    list_filter = ['status', 'reminder_sent', 'planned_date']
    search_fields = ['name', 'construction_order__order_no']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('基本信息', {
            'fields': ['construction_order', 'name', 'description']
        }),
        ('时间计划', {
            'fields': ['planned_date', 'actual_date', 'status']
        }),
        ('提醒设置', {
            'fields': ['reminder_sent']
        }),
        ('其他信息', {
            'fields': ['remark', 'created_at', 'updated_at']
        }),
    ]


@admin.register(DeliveryChecklist)
class DeliveryChecklistAdmin(admin.ModelAdmin):
    """交付清单管理"""
    list_display = [
        'checklist_no', 'store_name', 'construction_order',
        'status', 'delivery_date', 'created_at'
    ]
    list_filter = ['status', 'delivery_date', 'created_at']
    search_fields = ['checklist_no', 'store_name']
    readonly_fields = ['checklist_no', 'created_at', 'updated_at']
    
    fieldsets = [
        ('基本信息', {
            'fields': ['checklist_no', 'store_name', 'construction_order']
        }),
        ('交付内容', {
            'fields': ['delivery_items', 'documents']
        }),
        ('状态信息', {
            'fields': ['status', 'delivery_date']
        }),
        ('其他信息', {
            'fields': ['remark', 'created_by', 'created_at', 'updated_at']
        }),
    ]
