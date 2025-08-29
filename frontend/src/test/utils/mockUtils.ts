import { faker } from '@faker-js/faker'
import { vi, type MockedFunction } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

// 通用Mock工厂
export class MockFactory {
  static generateId(): string {
    return faker.string.uuid()
  }

  static generateChineseName(): string {
    const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴']
    const givenNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳']
    return faker.helpers.arrayElement(surnames) + faker.helpers.arrayElement(givenNames)
  }

  static generateChineseCompanyName(): string {
    const prefixes = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '西安']
    const companies = ['科技', '实业', '贸易', '投资', '文化', '餐饮', '服装', '医疗']
    const suffixes = ['有限公司', '股份有限公司', '集团', '企业', '中心']
    
    return faker.helpers.arrayElement(prefixes) + 
           faker.helpers.arrayElement(companies) + 
           faker.helpers.arrayElement(suffixes)
  }

  static generateChineseAddress(): string {
    const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省']
    const cities = ['朝阳区', '浦东新区', '天河区', '西湖区', '玄武区', '武侯区']
    const streets = ['中山路', '人民路', '解放路', '建设路', '胜利路', '和平路']
    
    return faker.helpers.arrayElement(provinces) + 
           faker.helpers.arrayElement(cities) + 
           faker.helpers.arrayElement(streets) + 
           faker.number.int({ min: 1, max: 999 }) + '号'
  }

  static generatePhoneNumber(): string {
    const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                     '150', '151', '152', '153', '155', '156', '157', '158', '159',
                     '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
    const prefix = faker.helpers.arrayElement(prefixes)
    const suffix = faker.string.numeric(8)
    return prefix + suffix
  }

  // 生成业务相关的Mock数据
  static generateStorePlan() {
    return {
      id: this.generateId(),
      title: `${faker.helpers.arrayElement(['华东', '华南', '华北', '西南', '西北'])}地区${faker.date.recent().getFullYear()}年开店计划`,
      description: faker.lorem.sentence(),
      region: faker.helpers.arrayElement(['华东', '华南', '华北', '西南', '西北']),
      storeType: faker.helpers.arrayElement(['直营店', '加盟店', '联营店']),
      plannedCount: faker.number.int({ min: 5, max: 50 }),
      completedCount: faker.number.int({ min: 0, max: 30 }),
      budget: faker.number.int({ min: 1000000, max: 10000000 }),
      status: faker.helpers.arrayElement(['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED']),
      startDate: faker.date.recent().toISOString(),
      endDate: faker.date.future().toISOString(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      createdBy: this.generateChineseName(),
      responsible: this.generateChineseName(),
    }
  }

  static generateCandidateLocation() {
    return {
      id: this.generateId(),
      name: `${this.generateChineseCompanyName()}${faker.helpers.arrayElement(['购物中心', '商业广场', '步行街', '社区商业'])}`,
      address: this.generateChineseAddress(),
      area: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
      monthlyRent: faker.number.int({ min: 5000, max: 50000 }),
      status: faker.helpers.arrayElement(['PENDING', 'FOLLOWING', 'NEGOTIATING', 'SIGNED', 'REJECTED']),
      contactPerson: this.generateChineseName(),
      contactPhone: this.generatePhoneNumber(),
      businessDistrict: faker.helpers.arrayElement(['CBD', '商业区', '社区', '交通枢纽', '旅游区']),
      footTraffic: faker.helpers.arrayElement(['高', '中', '低']),
      competition: faker.helpers.arrayElement(['激烈', '一般', '较少']),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    }
  }

  static generateUser() {
    return {
      id: this.generateId(),
      name: this.generateChineseName(),
      email: faker.internet.email(),
      phone: this.generatePhoneNumber(),
      department: faker.helpers.arrayElement(['商务部', '运营部', '财务部', '人事部', '技术部']),
      position: faker.helpers.arrayElement(['经理', '主管', '专员', '助理', '总监']),
      roles: faker.helpers.arrayElements(['商务人员', '运营人员', '财务人员', '管理员'], { min: 1, max: 2 }),
      permissions: faker.helpers.arrayElements([
        'store:read', 'store:write', 'store:delete', 
        'expansion:read', 'expansion:write', 'expansion:delete',
        'approval:read', 'approval:write'
      ], { min: 2, max: 6 }),
      avatar: faker.image.avatar(),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      createdAt: faker.date.past().toISOString(),
      lastLoginAt: faker.date.recent().toISOString(),
    }
  }

  // 生成分页数据
  static generatePaginatedData<T>(
    factory: () => T,
    page: number = 1,
    pageSize: number = 20,
    total?: number
  ) {
    const actualTotal = total || faker.number.int({ min: pageSize, max: 200 })
    const start = (page - 1) * pageSize
    const end = Math.min(start + pageSize, actualTotal)
    const count = Math.max(0, end - start)

    const data = Array.from({ length: count }, factory)

    return {
      data,
      total: actualTotal,
      page,
      pageSize,
      totalPages: Math.ceil(actualTotal / pageSize),
      hasNext: page * pageSize < actualTotal,
      hasPrev: page > 1,
    }
  }
}

