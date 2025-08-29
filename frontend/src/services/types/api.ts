// API通用类型定义
import type { BaseResponse } from '../../types'

// 分页查询参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 时间范围查询参数
export interface DateRangeParams {
  startDate?: string
  endDate?: string
}

// 通用查询参数
export interface CommonQueryParams extends PaginationParams, DateRangeParams {
  keyword?: string
  status?: string
  createdBy?: string
}

// 批量操作参数
export interface BatchOperationParams {
  ids: string[]
  action: 'delete' | 'approve' | 'reject' | 'enable' | 'disable'
  reason?: string
}

// 文件上传响应
export interface UploadResponse {
  id: string
  filename: string
  originalName: string
  url: string
  size: number
  mimeType: string
  uploadedAt: string
}

// 导出响应
export interface ExportResponse {
  id: string
  filename: string
  url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  createdAt: string
  expiresAt?: string
}

// 导入响应
export interface ImportResponse {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRecords?: number
  successRecords?: number
  failedRecords?: number
  errors?: Array<{
    row: number
    field: string
    message: string
  }>
  createdAt: string
}

// 审批操作参数
export interface ApprovalActionParams {
  action: 'approve' | 'reject' | 'transfer' | 'add_sign'
  comment?: string
  transferTo?: string
  nextApprovers?: string[]
}

// 审批历史记录
export interface ApprovalHistory {
  id: string
  flowId: string
  nodeId: string
  nodeName: string
  approverId: string
  approverName: string
  action: 'approve' | 'reject' | 'transfer' | 'add_sign'
  comment?: string
  createdAt: string
}

// 统计数据响应
export interface StatsResponse {
  total: number
  increase: number
  increaseRate: number
  periodData: Array<{
    period: string
    value: number
  }>
}

// 地理信息
export interface GeoLocation {
  longitude: number
  latitude: number
  address: string
  province: string
  city: string
  district: string
  street?: string
}

// API错误详情
export interface ApiErrorDetail {
  field: string
  code: string
  message: string
  value?: any
}

// 扩展的错误响应
export interface ErrorResponse extends BaseResponse<null> {
  errors?: ApiErrorDetail[]
  trace?: string
}

// 健康检查响应
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  version: string
  timestamp: number
  services: Array<{
    name: string
    status: 'healthy' | 'unhealthy'
    responseTime?: number
  }>
}

// 认证相关类型
export interface LoginRequest {
  username: string
  password: string
  captcha?: string
  remember?: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    username: string
    name: string
    avatar?: string
    roles: string[]
    permissions: string[]
  }
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

// 用户信息响应
export interface UserProfileResponse {
  id: string
  username: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  department: {
    id: string
    name: string
    code: string
  }
  roles: Array<{
    id: string
    code: string
    name: string
  }>
  permissions: string[]
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

// 权限检查响应
export interface PermissionCheckResponse {
  hasPermission: boolean
  permissions: string[]
  missingPermissions?: string[]
}

// 菜单数据响应
export interface MenuResponse {
  id: string
  parentId?: string
  name: string
  path?: string
  icon?: string
  sort: number
  permissions: string[]
  children?: MenuResponse[]
}

// 系统配置响应
export interface SystemConfigResponse {
  [key: string]: any
  system: {
    name: string
    version: string
    logo?: string
  }
  features: {
    [feature: string]: boolean
  }
  limits: {
    uploadMaxSize: number
    batchMaxSize: number
  }
}

// 操作日志
export interface OperationLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ip: string
  userAgent: string
  createdAt: string
}

// 通知消息
export interface NotificationMessage {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  content: string
  data?: Record<string, any>
  read: boolean
  createdAt: string
  expiresAt?: string
}

// WebSocket消息类型
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp: number
  id?: string
}

// 实时数据更新消息
export interface RealTimeUpdateMessage {
  resource: string
  action: 'create' | 'update' | 'delete'
  data: any
  userId?: string
}

// API版本信息
export interface ApiVersionInfo {
  version: string
  buildTime: string
  gitCommit?: string
  environment: string
  features: string[]
  deprecated?: string[]
}

// 数据字典项
export interface DictionaryItem {
  code: string
  label: string
  value: any
  sort: number
  enabled: boolean
  children?: DictionaryItem[]
}

// 数据字典响应
export interface DictionaryResponse {
  [category: string]: DictionaryItem[]
}

// 级联数据响应
export interface CascadeOption {
  value: string
  label: string
  children?: CascadeOption[]
  loading?: boolean
}

// 搜索建议响应
export interface SearchSuggestion {
  type: 'recent' | 'popular' | 'suggestion'
  text: string
  count?: number
}

// 模板响应
export interface TemplateResponse {
  id: string
  name: string
  category: string
  content: string
  variables: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'date' | 'select'
    required: boolean
    options?: Array<{ label: string; value: any }>
  }>
  createdAt: string
  updatedAt: string
}
