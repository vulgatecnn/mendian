# 角色管理 API 文档

## 概述

角色管理 API 提供了完整的角色 CRUD 操作、权限分配和成员管理功能。

## 基础 URL

```
/api/system/roles/
```

## 认证

所有接口都需要用户认证。请在请求头中包含有效的认证令牌。

## 接口列表

### 1. 获取角色列表

**接口**: `GET /api/system/roles/`

**权限**: `system.role.view`

**查询参数**:
- `name` (可选): 角色名称，支持模糊查询
- `is_active` (可选): 启用状态，true/false

**响应示例**:
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "系统管理员",
      "description": "拥有系统所有权限",
      "is_active": true,
      "permission_list": [
        {
          "id": 1,
          "code": "system.user.view",
          "name": "查看用户",
          "module": "系统管理",
          "description": "查看用户列表和详情",
          "created_at": "2024-01-01T00:00:00Z"
        }
      ],
      "member_count": 5,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. 创建角色

**接口**: `POST /api/system/roles/`

**权限**: `system.role.manage`

**请求体**:
```json
{
  "name": "运营经理",
  "description": "负责门店运营管理",
  "is_active": true,
  "permission_ids": [1, 2, 3]
}
```

**字段说明**:
- `name` (必填): 角色名称，唯一
- `description` (可选): 角色描述
- `is_active` (可选): 启用状态，默认 true
- `permission_ids` (可选): 权限ID列表

