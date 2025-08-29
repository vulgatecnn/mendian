/**
 * 增强版权限管理相关React Query hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { RBACService } from '../../rbac'
import type { RBACUser, RBACRole, RBACPermission } from '../../rbac'

// Query Keys
export const PERMISSION_QUERY_KEYS = {
  users: ['rbac', 'users'],
  user: (id: string) => ['rbac', 'users', id],
  roles: ['rbac', 'roles'],
  role: (id: string) => ['rbac', 'roles', id],
  permissions: ['rbac', 'permissions'],
  permissionTree: ['rbac', 'permissions', 'tree'],
  userPermissions: (userId: string) => ['rbac', 'users', userId, 'permissions'],
  rolePermissions: (roleId: string) => ['rbac', 'roles', roleId, 'permissions'],
} as const

/**
 * 获取用户列表Hook
 */
export function useRBACUsers(params: {
  page?: number
  pageSize?: number
  keyword?: string
  roleId?: string
  status?: 'active' | 'inactive'
} = {}) {
  return useQuery({
    queryKey: [...PERMISSION_QUERY_KEYS.users, params],
    queryFn: () => RBACService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 10 * 60 * 1000, // 10分钟
  })
}

/**
 * 获取角色列表Hook
 */
export function useRBACRoles() {
  return useQuery({
    queryKey: PERMISSION_QUERY_KEYS.roles,
    queryFn: () => RBACService.getRoles(),
    staleTime: 10 * 60 * 1000, // 10分钟
    gcTime: 20 * 60 * 1000, // 20分钟
  })
}

/**
 * 获取权限列表Hook
 */
export function useRBACPermissions() {
  return useQuery({
    queryKey: PERMISSION_QUERY_KEYS.permissions,
    queryFn: () => RBACService.getPermissions(),
    staleTime: 30 * 60 * 1000, // 30分钟，权限变化较少
    gcTime: 60 * 60 * 1000, // 1小时
  })
}

/**
 * 获取权限树Hook
 */
