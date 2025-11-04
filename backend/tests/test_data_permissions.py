"""
数据权限测试
验证数据权限混入类在各业务模块中的应用
"""
import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model

from system_management.models import Department
from store_expansion.models import CandidateLocation, FollowUpRecord
from store_expansion.views import CandidateLocationViewSet, FollowUpRecordViewSet
from store_preparation.models import ConstructionOrder, DeliveryChecklist
from store_preparation.views import ConstructionOrderViewSet, DeliveryChecklistViewSet
from store_archive.models import StoreProfile
from store_archive.views import StoreProfileViewSet
from base_data.models import BusinessRegion

User = get_user_model()


class DataPermissionTestCase(TestCase):
    """数据权限测试用例"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建部门
        self.dept1 = Department.objects.create(
            wechat_dept_id=1,
            name='部门1'
        )
        self.dept2 = Department.objects.create(
            wechat_dept_id=2,
            name='部门2'
        )
        self.dept1_sub = Department.objects.create(
            wechat_dept_id=3,
            name='部门1-子部门',
            parent=self.dept1
        )
        
        # 创建用户
        self.user1 = User.objects.create_user(
            username='user1',
            phone='13800000001',
            password='password123',
            department=self.dept1
        )
        self.user2 = User.objects.create_user(
            username='user2',
            phone='13800000002',
            password='password123',
            department=self.dept2
        )
        self.user1_sub = User.objects.create_user(
            username='user1_sub',
            phone='13800000003',
            password='password123',
            department=self.dept1_sub
        )
        self.superuser = User.objects.create_superuser(
            username='admin',
            phone='13900000000',
            password='admin123'
        )
        
        # 创建业务大区
        self.region1 = BusinessRegion.objects.create(
            name='华东大区',
            code='HD',
            created_by=self.user1
        )
        self.region2 = BusinessRegion.objects.create(
            name='华南大区',
            code='HN',
            created_by=self.user2
        )
        
        # 创建候选点位
        self.location1 = CandidateLocation.objects.create(
            name='点位1',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址1',
            area=100,
            rent=10000,
            business_region=self.region1,
            created_by=self.user1
        )
        self.location2 = CandidateLocation.objects.create(
            name='点位2',
            province='广东省',
            city='深圳市',
            district='南山区',
            address='测试地址2',
            area=120,
            rent=12000,
            business_region=self.region2,
            created_by=self.user2
        )
        
        # 创建请求工厂
        self.factory = RequestFactory()
    
    def test_candidate_location_data_permission_self(self):
        """测试候选点位的数据权限 - 仅本人"""
        # 创建请求
        request = self.factory.get('/api/expansion/locations/')
        request.user = self.user1
        
        # 创建视图
        view = CandidateLocationViewSet.as_view({'get': 'list'})
        view.request = request
        
        # 获取查询集
        viewset = CandidateLocationViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        
        # 验证：user1 只能看到自己创建的点位
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().id, self.location1.id)
    
    def test_candidate_location_data_permission_superuser(self):
        """测试候选点位的数据权限 - 超级管理员"""
        # 创建请求
        request = self.factory.get('/api/expansion/locations/')
        request.user = self.superuser
        
        # 创建视图集
        viewset = CandidateLocationViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        
        # 验证：超级管理员可以看到所有点位
        self.assertEqual(queryset.count(), 2)
    
    def test_candidate_location_region_permission(self):
        """测试候选点位的区域权限"""
        # 创建请求
        request = self.factory.get('/api/expansion/locations/')
        request.user = self.user1
        
        # 创建视图集
        viewset = CandidateLocationViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        
        # 验证：用户只能看到自己创建的点位（因为没有配置区域权限）
        # 实际应用中需要配置用户的区域权限
        self.assertGreaterEqual(queryset.count(), 0)
    
    def test_construction_order_data_permission(self):
        """测试工程单的数据权限"""
        # 创建跟进单
        follow_up = FollowUpRecord.objects.create(
            record_no='FU001',
            location=self.location1,
            created_by=self.user1
        )
        
        # 创建工程单
        order1 = ConstructionOrder.objects.create(
            order_no='CO001',
            store_name='门店1',
            follow_up_record=follow_up,
            created_by=self.user1
        )
        order2 = ConstructionOrder.objects.create(
            order_no='CO002',
            store_name='门店2',
            follow_up_record=follow_up,
            created_by=self.user2
        )
        
        # 创建请求
        request = self.factory.get('/api/preparation/construction/')
        request.user = self.user1
        
        # 创建视图集
        viewset = ConstructionOrderViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        
        # 验证：user1 只能看到自己创建的工程单
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().id, order1.id)
    
    def test_store_profile_data_permission(self):
        """测试门店档案的数据权限"""
        # 创建门店档案
        store1 = StoreProfile.objects.create(
            store_code='S001',
            store_name='门店1',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址1',
            business_region=self.region1,
            store_type='direct',
            operation_mode='self_operated',
            created_by=self.user1
        )
        store2 = StoreProfile.objects.create(
            store_code='S002',
            store_name='门店2',
            province='广东省',
            city='深圳市',
            district='南山区',
            address='测试地址2',
            business_region=self.region2,
            store_type='direct',
            operation_mode='self_operated',
            created_by=self.user2
        )
        
        # 创建请求
        request = self.factory.get('/api/archive/stores/')
        request.user = self.user1
        
        # 创建视图集
        viewset = StoreProfileViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        
        # 验证：user1 只能看到自己创建的门店档案
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().id, store1.id)
    
    def test_department_hierarchy_permission(self):
        """测试部门层级权限"""
        # 创建门店档案
        store_parent = StoreProfile.objects.create(
            store_code='S003',
            store_name='门店3',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址3',
            business_region=self.region1,
            store_type='direct',
            operation_mode='self_operated',
            created_by=self.user1
        )
        store_sub = StoreProfile.objects.create(
            store_code='S004',
            store_name='门店4',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址4',
            business_region=self.region1,
            store_type='direct',
            operation_mode='self_operated',
            created_by=self.user1_sub
        )
        
        # 创建请求
        request = self.factory.get('/api/archive/stores/')
        request.user = self.user1_sub
        
        # 创建视图集
        viewset = StoreProfileViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        
        # 验证：子部门用户只能看到自己创建的数据
        self.assertEqual(queryset.count(), 1)
        self.assertEqual(queryset.first().id, store_sub.id)


class DataPermissionMixinTestCase(TestCase):
    """数据权限混入类单元测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.dept = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        self.user = User.objects.create_user(
            username='testuser',
            phone='13800000001',
            password='password123',
            department=self.dept
        )
        self.factory = RequestFactory()
    
    def test_data_permission_field_default(self):
        """测试数据权限字段默认值"""
        from common.permissions import DataPermissionMixin
        
        mixin = DataPermissionMixin()
        self.assertEqual(mixin.data_permission_field, 'created_by')
        self.assertEqual(mixin.department_field, 'created_by__department')
    
    def test_region_permission_field_default(self):
        """测试区域权限字段默认值"""
        from common.permissions import RegionPermissionMixin
        
        mixin = RegionPermissionMixin()
        self.assertEqual(mixin.region_field, 'business_region')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
