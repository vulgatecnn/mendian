# 系统管理模块 API 文档

## 概述

系统管理模块提供了完整的用户、部门、角色和权限管理功能，支持与企业微信集成。本文档详细说明了所有API接口的使用方法。

## 快速开始

### 1. 启动开发服务器

```bash
cd backend
python manage.py runserver
```

### 2. 访问API文档

- **Swagger UI**: http://localhost:8000/api/docs/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### 3. 认证

系统使用Session认证，需要先通过Django Admin或登录接口获取会话。

```bash
# 创建超级用户
python manage.py createsuperuser

# 访问管理后台登录
http://localhost:8000/admin/
```

## API 接口概览

### 部门管理 API

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/departments/` | 获取部门列表 | system.department.view |
| GET | `/api/departments/{id}/` | 获取部门详情 | system.department.view |
| GET | `/api/departments/tree/` | 获取部门树形结构 | system.department.view |
| POST | `/api/departments/sync_from_wechat/` | 从企业微信同步部门 | system.department.sync |
| POST | `/api/departments/` | 创建部门 | system.department.create |
| PUT | `/api/departments/{id}/` | 更新部门 | system.department.update |
| DELETE | `/api/departments/{id}/` | 删除部门 | system.department.delete |

### 用户管理 API

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users/` | 获取用户列表 | system.user.view |
| GET | `/api/users/{id}/` | 获取用户详情 | system.user.view |
| POST | `/api/users/sync_from_wechat/` | 从企业微信同步用户 | system.user.sync |
| POST | `/api/users/{id}/toggle_status/` | 启用/停用用户 | system.user.manage |
| POST | `/api/users/{id}/assign_roles/` | 分配用户角色 | system.user.manage |
| POST | `/api/users/` | 创建用户 | system.user.create |
| PUT | `/api/users/{id}/` | 更新用户 | system.user.update |
| DELETE | `/api/users/{id}/` | 删除用户 | system.user.delete |

### 角色管理 API

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/roles/` | 获取角色列表 | system.role.view |
| GET | `/api/roles/{id}/` | 获取角色详情 | system.role.view |
| POST | `/api/roles/{id}/assign_permissions/` | 分配角色权限 | system.role.manage |
| GET | `/api/roles/{id}/members/` | 获取角色成员 | system.role.view |
| POST | `/api/roles/{id}/add_members/` | 添加角色成员 | system.role.manage |
| POST | `/api/roles/` | 创建角色 | system.role.manage |
| PUT | `/api/roles/{id}/` | 更新角色 | system.role.manage |
| DELETE | `/api/roles/{id}/` | 删除角色 | system.role.manage |

### 权限管理 API

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/permissions/` | 获取权限列表 | system.permission.view |
| GET | `/api/permissions/{id}/` | 获取权限详情 | system.permission.view |

### 审计日志 API

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/audit-logs/` | 获取审计日志列表 | system.audit.view |
| GET | `/api/audit-logs/{id}/` | 获取审计日志详情 | system.audit.view |

## 使用示例

### 1. 获取部门树形结构

```bash
curl -X GET "http://localhost:8000/api/departments/tree/" \
  -H "Content-Type: application/json" \
  --cookie "sessionid=your_session_id"
```

响应示例：
```json
{
  "code": 0,
  "message": "获取部门树成功",
  "data": [
    {
      "id": 1,
      "name": "总公司",
      "parent": null,
      "children": [
        {
          "id": 2,
          "name": "技术部",
          "parent": 1,
          "children": []
        }
      ]
    }
  ]
}
```

### 2. 从企业微信同步部门

```bash
curl -X POST "http://localhost:8000/api/departments/sync_from_wechat/" \
  -H "Content-Type: application/json" \
  -d '{"department_id": 1}' \
  --cookie "sessionid=your_session_id"
```

响应示例：
```json
{
  "code": 0,
  "message": "同步成功",
  "data": {
    "total": 10,
    "created": 3,
    "updated": 5,
    "failed": 2
  }
}
```

### 3. 获取用户列表（带筛选）

```bash
curl -X GET "http://localhost:8000/api/users/?search=张三&department_id=1&is_active=true&page=1&page_size=20" \
  -H "Content-Type: application/json" \
  --cookie "sessionid=your_session_id"
```

### 4. 启用/停用用户

```bash
curl -X POST "http://localhost:8000/api/users/1/toggle_status/" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}' \
  --cookie "sessionid=your_session_id"
