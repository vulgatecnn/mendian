"""
企业微信集成功能测试
测试部门同步、用户同步的正常流程和错误处理
"""
import json
import time
from unittest.mock import patch, Mock, MagicMock
from django.test import TestCase, override_settings
from django.core.cache import cache
from django.contrib.auth import get_user_model
from ..models import Department, User
from ..services.wechat_department import department_service
from ..services.wechat_user import user_service
from ..services.wechat_token import token_manager

User = get_user_model()


class WeChatDepartmentSyncTest(TestCase):
    """企业微信部门同步测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        # 清理现有部门数据
        Department.objects.all().delete()
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
        Department.objects.all().delete()
    
    @patch('system_management.services.wechat_department.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_departments_success(self, mock_get_token, mock_requests_get):
        """测试部门同步成功流程"""
        print("\n=== 测试部门同步成功流程 ===")
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟企业微信 API 响应
        mock_response = Mock()
        mock_response.json.return_value = {
            'errcode': 0,
            'errmsg': 'ok',
            'department': [
                {
                    'id': 1,
                    'name': '总公司',
                    'parentid': 0,
                    'order': 1
                },
                {
                    'id': 2,
                    'name': '技术部',
                    'parentid': 1,
                    'order': 2
                },
                {
                    'id': 3,
                    'name': '市场部',
                    'parentid': 1,
                    'order': 3
                },
                {
                    'id': 4,
                    'name': '前端组',
                    'parentid': 2,
                    'order': 1
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response
        
        # 执行同步
        result = department_service.sync_departments()
        
        # 验证结果
        self.assertTrue(result['success'])
        self.assertEqual(result['total'], 4)
        self.assertEqual(result['created'], 4)
        self.assertEqual(result['updated'], 0)
        self.assertEqual(result['failed'], 0)
        
        # 验证数据库中的部门
        self.assertEqual(Department.objects.count(), 4)
        
        # 验证根部门
        root_dept = Department.objects.get(wechat_dept_id=1)
        self.assertEqual(root_dept.name, '总公司')
        self.assertIsNone(root_dept.parent)
        
        # 验证子部门
        tech_dept = Department.objects.get(wechat_dept_id=2)
        self.assertEqual(tech_dept.name, '技术部')
        self.assertEqual(tech_dept.parent, root_dept)
        
        market_dept = Department.objects.get(wechat_dept_id=3)
        self.assertEqual(market_dept.name, '市场部')
        self.assertEqual(market_dept.parent, root_dept)
        
        frontend_group = Department.objects.get(wechat_dept_id=4)
        self.assertEqual(frontend_group.name, '前端组')
        self.assertEqual(frontend_group.parent, tech_dept)
        
        print(f"✓ 部门同步成功: 总数={result['total']}, 新增={result['created']}")
        print(f"✓ 数据库中部门数量: {Department.objects.count()}")
        print(f"✓ 部门层级关系验证通过")
    
    @patch('system_management.services.wechat_department.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_departments_update_existing(self, mock_get_token, mock_requests_get):
        """测试更新已存在的部门"""
        print("\n=== 测试更新已存在的部门 ===")
        
        # 先创建一个部门
        existing_dept = Department.objects.create(
            wechat_dept_id=1,
            name='旧名称',
            order=0
        )
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟企业微信 API 响应（更新部门信息）
        mock_response = Mock()
        mock_response.json.return_value = {
            'errcode': 0,
            'errmsg': 'ok',
            'department': [
                {
                    'id': 1,
                    'name': '新名称',
                    'parentid': 0,
                    'order': 5
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response
        
        # 执行同步
        result = department_service.sync_departments()
        
        # 验证结果
        self.assertTrue(result['success'])
        self.assertEqual(result['total'], 1)
        self.assertEqual(result['created'], 0)
        self.assertEqual(result['updated'], 1)
        self.assertEqual(result['failed'], 0)
        
        # 验证部门信息已更新
        updated_dept = Department.objects.get(wechat_dept_id=1)
        self.assertEqual(updated_dept.name, '新名称')
        self.assertEqual(updated_dept.order, 5)
        self.assertEqual(updated_dept.id, existing_dept.id)  # ID 不变
        
        print(f"✓ 部门更新成功: {existing_dept.name} -> {updated_dept.name}")
        print(f"✓ 排序更新: {existing_dept.order} -> {updated_dept.order}")
    
    @patch('system_management.services.wechat_department.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_departments_api_error(self, mock_get_token, mock_requests_get):
        """测试企业微信 API 错误处理"""
        print("\n=== 测试企业微信 API 错误处理 ===")
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟企业微信 API 错误响应
        mock_response = Mock()
        mock_response.json.return_value = {
            'errcode': 60011,
            'errmsg': '不合法的部门id'
        }
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response
        
        # 执行同步
        result = department_service.sync_departments()
        
        # 验证结果
        self.assertFalse(result['success'])
        self.assertEqual(result['total'], 0)
        self.assertEqual(len(result['errors']), 1)
        self.assertIn('不合法的部门id', result['errors'][0])
        
        # 验证数据库中没有创建部门
        self.assertEqual(Department.objects.count(), 0)
        
        print(f"✓ API 错误处理正确: {result['errors'][0]}")
    
    @patch('system_management.services.wechat_department.requests.get')
    @patch.object(token_manager, 'get_access_token')
    @patch.object(token_manager, 'refresh_token')
    def test_sync_departments_token_expired(self, mock_refresh_token, mock_get_token, mock_requests_get):
        """测试访问令牌过期自动刷新"""
        print("\n=== 测试访问令牌过期自动刷新 ===")
        
        # 模拟访问令牌
        mock_get_token.return_value = 'expired_token'
        mock_refresh_token.return_value = 'new_token'
        
        # 模拟第一次请求返回令牌过期错误，第二次请求成功
        expired_response = Mock()
        expired_response.json.return_value = {
            'errcode': 40014,
            'errmsg': 'invalid access_token'
        }
        expired_response.raise_for_status.return_value = None
        
        success_response = Mock()
        success_response.json.return_value = {
            'errcode': 0,
            'errmsg': 'ok',
            'department': [
                {
                    'id': 1,
                    'name': '测试部门',
                    'parentid': 0,
                    'order': 1
                }
            ]
        }
        success_response.raise_for_status.return_value = None
        
        # 第一次返回过期错误，第二次返回成功
        mock_requests_get.side_effect = [expired_response, success_response]
        
        # 执行同步
        result = department_service.sync_departments()
        
        # 验证结果
        self.assertTrue(result['success'])
        self.assertEqual(result['total'], 1)
        self.assertEqual(result['created'], 1)
        
        # 验证刷新令牌被调用
        mock_refresh_token.assert_called_once()
        
        # 验证部门创建成功
        self.assertEqual(Department.objects.count(), 1)
        dept = Department.objects.first()
        self.assertEqual(dept.name, '测试部门')
        
        print(f"✓ 令牌过期自动刷新成功")
        print(f"✓ 部门同步成功: {dept.name}")
    
    @patch('system_management.services.wechat_department.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_departments_network_timeout(self, mock_get_token, mock_requests_get):
        """测试网络超时错误处理"""
        print("\n=== 测试网络超时错误处理 ===")
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟网络超时
        from requests.exceptions import Timeout
        mock_requests_get.side_effect = Timeout("Request timeout")
        
        # 执行同步
        result = department_service.sync_departments()
        
        # 验证结果
        self.assertFalse(result['success'])
        self.assertEqual(result['total'], 0)
        self.assertEqual(len(result['errors']), 1)
        self.assertIn('超时', result['errors'][0])
        
        print(f"✓ 网络超时错误处理正确: {result['errors'][0]}")
    
    def test_get_department_tree(self):
        """测试获取部门树形结构"""
        print("\n=== 测试获取部门树形结构 ===")
        
        # 创建测试部门
        root = Department.objects.create(wechat_dept_id=1, name='总公司', order=1)
        tech = Department.objects.create(wechat_dept_id=2, name='技术部', parent=root, order=2)
        market = Department.objects.create(wechat_dept_id=3, name='市场部', parent=root, order=3)
        frontend = Department.objects.create(wechat_dept_id=4, name='前端组', parent=tech, order=1)
        
        # 获取部门树
        tree = department_service.get_department_tree()
        
        # 验证树形结构
        self.assertEqual(len(tree), 1)  # 只有一个根部门
        
        root_node = tree[0]
        self.assertEqual(root_node['name'], '总公司')
        self.assertEqual(len(root_node['children']), 2)  # 两个子部门
        
        # 验证子部门
        children = {child['name']: child for child in root_node['children']}
        self.assertIn('技术部', children)
        self.assertIn('市场部', children)
        
        # 验证技术部的子部门
        tech_node = children['技术部']
        self.assertEqual(len(tech_node['children']), 1)
        self.assertEqual(tech_node['children'][0]['name'], '前端组')
        
        print(f"✓ 部门树形结构正确")
        print(f"  - 根部门: {root_node['name']}")
        print(f"  - 子部门: {[child['name'] for child in root_node['children']]}")
        print(f"  - 技术部子部门: {[child['name'] for child in tech_node['children']]}")


class WeChatUserSyncTest(TestCase):
    """企业微信用户同步测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
        # 清理现有数据
        User.objects.all().delete()
        Department.objects.all().delete()
        
        # 创建测试部门
        self.dept1 = Department.objects.create(wechat_dept_id=1, name='技术部')
        self.dept2 = Department.objects.create(wechat_dept_id=2, name='市场部')
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
        User.objects.all().delete()
        Department.objects.all().delete()
    
    @patch('system_management.services.wechat_user.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_users_success(self, mock_get_token, mock_requests_get):
        """测试用户同步成功流程"""
        print("\n=== 测试用户同步成功流程 ===")
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟企业微信 API 响应
        mock_response = Mock()
        mock_response.json.return_value = {
            'errcode': 0,
            'errmsg': 'ok',
            'userlist': [
                {
                    'userid': 'zhangsan',
                    'name': '张三',
                    'mobile': '13800138001',
                    'department': [1],
                    'position': '高级工程师',
                    'status': 1
                },
                {
                    'userid': 'lisi',
                    'name': '李四',
                    'mobile': '13800138002',
                    'department': [2],
                    'position': '市场经理',
                    'status': 1
                },
                {
                    'userid': 'wangwu',
                    'name': '王五',
                    'mobile': '13800138003',
                    'department': [1],
                    'position': '前端工程师',
                    'status': 2  # 已禁用
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response
        
        # 执行同步
        result = user_service.sync_users(department_id=1)
        
        # 验证结果
        self.assertTrue(result['success'])
        self.assertEqual(result['total'], 3)
        self.assertEqual(result['created'], 3)
        self.assertEqual(result['updated'], 0)
        self.assertEqual(result['failed'], 0)
        
        # 验证数据库中的用户
        self.assertEqual(User.objects.count(), 3)
        
        # 验证用户信息
        zhangsan = User.objects.get(wechat_user_id='zhangsan')
        self.assertEqual(zhangsan.first_name, '张三')
        self.assertEqual(zhangsan.phone, '13800138001')
        self.assertEqual(zhangsan.department, self.dept1)
        self.assertEqual(zhangsan.position, '高级工程师')
        self.assertTrue(zhangsan.is_active)
        
        lisi = User.objects.get(wechat_user_id='lisi')
        self.assertEqual(lisi.first_name, '李四')
        self.assertEqual(lisi.department, self.dept2)
        self.assertTrue(lisi.is_active)
        
        wangwu = User.objects.get(wechat_user_id='wangwu')
        self.assertEqual(wangwu.first_name, '王五')
        self.assertFalse(wangwu.is_active)  # 企微状态为禁用
        
        print(f"✓ 用户同步成功: 总数={result['total']}, 新增={result['created']}")
        print(f"✓ 数据库中用户数量: {User.objects.count()}")
        print(f"✓ 用户状态正确: 张三(启用), 李四(启用), 王五(禁用)")
    
    @patch('system_management.services.wechat_user.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_users_update_existing(self, mock_get_token, mock_requests_get):
        """测试更新已存在的用户"""
        print("\n=== 测试更新已存在的用户 ===")
        
        # 先创建一个用户
        existing_user = User.objects.create_user(
            username='zhangsan',
            wechat_user_id='zhangsan',
            first_name='旧姓名',
            phone='13800138001',
            department=self.dept1,
            position='初级工程师',
            is_active=True
        )
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟企业微信 API 响应（更新用户信息）
        mock_response = Mock()
        mock_response.json.return_value = {
            'errcode': 0,
            'errmsg': 'ok',
            'userlist': [
                {
                    'userid': 'zhangsan',
                    'name': '张三',
                    'mobile': '13800138001',
                    'department': [2],  # 部门变更
                    'position': '高级工程师',  # 职位变更
                    'status': 1
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response
        
        # 执行同步
        result = user_service.sync_users(department_id=1)
        
        # 验证结果
        self.assertTrue(result['success'])
        self.assertEqual(result['total'], 1)
        self.assertEqual(result['created'], 0)
        self.assertEqual(result['updated'], 1)
        self.assertEqual(result['failed'], 0)
        
        # 验证用户信息已更新
        updated_user = User.objects.get(wechat_user_id='zhangsan')
        self.assertEqual(updated_user.first_name, '张三')
        self.assertEqual(updated_user.department, self.dept2)  # 部门已更新
        self.assertEqual(updated_user.position, '高级工程师')  # 职位已更新
        self.assertEqual(updated_user.id, existing_user.id)  # ID 不变
        
        print(f"✓ 用户更新成功:")
        print(f"  - 姓名: {existing_user.first_name} -> {updated_user.first_name}")
        print(f"  - 部门: {existing_user.department.name} -> {updated_user.department.name}")
        print(f"  - 职位: {existing_user.position} -> {updated_user.position}")
    
    @patch('system_management.services.wechat_user.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_users_invalid_data(self, mock_get_token, mock_requests_get):
        """测试无效用户数据处理"""
        print("\n=== 测试无效用户数据处理 ===")
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟企业微信 API 响应（包含无效数据）
        mock_response = Mock()
        mock_response.json.return_value = {
            'errcode': 0,
            'errmsg': 'ok',
            'userlist': [
                {
                    'userid': 'valid_user',
                    'name': '有效用户',
                    'mobile': '13800138001',
                    'department': [1],
                    'position': '工程师',
                    'status': 1
                },
                {
                    # 缺少 userid
                    'name': '无效用户1',
                    'mobile': '13800138002',
                    'department': [1],
                    'status': 1
                },
                {
                    'userid': 'no_mobile_user',
                    'name': '无效用户2',
                    # 缺少 mobile
                    'department': [1],
                    'status': 1
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response
        
        # 执行同步
        result = user_service.sync_users(department_id=1)
        
        # 验证结果
        self.assertTrue(result['success'])
        self.assertEqual(result['total'], 3)
        self.assertEqual(result['created'], 1)  # 只有一个有效用户
        self.assertEqual(result['updated'], 0)
        self.assertEqual(result['failed'], 2)  # 两个无效用户
        
        # 验证只创建了有效用户
        self.assertEqual(User.objects.count(), 1)
        valid_user = User.objects.first()
        self.assertEqual(valid_user.wechat_user_id, 'valid_user')
        self.assertEqual(valid_user.first_name, '有效用户')
        
        print(f"✓ 无效数据处理正确: 有效={result['created']}, 无效={result['failed']}")
        print(f"✓ 数据库中只创建了有效用户: {valid_user.first_name}")
    
    @patch('system_management.services.wechat_user.requests.get')
    @patch.object(token_manager, 'get_access_token')
    def test_sync_all_departments_users(self, mock_get_token, mock_requests_get):
        """测试同步所有部门的用户"""
        print("\n=== 测试同步所有部门的用户 ===")
        
        # 模拟访问令牌
        mock_get_token.return_value = 'mock_access_token'
        
        # 模拟多次 API 调用（每个部门一次）
        responses = [
            # 部门1的用户
            Mock(json=lambda: {
                'errcode': 0,
                'errmsg': 'ok',
                'userlist': [
                    {
                        'userid': 'tech_user1',
                        'name': '技术用户1',
                        'mobile': '13800138001',
                        'department': [1],
                        'status': 1
                    }
                ]
            }),
            # 部门2的用户
            Mock(json=lambda: {
                'errcode': 0,
                'errmsg': 'ok',
                'userlist': [
                    {
                        'userid': 'market_user1',
                        'name': '市场用户1',
                        'mobile': '13800138002',
                        'department': [2],
                        'status': 1
                    }
                ]
            })
        ]
        
        for response in responses:
            response.raise_for_status.return_value = None
        
        mock_requests_get.side_effect = responses
        
        # 执行同步（不指定部门ID，同步所有部门）
        result = user_service.sync_users()
        
        # 验证结果
        self.assertTrue(result['success'])
        self.assertEqual(result['total'], 2)
        self.assertEqual(result['created'], 2)
        
        # 验证用户创建
        self.assertEqual(User.objects.count(), 2)
        
        tech_user = User.objects.get(wechat_user_id='tech_user1')
        self.assertEqual(tech_user.department, self.dept1)
        
        market_user = User.objects.get(wechat_user_id='market_user1')
        self.assertEqual(market_user.department, self.dept2)
        
        print(f"✓ 所有部门用户同步成功: 总数={result['total']}")
        print(f"✓ 技术部用户: {tech_user.first_name}")
        print(f"✓ 市场部用户: {market_user.first_name}")


class WeChatTokenManagerTest(TestCase):
    """企业微信令牌管理测试"""
    
    def setUp(self):
        """测试前准备"""
        cache.clear()
    
    def tearDown(self):
        """测试后清理"""
        cache.clear()
    
    @patch('system_management.services.wechat_token.requests.get')
    @patch.object(token_manager.config, 'validate_config')
    @patch.object(token_manager.config, 'get_corp_id')
    @patch.object(token_manager.config, 'get_secret')
    def test_get_access_token_success(self, mock_get_secret, mock_get_corp_id, 
                                     mock_validate_config, mock_requests_get):
        """测试获取访问令牌成功"""
        print("\n=== 测试获取访问令牌成功 ===")
        
        # 模拟配置
        mock_validate_config.return_value = (True, "")
        mock_get_corp_id.return_value = 'test_corp_id'
        mock_get_secret.return_value = 'test_secret'
        
        # 模拟企业微信 API 响应
        mock_response = Mock()
        mock_response.json.return_value = {
            'errcode': 0,
            'errmsg': 'ok',
            'access_token': 'test_access_token',
            'expires_in': 7200
        }
        mock_response.raise_for_status.return_value = None
        mock_requests_get.return_value = mock_response
        
        # 获取访问令牌
        token = token_manager.get_access_token()
        
        # 验证结果
        self.assertEqual(token, 'test_access_token')
        
        # 验证令牌被缓存
        cached_token = token_manager._get_cached_token()
        self.assertEqual(cached_token, 'test_access_token')
        
        print(f"✓ 访问令牌获取成功: {token}")
        print(f"✓ 令牌已缓存")
    
    @patch('system_management.services.wechat_token.requests.get')
    @patch.object(token_manager.config, 'validate_config')
    def test_get_access_token_config_invalid(self, mock_validate_config, mock_requests_get):
        """测试配置无效时的错误处理"""
        print("\n=== 测试配置无效时的错误处理 ===")
        
        # 模拟配置无效
        mock_validate_config.return_value = (False, "缺少企业ID")
        
        # 尝试获取访问令牌
        with self.assertRaises(ValueError) as context:
            token_manager.get_access_token()
        
        # 验证错误信息
        self.assertIn("缺少企业ID", str(context.exception))
        
        # 验证没有发送 HTTP 请求
        mock_requests_get.assert_not_called()
        
        print(f"✓ 配置无效错误处理正确: {context.exception}")
    
    def test_token_cache_mechanism(self):
        """测试令牌缓存机制"""
        print("\n=== 测试令牌缓存机制 ===")
        
        # 缓存一个令牌
        test_token = 'cached_test_token'
        token_manager._cache_token(test_token, 3600)
        
        # 从缓存获取
        cached_token = token_manager._get_cached_token()
        self.assertEqual(cached_token, test_token)
        
        # 清除缓存
        token_manager.clear_token_cache()
        
        # 验证缓存已清除
        cached_token = token_manager._get_cached_token()
        self.assertIsNone(cached_token)
        
        print(f"✓ 令牌缓存机制正常")
        print(f"✓ 缓存清除功能正常")


print("企业微信集成测试文件创建成功！")
print("\n运行测试命令：")
print("python manage.py test system_management.tests.test_wechat_integration")