// API Mock工具
export class ApiMockUtils {
  static createSuccessResponse<T>(data: T, message: string = '操作成功') {
    return {
      success: true,
      code: 200,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  static createErrorResponse(message: string = '操作失败', code: number = 400) {
    return {
      success: false,
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    }
  }

  static createPaginationResponse<T>(
    data: T[],
    page: number,
    pageSize: number,
    total: number
  ) {
    return this.createSuccessResponse({
      list: data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    })
  }

  // 模拟网络延迟
  static async delay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 模拟网络错误
  static simulateNetworkError(errorRate: number = 0.1): boolean {
    return Math.random() < errorRate
  }
}

// React Query Mock工具
export class QueryMockUtils {
  static createMockQueryClient(): QueryClient {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })
  }

  static mockUseQuery<T>(data: T, isLoading: boolean = false, error: any = null) {
    return {
      data,
      isLoading,
      error,
      refetch: vi.fn(),
      isError: !!error,
      isSuccess: !isLoading && !error,
      isFetching: isLoading,
      isRefetching: false,
    }
  }

  static mockUseMutation<T = any, V = any>() {
    return {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
      isSuccess: false,
      data: null as T | null,
      error: null,
      reset: vi.fn(),
    }
  }
}

// 组件Props Mock工具
export class PropsMockUtils {
  static createTableProps(dataSource: any[] = []) {
    return {
      dataSource,
      loading: false,
      pagination: {
        current: 1,
        pageSize: 20,
        total: dataSource.length,
        onChange: vi.fn(),
        onShowSizeChange: vi.fn(),
      },
      onChange: vi.fn(),
      onRow: vi.fn(),
    }
  }

  static createFormProps(initialValues: any = {}) {
    return {
      form: {
        getFieldValue: vi.fn(),
        getFieldsValue: vi.fn(() => initialValues),
        setFieldsValue: vi.fn(),
        resetFields: vi.fn(),
        validateFields: vi.fn(() => Promise.resolve(initialValues)),
        submit: vi.fn(),
      },
      initialValues,
      onFinish: vi.fn(),
      onFinishFailed: vi.fn(),
      onValuesChange: vi.fn(),
    }
  }

  static createModalProps(visible: boolean = false) {
    return {
      open: visible,
      visible, // 兼容旧版本
      onOk: vi.fn(),
      onCancel: vi.fn(),
      confirmLoading: false,
      destroyOnClose: true,
    }
  }
}

// 本地存储Mock
export class StorageMockUtils {
  static mockLocalStorage() {
    const store = new Map<string, string>()

    return {
      getItem: vi.fn((key: string) => store.get(key) || null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
    }
  }

  static mockSessionStorage() {
    return this.mockLocalStorage()
  }
}

// 时间Mock工具
export class TimeMockUtils {
  static mockDate(date: string | Date = '2024-01-01T00:00:00.000Z') {
    const mockDate = new Date(date)
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
    return mockDate
  }

  static restoreDate() {
    vi.useRealTimers()
  }

  static mockDayjs() {
    return vi.mock('dayjs', () => {
      const mockDayjs: any = vi.fn((date?: any) => ({
        format: vi.fn(() => '2024-01-01'),
        toDate: vi.fn(() => new Date('2024-01-01')),
        valueOf: vi.fn(() => new Date('2024-01-01').valueOf()),
        toISOString: vi.fn(() => '2024-01-01T00:00:00.000Z'),
        startOf: vi.fn(() => mockDayjs('2024-01-01')),
        endOf: vi.fn(() => mockDayjs('2024-12-31')),
        year: vi.fn(() => 2024),
        month: vi.fn(() => 0),
        date: vi.fn(() => 1),
        fromNow: vi.fn(() => '1 天前'),
        diff: vi.fn(() => 1),
        isBefore: vi.fn(() => false),
        isAfter: vi.fn(() => true),
        isSame: vi.fn(() => true),
      }))
      
      mockDayjs.extend = vi.fn()
      return { default: mockDayjs }
    })
  }
}

// 网络请求Mock工具
export class HttpMockUtils {
  static mockFetch(response: any, options: { status?: number; ok?: boolean } = {}) {
    const { status = 200, ok = true } = options
    
    return vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  }

  static mockAxios() {
    const mockAxios = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      request: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
      defaults: {
        baseURL: '',
        headers: {},
        timeout: 5000,
      },
    }

    vi.mock('axios', () => ({
      default: mockAxios,
      ...mockAxios,
    }))

    return mockAxios
  }
}

// 所有工具类已经通过 export class 单独导出

// 便捷的组合Mock函数
export const createCompleteMock = () => ({
  factory: MockFactory,
  api: ApiMockUtils,
  query: QueryMockUtils,
  props: PropsMockUtils,
  storage: StorageMockUtils,
  time: TimeMockUtils,
  http: HttpMockUtils,
})

export default createCompleteMock