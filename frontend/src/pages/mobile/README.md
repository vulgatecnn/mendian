# 移动端功能说明

## 概述

开店计划管理系统的移动端功能，专为企业微信环境优化，支持离线访问和实时通知。

## 功能特性

### 1. 计划查看

#### 计划列表 (`PlanList.tsx`)
- 📱 移动端优化的列表展示
- 🔄 下拉刷新和上拉加载更多
- 📊 实时显示计划状态和完成进度
- 🎨 状态标签颜色区分（草稿、已发布、执行中、已完成、已取消）

#### 计划详情 (`PlanDetail.tsx`)
- 📋 完整的计划信息展示
- 📈 可视化进度条显示
- 🗺️ 区域计划明细
- 💰 预算信息展示

### 2. 企业微信集成

#### 身份认证 (`WeChatLogin.tsx`)
- 🔐 企业微信OAuth认证
- 👤 自动获取用户信息
- 🔄 认证状态持久化
- ⚡ 自动登录和跳转

#### 消息推送 (后端服务)
- 📢 计划发布通知
- ⚠️ 计划预警提醒
- ✅ 进度更新通知
- ❌ 计划取消通知

### 3. 离线支持

#### 数据缓存 (`offlineCache.ts`)
- 💾 IndexedDB本地存储
- ⏰ 智能缓存过期管理
- 🗑️ 自动清理过期数据
- 📦 分类存储（计划、区域、门店类型、统计）

#### 网络检测 (`useNetworkStatus.ts`)
- 🌐 实时网络状态监控
- 📶 网络类型识别（2G/3G/4G）
- 🐌 慢速网络检测
- 💬 状态变化通知

#### 离线数据管理 (`useOfflineData.ts`)
- 🔄 自动缓存同步
- 📴 离线数据访问
- 🔁 网络恢复自动刷新
- ⚡ 智能加载策略

## 使用指南

### 访问移动端

1. **通过企业微信应用**
   - 打开企业微信
   - 找到"好饭碗门店管理"应用
   - 点击进入自动登录

2. **直接访问（需在企业微信浏览器中）**
   ```
   https://your-domain.com/mobile/login
   ```

### 路由配置

需要在主路由配置中添加移动端路由：

```typescript
import { MobilePlanList, MobilePlanDetail, WeChatLogin } from './pages/mobile'

// 移动端路由
{
  path: '/mobile',
  children: [
    {
      path: 'login',
      element: <WeChatLogin />
    },
    {
      path: 'plans',
      element: <MobilePlanList />
    },
    {
      path: 'plans/:id',
      element: <MobilePlanDetail />
    }
  ]
}
```

### 环境配置

#### 前端配置

在 `.env` 文件中配置：

```bash
# 前端URL（用于企业微信回调）
VITE_FRONTEND_URL=https://your-domain.com
```

#### 后端配置

在 `backend/.env` 文件中配置：

```bash
# 企业微信配置
WECHAT_CORP_ID=你的企业ID
WECHAT_AGENT_ID=你的应用AgentId
WECHAT_SECRET=你的应用Secret

# 前端URL（用于消息推送链接）
FRONTEND_URL=https://your-domain.com
```

详细配置说明请参考：`backend/WECHAT_CONFIG.md`

## API接口

### 企业微信认证

```typescript
// 获取认证URL
const authUrl = await WeChatService.getAuthUrl(redirectUri, state)

// 使用code换取用户信息
const response = await WeChatService.authenticate({ code, state })
```

### 离线数据访问

```typescript
// 使用预定义的Hook
const { data, loading, fromCache, refresh } = useOfflinePlans()

// 自定义离线数据
const { data, loading, fromCache, refresh } = useOfflineData({
  storeName: CACHE_STORES.PLANS,
  cacheKey: 'my_data',
  fetchFn: async () => {
    return await fetchMyData()
  },
  expiresIn: CACHE_EXPIRY.MEDIUM
})
```

### 网络状态检测

```typescript
const { 
  isOnline, 
  isOffline, 
  isSlow, 
  networkInfo 
} = useNetworkStatus({
  showNotification: true,
  slowThreshold: 1000
})
```

## 缓存策略

### 缓存存储分类

- **plans**: 计划数据
- **regions**: 经营区域
- **storeTypes**: 门店类型
- **statistics**: 统计数据

