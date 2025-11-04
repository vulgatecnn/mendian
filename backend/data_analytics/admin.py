"""
数据分析模块管理后台配置
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import AnalyticsCache, ReportTask, ExternalSalesData, DataSyncLog


@admin.register(AnalyticsCache)
class AnalyticsCacheAdmin(admin.ModelAdmin):
    """数据分析缓存管理"""
    list_display = ['cache_key', 'cache_type', 'created_at', 'expires_at', 'is_expired_display']
    list_filter = ['cache_type', 'created_at', 'expires_at']
    search_fields = ['cache_key']
    readonly_fields = ['created_at', 'updated_at']
    
    def is_expired_display(self, obj):
        """显示是否过期"""
        if obj.is_expired():
            return format_html('<span style="color: red;">已过期</span>')
        return format_html('<span style="color: green;">有效</span>')
    is_expired_display.short_description = '状态'


@admin.register(ReportTask)
class ReportTaskAdmin(admin.ModelAdmin):
    """报表任务管理"""
    list_display = ['task_id', 'report_type', 'status', 'progress', 'created_by', 'created_at', 'completed_at']
    list_filter = ['report_type', 'status', 'format', 'created_at']
    search_fields = ['task_id', 'created_by__username']
    readonly_fields = ['task_id', 'created_at', 'started_at', 'completed_at', 'duration_display']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('task_id', 'report_type', 'format', 'created_by')
        }),
        ('任务状态', {
            'fields': ('status', 'progress', 'error_message')
        }),
        ('文件信息', {
            'fields': ('file_path', 'file_size')
        }),
        ('时间信息', {
            'fields': ('created_at', 'started_at', 'completed_at', 'duration_display')
        }),
        ('筛选条件', {
            'fields': ('filters',),
            'classes': ('collapse',)
        }),
    )
    
    def duration_display(self, obj):
        """显示任务执行时长"""
        duration = obj.duration
        if duration:
            return str(duration)
        return '-'
    duration_display.short_description = '执行时长'


@admin.register(ExternalSalesData)
class ExternalSalesDataAdmin(admin.ModelAdmin):
    """外部销售数据管理"""
    list_display = ['store', 'data_date', 'daily_revenue', 'daily_orders', 'sync_status', 'created_at']
    list_filter = ['sync_status', 'data_date', 'created_at']
    search_fields = ['store__name', 'store__code']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('store', 'data_date', 'data_source')
        }),
        ('销售数据', {
            'fields': ('daily_revenue', 'daily_orders', 'monthly_revenue', 'monthly_orders')
        }),
        ('同步信息', {
            'fields': ('sync_status', 'sync_message', 'created_at', 'updated_at')
        }),
    )


@admin.register(DataSyncLog)
class DataSyncLogAdmin(admin.ModelAdmin):
    """数据同步日志管理"""
    list_display = ['sync_type', 'status', 'start_time', 'end_time', 'records_processed', 'records_success', 'records_failed']
    list_filter = ['sync_type', 'status', 'start_time']
    search_fields = ['sync_type']
    readonly_fields = ['start_time', 'end_time', 'duration_display']
    
    fieldsets = (
        ('同步信息', {
            'fields': ('sync_type', 'status', 'created_by')
        }),
        ('时间信息', {
            'fields': ('start_time', 'end_time', 'duration_display')
        }),
        ('处理统计', {
            'fields': ('records_processed', 'records_success', 'records_failed')
        }),
        ('错误详情', {
            'fields': ('error_details',),
            'classes': ('collapse',)
        }),
    )
    
    def duration_display(self, obj):
        """显示同步时长"""
        duration = obj.duration
        if duration:
            return str(duration)
        return '-'
    duration_display.short_description = '同步时长'
