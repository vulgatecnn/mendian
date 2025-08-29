/**
 * 企业微信状态管理
 * 使用Zustand管理企业微信相关的全局状态
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useEffect } from 'react'

import { weChatCore } from '../services/wechat/core'
import { weChatAuth } from '../services/wechat/auth'
import { WeChatApiService } from '../services/wechat/api'

import type {
  WeChatConfig,
  WeChatJSConfig,
  WeChatUserInfo,
  WeChatDepartment,
  WeChatState
} from '../types/wechat'

/**
 * 扩展的企业微信状态
 */
interface ExtendedWeChatState extends WeChatState {
  // 异步操作状态
  initializationPromise: Promise<void> | null
  configurationPromise: Promise<void> | null
  authPromise: Promise<WeChatUserInfo> | null

  // 缓存数据
  jsConfig: WeChatJSConfig | null
  departments: WeChatDepartment[]
  lastSyncTime: string | null
  syncInProgress: boolean

  // 操作计数器
  shareCount: number
  scanCount: number
  locationRequestCount: number
}

/**
 * 企业微信Store接口
 */
interface WeChatStore extends ExtendedWeChatState {
  // 初始化方法
  initialize: (config: WeChatConfig) => Promise<void>
  configure: (jsConfig: WeChatJSConfig) => Promise<void>
  reset: () => void

  // 认证方法
  startAuth: (redirectUri?: string) => Promise<void>
  handleAuthCallback: (code: string, state: string) => Promise<WeChatUserInfo>
  silentAuth: () => Promise<WeChatUserInfo | null>
  logout: () => Promise<void>
  refreshUserInfo: () => Promise<WeChatUserInfo>

  // 用户和部门管理
  updateUserInfo: (user: WeChatUserInfo) => void
  loadDepartments: () => Promise<WeChatDepartment[]>
  syncContacts: (fullSync?: boolean) => Promise<void>
  searchUsers: (keyword: string) => Promise<WeChatUserInfo[]>

  // JS-SDK功能
  shareToChat: (title: string, desc: string, link: string, imgUrl?: string) => Promise<void>
  shareToMoments: (title: string, link: string, imgUrl?: string) => Promise<void>
  getCurrentLocation: (enableHighAccuracy?: boolean) => Promise<{ latitude: number; longitude: number }>
  chooseImage: (count?: number) => Promise<string[]>
  scanQRCode: () => Promise<string>

  // 状态管理
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setInitialized: (initialized: boolean) => void
  setConfigured: (configured: boolean) => void
  setAuthorized: (authorized: boolean) => void

  // 工具方法
  isWeChatEnvironment: () => boolean
  getAuthUrl: (redirectUri?: string) => string
  getAccessToken: () => string | null
}

/**
 * 创建企业微信Store
 */
