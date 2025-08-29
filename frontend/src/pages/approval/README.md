# ApprovalTemplates 组件使用说明

## 组件概述

`ApprovalTemplates.tsx` 是好饭碗门店生命周期管理系统的审批模板管理界面组件，提供完整的审批模板CRUD功能和用户友好的管理界面。

## 功能特性

### 核心功能
- ✅ **模板列表展示** - 支持卡片视图和列表视图
- ✅ **模板CRUD操作** - 创建、查看、编辑、删除模板
- ✅ **搜索筛选** - 支持关键字搜索和多维度筛选
- ✅ **模板预览** - 详细预览模板配置和节点信息
- ✅ **模板复制** - 快速复制现有模板
- ✅ **状态管理** - 启用/禁用模板状态切换
- ✅ **配置验证** - 验证模板配置的正确性
- ✅ **统计展示** - 模板统计数据可视化
- ✅ **响应式设计** - 适配移动端和平板设备

### 业务类型支持
- `store_application` - 报店审批
- `license_approval` - 执照审批  
- `price_comparison` - 比价审批
- `contract_approval` - 合同审批
- `budget_approval` - 预算审批
- `personnel_approval` - 人事审批
- `other` - 其他类型

## 组件结构

```
ApprovalTemplates/
├── ApprovalTemplates.tsx          # 主组件
├── ApprovalTemplates.module.css   # 样式文件
└── README.md                      # 使用说明
```

## API依赖

组件依赖 `approvalService` 提供的以下API：

```typescript
- listTemplates()          // 获取模板列表
- createTemplate()         // 创建新模板
- updateTemplate()         // 更新模板
- deleteTemplate()         // 删除模板
- validateTemplate()       // 验证模板配置
```

## 类型定义

主要使用 `ApprovalTemplate` 类型，包含以下关键字段：

```typescript
interface ApprovalTemplate {
  id: string
  name: string
  category: string
  description: string
  businessType: string
  isActive: boolean
  nodes: ApprovalNode[]
  formConfig: ApprovalFormConfig
  createTime: string
  updateTime: string
  creator: string
}
```

## 使用方式

### 1. 在路由中使用
```tsx
import ApprovalTemplates from '@/pages/approval/ApprovalTemplates'

// 在路由配置中
<Route path="/approval/templates" component={ApprovalTemplates} />
```

### 2. 在标签页中使用（推荐）
```tsx
import ApprovalTemplates from './ApprovalTemplates'

// 已集成在 approval/index.tsx 中
<TabPane tab="审批模板" key="templates">
  <ApprovalTemplates />
</TabPane>
```

## 界面布局

### 页面结构
```
┌─ PageHeader ─────────────────────────────┐
├─ 统计卡片区域（4个统计卡片）               ├
├─ 搜索筛选区域                            ├
│  ├─ 关键字搜索                           │
│  ├─ 高级筛选（展开/收起）                 │
│  └─ 视图模式切换                         │
├─ 模板展示区域                            ├
│  ├─ 卡片视图（默认）                     │
│  └─ 列表视图                            │
└─ 弹窗区域                               ┘
   ├─ 编辑模板弹窗
   └─ 预览模板弹窗
```

### 模板卡片信息
每个模板卡片包含：
- 业务类型图标和颜色
- 模板名称和启用状态
- 模板描述（支持省略显示）
- 业务类型和分类标签
- 节点数量、表单字段数量
- 更新时间
- 操作按钮（预览、编辑、复制、更多）

## 交互功能

### 搜索筛选
- **关键字搜索**：支持模板名称、描述、分类搜索
- **业务类型筛选**：按业务类型过滤模板
- **分类筛选**：按模板分类过滤
- **状态筛选**：按启用/禁用状态过滤

### 模板操作
- **创建模板**：填写基本信息创建新模板
- **编辑模板**：修改模板基本信息
- **预览模板**：查看模板详细配置
- **复制模板**：基于现有模板创建副本
- **启用/禁用**：切换模板状态
- **删除模板**：删除不需要的模板
- **配置验证**：验证模板配置正确性

### 视图切换
- **卡片视图**：直观展示模板信息，支持响应式布局
- **列表视图**：紧凑显示更多模板，支持分页

## 样式特性

### 主题支持
- 支持亮色/深色主题自动适配
- 高对比度模式支持
- 无障碍访问优化

### 响应式设计
- 桌面端：4列卡片布局
- 平板端：2-3列自适应
- 移动端：单列布局，操作按钮堆叠

### 动画效果
- 卡片hover效果和阴影变化
- 页面元素渐入动画
- 支持用户减少动画偏好设置

## 错误处理

组件包含完善的错误处理机制：
- API调用失败提示
- 表单验证错误显示
- 网络异常友好提示
- 操作确认对话框

## 性能优化

- 使用 `useMemo` 优化数据计算
- 使用 `useCallback` 避免不必要的重渲染
- 懒加载和虚拟滚动（大数据量时）
- CSS-in-JS 模块化样式

## 扩展性

组件设计考虑了扩展性：
- 易于添加新的业务类型
- 支持自定义筛选条件
- 可扩展的操作按钮配置
- 插件化的验证规则

## 注意事项

1. **权限控制**：确保用户具有相应的模板管理权限
2. **数据同步**：模板修改后及时刷新相关流程实例
3. **配置验证**：模板发布前必须进行配置验证
4. **备份恢复**：重要模板建议定期备份
5. **版本管理**：模板变更建议记录版本历史

## 开发维护

### 添加新业务类型
1. 在 `BUSINESS_TYPE_CONFIG` 中添加配置
2. 更新 `ApprovalTemplate` 类型定义
3. 添加相应的图标和颜色样式

### 添加新筛选条件
1. 更新 `QueryParams` 接口
2. 在筛选表单中添加新的表单项
3. 更新 `filteredTemplates` 计算逻辑

### 自定义样式
1. 修改 `ApprovalTemplates.module.css`
2. 使用CSS变量支持主题切换
3. 遵循设计系统规范

## 测试建议

### 功能测试
- 模板CRUD操作完整流程
- 搜索筛选功能准确性
- 视图切换正常工作
- 弹窗交互逻辑正确

### 兼容性测试
- 不同浏览器兼容性
- 移动端响应式布局
- 主题切换效果
- 无障碍访问支持

### 性能测试
- 大量模板数据加载性能
- 搜索筛选响应速度
- 内存占用情况
- 动画流畅度

---

*此组件是好饭碗门店生命周期管理系统审批中心的核心组件之一，遵循企业级开发标准，提供稳定可靠的用户体验。*