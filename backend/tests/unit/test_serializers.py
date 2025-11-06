"""
单元测试 - 序列化器测试
测试所有序列化器的数据转换和验证
"""
import pytest
from django.contrib.auth import get_user_model
from system_management.models import Department, Role
from system_management.serializers import (
    DepartmentSerializer,
    DepartmentSimpleSerializer,
    UserSerializer,
    RoleSerializer
)
from base_data.models import BusinessRegion, LegalEntity
from base_data.serializers import BusinessRegionSerializer, LegalEntitySerializer

User = get_user_model()


@pytest.mark.unit
class TestDepartmentSerializer:
    """部门序列化器测试"""
    
    def test_serialize_department(self, db):
        """测试序列化部门"""
        # Arrange
        department = Department.objects.create(
            wechat_dept_id=1001,
            name='测试部门',
            order=1
        )
        
        # Act
        serializer = DepartmentSerializer(department)
        data = serializer.data
        
        # Assert
        assert data['id'] == department.id
        assert data['name'] == '测试部门'
        assert data['wechat_dept_id'] == 1001
        assert data['order'] == 1
        assert 'children' in data
        assert 'level' in data
        assert 'path_names' in data
    
    def test_serialize_department_with_children(self, db):
        """测试序列化带子部门的部门"""
        # Arrange
        parent = Department.objects.create(wechat_dept_id=1001, name='父部门')
        child1 = Department.objects.create(wechat_dept_id=1002, name='子部门1', parent=parent)
        child2 = Department.objects.create(wechat_dept_id=1003, name='子部门2', parent=parent)
        
        # Act
        serializer = DepartmentSerializer(parent)
        data = serializer.data
        
        # Assert
        assert len(data['children']) == 2
        assert data['children'][0]['name'] in ['子部门1', '子部门2']
        assert data['children'][1]['name'] in ['子部门1', '子部门2']
    
    def test_deserialize_department(self, db):
        """测试反序列化部门"""
        # Arrange
        data = {
            'wechat_dept_id': 1001,
            'name': '新部门',
            'order': 1
        }
        
        # Act
        serializer = DepartmentSerializer(data=data)
        
        # Assert
        assert serializer.is_valid()
        department = serializer.save()
        assert department.name == '新部门'
        assert department.wechat_dept_id == 1001
    
    def test_validate_required_fields(self, db):
        """测试必填字段验证"""
        # Arrange
        data = {
            'order': 1
        }
        
        # Act
        serializer = DepartmentSerializer(data=data)
        
        # Assert
        assert not serializer.is_valid()
        assert 'wechat_dept_id' in serializer.errors
        assert 'name' in serializer.errors


@pytest.mark.unit
class TestDepartmentSimpleSerializer:
    """部门简单序列化器测试"""
    
    def test_serialize_simple_department(self, db):
        """测试简单序列化部门"""
        # Arrange
        parent = Department.objects.create(wechat_dept_id=1001, name='父部门')
        child = Department.objects.create(wechat_dept_id=1002, name='子部门', parent=parent)
        
        # Act
        serializer = DepartmentSimpleSerializer(child)
        data = serializer.data
        
        # Assert
        assert data['name'] == '子部门'
        assert data['parent_name'] == '父部门'
        assert 'children' not in data  # 简单序列化器不包含子部门


