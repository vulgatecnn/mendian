/**
 * 权限状态管理
 */

import { create } from 'zustand'
import type { PermissionState, PermissionCheckResult } from '../types/permission'
import { ROLE_PERMISSIONS } from '../constants/permissions'
import { UserRoleCode } from '../constants/roles'
import { useAuthStore } from './authStore'

interface PermissionStore extends PermissionState {
  // 权限操作
  initializePermissions: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  checkPermissions: (permissions: string[], mode?: 'all' | 'any') => PermissionCheckResult

  // 路由权限
  canAccessRoute: (routePath: string, requiredPermissions: string[]) => boolean

  // 清理权限
  clearPermissions: () => void

  // 获取用户所有权限
  getAllPermissions: () => string[]
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  // 初始状态
  permissions: [],
  permissionMap: {},
  isLoading: false,
  error: null,

  // 初始化权限
  initializePermissions: () => {
    try {
      set({ isLoading: true, error: null })

      const authState = useAuthStore.getState()
      const { user } = authState

      if (!user || !user.roles.length) {
        set({
          permissions: [],
          permissionMap: {},
          isLoading: false
        })
        return
      }

      // 收集用户所有角色的权限
      const allPermissions = new Set<string>()

      user.roles.forEach(role => {
        // 从角色直接获取权限
        if (role.permissions) {
          role.permissions.forEach(permission => allPermissions.add(permission))
        }

        // 从角色代码映射获取权限
        const roleCode = role.code as UserRoleCode
        const rolePermissions = ROLE_PERMISSIONS[roleCode] || []
        rolePermissions.forEach(permission => allPermissions.add(permission))
      })

      const permissions = Array.from(allPermissions)
      const permissionMap = permissions.reduce(
        (map, permission) => {
          map[permission] = true
          return map
        },
        {} as Record<string, boolean>
      )

      set({
        permissions,
        permissionMap,
        isLoading: false,
        error: null
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '权限初始化失败'
      })
    }
  },

  // 检查单个权限
  hasPermission: (permission: string) => {
    const { permissionMap } = get()
    return permissionMap[permission] || false
  },

  // 检查是否有任一权限
  hasAnyPermission: (permissions: string[]) => {
    const { permissionMap } = get()
    return permissions.some(permission => permissionMap[permission])
  },

  // 检查是否有所有权限
  hasAllPermissions: (permissions: string[]) => {
    const { permissionMap } = get()
    return permissions.every(permission => permissionMap[permission])
  },

  // 权限检查(带详细结果)
  checkPermissions: (
    permissions: string[],
    mode = 'any' as 'all' | 'any'
  ): PermissionCheckResult => {
    if (!permissions.length) {
      return { hasPermission: true }
    }

    const { permissionMap } = get()
    const missingPermissions: string[] = []

    for (const permission of permissions) {
      if (!permissionMap[permission]) {
        missingPermissions.push(permission)
      }
    }

    const hasPermission =
      mode === 'all'
        ? missingPermissions.length === 0
        : permissions.some(permission => permissionMap[permission])

    const result: PermissionCheckResult = {
      hasPermission
    }

    if (missingPermissions.length > 0) {
      result.missingPermissions = missingPermissions
    }

    if (!hasPermission) {
      result.reason = `缺少权限: ${missingPermissions.join(', ')}`
    }

    return result
  },

  // 检查路由访问权限
  canAccessRoute: (_routePath: string, requiredPermissions: string[]) => {
    if (!requiredPermissions.length) {
      return true
    }

    const { hasAnyPermission } = get()
    return hasAnyPermission(requiredPermissions)
  },

  // 清理权限
  clearPermissions: () => {
    set({
      permissions: [],
      permissionMap: {},
      error: null
    })
  },

  // 获取用户所有权限
  getAllPermissions: () => {
    const { permissions } = get()
    return [...permissions]
  }
}))

// 权限Hook
export const usePermissions = () => {
  const store = usePermissionStore()

  return {
    permissions: store.permissions,
    permissionMap: store.permissionMap,
    isLoading: store.isLoading,
    error: store.error,
    hasPermission: store.hasPermission,
    hasAnyPermission: store.hasAnyPermission,
    hasAllPermissions: store.hasAllPermissions,
    checkPermissions: store.checkPermissions,
    canAccessRoute: store.canAccessRoute,
    getAllPermissions: store.getAllPermissions
  }
}

// 监听认证状态变化，自动更新权限
useAuthStore.subscribe(() => {
  usePermissionStore.getState().initializePermissions()
})
