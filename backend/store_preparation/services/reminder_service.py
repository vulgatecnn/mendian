"""
里程碑提醒服务
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from ..models import Milestone


class MilestoneReminderService:
    """里程碑提醒服务"""
    
    # 提前提醒天数
    REMINDER_DAYS_BEFORE = 3
    
    def check_and_send_reminders(self):
        """
        检查并发送里程碑提醒（定时任务）
        
        Returns:
            dict: 包含发送结果的字典
        """
        today = timezone.now().date()
        reminder_date = today + timedelta(days=self.REMINDER_DAYS_BEFORE)
        
        # 查询即将到期的里程碑（提前3天提醒）
        upcoming_milestones = Milestone.objects.filter(
            Q(status='pending') | Q(status='in_progress'),
            planned_date__lte=reminder_date,
            planned_date__gte=today,
            reminder_sent=False
        ).select_related('construction_order', 'construction_order__created_by')
        
        sent_count = 0
        failed_count = 0
        
        for milestone in upcoming_milestones:
            try:
                self._send_reminder(milestone)
                milestone.reminder_sent = True
                milestone.save(update_fields=['reminder_sent', 'updated_at'])
                sent_count += 1
            except Exception as e:
                failed_count += 1
                # 记录错误日志
                import logging
                logger = logging.getLogger(__name__)
                logger.error(
                    f'发送里程碑提醒失败: {milestone.id} - {str(e)}',
                    exc_info=True
                )
        
        return {
            'total': upcoming_milestones.count(),
            'sent': sent_count,
            'failed': failed_count
        }
    
    def _send_reminder(self, milestone):
        """
        发送提醒通知
        
        Args:
            milestone: 里程碑对象
        """
        # 获取相关人员
        recipients = self._get_reminder_recipients(milestone)
        
        if not recipients:
            return
        
        # 计算剩余天数
        days_left = (milestone.planned_date - timezone.now().date()).days
        
        # 构建消息内容
        title = f'工程里程碑提醒：{milestone.name}'
        content = (
            f'工程单 {milestone.construction_order.order_no} '
            f'({milestone.construction_order.store_name}) '
            f'的里程碑 "{milestone.name}" 将于 {milestone.planned_date} 到期'
        )
        
        if days_left == 0:
            content += '（今天）'
        elif days_left > 0:
            content += f'（还有 {days_left} 天）'
        
        # 创建消息通知
        try:
            from notification.models import Message
            for recipient in recipients:
                Message.objects.create(
                    recipient=recipient,
                    title=title,
                    content=content,
                    message_type='milestone_reminder',
                    link=f'/preparation/construction/{milestone.construction_order.id}/'
                )
        except Exception as e:
            # 记录错误但不影响主流程
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'创建里程碑提醒消息失败: {str(e)}')
    
    def _get_reminder_recipients(self, milestone):
        """
        获取提醒接收人列表
        
        Args:
            milestone: 里程碑对象
            
        Returns:
            list: 用户对象列表
        """
        recipients = []
        
        # 添加工程单创建人
        if milestone.construction_order.created_by:
            recipients.append(milestone.construction_order.created_by)
        
        # 可以根据需要添加其他相关人员
        # 例如：商务负责人、部门负责人等
        
        return recipients
    
    def check_overdue_milestones(self):
        """
        检查并更新逾期的里程碑状态
        
        Returns:
            int: 更新的里程碑数量
        """
        today = timezone.now().date()
        
        # 查询已逾期但状态不是已完成的里程碑
        overdue_milestones = Milestone.objects.filter(
            Q(status=Milestone.STATUS_PENDING) | Q(status=Milestone.STATUS_IN_PROGRESS),
            planned_date__lt=today
        )
        
        # 更新状态为已延期
        updated_count = overdue_milestones.update(status=Milestone.STATUS_DELAYED)
        
        return updated_count