### 缓存过期时间

- **SHORT**: 5分钟 - 用于频繁变化的数据
- **MEDIUM**: 30分钟 - 用于一般数据
- **LONG**: 24小时 - 用于基础数据
- **NEVER**: 永不过期 - 用于静态数据

### 缓存管理

```typescript
// 保存数据
await offlineCache.set(storeName, key, data, expiresIn)

// 获取数据
const data = await offlineCache.get(storeName, key)

// 删除数据
await offlineCache.delete(storeName, key)

// 清空存储
await offlineCache.clear(storeName)

// 清理过期数据
const deletedCount = await offlineCache.cleanExpired(storeName)
```

## 消息推送

### 后端服务使用

```python
from store_planning.services.wechat_notification_service import wechat_notification_service

# 发送计划发布通知
wechat_notification_service.notify_plan_published(
    plan=plan,
    user_ids=['user1', 'user2']
)

# 发送预警通知
wechat_notification_service.notify_plan_alert(
    plan=plan,
    alert_type='低完成率预警',
    alert_message='当前完成率低于50%',
    user_ids=['user1', 'user2']
)

# 发送进度更新通知
wechat_notification_service.notify_progress_update(
    plan=plan,
    region_name='华东区',
    store_type_name='直营店',
    user_ids=['user1', 'user2']
)
```

## 样式定制

移动端样式文件：`frontend/src/pages/mobile/mobile.css`

### 主要样式类

- `.mobile-plan-list` - 计划列表容器
- `.mobile-plan-detail` - 计划详情容器
- `.mobile-header` - 移动端头部
- `.mobile-content` - 内容区域
- `.mobile-plan-card` - 计划卡片
- `.cache-notice` - 缓存提示
- `.network-status` - 网络状态指示器

### 响应式设计

支持不同屏幕尺寸，特别优化了小屏设备（≤375px）的显示效果。

## 性能优化

### 1. 数据加载优化
- 首次加载优先使用缓存
- 在线时后台刷新最新数据
- 分页加载减少单次数据量

### 2. 网络优化
- 离线时自动使用缓存
- 慢速网络提示用户
- 网络恢复自动同步

### 3. 渲染优化
- 虚拟滚动（大列表）
- 懒加载图片
- 防抖和节流

## 故障排除

### 1. 无法登录
- 检查是否在企业微信环境中
- 确认企业微信配置正确
- 查看浏览器控制台错误信息

### 2. 数据不更新
- 检查网络连接状态
- 手动刷新数据
- 清除缓存后重试

### 3. 消息推送失败
- 确认企业微信配置正确
- 检查用户ID是否正确
- 查看后端日志

## 开发调试

### 本地开发

```bash
# 启动前端开发服务器
cd frontend
pnpm dev

# 启动后端服务器
cd backend
python manage.py runserver
```

### 模拟企业微信环境

在浏览器中修改User-Agent：
```
Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/3.0.0
```

### 调试缓存

```typescript
// 在浏览器控制台中
import { offlineCache, CACHE_STORES } from './utils/offlineCache'

// 查看缓存大小
await offlineCache.getSize(CACHE_STORES.PLANS)

// 查看所有缓存数据
await offlineCache.getAll(CACHE_STORES.PLANS)

// 清空缓存
await offlineCache.clear(CACHE_STORES.PLANS)
```

## 安全注意事项

1. **认证令牌安全**
   - 使用HTTPS传输
   - 令牌存储在localStorage
   - 定期刷新令牌

2. **数据安全**
   - 敏感数据不缓存
   - 缓存数据加密（可选）
   - 定期清理过期数据

3. **权限控制**
   - 验证用户权限
   - 限制数据访问范围
   - 记录操作日志

## 未来改进

- [ ] 支持离线编辑
- [ ] 增加数据同步冲突处理
- [ ] 支持更多企业微信JS-SDK功能
- [ ] 优化大数据量场景
- [ ] 增加数据压缩
- [ ] 支持PWA离线应用

## 相关文档

- [企业微信配置指南](../../../backend/WECHAT_CONFIG.md)
- [前端快速开始](../../QUICK_START.md)
- [状态管理指南](../../STATE_MANAGEMENT_GUIDE.md)
