"""
审批中心API集成测试

测试审批模板管理、审批流程配置、审批发起、审批处理、审批历史查询等功能
"""
import pytest
import json
from django.test import Client
from django.utils import timezone
from approval.models import ApprovalTemplate, ApprovalInstance, ApprovalNode
from system_management.models import User, Department, Role


@pytest.fixture
def approval_template(db, admin_user):
    """创建测试审批模板"""
    template = ApprovalTemplate.objects.create(
        template_code='TEST_APPROVAL',
        template_name='测试审批模板',
        description='用于测试的审批模板',
        form_schema={
            'fields': [
                {
                    'name': 'title',
                    'label': '标题',
                    'type': 'text',
                    'required': True
                },
                {
                    'name': 'amount',
                    'label': '金额',
                    'type': 'number',
                    'required': True
                }
            ]
        },
        flow_config={
            'nodes': [
                {
                    'name': '部门经理审批',
                    'type': 'approval',
                    'approvers': {
                        'type': 'fixed_users',
                        'user_ids': [admin_user.id]
                    }
                }
            ]
        },
        status='active',
        created_by=admin_user
    )
    return template


@pytest.fixture
def multi_level_template(db, admin_user, test_user):
    """创建多级审批模板"""
    template = ApprovalTemplate.objects.create(
        template_code='MULTI_LEVEL',
        template_name='多级审批模板',
        description='多级审批测试模板',
        form_schema={
            'fields': [
                {'name': 'subject', 'label': '主题', 'type': 'text', 'required': True}
            ]
        },
        flow_config={
            'nodes': [
                {
                    'name': '一级审批',
                    'type': 'approval',
                    'approvers': {'type': 'fixed_users', 'user_ids': [test_user.id]}
                },
                {
                    'name': '二级审批',
                    'type': 'approval',
                    'approvers': {'type': 'fixed_users', 'user_ids': [admin_user.id]}
                }
            ]
        },
        status='active',
        created_by=admin_user
    )
    return template


