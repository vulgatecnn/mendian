# 用户管理 API 文档

## 概述

用户管理 API 提供了完整的用户管理功能，包括用户列表查询、详情查看、企业微信同步、启用/停用、角色分配等操作。

## API 端点

### 1. 获取用户列表

**端点**: `GET /api/users/`

**权限**: `system.user.view`

**查询参数**:
- `name` (可选): 姓名，支持模糊查询（匹配用户名、姓、名）
- `department_id` (可选): 部门ID
- `is_active` (可选): 启用状态，true/false
- `page` (可选): 页码，默认1
- `page_size` (可选): 每页数量，默认20，最大100

**响应示例**:
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "zhangsan",
      "full_name": "张三",
      "phone": "13800138000",
      "department": 1,
      "department_name": "技术部",
      "position": "工程师",
      "is_active": true
    }
  ]
}
```

### 2. 获取用户详情

**端点**: `GET /api/users/{id}/`

**权限**: `system.user.view`

**响应示例**:
```json
{
  "id": 1,
  "username": "zhangsan",
  "full_name": "张三",
  "first_name": "三",
  "last_name": "张",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "wechat_user_id": "ZhangSan",
  "department": 1,
  "department_info": {
    "id": 1,
    "name": "技术部",
    "wechat_dept_id": 1001,
    "parent": null,
    "parent_name": null,
    "order": 1
  },
  "position": "工程师",
  "is_active": true,
  "is_staff": false,
  "is_superuser": false,
  "role_list": [
    {
      "id": 1,
      "name": "开发人员",
      "description": "开发人员角色",
      "is_active": true
    }
  ],
  "date_joined": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 3. 从企业微信同步用户

**端点**: `POST /api/users/sync_from_wechat/`

**权限**: `system.user.sync`

**请求体** (可选):
```json
{
  "department_id": 1,      // 指定同步的部门ID，不传则同步所有部门
  "fetch_child": true      // 是否递归获取子部门的用户，默认true
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "同步成功",
  "data": {
    "total": 50,      // 总数
    "created": 10,    // 新增数量
    "updated": 40,    // 更新数量
    "failed": 0       // 失败数量
  }
}
```

**说明**:
- 同步操作会自动创建新用户或更新已存在的用户
- 新创建的用户默认密码为手机号后6位
- 同步操作会记录审计日志

### 4. 启用/停用用户

**端点**: `POST /api/users/{id}/toggle_status/`

**权限**: `system.user.manage`

**请求体** (可选):
```json
{
  "is_active": true    // 目标状态，不传则切换当前状态
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "is_active": false
  }
}
```

**说明**:
- 停用的用户无法登录系统
- 操作会记录审计日志

### 5. 分配角色

**端点**: `POST /api/users/{id}/assign_roles/`

**权限**: `system.user.manage`

**请求体**:
```json
{
  "role_ids": [1, 2, 3]    // 角色ID列表
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "角色分配成功",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "roles": [
      {
        "id": 1,
        "name": "开发人员"
      },
      {
        "id": 2,
        "name": "测试人员"
      }
    ]
  }
}
```

**说明**:
- 此操作会替换用户的所有角色（不是追加）
- 操作会自动清除用户的权限缓存
- 操作会记录审计日志

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1000 | 未知错误 |
| 1001 | 参数错误 |
| 1002 | 权限不足 |
| 2003 | 企业微信同步失败 |
| 3001 | 用户不存在 |
| 4001 | 角色不存在 |

## 使用示例

### 查询用户列表（按部门筛选）

```bash
curl -X GET "http://localhost:8000/api/users/?department_id=1&page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 查询用户列表（按姓名搜索）

```bash
curl -X GET "http://localhost:8000/api/users/?name=张三" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 从企业微信同步所有用户

```bash
curl -X POST "http://localhost:8000/api/users/sync_from_wechat/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 从企业微信同步指定部门用户

```bash
curl -X POST "http://localhost:8000/api/users/sync_from_wechat/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "department_id": 1,
    "fetch_child": true
  }'
```

### 停用用户

```bash
curl -X POST "http://localhost:8000/api/users/1/toggle_status/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

### 为用户分配角色

```bash
curl -X POST "http://localhost:8000/api/users/1/assign_roles/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": [1, 2, 3]
  }'
```

## 注意事项

1. **权限控制**: 所有接口都需要相应的权限才能访问
2. **分页**: 列表接口默认分页，建议使用分页参数避免一次性加载过多数据
3. **缓存**: 用户权限信息会被缓存30分钟，角色变更后会自动清除缓存
4. **审计日志**: 关键操作（同步、启用/停用、角色分配）都会记录审计日志
5. **企业微信同步**: 同步操作可能需要较长时间，建议在后台异步执行

## 相关文档

- [权限管理文档](./PERMISSIONS.md)
- [审计日志文档](./AUDIT_LOG.md)
- [企业微信集成文档](./WECHAT_INTEGRATION.md)
