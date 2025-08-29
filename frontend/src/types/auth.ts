/**
 * 用户认证相关类型定义
 */

export interface User {
  /** 用户ID */
  id: string
  /** 用户名 */
  username: string
  /** 真实姓名 */
  realName: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  phone?: string
  /** 头像 */
  avatar?: string
  /** 用户角色 */
  roles: UserRole[]
  /** 所属部门 */
  department?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 是否启用 */
  enabled: boolean
}

export interface UserRole {
  /** 角色ID */
  id: string
  /** 角色代码 */
  code: string
  /** 角色名称 */
  name: string
  /** 角色描述 */
  description?: string
  /** 权限列表 */
  permissions: string[]
}

export interface LoginRequest {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 记住密码 */
  remember?: boolean
  /** 验证码 */
  captcha?: string
}

export interface LoginResponse {
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken: string
  /** 令牌类型 */
  tokenType: string
  /** 过期时间(秒) */
  expiresIn: number
  /** 用户信息 */
  user: User
}

export interface RefreshTokenRequest {
  /** 刷新令牌 */
  refreshToken: string
}

export interface RefreshTokenResponse {
  /** 新的访问令牌 */
  accessToken: string
  /** 新的刷新令牌 */
  refreshToken: string
  /** 令牌类型 */
  tokenType: string
  /** 过期时间(秒) */
  expiresIn: number
}

export interface AuthState {
  /** 是否已认证 */
  isAuthenticated: boolean
  /** 当前用户 */
  user: User | null
  /** 访问令牌 */
  accessToken: string | null
  /** 刷新令牌 */
  refreshToken: string | null
  /** 令牌过期时间 */
  tokenExpiresAt: number | null
  /** 是否正在登录 */
  isLoading: boolean
  /** 错误信息 */
  error: string | null
}
