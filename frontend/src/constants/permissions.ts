/**
 * 权限常量定义
 */

import { UserRoleCode } from './roles'

/**
 * 权限代码定义
 */
export const PERMISSIONS = {
  // 系统首页
  DASHBOARD: {
    VIEW: 'dashboard:view'
  },

  // 开店计划管理
  STORE_PLAN: {
    VIEW: 'store-plan:view',
    CREATE: 'store-plan:create',
    UPDATE: 'store-plan:update',
    DELETE: 'store-plan:delete',
    MANAGE: 'store-plan:manage'
  },

  // 拓店管理
  EXPANSION: {
    VIEW: 'expansion:view',
    CREATE: 'expansion:create',
    UPDATE: 'expansion:update',
    DELETE: 'expansion:delete',
    MANAGE: 'expansion:manage',
    // 候选点位
    CANDIDATES_VIEW: 'expansion:candidates:view',
    CANDIDATES_CREATE: 'expansion:candidates:create',
    CANDIDATES_UPDATE: 'expansion:candidates:update',
    CANDIDATES_MANAGE: 'expansion:candidates:manage',
    // 跟进管理
    FOLLOW_VIEW: 'expansion:follow:view',
    FOLLOW_MANAGE: 'expansion:follow:manage',
    // 数据仪表板
    DASHBOARD_VIEW: 'expansion:dashboard:view'
  },

  // 开店筹备
  PREPARATION: {
    VIEW: 'preparation:view',
    CREATE: 'preparation:create',
    UPDATE: 'preparation:update',
    DELETE: 'preparation:delete',
    MANAGE: 'preparation:manage',
    DASHBOARD_VIEW: 'preparation:dashboard:view',
    // 工程管理
    ENGINEERING_VIEW: 'preparation:engineering:view',
    ENGINEERING_MANAGE: 'preparation:engineering:manage',
    // 设备采购
    EQUIPMENT_VIEW: 'preparation:equipment:view',
    EQUIPMENT_MANAGE: 'preparation:equipment:manage',
    // 证照办理
    LICENSE_VIEW: 'preparation:license:view',
    LICENSE_MANAGE: 'preparation:license:manage',
    // 人员招聘
    STAFF_VIEW: 'preparation:staff:view',
    STAFF_MANAGE: 'preparation:staff:manage',
    // 里程碑跟踪
    MILESTONE_VIEW: 'preparation:milestone:view',
    MILESTONE_MANAGE: 'preparation:milestone:manage',
    // 交付管理
    DELIVERY_VIEW: 'preparation:delivery:view',
    DELIVERY_MANAGE: 'preparation:delivery:manage',
    DELIVERY_CONFIRM: 'preparation:delivery:confirm'
  },

  // 门店档案
  STORE_FILES: {
    VIEW: 'store-files:view',
    CREATE: 'store-files:create',
    UPDATE: 'store-files:update',
    DELETE: 'store-files:delete',
    MANAGE: 'store-files:manage'
  },

  // 门店运营
  OPERATION: {
    VIEW: 'operation:view',
    CREATE: 'operation:create',
    UPDATE: 'operation:update',
    DELETE: 'operation:delete',
    MANAGE: 'operation:manage',
    // 待付款项
    PAYMENTS_VIEW: 'operation:payments:view',
    PAYMENTS_MANAGE: 'operation:payments:manage',
    // 资产管理
    ASSETS_VIEW: 'operation:assets:view',
    ASSETS_MANAGE: 'operation:assets:manage'
  },

  // 审批中心
  APPROVAL: {
    VIEW: 'approval:view',
    CREATE: 'approval:create',
    UPDATE: 'approval:update',
    DELETE: 'approval:delete',
    MANAGE: 'approval:manage',
    // 待办审批
    PENDING_VIEW: 'approval:pending:view',
    PENDING_HANDLE: 'approval:pending:handle',
    // 已办审批
    PROCESSED_VIEW: 'approval:processed:view'
  },

  // 基础数据
  BASIC_DATA: {
    VIEW: 'basic-data:view',
    CREATE: 'basic-data:create',
    UPDATE: 'basic-data:update',
    DELETE: 'basic-data:delete',
    MANAGE: 'basic-data:manage',
    // 业务大区
    REGIONS_VIEW: 'basic-data:regions:view',
    REGIONS_MANAGE: 'basic-data:regions:manage',
    // 供应商
    SUPPLIERS_VIEW: 'basic-data:suppliers:view',
    SUPPLIERS_MANAGE: 'basic-data:suppliers:manage'
  },

  // 系统管理
  SYSTEM: {
    VIEW: 'system:view',
    MANAGE: 'system:manage',
    USER_MANAGE: 'system:user:manage',
    ROLE_MANAGE: 'system:role:manage',
    PERMISSION_MANAGE: 'system:permission:manage',
    CONFIG_MANAGE: 'system:config:manage'
  }
} as const

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS: Record<UserRoleCode, string[]> = {
  // 总裁办人员 - 经营大屏、数据报表查看
  [UserRoleCode.PRESIDENT_OFFICE]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.STORE_FILES.VIEW,
    PERMISSIONS.OPERATION.VIEW,
    PERMISSIONS.APPROVAL.VIEW,
    PERMISSIONS.APPROVAL.PROCESSED_VIEW
  ],

  // 商务人员 - 开店计划、拓店、筹备、审批全流程
  [UserRoleCode.BUSINESS]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.STORE_PLAN.MANAGE,
    PERMISSIONS.EXPANSION.MANAGE,
    PERMISSIONS.PREPARATION.MANAGE,
    PERMISSIONS.STORE_FILES.MANAGE,
    PERMISSIONS.OPERATION.MANAGE,
    PERMISSIONS.APPROVAL.MANAGE
  ],

  // 运营人员 - 计划管理、候选点位、拓店跟进
  [UserRoleCode.OPERATION]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.STORE_PLAN.VIEW,
    PERMISSIONS.STORE_PLAN.CREATE,
    PERMISSIONS.STORE_PLAN.UPDATE,
    PERMISSIONS.EXPANSION.MANAGE,
    PERMISSIONS.STORE_FILES.VIEW,
    PERMISSIONS.APPROVAL.VIEW,
    PERMISSIONS.APPROVAL.PENDING_VIEW,
    PERMISSIONS.APPROVAL.PROCESSED_VIEW
  ],

  // 销售人员 - 跟进管理、交付管理、门店档案
  [UserRoleCode.SALES]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.EXPANSION.FOLLOW_MANAGE,
    PERMISSIONS.PREPARATION.VIEW,
    PERMISSIONS.PREPARATION.DELIVERY_MANAGE,
    PERMISSIONS.STORE_FILES.MANAGE,
    PERMISSIONS.APPROVAL.VIEW,
    PERMISSIONS.APPROVAL.PENDING_VIEW,
    PERMISSIONS.APPROVAL.PROCESSED_VIEW
  ],

  // 财务人员 - 跟进审批参与
  [UserRoleCode.FINANCE]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.APPROVAL.VIEW,
    PERMISSIONS.APPROVAL.PENDING_VIEW,
    PERMISSIONS.APPROVAL.PENDING_HANDLE,
    PERMISSIONS.APPROVAL.PROCESSED_VIEW,
    PERMISSIONS.OPERATION.PAYMENTS_VIEW
  ],

  // 加盟商 - 交付确认、门店档案查看
  [UserRoleCode.FRANCHISEE]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.PREPARATION.DELIVERY_VIEW,
    PERMISSIONS.PREPARATION.DELIVERY_CONFIRM,
    PERMISSIONS.STORE_FILES.VIEW,
    PERMISSIONS.APPROVAL.VIEW,
    PERMISSIONS.APPROVAL.PROCESSED_VIEW
  ],

  // 店长 - 交付确认、门店档案查看
  [UserRoleCode.STORE_MANAGER]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.PREPARATION.DELIVERY_VIEW,
    PERMISSIONS.PREPARATION.DELIVERY_CONFIRM,
    PERMISSIONS.STORE_FILES.VIEW,
    PERMISSIONS.APPROVAL.VIEW,
    PERMISSIONS.APPROVAL.PROCESSED_VIEW
  ],

  // 系统管理员 - 完整系统权限，包含所有业务模块
  [UserRoleCode.ADMIN]: [
    PERMISSIONS.DASHBOARD.VIEW,
    // 开店计划管理
    PERMISSIONS.STORE_PLAN.VIEW,
    PERMISSIONS.STORE_PLAN.CREATE,
    PERMISSIONS.STORE_PLAN.UPDATE,
    PERMISSIONS.STORE_PLAN.DELETE,
    PERMISSIONS.STORE_PLAN.MANAGE,
    // 拓店管理
    PERMISSIONS.EXPANSION.VIEW,
    PERMISSIONS.EXPANSION.CREATE,
    PERMISSIONS.EXPANSION.UPDATE,
    PERMISSIONS.EXPANSION.DELETE,
    PERMISSIONS.EXPANSION.MANAGE,
    PERMISSIONS.EXPANSION.CANDIDATES_VIEW,
    PERMISSIONS.EXPANSION.CANDIDATES_MANAGE,
    PERMISSIONS.EXPANSION.FOLLOW_VIEW,
    PERMISSIONS.EXPANSION.FOLLOW_MANAGE,
    // 开店筹备
    PERMISSIONS.PREPARATION.VIEW,
    PERMISSIONS.PREPARATION.CREATE,
    PERMISSIONS.PREPARATION.UPDATE,
    PERMISSIONS.PREPARATION.DELETE,
    PERMISSIONS.PREPARATION.MANAGE,
    PERMISSIONS.PREPARATION.DASHBOARD_VIEW,
    PERMISSIONS.PREPARATION.ENGINEERING_VIEW,
    PERMISSIONS.PREPARATION.ENGINEERING_MANAGE,
    PERMISSIONS.PREPARATION.EQUIPMENT_VIEW,
    PERMISSIONS.PREPARATION.EQUIPMENT_MANAGE,
    PERMISSIONS.PREPARATION.LICENSE_VIEW,
    PERMISSIONS.PREPARATION.LICENSE_MANAGE,
    PERMISSIONS.PREPARATION.STAFF_VIEW,
    PERMISSIONS.PREPARATION.STAFF_MANAGE,
    PERMISSIONS.PREPARATION.MILESTONE_VIEW,
    PERMISSIONS.PREPARATION.MILESTONE_MANAGE,
    PERMISSIONS.PREPARATION.DELIVERY_VIEW,
    PERMISSIONS.PREPARATION.DELIVERY_MANAGE,
    PERMISSIONS.PREPARATION.DELIVERY_CONFIRM,
    // 门店档案
    PERMISSIONS.STORE_FILES.VIEW,
    PERMISSIONS.STORE_FILES.CREATE,
    PERMISSIONS.STORE_FILES.UPDATE,
    PERMISSIONS.STORE_FILES.DELETE,
    PERMISSIONS.STORE_FILES.MANAGE,
    // 门店运营
    PERMISSIONS.OPERATION.VIEW,
    PERMISSIONS.OPERATION.CREATE,
    PERMISSIONS.OPERATION.UPDATE,
    PERMISSIONS.OPERATION.DELETE,
    PERMISSIONS.OPERATION.MANAGE,
    PERMISSIONS.OPERATION.PAYMENTS_VIEW,
    PERMISSIONS.OPERATION.PAYMENTS_MANAGE,
    PERMISSIONS.OPERATION.ASSETS_VIEW,
    PERMISSIONS.OPERATION.ASSETS_MANAGE,
    // 审批中心
    PERMISSIONS.APPROVAL.VIEW,
    PERMISSIONS.APPROVAL.CREATE,
    PERMISSIONS.APPROVAL.UPDATE,
    PERMISSIONS.APPROVAL.DELETE,
    PERMISSIONS.APPROVAL.MANAGE,
    PERMISSIONS.APPROVAL.PENDING_VIEW,
    PERMISSIONS.APPROVAL.PENDING_HANDLE,
    PERMISSIONS.APPROVAL.PROCESSED_VIEW,
    // 基础数据
    PERMISSIONS.BASIC_DATA.VIEW,
    PERMISSIONS.BASIC_DATA.CREATE,
    PERMISSIONS.BASIC_DATA.UPDATE,
    PERMISSIONS.BASIC_DATA.DELETE,
    PERMISSIONS.BASIC_DATA.MANAGE,
    PERMISSIONS.BASIC_DATA.REGIONS_VIEW,
    PERMISSIONS.BASIC_DATA.REGIONS_MANAGE,
    PERMISSIONS.BASIC_DATA.SUPPLIERS_VIEW,
    PERMISSIONS.BASIC_DATA.SUPPLIERS_MANAGE,
    // 系统管理
    PERMISSIONS.SYSTEM.VIEW,
    PERMISSIONS.SYSTEM.MANAGE,
    PERMISSIONS.SYSTEM.USER_MANAGE,
    PERMISSIONS.SYSTEM.ROLE_MANAGE,
    PERMISSIONS.SYSTEM.PERMISSION_MANAGE,
    PERMISSIONS.SYSTEM.CONFIG_MANAGE
  ]
}

