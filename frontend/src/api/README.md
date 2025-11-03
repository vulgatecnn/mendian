# API 服务层文档

## 概述

API 服务层提供了与后端 API 交互的统一接口，包含以下功能特性：

- ✅ 自动添加 Token 到请求头
- ✅ Token 过期自动刷新
- ✅ 网络异常自动重试（最多 3 次）
- ✅ GET 请求缓存（5 分钟过期）
- ✅ 统一错误处理和消息提示
- ✅ 文件上传支持（图片压缩、进度跟踪）
- ✅ TypeScript 类型支持

## 目录结构

```
api/
├── request.ts              # Axios 请求封装（拦截器、缓存、重试）
├── uploadService.ts        # 文件上传服务
├── utils.ts                # API 工具函数
├── authService.ts          # 认证服务
├── profileService.ts       # 个人中心服务
├── expansionService.ts     # 拓店管理服务
├── preparationService.ts   # 开店筹备服务
├── archiveService.ts       # 门店档案服务
├── approvalService.ts      # 审批中心服务
├── baseDataService.ts      # 基础数据服务
├── messageService.ts       # 消息通知服务
├── homeService.ts          # 系统首页服务
├── userService.ts          # 用户管理服务
├── roleService.ts          # 角色管理服务
├── departmentService.ts    # 部门管理服务
├── planService.ts          # 开店计划服务
├── wechatService.ts        # 企业微信服务
└── index.ts                # 统一导出
```

## 基础用法

### 1. 导入服务

```typescript
import { AuthService, ExpansionService, UploadService } from '@/api'
```

### 2. 调用 API

```typescript
// 登录
const loginData = await AuthService.loginByPassword({
  username: 'admin',
  password: 'password123'
})

// 获取候选点位列表
const locations = await ExpansionService.getLocations({
  page: 1,
  page_size: 20,
  status: 'active'
})

// 上传图片
const uploadResult = await UploadService.uploadImage(file, {
  compress: true,
  onProgress: (percent) => {
    console.log(`上传进度: ${percent}%`)
  }
})
```

### 3. 使用 Hook（带 loading 状态）

```typescript
import { useExpansionService } from '@/api'

function MyComponent() {
  const { loading, error, getLocations } = useExpansionService()
  
  const handleLoadData = async () => {
    const data = await getLocations(
      { page: 1, page_size: 20 },
      {
        onSuccess: (data) => {
          console.log('加载成功', data)
        },
        onError: (error) => {
          console.error('加载失败', error)
        }
      }
    )
  }
  
  return (
    <div>
      {loading && <Spin />}
      {error && <Alert type="error" message={error.message} />}
      <Button onClick={handleLoadData}>加载数据</Button>
    </div>
  )
}
```

## 高级功能

### 1. 请求缓存

GET 请求会自动缓存 5 分钟，可以手动清除缓存：

```typescript
import { clearRequestCache, clearCacheByUrl } from '@/api'

// 清除所有缓存
clearRequestCache()

// 清除指定 URL 的缓存
clearCacheByUrl('/expansion/locations/')
```

如果需要跳过缓存，可以在请求配置中设置：

```typescript
import request from '@/api/request'

const data = await request.get('/api/data/', {
  skipCache: true
})
```

### 2. 网络异常重试

网络异常或服务器错误（5xx）会自动重试最多 3 次，每次重试间隔递增：

- 第 1 次重试：延迟 1 秒
- 第 2 次重试：延迟 2 秒
- 第 3 次重试：延迟 3 秒

### 3. Token 自动刷新

当 Token 过期（401 错误）时，会自动使用 refresh_token 刷新 Token 并重试请求。如果刷新失败，会清除 Token 并跳转到登录页。

### 4. 文件上传

#### 上传图片（支持压缩）

```typescript
import { UploadService } from '@/api'

// 基础上传
const result = await UploadService.uploadImage(file)

// 带压缩和进度
const result = await UploadService.uploadImage(file, {
  compress: true,
  compressQuality: 0.8,
  maxSize: 5 * 1024 * 1024, // 5MB
  onProgress: (percent) => {
    console.log(`上传进度: ${percent}%`)
  }
})
```

#### 上传文档

```typescript
const result = await UploadService.uploadDocument(file, {
  maxSize: 50 * 1024 * 1024, // 50MB
  onProgress: (percent) => {
    console.log(`上传进度: ${percent}%`)
  }
})
```

#### 批量上传

```typescript
// 批量上传图片
const results = await UploadService.uploadImages(files, {
  compress: true,
  onProgress: (percent) => {
    console.log(`总体进度: ${percent}%`)
  }
})

// 批量上传文档
const results = await UploadService.uploadDocuments(files)
```

