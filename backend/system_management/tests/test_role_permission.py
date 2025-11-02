"""
角色和权限功能测试
测试角色创建、编辑、删除、权限分配等功能
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from ..models import Department, Role, Permission, User
from ..serializers import RoleSerializer

User = get_user_model()


class RoleManagementTest(APITestCase):
    """角色管理功能测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        
        # 创建管理员用户
        self.admin_user = User.objects.create_user(
            username='admin',
            password='admin123',
            phone='13800138000',
            wechat_user_id='admin_wechat_id',
            is_superuser=True,
            is_staff=True
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
        self.permission3 = Permission.objects.create(
            code='system.role.manage',
            name='管理角色',
            module='系统管理'
        )
        
        # 创建测试角色
        self.test_role = Role.objects.create(
            name='测试角色',
            description='用于测试的角色',
            is_active=True
        )
        self.test_role.permissions.add(self.permission1)
        
        # 设置API客户端
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_create_role_success(self):
        """测试创建角色成功"""
        print("\n=== 测试创建角色成功 ===")
        
        # 创建角色数据
        role_data = {
            'name': '新角色',
            'description': '这是一个新创建的角色',
            'is_active': True,
            'permission_ids': [self.permission1.id, self.permission2.id]
        }
        
        # 发送创建请求
        url = reverse('role-list')
        response = self.client.post(url, role_data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], '新角色')
        self.assertEqual(response.data['description'], '这是一个新创建的角色')
        self.assertTrue(response.data['is_active'])
        
        # 验证数据库中的角色
        new_role = Role.objects.get(name='新角色')
        self.assertEqual(new_role.description, '这是一个新创建的角色')
        self.assertEqual(new_role.permissions.count(), 2)
        self.assertIn(self.permission1, new_role.permissions.all())
        self.assertIn(self.permission2, new_role.permissions.all())
        
        print(f"✓ 角色创建成功: {new_role.name}")
        print(f"✓ 权限分配成功: {new_role.permissions.count()} 个权限")
    
    def test_create_role_duplicate_name(self):
        """测试创建重名角色失败"""
        print("\n=== 测试创建重名角色失败 ===")
        
        # 尝试创建同名角色
        role_data = {
            'name': '测试角色',  # 与已存在的角色同名
            'description': '重名角色',
            'is_active': True,
            'permission_ids': [self.permission1.id]
        }
        
        url = reverse('role-list')
        response = self.client.post(url, role_data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        
        print(f"✓ 重名角色创建被拒绝")
    
    def test_update_role_success(self):
        """测试更新角色成功"""
        print("\n=== 测试更新角色成功 ===")
        
        # 更新角色数据
        update_data = {
            'name': '更新后的角色',
            'description': '这是更新后的描述',
            'is_active': True,
            'permission_ids': [self.permission2.id, self.permission3.id]
        }
        
        # 发送更新请求
        url = reverse('role-detail', kwargs={'pk': self.test_role.pk})
        response = self.client.put(url, update_data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], '更新后的角色')
        self.assertEqual(response.data['description'], '这是更新后的描述')
        
        # 验证数据库中的角色已更新
        self.test_role.refresh_from_db()
        self.assertEqual(self.test_role.name, '更新后的角色')
        self.assertEqual(self.test_role.description, '这是更新后的描述')
        self.assertEqual(self.test_role.permissions.count(), 2)
        self.assertNotIn(self.permission1, self.test_role.permissions.all())
        self.assertIn(self.permission2, self.test_role.permissions.all())
        self.assertIn(self.permission3, self.test_role.permissions.all())
        
        print(f"✓ 角色更新成功: {self.test_role.name}")
        print(f"✓ 权限更新成功: {self.test_role.permissions.count()} 个权限")
    
    def test_delete_role_not_in_use(self):
        """测试删除未被使用的角色"""
        print("\n=== 测试删除未被使用的角色 ===")
        
        # 确认角色未被使用
        self.assertFalse(self.test_role.is_in_use())
        
        # 发送删除请求
        url = reverse('role-detail', kwargs={'pk': self.test_role.pk})
        response = self.client.delete(url)
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # 验证角色已被删除
        self.assertFalse(Role.objects.filter(pk=self.test_role.pk).exists())
        
        print(f"✓ 未使用的角色删除成功")
    
    def test_delete_role_in_use(self):
        """测试删除正在使用的角色被阻止"""
        print("\n=== 测试删除正在使用的角色被阻止 ===")
        
        # 创建用户并分配角色
        test_user = User.objects.create_user(
            username='roleuser',
            password='test123',
            phone='13800138001',
            wechat_user_id='roleuser_wechat_id'
        )
        self.test_role.users.add(test_user)
        
        # 确认角色正在被使用
        self.assertTrue(self.test_role.is_in_use())
        
        # 尝试删除角色
        url = reverse('role-detail', kwargs={'pk': self.test_role.pk})
        response = self.client.delete(url)
        
        # 验证删除被阻止
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('正在使用', response.data['error'])
        
        # 验证角色仍然存在
        self.assertTrue(Role.objects.filter(pk=self.test_role.pk).exists())
        
        print(f"✓ 正在使用的角色删除被阻止")
        
        # 清理测试用户
        test_user.delete()
    
    def test_assign_permissions_to_role(self):
        """测试为角色分配权限"""
        print("\n=== 测试为角色分配权限 ===")
        
        # 初始状态：角色只有一个权限
        self.assertEqual(self.test_role.permissions.count(), 1)
        
        # 分配权限
        url = reverse('role-assign-permissions', kwargs={'pk': self.test_role.pk})
        data = {'permission_ids': [self.permission1.id, self.permission2.id, self.permission3.id]}
        response = self.client.post(url, data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], '权限分配成功')
        
        # 验证权限已分配
        self.assertEqual(self.test_role.permissions.count(), 3)
        self.assertIn(self.permission1, self.test_role.permissions.all())
        self.assertIn(self.permission2, self.test_role.permissions.all())
        self.assertIn(self.permission3, self.test_role.permissions.all())
        
        print(f"✓ 权限分配成功: {self.test_role.permissions.count()} 个权限")
    
    def test_add_members_to_role(self):
        """测试为角色添加成员"""
        print("\n=== 测试为角色添加成员 ===")
        
        # 创建测试用户
        user1 = User.objects.create_user(
            username='user1',
            password='test123',
            phone='13800138001',
            wechat_user_id='user1_wechat_id'
        )
        user2 = User.objects.create_user(
            username='user2',
            password='test123',
            phone='13800138002',
            wechat_user_id='user2_wechat_id'
        )
        
        # 初始状态：角色没有成员
        self.assertEqual(self.test_role.get_member_count(), 0)
        
        # 添加成员
        url = reverse('role-add-members', kwargs={'pk': self.test_role.pk})
        data = {'user_ids': [user1.id, user2.id]}
        response = self.client.post(url, data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], '成员添加成功')
        
        # 验证成员已添加
        self.assertEqual(self.test_role.get_member_count(), 2)
        self.assertIn(user1, self.test_role.users.all())
        self.assertIn(user2, self.test_role.users.all())
        
        # 验证用户权限
        user1.clear_permission_cache()
        user2.clear_permission_cache()
        self.assertTrue(user1.has_permission('system.user.view'))
        self.assertTrue(user2.has_permission('system.user.view'))
        
        print(f"✓ 成员添加成功: {self.test_role.get_member_count()} 个成员")
        print(f"✓ 用户权限验证通过")
        
        # 清理测试用户
        user1.delete()
        user2.delete()
    
    def test_get_role_members(self):
        """测试获取角色成员列表"""
        print("\n=== 测试获取角色成员列表 ===")
        
        # 创建测试用户并添加到角色
        user1 = User.objects.create_user(
            username='member1',
            password='test123',
            phone='13800138001',
            wechat_user_id='member1_wechat_id',
            first_name='成员1'
        )
        user2 = User.objects.create_user(
            username='member2',
            password='test123',
            phone='13800138002',
            wechat_user_id='member2_wechat_id',
            first_name='成员2'
        )
        self.test_role.users.add(user1, user2)
        
        # 获取角色成员
        url = reverse('role-members', kwargs={'pk': self.test_role.pk})
        response = self.client.get(url)
        
        # 验证响应
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # 验证成员信息
        member_names = [member['first_name'] for member in response.data['results']]
        self.assertIn('成员1', member_names)
        self.assertIn('成员2', member_names)
        
        print(f"✓ 角色成员列表获取成功: {len(response.data['results'])} 个成员")
        
        # 清理测试用户
        user1.delete()
        user2.delete()


