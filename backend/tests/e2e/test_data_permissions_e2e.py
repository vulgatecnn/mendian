"""
数据权限端到端测试
测试数据权限在实际API请求中的工作情况
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from system_management.models import Department, Role, Permission
from base_data.models import BusinessRegion
from store_expansion.models import CandidateLocation, FollowUpRecord
from store_preparation.models import ConstructionOrder, DeliveryChecklist
from store_archive.models import StoreProfile

User = get_user_model()


class DataPermissionE2ETestCase(TestCase):
    """数据权限端到端测试"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建部门
        self.dept1 = Department.objects.create(
            wechat_dept_id=1,
            name='销售部'
        )
        self.dept2 = Department.objects.create(
            wechat_dept_id=2,
            name='运营部'
        )
        self.dept1_sub = Department.objects.create(
            wechat_dept_id=3,
            name='销售一部',
            parent=self.dept1
        )
        
        # 创建权限 - 拓店管理
        self.perm_view_all = Permission.objects.create(
            code='store_expansion.view_all',
            name='查看所有拓店数据',
            module='store_expansion'
        )
        self.perm_view_dept = Permission.objects.create(
            code='store_expansion.view_department',
            name='查看本部门拓店数据',
            module='store_expansion'
        )
        self.perm_view_dept_sub = Permission.objects.create(
            code='store_expansion.view_department_and_sub',
            name='查看本部门及下级拓店数据',
            module='store_expansion'
        )
        
        # 创建权限 - 门店档案
        self.perm_archive_view_all = Permission.objects.create(
            code='store_archive.view_all',
            name='查看所有门店档案',
            module='store_archive'
        )
        
        # 创建角色
        self.role_admin = Role.objects.create(
            name='系统管理员',
            is_active=True
        )
        self.role_admin.permissions.add(self.perm_view_all, self.perm_archive_view_all)
        
        self.role_manager = Role.objects.create(
            name='部门经理',
            is_active=True
        )
        self.role_manager.permissions.add(self.perm_view_dept_sub)
        
        self.role_staff = Role.objects.create(
            name='普通员工',
            is_active=True
        )
        
        # 创建用户
        self.user_admin = User.objects.create_user(
            username='admin',
            phone='13900000001',
            password='password123',
            department=self.dept1
        )
        self.user_admin.roles.add(self.role_admin)
        
        self.user_manager = User.objects.create_user(
            username='manager',
            phone='13900000002',
            password='password123',
            department=self.dept1
        )
        self.user_manager.roles.add(self.role_manager)
        
        self.user_staff1 = User.objects.create_user(
            username='staff1',
            phone='13900000003',
            password='password123',
            department=self.dept1
        )
        self.user_staff1.roles.add(self.role_staff)
        
        self.user_staff2 = User.objects.create_user(
            username='staff2',
            phone='13900000004',
            password='password123',
            department=self.dept2
        )
        self.user_staff2.roles.add(self.role_staff)
        
        self.user_staff_sub = User.objects.create_user(
            username='staff_sub',
            phone='13900000005',
            password='password123',
            department=self.dept1_sub
        )
        self.user_staff_sub.roles.add(self.role_staff)
        
        # 创建业务大区
        self.region1 = BusinessRegion.objects.create(
            name='华东大区',
            code='HD',
            created_by=self.user_admin
        )
        self.region2 = BusinessRegion.objects.create(
            name='华南大区',
            code='HN',
            created_by=self.user_admin
        )
        
        # 创建候选点位
        self.location1 = CandidateLocation.objects.create(
            name='上海浦东点位',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址1',
            area=100,
            rent=10000,
            business_region=self.region1,
            created_by=self.user_staff1
        )
        self.location2 = CandidateLocation.objects.create(
            name='深圳南山点位',
            province='广东省',
            city='深圳市',
            district='南山区',
            address='测试地址2',
            area=120,
            rent=12000,
            business_region=self.region2,
            created_by=self.user_staff2
        )
        self.location3 = CandidateLocation.objects.create(
            name='上海徐汇点位',
            province='上海市',
            city='上海市',
            district='徐汇区',
            address='测试地址3',
            area=110,
            rent=11000,
            business_region=self.region1,
            created_by=self.user_staff_sub
        )
        
        # 创建API客户端
        self.client = APIClient()
    
    def test_candidate_location_list_as_admin(self):
        """测试管理员查看候选点位列表"""
        self.client.force_authenticate(user=self.user_admin)
        response = self.client.get('/api/expansion/locations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 管理员应该能看到所有3个点位
        self.assertEqual(len(response.data['results']), 3)
    
    def test_candidate_location_list_as_manager(self):
        """测试部门经理查看候选点位列表"""
        self.client.force_authenticate(user=self.user_manager)
        response = self.client.get('/api/expansion/locations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 部门经理应该能看到本部门及下级部门的点位（location1 和 location3）
        self.assertEqual(len(response.data['results']), 2)
        location_ids = [loc['id'] for loc in response.data['results']]
        self.assertIn(self.location1.id, location_ids)
        self.assertIn(self.location3.id, location_ids)
        self.assertNotIn(self.location2.id, location_ids)
    
    def test_candidate_location_list_as_staff(self):
        """测试普通员工查看候选点位列表"""
        self.client.force_authenticate(user=self.user_staff1)
        response = self.client.get('/api/expansion/locations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 普通员工只能看到自己创建的点位
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.location1.id)
    
    def test_candidate_location_list_as_other_dept_staff(self):
        """测试其他部门员工查看候选点位列表"""
        self.client.force_authenticate(user=self.user_staff2)
        response = self.client.get('/api/expansion/locations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 其他部门员工只能看到自己创建的点位
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.location2.id)
    
    def test_candidate_location_retrieve_own(self):
        """测试查看自己创建的点位详情"""
        self.client.force_authenticate(user=self.user_staff1)
        response = self.client.get(f'/api/expansion/locations/{self.location1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.location1.id)
    
    def test_candidate_location_retrieve_others_forbidden(self):
        """测试查看他人创建的点位详情（应该被禁止）"""
        self.client.force_authenticate(user=self.user_staff1)
        response = self.client.get(f'/api/expansion/locations/{self.location2.id}/')
        
        # 应该返回404（因为queryset过滤后找不到该对象）
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_candidate_location_create(self):
        """测试创建候选点位"""
        self.client.force_authenticate(user=self.user_staff1)
        data = {
            'name': '新点位',
            'province': '上海市',
            'city': '上海市',
            'district': '黄浦区',
            'address': '测试地址4',
            'area': 130,
            'rent': 13000,
            'business_region': self.region1.id
        }
        response = self.client.post('/api/expansion/locations/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 验证创建者被正确设置
        location = CandidateLocation.objects.get(id=response.data['data']['id'])
        self.assertEqual(location.created_by, self.user_staff1)
    
    def test_construction_order_list_permissions(self):
        """测试工程单列表的数据权限"""
        # 创建跟进单
        follow_up1 = FollowUpRecord.objects.create(
            record_no='FU001',
            location=self.location1,
            created_by=self.user_staff1
        )
        follow_up2 = FollowUpRecord.objects.create(
            record_no='FU002',
            location=self.location2,
            created_by=self.user_staff2
        )
        
        # 创建工程单
        order1 = ConstructionOrder.objects.create(
            order_no='CO001',
            store_name='门店1',
            follow_up_record=follow_up1,
            created_by=self.user_staff1
        )
        order2 = ConstructionOrder.objects.create(
            order_no='CO002',
            store_name='门店2',
            follow_up_record=follow_up2,
            created_by=self.user_staff2
        )
        
        # 测试staff1只能看到自己的工程单
        self.client.force_authenticate(user=self.user_staff1)
        response = self.client.get('/api/preparation/construction/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], order1.id)
    
    def test_store_profile_list_permissions(self):
        """测试门店档案列表的数据权限"""
        # 创建门店档案
        store1 = StoreProfile.objects.create(
            store_code='S001',
            store_name='门店1',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址1',
            business_region=self.region1,
            store_type='standard',
            operation_mode='direct',
            created_by=self.user_staff1
        )
        store2 = StoreProfile.objects.create(
            store_code='S002',
            store_name='门店2',
            province='广东省',
            city='深圳市',
            district='南山区',
            address='测试地址2',
            business_region=self.region2,
            store_type='standard',
            operation_mode='direct',
            created_by=self.user_staff2
        )
        store3 = StoreProfile.objects.create(
            store_code='S003',
            store_name='门店3',
            province='上海市',
            city='上海市',
            district='徐汇区',
            address='测试地址3',
            business_region=self.region1,
            store_type='standard',
            operation_mode='direct',
            created_by=self.user_staff_sub
        )
        
        # 测试管理员能看到所有门店
        self.client.force_authenticate(user=self.user_admin)
        response = self.client.get('/api/archive/stores/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 门店档案API返回格式为 {'success': True, 'data': {...}}
        # 管理员应该能看到所有3个门店
        # 处理分页和非分页情况
        if isinstance(response.data['data'], dict) and 'results' in response.data['data']:
            results = response.data['data']['results']
        else:
            results = response.data['data']
        store_ids = [s['id'] for s in results]
        self.assertIn(store1.id, store_ids)
        self.assertIn(store2.id, store_ids)
        self.assertIn(store3.id, store_ids)
        
        # 测试普通员工只能看到自己的门店
        self.client.force_authenticate(user=self.user_staff1)
        response = self.client.get('/api/archive/stores/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 处理分页和非分页情况
        if isinstance(response.data['data'], dict) and 'results' in response.data['data']:
            results = response.data['data']['results']
        else:
            results = response.data['data']
        # 普通员工只能看到自己创建的门店
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], store1.id)
    
    def test_unauthorized_access(self):
        """测试未认证用户访问"""
        response = self.client.get('/api/expansion/locations/')
        
        # 应该返回401未认证
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_filter_by_region(self):
        """测试按区域过滤"""
        self.client.force_authenticate(user=self.user_admin)
        
        # 过滤华东大区的点位
        response = self.client.get(f'/api/expansion/locations/?business_region={self.region1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # 过滤华南大区的点位
        response = self.client.get(f'/api/expansion/locations/?business_region={self.region2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_search_with_permissions(self):
        """测试搜索功能结合数据权限"""
        self.client.force_authenticate(user=self.user_staff1)
        
        # 搜索"上海"，但只能看到自己创建的
        response = self.client.get('/api/expansion/locations/?search=上海')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.location1.id)
    
    def test_ordering_with_permissions(self):
        """测试排序功能结合数据权限"""
        self.client.force_authenticate(user=self.user_admin)
        
        # 按面积升序排序
        response = self.client.get('/api/expansion/locations/?ordering=area')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
        # 验证排序正确
        areas = [loc['area'] for loc in response.data['results']]
        self.assertEqual(areas, sorted(areas))
    
    def test_pagination_with_permissions(self):
        """测试分页功能结合数据权限"""
        # 创建更多点位
        for i in range(10):
            CandidateLocation.objects.create(
                name=f'点位{i}',
                province='上海市',
                city='上海市',
                district='浦东新区',
                address=f'测试地址{i}',
                area=100 + i,
                rent=10000 + i * 1000,
                business_region=self.region1,
                created_by=self.user_staff1
            )
        
        self.client.force_authenticate(user=self.user_staff1)
        
        # 测试数据权限过滤（用户应该能看到自己创建的所有点位）
        response = self.client.get('/api/expansion/locations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 用户应该能看到自己创建的11个点位（1个初始 + 10个新建）
        self.assertEqual(len(response.data['results']), 11)


class DataPermissionCacheTestCase(TestCase):
    """数据权限缓存测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.dept = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        self.user = User.objects.create_user(
            username='testuser',
            phone='13900000001',
            password='password123',
            department=self.dept
        )
        
        self.region = BusinessRegion.objects.create(
            name='测试大区',
            code='TEST',
            created_by=self.user
        )
        
        self.client = APIClient()
    
    def test_permission_cache_consistency(self):
        """测试权限缓存的一致性"""
        # 创建点位
        location = CandidateLocation.objects.create(
            name='测试点位',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址',
            area=100,
            rent=10000,
            business_region=self.region,
            created_by=self.user
        )
        
        # 第一次请求
        self.client.force_authenticate(user=self.user)
        response1 = self.client.get('/api/expansion/locations/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        count1 = len(response1.data['results'])
        
        # 第二次请求（应该使用缓存）
        response2 = self.client.get('/api/expansion/locations/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        count2 = len(response2.data['results'])
        
        # 验证结果一致
        self.assertEqual(count1, count2)


class DataPermissionEdgeCaseTestCase(TestCase):
    """数据权限边界情况测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.dept = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        self.user_no_dept = User.objects.create_user(
            username='user_no_dept',
            phone='13900000001',
            password='password123',
            department=None  # 没有部门
        )
        
        self.user_with_dept = User.objects.create_user(
            username='user_with_dept',
            phone='13900000002',
            password='password123',
            department=self.dept
        )
        
        self.region = BusinessRegion.objects.create(
            name='测试大区',
            code='TEST',
            created_by=self.user_with_dept
        )
        
        self.client = APIClient()
    
    def test_user_without_department(self):
        """测试没有部门的用户"""
        # 创建点位
        location = CandidateLocation.objects.create(
            name='测试点位',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址',
            area=100,
            rent=10000,
            business_region=self.region,
            created_by=self.user_no_dept
        )
        
        # 没有部门的用户应该只能看到自己创建的数据
        self.client.force_authenticate(user=self.user_no_dept)
        response = self.client.get('/api/expansion/locations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], location.id)
    
    def test_empty_queryset(self):
        """测试空查询集"""
        self.client.force_authenticate(user=self.user_with_dept)
        response = self.client.get('/api/expansion/locations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)
    
    def test_deleted_creator(self):
        """测试创建者被删除的情况"""
        # 创建点位
        location = CandidateLocation.objects.create(
            name='测试点位',
            province='上海市',
            city='上海市',
            district='浦东新区',
            address='测试地址',
            area=100,
            rent=10000,
            business_region=self.region,
            created_by=self.user_with_dept
        )
        
        # 删除创建者
        creator_id = self.user_with_dept.id
        self.user_with_dept.delete()
        
        # 创建新用户查询
        new_user = User.objects.create_user(
            username='newuser',
            phone='13900000003',
            password='password123',
            department=self.dept
        )
        
        self.client.force_authenticate(user=new_user)
        response = self.client.get('/api/expansion/locations/')
        
        # 新用户不应该看到该点位（因为创建者已被删除）
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
