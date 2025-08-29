/**
 * 角色Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 角色接口定义
export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: string[]
  userCount: number
  status: 'active' | 'inactive'
  isSystem: boolean
  createdBy: string
  createdByName: string
  updatedBy: string
  updatedByName: string
  createdAt: string
  updatedAt: string
}

// 预设角色数据
const PREDEFINED_ROLES = [
  {
    id: 'role_001',
    name: '超级管理员',
    code: 'SUPER_ADMIN',
    description: '拥有系统所有权限的超级管理员',
    isSystem: true,
    permissions: ['*'], // 所有权限
  },
  {
    id: 'role_002', 
    name: '系统管理员',
    code: 'SYSTEM_ADMIN',
    description: '负责系统管理和配置的管理员',
    isSystem: true,
    permissions: [
      'system:manage',
      'user:manage',
      'role:manage', 
      'permission:manage',
      'basic-data:manage',
      'approval-template:manage',
    ],
  },
  {
    id: 'role_003',
    name: '总裁办人员',
    code: 'PRESIDENT_OFFICE',
    description: '总裁办工作人员，可查看经营数据和报表',
    isSystem: false,
    permissions: [
      'dashboard:view',
      'store-plan:view',
      'expansion:view',
      'preparation:view',
      'store-files:view',
      'operation:view',
      'report:view',
      'approval:view',
    ],
  },
  {
    id: 'role_004',
    name: '商务人员',
    code: 'BUSINESS_STAFF', 
    description: '商务部工作人员，负责开店计划、拓店、筹备等业务',
    isSystem: false,
    permissions: [
      'dashboard:view',
      'store-plan:manage',
      'expansion:manage',
      'preparation:manage', 
      'store-files:view',
      'approval:create',
      'approval:process',
      'basic-data:view',
    ],
  },
  {
    id: 'role_005',
    name: '运营人员',
    code: 'OPERATION_STAFF',
    description: '运营部工作人员，负责计划管理和候选点位管理',
    isSystem: false,
    permissions: [
      'dashboard:view',
      'store-plan:view',
      'expansion:manage',
      'preparation:view',
      'store-files:view',
      'operation:view',
      'basic-data:view',
    ],
  },
  {
    id: 'role_006',
    name: '销售人员',
    code: 'SALES_STAFF',
    description: '销售人员，负责跟进管理和交付管理',
    isSystem: false,
    permissions: [
      'dashboard:view',
      'expansion:follow',
      'preparation:delivery',
      'store-files:manage',
      'basic-data:view',
    ],
  },
  {
    id: 'role_007',
    name: '财务人员',
    code: 'FINANCE_STAFF',
    description: '财务部工作人员，参与审批流程和财务管理',
    isSystem: false,
    permissions: [
      'dashboard:view',
      'operation:payment',
      'approval:process',
      'store-files:view',
      'report:finance',
    ],
  },
  {
    id: 'role_008',
    name: '加盟商',
    code: 'FRANCHISEE',
    description: '加盟商用户，可查看自己门店的相关信息',
    isSystem: false,
    permissions: [
      'dashboard:view:own',
      'store-files:view:own',
      'preparation:confirm:own',
      'operation:view:own',
    ],
  },
  {
    id: 'role_009',
    name: '店长',
    code: 'STORE_MANAGER',
    description: '门店店长，管理具体门店运营',
    isSystem: false,
    permissions: [
      'dashboard:view:own',
      'store-files:view:own',
      'operation:manage:own',
      'preparation:confirm:own',
    ],
  },
]

export function createMockRole(options: FactoryOptions = {}): Role {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options

  faker.setLocale(locale!)

  const id = faker.datatype.uuid()
  const createdBy = faker.datatype.uuid()
  const updatedBy = faker.datatype.boolean(0.7) ? createdBy : faker.datatype.uuid()

  // 随机选择一些权限
  const allPermissions = [
    'dashboard:view',
    'store-plan:view', 'store-plan:create', 'store-plan:edit', 'store-plan:delete',
    'expansion:view', 'expansion:create', 'expansion:edit', 'expansion:delete',
    'preparation:view', 'preparation:create', 'preparation:edit', 'preparation:delete',
    'store-files:view', 'store-files:create', 'store-files:edit', 'store-files:delete',
    'operation:view', 'operation:create', 'operation:edit', 'operation:delete',
    'approval:view', 'approval:create', 'approval:process', 'approval:manage',
    'basic-data:view', 'basic-data:manage',
    'user:view', 'user:manage',
    'role:view', 'role:manage',
    'report:view', 'report:export',
  ]

  const permissions = faker.helpers.arrayElements(
    allPermissions, 
    { min: 3, max: 12 }
  )

  return {
    id,
    name: faker.company.name() + '角色',
    code: faker.helpers.slugify(faker.company.name()).toUpperCase(),
    description: faker.lorem.sentences(2),
    permissions,
    userCount: faker.datatype.number({ min: 1, max: 50 }),
    status: faker.helpers.weightedArrayElement([
      { weight: 90, value: 'active' as const },
      { weight: 10, value: 'inactive' as const },
    ]),
    isSystem: false,
    createdBy,
    createdByName: faker.name.fullName(),
    updatedBy,
    updatedByName: faker.name.fullName(),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockRoles(options: FactoryOptions = {}): Role[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options

  const roles: Role[] = []

  // 添加预设的系统角色
  PREDEFINED_ROLES.forEach(roleTemplate => {
    const role: Role = {
      ...roleTemplate,
      userCount: faker.datatype.number({ min: 1, max: 30 }),
      status: 'active',
      createdBy: 'system',
      createdByName: '系统',
      updatedBy: 'system', 
      updatedByName: '系统',
      createdAt: faker.date.past(1).toISOString(),
      updatedAt: faker.date.recent(30).toISOString(),
    }
    roles.push(role)
  })

  // 生成自定义角色
  const customRoleCount = Math.max(0, count! - roles.length)
  for (let i = 0; i < customRoleCount; i++) {
    roles.push(createMockRole(options))
  }

  return roles
}

// 根据角色代码获取角色
export function getRoleByCode(code: string): Role | null {
  const roleTemplate = PREDEFINED_ROLES.find(r => r.code === code)
  if (!roleTemplate) return null

  return {
    ...roleTemplate,
    userCount: faker.datatype.number({ min: 1, max: 30 }),
    status: 'active',
    createdBy: 'system',
    createdByName: '系统',
    updatedBy: 'system',
    updatedByName: '系统',
    createdAt: faker.date.past(1).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

// 获取系统预设角色
export function getSystemRoles(): Role[] {
  return PREDEFINED_ROLES
    .filter(r => r.isSystem)
    .map(roleTemplate => ({
      ...roleTemplate,
      userCount: faker.datatype.number({ min: 1, max: 10 }),
      status: 'active' as const,
      createdBy: 'system',
      createdByName: '系统',
      updatedBy: 'system',
      updatedByName: '系统', 
      createdAt: faker.date.past(1).toISOString(),
      updatedAt: faker.date.recent(30).toISOString(),
    }))
}

// 获取业务角色
export function getBusinessRoles(): Role[] {
  return PREDEFINED_ROLES
    .filter(r => !r.isSystem)
    .map(roleTemplate => ({
      ...roleTemplate,
      userCount: faker.datatype.number({ min: 5, max: 50 }),
      status: 'active' as const,
      createdBy: 'system',
      createdByName: '系统', 
      updatedBy: 'system',
      updatedByName: '系统',
      createdAt: faker.date.past(1).toISOString(),
      updatedAt: faker.date.recent(30).toISOString(),
    }))
}