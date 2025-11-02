# 审计日志 API 文档

## 概述

审计日志 API 提供系统操作日志的查询功能，记录了用户对系统的关键操作（如创建、修改、删除角色和用户等）。

**权限要求**：所有审计日志接口都需要 `system.audit.view` 权限（仅管理员可访问）。

## API 端点

### 1. 获取审计日志列表

**端点**: `GET /api/system/audit-logs/`

**描述**: 获取审计日志列表，支持分页和多种筛选条件。

**权限**: `system.audit.view`

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | integer | 否 | 操作人用户ID |
| username | string | 否 | 操作人用户名（支持模糊查询） |
| action | string | 否 | 操作类型（如 create, update, delete, enable, disable, assign） |
| target_type | string | 否 | 操作对象类型（如 user, role, permission, department） |
| start_time | datetime | 否 | 开始时间（ISO 8601格式，如 2024-01-01T00:00:00） |
| end_time | datetime | 否 | 结束时间（ISO 8601格式） |
| page | integer | 否 | 页码（默认1） |
| page_size | integer | 否 | 每页数量（默认20，最大100） |

**操作类型常量**:
- `create`: 创建
- `update`: 更新
- `delete`: 删除
- `enable`: 启用
- `disable`: 停用
- `assign`: 分配
- `assign_permissions`: 分配权限
- `add_members`: 添加成员
- `sync`: 同步

**对象类型常量**:
- `user`: 用户
- `role`: 角色
- `permission`: 权限
- `department`: 部门

**响应示例**:

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
    },
    {
      "id": 2,
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
      "action": "assign",
      "target_type": "user",
      "target_id": 10,
      "details": {
        "username": "zhangsan",
        "old_roles": ["普通用户"],
        "new_roles": ["普通用户", "测试角色"]
      },
      "ip_address": "192.168.1.100",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

**请求示例**:

```bash
# 获取所有审计日志
curl -X GET "http://localhost:8000/api/system/audit-logs/" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按操作类型筛选
curl -X GET "http://localhost:8000/api/system/audit-logs/?action=create" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按对象类型筛选
curl -X GET "http://localhost:8000/api/system/audit-logs/?target_type=role" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按操作人筛选
curl -X GET "http://localhost:8000/api/system/audit-logs/?username=admin" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 按时间范围筛选（最近7天）
curl -X GET "http://localhost:8000/api/system/audit-logs/?start_time=2024-01-08T00:00:00" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 组合筛选（角色相关的创建操作）
curl -X GET "http://localhost:8000/api/system/audit-logs/?action=create&target_type=role" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 分页查询
curl -X GET "http://localhost:8000/api/system/audit-logs/?page=2&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. 获取审计日志详情

**端点**: `GET /api/system/audit-logs/{id}/`

**描述**: 获取指定ID的审计日志详细信息。

**权限**: `system.audit.view`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 是 | 审计日志ID |

**响应示例**:

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

**请求示例**:

```bash
curl -X GET "http://localhost:8000/api/system/audit-logs/1/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 常见操作场景

### 1. 查看最近的系统操作

```bash
# 获取最近24小时的操作日志
START_TIME=$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S)
curl -X GET "http://localhost:8000/api/system/audit-logs/?start_time=${START_TIME}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 审计特定用户的操作

```bash
# 查看用户 admin 的所有操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?username=admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 追踪角色变更历史

```bash
# 查看所有角色相关的操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?target_type=role" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 查看特定角色的变更历史（假设角色ID为5）
curl -X GET "http://localhost:8000/api/system/audit-logs/?target_type=role&target_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 查看权限分配记录

```bash
# 查看所有权限分配操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?action=assign_permissions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 查看用户启用/停用记录

```bash
# 查看用户停用操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?action=disable&target_type=user" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 查看用户启用操作
curl -X GET "http://localhost:8000/api/system/audit-logs/?action=enable&target_type=user" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 数据字段说明

### AuditLog 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 日志ID |
| user | integer | 操作人用户ID（可能为null，如果用户已删除） |
| user_info | object | 操作人详细信息（嵌套对象） |
| username | string | 操作人用户名 |
| user_full_name | string | 操作人全名 |
| action | string | 操作类型 |
| target_type | string | 操作对象类型 |
| target_id | integer | 操作对象ID |
| details | object | 操作详情（JSON对象，内容根据操作类型不同而不同） |
| ip_address | string | 操作人IP地址 |
| created_at | datetime | 操作时间（ISO 8601格式） |

### UserInfo 对象（嵌套在 user_info 字段中）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 用户ID |
| username | string | 用户名 |
| full_name | string | 用户全名 |
| phone | string | 手机号 |
| department | integer | 部门ID |
| department_name | string | 部门名称 |
| position | string | 职位 |
| is_active | boolean | 启用状态 |

---

## 错误响应

### 权限不足

**状态码**: `403 Forbidden`

```json
{
  "code": 1002,
  "message": "权限不足",
  "data": null
}
```

### 日志不存在

**状态码**: `404 Not Found`

```json
{
  "detail": "未找到。"
}
```

### 参数错误

**状态码**: `400 Bad Request`

```json
{
  "code": 1001,
  "message": "参数错误",
  "data": {
    "start_time": ["请输入有效的日期时间格式"]
  }
}
```

---

## 注意事项

1. **权限要求**: 审计日志接口仅对具有 `system.audit.view` 权限的管理员开放
2. **只读接口**: 审计日志是只读的，不支持创建、修改或删除操作
3. **数据保留**: 审计日志默认保留365天，超过保留期的日志会被自动清理
4. **时间格式**: 时间参数需使用 ISO 8601 格式（如 `2024-01-15T10:30:00` 或 `2024-01-15T10:30:00Z`）
5. **分页**: 建议使用分页参数，避免一次性查询大量数据
6. **性能**: 查询时建议添加筛选条件（如时间范围、操作类型等），以提高查询性能

---

## Python 示例代码

```python
import requests
from datetime import datetime, timedelta

# API 基础 URL
BASE_URL = "http://localhost:8000/api/system"

# 认证 token
TOKEN = "your_auth_token"

# 设置请求头
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 1. 获取最近7天的审计日志
start_time = (datetime.now() - timedelta(days=7)).isoformat()
response = requests.get(
    f"{BASE_URL}/audit-logs/",
    headers=headers,
    params={
        "start_time": start_time,
        "page_size": 50
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"总数: {data['count']}")
    for log in data['results']:
        print(f"{log['created_at']} - {log['username']} - {log['action']} - {log['target_type']}")

# 2. 查看特定用户的操作记录
response = requests.get(
    f"{BASE_URL}/audit-logs/",
    headers=headers,
    params={
        "username": "admin",
        "page_size": 20
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"用户 admin 的操作记录: {data['count']} 条")

# 3. 查看角色相关的创建操作
response = requests.get(
    f"{BASE_URL}/audit-logs/",
    headers=headers,
    params={
        "action": "create",
        "target_type": "role"
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"角色创建记录: {data['count']} 条")
    for log in data['results']:
        print(f"  - {log['details'].get('name')} (ID: {log['target_id']})")
```

---

## 相关文档

- [审计日志服务文档](./AUDIT_LOG.md)
- [权限管理文档](./PERMISSIONS.md)
- [角色管理 API](./ROLE_API.md)
- [用户管理 API](./USER_API.md)