```

### 5. 分配用户角色

```bash
curl -X POST "http://localhost:8000/api/users/1/assign_roles/" \
  -H "Content-Type: application/json" \
  -d '{"role_ids": [1, 2, 3]}' \
  --cookie "sessionid=your_session_id"
```

### 6. 创建角色并分配权限

```bash
curl -X POST "http://localhost:8000/api/roles/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "系统管理员",
    "description": "系统管理员角色",
    "is_active": true,
    "permission_ids": [1, 2, 3]
  }' \
  --cookie "sessionid=your_session_id"
```

### 7. 获取权限列表（按模块分组）

```bash
curl -X GET "http://localhost:8000/api/permissions/?group_by_module=true" \
  -H "Content-Type: application/json" \
  --cookie "sessionid=your_session_id"
```

### 8. 查询审计日志

```bash
curl -X GET "http://localhost:8000/api/audit-logs/?username=admin&action=create&start_time=2024-01-01T00:00:00Z&page=1" \
  -H "Content-Type: application/json" \
  --cookie "sessionid=your_session_id"
```

## 错误处理

### 常见错误码

- **403 权限不足**
  ```json
  {
    "detail": "权限不足"
  }
  ```

- **404 资源不存在**
  ```json
  {
    "detail": "未找到"
  }
  ```

- **400 参数错误**
  ```json
  {
    "code": 1001,
    "message": "参数错误",
    "data": null
  }
  ```

- **500 服务器错误**
  ```json
  {
    "code": 1000,
    "message": "操作失败: 具体错误信息",
    "data": null
  }
  ```

### 企业微信集成错误

- **2001 企业微信API错误**
- **2002 访问令牌过期**
- **2003 同步失败**

## 权限系统

### 权限编码规范

权限编码采用 `模块.资源.操作` 的格式：

- `system.department.view` - 查看部门
- `system.department.sync` - 同步部门
- `system.user.manage` - 管理用户
- `system.role.manage` - 管理角色
- `system.audit.view` - 查看审计日志

### 默认角色

系统初始化时会创建以下默认角色：

1. **系统管理员** - 拥有所有权限
2. **部门管理员** - 拥有部门和用户管理权限
3. **普通用户** - 拥有基本查看权限

## 性能优化

### 缓存机制

系统使用缓存提高性能：

- 部门树结构缓存（1小时）
- 用户权限缓存（30分钟）
- 权限列表缓存（1小时）
- 企业微信访问令牌缓存（2小时）

### 数据库优化

- 使用 `select_related` 和 `prefetch_related` 减少查询次数
- 为常用查询字段添加索引
- 分页查询避免大数据量返回

## 开发指南

### 添加新权限

1. 在数据库中添加权限记录
2. 在视图中使用 `@permission_required` 装饰器
3. 更新角色的权限配置

### 扩展API接口

1. 在 ViewSet 中添加新的 action
2. 使用 `@extend_schema` 添加API文档
3. 添加相应的权限验证

### 测试API

建议使用以下工具测试API：

- **Postman** - 图形化API测试工具
- **curl** - 命令行工具
- **httpie** - 更友好的命令行工具
- **Django REST framework browsable API** - 内置的API浏览器

## 部署注意事项

### 生产环境配置

1. 设置 `DEBUG = False`
2. 配置正确的 `ALLOWED_HOSTS`
3. 使用 HTTPS
4. 配置 Redis 缓存
5. 设置企业微信凭证环境变量

### 安全建议

1. 定期更新访问令牌
2. 监控异常登录
3. 定期清理审计日志
4. 使用强密码策略
5. 限制API访问频率

## 常见问题

### Q: 如何重置用户密码？

A: 可以通过Django Admin后台或使用Django的用户管理命令。

### Q: 企业微信同步失败怎么办？

A: 检查企业微信凭证配置，查看错误日志，确认网络连接正常。

### Q: 如何备份和恢复数据？

A: 使用Django的 `dumpdata` 和 `loaddata` 命令，或直接备份PostgreSQL数据库。

### Q: 如何监控API性能？

A: 可以使用Django Debug Toolbar、APM工具或自定义中间件记录响应时间。

## 更新日志

### v1.0.0 (2024-11-02)

- 初始版本发布
- 实现基础的用户、部门、角色管理功能
- 支持企业微信集成
- 完整的API文档和权限控制