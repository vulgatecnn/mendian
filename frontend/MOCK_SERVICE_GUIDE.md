# Mock服务集成指南

## 概述

这是为好饭碗门店生命周期管理系统创建的完整Mock数据和服务层，基于MSW (Mock Service Worker)实现，支持不依赖后端的前端开发。

## 主要功能

### 1. 完整的Mock数据体系
- ✅ **用户权限系统**: 用户、角色、权限的完整RBAC模型
- ✅ **基础数据**: 行政区域、供应商、组织架构、客户、业务大区
- ✅ **业务数据**: 开店计划、候选点位、跟进记录等
- ✅ **实时数据生成**: 基于faker.js的中文化数据生成
- ✅ **关联数据**: 数据间的逻辑关联和一致性

### 2. MSW Mock服务
- ✅ **网络请求拦截**: 完整的HTTP请求/响应模拟
- ✅ **真实网络延迟**: 300-800ms的随机延迟模拟
- ✅ **错误率模拟**: 可配置的网络错误和业务错误
- ✅ **分页和搜索**: 完整的分页、排序、过滤功能
- ✅ **CRUD操作**: 支持增删改查的完整业务逻辑

### 3. API服务层
- ✅ **TypeScript类型安全**: 完整的类型定义和检查
- ✅ **React Query集成**: 缓存、重试、乐观更新
- ✅ **错误处理**: 统一的错误处理和用户提示
- ✅ **权限控制**: 基于角色的访问控制

### 4. RBAC权限管理
- ✅ **角色管理**: 系统角色和自定义角色
- ✅ **权限检查**: 细粒度的权限控制
- ✅ **动态权限**: 运行时权限验证和更新

## 快速开始

### 1. 环境配置

在`.env`文件中添加以下配置：

```bash
# 启用Mock服务（开发环境默认启用）
REACT_APP_ENABLE_MOCK=true

# Mock延迟配置（毫秒）
REACT_APP_MOCK_DELAY_MIN=300
REACT_APP_MOCK_DELAY_MAX=800

# Mock错误率（0-1之间）
REACT_APP_MOCK_ERROR_RATE=0.05
```

### 2. 在应用中初始化

在`src/main.tsx`中添加Mock服务初始化：

```typescript
import { initializeMockService } from './services/mock/integration'

// 应用启动前初始化Mock服务
await initializeMockService()

// 然后启动React应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### 3. 在组件中使用

#### 认证相关

```typescript
import { useLogin, useCurrentUser, useLogout } from './services/query/enhanced.hooks/useEnhancedAuth'

function LoginComponent() {
  const loginMutation = useLogin()
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()

  const handleLogin = () => {
    loginMutation.mutate({
      username: 'admin',
      password: 'admin123',
      remember: true
    })
  }

  return (
    <div>
      {user ? (
        <div>
          <p>欢迎, {user.name}</p>
          <button onClick={() => logoutMutation.mutate()}>
            登出
          </button>
        </div>
      ) : (
        <button onClick={handleLogin}>
          登录
        </button>
      )}
    </div>
  )
}
```

#### 开店计划管理

```typescript
import { 
  useStorePlans, 
  useCreateStorePlan, 
  useUpdateStorePlan 
} from './services/query/enhanced.hooks/useEnhancedStorePlan'

function StorePlanList() {
  const { data, isLoading, error } = useStorePlans({
    page: 1,
    pageSize: 10,
    status: 'approved'
  })
  
  const createMutation = useCreateStorePlan()

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败</div>

  return (
    <div>
      {data?.data?.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>状态: {plan.status}</p>
          <p>进度: {plan.progress}%</p>
        </div>
      ))}
      
      <button onClick={() => createMutation.mutate({
        name: '新开店计划',
        type: 'direct',
        // ... 其他数据
      })}>
        创建计划
      </button>
    </div>
  )
}
```

#### 权限控制

```typescript
import { useHasPermission, useHasRole } from './services/query/enhanced.hooks/useEnhancedPermission'

