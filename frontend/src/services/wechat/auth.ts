/**
 * 企业微信认证服务
 * 负责企业微信的用户认证、授权和用户信息管理
 */

import { httpClient } from '../http'
import type {
  BaseResponse,
  LoginResponse
} from '../types'

import type {
  WeChatConfig,
  WeChatUserInfo,
  WeChatEventCallback
} from '../../types/wechat'

import { weChatCore } from './core'
import {
  getAuthParams,
  cleanWeChatParams,
  handleWeChatError,
  debugLog,
  storage
} from '../../utils/wechat'

/**
 * 企业微信认证配置
 */
interface WeChatAuthConfig extends WeChatConfig {
  /** 自动重定向到授权页面 */
  autoRedirect?: boolean
  /** 静默授权（不弹出授权页面） */
  silentAuth?: boolean
  /** 授权成功后的回调地址 */
  successCallback?: string
  /** 授权失败后的回调地址 */
  errorCallback?: string
}

/**
 * 企业微信认证服务类
 */
export class WeChatAuth {
  private static instance: WeChatAuth | null = null
  private config: WeChatAuthConfig | null = null
  private currentUser: WeChatUserInfo | null = null
  private accessToken: string | null = null
  private tokenExpiration: number = 0

  /**
   * 获取单例实例
   */
  public static getInstance(): WeChatAuth {
    if (!WeChatAuth.instance) {
      WeChatAuth.instance = new WeChatAuth()
    }
    return WeChatAuth.instance
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    // 监听核心SDK事件
    weChatCore.addEventListener('ready', this.handleSDKReady.bind(this))
    weChatCore.addEventListener('error', this.handleSDKError.bind(this))

    // 页面加载时检查授权参数
    this.checkAuthParams()
  }

  /**
   * 初始化认证服务
   */
  public async initialize(config: WeChatAuthConfig): Promise<void> {
    try {
      debugLog('Initializing WeChat Auth Service', config)
      
      this.config = config
      storage.set('wechat_auth_config', config)

      // 初始化核心SDK
      await weChatCore.initialize(config)

      // 检查是否有缓存的用户信息
      await this.loadCachedUserInfo()

      // 如果在企业微信环境中且设置了自动重定向，检查授权状态
      if (config.autoRedirect && this.shouldAttemptAuth()) {
        await this.attemptAuth()
      }

      debugLog('WeChat Auth Service initialized successfully')
    } catch (error) {
      const authError = handleWeChatError(error, 'Auth Initialize')
      throw authError
    }
  }

