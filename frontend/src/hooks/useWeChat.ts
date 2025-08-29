/**
 * 企业微信React Hook
 * 提供企业微信功能的React集成接口
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { weChatCore } from '../services/wechat/core'
import { weChatAuth } from '../services/wechat/auth'
import { WeChatApiService } from '../services/wechat/api'

import type {
  WeChatConfig,
  WeChatJSConfig,
  WeChatUserInfo,
  WeChatEnvironment,
  WeChatShareContent,
  WeChatLocation,
  WeChatImageConfig,
  WeChatEventType,
  WeChatEventCallback
} from '../types/wechat'

/**
 * 企业微信Hook配置
 */
interface UseWeChatConfig extends WeChatConfig {
  /** 是否自动初始化 */
  autoInit?: boolean
  /** 是否自动认证 */
  autoAuth?: boolean
  /** 是否静默认证 */
  silentAuth?: boolean
}

/**
 * 企业微信Hook返回值
 */
interface UseWeChatReturn {
  // 状态
  /** 是否已初始化 */
  initialized: boolean
  /** 是否已配置 */
  configured: boolean
  /** 是否已认证 */
  authenticated: boolean
  /** 当前用户信息 */
  user: WeChatUserInfo | null
  /** 环境信息 */
  environment: WeChatEnvironment | null
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string | null

  // 核心功能
  /** 初始化企业微信SDK */
  initialize: (config?: Partial<WeChatConfig>) => Promise<void>
  /** 配置JS-SDK */
  configure: (jsConfig: WeChatJSConfig) => Promise<void>
  /** 开始认证 */
  startAuth: (redirectUri?: string) => Promise<void>
  /** 登出 */
  logout: () => Promise<void>

  // JS-SDK功能
  /** 分享到聊天 */
  shareToChat: (content: WeChatShareContent) => Promise<void>
  /** 分享到朋友圈 */
  shareToMoments: (content: WeChatShareContent) => Promise<void>
  /** 获取当前位置 */
  getCurrentLocation: (enableHighAccuracy?: boolean) => Promise<WeChatLocation>
  /** 选择图片 */
  chooseImage: (config?: Partial<WeChatImageConfig>) => Promise<string[]>
  /** 预览图片 */
  previewImage: (current: string, urls: string[]) => Promise<void>
  /** 扫描二维码 */
  scanQRCode: (needResult?: boolean) => Promise<string>
  /** 关闭窗口 */
  closeWindow: () => void

  // 工具方法
  /** 添加事件监听器 */
  addEventListener: <T = any>(type: WeChatEventType, callback: WeChatEventCallback<T>) => void
  /** 移除事件监听器 */
  removeEventListener: <T = any>(type: WeChatEventType, callback: WeChatEventCallback<T>) => void
  /** 清除错误 */
  clearError: () => void
}

/**
 * 企业微信Hook
 */
