/**
 * Mock数据存储
 * 统一管理所有Mock数据
 */

// 导入工厂函数
import {
  createMockUsers,
  createMockRoles,
  createMockPermissions,
  createMockRegions,
  createMockSuppliers,
  createMockOrganizations,
  createMockCustomers,
  createMockBusinessRegions,
  createMockStorePlans,
  createMockCandidateLocations,
} from './factories'

// 数据存储配置
const DATA_CONFIG = {
  users: { count: 50 },
  roles: { count: 10 },
  permissions: { count: 50 },
  regions: { count: 100 },
  suppliers: { count: 30 },
  organizations: { count: 20 },
  customers: { count: 25 },
  businessRegions: { count: 6 },
  storePlans: { count: 20 },
  candidateLocations: { count: 15 },
}

// 用户相关数据
export const mockUsers = createMockUsers(DATA_CONFIG.users)
export const mockRoles = createMockRoles(DATA_CONFIG.roles)
export const mockPermissions = createMockPermissions(DATA_CONFIG.permissions)

// 基础数据
export const mockRegions = createMockRegions(DATA_CONFIG.regions)
export const mockSuppliers = createMockSuppliers(DATA_CONFIG.suppliers)
export const mockOrganizations = createMockOrganizations(DATA_CONFIG.organizations)
export const mockCustomers = createMockCustomers(DATA_CONFIG.customers)
export const mockBusinessRegions = createMockBusinessRegions(DATA_CONFIG.businessRegions)

// 业务数据
export const mockStorePlans = createMockStorePlans(DATA_CONFIG.storePlans)
export const mockCandidateLocations = createMockCandidateLocations(DATA_CONFIG.candidateLocations)

// 认证相关Mock数据
export const mockAuthData = {
  // 默认管理员用户
  admin: {
    username: 'admin',
    password: 'admin123',
    user: mockUsers.find(user => user.username === 'admin') || mockUsers[0],
  },
  // JWT Token模拟
  generateToken: (user: typeof mockUsers[0]) => {
    const payload = {
      userId: user.id,
      username: user.username,
      name: user.name,
      roles: user.roleNames,
      permissions: ['*'], // 简化处理，管理员拥有所有权限
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时过期
    }
    // 简单的base64编码模拟JWT
    return `mock-jwt-${btoa(JSON.stringify(payload))}`
  },
  // 解析Token
  parseToken: (token: string) => {
    try {
      const payload = token.replace('mock-jwt-', '')
      return JSON.parse(atob(payload))
    } catch {
      return null
    }
  }
}

// 数据重置函数
export function resetMockData() {
  // 清空所有数据并重新生成
  mockUsers.length = 0
  mockRoles.length = 0
  mockPermissions.length = 0
  mockRegions.length = 0
  mockSuppliers.length = 0
  mockOrganizations.length = 0
  mockCustomers.length = 0
  mockBusinessRegions.length = 0
  mockStorePlans.length = 0
  mockCandidateLocations.length = 0
  
  // 重新生成数据
  mockUsers.push(...createMockUsers(DATA_CONFIG.users))
  mockRoles.push(...createMockRoles(DATA_CONFIG.roles))
  mockPermissions.push(...createMockPermissions(DATA_CONFIG.permissions))
  mockRegions.push(...createMockRegions(DATA_CONFIG.regions))
  mockSuppliers.push(...createMockSuppliers(DATA_CONFIG.suppliers))
  mockOrganizations.push(...createMockOrganizations(DATA_CONFIG.organizations))
  mockCustomers.push(...createMockCustomers(DATA_CONFIG.customers))
  mockBusinessRegions.push(...createMockBusinessRegions(DATA_CONFIG.businessRegions))
  mockStorePlans.push(...createMockStorePlans(DATA_CONFIG.storePlans))
  mockCandidateLocations.push(...createMockCandidateLocations(DATA_CONFIG.candidateLocations))
  
  console.log('Mock数据已重置')
}

// 数据统计
export function getMockDataStats() {
  return {
    users: mockUsers.length,
    roles: mockRoles.length,
    permissions: mockPermissions.length,
    regions: mockRegions.length,
    suppliers: mockSuppliers.length,
    organizations: mockOrganizations.length,
    customers: mockCustomers.length,
    businessRegions: mockBusinessRegions.length,
    storePlans: mockStorePlans.length,
    candidateLocations: mockCandidateLocations.length,
    total: mockUsers.length + mockRoles.length + mockPermissions.length + 
           mockRegions.length + mockSuppliers.length + mockOrganizations.length +
           mockCustomers.length + mockBusinessRegions.length + mockStorePlans.length +
           mockCandidateLocations.length,
  }
}

// 导出所有数据的类型
export type MockDataType = {
  users: typeof mockUsers
  roles: typeof mockRoles
  permissions: typeof mockPermissions
  regions: typeof mockRegions
  suppliers: typeof mockSuppliers
  organizations: typeof mockOrganizations
  customers: typeof mockCustomers
  businessRegions: typeof mockBusinessRegions
  storePlans: typeof mockStorePlans
  candidateLocations: typeof mockCandidateLocations
}

// 开发工具：打印数据统计
if (process.env.NODE_ENV === 'development') {
  console.log('Mock数据统计:', getMockDataStats())
}