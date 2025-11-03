"""
基础数据管理模型
"""
from django.db import models
from django.conf import settings


class BusinessRegion(models.Model):
    """业务大区模型"""
    
    name = models.CharField(max_length=100, unique=True, verbose_name='大区名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='大区编码')
    description = models.TextField(blank=True, verbose_name='描述')
    
    # 关联省市
    provinces = models.JSONField(default=list, verbose_name='关联省份列表')
    
    # 负责人
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_regions',
        verbose_name='负责人'
    )
    
    # 状态
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_regions',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'base_business_region'
        verbose_name = '业务大区'
        verbose_name_plural = '业务大区'
        ordering = ['code']
    
    def __str__(self):
        return self.name


class Supplier(models.Model):
    """供应商模型"""
    
    # 合作状态选项
    STATUS_COOPERATING = 'cooperating'
    STATUS_STOPPED = 'stopped'
    STATUS_CHOICES = [
        (STATUS_COOPERATING, '合作中'),
        (STATUS_STOPPED, '已停止'),
    ]
    
    # 供应商类型选项
    TYPE_CONSTRUCTION = 'construction'
    TYPE_EQUIPMENT = 'equipment'
    TYPE_MATERIAL = 'material'
    TYPE_OTHER = 'other'
    TYPE_CHOICES = [
        (TYPE_CONSTRUCTION, '施工供应商'),
        (TYPE_EQUIPMENT, '设备供应商'),
        (TYPE_MATERIAL, '材料供应商'),
        (TYPE_OTHER, '其他'),
    ]
    
    name = models.CharField(max_length=200, unique=True, verbose_name='供应商名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='供应商编码')
    supplier_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_CONSTRUCTION,
        verbose_name='供应商类型'
    )
    
    # 联系信息
    contact_person = models.CharField(max_length=100, blank=True, verbose_name='联系人')
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    contact_email = models.EmailField(blank=True, verbose_name='联系邮箱')
    address = models.TextField(blank=True, verbose_name='地址')
    
    # 企业信息
    credit_code = models.CharField(max_length=50, blank=True, verbose_name='统一社会信用代码')
    legal_representative = models.CharField(max_length=100, blank=True, verbose_name='法定代表人')
    
    # 合作状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_COOPERATING,
        verbose_name='合作状态'
    )
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_suppliers',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'base_supplier'
        verbose_name = '供应商'
        verbose_name_plural = '供应商'
        ordering = ['code']
    
    def __str__(self):
        return self.name


class LegalEntity(models.Model):
    """法人主体模型"""
    
    # 营运状态选项
    STATUS_OPERATING = 'operating'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_OPERATING, '营运中'),
        (STATUS_CANCELLED, '已注销'),
    ]
    
    name = models.CharField(max_length=200, unique=True, verbose_name='主体名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='主体编码')
    
    # 工商信息
    credit_code = models.CharField(max_length=50, unique=True, verbose_name='统一社会信用代码')
    legal_representative = models.CharField(max_length=100, verbose_name='法定代表人')
    registered_capital = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='注册资本'
    )
    registration_date = models.DateField(null=True, blank=True, verbose_name='注册日期')
    
    # 联系信息
    contact_person = models.CharField(max_length=100, blank=True, verbose_name='联系人')
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    contact_email = models.EmailField(blank=True, verbose_name='联系邮箱')
    registered_address = models.TextField(blank=True, verbose_name='注册地址')
    business_address = models.TextField(blank=True, verbose_name='经营地址')
    
    # 营运状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_OPERATING,
        verbose_name='营运状态'
    )
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_entities',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'base_legal_entity'
        verbose_name = '法人主体'
        verbose_name_plural = '法人主体'
        ordering = ['code']
    
    def __str__(self):
        return self.name


class Customer(models.Model):
    """客户/加盟商模型"""
    
    # 合作状态选项
    STATUS_COOPERATING = 'cooperating'
    STATUS_TERMINATED = 'terminated'
    STATUS_CHOICES = [
        (STATUS_COOPERATING, '合作中'),
        (STATUS_TERMINATED, '已终止'),
    ]
    
    # 客户类型选项
    TYPE_FRANCHISEE = 'franchisee'
    TYPE_PARTNER = 'partner'
    TYPE_OTHER = 'other'
    TYPE_CHOICES = [
        (TYPE_FRANCHISEE, '加盟商'),
        (TYPE_PARTNER, '合作伙伴'),
        (TYPE_OTHER, '其他'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='客户名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='客户编码')
    customer_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default=TYPE_FRANCHISEE,
        verbose_name='客户类型'
    )
    
    # 联系信息
    contact_person = models.CharField(max_length=100, verbose_name='联系人')
    contact_phone = models.CharField(max_length=20, verbose_name='联系电话')
    contact_email = models.EmailField(blank=True, verbose_name='联系邮箱')
    address = models.TextField(blank=True, verbose_name='地址')
    
    # 企业信息（如果是企业客户）
    credit_code = models.CharField(max_length=50, blank=True, verbose_name='统一社会信用代码')
    legal_representative = models.CharField(max_length=100, blank=True, verbose_name='法定代表人')
    
    # 合作信息
    cooperation_start_date = models.DateField(null=True, blank=True, verbose_name='合作开始日期')
    cooperation_end_date = models.DateField(null=True, blank=True, verbose_name='合作结束日期')
    
    # 合作状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_COOPERATING,
        verbose_name='合作状态'
    )
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_customers',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'base_customer'
        verbose_name = '客户'
        verbose_name_plural = '客户'
        ordering = ['code']
    
    def __str__(self):
        return self.name


class Budget(models.Model):
    """商务预算模型"""
    
    # 预算状态选项
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, '启用'),
        (STATUS_INACTIVE, '停用'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='预算名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='预算编码')
    
    # 预算金额
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name='预算总额'
    )
    
    # 预算明细（JSON格式存储各项预算）
    budget_items = models.JSONField(default=dict, verbose_name='预算明细')
    
    # 适用范围
    business_region = models.ForeignKey(
        BusinessRegion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='budgets',
        verbose_name='适用大区'
    )
    
    # 有效期
    valid_from = models.DateField(verbose_name='生效日期')
    valid_to = models.DateField(null=True, blank=True, verbose_name='失效日期')
    
    # 状态
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        verbose_name='状态'
    )
    
    # 备注
    remark = models.TextField(blank=True, verbose_name='备注')
    
    # 审计字段
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_budgets',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'base_budget'
        verbose_name = '商务预算'
        verbose_name_plural = '商务预算'
        ordering = ['-valid_from', 'code']
    
    def __str__(self):
        return self.name
