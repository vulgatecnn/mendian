// Mock数据生成器 - 使用简化版本
export {
  SimpleMockDataGenerator as MockDataGenerator,
  SimpleMockDataStore as MockDataStore
} from './simple'

// 保留原始复杂版本的导入和类型定义以供将来使用
import { faker } from '@faker-js/faker'
import { MockUtils } from '../config'
import type {
  User,
  StorePlan,
  CandidateLocation,
  PreparationProject,
  Store,
  PaymentItem,
  ApprovalFlow,
  Region,
  Supplier
} from '../../types'

/**
 * 复杂版Mock数据生成器类（暂时注释，使用简化版本）
 */
export class ComplexMockDataGenerator {
  /**
   * 生成用户数据
   */
  static generateUser(): User {
    return {
      id: MockUtils.generateId(),
      username: faker.internet.username(),
      name: MockUtils.generateChineseName(),
      avatar: faker.image.avatarGitHub(),
      email: faker.internet.email(),
      phone: MockUtils.generatePhoneNumber(),
      department: {
        id: MockUtils.generateId(),
        name: faker.helpers.arrayElement(['总裁办', '商务部', '运营部', '财务部', '人事部']),
        code: faker.string.alphanumeric(6).toUpperCase(),
        level: 2
      },
      roles: [
        {
          id: MockUtils.generateId(),
          code: faker.helpers.arrayElement(['admin', 'business', 'operation', 'finance']),
          name: faker.helpers.arrayElement(['管理员', '商务人员', '运营人员', '财务人员']),
          permissions: []
        }
      ],
      permissions: faker.helpers.arrayElements(
        [
          'store:plan:view',
          'store:plan:create',
          'store:plan:edit',
          'store:plan:delete',
          'expansion:view',
          'expansion:create',
          'expansion:edit',
          'preparation:view',
          'preparation:create',
          'preparation:edit',
          'store:files:view',
          'store:files:edit',
          'operation:view',
          'operation:edit',
          'approval:view',
          'approval:process',
          'basic:data:view',
          'basic:data:edit'
        ],
        { min: 5, max: 15 }
      ),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成开店计划数据
   */
  static generateStorePlan(): StorePlan {
    const type = faker.helpers.arrayElement(['direct', 'franchise', 'joint_venture'] as const)
    const status = faker.helpers.arrayElement([
      'draft',
      'pending',
      'approved',
      'in_progress',
      'completed',
      'cancelled'
    ] as const)
    const priority = faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent'] as const)
    const targetDate = faker.date.future()

    return {
      id: MockUtils.generateId(),
      name: `${faker.location.city()}${faker.helpers.arrayElement(['万达', '银泰', '大悦城', '华润', '凯德'])}店`,
      description: faker.lorem.paragraph(),
      type,
      status,
      priority,
      region: this.generateRegion(),
      targetOpenDate: targetDate.toISOString(),
      actualOpenDate:
        status === 'completed'
          ? faker.date
              .between({ from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), to: new Date() })
              .toISOString()
          : undefined,
      budget: faker.number.int({ min: 500000, max: 5000000 }),
      actualCost:
        status === 'completed' ? faker.number.int({ min: 400000, max: 5500000 }) : undefined,
      progress: faker.number.int({ min: 0, max: 100 }),
      milestones: [],
      attachments: [],
      approvalFlowId: faker.datatype.boolean() ? MockUtils.generateId() : undefined,
      approvalHistory: [],
      createdBy: MockUtils.generateId(),
      createdByName: MockUtils.generateChineseName(),
      updatedBy: MockUtils.generateId(),
      updatedByName: MockUtils.generateChineseName(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成候选点位数据
   */
  static generateCandidateLocation(): CandidateLocation {
    const longitude = faker.location.longitude({ min: 73, max: 135 })
    const latitude = faker.location.latitude({ min: 18, max: 54 })
    const address = MockUtils.generateAddress()

    return {
      id: MockUtils.generateId(),
      name: `${faker.location.street()}${faker.helpers.arrayElement(['商铺', '门面', '店铺'])}`,
      address,
      location: {
        longitude: Number(longitude),
        latitude: Number(latitude),
        address,
        province: faker.location.state(),
        city: faker.location.city(),
        district: faker.location.county()
      },
      area: faker.number.int({ min: 50, max: 500 }),
      rentPrice: faker.number.int({ min: 5000, max: 50000 }),
      transferFee: faker.datatype.boolean()
        ? faker.number.int({ min: 10000, max: 200000 })
        : undefined,
      deposit: faker.number.int({ min: 10000, max: 100000 }),
      propertyType: faker.helpers.arrayElement(['commercial', 'residential', 'mixed'] as const),
      floorLevel: faker.number.int({ min: 1, max: 5 }),
      hasElevator: faker.datatype.boolean(),
      parkingSpaces: faker.number.int({ min: 0, max: 20 }),
      nearbyCompetitors: [],
      traffic: {
        dailyFootTraffic: faker.number.int({ min: 1000, max: 10000 }),
        peakHours: ['12:00-14:00', '18:00-20:00'],
        publicTransport: faker.helpers.arrayElements(['地铁', '公交', '出租车'], {
          min: 1,
          max: 3
        }),
        accessibility: faker.helpers.arrayElement(['excellent', 'good', 'average', 'poor'] as const)
      },
      demographics: {
        populationDensity: faker.number.int({ min: 5000, max: 50000 }),
        averageIncome: faker.number.int({ min: 50000, max: 200000 }),
        ageGroups: {
          '18-25': faker.number.int({ min: 10, max: 30 }),
          '26-35': faker.number.int({ min: 20, max: 40 }),
          '36-45': faker.number.int({ min: 15, max: 35 }),
          '46-60': faker.number.int({ min: 10, max: 25 })
        },
        consumptionLevel: faker.helpers.arrayElement(['high', 'medium', 'low'] as const)
      },
      photos: faker.helpers.arrayElements(
        [faker.image.url(), faker.image.url(), faker.image.url()],
        { min: 1, max: 3 }
      ),
      videos: [],
      status: faker.helpers.arrayElement([
        'available',
        'negotiating',
        'reserved',
        'signed',
        'rejected'
      ] as const),
      followUps: [],
      businessConditions: [],
      evaluation: {
        overallScore: faker.number.int({ min: 60, max: 100 }),
        locationScore: faker.number.int({ min: 60, max: 100 }),
        trafficScore: faker.number.int({ min: 60, max: 100 }),
        competitionScore: faker.number.int({ min: 60, max: 100 }),
        rentabilityScore: faker.number.int({ min: 60, max: 100 }),
        notes: faker.lorem.sentence(),
        evaluatedBy: MockUtils.generateId(),
        evaluatedByName: MockUtils.generateChineseName(),
        evaluatedAt: faker.date.recent().toISOString()
      },
      discoveredBy: MockUtils.generateId(),
      discoveredByName: MockUtils.generateChineseName(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成筹备项目数据
   */
  static generatePreparationProject(): PreparationProject {
    const status = faker.helpers.arrayElement([
      'planning',
      'designing',
      'constructing',
      'decorating',
      'accepting',
      'completed'
    ] as const)
    const startDate = faker.date.past()
    const targetDate = faker.date.future()

    return {
      id: MockUtils.generateId(),
      storePlanId: MockUtils.generateId(),
      storePlanName: `${faker.location.city()}${faker.helpers.arrayElement(['万达', '银泰', '大悦城'])}店`,
      candidateLocationId: MockUtils.generateId(),
      locationName: `${faker.location.street()}商铺`,
      projectManager: MockUtils.generateId(),
      projectManagerName: MockUtils.generateChineseName(),
      status,
      startDate: startDate.toISOString(),
      targetCompletionDate: targetDate.toISOString(),
      actualCompletionDate: status === 'completed' ? faker.date.past().toISOString() : undefined,
      budget: faker.number.int({ min: 200000, max: 2000000 }),
      actualCost: faker.number.int({ min: 180000, max: 2200000 }),
      phases: [],
      vendors: [],
      documents: [],
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成门店数据
   */
  static generateStore(): Store {
    const address = MockUtils.generateAddress()
    const longitude = faker.location.longitude({ min: 73, max: 135 })
    const latitude = faker.location.latitude({ min: 18, max: 54 })

    return {
      id: MockUtils.generateId(),
      code: faker.string.alphanumeric(8).toUpperCase(),
      name: `${faker.location.city()}${faker.helpers.arrayElement(['万达', '银泰', '大悦城', '华润', '凯德'])}店`,
      brand: '好饭碗',
      type: faker.helpers.arrayElement(['direct', 'franchise', 'joint_venture'] as const),
      status: faker.helpers.arrayElement([
        'planning',
        'preparing',
        'operating',
        'renovating',
        'closed'
      ] as const),
      address,
      location: {
        longitude: Number(longitude),
        latitude: Number(latitude),
        address,
        province: faker.location.state(),
        city: faker.location.city(),
        district: faker.location.county()
      },
      area: faker.number.int({ min: 100, max: 500 }),
      seatingCapacity: faker.number.int({ min: 50, max: 200 }),
      region: this.generateRegion(),
      manager: {
        id: MockUtils.generateId(),
        name: MockUtils.generateChineseName(),
        phone: MockUtils.generatePhoneNumber(),
        email: faker.internet.email(),
        hireDate: faker.date.past().toISOString(),
        experience: faker.number.int({ min: 1, max: 15 }),
        certifications: faker.helpers.arrayElements(['餐饮管理师', '食品安全管理员', 'HACCP认证'], {
          min: 0,
          max: 3
        })
      },
      contactInfo: {
        phone: MockUtils.generatePhoneNumber(),
        email: faker.internet.email(),
        emergencyContact: {
          name: MockUtils.generateChineseName(),
          phone: MockUtils.generatePhoneNumber(),
          relationship: faker.helpers.arrayElement(['店长', '副店长', '主管'])
        }
      },
      businessInfo: {
        businessLicense: faker.string.alphanumeric(18),
        taxNumber: faker.string.alphanumeric(18),
        legalPerson: MockUtils.generateChineseName(),
        registeredCapital: faker.number.int({ min: 100000, max: 1000000 }),
        registrationDate: faker.date.past().toISOString().split('T')[0],
        businessScope: ['餐饮服务', '食品销售', '外卖配送'],
        operatingHours: {
          monday: { open: '09:00', close: '22:00', isOpen: true },
          tuesday: { open: '09:00', close: '22:00', isOpen: true },
          wednesday: { open: '09:00', close: '22:00', isOpen: true },
          thursday: { open: '09:00', close: '22:00', isOpen: true },
          friday: { open: '09:00', close: '22:00', isOpen: true },
          saturday: { open: '09:00', close: '22:00', isOpen: true },
          sunday: { open: '09:00', close: '22:00', isOpen: true }
        }
      },
      certificates: [],
      equipment: [],
      documents: [],
      operationHistory: [],
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成付款项数据
   */
  static generatePaymentItem(): PaymentItem {
    const category = faker.helpers.arrayElement([
      'rent',
      'utilities',
      'staff',
      'supplies',
      'maintenance',
      'marketing',
      'other'
    ] as const)
    const status = faker.helpers.arrayElement(['pending', 'paid', 'overdue', 'cancelled'] as const)
    const approvalStatus = faker.helpers.arrayElement(['pending', 'approved', 'rejected'] as const)

    return {
      id: MockUtils.generateId(),
      storeId: MockUtils.generateId(),
      storeName: `${faker.location.city()}${faker.helpers.arrayElement(['万达', '银泰', '大悦城'])}店`,
      category,
      subcategory: faker.helpers.arrayElement([
        '水费',
        '电费',
        '燃气费',
        '网络费',
        '基础工资',
        '奖金',
        '社保'
      ]),
      description: `${faker.date.month()}月${category === 'rent' ? '房租' : category === 'utilities' ? '水电费' : '其他费用'}`,
      amount: faker.number.int({ min: 1000, max: 50000 }),
      dueDate: faker.date.future().toISOString().split('T')[0],
      paymentDate: status === 'paid' ? faker.date.recent().toISOString().split('T')[0] : undefined,
      status,
      paymentMethod:
        status === 'paid'
          ? faker.helpers.arrayElement(['cash', 'bank_transfer', 'check', 'online'])
          : undefined,
      approvalStatus,
      approvedBy: approvalStatus === 'approved' ? MockUtils.generateId() : undefined,
      approvedByName: approvalStatus === 'approved' ? MockUtils.generateChineseName() : undefined,
      approvedAt: approvalStatus === 'approved' ? faker.date.recent().toISOString() : undefined,
      receipts: [],
      notes: faker.lorem.sentence(),
      createdBy: MockUtils.generateId(),
      createdByName: MockUtils.generateChineseName(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成审批流程数据
   */
  static generateApprovalFlow(): ApprovalFlow {
    const type = faker.helpers.arrayElement([
      'store_plan',
      'expense',
      'contract',
      'leave',
      'purchase',
      'other'
    ] as const)
    const status = faker.helpers.arrayElement([
      'draft',
      'pending',
      'approved',
      'rejected',
      'cancelled',
      'transferred'
    ] as const)
    const priority = faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent'] as const)

    return {
      id: MockUtils.generateId(),
      title: `${type === 'store_plan' ? '开店计划' : type === 'expense' ? '费用申请' : '其他申请'}-${faker.string.alphanumeric(6)}`,
      type,
      businessId: MockUtils.generateId(),
      applicant: MockUtils.generateId(),
      applicantName: MockUtils.generateChineseName(),
      department: MockUtils.generateId(),
      departmentName: faker.helpers.arrayElement(['商务部', '运营部', '财务部', '人事部']),
      templateId: MockUtils.generateId(),
      templateName: `${type}模板`,
      formData: {
        amount: faker.number.int({ min: 1000, max: 100000 }),
        reason: faker.lorem.sentence(),
        attachments: []
      },
      currentNode: {
        id: MockUtils.generateId(),
        name: '部门经理审批',
        type: 'role' as const,
        approvers: [
          {
            id: MockUtils.generateId(),
            name: MockUtils.generateChineseName(),
            status: 'pending' as const
          }
        ],
        approvalType: 'any' as const,
        sequence: 1,
        status: 'pending' as const
      },
      status,
      priority,
      nodes: [],
      history: [],
      attachments: [],
      deadlineDate: faker.date.future().toISOString(),
      approvedAt: status === 'approved' ? faker.date.recent().toISOString() : undefined,
      rejectedAt: status === 'rejected' ? faker.date.recent().toISOString() : undefined,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成地区数据
   */
  static generateRegion(): Region {
    return {
      id: MockUtils.generateId(),
      code: faker.string.alphanumeric(6).toUpperCase(),
      name: faker.location.city(),
      level: faker.number.int({ min: 1, max: 4 }),
      parentId: faker.datatype.boolean() ? MockUtils.generateId() : undefined,
      enabled: faker.datatype.boolean({ probability: 0.9 }),
      sort: faker.number.int({ min: 1, max: 100 }),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 生成供应商数据
   */
  static generateSupplier(): Supplier {
    const category = faker.helpers.arrayElement([
      'construction',
      'decoration',
      'equipment',
      'supplies',
      'service',
      'other'
    ] as const)
    const type = faker.helpers.arrayElement(['individual', 'company'] as const)
    const status = faker.helpers.arrayElement(['active', 'inactive', 'blacklist'] as const)

    return {
      id: MockUtils.generateId(),
      code: faker.string.alphanumeric(8).toUpperCase(),
      name: `${faker.company.name()}${type === 'company' ? '有限公司' : ''}`,
      shortName: faker.company.name(),
      category,
      type,
      contactInfo: {
        contact: MockUtils.generateChineseName(),
        phone: MockUtils.generatePhoneNumber(),
        mobile: MockUtils.generatePhoneNumber(),
        email: faker.internet.email(),
        address: MockUtils.generateAddress(),
        website: faker.internet.url()
      },
      businessInfo:
        type === 'company'
          ? {
              businessLicense: faker.string.alphanumeric(18),
              taxNumber: faker.string.alphanumeric(18),
              legalPerson: MockUtils.generateChineseName(),
              registeredCapital: faker.number.int({ min: 100000, max: 10000000 }),
              bankAccount: {
                bankName: faker.helpers.arrayElement([
                  '工商银行',
                  '建设银行',
                  '农业银行',
                  '中国银行'
                ]),
                accountNumber: faker.string.numeric(19),
                accountName: faker.company.name()
              }
            }
          : undefined,
      qualifications: [],
      contracts: [],
      evaluations: [],
      status,
      tags: faker.helpers.arrayElements(['优质供应商', '长期合作', '价格优势', '服务优秀'], {
        min: 0,
        max: 3
      }),
      notes: faker.lorem.paragraph(),
      createdBy: MockUtils.generateId(),
      createdByName: MockUtils.generateChineseName(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }
  }

  /**
   * 批量生成数据
   */
  static generateBatch<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator)
  }
}

// 原始复杂数据存储类已移至simple.ts，这里不再导出重复的类
// 如需使用复杂数据生成功能，可以将ComplexMockDataGenerator重新导出
