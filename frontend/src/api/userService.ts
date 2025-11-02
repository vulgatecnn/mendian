/**
 * 用户管理 API 服务
 */
import request from './request'
import { 
  User, 
  UserSyncResponse, 
  UserToggleStatusResponse, 
  RoleAssignResponse,
  PaginatedResponse,
  PaginationParams 
} from '../types'

// 用户查询参数
export interface UserQueryParams extends PaginationParams {
  name?: string
  department_id?: number
  is_active?: boolean
}

// 用户同步参数
export interface UserSyncParams {
  department_id?: number
  fetch_child?: boolean
}

// 角色分配参数
export interface RoleAssignParams {
  role_ids: number[]
}

export class UserService {
  /**
   * 获取用户列表
   */
  static async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
    return request.get('/users/', { params })
  }

  /**
   * 获取用户详情
   */
  static async getUserDetail(id: number): Promise<User> {
    return request.get(`/users/${id}/`)
  }

  /**
   * 从企业微信同步用户
   */
  static async syncFromWechat(params?: UserSyncParams): Promise<UserSyncResponse> {
    return request.post('/users/sync_from_wechat/', params)
  }

  /**
   * 启用/停用用户
   */
  static async toggleUserStatus(id: number, isActive?: boolean): Promise<UserToggleStatusResponse> {
    const data = isActive !== undefined ? { is_active: isActive } : {}
    return request.post(`/users/${id}/toggle_status/`, data)
  }

  /**
   * 分配角色
   */
  static async assignRoles(id: number, params: RoleAssignParams): Promise<RoleAssignResponse> {
    return request.post(`/users/${id}/assign_roles/`, params)
  }
}

export default UserService