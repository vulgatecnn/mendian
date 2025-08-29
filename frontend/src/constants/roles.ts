/**
 * 用户角色常量定义
 */

/**
 * 用户角色代码
 */
export enum UserRoleCode {
  /** 总裁办人员 */
  PRESIDENT_OFFICE = 'PRESIDENT_OFFICE',
  /** 商务人员 */
  BUSINESS = 'BUSINESS',
  /** 运营人员 */
  OPERATION = 'OPERATION',
  /** 销售人员 */
  SALES = 'SALES',
  /** 财务人员 */
  FINANCE = 'FINANCE',
  /** 加盟商 */
  FRANCHISEE = 'FRANCHISEE',
  /** 店长 */
  STORE_MANAGER = 'STORE_MANAGER',
  /** 系统管理员 */
  ADMIN = 'ADMIN'
}

/**
 * 角色名称映射
 */
export const ROLE_NAMES: Record<UserRoleCode, string> = {
  [UserRoleCode.PRESIDENT_OFFICE]: '总裁办人员',
  [UserRoleCode.BUSINESS]: '商务人员',
  [UserRoleCode.OPERATION]: '运营人员',
  [UserRoleCode.SALES]: '销售人员',
  [UserRoleCode.FINANCE]: '财务人员',
  [UserRoleCode.FRANCHISEE]: '加盟商',
  [UserRoleCode.STORE_MANAGER]: '店长',
  [UserRoleCode.ADMIN]: '系统管理员'
}

/**
 * 角色描述映射
 */
export const ROLE_DESCRIPTIONS: Record<UserRoleCode, string> = {
  [UserRoleCode.PRESIDENT_OFFICE]: '负责查看经营大屏和数据报表',
  [UserRoleCode.BUSINESS]: '负责开店计划、拓店、筹备、审批全流程管理',
  [UserRoleCode.OPERATION]: '负责计划管理、候选点位、拓店跟进',
  [UserRoleCode.SALES]: '负责跟进管理、交付管理、门店档案管理',
  [UserRoleCode.FINANCE]: '参与跟进审批流程',
  [UserRoleCode.FRANCHISEE]: '负责交付确认、门店档案查看',
  [UserRoleCode.STORE_MANAGER]: '负责交付确认、门店档案查看',
  [UserRoleCode.ADMIN]: '负责基础数据、系统管理、审批模板配置'
}

/**
 * 角色权重(用于权限优先级判断)
 */
export const ROLE_WEIGHTS: Record<UserRoleCode, number> = {
  [UserRoleCode.ADMIN]: 100,
  [UserRoleCode.PRESIDENT_OFFICE]: 90,
  [UserRoleCode.BUSINESS]: 80,
  [UserRoleCode.OPERATION]: 70,
  [UserRoleCode.SALES]: 60,
  [UserRoleCode.FINANCE]: 50,
  [UserRoleCode.FRANCHISEE]: 40,
  [UserRoleCode.STORE_MANAGER]: 30
}

/**
 * 获取用户最高权限角色
 */
export const getHighestRole = (roleCodes: UserRoleCode[]): UserRoleCode | null => {
  if (!roleCodes.length) return null

  return roleCodes.reduce((highest, current) => {
    return ROLE_WEIGHTS[current] > ROLE_WEIGHTS[highest] ? current : highest
  })
}
