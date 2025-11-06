"""
空值和null测试
测试API接收null、空字符串、undefined等异常输入的处理
"""
import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from system_management.models import Role, Permission

User = get_user_model()


@pytest.mark.django_db
class TestNullValueHandling:
    """测试API对空值和null的处理"""
    
    @pytest.fixture
    def client(self):
        """创建测试客户端"""
        return Client()
    
    # ==================== 认证API空值测试 ====================
    
    def test_login_with_null_username(self, client):
        """测试登录时用户名为null"""
        response = client.post('/api/auth/login/', {
            'username': None,
            'password': 'testpass123'
        }, content_type='application/json')
        
        assert response.status_code in [400, 422]
        data = response.json()
        assert 'username' in str(data).lower() or 'error' in str(data).lower()
    
    def test_login_with_empty_username(self, client):
        """测试登录时用户名为空字符串"""
        response = client.post('/api/auth/login/', {
            'username': '',
            'password': 'testpass123'
        })
        
        assert response.status_code in [400, 422]
    
    def test_login_with_null_password(self, client):
        """测试登录时密码为null"""
        response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': None
        }, content_type='application/json')
        
        assert response.status_code in [400, 422]
    
    def test_login_with_empty_password(self, client):
        """测试登录时密码为空字符串"""
        response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': ''
        })
        
        assert response.status_code in [400, 422]
    
    def test_login_with_missing_fields(self, client):
        """测试登录时缺少必填字段"""
        response = client.post('/api/auth/login/', {})
        
        assert response.status_code in [400, 422]
    
    # ==================== 用户管理API空值测试 ====================
    
    def test_create_user_with_null_username(self, authenticated_client):
        """测试创建用户时用户名为null"""
        response = authenticated_client.post('/api/users/', {
            'username': None,
            'password': 'testpass123',
            'phone': '13800138001'
        }, content_type='application/json')
        
        assert response.status_code in [400, 422]
    
    def test_create_user_with_empty_username(self, authenticated_client):
        """测试创建用户时用户名为空字符串"""
        response = authenticated_client.post('/api/users/', {
            'username': '',
            'password': 'testpass123',
            'phone': '13800138001'
        })
        
        assert response.status_code in [400, 422]
    
    def test_create_user_with_null_phone(self, authenticated_client):
        """测试创建用户时手机号为null"""
        response = authenticated_client.post('/api/users/', {
            'username': 'newuser',
            'password': 'testpass123',
            'phone': None
        }, content_type='application/json')
        
        # 手机号可能是可选字段，检查响应
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_user_with_empty_phone(self, authenticated_client):
        """测试创建用户时手机号为空字符串"""
        response = authenticated_client.post('/api/users/', {
            'username': 'newuser',
            'password': 'testpass123',
            'phone': ''
        })
        
        # 空字符串应该被拒绝或接受为null
        assert response.status_code in [200, 201, 400, 422]
    
    def test_update_user_with_null_email(self, authenticated_client, test_user):
        """测试更新用户时邮箱为null"""
        response = authenticated_client.put(f'/api/users/{test_user.id}/', {
            'username': 'testuser',
            'email': None
        }, content_type='application/json')
        
        # null可能被接受为清空邮箱
        assert response.status_code in [200, 400, 422]
    
    # ==================== 门店计划API空值测试 ====================
    
    def test_create_plan_with_null_name(self, authenticated_client):
        """测试创建计划时名称为null"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': None,
            'year': 2024,
            'quarter': 1
        }, content_type='application/json')
        
        assert response.status_code in [400, 422]
    
    def test_create_plan_with_empty_name(self, authenticated_client):
        """测试创建计划时名称为空字符串"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '',
            'year': 2024,
            'quarter': 1
        })
        
        assert response.status_code in [400, 422]
    
    def test_create_plan_with_null_year(self, authenticated_client):
        """测试创建计划时年份为null"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': None,
            'quarter': 1
        }, content_type='application/json')
        
        assert response.status_code in [400, 422]
    
    # ==================== 拓店管理API空值测试 ====================
    
    def test_create_location_with_null_name(self, authenticated_client):
        """测试创建候选位置时名称为null"""
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': None,
            'address': '测试地址'
        }, content_type='application/json')
        
        assert response.status_code in [400, 422]
    
    def test_create_location_with_empty_address(self, authenticated_client):
        """测试创建候选位置时地址为空字符串"""
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': '测试位置',
            'address': ''
        })
        
        assert response.status_code in [400, 422]
    
    # ==================== 审批API空值测试 ====================
    
    def test_create_approval_with_null_title(self, authenticated_client):
        """测试创建审批时标题为null"""
        response = authenticated_client.post('/api/approval/approvals/', {
            'title': None,
            'content': '测试内容'
        }, content_type='application/json')
        
        assert response.status_code in [400, 422]
    
    def test_approve_with_null_comment(self, authenticated_client):
        """测试审批时评论为null"""
        # 评论可能是可选的
        response = authenticated_client.post('/api/approval/approvals/1/approve/', {
            'comment': None,
            'action': 'approve'
        }, content_type='application/json')
        
        # 可能接受null评论或返回404（审批不存在）
        assert response.status_code in [200, 400, 404, 422]
    
    # ==================== 查询参数空值测试 ====================
    
    def test_list_users_with_null_search(self, authenticated_client):
        """测试用户列表查询时搜索参数为null"""
        response = authenticated_client.get('/api/users/', {'search': None})
        
        # 应该忽略null参数或返回所有结果
        assert response.status_code in [200, 400]
    
    def test_list_users_with_empty_search(self, authenticated_client):
        """测试用户列表查询时搜索参数为空字符串"""
        response = authenticated_client.get('/api/users/', {'search': ''})
        
        # 应该返回所有结果
        assert response.status_code == 200
    
    def test_list_plans_with_null_year(self, authenticated_client):
        """测试计划列表查询时年份为null"""
        response = authenticated_client.get('/api/store-planning/plans/', {'year': None})
        
        # 应该忽略null参数
        assert response.status_code in [200, 400]


@pytest.mark.django_db
class TestNullValueInNestedData:
    """测试嵌套数据中的空值处理"""
    
    def test_create_plan_with_null_in_nested_object(self, authenticated_client):
        """测试创建计划时嵌套对象中包含null"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'details': {
                'target': None,
                'budget': 1000000
            }
        }, content_type='application/json')
        
        # 应该处理嵌套的null值
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_location_with_null_in_array(self, authenticated_client):
        """测试创建位置时数组中包含null"""
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': '测试位置',
            'address': '测试地址',
            'tags': ['tag1', None, 'tag3']
        }, content_type='application/json')
        
        # 应该过滤或拒绝null元素
        assert response.status_code in [200, 201, 400, 422]


@pytest.mark.django_db
class TestNullValueInPatchRequests:
    """测试PATCH请求中的空值处理"""
    
    def test_patch_user_with_null_email(self, authenticated_client, test_user):
        """测试PATCH更新用户时邮箱为null（清空邮箱）"""
        response = authenticated_client.patch(f'/api/users/{test_user.id}/', {
            'email': None
        }, content_type='application/json')
        
        # null可能表示清空字段
        assert response.status_code in [200, 400, 422]
    
    def test_patch_user_with_empty_email(self, authenticated_client, test_user):
        """测试PATCH更新用户时邮箱为空字符串"""
        response = authenticated_client.patch(f'/api/users/{test_user.id}/', {
            'email': ''
        }, content_type='application/json')
        
        # 空字符串可能被拒绝
        assert response.status_code in [200, 400, 422]
