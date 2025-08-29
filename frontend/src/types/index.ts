// 全局类型定义

// 基础响应结构
export interface BaseResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
  success: boolean
}

// 分页响应结构
export interface PaginationResponse<T> extends BaseResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 用户相关类型
export interface User {
  id: string
  username: string
  name: string
  avatar?: string
  email?: string
  phone?: string
  department: Department
  roles: Role[]
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  code: string
  level: number
  parentId?: string
}

export interface Role {
  id: string
  code: string
  name: string
  description?: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  code: string
  name: string
  description?: string
  resource: string
  action: string
}

// 门店计划相关类型
export interface StorePlan {
  id: string
  name: string
  description?: string
  type: StorePlanType
  status: StorePlanStatus
  region: Region
  address?: string
  targetDate: string
  budget: number
  actualCost?: number
  progress?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type StorePlanType = 'direct' | 'franchise' | 'joint_venture'
export type StorePlanStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Region {
  id: string
  name: string
  code: string
  level: number
  parentId?: string
}

// 查询参数类型
export interface StorePlanQueryParams {
  page?: number
  pageSize?: number
  name?: string
  type?: StorePlanType
  status?: StorePlanStatus
  regionId?: string
  startDate?: string
  endDate?: string
  createdBy?: string
}

// 创建/更新DTO类型
export type CreateStorePlanDto = Omit<StorePlan, 'id' | 'createdAt' | 'updatedAt'> & {
  createdBy: string
  updatedBy: string
}
export type UpdateStorePlanDto = Partial<
  Pick<StorePlan, 'name' | 'description' | 'targetDate' | 'budget'>
> & {
  updatedBy: string
}

// 表单字段类型
export interface FormField<T = any> {
  name: string
  label: string
  type: 'input' | 'select' | 'date' | 'textarea' | 'number' | 'radio' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: T }>
  rules?: any[]
}

// 菜单项类型
export interface MenuItem {
  key: string
  path?: string
  title: string
  icon?: React.ReactNode
  children?: MenuItem[]
  permissions?: string[]
  hidden?: boolean
}

// 通用状态类型
export interface LoadingState {
  loading: boolean
  error?: string | null
}

// API错误类型
export class ApiError extends Error {
  public code: string
  public status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.code = code
    this.status = status
    this.name = 'ApiError'
  }
}
