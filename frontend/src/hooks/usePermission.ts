/**
 * 权限管理Hook
 */

import { useMemo, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { usePermissionStore } from '../stores/permissionStore'
import { useCurrentUser } from './useAuth'
import { UserRoleCode } from '../constants/roles'
import { ROUTE_PERMISSIONS, hasPermission as checkPermission } from '../constants/permissions'
import type { 
  PermissionMode, 
  PermissionCheckResult,
  UsePermissionReturn 
} from '../types/permission'

/**
 * 权限管理Hook
 */
export const usePermission = (): UsePermissionReturn => {
  const { user, isAuthenticated } = useAuthStore()
  const { permissions, roles, isLoading, error } = usePermissionStore()

  // 用户的所有权限
  const userPermissions = useMemo(() => {
    if (!isAuthenticated || !user) return []
    
    // 从用户角色中提取权限
    const rolePermissions = user.roles?.flatMap(role => role.permissions) || []
    
    // 合并去重
    const allPermissions = [...permissions, ...rolePermissions]
    return Array.from(new Set(allPermissions))
  }, [permissions, user, isAuthenticated])

  // 用户的角色代码列表
  const userRoles = useMemo(() => {
    if (!isAuthenticated || !user) return []
    return user.roles?.map(role => role.code) || []
  }, [user, isAuthenticated])

  /**
   * 检查是否拥有指定权限
   */
  const hasPermission = useCallback((
    requiredPermissions: string | string[], 
    mode: PermissionMode = 'any'
  ): boolean => {
    if (!isAuthenticated) return false
    if (!requiredPermissions) return true

    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions]

    if (permissions.length === 0) return true

    if (mode === 'all') {
      return permissions.every(permission => userPermissions.includes(permission))
    } else {
      return permissions.some(permission => userPermissions.includes(permission))
    }
  }, [isAuthenticated, userPermissions])

  /**
   * 检查是否拥有指定角色
   */
  const hasRole = useCallback((roleCodes: UserRoleCode | UserRoleCode[]): boolean => {
    if (!isAuthenticated) return false

    const codes = Array.isArray(roleCodes) ? roleCodes : [roleCodes]
    return codes.some(code => userRoles.includes(code))
  }, [isAuthenticated, userRoles])

  /**
   * 检查是否拥有任意一个权限
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return hasPermission(permissions, 'any')
  }, [hasPermission])

  /**
   * 检查是否拥有全部权限
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return hasPermission(permissions, 'all')
  }, [hasPermission])

  /**
   * 详细的权限检查
   */
  const checkPermission = useCallback((
    requiredPermissions: string[], 
    mode: PermissionMode = 'any'
  ): PermissionCheckResult => {
    const hasPerms = hasPermission(requiredPermissions, mode)
    const missing = requiredPermissions.filter(perm => !userPermissions.includes(perm))

    return {
      hasPermission: hasPerms,
      requiredPermissions,
      userPermissions,
      missingPermissions: missing,
      reason: hasPerms 
        ? 'Permission granted' 
        : `Missing permissions: ${missing.join(', ')}`
    }
  }, [hasPermission, userPermissions])

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    permissions: userPermissions,
    roles,
    loading: isLoading,
    error
  }
}

/**
 * 路由权限Hook
 */
export const useRoutePermission = (routePath?: string) => {
  const { hasPermission, checkPermission } = usePermission()
  const { isAuthenticated } = useAuthStore()

  const currentRoutePermissions = useMemo(() => {
    if (!routePath) return []
    return ROUTE_PERMISSIONS[routePath] || []
  }, [routePath])

  const canAccess = useMemo(() => {
    if (!routePath || !currentRoutePermissions.length) return true
    return hasPermission(currentRoutePermissions, 'any')
  }, [routePath, currentRoutePermissions, hasPermission])

  const permissionCheck = useMemo(() => {
    if (!currentRoutePermissions.length) {
      return { 
        hasPermission: true,
        requiredPermissions: [],
        userPermissions: [],
        missingPermissions: []
      }
    }
    return checkPermission(currentRoutePermissions, 'any')
  }, [currentRoutePermissions, checkPermission])

  return {
    routePath,
    requiredPermissions: currentRoutePermissions,
    canAccess,
    permissionCheck,
    isAuthenticated
  }
}

