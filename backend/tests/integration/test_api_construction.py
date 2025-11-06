#!/usr/bin/env python
"""
施工管理API集成测试
测试施工项目的CRUD操作、里程碑管理、验收和交接功能
"""
import pytest
from django.contrib.auth import get_user_model
from store_preparation.models import ConstructionOrder, Milestone, DeliveryChecklist
from store_expansion.models import CandidateLocation, FollowUpRecord
from base_data.models import BusinessRegion, Supplier
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.integration
class TestConstructionOrderAPI:
    """施工项目API测试"""
    
    @pytest.fixture
    def test_region(self, db):
        """创建测试经营区域"""
        region = BusinessRegion.objects.create(
            name='华南大区',
            code='HN001',
            description='华南地区',
            is_active=True
        )
        return region
    
    @pytest.fixture
    def test_supplier(self, db):
        """创建测试供应商"""
        supplier = Supplier.objects.create(
            name='优质装修公司',
            code='SUP001',
            supplier_type='construction',
            contact_person='张工',
            contact_phone='13900139000',
            status='cooperating'
        )
        return supplier
    
    @pytest.fixture
    def test_location(self, db, test_region, admin_user):
        """创建测试候选点位"""
        from decimal import Decimal
        location = CandidateLocation.objects.create(
            name='测试门店位置',
            province='广东省',
            city='深圳市',
            district='南山区',
            address='科技园南区',
            area=Decimal('150.00'),
            rent=Decimal('15000.00'),
            business_region=test_region,
            status='following',
            created_by=admin_user
        )
        return location
    
    @pytest.fixture
    def test_follow_up(self, db, test_location, admin_user):
        """创建测试跟进单"""
        follow_up = FollowUpRecord.objects.create(
            record_no='GJ20241201001',
            location=test_location,
            status='signed',
            priority='high',
            survey_date=date.today()
        )
        return follow_up
    
    @pytest.fixture
    def test_construction(self, db, test_follow_up, test_supplier, admin_user):
        """创建测试施工项目"""
        construction = ConstructionOrder.objects.create(
            store_name='测试门店',
            follow_up_record=test_follow_up,
            construction_start_date=date.today(),
            construction_end_date=date.today() + timedelta(days=60),
            supplier=test_supplier,
            status='planning',
            created_by=admin_user
        )
        return construction
    
    def test_get_construction_list(self, api_client, admin_user, test_construction):
        """测试获取施工项目列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/preparation/construction/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'results' in data or isinstance(data, list)
        
        # 如果是分页响应
        if 'results' in data:
            assert len(data['results']) > 0
            construction_data = data['results'][0]
        else:
            assert len(data) > 0
            construction_data = data[0]
        
        assert 'id' in construction_data
        assert 'order_no' in construction_data
        assert 'store_name' in construction_data
        assert 'status' in construction_data
    
    def test_get_construction_detail(self, api_client, admin_user, test_construction):
        """测试获取施工项目详情"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get(f'/api/preparation/construction/{test_construction.id}/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == test_construction.id
        assert data['store_name'] == test_construction.store_name
        assert data['status'] == test_construction.status
        assert 'follow_up_record_info' in data
        assert 'supplier_info' in data
        assert 'milestones' in data
    
    def test_create_construction(self, api_client, admin_user, test_follow_up, test_supplier):
        """测试创建施工项目"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        construction_data = {
            'store_name': '新建测试门店',
            'follow_up_record': test_follow_up.id,
            'construction_start_date': date.today().isoformat(),
            'construction_end_date': (date.today() + timedelta(days=45)).isoformat(),
            'supplier': test_supplier.id,
            'remark': '测试施工项目创建'
        }
        
        # Act
        response = api_client.post('/api/preparation/construction/', construction_data, format='json')
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            construction_info = data['data']
        else:
            construction_info = data
        
        assert construction_info['store_name'] == construction_data['store_name']
        assert construction_info['status'] == 'planning'
        assert 'order_no' in construction_info
        assert construction_info['order_no'].startswith('GC')
        
        # 验证数据库中的记录
        construction = ConstructionOrder.objects.get(id=construction_info['id'])
        assert construction.store_name == construction_data['store_name']
        assert construction.created_by == admin_user
    
    def test_update_construction(self, api_client, admin_user, test_construction):
        """测试更新施工项目"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        update_data = {
            'status': 'in_progress',
            'remark': '施工已开始'
        }
        
        # Act
        response = api_client.patch(
            f'/api/preparation/construction/{test_construction.id}/',
            update_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            construction_info = data['data']
        else:
            construction_info = data
        
        assert construction_info['status'] == update_data['status']
        assert construction_info['remark'] == update_data['remark']
        
        # 验证数据库中的记录
        test_construction.refresh_from_db()
        assert test_construction.status == update_data['status']
        assert test_construction.remark == update_data['remark']
    
    def test_delete_construction(self, api_client, admin_user, test_construction):
        """测试删除施工项目"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        construction_id = test_construction.id
        
        # Act
        response = api_client.delete(f'/api/preparation/construction/{construction_id}/')
        
        # Assert
        assert response.status_code == 204
        
        # 验证数据库中的记录已删除
        assert not ConstructionOrder.objects.filter(id=construction_id).exists()
    
    def test_add_milestone(self, api_client, admin_user, test_construction):
        """测试添加里程碑"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        milestone_data = {
            'construction_order': test_construction.id,
            'name': '基础施工完成',
            'description': '地面、墙面基础施工',
            'planned_date': (date.today() + timedelta(days=15)).isoformat(),
            'status': 'pending'
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/construction/{test_construction.id}/milestones/',
            milestone_data,
            format='json'
        )
        
        # Assert
        if response.status_code != 201:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.json()}")
        assert response.status_code == 201
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            milestone_info = data['data']
        else:
            milestone_info = data
        
        assert milestone_info['name'] == milestone_data['name']
        assert milestone_info['status'] == milestone_data['status']
        
        # 验证数据库中的记录
        milestone = Milestone.objects.get(id=milestone_info['id'])
        assert milestone.construction_order == test_construction
        assert milestone.name == milestone_data['name']
    
    def test_add_multiple_milestones(self, api_client, admin_user, test_construction):
        """测试批量添加里程碑"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        milestones_data = {
            'milestones': [
                {
                    'construction_order': test_construction.id,
                    'name': '水电施工',
                    'planned_date': (date.today() + timedelta(days=10)).isoformat(),
                    'status': 'pending'
                },
                {
                    'construction_order': test_construction.id,
                    'name': '装修施工',
                    'planned_date': (date.today() + timedelta(days=30)).isoformat(),
                    'status': 'pending'
                },
                {
                    'construction_order': test_construction.id,
                    'name': '设备安装',
                    'planned_date': (date.today() + timedelta(days=50)).isoformat(),
                    'status': 'pending'
                }
            ]
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/construction/{test_construction.id}/milestones/',
            milestones_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            milestones_info = data['data']
        else:
            milestones_info = data
        
        assert len(milestones_info) == 3
        
        # 验证数据库中的记录
        milestones = test_construction.milestones.all()
        assert milestones.count() == 3
    
    def test_update_milestone(self, api_client, admin_user, test_construction):
        """测试更新里程碑"""
        # Arrange - 登录并创建里程碑
        api_client.force_authenticate(user=admin_user)
        
        milestone = Milestone.objects.create(
            construction_order=test_construction,
            name='测试里程碑',
            planned_date=date.today() + timedelta(days=20),
            status='pending'
        )
        
        update_data = {
            'status': 'completed',
            'actual_date': date.today().isoformat(),
            'remark': '已完成'
        }
        
        # Act
        response = api_client.put(
            f'/api/preparation/construction/{test_construction.id}/milestones/{milestone.id}/',
            update_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == update_data['status']
        assert data['remark'] == update_data['remark']
        
        # 验证数据库中的记录
        milestone.refresh_from_db()
        assert milestone.status == update_data['status']
        assert milestone.remark == update_data['remark']
    
    def test_acceptance_passed(self, api_client, admin_user, test_construction):
        """测试验收通过"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        acceptance_data = {
            'acceptance_date': date.today().isoformat(),
            'acceptance_result': 'passed',
            'acceptance_notes': '验收合格，质量良好'
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/construction/{test_construction.id}/acceptance/',
            acceptance_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'message' in data
        assert 'data' in data
        
        construction_info = data['data']
        assert construction_info['acceptance_result'] == 'passed'
        assert construction_info['status'] == 'completed'
        
        # 验证数据库中的记录
        test_construction.refresh_from_db()
        assert test_construction.acceptance_result == 'passed'
        assert test_construction.status == 'completed'
        assert test_construction.actual_end_date == date.today()
    
    def test_acceptance_failed(self, api_client, admin_user, test_construction):
        """测试验收不通过"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        acceptance_data = {
            'acceptance_date': date.today().isoformat(),
            'acceptance_result': 'failed',
            'acceptance_notes': '存在质量问题，需要整改',
            'rectification_items': [
                {
                    'description': '墙面粉刷不平整',
                    'status': 'pending',
                    'deadline': (date.today() + timedelta(days=7)).isoformat(),
                    'responsible_person': '张工'
                },
                {
                    'description': '地板有划痕',
                    'status': 'pending',
                    'deadline': (date.today() + timedelta(days=5)).isoformat(),
                    'responsible_person': '李工'
                }
            ]
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/construction/{test_construction.id}/acceptance/',
            acceptance_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        construction_info = data['data']
        assert construction_info['acceptance_result'] == 'failed'
        assert construction_info['status'] == 'rectification'
        assert len(construction_info['rectification_items']) == 2
        
        # 验证数据库中的记录
        test_construction.refresh_from_db()
        assert test_construction.acceptance_result == 'failed'
        assert test_construction.status == 'rectification'
        assert len(test_construction.rectification_items) == 2
    
    def test_rectification(self, api_client, admin_user, test_construction):
        """测试标记整改项"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        rectification_data = {
            'rectification_items': [
                {
                    'description': '电路需要重新布线',
                    'status': 'pending',
                    'deadline': (date.today() + timedelta(days=10)).isoformat(),
                    'responsible_person': '王工'
                }
            ]
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/construction/{test_construction.id}/rectification/',
            rectification_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        construction_info = data['data']
        assert construction_info['status'] == 'rectification'
        assert len(construction_info['rectification_items']) == 1
        
        # 验证数据库中的记录
        test_construction.refresh_from_db()
        assert test_construction.status == 'rectification'
        assert len(test_construction.rectification_items) == 1
    
    def test_upload_design_file(self, api_client, admin_user, test_construction):
        """测试上传设计图纸"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        file_data = {
            'file_name': '施工设计图.pdf',
            'file_url': 'https://example.com/files/design_20241201.pdf',
            'file_size': 2048000,
            'file_type': 'application/pdf'
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/construction/{test_construction.id}/upload-design/',
            file_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        construction_info = data['data']
        assert len(construction_info['design_files']) == 1
        assert construction_info['design_files'][0]['file_name'] == file_data['file_name']
        
        # 验证数据库中的记录
        test_construction.refresh_from_db()
        assert len(test_construction.design_files) == 1
        assert test_construction.design_files[0]['file_name'] == file_data['file_name']
    
    def test_get_construction_with_filters(self, api_client, admin_user, test_construction):
        """测试使用过滤器获取施工项目列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act - 按状态过滤
        response = api_client.get('/api/preparation/construction/', {'status': 'planning'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查返回的数据
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            for construction in results:
                assert construction['status'] == 'planning'
    
    def test_get_construction_with_search(self, api_client, admin_user, test_construction):
        """测试使用搜索获取施工项目列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act - 搜索门店名称
        response = api_client.get('/api/preparation/construction/', {'search': '测试'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查返回的数据
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            assert any('测试' in construction['store_name'] for construction in results)
    
    def test_get_construction_without_authentication(self, api_client, test_construction):
        """测试未认证用户无法获取施工项目列表"""
        # Act - 未认证请求
        response = api_client.get('/api/preparation/construction/')
        
        # Assert
        assert response.status_code in [401, 403]



@pytest.mark.integration
class TestDeliveryChecklistAPI:
    """交接管理API测试"""
    
    @pytest.fixture
    def test_region(self, db):
        """创建测试经营区域"""
        region = BusinessRegion.objects.create(
            name='华北大区',
            code='HB001',
            description='华北地区',
            is_active=True
        )
        return region
    
    @pytest.fixture
    def test_supplier(self, db):
        """创建测试供应商"""
        supplier = Supplier.objects.create(
            name='专业施工队',
            code='SUP002',
            supplier_type='construction',
            contact_person='赵工',
            contact_phone='13800138001',
            status='cooperating'
        )
        return supplier
    
    @pytest.fixture
    def test_location(self, db, test_region, admin_user):
        """创建测试候选点位"""
        from decimal import Decimal
        location = CandidateLocation.objects.create(
            name='交接测试门店位置',
            province='北京市',
            city='北京市',
            district='朝阳区',
            address='CBD商圈',
            area=Decimal('200.00'),
            rent=Decimal('20000.00'),
            business_region=test_region,
            status='signed',
            created_by=admin_user
        )
        return location
    
    @pytest.fixture
    def test_follow_up(self, db, test_location):
        """创建测试跟进单"""
        follow_up = FollowUpRecord.objects.create(
            record_no='GJ20241201002',
            location=test_location,
            status='signed',
            priority='medium'
        )
        return follow_up
    
    @pytest.fixture
    def test_construction(self, db, test_follow_up, test_supplier, admin_user):
        """创建测试施工项目"""
        construction = ConstructionOrder.objects.create(
            store_name='交接测试门店',
            follow_up_record=test_follow_up,
            construction_start_date=date.today() - timedelta(days=60),
            construction_end_date=date.today(),
            actual_end_date=date.today(),
            supplier=test_supplier,
            status='completed',
            acceptance_result='passed',
            created_by=admin_user
        )
        return construction
    
    @pytest.fixture
    def test_delivery(self, db, test_construction, admin_user):
        """创建测试交付清单"""
        delivery = DeliveryChecklist.objects.create(
            construction_order=test_construction,
            store_name=test_construction.store_name,
            status='draft',
            created_by=admin_user
        )
        return delivery
    
    def test_get_delivery_list(self, api_client, admin_user, test_delivery):
        """测试获取交付清单列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/preparation/delivery/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'results' in data or isinstance(data, list)
        
        # 如果是分页响应
        if 'results' in data:
            assert len(data['results']) > 0
            delivery_data = data['results'][0]
        else:
            assert len(data) > 0
            delivery_data = data[0]
        
        assert 'id' in delivery_data
        assert 'checklist_no' in delivery_data
        assert 'store_name' in delivery_data
        assert 'status' in delivery_data
    
    def test_get_delivery_detail(self, api_client, admin_user, test_delivery):
        """测试获取交付清单详情"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get(f'/api/preparation/delivery/{test_delivery.id}/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == test_delivery.id
        assert data['store_name'] == test_delivery.store_name
        assert data['status'] == test_delivery.status
        assert 'construction_order_info' in data
        assert 'delivery_items' in data
        assert 'documents' in data
    
    def test_create_delivery(self, api_client, admin_user, test_construction):
        """测试创建交付清单"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        delivery_data = {
            'construction_order': test_construction.id,
            'store_name': test_construction.store_name,
            'delivery_items': [
                {
                    'name': '营业执照',
                    'type': 'document',
                    'status': 'pending',
                    'description': '门店营业执照'
                },
                {
                    'name': '消防验收',
                    'type': 'inspection',
                    'status': 'pending',
                    'description': '消防安全验收'
                },
                {
                    'name': '设备清单',
                    'type': 'equipment',
                    'status': 'pending',
                    'description': '所有设备清单'
                }
            ],
            'remark': '测试交付清单'
        }
        
        # Act
        response = api_client.post('/api/preparation/delivery/', delivery_data, format='json')
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            delivery_info = data['data']
        else:
            delivery_info = data
        
        assert delivery_info['store_name'] == delivery_data['store_name']
        assert delivery_info['status'] == 'draft'
        assert 'checklist_no' in delivery_info
        assert delivery_info['checklist_no'].startswith('JF')
        assert len(delivery_info['delivery_items']) == 3
        
        # 验证数据库中的记录
        delivery = DeliveryChecklist.objects.get(id=delivery_info['id'])
        assert delivery.store_name == delivery_data['store_name']
        assert delivery.created_by == admin_user
        assert len(delivery.delivery_items) == 3
    
    def test_update_delivery(self, api_client, admin_user, test_delivery):
        """测试更新交付清单"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        update_data = {
            'status': 'in_progress',
            'delivery_items': [
                {
                    'name': '钥匙交接',
                    'type': 'physical',
                    'status': 'completed',
                    'description': '门店钥匙已交接'
                }
            ],
            'remark': '交付进行中'
        }
        
        # Act
        response = api_client.patch(
            f'/api/preparation/delivery/{test_delivery.id}/',
            update_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            delivery_info = data['data']
        else:
            delivery_info = data
        
        assert delivery_info['status'] == update_data['status']
        assert delivery_info['remark'] == update_data['remark']
        
        # 验证数据库中的记录
        test_delivery.refresh_from_db()
        assert test_delivery.status == update_data['status']
        assert test_delivery.remark == update_data['remark']
    
    def test_upload_delivery_document(self, api_client, admin_user, test_delivery):
        """测试上传交付文档"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        document_data = {
            'document_name': '营业执照扫描件',
            'document_url': 'https://example.com/files/license_20241201.pdf',
            'document_type': 'application/pdf',
            'file_size': 1024000,
            'description': '门店营业执照扫描件'
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/delivery/{test_delivery.id}/upload/',
            document_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        delivery_info = data['data']
        assert len(delivery_info['documents']) == 1
        assert delivery_info['documents'][0]['document_name'] == document_data['document_name']
        
        # 验证数据库中的记录
        test_delivery.refresh_from_db()
        assert len(test_delivery.documents) == 1
        assert test_delivery.documents[0]['document_name'] == document_data['document_name']
    
    def test_complete_delivery(self, api_client, admin_user, test_delivery):
        """测试完成交付"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        complete_data = {
            'delivery_date': date.today().isoformat()
        }
        
        # Act
        response = api_client.post(
            f'/api/preparation/delivery/{test_delivery.id}/complete/',
            complete_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        delivery_info = data['data']
        assert delivery_info['status'] == 'completed'
        assert delivery_info['delivery_date'] == complete_data['delivery_date']
        
        # 验证数据库中的记录
        test_delivery.refresh_from_db()
        assert test_delivery.status == 'completed'
        assert test_delivery.delivery_date.isoformat() == complete_data['delivery_date']
    
    def test_complete_delivery_without_date_fails(self, api_client, admin_user, test_delivery):
        """测试完成交付时未提供日期失败"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act - 不提供交付日期
        response = api_client.post(
            f'/api/preparation/delivery/{test_delivery.id}/complete/',
            {},
            format='json'
        )
        
        # Assert
        assert response.status_code == 400
        data = response.json()
        assert 'delivery_date' in data
    
    def test_delete_delivery(self, api_client, admin_user, test_delivery):
        """测试删除交付清单"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        delivery_id = test_delivery.id
        
        # Act
        response = api_client.delete(f'/api/preparation/delivery/{delivery_id}/')
        
        # Assert
        assert response.status_code == 204
        
        # 验证数据库中的记录已删除
        assert not DeliveryChecklist.objects.filter(id=delivery_id).exists()
    
    def test_get_delivery_with_filters(self, api_client, admin_user, test_delivery):
        """测试使用过滤器获取交付清单列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act - 按状态过滤
        response = api_client.get('/api/preparation/delivery/', {'status': 'draft'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查返回的数据
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            for delivery in results:
                assert delivery['status'] == 'draft'
    
    def test_get_delivery_without_authentication(self, api_client, test_delivery):
        """测试未认证用户无法获取交付清单列表"""
        # Act - 未认证请求
        response = api_client.get('/api/preparation/delivery/')
        
        # Assert
        assert response.status_code in [401, 403]
