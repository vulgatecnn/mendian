/**
 * 企业微信核心服务类
 * 负责企业微信JS-SDK的初始化、配置和基础功能调用
 */

import type {
  WeChatConfig,
  WeChatJSConfig,
  WeChatEnvironment,
  WeChatEventCallback,
  WeChatEventData,
  WeChatEventType,
  WeChatShareContent,
  WeChatLocation,
  WeChatImageConfig,
  WeChatContactConfig
} from '../../types/wechat'

import {
  detectWeChatEnvironment,
  generateAuthUrl,
  loadWeChatJSSDK,
  configWeChatJSSDK,
  checkJSSDKApi,
  handleWeChatError,
  retry,
  debugLog,
  storage
} from '../../utils/wechat'

/**
 * 企业微信核心服务类
 */
export class WeChatCore {
  private static instance: WeChatCore | null = null
  private config: WeChatConfig | null = null
  private environment: WeChatEnvironment | null = null
  private initialized: boolean = false
  private configured: boolean = false
  private eventListeners: Map<WeChatEventType, Set<WeChatEventCallback>> = new Map()
  private jsApiList: string[] = [
    'checkJsApi',
    'onMenuShareTimeline',
    'onMenuShareAppMessage',
    'onMenuShareQQ',
    'onMenuShareWeibo',
    'hideMenuItems',
    'showMenuItems',
    'hideAllNonBaseMenuItem',
    'showAllNonBaseMenuItem',
    'translateVoice',
    'startRecord',
    'stopRecord',
    'playVoice',
    'pauseVoice',
    'stopVoice',
    'uploadVoice',
    'downloadVoice',
    'chooseImage',
    'previewImage',
    'uploadImage',
    'downloadImage',
    'getNetworkType',
    'openLocation',
    'getLocation',
    'hideOptionMenu',
    'showOptionMenu',
    'closeWindow',
    'scanQRCode',
    'chooseWXPay',
    'openProductSpecificView',
    'addCard',
    'chooseCard',
    'openCard'
  ]

  /**
   * 获取单例实例
   */
  public static getInstance(): WeChatCore {
    if (!WeChatCore.instance) {
      WeChatCore.instance = new WeChatCore()
    }
    return WeChatCore.instance
  }

  /**
   * 私有构造函数，实现单例模式
   */
  private constructor() {
    this.environment = detectWeChatEnvironment()
    debugLog('WeChat environment detected', this.environment)
  }

  /**
   * 初始化企业微信SDK
   */
  public async initialize(config: WeChatConfig): Promise<void> {
    try {
      debugLog('Initializing WeChat SDK', config)
      
      // 保存配置
      this.config = config
      storage.set('wechat_config', config)

      // 检测环境
      this.environment = detectWeChatEnvironment()
      
      // 只在支持的环境中加载JS-SDK
      if (this.environment.supportJSSDK) {
        await this.loadAndConfigureSDK()
      }
      
      this.initialized = true
      this.emit('ready', { config, environment: this.environment })
      
      debugLog('WeChat SDK initialized successfully')
    } catch (error) {
      const wechatError = handleWeChatError(error, 'Initialize')
      this.emit('error', wechatError)
      throw wechatError
    }
  }

  /**
   * 配置企业微信JS-SDK
   */
  public async configure(jsConfig: WeChatJSConfig): Promise<void> {
    try {
      debugLog('Configuring WeChat JS-SDK', jsConfig)
      
      if (!window.wx) {
        await loadWeChatJSSDK()
      }
      
      await configWeChatJSSDK({
        ...jsConfig,
        jsApiList: [...this.jsApiList, ...(jsConfig.jsApiList || [])]
      })
      
      this.configured = true
      debugLog('WeChat JS-SDK configured successfully')
    } catch (error) {
      const wechatError = handleWeChatError(error, 'Configure')
      this.emit('error', wechatError)
      throw wechatError
    }
  }

  /**
   * 获取授权URL
   */
  public getAuthUrl(redirectUri?: string): string {
    if (!this.config) {
      throw new Error('WeChat SDK not initialized')
    }
    
    const finalConfig = redirectUri ? 
      { ...this.config, redirectUri } : 
      this.config
      
    return generateAuthUrl(finalConfig)
  }

