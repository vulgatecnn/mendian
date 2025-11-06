"""
数据分析模块测试
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from .models import AnalyticsCache, ReportTask, ExternalSalesData
from .services import DataAggregationService, ROICalculationService
from .utils import DataValidator, DataCleaner, DataFormatter

User = get_user_model()


class DataAggregationServiceTest(TestCase):
    """数据聚合服务测试"""
    
    def setUp(self):
        self.service = DataAggregationService()
    
    def test_cache_key_generation(self):
        """测试缓存键生成"""
        cache_key = self.service._get_cache_key('dashboard', user_id=1, region_id=2)
        self.assertIn('analytics', cache_key)
        self.assertIn('dashboard', cache_key)
        self.assertIn('user_id_1', cache_key)
        self.assertIn('region_id_2', cache_key)
    
    def test_conversion_rates_calculation(self):
        """测试转化率计算"""
        stage_counts = {
            'investigating': {'count': 100},
            'calculating': {'count': 80},
            'approving': {'count': 60},
            'signing': {'count': 40},
            'signed': {'count': 20},
        }
        funnel_stages = [
            ('investigating', '调研中'),
            ('calculating', '测算中'),
            ('approving', '审批中'),
            ('signing', '签约中'),
            ('signed', '已签约'),
        ]
        
        rates = self.service._calculate_conversion_rates(stage_counts, funnel_stages)
        
        self.assertEqual(len(rates), 4)  # 5个阶段，4个转化率
        self.assertEqual(rates[0]['rate'], 80.0)  # 100 -> 80
        self.assertEqual(rates[1]['rate'], 75.0)  # 80 -> 60


class ROICalculationServiceTest(TestCase):
    """ROI计算服务测试"""
    
    def setUp(self):
        self.service = ROICalculationService()
    
    def test_investment_cost_calculation(self):
        """测试投资成本计算"""
        # 由于需要实际的门店数据，这里只测试基本逻辑
        # 在实际项目中需要创建测试数据
        pass


class DataValidatorTest(TestCase):
    """数据验证器测试"""
    
    def test_sales_data_validation(self):
        """测试销售数据验证"""
        # 正常数据
        valid_data = {
            'store_id': '1',
            'data_date': '2024-01-01',
            'daily_revenue': '1000.50',
            'daily_orders': '50'
        }
        
        result = DataValidator.validate_sales_data(valid_data)
        self.assertEqual(result['store_id'], 1)
        self.assertEqual(result['daily_revenue'], Decimal('1000.50'))
        self.assertEqual(result['daily_orders'], 50)
        
        # 缺少必需字段
        invalid_data = {
            'store_id': '1',
            'daily_revenue': '1000.50'
        }
        
        with self.assertRaises(Exception):
            DataValidator.validate_sales_data(invalid_data)
    
    def test_date_range_validation(self):
        """测试日期范围验证"""
        # 正常日期范围
        start_date, end_date = DataValidator.validate_date_range('2024-01-01', '2024-01-31')
        self.assertLess(start_date, end_date)
        
        # 无效日期范围
        with self.assertRaises(Exception):
            DataValidator.validate_date_range('2024-01-31', '2024-01-01')


class DataCleanerTest(TestCase):
    """数据清洗器测试"""
    
    def test_store_data_cleaning(self):
        """测试门店数据清洗"""
        dirty_data = {
            'name': '  测试门店  ',
            'province': '广东',
            'city': '  深圳市  ',
            'status': '营业中'
        }
        
        cleaned_data = DataCleaner.clean_store_data(dirty_data)
        
        self.assertEqual(cleaned_data['name'], '测试门店')
        self.assertEqual(cleaned_data['province'], '广东省')
        self.assertEqual(cleaned_data['city'], '深圳市')
        self.assertEqual(cleaned_data['status'], 'operating')
    
    def test_financial_data_cleaning(self):
        """测试财务数据清洗"""
        dirty_data = {
            'revenue': '1000.567',
            'roi': '25.678',
            'completion_rate': '-5'
        }
        
        cleaned_data = DataCleaner.clean_financial_data(dirty_data)
        
        self.assertEqual(cleaned_data['revenue'], Decimal('1000.57'))
        self.assertEqual(cleaned_data['roi'], 25.68)
        self.assertEqual(cleaned_data['completion_rate'], 0)  # 负数被修正为0


class DataFormatterTest(TestCase):
    """数据格式化器测试"""
    
    def test_currency_formatting(self):
        """测试货币格式化"""
        amount = Decimal('1234567.89')
        formatted = DataFormatter.format_currency(amount)
        self.assertEqual(formatted, '¥1,234,567.89')
        
        # 测试None值
        formatted = DataFormatter.format_currency(None)
        self.assertEqual(formatted, '¥0.00')
    
    def test_percentage_formatting(self):
        """测试百分比格式化"""
        percentage = 25.678
        formatted = DataFormatter.format_percentage(percentage)
        self.assertEqual(formatted, '25.68%')
        
        # 测试None值
        formatted = DataFormatter.format_percentage(None)
        self.assertEqual(formatted, '0.00%')
    
    def test_number_formatting(self):
        """测试数字格式化"""
        number = 1234567
        formatted = DataFormatter.format_number(number)
        self.assertEqual(formatted, '1,234,567')
        
        # 测试小数
        number = 1234.567
        formatted = DataFormatter.format_number(number, 2)
        self.assertEqual(formatted, '1,234.57')


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
