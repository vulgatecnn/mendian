# 基础数据管理模块

## 概述

基础数据管理模块提供系统基础数据的维护功能，包括业务大区、供应商、法人主体、客户和商务预算的管理。

## 功能模块

### 1. 业务大区管理 (BusinessRegionManagement)

管理企业的业务经营区域划分。

**功能特性：**
- 创建、编辑、删除业务大区
- 设置大区与省市的关联关系
- 设置大区负责人
- 启用/停用大区
- 删除前检查关联引用

**路由：** `/base-data/regions`

### 2. 供应商管理 (SupplierManagement)

管理施工、设备、材料等各类供应商档案。

**功能特性：**
- 创建、编辑、删除供应商
- 管理供应商基本信息（名称、编码、类型、联系方式）
- 管理合作状态（合作中/已停止）
- 按名称、类型、合作状态搜索
- 删除前检查关联引用

**路由：** `/base-data/suppliers`

### 3. 法人主体管理 (LegalEntityManagement)

管理企业的法人主体信息。

**功能特性：**
- 创建、编辑、删除法人主体
- 管理工商信息（统一社会信用代码、法定代表人、注册资本等）
- 管理营运状态（营运中/已注销）
- 按名称、统一社会信用代码搜索
- 删除前检查关联引用

**路由：** `/base-data/legal-entities`

### 4. 客户管理 (CustomerManagement)

管理客户（加盟商）档案信息。

**功能特性：**
- 创建、编辑、删除客户
- 管理客户基本信息（名称、编码、联系方式）
- 管理合作状态（合作中/已终止）
- 按名称、合作状态搜索
- 删除前检查关联引用

**路由：** `/base-data/customers`

### 5. 商务预算管理 (BudgetManagement)

管理门店开设的预算配置。

**功能特性：**
- 创建、编辑、删除商务预算
- 管理预算信息（名称、编码、年份、金额）
- 启用/停用预算
- 按名称、年份、状态搜索
- 删除前检查关联引用

**路由：** `/base-data/budgets`

## 技术实现

### API 服务

所有基础数据管理功能通过 `baseDataService.ts` 统一调用后端 API：

```typescript
import BaseDataService from '../../api/baseDataService'

// 业务大区
BaseDataService.getBusinessRegions(params)
BaseDataService.createBusinessRegion(data)
BaseDataService.updateBusinessRegion(id, data)
BaseDataService.deleteBusinessRegion(id)
BaseDataService.toggleBusinessRegionStatus(id, is_active)

// 供应商
BaseDataService.getSuppliers(params)
BaseDataService.createSupplier(data)
// ... 其他方法类似
```

### 组件结构

每个管理页面都采用统一的结构：

1. **列表展示**：使用 Arco Design Table 组件
2. **搜索过滤**：提供常用字段的搜索功能
3. **新建/编辑**：使用 Modal + Form 实现
4. **状态切换**：支持启用/停用或合作状态切换
5. **删除确认**：使用 Popconfirm 组件确认删除操作
6. **关联检查**：删除前检查是否被业务数据引用

### 数据权限

基础数据管理通常需要管理员权限，在路由配置中应添加权限控制：

```typescript
{
  path: '/base-data',
  element: <BaseDataLayout />,
  children: [
    {
      path: 'regions',
      element: <BusinessRegionManagement />,
      meta: { permission: 'base_data.region.view' }
    },
    // ...
  ]
}
```

## 后端 API 接口

### 业务大区
- `GET /api/base-data/regions/` - 获取列表
- `POST /api/base-data/regions/` - 创建
- `GET /api/base-data/regions/{id}/` - 获取详情
- `PUT /api/base-data/regions/{id}/` - 更新
- `DELETE /api/base-data/regions/{id}/` - 删除
- `PATCH /api/base-data/regions/{id}/` - 部分更新（状态切换）

### 供应商
- `GET /api/base-data/suppliers/` - 获取列表
- `POST /api/base-data/suppliers/` - 创建
- `GET /api/base-data/suppliers/{id}/` - 获取详情
- `PUT /api/base-data/suppliers/{id}/` - 更新
- `DELETE /api/base-data/suppliers/{id}/` - 删除
- `PATCH /api/base-data/suppliers/{id}/` - 部分更新（状态切换）

### 法人主体
- `GET /api/base-data/legal-entities/` - 获取列表
- `POST /api/base-data/legal-entities/` - 创建
- `GET /api/base-data/legal-entities/{id}/` - 获取详情
- `PUT /api/base-data/legal-entities/{id}/` - 更新
- `DELETE /api/base-data/legal-entities/{id}/` - 删除
- `PATCH /api/base-data/legal-entities/{id}/` - 部分更新（状态切换）

### 客户
- `GET /api/base-data/customers/` - 获取列表
- `POST /api/base-data/customers/` - 创建
- `GET /api/base-data/customers/{id}/` - 获取详情
- `PUT /api/base-data/customers/{id}/` - 更新
- `DELETE /api/base-data/customers/{id}/` - 删除
- `PATCH /api/base-data/customers/{id}/` - 部分更新（状态切换）

### 商务预算
- `GET /api/base-data/budgets/` - 获取列表
- `POST /api/base-data/budgets/` - 创建
- `GET /api/base-data/budgets/{id}/` - 获取详情
- `PUT /api/base-data/budgets/{id}/` - 更新
- `DELETE /api/base-data/budgets/{id}/` - 删除
- `PATCH /api/base-data/budgets/{id}/` - 部分更新（状态切换）

## 使用示例

```typescript
import { BusinessRegionManagement } from './pages/base-data'

// 在路由配置中使用
<Route path="/base-data/regions" element={<BusinessRegionManagement />} />
```

## 注意事项

1. **删除保护**：所有删除操作都会检查数据是否被引用，被引用的数据不能删除
2. **状态管理**：停用的数据不能在业务流程中被选择使用
3. **数据验证**：表单提交时会进行前端和后端双重验证
4. **错误处理**：所有 API 调用都包含错误处理，失败时会显示友好的错误提示
5. **权限控制**：需要配合后端权限系统，确保只有授权用户可以访问和操作

## 相关需求

- 需求 10：业务大区管理
- 需求 11：供应商管理
- 需求 12：主体信息管理
- 需求 13：客户信息管理
- 需求 14：商务预算管理
