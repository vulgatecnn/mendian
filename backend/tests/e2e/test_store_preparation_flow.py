"""
端到端测试：开店筹备流程
测试从创建工程单到里程碑管理、验收、交付的完整流程
"""
import pytest
import json
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from base_data.models import BusinessRegion, Supplier
from store_expansion.models import CandidateLocation, FollowUpRecord
from store_preparation.models import ConstructionOrder, Milestone, DeliveryChecklist


@pytest.mark.e2e
@pytest.mark.django_db
class TestStorePreparationFlow:
    """开店筹备流程端到端测试"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db, test_user):
        """设置测试数据"""
        # 创建业务大区
        self.region = BusinessRegion.objects.create(
            code='TEST_REGION',
            name='测试大区',
            manager=test_user
        )
        
        # 创建供应商
        self.supplier = Supplier.objects.create(
            code='SUP001',
            name='测试施工供应商',
            supplier_type='construction',
            contact_person='李四',
            contact_phone='13900139000',
            status='cooperating'
        )
        
        # 创建候选点位和跟进单（已签约）
        self.location = CandidateLocation.objects.create(
            name='已签约点位',
            province='北京市',
            city='北京市',
            district='朝阳区',
            address='测试路3号',
            area=Decimal('120.00'),
            rent=Decimal('12000.00'),
            business_region=self.region,
            status='active',
            created_by=test_user
        )
        
        self.follow_up = FollowUpRecord.objects.create(
            record_no='FU20240102',
            location=self.location,
            status='signed',
            priority='high',
            contract_info={
                'contract_no': 'HT20240102',
                'contract_amount': 100000
            },
            created_by=test_user
        )
        
        self.test_user = test_user
    
    def test_complete_preparation_flow(self, authenticated_client):
        """测试完整的开店筹备流程"""
        
        # 步骤1：创建工程单
        construction_data = {
            'store_name': '测试门店',
            'follow_up_record': self.follow_up.id,
            'supplier': self.supplier.id,
            'construction_start_date': timezone.now().date().isoformat(),
            'construction_end_date': (timezone.now().date() + timedelta(days=60)).isoformat(),
            'design_files': [
                {
                    'file_name': '平面图.pdf',
                    'file_url': '/media/designs/plan.pdf',
                    'file_type': 'pdf'
                }
            ]
        }
        
        response = authenticated_client.post(
            '/api/preparation/construction/',
            data=json.dumps(construction_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        construction_id = response.json()['data']['id']
        
        # 验证工程单已创建
        construction = ConstructionOrder.objects.get(id=construction_id)
        assert construction.store_name == '测试门店'
        assert construction.status == 'planning'
        assert construction.supplier == self.supplier
        assert len(construction.design_files) == 1
        
        # 步骤2：添加工程里程碑
        milestones_data = {
            'milestones': [
                {
                    'name': '开工准备',
                    'planned_date': timezone.now().date().isoformat(),
                    'description': '办理施工许可，准备材料'
                },
                {
                    'name': '主体施工',
                    'planned_date': (timezone.now().date() + timedelta(days=20)).isoformat(),
                    'description': '完成主体结构施工'
                },
                {
                    'name': '装修施工',
                    'planned_date': (timezone.now().date() + timedelta(days=40)).isoformat(),
                    'description': '完成室内装修'
                },
                {
                    'name': '设备安装',
                    'planned_date': (timezone.now().date() + timedelta(days=50)).isoformat(),
                    'description': '安装设备并调试'
                },
                {
                    'name': '竣工验收',
                    'planned_date': (timezone.now().date() + timedelta(days=60)).isoformat(),
                    'description': '完成竣工验收'
                }
            ]
        }
        
        response = authenticated_client.post(
            f'/api/preparation/construction/{construction_id}/milestones/',
            data=json.dumps(milestones_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证里程碑已创建
        milestones = Milestone.objects.filter(construction_order=construction).order_by('planned_date')
        assert milestones.count() == 5
        assert milestones.first().name == '开工准备'
        assert milestones.last().name == '竣工验收'
        
        # 步骤3：更新里程碑状态（完成第一个里程碑）
        first_milestone = milestones.first()
        milestone_update_data = {
            'status': 'completed',
            'actual_date': timezone.now().date().isoformat(),
            'notes': '开工准备已完成'
        }
        
        response = authenticated_client.put(
            f'/api/preparation/construction/{construction_id}/milestones/{first_milestone.id}/',
            data=json.dumps(milestone_update_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证里程碑状态已更新
        first_milestone.refresh_from_db()
        assert first_milestone.status == 'completed'
        assert first_milestone.actual_date is not None
        
        # 步骤4：执行验收操作
        acceptance_data = {
            'acceptance_date': timezone.now().date().isoformat(),
            'acceptance_result': 'qualified',
            'acceptance_notes': '施工质量符合要求',
            'rectification_items': [
                {
                    'item': '墙面有轻微裂缝',
                    'responsible_party': '施工方',
                    'deadline': (timezone.now().date() + timedelta(days=7)).isoformat(),
                    'status': 'pending'
                }
            ]
        }
        
        response = authenticated_client.post(
            f'/api/preparation/construction/{construction_id}/acceptance/',
            data=json.dumps(acceptance_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证验收信息已保存
        construction.refresh_from_db()
        assert construction.acceptance_date is not None
        assert construction.acceptance_result == 'qualified'
        assert len(construction.rectification_items) == 1
        assert construction.status == 'accepted'
        
        # 步骤5：标记整改项完成
        rectification_data = {
            'item_index': 0,
            'status': 'completed',
            'completion_date': timezone.now().date().isoformat(),
            'completion_notes': '裂缝已修复'
        }
        
        response = authenticated_client.post(
            f'/api/preparation/construction/{construction_id}/rectification/',
            data=json.dumps(rectification_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证整改项状态已更新
        construction.refresh_from_db()
        assert construction.rectification_items[0]['status'] == 'completed'
        
        # 步骤6：创建交付清单
        delivery_data = {
            'construction_order': construction_id,
            'store_name': '测试门店',
            'delivery_items': [
                {
                    'category': '证照文件',
                    'items': [
                        {'name': '营业执照', 'status': 'completed'},
                        {'name': '食品经营许可证', 'status': 'completed'}
                    ]
                },
                {
                    'category': '设备清单',
                    'items': [
                        {'name': '收银系统', 'quantity': 1, 'status': 'completed'},
                        {'name': '监控设备', 'quantity': 4, 'status': 'completed'}
                    ]
                }
            ],
            'documents': [
                {
                    'doc_name': '竣工图纸',
                    'doc_url': '/media/delivery/completion_drawings.pdf',
                    'doc_type': 'pdf'
                },
                {
                    'doc_name': '设备清单',
                    'doc_url': '/media/delivery/equipment_list.xlsx',
                    'doc_type': 'xlsx'
                }
            ]
        }
        
        response = authenticated_client.post(
            '/api/preparation/delivery/',
            data=json.dumps(delivery_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        delivery_id = response.json()['data']['id']
        
        # 验证交付清单已创建
        delivery = DeliveryChecklist.objects.get(id=delivery_id)
        assert delivery.store_name == '测试门店'
        assert delivery.construction_order == construction
        assert len(delivery.delivery_items) == 2
        assert len(delivery.documents) == 2
        assert delivery.status == 'pending'
        
        # 步骤7：上传交付文档
        upload_data = {
            'documents': [
                {
                    'doc_name': '验收报告',
                    'doc_url': '/media/delivery/acceptance_report.pdf',
                    'doc_type': 'pdf'
                }
            ]
        }
        
        response = authenticated_client.post(
            f'/api/preparation/delivery/{delivery_id}/upload/',
            data=json.dumps(upload_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证文档已上传
        delivery.refresh_from_db()
        assert len(delivery.documents) == 3
        
        # 步骤8：完成交付
        complete_data = {
            'status': 'completed',
            'delivery_date': timezone.now().date().isoformat(),
            'notes': '所有交付项已完成'
        }
        
        response = authenticated_client.put(
            f'/api/preparation/delivery/{delivery_id}/',
            data=json.dumps(complete_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证交付已完成
        delivery.refresh_from_db()
        assert delivery.status == 'completed'
        assert delivery.delivery_date is not None
        
        # 验证完整流程
        assert construction.follow_up_record == self.follow_up
        assert construction.milestones.count() == 5
        assert construction.acceptance_result == 'qualified'
        assert hasattr(construction, 'deliverychecklist')
        assert construction.deliverychecklist.status == 'completed'
    
    def test_milestone_reminder(self, authenticated_client):
        """测试里程碑提醒功能"""
        
        # 创建工程单
        construction = ConstructionOrder.objects.create(
            order_no='CO20240101',
            store_name='测试门店2',
            follow_up_record=self.follow_up,
            supplier=self.supplier,
            status='in_progress',
            created_by=self.test_user
        )
        
        # 创建即将到期的里程碑（3天后）
        upcoming_milestone = Milestone.objects.create(
            construction_order=construction,
            name='即将到期里程碑',
            planned_date=timezone.now().date() + timedelta(days=3),
            status='pending'
        )
        
        # 模拟定时任务检查里程碑提醒
        from store_preparation.services import MilestoneReminderService
        
        reminder_service = MilestoneReminderService()
        reminder_service.check_and_send_reminders()
        
        # 验证提醒已发送
        upcoming_milestone.refresh_from_db()
        assert upcoming_milestone.reminder_sent is True
        
        # 验证消息通知已创建
        from notification.models import Message
        messages = Message.objects.filter(
            message_type='milestone_reminder',
            recipient=self.test_user
        )
        assert messages.exists()
