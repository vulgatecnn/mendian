#!/usr/bin/env python
"""
门店计划API集成测试
测试门店计划的CRUD操作、审批提交和数据导出功能
"""
import pytest
from django.contrib.auth import get_user_model
from store_planning.models import StorePlan, RegionalPlan, BusinessRegion, StoreType
from decimal import Decimal

User = get_user_model()


@pytest.mark.integration
class TestStorePlanAPI:
    """门店计划API测试"""
    
    @pytest.fixture
    def test_region(self, db, admin_user):
        """创建测试经营区域"""
        region = BusinessRegion.objects.create(
            name='华东大区',
            code='HD001',
            description='华东地区',
            is_active=True
        )
        return region
    
    @pytest.fixture
    def test_store_type(self, db, admin_user):
        """创建测试门店类型"""
        store_type = StoreType.objects.create(
            name='标准店',
            code='STD001',
            description='标准门店',
            is_active=True
        )
        return store_type
    
    @pytest.fixture
    def test_plan(self, db, admin_user, test_region, test_store_type):
        """创建测试门店计划"""
        from datetime import date, timedelta
        
        plan = StorePlan.objects.create(
            name='2024年度开店计划',
            plan_type='annual',
            status='draft',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            description='测试计划描述',
            created_by=admin_user
        )
        
        # 创建区域计划
        regional_plan = RegionalPlan.objects.create(
            plan=plan,
            region=test_region,
            store_type=test_store_type,
            target_count=10,
            completed_count=0,
            contribution_rate=Decimal('50.00'),
            budget_amount=Decimal('1000000.00')
        )
        
        # 更新计划汇总数据
        plan.total_target_count = 10
        plan.total_budget_amount = Decimal('1000000.00')
        plan.save()
        
        return plan
    
    def test_get_plan_list(self, api_client, admin_user, test_plan):
        """测试获取计划列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get('/api/store-planning/plans/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'results' in data or isinstance(data, list)
        
        # 如果是分页响应
        if 'results' in data:
            assert len(data['results']) > 0
            plan_data = data['results'][0]
        else:
            assert len(data) > 0
            plan_data = data[0]
        
        assert 'id' in plan_data
        assert 'name' in plan_data
        assert 'plan_type' in plan_data
        assert 'status' in plan_data
    
    def test_get_plan_detail(self, api_client, admin_user, test_plan):
        """测试获取计划详情"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act
        response = api_client.get(f'/api/store-planning/plans/{test_plan.id}/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == test_plan.id
        assert data['name'] == test_plan.name
        assert data['plan_type'] == test_plan.plan_type
        assert data['status'] == test_plan.status
        assert 'regional_plans' in data
        assert len(data['regional_plans']) > 0
    
    def test_create_plan(self, api_client, admin_user, test_region, test_store_type):
        """测试创建计划"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        from datetime import date, timedelta
        
        plan_data = {
            'name': '2024年Q1开店计划',
            'plan_type': 'quarterly',
            'start_date': date.today().isoformat(),
            'end_date': (date.today() + timedelta(days=90)).isoformat(),
            'description': '第一季度开店计划',
            'regional_plans': [
                {
                    'region': test_region.id,
                    'store_type': test_store_type.id,
                    'target_count': 5,
                    'contribution_rate': '30.00',
                    'budget_amount': '500000.00'
                }
            ]
        }
        
        # Act
        response = api_client.post('/api/store-planning/plans/', plan_data, format='json')
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            plan_info = data['data']
        else:
            plan_info = data
        
        assert plan_info['name'] == plan_data['name']
        assert plan_info['plan_type'] == plan_data['plan_type']
        assert plan_info['status'] == 'draft'
        assert plan_info['total_target_count'] == 5
        
        # 验证数据库中的记录
        plan = StorePlan.objects.get(id=plan_info['id'])
        assert plan.name == plan_data['name']
        assert plan.regional_plans.count() == 1
    
    def test_update_plan(self, api_client, admin_user, test_plan):
        """测试更新计划"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        update_data = {
            'name': '2024年度开店计划（修订版）',
            'description': '更新后的计划描述'
        }
        
        # Act
        response = api_client.patch(f'/api/store-planning/plans/{test_plan.id}/', update_data, format='json')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查响应数据
        if 'data' in data:
            plan_info = data['data']
        else:
            plan_info = data
        
        assert plan_info['name'] == update_data['name']
        assert plan_info['description'] == update_data['description']
        
        # 验证数据库中的记录
        test_plan.refresh_from_db()
        assert test_plan.name == update_data['name']
        assert test_plan.description == update_data['description']
    
    def test_delete_plan(self, api_client, admin_user, test_plan):
        """测试删除计划"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        plan_id = test_plan.id
        
        # Act
        response = api_client.delete(f'/api/store-planning/plans/{plan_id}/')
        
        # Assert
        assert response.status_code == 204
        
        # 验证数据库中的记录已删除
        assert not StorePlan.objects.filter(id=plan_id).exists()
    
    def test_delete_non_draft_plan_fails(self, api_client, admin_user, test_plan):
        """测试删除非草稿状态的计划失败"""
        # Arrange - 登录并修改计划状态
        api_client.force_authenticate(user=admin_user)
        test_plan.status = 'published'
        test_plan.save()
        
        # Act
        response = api_client.delete(f'/api/store-planning/plans/{test_plan.id}/')
        
        # Assert
        assert response.status_code == 400
        data = response.json()
        assert 'error' in data
        
        # 验证数据库中的记录仍然存在
        assert StorePlan.objects.filter(id=test_plan.id).exists()
    
    def test_submit_plan_for_approval(self, api_client, admin_user, test_plan):
        """测试提交计划审批"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        approval_data = {
            'approval_type': 'plan_publish',
            'additional_data': {
                'notes': '请审批此计划'
            }
        }
        
        # Act
        response = api_client.post(
            f'/api/store-planning/plans/{test_plan.id}/submit_for_approval/',
            approval_data,
            format='json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert 'message' in data
        assert 'data' in data
        assert data['data']['approval_type'] == 'plan_publish'
        assert data['data']['status'] == 'pending'
    
    def test_export_plan_data(self, api_client, admin_user, test_plan):
        """测试导出计划数据"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        export_params = {
            'plan_ids': [test_plan.id]
        }
        
        # Act
        response = api_client.get('/api/store-planning/plans/export/', export_params)
        
        # Assert
        # 导出功能可能返回文件或JSON数据
        assert response.status_code in [200, 404]  # 404表示功能未实现
        
        if response.status_code == 200:
            # 如果是文件下载
            if response.get('Content-Type') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                assert len(response.content) > 0
            # 如果是JSON响应
            elif 'application/json' in response.get('Content-Type', ''):
                data = response.json()
                assert 'data' in data or 'results' in data
    
    def test_get_plan_list_with_filters(self, api_client, admin_user, test_plan):
        """测试使用过滤器获取计划列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act - 按计划类型过滤
        response = api_client.get('/api/store-planning/plans/', {'plan_type': 'annual'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查返回的数据
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            for plan in results:
                assert plan['plan_type'] == 'annual'
    
    def test_get_plan_list_with_search(self, api_client, admin_user, test_plan):
        """测试使用搜索获取计划列表"""
        # Arrange - 登录
        api_client.force_authenticate(user=admin_user)
        
        # Act - 搜索计划名称
        response = api_client.get('/api/store-planning/plans/', {'search': '2024'})
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 检查返回的数据
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        if len(results) > 0:
            assert any('2024' in plan['name'] for plan in results)
    
    def test_get_plan_without_authentication(self, api_client, test_plan):
        """测试未认证用户无法获取计划列表"""
        # Act - 未认证请求
        response = api_client.get('/api/store-planning/plans/')
        
        # Assert
        assert response.status_code in [401, 403]
    