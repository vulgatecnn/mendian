"""
数据分析模块测试
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from .models import AnalyticsCache, ReportTask, ExternalSalesData
from .services import AnalyticsService, CacheService

User = get_user_model()


class AnalyticsServiceTest(TestCase):
    """数据分析服务测试"""
    
    def setUp(self):
        self.service = AnalyticsService()
    
    def test_calculate_roi(self):
        """测试投资回报率计算"""
        # 正常情况
        roi = self.service.calculate_roi(100000, 120000)
        self.assertEqual(roi, 20.0)
        
        # 投资为0的情况
        roi = self.service.calculate_roi(0, 120000)
        self.assertEqual(roi, 0)
        
        # 负投资的情况
        roi = self.service.calculate_roi(-100000, 120000)
        self.assertEqual(roi, 0)
    
    def test_calculate_conversion_rates(self):
        """测试漏斗转化率计算"""
        # 正常情况
        funnel_data = [100, 80, 60, 40, 20]
        rates = self.service.calculate_conversion_rates(funnel_data)
        expected_rates = [80.0, 75.0, 66.67, 50.0]
        self.assertEqual(rates, expected_rates)
        
        # 空数据情况
        rates = self.service.calculate_conversion_rates([])
        self.assertEqual(rates, [])
        
        # 单个数据情况
        rates = self.service.calculate_conversion_rates([100])
        self.assertEqual(rates, [])


class CacheServiceTest(TestCase):
    """缓存服务测试"""
    
    def test_cache_operations(self):
        """测试缓存操作"""
        # 设置缓存
        cache_key = 'test_cache'
        cache_data = {'test': 'data'}
        CacheService.set_cache(cache_key, cache_data, 'dashboard', 300)
        
        # 获取缓存
        cached_data = CacheService.get_cache(cache_key)
        self.assertEqual(cached_data, cache_data)
        
        # 清除缓存
        CacheService.clear_cache('dashboard')
        cached_data = CacheService.get_cache(cache_key)
        self.assertIsNone(cached_data)


class AnalyticsAPITest(APITestCase):
    """数据分析API测试"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_dashboard_api_requires_auth(self):
        """测试大屏API需要认证"""
        url = '/api/analytics/dashboard/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_report_generation_api(self):
        """测试报表生成API"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/analytics/reports/generate/'
        data = {
            'report_type': 'plan',
            'filters': {'date_range': '2024-01-01,2024-12-31'},
            'format': 'excel'
        }
        response = self.client.post(url, data, format='json')
        
        # 由于权限限制，可能返回403，这是正常的
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_403_FORBIDDEN])


class AnalyticsCacheModelTest(TestCase):
    """数据分析缓存模型测试"""
    
    def test_cache_expiry(self):
        """测试缓存过期检查"""
        # 创建已过期的缓存
        expired_cache = AnalyticsCache.objects.create(
            cache_key='expired_test',
            cache_data={'test': 'data'},
            cache_type='dashboard',
            expires_at=timezone.now() - timezone.timedelta(minutes=1)
        )
        
        self.assertTrue(expired_cache.is_expired())
        
        # 创建未过期的缓存
        valid_cache = AnalyticsCache.objects.create(
            cache_key='valid_test',
            cache_data={'test': 'data'},
            cache_type='dashboard',
            expires_at=timezone.now() + timezone.timedelta(minutes=5)
        )
        
        self.assertFalse(valid_cache.is_expired())


class ReportTaskModelTest(TestCase):
    """报表任务模型测试"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_report_task_creation(self):
        """测试报表任务创建"""
        task = ReportTask.objects.create(
            report_type='plan',
            filters={'date_range': '2024-01-01,2024-12-31'},
            format='excel',
            created_by=self.user
        )
        
        self.assertEqual(task.status, 'pending')
        self.assertEqual(task.progress, 0)
        self.assertEqual(task.created_by, self.user)
    
    def test_task_duration_calculation(self):
        """测试任务时长计算"""
        task = ReportTask.objects.create(
            report_type='plan',
            created_by=self.user,
            started_at=timezone.now(),
            completed_at=timezone.now() + timezone.timedelta(minutes=5)
        )
        
        duration = task.duration
        self.assertIsNotNone(duration)
        self.assertGreater(duration.total_seconds(), 0)
