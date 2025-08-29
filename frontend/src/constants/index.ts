// 应用常量定义

// 应用信息
export const APP_CONFIG = {
  TITLE: import.meta.env.VITE_APP_TITLE || '好饭碗门店管理系统',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || '门店生命周期管理系统'
}

// API配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7100',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  PREFIX: '/api/v1'
}

// 存储键名
export const STORAGE_KEYS = {
  TOKEN: 'mendian_token',
  USER_INFO: 'mendian_user_info',
  THEME: 'mendian_theme',
  LANGUAGE: 'mendian_language',
  MENU_COLLAPSED: 'mendian_menu_collapsed'
}

// 门店计划类型选项
export const STORE_PLAN_TYPE_OPTIONS = [
  { label: '直营店', value: 'direct' },
  { label: '加盟店', value: 'franchise' },
  { label: '合营店', value: 'joint_venture' }
]

// 门店计划状态选项
export const STORE_PLAN_STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' },
  { label: '待审批', value: 'pending' },
  { label: '已批准', value: 'approved' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

// 状态颜色映射
export const STATUS_COLOR_MAP: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error'
}

// 门店类型颜色映射
export const STORE_TYPE_COLOR_MAP: Record<string, string> = {
  direct: 'blue',
  franchise: 'green',
  joint_venture: 'orange'
}

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
  SHOW_TOTAL: true
}

// 表格配置
export const TABLE_CONFIG = {
  SCROLL: { x: 800 },
  SIZE: 'middle' as const,
  BORDERED: false,
  SHOW_HEADER: true
}

// 表单配置
export const FORM_CONFIG = {
  LAYOUT: 'vertical' as const,
  LABEL_COL: { span: 24 },
  WRAPPER_COL: { span: 24 },
  AUTO_COMPLETE: 'off',
  VALIDATE_TRIGGER: 'onBlur'
}

// 日期格式
export const DATE_FORMAT = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY'
}

// 权限编码
export const PERMISSIONS = {
  // 系统首页
  DASHBOARD_VIEW: 'dashboard:view',

  // 开店计划
  STORE_PLAN_VIEW: 'store-plan:view',
  STORE_PLAN_CREATE: 'store-plan:create',
  STORE_PLAN_UPDATE: 'store-plan:update',
  STORE_PLAN_DELETE: 'store-plan:delete',
  STORE_PLAN_APPROVE: 'store-plan:approve',

  // 拓店管理
  EXPANSION_VIEW: 'expansion:view',
  EXPANSION_MANAGE: 'expansion:manage',
  EXPANSION_APPROVE: 'expansion:approve',

  // 开店筹备
  PREPARATION_VIEW: 'preparation:view',
  PREPARATION_MANAGE: 'preparation:manage',
  PREPARATION_APPROVE: 'preparation:approve',

  // 门店档案
  STORE_FILES_VIEW: 'store-files:view',
  STORE_FILES_MANAGE: 'store-files:manage',

  // 门店运营
  OPERATION_VIEW: 'operation:view',
  OPERATION_MANAGE: 'operation:manage',

  // 审批中心
  APPROVAL_VIEW: 'approval:view',
  APPROVAL_HANDLE: 'approval:handle',
  APPROVAL_TEMPLATE_MANAGE: 'approval:template:manage',

  // 基础数据
  BASIC_DATA_VIEW: 'basic-data:view',
  BASIC_DATA_MANAGE: 'basic-data:manage',

  // 系统管理
  SYSTEM_USER_MANAGE: 'system:user:manage',
  SYSTEM_ROLE_MANAGE: 'system:role:manage',
  SYSTEM_PERMISSION_MANAGE: 'system:permission:manage'
} as const

// 企业微信配置
export const WECHAT_CONFIG = {
  CORP_ID: import.meta.env.VITE_WECHAT_CORP_ID || '',
  AGENT_ID: import.meta.env.VITE_WECHAT_AGENT_ID || '',
  REDIRECT_URI: `${window.location.origin}/auth/callback`
}

// 正则表达式
export const REGEX_PATTERNS = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  USERNAME: /^[a-zA-Z0-9_]{4,16}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
}

// 文件上传配置
export const UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: {
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    DOCUMENT: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
    ALL: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.txt'
    ]
  }
}