  /**
   * 开始授权流程
   */
  public async startAuth(redirectUri?: string): Promise<void> {
    try {
      debugLog('Starting WeChat auth flow', { redirectUri })

      if (!this.config) {
        throw new Error('WeChat Auth not initialized')
      }

      // 在企业微信环境中直接跳转
      if (weChatCore.isWeChatEnvironment()) {
        weChatCore.redirectToAuth(redirectUri)
      } else {
        // 非企业微信环境，显示提示
        throw new Error('Please open in WeChat Work client')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Start Auth')
    }
  }

  /**
   * 静默授权（用于已授权用户的自动登录）
   */
  public async silentAuth(): Promise<WeChatUserInfo | null> {
    try {
      debugLog('Attempting silent auth')

      if (!this.config) {
        throw new Error('WeChat Auth not initialized')
      }

      // 检查是否有有效的访问令牌
      if (this.isTokenValid()) {
        return this.currentUser
      }

      // 检查URL中是否有授权码
      const { code, state } = getAuthParams()
      if (code && state) {
        return await this.handleAuthCallback(code, state)
      }

      // 如果在企业微信环境中，尝试获取用户信息
      if (weChatCore.isWeChatEnvironment() && this.config.silentAuth) {
        // 静默授权跳转
        const authUrl = weChatCore.getAuthUrl()
        window.location.replace(authUrl)
        return null
      }

      return null
    } catch (error) {
      debugLog('Silent auth failed', error)
      return null
    }
  }

  /**
   * 处理授权回调
   */
  public async handleAuthCallback(code: string, state: string): Promise<WeChatUserInfo> {
    try {
      debugLog('Handling auth callback', { code, state })

      // 调用后端API进行授权
      const response = await this.authWithCode(code, state)
      
      if (response.success && response.data) {
        // 保存用户信息和令牌
        this.setUserInfo(response.data.user as unknown as WeChatUserInfo)
        this.setAccessToken(response.data.accessToken, response.data.expiresIn)

        // 清理URL中的授权参数
        cleanWeChatParams()

        // 触发认证成功事件
        weChatCore.addEventListener('authSuccess', () => {})

        debugLog('Auth callback handled successfully', this.currentUser)
        return this.currentUser!
      } else {
        throw new Error(response.message || 'Authentication failed')
      }
    } catch (error) {
      // 触发认证失败事件
      weChatCore.addEventListener('authFailed', () => {})
      throw handleWeChatError(error, 'Auth Callback')
    }
  }

  /**
   * 获取当前用户信息
   */
  public getCurrentUser(): WeChatUserInfo | null {
    return this.currentUser
  }

  /**
   * 刷新用户信息
   */
  public async refreshUserInfo(): Promise<WeChatUserInfo> {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available')
      }

      const response = await this.getUserInfo()
      if (response.success && response.data) {
        this.setUserInfo(response.data)
        debugLog('User info refreshed', this.currentUser)
        return this.currentUser!
      } else {
        throw new Error(response.message || 'Failed to refresh user info')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Refresh User Info')
    }
  }

  /**
   * 登出
   */
  public async logout(): Promise<void> {
    try {
      debugLog('Logging out')

      // 调用后端登出API
      if (this.accessToken) {
        await this.logoutFromServer()
      }

      // 清理本地状态
      this.clearUserInfo()
      this.clearAccessToken()
      storage.remove('wechat_user_info')
      storage.remove('wechat_access_token')
      storage.remove('wechat_token_expiration')

      debugLog('Logout completed')
    } catch (error) {
      // 即使服务器登出失败，也要清理本地状态
      this.clearUserInfo()
      this.clearAccessToken()
      debugLog('Logout error, but local state cleared', error)
    }
  }

  /**
   * 检查是否已认证
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null && this.isTokenValid()
  }

  /**
   * 检查令牌是否有效
   */
  public isTokenValid(): boolean {
    return this.accessToken !== null && Date.now() < this.tokenExpiration
  }

  /**
   * 获取访问令牌
   */
  public getAccessToken(): string | null {
    return this.isTokenValid() ? this.accessToken : null
  }