@pytest.mark.integration
class TestApprovalTemplateAPI:
    """审批模板管理API测试"""
    
    def test_list_templates(self, admin_client, approval_template):
        """测试获取审批模板列表"""
        response = admin_client.get('/api/approval/templates/')
        
        assert response.status_code == 200
        data = response.json()
        assert 'results' in data or isinstance(data, list)
        
        # 验证模板数据
        templates = data.get('results', data) if isinstance(data, dict) else data
        assert len(templates) > 0
        template_codes = [t['template_code'] for t in templates]
        assert 'TEST_APPROVAL' in template_codes

    def test_create_template(self, admin_client, admin_user):
        """测试创建审批模板"""
        template_data = {
            'template_code': 'NEW_TEMPLATE',
            'template_name': '新审批模板',
            'description': '新创建的审批模板',
            'form_schema': {
                'type': 'object',
                'properties': {
                    'reason': {
                        'type': 'string',
                        'title': '原因'
                    }
                },
                'required': ['reason']
            },
            'flow_config': {
                'nodes': [
                    {
                        'name': '审批节点',
                        'type': 'approval',
                        'approvers': {'type': 'fixed_users', 'user_ids': [admin_user.id]}
                    }
                ]
            },
            'status': 'active'
        }
        
        response = admin_client.post(
            '/api/approval/templates/',
            data=json.dumps(template_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['template_code'] == 'NEW_TEMPLATE'
        assert data['template_name'] == '新审批模板'
    
    def test_get_template_detail(self, admin_client, approval_template):
        """测试获取审批模板详情"""
        response = admin_client.get(f'/api/approval/templates/{approval_template.id}/')
        
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == approval_template.id
        assert data['template_code'] == 'TEST_APPROVAL'
        assert 'form_schema' in data
        assert 'flow_config' in data

    def test_update_template(self, admin_client, approval_template):
        """测试更新审批模板"""
        update_data = {
            'template_name': '更新后的模板名称',
            'description': '更新后的描述',
            'status': 'inactive'
        }
        
        response = admin_client.patch(
            f'/api/approval/templates/{approval_template.id}/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['template_name'] == '更新后的模板名称'
        assert data['status'] == 'inactive'
    
    def test_filter_templates_by_status(self, admin_client, approval_template):
        """测试按状态过滤模板"""
        response = admin_client.get('/api/approval/templates/?status=active')
        
        assert response.status_code == 200
        data = response.json()
        templates = data.get('results', data) if isinstance(data, dict) else data
        
        # 验证所有返回的模板都是active状态
        for template in templates:
            assert template['status'] == 'active'


@pytest.mark.integration
class TestApprovalInstanceAPI:
    """审批实例API测试"""
    
    def test_initiate_approval(self, authenticated_client, approval_template, test_user):
        """测试发起审批"""
        approval_data = {
            'template': approval_template.id,
            'title': '测试审批申请',
            'form_data': {
                'title': '采购申请',
                'amount': 5000
            },
            'business_type': 'purchase',
            'business_id': 1
        }

        response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['success'] is True
        assert 'data' in data
        
        instance_data = data['data']
        assert instance_data['title'] == '测试审批申请'
        assert instance_data['status'] == 'in_progress'
        assert instance_data['initiator'] == test_user.id
    
    def test_get_my_pending_approvals(self, admin_client, authenticated_client, approval_template, test_user):
        """测试获取我的待办审批"""
        # 先创建一个审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '待审批测试',
            'form_data': {'title': '测试', 'amount': 1000},
            'business_type': 'test',
            'business_id': 1
        }
        authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        # 使用admin账号查询待办（admin是审批人）
        response = admin_client.get('/api/approval/instances/my-pending/')
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'data' in data
        assert len(data['data']) > 0

    def test_approve_instance(self, admin_client, authenticated_client, approval_template):
        """测试审批通过"""
        # 创建审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '审批通过测试',
            'form_data': {'title': '测试', 'amount': 2000},
            'business_type': 'test',
            'business_id': 2
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # 审批通过
        approve_data = {'comment': '同意'}
        response = admin_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps(approve_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['status'] == 'approved'
    
    def test_reject_instance(self, admin_client, authenticated_client, approval_template):
        """测试审批拒绝"""
        # 创建审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '审批拒绝测试',
            'form_data': {'title': '测试', 'amount': 3000},
            'business_type': 'test',
            'business_id': 3
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']

        # 审批拒绝
        reject_data = {'reason': '不符合要求'}
        response = admin_client.post(
            f'/api/approval/instances/{instance_id}/reject/',
            data=json.dumps(reject_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['status'] == 'rejected'
        assert data['data']['final_result'] == 'rejected'
    
    def test_revoke_instance(self, authenticated_client, approval_template):
        """测试撤销审批"""
        # 创建审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '撤销测试',
            'form_data': {'title': '测试', 'amount': 4000},
            'business_type': 'test',
            'business_id': 4
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # 撤销审批
        revoke_data = {'reason': '信息填写错误'}
        response = authenticated_client.post(
            f'/api/approval/instances/{instance_id}/revoke/',
            data=json.dumps(revoke_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['status'] == 'withdrawn'

    def test_transfer_approval(self, admin_client, authenticated_client, approval_template, test_user):
        """测试转交审批"""
        # 创建审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '转交测试',
            'form_data': {'title': '测试', 'amount': 5000},
            'business_type': 'test',
            'business_id': 5
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # 转交审批
        transfer_data = {
            'target_user_id': test_user.id,
            'reason': '转交给其他人处理'
        }
        response = admin_client.post(
            f'/api/approval/instances/{instance_id}/transfer/',
            data=json.dumps(transfer_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
    
    def test_get_my_initiated_approvals(self, authenticated_client, approval_template):
        """测试获取我发起的审批"""
        # 创建审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '我发起的审批',
            'form_data': {'title': '测试', 'amount': 6000},
            'business_type': 'test',
            'business_id': 6
        }
        authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )

        # 查询我发起的审批
        response = authenticated_client.get('/api/approval/instances/my-initiated/')
        
        assert response.status_code == 200
        data = response.json()
        # 检查返回格式（可能是分页格式或直接返回数据）
        if 'success' in data:
            assert data['success'] is True
            assert len(data['data']) > 0
        else:
            # 分页格式
            assert 'results' in data or isinstance(data, list)
            results = data.get('results', data) if isinstance(data, dict) else data
            assert len(results) > 0
    
    def test_follow_approval(self, authenticated_client, admin_client, approval_template):
        """测试关注审批"""
        # 创建审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '关注测试',
            'form_data': {'title': '测试', 'amount': 7000},
            'business_type': 'test',
            'business_id': 7
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # 关注审批
        response = admin_client.post(f'/api/approval/instances/{instance_id}/follow/')
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['is_following'] is True
    
    def test_add_comment(self, authenticated_client, approval_template):
        """测试添加评论"""
        # 创建审批实例
        approval_data = {
            'template': approval_template.id,
            'title': '评论测试',
            'form_data': {'title': '测试', 'amount': 8000},
            'business_type': 'test',
            'business_id': 8
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']

        # 添加评论
        comment_data = {'content': '这是一条测试评论'}
        response = authenticated_client.post(
            f'/api/approval/instances/{instance_id}/comment/',
            data=json.dumps(comment_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['content'] == '这是一条测试评论'


@pytest.mark.integration
class TestMultiLevelApproval:
    """多级审批流程测试"""
    
    def test_multi_level_approval_flow(self, authenticated_client, admin_client, multi_level_template, test_user):
        """测试多级审批完整流程"""
        # 1. 发起审批
        approval_data = {
            'template': multi_level_template.id,
            'title': '多级审批测试',
            'form_data': {'subject': '多级审批主题'},
            'business_type': 'test',
            'business_id': 10
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert create_response.status_code == 201
        instance_id = create_response.json()['data']['id']
        
        # 2. 第一级审批（test_user审批）
        # 使用test_user的客户端
        test_client = Client()
        login_data = {
            "login_type": "username_password",
            "username": "testuser",
            "password": "testpass123"
        }
        login_response = test_client.post(
            '/api/auth/login/',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        token = login_response.json()['data']['access_token']
        test_client.defaults = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        approve_data = {'comment': '一级审批通过'}
        first_approve_response = test_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps(approve_data),
            content_type='application/json'
        )
        
        assert first_approve_response.status_code == 200
        first_data = first_approve_response.json()
        assert first_data['success'] is True
        # 第一级通过后，应该流转到第二级
        assert first_data['data']['status'] == 'in_progress'
        
        # 3. 第二级审批（admin审批）
        second_approve_response = admin_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps({'comment': '二级审批通过'}),
            content_type='application/json'
        )
        
        assert second_approve_response.status_code == 200
        second_data = second_approve_response.json()
        assert second_data['success'] is True
        # 所有级别通过后，状态应该是approved
        assert second_data['data']['status'] == 'approved'
        assert second_data['data']['final_result'] == 'approved'
    
    def test_multi_level_approval_rejection_at_first_level(self, authenticated_client, multi_level_template):
        """测试多级审批在第一级被拒绝"""
        # 发起审批
        approval_data = {
            'template': multi_level_template.id,
            'title': '第一级拒绝测试',
            'form_data': {'subject': '测试主题'},
            'business_type': 'test',
            'business_id': 11
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # 第一级审批拒绝
        test_client = Client()
        login_data = {
            "login_type": "username_password",
            "username": "testuser",
            "password": "testpass123"
        }
        login_response = test_client.post(
            '/api/auth/login/',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        token = login_response.json()['data']['access_token']
        test_client.defaults = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        reject_data = {'reason': '第一级不同意'}
        reject_response = test_client.post(
            f'/api/approval/instances/{instance_id}/reject/',
            data=json.dumps(reject_data),
            content_type='application/json'
        )
        
        assert reject_response.status_code == 200
        data = reject_response.json()
        assert data['success'] is True
        # 任何一级拒绝，整个审批都应该被拒绝
        assert data['data']['status'] == 'rejected'
        assert data['data']['final_result'] == 'rejected'


@pytest.mark.integration
class TestApprovalHistory:
    """审批历史查询测试"""
    
    def test_get_approval_detail_with_history(self, authenticated_client, admin_client, approval_template):
        """测试获取审批详情包含历史记录"""
        # 创建并完成一个审批
        approval_data = {
            'template': approval_template.id,
            'title': '历史记录测试',
            'form_data': {'title': '测试', 'amount': 9000},
            'business_type': 'test',
            'business_id': 12
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # 审批通过
        admin_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps({'comment': '同意'}),
            content_type='application/json'
        )
        
        # 获取详情
        response = authenticated_client.get(f'/api/approval/instances/{instance_id}/')
        
        assert response.status_code == 200
        data = response.json()
        assert 'nodes' in data
        assert len(data['nodes']) > 0
        
        # 验证节点信息
        node = data['nodes'][0]
        assert node['status'] == 'approved'
        assert node['approval_comment'] == '同意'
        assert 'approved_by_info' in node

    def test_get_my_processed_approvals(self, authenticated_client, admin_client, approval_template):
        """测试获取我已处理的审批"""
        # 创建审批
        approval_data = {
            'template': approval_template.id,
            'title': '已处理测试',
            'form_data': {'title': '测试', 'amount': 10000},
            'business_type': 'test',
            'business_id': 13
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # admin审批通过
        admin_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps({'comment': '同意'}),
            content_type='application/json'
        )
        
        # 查询admin已处理的审批
        response = admin_client.get('/api/approval/instances/my-processed/')
        
        assert response.status_code == 200
        data = response.json()
        # 检查返回格式（可能是分页格式或直接返回数据）
        if 'success' in data:
            assert data['success'] is True
            assert len(data['data']) > 0
        else:
            # 分页格式
            assert 'results' in data or isinstance(data, list)
            results = data.get('results', data) if isinstance(data, dict) else data
            assert len(results) > 0


@pytest.mark.integration
class TestApprovalPermissions:
    """审批权限测试"""
    
    def test_non_approver_cannot_approve(self, authenticated_client, approval_template):
        """测试非审批人不能审批"""
        # 创建审批（admin是审批人，test_user是发起人）
        approval_data = {
            'template': approval_template.id,
            'title': '权限测试',
            'form_data': {'title': '测试', 'amount': 11000},
            'business_type': 'test',
            'business_id': 14
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # test_user尝试审批（应该失败）
        approve_data = {'comment': '同意'}
        response = authenticated_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps(approve_data),
            content_type='application/json'
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data['success'] is False
        assert '没有权限' in data['message']

    def test_non_initiator_cannot_revoke(self, authenticated_client, admin_client, approval_template):
        """测试非发起人不能撤销"""
        # test_user创建审批
        approval_data = {
            'template': approval_template.id,
            'title': '撤销权限测试',
            'form_data': {'title': '测试', 'amount': 12000},
            'business_type': 'test',
            'business_id': 15
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # admin尝试撤销（应该失败）
        revoke_data = {'reason': '撤销'}
        response = admin_client.post(
            f'/api/approval/instances/{instance_id}/revoke/',
            data=json.dumps(revoke_data),
            content_type='application/json'
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data['success'] is False
        assert '只有发起人' in data['message']
    
    def test_cannot_approve_completed_instance(self, authenticated_client, admin_client, approval_template):
        """测试不能审批已完成的实例"""
        # 创建并完成审批
        approval_data = {
            'template': approval_template.id,
            'title': '已完成测试',
            'form_data': {'title': '测试', 'amount': 13000},
            'business_type': 'test',
            'business_id': 16
        }
        create_response = authenticated_client.post(
            '/api/approval/instances/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        instance_id = create_response.json()['data']['id']
        
        # 第一次审批通过
        admin_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps({'comment': '同意'}),
            content_type='application/json'
        )
        
        # 尝试再次审批（应该失败）
        response = admin_client.post(
            f'/api/approval/instances/{instance_id}/approve/',
            data=json.dumps({'comment': '再次同意'}),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data['success'] is False
