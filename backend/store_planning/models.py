from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class BusinessRegion(models.Model):
    """经营区域模型"""
    
    name = models.CharField(max_length=100, verbose_name='区域名称')
    code = models.CharField(max_length=20, unique=True, verbose_name='区域编码')
    description = models.TextField(blank=True, verbose_name='区域描述')
    is_active = models.BooleanField(default=True, verbose_name='启用状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '经营区域'
        verbose_name_plural = '经营区域'
        db_table = 'business_regions'
        ordering = ['code']

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        """数据验证"""
        from django.core.exceptions import ValidationError
        
        # 验证区域编码格式（可以根据业务需求调整）
        if self.code and not self.code.isalnum():
            raise ValidationError({'code': '区域编码只能包含字母和数字'})


class StoreType(models.Model):
    """门店类型模型"""
    
    name = models.CharField(max_length=50, verbose_name='类型名称')
    code = models.CharField(max_length=20, unique=True, verbose_name='类型编码')
    description = models.TextField(blank=True, verbose_name='类型描述')
    is_active = models.BooleanField(default=True, verbose_name='启用状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '门店类型'
        verbose_name_plural = '门店类型'
        db_table = 'store_types'
        ordering = ['code']

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        """数据验证"""
        from django.core.exceptions import ValidationError
        
        # 验证类型编码格式
        if self.code and not self.code.isalnum():
            raise ValidationError({'code': '类型编码只能包含字母和数字'})


class StorePlan(models.Model):
    """开店计划模型"""
    
    PLAN_TYPE_CHOICES = [
        ('annual', '年度计划'),
        ('quarterly', '季度计划'),
    ]
    
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('published', '已发布'),
        ('executing', '执行中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='计划名称')
    plan_type = models.CharField(
        max_length=20, 
        choices=PLAN_TYPE_CHOICES, 
        verbose_name='计划类型'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft', 
        verbose_name='计划状态'
    )
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    description = models.TextField(blank=True, verbose_name='计划描述')
    total_target_count = models.PositiveIntegerField(default=0, verbose_name='总目标数量')
    total_completed_count = models.PositiveIntegerField(default=0, verbose_name='总完成数量')
    total_budget_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='总预算金额'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='created_plans',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='发布时间')
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='取消时间')
    cancel_reason = models.TextField(blank=True, verbose_name='取消原因')

    class Meta:
        verbose_name = '开店计划'
        verbose_name_plural = '开店计划'
        db_table = 'store_plans'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()})"

    def clean(self):
        """数据验证"""
        from django.core.exceptions import ValidationError
        
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError({'end_date': '结束日期必须晚于开始日期'})

    @property
    def completion_rate(self):
        """完成率"""
        if self.total_target_count == 0:
            return 0
        return round((self.total_completed_count / self.total_target_count) * 100, 2)


class RegionalPlan(models.Model):
    """区域计划模型"""
    
    plan = models.ForeignKey(
        StorePlan, 
        on_delete=models.CASCADE, 
        related_name='regional_plans',
        verbose_name='所属计划'
    )
    region = models.ForeignKey(
        BusinessRegion, 
        on_delete=models.PROTECT,
        verbose_name='经营区域'
    )
    store_type = models.ForeignKey(
        StoreType, 
        on_delete=models.PROTECT,
        verbose_name='门店类型'
    )
    target_count = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='目标数量'
    )
    completed_count = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='完成数量'
    )
    contribution_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True, 
        blank=True,
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        verbose_name='贡献率(%)'
    )
    budget_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name='预算金额'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '区域计划'
        verbose_name_plural = '区域计划'
        db_table = 'regional_plans'
        ordering = ['plan', 'region__code', 'store_type__code']
        unique_together = ['plan', 'region', 'store_type']

    def __str__(self):
        return f"{self.plan.name} - {self.region.name} - {self.store_type.name}"

    @property
    def completion_rate(self):
        """完成率"""
        if self.target_count == 0:
            return 0
        return round((self.completed_count / self.target_count) * 100, 2)


class PlanExecutionLog(models.Model):
    """计划执行记录模型"""
    
    ACTION_TYPE_CHOICES = [
        ('store_opened', '门店开业'),
        ('store_closed', '门店关闭'),
        ('plan_created', '计划创建'),
        ('plan_updated', '计划更新'),
        ('plan_published', '计划发布'),
        ('plan_cancelled', '计划取消'),
        ('progress_updated', '进度更新'),
    ]
    
    plan = models.ForeignKey(
        StorePlan, 
        on_delete=models.CASCADE, 
        related_name='execution_logs',
        verbose_name='所属计划'
    )
    regional_plan = models.ForeignKey(
        RegionalPlan, 
        on_delete=models.CASCADE, 
        related_name='execution_logs',
        null=True, 
        blank=True,
        verbose_name='区域计划'
    )
    store_id = models.PositiveIntegerField(null=True, blank=True, verbose_name='门店ID')
    action_type = models.CharField(
        max_length=50, 
        choices=ACTION_TYPE_CHOICES,
        verbose_name='操作类型'
    )
    action_description = models.TextField(verbose_name='操作描述')
    previous_count = models.PositiveIntegerField(null=True, blank=True, verbose_name='变更前数量')
    current_count = models.PositiveIntegerField(null=True, blank=True, verbose_name='变更后数量')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT,
        null=True, 
        blank=True,
        verbose_name='操作人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '计划执行记录'
        verbose_name_plural = '计划执行记录'
        db_table = 'plan_execution_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.plan.name} - {self.get_action_type_display()}"


class PlanApproval(models.Model):
    """计划审批记录模型"""
    
    APPROVAL_TYPE_CHOICES = [
        ('plan_publish', '计划发布审批'),
        ('plan_cancel', '计划取消审批'),
        ('plan_modify', '计划修改审批'),
    ]
    
    STATUS_CHOICES = [
        ('pending', '待审批'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
        ('cancelled', '已取消'),
    ]
    
    plan = models.ForeignKey(
        StorePlan, 
        on_delete=models.CASCADE, 
        related_name='approvals',
        verbose_name='所属计划'
    )
    approval_type = models.CharField(
        max_length=50, 
        choices=APPROVAL_TYPE_CHOICES,
        verbose_name='审批类型'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name='审批状态'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='submitted_approvals',
        verbose_name='提交人'
    )
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='提交时间')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='approved_approvals',
        null=True, 
        blank=True,
        verbose_name='审批人'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='审批时间')
    rejection_reason = models.TextField(blank=True, verbose_name='拒绝原因')
    approval_notes = models.TextField(blank=True, verbose_name='审批备注')

    class Meta:
        verbose_name = '计划审批记录'
        verbose_name_plural = '计划审批记录'
        db_table = 'plan_approvals'
        ordering = ['-submitted_at']
        unique_together = ['plan', 'approval_type']

    def __str__(self):
        return f"{self.plan.name} - {self.get_approval_type_display()}"