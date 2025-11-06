"""
数据分析API集成测试
测试报表数据API、统计数据API、经营大屏数据API和数据导出API
"""
import json
from datetime import datetime, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from data_analytics.models import (
    AnalyticsCache, ReportTask, ExternalSalesData, 
    DataSyncLog, ScheduledReport
)
from system_management.models import Department, Role
from base_data.models import BusinessRegion

User = get_user_model()


class DataAnalyticsAPITestCase(TestCase):
    """数据分析API测试基类"""
    
    def setUp(self):
        """设置测试数据"""
        self.client = APIClient()
        
        # 创建测试部门
        self.department = Department.objects.create(
            name='测试部门',
            wechat_dept_id=1001
        )
        
        # 创建测试角色
        self.role = Role.objects.create(
            name='测试角色',
            description='测试角色'
        )
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            phone='13800000001',
            department=self.department
        )
        self.user.roles.add(self.role)
        
        # 创建管理员用户
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            phone='13800000002',
            department=self.department
        )
        
        # 创建测试区域
        self.region = BusinessRegion.objects.create(
            name='测试区域',
            code='TEST_REGION'
        )
        
        # 认证客户端
        self.client.force_authenticate(user=self.user)


class DashboardDataAPITest(DataAnalyticsAPITestCase):
    """经营大屏数据API测试"""
    
    def test_get_dashboard_data_success(self):
        """测试成功获取经营大屏数据"""
        url = reverse('data_analytics:dashboard-data')
        
        with patch('data_analytics.views.DataAggregationService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.get_dashboard_data.return_value = {
                'store_map': {'stores': [], 'statistics': {}},
                'follow_up_funnel': {'stages': {}, 'conversion_rates': []},
                'plan_progress': {'plans': []},
                'key_metrics': {'total_stores': 0},
                'last_updated': timezone.now().isoformat()
            }
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('store_map', response.data['data'])
        self.assertIn('follow_up_funnel', response.data['data'])
        self.assertIn('plan_progress', response.data['data'])
        self.assertIn('key_metrics', response.data['data'])
    
    def test_get_dashboard_data_unauthorized(self):
        """测试未认证用户访问"""
        self.client.force_authenticate(user=None)
        url = reverse('data_analytics:dashboard-data')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class StoreMapDataAPITest(DataAnalyticsAPITestCase):
    """开店地图数据API测试"""
    
    def test_get_store_map_data_success(self):
        """测试成功获取开店地图数据"""
        url = reverse('data_analytics:store-map-data')
        
        with patch('data_analytics.views.DataAggregationService') as mock_service, \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_instance = mock_service.return_value
            mock_instance.get_store_map_data.return_value = {
                'stores': [],
                'region_statistics': [],
                'status_statistics': {},
                'total_count': 0,
                'last_updated': timezone.now().isoformat()
            }
            
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_perm_instance.can_access_region.return_value = True
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('stores', response.data['data'])
        self.assertIn('region_statistics', response.data['data'])
        self.assertIn('status_statistics', response.data['data'])
    
    def test_get_store_map_data_with_filters(self):
        """测试带筛选条件获取地图数据"""
        url = reverse('data_analytics:store-map-data')
        params = {
            'region': str(self.region.id),
            'time_range': '2024-01-01,2024-12-31'
        }
        
        with patch('data_analytics.views.DataAggregationService') as mock_service, \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_instance = mock_service.return_value
            mock_instance.get_store_map_data.return_value = {
                'stores': [],
                'region_statistics': [],
                'status_statistics': {},
                'total_count': 0
            }
            
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_perm_instance.can_access_region.return_value = True
            
            response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_store_map_data_invalid_time_range(self):
        """测试无效时间范围格式"""
        url = reverse('data_analytics:store-map-data')
        params = {'time_range': 'invalid-format'}
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 400)
    
    def test_get_store_map_data_permission_denied(self):
        """测试权限不足"""
        url = reverse('data_analytics:store-map-data')
        params = {'region': str(self.region.id)}
        
        with patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_perm_instance.can_access_region.return_value = False
            
            response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['code'], 403)