export function useWeChat(config?: UseWeChatConfig): UseWeChatReturn {
  const [initialized, setInitialized] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<WeChatUserInfo | null>(null)
  const [environment, setEnvironment] = useState<WeChatEnvironment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configRef = useRef<UseWeChatConfig | undefined>(config)
  const eventListenersRef = useRef<Map<WeChatEventType, Set<WeChatEventCallback>>>(new Map())

  // 错误处理
  const handleError = useCallback((err: any) => {
    const errorMessage = err instanceof Error ? err.message : String(err)
    setError(errorMessage)
    setLoading(false)
  }, [])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始化企业微信SDK
  const initialize = useCallback(async (initConfig?: Partial<WeChatConfig>) => {
    try {
      setLoading(true)
      setError(null)

      const finalConfig = { ...configRef.current, ...initConfig }
      if (!finalConfig) {
        throw new Error('WeChat config is required')
      }

      await weChatCore.initialize(finalConfig)
      setInitialized(true)
      setEnvironment(weChatCore.getEnvironment())

      // 如果设置了自动认证，则初始化认证服务
      if (finalConfig.autoAuth || finalConfig.silentAuth) {
        await weChatAuth.initialize({
          ...finalConfig,
          autoRedirect: finalConfig.autoAuth,
          silentAuth: finalConfig.silentAuth
        })

        const currentUser = weChatAuth.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setAuthenticated(true)
        }
      }

      setLoading(false)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // 配置JS-SDK
  const configure = useCallback(async (jsConfig: WeChatJSConfig) => {
    try {
      setLoading(true)
      setError(null)

      await weChatCore.configure(jsConfig)
      setConfigured(true)
      setLoading(false)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // 开始认证
  const startAuth = useCallback(async (redirectUri?: string) => {
    try {
      setLoading(true)
      setError(null)

      await weChatAuth.startAuth(redirectUri)
      setLoading(false)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // 登出
  const logout = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await weChatAuth.logout()
      setUser(null)
      setAuthenticated(false)
      setLoading(false)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // 分享到聊天
  const shareToChat = useCallback(async (content: WeChatShareContent) => {
    try {
      setError(null)
      await weChatCore.shareToChat(content)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // 分享到朋友圈
  const shareToMoments = useCallback(async (content: WeChatShareContent) => {
    try {
      setError(null)
      await weChatCore.shareToMoments(content)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // 获取当前位置
  const getCurrentLocation = useCallback(async (enableHighAccuracy: boolean = true) => {
    try {
      setError(null)
      return await weChatCore.getCurrentLocation(enableHighAccuracy)
    } catch (err) {
      handleError(err)
      throw err
    }
  }, [handleError])

  // 选择图片
  const chooseImage = useCallback(async (imageConfig?: Partial<WeChatImageConfig>) => {
    try {
      setError(null)
      return await weChatCore.chooseImage(imageConfig)
    } catch (err) {
      handleError(err)
      throw err
    }
  }, [handleError])

  // 预览图片
  const previewImage = useCallback(async (current: string, urls: string[]) => {
    try {
      setError(null)
      await weChatCore.previewImage(current, urls)
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  // 扫描二维码
  const scanQRCode = useCallback(async (needResult: boolean = true) => {
    try {
      setError(null)
      return await weChatCore.scanQRCode(needResult)
    } catch (err) {
      handleError(err)
      throw err
    }
  }, [handleError])

  // 关闭窗口
  const closeWindow = useCallback(() => {
    weChatCore.closeWindow()
  }, [])

  // 添加事件监听器
  const addEventListener = useCallback(<T = any>(
    type: WeChatEventType,
    callback: WeChatEventCallback<T>
  ) => {
    weChatCore.addEventListener(type, callback)
    
    // 保存到本地引用以便清理
    if (!eventListenersRef.current.has(type)) {
      eventListenersRef.current.set(type, new Set())
    }
    eventListenersRef.current.get(type)!.add(callback as WeChatEventCallback)
  }, [])

  // 移除事件监听器
  const removeEventListener = useCallback(<T = any>(
    type: WeChatEventType,
    callback: WeChatEventCallback<T>
  ) => {
    weChatCore.removeEventListener(type, callback)
    
    const listeners = eventListenersRef.current.get(type)
    if (listeners) {
      listeners.delete(callback as WeChatEventCallback)
    }
  }, [])

  // 监听SDK状态变化
  useEffect(() => {
    const handleReady = () => {
      setInitialized(true)
      setEnvironment(weChatCore.getEnvironment())
    }

    const handleError = (event: any) => {
      setError(event.data?.message || 'WeChat SDK error')
      setLoading(false)
    }

    const handleAuthSuccess = () => {
      const currentUser = weChatAuth.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        setAuthenticated(true)
      }
    }

    const handleAuthFailed = () => {
      setUser(null)
      setAuthenticated(false)
    }

    // 添加事件监听器
    weChatCore.addEventListener('ready', handleReady)
    weChatCore.addEventListener('error', handleError)
    weChatCore.addEventListener('authSuccess', handleAuthSuccess)
    weChatCore.addEventListener('authFailed', handleAuthFailed)

    return () => {
      // 清理事件监听器
      weChatCore.removeEventListener('ready', handleReady)
      weChatCore.removeEventListener('error', handleError)
      weChatCore.removeEventListener('authSuccess', handleAuthSuccess)
      weChatCore.removeEventListener('authFailed', handleAuthFailed)
    }
  }, [])

  // 自动初始化
  useEffect(() => {
    if (config?.autoInit && !initialized && !loading) {
      initialize()
    }
  }, [config?.autoInit, initialized, loading, initialize])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 清理所有注册的事件监听器
      eventListenersRef.current.forEach((listeners, type) => {
        listeners.forEach(callback => {
          weChatCore.removeEventListener(type, callback)
        })
      })
      eventListenersRef.current.clear()
    }
  }, [])

  return {
    // 状态
    initialized,
    configured,
    authenticated,
    user,
    environment,
    loading,
    error,

    // 核心功能
    initialize,
    configure,
    startAuth,
    logout,

    // JS-SDK功能
    shareToChat,
    shareToMoments,
    getCurrentLocation,
    chooseImage,
    previewImage,
    scanQRCode,
    closeWindow,

    // 工具方法
    addEventListener,
    removeEventListener,
    clearError
  }
}

/**
 * 企业微信认证Hook
 */
export function useWeChatAuth() {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<WeChatUserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 检查认证状态
  const checkAuth = useCallback(() => {
    const isAuth = weChatAuth.isAuthenticated()
    const currentUser = weChatAuth.getCurrentUser()
    
    setAuthenticated(isAuth)
    setUser(currentUser)
  }, [])

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const userInfo = await weChatAuth.refreshUserInfo()
      setUser(userInfo)
      setAuthenticated(true)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  // 登出
  const logout = useCallback(async () => {
    try {
      setLoading(true)
      await weChatAuth.logout()
      setUser(null)
      setAuthenticated(false)
      setError(null)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    authenticated,
    user,
    loading,
    error,
    checkAuth,
    refreshUser,
    logout
  }
}

/**
 * 企业微信环境检测Hook
 */
export function useWeChatEnvironment() {
  const [environment, setEnvironment] = useState<WeChatEnvironment | null>(null)

  useEffect(() => {
    const env = weChatCore.getEnvironment()
    setEnvironment(env)
  }, [])

  return {
    environment,
    isWeChatWork: environment?.isWeChatWork || false,
    isMobile: environment?.isMobile || false,
    supportJSSDK: environment?.supportJSSDK || false
  }
}