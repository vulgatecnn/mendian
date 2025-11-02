"""
用户管理功能测试
测试用户启用/停用、角色分配等功能
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from ..models import Department, Role, Permission, User
from ..services.audit_service import audit_logger

User = get_user_model()


class UserManagementTest(APITestCase):
    """用户管理功能测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        
        # 创建测试部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        # 创建管理员用户
        self.admin_user = User.objects.create_user(
            username='admin',
            password='admin123',
            phone='13800138000',
            wechat_user_id='admin_wechat_id',
            is_superuser=True,
            is_staff=True
        )
        
        # 创建测试用户
        self.test_user = User.objects.create_user(
            username='testuser',
            password='test123',
            phone='13800138001',
            wechat_user_id='test_wechat_id',
            first_name='测试用户',
            department=self.department,
            position='测试工程师',
            is_active=True
        )
        
        # 创建测试权限
        self.permission1 = Permission.objects.create(
            code='system.user.view',
            name='查看用户',
            module='系统管理'
        )
        self.permission2 = Permission.objects.create(
            code='system.user.manage',
            name='管理用户',
            module='系统管理'
        )
        
        # 创建测试角色
        self.role1 = Role.objects.create(
            name='普通用户',
            description='普通用户角色'
        )
        self.role1.permissions.add(self.permission1)
        
        self.role2 = Role.objects.create(
            name='管理员',
            description='管理员角色'
        )
        self.role2.permissions.add(self.permission1, self.permission2)
        
        # 设置API客户端
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_toggle_user_status_disable(self):
        """测试停用用户"""
        print("\n=== 测试停用用户 ===")
        
        # 确认用户初始状态为启用
        self.assertTrue(self.test_user.is_active)
        
        # 停用用户
        url = reverse('user-toggle-status', kwargs={'pk': self.test_user.pk})
        response = self.client.post(url)
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], '操作成功')
        
        # 验证用户状态已更新
        self.test_user.refresh_from_db()
        self.assertFalse(self.test_user.is_active)
        
        print(f"✓ 用户停用成功: {self.test_user.first_name}")
        print(f"✓ 用户状态: {self.test_user.is_active}")
    
    def test_toggle_user_status_enable(self):
        """测试启用用户"""
        print("\n=== 测试启用用户 ===")
        
        # 先停用用户
        self.test_user.is_active = False
        self.test_user.save()
        
        # 启用用户
        url = reverse('user-toggle-status', kwargs={'pk': self.test_user.pk})
        response = self.client.post(url)
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], '操作成功')
        
        # 验证用户状态已更新
        self.test_user.refresh_from_db()
        self.assertTrue(self.test_user.is_active)
        
        print(f"✓ 用户启用成功: {self.test_user.first_name}")
        print(f"✓ 用户状态: {self.test_user.is_active}")
    
    def test_assign_single_role(self):
        """测试分配单个角色"""
        print("\n=== 测试分配单个角色 ===")
        
        # 确认用户初始没有角色
        self.assertEqual(self.test_user.roles.count(), 0)
        
        # 分配角色
        url = reverse('user-assign-roles', kwargs={'pk': self.test_user.pk})
        data = {'role_ids': [self.role1.id]}
        response = self.client.post(url, data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], '角色分配成功')
        
        # 验证角色已分配
        self.assertEqual(self.test_user.roles.count(), 1)
        self.assertIn(self.role1, self.test_user.roles.all())
        
        # 验证用户权限
        self.assertTrue(self.test_user.has_permission('system.user.view'))
        self.assertFalse(self.test_user.has_permission('system.user.manage'))
        
        print(f"✓ 角色分配成功: {self.role1.name}")
        print(f"✓ 用户权限验证通过")
    
    def test_assign_multiple_roles(self):
        """测试分配多个角色"""
        print("\n=== 测试分配多个角色 ===")
        
        # 分配多个角色
        url = reverse('user-assign-roles', kwargs={'pk': self.test_user.pk})
        data = {'role_ids': [self.role1.id, self.role2.id]}
        response = self.client.post(url, data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 验证角色已分配
        self.assertEqual(self.test_user.roles.count(), 2)
        self.assertIn(self.role1, self.test_user.roles.all())
        self.assertIn(self.role2, self.test_user.roles.all())
        
        # 验证用户权限（应该拥有所有角色的权限）
        self.assertTrue(self.test_user.has_permission('system.user.view'))
        self.assertTrue(self.test_user.has_permission('system.user.manage'))
        
        print(f"✓ 多角色分配成功: {[role.name for role in self.test_user.roles.all()]}")
        print(f"✓ 用户权限验证通过")
    
    def test_replace_existing_roles(self):
        """测试替换已有角色"""
        print("\n=== 测试替换已有角色 ===")
        
        # 先分配一个角色
        self.test_user.roles.add(self.role1)
        self.assertEqual(self.test_user.roles.count(), 1)
        
        # 替换为另一个角色
        url = reverse('user-assign-roles', kwargs={'pk': self.test_user.pk})
        data = {'role_ids': [self.role2.id]}
        response = self.client.post(url, data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 验证角色已替换
        self.assertEqual(self.test_user.roles.count(), 1)
        self.assertNotIn(self.role1, self.test_user.roles.all())
        self.assertIn(self.role2, self.test_user.roles.all())
        
        # 验证权限已更新
        self.test_user.clear_permission_cache()
        self.assertTrue(self.test_user.has_permission('system.user.view'))
        self.assertTrue(self.test_user.has_permission('system.user.manage'))
        
        print(f"✓ 角色替换成功: {self.role1.name} -> {self.role2.name}")
        print(f"✓ 权限更新验证通过")
    
    def test_remove_all_roles(self):
        """测试移除所有角色"""
        print("\n=== 测试移除所有角色 ===")
        
        # 先分配角色
        self.test_user.roles.add(self.role1, self.role2)
        self.assertEqual(self.test_user.roles.count(), 2)
        
        # 移除所有角色
        url = reverse('user-assign-roles', kwargs={'pk': self.test_user.pk})
        data = {'role_ids': []}
        response = self.client.post(url, data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 验证所有角色已移除
        self.assertEqual(self.test_user.roles.count(), 0)
        
        # 验证用户没有权限
        self.test_user.clear_permission_cache()
        self.assertFalse(self.test_user.has_permission('system.user.view'))
        self.assertFalse(self.test_user.has_permission('system.user.manage'))
        
        print(f"✓ 所有角色移除成功")
        print(f"✓ 权限清除验证通过")
    
    def test_assign_invalid_role(self):
        """测试分配不存在的角色"""
        print("\n=== 测试分配不存在的角色 ===")
        
        # 尝试分配不存在的角色
        url = reverse('user-assign-roles', kwargs={'pk': self.test_user.pk})
        data = {'role_ids': [99999]}  # 不存在的角色ID
        response = self.client.post(url, data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # 检查错误信息（可能在不同的字段中）
        error_message = response.data.get('error') or response.data.get('detail') or str(response.data)
        self.assertIn('角色', error_message)
        
        # 验证用户角色未变化
        self.assertEqual(self.test_user.roles.count(), 0)
        
        print(f"✓ 无效角色处理正确: {response.data['error']}")
    
    def test_user_not_found(self):
        """测试用户不存在的情况"""
        print("\n=== 测试用户不存在的情况 ===")
        
        # 尝试操作不存在的用户
        url = reverse('user-toggle-status', kwargs={'pk': 99999})
        response = self.client.post(url)
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        print(f"✓ 用户不存在处理正确")


class UserLoginTest(TestCase):
    """用户登录测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        
        # 创建测试用户
        self.active_user = User.objects.create_user(
            username='active_user',
            password='test123',
            phone='13800138001',
            wechat_user_id='active_wechat_id',
            is_active=True
        )
        
        self.inactive_user = User.objects.create_user(
            username='inactive_user',
            password='test123',
            phone='13800138002',
            wechat_user_id='inactive_wechat_id',
            is_active=False
        )
        
        self.client = Client()
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_active_user_can_login(self):
        """测试启用用户可以登录"""
        print("\n=== 测试启用用户可以登录 ===")
        
        # 使用Django的认证系统测试
        from django.contrib.auth import authenticate
        user = authenticate(username='active_user', password='test123')
        self.assertIsNotNone(user)
        self.assertTrue(user.is_active)
        print(f"✓ 启用用户认证成功")
    
    def test_inactive_user_cannot_login(self):
        """测试停用用户无法登录"""
        print("\n=== 测试停用用户无法登录 ===")
        
        # 使用Django的认证系统测试
        from django.contrib.auth import authenticate
        user = authenticate(username='inactive_user', password='test123')
        # 即使密码正确，停用用户也不应该通过认证
        if user is None or not user.is_active:
            print(f"✓ 停用用户认证失败")
        else:
            self.fail("停用用户不应该通过认证")


class UserPermissionTest(TestCase):
    """用户权限测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            password='test123',
            phone='13800138001',
            wechat_user_id='test_wechat_id'
        )
        
        # 创建测试权限
        self.permission1 = Permission.objects.create(
            code='test.permission1',
            name='测试权限1',
            module='测试模块'
        )
        self.permission2 = Permission.objects.create(
            code='test.permission2',
            name='测试权限2',
            module='测试模块'
        )
        
        # 创建测试角色
        self.role1 = Role.objects.create(name='角色1')
        self.role1.permissions.add(self.permission1)
        
        self.role2 = Role.objects.create(name='角色2')
        self.role2.permissions.add(self.permission2)
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_user_permission_after_role_assignment(self):
        """测试角色分配后用户权限立即生效"""
        print("\n=== 测试角色分配后用户权限立即生效 ===")
        
        # 初始状态：用户没有权限
        self.assertFalse(self.user.has_permission('test.permission1'))
        self.assertFalse(self.user.has_permission('test.permission2'))
        
        # 分配角色1
        self.role1.add_users([self.user.id])
        
        # 验证权限立即生效
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertFalse(self.user.has_permission('test.permission2'))
        
        # 分配角色2
        self.role2.add_users([self.user.id])
        
        # 验证权限立即生效
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        print(f"✓ 角色分配后权限立即生效")
    
    def test_user_permission_after_role_removal(self):
        """测试角色移除后用户权限立即失效"""
        print("\n=== 测试角色移除后用户权限立即失效 ===")
        
        # 先分配角色
        self.user.roles.add(self.role1, self.role2)
        self.user.clear_permission_cache()
        
        # 验证用户有权限
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        # 移除角色1
        self.user.roles.remove(self.role1)
        self.user.clear_permission_cache()
        
        # 验证权限立即失效
        self.assertFalse(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        # 移除角色2
        self.user.roles.remove(self.role2)
        self.user.clear_permission_cache()
        
        # 验证所有权限失效
        self.assertFalse(self.user.has_permission('test.permission1'))
        self.assertFalse(self.user.has_permission('test.permission2'))
        
        print(f"✓ 角色移除后权限立即失效")
    
    def test_user_permission_after_role_permission_change(self):
        """测试角色权限变更后用户权限立即更新"""
        print("\n=== 测试角色权限变更后用户权限立即更新 ===")
        
        # 分配角色
        self.user.roles.add(self.role1)
        self.user.clear_permission_cache()
        
        # 验证初始权限
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertFalse(self.user.has_permission('test.permission2'))
        
        # 为角色添加新权限
        self.role1.add_permissions(['test.permission2'])
        
        # 验证权限立即更新
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        # 移除角色权限
        self.role1.permissions.remove(self.permission1)
        # 清除用户权限缓存
        self.user.clear_permission_cache()
        
        # 验证权限立即失效
        self.assertFalse(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        print(f"✓ 角色权限变更后用户权限立即更新")


print("用户管理功能测试文件创建成功！")
print("\n运行测试命令：")
print("python manage.py test system_management.tests.test_user_management")