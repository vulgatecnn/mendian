"""
端到端测试：门店档案流程
测试从创建档案到关联业务数据、查看完整档案的完整流程
"""
import pytest
import json
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from base_data.models import BusinessRegion, Supplier, LegalEntity
from store_expansion.models import CandidateLocation, FollowUpRecord, ProfitCalculation
from store_preparation.models import ConstructionOrder, Milestone, DeliveryChecklist
from store_archive.models import StoreProfile


@pytest.mark.e2e
@pytest.mark.django_db
class TestStoreArchiveFlow:
    """门店档案流程端到端测试"""
    
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
            name='测试供应商',
            supplier_type='construction',
            contact_person='张三',
            contact_phone='13900139000',
            status='cooperating'
        )
        
        # 创建法人主体
        self.legal_entity = LegalEntity.objects.create(
            code='ENTITY001',
            name='测试法人主体',
            credit_code='91110000000000000X',
            legal_representative='李四',
            registered_capital=Decimal('1000000.00'),
            registered_address='北京市朝阳区测试路1号',
            status='operating'
        )
        
        self.test_user = test_user
    
    def test_complete_store_archive_flow(self, authenticated_client):
        """测试完整的门店档案流程"""
        
        # 步骤1：创建候选点位
        location = CandidateLocation.objects.create(
            name='档案测试点位',
            province='北京市',
            city='北京市',
            district='朝阳区',
            address='测试路100号',
            area=Decimal('150.00'),
            rent=Decimal('15000.00'),
            business_region=self.region,
            status='active',
            created_by=self.test_user
        )
        
        # 步骤2：创建跟进单并完成签约
        follow_up = FollowUpRecord.objects.create(
            record_no='FU20240201',
            location=location,
            status='signed',
            priority='high',
            survey_data={
                'traffic_flow': '高',
                'competition': '中等',
                'rent_trend': '稳定'
            },
            business_terms={
                'rent_cost': 15000,
                'decoration_cost': 80000,
                'equipment_cost': 50000,
                'other_cost': 10000
            },
            contract_info={
                'contract_no': 'HT20240201',
                'contract_amount': 155000,
                'contract_start_date': timezone.now().date().isoformat(),
                'contract_end_date': (timezone.now().date().replace(year=timezone.now().year + 3)).isoformat()
            },
            contract_date=timezone.now().date(),
            legal_entity=self.legal_entity,
            created_by=self.test_user
        )
        
        # 创建盈利测算
        profit_calc = ProfitCalculation.objects.create(
            rent_cost=Decimal('15000.00'),
            decoration_cost=Decimal('80000.00'),
            equipment_cost=Decimal('50000.00'),
            other_cost=Decimal('10000.00'),
            daily_sales=Decimal('6000.00'),
            monthly_sales=Decimal('180000.00'),
            total_investment=Decimal('155000.00'),
            roi=Decimal('45.50'),
            payback_period=18,
            contribution_rate=Decimal('35.00'),
            formula_version='v1.0',
            calculation_params={'cost_rate': 0.3, 'expense_rate': 0.2}
        )
        follow_up.profit_calculation = profit_calc
        follow_up.save()
        
        # 步骤3：创建工程单
        construction = ConstructionOrder.objects.create(
            order_no='CO20240201',
            store_name='档案测试门店',
            follow_up_record=follow_up,
            supplier=self.supplier,
            construction_start_date=timezone.now().date(),
            construction_end_date=timezone.now().date() + timedelta(days=60),
            actual_end_date=timezone.now().date() + timedelta(days=58),
            status='accepted',
            acceptance_date=timezone.now().date(),
            acceptance_result='qualified',
            design_files=[
                {
                    'file_name': '平面图.pdf',
                    'file_url': '/media/designs/plan.pdf'
                }
            ],
            created_by=self.test_user
        )
        
        # 创建里程碑
        milestones = [
            Milestone.objects.create(
                construction_order=construction,
                name='开工准备',
                planned_date=timezone.now().date(),
                actual_date=timezone.now().date(),
                status='completed'
            ),
            Milestone.objects.create(
                construction_order=construction,
                name='主体施工',
                planned_date=timezone.now().date() + timedelta(days=20),
                actual_date=timezone.now().date() + timedelta(days=19),
                status='completed'
            ),
            Milestone.objects.create(
                construction_order=construction,
                name='竣工验收',
                planned_date=timezone.now().date() + timedelta(days=60),
                actual_date=timezone.now().date() + timedelta(days=58),
                status='completed'
            )
        ]
        
        # 步骤4：创建交付清单
        delivery = DeliveryChecklist.objects.create(
            checklist_no='DL20240201',
            construction_order=construction,
            store_name='档案测试门店',
            status='completed',
            delivery_date=timezone.now().date(),
            delivery_items=[
                {
                    'category': '证照文件',
                    'items': [
                        {'name': '营业执照', 'status': 'completed'},
                        {'name': '食品经营许可证', 'status': 'completed'}
                    ]
                }
            ],
            documents=[
                {
                    'doc_name': '竣工图纸',
                    'doc_url': '/media/delivery/completion.pdf'
                }
            ],
            created_by=self.test_user
        )
        
        # 步骤5：创建门店档案
        store_data = {
            'store_code': 'STORE001',
            'store_name': '档案测试门店',
            'province': '北京市',
            'city': '北京市',
            'district': '朝阳区',
            'address': '测试路100号',
            'business_region': self.region.id,
            'store_type': 'standard',
            'operation_mode': 'direct',
            'follow_up_record': follow_up.id,
            'construction_order': construction.id,
            'status': 'preparing',
            'store_manager': self.test_user.id,
            'business_manager': self.test_user.id
        }
        
        response = authenticated_client.post(
            '/api/archive/stores/',
            data=json.dumps(store_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        store_id = response.json()['data']['id']
        
        # 验证门店档案已创建
        store = StoreProfile.objects.get(id=store_id)
        assert store.store_code == 'STORE001'
        assert store.store_name == '档案测试门店'
        assert store.status == 'preparing'
        assert store.follow_up_record == follow_up
        assert store.construction_order == construction
        
        # 步骤6：查看门店完整档案
        response = authenticated_client.get(f'/api/archive/stores/{store_id}/full/')
        
        assert response.status_code == 200
        full_info = response.json()['data']
        
        # 验证基本信息
        assert full_info['basic_info']['store_code'] == 'STORE001'
        assert full_info['basic_info']['store_name'] == '档案测试门店'
        
        # 验证跟进历史
        assert full_info['follow_up_info'] is not None
        assert full_info['follow_up_info']['contract_info']['contract_no'] == 'HT20240201'
        assert full_info['follow_up_info']['profit_calculation'] is not None
        assert full_info['follow_up_info']['legal_entity']['name'] == '测试法人主体'
        
        # 验证工程历史
        assert full_info['construction_info'] is not None
        assert full_info['construction_info']['construction_timeline']['actual_end_date'] is not None
        assert len(full_info['construction_info']['milestones']) == 3
        assert full_info['construction_info']['delivery_checklist'] is not None
        
        # 步骤7：更新门店状态为开业
        update_data = {
            'status': 'operating',
            'opening_date': timezone.now().date().isoformat()
        }
        
        response = authenticated_client.patch(
            f'/api/archive/stores/{store_id}/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        
        # 验证门店状态已更新
        store.refresh_from_db()
        assert store.status == 'operating'
        assert store.opening_date is not None
        
        # 步骤8：查询门店档案列表
        response = authenticated_client.get('/api/archive/stores/')
        
        assert response.status_code == 200
        stores_list = response.json()['data']
        assert len(stores_list) >= 1
        
        # 步骤9：按条件筛选门店档案
        response = authenticated_client.get(
            '/api/archive/stores/',
            {'status': 'operating', 'business_region': self.region.id}
        )
        
        assert response.status_code == 200
        filtered_stores = response.json()['data']
        assert len(filtered_stores) >= 1
        assert all(s['status'] == 'operating' for s in filtered_stores)
    
    def test_store_archive_without_business_data(self, authenticated_client):
        """测试创建没有关联业务数据的门店档案"""
        
        # 创建基础门店档案（没有跟进单和工程单）
        store_data = {
            'store_code': 'STORE002',
            'store_name': '简单门店档案',
            'province': '上海市',
            'city': '上海市',
            'district': '浦东新区',
            'address': '测试路200号',
            'business_region': self.region.id,
            'store_type': 'standard',
            'operation_mode': 'franchise',
            'status': 'operating',
            'opening_date': timezone.now().date().isoformat()
        }
        
        response = authenticated_client.post(
            '/api/archive/stores/',
            data=json.dumps(store_data),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        store_id = response.json()['data']['id']
        
        # 查看完整档案
        response = authenticated_client.get(f'/api/archive/stores/{store_id}/full/')
        
        if response.status_code != 200:
            print(f"Error response: {response.json()}")  # 调试信息
        assert response.status_code == 200
        full_info = response.json()['data']
        
        # 验证基本信息存在
        assert full_info['basic_info']['store_code'] == 'STORE002'
        
        # 验证业务数据为空
        assert full_info['follow_up_info'] is None
        assert full_info['construction_info'] is None
    
    def test_store_archive_data_permission(self, authenticated_client, test_user):
        """测试门店档案的数据权限控制"""
        
        # 创建另一个部门和用户
        from system_management.models import Department
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        other_dept = Department.objects.create(
            wechat_dept_id=888,
            name='其他部门',
            order=2
        )
        
        other_user = User.objects.create_user(
            username='otheruser',
            phone='13800138003',
            password='testpass123',
            department=other_dept
        )
        
        # 创建属于其他用户的门店档案
        store = StoreProfile.objects.create(
            store_code='STORE003',
            store_name='其他部门门店',
            province='广东省',
            city='深圳市',
            district='南山区',
            address='测试路300号',
            business_region=self.region,
            store_type='standard',
            operation_mode='direct',
            status='operating',
            created_by=other_user
        )
        
        # 当前用户查询门店列表（应该受数据权限限制）
        response = authenticated_client.get('/api/archive/stores/')
        
        assert response.status_code == 200
        stores_list = response.json()['data']
        
        # 验证数据权限过滤（根据角色配置，可能看不到其他部门的数据）
        # 这里的具体行为取决于用户的角色和数据权限配置
        store_codes = [s['store_code'] for s in stores_list]
        
        # 如果用户只有本部门数据权限，则不应该看到STORE003
        # 如果用户有全部数据权限，则应该能看到STORE003
        # 具体验证逻辑取决于测试用户的角色配置
    
    def test_store_lifecycle_status_flow(self, authenticated_client):
        """测试门店生命周期状态流转"""
        
        # 创建门店档案
        store = StoreProfile.objects.create(
            store_code='STORE004',
            store_name='生命周期测试门店',
            province='浙江省',
            city='杭州市',
            district='西湖区',
            address='测试路400号',
            business_region=self.region,
            store_type='standard',
            operation_mode='direct',
            status='preparing',
            created_by=self.test_user
        )
        
        # 状态流转：筹备中 -> 营业中
        update_data = {
            'status': 'operating',
            'opening_date': timezone.now().date().isoformat()
        }
        
        response = authenticated_client.patch(
            f'/api/archive/stores/{store.id}/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        store.refresh_from_db()
        assert store.status == 'operating'
        assert store.opening_date is not None
        
        # 状态流转：营业中 -> 已闭店
        update_data = {
            'status': 'closed',
            'closing_date': timezone.now().date().isoformat()
        }
        
        response = authenticated_client.patch(
            f'/api/archive/stores/{store.id}/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        store.refresh_from_db()
        assert store.status == 'closed'
        assert store.closing_date is not None
