"""
消息通知服务

提供站内消息发送和企业微信消息推送功能
"""

import logging
from typing import List, Optional, Union
from django.conf import settings
from django.contrib.auth import get_user_model
from ..models import Message

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationService:
    """通知服务"""
    
    @staticmethod
    def send_notification(
        recipients: Union[List[User], User], 
        title: str, 
        content: str, 
        link: Optional[str] = None, 
        notification_type: str = 'system', 
        send_wechat: bool = False
    ) -> List[Message]:
        """
        发送通知
        
        Args:
            recipients: 接收人列表或单个接收人
            title: 通知标题
            content: 通知内容
            link: 跳转链接
            notification_type: 通知类型
            send_wechat: 是否同时发送企业微信通知
            
        Returns:
            List[Message]: 创建的消息列表
        """
        # 确保 recipients 是列表
        if isinstance(recipients, User):
            recipients = [recipients]
        
        # 创建站内消息
        messages = []
        for recipient in recipients:
            try:
                message = Message.objects.create(
                    recipient=recipient,
                    title=title,
                    content=content,
                    message_type=notification_type,
                    link=link
                )
                messages.append(message)
                logger.info(f"站内消息发送成功: {recipient.get_full_name()} - {title}")
            except Exception as e:
                logger.error(f"站内消息发送失败: {recipient.get_full_name()} - {title}, 错误: {str(e)}")
        
        # 发送企业微信通知
        if send_wechat:
            try:
                NotificationService._send_wechat_notification(recipients, title, content)
            except Exception as e:
                logger.error(f"企业微信消息发送失败: {str(e)}")
        
        return messages
    
    @staticmethod
    def _send_wechat_notification(recipients: List[User], title: str, content: str):
        """
        发送企业微信通知
        
        Args:
            recipients: 接收人列表
            title: 通知标题
            content: 通知内容
        """
        # 过滤出有企业微信用户ID的用户
        wechat_user_ids = [
            user.wechat_user_id 
            for user in recipients 
            if hasattr(user, 'wechat_user_id') and user.wechat_user_id
        ]
        
        if not wechat_user_ids:
            logger.warning("没有找到有效的企业微信用户ID，跳过企业微信消息发送")
            return
        
        try:
            # 导入企业微信消息服务（避免循环导入）
            from wechat_integration.services import WechatMessageService
            
            # 发送文本消息
            WechatMessageService.send_text_message(
                user_ids=wechat_user_ids,
                content=f"{title}\n{content}"
            )
            logger.info(f"企业微信消息发送成功，接收人数: {len(wechat_user_ids)}")
        except ImportError:
            logger.warning("企业微信集成模块未找到，跳过企业微信消息发送")
        except Exception as e:
            logger.error(f"企业微信消息发送失败: {str(e)}")
    
    @staticmethod
    def get_unread_count(user: User) -> int:
        """
        获取用户未读消息数量
        
        Args:
            user: 用户对象
            
        Returns:
            int: 未读消息数量
        """
        return Message.objects.filter(recipient=user, is_read=False).count()
    
    @staticmethod
    def mark_message_as_read(message_id: int, user: User) -> bool:
        """
        标记消息为已读
        
        Args:
            message_id: 消息ID
            user: 用户对象
            
        Returns:
            bool: 是否成功标记
        """
        try:
            message = Message.objects.get(id=message_id, recipient=user)
            message.mark_as_read()
            return True
        except Message.DoesNotExist:
            logger.warning(f"消息不存在或无权限: message_id={message_id}, user={user.username}")
            return False
        except Exception as e:
            logger.error(f"标记消息已读失败: {str(e)}")
            return False
    
    @staticmethod
    def mark_all_as_read(user: User) -> int:
        """
        标记用户所有消息为已读
        
        Args:
            user: 用户对象
            
        Returns:
            int: 标记的消息数量
        """
        try:
            from django.utils import timezone
            
            updated_count = Message.objects.filter(
                recipient=user, 
                is_read=False
            ).update(
                is_read=True,
                read_at=timezone.now()
            )
            
            logger.info(f"用户 {user.get_full_name()} 标记了 {updated_count} 条消息为已读")
            return updated_count
        except Exception as e:
            logger.error(f"批量标记消息已读失败: {str(e)}")
            return 0
    
    @staticmethod
    def send_approval_notification(
        approvers: List[User], 
        approval_title: str, 
        approval_id: int,
        notification_type: str = 'approval_pending'
    ):
        """
        发送审批通知
        
        Args:
            approvers: 审批人列表
            approval_title: 审批标题
            approval_id: 审批ID
            notification_type: 通知类型
        """
        title = f"待审批：{approval_title}"
        content = "您有一个新的审批需要处理"
        link = f"/approval/detail/{approval_id}/"
        
        NotificationService.send_notification(
            recipients=approvers,
            title=title,
            content=content,
            link=link,
            notification_type=notification_type,
            send_wechat=True  # 审批通知同时发送企业微信
        )
    
    @staticmethod
    def send_milestone_reminder(
        recipients: List[User], 
        milestone_name: str, 
        construction_order_id: int,
        planned_date: str
    ):
        """
        发送里程碑提醒
        
        Args:
            recipients: 接收人列表
            milestone_name: 里程碑名称
            construction_order_id: 工程单ID
            planned_date: 计划日期
        """
        title = f"工程里程碑提醒：{milestone_name}"
        content = f"里程碑 {milestone_name} 将于 {planned_date} 到期"
        link = f"/preparation/construction/{construction_order_id}/"
        
        NotificationService.send_notification(
            recipients=recipients,
            title=title,
            content=content,
            link=link,
            notification_type='milestone_reminder',
            send_wechat=True
        )
    
    @staticmethod
    def send_contract_reminder(
        recipients: List[User], 
        contract_info: dict, 
        follow_up_id: int
    ):
        """
        发送合同提醒
        
        Args:
            recipients: 接收人列表
            contract_info: 合同信息
            follow_up_id: 跟进单ID
        """
        title = f"合同提醒：{contract_info.get('contract_name', '合同')}"
        content = f"合同即将到期，请及时处理"
        link = f"/expansion/follow-ups/{follow_up_id}/"
        
        NotificationService.send_notification(
            recipients=recipients,
            title=title,
            content=content,
            link=link,
            notification_type='contract_reminder',
            send_wechat=True
        )