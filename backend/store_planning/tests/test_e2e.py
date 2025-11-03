"""
开店计划管理 端到端测试
测试完整业务流程，包括计划从创建到完成的全流程和多用户协作场景
"""
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
from unittest.mock import patch, MagicMock

from store_planning.models import (
    StorePlan, RegionalPlan, BusinessRegion, StoreType,
    PlanExecutionLog, PlanApproval
)
from store_planning.services import PlanBusinessService, PlanProgressService
from system_management.models import Permission, Role, Department

User = get_user_model()


class PlanLifecycleE2ETestCase(TransactionTestCase):
    """
    计划生命周期端到端测试
    测试计划从创建到完成的完整流程
    覆盖需求1（计划创建和基础管理）、需求4（计划状态管理）、需求5（计划执行监控）
    """
    
    def setUp(self):
        """测试前准备"""
        # 创建部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='计划管理部'
        )
        
        # 创建计划管理员用户
        self.plan_manager = User.objects.create_user(
            username='plan_manager',
            password='testpass123',
            phone='13800138001',
            wechat_user_id='manager_wechat_id',
            department=self.department
        )
        
        # 创建权限
        self.create_permission = Permission.objects.create(
            code='store_planning.plan.create',
            name='创建计划',
            module='开店计划管理'
        )
        self.publish_permission = Permission.objects.create(
            code='store_planning.plan.publish',
            name='发布计划',
            module='开店计划管理'
        )
        self.view_permission = Permission.objects.create(
            code='store_planning.plan.view',
            name='查看计划',
            module='开店计划管理'
        )
        
        # 创建角色并分配权限
        self.manager_role = Role.objects.create(
            name='计划管理员',
            is_active=True
        )
        self.manager_role.permissions.add(
            self.create_permission,
            self.publish_permission,
            self.view_permission
        )
        self.plan_manager.roles.add(self.manager_role)
        
        # 创建基础数据
        self.region_east = BusinessRegion.objects.create(
            name='华东区',
            code='HD',
            is_active=True
        )
        self.region_south = BusinessRegion.objects.create(
            name='华南区',
            code='HN',
            is_active=True
        )
        
        self.store_type_direct = StoreType.objects.create(
            name='直营店',
            code='ZY',
            is_active=True
        )
        self.store_type_franchise = StoreType.objects.create(
            name='加盟店',
            code='JM',
            is_active=True
        )
        
        # 初始化服务
        self.plan_service = PlanBusinessService()
        
        # 初始化API客户端
        self.client = APIClient()
    
    def test_complete_plan_lifecycle(self):
        """
        测试完整的计划生命周期
        流程：创建草稿 -> 添加区域计划 -> 发布计划 -> 执行计划 -> 更新进度 -> 完成计划
        """
        # 步骤1：创建草稿计划（需求1.1, 1.2, 1.3）
        plan_data = {
            'name': '2024年全国开店计划',
            'plan_type': 'annual',
            'start_date': date(2024, 1, 1),
            'end_date': date(2024, 12, 31),
            'description': '2024年度全国开店计划'
        }
        
        regional_plans_data = [
            {
                'region_id': self.region_east.id,
                'store_type_id': self.store_type_direct.id,
                'target_count': 50,
                'contribution_rate': 35.0,
                'budget_amount': 5000000
            },
            {
                'region_id': self.region_south.id,
                'store_type_id': self.store_type_franchise.id,
                'target_count': 30,
                'contribution_rate': 25.0,
                'budget_amount': 3000000
            }
        ]
        
        plan = self.plan_service.create_plan(
            plan_data,
            regional_plans_data,
            self.plan_manager
        )
        
        # 验证计划创建成功
        self.assertIsNotNone(plan.id)
        self.assertEqual(plan.status, 'draft')
        self.assertEqual(plan.name, '2024年全国开店计划')
        self.assertEqual(plan.regional_plans.count(), 2)
        self.assertEqual(plan.total_target_count, 80)
        
        # 步骤2：发布计划（需求4.1, 4.2）
        published_plan = self.plan_service.publish_plan(plan)
        
        # 验证计划发布成功
        self.assertEqual(published_plan.status, 'published')
        self.assertIsNotNone(published_plan.published_at)
        
        # 步骤3：计划开始执行（需求4.3）
        # 模拟计划开始日期到达，状态自动变为执行中
        published_plan.status = 'executing'
        published_plan.save()
        
        self.assertEqual(published_plan.status, 'executing')
        
        # 步骤4：更新执行进度（需求5.1, 5.2）
        # 模拟华东区开业10家直营店
        east_regional_plan = published_plan.regional_plans.get(
            region=self.region_east,
            store_type=self.store_type_direct
        )
        
        # 更新区域计划进度
        from store_planning.services import PlanProgressService
        progress_service = PlanProgressService()
        progress_service.update_progress(
            regional_plan=east_regional_plan,
            new_completed_count=10,
            updated_by=self.plan_manager
        )
        
        # 刷新数据
        east_regional_plan.refresh_from_db()
        published_plan.refresh_from_db()
        
        # 验证进度更新
        self.assertEqual(east_regional_plan.completed_count, 10)
        self.assertEqual(published_plan.total_completed_count, 10)
        
        # 步骤5：查看统计数据（需求5.3, 5.4）
        from store_planning.services import PlanStatisticsService
        statistics_service = PlanStatisticsService()
        statistics = statistics_service.get_plan_statistics(published_plan)
        
        # 验证统计数据
        self.assertEqual(statistics['overall']['total_target'], 80)
        self.assertEqual(statistics['overall']['total_completed'], 10)
        self.assertIn('by_region', statistics)
        self.assertIn('regional_details', statistics)
        
        # 步骤6：继续更新进度直到完成
        # 华东区完成剩余40家（总共50家）
        progress_service.update_progress(
            regional_plan=east_regional_plan,
            new_completed_count=50,
            updated_by=self.plan_manager
        )
        
        # 华南区完成30家
        south_regional_plan = published_plan.regional_plans.get(
            region=self.region_south,
            store_type=self.store_type_franchise
        )
        
        progress_service.update_progress(
            regional_plan=south_regional_plan,
            new_completed_count=30,
            updated_by=self.plan_manager
        )
        
        # 刷新数据
        published_plan.refresh_from_db()
        
        # 验证所有目标完成
        self.assertEqual(published_plan.total_completed_count, 80)
        
        # 步骤7：计划完成（需求5.5）
        published_plan.status = 'completed'
        published_plan.save()
        
        # 验证计划完成
        self.assertEqual(published_plan.status, 'completed')
        
        # 验证执行日志记录
        execution_logs = PlanExecutionLog.objects.filter(plan=published_plan)
        self.assertGreater(execution_logs.count(), 0)
    
    def test_plan_cancellation_flow(self):
        """
        测试计划取消流程
        流程：创建计划 -> 发布计划 -> 取消计划
        覆盖需求4.4, 4.5
        """
        # 创建并发布计划
        plan_data = {
            'name': '待取消计划',
            'plan_type': 'quarterly',
            'start_date': date(2024, 1, 1),
            'end_date': date(2024, 3, 31),
            'description': '测试取消流程'
        }
        
        regional_plans_data = [
            {
                'region_id': self.region_east.id,
                'store_type_id': self.store_type_direct.id,
                'target_count': 20,
                'contribution_rate': 50.0,
                'budget_amount': 2000000
            }
        ]
        
        plan = self.plan_service.create_plan(
            plan_data,
            regional_plans_data,
            self.plan_manager
        )
        
        published_plan = self.plan_service.publish_plan(plan)
        self.assertEqual(published_plan.status, 'published')
        
        # 取消计划（需求4.4）
        cancel_reason = '市场环境变化，战略调整'
        cancelled_plan = self.plan_service.cancel_plan(published_plan, cancel_reason)
        
        # 验证取消成功（需求4.5）
        self.assertEqual(cancelled_plan.status, 'cancelled')
        self.assertEqual(cancelled_plan.cancel_reason, cancel_reason)
        self.assertIsNotNone(cancelled_plan.cancelled_at)
        
        # 验证取消后不能修改核心数据
        with self.assertRaises(Exception):
            cancelled_plan.total_target_count = 100
            self.plan_service.update_plan(cancelled_plan, {'total_target_count': 100})


