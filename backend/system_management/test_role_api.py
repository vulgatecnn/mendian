"""
角色管理 API 测试脚本

使用方法：
1. 确保 Django 服务器正在运行
2. 运行: python manage.py shell < test_role_api.py
"""

from system_management.models import Role, Permission, User, Department
from system_management.serializers import RoleSerializer, PermissionSerializer
from django.contrib.auth import get_user_model

print("=" * 60)
print("角色管理 API 测试")
print("=" * 60)

# 1. 测试权限序列化器
print("\n1. 测试权限序列化器")
print("-" * 60)

# 创建测试权限
permission1, _ = Permission.objects.get_or_create(
    code='test.permission.view',
    defaults={
        'name': '测试查看权限',
        'module': '测试模块',
        'description': '用于测试的查看权限'
    }
)

permission2, _ = Permission.objects.get_or_create(
    code='test.permission.manage',
    defaults={
        'name': '测试管理权限',
        'module': '测试模块',
        'description': '用于测试的管理权限'
    }
)

print(f"✓ 创建测试权限: {permission1.name}, {permission2.name}")

# 序列化权限
perm_serializer = PermissionSerializer(permission1)
print(f"✓ 权限序列化结果: {perm_serializer.data}")

# 2. 测试角色序列化器 - 创建
print("\n2. 测试角色序列化器 - 创建")
print("-" * 60)

role_data = {
    'name': '测试角色',
    'description': '这是一个测试角色',
    'is_active': True,
    'permission_ids': [permission1.id, permission2.id]
}

role_serializer = RoleSerializer(data=role_data)
if role_serializer.is_valid():
    role = role_serializer.save()
    print(f"✓ 角色创建成功: {role.name} (ID: {role.id})")
    print(f"  - 权限数量: {role.permissions.count()}")
    print(f"  - 成员数量: {role.get_member_count()}")
else:
    print(f"✗ 角色创建失败: {role_serializer.errors}")

# 3. 测试角色序列化器 - 读取
print("\n3. 测试角色序列化器 - 读取")
print("-" * 60)

role = Role.objects.filter(name='测试角色').first()
if role:
    role_serializer = RoleSerializer(role)
    print(f"✓ 角色读取成功:")
    print(f"  - ID: {role_serializer.data['id']}")
    print(f"  - 名称: {role_serializer.data['name']}")
    print(f"  - 描述: {role_serializer.data['description']}")
    print(f"  - 权限数量: {len(role_serializer.data['permission_list'])}")
    print(f"  - 成员数量: {role_serializer.data['member_count']}")
else:
    print("✗ 角色不存在")

# 4. 测试角色模型方法
print("\n4. 测试角色模型方法")
print("-" * 60)

if role:
    # 测试 is_in_use
    print(f"✓ 角色是否被使用: {role.is_in_use()}")
    
    # 测试 get_member_count
    print(f"✓ 角色成员数量: {role.get_member_count()}")
    
    # 创建测试用户并添加到角色
    User = get_user_model()
    
    # 创建测试部门
    dept, _ = Department.objects.get_or_create(
        wechat_dept_id=999999,
        defaults={
            'name': '测试部门',
            'order': 0
        }
    )
    
    # 创建测试用户
    test_user, created = User.objects.get_or_create(
        username='test_role_user',
        defaults={
            'phone': '13900000001',
            'wechat_user_id': 'test_role_user_001',
            'department': dept,
            'is_active': True
        }
    )
    
    if created:
        print(f"✓ 创建测试用户: {test_user.username}")
    else:
        print(f"✓ 使用已存在的测试用户: {test_user.username}")
    
    # 添加用户到角色
    role.add_users([test_user.id])
    print(f"✓ 添加用户到角色")
    print(f"  - 角色成员数量: {role.get_member_count()}")
    print(f"  - 角色是否被使用: {role.is_in_use()}")
    
    # 测试用户权限
    print(f"✓ 用户权限测试:")
    print(f"  - 用户是否有 test.permission.view 权限: {test_user.has_permission('test.permission.view')}")
    print(f"  - 用户是否有 test.permission.manage 权限: {test_user.has_permission('test.permission.manage')}")
    print(f"  - 用户是否有不存在的权限: {test_user.has_permission('test.permission.notexist')}")

# 5. 测试角色序列化器 - 更新
print("\n5. 测试角色序列化器 - 更新")
print("-" * 60)

if role:
    update_data = {
        'name': '测试角色（已更新）',
        'description': '这是一个更新后的测试角色',
        'is_active': True,
        'permission_ids': [permission1.id]  # 只保留一个权限
    }
    
    role_serializer = RoleSerializer(role, data=update_data)
    if role_serializer.is_valid():
        updated_role = role_serializer.save()
        print(f"✓ 角色更新成功: {updated_role.name}")
        print(f"  - 权限数量: {updated_role.permissions.count()}")
    else:
        print(f"✗ 角色更新失败: {role_serializer.errors}")

# 6. 清理测试数据
print("\n6. 清理测试数据")
print("-" * 60)

try:
    # 移除用户角色关联
    if role and test_user:
        role.users.remove(test_user)
        print(f"✓ 移除用户角色关联")
    
    # 删除测试角色
    if role:
        role_name = role.name
        role.delete()
        print(f"✓ 删除测试角色: {role_name}")
    
    # 删除测试用户
    if test_user:
        test_user.delete()
        print(f"✓ 删除测试用户: test_role_user")
    
    # 删除测试部门
    if dept:
        dept.delete()
        print(f"✓ 删除测试部门: 测试部门")
    
    # 删除测试权限
    permission1.delete()
    permission2.delete()
    print(f"✓ 删除测试权限")
    
except Exception as e:
    print(f"✗ 清理失败: {e}")

print("\n" + "=" * 60)
print("测试完成！")
print("=" * 60)
