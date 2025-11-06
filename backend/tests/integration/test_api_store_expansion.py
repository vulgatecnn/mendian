#!/usr/bin/env python
"""
拓店管理API集成测试
测试候选位置、跟进记录的CRUD操作和业务流程
"""
import pytest
from django.contrib.auth import get_user_model
from store_expansion.models import CandidateLocation, FollowUpRecord, ProfitCalculation
from base_data.models import BusinessRegion, LegalEntity
from decimal import Decimal
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.integration
class TestCandidateLocationAPI:
    """候选点位API测试"""
    
    @pytest.fixture
    def test_region(self, db):
        """创建测试经营区域"""
        region = BusinessRegion.objects.create(
            name='华东大区',
            code='HD001',
            description='华东地区',
            is_active=True
        )
        return region
    
    @pytest.fixture
    def test_location(self, db, admin_user, test_region):
        """创建测试候选点位"""
        location = CandidateLocation.objects.create(
            name='上海人民广场店',
            province='上海市',
            city='上海市',
            district='黄浦区',
            address='人民广场123号',
            area=Decimal('150.00'),
            rent=Decimal('20000.00'),
            business_region=test_region,
            status='available',
            remark='测试点位',
            created_by=admin_user
        )
        return location
    
    def test_get_location_list(self, api_client, admin_user, test_location):
        """测试获取候选点位列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/expansion/locations/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查返回数据格式
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        assert len(results) > 0
        location_data = results[0]
        assert 'id' in location_data
        assert 'name' in location_data
        assert 'province' in location_data
        assert 'city' in location_data
        assert 'status' in location_data
    
    def test_get_location_detail(self, api_client, admin_user, test_location):
        """测试获取候选点位详情"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get(f'/api/expansion/locations/{test_location.id}/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == test_location.id
        assert data['name'] == test_location.name
        assert data['province'] == test_location.province
        assert data['city'] == test_location.city
        assert data['district'] == test_location.district
        assert data['address'] == test_location.address
        assert Decimal(data['area']) == test_location.area
        assert Decimal(data['rent']) == test_location.rent
    
    def test_create_location(self, api_client, admin_user, test_region):
        """测试创建候选点位"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        location_data = {
            'name': '北京朝阳大悦城店',
            'province': '北京市',
            'city': '北京市',
            'district': '朝阳区',
            'address': '朝阳大悦城B1层',
            'area': '180.50',
            'rent': '25000.00',
            'business_region': test_region.id,
            'status': 'available',
            'remark': '优质商圈'
        }
        
        # Act
        response = api_client.post('/api/expansion/locations/', location_data, format='json')
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            location_info = data['data']
        else:
            location_info = data
        
        assert location_info['name'] == location_data['name']
        assert location_info['province'] == location_data['province']
        assert location_info['city'] == location_data['city']
        assert location_info['district'] == location_data['district']
        
        # 验证数据库中的记录
        location = CandidateLocation.objects.get(id=location_info['id'])
        assert location.name == location_data['name']
        assert location.created_by == admin_user
    
    def test_create_location_with_invalid_area(self, api_client, admin_user, test_region):
        """测试创建候选点位时面积无效"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        location_data = {
            'name': '测试点位',
            'province': '上海市',
            'city': '上海市',
            'district': '浦东新区',
            'address': '测试地址',
            'area': '0',  # 无效面积
            'rent': '10000.00',
            'business_region': test_region.id
        }
        
        # Act
        response = api_client.post('/api/expansion/locations/', location_data, format='json')
        
        # Assert
        assert response.status_code == 400
        data = response.json()
        assert 'area' in str(data).lower()
    
    def test_update_location(self, api_client, admin_user, test_location):
        """测试更新候选点位"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        update_data = {
            'name': '上海人民广场店（更新）',
            'rent': '22000.00',
            'remark': '更新后的备注'
        }
        
        # Act
        response = api_client.patch(
            f'/api/expansion/locations/{test_location.id}/',
            update_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            location_info = data['data']
        else:
            location_info = data
        
        assert location_info['name'] == update_data['name']
        assert Decimal(location_info['rent']) == Decimal(update_data['rent'])
        
        # 验证数据库中的记录
        test_location.refresh_from_db()
        assert test_location.name == update_data['name']
        assert test_location.rent == Decimal(update_data['rent'])
    
    def test_update_location_status(self, api_client, admin_user, test_location):
        """测试更新候选点位状态"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        update_data = {
            'status': 'following'
        }
        
        # Act
        response = api_client.patch(
            f'/api/expansion/locations/{test_location.id}/',
            update_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        
        # 验证数据库中的记录
        test_location.refresh_from_db()
        assert test_location.status == 'following'
    
    def test_delete_location_without_follow_up(self, api_client, admin_user, test_location):
        """测试删除没有跟进记录的候选点位"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        location_id = test_location.id
        
        # Act
        response = api_client.delete(f'/api/expansion/locations/{location_id}/')
        
        # Assert
        assert response.status_code == 204
        
        # 验证数据库中的记录已删除
        assert not CandidateLocation.objects.filter(id=location_id).exists()
    
    def test_delete_location_with_follow_up_fails(self, api_client, admin_user, test_location):
        """测试删除有跟进记录的候选点位失败"""
        # Arrange - 登录并创建跟进记录
        api_client.force_authenticate(user=admin_user)
        
        FollowUpRecord.objects.create(
            location=test_location,
            status='investigating',
            priority='medium',
            created_by=admin_user
        )
        
        # Act
        response = api_client.delete(f'/api/expansion/locations/{test_location.id}/')
        
        # Assert
        assert response.status_code == 400
        data = response.json()
        assert '跟进单' in data.get('message', '')
        
        # 验证数据库中的记录仍然存在
        assert CandidateLocation.objects.filter(id=test_location.id).exists()
    
    def test_filter_locations_by_status(self, api_client, admin_user, test_location):
        """测试按状态过滤候选点位"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/expansion/locations/', {'status': 'available'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            for location in results:
                assert location['status'] == 'available'
    
    def test_search_locations_by_name(self, api_client, admin_user, test_location):
        """测试按名称搜索候选点位"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/expansion/locations/', {'search': '人民广场'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            assert any('人民广场' in location['name'] for location in results)


@pytest.mark.integration
class TestFollowUpRecordAPI:
    """跟进记录API测试"""
    
    @pytest.fixture
    def test_region(self, db):
        """创建测试经营区域"""
        region = BusinessRegion.objects.create(
            name='华东大区',
            code='HD001',
            description='华东地区',
            is_active=True
        )
        return region
    
    @pytest.fixture
    def test_location(self, db, admin_user, test_region):
        """创建测试候选点位"""
        location = CandidateLocation.objects.create(
            name='上海人民广场店',
            province='上海市',
            city='上海市',
            district='黄浦区',
            address='人民广场123号',
            area=Decimal('150.00'),
            rent=Decimal('20000.00'),
            business_region=test_region,
            status='available',
            created_by=admin_user
        )
        return location
    
    @pytest.fixture
    def test_legal_entity(self, db):
        """创建测试法人主体"""
        entity = LegalEntity.objects.create(
            name='测试公司',
            code='TEST001',
            legal_representative='张三',
            credit_code='91310000123456789X',
            status='operating'
        )
        return entity
    
    @pytest.fixture
    def test_follow_up(self, db, admin_user, test_location):
        """创建测试跟进记录"""
        follow_up = FollowUpRecord.objects.create(
            location=test_location,
            status='investigating',
            priority='medium',
            remark='测试跟进记录',
            created_by=admin_user
        )
        return follow_up
    
    def test_get_follow_up_list(self, api_client, admin_user, test_follow_up):
        """测试获取跟进记录列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/expansion/follow-ups/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        assert len(results) > 0
        follow_up_data = results[0]
        assert 'id' in follow_up_data
        assert 'record_no' in follow_up_data
        assert 'location_name' in follow_up_data
        assert 'status' in follow_up_data
    
    def test_get_follow_up_detail(self, api_client, admin_user, test_follow_up):
        """测试获取跟进记录详情"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get(f'/api/expansion/follow-ups/{test_follow_up.id}/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == test_follow_up.id
        assert data['record_no'] == test_follow_up.record_no
        assert data['location'] == test_follow_up.location.id
        assert data['status'] == test_follow_up.status
        assert data['priority'] == test_follow_up.priority
    
    def test_create_follow_up(self, api_client, admin_user, test_location):
        """测试创建跟进记录"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        follow_up_data = {
            'location': test_location.id,
            'priority': 'high',
            'remark': '重点跟进项目'
        }
        
        # Act
        response = api_client.post('/api/expansion/follow-ups/', follow_up_data, format='json')
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        
        if 'data' in data:
            follow_up_info = data['data']
        else:
            follow_up_info = data
        
        assert follow_up_info['location'] == follow_up_data['location']
        assert follow_up_info['priority'] == follow_up_data['priority']
        assert follow_up_info['status'] == 'investigating'  # 默认状态
        assert 'record_no' in follow_up_info
        assert follow_up_info['record_no'].startswith('FU')
        
        # 验证数据库中的记录
        follow_up = FollowUpRecord.objects.get(id=follow_up_info['id'])
        assert follow_up.location == test_location
        assert follow_up.created_by == admin_user
    
    def test_update_follow_up(self, api_client, admin_user, test_follow_up):
        """测试更新跟进记录"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        update_data = {
            'priority': 'urgent',
            'remark': '更新后的备注'
        }
        
        # Act
        response = api_client.patch(
            f'/api/expansion/follow-ups/{test_follow_up.id}/',
            update_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'data' in data:
            follow_up_info = data['data']
        else:
            follow_up_info = data
        
        assert follow_up_info['priority'] == update_data['priority']
        
        # 验证数据库中的记录
        test_follow_up.refresh_from_db()
        assert test_follow_up.priority == update_data['priority']
    
    def test_record_survey_data(self, api_client, admin_user, test_follow_up):
        """测试录入调研信息"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        survey_data = {
            'survey_date': date.today().isoformat(),
            'survey_data': {
                'foot_traffic': '高',
                'competition': '中等',
                'rent_negotiation': '有议价空间',
                'notes': '位置优越，人流量大'
            }
        }
        
        # Act
        response = api_client.post(
            f'/api/expansion/follow-ups/{test_follow_up.id}/survey/',
            survey_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['code'] == 0
        assert '调研信息录入成功' in data['message']
        
        # 验证数据库中的记录
        test_follow_up.refresh_from_db()
        assert test_follow_up.survey_data == survey_data['survey_data']
        assert test_follow_up.survey_date == date.today()
        assert test_follow_up.status == 'calculating'
    
    def test_calculate_profit(self, api_client, admin_user, test_follow_up):
        """测试盈利测算"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        calculation_data = {
            'business_terms': {
                'rent_cost': '240000.00',
                'decoration_cost': '300000.00',
                'equipment_cost': '200000.00',
                'other_cost': '50000.00'
            },
            'sales_forecast': {
                'daily_sales': '8000.00',
                'monthly_sales': '240000.00'
            }
        }
        
        # Act
        response = api_client.post(
            f'/api/expansion/follow-ups/{test_follow_up.id}/calculate/',
            calculation_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['code'] == 0
        assert '盈利测算完成' in data['message']
        assert 'calculation' in data['data']
        
        calculation = data['data']['calculation']
        assert 'total_investment' in calculation
        assert 'roi' in calculation
        assert 'payback_period' in calculation
        assert 'contribution_rate' in calculation
        
        # 验证数据库中的记录
        test_follow_up.refresh_from_db()
        assert test_follow_up.profit_calculation is not None
        assert test_follow_up.business_terms is not None
    
    def test_record_contract_info(self, api_client, admin_user, test_follow_up, test_legal_entity):
        """测试录入签约信息"""
        # Arrange - 登录并先完成盈利测算
        api_client.force_authenticate(user=admin_user)
        
        # 创建盈利测算记录
        calculation = ProfitCalculation.objects.create(
            rent_cost=Decimal('240000.00'),
            decoration_cost=Decimal('300000.00'),
            equipment_cost=Decimal('200000.00'),
            other_cost=Decimal('50000.00'),
            daily_sales=Decimal('8000.00'),
            monthly_sales=Decimal('240000.00'),
            total_investment=Decimal('790000.00'),
            roi=Decimal('36.46'),
            payback_period=22,
            contribution_rate=Decimal('30.38'),
            formula_version='v1.0'
        )
        test_follow_up.profit_calculation = calculation
        test_follow_up.save()
        
        contract_data = {
            'contract_date': date.today().isoformat(),
            'contract_info': {
                'contract_no': 'HT20240101001',
                'contract_period': '5年',
                'rent_payment': '季付',
                'deposit': '60000.00'
            },
            'contract_reminders': [
                {
                    'type': 'rent_payment',
                    'remind_days': 7,
                    'description': '租金支付提醒'
                }
            ],
            'legal_entity': test_legal_entity.id
        }
        
        # Act
        response = api_client.post(
            f'/api/expansion/follow-ups/{test_follow_up.id}/contract/',
            contract_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['code'] == 0
        assert '签约信息录入成功' in data['message']
        
        # 验证数据库中的记录
        test_follow_up.refresh_from_db()
        assert test_follow_up.contract_info == contract_data['contract_info']
        assert test_follow_up.contract_date == date.today()
        assert test_follow_up.status == 'signed'
        assert test_follow_up.legal_entity == test_legal_entity
        
        # 验证候选点位状态也更新了
        test_follow_up.location.refresh_from_db()
        assert test_follow_up.location.status == 'signed'
    
    def test_abandon_follow_up(self, api_client, admin_user, test_follow_up):
        """测试放弃跟进"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        abandon_data = {
            'abandon_reason': '租金过高，无法达成协议'
        }
        
        # Act
        response = api_client.post(
            f'/api/expansion/follow-ups/{test_follow_up.id}/abandon/',
            abandon_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert '放弃跟进' in data['message']
        
        # 验证数据库中的记录
        test_follow_up.refresh_from_db()
        assert test_follow_up.is_abandoned is True
        assert test_follow_up.abandon_reason == abandon_data['abandon_reason']
        assert test_follow_up.abandon_date == date.today()
        assert test_follow_up.status == 'abandoned'
        
        # 验证候选点位状态也更新了
        test_follow_up.location.refresh_from_db()
        assert test_follow_up.location.status == 'abandoned'
    
    def test_abandon_follow_up_without_reason_fails(self, api_client, admin_user, test_follow_up):
        """测试放弃跟进时不提供原因失败"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        abandon_data = {}
        
        # Act
        response = api_client.post(
            f'/api/expansion/follow-ups/{test_follow_up.id}/abandon/',
            abandon_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 400
        data = response.json()
        assert 'abandon_reason' in str(data).lower()
    
    def test_filter_follow_ups_by_status(self, api_client, admin_user, test_follow_up):
        """测试按状态过滤跟进记录"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/expansion/follow-ups/', {'status': 'investigating'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            for follow_up in results:
                assert follow_up['status'] == 'investigating'
    
    def test_search_follow_ups_by_record_no(self, api_client, admin_user, test_follow_up):
        """测试按跟进单号搜索"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/expansion/follow-ups/', {'search': test_follow_up.record_no})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            assert any(test_follow_up.record_no in follow_up['record_no'] for follow_up in results)
    
    def test_get_follow_up_without_authentication(self, api_client, test_follow_up):
        """测试未认证用户无法获取跟进记录"""
        # Act - 未认证请求
        response = api_client.get('/api/expansion/follow-ups/')
        
        # Assert
        assert response.status_code in [401, 403]
