"""
开店计划管理 API 测试
测试计划管理的核心 API 功能、业务逻辑和权限控制
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
from unittest.mock import patch

from store_planning.models import (
    StorePlan, RegionalPlan, BusinessRegion, StoreType,
    PlanExecutionLog, PlanApproval
)
from store_planning.services import PlanBusinessService, PlanProgressService
from system_management.models import Permission, Role, Department

User = get_user_model()


# 跳过权限检查的装饰器（用于测试）
def skip_permission_check(func):
    """跳过权限检查的装饰器"""
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


class StorePlanModelTestCase(TestCase):
    """开店计划模型测试"""
    
    def setUp(self):
        """测试前准备"""
        # 创建部门
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        # 创建测试用户
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            phone='13800138000',
            wechat_user_id='test_wechat_id',
            department=self.department
        )
        
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
    
    def test_create_plan_model(self):
        """测试创建计划模型"""
        plan = StorePlan.objects.create(
            name='2024年华东区开店计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            description='2024年华东区域开店计划',
            created_by=self.user
        )
        
        self.assertIsNotNone(plan.id)
        self.assertEqual(plan.name, '2024年华东区开店计划')
        self.assertEqual(plan.status, 'draft')
        self.assertEqual(plan.created_by, self.user)
    
    def test_create_regional_plan(self):
        """测试创建区域计划"""
        plan = StorePlan.objects.create(
            name='测试计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
        
        regional_plan = RegionalPlan.objects.create(
            plan=plan,
            region=self.region,
            store_type=self.store_type,
            target_count=50,
            contribution_rate=Decimal('30.5'),
            budget_amount=Decimal('5000000')
        )
        
        self.assertIsNotNone(regional_plan.id)
        self.assertEqual(regional_plan.plan, plan)
        self.assertEqual(regional_plan.target_count, 50)
    
    def test_plan_status_transitions(self):
        """测试计划状态转换"""
        plan = StorePlan.objects.create(
            name='状态测试计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='draft',
            created_by=self.user
        )
        
        # 草稿 -> 已发布
        plan.status = 'published'
        plan.published_at = timezone.now()
        plan.save()
        self.assertEqual(plan.status, 'published')
        
        # 已发布 -> 执行中
        plan.status = 'executing'
        plan.save()
        self.assertEqual(plan.status, 'executing')
        
        # 执行中 -> 已完成
        plan.status = 'completed'
        plan.save()
        self.assertEqual(plan.status, 'completed')
    
    def test_plan_cancel(self):
        """测试取消计划"""
        plan = StorePlan.objects.create(
            name='待取消计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            status='published',
            created_by=self.user
        )
        
        plan.status = 'cancelled'
        plan.cancel_reason = '业务调整'
        plan.cancelled_at = timezone.now()
        plan.save()
        
        self.assertEqual(plan.status, 'cancelled')
        self.assertEqual(plan.cancel_reason, '业务调整')
        self.assertIsNotNone(plan.cancelled_at)
    
    def test_filter_plans_by_status(self):
        """测试按状态筛选计划"""
        StorePlan.objects.create(
            name='草稿计划',
            plan_type='annual',
            status='draft',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
        
        StorePlan.objects.create(
            name='已发布计划',
            plan_type='annual',
            status='published',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
        
        draft_plans = StorePlan.objects.filter(status='draft')
        self.assertEqual(draft_plans.count(), 1)
        self.assertEqual(draft_plans.first().name, '草稿计划')
    
    def test_plan_with_multiple_regional_plans(self):
        """测试包含多个区域计划的开店计划"""
        plan = StorePlan.objects.create(
            name='多区域计划',
            plan_type='annual',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
        
        region2 = BusinessRegion.objects.create(
            name='华南区',
            code='HN',
            is_active=True
        )
        
        RegionalPlan.objects.create(
            plan=plan,
            region=self.region,
            store_type=self.store_type,
            target_count=50,
            contribution_rate=Decimal('30.5'),
            budget_amount=Decimal('5000000')
        )
        
        RegionalPlan.objects.create(
            plan=plan,
            region=region2,
            store_type=self.store_type,
            target_count=30,
            contribution_rate=Decimal('20.0'),
            budget_amount=Decimal('3000000')
        )
        
        self.assertEqual(plan.regional_plans.count(), 2)


class PlanBusinessServiceTestCase(TestCase):
    """计划业务逻辑服务测试"""
    
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
        
        self.service = PlanBusinessService()
    
    def test_create_plan_with_regional_plans(self):
        """测试创建包含区域计划的开店计划"""
        plan_data = {
            'name': '2024年开店计划',
            'plan_type': 'annual',
            'start_date': date(2024, 1, 1),
            'end_date': date(2024, 12, 31),
            'description': '测试计划'
        }
        
        regional_plans_data = [
            {
                'region_id': self.region.id,
                'store_type_id': self.store_type.id,
                'target_count': 50,
                'contribution_rate': 30.5,
                'budget_amount': 5000000
            }
        ]
        
        plan = self.service.create_plan(plan_data, regional_plans_data, self.user)
        
        self.assertIsNotNone(plan)
        self.assertEqual(plan.name, '2024年开店计划')
        self.assertEqual(plan.status, 'draft')
        self.assertEqual(plan.regional_plans.count(), 1)
    
    def test_update_plan_basic_info(self):
        """测试更新计划基本信息"""
        plan = StorePlan.objects.create(
            name='原始计划',
            plan_type='annual',
            status='draft',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
        
        update_data = {
            'name': '更新后的计划',
            'description': '更新后的描述'
        }
        
        updated_plan = self.service.update_plan(plan, update_data)
        
        self.assertEqual(updated_plan.name, '更新后的计划')
        self.assertEqual(updated_plan.description, '更新后的描述')
    
    def test_publish_plan_validation(self):
        """测试发布计划时的验证"""
        plan = StorePlan.objects.create(
            name='待发布计划',
            plan_type='annual',
            status='draft',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user,
            total_target_count=0  # 目标数量为0，应该无法发布
        )
        
        # 没有区域计划，应该无法发布
        with self.assertRaises(Exception):
            self.service.publish_plan(plan)
    
    def test_cancel_plan_with_reason(self):
        """测试取消计划并记录原因"""
        plan = StorePlan.objects.create(
            name='待取消计划',
            plan_type='annual',
            status='published',
            start_date='2024-01-01',
            end_date='2024-12-31',
            created_by=self.user
        )
        
        cancel_reason = '业务调整'
        cancelled_plan = self.service.cancel_plan(plan, cancel_reason)
        
        self.assertEqual(cancelled_plan.status, 'cancelled')
        self.assertEqual(cancelled_plan.cancel_reason, cancel_reason)
        self.assertIsNotNone(cancelled_plan.cancelled_at)


class RegionAndStoreTypeModelTestCase(TestCase):
    """经营区域和门店类型模型测试"""
    
    def test_create_region(self):
        """测试创建经营区域"""
        region = BusinessRegion.objects.create(
            name='华东区',
            code='HD',
            description='华东区域',
            is_active=True
        )
        
        self.assertIsNotNone(region.id)
        self.assertEqual(region.name, '华东区')
        self.assertEqual(region.code, 'HD')
        self.assertTrue(region.is_active)
    
    def test_list_active_regions(self):
        """测试获取启用的区域列表"""
        BusinessRegion.objects.create(name='华东区', code='HD', is_active=True)
        BusinessRegion.objects.create(name='华南区', code='HN', is_active=False)
        
        active_regions = BusinessRegion.objects.filter(is_active=True)
        
        self.assertEqual(active_regions.count(), 1)
        self.assertEqual(active_regions.first().code, 'HD')
    
    def test_create_store_type(self):
        """测试创建门店类型"""
        store_type = StoreType.objects.create(
            name='直营店',
            code='ZY',
            description='直营门店',
            is_active=True
        )
        
        self.assertIsNotNone(store_type.id)
        self.assertEqual(store_type.name, '直营店')
        self.assertEqual(store_type.code, 'ZY')


class PermissionModelTestCase(TestCase):
    """权限模型测试"""
    
    def setUp(self):
        """测试前准备"""
        self.department = Department.objects.create(
            wechat_dept_id=1,
            name='测试部门'
        )
        
        # 创建有权限的用户
        self.user_with_permission = User.objects.create_user(
            username='user_with_perm',
            password='testpass123',
            phone='13800138001',
            wechat_user_id='user1_wechat_id',
            department=self.department
        )
        
        # 创建无权限的用户
        self.user_without_permission = User.objects.create_user(
            username='user_without_perm',
            password='testpass123',
            phone='13800138002',
            wechat_user_id='user2_wechat_id',
            department=self.department
        )
        
        # 创建权限
        self.view_permission = Permission.objects.create(
            code='store_planning.plan.view',
            name='查看计划',
            module='开店计划管理'
        )
        
        # 创建角色并分配权限
        self.role = Role.objects.create(
            name='计划查看者',
            is_active=True
        )
        self.role.permissions.add(self.view_permission)
        self.user_with_permission.roles.add(self.role)
    
    def test_user_has_permission(self):
        """测试用户有权限"""
        self.assertTrue(
            self.user_with_permission.has_permission('store_planning.plan.view')
        )
    
    def test_user_without_permission(self):
        """测试用户没有权限"""
        self.assertFalse(
            self.user_without_permission.has_permission('store_planning.plan.view')
        )
    
    def test_superuser_has_all_permissions(self):
        """测试超级管理员有所有权限"""
        admin = User.objects.create_superuser(
            username='admin',
            password='admin123',
            phone='13800138999',
            wechat_user_id='admin_wechat_id',
            department=self.department
        )
        
        self.assertTrue(admin.has_permission('store_planning.plan.view'))
        self.assertTrue(admin.has_permission('any.permission.code'))
