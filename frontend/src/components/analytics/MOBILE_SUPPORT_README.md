# 移动端支持实现文档

## 概述

本文档描述了数据分析模块的移动端支持实现，包括移动端优化的大屏界面、关键指标卡片式展示、图表交互支持、企业微信通知推送和离线数据缓存功能。

## 功能特性

### 1. 移动端优化的大屏界面

**组件**: `MobileDashboard.tsx`

- 响应式布局设计，适配不同尺寸的移动设备
- 标签页式导航（概览、地图）
- 自动刷新机制（默认5分钟）
- 全屏模式支持
- 离线模式提示

**使用示例**:
```tsx
import { MobileDashboard } from '@/components/analytics'

<MobileDashboard 
  refreshInterval={300000} // 5分钟自动刷新
  enableNotifications={true} // 启用通知
/>
```

### 2. 关键指标卡片式展示

**特性**:
- 门店总数、运营中、跟进中、筹备中等关键指标
- 卡片式布局，易于浏览
- 颜色编码，快速识别状态
- 本月新增门店高亮显示

**实现位置**: `MobileDashboard.tsx` - `renderKeyMetrics()`

### 3. 移动端图表交互支持

#### 3.1 门店地图组件 (`MobileStoreMap.tsx`)

**功能**:
- 按省份/状态分组显示
- 门店列表展示
- 点击查看门店详情
- 状态统计可视化

**交互**:
- 触摸点击门店项
- 滑动浏览门店列表
- 抽屉式详情展示

#### 3.2 跟进漏斗图 (`MobileFunnelChart.tsx`)

**功能**:
- 漏斗阶段可视化
- 转化率计算和展示
- 预警信息提示
- 阶段详情查看

**交互**:
- 点击漏斗阶段查看详情
- 触摸反馈动画
- 转化率详情列表

#### 3.3 计划进度图 (`MobilePlanProgress.tsx`)

**功能**:
- 总体进度统计
- 计划列表展示
- 分组进度分析
- 完成率可视化

**交互**:
- 点击计划查看详情
- 进度条交互
- 抽屉式详情展示

### 4. 企业微信通知推送

**服务**: `MobileNotificationService.ts`

**功能**:
- 企业微信消息推送
- 浏览器通知
- 应用内消息提示
- 智能通知选择

**通知类型**:
- 数据更新通知
- 预警通知
- 错误通知
- 批量通知

**使用示例**:
```tsx
import { useMobileNotification } from '@/hooks/useMobileNotification'

const { sendNotification, notifyWarning } = useMobileNotification({
  autoRequestPermission: true,
  enableDataUpdateNotification: true
})

// 发送通知
await sendNotification({
  title: '数据更新',
  content: '经营大屏数据已更新',
  type: 'info'
})

// 发送预警
await notifyWarning(
  '转化率预警',
  '某阶段转化率低于阈值',
  '/mobile/analytics'
)
```

**企业微信集成**:
- 自动检测企业微信环境
- 使用企业微信API发送消息
- 支持文本和文本卡片消息
- 支持指定用户和部门

**后端API**:
```
POST /api/wechat/messages/send/
{
  "message_type": "textcard",
  "title": "通知标题",
  "content": "通知内容",
  "url": "跳转链接",
  "to_users": ["user1", "user2"],
  "to_departments": [1, 2],
  "business_type": "analytics",
  "business_id": 123
}
```

### 5. 离线数据缓存功能

**工具**: `offlineCache.ts`

**功能**:
- IndexedDB存储
- 自动缓存管理
- 过期时间控制
- 离线数据访问

**Hook**: `useOfflineData.ts`

**使用示例**:
```tsx
import { useOfflineData } from '@/hooks/useOfflineData'
import { CACHE_STORES, CACHE_EXPIRY } from '@/utils/offlineCache'

const {
  data,
  loading,
  fromCache,
  isOffline,
  refresh,
  clearCache
} = useOfflineData({
  storeName: CACHE_STORES.STATISTICS,
  cacheKey: 'dashboard_data',
  fetchFn: async () => {
    // 获取数据的函数
    return await fetchDashboardData()
  },
  expiresIn: CACHE_EXPIRY.MEDIUM,
  autoFetch: true
})
```

**缓存策略**:
- 优先使用缓存数据（快速加载）
- 在线时自动更新数据
- 离线时使用缓存数据
- 网络恢复时自动刷新

**缓存存储**:
- `CACHE_STORES.STATISTICS`: 统计数据
- `CACHE_STORES.PLANS`: 计划数据
- `CACHE_STORES.REGIONS`: 区域数据
- `CACHE_STORES.STORE_TYPES`: 门店类型数据

**过期时间**:
- `CACHE_EXPIRY.SHORT`: 5分钟
- `CACHE_EXPIRY.MEDIUM`: 30分钟
- `CACHE_EXPIRY.LONG`: 24小时
- `CACHE_EXPIRY.NEVER`: 永不过期

## 页面集成

**移动端数据分析页面**: `MobileAnalytics.tsx`

**路由**: `/mobile/analytics`

**功能**:
- 经营大屏标签页
- 数据报表标签页
- 设置标签页
- 通知权限管理
- 网络状态显示

## 样式文件

- `MobileDashboard.css`: 大屏样式
- `MobileStoreMap.css`: 地图样式
- `MobileFunnelChart.css`: 漏斗图样式
- `MobilePlanProgress.css`: 进度图样式
- `MobileAnalytics.css`: 分析页面样式

## 响应式设计

所有组件都针对移动设备进行了优化：

- 触摸友好的交互
- 适配不同屏幕尺寸
- 优化的字体大小
- 简化的布局
- 快速的加载速度

## 性能优化

1. **数据缓存**: 使用IndexedDB缓存数据，减少网络请求
2. **懒加载**: 按需加载组件和数据
3. **虚拟滚动**: 大列表使用虚拟滚动
4. **防抖节流**: 优化频繁触发的事件
5. **代码分割**: 按路由分割代码

## 浏览器兼容性

- Chrome (Android): ✅
- Safari (iOS): ✅
- 企业微信内置浏览器: ✅
- 其他现代移动浏览器: ✅

## 注意事项

1. **通知权限**: 首次使用需要用户授权通知权限
2. **网络状态**: 离线模式下功能受限
3. **企业微信**: 某些功能仅在企业微信环境中可用
4. **缓存清理**: 定期清理过期缓存以释放存储空间

## 未来改进

1. 支持更多图表类型
2. 增强离线功能
3. 优化动画效果
4. 添加手势操作
5. 支持暗黑模式

## 相关文档

- [企业微信集成文档](../../../backend/wechat_integration/README.md)
- [离线缓存文档](../../utils/offlineCache.ts)
- [网络状态检测文档](../../hooks/useNetworkStatus.ts)
