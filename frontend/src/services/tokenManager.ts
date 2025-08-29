/**
 * Token管理服务
 */

import { jwtDecode } from 'jwt-decode'
import { secureStorage } from '../utils/secureStorage'
import { logger } from '../utils/logger'

export interface TokenInfo {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  expiresAt: number
}

export interface JWTPayload {
  sub: string
  exp: number
  iat: number
  aud?: string
  iss?: string
  userId?: string
  username?: string
  roles?: string[]
  permissions?: string[]
}

/**
 * Token管理器
 */
class TokenManager {
  private readonly ACCESS_TOKEN_KEY = 'access_token'
  private readonly REFRESH_TOKEN_KEY = 'refresh_token'
  private readonly TOKEN_EXPIRES_AT_KEY = 'token_expires_at'
  private readonly TOKEN_TYPE_KEY = 'token_type'

  /**
   * 存储Token信息
   */
  setTokens(tokenInfo: Partial<TokenInfo>): void {
    const { accessToken, refreshToken, tokenType, expiresIn, expiresAt } = tokenInfo

    if (accessToken) {
      secureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    }

    if (refreshToken) {
      secureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
    }

    if (tokenType) {
      secureStorage.setItem(this.TOKEN_TYPE_KEY, tokenType)
    }

    if (expiresIn) {
      const calculatedExpiresAt = Date.now() + expiresIn * 1000
      secureStorage.setItem(this.TOKEN_EXPIRES_AT_KEY, calculatedExpiresAt)
    } else if (expiresAt) {
      secureStorage.setItem(this.TOKEN_EXPIRES_AT_KEY, expiresAt)
    }

    logger.debug('Token信息已安全存储')
  }

  /**
   * 获取访问令牌
   */
  getAccessToken(): string | null {
    return secureStorage.getItem<string>(this.ACCESS_TOKEN_KEY)
  }

  /**
   * 获取刷新令牌
   */
  getRefreshToken(): string | null {
    return secureStorage.getItem<string>(this.REFRESH_TOKEN_KEY)
  }

  /**
   * 获取令牌类型
   */
  getTokenType(): string {
    return secureStorage.getItem<string>(this.TOKEN_TYPE_KEY) || 'Bearer'
  }

  /**
   * 获取令牌过期时间
   */
  getTokenExpiresAt(): number | null {
    return secureStorage.getItem<number>(this.TOKEN_EXPIRES_AT_KEY)
  }

  /**
   * 获取完整的Token信息
   */
  getTokenInfo(): TokenInfo | null {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()
    const tokenType = this.getTokenType()
    const expiresAt = this.getTokenExpiresAt()

    if (!accessToken || !refreshToken) {
      return null
    }

    return {
      accessToken,
      refreshToken,
      tokenType,
      expiresIn: 0, // 不再使用，改用expiresAt
      expiresAt: expiresAt || 0
    }
  }

  /**
   * 清除所有Token
   */
  clearTokens(): void {
    secureStorage.removeItem(this.ACCESS_TOKEN_KEY)
    secureStorage.removeItem(this.REFRESH_TOKEN_KEY)
    secureStorage.removeItem(this.TOKEN_TYPE_KEY)
    secureStorage.removeItem(this.TOKEN_EXPIRES_AT_KEY)
    logger.debug('Token信息已清除')
  }

  /**
   * 检查Token是否过期
   */
  isTokenExpired(bufferMinutes: number = 5): boolean {
    const expiresAt = this.getTokenExpiresAt()
    if (!expiresAt) return true

    // 提前bufferMinutes分钟判定为过期
    const bufferMs = bufferMinutes * 60 * 1000
    return Date.now() > (expiresAt - bufferMs)
  }

  /**
   * 检查Token是否即将过期
   */
  isTokenExpiringSoon(beforeMinutes: number = 10): boolean {
    const expiresAt = this.getTokenExpiresAt()
    if (!expiresAt) return true

    const beforeMs = beforeMinutes * 60 * 1000
    return Date.now() > (expiresAt - beforeMs)
  }

  /**
   * 解码JWT Token
   */
  decodeToken(token?: string): JWTPayload | null {
    try {
      const targetToken = token || this.getAccessToken()
      if (!targetToken) return null

      return jwtDecode<JWTPayload>(targetToken)
    } catch (error) {
      logger.error('Token解码失败:', error)
      return null
    }
  }

  /**
   * 获取Token中的用户信息
   */
  getTokenUserInfo(): { userId?: string; username?: string; roles?: string[]; permissions?: string[] } | null {
    const payload = this.decodeToken()
    if (!payload) return null

    return {
      userId: payload.userId || payload.sub,
      username: payload.username,
      roles: payload.roles,
      permissions: payload.permissions
    }
  }

  /**
   * 验证Token格式
   */
  isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split('.')
      return parts.length === 3 && parts.every(part => part.length > 0)
    } catch {
      return false
    }
  }

  /**
   * 获取Authorization Header
   */
  getAuthorizationHeader(): string | null {
    const accessToken = this.getAccessToken()
    const tokenType = this.getTokenType()

    if (!accessToken) return null

    return `${tokenType} ${accessToken}`
  }

  /**
   * 检查是否需要刷新Token
   */
  shouldRefreshToken(): boolean {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()

    if (!accessToken || !refreshToken) return false

    return this.isTokenExpiringSoon(10) // 10分钟内过期则需要刷新
  }

  /**
   * Token有效性检查
   */
  isTokenValid(): boolean {
    const accessToken = this.getAccessToken()
    if (!accessToken) return false

    if (!this.isValidTokenFormat(accessToken)) return false

    if (this.isTokenExpired()) return false

    return true
  }

  /**
   * 获取Token剩余有效时间（秒）
   */
  getTokenRemainingTime(): number {
    const expiresAt = this.getTokenExpiresAt()
    if (!expiresAt) return 0

    const remaining = Math.max(0, expiresAt - Date.now())
    return Math.floor(remaining / 1000)
  }
}

// 导出单例
export const tokenManager = new TokenManager()

/**
 * Token工具函数
 */
export const tokenUtils = {
  /**
   * 格式化Token过期时间
   */
  formatExpirationTime: (expiresAt: number): string => {
    const date = new Date(expiresAt)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  /**
   * 计算Token剩余时间文本
   */
  formatRemainingTime: (seconds: number): string => {
    if (seconds <= 0) return '已过期'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${remainingSeconds}秒`
    } else {
      return `${remainingSeconds}秒`
    }
  },

  /**
   * 生成模拟Token（用于开发测试）
   */
  generateMockToken: (userId: string, username: string, expiresIn: number = 7200): TokenInfo => {
    const now = Date.now()
    const expiresAt = now + expiresIn * 1000

    // 简单的模拟Token，实际项目中应该从后端获取
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({
      sub: userId,
      username,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt / 1000)
    }))
    const signature = btoa('mock-signature')

    const accessToken = `${header}.${payload}.${signature}`
    const refreshToken = `refresh_${accessToken}`

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt
    }
  }
}

export default tokenManager