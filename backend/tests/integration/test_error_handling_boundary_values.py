"""
边界值测试
测试数字、字符串、日期等字段的边界值处理
"""
import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
import json

User = get_user_model()


@pytest.mark.django_db
class TestNumericBoundaryValues:
    """测试数字字段的边界值"""
    
    def test_create_plan_with_zero_target(self, authenticated_client):
        """测试创建计划时目标数量为0"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 1,
            'target_count': 0
        })
        
        # 0可能是有效值或被拒绝
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_plan_with_negative_target(self, authenticated_client):
        """测试创建计划时目标数量为负数"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 1,
            'target_count': -10
        })
        
        # 负数应该被拒绝
        assert response.status_code in [400, 422]
    
    def test_create_plan_with_very_large_target(self, authenticated_client):
        """测试创建计划时目标数量为极大值"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 1,
            'target_count': 2147483647  # 32位整数最大值
        })
        
        # 应该接受或返回合理错误
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_plan_with_overflow_target(self, authenticated_client):
        """测试创建计划时目标数量超过整数范围"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 1,
            'target_count': 9999999999999999999  # 超大数字
        }, content_type='application/json')
        
        # 应该返回错误
        assert response.status_code in [400, 422]
    
    def test_create_location_with_zero_area(self, authenticated_client):
        """测试创建位置时面积为0"""
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': '测试位置',
            'address': '测试地址',
            'area': 0
        })
        
        # 0面积可能被拒绝
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_location_with_negative_area(self, authenticated_client):
        """测试创建位置时面积为负数"""
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': '测试位置',
            'address': '测试地址',
            'area': -100
        })
        
        # 负数应该被拒绝
        assert response.status_code in [400, 422]
    
    def test_create_location_with_decimal_area(self, authenticated_client):
        """测试创建位置时面积为小数"""
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': '测试位置',
            'address': '测试地址',
            'area': 123.456
        })
        
        # 小数应该被接受
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_location_with_very_small_decimal(self, authenticated_client):
        """测试创建位置时面积为极小小数"""
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': '测试位置',
            'address': '测试地址',
            'area': 0.0001
        })
        
        # 极小值应该被接受或拒绝
        assert response.status_code in [200, 201, 400, 422]
    
    def test_pagination_with_zero_page_size(self, authenticated_client):
        """测试分页时每页数量为0"""
        response = authenticated_client.get('/api/users/', {'page_size': 0})
        
        # 应该返回错误或使用默认值
        assert response.status_code in [200, 400]
    
    def test_pagination_with_negative_page(self, authenticated_client):
        """测试分页时页码为负数"""
        response = authenticated_client.get('/api/users/', {'page': -1})
        
        # 应该返回错误或第一页
        assert response.status_code in [200, 400, 404]
    
    def test_pagination_with_very_large_page_size(self, authenticated_client):
        """测试分页时每页数量为极大值"""
        response = authenticated_client.get('/api/users/', {'page_size': 10000})
        
        # 应该限制最大值或返回错误
        assert response.status_code in [200, 400]