class PermissionManagementTest(TestCase):
    """权限管理功能测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        
        # 创建测试权限
        self.perm1 = Permission.objects.create(
            code='module1.action1',
            name='模块1操作1',
            module='模块1'
        )
        self.perm2 = Permission.objects.create(
            code='module1.action2',
            name='模块1操作2',
            module='模块1'
        )
        self.perm3 = Permission.objects.create(
            code='module2.action1',
            name='模块2操作1',
            module='模块2'
        )
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_permission_grouping_by_module(self):
        """测试权限按模块分组"""
        print("\n=== 测试权限按模块分组 ===")
        
        # 获取所有权限
        permissions = Permission.objects.all()
        
        # 按模块分组
        grouped_permissions = {}
        for perm in permissions:
            if perm.module not in grouped_permissions:
                grouped_permissions[perm.module] = []
            grouped_permissions[perm.module].append(perm)
        
        # 验证分组结果
        self.assertIn('模块1', grouped_permissions)
        self.assertIn('模块2', grouped_permissions)
        self.assertEqual(len(grouped_permissions['模块1']), 2)
        self.assertEqual(len(grouped_permissions['模块2']), 1)
        
        print(f"✓ 权限分组正确:")
        for module, perms in grouped_permissions.items():
            print(f"  - {module}: {len(perms)} 个权限")


class RolePermissionIntegrationTest(TestCase):
    """角色权限集成测试"""
    
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
        self.role = Role.objects.create(
            name='测试角色',
            description='用于集成测试的角色'
        )
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    def test_role_permission_modification_affects_users(self):
        """测试角色权限修改立即影响用户"""
        print("\n=== 测试角色权限修改立即影响用户 ===")
        
        # 用户分配角色
        self.role.users.add(self.user)
        self.user.clear_permission_cache()
        
        # 初始状态：用户没有权限
        self.assertFalse(self.user.has_permission('test.permission1'))
        self.assertFalse(self.user.has_permission('test.permission2'))
        
        # 为角色添加权限
        self.role.add_permissions(['test.permission1'])
        
        # 验证用户立即获得权限
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertFalse(self.user.has_permission('test.permission2'))
        
        # 为角色添加更多权限
        self.role.add_permissions(['test.permission2'])
        
        # 验证用户立即获得新权限
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        # 移除角色权限
        self.role.permissions.remove(self.permission1)
        self.role.clear_user_permission_cache()
        
        # 验证用户立即失去权限
        self.assertFalse(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        print(f"✓ 角色权限修改立即影响用户权限")
    
    def test_inactive_role_no_permissions(self):
        """测试停用角色不提供权限"""
        print("\n=== 测试停用角色不提供权限 ===")
        
        # 为角色分配权限并分配给用户
        self.role.permissions.add(self.permission1)
        self.role.users.add(self.user)
        self.user.clear_permission_cache()
        
        # 验证用户有权限
        self.assertTrue(self.user.has_permission('test.permission1'))
        
        # 停用角色
        self.role.is_active = False
        self.role.save()
        self.user.clear_permission_cache()
        
        # 验证用户失去权限
        self.assertFalse(self.user.has_permission('test.permission1'))
        
        # 重新启用角色
        self.role.is_active = True
        self.role.save()
        self.user.clear_permission_cache()
        
        # 验证用户重新获得权限
        self.assertTrue(self.user.has_permission('test.permission1'))
        
        print(f"✓ 停用角色不提供权限，启用角色恢复权限")
    
    def test_multiple_roles_permission_union(self):
        """测试多个角色权限的并集"""
        print("\n=== 测试多个角色权限的并集 ===")
        
        # 创建另一个角色
        role2 = Role.objects.create(name='测试角色2')
        
        # 为不同角色分配不同权限
        self.role.permissions.add(self.permission1)
        role2.permissions.add(self.permission2)
        
        # 为用户分配两个角色
        self.user.roles.add(self.role, role2)
        self.user.clear_permission_cache()
        
        # 验证用户拥有两个角色的所有权限
        self.assertTrue(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        # 移除一个角色
        self.user.roles.remove(self.role)
        self.user.clear_permission_cache()
        
        # 验证用户只保留剩余角色的权限
        self.assertFalse(self.user.has_permission('test.permission1'))
        self.assertTrue(self.user.has_permission('test.permission2'))
        
        print(f"✓ 多角色权限并集正确")
        
        # 清理
        role2.delete()


print("角色和权限功能测试文件创建成功！")
print("\n运行测试命令：")
print("python manage.py test system_management.tests.test_role_permission")