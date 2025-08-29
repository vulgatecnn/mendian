/**
 * 用户认证状态管理
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthState, User, LoginRequest, LoginResponse } from '../types/auth'

interface AuthStore extends Omit<AuthState, 'refreshToken'> {
  // 认证操作
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshTokenAction: () => Promise<void>
  setUser: (user: User) => void
  setError: (error: string | null) => void
  clearError: () => void

  // 令牌操作
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void
  clearTokens: () => void
  isTokenExpired: () => boolean

  // 初始化
  initialize: () => Promise<void>

  // 令牌属性
  refreshToken: string | null
}

// 模拟API调用
const mockApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // 模拟登录延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟登录验证
    if (credentials.username === 'admin' && credentials.password === '123456') {
      return {
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        tokenType: 'Bearer',
        expiresIn: 7200, // 2小时
        user: {
          id: '1',
          username: 'admin',
          realName: '系统管理员',
          email: 'admin@example.com',
          phone: '13800138000',
          avatar: 'https://via.placeholder.com/64',
          roles: [
            {
              id: '1',
              code: 'ADMIN',
              name: '系统管理员',
              description: '系统管理员角色',
              permissions: [
            // 系统首页
            'dashboard:view',
            // 开店计划
            'store-plan:view', 'store-plan:create', 'store-plan:update', 'store-plan:delete', 'store-plan:manage',
            // 拓店管理
            'expansion:view', 'expansion:create', 'expansion:update', 'expansion:delete', 'expansion:manage',
            'expansion:candidates:view', 'expansion:candidates:manage', 'expansion:dashboard:view',
            // 开店筹备
            'preparation:view', 'preparation:create', 'preparation:update', 'preparation:delete', 'preparation:manage',
            'preparation:dashboard:view',
            // 门店档案
            'store-files:view', 'store-files:create', 'store-files:update', 'store-files:delete', 'store-files:manage',
            // 门店运营
            'operation:view', 'operation:create', 'operation:update', 'operation:delete', 'operation:manage',
            'operation:payments:view', 'operation:assets:view',
            // 审批中心
            'approval:view', 'approval:create', 'approval:update', 'approval:delete', 'approval:manage',
            'approval:pending:view', 'approval:processed:view',
            // 基础数据
            'basic-data:view', 'basic-data:create', 'basic-data:update', 'basic-data:delete', 'basic-data:manage',
            'basic-data:regions:view', 'basic-data:suppliers:view',
            // 系统管理
            'system:view', 'system:manage'
          ]
            }
          ],
          department: '技术部',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          enabled: true
        }
      }
    }

    throw new Error('用户名或密码错误')
  },

  async refreshToken(
    _refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    // 模拟刷新令牌延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      accessToken: 'mock_new_access_token_' + Date.now(),
      refreshToken: 'mock_new_refresh_token_' + Date.now(),
      expiresIn: 7200
    }
  },

  async getCurrentUser(): Promise<User> {
    // 模拟获取用户信息
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      id: '1',
      username: 'admin',
      realName: '系统管理员',
      email: 'admin@example.com',
      phone: '13800138000',
      avatar: 'https://via.placeholder.com/64',
      roles: [
        {
          id: '1',
          code: 'ADMIN',
          name: '系统管理员',
          description: '系统管理员角色',
          permissions: [
            // 系统首页
            'dashboard:view',
            // 开店计划
            'store-plan:view', 'store-plan:create', 'store-plan:update', 'store-plan:delete', 'store-plan:manage',
            // 拓店管理
            'expansion:view', 'expansion:create', 'expansion:update', 'expansion:delete', 'expansion:manage',
            'expansion:candidates:view', 'expansion:candidates:manage', 'expansion:dashboard:view',
            // 开店筹备
            'preparation:view', 'preparation:create', 'preparation:update', 'preparation:delete', 'preparation:manage',
            'preparation:dashboard:view',
            // 门店档案
            'store-files:view', 'store-files:create', 'store-files:update', 'store-files:delete', 'store-files:manage',
            // 门店运营
            'operation:view', 'operation:create', 'operation:update', 'operation:delete', 'operation:manage',
            'operation:payments:view', 'operation:assets:view',
            // 审批中心
            'approval:view', 'approval:create', 'approval:update', 'approval:delete', 'approval:manage',
            'approval:pending:view', 'approval:processed:view',
            // 基础数据
            'basic-data:view', 'basic-data:create', 'basic-data:update', 'basic-data:delete', 'basic-data:manage',
            'basic-data:regions:view', 'basic-data:suppliers:view',
            // 系统管理
            'system:view', 'system:manage'
          ]
        }
      ],
      department: '技术部',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isLoading: false,
      error: null,

      // 登录
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null })

          const response = await mockApi.login(credentials)
          const { accessToken, refreshToken, expiresIn, user } = response

          // 计算过期时间
          const expiresAt = Date.now() + expiresIn * 1000

          set({
            isAuthenticated: true,
            user,
            accessToken,
            refreshToken,
            tokenExpiresAt: expiresAt,
            isLoading: false,
            error: null
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败'
          })
          throw error
        }
      },

      // 登出
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          error: null
        })
      },

      // 刷新令牌方法
      refreshTokenAction: async () => {
        try {
          const state = get()
          const currentRefreshToken = state.refreshToken
          if (!currentRefreshToken) {
            throw new Error('No refresh token available')
          }

          const response = await mockApi.refreshToken(currentRefreshToken)
          const { accessToken, refreshToken: newRefreshToken, expiresIn } = response

          // 计算过期时间
          const expiresAt = Date.now() + expiresIn * 1000

          set({
            accessToken,
            refreshToken: newRefreshToken,
            tokenExpiresAt: expiresAt
          })
        } catch (error) {
          // 刷新失败，清除认证状态
          get().logout()
          throw error
        }
      },

      // 设置用户信息
      setUser: (user: User) => {
        set({ user })
      },

      // 设置错误
      setError: (error: string | null) => {
        set({ error })
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },

      // 设置令牌
      setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
        const expiresAt = Date.now() + expiresIn * 1000
        set({
          accessToken,
          refreshToken,
          tokenExpiresAt: expiresAt
        })
      },

      // 清除令牌
      clearTokens: () => {
        set({
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null
        })
      },

      // 检查令牌是否过期
      isTokenExpired: () => {
        const { tokenExpiresAt } = get()
        if (!tokenExpiresAt) return true

        // 提前5分钟判定为过期
        return Date.now() > tokenExpiresAt - 5 * 60 * 1000
      },

      // 初始化认证状态
      initialize: async () => {
        try {
          const { accessToken, isTokenExpired } = get()

          if (!accessToken) {
            return
          }

          // 如果令牌过期，尝试刷新
          if (isTokenExpired()) {
            await get().refreshTokenAction()
          }

          // 获取用户信息
          const user = await mockApi.getCurrentUser()
          set({
            isAuthenticated: true,
            user
          })
        } catch (error) {
          // 初始化失败，清除状态
          get().logout()
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
