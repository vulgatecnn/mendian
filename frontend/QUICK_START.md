# 开店计划管理模块 - 快速开始

## 概述

本指南帮助开发者快速了解和使用开店计划管理模块的前端实现。

## 核心概念

### 1. 状态管理

使用 React Context API 实现集中式状态管理：

- **StorePlanContext**: 管理计划数据和操作
- **PermissionContext**: 管理用户权限

### 2. 路由配置

使用 React Router v6 实现路由管理：

- 模块化路由配置
- 权限保护的路由
- 动态路由参数

### 3. 权限控制

多层级的权限控制：

- 路由级别：`ProtectedRoute` 组件
- 组件级别：`PermissionGuard` 组件
- 代码级别：`usePermission` Hook

## 快速开始

### 步骤1：理解项目结构

```
frontend/src/
├── contexts/          # 状态管理上下文
├── hooks/            # 自定义Hooks
├── routes/           # 路由配置
├── components/       # 通用组件
├── pages/            # 页面组件
│   └── store-planning/  # 开店计划页面
├── api/              # API服务
└── types/            # TypeScript类型定义
```

### 步骤2：使用状态管理

在任何组件中使用计划状态：

```tsx
import { useStorePlan } from '../contexts/StorePlanContext';

function MyComponent() {
  const { plans, loadPlans } = useStorePlan();
  
  useEffect(() => {
    loadPlans();
  }, []);
  
  return <div>{/* 使用 plans 数据 */}</div>;
}
```

### 步骤3：使用便捷Hook

推荐使用封装的Hook：

```tsx
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function MyComponent() {
  const {
    plans,
    loadPlans,
    goToPlanDetail,
    createAndNavigate
  } = useStorePlanManagement();
  
  // 使用更便捷的方法
}
```

### 步骤4：添加权限检查

在组件中检查权限：

```tsx
import { usePermission } from '../hooks/usePermission';

function MyComponent() {
  const { hasPermission } = usePermission();
  
  return (
    <div>
      {hasPermission('store_planning.plan.create') && (
        <button>创建计划</button>
      )}
    </div>
  );
}
```

### 步骤5：导航到其他页面

使用封装的导航方法：

```tsx
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function MyComponent() {
  const { goToPlanDetail } = useStorePlanManagement();
  
  const handleClick = (planId: number) => {
    goToPlanDetail(planId);
  };
  
  return <button onClick={() => handleClick(1)}>查看详情</button>;
}
```

## 常见场景

### 场景1：显示计划列表

```tsx
import React, { useEffect } from 'react';
import { Table } from '@arco-design/web-react';
import { useStorePlan } from '../contexts/StorePlanContext';

function PlanList() {
  const { plans, plansLoading, loadPlans } = useStorePlan();

  useEffect(() => {
    loadPlans({ page: 1, page_size: 10 });
  }, []);

  return (
    <Table
      data={plans}
      loading={plansLoading}
      columns={[
        { title: '计划名称', dataIndex: 'name' },
        { title: '状态', dataIndex: 'status' }
      ]}
    />
  );
}
```

### 场景2：创建新计划

```tsx
import React from 'react';
import { Form, Button, Message } from '@arco-design/web-react';
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function CreatePlan() {
  const { createAndNavigate } = useStorePlanManagement();
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      await createAndNavigate(values);
      // 自动导航到新创建的计划详情页
    } catch (error) {
      // 错误已在上下文中处理
    }
  };

  return (
    <Form form={form}>
      <Form.Item label="计划名称" field="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Button type="primary" onClick={handleSubmit}>
        创建
      </Button>
    </Form>
  );
}
```

### 场景3：查看计划详情

```tsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions } from '@arco-design/web-react';
import { useStorePlan } from '../contexts/StorePlanContext';

function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentPlan, currentPlanLoading, loadPlanDetail } = useStorePlan();

  useEffect(() => {
    if (id) {
      loadPlanDetail(parseInt(id));
    }
  }, [id]);

  if (currentPlanLoading) return <div>加载中...</div>;
  if (!currentPlan) return <div>计划不存在</div>;

  return (
    <Card>
      <Descriptions
        data={[
          { label: '计划名称', value: currentPlan.name },
          { label: '状态', value: currentPlan.status }
        ]}
      />
    </Card>
  );
}
```

### 场景4：发布计划

```tsx
import React from 'react';
import { Button, Modal } from '@arco-design/web-react';
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function PublishButton({ planId }: { planId: number }) {
  const { publishPlanWithRefresh } = useStorePlanManagement();

  const handlePublish = () => {
    Modal.confirm({
      title: '确认发布',
      content: '发布后计划将开始执行，确定要发布吗？',
      onOk: async () => {
        await publishPlanWithRefresh(planId);
        // 自动刷新数据
      }
    });
  };

  return (
    <Button type="primary" onClick={handlePublish}>
      发布计划
    </Button>
  );
}
```

### 场景5：带筛选的列表查询

