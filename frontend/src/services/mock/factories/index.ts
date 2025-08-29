/**
 * Mock数据工厂
 * 基于faker.js生成模拟数据
 */

export { createMockRegion, createMockRegions } from './region.factory'
export { createMockSupplier, createMockSuppliers } from './supplier.factory'
export { createMockOrganization, createMockOrganizations } from './organization.factory'
export { createMockCustomer, createMockCustomers } from './customer.factory'
export { createMockBusinessRegion, createMockBusinessRegions } from './businessRegion.factory'
export { createMockStorePlan, createMockStorePlans } from './storePlan.factory'
export { createMockCandidateLocation, createMockCandidateLocations } from './candidateLocation.factory'
export { createMockFollowUpRecord, createMockFollowUpRecords } from './followUpRecord.factory'
export { createMockPreparationProject, createMockPreparationProjects } from './preparationProject.factory'
export { createMockStore, createMockStores } from './store.factory'
export { createMockPaymentItem, createMockPaymentItems } from './paymentItem.factory'
export { createMockStoreAsset, createMockStoreAssets } from './storeAsset.factory'
export { createMockApprovalFlow, createMockApprovalFlows } from './approvalFlow.factory'
export { createMockApprovalTemplate, createMockApprovalTemplates } from './approvalTemplate.factory'
export { createMockUser, createMockUsers } from './user.factory'
export { createMockRole, createMockRoles } from './role.factory'
export { createMockPermission, createMockPermissions } from './permission.factory'

// 工厂配置类型
export interface FactoryOptions {
  locale?: 'zh_CN' | 'en'
  count?: number
  seed?: number
}

// 通用工厂配置
export const DEFAULT_FACTORY_OPTIONS: FactoryOptions = {
  locale: 'zh_CN',
  count: 10,
}

// 分页参数
export interface PaginationParams {
  page?: number
  pageSize?: number
  total?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 创建分页响应
export function createPaginatedResponse<T>(
  allData: T[],
  { page = 1, pageSize = 10 }: PaginationParams = {}
): PaginatedResponse<T> {
  const total = allData.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const data = allData.slice(start, end)

  return {
    data,
    pagination: {
      current: page,
      pageSize,
      total,
      totalPages,
    },
  }
}

// Mock响应延迟工具
export const mockDelay = (min: number = 300, max: number = 800): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Mock错误生成工具
export const mockError = (rate: number = 0.1) => {
  if (Math.random() < rate) {
    throw new Error('Mock API Error: 模拟网络错误')
  }
}