#### 自动判断类型上传

```typescript
const result = await UploadService.upload(file)
```

### 5. 错误处理

所有 API 错误都会自动显示消息提示，如果需要自定义错误处理：

```typescript
import request from '@/api/request'

try {
  const data = await request.get('/api/data/', {
    skipErrorHandler: true // 跳过自动错误处理
  })
} catch (error) {
  // 自定义错误处理
  console.error('请求失败', error)
}
```

## API 服务列表

### 认证服务 (AuthService)

```typescript
// 账号密码登录
await AuthService.loginByPassword({ username, password })

// 手机号密码登录
await AuthService.loginByPhonePassword({ phone, password })

// 手机号验证码登录
await AuthService.loginBySmsCode({ phone, code })

// 企业微信登录
await AuthService.loginByWechat({ code })

// 发送短信验证码
await AuthService.sendSmsCode({ phone, type: 'login' })

// 退出登录
await AuthService.logout()

// 刷新 Token
await AuthService.refreshToken({ refresh_token })
```

### 拓店管理服务 (ExpansionService)

```typescript
// 候选点位
await ExpansionService.getLocations(params)
await ExpansionService.getLocationDetail(id)
await ExpansionService.createLocation(data)
await ExpansionService.updateLocation(id, data)
await ExpansionService.deleteLocation(id)

// 跟进单
await ExpansionService.getFollowUps(params)
await ExpansionService.getFollowUpDetail(id)
await ExpansionService.createFollowUp(data)
await ExpansionService.updateFollowUp(id, data)
await ExpansionService.submitSurveyData(id, data)
await ExpansionService.calculateProfit(id, data)
await ExpansionService.submitContractInfo(id, data)
await ExpansionService.abandonFollowUp(id, data)
await ExpansionService.submitApproval(id)

// 盈利测算公式
await ExpansionService.getProfitFormulas()
await ExpansionService.updateProfitFormula(data)
```

### 开店筹备服务 (PreparationService)

```typescript
// 工程单
await PreparationService.getConstructionOrders(params)
await PreparationService.getConstructionOrderDetail(id)
await PreparationService.createConstructionOrder(data)
await PreparationService.updateConstructionOrder(id, data)
await PreparationService.uploadDesignFiles(id, files)

// 里程碑
await PreparationService.addMilestone(constructionOrderId, data)
await PreparationService.updateMilestone(constructionOrderId, milestoneId, data)
await PreparationService.completeMilestone(constructionOrderId, milestoneId, actualDate)

// 验收
await PreparationService.performAcceptance(id, data)
await PreparationService.markRectification(id, data)

// 交付清单
await PreparationService.getDeliveryChecklists(params)
await PreparationService.getDeliveryChecklistDetail(id)
await PreparationService.createDeliveryChecklist(data)
await PreparationService.updateDeliveryChecklist(id, data)
await PreparationService.uploadDeliveryDocuments(id, files)
```

### 门店档案服务 (ArchiveService)

```typescript
await ArchiveService.getStoreProfiles(params)
await ArchiveService.getStoreProfile(id)
await ArchiveService.getStoreFullInfo(id)
await ArchiveService.createStoreProfile(data)
await ArchiveService.updateStoreProfile(id, data)
await ArchiveService.deleteStoreProfile(id)
await ArchiveService.changeStoreStatus(id, data)
```

### 审批中心服务 (ApprovalService)

```typescript
// 审批模板
await ApprovalService.getTemplates(params)
await ApprovalService.getTemplate(id)
await ApprovalService.createTemplate(data)
await ApprovalService.updateTemplate(id, data)
await ApprovalService.toggleTemplateStatus(id, is_active)

// 审批实例
await ApprovalService.getInstances(params)
await ApprovalService.getPendingInstances(params)
await ApprovalService.getProcessedInstances(params)
await ApprovalService.getCCInstances(params)
await ApprovalService.getFollowedInstances(params)
await ApprovalService.getInstance(id)
await ApprovalService.createInstance(data)
await ApprovalService.processApproval(instanceId, data)
await ApprovalService.withdrawApproval(instanceId, data)
await ApprovalService.toggleFollow(instanceId, data)
await ApprovalService.addComment(instanceId, data)

// 审批台账导出
const blob = await ApprovalService.exportApprovals(params)
ApprovalService.downloadApprovalExport(blob, '审批台账.xlsx')
```

### 基础数据服务 (BaseDataService)

