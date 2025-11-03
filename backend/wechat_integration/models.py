"""
企业微信集成模块数据模型
"""
from django.db import models
from django.utils import timezone


class WechatDepartment(models.Model):
    """企业微信部门同步记录"""
    wechat_dept_id = models.BigIntegerField(unique=True, verbose_name='企微部门ID')
    name = models.CharField(max_length=100, verbose_name='部门名称')
    parent_id = models.BigIntegerField(null=True, blank=True, verbose_name='上级部门ID')
    order = models.IntegerField(default=0, verbose_name='排序')
    
    # 同步状态
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', '待同步'),
            ('synced', '已同步'),
            ('failed', '同步失败'),
        ],
        default='pending',
        verbose_name='同步状态'
    )
    
    # 关联的本地部门
    local_department = models.OneToOneField(
        'system_management.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wechat_department',
        verbose_name='本地部门'
    )
    
    last_sync_at = models.DateTimeField(null=True, blank=True, verbose_name='最后同步时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'wechat_department'
        verbose_name = '企微部门'
        verbose_name_plural = '企微部门'
        ordering = ['order', 'wechat_dept_id']
        indexes = [
            models.Index(fields=['wechat_dept_id'], name='idx_wechat_dept_id'),
            models.Index(fields=['sync_status'], name='idx_wechat_dept_sync'),
        ]

    def __str__(self):
        return f"{self.name} ({self.wechat_dept_id})"


class WechatUser(models.Model):
    """企业微信用户同步记录"""
    wechat_user_id = models.CharField(max_length=64, unique=True, verbose_name='企微用户ID')
    name = models.CharField(max_length=50, verbose_name='用户姓名')
    mobile = models.CharField(max_length=11, blank=True, verbose_name='手机号')
    department_ids = models.JSONField(default=list, verbose_name='部门ID列表')
    position = models.CharField(max_length=50, blank=True, verbose_name='职位')
    gender = models.CharField(
        max_length=10,
        choices=[
            ('1', '男'),
            ('2', '女'),
            ('0', '未定义'),
        ],
        default='0',
        verbose_name='性别'
    )
    email = models.EmailField(blank=True, verbose_name='邮箱')
    avatar = models.URLField(blank=True, verbose_name='头像URL')
    status = models.IntegerField(
        choices=[
            (1, '已激活'),
            (2, '已禁用'),
            (4, '未激活'),
            (5, '退出企业'),
        ],
        default=1,
        verbose_name='账号状态'
    )
    
    # 同步状态
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', '待同步'),
            ('synced', '已同步'),
            ('failed', '同步失败'),
        ],
        default='pending',
        verbose_name='同步状态'
    )
    
    # 关联的本地用户
    local_user = models.OneToOneField(
        'system_management.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wechat_user',
        verbose_name='本地用户'
    )
    
    last_sync_at = models.DateTimeField(null=True, blank=True, verbose_name='最后同步时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'wechat_user'
        verbose_name = '企微用户'
        verbose_name_plural = '企微用户'
        ordering = ['name']
        indexes = [
            models.Index(fields=['wechat_user_id'], name='idx_wechat_user_id'),
            models.Index(fields=['sync_status'], name='idx_wechat_user_sync'),
            models.Index(fields=['mobile'], name='idx_wechat_user_mobile'),
        ]

    def __str__(self):
        return f"{self.name} ({self.wechat_user_id})"


class WechatSyncLog(models.Model):
    """企业微信同步日志"""
    sync_type = models.CharField(
        max_length=20,
        choices=[
            ('department', '部门同步'),
            ('user', '用户同步'),
            ('full', '全量同步'),
        ],
        verbose_name='同步类型'
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('running', '同步中'),
            ('success', '成功'),
            ('failed', '失败'),
        ],
        verbose_name='同步状态'
    )
    
    total_count = models.IntegerField(default=0, verbose_name='总数量')
    success_count = models.IntegerField(default=0, verbose_name='成功数量')
    failed_count = models.IntegerField(default=0, verbose_name='失败数量')
    
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    details = models.JSONField(default=dict, verbose_name='同步详情')
    
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='开始时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    
    # 执行人（可能是定时任务）
    triggered_by = models.ForeignKey(
        'system_management.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='触发人'
    )

    class Meta:
        db_table = 'wechat_sync_log'
        verbose_name = '企微同步日志'
        verbose_name_plural = '企微同步日志'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['sync_type'], name='idx_wechat_sync_type'),
            models.Index(fields=['status'], name='idx_wechat_sync_status'),
            models.Index(fields=['started_at'], name='idx_wechat_sync_time'),
        ]

    def __str__(self):
        return f"{self.get_sync_type_display()} - {self.get_status_display()} ({self.started_at})"

    def mark_completed(self, status='success', error_message=''):
        """标记同步完成"""
        self.status = status
        self.completed_at = timezone.now()
        if error_message:
            self.error_message = error_message
        self.save()

    def add_success(self, count=1):
        """增加成功计数"""
        self.success_count += count
        self.save()

    def add_failed(self, count=1):
        """增加失败计数"""
        self.failed_count += count
        self.save()


class WechatMessage(models.Model):
    """企业微信消息发送记录"""
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('text', '文本消息'),
            ('textcard', '文本卡片'),
            ('markdown', 'Markdown'),
        ],
        verbose_name='消息类型'
    )
    
    # 接收人
    to_users = models.JSONField(default=list, verbose_name='接收用户列表')
    to_departments = models.JSONField(default=list, verbose_name='接收部门列表')
    to_tags = models.JSONField(default=list, verbose_name='接收标签列表')
    
    # 消息内容
    title = models.CharField(max_length=200, blank=True, verbose_name='消息标题')
    content = models.TextField(verbose_name='消息内容')
    url = models.URLField(blank=True, verbose_name='跳转链接')
    
    # 发送状态
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', '待发送'),
            ('sent', '已发送'),
            ('failed', '发送失败'),
        ],
        default='pending',
        verbose_name='发送状态'
    )
    
    # 企业微信返回的消息ID
    wechat_msg_id = models.CharField(max_length=100, blank=True, verbose_name='企微消息ID')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    
    # 业务关联
    business_type = models.CharField(max_length=50, blank=True, verbose_name='业务类型')
    business_id = models.BigIntegerField(null=True, blank=True, verbose_name='业务ID')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name='发送时间')

    class Meta:
        db_table = 'wechat_message'
        verbose_name = '企微消息'
        verbose_name_plural = '企微消息'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status'], name='idx_wechat_msg_status'),
            models.Index(fields=['business_type', 'business_id'], name='idx_wechat_msg_business'),
            models.Index(fields=['created_at'], name='idx_wechat_msg_time'),
        ]

    def __str__(self):
        return f"{self.title or self.content[:50]} - {self.get_status_display()}"

    def mark_sent(self, wechat_msg_id=''):
        """标记消息已发送"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        if wechat_msg_id:
            self.wechat_msg_id = wechat_msg_id
        self.save()

    def mark_failed(self, error_message=''):
        """标记消息发送失败"""
        self.status = 'failed'
        if error_message:
            self.error_message = error_message
        self.save()