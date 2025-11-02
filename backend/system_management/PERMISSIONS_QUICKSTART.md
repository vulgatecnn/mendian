# 权限控制快速入门

## 概述

任务 4 "实现权限控制中间件" 已完成，包括以下功能：

✅ **子任务 4.1** - 创建权限验证中间件  
✅ **子任务 4.2** - 实现权限装饰器  
✅ **子任务 4.3** - 扩展 User 模型添加权限方法  

## 实现的功能

### 1. 权限验证中间件 (`PermissionMiddleware`)

- 自动加载用户权限到每个请求
- 使用缓存提高性能（30分钟过期）
- 将权限附加到 `request.user_permissions`

**配置位置**: `store_lifecycle/settings.py`

```python
MIDDLEWARE = [
    # ... 其他中间件
    'system_management.permissions.PermissionMiddleware',  # 已添加
]
```

### 2. 权限装饰器 (`@permission_required`)

保护视图函数和 API 端点的装饰器。

**使用示例**:

```python
from system_management.permissions import permission_required

@permission_required('system.user.view')
def user_list(request):
    # 只有具有 'system.user.view' 权限的用户才能访问
    pass
```

**行为**:
- 未认证用户 → 返回 401
- 无权限用户 → 返回 403
- 有权限用户 → 正常执行

### 3. User 模型权限方法

扩展了 User 模型，添加了以下方法：

#### `has_permission(permission_code)`
检查用户是否具有指定权限（带缓存）

```python
if user.has_permission('system.user.view'):
    # 用户有权限
    pass
```

#### `get_permissions()`
获取用户所有权限对象（QuerySet）

```python
permissions = user.get_permissions()
```

#### `get_permission_codes()`
获取用户所有权限编码集合（带缓存）

```python
codes = user.get_permission_codes()
# 返回: {'system.user.view', 'system.user.create', ...}
```

#### `clear_permission_cache()`
清除用户权限缓存

```python
user.clear_permission_cache()
```

### 4. Role 模型自动缓存管理

Role 模型的以下方法会自动清除相关用户的权限缓存：

- `add_permissions(permission_codes)` - 添加权限
- `remove_permissions(permission_codes)` - 移除权限
- `add_users(user_ids)` - 添加用户成员
- `remove_users(user_ids)` - 移除用户成员

## 文件清单

### 新增文件

1. **`backend/system_management/permissions.py`**
   - 权限验证中间件
   - 权限装饰器
   - 权限检查辅助函数

2. **`backend/system_management/test_permissions.py`**
   - 12 个测试用例（全部通过 ✅）
   - 测试覆盖所有权限控制功能

3. **`backend/system_management/PERMISSIONS.md`**
   - 完整的权限控制使用指南
   - 包含详细示例和最佳实践

4. **`backend/system_management/example_views.py`**
   - 6 个实际使用示例
   - 展示不同场景下的权限控制

5. **`backend/system_management/PERMISSIONS_QUICKSTART.md`**
   - 本文档（快速入门指南）

### 修改文件

1. **`backend/system_management/models.py`**
   - 扩展 User 模型的权限方法
   - 添加权限缓存机制
   - 扩展 Role 模型的缓存管理

2. **`backend/store_lifecycle/settings.py`**
   - 添加权限验证中间件到 MIDDLEWARE 配置

## 测试结果

所有 12 个测试用例全部通过：

```bash
python manage.py test system_management.test_permissions

Ran 12 tests in 12.073s
OK ✅
```

测试覆盖：
- ✅ 用户权限检查
- ✅ 超级管理员权限
- ✅ 获取用户权限
- ✅ 权限缓存机制
- ✅ 角色权限管理
- ✅ 权限中间件
- ✅ 权限装饰器
- ✅ 停用角色处理

## 快速使用

### 1. 在视图中使用装饰器

```python
from system_management.permissions import permission_required

@permission_required('system.user.view')
def user_list(request):
    users = User.objects.all()
    return JsonResponse({'users': list(users.values())})
```

### 2. 在 ViewSet 中使用

```python
from rest_framework import viewsets
from system_management.permissions import permission_required

class UserViewSet(viewsets.ModelViewSet):
    
    @permission_required('system.user.view')
    def list(self, request):
        return super().list(request)
    
    @permission_required('system.user.create')
    def create(self, request):
        return super().create(request)
```

### 3. 手动检查权限

```python
def my_view(request):
    if not request.user.has_permission('system.user.view'):
        return JsonResponse({'error': '权限不足'}, status=403)
    
    # 视图逻辑
    pass
```

### 4. 使用中间件加载的权限

```python
def my_view(request):
    # 使用中间件加载的权限（无需数据库查询）
    if 'system.user.view' in request.user_permissions:
        # 用户有权限
        pass
```

## 权限编码规范

采用点分隔的命名规范：`模块.资源.操作`

```
system.user.view       # 系统管理 - 用户 - 查看
system.user.create     # 系统管理 - 用户 - 创建
system.user.update     # 系统管理 - 用户 - 更新
system.user.delete     # 系统管理 - 用户 - 删除
system.role.view       # 系统管理 - 角色 - 查看
system.dept.view       # 系统管理 - 部门 - 查看
```

## 性能优化

### 缓存策略
- **缓存键**: `user_permissions_{user_id}`
- **缓存时间**: 30 分钟
- **自动清除**: 角色/权限变更时自动清除

### 最佳实践

1. **使用装饰器**（推荐）
   ```python
   @permission_required('system.user.view')
   def my_view(request):
       pass
   ```

2. **批量检查权限**
   ```python
   # 一次获取所有权限
   permissions = user.get_permission_codes()
   
   # 多次检查
   if 'perm1' in permissions:
       pass
   if 'perm2' in permissions:
       pass
   ```

3. **使用中间件加载的权限**
   ```python
   # 无需额外数据库查询
   if 'system.user.view' in request.user_permissions:
       pass
   ```

## 下一步

权限控制中间件已完成，可以继续实现：

- **任务 5**: 实现审计日志服务
- **任务 6**: 实现部门管理 API
- **任务 7**: 实现用户管理 API
- **任务 8**: 实现角色管理 API

这些任务可以使用已实现的权限控制功能来保护 API 端点。

## 相关文档

- **详细使用指南**: `PERMISSIONS.md`
- **使用示例**: `example_views.py`
- **测试文件**: `test_permissions.py`

## 支持

如有问题，请查看：
1. `PERMISSIONS.md` - 完整使用指南
2. `example_views.py` - 实际使用示例
3. `test_permissions.py` - 测试用例参考
