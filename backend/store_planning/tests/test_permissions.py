"""
开店计划管理模块权限测试
"""
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from system_management.models import Permission, Role, Department
from store_planning.models import StorePlan, BusinessRegion, StoreType
from store_planning.permissions import (
    check_data_scope_permission,
    plan_permission_required
)

User = get_user_model()


class PermissionTestCase(TestCase):
    """权限基础测试"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            phone='13800138000',
            wechat_user_id='test_wechat_id',
            department=self.department
        )
        
        # 创建超级管理员
        self.admin = User.objects.create_superuser(
            username='admin',
            phone='13800138001',
            wechat_user_id='admin_wechat_id',
            department=self.department
        )
        
        # 创建权限
        self.view_permission = Permission.objects.create(
            code='store_planning.plan.view',
            name='查看计划',
            module='开店计划管理'
        )
        
        self.create_permission = Permission.objects.create(
            code='store_planning.plan.create',
            name='创建计划',
            module='开店计划管理'
        )
        
        self.delete_permission = Permission.objects.create(
            code='store_planning.plan.delete',
            name='删除计划',
            module='开店计划管理'
        )
        
        # 创建角色
        self.role = Role.objects.create(
            name='计划管理员',
            code='plan_manager',
            is_active=True
        )
        self.role.permissions.add(self.view_permission, self.create_permission)
        
        # 为用户分配角色
        self.user.roles.add(self.role)
        
        # 创建测试数据
        self.region = BusinessRegion.objects.create(
            name='华东区',
            code='HD'
        )
        
        self.store_type = StoreType.objects.create(
            name='直营店',
            code='ZY'
        )
        
        self.plan = StorePlan.objects.create(
            name='2024年开店计划',
            plan_type='annual',
            status='draft',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
    
    def test_user_has_permission(self):
        """测试用户有权限"""
        self.assertTrue(self.user.has_permission('store_planning.plan.view'))
        self.assertTrue(self.user.has_permission('store_planning.plan.create'))
    
    def test_user_no_permission(self):
        """测试用户没有权限"""
        self.assertFalse(self.user.has_permission('store_planning.plan.delete'))
    
    def test_superuser_has_all_permissions(self):
        """测试超级管理员有所有权限"""
        self.assertTrue(self.admin.has_permission('store_planning.plan.view'))
        self.assertTrue(self.admin.has_permission('store_planning.plan.create'))
        self.assertTrue(self.admin.has_permission('store_planning.plan.delete'))
        self.assertTrue(self.admin.has_permission('any.permission.code'))
    
    def test_data_scope_permission_creator(self):
        """测试数据范围权限 - 创建者"""
        self.assertTrue(
            check_data_scope_permission(self.user, self.plan, 'view')
        )
        self.assertTrue(
            check_data_scope_permission(self.user, self.plan, 'edit')
        )
    
    def test_data_scope_permission_non_creator(self):
        """测试数据范围权限 - 非创建者"""
        other_user = User.objects.create_user(
            username='otheruser',
            phone='13800138002',
            wechat_user_id='other_wechat_id',
            department=self.department
        )
        other_user.roles.add(self.role)
        
        # 非创建者没有查看权限（没有view_all权限）
        self.assertFalse(
            check_data_scope_permission(other_user, self.plan, 'view')
        )
    
    def test_data_scope_permission_admin(self):
        """测试数据范围权限 - 管理员"""
        self.assertTrue(
            check_data_scope_permission(self.admin, self.plan, 'view')
        )
        self.assertTrue(
            check_data_scope_permission(self.admin, self.plan, 'edit')
        )
        self.assertTrue(
            check_data_scope_permission(self.admin, self.plan, 'delete')
        )
    
    def test_permission_cache(self):
        """测试权限缓存"""
        # 第一次调用会从数据库加载
        self.assertTrue(self.user.has_permission('store_planning.plan.view'))
        
        # 第二次调用应该从缓存加载
        self.assertTrue(self.user.has_permission('store_planning.plan.view'))
        
        # 清除缓存
        self.user.clear_permission_cache()
        
        # 再次调用会重新从数据库加载
        self.assertTrue(self.user.has_permission('store_planning.plan.view'))


class APIPermissionTestCase(APITestCase):
    """API权限测试"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            phone='13800138000',
            wechat_user_id='test_wechat_id',
            department=self.department
        )
        
        # 创建权限
        self.view_permission = Permission.objects.create(
            code='store_planning.plan.view',
            name='查看计划',
            module='开店计划管理'
        )
        
        self.create_permission = Permission.objects.create(
            code='store_planning.plan.create',
            name='创建计划',
            module='开店计划管理'
        )
        
        # 创建角色并分配权限
        self.role = Role.objects.create(
            name='计划管理员',
            code='plan_manager',
            is_active=True
        )
        self.role.permissions.add(self.view_permission, self.create_permission)
        self.user.roles.add(self.role)
        
        # 创建测试数据
        self.region = BusinessRegion.objects.create(
            name='华东区',
            code='HD'
        )
        
        self.store_type = StoreType.objects.create(
            name='直营店',
            code='ZY'
        )
        
        self.plan = StorePlan.objects.create(
            name='2024年开店计划',
            plan_type='annual',
            status='draft',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
        
        # 设置API客户端
        self.client = APIClient()
    
    def test_api_without_authentication(self):
        """测试未认证的API访问"""
        response = self.client.get('/api/store-planning/plans/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_api_with_authentication_and_permission(self):
        """测试有认证和权限的API访问"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/store-planning/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_api_with_authentication_no_permission(self):
        """测试有认证但无权限的API访问"""
        # 创建没有权限的用户
        user_no_perm = User.objects.create_user(
            username='nopermuser',
            phone='13800138003',
            wechat_user_id='noperm_wechat_id',
            department=self.department
        )
        
        self.client.force_authenticate(user=user_no_perm)
        response = self.client.get('/api/store-planning/plans/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_api_create_with_permission(self):
        """测试有权限的创建操作"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': '2025年开店计划',
            'plan_type': 'annual',
            'start_date': '2025-01-01',
            'end_date': '2025-12-31',
            'description': '测试计划',
            'regional_plans': [
                {
                    'region_id': self.region.id,
                    'store_type_id': self.store_type.id,
                    'target_count': 10,
                    'contribution_rate': 20.0,
                    'budget_amount': 1000000
                }
            ]
        }
        
        response = self.client.post(
            '/api/store-planning/plans/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_api_delete_without_confirmation(self):
        """测试删除操作未提供确认参数"""
        # 添加删除权限
        delete_permission = Permission.objects.create(
            code='store_planning.plan.delete',
            name='删除计划',
            module='开店计划管理'
        )
        self.role.permissions.add(delete_permission)
        self.user.clear_permission_cache()
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(
            f'/api/store-planning/plans/{self.plan.id}/',
            format='json'
        )
        # 应该返回400，要求确认
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirmation', response.data.get('error', '').lower())
    
    def test_api_delete_with_confirmation(self):
        """测试删除操作提供确认参数"""
        # 添加删除权限
        delete_permission = Permission.objects.create(
            code='store_planning.plan.delete',
            name='删除计划',
            module='开店计划管理'
        )
        self.role.permissions.add(delete_permission)
        self.user.clear_permission_cache()
        
        self.client.force_authenticate(user=self.user)
        
        response = self.client.delete(
            f'/api/store-planning/plans/{self.plan.id}/',
            {'confirmation': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class DataScopePermissionTestCase(TestCase):
    """数据范围权限测试"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        # 创建用户
        self.user1 = User.objects.create_user(
            username='user1',
            phone='13800138001',
            wechat_user_id='user1_wechat_id',
            department=self.department
        )
        
        self.user2 = User.objects.create_user(
            username='user2',
            phone='13800138002',
            wechat_user_id='user2_wechat_id',
            department=self.department
        )
        
        # 创建权限
        view_permission = Permission.objects.create(
            code='store_planning.plan.view',
            name='查看计划',
            module='开店计划管理'
        )
        
        view_all_permission = Permission.objects.create(
            code='store_planning.plan.view_all',
            name='查看所有计划',
            module='开店计划管理'
        )
        
        # 创建角色
        basic_role = Role.objects.create(
            name='基础用户',
            code='basic_user',
            is_active=True
        )
        basic_role.permissions.add(view_permission)
        
        manager_role = Role.objects.create(
            name='管理员',
            code='manager',
            is_active=True
        )
        manager_role.permissions.add(view_permission, view_all_permission)
        
        # 分配角色
        self.user1.roles.add(basic_role)
        self.user2.roles.add(manager_role)
        
        # 创建测试数据
        region = BusinessRegion.objects.create(name='华东区', code='HD')
        store_type = StoreType.objects.create(name='直营店', code='ZY')
        
        self.plan1 = StorePlan.objects.create(
            name='用户1的计划',
            plan_type='annual',
            status='draft',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user1
        )
        
        self.plan2 = StorePlan.objects.create(
            name='用户2的计划',
            plan_type='annual',
            status='draft',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user2
        )
    
    def test_creator_can_view_own_plan(self):
        """测试创建者可以查看自己的计划"""
        self.assertTrue(
            check_data_scope_permission(self.user1, self.plan1, 'view')
        )
    
    def test_basic_user_cannot_view_others_plan(self):
        """测试基础用户不能查看他人的计划"""
        self.assertFalse(
            check_data_scope_permission(self.user1, self.plan2, 'view')
        )
    
    def test_manager_can_view_all_plans(self):
        """测试管理员可以查看所有计划"""
        self.assertTrue(
            check_data_scope_permission(self.user2, self.plan1, 'view')
        )
        self.assertTrue(
            check_data_scope_permission(self.user2, self.plan2, 'view')
        )


if __name__ == '__main__':
    import unittest
    unittest.main()
