import { AxiosRequestConfig } from 'axios'
import { debounce, throttle } from 'lodash-es'
import type { BaseResponse, PaginationResponse } from '../../types'

// 请求防抖配置
export interface DebounceConfig {
  wait: number
  leading?: boolean
  trailing?: boolean
}

// 请求节流配置
export interface ThrottleConfig {
  wait: number
  leading?: boolean
  trailing?: boolean
}

// 请求缓存配置
export interface CacheConfig {
  ttl: number // 缓存时间(ms)
  key?: string // 自定义缓存key
}

// 缓存管理器
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  // 生成缓存key
  private generateKey(url: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${url}${paramsStr}`
  }

  // 设置缓存
  set(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // 获取缓存
  get(key: string): any | null {
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  // 删除缓存
  delete(key: string) {
    this.cache.delete(key)
  }

  // 清空缓存
  clear() {
    this.cache.clear()
  }

  // 清除过期缓存
  clearExpired() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 获取缓存统计
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 全局缓存实例
export const requestCache = new RequestCache()

// 定期清理过期缓存
setInterval(
  () => {
    requestCache.clearExpired()
  },
  5 * 60 * 1000
) // 每5分钟清理一次

// 请求防抖装饰器
export function withDebounce<T extends (...args: any[]) => any>(fn: T, config: DebounceConfig): T {
  return debounce(fn, config.wait, {
    leading: config.leading,
    trailing: config.trailing
  }) as T
}

// 请求节流装饰器
export function withThrottle<T extends (...args: any[]) => any>(fn: T, config: ThrottleConfig): T {
  return throttle(fn, config.wait, {
    leading: config.leading,
    trailing: config.trailing
  }) as T
}

// 请求缓存装饰器
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: CacheConfig
): T {
  return (async (...args: any[]) => {
    const key = config.key || JSON.stringify(args)

    // 尝试从缓存获取
    const cached = requestCache.get(key)
    if (cached) {
      return cached
    }

    // 执行原函数
    const result = await fn(...args)

    // 缓存结果
    requestCache.set(key, result, config.ttl)

    return result
  }) as T
}

// 请求重试装饰器
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 1.5
): T {
  return (async (...args: any[]) => {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args)
      } catch (error) {
        lastError = error as Error

        // 最后一次尝试失败，抛出错误
        if (attempt === maxRetries) {
          throw error
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt)))
      }
    }

    throw lastError!
  }) as T
}

// 请求超时装饰器
export function withTimeout<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeoutMs: number
): T {
  return (async (...args: any[]) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })

    return Promise.race([fn(...args), timeoutPromise])
  }) as T
}

// 请求合并器 - 合并相同的并发请求
class RequestMerger {
  private pendingRequests = new Map<string, Promise<any>>()

  // 合并相同请求
  merge<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // 如果已有相同请求在进行中，返回相同的Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>
    }

    // 执行请求
    const promise = requestFn().finally(() => {
      // 请求完成后移除
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  // 取消所有pending请求
  cancelAll() {
    this.pendingRequests.clear()
  }

  // 获取pending请求数量
  get pendingCount() {
    return this.pendingRequests.size
  }
}

// 全局请求合并器
export const requestMerger = new RequestMerger()

// 请求合并装饰器
export function withMerge<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: any[]) => string
): T {
  return (async (...args: any[]) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    return requestMerger.merge(key, () => fn(...args))
  }) as T
}

// 响应数据转换工具
export class ResponseTransformer {
  // 转换分页响应
  static transformPagination<T>(response: BaseResponse<T[]>): PaginationResponse<T> {
    const { data, ...rest } = response

    return {
      ...rest,
      data: Array.isArray(data) ? data : [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: Array.isArray(data) ? data.length : 0,
        totalPages: 1
      }
    }
  }

  // 转换列表响应
  static transformList<T>(response: BaseResponse<T[]>): T[] {
    return Array.isArray(response.data) ? response.data : []
  }

  // 转换单个实体响应
  static transformEntity<T>(response: BaseResponse<T>): T {
    return response.data
  }

  // 转换布尔响应
  static transformBoolean(response: BaseResponse<boolean>): boolean {
    return Boolean(response.data)
  }

  // 安全的数据提取
  static safeExtract<T>(response: any, defaultValue: T): T {
    try {
      return response?.data ?? defaultValue
    } catch {
      return defaultValue
    }
  }
}

// 请求参数构建工具
export class RequestBuilder {
  private config: AxiosRequestConfig = {}

  // 设置URL
  url(url: string) {
    this.config.url = url
    return this
  }

  // 设置方法
  method(method: string) {
    this.config.method = method
    return this
  }

  // 设置数据
  data(data: any) {
    this.config.data = data
    return this
  }

  // 设置查询参数
  params(params: any) {
    this.config.params = params
    return this
  }

  // 设置请求头
  headers(headers: Record<string, string>) {
    this.config.headers = { ...this.config.headers, ...headers }
    return this
  }

  // 设置超时
  timeout(timeout: number) {
    this.config.timeout = timeout
    return this
  }

  // 设置响应类型
  responseType(type: 'json' | 'text' | 'blob' | 'arraybuffer') {
    this.config.responseType = type
    return this
  }

  // 设置认证
  auth(token: string) {
    return this.headers({ Authorization: `Bearer ${token}` })
  }

  // 设置内容类型
  contentType(type: string) {
    return this.headers({ 'Content-Type': type })
  }

  // 设置为JSON请求
  json() {
    return this.contentType('application/json')
  }

  // 设置为表单请求
  form() {
    return this.contentType('application/x-www-form-urlencoded')
  }

  // 设置为上传请求
  upload() {
    return this.contentType('multipart/form-data')
  }

  // 构建配置
  build(): AxiosRequestConfig {
    return { ...this.config }
  }
}

// 创建请求构建器
export const createRequestBuilder = () => new RequestBuilder()

// 常用请求配置预设
export const REQUEST_PRESETS = {
  // 快速查询
  QUICK_QUERY: {
    timeout: 5000,
    cache: { ttl: 30000 } // 30秒缓存
  },

  // 数据列表
  DATA_LIST: {
    timeout: 10000,
    cache: { ttl: 60000 } // 1分钟缓存
  },

  // 数据提交
  DATA_SUBMIT: {
    timeout: 15000,
    retry: { maxRetries: 2, delay: 1000 }
  },

  // 文件上传
  FILE_UPLOAD: {
    timeout: 60000,
    headers: { 'Content-Type': 'multipart/form-data' }
  },

  // 文件下载
  FILE_DOWNLOAD: {
    timeout: 120000,
    responseType: 'blob' as const
  },

  // 实时数据
  REAL_TIME: {
    timeout: 3000,
    cache: { ttl: 5000 } // 5秒缓存
  }
} as const

// 错误重试策略
export const RETRY_STRATEGIES = {
  // 网络错误重试
  NETWORK_ERROR: {
    maxRetries: 3,
    delay: 1000,
    backoff: 2
  },

  // 服务器错误重试
  SERVER_ERROR: {
    maxRetries: 2,
    delay: 2000,
    backoff: 1.5
  },

  // 快速重试
  QUICK_RETRY: {
    maxRetries: 1,
    delay: 500,
    backoff: 1
  },

  // 无重试
  NO_RETRY: {
    maxRetries: 0,
    delay: 0,
    backoff: 1
  }
} as const
