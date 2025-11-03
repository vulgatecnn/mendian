"""
审批流程引擎测试
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from approval.models import ApprovalTemplate, ApprovalInstance
from approval.services.flow_engine import ApprovalFlowEngine

User = get_user_model()


class ApprovalFlowEngineTest(TestCase):
    """审批流程引擎测试"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # 创建测试模板
        self.template = ApprovalTemplate.objects.create(
            template_code='TEST_APPROVAL',
            template_name='测试审批',
            description='测试审批模板',
            form_schema={
                'type': 'object',
                'properties': {
                    'title': {'type': 'string', 'title': '标题'},
                    'content': {'type': 'string', 'title': '内容'}
                },
                'required': ['title']
            },
            flow_config={
                'nodes': [
                    {
                        'name': '第一级审批',
                        'type': 'approval',
                        'approvers': {
                            'type': 'fixed_users',
                            'user_ids': [self.user.id]
                        }
                    }
                ]
            },
            status='active',
            created_by=self.user
        )
        
        self.flow_engine = ApprovalFlowEngine()
    
    def test_initiate_approval(self):
        """测试发起审批"""
        form_data = {
            'title': '测试审批标题',
            'content': '测试审批内容'
        }
        
        instance = self.flow_engine.initiate_approval(
            template=self.template,
            form_data=form_data,
            initiator=self.user,
            business_type='test',
            business_id=1
        )
        
        # 验证审批实例创建成功
        self.assertIsNotNone(instance)
        self.assertEqual(instance.template, self.template)
        self.assertEqual(instance.initiator, self.user)
        self.assertEqual(instance.status, 'in_progress')
        self.assertEqual(instance.form_data, form_data)
        
        # 验证审批节点创建成功
        self.assertEqual(instance.nodes.count(), 1)
        first_node = instance.nodes.first()
        self.assertEqual(first_node.status, 'in_progress')
        self.assertEqual(first_node.approvers.count(), 1)
    
    def test_approve_node(self):
        """测试审批通过"""
        # 先创建审批实例
        form_data = {'title': '测试审批'}
        instance = self.flow_engine.initiate_approval(
            template=self.template,
            form_data=form_data,
            initiator=self.user,
            business_type='test',
            business_id=1
        )
        
        # 获取当前节点
        current_node = instance.current_node
        
        # 审批通过
        self.flow_engine.approve(current_node, self.user, '同意')
        
        # 刷新实例数据
        instance.refresh_from_db()
        current_node.refresh_from_db()
        
        # 验证节点状态
        self.assertEqual(current_node.status, 'approved')
        self.assertEqual(current_node.approval_result, 'approved')
        self.assertEqual(current_node.approved_by, self.user)
        
        # 验证实例状态（只有一个节点，应该完成）
        self.assertEqual(instance.status, 'approved')
        self.assertEqual(instance.final_result, 'approved')
        self.assertIsNotNone(instance.completed_at)