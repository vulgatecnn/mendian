# 路由配置 - PC端和移动端完全分离 ✅

## 概述

本项目实现了**完全分离**的PC端和移动端路由系统，确保两个平台的路由不会冲突，并提供智能的平台检测和重定向功能。

### 🎯 核心特性
- ✅ **完全分离**：PC端和移动端路由系统完全独立
- ✅ **智能检测**：自动检测用户平台并分发到对应路由
- ✅ **零冲突**：两套路由系统不会相互干扰
- ✅ **企业微信集成**：自动识别企业微信环境
- ✅ **开发友好**：提供丰富的工具函数和测试覆盖
- ✅ **类型安全**：完整的TypeScript类型支持

## 路由架构

```
frontend/src/routes/
├── index.tsx                    # 主路由配置 - 智能平台分发
├── pc.tsx                      # PC端路由配置（完全独立）
├── mobile.tsx                  # 移动端路由配置（完全独立）
├── mobile.css                  # 移动端路由样式
├── utils.ts                    # 路由工具函数 🆕
├── ROUTE_SEPARATION.md         # 路由分离详细说明 🆕
├── __tests__/
│   └── route-separation.test.ts # 路由分离功能测试 🆕
└── README.md                   # 本文档
```

### 🆕 新增功能
- **工具函数库**：提供平台检测、路由转换等实用函数
- **完整测试**：18个测试用例，覆盖所有核心功能
- **详细文档**：完整的使用指南和API文档

## 路由分发逻辑

### 环境检测

系统通过以下条件判断用户环境：

1. **URL路径优先级最高**：`/mobile/*` 路径强制使用移动端
2. **企业微信环境**：检测 `wxwork` User-Agent
3. **移动设备检测**：屏幕宽度 ≤ 768px 且移动设备 User-Agent
4. **默认**：PC端

### 检测函数

```typescript
const isMobileEnvironment = (): boolean => {
  const isMobileScreen = window.innerWidth <= 768;
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /mobile|android|iphone|ipad|phone|blackberry|opera mini|iemobile|wpdesktop/.test(userAgent);
  const isWeChatWork = /wxwork/.test(userAgent);
  const isMobilePath = window.location.pathname.startsWith('/mobile');
  
  return isMobilePath || isWeChatWork || (isMobileScreen && isMobileUA);
};
```

## PC端路由结构

### 主要模块路由

| 路径 | 模块 | 说明 |
|------|------|------|
| `/` | 首页 | 系统首页，显示待办事项和快捷入口 |
| `/login` | 登录 | PC端登录页面 |
| `/profile` | 个人中心 | 用户个人信息管理 |
| `/messages` | 消息中心 | 系统消息通知 |

### 业务模块路由

| 路径前缀 | 模块 | 主要功能 |
|----------|------|----------|
| `/system/*` | 系统管理 | 部门、用户、角色、审计日志管理 |
| `/store-planning/*` | 开店计划 | 计划管理、仪表板、分析报表 |
| `/store-expansion/*` | 拓店管理 | 候选点位、跟进单、盈利测算 |
| `/store-preparation/*` | 开店筹备 | 施工管理、验收、交付管理 |
| `/store-archive/*` | 门店档案 | 门店档案管理 |
| `/approval/*` | 审批中心 | 审批流程、模板配置 |
| `/base-data/*` | 基础数据 | 业务大区、供应商、法人主体等 |
| `/business-dashboard/*` | 经营大屏 | 数据可视化、报表 |

### 详细路由配置

#### 系统管理 (`/system/*`)
- `/system/departments` - 部门管理
- `/system/users` - 用户管理
- `/system/roles` - 角色管理
- `/system/audit-logs` - 审计日志

#### 拓店管理 (`/store-expansion/*`)
- `/store-expansion/locations` - 候选点位列表
- `/store-expansion/follow-ups` - 跟进单列表
- `/store-expansion/follow-ups/:id` - 跟进单详情
- `/store-expansion/profit-config` - 盈利测算配置

#### 开店筹备 (`/store-preparation/*`)
- `/store-preparation/construction` - 施工管理列表
- `/store-preparation/construction/:id` - 施工详情
- `/store-preparation/acceptance` - 验收管理
- `/store-preparation/milestones` - 里程碑管理
- `/store-preparation/delivery` - 交付管理列表
- `/store-preparation/delivery/:id` - 交付详情

#### 门店档案 (`/store-archive/*`)
- `/store-archive/` - 门店档案列表
- `/store-archive/create` - 新建门店档案
- `/store-archive/:id` - 门店档案详情
- `/store-archive/:id/edit` - 编辑门店档案

#### 审批中心 (`/approval/*`)
- `/approval/pending` - 待办审批
- `/approval/processed` - 已办审批
- `/approval/cc` - 抄送我的
- `/approval/followed` - 我关注的
- `/approval/initiated` - 我发起的
- `/approval/all` - 全部审批
- `/approval/detail/:id` - 审批详情
- `/approval/templates` - 审批模板管理
- `/approval/templates/create` - 新建审批模板
- `/approval/templates/:id/edit` - 编辑审批模板