class FollowUpFunnelDataAPITest(DataAnalyticsAPITestCase):
    """跟进漏斗数据API测试"""
    
    def test_get_funnel_data_success(self):
        """测试成功获取跟进漏斗数据"""
        url = reverse('data_analytics:follow-up-funnel-data')
        
        with patch('data_analytics.views.DataAggregationService') as mock_service, \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_instance = mock_service.return_value
            mock_instance.get_follow_up_funnel_data.return_value = {
                'stages': {
                    'investigating': {'name': '调研中', 'count': 100},
                    'calculating': {'name': '测算中', 'count': 80}
                },
                'conversion_rates': [],
                'total_count': 180,
                'warning_stages': []
            }
            
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.can_access_region.return_value = True
            
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
            'region': str(self.region.id)
        }
        
        with patch('data_analytics.views.DataAggregationService') as mock_service, \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_instance = mock_service.return_value
            mock_instance.get_follow_up_funnel_data.return_value = {
                'stages': {},
                'conversion_rates': [],
                'total_count': 0,
                'warning_stages': []
            }
            
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.can_access_region.return_value = True
            
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


class PlanProgressDataAPITest(DataAnalyticsAPITestCase):
    """计划完成进度数据API测试"""
    
    def test_get_plan_progress_data_success(self):
        """测试成功获取计划进度数据"""
        url = reverse('data_analytics:plan-progress-data')
        
        with patch('data_analytics.views.DataAggregationService') as mock_service, \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_instance = mock_service.return_value
            mock_instance.get_plan_progress_data.return_value = {
                'plans': [{
                    'plan_id': 1,
                    'plan_name': '2024年开店计划',
                    'total_target_count': 100,
                    'total_completed_count': 45,
                    'completion_rate': 45.0
                }],
                'overall_statistics': {
                    'total_plans': 1,
                    'overall_completion_rate': 45.0
                }
            }
            
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_perm_instance.can_access_data_type.return_value = True
            
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
        
        with patch('data_analytics.views.DataAggregationService') as mock_service, \
             patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_instance = mock_service.return_value
            mock_instance.get_plan_progress_data.return_value = {
                'plans': [],
                'overall_statistics': {}
            }
            
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.get_user_permissions.return_value = {'user_id': self.user.id}
            mock_perm_instance.can_access_data_type.return_value = True
            
            response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_plan_progress_data_invalid_contribution_rate_type(self):
        """测试无效贡献率类型"""
        url = reverse('data_analytics:plan-progress-data')
        params = {'contribution_rate_type': 'invalid'}
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReportGenerationAPITest(DataAnalyticsAPITestCase):
    """报表生成API测试"""
    
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
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.can_generate_report.return_value = True
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('task_id', response.data['data'])
        self.assertIn('estimated_time', response.data['data'])
        mock_task.assert_called_once()
        
        # 验证数据库中创建了报表任务
        self.assertTrue(ReportTask.objects.filter(created_by=self.user).exists())
    
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
    
    def test_generate_report_invalid_format(self):
        """测试无效导出格式"""
        url = reverse('data_analytics:generate-report')
        data = {
            'report_type': 'plan',
            'format': 'invalid_format'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_generate_report_permission_denied(self):
        """测试权限不足"""
        url = reverse('data_analytics:generate-report')
        data = {'report_type': 'plan'}
        
        with patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.can_generate_report.return_value = False
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)



