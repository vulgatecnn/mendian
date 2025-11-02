# 审计日志使用指南

## 概述

审计日志服务提供了完整的操作审计功能，自动记录系统中的关键操作，包括：
- 用户的创建、更新、删除、启用、停用
- 角色的创建、更新、删除
- 权限的分配
- 角色成员的管理

## 核心组件

### 1. AuditLogger 类

位于 `services/audit_service.py`，提供审计日志记录功能。

#### 主要方法

```python
from system_management.services.audit_service import AuditLogger

# 通用日志记录
AuditLogger.log(
    request=request,
    action='create',
    target_type='user',
    target_id=user.id,
    details={'username': 'test_user'}
)

# 便捷方法
AuditLogger.log_user_create(request, user_id, details)
AuditLogger.log_user_update(request, user_id, details)
AuditLogger.log_user_enable(request, user_id, details)
AuditLogger.log_user_disable(request, user_id, details)
AuditLogger.log_role_create(request, role_id, details)
AuditLogger.log_role_update(request, role_id, details)
AuditLogger.log_role_delete(request, role_id, details)
AuditLogger.log_role_assign(request, user_id, details)
AuditLogger.log_permission_assign(request, role_id, details)
```

#### 操作类型常量

```python
ACTION_CREATE = 'create'    # 创建
ACTION_UPDATE = 'update'    # 更新
ACTION_DELETE = 'delete'    # 删除
ACTION_ENABLE = 'enable'    # 启用
ACTION_DISABLE = 'disable'  # 停用
ACTION_ASSIGN = 'assign'    # 分配
ACTION_REMOVE = 'remove'    # 移除
ACTION_LOGIN = 'login'      # 登录
ACTION_LOGOUT = 'logout'    # 登出
```

#### 目标类型常量

```python
TARGET_USER = 'user'              # 用户
TARGET_ROLE = 'role'              # 角色
TARGET_PERMISSION = 'permission'  # 权限
TARGET_DEPARTMENT = 'department'  # 部门
```

### 2. AuditLogMixin 混入类

位于 `mixins.py`，为 ViewSet 提供自动审计日志记录功能。

#### 使用方法

```python
from rest_framework import viewsets
from system_management.mixins import AuditLogMixin
from system_management.services.audit_service import AuditLogger

class MyViewSet(AuditLogMixin, viewsets.ModelViewSet):
    # 设置目标类型
    audit_target_type = AuditLogger.TARGET_USER
    
    # 可选：自定义审计详情
    def get_audit_details(self, instance, action):
        return {
            'name': instance.name,
            'custom_field': instance.custom_field
        }
```

混入类会自动在以下操作中记录审计日志：
- `create()` - 创建对象
- `update()` - 更新对象
- `destroy()` - 删除对象

### 3. IP地址获取

`AuditLogger.get_client_ip(request)` 方法会自动处理以下场景：
- 直接访问：从 `REMOTE_ADDR` 获取
- 通过代理/负载均衡：从 `X-Forwarded-For` 头获取真实IP

## 使用示例

### 示例1：在ViewSet中使用混入类

```python
from rest_framework import viewsets
from system_management.mixins import AuditLogMixin
from system_management.services.audit_service import AuditLogger
from .models import Role
from .serializers import RoleSerializer

class RoleViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    audit_target_type = AuditLogger.TARGET_ROLE
    
    def get_audit_details(self, instance, action):
        """自定义审计日志详情"""
        return {
            'name': instance.name,
            'description': instance.description,
            'member_count': instance.get_member_count()
        }
```

### 示例2：在自定义操作中记录日志

```python
from rest_framework.decorators import action
from rest_framework.response import Response
from system_management.services.audit_service import AuditLogger

class UserViewSet(viewsets.ModelViewSet):
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """启用/停用用户"""
        user = self.get_object()
        old_status = user.is_active
        
        # 执行业务逻辑
        user.is_active = not user.is_active
        user.save()
        
        # 记录审计日志
        action_type = AuditLogger.ACTION_ENABLE if user.is_active else AuditLogger.ACTION_DISABLE
        details = {
            'username': user.username,
            'old_status': '启用' if old_status else '停用',
            'new_status': '启用' if user.is_active else '停用',
        }
        
        AuditLogger.log(
            request=request,
            action=action_type,
            target_type=AuditLogger.TARGET_USER,
            target_id=user.id,
            details=details
        )
        
        return Response({'message': '操作成功'})
```

