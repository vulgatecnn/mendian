/**
 * 权限Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 权限接口定义
export interface Permission {
  id: string
  name: string
  code: string
  resource: string
  action: string
  description?: string
  category: string
  isSystem: boolean
  parentId?: string
  children?: Permission[]
  sort: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// 权限分类
export enum PermissionCategory {
  SYSTEM = 'system', // 系统管理
  BUSINESS = 'business', // 业务管理
  DATA = 'data', // 数据权限
  OPERATION = 'operation', // 操作权限
}

// 资源定义
const RESOURCES = [
  'dashboard',
  'store-plan',
  'expansion',
  'preparation', 
  'store-files',
  'operation',
  'approval',
  'basic-data',
  'user',
  'role',
  'permission',
  'report',
  'system',
]

// 操作定义
const ACTIONS = [
  'view', // 查看
  'create', // 创建
  'edit', // 编辑
  'delete', // 删除
  'manage', // 管理
  'process', // 处理
  'approve', // 审批
  'export', // 导出
  'import', // 导入
  'follow', // 跟进
  'confirm', // 确认
  'delivery', // 交付
]

// 预设权限树结构
const PERMISSION_TREE = [
  {
    id: 'perm_001',
    name: '仪表盘',
    code: 'dashboard',
    resource: 'dashboard',
    action: 'view',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_001_001',
        name: '查看仪表盘',
        code: 'dashboard:view',
        resource: 'dashboard',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_001_002', 
        name: '查看自己数据',
        code: 'dashboard:view:own',
        resource: 'dashboard',
        action: 'view',
        category: PermissionCategory.DATA,
      },
    ],
  },
  {
    id: 'perm_002',
    name: '开店计划',
    code: 'store-plan',
    resource: 'store-plan',
    action: 'manage',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_002_001',
        name: '查看开店计划',
        code: 'store-plan:view',
        resource: 'store-plan',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_002_002',
        name: '创建开店计划',
        code: 'store-plan:create',
        resource: 'store-plan',
        action: 'create',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_002_003',
        name: '编辑开店计划',
        code: 'store-plan:edit',
        resource: 'store-plan',
        action: 'edit',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_002_004',
        name: '删除开店计划',
        code: 'store-plan:delete',
        resource: 'store-plan',
        action: 'delete',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_002_005',
        name: '管理开店计划',
        code: 'store-plan:manage',
        resource: 'store-plan',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
    ],
  },
  {
    id: 'perm_003',
    name: '拓店管理',
    code: 'expansion',
    resource: 'expansion',
    action: 'manage',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_003_001',
        name: '查看拓店信息',
        code: 'expansion:view',
        resource: 'expansion',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_003_002',
        name: '创建候选点位',
        code: 'expansion:create',
        resource: 'expansion',
        action: 'create', 
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_003_003',
        name: '编辑候选点位',
        code: 'expansion:edit',
        resource: 'expansion',
        action: 'edit',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_003_004',
        name: '跟进管理',
        code: 'expansion:follow',
        resource: 'expansion',
        action: 'follow',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_003_005',
        name: '管理拓店',
        code: 'expansion:manage',
        resource: 'expansion',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
    ],
  },
  {
    id: 'perm_004',
    name: '开店筹备',
    code: 'preparation',
    resource: 'preparation',
    action: 'manage',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_004_001',
        name: '查看筹备项目',
        code: 'preparation:view',
        resource: 'preparation',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_004_002',
        name: '创建筹备项目',
        code: 'preparation:create',
        resource: 'preparation',
        action: 'create',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_004_003',
        name: '编辑筹备项目',
        code: 'preparation:edit',
        resource: 'preparation',
        action: 'edit',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_004_004',
        name: '交付确认',
        code: 'preparation:delivery',
        resource: 'preparation',
        action: 'delivery',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_004_005',
        name: '管理筹备',
        code: 'preparation:manage',
        resource: 'preparation',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_004_006',
        name: '确认交付(自己)',
        code: 'preparation:confirm:own',
        resource: 'preparation',
        action: 'confirm',
        category: PermissionCategory.DATA,
      },
    ],
  },
  {
    id: 'perm_005',
    name: '门店档案',
    code: 'store-files',
    resource: 'store-files',
    action: 'manage',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_005_001',
        name: '查看门店档案',
        code: 'store-files:view',
        resource: 'store-files',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_005_002',
        name: '创建门店档案',
        code: 'store-files:create',
        resource: 'store-files',
        action: 'create',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_005_003',
        name: '编辑门店档案',
        code: 'store-files:edit',
        resource: 'store-files',
        action: 'edit',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_005_004',
        name: '管理门店档案',
        code: 'store-files:manage',
        resource: 'store-files',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_005_005',
        name: '查看自己门店',
        code: 'store-files:view:own',
        resource: 'store-files',
        action: 'view',
        category: PermissionCategory.DATA,
      },
    ],
  },
  {
    id: 'perm_006',
    name: '门店运营',
    code: 'operation',
    resource: 'operation',
    action: 'manage',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_006_001',
        name: '查看运营数据',
        code: 'operation:view',
        resource: 'operation',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_006_002',
        name: '付款项管理',
        code: 'operation:payment',
        resource: 'operation',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_006_003',
        name: '资产管理',
        code: 'operation:asset',
        resource: 'operation',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_006_004',
        name: '管理运营',
        code: 'operation:manage',
        resource: 'operation',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_006_005',
        name: '查看自己运营数据',
        code: 'operation:view:own',
        resource: 'operation',
        action: 'view',
        category: PermissionCategory.DATA,
      },
      {
        id: 'perm_006_006',
        name: '管理自己门店运营',
        code: 'operation:manage:own',
        resource: 'operation',
        action: 'manage',
        category: PermissionCategory.DATA,
      },
    ],
  },
  {
    id: 'perm_007',
    name: '审批中心',
    code: 'approval',
    resource: 'approval',
    action: 'manage',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_007_001',
        name: '查看审批',
        code: 'approval:view',
        resource: 'approval',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_007_002',
        name: '创建审批',
        code: 'approval:create',
        resource: 'approval',
        action: 'create',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_007_003',
        name: '处理审批',
        code: 'approval:process',
        resource: 'approval',
        action: 'process',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_007_004',
        name: '管理审批',
        code: 'approval:manage',
        resource: 'approval',
        action: 'manage',
        category: PermissionCategory.BUSINESS,
      },
    ],
  },
  {
    id: 'perm_008',
    name: '基础数据',
    code: 'basic-data',
    resource: 'basic-data',
    action: 'manage',
    category: PermissionCategory.SYSTEM,
    children: [
      {
        id: 'perm_008_001',
        name: '查看基础数据',
        code: 'basic-data:view',
        resource: 'basic-data',
        action: 'view',
        category: PermissionCategory.SYSTEM,
      },
      {
        id: 'perm_008_002',
        name: '管理基础数据',
        code: 'basic-data:manage',
        resource: 'basic-data',
        action: 'manage',
        category: PermissionCategory.SYSTEM,
      },
    ],
  },
  {
    id: 'perm_009',
    name: '用户管理',
    code: 'user',
    resource: 'user',
    action: 'manage',
    category: PermissionCategory.SYSTEM,
    children: [
      {
        id: 'perm_009_001',
        name: '查看用户',
        code: 'user:view',
        resource: 'user',
        action: 'view',
        category: PermissionCategory.SYSTEM,
      },
      {
        id: 'perm_009_002',
        name: '管理用户',
        code: 'user:manage',
        resource: 'user',
        action: 'manage',
        category: PermissionCategory.SYSTEM,
      },
    ],
  },
  {
    id: 'perm_010',
    name: '角色管理',
    code: 'role',
    resource: 'role',
    action: 'manage',
    category: PermissionCategory.SYSTEM,
    children: [
      {
        id: 'perm_010_001',
        name: '查看角色',
        code: 'role:view',
        resource: 'role',
        action: 'view',
        category: PermissionCategory.SYSTEM,
      },
      {
        id: 'perm_010_002',
        name: '管理角色',
        code: 'role:manage',
        resource: 'role',
        action: 'manage',
        category: PermissionCategory.SYSTEM,
      },
    ],
  },
  {
    id: 'perm_011',
    name: '权限管理',
    code: 'permission',
    resource: 'permission',
    action: 'manage',
    category: PermissionCategory.SYSTEM,
    children: [
      {
        id: 'perm_011_001',
        name: '查看权限',
        code: 'permission:view',
        resource: 'permission',
        action: 'view',
        category: PermissionCategory.SYSTEM,
      },
      {
        id: 'perm_011_002',
        name: '管理权限',
        code: 'permission:manage',
        resource: 'permission',
        action: 'manage',
        category: PermissionCategory.SYSTEM,
      },
    ],
  },
  {
    id: 'perm_012',
    name: '报表中心',
    code: 'report',
    resource: 'report',
    action: 'view',
    category: PermissionCategory.BUSINESS,
    children: [
      {
        id: 'perm_012_001',
        name: '查看报表',
        code: 'report:view',
        resource: 'report',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_012_002',
        name: '导出报表',
        code: 'report:export',
        resource: 'report',
        action: 'export',
        category: PermissionCategory.BUSINESS,
      },
      {
        id: 'perm_012_003',
        name: '财务报表',
        code: 'report:finance',
        resource: 'report',
        action: 'view',
        category: PermissionCategory.BUSINESS,
      },
    ],
  },
  {
    id: 'perm_013',
    name: '系统管理',
    code: 'system',
    resource: 'system',
    action: 'manage',
    category: PermissionCategory.SYSTEM,
    children: [
      {
        id: 'perm_013_001',
        name: '系统管理',
        code: 'system:manage',
        resource: 'system',
        action: 'manage',
        category: PermissionCategory.SYSTEM,
      },
      {
        id: 'perm_013_002',
        name: '审批模板管理',
        code: 'approval-template:manage',
        resource: 'approval-template',
        action: 'manage',
        category: PermissionCategory.SYSTEM,
      },
    ],
  },
]

// 扁平化权限列表
function flattenPermissions(permissionTree: any[], parentId?: string): Permission[] {
  const permissions: Permission[] = []
  
  permissionTree.forEach((item, index) => {
    const permission: Permission = {
      id: item.id,
      name: item.name,
      code: item.code,
      resource: item.resource,
      action: item.action,
      description: item.description || `${item.name}相关权限`,
      category: item.category,
      isSystem: item.category === PermissionCategory.SYSTEM,
      parentId,
      sort: index + 1,
      status: 'active',
      createdAt: faker.date.past(1).toISOString(),
      updatedAt: faker.date.recent(30).toISOString(),
    }
    
    permissions.push(permission)
    
    if (item.children) {
      permissions.push(...flattenPermissions(item.children, item.id))
    }
  })
  
  return permissions
}

export function createMockPermission(options: FactoryOptions = {}): Permission {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options

  faker.setLocale(locale!)

  const resource = faker.helpers.arrayElement(RESOURCES)
  const action = faker.helpers.arrayElement(ACTIONS)
  
  return {
    id: faker.datatype.uuid(),
    name: `${resource}_${action}`,
    code: `${resource}:${action}`,
    resource,
    action,
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(Object.values(PermissionCategory)),
    isSystem: faker.datatype.boolean(0.3),
    sort: faker.datatype.number({ min: 1, max: 100 }),
    status: faker.helpers.weightedArrayElement([
      { weight: 95, value: 'active' as const },
      { weight: 5, value: 'inactive' as const },
    ]),
    createdAt: faker.date.past(1).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockPermissions(options: FactoryOptions = {}): Permission[] {
  // 返回预设的权限树
  return flattenPermissions(PERMISSION_TREE)
}

// 构建权限树结构
export function buildPermissionTree(permissions: Permission[]): Permission[] {
  const permissionMap = new Map<string, Permission>()
  
  // 创建映射并初始化children数组
  permissions.forEach(permission => {
    permissionMap.set(permission.id, { ...permission, children: [] })
  })

  const rootPermissions: Permission[] = []

  // 构建层次结构
  permissions.forEach(permission => {
    const permissionWithChildren = permissionMap.get(permission.id)!
    
    if (permission.parentId) {
      const parent = permissionMap.get(permission.parentId)
      if (parent) {
        parent.children!.push(permissionWithChildren)
      }
    } else {
      rootPermissions.push(permissionWithChildren)
    }
  })

  return rootPermissions
}

// 获取预设权限树
export function getPermissionTree(): Permission[] {
  return buildPermissionTree(flattenPermissions(PERMISSION_TREE))
}

// 根据分类获取权限
export function getPermissionsByCategory(category: PermissionCategory): Permission[] {
  return flattenPermissions(PERMISSION_TREE).filter(p => p.category === category)
}

// 根据资源获取权限
export function getPermissionsByResource(resource: string): Permission[] {
  return flattenPermissions(PERMISSION_TREE).filter(p => p.resource === resource)
}

// 检查权限代码是否存在
export function hasPermission(permissionCode: string, userPermissions: string[]): boolean {
  // 超级管理员拥有所有权限
  if (userPermissions.includes('*')) {
    return true
  }
  
  return userPermissions.includes(permissionCode)
}