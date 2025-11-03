# 路由配置

本目录包含应用的路由配置。

## 路由结构

### 主路由 (AppRoutes)

- `/` - 首页
- `/system/*` - 系统管理模块路由
- `/store-planning/*` - 开店计划管理模块路由

### 系统管理模块路由 (SystemRoutes)

| 路径 | 组件 | 权限 | 说明 |
|------|------|------|------|
| `/system/departments` | DepartmentManagement | `system.department.view` | 部门管理 |
| `/system/users` | UserManagement | `system.user.view` | 用户管理 |
| `/system/roles` | RoleManagement | `system.role.view` | 角色管理 |
| `/system/audit-logs` | AuditLogManagement | `system.audit.view` | 审计日志 |

### 开店计划管理模块路由 (StorePlanningRoutes)

| 路径 | 组件 | 权限 | 说明 |
|------|------|------|------|
| `/store-planning/dashboard` | Dashboard | `store_planning.plan.view` | 执行仪表板 |
| `/store-planning/reports` | AnalysisReport | `store_planning.plan.view` | 分析报表 |
| `/store-planning/plans` | PlanList | `store_planning.plan.view` | 计划列表 |
| `/store-planning/plans/create` | PlanForm | `store_planning.plan.create` | 创建计划 |
| `/store-planning/plans/:id` | PlanDetail | `store_planning.plan.view` | 计划详情 |
| `/store-planning/plans/:id/edit` | PlanForm | `store_planning.plan.edit` | 编辑计划 |
| `/store-planning/import` | PlanImport | `store_planning.plan.import` | 数据导入 |
| `/store-planning/export` | PlanExport | `store_planning.plan.export` | 数据导出 |
| `/store-planning/templates` | TemplateManagement | `store_planning.plan.view` | 模板管理 |

## 权限控制

所有路由都使用 `ProtectedRoute` 组件进行权限保护：

```tsx
<Route 
  path="plans" 
  element={
    <ProtectedRoute permission="store_planning.plan.view">
      <PlanList />
    </ProtectedRoute>
  } 
/>
```

### 权限检查流程

1. 用户访问受保护的路由
2. `ProtectedRoute` 组件检查用户是否具有所需权限
3. 如果有权限，渲染目标组件
4. 如果无权限，显示权限不足提示或重定向

## 导航方法

### 使用 useNavigate Hook

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  // 导航到计划列表
  navigate('/store-planning/plans');
  
  // 导航到计划详情
  navigate(`/store-planning/plans/${planId}`);
  
  // 返回上一页
  navigate(-1);
}
```

### 使用 useStorePlanManagement Hook

推荐使用封装好的导航方法：

```tsx
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function MyComponent() {
  const {
    goToPlanList,
    goToPlanDetail,
    goToCreatePlan,
    goToEditPlan
  } = useStorePlanManagement();
  
  // 使用封装的导航方法
  goToPlanDetail(planId);
}
```

## 路由参数

### 动态路由参数

使用 `useParams` Hook 获取路由参数：

```tsx
import { useParams } from 'react-router-dom';

function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  
  // 使用 id 参数
  const planId = parseInt(id);
}
```

### 查询参数

使用 `useSearchParams` Hook 处理查询参数：

```tsx
import { useSearchParams } from 'react-router-dom';

function PlanList() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 读取查询参数
  const page = searchParams.get('page');
  
  // 设置查询参数
  setSearchParams({ page: '2', status: 'published' });
}
```

## 添加新路由

### 1. 创建页面组件

在 `src/pages/store-planning/` 目录下创建新组件。

### 2. 导出组件

在 `src/pages/store-planning/index.ts` 中导出：

```tsx
export { default as NewPage } from './NewPage';
```

### 3. 添加路由配置

在 `src/routes/index.tsx` 的 `StorePlanningRoutes` 中添加：

```tsx
<Route 
  path="new-page" 
  element={
    <ProtectedRoute permission="store_planning.new_feature.view">
      <NewPage />
    </ProtectedRoute>
  } 
/>
```

### 4. 更新导航菜单

在 `src/components/MainNavigation.tsx` 中添加菜单项：

```tsx
<PermissionGuard permission="store_planning.new_feature.view">
  <Item key="new-page">
    <IconFile />
    新功能
  </Item>
</PermissionGuard>
```

### 5. 添加权限定义

在 `src/contexts/PermissionContext.tsx` 中添加权限：

```tsx
{ 
  id: 18, 
  code: 'store_planning.new_feature.view', 
  name: '查看新功能', 
  module: '开店计划管理' 
}
```

## 路由守卫

### ProtectedRoute 组件

用于保护需要权限的路由：

```tsx
<ProtectedRoute permission="required.permission.code">
  <YourComponent />
</ProtectedRoute>
```

### 多权限检查

如果需要检查多个权限，可以嵌套使用或在组件内部使用 `usePermission` Hook：

```tsx
import { usePermission } from '../hooks/usePermission';

function MyComponent() {
  const { hasPermission, hasAnyPermission } = usePermission();
  
  // 检查单个权限
  if (hasPermission('store_planning.plan.edit')) {
    // 显示编辑按钮
  }
  
  // 检查多个权限（任意一个）
  if (hasAnyPermission(['permission1', 'permission2'])) {
    // 显示功能
  }
}
```

## 404 处理

未匹配的路由会显示 404 页面：

```tsx
<Route 
  path="*" 
  element={
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <h2>页面未找到</h2>
      <p>请检查URL是否正确</p>
    </div>
  } 
/>
```

## 最佳实践

1. **使用语义化的路径**：路径应该清晰表达页面功能
2. **保持路由层级简单**：避免过深的嵌套
3. **统一权限命名**：使用 `module.resource.action` 格式
4. **使用封装的导航方法**：提高代码可维护性
5. **添加权限保护**：所有敏感页面都应该有权限检查
6. **提供友好的错误提示**：权限不足或404时给出明确提示
