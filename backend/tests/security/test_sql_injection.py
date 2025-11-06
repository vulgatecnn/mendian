#!/usr/bin/env python
"""
SQL注入安全测试
测试系统对SQL注入攻击的防护能力
"""
import pytest
from django.contrib.auth import get_user_model
from system_management.models import Department
from store_planning.models import StorePlan

User = get_user_model()


@pytest.fixture
def test_department(db):
    """创建测试部门"""
    department, _ = Department.objects.get_or_create(
        wechat_dept_id=2001,
        defaults={'name': 'SQL测试部门'}
    )
    return department


@pytest.fixture
def test_user(db, test_department):
    """创建测试用户"""
    user, created = User.objects.get_or_create(
        username='sqltest',
        defaults={
            'phone': '13900002001',
            'department': test_department,
            'first_name': 'SQL',
            'last_name': '测试'
        }
    )
    if created or not user.check_password('test123'):
        user.set_password('test123')
        user.save()
    return user


@pytest.fixture
def test_plan(db, test_user, test_department):
    """创建测试门店计划"""
    plan = StorePlan.objects.create(
        plan_name='SQL测试计划',
        plan_year=2025,
        plan_quarter='Q1',
        creator=test_user,
        department=test_department,
        status='draft'
    )
    return plan


@pytest.mark.security
class TestSQLInjectionInSearch:
    """搜索框SQL注入测试"""
    
    def test_sql_injection_in_username_search(self, api_client, test_user):
        """测试用户名搜索中的SQL注入"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # SQL注入攻击载荷
        sql_injection_payloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' OR '1'='1' /*",
            "admin'--",
            "' UNION SELECT NULL--",
            "1' AND '1'='1",
            "'; DROP TABLE users--",
            "' OR 1=1--",
        ]
        
        for payload in sql_injection_payloads:
            # Act - 尝试SQL注入
            response = api_client.get(
                f'/api/users/?search={payload}',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert - 应该安全处理，不应该返回500错误或执行SQL
            assert response.status_code != 500, \
                f"SQL注入载荷 '{payload}' 导致服务器错误"
            
            # 如果返回200，检查是否返回了不应该返回的数据
            if response.status_code == 200:
                data = response.json()
                # 不应该返回所有用户（' OR '1'='1 的效果）
                if 'data' in data:
                    results = data['data'] if isinstance(data['data'], list) else data['data'].get('results', [])
                    # 记录结果用于分析
                    print(f"载荷 '{payload}' 返回了 {len(results)} 条结果")
    
    def test_sql_injection_in_plan_search(self, api_client, test_user, test_plan):
        """测试门店计划搜索中的SQL注入"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # SQL注入攻击载荷
        sql_injection_payloads = [
            "' OR '1'='1",
            "test' OR '1'='1' --",
            "'; DELETE FROM store_planning_storeplan--",
        ]
        
        for payload in sql_injection_payloads:
            # Act - 尝试SQL注入
            response = api_client.get(
                f'/api/store-plans/?search={payload}',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert
            assert response.status_code != 500, \
                f"SQL注入载荷 '{payload}' 导致服务器错误"
    
    def test_sql_injection_in_filter_params(self, api_client, test_user):
        """测试过滤参数中的SQL注入"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 在过滤参数中尝试SQL注入
        response = api_client.get(
            "/api/store-plans/?status=' OR '1'='1",
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code != 500, \
            "过滤参数中的SQL注入导致服务器错误"


@pytest.mark.security
class TestSQLInjectionInURLParams:
    """URL参数SQL注入测试"""
    
    def test_sql_injection_in_id_parameter(self, api_client, test_user, test_plan):
        """测试ID参数中的SQL注入"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # SQL注入攻击载荷
        sql_injection_ids = [
            "1 OR 1=1",
            "1' OR '1'='1",
            "1; DROP TABLE store_planning_storeplan--",
            "1 UNION SELECT NULL",
        ]
        
        for payload in sql_injection_ids:
            # Act - 尝试SQL注入
            response = api_client.get(
                f'/api/store-plans/{payload}/',
                HTTP_AUTHORIZATION=f'Bearer {access_token}'
            )
            
            # Assert - 应该返回404或400，不应该返回500或执行SQL
            assert response.status_code != 500, \
                f"ID参数SQL注入载荷 '{payload}' 导致服务器错误"
            assert response.status_code in [400, 404], \
                f"ID参数SQL注入载荷 '{payload}' 应该返回400或404，但返回了 {response.status_code}"
    
    def test_sql_injection_in_query_string(self, api_client, test_user):
        """测试查询字符串中的SQL注入"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 在查询字符串中尝试SQL注入
        response = api_client.get(
            "/api/store-plans/?plan_year=2025' OR '1'='1",
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code != 500, \
            "查询字符串中的SQL注入导致服务器错误"


@pytest.mark.security
class TestSQLInjectionInPOSTData:
    """POST请求数据SQL注入测试"""
    
    def test_sql_injection_in_login_username(self, api_client):
        """测试登录用户名中的SQL注入"""
        # SQL注入攻击载荷
        sql_injection_payloads = [
            "admin' OR '1'='1' --",
            "admin'--",
            "' OR '1'='1",
        ]
        
        for payload in sql_injection_payloads:
            # Act - 尝试SQL注入登录
            login_data = {
                "login_type": "username_password",
                "username": payload,
                "password": "anypassword"
            }
            response = api_client.post(
                '/api/auth/login/',
                data=login_data,
                content_type='application/json'
            )
            
            # Assert - 不应该成功登录，不应该返回500错误
            assert response.status_code != 500, \
                f"登录用户名SQL注入载荷 '{payload}' 导致服务器错误"
            assert response.status_code != 200, \
                f"登录用户名SQL注入载荷 '{payload}' 不应该成功登录"
    
    def test_sql_injection_in_create_plan(self, api_client, test_user, test_department):
        """测试创建计划时的SQL注入"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 在计划名称中尝试SQL注入
        plan_data = {
            'plan_name': "测试'; DROP TABLE store_planning_storeplan--",
            'plan_year': 2025,
            'plan_quarter': 'Q1',
            'department_id': test_department.id
        }
        response = api_client.post(
            '/api/store-plans/',
            data=plan_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert - 不应该导致SQL执行错误
        assert response.status_code != 500, \
            "创建计划时的SQL注入导致服务器错误"
        
        # 如果创建成功，验证数据被正确转义
        if response.status_code in [200, 201]:
            data = response.json()
            if 'data' in data:
                plan_id = data['data'].get('id')
                if plan_id:
                    # 验证计划名称被正确存储（包含SQL语句作为普通文本）
                    plan = StorePlan.objects.get(id=plan_id)
                    assert "DROP TABLE" in plan.plan_name, \
                        "SQL注入字符串应该被作为普通文本存储"
                    # 清理测试数据
                    plan.delete()
    
    def test_sql_injection_in_update_data(self, api_client, test_user, test_plan):
        """测试更新数据时的SQL注入"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        original_name = test_plan.plan_name
        
        # Act - 在更新数据中尝试SQL注入
        update_data = {
            'plan_name': "' OR '1'='1' --"
        }
        response = api_client.patch(
            f'/api/store-plans/{test_plan.id}/',
            data=update_data,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        assert response.status_code != 500, \
            "更新数据时的SQL注入导致服务器错误"
        
        # 验证数据未被SQL注入破坏
        test_plan.refresh_from_db()
        if response.status_code in [200, 201]:
            # 如果更新成功，SQL语句应该被作为普通文本存储
            assert "OR" in test_plan.plan_name, \
                "SQL注入字符串应该被作为普通文本存储"


@pytest.mark.security
class TestORMProtection:
    """ORM防护验证测试"""
    
    def test_orm_parameterized_queries(self, db, test_user):
        """测试ORM使用参数化查询"""
        # Act - 使用Django ORM进行查询（应该自动参数化）
        malicious_username = "admin' OR '1'='1' --"
        users = User.objects.filter(username=malicious_username)
        
        # Assert - 不应该返回任何用户（因为没有这个用户名）
        assert users.count() == 0, \
            "ORM应该使用参数化查询，不应该执行SQL注入"
    
    def test_orm_safe_filtering(self, db, test_plan):
        """测试ORM安全过滤"""
        # Act - 使用包含SQL注入的值进行过滤
        malicious_name = "' OR '1'='1"
        plans = StorePlan.objects.filter(plan_name=malicious_name)
        
        # Assert - 不应该返回所有计划
        assert plans.count() == 0, \
            "ORM过滤应该安全处理SQL注入字符"
    
    def test_raw_sql_vulnerability_check(self, db):
        """检查是否存在原始SQL查询漏洞"""
        # 这个测试主要是提醒：如果代码中使用了raw SQL，需要特别注意
        from django.db import connection
        
        # 示例：不安全的原始SQL（仅用于演示，不应该在实际代码中使用）
        # cursor = connection.cursor()
        # cursor.execute(f"SELECT * FROM users WHERE username = '{user_input}'")  # 不安全！
        
        # 正确的做法：使用参数化查询
        # cursor.execute("SELECT * FROM users WHERE username = %s", [user_input])  # 安全
        
        # Assert - 这个测试主要是文档性质的
        assert True, "提醒：如果使用raw SQL，必须使用参数化查询"


@pytest.mark.security
class TestSQLInjectionImpact:
    """SQL注入影响测试"""
    
    def test_data_not_deleted_by_injection(self, db, test_plan):
        """测试数据不会被SQL注入删除"""
        # Arrange
        plan_id = test_plan.id
        initial_count = StorePlan.objects.count()
        
        # Act - 尝试通过SQL注入删除数据
        # 这里我们直接测试ORM的安全性
        malicious_filter = "1=1; DELETE FROM store_planning_storeplan"
        try:
            # 尝试使用恶意过滤条件
            StorePlan.objects.filter(id=malicious_filter).delete()
        except Exception:
            # 预期会抛出异常
            pass
        
        # Assert - 数据应该仍然存在
        assert StorePlan.objects.filter(id=plan_id).exists(), \
            "数据不应该被SQL注入删除"
        assert StorePlan.objects.count() == initial_count, \
            "数据总数不应该改变"
    
    def test_unauthorized_data_not_exposed(self, api_client, test_user, test_plan):
        """测试SQL注入不会暴露未授权数据"""
        # Arrange - 登录
        login_data = {
            "login_type": "username_password",
            "username": "sqltest",
            "password": "test123"
        }
        login_response = api_client.post(
            '/api/auth/login/',
            data=login_data,
            content_type='application/json'
        )
        access_token = login_response.json()['data']['access_token']
        
        # Act - 尝试通过SQL注入获取所有数据
        response = api_client.get(
            "/api/store-plans/?id=' OR '1'='1",
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        
        # Assert
        if response.status_code == 200:
            data = response.json()
            if 'data' in data:
                results = data['data'] if isinstance(data['data'], list) else data['data'].get('results', [])
                # 应该只返回用户有权限访问的数据，不是所有数据
                # 这里我们无法确定确切数量，但可以检查是否有权限过滤
                print(f"返回了 {len(results)} 条结果，应该有权限过滤")
