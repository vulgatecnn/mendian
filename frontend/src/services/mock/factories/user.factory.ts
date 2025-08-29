/**
 * 用户Mock数据工厂
 */
import { faker } from '@faker-js/faker'
import type { FactoryOptions, DEFAULT_FACTORY_OPTIONS } from './index'

// 用户接口定义
export interface User {
  id: string
  username: string
  name: string
  email: string
  phone: string
  avatar?: string
  departmentId: string
  departmentName: string
  positionId: string
  positionName: string
  roleIds: string[]
  roleNames: string[]
  status: 'active' | 'inactive' | 'suspended'
  lastLoginAt?: string
  createdBy: string
  createdByName: string
  updatedBy: string
  updatedByName: string
  createdAt: string
  updatedAt: string
}

// 部门数据
const DEPARTMENTS = [
  { id: 'dept_001', name: '总裁办', parentId: null },
  { id: 'dept_002', name: '商务部', parentId: 'dept_001' },
  { id: 'dept_003', name: '运营部', parentId: 'dept_001' },
  { id: 'dept_004', name: '财务部', parentId: 'dept_001' },
  { id: 'dept_005', name: '人力资源部', parentId: 'dept_001' },
  { id: 'dept_006', name: '信息技术部', parentId: 'dept_001' },
  { id: 'dept_007', name: '拓展组', parentId: 'dept_002' },
  { id: 'dept_008', name: '筹备组', parentId: 'dept_002' },
  { id: 'dept_009', name: '门店管理组', parentId: 'dept_003' },
  { id: 'dept_010', name: '品质管理组', parentId: 'dept_003' },
]

// 职位数据
const POSITIONS = [
  { id: 'pos_001', name: '总裁', level: 1 },
  { id: 'pos_002', name: '副总裁', level: 2 },
  { id: 'pos_003', name: '部门总监', level: 3 },
  { id: 'pos_004', name: '部门经理', level: 4 },
  { id: 'pos_005', name: '主管', level: 5 },
  { id: 'pos_006', name: '专员', level: 6 },
  { id: 'pos_007', name: '店长', level: 5 },
  { id: 'pos_008', name: '副店长', level: 6 },
  { id: 'pos_009', name: '商务经理', level: 4 },
  { id: 'pos_010', name: '商务专员', level: 6 },
  { id: 'pos_011', name: '运营经理', level: 4 },
  { id: 'pos_012', name: '运营专员', level: 6 },
]

// 角色数据
const ROLES = [
  { id: 'role_001', name: '超级管理员' },
  { id: 'role_002', name: '系统管理员' },
  { id: 'role_003', name: '总裁办人员' },
  { id: 'role_004', name: '商务人员' },
  { id: 'role_005', name: '运营人员' },
  { id: 'role_006', name: '销售人员' },
  { id: 'role_007', name: '财务人员' },
  { id: 'role_008', name: '加盟商' },
  { id: 'role_009', name: '店长' },
]

// 常见中文姓氏
const CHINESE_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
  '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '梁',
  '郑', '罗', '宋', '谢', '唐', '韩', '曹', '许', '邓', '萧'
]

// 常见中文名字
const CHINESE_GIVEN_NAMES = [
  '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军',
  '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞',
  '平', '刚', '桂英', '建华', '文', '华', '志强', '秀珍', '海燕', '建国'
]

