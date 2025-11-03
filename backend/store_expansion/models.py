"""
拓店管理模块数据模型
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal


class CandidateLocation(models.Model):
    """候选点位模型"""
    
    # 状态选项
    STATUS_AVAILABLE = 'available'
    STATUS_FOLLOWING = 'following'
    STATUS_SIGNED = 'signed'
    STATUS_ABANDONED = 'abandoned'
    STATUS_CHOICES = [
        (STATUS_AVAILABLE, '可用'),
        (STATUS_FOLLOWING, '跟进中'),
        (STATUS_SIGNED, '已签约'),
        (STATUS_ABANDONED, '已放弃'),
    ]
    
    # 基本信息
    name = models.CharField(max_length=200, verbose_name='点位名称')
    province = models.CharField(max_length=50, verbose_name='省份')
    city = models.CharField(max_length=50, verbose_name='城市')
    district = models.CharField(max_length=50, verbose_name='区县')
    address = models.TextField(verbose_name='详细地址')
    
    # 点位信息
    area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='面积(㎡)'
    )
    rent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='租金(元/月)'
    )
    
    # 关联业务大区
    business_region = models.ForeignKey(
        'base_data.BusinessRegion',
        on_delete=models.PROTECT,
        related_name='candidate_locations',
        verbose_name='业务大区'
    )
    
    # 状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_AVAILABLE,
        verbose_name='状态'
    )
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_locations',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'expansion_candidate_location'
        verbose_name = '候选点位'
        verbose_name_plural = '候选点位'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['province', 'city', 'district']),
            models.Index(fields=['business_region', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.city}{self.district}"


class ProfitCalculation(models.Model):
    """盈利测算模型"""
    
    # 投资成本
    rent_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='租金成本(元)'
    )
    decoration_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='装修成本(元)'
    )
    equipment_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='设备成本(元)'
    )
    other_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='其他成本(元)'
    )
    
    # 销售预测
    daily_sales = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='日均销售额(元)'
    )
    monthly_sales = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name='月均销售额(元)'
    )
    
    # 计算结果
    total_investment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='总投资(元)'
    )
    roi = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='投资回报率(%)'
    )
    payback_period = models.IntegerField(
        verbose_name='回本周期(月)'
    )
    contribution_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='贡献率(%)'
    )
    
    # 计算公式配置
    formula_version = models.CharField(
        max_length=50,
        verbose_name='公式版本'
    )
    calculation_params = models.JSONField(
        default=dict,
        verbose_name='计算参数'
    )
    
    # 时间戳
    calculated_at = models.DateTimeField(auto_now=True, verbose_name='计算时间')
    
    class Meta:
        db_table = 'expansion_profit_calculation'
        verbose_name = '盈利测算'
        verbose_name_plural = '盈利测算'
    
    def __str__(self):
        return f"盈利测算 - ROI: {self.roi}%, 回本周期: {self.payback_period}月"


class FollowUpRecord(models.Model):
    """铺位跟进单模型"""
    
    # 跟进状态选项
    STATUS_INVESTIGATING = 'investigating'
    STATUS_CALCULATING = 'calculating'
    STATUS_APPROVING = 'approving'
    STATUS_SIGNING = 'signing'
    STATUS_SIGNED = 'signed'
    STATUS_ABANDONED = 'abandoned'
    STATUS_CHOICES = [
        (STATUS_INVESTIGATING, '调研中'),
        (STATUS_CALCULATING, '测算中'),
        (STATUS_APPROVING, '审批中'),
        (STATUS_SIGNING, '签约中'),
        (STATUS_SIGNED, '已签约'),
        (STATUS_ABANDONED, '已放弃'),
    ]
    
    # 优先级选项
    PRIORITY_LOW = 'low'
    PRIORITY_MEDIUM = 'medium'
    PRIORITY_HIGH = 'high'
    PRIORITY_URGENT = 'urgent'
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, '低'),
        (PRIORITY_MEDIUM, '中'),
        (PRIORITY_HIGH, '高'),
        (PRIORITY_URGENT, '紧急'),
    ]
    
    # 跟进单号（自动生成）
    record_no = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='跟进单号'
    )
    
    # 关联候选点位
    location = models.ForeignKey(
        CandidateLocation,
        on_delete=models.PROTECT,
        related_name='follow_up_records',
        verbose_name='候选点位'
    )
    
    # 跟进状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_INVESTIGATING,
        verbose_name='跟进状态'
    )
    
    # 优先级
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default=PRIORITY_MEDIUM,
        verbose_name='优先级'
    )
    
    # 调研信息（JSON格式存储）
    survey_data = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name='调研数据'
    )
    survey_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='调研日期'
    )
    
    # 商务条件（JSON格式存储）
    business_terms = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name='商务条件'
    )
    
    # 盈利测算
    profit_calculation = models.OneToOneField(
        ProfitCalculation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='follow_up_record',
        verbose_name='盈利测算'
    )
    
    # 签约信息（JSON格式存储）
    contract_info = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name='合同信息'
    )
    contract_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='签约日期'
    )
    
    # 合同提醒（JSON数组，存储多个提醒配置）
    contract_reminders = models.JSONField(
        default=list,
        verbose_name='合同提醒'
    )
    
    # 主体信息
    legal_entity = models.ForeignKey(
        'base_data.LegalEntity',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='follow_up_records',
        verbose_name='法人主体'
    )
    
    # 是否放弃
    is_abandoned = models.BooleanField(
        default=False,
        verbose_name='是否放弃'
    )
    abandon_reason = models.TextField(
        blank=True,
        verbose_name='放弃原因'
    )
    abandon_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='放弃日期'
    )
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_follow_ups',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'expansion_follow_up_record'
        verbose_name = '铺位跟进单'
        verbose_name_plural = '铺位跟进单'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['record_no']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['location']),
        ]
    
    def __str__(self):
        return f"{self.record_no} - {self.location.name}"
    
    def save(self, *args, **kwargs):
        """保存时自动生成跟进单号"""
        if not self.record_no:
            # 生成跟进单号：FU + 年月日 + 4位序号
            from django.utils import timezone
            today = timezone.now().strftime('%Y%m%d')
            # 查询今天已有的跟进单数量
            count = FollowUpRecord.objects.filter(
                record_no__startswith=f'FU{today}'
            ).count()
            self.record_no = f'FU{today}{str(count + 1).zfill(4)}'
        super().save(*args, **kwargs)
