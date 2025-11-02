# 系统管理模块集成测试

## 概述

本目录包含系统管理模块的完整集成测试套件，涵盖企业微信集成、用户管理、角色权限、权限控制和审计日志等核心功能。

## 测试模块

### 1. 企业微信集成测试 (`test_wechat_integration.py`)

测试企业微信同步功能的正常流程和错误处理：

- **WeChatDepartmentSyncTest**: 部门同步测试
  - 部门同步成功流程
  - 更新已存在的部门
  - API错误处理
  - 访问令牌过期自动刷新
  - 网络超时错误处理
  - 部门树形结构获取

- **WeChatUserSyncTest**: 用户同步测试
  - 用户同步成功流程
  - 更新已存在的用户
  - 无效用户数据处理
  - 同步所有部门的用户

- **WeChatTokenManagerTest**: 令牌管理测试
  - 获取访问令牌成功
  - 配置无效时的错误处理
  - 令牌缓存机制

### 2. 用户管理测试 (`test_user_management.py`)

测试用户启用/停用、角色分配等功能：

- **UserManagementTest**: 用户管理功能测试
  - 用户启用/停用
  - 角色分配（单个、多个、替换、移除）
  - 无效角色处理
  - 用户不存在处理

- **UserLoginTest**: 用户登录测试
  - 启用用户可以登录
  - 停用用户无法登录

- **UserPermissionTest**: 用户权限测试
  - 角色分配后权限立即生效
  - 角色移除后权限立即失效
  - 角色权限变更后用户权限立即更新

### 3. 角色权限测试 (`test_role_permission.py`)

测试角色创建、编辑、删除、权限分配等功能：

- **RoleManagementTest**: 角色管理功能测试
  - 角色创建、更新、删除
  - 重名角色处理
  - 正在使用的角色删除保护
  - 权限分配
  - 成员管理

- **PermissionManagementTest**: 权限管理功能测试
  - 权限按模块分组

- **RolePermissionIntegrationTest**: 角色权限集成测试
  - 角色权限修改立即影响用户
  - 停用角色不提供权限
  - 多角色权限并集

### 4. 权限控制测试 (`test_permission_control.py`)

测试无权限用户访问受限功能、有权限用户正常访问、前端菜单和按钮的权限控制：

- **PermissionControlTest**: 权限控制测试
  - 权限装饰器允许/拒绝访问
  - 匿名用户访问拒绝
  - 权限中间件加载用户权限
  - 超级管理员拥有所有权限
  - 多角色用户权限检查
  - 停用角色权限不生效

- **APIPermissionTest**: API权限测试
  - 有权限用户可以访问API
  - 无权限用户无法访问API
  - 未认证用户无法访问API

- **FrontendPermissionControlTest**: 前端权限控制测试
  - 菜单权限控制
  - 按钮权限控制
  - 用户权限上下文加载
  - 权限上下文更新

### 5. 审计日志测试 (`test_audit_log.py`)

验证关键操作都有日志记录、测试日志查询和筛选：

- **AuditLogRecordingTest**: 审计日志记录测试
  - 角色创建、更新、删除日志
  - 用户状态变更日志
  - 角色分配日志
  - 权限分配日志

- **AuditLogQueryTest**: 审计日志查询测试
  - 获取所有审计日志
  - 按操作人筛选
  - 按操作类型筛选
  - 按操作对象类型筛选
  - 按时间范围筛选
  - 组合筛选条件
  - 日志排序和分页

- **AuditLogCleanupTest**: 审计日志清理测试
  - 清理过期日志
  - 日志保留策略

## 运行测试

### 运行所有测试

```bash
# 运行所有集成测试
python manage.py test system_management.tests --verbosity=2

# 使用测试运行脚本
python backend/system_management/tests/run_integration_tests.py
```

### 运行特定测试模块

```bash
# 企业微信集成测试
python manage.py test system_management.tests.test_wechat_integration

# 用户管理测试
python manage.py test system_management.tests.test_user_management

# 角色权限测试
python manage.py test system_management.tests.test_role_permission

# 权限控制测试
python manage.py test system_management.tests.test_permission_control

# 审计日志测试
python manage.py test system_management.tests.test_audit_log
```

### 运行特定测试类

```bash
# 运行部门同步测试
python manage.py test system_management.tests.test_wechat_integration.WeChatDepartmentSyncTest

# 运行用户管理测试
python manage.py test system_management.tests.test_user_management.UserManagementTest
```

### 运行特定测试方法

```bash
# 运行部门同步成功测试
python manage.py test system_management.tests.test_wechat_integration.WeChatDepartmentSyncTest.test_sync_departments_success
```

## 测试覆盖范围

### 企业微信集成 (需求1.1, 1.2, 1.3, 2.1, 2.2)
- ✅ 部门同步（正常流程、错误处理）
- ✅ 用户同步（正常流程、错误处理）
- ✅ 数据正确性验证

### 用户管理 (需求2.3, 2.4, 2.5, 2.6)
- ✅ 用户启用/停用
- ✅ 角色分配
- ✅ 停用用户无法登录验证

### 角色和权限 (需求3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7)
- ✅ 角色创建、编辑、删除
- ✅ 权限分配
- ✅ 角色删除时的使用检查
- ✅ 权限修改立即生效验证

### 权限控制 (需求4.1, 4.2, 4.3, 4.5)
- ✅ 无权限用户访问受限功能
- ✅ 有权限用户正常访问
- ✅ 前端菜单和按钮的权限控制

### 审计日志 (需求6.1, 6.2, 6.3, 6.4)
- ✅ 关键操作日志记录验证
- ✅ 日志查询和筛选测试

## 测试数据

测试使用模拟数据和Mock对象，不依赖外部服务：

- 企业微信API调用使用Mock响应
- 数据库使用Django测试数据库
- 缓存使用测试缓存后端

## 注意事项

1. **测试隔离**: 每个测试方法都有独立的setUp和tearDown，确保测试之间不相互影响
2. **缓存清理**: 测试中会自动清理权限缓存，确保权限变更立即生效
3. **错误处理**: 测试覆盖了各种错误场景，包括网络错误、数据错误、权限错误等
4. **性能考虑**: 测试使用内存数据库和缓存，运行速度较快

## 测试结果示例

```
=== 测试部门同步成功流程 ===
✓ 部门同步成功: 总数=4, 新增=4
✓ 数据库中部门数量: 4
✓ 部门层级关系验证通过

=== 测试权限装饰器允许有权限的用户访问 ===
✓ 有权限用户访问成功

=== 测试角色创建审计日志 ===
✓ 角色创建日志记录成功
  - 操作人: admin
  - 操作类型: CREATE
  - 目标对象: Role (ID: 3)
  - IP地址: 192.168.1.100
```

## 持续集成

这些测试可以集成到CI/CD流水线中，确保代码变更不会破坏现有功能：

```yaml
# 示例CI配置
test:
  script:
    - python manage.py test system_management.tests --verbosity=2
  coverage: '/TOTAL.*\s+(\d+%)$/'
```