class ReportStatusAPITest(DataAnalyticsAPITestCase):
    """报表状态查询API测试"""
    
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
    
    def test_get_failed_report_status(self):
        """测试失败报表的状态"""
        self.report_task.status = 'failed'
        self.report_task.error_message = '生成失败：数据不足'
        self.report_task.save()
        
        url = reverse('data_analytics:report-status', kwargs={'task_id': self.report_task.task_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['status'], 'failed')
        self.assertIn('error_message', response.data['data'])



class DownloadReportAPITest(DataAnalyticsAPITestCase):
    """报表下载API测试"""
    
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
    
    def test_download_report_not_completed(self):
        """测试下载未完成的报表"""
        self.report_task.status = 'processing'
        self.report_task.save()
        
        url = reverse('data_analytics:download-report', kwargs={'task_id': self.report_task.task_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ScheduledReportAPITest(DataAnalyticsAPITestCase):
    """定时报表管理API测试"""
    
    def test_get_scheduled_reports_success(self):
        """测试成功获取定时报表列表"""
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
        
        # 验证数据库中创建了定时报表
        self.assertTrue(ScheduledReport.objects.filter(name='每日开店计划报表').exists())
    
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


class ScheduledReportDetailAPITest(DataAnalyticsAPITestCase):
    """定时报表详情管理API测试"""
    
    def setUp(self):
        super().setUp()
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
        self.assertFalse(ScheduledReport.objects.filter(id=self.scheduled_report.id).exists())
    
    def test_delete_scheduled_report_not_found(self):
        """测试删除不存在的定时报表"""
        url = reverse('data_analytics:scheduled-report-detail', kwargs={'report_id': 99999})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DataSyncStatusAPITest(DataAnalyticsAPITestCase):
    """数据同步状态API测试"""
    
    def setUp(self):
        super().setUp()
        # 创建测试同步日志
        DataSyncLog.objects.create(
            sync_type='sales_data',
            status='success',
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now(),
            records_processed=100,
            records_success=95,
            records_failed=5,
            created_by=self.user
        )
    
    def test_get_sync_status_success(self):
        """测试成功获取同步状态"""
        url = reverse('data_analytics:data-sync-status')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('latest_sync', response.data['data'])
        self.assertIn('sync_statistics', response.data['data'])
        self.assertIn('system_status', response.data['data'])
    
    def test_get_sync_status_with_filters(self):
        """测试带筛选条件获取同步状态"""
        url = reverse('data_analytics:data-sync-status')
        params = {
            'sync_type': 'sales_data',
            'hours': '12'
        }
        
        response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('sync_statistics', response.data['data'])


class DataUpdateStatusAPITest(DataAnalyticsAPITestCase):
    """数据更新状态API测试"""
    
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
            self.assertIn('is_expired', module_data)
            self.assertIn('status', module_data)


class RefreshCacheAPITest(DataAnalyticsAPITestCase):
    """缓存刷新API测试"""
    
    def test_refresh_cache_success(self):
        """测试成功刷新缓存"""
        url = reverse('data_analytics:refresh-cache')
        data = {'cache_type': 'dashboard'}
        
        with patch('data_analytics.views.DataAggregationService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.refresh_cache.return_value = None
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        mock_instance.refresh_cache.assert_called_once_with('dashboard')
    
    def test_refresh_all_cache(self):
        """测试刷新全部缓存"""
        url = reverse('data_analytics:refresh-cache')
        
        with patch('data_analytics.views.DataAggregationService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.refresh_cache.return_value = None
            
            response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_instance.refresh_cache.assert_called_once_with(None)
    
    def test_refresh_cache_invalid_type(self):
        """测试无效缓存类型"""
        url = reverse('data_analytics:refresh-cache')
        data = {'cache_type': 'invalid_type'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ExternalSalesDataAPITest(DataAnalyticsAPITestCase):
    """外部销售数据接入API测试"""
    
    def test_post_sales_data_permission_denied(self):
        """测试权限不足"""
        url = reverse('data_analytics:external-sales-data')
        data = {
            'store_id': '1',
            'data_date': '2024-01-01',
            'daily_revenue': 10000.00
        }
        
        with patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission:
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.can_access_external_data_api.return_value = False
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_post_sales_data_invalid_data(self):
        """测试无效数据"""
        url = reverse('data_analytics:external-sales-data')
        data = {
            'store_id': '1',
            'data_date': 'invalid-date',
            'daily_revenue': 'invalid'
        }
        
        with patch('data_analytics.views.AnalyticsPermissionManager') as mock_permission, \
             patch('data_analytics.views.ExternalDataValidationService') as mock_validation:
            mock_perm_instance = mock_permission.return_value
            mock_perm_instance.can_access_external_data_api.return_value = True
            
            mock_validation_instance = mock_validation.return_value
            mock_validation_instance.validate_sales_data.return_value = {
                'is_valid': False,
                'errors': ['日期格式错误', '营业额格式错误']
            }
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data['data'])



class SystemMonitoringAPITest(DataAnalyticsAPITestCase):
    """系统监控API测试"""
    
    def test_get_system_health_unauthorized(self):
        """测试非管理员访问系统健康状态"""
        url = reverse('data_analytics:system-health')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['code'], 403)
    
    def test_get_system_health_success(self):
        """测试管理员成功获取系统健康状态"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:system-health')
        
        with patch('data_analytics.views.SystemMonitoringService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.get_system_health_status.return_value = {
                'overall_status': 'healthy',
                'components': {
                    'database': {'status': 'healthy'},
                    'cache': {'status': 'healthy'}
                },
                'metrics': {},
                'alerts': [],
                'timestamp': timezone.now().isoformat()
            }
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('overall_status', response.data['data'])
        self.assertIn('components', response.data['data'])
    
    def test_get_system_health_specific_component(self):
        """测试获取特定组件的健康状态"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:system-health')
        params = {'component': 'database'}
        
        with patch('data_analytics.views.SystemMonitoringService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.get_system_health_status.return_value = {
                'components': {
                    'database': {'status': 'healthy', 'response_time': 10}
                },
                'timestamp': timezone.now().isoformat()
            }
            
            response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('component', response.data['data'])
        self.assertEqual(response.data['data']['component'], 'database')
    
    def test_get_system_metrics_unauthorized(self):
        """测试非管理员访问系统性能指标"""
        url = reverse('data_analytics:system-metrics')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_system_metrics_success(self):
        """测试管理员成功获取系统性能指标"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:system-metrics')
        
        with patch('data_analytics.views.SystemMonitoringService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.get_system_health_status.return_value = {
                'metrics': {
                    'database': {'query_count': 1000, 'avg_response_time': 15},
                    'cache': {'hit_rate': 85.5},
                    'api': {'request_count': 5000}
                },
                'timestamp': timezone.now().isoformat()
            }
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('metrics', response.data['data'])
    
    def test_get_system_alerts_unauthorized(self):
        """测试非管理员访问系统告警"""
        url = reverse('data_analytics:system-alerts')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_system_alerts_success(self):
        """测试管理员成功获取系统告警"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:system-alerts')
        
        with patch('data_analytics.views.SystemMonitoringService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.get_system_health_status.return_value = {
                'alerts': [
                    {'type': 'database', 'level': 'warning', 'message': '慢查询增多'}
                ],
                'timestamp': timezone.now().isoformat()
            }
            
            response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('current_alerts', response.data['data'])
        self.assertIn('statistics', response.data['data'])
    
    def test_post_system_alert_unauthorized(self):
        """测试非管理员发送告警通知"""
        url = reverse('data_analytics:system-alerts')
        data = {
            'alert_type': 'test',
            'level': 'warning',
            'message': '测试告警'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_post_system_alert_success(self):
        """测试管理员成功发送告警通知"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:system-alerts')
        data = {
            'alert_type': 'test',
            'level': 'warning',
            'message': '测试告警'
        }
        
        with patch('data_analytics.views.SystemMonitoringService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.send_alert_notification.return_value = True
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('alert', response.data['data'])
        self.assertTrue(response.data['data']['sent'])
    
    def test_post_system_alert_missing_params(self):
        """测试发送告警缺少必需参数"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:system-alerts')
        data = {'alert_type': 'test'}  # 缺少level和message
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_performance_optimization_unauthorized(self):
        """测试非管理员执行性能优化"""
        url = reverse('data_analytics:performance-optimization')
        data = {'optimization_type': 'all'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_performance_optimization_success(self):
        """测试管理员成功执行性能优化"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:performance-optimization')
        data = {'optimization_type': 'cache', 'dry_run': False}
        
        with patch('data_analytics.views.PerformanceOptimizationService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.optimize_cache_strategy.return_value = {
                'cleared_entries': 100,
                'preheated_entries': 50
            }
            
            response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 0)
        self.assertIn('optimization_results', response.data['data'])
    
    def test_performance_optimization_dry_run(self):
        """测试性能优化分析模式"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('data_analytics:performance-optimization')
        data = {'optimization_type': 'all', 'dry_run': True}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['dry_run'])
        self.assertIn('analysis', response.data['data']['optimization_results'])