  /**
   * 跳转到授权页面
   */
  public redirectToAuth(redirectUri?: string): void {
    const authUrl = this.getAuthUrl(redirectUri)
    debugLog('Redirecting to auth URL', authUrl)
    window.location.href = authUrl
  }

  /**
   * 分享到聊天
   */
  public async shareToChat(content: WeChatShareContent): Promise<void> {
    return this.executeWithRetry('shareToChat', async () => {
      if (!this.ensureConfigured()) return

      return new Promise((resolve, reject) => {
        window.wx.onMenuShareAppMessage({
          title: content.title,
          desc: content.desc,
          link: content.link,
          imgUrl: content.imgUrl,
          success: () => {
            this.emit('shareSuccess', content)
            resolve()
          },
          cancel: () => {
            this.emit('shareFailed', new Error('Share cancelled by user'))
            resolve() // 用户取消也算作成功处理
          },
          fail: (res: any) => {
            const error = handleWeChatError(res, 'Share to chat')
            this.emit('shareFailed', error)
            reject(error)
          }
        })
      })
    })
  }

  /**
   * 分享到朋友圈
   */
  public async shareToMoments(content: WeChatShareContent): Promise<void> {
    return this.executeWithRetry('shareToMoments', async () => {
      if (!this.ensureConfigured()) return

      return new Promise((resolve, reject) => {
        window.wx.onMenuShareTimeline({
          title: content.title,
          link: content.link,
          imgUrl: content.imgUrl,
          success: () => {
            this.emit('shareSuccess', content)
            resolve()
          },
          cancel: () => {
            this.emit('shareFailed', new Error('Share cancelled by user'))
            resolve()
          },
          fail: (res: any) => {
            const error = handleWeChatError(res, 'Share to moments')
            this.emit('shareFailed', error)
            reject(error)
          }
        })
      })
    })
  }

  /**
   * 获取当前位置
   */
  public async getCurrentLocation(enableHighAccuracy: boolean = true): Promise<WeChatLocation> {
    return this.executeWithRetry('getCurrentLocation', async () => {
      if (!this.ensureConfigured()) throw new Error('WeChat SDK not configured')

      return new Promise((resolve, reject) => {
        window.wx.getLocation({
          type: 'wgs84',
          enableHighAccuracy,
          success: (res: any) => {
            const location: WeChatLocation = {
              latitude: res.latitude,
              longitude: res.longitude,
              speed: res.speed || 0,
              accuracy: res.accuracy || 0
            }
            this.emit('locationSuccess', location)
            resolve(location)
          },
          cancel: () => {
            const error = new Error('Location cancelled by user')
            this.emit('locationFailed', error)
            reject(error)
          },
          fail: (res: any) => {
            const error = handleWeChatError(res, 'Get location')
            this.emit('locationFailed', error)
            reject(error)
          }
        })
      })
    })
  }

  /**
   * 选择图片
   */
  public async chooseImage(config: Partial<WeChatImageConfig> = {}): Promise<string[]> {
    return this.executeWithRetry('chooseImage', async () => {
      if (!this.ensureConfigured()) throw new Error('WeChat SDK not configured')

      const finalConfig: WeChatImageConfig = {
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        ...config
      }

      return new Promise((resolve, reject) => {
        window.wx.chooseImage({
          count: finalConfig.count,
          sizeType: finalConfig.sizeType,
          sourceType: finalConfig.sourceType,
          success: (res: any) => {
            const imageIds = res.localIds || []
            this.emit('imageSuccess', imageIds)
            resolve(imageIds)
          },
          fail: (res: any) => {
            const error = handleWeChatError(res, 'Choose image')
            this.emit('imageFailed', error)
            reject(error)
          }
        })
      })
    })
  }

  /**
   * 预览图片
   */
  public async previewImage(current: string, urls: string[]): Promise<void> {
    return this.executeWithRetry('previewImage', async () => {
      if (!this.ensureConfigured()) return

      return new Promise((resolve, reject) => {
        window.wx.previewImage({
          current,
          urls,
          success: () => resolve(),
          fail: (res: any) => {
            const error = handleWeChatError(res, 'Preview image')
            reject(error)
          }
        })
      })
    })
  }