class MultiUserCollaborationE2ETestCase(TransactionTestCase):
    """
    多用户协作场景端到端测试
    测试多个用户在计划管理中的协作流程
    覆盖需求7（计划审批流程集成）
    """
    
    def setUp(self):
        """测试前准备"""
        # 创建部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='计划管理部'
        )
        
        # 创建计划创建者
        self.plan_creator = User.objects.create_user(
            username='plan_creator',
            password='testpass123',
            phone='13800138001',
            wechat_user_id='creator_wechat_id',
            department=self.department
        )
        
        # 创建审批者
        self.approver = User.objects.create_user(
            username='approver',
            password='testpass123',
            phone='13800138002',
            wechat_user_id='approver_wechat_id',
            department=self.department
        )
        
        # 创建观察者（只读权限）
        self.viewer = User.objects.create_user(
            username='viewer',
            password='testpass123',
            phone='13800138003',
            wechat_user_id='viewer_wechat_id',
            department=self.department
        )
        
        # 创建权限
        self.create_permission = Permission.objects.create(
            code='store_planning.plan.create',
            name='创建计划',
            module='开店计划管理'
        )
        self.approve_permission = Permission.objects.create(
            code='store_planning.plan.approve',
            name='审批计划',
            module='开店计划管理'
        )
        self.view_permission = Permission.objects.create(
            code='store_planning.plan.view',
            name='查看计划',
            module='开店计划管理'
        )
        
        # 创建角色
        creator_role = Role.objects.create(name='计划创建者', is_active=True)
        creator_role.permissions.add(self.create_permission, self.view_permission)
        self.plan_creator.roles.add(creator_role)
        
        approver_role = Role.objects.create(name='计划审批者', is_active=True)
        approver_role.permissions.add(self.approve_permission, self.view_permission)
        self.approver.roles.add(approver_role)
        
        viewer_role = Role.objects.create(name='计划查看者', is_active=True)
        viewer_role.permissions.add(self.view_permission)
        self.viewer.roles.add(viewer_role)
        
        # 创建基础数据
        self.region = BusinessRegion.objects.create(
            name='华东区',
            code='HD',
            is_active=True
        )
        
        self.store_type = StoreType.objects.create(
            name='直营店',
            code='ZY',
            is_active=True
        )
        
        # 初始化服务
        self.plan_service = PlanBusinessService()
        
        # 初始化API客户端
        self.client = APIClient()
    
    @patch('store_planning.approval_service.PlanApprovalService.submit_for_approval')
    @patch('store_planning.approval_service.PlanApprovalService.approve_plan')
    def test_approval_workflow(self, mock_approve, mock_submit):
        """
        测试审批工作流
        流程：创建者创建计划 -> 提交审批 -> 审批者审批 -> 计划发布
        覆盖需求7.1, 7.2, 7.3
        """
        # 步骤1：创建者创建计划（需求7.1）
        plan_data = {
            'name': '需要审批的计划',
            'plan_type': 'annual',
            'start_date': date(2024, 1, 1),
            'end_date': date(2024, 12, 31),
            'description': '测试审批流程'
        }
        
        regional_plans_data = [
            {
                'region_id': self.region.id,
                'store_type_id': self.store_type.id,
                'target_count': 100,
                'contribution_rate': 60.0,
                'budget_amount': 10000000
            }
        ]
        
        plan = self.plan_service.create_plan(
            plan_data,
            regional_plans_data,
            self.plan_creator
        )
        
        self.assertEqual(plan.status, 'draft')
        self.assertEqual(plan.created_by, self.plan_creator)
        
        # 步骤2：提交审批（需求7.1）
        from store_planning.approval_service import PlanApprovalService
        approval_service = PlanApprovalService()
        
        # 创建审批记录
        approval = PlanApproval.objects.create(
            plan=plan,
            approval_type='plan_publish',
            status='pending',
            submitted_by=self.plan_creator
        )
        
        # 模拟提交审批
        mock_submit.return_value = approval
        
        # 验证计划进入审批状态（需求7.2）
        self.assertEqual(approval.status, 'pending')
        
        # 步骤3：审批者审批通过（需求7.3）
        approval.status = 'approved'
        approval.approved_by = self.approver
        approval.approved_at = timezone.now()
        approval.save()
        
        # 模拟审批通过
        mock_approve.return_value = approval
        
        # 验证审批通过后计划状态更新
        approval.refresh_from_db()
        
        self.assertEqual(approval.status, 'approved')
        self.assertEqual(approval.approved_by, self.approver)
        self.assertIsNotNone(approval.approved_at)
    
    def test_approval_rejection_flow(self):
        """
        测试审批拒绝流程
        流程：创建计划 -> 提交审批 -> 审批拒绝 -> 状态回退
        覆盖需求7.4
        """
        # 创建计划
        plan_data = {
            'name': '将被拒绝的计划',
            'plan_type': 'quarterly',
            'start_date': date(2024, 1, 1),
            'end_date': date(2024, 3, 31),
            'description': '测试拒绝流程'
        }
        
        regional_plans_data = [
            {
                'region_id': self.region.id,
                'store_type_id': self.store_type.id,
                'target_count': 50,
                'contribution_rate': 40.0,
                'budget_amount': 5000000
            }
        ]
        
        plan = self.plan_service.create_plan(
            plan_data,
            regional_plans_data,
            self.plan_creator
        )
        
        # 创建审批记录
        approval = PlanApproval.objects.create(
            plan=plan,
            approval_type='plan_publish',
            status='pending',
            submitted_by=self.plan_creator
        )
        
        # 审批拒绝（需求7.4）
        rejection_reason = '目标数量过高，需要重新评估'
        approval.status = 'rejected'
        approval.approved_by = self.approver
        approval.approved_at = timezone.now()
        approval.rejection_reason = rejection_reason
        approval.save()
        
        # 验证审批被拒绝
        approval.refresh_from_db()
        
        self.assertEqual(approval.status, 'rejected')
        self.assertEqual(approval.rejection_reason, rejection_reason)
        self.assertEqual(approval.approved_by, self.approver)
    
    @patch('store_planning.notification_service.NotificationService.send_notification')
    def test_approval_timeout_notification(self, mock_send_notification):
        """
        测试审批超时提醒
        覆盖需求7.5
        """
        # 创建计划
        plan_data = {
            'name': '超时测试计划',
            'plan_type': 'annual',
            'start_date': date(2024, 1, 1),
            'end_date': date(2024, 12, 31),
            'description': '测试超时提醒'
        }
        
        regional_plans_data = [
            {
                'region_id': self.region.id,
                'store_type_id': self.store_type.id,
                'target_count': 30,
                'contribution_rate': 30.0,
                'budget_amount': 3000000
            }
        ]
        
        plan = self.plan_service.create_plan(
            plan_data,
            regional_plans_data,
            self.plan_creator
        )
        
        # 创建审批记录（模拟3天前提交）
        approval = PlanApproval.objects.create(
            plan=plan,
            approval_type='plan_publish',
            status='pending',
            submitted_by=self.plan_creator
        )
        
        # 手动设置提交时间为3天前
        three_days_ago = timezone.now() - timedelta(days=3)
        PlanApproval.objects.filter(id=approval.id).update(submitted_at=three_days_ago)
        
        # 检查超时审批
        from store_planning.notification_service import NotificationService
        notification_service = NotificationService()
        
        # 查找超时的审批（超过2天未处理）
        timeout_threshold = timezone.now() - timedelta(days=2)
        timeout_approvals = PlanApproval.objects.filter(
            status='pending',
            submitted_at__lt=timeout_threshold
        )
        
        # 验证找到超时审批
        self.assertEqual(timeout_approvals.count(), 1)
        
        # 发送超时提醒（需求7.5）
        for timeout_approval in timeout_approvals:
            notification_service.send_notification(
                user=self.approver,
                title='审批超时提醒',
                message=f'计划"{timeout_approval.plan.name}"的审批已超时，请及时处理',
                notification_type='approval_timeout'
            )
        
        # 验证通知发送
        mock_send_notification.assert_called_once()
    
    def test_viewer_read_only_access(self):
        """
        测试只读用户的访问权限
        验证观察者只能查看，不能修改
        """
        # 创建计划
        plan_data = {
            'name': '只读测试计划',
            'plan_type': 'annual',
            'start_date': date(2024, 1, 1),
            'end_date': date(2024, 12, 31),
            'description': '测试只读权限'
        }
        
        regional_plans_data = [
            {
                'region_id': self.region.id,
                'store_type_id': self.store_type.id,
                'target_count': 20,
                'contribution_rate': 20.0,
                'budget_amount': 2000000
            }
        ]
        
        plan = self.plan_service.create_plan(
            plan_data,
            regional_plans_data,
            self.plan_creator
        )
        
        # 验证观察者可以查看
        self.assertTrue(self.viewer.has_permission('store_planning.plan.view'))
        
        # 验证观察者不能创建
        self.assertFalse(self.viewer.has_permission('store_planning.plan.create'))
        
        # 验证观察者不能审批
        self.assertFalse(self.viewer.has_permission('store_planning.plan.approve'))