function ProtectedComponent({ userId }: { userId: string }) {
  const { hasPermission, canAccess } = useHasPermission(userId)
  const { hasRole } = useHasRole(userId)

  const canViewStorePlans = hasPermission('store-plan:view')
  const canManageSystem = canAccess('system', 'manage')
  const isAdmin = hasRole('超级管理员')

  return (
    <div>
      {canViewStorePlans && <StorePlanList />}
      {canManageSystem && <SystemManagement />}
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

## API接口说明

### 认证接口

| 接口 | 方法 | 说明 | Mock用户 |
|------|------|------|----------|
| `/auth/login` | POST | 用户登录 | admin/admin123 |
| `/auth/logout` | POST | 用户登出 | - |
| `/auth/me` | GET | 获取当前用户 | - |
| `/auth/refresh` | POST | 刷新Token | - |

### 开店计划接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/store-plans` | GET | 获取开店计划列表 |
| `/store-plans/:id` | GET | 获取开店计划详情 |
| `/store-plans` | POST | 创建开店计划 |
| `/store-plans/:id` | PUT | 更新开店计划 |
| `/store-plans/:id` | DELETE | 删除开店计划 |
| `/store-plans/stats` | GET | 获取统计数据 |
| `/store-plans/search` | GET | 高级搜索 |

## 数据统计

当前Mock数据量：
- 用户: 50个（含管理员）
- 角色: 10个（含系统角色）
- 权限: 50+个细分权限
- 区域: 100+个行政区域
- 供应商: 30个
- 客户: 25个
- 业务大区: 6个
- 开店计划: 20个
- 候选点位: 15个

## 开发工具

在开发环境中，以下工具可在浏览器控制台使用：

### 数据管理
```javascript
// 查看Mock数据统计
window.getMockDataStats()

// 重置所有Mock数据
window.resetMockData()
```

### 测试工具
```javascript
// 运行完整测试套件
window.runMockTests()

// 性能测试
window.performanceTest()

// 测试特定功能
window.testMockData()    // 数据生成测试
window.testRBAC()        // 权限系统测试
window.testAPI()         // API接口测试
```

### Mock服务控制
```javascript
// 访问MSW Worker实例
window.mockWorker

// 动态添加处理器
window.mockWorker.use(/* 新的处理器 */)
```

## 文件结构

```
src/services/
├── mock/                    # Mock服务
│   ├── factories/          # 数据工厂
│   │   ├── index.ts
│   │   ├── user.factory.ts
│   │   ├── role.factory.ts
│   │   ├── permission.factory.ts
│   │   ├── region.factory.ts
│   │   ├── supplier.factory.ts
│   │   ├── storePlan.factory.ts
│   │   └── candidateLocation.factory.ts
│   ├── handlers/           # MSW处理器
│   │   ├── base.handler.ts
│   │   ├── auth.handler.ts
│   │   └── storePlan.handler.ts
│   ├── mockData.ts         # 数据存储
│   ├── integration.ts      # 集成配置
│   ├── demo.test.ts        # 演示和测试
│   └── index.ts           # 主入口
├── api/                    # API服务层
│   ├── enhanced.auth.ts
│   └── enhanced.storePlan.ts
├── query/                  # React Query hooks
│   └── enhanced.hooks/
│       ├── useEnhancedAuth.ts
│       ├── useEnhancedStorePlan.ts
│       └── useEnhancedPermission.ts
├── rbac/                   # 权限管理
│   └── index.ts
└── types/                  # 类型定义
    └── business.ts
```

## 注意事项

### 1. 数据持久化
- Mock数据存储在内存中，刷新页面会重置
- 生产环境需要连接真实API

### 2. 权限验证
- 当前权限检查在前端进行
- 生产环境需要后端权限验证

### 3. 性能考虑
- 大量数据时可能影响性能
- 可调整Mock数据量

### 4. 类型安全
- 所有接口都有TypeScript类型定义
- 确保数据结构一致性

## 扩展指南

### 添加新的Mock数据类型

1. 在`src/services/mock/factories/`创建新的工厂文件
2. 在`mockData.ts`中添加数据存储
3. 在`handlers/`中创建对应的MSW处理器
4. 在`api/`中创建API服务
5. 在`query/enhanced.hooks/`中创建React Query hooks

### 自定义Mock行为

可以通过修改以下文件来自定义Mock行为：
- `handlers/base.handler.ts` - 通用处理逻辑
- `factories/index.ts` - 数据生成配置
- `integration.ts` - 服务配置

## 问题排查

### Mock服务未启动
1. 检查环境变量`REACT_APP_ENABLE_MOCK`
2. 确认`mockServiceWorker.js`文件在public目录
3. 检查浏览器控制台错误信息

### API请求失败
1. 检查请求URL是否正确
2. 确认MSW处理器已注册
3. 查看网络请求是否被拦截

### 权限检查失败
1. 确认用户已登录
2. 检查用户角色和权限配置
3. 验证权限代码是否正确

## 技术支持

如有问题，请检查：
1. 浏览器控制台的错误信息
2. 网络请求的响应状态
3. Mock数据的完整性

---

**注意**: 这是开发环境的Mock服务，生产环境请连接真实的后端API。