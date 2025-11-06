"""
数据分析API视图测试
"""
import json
from datetime import datetime, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from ..models import AnalyticsCache, ReportTask
from ..services import DataAggregationService

User = get_user_model()


class AnalyticsAPITestCase(TestCase):
    """数据分析API测试基类"""
    
    def setUp(self):
        """设置测试数据"""
        self.client = APIClient()
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            phone='13800000001'
        )
        
        # 创建超级用户
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            phone='13800000002'
        )
        
        # 认证客户端
        self.client.force_authenticate(user=self.user)


class DashboardDataViewTest(AnalyticsAPITestCase):
    """经营大屏数据接口测试"""
    
    def test_get_dashboard_data_success(self):
        """测试成功获取大屏数据"""
        url = reverse('data_analytics:dashboard-data')
        
        # 模拟数据服务返回
        mock_data = {
            'store_map': {'stores': [], 'statistics': {}},
            'follow_up_funnel': {'stages': [], 'conversion_rates': []},
            'plan_progress': {'plans': []},
            'key_metrics': {'total_stores': 0},
            'last_updated': '2024-01-01T10:00:00Z'
        }
        
        with patch.object(DataAggregationService, 'get_dashboard_data', return_value=mock_data):
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('store_map', response.data['data'])
        self.assertIn('follow_up_funnel', response.data['data'])
        self.assertIn('plan_progress', response.data['data'])
    
    def test_get_dashboard_data_unauthorized(self):
        """测试未认证用户访问"""
        self.client.force_authenticate(user=None)
        url = reverse('data_analytics:dashboard-data')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StoreMapDataViewTest(AnalyticsAPITestCase):
    """开店地图数据接口测试"""
    
    def test_get_store_map_data_success(self):
        """测试成功获取地图数据"""
        url = reverse('data_analytics:store-map-data')
        
        mock_data = {
            'stores': [],
            'region_statistics': [],
            'status_statistics': {},
            'total_count': 0,
            'last_updated': '2024-01-01T10:00:00Z'
        }
        
        with patch.object(DataAggregationService, 'get_store_map_data', return_value=mock_data), \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_permission.return_value.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_permission.return_value.can_access_region.return_value = True
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('stores', response.data['data'])
        self.assertIn('region_statistics', response.data['data'])
    
    def test_get_store_map_data_with_filters(self):
        """测试带筛选条件获取地图数据"""
        url = reverse('data_analytics:store-map-data')
        params = {
            'region': '1',
            'time_range': '2024-01-01,2024-12-31'
        }
        
        mock_data = {
            'stores': [],
            'region_statistics': [],
            'status_statistics': {},
            'total_count': 0,
            'last_updated': '2024-01-01T10:00:00Z'
        }
        
        with patch.object(DataAggregationService, 'get_store_map_data', return_value=mock_data) as mock_method, \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_permission.return_value.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_permission.return_value.can_access_region.return_value = True
            response = self.client.get(url, params)
            
            # 验证调用参数
            mock_method.assert_called_once()
            args, kwargs = mock_method.call_args
            self.assertEqual(args[0], 1)  # region_id
            self.assertIsNotNone(args[1])  # time_range
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_store_map_data_invalid_time_range(self):
        """测试无效时间范围格式"""
        url = reverse('data_analytics:store-map-data')
        params = {'time_range': 'invalid-format'}
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 400)


