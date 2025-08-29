import type { HttpClientConfig } from './client'

// 环境变量配置
export const API_CONFIG = {
  // API基础URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7100/api/v1',

  // 超时时间（毫秒）
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),

  // 重试配置
  RETRY_COUNT: parseInt(import.meta.env.VITE_API_RETRY_COUNT || '3', 10),
  RETRY_DELAY: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000', 10),

  // 功能开关
  ENABLE_LOADING: import.meta.env.VITE_API_ENABLE_LOADING !== 'false',
  ENABLE_ERROR_MESSAGE: import.meta.env.VITE_API_ENABLE_ERROR_MESSAGE !== 'false',
  ENABLE_MOCK: import.meta.env.VITE_API_ENABLE_MOCK === 'true'
} as const

// 请求超时时间配置
export const TIMEOUT_CONFIG = {
  // 短请求：基础数据查询
  SHORT: 5000,
  // 中等请求：业务数据操作
  MEDIUM: 10000,
  // 长请求：文件上传、导出等
  LONG: 30000,
  // 超长请求：大数据处理
  EXTRA_LONG: 60000
} as const

// 默认HTTP客户端配置
export const DEFAULT_HTTP_CONFIG: HttpClientConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  retryCount: API_CONFIG.RETRY_COUNT,
  retryDelay: API_CONFIG.RETRY_DELAY,
  enableLoading: API_CONFIG.ENABLE_LOADING,
  enableErrorMessage: API_CONFIG.ENABLE_ERROR_MESSAGE,

  // 默认请求头
  headers: {
    'Content-Type': 'application/json',
    'X-Client': 'mendian-frontend',
    'X-Version': '1.0.0'
  },

  // 跨域配置
  withCredentials: false
}

// 业务模块API路径配置
export const API_PATHS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    USER_INFO: '/auth/user',
    PERMISSIONS: '/auth/permissions'
  },

  // 开店计划管理
  STORE_PLAN: {
    LIST: '/store-plans',
    DETAIL: '/store-plans/:id',
    CREATE: '/store-plans',
    UPDATE: '/store-plans/:id',
    DELETE: '/store-plans/:id',
    BATCH_DELETE: '/store-plans/batch',
    EXPORT: '/store-plans/export',
    IMPORT: '/store-plans/import',
    APPROVE: '/store-plans/:id/approve',
    REJECT: '/store-plans/:id/reject'
  },

  // 拓店管理
  EXPANSION: {
    CANDIDATES: '/expansion/candidates',
    CANDIDATE_DETAIL: '/expansion/candidates/:id',
    CREATE_CANDIDATE: '/expansion/candidates',
    UPDATE_CANDIDATE: '/expansion/candidates/:id',
    DELETE_CANDIDATE: '/expansion/candidates/:id',
    FOLLOW_UPS: '/expansion/follow-ups',
    CREATE_FOLLOW_UP: '/expansion/follow-ups',
    UPDATE_FOLLOW_UP: '/expansion/follow-ups/:id',
    BUSINESS_CONDITIONS: '/expansion/business-conditions'
  },

  // 开店筹备
  PREPARATION: {
    PROJECTS: '/preparation/projects',
    PROJECT_DETAIL: '/preparation/projects/:id',
    CREATE_PROJECT: '/preparation/projects',
    UPDATE_PROJECT: '/preparation/projects/:id',
    DELETE_PROJECT: '/preparation/projects/:id',
    ENGINEERING: '/preparation/engineering',
    ACCEPTANCE: '/preparation/acceptance',
    DELIVERY: '/preparation/delivery'
  },

  // 门店档案
  STORE_FILES: {
    STORES: '/store-files/stores',
    STORE_DETAIL: '/store-files/stores/:id',
    CREATE_STORE: '/store-files/stores',
    UPDATE_STORE: '/store-files/stores/:id',
    DELETE_STORE: '/store-files/stores/:id',
    CERTIFICATES: '/store-files/certificates',
    DOCUMENTS: '/store-files/documents',
    HISTORY: '/store-files/history'
  },

  // 门店运营
  OPERATION: {
    PAYMENTS: '/operation/payments',
    PAYMENT_DETAIL: '/operation/payments/:id',
    CREATE_PAYMENT: '/operation/payments',
    UPDATE_PAYMENT: '/operation/payments/:id',
    DELETE_PAYMENT: '/operation/payments/:id',
    ASSETS: '/operation/assets',
    ASSET_DETAIL: '/operation/assets/:id',
    REPORTS: '/operation/reports'
  },

  // 审批中心
  APPROVAL: {
    FLOWS: '/approval/flows',
    FLOW_DETAIL: '/approval/flows/:id',
    CREATE_FLOW: '/approval/flows',
    APPROVE: '/approval/flows/:id/approve',
    REJECT: '/approval/flows/:id/reject',
    TRANSFER: '/approval/flows/:id/transfer',
    TEMPLATES: '/approval/templates',
    TEMPLATE_DETAIL: '/approval/templates/:id',
    CREATE_TEMPLATE: '/approval/templates',
    UPDATE_TEMPLATE: '/approval/templates/:id'
  },

  // 基础数据
  BASIC_DATA: {
    REGIONS: '/basic-data/regions',
    REGION_DETAIL: '/basic-data/regions/:id',
    SUPPLIERS: '/basic-data/suppliers',
    SUPPLIER_DETAIL: '/basic-data/suppliers/:id',
    ORGANIZATIONS: '/basic-data/organizations',
    ORGANIZATION_DETAIL: '/basic-data/organizations/:id',
    CUSTOMERS: '/basic-data/customers',
    CUSTOMER_DETAIL: '/basic-data/customers/:id'
  },

  // 系统管理
  SYSTEM: {
    USERS: '/system/users',
    USER_DETAIL: '/system/users/:id',
    ROLES: '/system/roles',
    ROLE_DETAIL: '/system/roles/:id',
    PERMISSIONS: '/system/permissions',
    SETTINGS: '/system/settings',
    LOGS: '/system/logs'
  },

  // 文件管理
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: '/files/download/:id',
    DELETE: '/files/:id',
    LIST: '/files'
  }
} as const

