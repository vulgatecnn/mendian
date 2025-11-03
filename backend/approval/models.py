"""
审批中心模块数据模型
"""
from django.db import models
from django.utils import timezone


class ApprovalTemplate(models.Model):
    """审批模板模型"""
    
    # 状态选择
    STATUS_CHOICES = [
        ('active', '启用'),
        ('inactive', '停用'),
    ]
    
    id = models.BigAutoField(primary_key=True, verbose_name='模板ID')
    template_code = models.CharField(max_length=50, unique=True, verbose_name='模板编码')
    template_name = models.CharField(max_length=100, verbose_name='模板名称')
    description = models.TextField(verbose_name='模板描述')
    
    # 表单配置（JSON Schema）
    form_schema = models.JSONField(verbose_name='表单配置')
    
    # 流程配置
    flow_config = models.JSONField(verbose_name='流程配置')
    
    # 状态
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active', 
        verbose_name='状态'
    )
    
    created_by = models.ForeignKey(
        'system_management.User', 
        on_delete=models.PROTECT,
        related_name='created_approval_templates',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        db_table = 'approval_template'
        verbose_name = '审批模板'
        verbose_name_plural = '审批模板'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['template_code'], name='idx_appr_tmpl_code'),
            models.Index(fields=['status'], name='idx_appr_tmpl_status'),
        ]

    def __str__(self):
        return f"{self.template_name}({self.template_code})"


class ApprovalInstance(models.Model):
    """审批实例模型"""
    
    # 审批状态选择
    STATUS_CHOICES = [
        ('pending', '待审批'),
        ('in_progress', '审批中'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
        ('withdrawn', '已撤销'),
    ]
    
    # 最终结果选择
    RESULT_CHOICES = [
        ('approved', '通过'),
        ('rejected', '拒绝'),
        ('withdrawn', '撤销'),
    ]
    
    id = models.BigAutoField(primary_key=True, verbose_name='实例ID')
    instance_no = models.CharField(max_length=50, unique=True, verbose_name='审批单号')
    template = models.ForeignKey(
        ApprovalTemplate, 
        on_delete=models.PROTECT,
        related_name='instances',
        verbose_name='审批模板'
    )
    title = models.CharField(max_length=200, verbose_name='审批标题')
    
    # 表单数据
    form_data = models.JSONField(verbose_name='表单数据')
    
    # 业务关联
    business_type = models.CharField(max_length=50, verbose_name='业务类型')
    business_id = models.IntegerField(verbose_name='业务ID')
    
    # 审批状态
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending', 
        verbose_name='审批状态'
    )
    current_node = models.ForeignKey(
        'ApprovalNode', 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL,
        related_name='current_instances', 
        verbose_name='当前节点'
    )
    
    # 发起人
    initiator = models.ForeignKey(
        'system_management.User', 
        on_delete=models.PROTECT,
        related_name='initiated_approvals', 
        verbose_name='发起人'
    )
    initiated_at = models.DateTimeField(auto_now_add=True, verbose_name='发起时间')
    
    # 完成信息
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    final_result = models.CharField(
        max_length=20, 
        choices=RESULT_CHOICES,
        null=True, 
        blank=True,
        verbose_name='最终结果'
    )
    
    class Meta:
        db_table = 'approval_instance'
        verbose_name = '审批实例'
        verbose_name_plural = '审批实例'
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['instance_no'], name='idx_appr_inst_no'),
            models.Index(fields=['status'], name='idx_appr_inst_status'),
            models.Index(fields=['business_type', 'business_id'], name='idx_appr_business'),
            models.Index(fields=['initiator'], name='idx_appr_initiator'),
        ]

    def __str__(self):
        return f"{self.title}({self.instance_no})"


class ApprovalNode(models.Model):
    """审批节点模型"""
    
    # 节点类型选择
    NODE_TYPE_CHOICES = [
        ('approval', '审批节点'),
        ('cc', '抄送节点'),
        ('condition', '条件节点'),
    ]
    
    # 节点状态选择
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('in_progress', '处理中'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
        ('skipped', '已跳过'),
    ]
    
    # 审批结果选择
    RESULT_CHOICES = [
        ('approved', '通过'),
        ('rejected', '拒绝'),
        ('transferred', '转交'),
        ('added_sign', '加签'),
    ]
    
    id = models.BigAutoField(primary_key=True, verbose_name='节点ID')
    instance = models.ForeignKey(
        ApprovalInstance, 
        on_delete=models.CASCADE,
        related_name='nodes', 
        verbose_name='审批实例'
    )
    node_name = models.CharField(max_length=100, verbose_name='节点名称')
    node_type = models.CharField(
        max_length=20, 
        choices=NODE_TYPE_CHOICES,
        default='approval',
        verbose_name='节点类型'
    )
    sequence = models.IntegerField(verbose_name='节点序号')
    
    # 审批人配置（JSON格式存储审批人规则）
    approver_config = models.JSONField(verbose_name='审批人配置')
    
    # 节点状态
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending', 
        verbose_name='节点状态'
    )
    
    # 审批结果
    approval_result = models.CharField(
        max_length=20, 
        choices=RESULT_CHOICES,
        null=True, 
        blank=True,
        verbose_name='审批结果'
    )
    approval_comment = models.TextField(null=True, blank=True, verbose_name='审批意见')
    approved_by = models.ForeignKey(
        'system_management.User', 
        null=True, 
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_nodes', 
        verbose_name='审批人'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='审批时间')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        db_table = 'approval_node'
        verbose_name = '审批节点'
        verbose_name_plural = '审批节点'
        ordering = ['sequence']
        indexes = [
            models.Index(fields=['instance', 'sequence'], name='idx_appr_node_seq'),
            models.Index(fields=['status'], name='idx_appr_node_status'),
        ]

    def __str__(self):
        return f"{self.instance.title} - {self.node_name}"


