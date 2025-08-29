// MSW配置和工具函数
import { faker } from '@faker-js/faker'
import { http, HttpHandler } from 'msw'
import { setupWorker } from 'msw/browser'

// 配置中文本地化
faker.locale = 'zh_CN'

// Mock配置选项
export interface MockConfig {
  enabled: boolean
  delay: number // 模拟网络延迟
  errorRate: number // 错误率 (0-1)
  baseUrl: string
}

// 默认配置
export const DEFAULT_MOCK_CONFIG: MockConfig = {
  enabled:
    import.meta.env.VITE_API_ENABLE_MOCK === 'true' || import.meta.env.MODE === 'development',
  delay: parseInt(import.meta.env.VITE_MOCK_DELAY || '500', 10),
  errorRate: parseFloat(import.meta.env.VITE_MOCK_ERROR_RATE || '0.05'),
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1'
}

// Mock响应工具类
export class MockResponse {
  /**
   * 成功响应
   */
  static success<T>(
    data: T,
    message = '操作成功'
  ): {
    code: number
    message: string
    data: T
    timestamp: number
  } {
    return {
      code: 200,
      message,
      data,
      timestamp: Date.now()
    }
  }

  /**
   * 分页响应
   */
  static pagination<T>(
    data: T[],
    page: number = 1,
    pageSize: number = 20,
    total?: number
  ): {
    code: number
    message: string
    data: T[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
    timestamp: number
  } {
    const actualTotal = total ?? data.length
    return {
      code: 200,
      message: '获取成功',
      data,
      pagination: {
        page,
        pageSize,
        total: actualTotal,
        totalPages: Math.ceil(actualTotal / pageSize)
      },
      timestamp: Date.now()
    }
  }

  /**
   * 错误响应
   */
  static error(
    message: string,
    code: number = 400
  ): {
    code: number
    message: string
    data: null
    timestamp: number
  } {
    return {
      code,
      message,
      data: null,
      timestamp: Date.now()
    }
  }

  /**
   * 验证错误响应
   */
  static validationError(errors: Array<{ field: string; message: string }>): {
    code: number
    message: string
    data: null
    errors: Array<{ field: string; message: string }>
    timestamp: number
  } {
    return {
      code: 422,
      message: '数据验证失败',
      data: null,
      errors,
      timestamp: Date.now()
    }
  }
}

// Mock工具函数
export class MockUtils {
  /**
   * 生成随机ID
   */
  static generateId(): string {
    return faker.string.uuid()
  }

  /**
   * 生成随机中文姓名
   */
  static generateChineseName(): string {
    const surnames = [
      '张',
      '王',
      '李',
      '赵',
      '陈',
      '刘',
      '杨',
      '孙',
      '吴',
      '林',
      '黄',
      '周',
      '徐',
      '朱',
      '马',
      '高'
    ]
    const names = [
      '伟',
      '芳',
      '娜',
      '敏',
      '静',
      '丽',
      '强',
      '磊',
      '洋',
      '勇',
      '艳',
      '杰',
      '涛',
      '明',
      '超',
      '秀英'
    ]

    const surname = faker.helpers.arrayElement(surnames)
    const name =
      faker.helpers.arrayElement(names) +
      (faker.datatype.boolean() ? faker.helpers.arrayElement(names) : '')
    return surname + name
  }

  /**
   * 生成随机手机号
   */
  static generatePhoneNumber(): string {
    const prefixes = [
      '130',
      '131',
      '132',
      '133',
      '134',
      '135',
      '136',
      '137',
      '138',
      '139',
      '150',
      '151',
      '152',
      '153',
      '155',
      '156',
      '157',
      '158',
      '159',
      '180',
      '181',
      '182',
      '183',
      '184',
      '185',
      '186',
      '187',
      '188',
      '189'
    ]
    const prefix = faker.helpers.arrayElement(prefixes)
    const suffix = faker.string.numeric(8)
    return prefix + suffix
  }

