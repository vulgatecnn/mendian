/**
 * 个人中心 API 服务
 */
import request from './request'

// 用户个人信息
export interface UserProfile {
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
  permissions: string[]
  created_at: string
  last_login?: string
}

// 更新个人信息参数
export interface UpdateProfileParams {
  name?: string
  phone?: string
  email?: string
  avatar?: string
}

// 修改密码参数
export interface ChangePasswordParams {
  old_password: string
  new_password: string
  confirm_password: string
}

// 操作日志
export interface OperationLog {
  id: number
  user: {
    id: number
    name: string
  }
  operation_type: string
  operation_desc: string
  ip_address: string
  created_at: string
}

// 操作日志查询参数
export interface OperationLogQueryParams {
  page?: number
  page_size?: number
  start_date?: string
  end_date?: string
}

export class ProfileService {
  /**
   * 获取个人信息
   */
  static async getProfile(): Promise<UserProfile> {
    return request.get('/profile/')
  }

  /**
   * 更新个人信息
   */
  static async updateProfile(params: UpdateProfileParams): Promise<UserProfile> {
    return request.put('/profile/', params)
  }

  /**
   * 修改密码
   */
  static async changePassword(params: ChangePasswordParams): Promise<{ message: string }> {
    return request.post('/profile/change-password/', params)
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    return request.post('/profile/upload-avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * 获取个人操作日志
   */
  static async getOperationLogs(params?: OperationLogQueryParams): Promise<{
    results: OperationLog[]
    count: number
    next: string | null
    previous: string | null
  }> {
    return request.get('/profile/operation-logs/', { params })
  }
}

export default ProfileService
