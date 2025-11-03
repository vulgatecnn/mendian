"""
审计日志记录测试
测试开店计划管理模块的审计日志功能
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from unittest.mock import Mock, patch

from store_planning.models import StorePlan, BusinessRegion, StoreType, PlanApproval
from system_management.models import AuditLog
from system_management.services.audit_service import AuditLogger


User = get_user_model()


class AuditLoggingTestCase(TestCase):
    """审计日志记录测试用例"""
    
    def setUp(self):
        """测试前准备"""
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        # 创建API客户端
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # 创建测试数据
        self.region = BusinessRegion.objects.create(
            name='测试区域',
            code='TEST',
            is_active=True
        )
        
        self.store_type = StoreType.objects.create(
            name='测试门店类型',
            code='TEST',
            is_active=True
        )
        
        # 创建模拟请求对象
        self.mock_request = Mock()
        self.mock_request.user = self.user
        self.mock_request.META = {
            'REMOTE_ADDR': '127.0.0.1',
            'HTTP_X_FORWARDED_FOR': None
        }
    
    def test_plan_create_audit_log(self):
        """测试计划创建时记录审计日志"""
        # 创建计划
        plan_data = {
            'name': '2024年测试计划',
            'plan_type': 'annual',
            'start_date': '2024-01-01',
            'end_date': '2024-12-31',
            'description': '测试计划描述',
            'regional_plans': [
                {
                    'region_id': self.region.id,
                    'store_type_id': self.store_type.id,
                    'target_count': 10,
                    'contribution_rate': 50.0,
                    'budget_amount': 1000000
                }
            ]
        }
        
        initial_log_count = AuditLog.objects.count()
        
        response = self.client.post('/api/store-planning/plans/', plan_data, format='json')
        
        # 验证响应
        self.assertEqual(response.status_code, 201)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.action, AuditLogger.ACTION_CREATE)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_STORE_PLAN)
        self.assertIn('plan_name', audit_log.details)
        self.assertEqual(audit_log.details['plan_name'], '2024年测试计划')
    
    def test_plan_update_audit_log(self):
        """测试计划更新时记录审计日志"""
        # 创建计划
        plan = StorePlan.objects.create(
            name='原始计划名称',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='draft',
            created_by=self.user
        )
        
        initial_log_count = AuditLog.objects.count()
        
        # 更新计划
        update_data = {
            'name': '更新后的计划名称',
            'description': '更新后的描述'
        }
        
        response = self.client.patch(
            f'/api/store-planning/plans/{plan.id}/',
            update_data,
            format='json'
        )
        
        # 验证响应
        self.assertEqual(response.status_code, 200)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.action, AuditLogger.ACTION_UPDATE)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_STORE_PLAN)
        self.assertIn('old_data', audit_log.details)
        self.assertIn('new_data', audit_log.details)
        self.assertEqual(audit_log.details['old_data']['plan_name'], '原始计划名称')
        self.assertEqual(audit_log.details['new_data']['plan_name'], '更新后的计划名称')
    
    def test_plan_publish_audit_log(self):
        """测试计划发布时记录审计日志"""
        # 创建计划
        plan = StorePlan.objects.create(
            name='待发布计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='draft',
            created_by=self.user,
            total_target_count=10
        )
        
        initial_log_count = AuditLog.objects.count()
        
        # 发布计划
        response = self.client.post(f'/api/store-planning/plans/{plan.id}/publish/')
        
        # 验证响应
        self.assertEqual(response.status_code, 200)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.action, AuditLogger.ACTION_PUBLISH)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_STORE_PLAN)
        self.assertIn('old_status', audit_log.details)
        self.assertIn('new_status', audit_log.details)
        self.assertEqual(audit_log.details['old_status'], 'draft')
        self.assertEqual(audit_log.details['new_status'], 'published')
    
    def test_plan_cancel_audit_log(self):
        """测试计划取消时记录审计日志"""
        # 创建计划
        plan = StorePlan.objects.create(
            name='待取消计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='published',
            created_by=self.user
        )
        
        initial_log_count = AuditLog.objects.count()
        
        # 取消计划
        cancel_data = {
            'cancel_reason': '测试取消原因'
        }
        
        response = self.client.post(
            f'/api/store-planning/plans/{plan.id}/cancel/',
            cancel_data,
            format='json'
        )
        
        # 验证响应
        self.assertEqual(response.status_code, 200)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.action, AuditLogger.ACTION_CANCEL)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_STORE_PLAN)
        self.assertIn('cancel_reason', audit_log.details)
        self.assertEqual(audit_log.details['cancel_reason'], '测试取消原因')
    
    def test_plan_delete_audit_log(self):
        """测试计划删除时记录审计日志"""
        # 创建计划
        plan = StorePlan.objects.create(
            name='待删除计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='draft',
            created_by=self.user
        )
        
        plan_id = plan.id
        initial_log_count = AuditLog.objects.count()
        
        # 删除计划
        response = self.client.delete(f'/api/store-planning/plans/{plan_id}/')
        
        # 验证响应
        self.assertEqual(response.status_code, 204)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.action, AuditLogger.ACTION_DELETE)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_STORE_PLAN)
        self.assertEqual(audit_log.target_id, plan_id)
        self.assertIn('plan_name', audit_log.details)
        self.assertEqual(audit_log.details['plan_name'], '待删除计划')
    
    def test_approval_submit_audit_log(self):
        """测试提交审批时记录审计日志"""
        # 创建计划
        plan = StorePlan.objects.create(
            name='待审批计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='draft',
            created_by=self.user
        )
        
        initial_log_count = AuditLog.objects.count()
        
        # 提交审批
        approval_data = {
            'approval_type': 'plan_publish'
        }
        
        response = self.client.post(
            f'/api/store-planning/plans/{plan.id}/submit_for_approval/',
            approval_data,
            format='json'
        )
        
        # 验证响应
        self.assertEqual(response.status_code, 200)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.action, AuditLogger.ACTION_SUBMIT)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_PLAN_APPROVAL)
        self.assertIn('plan_name', audit_log.details)
        self.assertIn('approval_type', audit_log.details)
    
    def test_region_create_audit_log(self):
        """测试创建经营区域时记录审计日志"""
        initial_log_count = AuditLog.objects.count()
        
        # 创建区域
        region_data = {
            'name': '新测试区域',
            'code': 'NEW',
            'description': '新区域描述',
            'is_active': True
        }
        
        response = self.client.post(
            '/api/store-planning/regions/',
            region_data,
            format='json'
        )
        
        # 验证响应
        self.assertEqual(response.status_code, 201)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.action, AuditLogger.ACTION_CREATE)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_BUSINESS_REGION)
        self.assertIn('region_name', audit_log.details)
        self.assertEqual(audit_log.details['region_name'], '新测试区域')
    
    def test_store_type_update_audit_log(self):
        """测试更新门店类型时记录审计日志"""
        initial_log_count = AuditLog.objects.count()
        
        # 更新门店类型
        update_data = {
            'name': '更新后的门店类型',
            'description': '更新后的描述'
        }
        
        response = self.client.patch(
            f'/api/store-planning/store-types/{self.store_type.id}/',
            update_data,
            format='json'
        )
        
        # 验证响应
        self.assertEqual(response.status_code, 200)
        
        # 验证审计日志已创建
        self.assertEqual(AuditLog.objects.count(), initial_log_count + 1)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.action, AuditLogger.ACTION_UPDATE)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_STORE_TYPE)
        self.assertIn('old_data', audit_log.details)
        self.assertIn('new_data', audit_log.details)
    
    def test_audit_log_includes_ip_address(self):
        """测试审计日志包含IP地址"""
        # 创建区域
        region_data = {
            'name': 'IP测试区域',
            'code': 'IPTEST',
            'is_active': True
        }
        
        response = self.client.post(
            '/api/store-planning/regions/',
            region_data,
            format='json'
        )
        
        # 验证审计日志包含IP地址
        audit_log = AuditLog.objects.latest('created_at')
        self.assertIsNotNone(audit_log.ip_address)
        self.assertTrue(len(audit_log.ip_address) > 0)
    
    def test_audit_log_includes_user_info(self):
        """测试审计日志包含用户信息"""
        # 创建区域
        region_data = {
            'name': '用户测试区域',
            'code': 'USERTEST',
            'is_active': True
        }
        
        response = self.client.post(
            '/api/store-planning/regions/',
            region_data,
            format='json'
        )
        
        # 验证审计日志包含用户信息
        audit_log = AuditLog.objects.latest('created_at')
        self.assertEqual(audit_log.user, self.user)
        self.assertEqual(audit_log.user.username, 'testuser')
    
    @patch('store_planning.import_export_service.PlanImportExportService.import_plans_from_excel')
    def test_import_audit_log(self, mock_import):
        """测试数据导入时记录审计日志"""
        # 模拟导入结果
        mock_import.return_value = {
            'success': True,
            'total_rows': 10,
            'success_count': 8,
            'error_count': 2,
            'created_plans': [1, 2, 3],
            'errors': []
        }
        
        initial_log_count = AuditLog.objects.count()
        
        # 创建模拟文件
        from io import BytesIO
        file_content = BytesIO(b'test file content')
        file_content.name = 'test_import.xlsx'
        
        # 执行导入
        response = self.client.post(
            '/api/store-planning/import-export/import_excel/',
            {'file': file_content},
            format='multipart'
        )
        
        # 验证审计日志已创建
        self.assertGreater(AuditLog.objects.count(), initial_log_count)
        
        # 验证审计日志内容
        audit_log = AuditLog.objects.filter(
            action=AuditLogger.ACTION_IMPORT,
            target_type=AuditLogger.TARGET_STORE_PLAN
        ).latest('created_at')
        
        self.assertIn('file_name', audit_log.details)
        self.assertIn('success', audit_log.details)


class AuditLoggerServiceTestCase(TestCase):
    """审计日志服务测试用例"""
    
    def setUp(self):
        """测试前准备"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        self.mock_request = Mock()
        self.mock_request.user = self.user
        self.mock_request.META = {
            'REMOTE_ADDR': '192.168.1.100',
            'HTTP_X_FORWARDED_FOR': None
        }
    
    def test_get_client_ip_from_remote_addr(self):
        """测试从REMOTE_ADDR获取IP地址"""
        ip = AuditLogger.get_client_ip(self.mock_request)
        self.assertEqual(ip, '192.168.1.100')
    
    def test_get_client_ip_from_x_forwarded_for(self):
        """测试从X-Forwarded-For获取IP地址"""
        self.mock_request.META['HTTP_X_FORWARDED_FOR'] = '10.0.0.1, 192.168.1.100'
        ip = AuditLogger.get_client_ip(self.mock_request)
        self.assertEqual(ip, '10.0.0.1')
    
    def test_log_store_plan_create(self):
        """测试记录计划创建日志"""
        details = {
            'plan_name': '测试计划',
            'plan_type': 'annual'
        }
        
        audit_log = AuditLogger.log_store_plan_create(
            request=self.mock_request,
            plan_id=1,
            details=details
        )
        
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.action, AuditLogger.ACTION_CREATE)
        self.assertEqual(audit_log.target_type, AuditLogger.TARGET_STORE_PLAN)
        self.assertEqual(audit_log.target_id, 1)
        self.assertEqual(audit_log.details['plan_name'], '测试计划')
    
    def test_log_with_custom_user(self):
        """测试使用自定义用户记录日志"""
        custom_user = User.objects.create_user(
            username='customuser',
            password='testpass123'
        )
        
        audit_log = AuditLogger.log(
            request=self.mock_request,
            action=AuditLogger.ACTION_CREATE,
            target_type=AuditLogger.TARGET_STORE_PLAN,
            target_id=1,
            details={},
            user=custom_user
        )
        
        self.assertEqual(audit_log.user, custom_user)
        self.assertNotEqual(audit_log.user, self.mock_request.user)
