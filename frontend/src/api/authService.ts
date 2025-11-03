/**
 * 认证服务 API
 */
import request from './request'

// 登录响应
export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: number
    username: string
    name: string
    phone: string
    email: string
    avatar?: string
    department?: {
      id: number
      name: string
    }
    roles: Array<{
      id: number
      name: string
      code: string
    }>
  }
}

// 账号密码登录参数
export interface LoginByPasswordParams {
  username: string
  password: string
  remember?: boolean
}

// 手机号密码登录参数
export interface LoginByPhonePasswordParams {
  phone: string
  password: string
  remember?: boolean
}

// 手机号验证码登录参数
export interface LoginBySmsCodeParams {
  phone: string
  code: string
  remember?: boolean
}

// 企业微信登录参数
export interface LoginByWechatParams {
  code: string
}

// 发送短信验证码参数
export interface SendSmsCodeParams {
  phone: string
  type: 'login' | 'register' | 'reset_password'
}

// 发送短信验证码响应
export interface SendSmsCodeResponse {
  message: string
  expires_in: number
}

// 刷新Token参数
export interface RefreshTokenParams {
  refresh_token: string
}

export class AuthService {
  /**
   * 账号密码登录
   */
  static async loginByPassword(params: LoginByPasswordParams): Promise<LoginResponse> {
    return request.post('/auth/login/', {
      login_type: 'password',
      ...params
    })
  }

  /**
   * 手机号密码登录
   */
  static async loginByPhonePassword(params: LoginByPhonePasswordParams): Promise<LoginResponse> {
    return request.post('/auth/login/', {
      login_type: 'phone_password',
      ...params
    })
  }

  /**
   * 手机号验证码登录
   */
  static async loginBySmsCode(params: LoginBySmsCodeParams): Promise<LoginResponse> {
    return request.post('/auth/login/', {
      login_type: 'sms_code',
      ...params
    })
  }

  /**
   * 企业微信登录
   */
  static async loginByWechat(params: LoginByWechatParams): Promise<LoginResponse> {
    return request.post('/auth/wechat-login/', params)
  }

  /**
   * 发送短信验证码
   */
  static async sendSmsCode(params: SendSmsCodeParams): Promise<SendSmsCodeResponse> {
    return request.post('/auth/send-sms-code/', params)
  }

  /**
   * 退出登录
   */
  static async logout(): Promise<void> {
    return request.post('/auth/logout/')
  }

  /**
   * 刷新Token
   */
  static async refreshToken(params: RefreshTokenParams): Promise<LoginResponse> {
    return request.post('/auth/refresh-token/', params)
  }
}

export default AuthService
