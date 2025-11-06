"""
单元测试 - 工具函数测试
测试工具函数和辅助方法
"""
import pytest
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache


@pytest.mark.unit
class TestDjangoCacheService:
    """Django缓存服务测试"""
    
    def test_set_and_get_cache(self):
        """测试设置和获取缓存"""
        # Arrange
        key = 'test_key_unit'
        value = {'data': 'test_value'}
        
        # Act
        cache.set(key, value, timeout=60)
        result = cache.get(key)
        
        # Assert
        assert result == value
        
        # Cleanup
        cache.delete(key)
    
    def test_get_nonexistent_cache(self):
        """测试获取不存在的缓存"""
        # Arrange
        key = 'nonexistent_key_unit'
        
        # Act
        result = cache.get(key)
        
        # Assert
        assert result is None
    
    def test_delete_cache(self):
        """测试删除缓存"""
        # Arrange
        key = 'test_key_delete_unit'
        value = 'test_value'
        cache.set(key, value)
        
        # Act
        cache.delete(key)
        result = cache.get(key)
        
        # Assert
        assert result is None


@pytest.mark.unit
class TestDateTimeUtils:
    """日期时间工具函数测试"""
    
    def test_datetime_now(self):
        """测试获取当前时间"""
        # Act
        now = timezone.now()
        
        # Assert
        assert isinstance(now, datetime)
        assert now.year >= 2024
    
    def test_datetime_comparison(self):
        """测试日期时间比较"""
        # Arrange
        dt1 = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        dt2 = datetime(2024, 1, 2, 12, 0, 0, tzinfo=timezone.utc)
        
        # Act & Assert
        assert dt2 > dt1
        assert dt1 < dt2
        assert dt1 != dt2
    
    def test_timedelta_calculation(self):
        """测试时间差计算"""
        # Arrange
        dt1 = datetime(2024, 1, 1, 12, 0, 0)
        dt2 = datetime(2024, 1, 2, 12, 0, 0)
        
        # Act
        delta = dt2 - dt1
        
        # Assert
        assert delta.days == 1
        assert delta.total_seconds() == 86400


@pytest.mark.unit
class TestStringUtils:
    """字符串工具函数测试"""
    
    def test_string_concatenation(self):
        """测试字符串拼接"""
        # Arrange
        str1 = '测试'
        str2 = '字符串'
        
        # Act
        result = str1 + str2
        
        # Assert
        assert result == '测试字符串'
        assert len(result) == 5
    
    def test_string_formatting(self):
        """测试字符串格式化"""
        # Arrange
        template = '用户名: {}, 年龄: {}'
        username = '张三'
        age = 25
        
        # Act
        result = template.format(username, age)
        
        # Assert
        assert '张三' in result
        assert '25' in result
    
    def test_string_strip(self):
        """测试字符串去除空白"""
        # Arrange
        text = '  测试文本  '
        
        # Act
        result = text.strip()
        
        # Assert
        assert result == '测试文本'
        assert len(result) == 4


@pytest.mark.unit
class TestListUtils:
    """列表工具函数测试"""
    
    def test_list_append(self):
        """测试列表添加元素"""
        # Arrange
        items = [1, 2, 3]
        
        # Act
        items.append(4)
        
        # Assert
        assert len(items) == 4
        assert items[-1] == 4
    
    def test_list_comprehension(self):
        """测试列表推导式"""
        # Arrange
        numbers = [1, 2, 3, 4, 5]
        
        # Act
        doubled = [n * 2 for n in numbers]
        
        # Assert
        assert doubled == [2, 4, 6, 8, 10]
    
    def test_list_filter(self):
        """测试列表过滤"""
        # Arrange
        numbers = [1, 2, 3, 4, 5, 6]
        
        # Act
        evens = [n for n in numbers if n % 2 == 0]
        
        # Assert
        assert evens == [2, 4, 6]


@pytest.mark.unit
class TestDictUtils:
    """字典工具函数测试"""
    
    def test_dict_get(self):
        """测试字典获取值"""
        # Arrange
        data = {'name': '张三', 'age': 25}
        
        # Act
        name = data.get('name')
        phone = data.get('phone', '未设置')
        
        # Assert
        assert name == '张三'
        assert phone == '未设置'
    
    def test_dict_update(self):
        """测试字典更新"""
        # Arrange
        data = {'name': '张三'}
        
        # Act
        data.update({'age': 25, 'city': '北京'})
        
        # Assert
        assert data['age'] == 25
        assert data['city'] == '北京'
        assert len(data) == 3
    
    def test_dict_keys_values(self):
        """测试字典键值操作"""
        # Arrange
        data = {'a': 1, 'b': 2, 'c': 3}
        
        # Act
        keys = list(data.keys())
        values = list(data.values())
        
        # Assert
        assert len(keys) == 3
        assert len(values) == 3
        assert 'a' in keys
        assert 1 in values
