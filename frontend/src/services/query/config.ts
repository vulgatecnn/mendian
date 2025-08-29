// React Query配置
import { QueryClient, DefaultOptions } from '@tanstack/react-query'

// 默认查询选项
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // 数据缓存时间 (5分钟)
    staleTime: 5 * 60 * 1000,
    // 缓存保持时间 (30分钟)
    gcTime: 30 * 60 * 1000,
    // 失败重试次数
    retry: (failureCount, error: any) => {
      // 401/403错误不重试
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      // 最多重试3次
      return failureCount < 3
    },
    // 重试延迟
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // 窗口获得焦点时重新获取数据
    refetchOnWindowFocus: false,
    // 网络重连时重新获取数据
    refetchOnReconnect: true
  },
  mutations: {
    // 失败重试次数
    retry: 1,
    // 重试延迟
    retryDelay: 1000
  }
}

// 创建QueryClient实例
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: defaultQueryOptions
  })
}

// 全局QueryClient实例
export const queryClient = createQueryClient()

// Query Key工厂
export const queryKeys = {
  // 认证相关
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    permissions: () => [...queryKeys.auth.all, 'permissions'] as const,
    menus: () => [...queryKeys.auth.all, 'menus'] as const,
    loginHistory: (params?: any) => [...queryKeys.auth.all, 'loginHistory', params] as const
  },

  // 开店计划相关
  storePlan: {
    all: ['storePlan'] as const,
    lists: () => [...queryKeys.storePlan.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.storePlan.lists(), params] as const,
    details: () => [...queryKeys.storePlan.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.storePlan.details(), id] as const,
    stats: (params?: any) => [...queryKeys.storePlan.all, 'stats', params] as const,
    options: () => [...queryKeys.storePlan.all, 'options'] as const,
    approvalHistory: (id: string) =>
      [...queryKeys.storePlan.detail(id), 'approvalHistory'] as const,
    recommendations: (id: string, params?: any) =>
      [...queryKeys.storePlan.detail(id), 'recommendations', params] as const
  },

  // 拓店管理相关
  expansion: {
    all: ['expansion'] as const,
    candidates: {
      all: ['expansion', 'candidates'] as const,
      lists: () => [...queryKeys.expansion.candidates.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.expansion.candidates.lists(), params] as const,
      details: () => [...queryKeys.expansion.candidates.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.expansion.candidates.details(), id] as const,
      nearby: (params: any) => [...queryKeys.expansion.candidates.all, 'nearby', params] as const
    },
    followUps: {
      all: ['expansion', 'followUps'] as const,
      lists: () => [...queryKeys.expansion.followUps.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.expansion.followUps.lists(), params] as const,
      candidate: (candidateId: string, params?: any) =>
        [...queryKeys.expansion.followUps.all, 'candidate', candidateId, params] as const
    },
    businessConditions: {
      all: ['expansion', 'businessConditions'] as const,
      lists: () => [...queryKeys.expansion.businessConditions.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.expansion.businessConditions.lists(), params] as const,
      candidate: (candidateId: string) =>
        [...queryKeys.expansion.businessConditions.all, 'candidate', candidateId] as const
    },
    stats: (params?: any) => [...queryKeys.expansion.all, 'stats', params] as const,
    options: () => [...queryKeys.expansion.all, 'options'] as const,
    recommendations: (params: any) =>
      [...queryKeys.expansion.all, 'recommendations', params] as const
  },

  // 开店筹备相关
  preparation: {
    all: ['preparation'] as const,
    projects: {
      all: ['preparation', 'projects'] as const,
      lists: () => [...queryKeys.preparation.projects.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.preparation.projects.lists(), params] as const,
      details: () => [...queryKeys.preparation.projects.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.preparation.projects.details(), id] as const,
      phases: (projectId: string) =>
        [...queryKeys.preparation.projects.detail(projectId), 'phases'] as const,
      tasks: (params?: any) => [...queryKeys.preparation.all, 'tasks', params] as const,
      vendors: (params?: any) => [...queryKeys.preparation.all, 'vendors', params] as const,
      documents: (projectId: string, params?: any) =>
        [...queryKeys.preparation.projects.detail(projectId), 'documents', params] as const,
      engineering: (projectId: string) =>
        [...queryKeys.preparation.projects.detail(projectId), 'engineering'] as const,
      acceptance: (projectId: string) =>
        [...queryKeys.preparation.projects.detail(projectId), 'acceptance'] as const,
      delivery: (projectId: string) =>
        [...queryKeys.preparation.projects.detail(projectId), 'delivery'] as const
    },
    stats: (params?: any) => [...queryKeys.preparation.all, 'stats', params] as const,
    options: () => [...queryKeys.preparation.all, 'options'] as const
  },

  // 门店档案相关
  storeFiles: {
    all: ['storeFiles'] as const,
    stores: {
      all: ['storeFiles', 'stores'] as const,
      lists: () => [...queryKeys.storeFiles.stores.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.storeFiles.stores.lists(), params] as const,
      details: () => [...queryKeys.storeFiles.stores.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.storeFiles.stores.details(), id] as const
    },
    certificates: (storeId: string) =>
      [...queryKeys.storeFiles.all, 'certificates', storeId] as const,
    equipment: (storeId: string) => [...queryKeys.storeFiles.all, 'equipment', storeId] as const,
    documents: (storeId: string, params?: any) =>
      [...queryKeys.storeFiles.all, 'documents', storeId, params] as const,
    operationHistory: (storeId: string, params?: any) =>
      [...queryKeys.storeFiles.all, 'operationHistory', storeId, params] as const,
    stats: () => [...queryKeys.storeFiles.all, 'stats'] as const
  },

  // 门店运营相关
  operation: {
    all: ['operation'] as const,
    payments: {
      all: ['operation', 'payments'] as const,
      lists: () => [...queryKeys.operation.payments.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.operation.payments.lists(), params] as const,
      details: () => [...queryKeys.operation.payments.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.operation.payments.details(), id] as const
    },
    assets: {
      all: ['operation', 'assets'] as const,
      lists: () => [...queryKeys.operation.assets.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.operation.assets.lists(), params] as const,
      details: () => [...queryKeys.operation.assets.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.operation.assets.details(), id] as const
    },
    reports: (type: string, params?: any) =>
      [...queryKeys.operation.all, 'reports', type, params] as const
  },

  // 审批中心相关
  approval: {
    all: ['approval'] as const,
    flows: {
      all: ['approval', 'flows'] as const,
      lists: () => [...queryKeys.approval.flows.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.approval.flows.lists(), params] as const,
      details: () => [...queryKeys.approval.flows.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.approval.flows.details(), id] as const
    },
    templates: {
      all: ['approval', 'templates'] as const,
      lists: () => [...queryKeys.approval.templates.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.approval.templates.lists(), params] as const,
      details: () => [...queryKeys.approval.templates.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.approval.templates.details(), id] as const
    },
    myTasks: (params?: any) => [...queryKeys.approval.all, 'myTasks', params] as const,
    myApplications: (params?: any) =>
      [...queryKeys.approval.all, 'myApplications', params] as const,
    stats: () => [...queryKeys.approval.all, 'stats'] as const
  },

  // 基础数据相关
  basicData: {
    all: ['basicData'] as const,
    regions: {
      all: ['basicData', 'regions'] as const,
      lists: () => [...queryKeys.basicData.regions.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.basicData.regions.lists(), params] as const,
      tree: (rootId?: string) => [...queryKeys.basicData.regions.all, 'tree', rootId] as const,
      details: () => [...queryKeys.basicData.regions.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.basicData.regions.details(), id] as const
    },
    suppliers: {
      all: ['basicData', 'suppliers'] as const,
      lists: () => [...queryKeys.basicData.suppliers.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.basicData.suppliers.lists(), params] as const,
      details: () => [...queryKeys.basicData.suppliers.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.basicData.suppliers.details(), id] as const
    },
    organizations: {
      all: ['basicData', 'organizations'] as const,
      lists: () => [...queryKeys.basicData.organizations.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.basicData.organizations.lists(), params] as const,
      tree: () => [...queryKeys.basicData.organizations.all, 'tree'] as const,
      details: () => [...queryKeys.basicData.organizations.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.basicData.organizations.details(), id] as const
    },
    customers: {
      all: ['basicData', 'customers'] as const,
      lists: () => [...queryKeys.basicData.customers.all, 'list'] as const,
      list: (params?: any) => [...queryKeys.basicData.customers.lists(), params] as const,
      details: () => [...queryKeys.basicData.customers.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.basicData.customers.details(), id] as const
    },
    dictionary: (category?: string) => [...queryKeys.basicData.all, 'dictionary', category] as const
  },

  // 系统管理相关
  system: {
    all: ['system'] as const,
    config: () => [...queryKeys.system.all, 'config'] as const,
    info: () => [...queryKeys.system.all, 'info'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
    files: (params?: any) => [...queryKeys.system.all, 'files', params] as const,
    logs: {
      operations: (params?: any) =>
        [...queryKeys.system.all, 'logs', 'operations', params] as const,
      system: (params?: any) => [...queryKeys.system.all, 'logs', 'system', params] as const
    },
    notifications: (params?: any) => [...queryKeys.system.all, 'notifications', params] as const,
    unreadCount: () => [...queryKeys.system.all, 'notifications', 'unreadCount'] as const,
    backups: () => [...queryKeys.system.all, 'backups'] as const,
    cacheStats: () => [...queryKeys.system.all, 'cache', 'stats'] as const
  }
} as const

// Query Key类型
export type QueryKeys = typeof queryKeys
