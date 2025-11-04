 # 经营大屏模块

经营大屏模块提供门店开业进度的可视化分析和数据报表功能，帮助管理层实时监控经营状况和决策支持。

## 功能特性

### 1. 数据可视化大屏 (BusinessDashboard)

- **实时监控**: 实时显示门店开业进度和关键指标
- **全屏模式**: 支持全屏展示，适合大屏幕显示
- **自动刷新**: 可配置自动刷新间隔（30秒、1分钟、5分钟）
- **数据筛选**: 支持按区域、时间范围筛选数据
- **预警提醒**: 显示重要的业务预警信息

#### 主要组件
- 概览统计卡片：总计划数、执行中计划、目标门店数、完成进度
- 区域绩效排行：各区域的完成情况和排名
- 最近计划列表：最新的计划执行状态
- 预警信息面板：重要的业务提醒和预警

### 2. 数据报表 (DataReports)

- **多维度分析**: 按区域、门店类型、时间等维度分析数据
- **趋势分析**: 月度趋势变化分析
- **绩效排行**: 优秀表现和待改进区域排行
- **数据导出**: 支持导出Excel格式的分析报表
- **灵活查询**: 多种筛选条件组合查询

#### 报表类型
- 概览统计：整体数据概览
- 区域分析：各区域详细数据分析
- 门店类型分析：不同门店类型的表现对比
- 月度趋势：时间维度的趋势分析
- 绩效排行：区域绩效排名和对比

## 技术实现

### 组件架构

```
business-dashboard/
├── index.ts                    # 模块导出
├── BusinessDashboard.tsx       # 数据可视化大屏
├── BusinessDashboard.module.css
├── DataReports.tsx            # 数据报表页面
├── DataReports.module.css
└── README.md                  # 说明文档
```

### 核心技术

- **React Hooks**: 使用 useState、useEffect 等管理组件状态
- **Arco Design**: 使用 Card、Table、Progress、Statistic 等组件
- **CSS Modules**: 模块化样式管理
- **TypeScript**: 类型安全的开发体验
- **统计服务**: 集成 useStatisticsService Hook

### 数据流

1. **数据获取**: 通过 StatisticsService 获取仪表板和报表数据
2. **状态管理**: 使用 React Hooks 管理组件状态
3. **缓存机制**: 支持数据缓存，减少重复请求
4. **错误处理**: 统一的错误处理和用户提示

## 使用方法

### 基本用法

```tsx
import { BusinessDashboard, DataReports } from '../pages/business-dashboard'

// 在路由中使用
<Route path="/business-dashboard" element={<BusinessDashboard />} />
<Route path="/data-reports" element={<DataReports />} />
```

### 路由配置

需要在主路由配置中添加经营大屏模块的路由：

```tsx
// 经营大屏模块路由
export const BusinessDashboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="dashboard" 
        element={
          <ProtectedRoute permission="business_dashboard.view">
            <BusinessDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="reports" 
        element={
          <ProtectedRoute permission="business_dashboard.reports">
            <DataReports />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}
```

## API 接口

### 仪表板数据接口

```typescript
// 获取仪表板数据
GET /api/v1/statistics/dashboard/

// 响应格式
interface DashboardData {
  summary: {
    total_plans: number
    active_plans: number
    completed_plans: number
    total_target: number
    total_completed: number
    overall_completion_rate: number
  }
  recent_plans: Array<{
    id: number
    name: string
    status: string
    completion_rate: number
    start_date: string
    end_date: string
  }>
  region_performance: Array<{
    region_id: number
    region_name: string
    total_target: number
    total_completed: number
    completion_rate: number
    plan_count: number
  }>
  alerts: Array<{
    plan_id: number
    plan_name: string
    type: string
    message: string
    severity: 'low' | 'medium' | 'high'
    created_at: string
  }>
}
```

### 报表数据接口

```typescript
// 获取分析报表
GET /api/v1/statistics/reports/

// 查询参数
interface ReportQueryParams {
  start_date?: string
  end_date?: string
  region_id?: number
  store_type_id?: number
  plan_type?: 'annual' | 'quarterly'
  status?: string
}

// 导出报表
GET /api/v1/statistics/reports/export/
```

## 样式定制

### CSS 变量

可以通过 CSS 变量自定义主题色彩：

```css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --text-color: #262626;
  --border-color: #d9d9d9;
}
```

### 响应式设计

组件支持响应式设计，在不同屏幕尺寸下自动调整布局：

- **桌面端** (>1200px): 完整布局
- **平板端** (768px-1200px): 调整列数和间距
- **移动端** (<768px): 单列布局

## 性能优化

### 数据缓存

- 使用内存缓存减少重复请求
- 可配置缓存有效期（默认5分钟）
- 支持手动清除缓存

### 懒加载

- 组件按需加载
- 图表数据延迟渲染
- 虚拟滚动优化长列表

### 防抖节流

- 搜索输入防抖处理
- 窗口大小变化节流处理
- 自动刷新定时器优化

## 扩展开发

### 添加新的图表类型

1. 在组件中添加新的渲染方法
2. 更新数据接口类型定义
3. 添加对应的样式文件

### 自定义筛选条件

1. 在查询参数接口中添加新字段
2. 在搜索表单中添加对应的表单项
3. 更新API调用逻辑

### 集成第三方图表库

可以集成 ECharts、Chart.js 等图表库来增强可视化效果：

```tsx
import * as echarts from 'echarts'

const ChartComponent: React.FC = () => {
  // 图表实现逻辑
}
```

## 注意事项

1. **权限控制**: 确保用户有相应的查看权限
2. **数据安全**: 敏感数据需要脱敏处理
3. **性能监控**: 大数据量时注意性能优化
4. **浏览器兼容**: 确保在主流浏览器中正常运行
5. **移动端适配**: 在移动设备上保持良好的用户体验

## 更新日志

### v1.0.0 (2024-01-XX)
- 初始版本发布
- 实现数据可视化大屏功能
- 实现数据报表分析功能
- 支持全屏模式和自动刷新
- 支持数据导出功能