class ApprovalNodeApprover(models.Model):
    """审批节点审批人关联模型"""
    
    id = models.BigAutoField(primary_key=True, verbose_name='关联ID')
    node = models.ForeignKey(
        ApprovalNode,
        on_delete=models.CASCADE,
        related_name='approvers',
        verbose_name='审批节点'
    )
    user = models.ForeignKey(
        'system_management.User',
        on_delete=models.CASCADE,
        related_name='approval_nodes',
        verbose_name='审批人'
    )
    is_processed = models.BooleanField(default=False, verbose_name='是否已处理')
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    
    class Meta:
        db_table = 'approval_node_approver'
        verbose_name = '审批节点审批人'
        verbose_name_plural = '审批节点审批人'
        unique_together = ['node', 'user']
        indexes = [
            models.Index(fields=['node'], name='idx_appr_node_appr_node'),
            models.Index(fields=['user'], name='idx_appr_node_appr_user'),
        ]


class ApprovalNodeCC(models.Model):
    """审批节点抄送人关联模型"""
    
    id = models.BigAutoField(primary_key=True, verbose_name='关联ID')
    node = models.ForeignKey(
        ApprovalNode,
        on_delete=models.CASCADE,
        related_name='cc_users',
        verbose_name='审批节点'
    )
    user = models.ForeignKey(
        'system_management.User',
        on_delete=models.CASCADE,
        related_name='cc_nodes',
        verbose_name='抄送人'
    )
    notified_at = models.DateTimeField(auto_now_add=True, verbose_name='通知时间')
    
    class Meta:
        db_table = 'approval_node_cc'
        verbose_name = '审批节点抄送人'
        verbose_name_plural = '审批节点抄送人'
        unique_together = ['node', 'user']
        indexes = [
            models.Index(fields=['node'], name='idx_appr_node_cc_node'),
            models.Index(fields=['user'], name='idx_appr_node_cc_user'),
        ]


class ApprovalFollow(models.Model):
    """审批关注模型"""
    
    id = models.BigAutoField(primary_key=True, verbose_name='关注ID')
    instance = models.ForeignKey(
        ApprovalInstance, 
        on_delete=models.CASCADE,
        related_name='follows', 
        verbose_name='审批实例'
    )
    user = models.ForeignKey(
        'system_management.User', 
        on_delete=models.CASCADE,
        related_name='followed_approvals',
        verbose_name='关注人'
    )
    followed_at = models.DateTimeField(auto_now_add=True, verbose_name='关注时间')
    
    class Meta:
        db_table = 'approval_follow'
        verbose_name = '审批关注'
        verbose_name_plural = '审批关注'
        unique_together = ['instance', 'user']
        indexes = [
            models.Index(fields=['user'], name='idx_appr_follow_user'),
        ]

    def __str__(self):
        return f"{self.user.username} 关注 {self.instance.title}"


class ApprovalComment(models.Model):
    """审批评论模型"""
    
    id = models.BigAutoField(primary_key=True, verbose_name='评论ID')
    instance = models.ForeignKey(
        ApprovalInstance, 
        on_delete=models.CASCADE,
        related_name='comments', 
        verbose_name='审批实例'
    )
    user = models.ForeignKey(
        'system_management.User', 
        on_delete=models.CASCADE,
        related_name='approval_comments',
        verbose_name='评论人'
    )
    content = models.TextField(verbose_name='评论内容')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='评论时间')
    
    class Meta:
        db_table = 'approval_comment'
        verbose_name = '审批评论'
        verbose_name_plural = '审批评论'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['instance'], name='idx_appr_comment_inst'),
            models.Index(fields=['user'], name='idx_appr_comment_user'),
        ]

    def __str__(self):
        return f"{self.user.username} 在 {self.instance.title} 的评论"