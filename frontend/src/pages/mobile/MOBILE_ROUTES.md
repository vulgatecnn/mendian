# 移动端路由配置指南

## 概述

本文档说明如何在主路由配置中添加移动端路由。

## 路由结构

移动端路由应该添加到主路由配置文件 `frontend/src/routes/index.tsx` 中。

## 完整路由配置示例

```typescript
import {
  MobileLayout,
  MobileHome,
  MobileWorkbench,
  MobileMessages,
  MobileProfile,
  MobileLocationList,
  MobileFollowUpList,
  MobileFollowUpDetail,
  MobileConstructionAcceptance,
  MobileApprovalList,
  MobileApprovalDetail,
  WeChatLogin
} from '../pages/mobile';

// 在 AppRoutes 组件中添加移动端路由
<Route path="/mobile" element={<MobileLayout />}>
  {/* 首页 */}
  <Route path="home" element={<MobileHome />} />
  
  {/* 工作台 */}
  <Route path="work" element={<MobileWorkbench />} />
  
  {/* 拓店管理 */}
  <Route path="expansion">
    <Route path="locations" element={<MobileLocationList />} />
    <Route path="locations/:id" element={<MobileFollowUpDetail />} />
    <Route path="follow-ups" element={<MobileFollowUpList />} />
    <Route path="follow-ups/:id" element={<MobileFollowUpDetail />} />
  </Route>
  
  {/* 开店筹备 */}
  <Route path="preparation">
    <Route path="construction/:id/acceptance" element={<MobileConstructionAcceptance />} />
  </Route>
  
  {/* 审批中心 */}
  <Route path="approvals">
    <Route index element={<MobileApprovalList />} />
    <Route path="pending" element={<MobileApprovalList />} />
    <Route path="processed" element={<MobileApprovalList />} />
    <Route path=":id" element={<MobileApprovalDetail />} />
  </Route>
  
  {/* 消息中心 */}
  <Route path="messages" element={<MobileMessages />} />
  
  {/* 个人中心 */}
  <Route path="profile" element={<MobileProfile />} />
</Route>

{/* 企业微信登录（独立路由） */}
<Route path="/mobile/login" element={<WeChatLogin />} />
```

## 路由说明

### 主要路由

- `/mobile/home` - 移动端首页，显示待办事项和快捷入口
- `/mobile/work` - 工作台，提供各业务模块的快速访问
- `/mobile/messages` - 消息中心
- `/mobile/profile` - 个人中心
- `/mobile/login` - 企业微信登录页

### 拓店管理路由

- `/mobile/expansion/locations` - 候选点位列表
- `/mobile/expansion/locations/:id` - 候选点位详情
- `/mobile/expansion/follow-ups` - 跟进单列表
- `/mobile/expansion/follow-ups/:id` - 跟进单详情

### 开店筹备路由

- `/mobile/preparation/construction/:id/acceptance` - 工程验收

### 审批中心路由

- `/mobile/approvals` - 审批列表（全部）
- `/mobile/approvals/pending` - 待办审批
- `/mobile/approvals/processed` - 已办审批
- `/mobile/approvals/:id` - 审批详情

## 权限控制

移动端路由建议使用与PC端相同的权限控制机制。可以使用 `ProtectedRoute` 组件包裹需要权限的路由：

```typescript
<Route 
  path="expansion/locations" 
  element={
    <ProtectedRoute permission="expansion.location.view">
      <MobileLocationList />
    </ProtectedRoute>
  } 
/>
```

## 底部导航栏

移动端使用 `MobileLayout` 组件提供统一的底部导航栏，包含以下标签：

1. 首页 - `/mobile/home`
2. 工作台 - `/mobile/work`
3. 审批 - `/mobile/approvals`
4. 消息 - `/mobile/messages`（带未读数量徽标）
5. 我的 - `/mobile/profile`

## 企业微信集成

### 登录流程

1. 用户在企业微信中打开应用
2. 自动跳转到 `/mobile/login`
3. 系统检测企业微信环境并发起OAuth认证
4. 认证成功后跳转到 `/mobile/home`

### 配置要求

确保在 `.env` 文件中配置了企业微信相关参数：

```bash
VITE_FRONTEND_URL=https://your-domain.com
```

后端也需要配置企业微信参数，详见 `backend/WECHAT_CONFIG.md`。

## 离线支持

所有移动端页面都支持离线访问，使用 `useOfflineData` Hook 实现：

- 首次加载时优先使用缓存数据
- 在线时后台刷新最新数据
- 离线时完全使用缓存数据
- 支持下拉刷新手动更新

## 响应式设计

移动端页面针对以下屏幕尺寸进行了优化：

- 标准移动设备：375px - 414px
- 小屏设备：≤375px
- 平板设备：768px+（自动适配）

## 测试建议

### 本地测试

1. 启动开发服务器：`pnpm dev`
2. 在浏览器中打开开发者工具
3. 切换到移动设备模拟模式
4. 访问 `http://localhost:5173/mobile/home`

### 企业微信环境测试

1. 修改浏览器 User-Agent 模拟企业微信环境：
   ```
   Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/3.0.0
   ```

2. 或使用企业微信开发者工具进行真机调试

## 常见问题

### 1. 路由跳转不生效

确保使用 `useNavigate` Hook 进行路由跳转：

```typescript
const navigate = useNavigate();
navigate('/mobile/home');
```

### 2. 底部导航栏不显示

检查路由是否正确嵌套在 `MobileLayout` 下。

### 3. 离线数据不更新

检查网络状态，手动下拉刷新页面。

### 4. 企业微信登录失败

检查企业微信配置是否正确，查看浏览器控制台错误信息。

## 相关文档

- [移动端功能说明](./README.md)
- [企业微信配置指南](../../../backend/WECHAT_CONFIG.md)
- [离线缓存工具](../../utils/offlineCache.ts)
- [企业微信认证Hook](../../hooks/useWeChatAuth.ts)