/**
 * 路由权限映射
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': [PERMISSIONS.DASHBOARD.VIEW],

  // 开店计划
  '/store-plan': [PERMISSIONS.STORE_PLAN.VIEW],
  '/store-plan/list': [PERMISSIONS.STORE_PLAN.VIEW],
  '/store-plan/create': [PERMISSIONS.STORE_PLAN.CREATE],
  '/store-plan/:id': [PERMISSIONS.STORE_PLAN.VIEW],

  // 拓店管理
  '/expansion': [PERMISSIONS.EXPANSION.VIEW],
  '/expansion/candidates': [PERMISSIONS.EXPANSION.CANDIDATES_VIEW],
  '/expansion/follow': [PERMISSIONS.EXPANSION.FOLLOW_VIEW],

  // 开店筹备
  '/preparation': [PERMISSIONS.PREPARATION.VIEW],
  '/preparation/projects': [PERMISSIONS.PREPARATION.VIEW],
  '/preparation/projects/create': [PERMISSIONS.PREPARATION.CREATE],
  '/preparation/projects/:id': [PERMISSIONS.PREPARATION.VIEW],
  '/preparation/projects/:id/edit': [PERMISSIONS.PREPARATION.UPDATE],
  '/preparation/dashboard': [PERMISSIONS.PREPARATION.DASHBOARD_VIEW],
  '/preparation/engineering': [PERMISSIONS.PREPARATION.ENGINEERING_VIEW],
  '/preparation/equipment': [PERMISSIONS.PREPARATION.EQUIPMENT_VIEW],
  '/preparation/license': [PERMISSIONS.PREPARATION.LICENSE_VIEW],
  '/preparation/staff': [PERMISSIONS.PREPARATION.STAFF_VIEW],
  '/preparation/milestone': [PERMISSIONS.PREPARATION.MILESTONE_VIEW],
  '/preparation/delivery': [PERMISSIONS.PREPARATION.DELIVERY_VIEW],

  // 门店档案
  '/store-files': [PERMISSIONS.STORE_FILES.VIEW],

  // 门店运营
  '/operation': [PERMISSIONS.OPERATION.VIEW],
  '/operation/payments': [PERMISSIONS.OPERATION.PAYMENTS_VIEW],
  '/operation/assets': [PERMISSIONS.OPERATION.ASSETS_VIEW],

  // 审批中心
  '/approval': [PERMISSIONS.APPROVAL.VIEW],
  '/approval/pending': [PERMISSIONS.APPROVAL.PENDING_VIEW],
  '/approval/processed': [PERMISSIONS.APPROVAL.PROCESSED_VIEW],

  // 基础数据
  '/basic-data': [PERMISSIONS.BASIC_DATA.VIEW],
  '/basic-data/regions': [PERMISSIONS.BASIC_DATA.REGIONS_VIEW],
  '/basic-data/suppliers': [PERMISSIONS.BASIC_DATA.SUPPLIERS_VIEW]
}

/**
 * 获取角色的所有权限
 */
export const getRolePermissions = (roleCode: UserRoleCode): string[] => {
  return ROLE_PERMISSIONS[roleCode] || []
}

/**
 * 获取路由所需权限
 */
export const getRoutePermissions = (path: string): string[] => {
  return ROUTE_PERMISSIONS[path] || []
}

/**
 * 检查用户是否有指定权限
 */
export const hasPermission = (
  userPermissions: string[],
  requiredPermissions: string[],
  mode: 'all' | 'any' = 'any'
): boolean => {
  if (!requiredPermissions.length) return true

  if (mode === 'all') {
    return requiredPermissions.every(permission => userPermissions.includes(permission))
  } else {
    return requiredPermissions.some(permission => userPermissions.includes(permission))
  }
}
