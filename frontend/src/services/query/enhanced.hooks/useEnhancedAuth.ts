/**
 * 增强版认证相关React Query hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { EnhancedAuthService } from '../../api/enhanced.auth'
import type { 
  LoginRequest, 
  LoginResponse, 
  UpdateProfileRequest, 
  ChangePasswordRequest 
} from '../../api/enhanced.auth'

// Query Keys
export const AUTH_QUERY_KEYS = {
  user: ['auth', 'user'],
  profile: ['auth', 'profile'],
  permissions: ['auth', 'permissions'],
} as const

/**
 * 登录Hook
 */
export function useLogin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LoginRequest) => EnhancedAuthService.login(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // 存储token
        localStorage.setItem('access_token', response.data.token)
        localStorage.setItem('refresh_token', response.data.refreshToken)
        
        // 缓存用户信息
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, response.data.user)
        
        message.success(response.message || '登录成功')
      } else {
        message.error(response.message || '登录失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '登录失败，请检查网络连接')
    },
  })
}

/**
 * 登出Hook
 */
export function useLogout() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => EnhancedAuthService.logout(),
    onSuccess: (response) => {
      // 清除本地存储
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      // 清除所有缓存
      queryClient.clear()
      
      message.success(response.message || '登出成功')
    },
    onError: (error: any) => {
      // 即使登出接口失败，也要清除本地数据
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      queryClient.clear()
      
      console.error('Logout error:', error)
    },
  })
}

/**
 * 获取当前用户信息Hook
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.user,
    queryFn: async () => {
      const response = await EnhancedAuthService.getCurrentUser()
      if (response.success) {
        return response.data
      }
      throw new Error(response.message || '获取用户信息失败')
    },
    enabled: !!localStorage.getItem('access_token'), // 只有在有token时才查询
    retry: (failureCount, error: any) => {
      // 如果是401错误，不重试
      if (error?.response?.status === 401) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
    gcTime: 10 * 60 * 1000, // 10分钟后垃圾回收
  })
}

/**
 * 更新用户资料Hook
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => EnhancedAuthService.updateProfile(data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // 更新缓存中的用户信息
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, (oldData: any) => ({
          ...oldData,
          ...variables,
        }))
        
        message.success(response.message || '资料更新成功')
      } else {
        message.error(response.message || '更新失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '更新失败，请重试')
    },
  })
}

/**
 * 修改密码Hook
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => EnhancedAuthService.changePassword(data),
    onSuccess: (response) => {
      if (response.success) {
        message.success(response.message || '密码修改成功')
      } else {
        message.error(response.message || '密码修改失败')
      }
    },
    onError: (error: any) => {
      message.error(error?.message || '密码修改失败，请重试')
    },
  })
}

/**
 * 验证Token Hook
 */
export function useValidateToken() {
  return useQuery({
    queryKey: ['auth', 'validate'],
    queryFn: async () => {
      const response = await EnhancedAuthService.validateToken()
      return response.data?.valid || false
    },
    enabled: !!localStorage.getItem('access_token'),
    retry: false, // token验证失败不重试
    staleTime: 60 * 1000, // 1分钟
    gcTime: 2 * 60 * 1000, // 2分钟
  })
}

/**
 * 刷新Token Hook
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: () => {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token')
      }
      return EnhancedAuthService.refreshToken(refreshToken)
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem('access_token', response.data.token)
        localStorage.setItem('refresh_token', response.data.refreshToken)
      }
    },
    onError: () => {
      // 刷新失败，清除本地存储
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
  })
}

/**
 * 检查是否已登录Hook
 */
export function useIsAuthenticated() {
  const { data: user, isLoading, isError } = useCurrentUser()
  const hasToken = !!localStorage.getItem('access_token')
  
  return {
    isAuthenticated: !isLoading && !isError && !!user && hasToken,
    isLoading,
    user,
  }
}

/**
 * 权限检查Hook
 */
export function useHasPermission() {
  const { data: user } = useCurrentUser()
  
  return (permission: string | string[]): boolean => {
    if (!user || !user.permissions) return false
    
    // 超级管理员拥有所有权限
    if (user.permissions.includes('*')) return true
    
    if (Array.isArray(permission)) {
      return permission.every(p => user.permissions.includes(p))
    }
    
    return user.permissions.includes(permission)
  }
}

/**
 * 角色检查Hook
 */
export function useHasRole() {
  const { data: user } = useCurrentUser()
  
  return (role: string | string[]): boolean => {
    if (!user || !user.roleNames) return false
    
    if (Array.isArray(role)) {
      return role.some(r => user.roleNames.includes(r))
    }
    
    return user.roleNames.includes(role)
  }
}