class FollowUpFunnelDataViewTest(AnalyticsAPITestCase):
    """跟进漏斗数据接口测试"""
    
    def test_get_funnel_data_success(self):
        """测试成功获取漏斗数据"""
        url = reverse('data_analytics:follow-up-funnel-data')
        
        mock_data = {
            'stages': {},
            'conversion_rates': [],
            'total_count': 0,
            'warning_stages': [],
            'last_updated': '2024-01-01T10:00:00Z'
        }
        
        with patch.object(DataAggregationService, 'get_follow_up_funnel_data', return_value=mock_data), \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_permission.return_value.can_access_region.return_value = True
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('stages', response.data['data'])
        self.assertIn('conversion_rates', response.data['data'])
    
    def test_get_funnel_data_with_date_range(self):
        """测试带日期范围获取漏斗数据"""
        url = reverse('data_analytics:follow-up-funnel-data')
        params = {
            'start_date': '2024-01-01',
            'end_date': '2024-12-31',
            'region': '1'
        }
        
        mock_data = {
            'stages': {},
            'conversion_rates': [],
            'total_count': 0,
            'warning_stages': [],
            'last_updated': '2024-01-01T10:00:00Z'
        }
        
        with patch.object(DataAggregationService, 'get_follow_up_funnel_data', return_value=mock_data), \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_permission.return_value.can_access_region.return_value = True
            response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_funnel_data_invalid_date_format(self):
        """测试无效日期格式"""
        url = reverse('data_analytics:follow-up-funnel-data')
        params = {
            'start_date': 'invalid-date',
            'end_date': '2024-12-31'
        }
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PlanProgressDataViewTest(AnalyticsAPITestCase):
    """计划完成进度数据接口测试"""
    
    def test_get_plan_progress_data_success(self):
        """测试成功获取计划进度数据"""
        url = reverse('data_analytics:plan-progress-data')
        
        mock_data = {
            'plans': [],
            'overall_statistics': {},
            'last_updated': '2024-01-01T10:00:00Z'
        }
        
        with patch.object(DataAggregationService, 'get_plan_progress_data', return_value=mock_data), \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_permission.return_value.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_permission.return_value.can_access_data_type.return_value = True
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('plans', response.data['data'])
        self.assertIn('overall_statistics', response.data['data'])
    
    def test_get_plan_progress_data_with_filters(self):
        """测试带筛选条件获取计划进度数据"""
        url = reverse('data_analytics:plan-progress-data')
        params = {
            'plan_id': '1',
            'contribution_rate_type': 'high'
        }
        
        mock_data = {
            'plans': [],
            'overall_statistics': {},
            'last_updated': '2024-01-01T10:00:00Z'
        }
        
        with patch.object(DataAggregationService, 'get_plan_progress_data', return_value=mock_data), \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_permission.return_value.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_permission.return_value.can_access_data_type.return_value = True
            response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_plan_progress_data_invalid_contribution_rate_type(self):
        """测试无效贡献率类型"""
        url = reverse('data_analytics:plan-progress-data')
        params = {'contribution_rate_type': 'invalid'}
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RefreshCacheViewTest(AnalyticsAPITestCase):
    """缓存刷新接口测试"""
    
    def test_refresh_cache_success(self):
        """测试成功刷新缓存"""
        url = reverse('data_analytics:refresh-cache')
        data = {'cache_type': 'dashboard'}
        
        with patch.object(DataAggregationService, 'refresh_cache') as mock_refresh:
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        mock_refresh.assert_called_once_with('dashboard')
    
    def test_refresh_all_cache(self):
        """测试刷新全部缓存"""
        url = reverse('data_analytics:refresh-cache')
        
        with patch.object(DataAggregationService, 'refresh_cache') as mock_refresh:
            response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_refresh.assert_called_once_with(None)
    
    def test_refresh_cache_invalid_type(self):
        """测试无效缓存类型"""
        url = reverse('data_analytics:refresh-cache')
        data = {'cache_type': 'invalid_type'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GenerateReportViewTest(AnalyticsAPITestCase):
    """报表生成接口测试"""
    
    def test_generate_report_success(self):
        """测试成功创建报表任务"""
        url = reverse('data_analytics:generate-report')
        data = {
            'report_type': 'plan',
            'filters': {'date_range': '2024-01-01,2024-12-31'},
            'format': 'excel'
        }
        
        with patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission, \
             patch('data_analytics.tasks.generate_report_task.delay') as mock_task:
            mock_permission.return_value.can_generate_report.return_value = True
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('task_id', response.data['data'])
        self.assertIn('estimated_time', response.data['data'])
        mock_task.assert_called_once()
    
    def test_generate_report_invalid_type(self):
        """测试无效报表类型"""
        url = reverse('data_analytics:generate-report')
        data = {'report_type': 'invalid_type'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 400)
    
    def test_generate_report_missing_type(self):
        """测试缺少报表类型"""
        url = reverse('data_analytics:generate-report')
        data = {'format': 'excel'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_generate_report_permission_denied(self):
        """测试权限不足"""
        url = reverse('data_analytics:generate-report')
        data = {'report_type': 'plan'}
        
        with patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_permission.return_value.can_generate_report.return_value = False
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ReportStatusViewTest(AnalyticsAPITestCase):
    """报表状态查询接口测试"""
    
    def setUp(self):
        super().setUp()
        # 创建测试报表任务
        self.report_task = ReportTask.objects.create(
            report_type='plan',
            filters={'date_range': '2024-01-01,2024-12-31'},
            format='excel',
            status='processing',
            progress=50,
            created_by=self.user
        )
    
    def test_get_report_status_success(self):
        """测试成功获取报表状态"""
        url = reverse('data_analytics:report-status', kwargs={'task_id': self.report_task.task_id})
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertEqual(response.data['data']['status'], 'processing')
        self.assertEqual(response.data['data']['progress'], 50)
    
    def test_get_report_status_not_found(self):
        """测试报表任务不存在"""
        import uuid
        fake_task_id = uuid.uuid4()
        url = reverse('data_analytics:report-status', kwargs={'task_id': fake_task_id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_completed_report_status(self):
        """测试已完成报表的状态"""
        self.report_task.status = 'completed'
        self.report_task.file_path = '/path/to/report.xlsx'
        self.report_task.save()
        
        url = reverse('data_analytics:report-status', kwargs={'task_id': self.report_task.task_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('download_url', response.data['data'])


class DownloadReportViewTest(AnalyticsAPITestCase):
    """报表下载接口测试"""
    
    def setUp(self):
        super().setUp()
        # 创建已完成的测试报表任务
        self.report_task = ReportTask.objects.create(
            report_type='plan',
            filters={'date_range': '2024-01-01,2024-12-31'},
            format='excel',
            status='completed',
            progress=100,
            file_path='/fake/path/report.xlsx',
            created_by=self.user
        )
    
    def test_download_report_not_found(self):
        """测试下载不存在的报表"""
        import uuid
        fake_task_id = uuid.uuid4()
        url = reverse('data_analytics:download-report', kwargs={'task_id': fake_task_id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_download_report_file_not_exists(self):
        """测试下载文件不存在的报表"""
        url = reverse('data_analytics:download-report', kwargs={'task_id': self.report_task.task_id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['code'], 404)


class ScheduledReportViewTest(AnalyticsAPITestCase):
    """定时报表管理接口测试"""
    
    def test_get_scheduled_reports_success(self):
        """测试成功获取定时报表列表"""
        from ..models import ScheduledReport
        
        # 创建测试定时报表
        ScheduledReport.objects.create(
            name='测试定时报表',
            report_type='plan',
            frequency='daily',
            created_by=self.user
        )
        
        url = reverse('data_analytics:scheduled-reports')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('reports', response.data['data'])
        self.assertEqual(len(response.data['data']['reports']), 1)
    
    def test_create_scheduled_report_success(self):
        """测试成功创建定时报表"""
        url = reverse('data_analytics:scheduled-reports')
        data = {
            'name': '每日开店计划报表',
            'report_type': 'plan',
            'frequency': 'daily',
            'filters': {'date_range': '2024-01-01,2024-12-31'},
            'format': 'excel',
            'recipients': ['test@example.com']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('id', response.data['data'])
    
    def test_create_scheduled_report_missing_params(self):
        """测试创建定时报表缺少必需参数"""
        url = reverse('data_analytics:scheduled-reports')
        data = {'name': '测试报表'}  # 缺少report_type和frequency
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_scheduled_report_invalid_type(self):
        """测试创建定时报表无效类型"""
        url = reverse('data_analytics:scheduled-reports')
        data = {
            'name': '测试报表',
            'report_type': 'invalid_type',
            'frequency': 'daily'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_scheduled_report_invalid_frequency(self):
        """测试创建定时报表无效频率"""
        url = reverse('data_analytics:scheduled-reports')
        data = {
            'name': '测试报表',
            'report_type': 'plan',
            'frequency': 'invalid_frequency'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ScheduledReportDetailViewTest(AnalyticsAPITestCase):
    """定时报表详情管理接口测试"""
    
    def setUp(self):
        super().setUp()
        from ..models import ScheduledReport
        
        # 创建测试定时报表
        self.scheduled_report = ScheduledReport.objects.create(
            name='测试定时报表',
            report_type='plan',
            frequency='daily',
            created_by=self.user
        )
    
    def test_update_scheduled_report_success(self):
        """测试成功更新定时报表"""
        url = reverse('data_analytics:scheduled-report-detail', kwargs={'report_id': self.scheduled_report.id})
        data = {
            'name': '更新后的报表名称',
            'frequency': 'weekly',
            'is_active': False
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        
        # 验证更新
        self.scheduled_report.refresh_from_db()
        self.assertEqual(self.scheduled_report.name, '更新后的报表名称')
        self.assertEqual(self.scheduled_report.frequency, 'weekly')
        self.assertFalse(self.scheduled_report.is_active)
    
    def test_update_scheduled_report_not_found(self):
        """测试更新不存在的定时报表"""
        url = reverse('data_analytics:scheduled-report-detail', kwargs={'report_id': 99999})
        data = {'name': '更新名称'}
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_scheduled_report_success(self):
        """测试成功删除定时报表"""
        url = reverse('data_analytics:scheduled-report-detail', kwargs={'report_id': self.scheduled_report.id})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        
        # 验证删除
        from ..models import ScheduledReport
        self.assertFalse(ScheduledReport.objects.filter(id=self.scheduled_report.id).exists())
    
    def test_delete_scheduled_report_not_found(self):
        """测试删除不存在的定时报表"""
        url = reverse('data_analytics:scheduled-report-detail', kwargs={'report_id': 99999})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DataUpdateStatusViewTest(AnalyticsAPITestCase):
    """数据更新状态接口测试"""
    
    def test_get_update_status_success(self):
        """测试成功获取更新状态"""
        url = reverse('data_analytics:data-update-status')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('modules', response.data['data'])
        self.assertIn('overall_status', response.data['data'])
        self.assertIn('checked_at', response.data['data'])
    
    def test_update_status_structure(self):
        """测试更新状态数据结构"""
        url = reverse('data_analytics:data-update-status')
        
        response = self.client.get(url)
        
        modules = response.data['data']['modules']
        self.assertIn('dashboard', modules)
        self.assertIn('store_map', modules)
        self.assertIn('follow_up_funnel', modules)
        self.assertIn('plan_progress', modules)
        
        # 检查每个模块的状态结构
        for module_name, module_data in modules.items():
            self.assertIn('last_updated', module_data)
            self.assertIn('next_update', module_data)
            self.assertIn('is_expired', module_data)
            self.assertIn('status', module_data)