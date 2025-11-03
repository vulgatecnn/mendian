"""
基础数据模型测试
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from base_data.models import BusinessRegion, Supplier, LegalEntity, Customer, Budget

User = get_user_model()


class BusinessRegionModelTest(TestCase):
    """业务大区模型测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username='testuser1',
            password='testpass123',
            phone='13800138001',
            wechat_user_id='test_wechat_id_1'
        )
    
    def test_create_business_region(self):
        """测试创建业务大区"""
        region = BusinessRegion.objects.create(
            name='华东大区',
            code='HD001',
            description='华东地区业务大区',
            provinces=['上海', '江苏', '浙江'],
            manager=self.user,
            created_by=self.user
        )
        
        self.assertEqual(region.name, '华东大区')
        self.assertEqual(region.code, 'HD001')
        self.assertTrue(region.is_active)
        self.assertEqual(str(region), '华东大区')


class SupplierModelTest(TestCase):
    """供应商模型测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username='testuser2',
            password='testpass123',
            phone='13800138002',
            wechat_user_id='test_wechat_id_2'
        )
    
    def test_create_supplier(self):
        """测试创建供应商"""
        supplier = Supplier.objects.create(
            name='测试施工公司',
            code='GYS001',
            supplier_type=Supplier.TYPE_CONSTRUCTION,
            contact_person='张三',
            contact_phone='13800138000',
            status=Supplier.STATUS_COOPERATING,
            created_by=self.user
        )
        
        self.assertEqual(supplier.name, '测试施工公司')
        self.assertEqual(supplier.code, 'GYS001')
        self.assertEqual(supplier.status, Supplier.STATUS_COOPERATING)
        self.assertEqual(str(supplier), '测试施工公司')


class LegalEntityModelTest(TestCase):
    """法人主体模型测试"""
    
    def setUp(self):
        """设置测试数据"""
        self.user = User.objects.create_user(
            username='testuser3',
            password='testpass123',
            phone='13800138003',
            wechat_user_id='test_wechat_id_3'
        )
    
    def test_create_legal_entity(self):
        """测试创建法人主体"""
        entity = LegalEntity.objects.create(
            name='测试科技有限公司',
            code='FR001',
            credit_code='91310000MA1234567X',
            legal_representative='李四',
            status=LegalEntity.STATUS_OPERATING,
            created_by=self.user
        )
        
        self.assertEqual(entity.name, '测试科技有限公司')
        self.assertEqual(entity.code, 'FR001')
        self.assertEqual(entity.status, LegalEntity.STATUS_OPERATING)
        self.assertEqual(str(entity), '测试科技有限公司')
