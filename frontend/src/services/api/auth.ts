import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserProfileResponse,
  PermissionCheckResponse,
  MenuResponse
} from '../types'

/**
 * 认证相关API服务
 */
export class AuthApiService {
  /**
   * 用户登录
   */
  static async login(data: LoginRequest): Promise<BaseResponse<LoginResponse>> {
    return httpClient.post<LoginResponse>(API_PATHS.AUTH.LOGIN, data, {
      timeout: 10000 // 登录请求超时时间稍长
    })
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<BaseResponse<null>> {
    return httpClient.post<null>(API_PATHS.AUTH.LOGOUT)
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(
    data: RefreshTokenRequest
  ): Promise<BaseResponse<RefreshTokenResponse>> {
    return httpClient.post<RefreshTokenResponse>(API_PATHS.AUTH.REFRESH, data, {
      timeout: 5000
    })
  }

  /**
   * 获取当前用户信息
   */
  static async getUserInfo(): Promise<BaseResponse<UserProfileResponse>> {
    return httpClient.get<UserProfileResponse>(API_PATHS.AUTH.USER_INFO, {
      timeout: 5000
    })
  }

  /**
   * 获取用户权限列表
   */
  static async getUserPermissions(): Promise<BaseResponse<string[]>> {
    return httpClient.get<string[]>(API_PATHS.AUTH.PERMISSIONS)
  }

  /**
   * 检查用户权限
   */
  static async checkPermissions(
    permissions: string[]
  ): Promise<BaseResponse<PermissionCheckResponse>> {
    return httpClient.post<PermissionCheckResponse>(`${API_PATHS.AUTH.PERMISSIONS}/check`, {
      permissions
    })
  }

  /**
   * 获取用户菜单
   */
  static async getUserMenus(): Promise<BaseResponse<MenuResponse[]>> {
    return httpClient.get<MenuResponse[]>('/auth/menus')
  }

  /**
   * 修改密码
   */
  static async changePassword(data: {
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<BaseResponse<null>> {
    return httpClient.post<null>('/auth/password/change', data)
  }

  /**
   * 重置密码 - 发送邮件
   */
  static async sendResetPasswordEmail(email: string): Promise<BaseResponse<null>> {
    return httpClient.post<null>('/auth/password/reset/send', { email })
  }

  /**
   * 重置密码 - 确认重置
   */
  static async resetPassword(data: {
    token: string
    newPassword: string
    confirmPassword: string
  }): Promise<BaseResponse<null>> {
    return httpClient.post<null>('/auth/password/reset/confirm', data)
  }

  /**
   * 获取验证码
   */
  static async getCaptcha(): Promise<
    BaseResponse<{
      id: string
      image: string
    }>
  > {
    return httpClient.get<{
      id: string
      image: string
    }>('/auth/captcha')
  }

  /**
   * 验证验证码
   */
  static async verifyCaptcha(id: string, code: string): Promise<BaseResponse<boolean>> {
    return httpClient.post<boolean>('/auth/captcha/verify', { id, code })
  }

  /**
   * 获取企业微信授权URL
   */
  static async getWeChatAuthUrl(redirectUri?: string): Promise<
    BaseResponse<{
      authUrl: string
      state: string
    }>
  > {
    return httpClient.get<{
      authUrl: string
      state: string
    }>(buildUrl('/auth/wechat/url', undefined, { redirectUri }))
  }

  /**
   * 企业微信登录
   */
  static async weChatLogin(data: {
    code: string
    state: string
  }): Promise<BaseResponse<LoginResponse>> {
    return httpClient.post<LoginResponse>('/auth/wechat/login', data)
  }

  /**
   * 绑定企业微信
   */
  static async bindWeChat(data: { code: string; state: string }): Promise<BaseResponse<null>> {
    return httpClient.post<null>('/auth/wechat/bind', data)
  }

  /**
   * 解绑企业微信
   */
  static async unbindWeChat(): Promise<BaseResponse<null>> {
    return httpClient.post<null>('/auth/wechat/unbind')
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(data: {
    name?: string
    email?: string
    phone?: string
    avatar?: string
  }): Promise<BaseResponse<UserProfileResponse>> {
    return httpClient.patch<UserProfileResponse>('/auth/profile', data)
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(file: File): Promise<
    BaseResponse<{
      url: string
    }>
  > {
    const formData = new FormData()
    formData.append('avatar', file)

    return httpClient.upload<{
      url: string
    }>('/auth/avatar', formData)
  }

  /**
   * 获取登录历史
   */
  static async getLoginHistory(params?: {
    page?: number
    pageSize?: number
    startDate?: string
    endDate?: string
  }): Promise<
    BaseResponse<
      Array<{
        id: string
        ip: string
        userAgent: string
        location?: string
        loginAt: string
        logoutAt?: string
        duration?: number
        status: 'success' | 'failed' | 'logout'
      }>
    >
  > {
    return httpClient.get<
      Array<{
        id: string
        ip: string
        userAgent: string
        location?: string
        loginAt: string
        logoutAt?: string
        duration?: number
        status: 'success' | 'failed' | 'logout'
      }>
    >(buildUrl('/auth/login-history', undefined, params))
  }

  /**
   * 获取安全设置
   */
  static async getSecuritySettings(): Promise<
    BaseResponse<{
      loginAttemptLimit: number
      passwordExpireDays: number
      sessionTimeoutMinutes: number
      twoFactorEnabled: boolean
      ipWhitelist: string[]
    }>
  > {
    return httpClient.get<{
      loginAttemptLimit: number
      passwordExpireDays: number
      sessionTimeoutMinutes: number
      twoFactorEnabled: boolean
      ipWhitelist: string[]
    }>('/auth/security')
  }

  /**
   * 更新安全设置
   */
  static async updateSecuritySettings(data: {
    twoFactorEnabled?: boolean
    ipWhitelist?: string[]
  }): Promise<BaseResponse<null>> {
    return httpClient.patch<null>('/auth/security', data)
  }
}
