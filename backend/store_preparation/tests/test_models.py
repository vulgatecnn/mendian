"""
开店筹备模块模型测试
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date

from store_preparation.models import ConstructionOrder, Milestone, DeliveryChecklist
from store_expansion.models import FollowUpRecord, CandidateLocation
from base_data.models import BusinessRegion, Supplier

User = get_user_model()


class ConstructionOrderModelTest(TestCase):
    """工程单模型测试"""
    
    def setUp(self):
        """设置测试数据"""
        # 创建用户
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # 创建业务大区
        self.region = BusinessRegion.objects.create(
            code='BJ',
            name='北京大区',
            created_by=self.user
        )
        
        # 创建候选点位
        self.location = CandidateLocation.objects.create(
            name='测试点位',
            province='北京',
            city='北京',
            district='朝阳区',
            address='测试地址',
            area=100,
            rent=10000,
            business_region=self.region,
            created_by=self.user
        )
        
        # 创建跟进单
        self.follow_up = FollowUpRecord.objects.create(
            location=self.location,
            status='signed',
            created_by=self.user
        )
        
        # 创建供应商
        self.supplier = Supplier.objects.create(
            code='SUP001',
            name='测试供应商',
            supplier_type='施工',
            contact_person='张三',
            contact_phone='13800138000',
            created_by=self.user
        )
    
    def test_create_construction_order(self):
        """测试创建工程单"""
        order = ConstructionOrder.objects.create(
            store_name='测试门店',
            follow_up_record=self.follow_up,
            construction_start_date=date(2023, 11, 10),
            construction_end_date=date(2023, 12, 31),
            supplier=self.supplier,
            created_by=self.user
        )
        
        # 验证工程单号自动生成
        self.assertIsNotNone(order.order_no)
        self.assertTrue(order.order_no.startswith('GC'))
        
        # 验证默认状态
        self.assertEqual(order.status, ConstructionOrder.STATUS_PLANNING)
        self.assertEqual(order.acceptance_result, ConstructionOrder.ACCEPTANCE_PENDING)
    
    def test_construction_order_str(self):
        """测试工程单字符串表示"""
        order = ConstructionOrder.objects.create(
            store_name='测试门店',
            follow_up_record=self.follow_up,
            created_by=self.user
        )
        
        expected = f"{order.order_no} - 测试门店"
        self.assertEqual(str(order), expected)


class MilestoneModelTest(TestCase):
    """里程碑模型测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        self.region = BusinessRegion.objects.create(
            code='BJ',
            name='北京大区',
            created_by=self.user
        )
        
        self.location = CandidateLocation.objects.create(
            name='测试点位',
            province='北京',
            city='北京',
            district='朝阳区',
            address='测试地址',
            area=100,
            rent=10000,
            business_region=self.region,
            created_by=self.user
        )
        
        self.follow_up = FollowUpRecord.objects.create(
            location=self.location,
            status='signed',
            created_by=self.user
        )
        
        self.order = ConstructionOrder.objects.create(
            store_name='测试门店',
            follow_up_record=self.follow_up,
            created_by=self.user
        )
    
    def test_create_milestone(self):
        """测试创建里程碑"""
        milestone = Milestone.objects.create(
            construction_order=self.order,
            name='水电改造完成',
            planned_date=date(2023, 11, 20)
        )
        
        # 验证默认状态
        self.assertEqual(milestone.status, Milestone.STATUS_PENDING)
        self.assertFalse(milestone.reminder_sent)
    
    def test_milestone_str(self):
        """测试里程碑字符串表示"""
        milestone = Milestone.objects.create(
            construction_order=self.order,
            name='水电改造完成',
            planned_date=date(2023, 11, 20)
        )
        
        expected = f"{self.order.order_no} - 水电改造完成"
        self.assertEqual(str(milestone), expected)


class DeliveryChecklistModelTest(TestCase):
    """交付清单模型测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        self.region = BusinessRegion.objects.create(
            code='BJ',
            name='北京大区',
            created_by=self.user
        )
        
        self.location = CandidateLocation.objects.create(
            name='测试点位',
            province='北京',
            city='北京',
            district='朝阳区',
            address='测试地址',
            area=100,
            rent=10000,
            business_region=self.region,
            created_by=self.user
        )
        
        self.follow_up = FollowUpRecord.objects.create(
            location=self.location,
            status='signed',
            created_by=self.user
        )
        
        self.order = ConstructionOrder.objects.create(
            store_name='测试门店',
            follow_up_record=self.follow_up,
            created_by=self.user
        )
    
    def test_create_delivery_checklist(self):
        """测试创建交付清单"""
        checklist = DeliveryChecklist.objects.create(
            construction_order=self.order,
            store_name='测试门店',
            created_by=self.user
        )
        
        # 验证清单编号自动生成
        self.assertIsNotNone(checklist.checklist_no)
        self.assertTrue(checklist.checklist_no.startswith('JF'))
        
        # 验证默认状态
        self.assertEqual(checklist.status, DeliveryChecklist.STATUS_DRAFT)
    
    def test_delivery_checklist_str(self):
        """测试交付清单字符串表示"""
        checklist = DeliveryChecklist.objects.create(
            construction_order=self.order,
            store_name='测试门店',
            created_by=self.user
        )
        
        expected = f"{checklist.checklist_no} - 测试门店"
        self.assertEqual(str(checklist), expected)
