#!/usr/bin/env python
"""
基础数据API集成测试
测试经营区域、供应商、法人主体、客户等基础数据管理API
"""
import pytest
from django.contrib.auth import get_user_model
from base_data.models import BusinessRegion, Supplier, LegalEntity, Customer, Budget

User = get_user_model()


@pytest.mark.integration
class TestBusinessRegionAPI:
    """经营区域API测试"""
    
    def test_get_region_list_success(self, admin_client):
        """测试成功获取经营区域列表"""
        # Act
        response = admin_client.get('/api/base_data/regions/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 验证返回数据结构
        if 'results' in data:
            regions = data['results']
        else:
            regions = data
        
        assert isinstance(regions, list)
    
    def test_create_region_success(self, admin_client, admin_user):
        """测试成功创建经营区域"""
        # Arrange
        region_data = {
            'name': '华东大区',
            'code': 'HD001',
            'description': '华东地区业务大区',
            'provinces': ['上海', '江苏', '浙江'],
            'manager': admin_user.id,
            'is_active': True
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/regions/',
            data=region_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [200, 201]
        data = response.json()
        
        # 验证返回数据
        assert data['name'] == '华东大区'
        assert data['code'] == 'HD001'
        assert data['provinces'] == ['上海', '江苏', '浙江']
        
        # 验证数据库中已创建
        assert BusinessRegion.objects.filter(code='HD001').exists()
        
        # 清理
        BusinessRegion.objects.filter(code='HD001').delete()
    
    def test_create_region_with_duplicate_code(self, admin_client, admin_user):
        """测试创建重复编码的经营区域"""
        # Arrange - 先创建一个区域
        BusinessRegion.objects.create(
            name='测试大区',
            code='TEST001',
            created_by=admin_user
        )
        
        # 尝试创建相同编码的区域
        region_data = {
            'name': '另一个大区',
            'code': 'TEST001',  # 重复编码
            'is_active': True
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/regions/',
            data=region_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 400
        
        # 清理
        BusinessRegion.objects.filter(code='TEST001').delete()
    
    def test_update_region_success(self, admin_client, admin_user):
        """测试成功更新经营区域"""
        # Arrange - 创建一个区域
        region = BusinessRegion.objects.create(
            name='华南大区',
            code='HN001',
            created_by=admin_user
        )
        
        # 准备更新数据
        update_data = {
            'description': '更新后的描述',
            'provinces': ['广东', '广西', '海南']
        }
        
        # Act
        response = admin_client.patch(
            f'/api/base_data/regions/{region.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['description'] == '更新后的描述'
        assert data['provinces'] == ['广东', '广西', '海南']
        
        # 清理
        region.delete()
    
    def test_delete_region_success(self, admin_client, admin_user):
        """测试成功删除经营区域"""
        # Arrange
        region = BusinessRegion.objects.create(
            name='待删除大区',
            code='DEL001',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.delete(f'/api/base_data/regions/{region.id}/')
        
        # Assert
        assert response.status_code in [200, 204]
        assert not BusinessRegion.objects.filter(id=region.id).exists()
    
    def test_get_region_detail_success(self, admin_client, admin_user):
        """测试成功获取经营区域详情"""
        # Arrange
        region = BusinessRegion.objects.create(
            name='华北大区',
            code='HB001',
            description='华北地区',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get(f'/api/base_data/regions/{region.id}/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == '华北大区'
        assert data['code'] == 'HB001'
        
        # 清理
        region.delete()
    
    def test_search_regions(self, admin_client, admin_user):
        """测试搜索经营区域"""
        # Arrange
        region = BusinessRegion.objects.create(
            name='西南大区',
            code='XN001',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/regions/?search=西南')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            regions = data['results']
        else:
            regions = data
        
        # 验证搜索结果包含目标区域
        region_names = [r['name'] for r in regions]
        assert '西南大区' in region_names
        
        # 清理
        region.delete()


@pytest.mark.integration
class TestSupplierAPI:
    """供应商API测试"""
    
    def test_get_supplier_list_success(self, admin_client):
        """测试成功获取供应商列表"""
        # Act
        response = admin_client.get('/api/base_data/suppliers/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            suppliers = data['results']
        else:
            suppliers = data
        
        assert isinstance(suppliers, list)
    
    def test_create_supplier_success(self, admin_client, admin_user):
        """测试成功创建供应商"""
        # Arrange
        supplier_data = {
            'name': '测试施工公司',
            'code': 'SUP001',
            'supplier_type': 'construction',
            'contact_person': '张三',
            'contact_phone': '13900001111',
            'contact_email': 'zhangsan@test.com',
            'address': '上海市浦东新区',
            'credit_code': '91310000MA1234567X',
            'legal_representative': '李四',
            'status': 'cooperating'
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/suppliers/',
            data=supplier_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [200, 201]
        data = response.json()
        assert data['name'] == '测试施工公司'
        assert data['code'] == 'SUP001'
        assert data['supplier_type'] == 'construction'
        
        # 验证数据库
        assert Supplier.objects.filter(code='SUP001').exists()
        
        # 清理
        Supplier.objects.filter(code='SUP001').delete()
    
    def test_create_supplier_with_duplicate_code(self, admin_client, admin_user):
        """测试创建重复编码的供应商"""
        # Arrange
        Supplier.objects.create(
            name='已存在供应商',
            code='DUP001',
            created_by=admin_user
        )
        
        supplier_data = {
            'name': '新供应商',
            'code': 'DUP001',  # 重复编码
            'supplier_type': 'equipment'
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/suppliers/',
            data=supplier_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 400
        
        # 清理
        Supplier.objects.filter(code='DUP001').delete()
    
    def test_update_supplier_success(self, admin_client, admin_user):
        """测试成功更新供应商"""
        # Arrange
        supplier = Supplier.objects.create(
            name='待更新供应商',
            code='UPD001',
            supplier_type='material',
            created_by=admin_user
        )
        
        update_data = {
            'contact_person': '王五',
            'contact_phone': '13900002222',
            'status': 'stopped'
        }
        
        # Act
        response = admin_client.patch(
            f'/api/base_data/suppliers/{supplier.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['contact_person'] == '王五'
        assert data['status'] == 'stopped'
        
        # 清理
        supplier.delete()
    
    def test_delete_supplier_success(self, admin_client, admin_user):
        """测试成功删除供应商"""
        # Arrange
        supplier = Supplier.objects.create(
            name='待删除供应商',
            code='DEL002',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.delete(f'/api/base_data/suppliers/{supplier.id}/')
        
        # Assert
        assert response.status_code in [200, 204]
        assert not Supplier.objects.filter(id=supplier.id).exists()
    
    def test_get_active_suppliers(self, admin_client, admin_user):
        """测试获取合作中的供应商列表"""
        # Arrange
        Supplier.objects.create(
            name='合作中供应商',
            code='ACT001',
            status='cooperating',
            created_by=admin_user
        )
        Supplier.objects.create(
            name='已停止供应商',
            code='STP001',
            status='stopped',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/suppliers/active/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'data' in data:
            suppliers = data['data']
        else:
            suppliers = data
        
        # 验证只返回合作中的供应商
        for supplier in suppliers:
            assert supplier['status'] == 'cooperating'
        
        # 清理
        Supplier.objects.filter(code__in=['ACT001', 'STP001']).delete()
    
    def test_filter_suppliers_by_type(self, admin_client, admin_user):
        """测试按类型筛选供应商"""
        # Arrange
        Supplier.objects.create(
            name='施工供应商',
            code='CON001',
            supplier_type='construction',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/suppliers/?supplier_type=construction')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            suppliers = data['results']
        else:
            suppliers = data
        
        # 验证所有返回的供应商都是施工类型
        for supplier in suppliers:
            assert supplier['supplier_type'] == 'construction'
        
        # 清理
        Supplier.objects.filter(code='CON001').delete()


@pytest.mark.integration
class TestLegalEntityAPI:
    """法人主体API测试"""
    
    def test_get_entity_list_success(self, admin_client):
        """测试成功获取法人主体列表"""
        # Act
        response = admin_client.get('/api/base_data/entities/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            entities = data['results']
        else:
            entities = data
        
        assert isinstance(entities, list)
    
    def test_create_entity_success(self, admin_client, admin_user):
        """测试成功创建法人主体"""
        # Arrange
        entity_data = {
            'name': '测试科技有限公司',
            'code': 'ENT001',
            'credit_code': '91310000MA1234567Y',
            'legal_representative': '张总',
            'registered_capital': '1000000.00',
            'registration_date': '2020-01-01',
            'contact_person': '李经理',
            'contact_phone': '13900003333',
            'contact_email': 'contact@test.com',
            'registered_address': '上海市黄浦区',
            'business_address': '上海市浦东新区',
            'status': 'operating'
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/entities/',
            data=entity_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [200, 201]
        data = response.json()
        assert data['name'] == '测试科技有限公司'
        assert data['code'] == 'ENT001'
        assert data['credit_code'] == '91310000MA1234567Y'
        
        # 验证数据库
        assert LegalEntity.objects.filter(code='ENT001').exists()
        
        # 清理
        LegalEntity.objects.filter(code='ENT001').delete()
    
    def test_create_entity_with_duplicate_credit_code(self, admin_client, admin_user):
        """测试创建重复统一社会信用代码的法人主体"""
        # Arrange
        LegalEntity.objects.create(
            name='已存在公司',
            code='OLD001',
            credit_code='91310000MA1111111A',
            legal_representative='老板',
            created_by=admin_user
        )
        
        entity_data = {
            'name': '新公司',
            'code': 'NEW001',
            'credit_code': '91310000MA1111111A',  # 重复信用代码
            'legal_representative': '新老板'
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/entities/',
            data=entity_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 400
        
        # 清理
        LegalEntity.objects.filter(code='OLD001').delete()
    
    def test_update_entity_success(self, admin_client, admin_user):
        """测试成功更新法人主体"""
        # Arrange
        entity = LegalEntity.objects.create(
            name='待更新公司',
            code='UPD002',
            credit_code='91310000MA2222222B',
            legal_representative='原法人',
            created_by=admin_user
        )
        
        update_data = {
            'legal_representative': '新法人',
            'contact_phone': '13900004444',
            'status': 'cancelled'
        }
        
        # Act
        response = admin_client.patch(
            f'/api/base_data/entities/{entity.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['legal_representative'] == '新法人'
        assert data['status'] == 'cancelled'
        
        # 清理
        entity.delete()
    
    def test_delete_entity_success(self, admin_client, admin_user):
        """测试成功删除法人主体"""
        # Arrange
        entity = LegalEntity.objects.create(
            name='待删除公司',
            code='DEL003',
            credit_code='91310000MA3333333C',
            legal_representative='法人',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.delete(f'/api/base_data/entities/{entity.id}/')
        
        # Assert
        assert response.status_code in [200, 204]
        assert not LegalEntity.objects.filter(id=entity.id).exists()
    
    def test_get_operating_entities(self, admin_client, admin_user):
        """测试获取营运中的法人主体列表"""
        # Arrange
        LegalEntity.objects.create(
            name='营运中公司',
            code='OPR001',
            credit_code='91310000MA4444444D',
            legal_representative='法人A',
            status='operating',
            created_by=admin_user
        )
        LegalEntity.objects.create(
            name='已注销公司',
            code='CAN001',
            credit_code='91310000MA5555555E',
            legal_representative='法人B',
            status='cancelled',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/entities/operating/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'data' in data:
            entities = data['data']
        else:
            entities = data
        
        # 验证只返回营运中的主体
        for entity in entities:
            assert entity['status'] == 'operating'
        
        # 清理
        LegalEntity.objects.filter(code__in=['OPR001', 'CAN001']).delete()
    
    def test_search_entities(self, admin_client, admin_user):
        """测试搜索法人主体"""
        # Arrange
        entity = LegalEntity.objects.create(
            name='好饭碗餐饮管理有限公司',
            code='HFW001',
            credit_code='91310000MA6666666F',
            legal_representative='创始人',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/entities/?search=好饭碗')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            entities = data['results']
        else:
            entities = data
        
        # 验证搜索结果
        entity_names = [e['name'] for e in entities]
        assert '好饭碗餐饮管理有限公司' in entity_names
        
        # 清理
        entity.delete()


@pytest.mark.integration
class TestCustomerAPI:
    """客户API测试"""
    
    def test_get_customer_list_success(self, admin_client):
        """测试成功获取客户列表"""
        # Act
        response = admin_client.get('/api/base_data/customers/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            customers = data['results']
        else:
            customers = data
        
        assert isinstance(customers, list)
    
    def test_create_customer_success(self, admin_client, admin_user):
        """测试成功创建客户"""
        # Arrange
        customer_data = {
            'name': '张三加盟商',
            'code': 'CUS001',
            'customer_type': 'franchisee',
            'contact_person': '张三',
            'contact_phone': '13900005555',
            'contact_email': 'zhangsan@customer.com',
            'address': '北京市朝阳区',
            'credit_code': '91110000MA7777777G',
            'legal_representative': '张三',
            'cooperation_start_date': '2023-01-01',
            'status': 'cooperating'
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/customers/',
            data=customer_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [200, 201]
        data = response.json()
        assert data['name'] == '张三加盟商'
        assert data['code'] == 'CUS001'
        assert data['customer_type'] == 'franchisee'
        
        # 验证数据库
        assert Customer.objects.filter(code='CUS001').exists()
        
        # 清理
        Customer.objects.filter(code='CUS001').delete()
    
    def test_create_customer_with_duplicate_code(self, admin_client, admin_user):
        """测试创建重复编码的客户"""
        # Arrange
        Customer.objects.create(
            name='已存在客户',
            code='DUP002',
            contact_person='老客户',
            contact_phone='13900006666',
            created_by=admin_user
        )
        
        customer_data = {
            'name': '新客户',
            'code': 'DUP002',  # 重复编码
            'contact_person': '新客户',
            'contact_phone': '13900007777'
        }
        
        # Act
        response = admin_client.post(
            '/api/base_data/customers/',
            data=customer_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 400
        
        # 清理
        Customer.objects.filter(code='DUP002').delete()
    
    def test_update_customer_success(self, admin_client, admin_user):
        """测试成功更新客户"""
        # Arrange
        customer = Customer.objects.create(
            name='待更新客户',
            code='UPD003',
            contact_person='原联系人',
            contact_phone='13900008888',
            customer_type='franchisee',
            created_by=admin_user
        )
        
        update_data = {
            'contact_person': '新联系人',
            'contact_phone': '13900009999',
            'status': 'terminated'
        }
        
        # Act
        response = admin_client.patch(
            f'/api/base_data/customers/{customer.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['contact_person'] == '新联系人'
        assert data['status'] == 'terminated'
        
        # 清理
        customer.delete()
    
    def test_delete_customer_success(self, admin_client, admin_user):
        """测试成功删除客户"""
        # Arrange
        customer = Customer.objects.create(
            name='待删除客户',
            code='DEL004',
            contact_person='联系人',
            contact_phone='13900001234',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.delete(f'/api/base_data/customers/{customer.id}/')
        
        # Assert
        assert response.status_code in [200, 204]
        assert not Customer.objects.filter(id=customer.id).exists()
    
    def test_get_cooperating_customers(self, admin_client, admin_user):
        """测试获取合作中的客户列表"""
        # Arrange
        Customer.objects.create(
            name='合作中客户',
            code='COOP001',
            contact_person='合作人',
            contact_phone='13900002345',
            status='cooperating',
            created_by=admin_user
        )
        Customer.objects.create(
            name='已终止客户',
            code='TERM001',
            contact_person='终止人',
            contact_phone='13900003456',
            status='terminated',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/customers/cooperating/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'data' in data:
            customers = data['data']
        else:
            customers = data
        
        # 验证只返回合作中的客户
        for customer in customers:
            assert customer['status'] == 'cooperating'
        
        # 清理
        Customer.objects.filter(code__in=['COOP001', 'TERM001']).delete()
    
    def test_filter_customers_by_type(self, admin_client, admin_user):
        """测试按类型筛选客户"""
        # Arrange
        Customer.objects.create(
            name='加盟商客户',
            code='FRA001',
            contact_person='加盟人',
            contact_phone='13900004567',
            customer_type='franchisee',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/customers/?customer_type=franchisee')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            customers = data['results']
        else:
            customers = data
        
        # 验证所有返回的客户都是加盟商类型
        for customer in customers:
            assert customer['customer_type'] == 'franchisee'
        
        # 清理
        Customer.objects.filter(code='FRA001').delete()
    
    def test_search_customers(self, admin_client, admin_user):
        """测试搜索客户"""
        # Arrange
        customer = Customer.objects.create(
            name='李四合作伙伴',
            code='PART001',
            contact_person='李四',
            contact_phone='13900005678',
            customer_type='partner',
            created_by=admin_user
        )
        
        # Act
        response = admin_client.get('/api/base_data/customers/?search=李四')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            customers = data['results']
        else:
            customers = data
        
        # 验证搜索结果
        customer_names = [c['name'] for c in customers]
        assert '李四合作伙伴' in customer_names
        
        # 清理
        customer.delete()


# 用于手动运行的测试脚本
if __name__ == "__main__":
    import os
    import sys
    import django
    
    # 设置Django环境
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'store_lifecycle.settings')
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    django.setup()
    
    # 运行pytest
    pytest.main([__file__, '-v'])
