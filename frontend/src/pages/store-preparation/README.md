# 开店筹备模块

本模块实现了开店筹备管理的前端界面，包括工程管理和交付管理两个主要功能。

## 功能模块

### 1. 工程管理

#### 组件列表

- **ConstructionList.tsx** - 工程单列表页面
  - 支持按工程单号、门店名称、状态、供应商筛选
  - 支持日期范围筛选
  - 显示工程单基本信息和里程碑进度
  - 提供新建、编辑、查看详情操作

- **ConstructionDetail.tsx** - 工程单详情页面
  - 显示工程单完整信息
  - 里程碑管理（时间线展示）
  - 设计图纸管理（上传、预览、下载）
  - 整改项管理
  - 验收操作

- **ConstructionForm.tsx** - 工程单表单组件
  - 创建/编辑工程单
  - 关联跟进单选择
  - 供应商选择
  - 施工日期设置

- **AcceptanceManagement.tsx** - 验收管理页面（独立页面）
  - 显示需要验收的工程单列表
  - 支持按工程状态、验收结果筛选
  - 提供快速验收操作
  - 查看验收详情和历史

- **MilestoneManager.tsx** - 里程碑管理组件
  - 添加、编辑、删除里程碑
  - 标记里程碑完成
  - 时间线展示
  - 状态更新

- **MilestoneManagement.tsx** - 里程碑管理页面（独立页面）
  - 显示所有工程单的里程碑概览
  - 里程碑进度统计和可视化
  - 批量里程碑管理
  - 延期里程碑提醒

- **AcceptanceForm.tsx** - 验收操作表单
  - 验收结果录入
  - 整改项管理
  - 验收照片上传
  - 验收备注

### 2. 交付管理

#### 组件列表

- **DeliveryList.tsx** - 交付清单列表页面
  - 支持按清单编号、门店名称、状态筛选
  - 显示交付项完成进度
  - 显示交付文档数量
  - 提供新建、编辑、查看详情操作

- **DeliveryDetail.tsx** - 交付清单详情页面
  - 显示交付清单完整信息
  - 交付项清单管理（勾选完成状态）
  - 交付文档管理（上传、下载、分类）
  - 添加交付项

- **DeliveryForm.tsx** - 交付清单表单组件
  - 创建/编辑交付清单
  - 关联工程单选择
  - 门店名称设置

## API 服务

所有 API 调用通过 `PreparationService` 进行，该服务位于 `src/api/preparationService.ts`。

### 主要 API 方法

#### 工程管理
- `getConstructionOrders()` - 获取工程单列表
- `getConstructionOrderDetail()` - 获取工程单详情
- `createConstructionOrder()` - 创建工程单
- `updateConstructionOrder()` - 更新工程单
- `uploadDesignFiles()` - 上传设计图纸
- `addMilestone()` - 添加里程碑
- `updateMilestone()` - 更新里程碑
- `completeMilestone()` - 完成里程碑
- `performAcceptance()` - 执行验收
- `markRectification()` - 标记整改项

#### 交付管理
- `getDeliveryChecklists()` - 获取交付清单列表
- `getDeliveryChecklistDetail()` - 获取交付清单详情
- `createDeliveryChecklist()` - 创建交付清单
- `updateDeliveryChecklist()` - 更新交付清单
- `uploadDeliveryDocuments()` - 上传交付文档
- `updateDeliveryItemStatus()` - 更新交付项状态

## 类型定义

所有类型定义位于 `src/types/index.ts`，包括：

- `ConstructionOrder` - 工程单
- `Milestone` - 里程碑
- `RectificationItem` - 整改项
- `DeliveryChecklist` - 交付清单
- `DeliveryItem` - 交付项
- `DeliveryDocument` - 交付文档
- `Supplier` - 供应商

## 权限控制

使用 `PermissionGuard` 组件进行权限控制：

- `preparation.construction.create` - 创建工程单
- `preparation.construction.edit` - 编辑工程单
- `preparation.construction.upload` - 上传图纸
- `preparation.construction.acceptance` - 执行验收
- `preparation.delivery.create` - 创建交付清单
- `preparation.delivery.edit` - 编辑交付清单
- `preparation.delivery.upload` - 上传文档

## 使用示例

```typescript
import { ConstructionList, DeliveryList } from './pages/store-preparation'

// 在路由中使用
<Route path="/store-preparation/construction" element={<ConstructionList />} />
<Route path="/store-preparation/delivery" element={<DeliveryList />} />
```

## 注意事项

1. 所有日期字段使用 ISO 8601 格式（YYYY-MM-DD）
2. 文件上传使用 FormData 格式
3. 表格支持分页、排序和筛选
4. 所有操作都有权限控制
5. 错误处理统一通过 Message 组件显示
6. 移动端适配通过响应式布局实现

## 后续优化

1. 添加批量操作功能
2. 实现数据导出功能
3. 添加更多的数据可视化图表
4. 优化移动端体验
5. 添加离线缓存支持
