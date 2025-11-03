"""
开店筹备管理模块数据模型
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class ConstructionOrder(models.Model):
    """工程单模型"""
    
    # 状态选项
    STATUS_PLANNING = 'planning'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_ACCEPTANCE = 'acceptance'
    STATUS_RECTIFICATION = 'rectification'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PLANNING, '计划中'),
        (STATUS_IN_PROGRESS, '施工中'),
        (STATUS_ACCEPTANCE, '验收中'),
        (STATUS_RECTIFICATION, '整改中'),
        (STATUS_COMPLETED, '已完成'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    # 验收结果选项
    ACCEPTANCE_PASSED = 'passed'
    ACCEPTANCE_FAILED = 'failed'
    ACCEPTANCE_PENDING = 'pending'
    ACCEPTANCE_CHOICES = [
        (ACCEPTANCE_PENDING, '待验收'),
        (ACCEPTANCE_PASSED, '验收通过'),
        (ACCEPTANCE_FAILED, '验收不通过'),
    ]
    
    # 基本信息
    order_no = models.CharField(max_length=50, unique=True, verbose_name='工程单号')
    store_name = models.CharField(max_length=200, verbose_name='门店名称')
    
    # 关联跟进单
    follow_up_record = models.ForeignKey(
        'store_expansion.FollowUpRecord',
        on_delete=models.PROTECT,
        related_name='construction_orders',
        verbose_name='关联跟进单'
    )
    
    # 设计图纸（JSON 存储文件信息列表）
    design_files = models.JSONField(default=list, blank=True, verbose_name='设计图纸')
    
    # 施工计划
    construction_start_date = models.DateField(null=True, blank=True, verbose_name='开工日期')
    construction_end_date = models.DateField(null=True, blank=True, verbose_name='预计完工日期')
    actual_end_date = models.DateField(null=True, blank=True, verbose_name='实际完工日期')
    
    # 供应商
    supplier = models.ForeignKey(
        'base_data.Supplier',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='construction_orders',
        verbose_name='施工供应商'
    )
    
    # 状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PLANNING,
        verbose_name='工程状态'
    )
    
    # 验收信息
    acceptance_date = models.DateField(null=True, blank=True, verbose_name='验收日期')
    acceptance_result = models.CharField(
        max_length=20,
        choices=ACCEPTANCE_CHOICES,
        default=ACCEPTANCE_PENDING,
        verbose_name='验收结果'
    )
    acceptance_notes = models.TextField(blank=True, verbose_name='验收备注')
    
    # 整改项（JSON 存储整改项列表）
    rectification_items = models.JSONField(default=list, blank=True, verbose_name='整改项')
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_construction_orders',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'preparation_construction_order'
        verbose_name = '工程单'
        verbose_name_plural = '工程单'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_no']),
            models.Index(fields=['status']),
            models.Index(fields=['follow_up_record']),
            models.Index(fields=['construction_start_date']),
        ]
    
    def __str__(self):
        return f"{self.order_no} - {self.store_name}"
    
    def save(self, *args, **kwargs):
        """保存时自动生成工程单号"""
        if not self.order_no:
            from django.utils import timezone
            today = timezone.now().strftime('%Y%m%d')
            # 获取今天的最大序号
            last_order = ConstructionOrder.objects.filter(
                order_no__startswith=f'GC{today}'
            ).order_by('-order_no').first()
            
            if last_order:
                last_seq = int(last_order.order_no[-4:])
                new_seq = last_seq + 1
            else:
                new_seq = 1
            
            self.order_no = f'GC{today}{new_seq:04d}'
        
        super().save(*args, **kwargs)


class Milestone(models.Model):
    """工程里程碑模型"""
    
    # 状态选项
    STATUS_PENDING = 'pending'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_DELAYED = 'delayed'
    STATUS_CHOICES = [
        (STATUS_PENDING, '待开始'),
        (STATUS_IN_PROGRESS, '进行中'),
        (STATUS_COMPLETED, '已完成'),
        (STATUS_DELAYED, '已延期'),
    ]
    
    # 关联工程单
    construction_order = models.ForeignKey(
        ConstructionOrder,
        on_delete=models.CASCADE,
        related_name='milestones',
        verbose_name='工程单'
    )
    
    # 里程碑信息
    name = models.CharField(max_length=100, verbose_name='里程碑名称')
    description = models.TextField(blank=True, verbose_name='描述')
    planned_date = models.DateField(verbose_name='计划日期')
    actual_date = models.DateField(null=True, blank=True, verbose_name='实际完成日期')
    
    # 状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        verbose_name='状态'
    )
    
    # 提醒标记
    reminder_sent = models.BooleanField(default=False, verbose_name='是否已发送提醒')
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'preparation_milestone'
        verbose_name = '工程里程碑'
        verbose_name_plural = '工程里程碑'
        ordering = ['planned_date', 'id']
        indexes = [
            models.Index(fields=['construction_order', 'status']),
            models.Index(fields=['planned_date', 'status']),
            models.Index(fields=['status', 'reminder_sent']),
        ]
    
    def __str__(self):
        return f"{self.construction_order.order_no} - {self.name}"


class DeliveryChecklist(models.Model):
    """交付清单模型"""
    
    # 状态选项
    STATUS_DRAFT = 'draft'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_IN_PROGRESS, '进行中'),
        (STATUS_COMPLETED, '已完成'),
    ]
    
    # 基本信息
    checklist_no = models.CharField(max_length=50, unique=True, verbose_name='清单编号')
    
    # 关联工程单
    construction_order = models.OneToOneField(
        ConstructionOrder,
        on_delete=models.PROTECT,
        related_name='delivery_checklist',
        verbose_name='关联工程单'
    )
    
    store_name = models.CharField(max_length=200, verbose_name='门店名称')
    
    # 交付资料（JSON 存储交付项列表）
    # 每个交付项包含：name, type, status, files 等字段
    delivery_items = models.JSONField(default=list, blank=True, verbose_name='交付项')
    
    # 交付文档（JSON 存储文档信息列表）
    documents = models.JSONField(default=list, blank=True, verbose_name='交付文档')
    
    # 状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        verbose_name='交付状态'
    )
    
    # 交付日期
    delivery_date = models.DateField(null=True, blank=True, verbose_name='交付日期')
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_delivery_checklists',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'preparation_delivery_checklist'
        verbose_name = '交付清单'
        verbose_name_plural = '交付清单'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['checklist_no']),
            models.Index(fields=['status']),
            models.Index(fields=['construction_order']),
        ]
    
    def __str__(self):
        return f"{self.checklist_no} - {self.store_name}"
    
    def save(self, *args, **kwargs):
        """保存时自动生成清单编号"""
        if not self.checklist_no:
            from django.utils import timezone
            today = timezone.now().strftime('%Y%m%d')
            # 获取今天的最大序号
            last_checklist = DeliveryChecklist.objects.filter(
                checklist_no__startswith=f'JF{today}'
            ).order_by('-checklist_no').first()
            
            if last_checklist:
                last_seq = int(last_checklist.checklist_no[-4:])
                new_seq = last_seq + 1
            else:
                new_seq = 1
            
            self.checklist_no = f'JF{today}{new_seq:04d}'
        
        super().save(*args, **kwargs)