### 示例3：角色分配操作

```python
@action(detail=True, methods=['post'])
def assign_roles(self, request, pk=None):
    """分配角色"""
    user = self.get_object()
    role_ids = request.data.get('role_ids', [])
    
    # 记录旧角色
    old_roles = list(user.roles.values_list('id', 'name'))
    
    # 执行角色分配
    user.roles.clear()
    if role_ids:
        roles = Role.objects.filter(id__in=role_ids)
        user.roles.add(*roles)
    
    # 获取新角色
    new_roles = list(user.roles.values_list('id', 'name'))
    
    # 记录审计日志
    details = {
        'username': user.username,
        'old_roles': [{'id': r[0], 'name': r[1]} for r in old_roles],
        'new_roles': [{'id': r[0], 'name': r[1]} for r in new_roles],
    }
    
    AuditLogger.log_role_assign(
        request=request,
        user_id=user.id,
        details=details
    )
    
    return Response({'message': '角色分配成功'})
```

### 示例4：权限分配操作

```python
@action(detail=True, methods=['post'])
def assign_permissions(self, request, pk=None):
    """分配权限"""
    role = self.get_object()
    permission_codes = request.data.get('permission_codes', [])
    
    # 记录旧权限
    old_permissions = list(role.permissions.values_list('code', 'name'))
    
    # 执行权限分配
    role.permissions.clear()
    if permission_codes:
        permissions = Permission.objects.filter(code__in=permission_codes)
        role.permissions.add(*permissions)
    
    # 获取新权限
    new_permissions = list(role.permissions.values_list('code', 'name'))
    
    # 记录审计日志
    details = {
        'role_name': role.name,
        'old_permissions': [{'code': p[0], 'name': p[1]} for p in old_permissions],
        'new_permissions': [{'code': p[0], 'name': p[1]} for p in new_permissions],
    }
    
    AuditLogger.log_permission_assign(
        request=request,
        role_id=role.id,
        details=details
    )
    
    return Response({'message': '权限分配成功'})
```

## 审计日志数据结构

审计日志记录包含以下字段：

```python
{
    'id': 1,                          # 日志ID
    'user': User对象,                  # 操作人（可为空）
    'action': 'create',               # 操作类型
    'target_type': 'user',            # 操作对象类型
    'target_id': 123,                 # 操作对象ID
    'details': {                      # 操作详情（JSON格式）
        'username': 'test_user',
        'custom_field': 'value'
    },
    'ip_address': '192.168.1.100',   # 操作IP地址
    'created_at': '2024-01-01 12:00:00'  # 操作时间
}
```

## 查询审计日志

```python
from system_management.models import AuditLog

# 查询所有日志
logs = AuditLog.objects.all()

# 按用户查询
user_logs = AuditLog.objects.filter(user=user)

# 按操作类型查询
create_logs = AuditLog.objects.filter(action='create')

# 按目标类型查询
user_logs = AuditLog.objects.filter(target_type='user')

# 按时间范围查询
from datetime import datetime, timedelta
recent_logs = AuditLog.objects.filter(
    created_at__gte=datetime.now() - timedelta(days=7)
)

# 组合查询
logs = AuditLog.objects.filter(
    user=user,
    action='update',
    target_type='role',
    created_at__gte=datetime.now() - timedelta(days=30)
).order_by('-created_at')
```

## 最佳实践

1. **记录关键操作**：确保所有涉及数据修改的关键操作都记录审计日志
2. **详情信息完整**：在 `details` 字段中记录足够的信息，便于后续审计
3. **使用便捷方法**：优先使用 `AuditLogger` 提供的便捷方法，保持代码一致性
4. **使用混入类**：对于标准的 CRUD 操作，使用 `AuditLogMixin` 自动记录日志
5. **记录变更前后状态**：对于更新操作，记录变更前后的状态对比

## 注意事项

1. 审计日志会自动记录操作人和IP地址，无需手动传入
2. `details` 字段存储为 JSON 格式，可以包含任意结构的数据
3. 审计日志保留期限为365天（通过定时任务清理）
4. 删除用户后，其审计日志仍会保留（user字段设置为NULL）

## 完整示例

参考 `views_with_audit.py` 文件，其中包含了完整的用户管理和角色管理ViewSet示例，展示了如何在各种业务操作中集成审计日志。