export const useWeChatStore = create<WeChatStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      initialized: false,
      configured: false,
      authorized: false,
      currentUser: null,
      departments: [],
      environment: null,
      config: null,
      error: null,
      loading: false,

      // 扩展状态
      initializationPromise: null,
      configurationPromise: null,
      authPromise: null,
      jsConfig: null,
      lastSyncTime: null,
      syncInProgress: false,
      shareCount: 0,
      scanCount: 0,
      locationRequestCount: 0,

      // 初始化企业微信SDK
      initialize: async (config: WeChatConfig) => {
        const state = get()
        
        // 如果已经在初始化中，返回现有Promise
        if (state.initializationPromise) {
          return state.initializationPromise
        }

        const initPromise = (async () => {
          try {
            set({ loading: true, error: null, config })

            await weChatCore.initialize(config)
            const environment = weChatCore.getEnvironment()

            // 如果在企业微信环境中，获取JS配置
            let jsConfig: WeChatJSConfig | null = null
            if (environment?.supportJSSDK) {
              try {
                jsConfig = await WeChatApiService.getJSConfig({
                  url: window.location.href.split('#')[0],
                  agentId: config.agentId ?? ""
                })
              } catch (error) {
                // Failed to get JS config
              }
            }

            set({
              initialized: true,
              environment,
              jsConfig,
              loading: false,
              initializationPromise: null
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Initialization failed'
            set({
              error: errorMessage,
              loading: false,
              initializationPromise: null
            })
            throw error
          }
        })()

        set({ initializationPromise: initPromise })
        return initPromise
      },

      // 配置JS-SDK
      configure: async (jsConfig: WeChatJSConfig) => {
        const state = get()

        if (state.configurationPromise) {
          return state.configurationPromise
        }

        const configPromise = (async () => {
          try {
            set({ loading: true, error: null })

            await weChatCore.configure(jsConfig)

            set({
              configured: true,
              jsConfig,
              loading: false,
              configurationPromise: null
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Configuration failed'
            set({
              error: errorMessage,
              loading: false,
              configurationPromise: null
            })
            throw error
          }
        })()

        set({ configurationPromise: configPromise })
        return configPromise
      },

      // 重置状态
      reset: () => {
        weChatCore.destroy()
        weChatAuth.destroy()
        set({
          initialized: false,
          configured: false,
          authorized: false,
          currentUser: null,
          departments: [],
          environment: null,
          config: null,
          error: null,
          loading: false,
          initializationPromise: null,
          configurationPromise: null,
          authPromise: null,
          jsConfig: null,
          lastSyncTime: null,
          syncInProgress: false,
          shareCount: 0,
          scanCount: 0,
          locationRequestCount: 0
        })
      },

      // 开始认证
      startAuth: async (redirectUri?: string) => {
        try {
          set({ loading: true, error: null })
          await weChatAuth.startAuth(redirectUri)
          set({ loading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Auth start failed'
          set({ error: errorMessage, loading: false })
          throw error
        }
      },

      // 处理认证回调
      handleAuthCallback: async (code: string, state: string) => {
        const state_ = get()

        if (state_.authPromise) {
          return state_.authPromise
        }

        const authPromise = (async () => {
          try {
            set({ loading: true, error: null })

            const user = await weChatAuth.handleAuthCallback(code, state)

            set({
              authorized: true,
              currentUser: user,
              loading: false,
              authPromise: null
            })

            return user
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Auth callback failed'
            set({
              error: errorMessage,
              loading: false,
              authPromise: null
            })
            throw error
          }
        })()

        set({ authPromise })
        return authPromise
      },

      // 静默认证
      silentAuth: async () => {
        try {
          const user = await weChatAuth.silentAuth()
          if (user) {
            set({ authorized: true, currentUser: user })
          }
          return user
        } catch (error) {
          // Silent auth failed
          return null
        }
      },

      // 登出
      logout: async () => {
        try {
          set({ loading: true, error: null })
          await weChatAuth.logout()
          set({
            authorized: false,
            currentUser: null,
            loading: false
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Logout failed'
          set({ error: errorMessage, loading: false })
          throw error
        }
      },

      // 刷新用户信息
      refreshUserInfo: async () => {
        try {
          set({ loading: true, error: null })
          const user = await weChatAuth.refreshUserInfo()
          set({
            currentUser: user,
            loading: false
          })
          return user
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Refresh user info failed'
          set({ error: errorMessage, loading: false })
          throw error
        }
      },

      // 更新用户信息
      updateUserInfo: (user: WeChatUserInfo) => {
        set({ currentUser: user })
      },

      // 加载部门列表
      loadDepartments: async () => {
        try {
          set({ loading: true, error: null })
          const departments = await WeChatApiService.getDepartments()
          set({
            departments,
            loading: false
          })
          return departments
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Load departments failed'
          set({ error: errorMessage, loading: false })
          throw error
        }
      },

      // 同步通讯录
      syncContacts: async (fullSync = false) => {
        try {
          set({ syncInProgress: true, error: null })
          
          await WeChatApiService.syncContacts({ fullSync })
          const departments = await WeChatApiService.getDepartments()
          
          set({
            departments,
            lastSyncTime: new Date().toISOString(),
            syncInProgress: false
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync contacts failed'
          set({ error: errorMessage, syncInProgress: false })
          throw error
        }
      },

      // 搜索用户
      searchUsers: async (keyword: string) => {
        try {
          const response = await WeChatApiService.searchUsers({ keyword })
          return response.data || []
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Search users failed'
          set({ error: errorMessage })
          throw error
        }
      },

      // 分享到聊天
      shareToChat: async (title: string, desc: string, link: string, imgUrl?: string) => {
        try {
          await weChatCore.shareToChat({
            title,
            desc,
            link,
            imgUrl: imgUrl || ''
          })
          set(state => ({ shareCount: state.shareCount + 1 }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Share to chat failed'
          set({ error: errorMessage })
          throw error
        }
      },

      // 分享到朋友圈
      shareToMoments: async (title: string, link: string, imgUrl?: string) => {
        try {
          await weChatCore.shareToMoments({
            title,
            desc: title,
            link,
            imgUrl: imgUrl || ''
          })
          set(state => ({ shareCount: state.shareCount + 1 }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Share to moments failed'
          set({ error: errorMessage })
          throw error
        }
      },

      // 获取当前位置
      getCurrentLocation: async (enableHighAccuracy = true) => {
        try {
          const location = await weChatCore.getCurrentLocation(enableHighAccuracy)
          set(state => ({ locationRequestCount: state.locationRequestCount + 1 }))
          return {
            latitude: location.latitude,
            longitude: location.longitude
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Get location failed'
          set({ error: errorMessage })
          throw error
        }
      },

      // 选择图片
      chooseImage: async (count = 9) => {
        try {
          const images = await weChatCore.chooseImage({ count })
          return images
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Choose image failed'
          set({ error: errorMessage })
          throw error
        }
      },

      // 扫描二维码
      scanQRCode: async () => {
        try {
          const result = await weChatCore.scanQRCode(true)
          set(state => ({ scanCount: state.scanCount + 1 }))
          return result
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Scan QR code failed'
          set({ error: errorMessage })
          throw error
        }
      },

      // 状态管理方法
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      setInitialized: (initialized: boolean) => set({ initialized }),
      setConfigured: (configured: boolean) => set({ configured }),
      setAuthorized: (authorized: boolean) => set({ authorized }),

      // 工具方法
      isWeChatEnvironment: () => {
        const { environment } = get()
        return environment?.isWeChatWork || false
      },

      getAuthUrl: (redirectUri?: string) => {
        const { config } = get()
        if (!config) {
          throw new Error('WeChat not initialized')
        }
        return weChatCore.getAuthUrl(redirectUri)
      },

      getAccessToken: () => {
        return weChatAuth.getAccessToken()
      }
    }),
    {
      name: 'wechat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 只持久化必要的状态
        config: state.config,
        currentUser: state.currentUser,
        departments: state.departments,
        lastSyncTime: state.lastSyncTime,
        shareCount: state.shareCount,
        scanCount: state.scanCount,
        locationRequestCount: state.locationRequestCount
      })
    }
  )
)

/**
 * 企业微信初始化Hook
 */
export function useWeChatInit(config?: WeChatConfig) {
  const store = useWeChatStore()

  // 如果提供了配置且未初始化，则自动初始化
  useEffect(() => {
    if (config && !store.initialized && !store.loading) {
      store.initialize(config).catch(error => {
        console.error('WeChat initialization failed:', error)
      })
    }
  }, [config, store.initialized, store.loading, store.initialize])

  return store
}

// 导出类型
export type { WeChatStore, ExtendedWeChatState }