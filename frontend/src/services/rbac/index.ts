/**
 * RBAC权限管理服务
 * 基于角色的访问控制(Role-Based Access Control)
 */
import { mockUsers, mockRoles, mockPermissions } from '../mock/mockData'
import type { User, Role, Permission } from '../mock/factories'

export interface RBACUser {
  id: string
  username: string
  name: string
  email: string
  roleIds: string[]
  roleNames: string[]
  permissions: string[]
  isActive: boolean
}

export interface RBACRole {
  id: string
  name: string
  code: string
  permissions: string[]
  userCount: number
  isSystem: boolean
}

export interface RBACPermission {
  id: string
  name: string
  code: string
  resource: string
  action: string
  category: string
}

/**
 * RBAC权限管理服务类
 */
export class RBACService {
  /**
   * 获取用户权限列表
   */
  static getUserPermissions(userId: string): string[] {
    const user = mockUsers.find(u => u.id === userId)
    if (!user) return []

    const permissions = new Set<string>()

    // 遍历用户角色，收集所有权限
    user.roleIds.forEach(roleId => {
      const role = mockRoles.find(r => r.id === roleId)
      if (role && role.permissions) {
        role.permissions.forEach(permission => {
          permissions.add(permission)
        })
      }
    })

    return Array.from(permissions)
  }

  /**
   * 检查用户是否拥有指定权限
   */
  static hasPermission(userId: string, permission: string | string[]): boolean {
    const userPermissions = this.getUserPermissions(userId)
    
    // 超级管理员拥有所有权限
    if (userPermissions.includes('*')) return true

    if (Array.isArray(permission)) {
      return permission.every(p => userPermissions.includes(p))
    }

    return userPermissions.includes(permission)
  }

  /**
   * 检查用户是否拥有指定角色
   */
  static hasRole(userId: string, role: string | string[]): boolean {
    const user = mockUsers.find(u => u.id === userId)
    if (!user) return false

    if (Array.isArray(role)) {
      return role.some(r => user.roleNames.includes(r))
    }

    return user.roleNames.includes(role)
  }

  /**
   * 检查用户是否可以访问指定资源
   */
  static canAccess(userId: string, resource: string, action: string = 'view'): boolean {
    const permissionCode = `${resource}:${action}`
    return this.hasPermission(userId, permissionCode)
  }

  /**
   * 获取用户的角色信息
   */
  static getUserRoles(userId: string): RBACRole[] {
    const user = mockUsers.find(u => u.id === userId)
    if (!user) return []

    return user.roleIds.map(roleId => {
      const role = mockRoles.find(r => r.id === roleId)
      if (!role) return null

      return {
        id: role.id,
        name: role.name,
        code: role.code,
        permissions: role.permissions,
        userCount: role.userCount,
        isSystem: role.isSystem,
      }
    }).filter(Boolean) as RBACRole[]
  }

  /**
   * 获取角色的权限列表
   */
  static getRolePermissions(roleId: string): RBACPermission[] {
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) return []