export function usePermissionTree() {
  return useQuery({
    queryKey: PERMISSION_QUERY_KEYS.permissionTree,
    queryFn: () => RBACService.getPermissionTree(),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

/**
 * 获取用户权限Hook
 */
export function useUserPermissions(userId: string, enabled = true) {
  return useQuery({
    queryKey: PERMISSION_QUERY_KEYS.userPermissions(userId),
    queryFn: () => RBACService.getUserPermissions(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * 获取用户角色Hook
 */
export function useUserRoles(userId: string, enabled = true) {
  return useQuery({
    queryKey: [...PERMISSION_QUERY_KEYS.user(userId), 'roles'],
    queryFn: () => RBACService.getUserRoles(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * 获取角色权限Hook
 */
export function useRolePermissions(roleId: string, enabled = true) {
  return useQuery({
    queryKey: PERMISSION_QUERY_KEYS.rolePermissions(roleId),
    queryFn: () => RBACService.getRolePermissions(roleId),
    enabled: enabled && !!roleId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  })
}

/**
 * 分配角色给用户Hook
 */
export function useAssignRoles() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string, roleIds: string[] }) => {
      const success = RBACService.assignRolesToUser(userId, roleIds)
      if (!success) {
        throw new Error('分配角色失败')
      }
      return { success: true, message: '角色分配成功' }
    },
    onSuccess: (_, variables) => {
      // 刷新用户相关缓存
      queryClient.invalidateQueries({ 
        queryKey: PERMISSION_QUERY_KEYS.user(variables.userId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: PERMISSION_QUERY_KEYS.userPermissions(variables.userId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: PERMISSION_QUERY_KEYS.users 
      })
      
      message.success('角色分配成功')
    },
    onError: (error: any) => {
      message.error(error?.message || '分配角色失败，请重试')
    },
  })
}

/**
 * 创建角色Hook
 */
export function useCreateRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (roleData: {
      name: string
      code: string
      description?: string
      permissions: string[]
    }) => {
      try {
        const role = RBACService.createRole(roleData)
        return { success: true, data: role, message: '角色创建成功' }
      } catch (error: any) {
        throw new Error(error.message || '创建角色失败')
      }
    },
    onSuccess: (response) => {
      // 刷新角色列表
      queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.roles })
      
      message.success(response.message)
    },
    onError: (error: any) => {
      message.error(error?.message || '创建角色失败，请重试')
    },
  })
}

/**
 * 更新角色Hook
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      roleId, 
      updates 
    }: { 
      roleId: string, 
      updates: {
        name?: string
        description?: string
        permissions?: string[]
      }
    }) => {
      const success = RBACService.updateRole(roleId, updates)
      if (!success) {
        throw new Error('更新角色失败')
      }
      return { success: true, message: '角色更新成功' }
    },
    onSuccess: (_, variables) => {
      // 刷新角色相关缓存
      queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.roles })
      queryClient.invalidateQueries({ 
        queryKey: PERMISSION_QUERY_KEYS.rolePermissions(variables.roleId) 
      })
      
      // 刷新拥有该角色的用户缓存
      queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.users })
      
      message.success('角色更新成功')
    },
    onError: (error: any) => {
      message.error(error?.message || '更新角色失败，请重试')
    },
  })
}

/**
 * 删除角色Hook
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (roleId: string) => {
      try {
        const success = RBACService.deleteRole(roleId)
        if (!success) {
          throw new Error('删除角色失败')
        }
        return { success: true, message: '角色删除成功' }
      } catch (error: any) {
        throw new Error(error.message || '删除角色失败')
      }
    },
    onSuccess: (_, roleId) => {
      // 刷新角色列表
      queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.roles })
      
      // 删除角色相关缓存
      queryClient.removeQueries({ 
        queryKey: PERMISSION_QUERY_KEYS.rolePermissions(roleId) 
      })
      
      // 刷新用户列表
      queryClient.invalidateQueries({ queryKey: PERMISSION_QUERY_KEYS.users })
      
      message.success('角色删除成功')
    },
    onError: (error: any) => {
      message.error(error?.message || '删除角色失败，请重试')
    },
  })
}

/**
 * 权限检查Hook
 */
export function useHasPermission(userId: string) {
  const { data: permissions = [] } = useUserPermissions(userId, !!userId)
  
  return {
    permissions,
    hasPermission: (permission: string | string[]): boolean => {
      // 超级管理员拥有所有权限
      if (permissions.includes('*')) return true
      
      if (Array.isArray(permission)) {
        return permission.every(p => permissions.includes(p))
      }
      
      return permissions.includes(permission)
    },
    canAccess: (resource: string, action: string = 'view'): boolean => {
      const permissionCode = `${resource}:${action}`
      return permissions.includes('*') || permissions.includes(permissionCode)
    },
  }
}

/**
 * 角色检查Hook
 */
export function useHasRole(userId: string) {
  const { data: userRoles = [] } = useUserRoles(userId, !!userId)
  
  return {
    roles: userRoles,
    hasRole: (role: string | string[]): boolean => {
      const roleNames = userRoles.map(r => r.name)
      
      if (Array.isArray(role)) {
        return role.some(r => roleNames.includes(r))
      }
      
      return roleNames.includes(role)
    },
    hasRoleCode: (roleCode: string | string[]): boolean => {
      const roleCodes = userRoles.map(r => r.code)
      
      if (Array.isArray(roleCode)) {
        return roleCode.some(code => roleCodes.includes(code))
      }
      
      return roleCodes.includes(roleCode)
    },
  }
}

/**
 * 批量权限检查Hook（用于菜单权限控制）
 */
export function useBatchPermissionCheck(userId: string, permissionList: string[]) {
  const { data: permissions = [] } = useUserPermissions(userId, !!userId)
  
  return useQuery({
    queryKey: ['rbac', 'batch-check', userId, permissionList],
    queryFn: () => {
      // 超级管理员拥有所有权限
      if (permissions.includes('*')) {
        return permissionList.reduce((acc, permission) => {
          acc[permission] = true
          return acc
        }, {} as Record<string, boolean>)
      }
      
      // 逐个检查权限
      return permissionList.reduce((acc, permission) => {
        acc[permission] = permissions.includes(permission)
        return acc
      }, {} as Record<string, boolean>)
    },
    enabled: !!userId && permissionList.length > 0 && permissions.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}