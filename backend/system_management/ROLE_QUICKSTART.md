# 角色管理 API 快速入门

## 快速开始

### 1. 创建角色

```bash
curl -X POST http://localhost:8000/api/system/roles/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "运营经理",
    "description": "负责门店运营管理",
    "is_active": true,
    "permission_ids": [1, 2, 3]
  }'
```

### 2. 获取角色列表

```bash
curl -X GET http://localhost:8000/api/system/roles/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 分配权限

```bash
curl -X POST http://localhost:8000/api/system/roles/1/assign_permissions/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": [1, 2, 3, 4, 5]
  }'
```

### 4. 添加成员

```bash
curl -X POST http://localhost:8000/api/system/roles/1/add_members/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [1, 2, 3]
  }'
```

### 5. 获取角色成员

```bash
curl -X GET http://localhost:8000/api/system/roles/1/members/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 常见场景

### 场景 1: 创建一个新角色并分配权限

```python
import requests

BASE_URL = "http://localhost:8000/api/system"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# 1. 创建角色
role_data = {
    "name": "门店经理",
    "description": "管理门店日常运营",
    "is_active": True
}
response = requests.post(f"{BASE_URL}/roles/", json=role_data, headers=headers)
role = response.json()
role_id = role['id']

# 2. 分配权限
permissions_data = {
    "permission_ids": [1, 2, 3, 4, 5]
}
requests.post(
    f"{BASE_URL}/roles/{role_id}/assign_permissions/",
    json=permissions_data,
    headers=headers
)
```

### 场景 2: 批量添加用户到角色

```python
# 获取需要添加的用户ID列表
user_ids = [1, 2, 3, 4, 5]

# 添加到角色
data = {"user_ids": user_ids}
response = requests.post(
    f"{BASE_URL}/roles/{role_id}/add_members/",
    json=data,
    headers=headers
)
```

### 场景 3: 查询角色及其成员

```python
# 1. 获取角色详情
response = requests.get(f"{BASE_URL}/roles/{role_id}/", headers=headers)
role = response.json()

print(f"角色名称: {role['name']}")
print(f"权限数量: {len(role['permission_list'])}")
print(f"成员数量: {role['member_count']}")

# 2. 获取成员列表
response = requests.get(f"{BASE_URL}/roles/{role_id}/members/", headers=headers)
members = response.json()['data']['members']

for member in members:
    print(f"- {member['full_name']} ({member['username']})")
```

### 场景 4: 更新角色权限

```python
# 获取当前权限
response = requests.get(f"{BASE_URL}/roles/{role_id}/", headers=headers)
current_permissions = [p['id'] for p in response.json()['permission_list']]

# 添加新权限
new_permission_ids = current_permissions + [6, 7, 8]

# 更新权限
data = {"permission_ids": new_permission_ids}
requests.post(
    f"{BASE_URL}/roles/{role_id}/assign_permissions/",
    json=data,
    headers=headers
)
```

### 场景 5: 删除角色（安全删除）

```python
# 1. 检查角色是否被使用
response = requests.get(f"{BASE_URL}/roles/{role_id}/", headers=headers)
role = response.json()

if role['member_count'] > 0:
    print(f"角色有 {role['member_count']} 个成员，需要先移除成员")
    # 移除所有成员的逻辑...
else:
    # 2. 删除角色
    response = requests.delete(f"{BASE_URL}/roles/{role_id}/", headers=headers)
    if response.status_code == 204:
        print("角色删除成功")
```

## 前端集成示例 (React + TypeScript)

### 角色管理 Service

```typescript
// services/roleService.ts
import axios from 'axios';

const BASE_URL = '/api/system/roles';

export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permission_list: Permission[];
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string;
}

export const roleService = {
  // 获取角色列表
  async getRoles(params?: { name?: string; is_active?: boolean }) {
    const response = await axios.get(BASE_URL, { params });
    return response.data;
  },

  // 创建角色
  async createRole(data: {
    name: string;
    description?: string;
    is_active?: boolean;
    permission_ids?: number[];
  }) {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  },

  // 获取角色详情
  async getRole(id: number) {
    const response = await axios.get(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // 更新角色
  async updateRole(id: number, data: Partial<Role>) {
    const response = await axios.put(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  // 删除角色
  async deleteRole(id: number) {
    await axios.delete(`${BASE_URL}/${id}/`);
  },

  // 分配权限
  async assignPermissions(id: number, permissionIds: number[]) {
    const response = await axios.post(
      `${BASE_URL}/${id}/assign_permissions/`,
      { permission_ids: permissionIds }
    );
    return response.data;
  },

  // 获取角色成员
  async getMembers(id: number) {
    const response = await axios.get(`${BASE_URL}/${id}/members/`);
    return response.data;
  },

  // 添加成员
  async addMembers(id: number, userIds: number[]) {
    const response = await axios.post(
      `${BASE_URL}/${id}/add_members/`,
      { user_ids: userIds }
    );
    return response.data;
  },
};
```

### 角色列表组件

```typescript
// components/RoleList.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Message } from '@arco-design/web-react';
import { roleService, Role } from '../services/roleService';

const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await roleService.getRoles();
      setRoles(data.results || data);
    } catch (error) {
      Message.error('加载角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await roleService.deleteRole(id);
      Message.success('删除成功');
      loadRoles();
    } catch (error: any) {
      if (error.response?.data?.code === 4002) {
        Message.error('角色正在被使用，无法删除');
      } else {
        Message.error('删除失败');
      }
    }
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
    },
    {
      title: '成员数量',
      dataIndex: 'member_count',
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (value: boolean) => (value ? '启用' : '停用'),
    },
    {
      title: '操作',
      render: (_: any, record: Role) => (
        <>
          <Button type="text" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="text"
            status="danger"
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" onClick={() => setShowCreateModal(true)}>
        创建角色
      </Button>
      <Table
        columns={columns}
        data={roles}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
};

export default RoleList;
```

## 权限要求

| 操作 | 所需权限 |
|------|----------|
| 查看角色列表 | system.role.view |
| 查看角色详情 | system.role.view |
| 创建角色 | system.role.manage |
| 更新角色 | system.role.manage |
| 删除角色 | system.role.manage |
| 分配权限 | system.role.manage |
| 查看成员 | system.role.view |
| 添加成员 | system.role.manage |

## 常见问题

### Q: 如何删除一个有成员的角色？
A: 需要先移除所有成员，或者将成员分配到其他角色，然后才能删除角色。

### Q: 修改角色权限后，用户需要重新登录吗？
A: 不需要。系统会自动清除相关用户的权限缓存，权限修改立即生效。

### Q: 可以同时给角色分配多个权限吗？
A: 可以。在创建或更新角色时，通过 permission_ids 数组传递多个权限ID。

### Q: 如何查看某个用户拥有哪些角色？
A: 使用用户管理 API 的用户详情接口，返回的数据中包含 role_list 字段。

## 相关文档

- [完整 API 文档](./ROLE_API.md)
- [实现总结](./ROLE_IMPLEMENTATION_SUMMARY.md)
- [权限管理文档](./PERMISSIONS.md)
- [用户管理 API](./USER_API.md)