#### 基础数据管理 (`/base-data/*`)
- `/base-data/regions` - 业务大区管理
- `/base-data/suppliers` - 供应商管理
- `/base-data/legal-entities` - 法人主体管理
- `/base-data/customers` - 客户管理
- `/base-data/budgets` - 预算管理

## 移动端路由结构

### 主要路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/mobile/` | 重定向到首页 | 自动跳转 |
| `/mobile/home` | 移动端首页 | 待办事项、快捷入口 |
| `/mobile/login` | 企业微信登录 | 移动端专用登录 |
| `/mobile/work` | 工作台 | 业务模块快速访问 |
| `/mobile/messages` | 消息中心 | 移动端消息管理 |
| `/mobile/profile` | 个人中心 | 移动端个人信息 |

### 业务模块路由

#### 拓店管理 (`/mobile/expansion/*`)
- `/mobile/expansion/locations` - 候选点位列表
- `/mobile/expansion/follow-ups` - 跟进单列表
- `/mobile/expansion/follow-ups/:id` - 跟进单详情

#### 开店筹备 (`/mobile/preparation/*`)
- `/mobile/preparation/construction/:id/acceptance` - 工程验收

#### 审批中心 (`/mobile/approvals/*`)
- `/mobile/approvals/` - 审批列表（默认全部）
- `/mobile/approvals/pending` - 待办审批
- `/mobile/approvals/processed` - 已办审批
- `/mobile/approvals/initiated` - 我发起的
- `/mobile/approvals/:id` - 审批详情

### 移动端布局

移动端使用 `MobileLayout` 组件提供统一的底部导航栏：

1. **首页** (`/mobile/home`) - 🏠
2. **工作台** (`/mobile/work`) - 💼
3. **审批** (`/mobile/approvals`) - ✅
4. **消息** (`/mobile/messages`) - 💬 (带未读徽标)
5. **我的** (`/mobile/profile`) - 👤

## 权限控制

### ProtectedRoute 组件

所有需要权限的路由都使用 `ProtectedRoute` 组件包装：

```typescript
<Route 
  path="users" 
  element={
    <ProtectedRoute permission="system.user.view">
      <UserManagement />
    </ProtectedRoute>
  } 
/>
```

### 权限代码规范

权限代码采用 `模块.资源.操作` 的格式：

- `system.user.view` - 系统管理.用户.查看
- `expansion.location.create` - 拓店管理.候选点位.创建
- `approval.instance.process` - 审批中心.审批实例.处理

## 路由跳转

### PC端跳转

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// 跳转到用户管理
navigate('/system/users');

// 跳转到跟进单详情
navigate(`/store-expansion/follow-ups/${id}`);
```

### 移动端跳转

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// 跳转到移动端首页
navigate('/mobile/home');

// 跳转到审批详情
navigate(`/mobile/approvals/${id}`);
```

### 跨平台跳转

```typescript
// 自动检测环境并跳转到对应平台的首页
navigate('/auto-redirect');
```

## 404处理

### PC端404

显示标准的404页面，提供返回首页链接。

### 移动端404

显示移动端优化的404页面，包含：
- 📱 图标
- 错误提示
- 返回首页按钮

## 开发指南

### 添加新的PC端路由

1. 在 `frontend/src/routes/pc.tsx` 中添加路由配置
2. 确保导入对应的页面组件
3. 添加适当的权限控制

### 添加新的移动端路由

1. 在 `frontend/src/routes/mobile.tsx` 中添加路由配置
2. 确保导入对应的移动端页面组件
3. 添加适当的权限控制
4. 考虑是否需要添加到底部导航栏

### 路由测试

#### 本地测试PC端
```bash
# 启动开发服务器
pnpm dev

# 在浏览器中访问
http://localhost:5173/
```

#### 本地测试移动端
```bash
# 启动开发服务器
pnpm dev

# 在浏览器中访问
http://localhost:5173/mobile/home

# 或者在开发者工具中切换到移动设备模拟
```

#### 企业微信环境测试

1. 修改浏览器User-Agent：
   ```
   Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/3.0.0
   ```

2. 访问任意路径，系统会自动重定向到移动端

## 注意事项

1. **路径冲突**：确保PC端和移动端路由不会冲突
2. **权限一致性**：相同功能的PC端和移动端路由应使用相同的权限代码
3. **重定向逻辑**：注意登录状态和环境检测的重定向逻辑
4. **性能优化**：大型页面组件建议使用懒加载
5. **SEO友好**：PC端路由应考虑SEO优化

## 相关文档

- [移动端页面开发指南](../pages/mobile/README.md)
- [权限控制说明](../components/ProtectedRoute/README.md)
- [企业微信集成指南](../../backend/WECHAT_CONFIG.md)