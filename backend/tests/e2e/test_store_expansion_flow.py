"""
端到端测试：拓店流程
测试从创建跟进单到盈利测算、报店审批、签约的完整流程
"""
import pytest
import json
from decimal import Decimal
from django.utils import timezone
from base_data.models import BusinessRegion, LegalEntity
from store_expansion.models import CandidateLocation, FollowUpRecord, ProfitCalculation
from approval.models import ApprovalTemplate, ApprovalInstance


@pytest.mark.e2e
@pytest.mark.django_db
class TestStoreExpansionFlow:
    """拓店流程端到端测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db, test_user, test_department):
        """设置测试数据"""
        # 创建业务大区
        self.region = BusinessRegion.objects.create(
            code='TEST_REGION',
            name='测试大区',
            manager=test_user
        )
        
        # 创建法人主体
        self.legal_entity = LegalEntity.objects.create(
            code='TEST_ENTITY',
            name='测试法人主体',
            credit_code='91110000000000000X',
            legal_representative='张三',
            registered_capital=Decimal('1000000.00'),
            registered_address='北京市朝阳区测试路1号',
            status='operating'
        )
        
        # 创建报店审批模板
        self.approval_template = ApprovalTemplate.objects.create(
            template_code='STORE_REPORT',
            template_name='报店审批',
            description='门店报店审批流程',
            form_schema={
                'fields': [
                    {'name': 'store_name', 'label': '门店名称', 'type': 'text', 'required': True},
                    {'name': 'location', 'label': '门店地址', 'type': 'text', 'required': True}
                ]
            },
            flow_config={
                'nodes': [
                    {
                        'name': '商务经理审批',
                        'type': 'approval',
                        'approvers': {'type': 'department_manager'}
                    },
                    {
                        'name': '总经理审批',
                        'type': 'approval',
                        'approvers': {'type': 'fixed_users', 'user_ids': [test_user.id]}
                    }
                ]
            },
            status='active',
            created_by=test_user
        )
        
        self.test_user = test_user
    
    def test_complete_expansion_flow(self, authenticated_client):
        """测试完整的拓店流程"""
        
        # 步骤1：创建候选点位
        location_data = {
            'name': '测试候选点位',
            'province': '北京市',
            'city': '北京市',
            'district': '朝阳区',
            'address': '测试路1号',
            'area': '100.00',
            'rent': '10000.00',
            'business_region': self.region.id
        }
        
        response = authenticated_client.post(
            '/api/expansion/locations/',
            data=json.dumps(location_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        location_id = response.json()['data']['id']
        
        # 验证候选点位已创建
        location = CandidateLocation.objects.get(id=location_id)
        assert location.name == '测试候选点位'
        assert location.status == 'available'
        
        # 步骤2：创建跟进单
        follow_up_data = {
            'location': location_id,
            'priority': 'high'
        }
        
        response = authenticated_client.post(
            '/api/expansion/follow-ups/',
            data=json.dumps(follow_up_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        follow_up_id = response.json()['data']['id']
        
        # 验证跟进单已创建
        follow_up = FollowUpRecord.objects.get(id=follow_up_id)
        assert follow_up.status == 'investigating'
        assert follow_up.priority == 'high'
        
        # 步骤3：录入调研信息
        survey_data = {
            'survey_data': {
                'traffic_flow': '高',
                'competition': '中等',
                'rent_trend': '稳定'
            },
            'survey_date': timezone.now().date().isoformat()
        }
        
        response = authenticated_client.post(
            f'/api/expansion/follow-ups/{follow_up_id}/survey/',
            data=json.dumps(survey_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证调研信息已保存
        follow_up.refresh_from_db()
        assert follow_up.survey_data is not None
        assert follow_up.survey_data['traffic_flow'] == '高'
        
        # 步骤4：执行盈利测算
        calculation_data = {
            'business_terms': {
                'rent_cost': 10000,
                'decoration_cost': 50000,
                'equipment_cost': 30000,
                'other_cost': 5000
            },
            'sales_forecast': {
                'daily_sales': 5000,
                'monthly_sales': 150000
            }
        }
        
        response = authenticated_client.post(
            f'/api/expansion/follow-ups/{follow_up_id}/calculate/',
            data=json.dumps(calculation_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证盈利测算已完成
        follow_up.refresh_from_db()
        assert follow_up.profit_calculation is not None
        profit_calc = follow_up.profit_calculation
        assert profit_calc.total_investment == Decimal('95000.00')
        assert profit_calc.roi > 0
        assert profit_calc.payback_period > 0
        
        # 步骤5：发起报店审批
        approval_data = {
            'template_code': 'STORE_REPORT',
            'form_data': {
                'store_name': '测试门店',
                'location': '北京市朝阳区测试路1号'
            }
        }
        
        response = authenticated_client.post(
            f'/api/expansion/follow-ups/{follow_up_id}/submit-approval/',
            data=json.dumps(approval_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        approval_id = response.json()['data']['approval_id']
        
        # 验证审批已创建
        approval = ApprovalInstance.objects.get(id=approval_id)
        assert approval.status == 'pending'
        assert approval.business_type == 'follow_up'
        assert approval.business_id == follow_up_id
        
        # 步骤6：审批通过（模拟审批人操作）
        # 获取第一个审批节点
        first_node = approval.nodes.first()
        assert first_node.status == 'in_progress'
        
        # 模拟审批通过
        approve_data = {
            'action': 'approve',
            'comment': '同意报店'
        }
        
        response = authenticated_client.post(
            f'/api/approval/instances/{approval_id}/approve/',
            data=json.dumps(approve_data),
            content_type='application/json'
        )
        
        # 注意：实际环境中需要切换到审批人的客户端
        # 这里简化处理，假设当前用户有审批权限
        
        # 步骤7：录入签约信息
        contract_data = {
            'contract_info': {
                'contract_no': 'HT20240101',
                'contract_amount': 95000,
                'contract_start_date': timezone.now().date().isoformat(),
                'contract_end_date': (timezone.now().date().replace(year=timezone.now().year + 3)).isoformat()
            },
            'contract_date': timezone.now().date().isoformat(),
            'legal_entity': self.legal_entity.id,
            'contract_reminders': [
                {
                    'remind_date': (timezone.now().date().replace(year=timezone.now().year + 2)).isoformat(),
                    'remind_type': 'renewal',
                    'remind_content': '合同即将到期，请及时续约'
                }
            ]
        }
        
        response = authenticated_client.post(
            f'/api/expansion/follow-ups/{follow_up_id}/contract/',
            data=json.dumps(contract_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证签约信息已保存
        follow_up.refresh_from_db()
        assert follow_up.status == 'signed'
        assert follow_up.contract_info is not None
        assert follow_up.contract_info['contract_no'] == 'HT20240101'
        assert follow_up.legal_entity == self.legal_entity
        assert len(follow_up.contract_reminders) == 1
        
        # 验证完整流程
        assert follow_up.location == location
        assert follow_up.survey_data is not None
        assert follow_up.profit_calculation is not None
        assert follow_up.contract_info is not None
        assert follow_up.legal_entity is not None
    
    def test_abandon_follow_up(self, authenticated_client):
        """测试放弃跟进流程"""
        
        # 创建候选点位和跟进单
        location = CandidateLocation.objects.create(
            name='待放弃点位',
            province='北京市',
            city='北京市',
            district='朝阳区',
            address='测试路2号',
            area=Decimal('80.00'),
            rent=Decimal('8000.00'),
            business_region=self.region,
            status='active',
            created_by=self.test_user
        )
        
        follow_up = FollowUpRecord.objects.create(
            record_no='FU20240101',
            location=location,
            status='investigating',
            priority='medium',
            created_by=self.test_user
        )
        
        # 放弃跟进
        abandon_data = {
            'reason': '租金过高，不符合预算'
        }
        
        response = authenticated_client.post(
            f'/api/expansion/follow-ups/{follow_up.id}/abandon/',
            data=json.dumps(abandon_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证跟进单已标记为放弃
        follow_up.refresh_from_db()
        assert follow_up.is_abandoned is True
        assert follow_up.status == 'abandoned'
