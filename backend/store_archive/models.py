"""
门店档案模块 - 数据模型
"""
from django.db import models
from django.conf import settings


class StoreProfile(models.Model):
    """门店档案模型"""
    
    # 门店状态选项
    STATUS_CHOICES = [
        ('planning', '规划中'),
        ('construction', '施工中'),
        ('preparing', '筹备中'),
        ('operating', '营业中'),
        ('closed', '已闭店'),
        ('suspended', '暂停营业'),
    ]
    
    # 门店类型选项
    STORE_TYPE_CHOICES = [
        ('standard', '标准店'),
        ('flagship', '旗舰店'),
        ('community', '社区店'),
        ('mall', '商场店'),
    ]
    
    # 经营模式选项
    OPERATION_MODE_CHOICES = [
        ('direct', '直营'),
        ('franchise', '加盟'),
        ('joint', '合营'),
    ]
    
    # 基本信息
    store_code = models.CharField(max_length=50, unique=True, verbose_name="门店编码")
    store_name = models.CharField(max_length=200, verbose_name="门店名称")
    
    # 地址信息
    province = models.CharField(max_length=50, verbose_name="省份")
    city = models.CharField(max_length=50, verbose_name="城市")
    district = models.CharField(max_length=50, verbose_name="区县")
    address = models.TextField(verbose_name="详细地址")
    
    # 业务大区
    business_region = models.ForeignKey(
        'base_data.BusinessRegion',
        on_delete=models.PROTECT,
        verbose_name="业务大区"
    )
    
    # 门店类型和经营模式
    store_type = models.CharField(
        max_length=50,
        choices=STORE_TYPE_CHOICES,
        verbose_name="门店类型"
    )
    operation_mode = models.CharField(
        max_length=50,
        choices=OPERATION_MODE_CHOICES,
        verbose_name="经营模式"
    )
    
    # 关联业务数据
    follow_up_record = models.OneToOneField(
        'store_expansion.FollowUpRecord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="关联跟进单"
    )
    construction_order = models.OneToOneField(
        'store_preparation.ConstructionOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="关联工程单"
    )
    
    # 门店状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning',
        verbose_name="门店状态"
    )
    opening_date = models.DateField(null=True, blank=True, verbose_name="开业日期")
    closing_date = models.DateField(null=True, blank=True, verbose_name="闭店日期")
    
    # 负责人
    store_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_stores',
        verbose_name="店长"
    )
    business_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='business_stores',
        verbose_name="商务负责人"
    )
    
    # 备注信息
    remarks = models.TextField(blank=True, verbose_name="备注")
    
    # 创建和更新信息
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_store_profiles',
        verbose_name="创建人"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        db_table = 'store_profile'
        verbose_name = '门店档案'
        verbose_name_plural = '门店档案'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['store_code']),
            models.Index(fields=['store_name']),
            models.Index(fields=['status']),
            models.Index(fields=['business_region']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.store_code} - {self.store_name}"