// API状态码配置
export const API_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const

// 错误消息映射
export const ERROR_MESSAGES = {
  [API_CODES.BAD_REQUEST]: '请求参数错误',
  [API_CODES.UNAUTHORIZED]: '未登录或登录已过期',
  [API_CODES.FORBIDDEN]: '没有操作权限',
  [API_CODES.NOT_FOUND]: '请求的资源不存在',
  [API_CODES.METHOD_NOT_ALLOWED]: '请求方法不被允许',
  [API_CODES.CONFLICT]: '数据冲突',
  [API_CODES.UNPROCESSABLE_ENTITY]: '数据验证失败',
  [API_CODES.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [API_CODES.BAD_GATEWAY]: '网关错误',
  [API_CODES.SERVICE_UNAVAILABLE]: '服务暂时不可用',

  // 网络错误
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  CANCEL_ERROR: '请求已取消',

  // 业务错误
  BUSINESS_ERROR: '业务处理失败',
  VALIDATION_ERROR: '数据验证失败',
  PERMISSION_ERROR: '权限不足'
} as const

// 环境检查
export const isDevelopment = import.meta.env.MODE === 'development'
export const isProduction = import.meta.env.MODE === 'production'
export const isMockEnabled = API_CONFIG.ENABLE_MOCK || isDevelopment

// URL参数替换工具
export const replaceUrlParams = (url: string, params: Record<string, string | number>): string => {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(`:${key}`, String(value))
  }, url)
}

// 构建查询参数
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// 完整URL构建工具
export const buildUrl = (
  path: string,
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, any>
): string => {
  let url = path

  // 替换路径参数
  if (pathParams) {
    url = replaceUrlParams(url, pathParams)
  }

  // 添加查询参数
  if (queryParams) {
    url += buildQueryString(queryParams)
  }

  return url
}
