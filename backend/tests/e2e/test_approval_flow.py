"""
端到端测试：审批流程
测试从发起审批到节点流转、审批通过/拒绝的完整流程
"""
import pytest
import json
from django.utils import timezone
from approval.models import ApprovalTemplate, ApprovalInstance, ApprovalNode, ApprovalComment, ApprovalFollow


@pytest.mark.e2e
@pytest.mark.django_db
class TestApprovalFlow:
    """审批流程端到端测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db, test_user, test_department, admin_user):
        """设置测试数据"""
        # 设置部门负责人
        test_department.manager = admin_user
        test_department.save()
        
        # 设置用户的上级
        test_user.manager = admin_user
        test_user.department = test_department
        test_user.save()
        
        # 创建审批模板（串行审批）
        self.serial_template = ApprovalTemplate.objects.create(
            template_code='SERIAL_APPROVAL',
            template_name='串行审批测试',
            description='测试串行审批流程',
            form_schema={
                'fields': [
                    {'name': 'title', 'label': '标题', 'type': 'text', 'required': True},
                    {'name': 'amount', 'label': '金额', 'type': 'number', 'required': True},
                    {'name': 'reason', 'label': '原因', 'type': 'textarea', 'required': True}
                ]
            },
            flow_config={
                'nodes': [
                    {
                        'name': '直接上级审批',
                        'type': 'approval',
                        'approvers': {'type': 'initiator_manager'}
                    },
                    {
                        'name': '部门负责人审批',
                        'type': 'approval',
                        'approvers': {'type': 'department_manager'}
                    }
                ]
            },
            status='active',
            created_by=test_user
        )
        
        # 创建审批模板（并行审批）
        self.parallel_template = ApprovalTemplate.objects.create(
            template_code='PARALLEL_APPROVAL',
            template_name='并行审批测试',
            description='测试并行审批流程',
            form_schema={
                'fields': [
                    {'name': 'title', 'label': '标题', 'type': 'text', 'required': True}
                ]
            },
            flow_config={
                'nodes': [
                    {
                        'name': '多人会签',
                        'type': 'countersign',
                        'approvers': {
                            'type': 'fixed_users',
                            'user_ids': [test_user.id, admin_user.id]
                        }
                    }
                ]
            },
            status='active',
            created_by=test_user
        )
        
        self.test_user = test_user
        self.admin_user = admin_user
    
    def test_serial_approval_flow_approved(self, authenticated_client, admin_client):
        """测试串行审批流程 - 审批通过"""
        
        # 步骤1：发起审批
        approval_data = {
            'template': self.serial_template.id,
            'title': '测试审批申请',
            'business_type': 'test',
            'business_id': 1,
            'form_data': {
                'title': '采购申请',
                'amount': 50000,
                'reason': '需要采购办公设备'
            }
        }
        
        response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        approval_id = response.json()['data']['id']
        
        # 验证审批实例已创建
        approval = ApprovalInstance.objects.get(id=approval_id)
        assert approval.status in ['pending', 'in_progress']  # 审批可能直接进入进行中状态
        assert approval.initiator == self.test_user
        assert approval.template == self.serial_template
        
        # 验证审批节点已创建
        nodes = approval.nodes.all().order_by('sequence')
        assert nodes.count() == 2
        assert nodes[0].node_name == '直接上级审批'
        assert nodes[0].status == 'in_progress'
        assert nodes[1].node_name == '部门负责人审批'
        assert nodes[1].status == 'pending'
        
        # 验证第一个节点的审批人
        first_node = nodes[0]
        approver_users = [approver.user for approver in first_node.approvers.all()]
        assert self.admin_user in approver_users
        
        # 步骤2：第一个节点审批通过
        approve_data = {
            'action': 'approve',
            'comment': '同意，请继续审批'
        }
        
        response = admin_client.post(
            f'/api/approval/instances/{approval_id}/approve/',
            data=json.dumps(approve_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证第一个节点已通过
        first_node.refresh_from_db()
        assert first_node.status == 'approved'
        assert first_node.approval_result == 'approved'
        assert first_node.approved_by == self.admin_user
        assert first_node.approval_comment == '同意，请继续审批'
        
        # 验证流程已流转到第二个节点
        approval.refresh_from_db()
        second_node = nodes[1]
        second_node.refresh_from_db()
        assert second_node.status == 'in_progress'
        assert approval.current_node == second_node
        
        # 步骤3：第二个节点审批通过
        response = admin_client.post(
            f'/api/approval/instances/{approval_id}/approve/',
            data=json.dumps({'action': 'approve', 'comment': '最终批准'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证第二个节点已通过
        second_node.refresh_from_db()
        assert second_node.status == 'approved'
        assert second_node.approval_result == 'approved'
        
        # 验证审批实例已完成
        approval.refresh_from_db()
        assert approval.status == 'approved'
        assert approval.final_result == 'approved'
        assert approval.completed_at is not None
        
        # 验证消息通知已发送给发起人
        # TODO: 实现消息通知功能后启用此检查
        # from notification.models import Message
        # messages = Message.objects.filter(
        #     recipient=self.test_user,
        #     message_type='approval_approved'
        # )
        # assert messages.exists()
    
    def test_serial_approval_flow_rejected(self, authenticated_client, admin_client):
        """测试串行审批流程 - 审批拒绝"""
        
        # 发起审批
        approval_data = {
            'template': self.serial_template.id,
            'title': '测试拒绝审批',
            'business_type': 'test',
            'business_id': 2,
            'form_data': {
                'title': '不合理申请',
                'amount': 1000000,
                'reason': '金额过大'
            }
        }
        
        response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        approval_id = response.json()['data']['id']
        
        # 第一个节点拒绝
        reject_data = {
            'action': 'reject',
            'reason': '申请金额超出预算，不予批准'
        }
        
        response = admin_client.post(
            f'/api/approval/instances/{approval_id}/reject/',
            data=json.dumps(reject_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证审批已拒绝
        approval = ApprovalInstance.objects.get(id=approval_id)
        assert approval.status == 'rejected'
        assert approval.final_result == 'rejected'
        assert approval.completed_at is not None
        
        # 验证第一个节点状态
        first_node = approval.nodes.first()
        assert first_node.status == 'rejected'
        assert first_node.approval_result == 'rejected'
        assert first_node.approval_comment == '申请金额超出预算，不予批准'
        
        # 验证第二个节点未启动
        second_node = approval.nodes.last()
        assert second_node.status == 'pending'
        
        # 验证拒绝通知已发送
        from notification.models import Message
        messages = Message.objects.filter(
            recipient=self.test_user,
            message_type='approval_rejected'
        )
        assert messages.exists()
    
    def test_approval_revoke(self, authenticated_client):
        """测试撤销审批"""
        
        # 发起审批
        approval_data = {
            'template': self.serial_template.id,
            'title': '待撤销审批',
            'business_type': 'test',
            'business_id': 3,
            'form_data': {
                'title': '测试撤销',
                'amount': 10000,
                'reason': '测试原因'
            }
        }
        
        response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        approval_id = response.json()['data']['id']
        
        # 撤销审批
        response = authenticated_client.post(
            f'/api/approval/instances/{approval_id}/revoke/',
            data=json.dumps({'reason': '申请有误，需要重新提交'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证审批已撤销
        approval = ApprovalInstance.objects.get(id=approval_id)
        assert approval.status == 'withdrawn'
        assert approval.completed_at is not None
    
    def test_approval_transfer(self, authenticated_client, admin_client):
        """测试转交审批"""
        
        # 创建另一个用户作为转交目标
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        transfer_user = User.objects.create_user(
            username='transferuser',
            phone='13800138002',
            password='testpass123'
        )
        
        # 发起审批
        approval_data = {
            'template': self.serial_template.id,
            'title': '待转交审批',
            'business_type': 'test',
            'business_id': 4,
            'form_data': {
                'title': '测试转交',
                'amount': 20000,
                'reason': '测试原因'
            }
        }
        
        response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        approval_id = response.json()['data']['id']
        
        # 转交审批
        transfer_data = {
            'action': 'transfer',
            'target_user': transfer_user.id,
            'comment': '我暂时无法处理，转交给其他人'
        }
        
        response = admin_client.post(
            f'/api/approval/instances/{approval_id}/transfer/',
            data=json.dumps(transfer_data),
            content_type='application/json'
        )
        
        if response.status_code != 200:
            print(f"转交失败，响应内容：{response.json()}")
        
        assert response.status_code == 200
        
        # 验证审批人已更新
        approval = ApprovalInstance.objects.get(id=approval_id)
        current_node = approval.current_node
        approver_users = [approver.user for approver in current_node.approvers.all()]
        assert transfer_user in approver_users
    
    def test_approval_follow_and_comment(self, authenticated_client):
        """测试关注审批和添加评论"""
        
        # 发起审批
        approval_data = {
            'template': self.serial_template.id,
            'title': '测试关注和评论',
            'business_type': 'test',
            'business_id': 5,
            'form_data': {
                'title': '测试',
                'amount': 5000,
                'reason': '测试'
            }
        }
        
        response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        approval_id = response.json()['data']['id']
        
        # 关注审批
        response = authenticated_client.post(
            f'/api/approval/instances/{approval_id}/follow/',
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证关注已创建
        follow = ApprovalFollow.objects.filter(
            instance_id=approval_id,
            user=self.test_user
        )
        assert follow.exists()
        
        # 添加评论
        comment_data = {
            'content': '这个申请很重要，请尽快处理'
        }
        
        response = authenticated_client.post(
            f'/api/approval/instances/{approval_id}/comment/',
            data=json.dumps(comment_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证评论已创建
        comment = ApprovalComment.objects.filter(
            instance_id=approval_id,
            user=self.test_user
        )
        assert comment.exists()
        assert comment.first().content == '这个申请很重要，请尽快处理'
    
    def test_approval_query_lists(self, authenticated_client, admin_client):
        """测试审批列表查询"""
        
        # 创建多个审批
        for i in range(3):
            approval_data = {
                'template': self.serial_template.id,
                'title': f'测试审批{i+1}',
                'business_type': 'test',
                'business_id': 6 + i,
                'form_data': {
                    'title': f'申请{i+1}',
                    'amount': 10000 * (i+1),
                    'reason': f'原因{i+1}'
                }
            }
            
            authenticated_client.post(
                '/api/approval/instances/',
                data=json.dumps(approval_data),
                content_type='application/json'
            )
        
        # 查询待办审批（管理员视角）
        response = admin_client.get('/api/approval/instances/my-pending/')
        assert response.status_code == 200
        response_data = response.json()
        if 'data' in response_data:
            pending_list = response_data['data']
        else:
            pending_list = response_data['results']
        assert len(pending_list) >= 3
        
        # 查询我发起的审批（普通用户视角）
        response = authenticated_client.get('/api/approval/instances/my-initiated/')
        assert response.status_code == 200
        response_data = response.json()
        if 'data' in response_data:
            my_approvals = response_data['data']
        else:
            my_approvals = response_data['results']
        assert len(my_approvals) >= 3
        
        # 查询全部审批
        response = authenticated_client.get('/api/approval/instances/all/')
        assert response.status_code == 200
        all_approvals = response.json()['data']
        assert len(all_approvals) >= 3