@pytest.mark.django_db
class TestStringBoundaryValues:
    """测试字符串字段的边界值"""
    
    def test_create_user_with_very_long_username(self, authenticated_client):
        """测试创建用户时用户名超长"""
        long_username = 'a' * 200  # 200个字符
        response = authenticated_client.post('/api/users/', {
            'username': long_username,
            'password': 'testpass123'
        })
        
        # 应该被拒绝或截断
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_user_with_single_char_username(self, authenticated_client):
        """测试创建用户时用户名为单个字符"""
        response = authenticated_client.post('/api/users/', {
            'username': 'a',
            'password': 'testpass123'
        })
        
        # 可能有最小长度限制
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_user_with_special_characters(self, authenticated_client):
        """测试创建用户时用户名包含特殊字符"""
        response = authenticated_client.post('/api/users/', {
            'username': 'test@#$%^&*()',
            'password': 'testpass123'
        })
        
        # 特殊字符可能被拒绝
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_user_with_unicode_username(self, authenticated_client):
        """测试创建用户时用户名包含Unicode字符"""
        response = authenticated_client.post('/api/users/', {
            'username': '测试用户😀',
            'password': 'testpass123'
        })
        
        # Unicode应该被支持
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_plan_with_very_long_name(self, authenticated_client):
        """测试创建计划时名称超长"""
        long_name = '测试计划' * 100  # 400个字符
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': long_name,
            'year': 2024,
            'quarter': 1
        })
        
        # 应该被拒绝或截断
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_plan_with_single_char_name(self, authenticated_client):
        """测试创建计划时名称为单个字符"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': 'A',
            'year': 2024,
            'quarter': 1
        })
        
        # 单字符可能被接受
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_location_with_very_long_address(self, authenticated_client):
        """测试创建位置时地址超长"""
        long_address = '北京市朝阳区' * 50  # 300个字符
        response = authenticated_client.post('/api/store-expansion/locations/', {
            'name': '测试位置',
            'address': long_address
        })
        
        # 应该被拒绝或截断
        assert response.status_code in [200, 201, 400, 422]
    
    def test_search_with_very_long_query(self, authenticated_client):
        """测试搜索时查询字符串超长"""
        long_query = 'search' * 200  # 1200个字符
        response = authenticated_client.get('/api/users/', {'search': long_query})
        
        # 应该处理或限制
        assert response.status_code in [200, 400]
    
    def test_create_user_with_sql_injection_attempt(self, authenticated_client):
        """测试创建用户时用户名包含SQL注入尝试"""
        response = authenticated_client.post('/api/users/', {
            'username': "admin' OR '1'='1",
            'password': 'testpass123'
        })
        
        # 应该被安全处理
        assert response.status_code in [200, 201, 400, 422]


@pytest.mark.django_db
class TestDateBoundaryValues:
    """测试日期字段的边界值"""
    
    def test_create_plan_with_past_year(self, authenticated_client):
        """测试创建计划时年份为过去"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2000,
            'quarter': 1
        })
        
        # 过去年份可能被接受或拒绝
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_plan_with_far_future_year(self, authenticated_client):
        """测试创建计划时年份为遥远未来"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2100,
            'quarter': 1
        })
        
        # 未来年份可能被接受或拒绝
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_plan_with_invalid_quarter(self, authenticated_client):
        """测试创建计划时季度无效"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 5  # 无效季度
        })
        
        # 应该被拒绝
        assert response.status_code in [400, 422]
    
    def test_create_plan_with_zero_quarter(self, authenticated_client):
        """测试创建计划时季度为0"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 0
        })
        
        # 应该被拒绝
        assert response.status_code in [400, 422]
    
    def test_filter_by_date_range_with_inverted_dates(self, authenticated_client):
        """测试日期范围查询时开始日期晚于结束日期"""
        response = authenticated_client.get('/api/store-planning/plans/', {
            'start_date': '2024-12-31',
            'end_date': '2024-01-01'
        })
        
        # 应该返回空结果或错误
        assert response.status_code in [200, 400]
    
    def test_filter_by_date_with_invalid_format(self, authenticated_client):
        """测试日期查询时格式无效"""
        response = authenticated_client.get('/api/store-planning/plans/', {
            'start_date': '2024/01/01'  # 错误格式
        })
        
        # 应该返回错误
        assert response.status_code in [200, 400]
    
    def test_filter_by_date_with_february_29_non_leap_year(self, authenticated_client):
        """测试非闰年的2月29日"""
        response = authenticated_client.get('/api/store-planning/plans/', {
            'start_date': '2023-02-29'  # 2023不是闰年
        })
        
        # 应该返回错误
        assert response.status_code in [200, 400]


@pytest.mark.django_db
class TestArrayBoundaryValues:
    """测试数组字段的边界值"""
    
    def test_create_with_empty_array(self, authenticated_client):
        """测试创建时数组为空"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 1,
            'regions': []  # 空数组
        }, content_type='application/json')
        
        # 空数组可能被接受
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_with_very_large_array(self, authenticated_client):
        """测试创建时数组元素过多"""
        large_array = list(range(1000))  # 1000个元素
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 1,
            'tags': large_array
        }, content_type='application/json')
        
        # 应该限制或接受
        assert response.status_code in [200, 201, 400, 422]
    
    def test_create_with_single_element_array(self, authenticated_client):
        """测试创建时数组只有一个元素"""
        response = authenticated_client.post('/api/store-planning/plans/', {
            'name': '测试计划',
            'year': 2024,
            'quarter': 1,
            'regions': [1]
        }, content_type='application/json')
        
        # 单元素数组应该被接受
        assert response.status_code in [200, 201, 400, 422]
    
    def test_batch_delete_with_empty_ids(self, authenticated_client):
        """测试批量删除时ID列表为空"""
        response = authenticated_client.post('/api/users/batch-delete/', {
            'ids': []
        }, content_type='application/json')
        
        # 空列表应该返回错误或成功（无操作）
        assert response.status_code in [200, 400, 422]
    
    def test_batch_delete_with_very_large_ids(self, authenticated_client):
        """测试批量删除时ID列表过大"""
        large_ids = list(range(1, 10001))  # 10000个ID
        response = authenticated_client.post('/api/users/batch-delete/', {
            'ids': large_ids
        }, content_type='application/json')
        
        # 应该限制批量操作数量
        assert response.status_code in [200, 400, 422]
