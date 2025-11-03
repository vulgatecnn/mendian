/**
 * 企业微信集成 API 服务
 */
import request from './request'

/**
 * 企业微信认证参数
 */
export interface WeChatAuthParams {
  code: string
  state?: string
}

/**
 * 企业微信认证响应
 */
export interface WeChatAuthResponse {
  access_token: string
  expires_in: number
  user_info: {
    userid: string
    name: string
    department: number[]
    mobile: string
    email: string
  }
}

/**
 * 企业微信配置信息
 */
export interface WeChatConfig {
  corp_id: string
  agent_id: string
  redirect_uri: string
}

/**
 * 消息推送参数
 */
export interface MessagePushParams {
  user_ids?: string[]
  department_ids?: number[]
  content: string
  msg_type?: 'text' | 'textcard'
}

/**
 * 企业微信服务类
 */
export class WeChatService {
  /**
   * 获取企业微信配置
   */
  static async getConfig(): Promise<WeChatConfig> {
    return request.get('/wechat/config/')
  }

  /**
   * 企业微信OAuth认证
   */
  static async authenticate(params: WeChatAuthParams): Promise<WeChatAuthResponse> {
    return request.post('/wechat/auth/', params)
  }

  /**
   * 获取企业微信授权URL
   */
  static async getAuthUrl(redirectUri: string, state?: string): Promise<string> {
    const config = await this.getConfig()
    const encodedRedirectUri = encodeURIComponent(redirectUri)
    const stateParam = state || 'STATE'
    
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.corp_id}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=snsapi_base&state=${stateParam}#wechat_redirect`
  }

  /**
   * 检查是否在企业微信环境中
   */
  static isWeChatEnvironment(): boolean {
    const ua = navigator.userAgent.toLowerCase()
    return ua.includes('wxwork')
  }

  /**
   * 获取企业微信JS-SDK配置
   */
  static async getJsApiConfig(url: string): Promise<any> {
    return request.post('/wechat/jsapi-config/', { url })
  }

  /**
   * 初始化企业微信JS-SDK
   */
  static async initJsApi(url: string): Promise<void> {
    if (!this.isWeChatEnvironment()) {
      console.warn('当前不在企业微信环境中')
      return
    }

    try {
      const config = await this.getJsApiConfig(url)
      
      // 使用企业微信JS-SDK
      if (window.wx) {
        window.wx.config({
          beta: true,
          debug: false,
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: [
            'onMenuShareTimeline',
            'onMenuShareAppMessage',
            'scanQRCode',
            'chooseImage',
            'uploadImage',
            'getLocation'
          ]
        })

        window.wx.ready(() => {
          console.log('企业微信JS-SDK初始化成功')
        })

        window.wx.error((res: any) => {
          console.error('企业微信JS-SDK初始化失败:', res)
        })
      }
    } catch (error) {
      console.error('初始化企业微信JS-SDK失败:', error)
    }
  }

  /**
   * 扫描二维码
   */
  static async scanQRCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.wx) {
        reject(new Error('企业微信JS-SDK未加载'))
        return
      }

      window.wx.scanQRCode({
        needResult: 1,
        scanType: ['qrCode', 'barCode'],
        success: (res: any) => {
          resolve(res.resultStr)
        },
        fail: (err: any) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 获取地理位置
   */
  static async getLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!window.wx) {
        reject(new Error('企业微信JS-SDK未加载'))
        return
      }

      window.wx.getLocation({
        type: 'gcj02',
        success: (res: any) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude
          })
        },
        fail: (err: any) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 选择图片
   */
  static async chooseImage(count: number = 1): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!window.wx) {
        reject(new Error('企业微信JS-SDK未加载'))
        return
      }

      window.wx.chooseImage({
        count,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res: any) => {
          resolve(res.localIds)
        },
        fail: (err: any) => {
          reject(err)
        }
      })
    })
  }
}

// 扩展 Window 接口以支持企业微信 JS-SDK
declare global {
  interface Window {
    wx?: {
      config: (config: any) => void
      ready: (callback: () => void) => void
      error: (callback: (res: any) => void) => void
      scanQRCode: (config: any) => void
      getLocation: (config: any) => void
      chooseImage: (config: any) => void
      uploadImage: (config: any) => void
    }
  }
}

export default WeChatService