  /**
   * 绑定企业微信账号
   */
  public async bindWeChatAccount(code: string, state: string): Promise<void> {
    try {
      debugLog('Binding WeChat account', { code, state })

      const response = await httpClient.post<null>('/auth/wechat/bind', {
        code,
        state
      })

      if (response.success) {
        debugLog('WeChat account bound successfully')
      } else {
        throw new Error(response.message || 'Failed to bind WeChat account')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Bind WeChat Account')
    }
  }

  /**
   * 解绑企业微信账号
   */
  public async unbindWeChatAccount(): Promise<void> {
    try {
      debugLog('Unbinding WeChat account')

      const response = await httpClient.post<null>('/auth/wechat/unbind')

      if (response.success) {
        debugLog('WeChat account unbound successfully')
      } else {
        throw new Error(response.message || 'Failed to unbind WeChat account')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Unbind WeChat Account')
    }
  }

  /**
   * 销毁认证服务实例
   */
  public destroy(): void {
    this.clearUserInfo()
    this.clearAccessToken()
    this.config = null
    storage.remove('wechat_auth_config')
    storage.remove('wechat_user_info')
    storage.remove('wechat_access_token')
    storage.remove('wechat_token_expiration')
    WeChatAuth.instance = null
    debugLog('WeChat Auth Service destroyed')
  }

  /**
   * 使用授权码进行认证（私有方法）
   */
  private async authWithCode(code: string, state: string): Promise<BaseResponse<LoginResponse>> {
    return httpClient.post<LoginResponse>('/auth/wechat/login', {
      code,
      state
    })
  }

  /**
   * 获取用户信息（私有方法）
   */
  private async getUserInfo(): Promise<BaseResponse<WeChatUserInfo>> {
    return httpClient.get<WeChatUserInfo>('/auth/wechat/userinfo')
  }

  /**
   * 服务器端登出（私有方法）
   */
  private async logoutFromServer(): Promise<void> {
    await httpClient.post('/auth/logout')
  }

  /**
   * 处理SDK就绪事件（私有方法）
   */
  private handleSDKReady: WeChatEventCallback = (event) => {
    debugLog('WeChat SDK ready for auth', event.data)
  }

  /**
   * 处理SDK错误事件（私有方法）
   */
  private handleSDKError: WeChatEventCallback = (event) => {
    debugLog('WeChat SDK error in auth', event.data)
  }

  /**
   * 检查URL中的授权参数（私有方法）
   */
  private checkAuthParams(): void {
    const { code, state } = getAuthParams()
    if (code && state) {
      debugLog('Auth params found in URL', { code, state })
      // 延迟处理，确保页面加载完成
      setTimeout(() => {
        this.handleAuthCallback(code, state).catch(error => {
          debugLog('Auto auth callback failed', error)
        })
      }, 100)
    }
  }

  /**
   * 加载缓存的用户信息（私有方法）
   */
  private async loadCachedUserInfo(): Promise<void> {
    try {
      const cachedUser = storage.get<WeChatUserInfo>('wechat_user_info')
      const cachedToken = storage.get<string>('wechat_access_token')
      const cachedExpiration = storage.get<number>('wechat_token_expiration')

      if (cachedUser && cachedToken && cachedExpiration) {
        this.currentUser = cachedUser
        this.accessToken = cachedToken
        this.tokenExpiration = cachedExpiration

        // 如果令牌即将过期，尝试刷新
        if (Date.now() > cachedExpiration - 5 * 60 * 1000) { // 提前5分钟刷新
          await this.refreshUserInfo()
        }

        debugLog('Cached user info loaded', this.currentUser)
      }
    } catch (error) {
      debugLog('Failed to load cached user info', error)
      this.clearUserInfo()
      this.clearAccessToken()
    }
  }

  /**
   * 判断是否应该尝试认证（私有方法）
   */
  private shouldAttemptAuth(): boolean {
    return weChatCore.isWeChatEnvironment() && !this.isAuthenticated()
  }

  /**
   * 尝试自动认证（私有方法）
   */
  private async attemptAuth(): Promise<void> {
    try {
      if (this.config?.silentAuth) {
        await this.silentAuth()
      }
    } catch (error) {
      debugLog('Auto auth attempt failed', error)
    }
  }

  /**
   * 设置用户信息（私有方法）
   */
  private setUserInfo(userInfo: WeChatUserInfo): void {
    this.currentUser = userInfo
    storage.set('wechat_user_info', userInfo)
    weChatCore.addEventListener('userInfoLoaded', () => {})
  }

  /**
   * 清理用户信息（私有方法）
   */
  private clearUserInfo(): void {
    this.currentUser = null
    storage.remove('wechat_user_info')
  }

  /**
   * 设置访问令牌（私有方法）
   */
  private setAccessToken(token: string, expiresIn: number): void {
    this.accessToken = token
    this.tokenExpiration = Date.now() + expiresIn * 1000
    storage.set('wechat_access_token', token)
    storage.set('wechat_token_expiration', this.tokenExpiration)
  }

  /**
   * 清理访问令牌（私有方法）
   */
  private clearAccessToken(): void {
    this.accessToken = null
    this.tokenExpiration = 0
    storage.remove('wechat_access_token')
    storage.remove('wechat_token_expiration')
  }
}

// 导出单例实例
export const weChatAuth = WeChatAuth.getInstance()