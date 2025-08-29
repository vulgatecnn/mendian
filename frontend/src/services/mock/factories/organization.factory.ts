/**
 * 组织架构Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { Organization } from '../../types/business'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 组织类型
const ORGANIZATION_TYPES = ['company', 'department', 'team', 'branch'] as const

// 预设的组织架构
const ORGANIZATION_STRUCTURE = [
  {
    id: 'org_001',
    code: 'HQ',
    name: '好饭碗集团总部',
    type: 'company' as const,
    level: 1,
    children: [
      {
        id: 'org_002',
        code: 'PRESIDENT',
        name: '总裁办',
        type: 'department' as const,
        level: 2,
        children: [
          {
            id: 'org_002_001',
            code: 'PRESIDENT_ADMIN',
            name: '总裁办行政组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_002_002',
            code: 'PRESIDENT_STRATEGY',
            name: '总裁办战略组',
            type: 'team' as const,
            level: 3,
          },
        ],
      },
      {
        id: 'org_003',
        code: 'BUSINESS',
        name: '商务部',
        type: 'department' as const,
        level: 2,
        children: [
          {
            id: 'org_003_001',
            code: 'EXPANSION',
            name: '拓展组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_003_002',
            code: 'PREPARATION',
            name: '筹备组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_003_003',
            code: 'BUSINESS_SUPPORT',
            name: '商务支持组',
            type: 'team' as const,
            level: 3,
          },
        ],
      },
      {
        id: 'org_004',
        code: 'OPERATION',
        name: '运营部',
        type: 'department' as const,
        level: 2,
        children: [
          {
            id: 'org_004_001',
            code: 'STORE_MANAGEMENT',
            name: '门店管理组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_004_002',
            code: 'QUALITY_MANAGEMENT',
            name: '品质管理组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_004_003',
            code: 'TRAINING',
            name: '培训组',
            type: 'team' as const,
            level: 3,
          },
        ],
      },
      {
        id: 'org_005',
        code: 'FINANCE',
        name: '财务部',
        type: 'department' as const,
        level: 2,
        children: [
          {
            id: 'org_005_001',
            code: 'ACCOUNTING',
            name: '会计组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_005_002',
            code: 'BUDGET',
            name: '预算组',
            type: 'team' as const,
            level: 3,
          },
        ],
      },
      {
        id: 'org_006',
        code: 'HR',
        name: '人力资源部',
        type: 'department' as const,
        level: 2,
        children: [
          {
            id: 'org_006_001',
            code: 'RECRUITMENT',
            name: '招聘组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_006_002',
            code: 'TRAINING_HR',
            name: '培训发展组',
            type: 'team' as const,
            level: 3,
          },
        ],
      },
      {
        id: 'org_007',
        code: 'IT',
        name: '信息技术部',
        type: 'department' as const,
        level: 2,
        children: [
          {
            id: 'org_007_001',
            code: 'DEVELOPMENT',
            name: '开发组',
            type: 'team' as const,
            level: 3,
          },
          {
            id: 'org_007_002',
            code: 'MAINTENANCE',
            name: '运维组',
            type: 'team' as const,
            level: 3,
          },
        ],
      },
    ],
  },
  {
    id: 'org_101',
    code: 'REGION_NORTH',
    name: '华北区域',
    type: 'branch' as const,
    level: 1,
    children: [
      {
        id: 'org_101_001',
        code: 'BEIJING_BRANCH',
        name: '北京分公司',
        type: 'branch' as const,
        level: 2,
      },
      {
        id: 'org_101_002',
        code: 'TIANJIN_BRANCH',
        name: '天津分公司',
        type: 'branch' as const,
        level: 2,
      },
      {
        id: 'org_101_003',
        code: 'HEBEI_BRANCH',
        name: '河北分公司',
        type: 'branch' as const,
        level: 2,
      },
    ],
  },
  {
    id: 'org_102',
    code: 'REGION_EAST',
    name: '华东区域',
    type: 'branch' as const,
    level: 1,
    children: [
      {
        id: 'org_102_001',
        code: 'SHANGHAI_BRANCH',
        name: '上海分公司',
        type: 'branch' as const,
        level: 2,
      },
      {
        id: 'org_102_002',
        code: 'JIANGSU_BRANCH',
        name: '江苏分公司',
        type: 'branch' as const,
        level: 2,
      },
      {
        id: 'org_102_003',
        code: 'ZHEJIANG_BRANCH',
        name: '浙江分公司',
        type: 'branch' as const,
        level: 2,
      },
    ],
  },
  {
    id: 'org_103',
    code: 'REGION_SOUTH',
    name: '华南区域',
    type: 'branch' as const,
    level: 1,
    children: [
      {
        id: 'org_103_001',
        code: 'GUANGZHOU_BRANCH',
        name: '广州分公司',
        type: 'branch' as const,
        level: 2,
      },
      {
        id: 'org_103_002',
        code: 'SHENZHEN_BRANCH',
        name: '深圳分公司',
        type: 'branch' as const,
        level: 2,
      },
    ],
  },
]

// 生成负责人信息
function generateManager() {
  return {
    id: faker.datatype.uuid(),
    name: faker.name.fullName(),
  }
}

// 生成联系信息
function generateContactInfo() {
  return {
    phone: faker.datatype.boolean(0.7) ? `${faker.datatype.number({ min: 20, max: 29 })}${faker.datatype.number({ min: 10000000, max: 99999999 })}` : undefined,
    email: faker.datatype.boolean(0.6) ? faker.internet.email() : undefined,
    address: faker.datatype.boolean(0.8) ? faker.address.streetAddress() + ', ' + faker.address.city() : undefined,
  }
}

// 扁平化组织结构
function flattenOrganizations(orgTree: any[], parentId?: string): Organization[] {
  const organizations: Organization[] = []
  
  orgTree.forEach((item, index) => {
    const org: Organization = {
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      level: item.level,
      parentId,
      manager: faker.datatype.boolean(0.8) ? generateManager() : undefined,
      contactInfo: generateContactInfo(),
      enabled: faker.datatype.boolean(0.95), // 95%的概率是启用状态
      sort: index + 1,
      createdAt: faker.date.past(2).toISOString(),
      updatedAt: faker.date.recent(30).toISOString(),
    }
    
    organizations.push(org)
    
    if (item.children) {
      organizations.push(...flattenOrganizations(item.children, item.id))
    }
  })
  
  return organizations
}

export function createMockOrganization(options: FactoryOptions & { 
  type?: Organization['type'], 
  level?: number, 
  parentId?: string 
} = {}): Organization {
  const { 
    locale = DEFAULT_FACTORY_OPTIONS.locale, 
    type = faker.helpers.arrayElement(ORGANIZATION_TYPES),
    level = 1,
    parentId
  } = options

  faker.setLocale(locale!)

  let name: string
  let code: string

  // 根据类型生成相应的名称
  switch (type) {
    case 'company':
      name = faker.company.name() + '有限公司'
      code = faker.helpers.slugify(faker.company.name()).toUpperCase()
      break
    case 'department':
      name = faker.helpers.arrayElement(['市场部', '销售部', '技术部', '产品部', '客服部']) 
      code = faker.helpers.slugify(name).toUpperCase()
      break
    case 'team':
      name = faker.helpers.arrayElement(['开发组', '测试组', '设计组', '运营组', '推广组'])
      code = faker.helpers.slugify(name).toUpperCase()
      break
    case 'branch':
      name = faker.address.city() + '分公司'
      code = faker.helpers.slugify(name).toUpperCase()
      break
    default:
      name = faker.company.name()
      code = faker.helpers.slugify(name).toUpperCase()
  }

  return {
    id: faker.datatype.uuid(),
    code,
    name,
    type,
    level,
    parentId,
    manager: faker.datatype.boolean(0.8) ? generateManager() : undefined,
    contactInfo: generateContactInfo(),
    enabled: faker.datatype.boolean(0.95),
    sort: faker.datatype.number({ min: 1, max: 100 }),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockOrganizations(options: FactoryOptions = {}): Organization[] {
  // 返回预设的组织架构
  return flattenOrganizations(ORGANIZATION_STRUCTURE)
}

// 构建组织树结构
export function buildOrganizationTree(organizations: Organization[]): Organization[] {
  const orgMap = new Map<string, Organization>()
  
  // 创建映射并初始化children数组
  organizations.forEach(org => {
    orgMap.set(org.id, { ...org, children: [] })
  })

  const rootOrganizations: Organization[] = []

  // 构建层次结构
  organizations.forEach(org => {
    const orgWithChildren = orgMap.get(org.id)!
    
    if (org.parentId) {
      const parent = orgMap.get(org.parentId)
      if (parent) {
        parent.children!.push(orgWithChildren)
      }
    } else {
      rootOrganizations.push(orgWithChildren)
    }
  })

  return rootOrganizations
}

// 获取预设组织树
export function getOrganizationTree(): Organization[] {
  return buildOrganizationTree(flattenOrganizations(ORGANIZATION_STRUCTURE))
}

// 根据类型获取组织
export function getOrganizationsByType(type: Organization['type']): Organization[] {
  return flattenOrganizations(ORGANIZATION_STRUCTURE).filter(org => org.type === type)
}

// 获取部门列表
export function getDepartments(): Organization[] {
  return getOrganizationsByType('department')
}

// 获取分支机构列表
export function getBranches(): Organization[] {
  return getOrganizationsByType('branch')
}

// 根据父ID获取子组织
export function getChildOrganizations(parentId: string): Organization[] {
  return flattenOrganizations(ORGANIZATION_STRUCTURE).filter(org => org.parentId === parentId)
}

// 搜索组织
export function searchOrganizations(keyword: string): Organization[] {
  const allOrgs = flattenOrganizations(ORGANIZATION_STRUCTURE)
  return allOrgs.filter(org => 
    org.name.includes(keyword) || 
    org.code.toLowerCase().includes(keyword.toLowerCase())
  )
}