  /**
   * 生成随机地址
   */
  static generateAddress(): string {
    const provinces = [
      '北京市',
      '上海市',
      '广东省',
      '江苏省',
      '浙江省',
      '山东省',
      '河南省',
      '四川省',
      '湖北省',
      '湖南省'
    ]
    const cities = ['市', '县', '区']
    const streets = ['路', '街', '大道', '巷']

    const province = faker.helpers.arrayElement(provinces)
    const city = faker.person.lastName() + faker.helpers.arrayElement(cities)
    const street =
      faker.person.lastName() +
      faker.helpers.arrayElement(streets) +
      faker.number.int({ min: 1, max: 999 }) +
      '号'

    return province + city + street
  }

  /**
   * 生成随机日期范围内的日期
   */
  static generateDateInRange(startDate: Date, endDate: Date): string {
    return faker.date.between({ from: startDate, to: endDate }).toISOString()
  }

  /**
   * 分页数据
   */
  static paginate<T>(data: T[], page: number, pageSize: number): T[] {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return data.slice(start, end)
  }

  /**
   * 过滤数据
   */
  static filterData<T>(data: T[], filters: Record<string, any>): T[] {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true

        const itemValue = (item as any)[key]
        if (typeof value === 'string') {
          return String(itemValue).toLowerCase().includes(value.toLowerCase())
        }
        return itemValue === value
      })
    })
  }

  /**
   * 排序数据
   */
  static sortData<T>(data: T[], sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): T[] {
    if (!sortBy) return data

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortBy]
      const bValue = (b as any)[sortBy]

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    })
  }

  /**
   * 模拟网络延迟
   */
  static async delay(ms: number = DEFAULT_MOCK_CONFIG.delay): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 随机产生错误
   */
  static shouldReturnError(rate: number = DEFAULT_MOCK_CONFIG.errorRate): boolean {
    return faker.datatype.float({ min: 0, max: 1 }) < rate
  }
}

// Mock处理器基类
export abstract class BaseMockHandler {
  protected config: MockConfig

  constructor(config: MockConfig = DEFAULT_MOCK_CONFIG) {
    this.config = config
  }

  /**
   * 创建HTTP处理器
   */
  protected http(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    resolver: any
  ): HttpHandler {
    const fullPath = `${this.config.baseUrl}${path}`
    return http[method](fullPath, resolver)
  }

  /**
   * 抽象方法：获取处理器列表
   */
  abstract getHandlers(): HttpHandler[]
}

// MSW Worker管理器
export class MockWorkerManager {
  private worker: any = null
  private handlers: HttpHandler[] = []
  private config: MockConfig

  constructor(config: MockConfig = DEFAULT_MOCK_CONFIG) {
    this.config = config
  }

  /**
   * 注册Mock处理器
   */
  registerHandler(handler: BaseMockHandler) {
    this.handlers.push(...handler.getHandlers())
  }

  /**
   * 注册多个Mock处理器
   */
  registerHandlers(handlers: BaseMockHandler[]) {
    handlers.forEach(handler => this.registerHandler(handler))
  }

  /**
   * 启动Mock服务
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[MSW] Mock服务已禁用')
      return
    }

    try {
      this.worker = setupWorker(...this.handlers)
      await this.worker.start({
        onUnhandledRequest: 'bypass'
      })

      console.log('[MSW] Mock服务已启动', {
        handlersCount: this.handlers.length,
        baseUrl: this.config.baseUrl,
        delay: this.config.delay,
        errorRate: this.config.errorRate
      })
    } catch (error) {
      console.error('[MSW] Mock服务启动失败:', error)
    }
  }

  /**
   * 停止Mock服务
   */
  stop(): void {
    if (this.worker) {
      this.worker.stop()
      console.log('[MSW] Mock服务已停止')
    }
  }

  /**
   * 重置处理器
   */
  resetHandlers(): void {
    if (this.worker) {
      this.worker.resetHandlers()
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MockConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// 创建全局Mock管理器实例
export const mockWorkerManager = new MockWorkerManager()
