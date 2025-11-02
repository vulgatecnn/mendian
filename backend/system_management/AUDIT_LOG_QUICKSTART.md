# 审计日志 API 快速入门

## 概述

审计日志 API 已实现，提供系统操作日志的查询功能。本文档帮助你快速开始使用审计日志 API。

## 实现内容

### 1. 审计日志序列化器（AuditLogSerializer）

**位置**: `backend/system_management/serializers.py`

**功能**:
- 序列化审计日志数据
- 嵌套序列化操作人信息（UserSimpleSerializer）
- 提供操作人用户名和全名的快速访问字段

**字段**:
- `id`: 日志ID
- `user`: 操作人用户ID
- `user_info`: 操作人详细信息（嵌套对象）
- `username`: 操作人用户名
- `user_full_name`: 操作人全名
- `action`: 操作类型
- `target_type`: 操作对象类型
- `target_id`: 操作对象ID
- `details`: 操作详情（JSON）
- `ip_address`: IP地址
- `created_at`: 操作时间

### 2. 审计日志 ViewSet（AuditLogViewSet）

**位置**: `backend/system_management/views.py`

**功能**:
- 只读 ViewSet（继承自 ReadOnlyModelViewSet）
- 支持列表查询和详情查询
- 支持多种筛选条件
- 支持分页
- 权限验证（仅管理员可访问）

**支持的筛选条件**:
- `user_id`: 按操作人ID筛选
- `username`: 按操作人用户名筛选（模糊查询）
- `action`: 按操作类型筛选
- `target_type`: 按操作对象类型筛选
- `start_time`: 按开始时间筛选
- `end_time`: 按结束时间筛选
- `page`: 页码
- `page_size`: 每页数量

### 3. URL 路由配置

**位置**: `backend/system_management/urls.py`

**路由**:
- `GET /api/system/audit-logs/`: 获取审计日志列表
- `GET /api/system/audit-logs/{id}/`: 获取审计日志详情

## 快速测试

### 1. 启动开发服务器

```bash
cd backend
python manage.py runserver
```

### 2. 使用测试脚本

我们提供了一个完整的测试脚本：

```bash
cd backend/system_management
python test_audit_log_api.py
```

测试脚本会执行以下测试：
- 基本查询（获取所有日志）
- 按操作类型筛选
- 按对象类型筛选
- 按时间范围筛选
- 分页测试
- 获取日志详情
- 组合筛选

### 3. 使用 curl 测试

```bash
# 获取所有审计日志
curl -X GET "http://localhost:8000/api/system/audit-logs/" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"

# 按操作类型筛选
curl -X GET "http://localhost:8000/api/system/audit-logs/?action=create" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"

# 按对象类型筛选
curl -X GET "http://localhost:8000/api/system/audit-logs/?target_type=role" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"

# 获取日志详情
curl -X GET "http://localhost:8000/api/system/audit-logs/1/" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

## 权限配置

审计日志 API 需要 `system.audit.view` 权限。确保你的测试用户具有此权限。

### 创建审计查看权限

```python
# 在 Django shell 中执行
python manage.py shell

from system_management.models import Permission

# 创建审计日志查看权限
Permission.objects.get_or_create(
    code='system.audit.view',
    defaults={
        'name': '查看审计日志',
        'module': 'system',
        'description': '允许查看系统审计日志'
    }
)
```

### 分配权限给管理员角色

```python
from system_management.models import Role, Permission

# 获取管理员角色
admin_role = Role.objects.get(name='系统管理员')

# 获取审计日志权限
audit_permission = Permission.objects.get(code='system.audit.view')

# 分配权限
admin_role.permissions.add(audit_permission)
```

## 常见使用场景

### 1. 查看最近的操作

```bash
# 获取最近24小时的操作
START_TIME=$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S)
curl -X GET "http://localhost:8000/api/system/audit-logs/?start_time=${START_TIME}" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

### 2. 审计特定用户

```bash
# 查看用户 admin 的所有操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?username=admin" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

### 3. 追踪角色变更

```bash
# 查看所有角色相关的操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?target_type=role" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

### 4. 查看权限分配记录

```bash
# 查看所有权限分配操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?action=assign_permissions" \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

## 响应示例

### 列表响应

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/system/audit-logs/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "user_info": {
        "id": 1,
        "username": "admin",
        "full_name": "系统管理员",
        "phone": "13800138000",
        "department": 1,
        "department_name": "技术部",
        "position": "系统管理员",
        "is_active": true
      },
      "username": "admin",
      "user_full_name": "系统管理员",
      "action": "create",
      "target_type": "role",
      "target_id": 5,
      "details": {
        "name": "测试角色",
        "description": "这是一个测试角色"
      },
      "ip_address": "127.0.0.1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 详情响应

```json
{
  "id": 1,
  "user": 1,
  "user_info": {
    "id": 1,
    "username": "admin",
    "full_name": "系统管理员",
    "phone": "13800138000",
    "department": 1,
    "department_name": "技术部",
    "position": "系统管理员",
    "is_active": true
  },
  "username": "admin",
  "user_full_name": "系统管理员",
  "action": "update",
  "target_type": "role",
  "target_id": 5,
  "details": {
    "old_name": "测试角色",
    "new_name": "正式角色",
    "description": "角色名称已更新"
  },
  "ip_address": "127.0.0.1",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 注意事项

1. **权限要求**: 必须具有 `system.audit.view` 权限
2. **只读接口**: 审计日志是只读的，不支持创建、修改或删除
3. **数据保留**: 默认保留365天
4. **时间格式**: 使用 ISO 8601 格式
5. **分页**: 建议使用分页，避免一次性查询大量数据

## 相关文档

- [审计日志 API 完整文档](./AUDIT_LOG_API.md)
- [审计日志服务文档](./AUDIT_LOG.md)
- [权限管理文档](./PERMISSIONS.md)

## 下一步

现在审计日志 API 已经实现，你可以：

1. 在前端实现审计日志查询界面
2. 配置审计日志权限
3. 测试各种筛选条件
4. 集成到系统管理模块

如有问题，请参考完整的 API 文档或查看测试脚本。