    return role.permissions.map(permissionCode => {
      const permission = mockPermissions.find(p => p.code === permissionCode)
      if (!permission) {
        // 如果找不到权限详情，创建基础权限对象
        const [resource, action = 'view'] = permissionCode.split(':')
        return {
          id: `perm_${Math.random().toString(36).substr(2, 9)}`,
          name: permissionCode,
          code: permissionCode,
          resource,
          action,
          category: 'custom',
        }
      }

      return {
        id: permission.id,
        name: permission.name,
        code: permission.code,
        resource: permission.resource,
        action: permission.action,
        category: permission.category,
      }
    })
  }

  /**
   * 分页获取用户列表
   */
  static getUsers(params: {
    page?: number
    pageSize?: number
    keyword?: string
    roleId?: string
    status?: 'active' | 'inactive'
  } = {}): {
    data: RBACUser[]
    pagination: {
      current: number
      pageSize: number
      total: number
      totalPages: number
    }
  } {
    const { page = 1, pageSize = 10, keyword = '', roleId, status } = params

    let filteredUsers = mockUsers

    // 状态过滤
    if (status) {
      filteredUsers = filteredUsers.filter(user => 
        status === 'active' ? user.status === 'active' : user.status !== 'active'
      )
    }

    // 角色过滤
    if (roleId) {
      filteredUsers = filteredUsers.filter(user => user.roleIds.includes(roleId))
    }

    // 关键词过滤
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(lowerKeyword) ||
        user.username.toLowerCase().includes(lowerKeyword) ||
        user.email.toLowerCase().includes(lowerKeyword)
      )
    }

    const total = filteredUsers.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex).map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      roleIds: user.roleIds,
      roleNames: user.roleNames,
      permissions: this.getUserPermissions(user.id),
      isActive: user.status === 'active',
    }))

    return {
      data: paginatedUsers,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages,
      },
    }
  }

  /**
   * 获取角色列表
   */
  static getRoles(): RBACRole[] {
    return mockRoles.map(role => ({
      id: role.id,
      name: role.name,
      code: role.code,
      permissions: role.permissions,
      userCount: role.userCount,
      isSystem: role.isSystem,
    }))
  }

  /**
   * 获取权限列表（分类）
   */
  static getPermissions(): Record<string, RBACPermission[]> {
    const permissionsByCategory: Record<string, RBACPermission[]> = {}

    mockPermissions.forEach(permission => {
      const category = permission.category
      if (!permissionsByCategory[category]) {
        permissionsByCategory[category] = []
      }

      permissionsByCategory[category].push({
        id: permission.id,
        name: permission.name,
        code: permission.code,
        resource: permission.resource,
        action: permission.action,
        category: permission.category,
      })
    })

    return permissionsByCategory
  }

  /**
   * 分配角色给用户
   */
  static assignRolesToUser(userId: string, roleIds: string[]): boolean {
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) return false

    const roles = mockRoles.filter(role => roleIds.includes(role.id))
    
    mockUsers[userIndex].roleIds = roleIds
    mockUsers[userIndex].roleNames = roles.map(role => role.name)
    mockUsers[userIndex].updatedAt = new Date().toISOString()

    return true
  }

  /**
   * 创建角色
   */
  static createRole(roleData: {
    name: string
    code: string
    description?: string
    permissions: string[]
  }): RBACRole {
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: roleData.name,
      code: roleData.code,
      description: roleData.description || '',
      permissions: roleData.permissions,
      userCount: 0,
      status: 'active',
      isSystem: false,
      createdBy: 'current-user-id',
      createdByName: '当前用户',
      updatedBy: 'current-user-id',
      updatedByName: '当前用户',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockRoles.push(newRole)

    return {
      id: newRole.id,
      name: newRole.name,
      code: newRole.code,
      permissions: newRole.permissions,
      userCount: newRole.userCount,
      isSystem: newRole.isSystem,
    }
  }

  /**
   * 更新角色
   */
  static updateRole(roleId: string, updates: {
    name?: string
    description?: string
    permissions?: string[]
  }): boolean {
    const roleIndex = mockRoles.findIndex(r => r.id === roleId)
    if (roleIndex === -1) return false

    const role = mockRoles[roleIndex]
    
    // 系统角色不允许修改
    if (role.isSystem) return false

    if (updates.name) role.name = updates.name
    if (updates.description !== undefined) role.description = updates.description
    if (updates.permissions) role.permissions = updates.permissions
    
    role.updatedAt = new Date().toISOString()

    return true
  }

  /**
   * 删除角色
   */
  static deleteRole(roleId: string): boolean {
    const roleIndex = mockRoles.findIndex(r => r.id === roleId)
    if (roleIndex === -1) return false

    const role = mockRoles[roleIndex]
    
    // 系统角色不允许删除
    if (role.isSystem) return false

    // 检查是否有用户正在使用该角色
    const usersWithRole = mockUsers.filter(user => user.roleIds.includes(roleId))
    if (usersWithRole.length > 0) {
      throw new Error(`该角色正被${usersWithRole.length}个用户使用，无法删除`)
    }

    mockRoles.splice(roleIndex, 1)
    return true
  }

  /**
   * 获取权限树结构
   */
  static getPermissionTree(): any[] {
    const permissionsByCategory = this.getPermissions()
    
    return Object.keys(permissionsByCategory).map(category => ({
      key: category,
      title: this.getCategoryName(category),
      children: permissionsByCategory[category].map(permission => ({
        key: permission.code,
        title: permission.name,
        resource: permission.resource,
        action: permission.action,
      }))
    }))
  }

  /**
   * 获取分类名称
   */
  private static getCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      system: '系统管理',
      business: '业务管理',
      data: '数据权限',
      operation: '操作权限',
    }
    
    return categoryNames[category] || category
  }
}

// 默认导出
export default RBACService