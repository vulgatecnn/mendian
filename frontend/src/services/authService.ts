/**
 * 认证服务
 */

import { tokenManager, TokenInfo } from './tokenManager'
import { httpClient } from './http'
import type { LoginRequest, LoginResponse, User } from '../types/auth'

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

/**
 * 认证服务类
 */
class AuthService {
  private refreshPromise: Promise<RefreshTokenResponse> | null = null
  private isRefreshing = false

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await httpClient.post<LoginResponse>('/auth/login', credentials)
      
      // 存储Token
      if (response.data) {
        const { accessToken, refreshToken, tokenType, expiresIn } = response.data
        
        tokenManager.setTokens({
          accessToken,
          refreshToken,
          tokenType,
          expiresIn
        })
      }

      return response.data
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      // 调用后端登出接口
      const refreshToken = tokenManager.getRefreshToken()
      if (refreshToken) {
        await httpClient.post('/auth/logout', { refreshToken })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // 无论如何都清除本地Token
      this.clearAuthData()
    }
  }

  /**
   * 刷新Token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    // 如果已经在刷新中，返回相同的Promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = tokenManager.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh(refreshToken)

    try {
      const result = await this.refreshPromise
      
      // 更新Token
      tokenManager.setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn
      })

      return result
    } catch (error) {
      // 刷新失败，清除认证数据
      this.clearAuthData()
      throw error
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * 执行Token刷新
   */
  private async performTokenRefresh(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await httpClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken
      })

      return response.data
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await httpClient.get<User>('/auth/me')
      return response.data
    } catch (error) {
      console.error('Get current user failed:', error)
      throw error
    }
  }

  /**
   * 验证Token有效性
   */
  async validateToken(): Promise<boolean> {
    try {
      await httpClient.get('/auth/validate')
      return true
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return tokenManager.isTokenValid()
  }

  /**
   * 检查是否需要刷新Token
   */
  shouldRefreshToken(): boolean {
    return tokenManager.shouldRefreshToken()
  }

  /**
   * 获取当前Token信息
   */
  getTokenInfo(): TokenInfo | null {
    return tokenManager.getTokenInfo()
  }

  /**
   * 获取Authorization Header
   */
  getAuthorizationHeader(): string | null {
    return tokenManager.getAuthorizationHeader()
  }

  /**
   * 清除认证数据
   */
  clearAuthData(): void {
    tokenManager.clearTokens()
  }

  /**
   * 自动刷新Token（如果需要）
   */
  async autoRefreshTokenIfNeeded(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false
      }

      if (this.shouldRefreshToken() && !this.isRefreshing) {
        await this.refreshToken()
        return true
      }

      return true
    } catch (error) {
      console.error('Auto refresh token failed:', error)
      return false
    }
  }

  /**
   * 企业微信登录
   */
  async wechatLogin(code: string): Promise<LoginResponse> {
    try {
      const response = await httpClient.post<LoginResponse>('/auth/wechat/login', { code })
      
      if (response.data) {
        const { accessToken, refreshToken, tokenType, expiresIn } = response.data
        
        tokenManager.setTokens({
          accessToken,
          refreshToken,
          tokenType,
          expiresIn
        })
      }

      return response.data
    } catch (error) {
      console.error('WeChat login failed:', error)
      throw error
    }
  }

  /**
   * 获取企业微信登录URL
   */
  async getWechatLoginUrl(): Promise<string> {
    try {
      const response = await httpClient.get<{ url: string }>('/auth/wechat/login-url')
      return response.data.url
    } catch (error) {
      console.error('Get WeChat login URL failed:', error)
      throw error
    }
  }

  /**
   * 修改密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await httpClient.post('/auth/change-password', {
        oldPassword,
        newPassword
      })
    } catch (error) {
      console.error('Change password failed:', error)
      throw error
    }
  }

  /**
   * 忘记密码 - 发送重置邮件
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await httpClient.post('/auth/forgot-password', { email })
    } catch (error) {
      console.error('Send password reset email failed:', error)
      throw error
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await httpClient.post('/auth/reset-password', {
        token,
        newPassword
      })
    } catch (error) {
      console.error('Reset password failed:', error)
      throw error
    }
  }

  /**
   * 获取用户权限信息
   */
  async getUserPermissions(): Promise<string[]> {
    try {
      const response = await httpClient.get<{ permissions: string[] }>('/auth/permissions')
      return response.data.permissions
    } catch (error) {
      console.error('Get user permissions failed:', error)
      return []
    }
  }
}

// 导出单例
export const authService = new AuthService()

/**
 * 认证工具函数
 */
export const authUtils = {
  /**
   * 从Token中提取用户信息
   */
  extractUserFromToken: (): { userId?: string; username?: string } | null => {
    return tokenManager.getTokenUserInfo()
  },

  /**
   * 检查用户是否有特定角色
   */
  hasRole: (userRoles: string[], requiredRole: string): boolean => {
    return userRoles.includes(requiredRole)
  },

  /**
   * 检查用户是否有任意角色
   */
  hasAnyRole: (userRoles: string[], requiredRoles: string[]): boolean => {
    return requiredRoles.some(role => userRoles.includes(role))
  },

  /**
   * 检查用户是否有所有角色
   */
  hasAllRoles: (userRoles: string[], requiredRoles: string[]): boolean => {
    return requiredRoles.every(role => userRoles.includes(role))
  },

  /**
   * 格式化用户显示名称
   */
  formatUserDisplayName: (user: User): string => {
    return user.realName || user.username || user.email || '未知用户'
  },

  /**
   * 检查密码强度
   */
  checkPasswordStrength: (password: string): { 
    score: number; 
    level: 'weak' | 'medium' | 'strong'; 
    suggestions: string[] 
  } => {
    let score = 0
    const suggestions: string[] = []

    // 长度检查
    if (password.length >= 8) {
      score += 25
    } else {
      suggestions.push('密码长度至少8个字符')
    }

    // 包含小写字母
    if (/[a-z]/.test(password)) {
      score += 25
    } else {
      suggestions.push('包含小写字母')
    }

    // 包含大写字母
    if (/[A-Z]/.test(password)) {
      score += 25
    } else {
      suggestions.push('包含大写字母')
    }

    // 包含数字
    if (/\d/.test(password)) {
      score += 25
    } else {
      suggestions.push('包含数字')
    }

    // 包含特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 25
    } else {
      suggestions.push('包含特殊字符')
    }

    let level: 'weak' | 'medium' | 'strong'
    if (score < 50) {
      level = 'weak'
    } else if (score < 75) {
      level = 'medium'
    } else {
      level = 'strong'
    }

    return {
      score: Math.min(score, 100),
      level,
      suggestions
    }
  }
}

export default authService