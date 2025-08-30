/**
 * 权限相关类型定义
 */

import { UserRoleCode } from '../constants/roles'

/**
 * 权限操作类型
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view' | 'handle' | 'confirm'

/**
 * 权限资源类型
 */
export type PermissionResource =
  | 'dashboard'
  | 'store-plan'
  | 'expansion'
  | 'preparation'
  | 'store-files'
  | 'operation'
  | 'approval'
  | 'basic-data'
  | 'system'
  | 'user'

/**
 * 权限检查模式
 */
export type PermissionMode = 'all' | 'any' | 'strict' | 'loose'

/**
 * 权限定义接口
 */
export interface Permission {
  /** 权限ID */
  id: string
  /** 权限代码 */
  code: string
  /** 权限名称 */
  name: string
  /** 权限描述 */
  description?: string
  /** 资源类型 */
  resource: PermissionResource
  /** 操作类型 */
  action: PermissionAction
  /** 权限分组 */
  group?: string
  /** 父权限ID */
  parentId?: string
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/**
 * 角色权限
 */
export interface Role {
  id: string
  code: UserRoleCode
  name: string
  description?: string
  permissions: Permission[]
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * 路由权限配置
 */
export interface RoutePermission {
  /** 路由路径 */
  path: string
  /** 所需权限代码 */
  permissions: string[]
  /** 权限检查模式 */
  mode?: PermissionMode
}

/**
 * 菜单权限配置
 */
export interface MenuPermission {
  /** 菜单key */
  key: string
  /** 所需权限代码 */
  permissions: string[]
  /** 权限检查模式 */
  mode?: PermissionMode
  /** 子菜单 */
  children?: MenuPermission[]
}

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  /** 是否有权限 */
  hasPermission: boolean
  /** 所需权限 */
  requiredPermissions: string[]
  /** 用户权限 */
  userPermissions: string[]
  /** 缺失的权限 */
  missingPermissions: string[]
  /** 检查原因 */
  reason?: string
}

/**
 * 权限状态
 */
export interface PermissionState {
  /** 用户权限列表 */
  permissions: string[]
  /** 用户角色列表 */
  roles: Role[]
  /** 权限映射表(快速查找) */
  permissionMap: Record<string, boolean>
  /** 是否正在加载权限 */
  isLoading: boolean
  /** 错误信息 */
  error: string | null
}

/**
 * 权限上下文
 */
export interface PermissionContext {
  permissions: string[]
  roles: Role[]
  isAuthenticated: boolean
  userId?: string
}

/**
 * 权限组定义
 */
export interface PermissionGroup {
  id: string
  code: string
  name: string
  description?: string
  permissions: Permission[]
  sort: number
}

/**
 * 权限验证配置
 */
export interface PermissionConfig {
  mode?: PermissionMode
  permissions: string[]
  fallback?: React.ComponentType | null
  loading?: React.ComponentType | null
  unauthorized?: React.ComponentType | null
  redirectTo?: string
}

/**
 * 用户权限信息
 */
export interface UserPermissions {
  userId: string
  permissions: string[]
  roles: Role[]
  effectivePermissions: string[]
  lastUpdated?: string
}

/**
 * 权限动作类型
 */
export interface PermissionActionType {
  type: 'SET_PERMISSIONS' | 'SET_ROLES' | 'SET_LOADING' | 'SET_ERROR' | 'CLEAR_PERMISSIONS'
  payload?: any
}

/**
 * 权限验证函数类型
 */
export type PermissionValidator = (
  permissions: string[],
  required: string[],
  mode?: PermissionMode
) => boolean

/**
 * 权限Hook返回类型
 */
export interface UsePermissionReturn {
  hasPermission: (permissions: string | string[], mode?: PermissionMode) => boolean
  hasRole: (roleCodes: UserRoleCode | UserRoleCode[]) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  checkPermission: (permissions: string[], mode?: PermissionMode) => PermissionCheckResult
  permissions: string[]
  roles: Role[]
  loading: boolean
  error: string | null
}
