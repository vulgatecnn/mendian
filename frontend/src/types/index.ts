/**
 * 通用类型定义
 */

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PaginationParams {
  page?: number
  page_size?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// 部门相关类型
export interface Department {
  id: number
  name: string
  wechat_dept_id: number
  parent: number | null
  order: number
  created_at: string
  updated_at: string
  children?: Department[]
}

// 部门同步响应
export interface DepartmentSyncResponse {
  success: boolean
  message: string
  synced_count: number
  updated_count: number
  errors?: string[]
}

// 用户相关类型
export interface User {
  id: number
  username: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  wechat_user_id: string
  department: number | null
  department_info?: {
    id: number
    name: string
    wechat_dept_id: number
    parent: number | null
    parent_name: string | null
    order: number
  }
  department_name?: string
  position: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  role_list?: Role[]
  date_joined: string
  last_login: string | null
  created_at: string
  updated_at: string
}

// 角色相关类型
export interface Role {
  id: number
  name: string
  description: string
  is_active: boolean
  permission_list?: Permission[]
  member_count?: number
  created_at: string
  updated_at: string
}

// 权限相关类型
export interface Permission {
  id: number
  code: string
  name: string
  module: string
  description: string
  created_at: string
}

// 用户同步响应
export interface UserSyncResponse {
  code: number
  message: string
  data: {
    total: number
    created: number
    updated: number
    failed: number
  }
}

// 用户状态切换响应
export interface UserToggleStatusResponse {
  code: number
  message: string
  data: {
    id: number
    username: string
    is_active: boolean
  }
}

// 角色分配响应
export interface RoleAssignResponse {
  code: number
  message: string
  data: {
    id: number
    username: string
    roles: Array<{
      id: number
      name: string
    }>
  }
}

// 审计日志相关类型
export interface AuditLog {
  id: number
  user: number | null
  user_info: {
    id: number
    username: string
    full_name: string
    phone: string
    department: number | null
    department_name: string | null
    position: string
    is_active: boolean
  } | null
  username: string
  user_full_name: string
  action: string
  target_type: string
  target_id: number
  details: Record<string, any>
  ip_address: string
  created_at: string
}

// 审计日志查询参数
export interface AuditLogQueryParams extends PaginationParams {
  user_id?: number
  username?: string
  action?: string
  target_type?: string
  start_time?: string
  end_time?: string
}

// 操作类型常量
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ENABLE: 'enable',
  DISABLE: 'disable',
  ASSIGN: 'assign',
  ASSIGN_PERMISSIONS: 'assign_permissions',
  ADD_MEMBERS: 'add_members',
  SYNC: 'sync'
} as const

// 对象类型常量
export const AUDIT_TARGET_TYPES = {
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  DEPARTMENT: 'department'
} as const