```tsx
import React, { useState } from 'react';
import { Input, Select, Button } from '@arco-design/web-react';
import { useStorePlanManagement } from '../hooks/useStorePlanManagement';

function PlanListWithFilters() {
  const { loadPlansWithFilters } = useStorePlanManagement();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  const handleSearch = () => {
    loadPlansWithFilters({
      name,
      status
    });
  };

  return (
    <div>
      <Input
        placeholder="计划名称"
        value={name}
        onChange={setName}
      />
      <Select
        placeholder="状态"
        value={status}
        onChange={setStatus}
      >
        <Select.Option value="draft">草稿</Select.Option>
        <Select.Option value="published">已发布</Select.Option>
      </Select>
      <Button onClick={handleSearch}>搜索</Button>
    </div>
  );
}
```

## API参考

### StorePlanContext

#### 状态

- `plans: StorePlan[]` - 计划列表
- `plansLoading: boolean` - 列表加载状态
- `plansPagination` - 分页信息
- `currentPlan: StorePlan | null` - 当前计划
- `currentPlanLoading: boolean` - 详情加载状态

#### 方法

- `loadPlans(params?)` - 加载计划列表
- `refreshPlans()` - 刷新列表
- `loadPlanDetail(id)` - 加载详情
- `refreshCurrentPlan()` - 刷新详情
- `clearCurrentPlan()` - 清除详情
- `createPlan(data)` - 创建计划
- `updatePlan(id, data)` - 更新计划
- `deletePlan(id)` - 删除计划
- `publishPlan(id)` - 发布计划
- `cancelPlan(id, reason)` - 取消计划

### useStorePlanManagement Hook

继承 StorePlanContext 的所有功能，额外提供：

#### 导航方法

- `goToPlanList()` - 导航到列表
- `goToPlanDetail(id)` - 导航到详情
- `goToCreatePlan()` - 导航到创建
- `goToEditPlan(id)` - 导航到编辑

#### 组合方法

- `createAndNavigate(data)` - 创建并导航
- `updateAndNavigate(id, data)` - 更新并导航
- `deleteAndNavigate(id)` - 删除并导航
- `publishPlanWithRefresh(id)` - 发布并刷新
- `cancelPlanWithRefresh(id, reason)` - 取消并刷新
- `loadPlansWithFilters(filters, page, pageSize)` - 带筛选加载

## 最佳实践

### 1. 使用封装的Hook

✅ 推荐：
```tsx
const { createAndNavigate } = useStorePlanManagement();
await createAndNavigate(data);
```

❌ 不推荐：
```tsx
const { createPlan } = useStorePlan();
const navigate = useNavigate();
const plan = await createPlan(data);
navigate(`/store-planning/plans/${plan.id}`);
```

### 2. 统一错误处理

上下文已处理错误提示，无需重复处理：

✅ 推荐：
```tsx
try {
  await createPlan(data);
  // 成功后的逻辑
} catch (error) {
  // 可选：额外的错误处理
}
```

### 3. 避免重复加载

使用 `refreshPlans()` 而不是重新调用 `loadPlans()`：

✅ 推荐：
```tsx
const { refreshPlans } = useStorePlan();
await refreshPlans(); // 使用上次的查询参数
```

### 4. 权限检查

在显示操作按钮前检查权限：

✅ 推荐：
```tsx
{hasPermission('store_planning.plan.edit') && (
  <Button>编辑</Button>
)}
```

### 5. 加载状态处理

始终处理加载状态：

✅ 推荐：
```tsx
if (plansLoading) return <Spin />;
if (!plans.length) return <Empty />;
return <Table data={plans} />;
```

## 调试技巧

### 1. 查看上下文状态

在组件中打印状态：

```tsx
const context = useStorePlan();
console.log('Context state:', context);
```

### 2. 检查权限

```tsx
const { permissions } = usePermissionContext();
console.log('User permissions:', permissions);
```

### 3. 监控API调用

在浏览器开发者工具的Network标签中查看API请求。

## 故障排除

### 问题1：上下文未定义

**错误**: `useStorePlan must be used within StorePlanProvider`

**解决**: 确保组件在 `StorePlanProvider` 内部：

```tsx
<StorePlanProvider>
  <YourComponent />
</StorePlanProvider>
```

### 问题2：权限检查失败

**问题**: 按钮不显示或路由被拒绝

**解决**: 检查 `PermissionContext` 中是否包含所需权限。

### 问题3：数据不刷新

**问题**: 操作后数据没有更新

**解决**: 使用上下文提供的方法，它们会自动刷新数据。

## 更多资源

- [状态管理详细文档](./STATE_MANAGEMENT_GUIDE.md)
- [上下文使用文档](./src/contexts/README.md)
- [路由配置文档](./src/routes/README.md)
- [API服务文档](./src/api/README.md)

## 获取帮助

如有问题，请查看：

1. 相关文档
2. 代码注释
3. TypeScript类型定义
4. 示例代码

或联系开发团队获取支持。
