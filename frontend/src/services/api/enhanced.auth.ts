/**
 * 增强版认证API服务
 * 支持Mock数据的认证API
 */
import { httpClient } from '../http'
import type { ApiResponse } from '../types/api'

// 登录接口
export interface LoginRequest {
  username: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    username: string
    name: string
    email: string
    avatar?: string
    departmentId: string
    departmentName: string
    roleIds: string[]
    roleNames: string[]
    permissions: string[]
  }
  expiresIn: number
}

// 用户资料更新接口
export interface UpdateProfileRequest {
  name?: string
  email?: string
  phone?: string
  avatar?: string
}

// 修改密码接口
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

// 认证API服务类
export class EnhancedAuthService {
  /**
   * 用户登录
   */
  static async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return httpClient.post('/auth/login', data)
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<ApiResponse<null>> {
    return httpClient.post('/auth/logout')
  }

  /**
   * 刷新Token
   */
  static async refreshToken(refreshToken: string): Promise<ApiResponse<{
    token: string
    refreshToken: string
    expiresIn: number
  }>> {
    return httpClient.post('/auth/refresh', { refreshToken })
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    return httpClient.get('/auth/me')
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UpdateProfileRequest>> {
    return httpClient.put('/auth/profile', data)
  }

  /**
   * 修改密码
   */
  static async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    return httpClient.post('/auth/change-password', data)
  }

  /**
   * 验证Token有效性
   */
  static async validateToken(): Promise<ApiResponse<{ valid: boolean }>> {
    try {
      await this.getCurrentUser()
      return { 
        success: true, 
        data: { valid: true },
        message: 'Token有效',
        code: 200,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return { 
        success: false, 
        data: { valid: false },
        message: 'Token无效',
        code: 401,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// 默认导出
export default EnhancedAuthService