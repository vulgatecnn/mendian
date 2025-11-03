/**
 * Axios 请求封装
 * 
 * 功能特性：
 * - 自动添加 Token 到请求头
 * - Token 过期自动刷新
 * - 网络异常自动重试
 * - GET 请求缓存
 * - 统一错误处理
 * - 文件上传支持
 */
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { Message } from '@arco-design/web-react'

// 扩展 Axios 配置类型
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _retryCount?: number
  skipCache?: boolean
  skipErrorHandler?: boolean
}

// 请求缓存接口
interface CacheItem {
  data: any
  timestamp: number
}

// 请求缓存存储
const requestCache = new Map<string, CacheItem>()

// 缓存过期时间（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000

// 最大重试次数
const MAX_RETRY_COUNT = 3

// 重试延迟（毫秒）
const RETRY_DELAY = 1000

/**
 * 生成缓存键
 */
function generateCacheKey(config: AxiosRequestConfig): string {
  const { method, url, params } = config
  return `${method}:${url}:${JSON.stringify(params || {})}`
}

/**
 * 获取缓存数据
 */
function getCachedData(key: string): any | null {
  const cached = requestCache.get(key)
  if (!cached) return null
  
  // 检查缓存是否过期
  if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
    requestCache.delete(key)
    return null
  }
  
  return cached.data
}

/**
 * 设置缓存数据
 */
function setCachedData(key: string, data: any): void {
  requestCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * 清除所有缓存
 */
export function clearRequestCache(): void {
  requestCache.clear()
}

/**
 * 清除指定 URL 的缓存
 */
export function clearCacheByUrl(url: string): void {
  for (const [key] of requestCache) {
    if (key.includes(url)) {
      requestCache.delete(key)
    }
  }
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 判断是否需要重试
 */
function shouldRetry(error: any): boolean {
  // 网络错误或超时错误才重试
  return (
    !error.response ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    (error.response && error.response.status >= 500)
  )
}

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true, // 携带 cookie
})

// 请求拦截器
request.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    // 添加 token 到请求头
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 检查 GET 请求缓存
    if (config.method?.toLowerCase() === 'get' && !config.skipCache) {
      const cacheKey = generateCacheKey(config)
      const cachedData = getCachedData(cacheKey)
      
      if (cachedData) {
        // 返回缓存数据（通过 adapter 拦截）
        config.adapter = () => {
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          } as AxiosResponse)
        }
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as CustomAxiosRequestConfig
    
    // 缓存 GET 请求的响应数据
    if (config.method?.toLowerCase() === 'get' && !config.skipCache) {
      const cacheKey = generateCacheKey(config)
      setCachedData(cacheKey, response.data)
    }
    
    return response.data
  },
  async (error) => {
    const config = error.config as CustomAxiosRequestConfig
    
    // 如果配置了跳过错误处理，直接抛出错误
    if (config?.skipErrorHandler) {
      return Promise.reject(error)
    }
    
    // Token 过期处理（401）
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken && !config._retry) {
        config._retry = true
        
        try {
          const response = await axios.post('/api/auth/refresh-token/', {
            refresh_token: refreshToken
          })
          
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)
          
          // 更新请求头并重试
          config.headers.Authorization = `Bearer ${access_token}`
          return request(config)
        } catch (refreshError) {
          // 刷新失败，清除 token 并跳转到登录页
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          Message.error('登录已过期，请重新登录')
          
          // 延迟跳转，确保消息显示
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
          
          return Promise.reject(refreshError)
        }
      } else {
        Message.error('未授权，请登录')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
        return Promise.reject(error)
      }
    }
    
    // 网络异常重试机制
    if (shouldRetry(error) && config) {
      const retryCount = config._retryCount || 0
      
      if (retryCount < MAX_RETRY_COUNT) {
        config._retryCount = retryCount + 1
        
        // 显示重试提示
        if (retryCount > 0) {
          Message.info(`网络异常，正在重试 (${retryCount}/${MAX_RETRY_COUNT})...`)
        }
        
        // 延迟后重试
        await delay(RETRY_DELAY * (retryCount + 1))
        return request(config)
      } else {
        Message.error('网络异常，请检查网络连接后重试')
        return Promise.reject(error)
      }
    }
    
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 403:
          Message.error('权限不足，无法访问该资源')
          break
        case 404:
          Message.error('请求的资源不存在')
          break
        case 422:
          // 表单验证错误
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat()
            Message.error(errorMessages.join('; '))
          } else {
            Message.error(data?.message || '请求参数错误')
          }
          break
        case 500:
          Message.error('服务器内部错误，请稍后重试')
          break
        case 502:
        case 503:
        case 504:
          Message.error('服务暂时不可用，请稍后重试')
          break
        default:
          Message.error(data?.message || data?.detail || '请求失败')
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      if (error.code === 'ECONNABORTED') {
        Message.error('请求超时，请检查网络连接')
      } else {
        Message.error('网络错误，请检查网络连接')
      }
    } else {
      // 请求配置错误
      Message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default request
