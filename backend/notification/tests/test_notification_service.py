"""
消息通知服务测试
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import Message
from ..services import NotificationService

User = get_user_model()


class NotificationServiceTest(TestCase):
    """消息通知服务测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user1 = User.objects.create_user(
            username='test1',
            first_name='测试',
            last_name='用户1',
            phone='13800000001',
            wechat_user_id='wechat_test1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='test2',
            first_name='测试',
            last_name='用户2',
            phone='13800000002',
            wechat_user_id='wechat_test2',
            password='testpass123'
        )
    
    def test_send_notification_single_user(self):
        """测试发送单用户通知"""
        messages = NotificationService.send_notification(
            recipients=self.user1,
            title='测试通知',
            content='这是一条测试通知',
            notification_type='system'
        )
        
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0].recipient, self.user1)
        self.assertEqual(messages[0].title, '测试通知')
        self.assertEqual(messages[0].content, '这是一条测试通知')
        self.assertEqual(messages[0].message_type, 'system')
        self.assertFalse(messages[0].is_read)
    
    def test_send_notification_multiple_users(self):
        """测试发送多用户通知"""
        recipients = [self.user1, self.user2]
        messages = NotificationService.send_notification(
            recipients=recipients,
            title='批量通知',
            content='这是一条批量通知',
            link='/test/link/',
            notification_type='approval_pending'
        )
        
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].recipient, self.user1)
        self.assertEqual(messages[1].recipient, self.user2)
        
        for message in messages:
            self.assertEqual(message.title, '批量通知')
            self.assertEqual(message.content, '这是一条批量通知')
            self.assertEqual(message.link, '/test/link/')
            self.assertEqual(message.message_type, 'approval_pending')
    
    def test_get_unread_count(self):
        """测试获取未读消息数量"""
        # 创建一些消息
        NotificationService.send_notification(
            recipients=self.user1,
            title='消息1',
            content='内容1'
        )
        NotificationService.send_notification(
            recipients=self.user1,
            title='消息2',
            content='内容2'
        )
        
        # 测试未读数量
        count = NotificationService.get_unread_count(self.user1)
        self.assertEqual(count, 2)
        
        # 标记一条为已读
        message = Message.objects.filter(recipient=self.user1).first()
        message.mark_as_read()
        
        # 再次测试未读数量
        count = NotificationService.get_unread_count(self.user1)
        self.assertEqual(count, 1)
    
    def test_mark_message_as_read(self):
        """测试标记消息为已读"""
        messages = NotificationService.send_notification(
            recipients=self.user1,
            title='测试消息',
            content='测试内容'
        )
        
        message_id = messages[0].id
        
        # 标记为已读
        success = NotificationService.mark_message_as_read(message_id, self.user1)
        self.assertTrue(success)
        
        # 验证已读状态
        message = Message.objects.get(id=message_id)
        self.assertTrue(message.is_read)
        self.assertIsNotNone(message.read_at)
    
    def test_mark_all_as_read(self):
        """测试标记所有消息为已读"""
        # 创建多条消息
        for i in range(3):
            NotificationService.send_notification(
                recipients=self.user1,
                title=f'消息{i+1}',
                content=f'内容{i+1}'
            )
        
        # 标记所有为已读
        count = NotificationService.mark_all_as_read(self.user1)
        self.assertEqual(count, 3)
        
        # 验证所有消息都已读
        unread_count = NotificationService.get_unread_count(self.user1)
        self.assertEqual(unread_count, 0)
    
    def test_send_approval_notification(self):
        """测试发送审批通知"""
        approvers = [self.user1, self.user2]
        
        NotificationService.send_approval_notification(
            approvers=approvers,
            approval_title='报店审批',
            approval_id=123
        )
        
        # 验证消息创建
        messages = Message.objects.filter(message_type='approval_pending')
        self.assertEqual(messages.count(), 2)
        
        for message in messages:
            self.assertEqual(message.title, '待审批：报店审批')
            self.assertEqual(message.content, '您有一个新的审批需要处理')
            self.assertEqual(message.link, '/approval/detail/123/')
    
    def test_send_milestone_reminder(self):
        """测试发送里程碑提醒"""
        recipients = [self.user1]
        
        NotificationService.send_milestone_reminder(
            recipients=recipients,
            milestone_name='基础施工完成',
            construction_order_id=456,
            planned_date='2023-12-01'
        )
        
        # 验证消息创建
        message = Message.objects.get(message_type='milestone_reminder')
        self.assertEqual(message.title, '工程里程碑提醒：基础施工完成')
        self.assertEqual(message.content, '里程碑 基础施工完成 将于 2023-12-01 到期')
        self.assertEqual(message.link, '/preparation/construction/456/')
    
    def test_message_mark_as_read_method(self):
        """测试消息模型的标记已读方法"""
        message = Message.objects.create(
            recipient=self.user1,
            title='测试消息',
            content='测试内容',
            message_type='system'
        )
        
        # 初始状态
        self.assertFalse(message.is_read)
        self.assertIsNone(message.read_at)
        
        # 标记为已读
        message.mark_as_read()
        
        # 验证状态
        self.assertTrue(message.is_read)
        self.assertIsNotNone(message.read_at)