export function createMockUser(options: FactoryOptions = {}): User {
  const { locale = DEFAULT_FACTORY_OPTIONS.locale } = options

  faker.setLocale(locale!)

  const id = faker.datatype.uuid()
  
  // 生成中文姓名
  const surname = faker.helpers.arrayElement(CHINESE_SURNAMES)
  const givenName = faker.helpers.arrayElements(CHINESE_GIVEN_NAMES, { min: 1, max: 2 }).join('')
  const name = surname + givenName
  
  // 生成用户名（姓名拼音 + 数字）
  const username = faker.internet.userName() + faker.datatype.number({ min: 100, max: 999 })
  
  // 选择部门和职位
  const department = faker.helpers.arrayElement(DEPARTMENTS)
  const position = faker.helpers.arrayElement(POSITIONS)
  
  // 根据部门选择角色
  let roleIds: string[]
  let roleNames: string[]
  
  if (department.name === '总裁办') {
    const role = faker.helpers.arrayElement([ROLES[2]]) // 总裁办人员
    roleIds = [role.id]
    roleNames = [role.name]
  } else if (department.name === '商务部' || department.parentId === 'dept_002') {
    const role = faker.helpers.arrayElement([ROLES[3]]) // 商务人员
    roleIds = [role.id]
    roleNames = [role.name]
  } else if (department.name === '运营部' || department.parentId === 'dept_003') {
    const role = faker.helpers.arrayElement([ROLES[4], ROLES[5]]) // 运营人员或销售人员
    roleIds = [role.id]
    roleNames = [role.name]
  } else if (department.name === '财务部') {
    const role = ROLES[6] // 财务人员
    roleIds = [role.id]
    roleNames = [role.name]
  } else {
    // 其他部门随机分配角色
    const role = faker.helpers.arrayElement(ROLES.slice(3))
    roleIds = [role.id]
    roleNames = [role.name]
  }

  // 管理员用户有更多角色
  if (faker.datatype.boolean(0.1)) { // 10%概率是管理员
    roleIds.unshift(ROLES[1].id) // 添加系统管理员角色
    roleNames.unshift(ROLES[1].name)
  }

  const createdBy = faker.datatype.uuid()
  const updatedBy = faker.datatype.boolean(0.7) ? createdBy : faker.datatype.uuid()

  return {
    id,
    username,
    name,
    email: faker.internet.email(),
    phone: `1${faker.datatype.number({ min: 3000000000, max: 9999999999 })}`,
    avatar: faker.datatype.boolean(0.6) ? faker.image.avatar() : undefined,
    departmentId: department.id,
    departmentName: department.name,
    positionId: position.id,
    positionName: position.name,
    roleIds,
    roleNames,
    status: faker.helpers.weightedArrayElement([
      { weight: 85, value: 'active' as const },
      { weight: 10, value: 'inactive' as const },
      { weight: 5, value: 'suspended' as const },
    ]),
    lastLoginAt: faker.datatype.boolean(0.8) 
      ? faker.date.recent(7).toISOString() 
      : undefined,
    createdBy,
    createdByName: faker.name.fullName(),
    updatedBy,
    updatedByName: faker.name.fullName(),
    createdAt: faker.date.past(2).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }
}

export function createMockUsers(options: FactoryOptions = {}): User[] {
  const { count = DEFAULT_FACTORY_OPTIONS.count } = options

  const users: User[] = []
  
  // 创建超级管理员用户
  const adminUser = createMockUser(options)
  adminUser.username = 'admin'
  adminUser.name = '系统管理员'
  adminUser.email = 'admin@haofanwan.com'
  adminUser.roleIds = ['role_001', 'role_002']
  adminUser.roleNames = ['超级管理员', '系统管理员']
  adminUser.status = 'active'
  users.push(adminUser)

  // 创建演示用户
  const demoUsers = [
    {
      username: 'shangwu001',
      name: '张商务',
      departmentName: '商务部',
      roleName: '商务人员',
    },
    {
      username: 'yunying001', 
      name: '李运营',
      departmentName: '运营部',
      roleName: '运营人员',
    },
    {
      username: 'caiwu001',
      name: '王财务', 
      departmentName: '财务部',
      roleName: '财务人员',
    },
    {
      username: 'dianzhang001',
      name: '刘店长',
      departmentName: '门店管理组',
      roleName: '店长',
    },
  ]

  demoUsers.forEach(demo => {
    const user = createMockUser(options)
    user.username = demo.username
    user.name = demo.name
    user.email = `${demo.username}@haofanwan.com`
    
    // 查找对应的部门和角色
    const department = DEPARTMENTS.find(d => d.name === demo.departmentName) || DEPARTMENTS[1]
    const role = ROLES.find(r => r.name === demo.roleName) || ROLES[3]
    
    user.departmentId = department.id
    user.departmentName = department.name
    user.roleIds = [role.id]
    user.roleNames = [role.name]
    user.status = 'active'
    
    users.push(user)
  })

  // 生成其余用户
  const remainingCount = Math.max(0, count! - users.length)
  for (let i = 0; i < remainingCount; i++) {
    users.push(createMockUser(options))
  }

  return users
}

// 获取部门列表
export function getMockDepartments() {
  return DEPARTMENTS
}

// 获取职位列表
export function getMockPositions() {
  return POSITIONS
}

// 获取角色列表
export function getMockRoles() {
  return ROLES.map(role => ({
    id: role.id,
    name: role.name,
    description: `${role.name}角色描述`,
    permissions: [], // 权限在权限工厂中定义
    userCount: faker.datatype.number({ min: 1, max: 20 }),
    status: 'active' as const,
    createdAt: faker.date.past(1).toISOString(),
    updatedAt: faker.date.recent(30).toISOString(),
  }))
}