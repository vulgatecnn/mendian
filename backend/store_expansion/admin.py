"""
拓店管理模块管理后台配置
"""
from django.contrib import admin
from .models import CandidateLocation, FollowUpRecord, ProfitCalculation


@admin.register(CandidateLocation)
class CandidateLocationAdmin(admin.ModelAdmin):
    """候选点位管理"""
    list_display = ['name', 'city', 'district', 'area', 'rent', 'business_region', 'status', 'created_at']
    list_filter = ['status', 'business_region', 'province', 'city']
    search_fields = ['name', 'address', 'city', 'district']
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    
    fieldsets = [
        ('基本信息', {
            'fields': ['name', 'province', 'city', 'district', 'address']
        }),
        ('点位信息', {
            'fields': ['area', 'rent', 'business_region']
        }),
        ('状态信息', {
            'fields': ['status', 'remark']
        }),
        ('审计信息', {
            'fields': ['created_by', 'created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]
    
    def save_model(self, request, obj, form, change):
        """保存时自动设置创建人"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ProfitCalculation)
class ProfitCalculationAdmin(admin.ModelAdmin):
    """盈利测算管理"""
    list_display = ['id', 'total_investment', 'roi', 'payback_period', 'contribution_rate', 'calculated_at']
    readonly_fields = ['total_investment', 'roi', 'payback_period', 'contribution_rate', 'calculated_at']
    
    fieldsets = [
        ('投资成本', {
            'fields': ['rent_cost', 'decoration_cost', 'equipment_cost', 'other_cost']
        }),
        ('销售预测', {
            'fields': ['daily_sales', 'monthly_sales']
        }),
        ('计算结果', {
            'fields': ['total_investment', 'roi', 'payback_period', 'contribution_rate']
        }),
        ('公式配置', {
            'fields': ['formula_version', 'calculation_params'],
            'classes': ['collapse']
        }),
        ('时间信息', {
            'fields': ['calculated_at'],
            'classes': ['collapse']
        }),
    ]


@admin.register(FollowUpRecord)
class FollowUpRecordAdmin(admin.ModelAdmin):
    """铺位跟进单管理"""
    list_display = ['record_no', 'location', 'status', 'priority', 'survey_date', 'contract_date', 'created_at']
    list_filter = ['status', 'priority', 'is_abandoned', 'created_at']
    search_fields = ['record_no', 'location__name', 'location__address']
    readonly_fields = ['record_no', 'created_by', 'created_at', 'updated_at']
    
    fieldsets = [
        ('基本信息', {
            'fields': ['record_no', 'location', 'status', 'priority']
        }),
        ('调研信息', {
            'fields': ['survey_data', 'survey_date'],
            'classes': ['collapse']
        }),
        ('商务条件', {
            'fields': ['business_terms', 'legal_entity'],
            'classes': ['collapse']
        }),
        ('盈利测算', {
            'fields': ['profit_calculation'],
            'classes': ['collapse']
        }),
        ('签约信息', {
            'fields': ['contract_info', 'contract_date', 'contract_reminders'],
            'classes': ['collapse']
        }),
        ('放弃信息', {
            'fields': ['is_abandoned', 'abandon_reason', 'abandon_date'],
            'classes': ['collapse']
        }),
        ('其他信息', {
            'fields': ['remark']
        }),
        ('审计信息', {
            'fields': ['created_by', 'created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]
    
    def save_model(self, request, obj, form, change):
        """保存时自动设置创建人"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
