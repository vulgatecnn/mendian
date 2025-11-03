from django.db import models
from django.conf import settings


class Message(models.Model):
    """消息模型"""
    
    # 消息类型选择
    MESSAGE_TYPE_CHOICES = [
        ('system', '系统消息'),
        ('approval_pending', '待审批提醒'),
        ('approval_approved', '审批通过'),
        ('approval_rejected', '审批拒绝'),
        ('milestone_reminder', '里程碑提醒'),
        ('contract_reminder', '合同提醒'),
        ('task_reminder', '任务提醒'),
    ]
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='messages', 
        on_delete=models.CASCADE,
        verbose_name="接收人"
    )
    title = models.CharField(max_length=200, verbose_name="消息标题")
    content = models.TextField(verbose_name="消息内容")
    message_type = models.CharField(
        max_length=50, 
        choices=MESSAGE_TYPE_CHOICES,
        default='system',
        verbose_name="消息类型"
    )
    
    # 关联业务
    link = models.CharField(max_length=500, null=True, blank=True, verbose_name="跳转链接")
    
    # 状态
    is_read = models.BooleanField(default=False, verbose_name="是否已读")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="阅读时间")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    
    class Meta:
        db_table = 'message'
        verbose_name = '消息'
        verbose_name_plural = '消息'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['message_type']),
        ]
    
    def __str__(self):
        return f"{self.recipient.real_name} - {self.title}"
    
    def mark_as_read(self):
        """标记为已读"""
        if not self.is_read:
            self.is_read = True
            from django.utils import timezone
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
