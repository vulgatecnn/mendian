"""
数据分析模块数据模型
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class AnalyticsCache(models.Model):
    """数据分析缓存表"""
    
    CACHE_TYPE_CHOICES = [
        ('dashboard', '经营大屏'),
        ('store_map', '开店地图'),
        ('funnel', '跟进漏斗'),
        ('plan_progress', '计划进度'),
        ('report_data', '报表数据'),
    ]
    
    cache_key = models.CharField('缓存键', max_length=255, unique=True)
    cache_data = models.JSONField('缓存数据')
    cache_type = models.CharField('缓存类型', max_length=50, choices=CACHE_TYPE_CHOICES)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    expires_at = models.DateTimeField('过期时间')
    
    class Meta:
        db_table = 'analytics_cache'
        verbose_name = '数据分析缓存'
        verbose_name_plural = '数据分析缓存'
        indexes = [
            models.Index(fields=['cache_type', 'expires_at']),
            models.Index(fields=['cache_key']),
        ]
    
    def __str__(self):
        return f"{self.get_cache_type_display()} - {self.cache_key}"
    
    def is_expired(self):
        """检查缓存是否过期"""
        return timezone.now() > self.expires_at


class ReportTask(models.Model):
    """报表生成任务"""
    
    REPORT_TYPE_CHOICES = [
        ('plan', '开店计划报表'),
        ('follow_up', '拓店跟进进度报表'),
        ('preparation', '筹备进度报表'),
        ('assets', '门店资产报表'),
    ]
    
    STATUS_CHOICES = [
        ('pending', '等待中'),
        ('processing', '处理中'),
        ('completed', '已完成'),
        ('failed', '失败'),
    ]
    
    FORMAT_CHOICES = [
        ('excel', 'Excel格式'),
        ('pdf', 'PDF格式'),
    ]
    
    task_id = models.UUIDField('任务ID', primary_key=True, default=uuid.uuid4)
    report_type = models.CharField('报表类型', max_length=50, choices=REPORT_TYPE_CHOICES)
    filters = models.JSONField('筛选条件', default=dict)
    format = models.CharField('导出格式', max_length=10, choices=FORMAT_CHOICES, default='excel')
    status = models.CharField('任务状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    progress = models.IntegerField('进度百分比', default=0)
    file_path = models.CharField('文件路径', max_length=500, blank=True)
    file_size = models.BigIntegerField('文件大小(字节)', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='创建人')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    started_at = models.DateTimeField('开始时间', null=True, blank=True)
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)
    error_message = models.TextField('错误信息', blank=True)
    
    class Meta:
        db_table = 'report_tasks'
        verbose_name = '报表任务'
        verbose_name_plural = '报表任务'
        indexes = [
            models.Index(fields=['created_by', 'created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.get_status_display()}"
    
    @property
    def duration(self):
        """计算任务执行时长"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None


class ExternalSalesData(models.Model):
    """外部销售数据"""
    
    store = models.ForeignKey(
        'store_archive.StoreProfile', 
        on_delete=models.CASCADE, 
        verbose_name='门店',
        related_name='sales_data'
    )
    data_date = models.DateField('数据日期')
    daily_revenue = models.DecimalField('日营业额', max_digits=12, decimal_places=2, default=0)
    daily_orders = models.IntegerField('日订单数', default=0)
    monthly_revenue = models.DecimalField('月营业额', max_digits=12, decimal_places=2, default=0)
    monthly_orders = models.IntegerField('月订单数', default=0)
    
    # 数据来源和同步信息
    data_source = models.CharField('数据来源', max_length=100, default='external_api')
    sync_status = models.CharField('同步状态', max_length=20, default='success')
    sync_message = models.TextField('同步信息', blank=True)
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'external_sales_data'
        verbose_name = '外部销售数据'
        verbose_name_plural = '外部销售数据'
        unique_together = ['store', 'data_date']
        indexes = [
            models.Index(fields=['store', 'data_date']),
            models.Index(fields=['data_date']),
            models.Index(fields=['sync_status']),
        ]
    
    def __str__(self):
        return f"{self.store.name} - {self.data_date}"


class DataSyncLog(models.Model):
    """数据同步日志"""
    
    SYNC_TYPE_CHOICES = [
        ('sales_data', '销售数据同步'),
        ('cache_refresh', '缓存刷新'),
        ('report_generation', '报表生成'),
    ]
    
    STATUS_CHOICES = [
        ('success', '成功'),
        ('failed', '失败'),
        ('partial', '部分成功'),
    ]
    
    sync_type = models.CharField('同步类型', max_length=50, choices=SYNC_TYPE_CHOICES)
    status = models.CharField('同步状态', max_length=20, choices=STATUS_CHOICES)
    start_time = models.DateTimeField('开始时间')
    end_time = models.DateTimeField('结束时间', null=True, blank=True)
    records_processed = models.IntegerField('处理记录数', default=0)
    records_success = models.IntegerField('成功记录数', default=0)
    records_failed = models.IntegerField('失败记录数', default=0)
    error_details = models.JSONField('错误详情', default=dict)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='执行人')
    
    class Meta:
        db_table = 'data_sync_logs'
        verbose_name = '数据同步日志'
        verbose_name_plural = '数据同步日志'
        indexes = [
            models.Index(fields=['sync_type', 'start_time']),
            models.Index(fields=['status', 'start_time']),
        ]
    
    def __str__(self):
        return f"{self.get_sync_type_display()} - {self.get_status_display()}"
    
    @property
    def duration(self):
        """计算同步时长"""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return None
