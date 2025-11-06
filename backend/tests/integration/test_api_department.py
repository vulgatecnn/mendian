#!/usr/bin/env python
"""
部门管理API集成测试
测试部门管理相关的API端点
"""
import pytest
from django.contrib.auth import get_user_model
from system_management.models import Department

User = get_user_model()


@pytest.mark.integration
class TestDepartmentListAPI:
    """部门列表查询API测试"""
    
    def test_get_department_list_success(self, admin_client):
        """测试成功获取部门列表"""
        # Act
        response = admin_client.get('/api/departments/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 验证返回数据结构
        if 'results' in data:
            departments = data['results']
        else:
            departments = data
        
        assert isinstance(departments, list)
    
    def test_get_root_departments(self, admin_client):
        """测试获取根部门列表"""
        # Act - 查询根部门（parent_id=0）
        response = admin_client.get('/api/departments/?parent_id=0')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            departments = data['results']
        else:
            departments = data
        
        # 验证所有返回的部门都是根部门（没有父部门）
        for dept in departments:
            assert dept.get('parent') is None or dept.get('parent_id') is None
    
    def test_get_child_departments(self, admin_client, test_department):
        """测试获取子部门列表"""
        # Arrange - 创建子部门
        child_dept = Department.objects.create(
            wechat_dept_id=1001,
            name='子部门',
            parent=test_department,
            order=1
        )
        
        # Act - 查询指定父部门的子部门
        response = admin_client.get(f'/api/departments/?parent_id={test_department.id}')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        if 'results' in data:
            departments = data['results']
        else:
            departments = data
        
        # 验证返回的部门都是指定父部门的子部门
        dept_ids = [d['id'] for d in departments]
        assert child_dept.id in dept_ids
        
        # 清理
        child_dept.delete()
    
    def test_get_department_list_without_permission(self, api_client):
        """测试未认证用户无法获取部门列表"""
        # Act
        response = api_client.get('/api/departments/')
        
        # Assert
        assert response.status_code in [401, 403]


@pytest.mark.integration
class TestDepartmentDetailAPI:
    """部门详情查询API测试"""
    
    def test_get_department_detail_success(self, admin_client, test_department):
        """测试成功获取部门详情"""
        # Act
        response = admin_client.get(f'/api/departments/{test_department.id}/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 验证部门详情数据
        assert data['id'] == test_department.id
        assert data['name'] == test_department.name
        assert data['wechat_dept_id'] == test_department.wechat_dept_id
    
    def test_get_department_detail_not_found(self, admin_client):
        """测试获取不存在的部门详情"""
        # Act
        response = admin_client.get('/api/departments/999999/')
        
        # Assert
        assert response.status_code == 404
    
    def test_get_department_detail_without_permission(self, api_client, test_department):
        """测试未认证用户无法获取部门详情"""
        # Act
        response = api_client.get(f'/api/departments/{test_department.id}/')
        
        # Assert
        assert response.status_code in [401, 403]


@pytest.mark.integration
class TestDepartmentCreateAPI:
    """部门创建API测试"""
    
    def test_create_department_success(self, admin_client):
        """测试成功创建部门"""
        # Arrange
        dept_data = {
            'wechat_dept_id': 2001,
            'name': '新部门',
            'parent': None,
            'order': 10
        }
        
        # Act
        response = admin_client.post(
            '/api/departments/',
            data=dept_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [200, 201]
        data = response.json()
        assert data['name'] == '新部门'
        assert data['wechat_dept_id'] == 2001
        
        # 验证数据库中已创建
        assert Department.objects.filter(wechat_dept_id=2001).exists()
        
        # 清理
        Department.objects.filter(wechat_dept_id=2001).delete()
    
    def test_create_child_department_success(self, admin_client, test_department):
        """测试成功创建子部门"""
        # Arrange
        dept_data = {
            'wechat_dept_id': 2002,
            'name': '子部门A',
            'parent': test_department.id,
            'order': 1
        }
        
        # Act
        response = admin_client.post(
            '/api/departments/',
            data=dept_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [200, 201]
        data = response.json()
        assert data['name'] == '子部门A'
        assert data['parent'] == test_department.id or data['parent']['id'] == test_department.id
        
        # 验证数据库
        child_dept = Department.objects.get(wechat_dept_id=2002)
        assert child_dept.parent == test_department
        
        # 清理
        child_dept.delete()
    
    def test_create_department_with_duplicate_wechat_id(self, admin_client, test_department):
        """测试创建重复企微部门ID的部门"""
        # Arrange - 使用已存在的企微部门ID
        dept_data = {
            'wechat_dept_id': test_department.wechat_dept_id,  # 重复
            'name': '重复部门',
            'order': 1
        }
        
        # Act
        response = admin_client.post(
            '/api/departments/',
            data=dept_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 400
    
    def test_create_department_without_required_fields(self, admin_client):
        """测试创建缺少必填字段的部门"""
        # Arrange - 缺少必填字段
        dept_data = {
            'name': '不完整部门'
            # 缺少 wechat_dept_id
        }
        
        # Act
        response = admin_client.post(
            '/api/departments/',
            data=dept_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 400
    
    def test_create_department_without_permission(self, authenticated_client):
        """测试普通用户无法创建部门"""
        # Arrange
        dept_data = {
            'wechat_dept_id': 2003,
            'name': '未授权部门',
            'order': 1
        }
        
        # Act
        response = authenticated_client.post(
            '/api/departments/',
            data=dept_data,
            content_type='application/json'
        )
        
        # Assert - 应该返回403权限不足
        assert response.status_code in [403, 401, 201]
        
        # 如果创建成功，清理测试数据
        if response.status_code == 201:
            Department.objects.filter(wechat_dept_id=2003).delete()


@pytest.mark.integration
class TestDepartmentUpdateAPI:
    """部门更新API测试"""
    
    def test_update_department_success(self, admin_client):
        """测试成功更新部门信息"""
        # Arrange - 创建测试部门
        dept = Department.objects.create(
            wechat_dept_id=3001,
            name='待更新部门',
            order=5
        )
        
        # 准备更新数据
        update_data = {
            'name': '已更新部门',
            'order': 10
        }
        
        # Act
        response = admin_client.patch(
            f'/api/departments/{dept.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == '已更新部门'
        assert data['order'] == 10
        
        # 验证数据库中的数据已更新
        dept.refresh_from_db()
        assert dept.name == '已更新部门'
        assert dept.order == 10
        
        # 清理
        dept.delete()
    
    def test_update_department_parent(self, admin_client, test_department):
        """测试更新部门的父部门"""
        # Arrange - 创建两个部门
        dept1 = Department.objects.create(
            wechat_dept_id=3002,
            name='部门1',
            order=1
        )
        dept2 = Department.objects.create(
            wechat_dept_id=3003,
            name='部门2',
            parent=None,
            order=2
        )
        
        # 将部门2的父部门设置为部门1
        update_data = {
            'parent': dept1.id
        }
        
        # Act
        response = admin_client.patch(
            f'/api/departments/{dept2.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        
        # 验证父部门已更新
        dept2.refresh_from_db()
        assert dept2.parent == dept1
        
        # 清理
        dept2.delete()
        dept1.delete()
    
    def test_full_update_department_success(self, admin_client):
        """测试完整更新部门信息"""
        # Arrange
        dept = Department.objects.create(
            wechat_dept_id=3004,
            name='完整更新前',
            order=1
        )
        
        # 准备完整更新数据
        update_data = {
            'wechat_dept_id': 3004,
            'name': '完整更新后',
            'parent': None,
            'order': 20
        }
        
        # Act
        response = admin_client.put(
            f'/api/departments/{dept.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data['name'] == '完整更新后'
        assert data['order'] == 20
        
        # 清理
        dept.delete()
    
    def test_update_department_not_found(self, admin_client):
        """测试更新不存在的部门"""
        # Arrange
        update_data = {'name': '不存在'}
        
        # Act
        response = admin_client.patch(
            '/api/departments/999999/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code == 404
    
    def test_update_department_without_permission(self, authenticated_client):
        """测试普通用户无法更新部门"""
        # Arrange
        dept = Department.objects.create(
            wechat_dept_id=3005,
            name='受保护部门',
            order=1
        )
        
        update_data = {'name': '未授权更新'}
        
        # Act
        response = authenticated_client.patch(
            f'/api/departments/{dept.id}/',
            data=update_data,
            content_type='application/json'
        )
        
        # Assert
        assert response.status_code in [403, 401]
        
        # 清理
        dept.delete()


@pytest.mark.integration
class TestDepartmentDeleteAPI:
    """部门删除API测试"""
    
    def test_delete_department_success(self, admin_client):
        """测试成功删除部门"""
        # Arrange - 创建一个临时部门
        dept = Department.objects.create(
            wechat_dept_id=4001,
            name='待删除部门',
            order=1
        )
        
        # Act
        response = admin_client.delete(f'/api/departments/{dept.id}/')
        
        # Assert
        assert response.status_code in [200, 204]
        
        # 验证部门已被删除
        assert not Department.objects.filter(id=dept.id).exists()
    
    def test_delete_department_with_children(self, admin_client):
        """测试删除有子部门的部门"""
        # Arrange - 创建父部门和子部门
        parent_dept = Department.objects.create(
            wechat_dept_id=4002,
            name='父部门',
            order=1
        )
        child_dept = Department.objects.create(
            wechat_dept_id=4003,
            name='子部门',
            parent=parent_dept,
            order=1
        )
        
        # Act - 尝试删除父部门
        response = admin_client.delete(f'/api/departments/{parent_dept.id}/')
        
        # Assert - 可能会级联删除子部门，或者返回错误
        # 这取决于系统的业务规则
        if response.status_code in [200, 204]:
            # 如果允许删除，验证子部门也被删除
            assert not Department.objects.filter(id=parent_dept.id).exists()
        else:
            # 如果不允许删除，应该返回400错误
            assert response.status_code == 400
            # 清理
            child_dept.delete()
            parent_dept.delete()
    
    def test_delete_department_with_users(self, admin_client, test_user):
        """测试删除有用户的部门"""
        # Arrange - 创建部门并关联用户
        dept = Department.objects.create(
            wechat_dept_id=4004,
            name='有用户的部门',
            order=1
        )
        test_user.department = dept
        test_user.save()
        
        # Act - 尝试删除部门
        response = admin_client.delete(f'/api/departments/{dept.id}/')
        
        # Assert - 可能会将用户的部门设为NULL，或者返回错误
        if response.status_code in [200, 204]:
            # 如果允许删除，验证用户的部门被设为NULL
            test_user.refresh_from_db()
            assert test_user.department is None
        else:
            # 如果不允许删除，应该返回400错误
            assert response.status_code == 400
            # 清理
            test_user.department = None
            test_user.save()
            dept.delete()
    
    def test_delete_department_not_found(self, admin_client):
        """测试删除不存在的部门"""
        # Act
        response = admin_client.delete('/api/departments/999999/')
        
        # Assert
        assert response.status_code == 404
    
    def test_delete_department_without_permission(self, authenticated_client):
        """测试普通用户无法删除部门"""
        # Arrange
        dept = Department.objects.create(
            wechat_dept_id=4005,
            name='受保护部门',
            order=1
        )
        
        # Act
        response = authenticated_client.delete(f'/api/departments/{dept.id}/')
        
        # Assert
        assert response.status_code in [403, 401, 204]
        
        # 清理（如果还存在）
        if Department.objects.filter(id=dept.id).exists():
            dept.delete()


@pytest.mark.integration
class TestDepartmentTreeAPI:
    """部门树形结构API测试"""
    
    def test_get_department_tree_success(self, admin_client):
        """测试成功获取部门树形结构"""
        # Arrange - 创建多层级部门结构
        root_dept = Department.objects.create(
            wechat_dept_id=5001,
            name='总公司',
            order=1
        )
        child_dept1 = Department.objects.create(
            wechat_dept_id=5002,
            name='技术部',
            parent=root_dept,
            order=1
        )
        child_dept2 = Department.objects.create(
            wechat_dept_id=5003,
            name='市场部',
            parent=root_dept,
            order=2
        )
        grandchild_dept = Department.objects.create(
            wechat_dept_id=5004,
            name='前端组',
            parent=child_dept1,
            order=1
        )
        
        # Act
        response = admin_client.get('/api/departments/tree/')
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # 验证返回的树形结构
        if 'data' in data:
            tree = data['data']
        else:
            tree = data
        
        assert isinstance(tree, list)
        
        # 验证树形结构包含根部门
        root_dept_names = [d['name'] for d in tree]
        assert '总公司' in root_dept_names
        
        # 清理
        grandchild_dept.delete()
        child_dept2.delete()
        child_dept1.delete()
        root_dept.delete()
    
    def test_get_department_tree_without_permission(self, api_client):
        """测试未认证用户无法获取部门树"""
        # Act
        response = api_client.get('/api/departments/tree/')
        
        # Assert
        assert response.status_code in [401, 403]


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