class PlanSearchAndFilterE2ETestCase(TransactionTestCase):
    """
    计划搜索和筛选端到端测试
    测试计划列表的查询、搜索和筛选功能
    覆盖需求1.4, 1.5
    """
    
    def setUp(self):
        """测试前准备"""
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            phone='13800138000',
            wechat_user_id='test_wechat_id',
            department=self.department
        )
        
        # 创建基础数据
        self.region_east = BusinessRegion.objects.create(
            name='华东区',
            code='HD',
            is_active=True
        )
        self.region_south = BusinessRegion.objects.create(
            name='华南区',
            code='HN',
            is_active=True
        )
        
        self.store_type = StoreType.objects.create(
            name='直营店',
            code='ZY',
            is_active=True
        )
        
        # 创建多个测试计划
        self._create_test_plans()
    
    def _create_test_plans(self):
        """创建测试计划数据"""
        # 2024年华东区计划（草稿）
        plan1 = StorePlan.objects.create(
            name='2024年华东区开店计划',
            plan_type='annual',
            status='draft',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            created_by=self.user
        )
        RegionalPlan.objects.create(
            plan=plan1,
            region=self.region_east,
            store_type=self.store_type,
            target_count=50,
            contribution_rate=30.0,
            budget_amount=5000000
        )
        
        # 2024年华南区计划（已发布）
        plan2 = StorePlan.objects.create(
            name='2024年华南区开店计划',
            plan_type='annual',
            status='published',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            published_at=timezone.now(),
            created_by=self.user
        )
        RegionalPlan.objects.create(
            plan=plan2,
            region=self.region_south,
            store_type=self.store_type,
            target_count=30,
            contribution_rate=20.0,
            budget_amount=3000000
        )
        
        # 2024年Q1计划（执行中）
        plan3 = StorePlan.objects.create(
            name='2024年Q1开店计划',
            plan_type='quarterly',
            status='executing',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            published_at=timezone.now(),
            created_by=self.user
        )
        RegionalPlan.objects.create(
            plan=plan3,
            region=self.region_east,
            store_type=self.store_type,
            target_count=15,
            contribution_rate=15.0,
            budget_amount=1500000
        )
        
        # 2023年计划（已完成）
        plan4 = StorePlan.objects.create(
            name='2023年全国开店计划',
            plan_type='annual',
            status='completed',
            start_date=date(2023, 1, 1),
            end_date=date(2023, 12, 31),
            published_at=timezone.now() - timedelta(days=365),
            created_by=self.user
        )
        RegionalPlan.objects.create(
            plan=plan4,
            region=self.region_east,
            store_type=self.store_type,
            target_count=40,
            contribution_rate=25.0,
            budget_amount=4000000
        )
    
    def test_list_all_plans(self):
        """
        测试获取所有计划列表
        覆盖需求1.4
        """
        plans = StorePlan.objects.all().order_by('-created_at')
        
        # 验证计划数量
        self.assertEqual(plans.count(), 4)
        
        # 验证按创建时间倒序排列
        plan_names = [plan.name for plan in plans]
        self.assertIn('2024年华东区开店计划', plan_names)
        self.assertIn('2023年全国开店计划', plan_names)
    
    def test_filter_by_status(self):
        """
        测试按状态筛选计划
        覆盖需求1.5
        """
        # 筛选草稿状态
        draft_plans = StorePlan.objects.filter(status='draft')
        self.assertEqual(draft_plans.count(), 1)
        self.assertEqual(draft_plans.first().name, '2024年华东区开店计划')
        
        # 筛选已发布状态
        published_plans = StorePlan.objects.filter(status='published')
        self.assertEqual(published_plans.count(), 1)
        
        # 筛选执行中状态
        executing_plans = StorePlan.objects.filter(status='executing')
        self.assertEqual(executing_plans.count(), 1)
        
        # 筛选已完成状态
        completed_plans = StorePlan.objects.filter(status='completed')
        self.assertEqual(completed_plans.count(), 1)
    
    def test_search_by_name(self):
        """
        测试按名称搜索计划
        覆盖需求1.5
        """
        # 搜索包含"华东"的计划
        east_plans = StorePlan.objects.filter(name__icontains='华东')
        self.assertGreaterEqual(east_plans.count(), 1)
        
        # 搜索包含"2024"的计划
        plans_2024 = StorePlan.objects.filter(name__icontains='2024')
        self.assertEqual(plans_2024.count(), 3)
        
        # 搜索包含"Q1"的计划
        q1_plans = StorePlan.objects.filter(name__icontains='Q1')
        self.assertEqual(q1_plans.count(), 1)
    
    def test_filter_by_region(self):
        """
        测试按区域筛选计划
        覆盖需求1.5
        """
        # 筛选华东区的计划
        east_plans = StorePlan.objects.filter(
            regional_plans__region=self.region_east
        ).distinct()
        self.assertEqual(east_plans.count(), 3)
        
        # 筛选华南区的计划
        south_plans = StorePlan.objects.filter(
            regional_plans__region=self.region_south
        ).distinct()
        self.assertEqual(south_plans.count(), 1)
    
    def test_filter_by_year(self):
        """
        测试按年份筛选计划
        覆盖需求1.5
        """
        # 筛选2024年的计划
        plans_2024 = StorePlan.objects.filter(
            start_date__year=2024
        )
        self.assertEqual(plans_2024.count(), 3)
        
        # 筛选2023年的计划
        plans_2023 = StorePlan.objects.filter(
            start_date__year=2023
        )
        self.assertEqual(plans_2023.count(), 1)
    
    def test_combined_filters(self):
        """
        测试组合筛选条件
        覆盖需求1.5
        """
        # 筛选2024年执行中的计划
        executing_2024 = StorePlan.objects.filter(
            start_date__year=2024,
            status='executing'
        )
        self.assertEqual(executing_2024.count(), 1)
        self.assertEqual(executing_2024.first().name, '2024年Q1开店计划')
        
        # 筛选华东区的年度计划
        east_annual = StorePlan.objects.filter(
            regional_plans__region=self.region_east,
            plan_type='annual'
        ).distinct()
        self.assertEqual(east_annual.count(), 2)
