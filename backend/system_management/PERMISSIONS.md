# 权限控制使用指南

本文档说明如何在系统中使用权限控制功能。

## 概述

系统实现了基于角色的访问控制（RBAC）模型，包括：
- 权限验证中间件：自动加载用户权限
- 权限装饰器：保护视图函数
- 用户权限方法：检查和获取用户权限
- 权限缓存机制：提高性能

## 权限验证中间件

权限验证中间件 `PermissionMiddleware` 已在 `settings.py` 中配置，会在每个请求处理前自动加载用户权限信息。

### 工作原理

1. 检查用户是否已认证
2. 从缓存或数据库加载用户权限
3. 将权限信息附加到 `request.user_permissions` 属性
4. 缓存权限信息 30 分钟

### 配置

中间件已在 `store_lifecycle/settings.py` 中配置：

```python
MIDDLEWARE = [
    # ... 其他中间件
    'system_management.permissions.PermissionMiddleware',  # 权限验证中间件
]
```

## 权限装饰器

使用 `@permission_required` 装饰器保护视图函数或 API 端点。

### 基本用法

```python
from system_management.permissions import permission_required

@permission_required('system.user.view')
def user_list(request):
    """用户列表视图 - 需要 'system.user.view' 权限"""
    # 视图逻辑
    pass

@permission_required('system.user.create')
def user_create(request):
    """创建用户视图 - 需要 'system.user.create' 权限"""
    # 视图逻辑
    pass
```

### 在 DRF ViewSet 中使用

```python
from rest_framework import viewsets
from system_management.permissions import permission_required

class UserViewSet(viewsets.ModelViewSet):
    """用户管理 ViewSet"""
    
    @permission_required('system.user.view')
    def list(self, request):
        """列表视图"""
        return super().list(request)
    
    @permission_required('system.user.create')
    def create(self, request):
        """创建视图"""
        return super().create(request)
    
    @permission_required('system.user.update')
    def update(self, request, pk=None):
        """更新视图"""
        return super().update(request, pk)
    
    @permission_required('system.user.delete')
    def destroy(self, request, pk=None):
        """删除视图"""
        return super().destroy(request, pk)
```

### 装饰器行为

- **未认证用户**：返回 401 错误
- **无权限用户**：返回 403 错误
- **有权限用户**：正常执行视图函数

## User 模型权限方法

User 模型提供了多个权限相关方法。

### has_permission(permission_code)

检查用户是否具有指定权限。

```python
user = request.user

# 检查单个权限
if user.has_permission('system.user.view'):
    # 用户有查看用户的权限
    pass

# 超级管理员自动拥有所有权限
if user.is_superuser:
    # 所有权限检查都返回 True
    pass
```

### get_permissions()

获取用户所有权限对象（QuerySet）。

```python
user = request.user

# 获取所有权限对象
permissions = user.get_permissions()

# 遍历权限
for perm in permissions:
    print(f"{perm.name}: {perm.code}")
```

### get_permission_codes()

获取用户所有权限编码集合。

```python
user = request.user

# 获取权限编码集合
permission_codes = user.get_permission_codes()
# 返回: {'system.user.view', 'system.user.create', ...}

# 检查权限
if 'system.user.view' in permission_codes:
    # 用户有该权限
    pass
```

### clear_permission_cache()

清除用户权限缓存。

```python
user = request.user

# 当用户角色或权限变更时，清除缓存
user.clear_permission_cache()
```

## Role 模型权限管理

Role 模型提供了权限和成员管理方法，会自动清除相关用户的权限缓存。

### 添加权限

```python
role = Role.objects.get(name='系统管理员')

# 添加权限（自动清除相关用户缓存）
role.add_permissions(['system.user.view', 'system.user.create'])
```

### 移除权限

```python
role = Role.objects.get(name='系统管理员')

# 移除权限（自动清除相关用户缓存）
role.remove_permissions(['system.user.delete'])
```

### 添加用户成员

```python
role = Role.objects.get(name='系统管理员')

# 添加用户（自动清除用户缓存）
role.add_users([user1.id, user2.id])
```

### 移除用户成员

```python
role = Role.objects.get(name='系统管理员')

# 移除用户（自动清除用户缓存）
role.remove_users([user1.id])
```

## 权限编码规范

权限编码采用点分隔的命名规范：`模块.资源.操作`

### 示例

```
system.user.view       # 系统管理 - 用户 - 查看
system.user.create     # 系统管理 - 用户 - 创建
system.user.update     # 系统管理 - 用户 - 更新
system.user.delete     # 系统管理 - 用户 - 删除
system.role.view       # 系统管理 - 角色 - 查看
system.role.create     # 系统管理 - 角色 - 创建
system.dept.view       # 系统管理 - 部门 - 查看
store.plan.view        # 门店管理 - 计划 - 查看
store.plan.create      # 门店管理 - 计划 - 创建
```

## 缓存机制

### 缓存策略

