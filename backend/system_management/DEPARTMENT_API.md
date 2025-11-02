# 部门管理 API 文档

## 概述

部门管理 API 提供了部门信息的查询、管理和企业微信同步功能。

## API 端点

### 1. 获取部门列表

**端点**: `GET /api/departments/`

**描述**: 获取部门列表（不包含子部门信息）

**权限**: `system.department.view`

**查询参数**:
- `parent_id` (可选): 父部门 ID
  - 不传：返回所有部门
  - `0` 或 `null`：返回根部门
  - 具体 ID：返回指定父部门的子部门

**响应示例**:
```json
[
  {
    "id": 1,
    "wechat_dept_id": 1,
    "name": "总公司",
    "parent": null,
    "parent_name": null,
    "order": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "wechat_dept_id": 2,
    "name": "技术部",
    "parent": 1,
    "parent_name": "总公司",
    "order": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### 2. 获取部门详情

**端点**: `GET /api/departments/{id}/`

**描述**: 获取指定部门的详细信息（包含子部门）

**权限**: `system.department.view`

**路径参数**:
- `id`: 部门 ID

**响应示例**:
```json
{
  "id": 1,
  "wechat_dept_id": 1,
  "name": "总公司",
  "parent": null,
  "parent_name": null,
  "order": 0,
  "level": 1,
  "path_names": ["总公司"],
  "children": [
    {
      "id": 2,
      "wechat_dept_id": 2,
      "name": "技术部",
      "parent": 1,
      "parent_name": "总公司",
      "order": 1,
      "level": 2,
      "path_names": ["总公司", "技术部"],
      "children": [],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 3. 获取部门树形结构

**端点**: `GET /api/departments/tree/`

**描述**: 获取完整的部门树形结构（从根部门开始，递归包含所有子部门）

**权限**: `system.department.view`

**响应示例**:
```json
{
  "code": 0,
  "message": "获取部门树成功",
  "data": [
    {
      "id": 1,
      "wechat_dept_id": 1,
      "name": "总公司",
      "parent": null,
      "parent_name": null,
      "order": 0,
      "level": 1,
      "path_names": ["总公司"],
      "children": [
        {
          "id": 2,
          "wechat_dept_id": 2,
          "name": "技术部",
          "parent": 1,
          "parent_name": "总公司",
          "order": 1,
          "level": 2,
          "path_names": ["总公司", "技术部"],
          "children": [
            {
              "id": 3,
              "wechat_dept_id": 3,
              "name": "研发组",
              "parent": 2,
              "parent_name": "技术部",
              "order": 1,
              "level": 3,
              "path_names": ["总公司", "技术部", "研发组"],
              "children": [],
              "created_at": "2024-01-01T00:00:00Z",
              "updated_at": "2024-01-01T00:00:00Z"
            }
          ],
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4. 从企业微信同步部门

**端点**: `POST /api/departments/sync_from_wechat/`

**描述**: 从企业微信同步部门信息到系统

**权限**: `system.department.sync`

**请求体** (可选):
```json
{
  "department_id": 1  // 指定同步的部门 ID，不传则同步所有部门
}
```

**成功响应**:
```json
{
  "code": 0,
  "message": "同步成功",
  "data": {
    "total": 10,      // 总共处理的部门数
    "created": 5,     // 新创建的部门数
    "updated": 5,     // 更新的部门数
    "failed": 0       // 失败的部门数
  }
}
```

**失败响应**:
```json
{
  "code": 2003,
  "message": "同步失败",
  "data": {
    "errors": ["错误信息1", "错误信息2"]
  }
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1000 | 未知错误 |
| 1002 | 权限不足 |
| 2003 | 企业微信同步失败 |

## 权限说明

| 权限编码 | 权限名称 | 说明 |
|---------|---------|------|
| `system.department.view` | 查看部门 | 允许查看部门列表和详情 |
| `system.department.sync` | 同步部门 | 允许从企业微信同步部门信息 |

## 使用示例

### 获取部门树

```bash
curl -X GET "http://localhost:8000/api/departments/tree/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 同步企业微信部门

```bash
curl -X POST "http://localhost:8000/api/departments/sync_from_wechat/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 获取指定父部门的子部门

```bash
curl -X GET "http://localhost:8000/api/departments/?parent_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 注意事项

1. 所有 API 端点都需要用户认证（`IsAuthenticated`）
2. 部分端点需要特定权限，请确保用户具有相应权限
3. 同步操作可能需要较长时间，建议在前端显示加载状态
4. 部门树形结构会递归加载所有子部门，数据量较大时可能影响性能
5. 企业微信同步需要正确配置企业微信凭证（CorpID、AgentID、Secret）
