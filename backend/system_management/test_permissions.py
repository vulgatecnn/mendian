"""
权限控制功能测试
用于验证权限验证中间件、装饰器和用户权限方法
"""
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.core.cache import cache
from .models import Department, Role, Permission
from .permissions import PermissionMiddleware, permission_required

User = get_user_model()


class PermissionTestCase(TestCase):
    """权限控制测试用例"""
    
    def setUp(self):
        """测试前准备"""
        # 清除缓存
        cache.clear()
        
        # 创建测试部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            phone='13800138000',
            wechat_user_id='test_wechat_id',
            department=self.department
        )
        
        # 创建超级管理员
        self.superuser = User.objects.create_superuser(
            username='admin',
            password='admin123',
            phone='13800138001',
            wechat_user_id='admin_wechat_id'
        )
        
        # 创建测试权限
        self.perm_view = Permission.objects.create(
            code='system.user.view',
            name='查看用户',
            module='系统管理'
        )
        self.perm_create = Permission.objects.create(
            code='system.user.create',
            name='创建用户',
            module='系统管理'
        )
        
        # 创建测试角色
        self.role = Role.objects.create(
            name='测试角色',
            description='用于测试的角色'
        )
        self.role.permissions.add(self.perm_view)
        
        # 请求工厂
        self.factory = RequestFactory()
    
    def test_user_has_permission(self):
        """测试用户权限检查"""
        # 用户没有角色，应该没有权限
        self.assertFalse(self.user.has_permission('system.user.view'))
        
        # 为用户分配角色
        self.role.users.add(self.user)
        
        # 清除缓存
        self.user.clear_permission_cache()
        
        # 用户应该有查看权限
        self.assertTrue(self.user.has_permission('system.user.view'))
        
        # 用户应该没有创建权限
        self.assertFalse(self.user.has_permission('system.user.create'))
    
    def test_superuser_has_all_permissions(self):
        """测试超级管理员拥有所有权限"""
        self.assertTrue(self.superuser.has_permission('system.user.view'))
        self.assertTrue(self.superuser.has_permission('system.user.create'))
        self.assertTrue(self.superuser.has_permission('any.permission.code'))
    
    def test_get_permissions(self):
        """测试获取用户权限"""
        # 为用户分配角色
        self.role.users.add(self.user)
        
        # 获取用户权限
        permissions = self.user.get_permissions()
        
        # 应该包含查看权限
        self.assertIn(self.perm_view, permissions)
        
        # 不应该包含创建权限
        self.assertNotIn(self.perm_create, permissions)
    
    def test_get_permission_codes(self):
        """测试获取用户权限编码"""
        # 为用户分配角色
        self.role.users.add(self.user)
        
        # 清除缓存
        self.user.clear_permission_cache()
        
        # 获取权限编码
        codes = self.user.get_permission_codes()
        
        # 应该包含查看权限编码
        self.assertIn('system.user.view', codes)
        
        # 不应该包含创建权限编码
        self.assertNotIn('system.user.create', codes)
    
    def test_permission_cache(self):
        """测试权限缓存机制"""
        # 为用户分配角色
        self.role.users.add(self.user)
        
        # 第一次调用，从数据库加载
        codes1 = self.user.get_permission_codes()
        
        # 第二次调用，从缓存加载
        codes2 = self.user.get_permission_codes()
        
        # 结果应该相同
        self.assertEqual(codes1, codes2)
        
        # 添加新权限
        self.role.permissions.add(self.perm_create)
        
        # 缓存未清除，应该还是旧的权限
        codes3 = self.user.get_permission_codes()
        self.assertNotIn('system.user.create', codes3)
        
        # 清除缓存
        self.user.clear_permission_cache()
        
        # 应该获取到新权限
        codes4 = self.user.get_permission_codes()
        self.assertIn('system.user.create', codes4)
    
    def test_role_add_permissions_clears_cache(self):
        """测试角色添加权限时自动清除缓存"""
        # 为用户分配角色
        self.role.users.add(self.user)
        
        # 加载权限到缓存
        codes1 = self.user.get_permission_codes()
        self.assertNotIn('system.user.create', codes1)
        
        # 使用 add_permissions 方法添加权限（会自动清除缓存）
        self.role.add_permissions(['system.user.create'])
        
        # 应该自动获取到新权限
        codes2 = self.user.get_permission_codes()
        self.assertIn('system.user.create', codes2)
    
    def test_role_add_users_clears_cache(self):
        """测试角色添加用户时自动清除缓存"""
        # 用户加载权限到缓存
        codes1 = self.user.get_permission_codes()
        self.assertEqual(len(codes1), 0)
        
        # 使用 add_users 方法添加用户（会自动清除缓存）
        self.role.add_users([self.user.id])
        
        # 应该自动获取到新权限
        codes2 = self.user.get_permission_codes()
        self.assertIn('system.user.view', codes2)
    
    def test_permission_middleware(self):
        """测试权限验证中间件"""
        # 创建中间件实例
        def get_response(request):
            return None
        
        middleware = PermissionMiddleware(get_response)
        
        # 创建请求
        request = self.factory.get('/')
        request.user = self.user
        
        # 为用户分配角色
        self.role.users.add(self.user)
        self.user.clear_permission_cache()
        
        # 调用中间件
        middleware(request)
        
        # 应该加载权限到请求对象
        self.assertTrue(hasattr(request, 'user_permissions'))
        self.assertIn('system.user.view', request.user_permissions)
    
    def test_inactive_role_no_permissions(self):
        """测试停用的角色不提供权限"""
        # 为用户分配角色
        self.role.users.add(self.user)
        
        # 清除缓存
        self.user.clear_permission_cache()
        
        # 用户应该有权限
        self.assertTrue(self.user.has_permission('system.user.view'))
        
        # 停用角色
        self.role.is_active = False
        self.role.save()
        
        # 清除缓存
        self.user.clear_permission_cache()
        
        # 用户应该没有权限
        self.assertFalse(self.user.has_permission('system.user.view'))