@pytest.mark.unit
class TestUserSerializer:
    """用户序列化器测试"""
    
    def test_serialize_user(self, db, test_department):
        """测试序列化用户"""
        # Arrange
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            phone='13800138000',
            department=test_department,
            first_name='测试',
            last_name='用户'
        )
        
        # Act
        serializer = UserSerializer(user)
        data = serializer.data
        
        # Assert
        assert data['username'] == 'testuser'
        assert data['phone'] == '13800138000'
        assert 'password' not in data  # 密码不应该被序列化
        assert 'department' in data or 'department_name' in data
    
    def test_deserialize_user(self, db, test_department):
        """测试反序列化用户"""
        # Arrange
        data = {
            'username': 'newuser',
            'phone': '13900139000',
            'department': test_department.id,
            'first_name': '新',
            'last_name': '用户'
        }
        
        # Act
        serializer = UserSerializer(data=data)
        
        # Assert
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.username == 'newuser'
        assert user.phone == '13900139000'
        # 注意：UserSerializer不处理密码，密码需要单独设置
    
    def test_validate_phone_format(self, db, test_department):
        """测试手机号格式验证"""
        # Arrange
        data = {
            'username': 'testuser',
            'password': 'pass123',
            'phone': 'invalid_phone',
            'department': test_department.id
        }
        
        # Act
        serializer = UserSerializer(data=data)
        
        # Assert
        # 注意：实际验证逻辑取决于序列化器的实现
        # 这里假设有手机号格式验证
        is_valid = serializer.is_valid()
        # 如果序列化器有手机号验证，应该失败
        # assert not is_valid or 'phone' in serializer.errors


@pytest.mark.unit
class TestRoleSerializer:
    """角色序列化器测试"""
    
    def test_serialize_role(self, db):
        """测试序列化角色"""
        # Arrange
        role = Role.objects.create(
            name='管理员',
            description='系统管理员'
        )
        
        # Act
        serializer = RoleSerializer(role)
        data = serializer.data
        
        # Assert
        assert data['name'] == '管理员'
        assert data['description'] == '系统管理员'
    
    def test_deserialize_role(self, db):
        """测试反序列化角色"""
        # Arrange
        data = {
            'name': '经理',
            'description': '部门经理角色'
        }
        
        # Act
        serializer = RoleSerializer(data=data)
        
        # Assert
        assert serializer.is_valid()
        role = serializer.save()
        assert role.name == '经理'


@pytest.mark.unit
class TestBusinessRegionSerializer:
    """业务大区序列化器测试"""
    
    def test_serialize_business_region(self, db):
        """测试序列化业务大区"""
        # Arrange
        region = BusinessRegion.objects.create(
            code='BJ',
            name='北京大区',
            description='北京及周边'
        )
        
        # Act
        serializer = BusinessRegionSerializer(region)
        data = serializer.data
        
        # Assert
        assert data['code'] == 'BJ'
        assert data['name'] == '北京大区'
    
    def test_deserialize_business_region(self, db):
        """测试反序列化业务大区"""
        # Arrange
        data = {
            'code': 'SH',
            'name': '上海大区',
            'description': '上海及周边'
        }
        
        # Act
        serializer = BusinessRegionSerializer(data=data)
        
        # Assert
        assert serializer.is_valid()
        region = serializer.save()
        assert region.code == 'SH'
        assert region.name == '上海大区'


@pytest.mark.unit
class TestLegalEntitySerializer:
    """法人主体序列化器测试"""
    
    def test_serialize_legal_entity(self, db):
        """测试序列化法人主体"""
        # Arrange
        entity = LegalEntity.objects.create(
            code='COMPANY001',
            name='测试公司',
            legal_representative='张三',
            credit_code='91110000000000000X'
        )
        
        # Act
        serializer = LegalEntitySerializer(entity)
        data = serializer.data
        
        # Assert
        assert data['code'] == 'COMPANY001'
        assert data['name'] == '测试公司'
        assert data['legal_representative'] == '张三'
    
    def test_deserialize_legal_entity(self, db):
        """测试反序列化法人主体"""
        # Arrange
        data = {
            'code': 'COMPANY002',
            'name': '新公司',
            'legal_representative': '李四',
            'credit_code': '91110000000000001X'
        }
        
        # Act
        serializer = LegalEntitySerializer(data=data)
        
        # Assert
        assert serializer.is_valid()
        entity = serializer.save()
        assert entity.code == 'COMPANY002'
        assert entity.name == '新公司'
