# 开店计划管理 - 状态管理和路由配置指南

## 概述

本文档说明开店计划管理模块的前端状态管理和路由配置实现。

## 已完成的功能

### 1. 状态管理 (StorePlanContext)

创建了集中式的开店计划状态管理上下文，提供以下功能：

#### 核心功能

- **计划列表管理**
  - 加载计划列表（支持分页、筛选）
  - 刷新计划列表
  - 自动管理加载状态和分页信息

- **计划详情管理**
  - 加载单个计划详情
  - 刷新当前计划
  - 清除当前计划状态

- **计划CRUD操作**
  - 创建新计划
  - 更新计划信息
  - 删除计划

- **计划状态操作**
  - 发布计划
  - 取消计划（带原因）

- **本地状态优化**
  - 本地更新计划数据（无需API调用）
  - 本地更新区域计划数据
  - 优化UI响应速度

#### 自动状态同步

上下文会自动处理以下场景的状态同步：

1. 创建计划后自动刷新列表
2. 更新计划后同步列表和详情
3. 删除计划后从列表移除
4. 发布/取消计划后刷新相关数据

### 2. 便捷Hook (useStorePlanManagement)

创建了封装的Hook，提供更便捷的使用方式：

#### 导航方法

- `goToPlanList()` - 导航到计划列表
- `goToPlanDetail(id)` - 导航到计划详情
- `goToCreatePlan()` - 导航到创建计划
- `goToEditPlan(id)` - 导航到编辑计划

#### 组合操作方法

- `createAndNavigate(data)` - 创建计划并导航到详情
- `updateAndNavigate(id, data)` - 更新计划并导航到详情
- `deleteAndNavigate(id)` - 删除计划并导航到列表
- `publishPlanWithRefresh(id)` - 发布计划并刷新
- `cancelPlanWithRefresh(id, reason)` - 取消计划并刷新
- `loadPlansWithFilters(filters, page, pageSize)` - 带筛选加载列表

### 3. 路由配置

#### 开店计划管理模块路由

| 路径 | 组件 | 权限 | 功能 |
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

#### 权限配置

已在 `PermissionContext` 中添加以下权限：

- `store_planning.plan.view` - 查看计划
- `store_planning.plan.create` - 创建计划
- `store_planning.plan.edit` - 编辑计划
- `store_planning.plan.delete` - 删除计划
- `store_planning.plan.publish` - 发布计划
- `store_planning.plan.cancel` - 取消计划
- `store_planning.plan.import` - 导入计划
- `store_planning.plan.export` - 导出计划

#### 导航菜单

主导航菜单已配置开店计划管理模块，包含：

- 执行仪表板
- 分析报表
- 门店计划
- 数据导入
- 数据导出
- 导入模板

所有菜单项都有相应的权限保护。

## 使用示例

### 示例1：在计划列表页面使用状态管理

```tsx
import React, { useEffect } from 'react';
import { useStorePlan } from '../contexts/StorePlanContext';

function PlanList() {
  const {
    plans,
    plansLoading,
    plansPagination,
    loadPlans
  } = useStorePlan();

  useEffect(() => {
    // 加载第一页数据
    loadPlans({ page: 1, page_size: 10 });
  }, []);

  const handlePageChange = (page: number) => {
    loadPlans({ page, page_size: plansPagination.pageSize });
  };

  if (plansLoading) return <div>加载中...</div>;

  return (
    <div>
      {plans.map(plan => (
        <div key={plan.id}>{plan.name}</div>
      ))}
      <Pagination
        current={plansPagination.current}
        total={plansPagination.total}
        pageSize={plansPagination.pageSize}
        onChange={handlePageChange}
      />
    </div>
  );
}
```

### 示例2：在计划详情页面使用状态管理

```tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    currentPlan,
    currentPlanLoading,
    loadPlanDetail,
    publishPlanWithRefresh,
    goToEditPlan
  } = useStorePlanManagement();

  useEffect(() => {
    if (id) {
      loadPlanDetail(parseInt(id));
    }
  }, [id]);

  const handlePublish = async () => {
    if (id) {
      await publishPlanWithRefresh(parseInt(id));
    }
  };

  const handleEdit = () => {
    if (id) {
      goToEditPlan(parseInt(id));
    }
  };

  if (currentPlanLoading) return <div>加载中...</div>;
  if (!currentPlan) return <div>计划不存在</div>;

  return (
    <div>
      <h1>{currentPlan.name}</h1>
      <button onClick={handleEdit}>编辑</button>
      {currentPlan.status === 'draft' && (
        <button onClick={handlePublish}>发布</button>
      )}
    </div>
  );
}
```

### 示例3：在计划表单页面使用状态管理

```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';
import { StorePlanFormData } from '../types';

function PlanForm() {
  const { id } = useParams<{ id: string }>();
  const {
    createAndNavigate,
    updateAndNavigate
  } = useStorePlanManagement();

  const handleSubmit = async (formData: StorePlanFormData) => {
    try {
      if (id) {
        // 更新现有计划
        await updateAndNavigate(parseInt(id), formData);
      } else {
        // 创建新计划
        await createAndNavigate(formData);
      }
      // 自动导航到详情页
    } catch (error) {
      // 错误已在上下文中处理并显示
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
    </form>
  );
}
```

## 文件结构

```
frontend/src/
├── contexts/
│   ├── PermissionContext.tsx      # 权限管理上下文
│   ├── StorePlanContext.tsx       # 开店计划状态管理上下文
│   ├── index.ts                   # 上下文导出
│   └── README.md                  # 上下文使用文档
├── hooks/
│   ├── usePermission.ts           # 权限检查Hook
│   ├── useStorePlanManagement.ts  # 计划管理便捷Hook
│   └── index.ts                   # Hook导出
├── routes/
│   ├── index.tsx                  # 路由配置
│   └── README.md                  # 路由配置文档
├── components/
│   ├── MainNavigation.tsx         # 主导航菜单
│   ├── ProtectedRoute.tsx         # 路由权限保护组件
│   └── PermissionGuard.tsx        # 权限守卫组件
└── App.tsx                        # 应用入口（包含Provider）
```

## 架构优势

### 1. 集中式状态管理

- 所有计划数据集中管理，避免重复请求
- 统一的数据更新和同步机制
- 减少组件间的状态传递

### 2. 自动状态同步

- 操作后自动刷新相关数据
- 列表和详情自动保持同步
- 减少手动刷新的代码

### 3. 优化的用户体验

- 本地状态更新提供即时反馈
- 统一的加载状态管理
- 统一的错误处理和提示

### 4. 便捷的开发体验

- 封装的Hook简化使用
- 组合操作方法减少重复代码
- 清晰的API和文档

### 5. 权限控制

- 路由级别的权限保护
- 组件级别的权限控制
- 灵活的权限检查方法

## 后续优化建议

1. **性能优化**
   - 添加数据缓存机制
   - 实现虚拟滚动（大列表）
   - 优化重渲染

2. **功能增强**
   - 添加乐观更新
   - 实现离线支持
   - 添加数据预加载

3. **开发体验**
   - 添加TypeScript类型推导
   - 完善错误处理
   - 添加单元测试

## 相关文档

- [上下文使用文档](./src/contexts/README.md)
- [路由配置文档](./src/routes/README.md)
- [API服务文档](./src/api/README.md)

## 技术栈

- React 18
- React Router v6
- Arco Design
- TypeScript
- Context API
