# 好饭碗门店管理系统 - UI组件库

## 概述

基于设计系统规范完善的好饭碗门店管理系统前端组件库，提供了完整的企业级中后台UI解决方案。

## 已完成的核心功能

### 1. 优化的布局系统

#### MainLayout - 桌面端布局
- ✅ 层级化菜单结构（支持二级菜单）
- ✅ 业务专用图标和品牌标识
- ✅ 面包屑导航系统
- ✅ 用户信息展示优化
- ✅ 消息通知中心
- ✅ 侧边栏展开收起功能

#### MobileLayout - 移动端布局
- ✅ 触屏友好的交互设计
- ✅ 抽屉式导航菜单
- ✅ 悬浮操作按钮组
- ✅ 移动端专用头部工具栏
- ✅ 底部安全区域适配

#### ResponsiveLayout - 响应式布局
- ✅ 自动设备检测和布局切换
- ✅ 断点管理和屏幕适配
- ✅ 强制布局模式支持

### 2. 设计系统组件库

#### StatusTag - 状态标签组件
- ✅ 统一的状态色彩体系
- ✅ 多种状态类型支持（业务状态、优先级、门店类型）
- ✅ 小尺寸和标准尺寸
- ✅ 语义化状态映射

#### StatCard - 统计卡片组件
- ✅ 多颜色主题支持
- ✅ 趋势指示器
- ✅ 渐变装饰设计
- ✅ 数据可视化优化
- ✅ 响应式尺寸调整

#### StoreCard - 门店卡片组件
- ✅ 丰富的门店信息展示
- ✅ 图片和无图片状态处理
- ✅ 经营数据统计显示
- ✅ 状态标签集成
- ✅ 操作按钮组

#### ProgressTracker - 进度跟踪组件
- ✅ 可视化进度展示
- ✅ 步骤状态管理
- ✅ 当前步骤详情显示
- ✅ 水平和垂直布局
- ✅ 整体进度百分比

### 3. 完善的主题系统

#### 设计令牌（Design Tokens）
- ✅ 完整的颜色系统（主色、功能色、中性色）
- ✅ 标准化间距体系（基于8px栅格）
- ✅ 字体规格和行高系统
- ✅ 圆角和阴影规范
- ✅ CSS变量自动生成

#### 暗色主题支持
- ✅ 暗色主题令牌配置
- ✅ 主题切换功能
- ✅ 组件暗色适配

### 4. 增强的Dashboard页面

#### 数据可视化优化
- ✅ 使用新的StatCard替代原始卡片
- ✅ 圆环进度图表展示业务概览
- ✅ 状态标签统一化显示
- ✅ 最近动态时间轴
- ✅ 快捷操作面板

#### 交互体验提升
- ✅ 更丰富的数据展示
- ✅ 趋势指示和对比数据
- ✅ 响应式布局优化
- ✅ 加载状态和空状态处理

### 5. 响应式设计和移动端适配

#### 移动端专用优化
- ✅ 触摸友好的按钮尺寸（44px最小触摸目标）
- ✅ 移动端表单优化（防止iOS输入放大）
- ✅ 移动端卡片网格布局
- ✅ 滚动性能优化
- ✅ 安全区域适配

#### 响应式断点管理
- ✅ 标准化断点系统
- ✅ 内容重排和布局调整
- ✅ 组件响应式行为
- ✅ 媒体查询优化

## 文件结构

```
src/
├── components/
│   ├── business/           # 业务组件
│   │   ├── StatusTag.tsx   # 状态标签
│   │   ├── StatCard.tsx    # 统计卡片
│   │   ├── StoreCard.tsx   # 门店卡片
│   │   ├── ProgressTracker.tsx # 进度跟踪
│   │   └── index.ts        # 组件导出
│   ├── layout/             # 布局组件
│   │   ├── MainLayout.tsx  # 桌面端布局
│   │   ├── MobileLayout.tsx # 移动端布局
│   │   ├── ResponsiveLayout.tsx # 响应式布局
│   │   └── index.ts        # 布局导出
│   └── common/             # 通用组件
├── styles/
│   ├── theme.ts           # 主题配置和设计令牌
│   ├── variables.scss     # CSS变量定义
│   └── index.scss         # 全局样式和响应式优化
└── pages/
    └── dashboard/
        └── Dashboard.tsx   # 优化后的仪表板页面
```

## 设计系统特性

### 颜色系统
- 主色调：#1890FF（好饭碗品牌蓝）
- 功能色：成功绿色、警告橙色、错误红色
- 中性色：9级灰度系统
- 暗色主题：完整的暗色适配

### 间距系统
- 基于8px栅格
- 6个标准间距：xs(4px) | sm(8px) | md(16px) | lg(24px) | xl(32px) | xxl(48px)

### 字体系统
- 中文字体栈优化
- 7个字体尺寸等级
- 4个字重等级
- 3个行高规格

### 组件设计原则
- 一致性：统一的视觉语言
- 可访问性：符合WCAG 2.1标准
- 响应式：移动端友好
- 性能优化：轻量级实现

## 使用示例

```tsx
import { StatusTag, StatCard, StoreCard } from '@/components/business'
import { ResponsiveLayout } from '@/components/layout'

// 状态标签
<StatusTag type="status" value="in_progress" size="small" />

// 统计卡片
<StatCard
  title="总门店数"
  value={128}
  prefix={<ShopOutlined />}
  color="blue"
  trend={{ value: '+12%', isPositive: true, label: '较上月' }}
/>

// 门店卡片
<StoreCard
  id="1"
  name="朝阳大悦城店"
  address="北京市朝阳区朝阳大悦城3F"
  storeType="direct"
  status="in_progress"
  area={150}
  revenue={45}
  customers={8500}
/>
```

## 下一步规划

- [ ] 组件库Storybook文档
- [ ] 单元测试覆盖
- [ ] 性能监控和优化
- [ ] 可访问性测试
- [ ] 国际化支持
- [ ] 组件API文档完善