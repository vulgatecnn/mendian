"""
单元测试 - 数据模型测试
测试所有模型的字段验证和方法
"""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from system_management.models import Department, Role, Permission
from base_data.models import BusinessRegion, LegalEntity, Supplier

User = get_user_model()


@pytest.mark.unit
class TestDepartmentModel:
    """部门模型测试"""
    
    def test_create_department(self, db):
        """测试创建部门"""
        # Arrange & Act
        department = Department.objects.create(
            wechat_dept_id=1001,
            name='测试部门',
            order=1
        )
        
        # Assert
        assert department.id is not None
        assert department.name == '测试部门'
        assert department.wechat_dept_id == 1001
        assert department.order == 1
        assert department.parent is None
    
    def test_department_unique_wechat_id(self, db):
        """测试企微部门ID唯一性约束"""
        # Arrange
        Department.objects.create(wechat_dept_id=1001, name='部门1')
        
        # Act & Assert
        with pytest.raises(IntegrityError):
            Department.objects.create(wechat_dept_id=1001, name='部门2')
    
    def test_department_hierarchy(self, db):
        """测试部门层级关系"""
        # Arrange
        parent_dept = Department.objects.create(
            wechat_dept_id=1001,
            name='父部门'
        )
        child_dept = Department.objects.create(
            wechat_dept_id=1002,
            name='子部门',
            parent=parent_dept
        )
        
        # Act & Assert
        assert child_dept.parent == parent_dept
        assert child_dept in parent_dept.get_children()
    
    def test_get_all_children(self, db):
        """测试递归获取所有子部门"""
        # Arrange
        root = Department.objects.create(wechat_dept_id=1001, name='根部门')
        child1 = Department.objects.create(wechat_dept_id=1002, name='子部门1', parent=root)
        child2 = Department.objects.create(wechat_dept_id=1003, name='子部门2', parent=root)
        grandchild = Department.objects.create(wechat_dept_id=1004, name='孙部门', parent=child1)
        
        # Act
        all_children = root.get_all_children()
        
        # Assert
        assert len(all_children) == 3
        assert child1 in all_children
        assert child2 in all_children
        assert grandchild in all_children
    
    def test_get_department_path(self, db):
        """测试获取部门路径"""
        # Arrange
        root = Department.objects.create(wechat_dept_id=1001, name='根部门')
        child = Department.objects.create(wechat_dept_id=1002, name='子部门', parent=root)
        grandchild = Department.objects.create(wechat_dept_id=1003, name='孙部门', parent=child)
        
        # Act
        path = grandchild.get_department_path()
        path_names = grandchild.get_department_path_names()
        
        # Assert
        assert len(path) == 3
        assert path[0] == root
        assert path[1] == child
        assert path[2] == grandchild
        assert path_names == ['根部门', '子部门', '孙部门']
    
    def test_get_level(self, db):
        """测试获取部门层级"""
        # Arrange
        root = Department.objects.create(wechat_dept_id=1001, name='根部门')
        child = Department.objects.create(wechat_dept_id=1002, name='子部门', parent=root)
        grandchild = Department.objects.create(wechat_dept_id=1003, name='孙部门', parent=child)
        
        # Act & Assert
        assert root.get_level() == 1
        assert child.get_level() == 2
        assert grandchild.get_level() == 3


@pytest.mark.unit
class TestUserModel:
    """用户模型测试"""
    
    def test_create_user(self, db, test_department):
        """测试创建用户"""
        # Arrange & Act
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            phone='13800138000',
            department=test_department,
            first_name='测试',
            last_name='用户'
        )
        
        # Assert
        assert user.id is not None
        assert user.username == 'testuser'
        assert user.phone == '13800138000'
        assert user.department == test_department
        assert user.check_password('testpass123')
        assert user.is_active is True
    
    def test_user_unique_phone(self, db, test_department):
        """测试手机号唯一性约束"""
        # Arrange
        User.objects.create_user(
            username='user1',
            password='pass123',
            phone='13800138000',
            department=test_department
        )
        
        # Act & Assert
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                username='user2',
                password='pass123',
                phone='13800138000',
                department=test_department
            )
    
    def test_user_get_full_name(self, db, test_department):
        """测试获取用户全名"""
        # Arrange
        user = User.objects.create_user(
            username='testuser',
            password='pass123',
            phone='13800138000',
            department=test_department,
            first_name='张',
            last_name='三'
        )
        
        # Act
        full_name = user.get_full_name()
        
        # Assert
        # 注意：Django User模型的get_full_name返回 last_name + first_name
        assert full_name == '三张'
    
    def test_user_str_representation(self, db, test_department):
        """测试用户字符串表示"""
        # Arrange
        user = User.objects.create_user(
            username='testuser',
            password='pass123',
            phone='13800138000',
            department=test_department,
            first_name='张',
            last_name='三'
        )
        
        # Act
        user_str = str(user)
        
        # Assert
        assert 'testuser' in user_str
        # 注意：User模型的__str__返回 last_name + first_name
        assert '三张' in user_str or '13800138000' in user_str


@pytest.mark.unit
class TestRoleModel:
    """角色模型测试"""
    
    def test_create_role(self, db):
        """测试创建角色"""
        # Arrange & Act
        role = Role.objects.create(
            name='管理员',
            description='系统管理员角色'
        )
        
        # Assert
        assert role.id is not None
        assert role.name == '管理员'
        assert role.description == '系统管理员角色'
        assert role.is_active is True
    
    def test_role_unique_name(self, db):
        """测试角色名称唯一性约束"""
        # Arrange
        Role.objects.create(name='管理员')
        
        # Act & Assert
        with pytest.raises(IntegrityError):
            Role.objects.create(name='管理员')


@pytest.mark.unit
class TestBusinessRegionModel:
    """业务大区模型测试"""
    
    def test_create_business_region(self, db):
        """测试创建业务大区"""
        # Arrange & Act
        region = BusinessRegion.objects.create(
            code='BJ',
            name='北京大区',
            description='北京及周边地区'
        )
        
        # Assert
        assert region.id is not None
        assert region.code == 'BJ'
        assert region.name == '北京大区'
        assert region.is_active is True


@pytest.mark.unit
class TestLegalEntityModel:
    """法人主体模型测试"""
    
    def test_create_legal_entity(self, db):
        """测试创建法人主体"""
        # Arrange & Act
        entity = LegalEntity.objects.create(
            code='COMPANY001',
            name='测试公司',
            legal_representative='张三',
            credit_code='91110000000000000X'
        )
        
        # Assert
        assert entity.id is not None
        assert entity.code == 'COMPANY001'
        assert entity.name == '测试公司'
        assert entity.legal_representative == '张三'


@pytest.mark.unit
class TestSupplierModel:
    """供应商模型测试"""
    
    def test_create_supplier(self, db):
        """测试创建供应商"""
        # Arrange & Act
        supplier = Supplier.objects.create(
            code='SUP001',
            name='测试供应商',
            contact_person='李四',
            contact_phone='13900139000',
            supplier_type='construction'
        )
        
        # Assert
        assert supplier.id is not None
        assert supplier.code == 'SUP001'
        assert supplier.name == '测试供应商'
        assert supplier.supplier_type == 'construction'