class PermissionDecoratorTestCase(TestCase):
    """权限装饰器测试用例"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            phone='13800138000',
            wechat_user_id='test_wechat_id'
        )
        
        # 创建测试权限
        self.permission = Permission.objects.create(
            code='test.permission',
            name='测试权限',
            module='测试'
        )
        
        # 创建测试角色
        self.role = Role.objects.create(name='测试角色')
        self.role.permissions.add(self.permission)
        
        # 请求工厂
        self.factory = RequestFactory()
    
    def test_decorator_with_permission(self):
        """测试有权限的用户可以访问"""
        # 为用户分配角色
        self.role.users.add(self.user)
        
        # 创建装饰的视图
        @permission_required('test.permission')
        def test_view(request):
            return {'success': True}
        
        # 创建请求
        request = self.factory.get('/')
        request.user = self.user
        
        # 调用视图
        response = test_view(request)
        
        # 应该成功
        self.assertEqual(response, {'success': True})
    
    def test_decorator_without_permission(self):
        """测试无权限的用户被拒绝"""
        # 创建装饰的视图
        @permission_required('test.permission')
        def test_view(request):
            return {'success': True}
        
        # 创建请求
        request = self.factory.get('/')
        request.user = self.user
        
        # 调用视图
        response = test_view(request)
        
        # 应该返回 403 错误
        self.assertEqual(response.status_code, 403)
    
    def test_decorator_unauthenticated(self):
        """测试未认证用户被拒绝"""
        from django.contrib.auth.models import AnonymousUser
        
        # 创建装饰的视图
        @permission_required('test.permission')
        def test_view(request):
            return {'success': True}
        
        # 创建请求（未认证用户）
        request = self.factory.get('/')
        request.user = AnonymousUser()
        
        # 调用视图
        response = test_view(request)
        
        # 应该返回 401 错误
        self.assertEqual(response.status_code, 401)


print("权限控制测试文件创建成功！")
print("\n运行测试命令：")
print("python manage.py test system_management.test_permissions")
