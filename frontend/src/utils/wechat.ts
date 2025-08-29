/**
 * 企业微信工具函数
 */

import { UAParser } from 'ua-parser-js'
import type { WeChatEnvironment, WeChatConfig, WeChatJSConfig } from '../types/wechat'

/**
 * 检测企业微信环境
 */
export function detectWeChatEnvironment(): WeChatEnvironment {
  const parser = new UAParser()
  const result = parser.getResult()
  const userAgent = navigator.userAgent.toLowerCase()

  // 检测是否在企业微信客户端中
  const isWeChatWork = /wxwork|wechatwork|micromessenger.*wxwork/i.test(userAgent) ||
                      /windowswechat/i.test(userAgent) ||
                      window.navigator.userAgent.indexOf('wxwork') !== -1

  // 检测是否在移动端
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent) ||
                   result.device.type === 'mobile' ||
                   result.device.type === 'tablet'

  // 检测是否支持JS-SDK（需要在企业微信环境中）
  const supportJSSDK = isWeChatWork && typeof window !== 'undefined'

  return {
    isWeChatWork,
    isMobile,
    supportJSSDK,
    userAgent: navigator.userAgent,
    device: {
      type: isMobile ? 'mobile' : 'desktop',
      os: result.os.name || 'unknown',
      browser: result.browser.name || 'unknown',
      version: result.browser.version || 'unknown'
    }
  }
}

/**
 * 生成企业微信授权URL
 */
export function generateAuthUrl(config: WeChatConfig): string {
  const params = new URLSearchParams({
    appid: config.corpId,
    redirect_uri: encodeURIComponent(config.redirectUri),
    response_type: 'code',
    scope: config.scope,
    agentid: config.agentId,
    state: config.state || generateRandomString(16)
  })

  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成时间戳
 */
export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString()
}

/**
 * 解析URL查询参数
 */
export function parseUrlParams(url?: string): Record<string, string> {
  const urlToParse = url || window.location.href
  const urlObj = new URL(urlToParse)
  const params: Record<string, string> = {}
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = decodeURIComponent(value)
  })
  
  return params
}

/**
 * 获取URL中的授权码和状态参数
 */
export function getAuthParams(): { code?: string; state?: string } {
  const params = parseUrlParams()
  return {
    code: params["code"] as string | undefined,
    state: params["state"] as string | undefined
  }
}

/**
 * 验证企业微信配置
 */
export function validateWeChatConfig(config: Partial<WeChatConfig>): string[] {
  const errors: string[] = []
  
  if (!config.corpId) {
    errors.push('corpId is required')
  }
  
  if (!config.agentId) {
    errors.push('agentId is required')
  }
  
  if (!config.redirectUri) {
    errors.push('redirectUri is required')
  } else {
    try {
      new URL(config.redirectUri)
    } catch {
      errors.push('redirectUri must be a valid URL')
    }
  }
  
  if (!config.scope) {
    errors.push('scope is required')
  }
  
  return errors
}

/**
 * 动态加载企业微信JS-SDK
 */
export function loadWeChatJSSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载过
    if (window.wx) {
      resolve()
      return
    }

    // 创建script标签
    const script = document.createElement('script')
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.2.0.js'
    script.async = true
    
    script.onload = () => {
      if (window.wx) {
        resolve()
      } else {
        reject(new Error('WeChat JS-SDK failed to load'))
      }
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load WeChat JS-SDK'))
    }
    
    document.head.appendChild(script)
  })
}

/**
 * 配置企业微信JS-SDK
 */
export function configWeChatJSSDK(config: WeChatJSConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.wx) {
      reject(new Error('WeChat JS-SDK not loaded'))
      return
    }

    window.wx.config({
      debug: config.debug,
      appId: config.corpId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: config.jsApiList,
      openTagList: config.openTagList
    })

    window.wx.ready(() => {
      resolve()
    })

    window.wx.error((res: any) => {
      reject(new Error(`WeChat JS-SDK config failed: ${JSON.stringify(res)}`))
    })
  })
}

/**
 * 检查JS-SDK接口权限
 */
export function checkJSSDKApi(apiList: string[]): Promise<Record<string, boolean>> {
  return new Promise((resolve, reject) => {
    if (!window.wx) {
      reject(new Error('WeChat JS-SDK not loaded'))
      return
    }

    window.wx.checkJsApi({
      jsApiList: apiList,
      success: (res: any) => {
        resolve(res.checkResult || {})
      },
      fail: (res: any) => {
        reject(new Error(`Check JS-SDK API failed: ${JSON.stringify(res)}`))
      }
    })
  })
}

/**
 * 获取网络类型
 */
export function getNetworkType(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.wx) {
      reject(new Error('WeChat JS-SDK not loaded'))
      return
    }

    window.wx.getNetworkType({
      success: (res: any) => {
        resolve(res.networkType)
      },
      fail: (res: any) => {
        reject(new Error(`Get network type failed: ${JSON.stringify(res)}`))
      }
    })
  })
}

/**
 * 清理URL中的微信相关参数
 */
export function cleanWeChatParams(): void {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  const paramsToRemove = ['code', 'state']
  
  let hasChanged = false
  paramsToRemove.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param)
      hasChanged = true
    }
  })
  
  if (hasChanged) {
    window.history.replaceState({}, document.title, url.toString())
  }
}

/**
 * 判断是否为企业微信内置浏览器
 */
export function isWeChatWorkBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  return /wxwork|wechatwork/i.test(userAgent)
}

/**
 * 判断是否为微信浏览器（包括企业微信）
 */
export function isWeChatBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase()
  return /micromessenger/i.test(userAgent)
}

/**
 * 获取设备信息
 */
export function getDeviceInfo() {
  const parser = new UAParser()
  const result = parser.getResult()
  
  return {
    device: result.device,
    os: result.os,
    browser: result.browser,
    engine: result.engine,
    cpu: result.cpu
  }
}

/**
 * 调试信息输出
 */
export function debugLog(message: string, data?: any): void {
  if (process.env["NODE_ENV"] === 'development') {
    console.log(`[WeChat Debug] ${message}`, data || '')
  }
}

/**
 * 错误处理函数
 */
export function handleWeChatError(error: any, context: string): Error {
  const errorMessage = typeof error === 'string' ? error : 
                      error?.message || error?.errmsg || 'Unknown WeChat error'
  
  const finalError = new Error(`[WeChat ${context}] ${errorMessage}`)
  
  // 在开发环境下输出详细错误信息
  if (process.env["NODE_ENV"] === 'development') {
    console.error(`[WeChat Error] ${context}:`, error)
  }
  
  return finalError
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt === maxAttempts) {
        break
      }
      
      debugLog(`Retry attempt ${attempt} failed, retrying in ${delay}ms...`, error)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return ((...args: any[]) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }) as T
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null
  
  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func(...args), delay)
  }) as T
}

/**
 * 存储工具（用于缓存配置和状态）
 */
export const storage = {
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      debugLog('Failed to save to localStorage', error)
    }
  },
  
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      debugLog('Failed to read from localStorage', error)
      return defaultValue
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      debugLog('Failed to remove from localStorage', error)
    }
  }
}