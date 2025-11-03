"""
企业微信集成模块基础测试
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import WechatDepartment, WechatUser, WechatSyncLog, WechatMessage

User = get_user_model()


class WechatIntegrationModelsTest(TestCase):
    """企业微信集成模型测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username='testuser',
            wechat_user_id='test_wechat_id',
            phone='13800138000'
        )
    
    def test_wechat_department_creation(self):
        """测试企业微信部门创建"""
        dept = WechatDepartment.objects.create(
            wechat_dept_id=1,
            name='测试部门',
            sync_status='pending'
        )
        
        self.assertEqual(dept.wechat_dept_id, 1)
        self.assertEqual(dept.name, '测试部门')
        self.assertEqual(dept.sync_status, 'pending')
        self.assertEqual(str(dept), '测试部门 (1)')
    
    def test_wechat_user_creation(self):
        """测试企业微信用户创建"""
        user = WechatUser.objects.create(
            wechat_user_id='test_user_001',
            name='测试用户',
            mobile='13800138001',
            sync_status='pending'
        )
        
        self.assertEqual(user.wechat_user_id, 'test_user_001')
        self.assertEqual(user.name, '测试用户')
        self.assertEqual(user.mobile, '13800138001')
        self.assertEqual(user.sync_status, 'pending')
        self.assertEqual(str(user), '测试用户 (test_user_001)')
    
    def test_wechat_sync_log_creation(self):
        """测试企业微信同步日志创建"""
        log = WechatSyncLog.objects.create(
            sync_type='department',
            status='running',
            triggered_by=self.user
        )
        
        self.assertEqual(log.sync_type, 'department')
        self.assertEqual(log.status, 'running')
        self.assertEqual(log.triggered_by, self.user)
        self.assertEqual(log.total_count, 0)
        self.assertEqual(log.success_count, 0)
        self.assertEqual(log.failed_count, 0)
    
    def test_wechat_message_creation(self):
        """测试企业微信消息创建"""
        message = WechatMessage.objects.create(
            message_type='text',
            content='测试消息内容',
            status='pending'
        )
        
        self.assertEqual(message.message_type, 'text')
        self.assertEqual(message.content, '测试消息内容')
        self.assertEqual(message.status, 'pending')
        self.assertEqual(message.to_users, [])
        self.assertEqual(message.to_departments, [])
        self.assertEqual(message.to_tags, [])
    
    def test_sync_log_methods(self):
        """测试同步日志方法"""
        log = WechatSyncLog.objects.create(
            sync_type='user',
            status='running'
        )
        
        # 测试增加成功计数
        log.add_success(5)
        self.assertEqual(log.success_count, 5)
        
        # 测试增加失败计数
        log.add_failed(2)
        self.assertEqual(log.failed_count, 2)
        
        # 测试标记完成
        log.mark_completed('success')
        self.assertEqual(log.status, 'success')
        self.assertIsNotNone(log.completed_at)
    
    def test_message_methods(self):
        """测试消息方法"""
        message = WechatMessage.objects.create(
            message_type='textcard',
            title='测试标题',
            content='测试内容',
            status='pending'
        )
        
        # 测试标记发送成功
        message.mark_sent('msg_12345')
        self.assertEqual(message.status, 'sent')
        self.assertEqual(message.wechat_msg_id, 'msg_12345')
        self.assertIsNotNone(message.sent_at)
        
        # 创建另一个消息测试失败
        message2 = WechatMessage.objects.create(
            message_type='text',
            content='测试内容2',
            status='pending'
        )
        
        # 测试标记发送失败
        message2.mark_failed('发送失败')
        self.assertEqual(message2.status, 'failed')
        self.assertEqual(message2.error_message, '发送失败')