- **缓存键**：`user_permissions_{user_id}`
- **缓存时间**：30 分钟（1800 秒）
- **缓存内容**：用户的所有权限编码集合

### 自动缓存清除

以下操作会自动清除相关用户的权限缓存：

1. 角色添加/移除权限
2. 用户添加/移除角色
3. 调用 `user.clear_permission_cache()`

### 手动清除缓存

```python
from django.core.cache import cache

# 清除单个用户的权限缓存
cache_key = f'user_permissions_{user_id}'
cache.delete(cache_key)

# 清除所有缓存
cache.clear()
```

## 在视图中检查权限

### 方法 1：使用装饰器（推荐）

```python
from system_management.permissions import permission_required

@permission_required('system.user.view')
def user_list(request):
    # 自动验证权限
    pass
```

### 方法 2：手动检查

```python
def user_list(request):
    if not request.user.has_permission('system.user.view'):
        return JsonResponse({'error': '权限不足'}, status=403)
    
    # 视图逻辑
    pass
```

### 方法 3：在视图中使用权限集合

```python
def dashboard(request):
    user_permissions = request.user_permissions
    
    # 根据权限显示不同内容
    context = {
        'can_view_users': 'system.user.view' in user_permissions,
        'can_create_users': 'system.user.create' in user_permissions,
    }
    
    return render(request, 'dashboard.html', context)
```

## 前端权限控制

前端可以通过 API 获取当前用户的权限列表，然后根据权限控制菜单和按钮的显示。

### API 端点示例

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def get_user_permissions(request):
    """获取当前用户的权限列表"""
    if not request.user.is_authenticated:
        return Response({'error': '未认证'}, status=401)
    
    permission_codes = list(request.user.get_permission_codes())
    
    return Response({
        'permissions': permission_codes,
        'is_superuser': request.user.is_superuser
    })
```

### 前端使用示例

```typescript
// 获取用户权限
const permissions = await fetchUserPermissions();

// 检查权限
const canViewUsers = permissions.includes('system.user.view');
const canCreateUsers = permissions.includes('system.user.create');

// 根据权限显示按钮
{canCreateUsers && <Button>创建用户</Button>}
```

## 性能优化

### 1. 使用缓存

权限信息会自动缓存 30 分钟，减少数据库查询。

### 2. 批量检查权限

```python
# 不推荐：多次查询
if user.has_permission('perm1'):
    pass
if user.has_permission('perm2'):
    pass

# 推荐：一次获取所有权限
permissions = user.get_permission_codes()
if 'perm1' in permissions:
    pass
if 'perm2' in permissions:
    pass
```

### 3. 使用中间件加载的权限

```python
# 中间件已加载权限到 request.user_permissions
def my_view(request):
    if 'system.user.view' in request.user_permissions:
        # 不需要额外查询
        pass
```

## 安全注意事项

1. **始终在后端验证权限**：前端权限控制只是 UI 优化，不能替代后端验证
2. **使用装饰器保护所有敏感操作**：确保所有需要权限的视图都有权限验证
3. **定期审计权限配置**：检查角色和权限的分配是否合理
4. **记录权限验证失败**：系统会自动记录权限验证失败的日志

## 故障排查

### 权限验证失败

1. 检查用户是否已认证
2. 检查用户是否有对应的角色
3. 检查角色是否有对应的权限
4. 检查角色是否处于启用状态
5. 清除权限缓存后重试

### 权限缓存未更新

```python
# 手动清除用户权限缓存
user.clear_permission_cache()

# 或清除所有缓存
from django.core.cache import cache
cache.clear()
```

### 查看日志

权限验证失败会记录到日志：

```
WARNING: 权限验证失败: 用户=admin, 权限=system.user.delete
```

## 示例：完整的权限控制流程

```python
# 1. 创建权限
permission = Permission.objects.create(
    code='system.user.view',
    name='查看用户',
    module='系统管理',
    description='查看用户列表和详情'
)

# 2. 创建角色并分配权限
role = Role.objects.create(
    name='用户管理员',
    description='负责用户管理'
)
role.add_permissions(['system.user.view', 'system.user.create'])

# 3. 为用户分配角色
role.add_users([user.id])

# 4. 在视图中使用权限验证
@permission_required('system.user.view')
def user_list(request):
    # 只有具有 'system.user.view' 权限的用户才能访问
    users = User.objects.all()
    return JsonResponse({'users': list(users.values())})

# 5. 手动检查权限
if request.user.has_permission('system.user.create'):
    # 用户可以创建用户
    pass
```

## 总结

权限控制系统提供了完整的 RBAC 实现，包括：

- ✅ 自动权限加载（中间件）
- ✅ 装饰器保护视图
- ✅ 灵活的权限检查方法
- ✅ 自动缓存管理
- ✅ 性能优化
- ✅ 安全日志记录

使用这些功能可以轻松实现细粒度的权限控制，保护系统安全。