**响应示例**:
```json
{
  "id": 2,
  "name": "运营经理",
  "description": "负责门店运营管理",
  "is_active": true,
  "permission_list": [
    {
      "id": 1,
      "code": "store.view",
      "name": "查看门店",
      "module": "门店管理",
      "description": "",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "member_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 3. 获取角色详情

**接口**: `GET /api/system/roles/{id}/`

**权限**: `system.role.view`

**响应示例**:
```json
{
  "id": 1,
  "name": "系统管理员",
  "description": "拥有系统所有权限",
  "is_active": true,
  "permission_list": [
    {
      "id": 1,
      "code": "system.user.view",
      "name": "查看用户",
      "module": "系统管理",
      "description": "查看用户列表和详情",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "member_count": 5,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 4. 更新角色

**接口**: `PUT /api/system/roles/{id}/`

**权限**: `system.role.manage`

**请求体**:
```json
{
  "name": "运营经理",
  "description": "负责门店运营管理（更新）",
  "is_active": true,
  "permission_ids": [1, 2, 3, 4]
}
```

**响应示例**:
```json
{
  "id": 2,
  "name": "运营经理",
  "description": "负责门店运营管理（更新）",
  "is_active": true,
  "permission_list": [...],
  "member_count": 3,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z"
}
```

### 5. 删除角色

**接口**: `DELETE /api/system/roles/{id}/`

**权限**: `system.role.manage`

**说明**: 
- 只能删除未被使用的角色（没有关联用户）
- 如果角色正在被使用，将返回错误

**成功响应**: `204 No Content`

**失败响应**:
```json
{
  "code": 4002,
  "message": "角色 运营经理 正在被使用，无法删除",
  "data": {
    "member_count": 3
  }
}
```

### 6. 分配权限

**接口**: `POST /api/system/roles/{id}/assign_permissions/`

**权限**: `system.role.manage`

**请求体**:
```json
{
  "permission_ids": [1, 2, 3, 4, 5]
}
```

**说明**:
- 会替换角色的所有权限
- 权限修改后会立即对所有拥有该角色的用户生效
- 自动清除相关用户的权限缓存

**响应示例**:
```json
{
  "code": 0,
  "message": "权限分配成功",
  "data": {
    "id": 2,
    "name": "运营经理",
    "description": "负责门店运营管理",
    "is_active": true,
    "permission_list": [
      {
        "id": 1,
        "code": "store.view",
        "name": "查看门店",
        "module": "门店管理",
        "description": "",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "member_count": 3,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  }
}
```

### 7. 获取角色成员列表

**接口**: `GET /api/system/roles/{id}/members/`

**权限**: `system.role.view`

**响应示例**:
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "role_id": 2,
    "role_name": "运营经理",
    "member_count": 3,
    "members": [
      {
        "id": 1,
        "username": "zhangsan",
        "full_name": "张三",
        "phone": "13800138000",
        "department": 1,
        "department_name": "运营部",
        "position": "经理",
        "is_active": true
      }
    ]
  }
}
```

### 8. 添加角色成员

**接口**: `POST /api/system/roles/{id}/add_members/`

**权限**: `system.role.manage`

**请求体**:
```json
{
  "user_ids": [1, 2, 3]
}
```

**说明**:
- 添加用户到角色
- 自动清除新增用户的权限缓存
- 如果用户已经在角色中，不会重复添加

**响应示例**:
```json
{
  "code": 0,
  "message": "添加成功",
  "data": {
    "role_id": 2,
    "role_name": "运营经理",
    "added_count": 3,
    "total_members": 6
  }
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1000 | 未知错误 |
| 1001 | 参数错误 |
| 1002 | 权限不足 |
| 3001 | 用户不存在 |
| 4001 | 角色不存在 |
| 4002 | 角色正在被使用 |
| 4003 | 角色名称已存在 |

## 使用示例

### Python (requests)

```python
import requests

# 基础配置
BASE_URL = "http://localhost:8000/api/system"
headers = {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
}

# 1. 获取角色列表
response = requests.get(f"{BASE_URL}/roles/", headers=headers)
roles = response.json()

# 2. 创建角色
data = {
    "name": "运营经理",
    "description": "负责门店运营管理",
    "is_active": True,
    "permission_ids": [1, 2, 3]
}
response = requests.post(f"{BASE_URL}/roles/", json=data, headers=headers)
role = response.json()

# 3. 分配权限
data = {
    "permission_ids": [1, 2, 3, 4, 5]
}
response = requests.post(
    f"{BASE_URL}/roles/{role['id']}/assign_permissions/",
    json=data,
    headers=headers
)

# 4. 添加成员
data = {
    "user_ids": [1, 2, 3]
}
response = requests.post(
    f"{BASE_URL}/roles/{role['id']}/add_members/",
    json=data,
    headers=headers
)

# 5. 获取角色成员
response = requests.get(
    f"{BASE_URL}/roles/{role['id']}/members/",
    headers=headers
)
members = response.json()
```

### JavaScript (fetch)

```javascript
const BASE_URL = 'http://localhost:8000/api/system';
const headers = {
  'Authorization': 'Bearer YOUR_TOKEN',
  'Content-Type': 'application/json'
};

// 1. 获取角色列表
const getRoles = async () => {
  const response = await fetch(`${BASE_URL}/roles/`, { headers });
  return await response.json();
};

// 2. 创建角色
const createRole = async () => {
  const data = {
    name: '运营经理',
    description: '负责门店运营管理',
    is_active: true,
    permission_ids: [1, 2, 3]
  };
  
  const response = await fetch(`${BASE_URL}/roles/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  return await response.json();
};

// 3. 分配权限
const assignPermissions = async (roleId, permissionIds) => {
  const response = await fetch(
    `${BASE_URL}/roles/${roleId}/assign_permissions/`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ permission_ids: permissionIds })
    }
  );
  
  return await response.json();
};

// 4. 添加成员
const addMembers = async (roleId, userIds) => {
  const response = await fetch(
    `${BASE_URL}/roles/${roleId}/add_members/`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_ids: userIds })
    }
  );
  
  return await response.json();
};
```

## 注意事项

1. **权限验证**: 所有接口都需要相应的权限，请确保用户具有正确的权限
2. **角色删除**: 只能删除未被使用的角色，删除前请先移除所有成员
3. **权限缓存**: 修改角色权限后，系统会自动清除相关用户的权限缓存
4. **审计日志**: 所有关键操作都会记录审计日志
5. **事务处理**: 创建和更新操作使用数据库事务，确保数据一致性

## 相关文档

- [权限管理文档](./PERMISSIONS.md)
- [用户管理 API](./USER_API.md)
- [部门管理 API](./DEPARTMENT_API.md)
- [审计日志文档](./AUDIT_LOG.md)
