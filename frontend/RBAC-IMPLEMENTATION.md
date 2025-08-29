# 好饭碗门店管理系统 - RBAC权限系统实现文档

## 项目概述

本项目为好饭碗门店管理系统实现了完整的基于角色的权限控制(RBAC)系统，包括路由权限、菜单权限、组件权限和操作权限控制。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **路由系统**: React Router 6
- **状态管理**: Zustand
- **UI组件库**: Ant Design 5
- **构建工具**: Vite

## 核心功能

### 1. 用户认证系统
- ✅ 用户登录/登出
- ✅ JWT令牌管理
- ✅ 自动刷新令牌
- ✅ 登录状态持久化
- ✅ 认证状态监听

### 2. 角色权限系统
- ✅ 7种用户角色定义
- ✅ 权限映射配置
- ✅ 动态权限计算
- ✅ 权限缓存机制

### 3. 路由权限控制
- ✅ 私有路由保护
- ✅ 权限路由守卫
- ✅ 动态路由配置
- ✅ 懒加载支持
- ✅ 403无权限页面

### 4. 菜单权限系统
- ✅ 基于权限的菜单过滤
- ✅ 动态菜单生成
- ✅ 面包屑自动生成
- ✅ 菜单图标映射

### 5. 组件级权限控制
- ✅ 权限包装器组件
- ✅ 权限按钮组件
- ✅ 角色守卫组件
- ✅ 认证守卫组件

## 系统架构

### 目录结构
```
src/
├── types/                    # 类型定义
│   ├── auth.ts              # 认证相关类型
│   └── permission.ts        # 权限相关类型
├── constants/               # 常量定义
│   ├── roles.ts             # 角色定义
│   └── permissions.ts       # 权限常量
├── stores/                  # 状态管理
│   ├── authStore.ts         # 认证状态
│   └── permissionStore.ts   # 权限状态
├── hooks/                   # 自定义Hook
│   ├── useAuth.ts           # 认证Hook
│   └── usePermission.ts     # 权限Hook
├── router/                  # 路由配置
│   ├── index.tsx            # 路由入口
│   ├── routes.tsx           # 路由定义
│   ├── guards.tsx           # 路由守卫
│   └── types.ts             # 路由类型
├── components/              # 组件
│   └── common/              # 通用组件
│       ├── PermissionWrapper.tsx
│       ├── PermissionButton.tsx
│       ├── AuthGuard.tsx
│       └── RoleGuard.tsx
└── pages/                   # 页面组件
    ├── auth/                # 认证页面
    └── test/                # 测试页面
```

## 用户角色与权限

### 角色定义
1. **总裁办人员** - 经营大屏、数据报表查看
2. **商务人员** - 开店计划、拓店、筹备、审批全流程
3. **运营人员** - 计划管理、候选点位、拓店跟进
4. **销售人员** - 跟进管理、交付管理、门店档案
5. **财务人员** - 跟进审批参与
6. **加盟商/店长** - 交付确认、门店档案查看
7. **系统管理员** - 基础数据、系统管理、审批模板配置

### 权限映射
- 每个角色对应特定的权限集合
- 支持操作级权限控制(create, read, update, delete, manage)
- 支持功能模块权限控制
- 支持页面级权限控制

## 核心实现

### 1. 认证状态管理 (authStore.ts)
```typescript
interface AuthStore {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  // ... 其他方法
}
```

### 2. 权限状态管理 (permissionStore.ts)
```typescript
interface PermissionStore {
  permissions: string[]
  permissionMap: Record<string, boolean>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  checkPermissions: (permissions: string[], mode?: 'all' | 'any') => PermissionCheckResult
  // ... 其他方法
}
```

### 3. 路由守卫 (guards.tsx)
- `RouteGuard`: 通用路由守卫
- `PrivateRoute`: 私有路由保护
- `PermissionRoute`: 权限路由保护
- `LazyRoute`: 懒加载路由

### 4. 权限Hook (usePermission.ts)
- `usePermission`: 基础权限检查
- `useRoutePermission`: 路由权限检查
- `useMenuPermission`: 菜单权限检查
- `usePermissionGuard`: 权限守卫
- `useActionPermission`: 操作权限检查

## 使用示例

### 1. 路由权限
```typescript
<PrivateRoute permissions={[PERMISSIONS.STORE_PLAN.VIEW]}>
  <StorePlanList />
</PrivateRoute>
```

### 2. 组件权限
```typescript
<PermissionWrapper permissions={[PERMISSIONS.STORE_PLAN.CREATE]}>
  <Button type="primary">新建计划</Button>
</PermissionWrapper>
```

### 3. 权限检查
```typescript
const { hasPermission } = usePermission()
const canCreate = hasPermission(PERMISSIONS.STORE_PLAN.CREATE)
```

### 4. 角色检查
```typescript
const { hasRole } = useRolePermission()
const isAdmin = hasRole('ADMIN')
```

## 测试功能

### 开发环境测试
1. 启动开发服务器: `npm run dev`
2. 访问地址: http://localhost:7000
3. 测试账号: `admin / 123456`

### 权限测试页面
- 访问 `/test/permission` 查看权限测试页面
- 显示当前用户的所有权限信息
- 测试各种权限控制组件

## 安全特性

### 1. 令牌管理
- JWT访问令牌 (2小时有效期)
- 自动刷新机制
- 安全存储(LocalStorage)
- 令牌过期检查

### 2. 路由保护
- 未登录自动重定向到登录页
- 无权限显示403页面
- 路由级权限检查
- 动态路由过滤

### 3. 前端权限控制
- 菜单动态显示/隐藏
- 按钮权限控制
- 组件级权限包装
- 操作权限验证

## 扩展性

### 1. 新增角色
1. 在 `constants/roles.ts` 中定义新角色
2. 在 `constants/permissions.ts` 中配置角色权限
3. 更新权限映射关系

### 2. 新增权限
1. 在 `constants/permissions.ts` 中定义新权限
2. 更新角色权限映射
3. 在需要的地方使用权限检查

### 3. 新增路由
1. 在 `router/routes.tsx` 中定义路由
2. 配置路由权限要求
3. 创建对应的页面组件

## 性能优化

### 1. 状态管理优化
- Zustand轻量级状态管理
- 权限映射缓存机制
- 订阅式状态更新

### 2. 路由优化
- 懒加载页面组件
- 路由级代码分割
- 权限预检查

### 3. 组件优化
- React.memo优化重渲染
- useMemo缓存计算结果
- useCallback缓存函数引用

## 部署说明

### 1. 构建项目
```bash
npm run build
```

### 2. 类型检查
```bash
npm run typecheck
```

### 3. 代码规范检查
```bash
npm run lint
```

## 后续规划

### 1. 功能增强
- [ ] 权限日志记录
- [ ] 权限变更通知
- [ ] 细粒度权限控制
- [ ] 权限缓存策略优化

### 2. 安全增强
- [ ] 权限变更监控
- [ ] 异常访问检测
- [ ] 权限审计功能
- [ ] CSP内容安全策略

### 3. 用户体验
- [ ] 权限引导提示
- [ ] 无权限友好提示
- [ ] 权限申请流程
- [ ] 权限帮助文档

## 总结

本RBAC权限系统实现了完整的角色基础权限控制，包括认证、授权、路由保护、菜单过滤、组件权限等功能。系统架构清晰，扩展性强，安全性高，能够满足企业级应用的权限管理需求。

系统已在开发环境中验证通过，可以支持7种不同角色的用户访问，动态显示对应的菜单和功能，有效保护了系统资源的安全访问。