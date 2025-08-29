import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  CreateAxiosDefaults
} from 'axios'
import { message } from 'antd'
import type { BaseResponse } from '../../types'

// 请求配置类型
export interface HttpClientConfig extends CreateAxiosDefaults {
  timeout?: number
  retryCount?: number
  retryDelay?: number
  enableLoading?: boolean
  enableErrorMessage?: boolean
}

// 请求状态管理
class RequestManager {
  private requestMap = new Map<string, AbortController>()
  private pendingCount = 0
  private loadingCallbacks = new Set<(loading: boolean) => void>()

  // 订阅加载状态变化
  onLoadingChange(callback: (loading: boolean) => void) {
    this.loadingCallbacks.add(callback)
    return () => this.loadingCallbacks.delete(callback)
  }

  // 生成请求唯一标识
  private generateRequestKey(config: InternalAxiosRequestConfig): string {
    const { method, url, params, data } = config
    return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`
  }

  // 添加请求
  addRequest(config: InternalAxiosRequestConfig): AbortController {
    const key = this.generateRequestKey(config)

    // 如果存在相同请求，先取消之前的
    if (this.requestMap.has(key)) {
      this.requestMap.get(key)?.abort()
    }

    const controller = new AbortController()
    this.requestMap.set(key, controller)

    // 更新pending计数
    this.pendingCount++
    this.notifyLoadingChange()

    return controller
  }

  // 移除请求
  removeRequest(config: InternalAxiosRequestConfig) {
    const key = this.generateRequestKey(config)

    if (this.requestMap.has(key)) {
      this.requestMap.delete(key)
      this.pendingCount = Math.max(0, this.pendingCount - 1)
      this.notifyLoadingChange()
    }
  }

  // 取消所有请求
  cancelAllRequests() {
    this.requestMap.forEach(controller => controller.abort())
    this.requestMap.clear()
    this.pendingCount = 0
    this.notifyLoadingChange()
  }

  // 通知加载状态变化
  private notifyLoadingChange() {
    const loading = this.pendingCount > 0
    this.loadingCallbacks.forEach(callback => callback(loading))
  }

  // 获取当前加载状态
  get isLoading() {
    return this.pendingCount > 0
  }
}

// HTTP客户端类
export class HttpClient {
  private instance: AxiosInstance
  private requestManager: RequestManager
  private config: Required<HttpClientConfig>

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
      enableLoading: true,
      enableErrorMessage: true,
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      headers: {
        'Content-Type': 'application/json'
      },
      ...config
    }

    this.requestManager = new RequestManager()
    this.instance = this.createInstance()
    this.setupInterceptors()
  }

  // 创建axios实例
  private createInstance(): AxiosInstance {
    return axios.create(this.config)
  }

  // 设置拦截器
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 添加认证token
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求管理
        const controller = this.requestManager.addRequest(config)
        config.signal = controller.signal

        // 添加请求时间戳
        config.metadata = {
          ...config.metadata,
          startTime: Date.now()
        }

        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 移除请求管理
        this.requestManager.removeRequest(response.config as InternalAxiosRequestConfig)

        // 统一响应格式处理
        return this.handleResponse(response)
      },
      (error: AxiosError) => {
        // 移除请求管理
        if (error.config) {
          this.requestManager.removeRequest(error.config as InternalAxiosRequestConfig)
        }

        // 处理错误
        return this.handleError(error)
      }
    )
  }

  // 获取认证token
  private getAuthToken(): string | null {
    // 从localStorage或store中获取token
    return localStorage.getItem('auth_token') || null
  }

  // 处理响应
  private handleResponse<T>(response: AxiosResponse<BaseResponse<T>>): BaseResponse<T> {
    const { data } = response

    // 检查业务状态码
    if (data.code !== 200) {
      const error = new Error(data.message)
      error.name = 'BusinessError'
      ;(error as any).code = data.code
      throw error
    }

    return data
  }

  // 错误处理
  private async handleError(error: AxiosError): Promise<never> {
    if (axios.isCancel(error)) {
      throw new Error('Request cancelled')
    }

    // 网络错误
    if (!error.response) {
      if (this.config.enableErrorMessage) {
        message.error('网络连接失败，请检查网络设置')
      }
      throw new Error('网络连接失败')
    }

    const { status, data } = error.response

    // HTTP状态码处理
    switch (status) {
      case 401:
        await this.handleUnauthorized()
        break
      case 403:
        if (this.config.enableErrorMessage) {
          message.error('没有操作权限')
        }
        break
      case 404:
        if (this.config.enableErrorMessage) {
          message.error('请求的资源不存在')
        }
        break
      case 500:
        if (this.config.enableErrorMessage) {
          message.error('服务器内部错误')
        }
        break
      default:
        if (this.config.enableErrorMessage) {
          const errorMessage = (data as any)?.message || '请求失败'
          message.error(errorMessage)
        }
    }

    throw error
  }

  // 处理未认证错误
  private async handleUnauthorized() {
    // 清除token
    localStorage.removeItem('auth_token')

    // 跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // 重试逻辑
  private async retry<T>(
    requestFn: () => Promise<T>,
    retryCount: number = this.config.retryCount,
    delay: number = this.config.retryDelay
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retryCount <= 0) {
        throw error
      }

      // 对于某些错误不进行重试
      if (axios.isCancel(error) || (error as AxiosError).response?.status === 401) {
        throw error
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.retry(requestFn, retryCount - 1, delay * 1.5)
    }
  }

  // 公共请求方法
  async request<T = unknown>(config: AxiosRequestConfig): Promise<BaseResponse<T>> {
    return this.retry(() => this.instance.request<BaseResponse<T>>(config))
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<BaseResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<BaseResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<BaseResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<BaseResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  async patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<BaseResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data })
  }

  // 文件上传
  async upload<T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig & {
      onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void
    }
  ): Promise<BaseResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    })
  }

  // 下载文件
  async download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await this.instance.request({
      ...config,
      method: 'GET',
      url,
      responseType: 'blob'
    })

    // 创建下载链接
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  // 获取加载状态
  get isLoading() {
    return this.requestManager.isLoading
  }

  // 订阅加载状态变化
  onLoadingChange(callback: (loading: boolean) => void) {
    return this.requestManager.onLoadingChange(callback)
  }

  // 取消所有请求
  cancelAllRequests() {
    this.requestManager.cancelAllRequests()
  }

  // 更新配置
  updateConfig(config: Partial<HttpClientConfig>) {
    Object.assign(this.config, config)

    // 更新实例配置
    Object.assign(this.instance.defaults, config)
  }

  // 设置认证token
  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token)
    this.instance.defaults.headers.Authorization = `Bearer ${token}`
  }

  // 清除认证token
  clearAuthToken() {
    localStorage.removeItem('auth_token')
    delete this.instance.defaults.headers.Authorization
  }
}

// 创建默认实例
export const httpClient = new HttpClient()

// 导出类型
export type { AxiosRequestConfig, AxiosResponse, AxiosError }
