"""
企业微信消息服务
"""
import logging
from typing import List, Optional, Dict, Any
from django.utils import timezone
from django.contrib.auth import get_user_model

from ..models import WechatMessage, WechatUser
from .wechat_client import WechatClient, WechatAPIError


logger = logging.getLogger(__name__)
User = get_user_model()


class WechatMessageService:
    """企业微信消息服务"""
    
    def __init__(self):
        self.client = WechatClient()
    
    def send_text_message(self,
                         content: str,
                         to_users: Optional[List[str]] = None,
                         to_departments: Optional[List[int]] = None,
                         to_tags: Optional[List[int]] = None,
                         business_type: str = '',
                         business_id: Optional[int] = None) -> WechatMessage:
        """
        发送文本消息
        
        Args:
            content: 消息内容
            to_users: 接收用户ID列表（企业微信用户ID）
            to_departments: 接收部门ID列表（企业微信部门ID）
            to_tags: 接收标签ID列表
            business_type: 业务类型
            business_id: 业务ID
            
        Returns:
            WechatMessage: 消息记录
        """
        # 创建消息记录
        message = WechatMessage.objects.create(
            message_type='text',
            to_users=to_users or [],
            to_departments=to_departments or [],
            to_tags=to_tags or [],
            content=content,
            business_type=business_type,
            business_id=business_id,
            status='pending'
        )
        
        try:
            # 发送消息
            msg_id = self.client.send_text_message(
                content=content,
                to_users=to_users,
                to_departments=to_departments,
                to_tags=to_tags
            )
            
            # 标记发送成功
            message.mark_sent(msg_id)
            logger.info(f"文本消息发送成功: {msg_id}")
            
        except WechatAPIError as e:
            # 标记发送失败
            message.mark_failed(str(e))
            logger.error(f"文本消息发送失败: {e}")
        
        return message
    
    def send_textcard_message(self,
                             title: str,
                             description: str,
                             url: str,
                             btntxt: str = "详情",
                             to_users: Optional[List[str]] = None,
                             to_departments: Optional[List[int]] = None,
                             to_tags: Optional[List[int]] = None,
                             business_type: str = '',
                             business_id: Optional[int] = None) -> WechatMessage:
        """
        发送文本卡片消息
        
        Args:
            title: 标题
            description: 描述
            url: 跳转链接
            btntxt: 按钮文字
            to_users: 接收用户ID列表（企业微信用户ID）
            to_departments: 接收部门ID列表（企业微信部门ID）
            to_tags: 接收标签ID列表
            business_type: 业务类型
            business_id: 业务ID
            
        Returns:
            WechatMessage: 消息记录
        """
        # 创建消息记录
        message = WechatMessage.objects.create(
            message_type='textcard',
            to_users=to_users or [],
            to_departments=to_departments or [],
            to_tags=to_tags or [],
            title=title,
            content=description,
            url=url,
            business_type=business_type,
            business_id=business_id,
            status='pending'
        )
        
        try:
            # 发送消息
            msg_id = self.client.send_textcard_message(
                title=title,
                description=description,
                url=url,
                btntxt=btntxt,
                to_users=to_users,
                to_departments=to_departments,
                to_tags=to_tags
            )
            
            # 标记发送成功
            message.mark_sent(msg_id)
            logger.info(f"文本卡片消息发送成功: {msg_id}")
            
        except WechatAPIError as e:
            # 标记发送失败
            message.mark_failed(str(e))
            logger.error(f"文本卡片消息发送失败: {e}")
        
        return message
    
    def send_to_local_users(self,
                           message_type: str,
                           content: str,
                           local_user_ids: List[int],
                           title: str = '',
                           url: str = '',
                           business_type: str = '',
                           business_id: Optional[int] = None) -> WechatMessage:
        """
        向本地用户发送消息（通过企业微信用户ID）
        
        Args:
            message_type: 消息类型 ('text' 或 'textcard')
            content: 消息内容
            local_user_ids: 本地用户ID列表
            title: 消息标题（文本卡片消息需要）
            url: 跳转链接（文本卡片消息需要）
            business_type: 业务类型
            business_id: 业务ID
            
        Returns:
            WechatMessage: 消息记录
        """
        # 获取企业微信用户ID
        wechat_user_ids = []
        users = User.objects.filter(id__in=local_user_ids, wechat_user_id__isnull=False)
        
        for user in users:
            if user.wechat_user_id:
                wechat_user_ids.append(user.wechat_user_id)
        
        if not wechat_user_ids:
            logger.warning(f"没有找到有效的企业微信用户ID，本地用户ID: {local_user_ids}")
            # 创建失败的消息记录
            message = WechatMessage.objects.create(
                message_type=message_type,
                to_users=[],
                content=content,
                title=title,
                url=url,
                business_type=business_type,
                business_id=business_id,
                status='failed',
                error_message='没有找到有效的企业微信用户ID'
            )
            return message
        
        # 根据消息类型发送
        if message_type == 'textcard' and title and url:
            return self.send_textcard_message(
                title=title,
                description=content,
                url=url,
                to_users=wechat_user_ids,
                business_type=business_type,
                business_id=business_id
            )
        else:
            return self.send_text_message(
                content=content,
                to_users=wechat_user_ids,
                business_type=business_type,
                business_id=business_id
            )
    
    def send_to_departments(self,
                           message_type: str,
                           content: str,
                           department_ids: List[int],
                           title: str = '',
                           url: str = '',
                           business_type: str = '',
                           business_id: Optional[int] = None) -> WechatMessage:
        """
        向部门发送消息
        
        Args:
            message_type: 消息类型 ('text' 或 'textcard')
            content: 消息内容
            department_ids: 本地部门ID列表
            title: 消息标题（文本卡片消息需要）
            url: 跳转链接（文本卡片消息需要）
            business_type: 业务类型
            business_id: 业务ID
            
        Returns:
            WechatMessage: 消息记录
        """
        from system_management.models import Department
        
        # 获取企业微信部门ID
        wechat_dept_ids = []
        departments = Department.objects.filter(id__in=department_ids, wechat_dept_id__isnull=False)
        
        for dept in departments:
            if dept.wechat_dept_id:
                wechat_dept_ids.append(dept.wechat_dept_id)
        
        if not wechat_dept_ids:
            logger.warning(f"没有找到有效的企业微信部门ID，本地部门ID: {department_ids}")
            # 创建失败的消息记录
            message = WechatMessage.objects.create(
                message_type=message_type,
                to_departments=[],
                content=content,
                title=title,
                url=url,
                business_type=business_type,
                business_id=business_id,
                status='failed',
                error_message='没有找到有效的企业微信部门ID'
            )
            return message
        
        # 根据消息类型发送
        if message_type == 'textcard' and title and url:
            return self.send_textcard_message(
                title=title,
                description=content,
                url=url,
                to_departments=wechat_dept_ids,
                business_type=business_type,
                business_id=business_id
            )
        else:
            return self.send_text_message(
                content=content,
                to_departments=wechat_dept_ids,
                business_type=business_type,
                business_id=business_id
            )
    
    def send_approval_notification(self,
                                  approval_title: str,
                                  approval_content: str,
                                  approval_url: str,
                                  approver_ids: List[int],
                                  approval_id: int) -> WechatMessage:
        """
        发送审批通知
        
        Args:
            approval_title: 审批标题
            approval_content: 审批内容
            approval_url: 审批链接
            approver_ids: 审批人ID列表（本地用户ID）
            approval_id: 审批ID
            
        Returns:
            WechatMessage: 消息记录
        """
        return self.send_to_local_users(
            message_type='textcard',
            content=approval_content,
            local_user_ids=approver_ids,
            title=f"【待审批】{approval_title}",
            url=approval_url,
            business_type='approval',
            business_id=approval_id
        )
    
    def send_milestone_reminder(self,
                               milestone_name: str,
                               store_name: str,
                               due_date: str,
                               reminder_url: str,
                               recipient_ids: List[int],
                               construction_order_id: int) -> WechatMessage:
        """
        发送里程碑提醒
        
        Args:
            milestone_name: 里程碑名称
            store_name: 门店名称
            due_date: 到期日期
            reminder_url: 提醒链接
            recipient_ids: 接收人ID列表（本地用户ID）
            construction_order_id: 工程单ID
            
        Returns:
            WechatMessage: 消息记录
        """
        content = f"门店：{store_name}\n里程碑：{milestone_name}\n到期时间：{due_date}\n请及时处理相关事项。"
        
        return self.send_to_local_users(
            message_type='textcard',
            content=content,
            local_user_ids=recipient_ids,
            title=f"【里程碑提醒】{milestone_name}",
            url=reminder_url,
            business_type='milestone',
            business_id=construction_order_id
        )
    
    def send_contract_reminder(self,
                              contract_type: str,
                              store_name: str,
                              reminder_content: str,
                              reminder_url: str,
                              recipient_ids: List[int],
                              follow_up_id: int) -> WechatMessage:
        """
        发送合同提醒
        
        Args:
            contract_type: 合同类型
            store_name: 门店名称
            reminder_content: 提醒内容
            reminder_url: 提醒链接
            recipient_ids: 接收人ID列表（本地用户ID）
            follow_up_id: 跟进单ID
            
        Returns:
            WechatMessage: 消息记录
        """
        content = f"门店：{store_name}\n合同类型：{contract_type}\n{reminder_content}"
        
        return self.send_to_local_users(
            message_type='textcard',
            content=content,
            local_user_ids=recipient_ids,
            title=f"【合同提醒】{contract_type}",
            url=reminder_url,
            business_type='contract',
            business_id=follow_up_id
        )
    
    def retry_failed_messages(self) -> Dict[str, int]:
        """
        重试发送失败的消息
        
        Returns:
            Dict[str, int]: 重试结果统计
        """
        failed_messages = WechatMessage.objects.filter(status='failed')
        
        success_count = 0
        still_failed_count = 0
        
        for message in failed_messages:
            try:
                if message.message_type == 'textcard':
                    msg_id = self.client.send_textcard_message(
                        title=message.title,
                        description=message.content,
                        url=message.url,
                        to_users=message.to_users,
                        to_departments=message.to_departments,
                        to_tags=message.to_tags
                    )
                else:
                    msg_id = self.client.send_text_message(
                        content=message.content,
                        to_users=message.to_users,
                        to_departments=message.to_departments,
                        to_tags=message.to_tags
                    )
                
                message.mark_sent(msg_id)
                success_count += 1
                logger.info(f"重试发送消息成功: {message.id}")
                
            except WechatAPIError as e:
                message.mark_failed(str(e))
                still_failed_count += 1
                logger.error(f"重试发送消息失败: {message.id}, 错误: {e}")
        
        return {
            'success_count': success_count,
            'failed_count': still_failed_count,
            'total_count': len(failed_messages)
        }