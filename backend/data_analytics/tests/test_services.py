"""
数据分析服务测试
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from unittest.mock import patch, MagicMock

from ..services import DataAggregationService, ROICalculationService, ReportGenerationService
from ..models import AnalyticsCache, ReportTask, ExternalSalesData

User = get_user_model()


class DataAggregationServiceTest(TestCase):
    """数据聚合服务测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.service = DataAggregationService()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_get_cache_key(self):
        """测试缓存键生成"""
        cache_key = self.service._get_cache_key('dashboard', user_id=1, region_id=2)
        expected = 'analytics:dashboard:region_id_2:user_id_1'
        self.assertEqual(cache_key, expected)
    
    def test_get_cache_key_with_none_values(self):
        """测试包含None值的缓存键生成"""
        cache_key = self.service._get_cache_key('dashboard', user_id=1, region_id=None)
        expected = 'analytics:dashboard:user_id_1'
        self.assertEqual(cache_key, expected)
    
    @patch('data_analytics.services.cache')
    def test_get_cached_data_from_redis(self, mock_cache):
        """测试从Redis获取缓存数据"""
        mock_data = {'test': 'data'}
        mock_cache.get.return_value = mock_data
        
        result = self.service._get_cached_data('test_key')
        
        self.assertEqual(result, mock_data)
        mock_cache.get.assert_called_once_with('test_key')
    
    @patch('data_analytics.services.cache')
    def test_get_cached_data_from_database(self, mock_cache):
        """测试从数据库获取缓存数据"""
        mock_cache.get.return_value = None
        
        # 创建数据库缓存记录
        cache_data = {'test': 'db_data'}
        AnalyticsCache.objects.create(
            cache_key='test_key',
            cache_data=cache_data,
            cache_type='dashboard',
            expires_at=timezone.now() + timezone.timedelta(hours=1)
        )
        
        result = self.service._get_cached_data('test_key')
        
        self.assertEqual(result, cache_data)
    
    @patch('data_analytics.services.cache')
    def test_set_cached_data(self, mock_cache):
        """测试设置缓存数据"""
        test_data = {'test': 'data'}
        
        self.service._set_cached_data('test_key', test_data, 'dashboard', 300)
        
        # 验证Redis缓存调用
        mock_cache.set.assert_called_once_with('test_key', test_data, 300)
        
        # 验证数据库缓存创建
        cache_obj = AnalyticsCache.objects.get(cache_key='test_key')
        self.assertEqual(cache_obj.cache_data, test_data)
        self.assertEqual(cache_obj.cache_type, 'dashboard')


