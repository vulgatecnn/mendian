/**
 * 角色管理 API 服务
 */
import request from './request'
import { Role, PaginatedResponse, Permission, User, ApiResponse } from '../types'

// 角色查询参数
export interface RoleQueryParams {
  name?: string
  is_active?: boolean
  page?: number
  page_size?: number
}

// 角色创建/更新参数
export interface RoleFormData {
  name: string
  description: string
  is_active?: boolean
}

// 权限分配参数
export interface AssignPermissionsData {
  permission_ids: number[]
}

// 成员管理参数
export interface AddMembersData {
  user_ids: number[]
}

export class RoleService {
  /**
   * 获取角色列表
   */
  static async getRoles(params?: RoleQueryParams): Promise<PaginatedResponse<Role>> {
    return request.get('/roles/', { params })
  }

  /**
   * 获取角色详情
   */
  static async getRoleDetail(id: number): Promise<Role> {
    return request.get(`/roles/${id}/`)
  }

  /**
   * 获取所有启用的角色（用于选择器）
   */
  static async getActiveRoles(): Promise<Role[]> {
    const response: PaginatedResponse<Role> = await request.get('/roles/', { 
      params: { is_active: true, page_size: 1000 } 
    })
    return response.results || []
  }

  /**
   * 创建角色
   */
  static async createRole(data: RoleFormData): Promise<ApiResponse<Role>> {
    return request.post('/roles/', data)
  }

  /**
   * 更新角色
   */
  static async updateRole(id: number, data: RoleFormData): Promise<ApiResponse<Role>> {
    return request.put(`/roles/${id}/`, data)
  }

  /**
   * 删除角色
   */
  static async deleteRole(id: number): Promise<ApiResponse> {
    return request.delete(`/roles/${id}/`)
  }

  /**
   * 分配权限
   */
  static async assignPermissions(id: number, data: AssignPermissionsData): Promise<ApiResponse> {
    return request.post(`/roles/${id}/assign_permissions/`, data)
  }

  /**
   * 获取角色成员列表
   */
  static async getRoleMembers(id: number): Promise<ApiResponse<User[]>> {
    return request.get(`/roles/${id}/members/`)
  }

  /**
   * 添加角色成员
   */
  static async addRoleMembers(id: number, data: AddMembersData): Promise<ApiResponse> {
    return request.post(`/roles/${id}/add_members/`, data)
  }

  /**
   * 获取所有权限列表（按模块分组）
   */
  static async getPermissions(): Promise<ApiResponse<Permission[]>> {
    return request.get('/permissions/')
  }
}

export default RoleService