  /**
   * 扫描二维码
   */
  public async scanQRCode(needResult: boolean = true): Promise<string> {
    return this.executeWithRetry('scanQRCode', async () => {
      if (!this.ensureConfigured()) throw new Error('WeChat SDK not configured')

      return new Promise((resolve, reject) => {
        window.wx.scanQRCode({
          needResult: needResult ? 1 : 0,
          scanType: ['qrCode', 'barCode'],
          success: (res: any) => {
            const result = res.resultStr || ''
            resolve(result)
          },
          fail: (res: any) => {
            const error = handleWeChatError(res, 'Scan QR code')
            reject(error)
          }
        })
      })
    })
  }

  /**
   * 关闭当前窗口
   */
  public closeWindow(): void {
    if (this.ensureConfigured()) {
      window.wx.closeWindow()
    }
  }

  /**
   * 隐藏右上角菜单
   */
  public hideOptionMenu(): void {
    if (this.ensureConfigured()) {
      window.wx.hideOptionMenu()
    }
  }

  /**
   * 显示右上角菜单
   */
  public showOptionMenu(): void {
    if (this.ensureConfigured()) {
      window.wx.showOptionMenu()
    }
  }

  /**
   * 检查接口权限
   */
  public async checkApiPermissions(): Promise<Record<string, boolean>> {
    if (!this.ensureConfigured()) {
      throw new Error('WeChat SDK not configured')
    }
    
    return checkJSSDKApi(this.jsApiList)
  }

  /**
   * 添加事件监听器
   */
  public addEventListener<T = any>(type: WeChatEventType, callback: WeChatEventCallback<T>): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(callback as WeChatEventCallback)
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener<T = any>(type: WeChatEventType, callback: WeChatEventCallback<T>): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(callback as WeChatEventCallback)
    }
  }

  /**
   * 移除所有事件监听器
   */
  public removeAllEventListeners(type?: WeChatEventType): void {
    if (type) {
      this.eventListeners.delete(type)
    } else {
      this.eventListeners.clear()
    }
  }

  /**
   * 触发事件
   */
  private emit<T = any>(type: WeChatEventType, data: T): void {
    const event: WeChatEventData<T> = {
      type,
      data,
      timestamp: Date.now(),
      error: (data instanceof Error ? data.message : undefined) as string | undefined
    }

    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          debugLog(`Event listener error for ${type}`, error)
        }
      })
    }

    debugLog(`Event emitted: ${type}`, data)
  }

  /**
   * 获取当前配置
   */
  public getConfig(): WeChatConfig | null {
    return this.config
  }

  /**
   * 获取环境信息
   */
  public getEnvironment(): WeChatEnvironment | null {
    return this.environment
  }

  /**
   * 检查是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 检查是否已配置
   */
  public isConfigured(): boolean {
    return this.configured
  }

  /**
   * 检查是否在企业微信环境中
   */
  public isWeChatEnvironment(): boolean {
    return this.environment?.isWeChatWork || false
  }

  /**
   * 销毁实例（用于测试或重置）
   */
  public destroy(): void {
    this.removeAllEventListeners()
    this.config = null
    this.environment = null
    this.initialized = false
    this.configured = false
    storage.remove('wechat_config')
    WeChatCore.instance = null
    debugLog('WeChat SDK instance destroyed')
  }

  /**
   * 加载并配置SDK（私有方法）
   */
  private async loadAndConfigureSDK(): Promise<void> {
    await loadWeChatJSSDK()
    debugLog('WeChat JS-SDK loaded')
  }

  /**
   * 确保SDK已配置
   */
  private ensureConfigured(): boolean {
    if (!this.configured || !window.wx) {
      debugLog('WeChat SDK not configured or wx object not available')
      return false
    }
    return true
  }

  /**
   * 带重试机制执行操作
   */
  private async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    return retry(fn, maxAttempts, 1000).catch(error => {
      debugLog(`Operation ${operation} failed after ${maxAttempts} attempts`, error)
      throw handleWeChatError(error, operation)
    })
  }
}

// 导出单例实例
export const weChatCore = WeChatCore.getInstance()

// 全局类型声明
declare global {
  interface Window {
    wx: any
  }
}