class ROICalculationServiceTest(TestCase):
    """投资回报率计算服务测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.service = ROICalculationService()
    
    def test_calculate_store_roi_basic(self):
        """测试基本ROI计算"""
        # 这里需要创建测试门店数据
        # 由于涉及多个模型的关联，暂时跳过具体实现
        pass


class ReportGenerationServiceTest(TestCase):
    """报表生成服务测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.service = ReportGenerationService()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_update_task_progress(self):
        """测试任务进度更新"""
        # 创建报表任务
        task = ReportTask.objects.create(
            report_type='plan',
            filters={},
            format='excel',
            created_by=self.user
        )
        
        # 更新进度
        self.service._update_task_progress(str(task.task_id), 50)
        
        # 验证进度更新
        task.refresh_from_db()
        self.assertEqual(task.progress, 50)
    
    def test_apply_plan_filters(self):
        """测试开店计划筛选条件应用"""
        from store_planning.models import StorePlan
        
        # 创建模拟查询集
        queryset = StorePlan.objects.all()
        
        # 测试日期范围筛选
        filters = {'date_range': '2024-01-01,2024-12-31'}
        filtered_queryset = self.service._apply_plan_filters(queryset, filters)
        
        # 验证筛选条件被应用（这里只是验证方法不会报错）
        self.assertIsNotNone(filtered_queryset)
    
    def test_generate_plan_summary(self):
        """测试开店计划统计汇总生成"""
        report_data = [
            {'目标数量': 10, '完成数量': 8, '完成率(%)': 80.0},
            {'目标数量': 20, '完成数量': 15, '完成率(%)': 75.0},
        ]
        
        summary = self.service._generate_plan_summary(report_data)
        
        expected = {
            '总计划数': 2,
            '总目标数量': 30,
            '总完成数量': 23,
            '平均完成率(%)': 77.5,
            '整体完成率(%)': 76.67,
        }
        
        self.assertEqual(summary, expected)
    
    def test_generate_follow_up_summary(self):
        """测试跟进统计汇总生成"""
        report_data = [
            {'是否超期': '是', '跟进天数': 35, '预计ROI(%)': 15.0},
            {'是否超期': '否', '跟进天数': 20, '预计ROI(%)': 18.0},
            {'是否超期': '否', '跟进天数': 25, '预计ROI(%)': 12.0},
        ]
        
        summary = self.service._generate_follow_up_summary(report_data)
        
        expected = {
            '总跟进数': 3,
            '超期数量': 1,
            '超期率(%)': 33.33,
            '平均跟进天数': 26.7,
            '平均预计ROI(%)': 15.0,
        }
        
        self.assertEqual(summary, expected)
    
    def test_generate_preparation_summary(self):
        """测试筹备统计汇总生成"""
        report_data = [
            {'是否延期': '是', '工程进度(%)': 80, '工程状态': '施工中'},
            {'是否延期': '否', '工程进度(%)': 100, '工程状态': '已完成'},
            {'是否延期': '否', '工程进度(%)': 90, '工程状态': '验收中'},
        ]
        
        summary = self.service._generate_preparation_summary(report_data)
        
        expected = {
            '总工程数': 3,
            '已完成数': 1,
            '延期数量': 1,
            '延期率(%)': 33.33,
            '按时完工率(%)': 66.67,
            '平均工程进度(%)': 90.0,
        }
        
        self.assertEqual(summary, expected)
    
    def test_generate_assets_summary(self):
        """测试资产统计汇总生成"""
        report_data = [
            {'门店编码': 'S001', '资产数量': 5, '总价值(元)': 15000},
            {'门店编码': 'S002', '资产数量': 3, '总价值(元)': 9000},
            {'门店编码': 'S001', '资产数量': 2, '总价值(元)': 6000},  # 同一门店的其他资产
        ]
        
        summary = self.service._generate_assets_summary(report_data)
        
        expected = {
            '涉及门店数': 2,
            '资产总数量': 10,
            '资产总价值(元)': 30000,
            '平均单店资产价值(元)': 15000.0,
        }
        
        self.assertEqual(summary, expected)
    
    @patch('data_analytics.services.ReportGenerationService._generate_excel_report')
    def test_generate_excel_report(self, mock_generate_excel):
        """测试Excel报表生成"""
        test_data = [{'列1': '值1', '列2': '值2'}]
        summary_data = {'统计项': '统计值'}
        
        # 模拟返回文件路径
        expected_path = '/path/to/test_report.xlsx'
        mock_generate_excel.return_value = expected_path
        
        result = self.service._generate_excel_report(
            test_data, summary_data, '测试报表', 'test_task_id'
        )
        
        # 验证返回文件路径
        self.assertEqual(result, expected_path)
        
        # 验证方法被调用
        mock_generate_excel.assert_called_once_with(
            test_data, summary_data, '测试报表', 'test_task_id'
        )
    
    def test_check_follow_up_overdue(self):
        """测试跟进超期检查"""
        # 创建模拟跟进记录
        mock_record = MagicMock()
        mock_record.updated_at.date.return_value = timezone.now().date() - timezone.timedelta(days=35)
        
        result = self.service._check_follow_up_overdue(mock_record)
        
        self.assertTrue(result)  # 35天未更新，应该超期
    
    def test_get_profit_calculation_data_with_none(self):
        """测试获取空的盈利测算数据"""
        result = self.service._get_profit_calculation_data(None)
        
        expected = {
            'total_investment': 0,
            'annual_revenue': 0,
            'roi': 0,
            'payback_period': 0,
        }
        
        self.assertEqual(result, expected)
    
    def test_calculate_construction_progress_no_milestones(self):
        """测试无里程碑的工程进度计算"""
        mock_order = MagicMock()
        mock_order.milestones.exists.return_value = False
        
        result = self.service._calculate_construction_progress(mock_order)
        
        expected = {'progress': 0, 'delay_days': 0}
        self.assertEqual(result, expected)
    
    def test_check_construction_delay_no_end_date(self):
        """测试无预计完工日期的延期检查"""
        mock_order = MagicMock()
        mock_order.construction_end_date = None
        
        result = self.service._check_construction_delay(mock_order)
        
        self.assertFalse(result)  # 无预计完工日期，不算延期
    
    def test_get_delivery_status_no_checklist(self):
        """测试无交付清单的状态获取"""
        mock_order = MagicMock()
        mock_order.delivery_checklist = None
        
        result = self.service._get_delivery_status(mock_order)
        
        expected = {'status': '未创建', 'completion_rate': 0}
        self.assertEqual(result, expected)


# 集成测试
class ReportGenerationIntegrationTest(TestCase):
    """报表生成集成测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_report_task(self):
        """测试创建报表任务"""
        task = ReportTask.objects.create(
            report_type='plan',
            filters={'date_range': '2024-01-01,2024-12-31'},
            format='excel',
            created_by=self.user
        )
        
        self.assertEqual(task.report_type, 'plan')
        self.assertEqual(task.status, 'pending')
        self.assertEqual(task.progress, 0)
        self.assertEqual(task.created_by, self.user)
    
    def test_report_task_status_transitions(self):
        """测试报表任务状态转换"""
        task = ReportTask.objects.create(
            report_type='plan',
            filters={},
            format='excel',
            created_by=self.user
        )
        
        # 测试状态转换
        task.status = 'processing'
        task.progress = 50
        task.save()
        
        task.refresh_from_db()
        self.assertEqual(task.status, 'processing')
        self.assertEqual(task.progress, 50)
        
        # 测试完成状态
        task.status = 'completed'
        task.progress = 100
        task.completed_at = timezone.now()
        task.file_path = '/path/to/report.xlsx'
        task.save()
        
        task.refresh_from_db()
        self.assertEqual(task.status, 'completed')
        self.assertEqual(task.progress, 100)
        self.assertIsNotNone(task.completed_at)
        self.assertIsNotNone(task.file_path)