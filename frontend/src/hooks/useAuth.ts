/**
 * 用户认证相关Hook
 */

import { useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { usePermissionStore } from '../stores/permissionStore'
import type { LoginRequest } from '../types/auth'

/**
 * 认证Hook
 */
export const useAuth = () => {
  const authStore = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // 初始化认证状态
  useEffect(() => {
    authStore.initialize()
  }, [])

  // 登录
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        await authStore.login(credentials)

        // 登录成功后跳转
        const from = (location.state as any)?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      } catch (error) {
        throw error
      }
    },
    [authStore.login, navigate, location]
  )

  // 登出
  const logout = useCallback(() => {
    authStore.logout()
    usePermissionStore.getState().clearPermissions()
    navigate('/login', { replace: true })
  }, [authStore.logout, navigate])

  // 刷新令牌
  const refreshToken = useCallback(async () => {
    try {
      await authStore.refreshTokenAction()
    } catch (error) {
      // 刷新失败，跳转到登录页
      navigate('/login', {
        replace: true,
        state: { from: location }
      })
      throw error
    }
  }, [authStore.refreshToken, navigate, location])

  return {
    // 状态
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    isLoading: authStore.isLoading,
    error: authStore.error,

    // 操作
    login,
    logout,
    refreshToken,
    setError: authStore.setError,
    clearError: authStore.clearError,

    // 令牌相关
    accessToken: authStore.accessToken,
    isTokenExpired: authStore.isTokenExpired
  }
}

/**
 * 当前用户Hook
 */
export const useCurrentUser = () => {
  const { user } = useAuthStore()

  return {
    user,
    userId: user?.id,
    username: user?.username,
    realName: user?.realName,
    roles: user?.roles || [],
    roleNames: user?.roles.map(role => role.name) || [],
    isAdmin: user?.roles.some(role => role.code === 'ADMIN') || false
  }
}

/**
 * 登录状态检查Hook
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isTokenExpired } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: location }
      })
      return
    }

    if (isTokenExpired()) {
      // 尝试刷新令牌
      useAuthStore
        .getState()
        .refreshTokenAction()
        .catch(() => {
          navigate('/login', {
            replace: true,
            state: { from: location }
          })
        })
    }
  }, [isAuthenticated, isTokenExpired, navigate, location])

  return {
    isAuthenticated: isAuthenticated && !isTokenExpired(),
    needsLogin: !isAuthenticated || isTokenExpired()
  }
}
