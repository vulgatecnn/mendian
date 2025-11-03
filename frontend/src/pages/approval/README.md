# 审批中心模块

## 概述

审批中心模块提供了完整的在线审批功能，包括审批发起、处理、模板配置和台账导出等功能。

## 功能模块

### 1. 审批操作

#### 审批发起 (ApprovalInitiate)
- 选择审批模板
- 填写审批表单
- 提交审批申请
- 支持业务关联

#### 审批详情 (ApprovalDetail)
- 查看审批详细信息
- 审批流程可视化展示
- 审批处理操作（通过/拒绝/转交/加签）
- 审批撤销
- 审批关注/取消关注
- 审批评论功能

### 2. 审批业务管理

#### 待办审批 (ApprovalPending)
- 显示当前用户需要处理的审批
- 支持快速处理
- 优先级排序

#### 已办审批 (ApprovalProcessed)
- 显示已处理的审批记录
- 查看处理历史

#### 抄送审批 (ApprovalCC)
- 显示抄送给当前用户的审批
- 知会信息展示

#### 关注审批 (ApprovalFollowed)
- 显示用户关注的审批
- 审批动态跟踪

#### 全部审批 (ApprovalAll)
- 显示数据权限范围内的所有审批
- 综合查询和筛选

### 3. 审批模板配置

#### 模板列表 (ApprovalTemplateList)
- 审批模板管理
- 模板启用/停用
- 模板编辑和删除

#### 模板表单 (ApprovalTemplateForm)
- 创建/编辑审批模板
- 表单设计器（拖拽式表单设计）
- 流程设计器（可视化流程配置）
- 模板预览

#### 表单设计器 (FormDesigner)
- 支持多种字段类型（文本、数字、日期、下拉选择等）
- 字段配置（必填、占位符、选项等）
- 字段排序

#### 流程设计器 (FlowDesigner)
- 审批节点配置
- 审批人配置（固定人员、角色、部门负责人、发起人上级）
- 抄送人配置
- 节点排序

### 4. 审批台账导出

#### 台账导出 (ApprovalExport)
- 按模板导出
- 按状态筛选
- 按时间范围筛选
- Excel 文件下载
- 导出进度提示

## 组件结构

```
frontend/src/pages/approval/
├── ApprovalInitiate.tsx          # 审批发起页面
├── ApprovalDetail.tsx            # 审批详情页面
├── ApprovalPending.tsx           # 待办审批列表
├── ApprovalProcessed.tsx         # 已办审批列表
├── ApprovalCC.tsx                # 抄送审批列表
├── ApprovalFollowed.tsx          # 关注审批列表
├── ApprovalAll.tsx               # 全部审批列表
├── ApprovalTemplateList.tsx      # 审批模板列表
├── ApprovalTemplateForm.tsx      # 审批模板表单
├── ApprovalTemplateView.tsx      # 审批模板预览
├── ApprovalExport.tsx            # 审批台账导出
├── components/
│   ├── ApprovalList.tsx          # 统一的审批列表组件
│   ├── FormDesigner.tsx          # 表单设计器组件
│   ├── FlowDesigner.tsx          # 流程设计器组件
│   └── index.ts                  # 组件导出
├── index.ts                      # 页面导出
└── README.md                     # 本文档
```

## API 服务

```
frontend/src/api/approvalService.ts
```

提供以下 API 方法：
- 审批模板管理（CRUD）
- 审批实例管理（CRUD）
- 审批处理操作
- 审批关注和评论
- 审批台账导出

## 类型定义

```
frontend/src/types/index.ts
```

包含以下类型定义：
- ApprovalTemplate - 审批模板
- ApprovalInstance - 审批实例
- ApprovalNode - 审批节点
- ApprovalFollow - 审批关注
- ApprovalComment - 审批评论
- 相关的查询参数和表单数据类型

## 使用示例

### 发起审批

```typescript
import { ApprovalInitiate } from './pages/approval'

// 在业务页面中使用
<ApprovalInitiate
  businessType="follow_up"
  businessId={123}
  onSuccess={() => {
    // 审批发起成功后的回调
  }}
/>
```

### 查看审批详情

```typescript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

// 跳转到审批详情页面
navigate(`/approval/detail/${instanceId}`)
```

### 配置审批模板

```typescript
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

// 创建新模板
navigate('/approval/template/create')

// 编辑模板
navigate(`/approval/template/edit/${templateId}`)
```

## 路由配置

需要在路由配置中添加以下路由：

```typescript
{
  path: '/approval',
  children: [
    { path: 'initiate', element: <ApprovalInitiate /> },
    { path: 'detail/:id', element: <ApprovalDetail /> },
    { path: 'pending', element: <ApprovalPending /> },
    { path: 'processed', element: <ApprovalProcessed /> },
    { path: 'cc', element: <ApprovalCC /> },
    { path: 'followed', element: <ApprovalFollowed /> },
    { path: 'all', element: <ApprovalAll /> },
    { path: 'template/list', element: <ApprovalTemplateList /> },
    { path: 'template/create', element: <ApprovalTemplateForm /> },
    { path: 'template/edit/:id', element: <ApprovalTemplateForm /> },
    { path: 'template/view/:id', element: <ApprovalTemplateView /> },
    { path: 'export', element: <ApprovalExport /> },
  ]
}
```

## 注意事项

1. **权限控制**：所有审批操作都需要相应的权限，需要在路由层面或组件层面进行权限检查
2. **数据权限**：审批列表会根据用户的数据权限范围进行过滤
3. **用户上下文**：部分功能需要获取当前登录用户信息，需要实现用户上下文
4. **文件上传**：表单设计器和流程设计器可能需要文件上传功能的支持
5. **实时通知**：审批状态变更时应该通过消息通知相关人员

## 后续优化

1. 添加审批流程图可视化展示（使用流程图库如 AntV G6）
2. 支持更复杂的流程配置（条件分支、并行审批等）
3. 添加审批统计和分析功能
4. 支持审批模板的导入导出
5. 优化移动端体验
6. 添加审批提醒和催办功能