```typescript
// 业务大区
await BaseDataService.getBusinessRegions(params)
await BaseDataService.createBusinessRegion(data)
await BaseDataService.updateBusinessRegion(id, data)
await BaseDataService.deleteBusinessRegion(id)

// 供应商
await BaseDataService.getSuppliers(params)
await BaseDataService.createSupplier(data)
await BaseDataService.updateSupplier(id, data)
await BaseDataService.deleteSupplier(id)

// 法人主体
await BaseDataService.getLegalEntities(params)
await BaseDataService.createLegalEntity(data)
await BaseDataService.updateLegalEntity(id, data)
await BaseDataService.deleteLegalEntity(id)

// 客户
await BaseDataService.getCustomers(params)
await BaseDataService.createCustomer(data)
await BaseDataService.updateCustomer(id, data)
await BaseDataService.deleteCustomer(id)

// 商务预算
await BaseDataService.getBudgets(params)
await BaseDataService.createBudget(data)
await BaseDataService.updateBudget(id, data)
await BaseDataService.deleteBudget(id)
```

### 消息通知服务 (MessageService)

```typescript
await MessageService.getMessages(params)
await MessageService.getUnreadCount()
await MessageService.markAsRead(id)
await MessageService.markMultipleAsRead(ids)
await MessageService.markAllAsRead()
await MessageService.deleteMessage(id)
await MessageService.deleteMultipleMessages(ids)
```

### 系统首页服务 (HomeService)

```typescript
await HomeService.getTodos(params)
await HomeService.getTodoStatistics()
await HomeService.getQuickAccess()
await HomeService.updateQuickAccess(data)
```

### 个人中心服务 (ProfileService)

```typescript
await ProfileService.getProfile()
await ProfileService.updateProfile(data)
await ProfileService.changePassword(data)
await ProfileService.uploadAvatar(file)
await ProfileService.getOperationLogs(params)
```

## 工具函数

```typescript
import {
  buildQueryString,
  downloadFile,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isDocumentFile,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  generateUniqueId,
  formatDate,
  parseErrorMessage,
  retry,
  batchExecute
} from '@/api/utils'

// 构建查询参数
const queryString = buildQueryString({ page: 1, status: 'active' })

// 下载文件
downloadFile(blob, 'report.xlsx')

// 格式化文件大小
const size = formatFileSize(1024 * 1024) // "1.00 MB"

// 防抖
const debouncedSearch = debounce((keyword) => {
  console.log('搜索:', keyword)
}, 500)

// 节流
const throttledScroll = throttle(() => {
  console.log('滚动事件')
}, 200)

// 重试
const data = await retry(() => fetchData(), 3, 1000)

// 批量执行（并发控制）
const results = await batchExecute(
  items,
  (item) => processItem(item),
  5 // 最多同时执行 5 个
)
```

## 最佳实践

### 1. 使用 TypeScript 类型

```typescript
import type { CandidateLocation, CandidateLocationFormData } from '@/types'

const location: CandidateLocation = await ExpansionService.getLocationDetail(1)
const formData: CandidateLocationFormData = {
  name: '测试点位',
  province: '广东省',
  city: '深圳市',
  // ...
}
```

### 2. 错误处理

```typescript
try {
  const data = await ExpansionService.getLocations()
  // 处理数据
} catch (error) {
  console.error('加载失败', error)
  // 自定义错误处理
}
```

### 3. 加载状态管理

```typescript
const [loading, setLoading] = useState(false)

const loadData = async () => {
  setLoading(true)
  try {
    const data = await ExpansionService.getLocations()
    // 处理数据
  } finally {
    setLoading(false)
  }
}
```

### 4. 清除缓存

在数据更新后清除相关缓存：

```typescript
import { clearCacheByUrl } from '@/api'

// 创建或更新数据后
await ExpansionService.createLocation(data)
clearCacheByUrl('/expansion/locations/')
```

## 注意事项

1. **Token 管理**：Token 存储在 localStorage 中，自动添加到请求头
2. **缓存策略**：只有 GET 请求会被缓存，缓存时间为 5 分钟
3. **重试机制**：只有网络错误和服务器错误（5xx）会触发重试
4. **文件上传**：图片上传支持自动压缩，文档上传最大 50MB
5. **错误提示**：所有错误都会自动显示消息提示，可以通过 `skipErrorHandler` 跳过

## 扩展开发

如果需要添加新的 API 服务：

1. 在 `api/` 目录下创建新的服务文件
2. 定义服务类和相关类型
3. 在 `api/index.ts` 中导出服务
4. 更新本文档

示例：

```typescript
// api/newService.ts
import request from './request'

export class NewService {
  static async getData(params?: any): Promise<any> {
    return request.get('/new/data/', { params })
  }
}

export default NewService
```

```typescript
// api/index.ts
export { default as NewService } from './newService'
```