/**
 * 菜单权限Hook
 */
export const useMenuPermission = () => {
  const { hasAnyPermission, roles } = usePermission()

  // 检查菜单项是否可见
  const canShowMenuItem = useCallback(
    (requiredPermissions: string[]) => {
      if (!requiredPermissions.length) return true
      return hasAnyPermission(requiredPermissions)
    },
    [hasAnyPermission]
  )

  // 过滤菜单项
  const filterMenuItems = useCallback(
    <T extends { permissions?: string[]; meta?: { permissions?: string[] } }>(items: T[]): T[] => {
      return items.filter(item => {
        const itemPermissions = item.permissions || item.meta?.permissions
        if (!itemPermissions || !itemPermissions.length) return true
        return canShowMenuItem(itemPermissions)
      })
    },
    [canShowMenuItem]
  )

  return {
    canShowMenuItem,
    filterMenuItems,
    userRoles: roles
  }
}

/**
 * 权限保护Hook - 用于组件级权限控制
 */
export const usePermissionGuard = (requiredPermissions: string[], mode: 'all' | 'any' = 'any') => {
  const { checkPermission } = usePermission()

  const permissionResult: PermissionCheckResult = useMemo(() => {
    return checkPermission(requiredPermissions, mode)
  }, [requiredPermissions, mode, checkPermission])

  return {
    hasPermission: permissionResult.hasPermission,
    missingPermissions: permissionResult.missingPermissions,
    reason: permissionResult.reason,
    canRender: permissionResult.hasPermission
  }
}

/**
 * 角色权限Hook
 */
export const useRolePermission = () => {
  const { user, isAdmin } = useCurrentUser()
  const { permissions } = usePermissionStore()
  
  const roles = user?.roles || []

  const hasRole = useCallback(
    (roleName: string) => {
      return roles.some(role => role.name === roleName || role.code === roleName)
    },
    [roles]
  )

  const hasAnyRole = useCallback(
    (roleNames: string[]) => {
      return roleNames.some(roleName => hasRole(roleName))
    },
    [hasRole]
  )

  const getRoleNames = useCallback(() => {
    return roles.map(role => role.name)
  }, [roles])

  const getRoleCodes = useCallback(() => {
    return roles.map(role => role.code)
  }, [roles])

  return {
    roles,
    isAdmin,
    hasRole,
    hasAnyRole,
    getRoleNames,
    getRoleCodes,
    permissions
  }
}

/**
 * 操作权限Hook - 用于按钮、操作等权限控制
 */
export const useActionPermission = () => {
  const { hasPermission } = usePermission()

  // 检查是否可以创建
  const canCreate = useCallback(
    (resource: string) => {
      return hasPermission(`${resource}:create`)
    },
    [hasPermission]
  )

  // 检查是否可以更新
  const canUpdate = useCallback(
    (resource: string) => {
      return hasPermission(`${resource}:update`)
    },
    [hasPermission]
  )

  // 检查是否可以删除
  const canDelete = useCallback(
    (resource: string) => {
      return hasPermission(`${resource}:delete`)
    },
    [hasPermission]
  )

  // 检查是否可以查看
  const canView = useCallback(
    (resource: string) => {
      return hasPermission(`${resource}:view`)
    },
    [hasPermission]
  )

  // 检查是否可以管理
  const canManage = useCallback(
    (resource: string) => {
      return hasPermission(`${resource}:manage`)
    },
    [hasPermission]
  )

  return {
    canCreate,
    canUpdate,
    canDelete,
    canView,
    canManage
  }
}
