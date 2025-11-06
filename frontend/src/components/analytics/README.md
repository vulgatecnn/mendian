# 数据分析组件

本目录包含了经营大屏的数据分析和可视化组件。

## 组件列表

### StoreMapVisualization - 开店地图可视化组件
- **功能**: 基于 Leaflet 地图展示门店分布和状态
- **特性**: 
  - 支持不同门店状态的图标显示（计划中、拓店中、筹备中、已开店）
  - 地图交互操作（缩放、平移、点击）
  - 区域和状态筛选
  - 门店统计图例
  - 响应式设计

### FollowUpFunnelChart - 跟进漏斗图表组件
- **功能**: 使用 ECharts 展示拓店流程的转化漏斗
- **特性**:
  - 漏斗图可视化（调研→谈判→测算→报店→签约）
  - 转化率计算和预警
  - 详细数据弹窗
  - 阶段点击交互

### PlanProgressChart - 计划完成进度图表组件
- **功能**: 展示开店计划的完成情况和进度分析
- **特性**:
  - 多种图表类型（柱状图、饼图、折线图）
  - 按贡献率类型分组统计
  - 进度预警和风险提示
  - 计划状态监控

### DataFilters - 数据筛选组件
- **功能**: 提供统一的数据筛选界面
- **特性**:
  - 时间范围选择（支持预设快捷选项）
  - 业务区域多选
  - 门店类型筛选
  - 贡献率类型筛选
  - 可折叠界面

## 技术栈

- **React + TypeScript**: 主要开发框架
- **Arco Design**: UI 组件库
- **ECharts**: 图表可视化库
- **React Leaflet**: 地图组件
- **CSS Modules**: 样式管理

## 数据流

1. **API 服务**: `analyticsService.ts` 提供数据获取和缓存管理
2. **模拟数据**: `mockAnalyticsData.ts` 提供开发和测试用的模拟数据
3. **类型定义**: 完整的 TypeScript 类型定义确保类型安全
4. **状态管理**: 使用 React Hooks 进行组件状态管理

## 使用示例

```tsx
import { 
  StoreMapVisualization, 
  FollowUpFunnelChart, 
  PlanProgressChart, 
  DataFilters 
} from '../components/analytics'

// 在经营大屏中使用
<DataFilters
  filters={filters}
  onFiltersChange={handleFiltersChange}
  onReset={handleFiltersReset}
/>

<StoreMapVisualization
  data={dashboardData.storeMap}
  loading={loading}
  error={error}
  filters={filters}
  onRefresh={handleRefresh}
/>

<FollowUpFunnelChart
  data={dashboardData.followUpFunnel}
  loading={loading}
  onStageClick={handleFunnelStageClick}
/>

<PlanProgressChart
  data={dashboardData.planProgress}
  loading={loading}
  onPlanClick={handlePlanClick}
/>
```

## 测试

组件包含完整的单元测试，使用 Vitest 和 React Testing Library：

```bash
# 运行所有分析组件测试
pnpm vitest src/components/analytics

# 运行特定组件测试
pnpm vitest StoreMapVisualization.test.tsx --run
```

## 样式

每个组件都有对应的 CSS Modules 样式文件，支持：
- 响应式设计
- 主题适配
- 动画效果
- 可访问性

## 性能优化

- **数据缓存**: API 服务层实现了智能缓存机制
- **组件优化**: 使用 React.memo 和 useMemo 优化渲染性能
- **懒加载**: 图表组件支持按需加载
- **虚拟化**: 大数据量时支持虚拟滚动