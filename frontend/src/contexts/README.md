# 状态管理上下文

本目录包含应用的全局状态管理上下文。

## StorePlanContext

开店计划状态管理上下文，提供计划数据的集中管理和操作方法。

### 功能特性

- **计划列表管理**：加载、刷新、分页、筛选
- **计划详情管理**：加载、刷新、清除当前计划
- **计划CRUD操作**：创建、更新、删除计划
- **计划状态操作**：发布、取消计划
- **本地状态优化**：提供本地状态更新方法，优化UI响应速度

### 使用方法

#### 1. 在组件中使用上下文

```tsx
import { useStorePlan } from '../contexts/StorePlanContext';

function MyComponent() {
  const {
    plans,
    plansLoading,
    loadPlans,
    currentPlan,
    loadPlanDetail
  } = useStorePlan();

  // 使用状态和方法
}
```

#### 2. 使用便捷Hook

推荐使用 `useStorePlanManagement` Hook，它提供了更多便捷方法：

```tsx
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function MyComponent() {
  const {
    plans,
    plansLoading,
    loadPlans,
    goToPlanDetail,
    createAndNavigate,
    publishPlanWithRefresh
  } = useStorePlanManagement();

  // 使用状态和方法
}
```

### API方法

#### 计划列表操作

- `loadPlans(params?)` - 加载计划列表
- `refreshPlans()` - 刷新计划列表（使用上次的查询参数）

#### 计划详情操作

- `loadPlanDetail(id)` - 加载计划详情
- `refreshCurrentPlan()` - 刷新当前计划详情
- `clearCurrentPlan()` - 清除当前计划详情

#### 计划CRUD操作

- `createPlan(planData)` - 创建新计划
- `updatePlan(id, planData)` - 更新计划
- `deletePlan(id)` - 删除计划

#### 计划状态操作

- `publishPlan(id)` - 发布计划
- `cancelPlan(id, reason)` - 取消计划

#### 本地状态更新

- `updateLocalPlan(id, updates)` - 本地更新计划（不调用API）
- `updateLocalRegionalPlan(planId, regionalPlanId, updates)` - 本地更新区域计划

### 状态同步

上下文会自动处理以下状态同步：

1. **创建计划后**：自动刷新计划列表
2. **更新计划后**：同步更新列表和当前计划
3. **删除计划后**：从列表中移除，清除当前计划（如果是当前计划）
4. **发布/取消计划后**：刷新相关数据

### 示例

#### 加载和显示计划列表

```tsx
import React, { useEffect } from 'react';
import { useStorePlan } from '../contexts/StorePlanContext';

function PlanList() {
  const { plans, plansLoading, loadPlans } = useStorePlan();

  useEffect(() => {
    loadPlans({ page: 1, page_size: 10 });
  }, []);

  if (plansLoading) return <div>加载中...</div>;

  return (
    <div>
      {plans.map(plan => (
        <div key={plan.id}>{plan.name}</div>
      ))}
    </div>
  );
}
```

#### 创建计划并导航

```tsx
import React from 'react';
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function CreatePlan() {
  const { createAndNavigate } = useStorePlanManagement();

  const handleSubmit = async (formData) => {
    try {
      await createAndNavigate(formData);
      // 自动导航到新创建的计划详情页
    } catch (error) {
      // 错误已在上下文中处理
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## PermissionContext

权限管理上下文，提供用户权限检查功能。

详见 `PermissionContext.tsx` 文件注释。
