"""
门店档案模块 - Django 管理后台配置
"""
from django.contrib import admin
from store_archive.models import StoreProfile


@admin.register(StoreProfile)
class StoreProfileAdmin(admin.ModelAdmin):
    """门店档案管理"""
    
    list_display = [
        'store_code',
        'store_name',
        'province',
        'city',
        'district',
        'business_region',
        'store_type',
        'operation_mode',
        'status',
        'opening_date',
        'store_manager',
        'business_manager',
        'created_at',
    ]
    
    list_filter = [
        'status',
        'store_type',
        'operation_mode',
        'province',
        'business_region',
        'created_at',
    ]
    
    search_fields = [
        'store_code',
        'store_name',
        'address',
    ]
    
    readonly_fields = [
        'created_by',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('基本信息', {
            'fields': (
                'store_code',
                'store_name',
                'store_type',
                'operation_mode',
            )
        }),
        ('地址信息', {
            'fields': (
                'province',
                'city',
                'district',
                'address',
                'business_region',
            )
        }),
        ('状态信息', {
            'fields': (
                'status',
                'opening_date',
                'closing_date',
            )
        }),
        ('负责人', {
            'fields': (
                'store_manager',
                'business_manager',
            )
        }),
        ('关联数据', {
            'fields': (
                'follow_up_record',
                'construction_order',
            )
        }),
        ('其他信息', {
            'fields': (
                'remarks',
                'created_by',
                'created_at',
                'updated_at',
            )
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """保存模型时设置创建人"""
        if not change:  # 新建时
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
