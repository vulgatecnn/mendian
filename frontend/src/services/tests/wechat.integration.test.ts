/**
 * 企业微信集成测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { weChatCore } from '../wechat/core'
import { weChatAuth } from '../wechat/auth'
import { WeChatApiService } from '../wechat/api'
import type { WeChatConfig, WeChatJSConfig, WeChatUserInfo } from '../../types/wechat'

// Mock 企业微信JS-SDK
Object.defineProperty(window, 'wx', {
  value: {
    config: vi.fn(),
    ready: vi.fn(),
    error: vi.fn(),
    checkJsApi: vi.fn(),
    onMenuShareAppMessage: vi.fn(),
    onMenuShareTimeline: vi.fn(),
    getLocation: vi.fn(),
    chooseImage: vi.fn(),
    previewImage: vi.fn(),
    scanQRCode: vi.fn(),
    closeWindow: vi.fn(),
    hideOptionMenu: vi.fn(),
    showOptionMenu: vi.fn(),
    getNetworkType: vi.fn()
  },
  writable: true
})

// Mock fetch
global.fetch = vi.fn()

describe('企业微信集成测试', () => {
  const mockConfig: WeChatConfig = {
    corpId: 'wx_test_corp_id',
    agentId: 'test_agent_id',
    redirectUri: 'http://localhost:3000/auth/callback',
    scope: 'snsapi_base',
    state: 'test_state'
  }

  const mockJSConfig: WeChatJSConfig = {
    debug: true,
    corpId: 'wx_test_corp_id',
    timestamp: '1234567890',
    nonceStr: 'test_nonce',
    signature: 'test_signature',
    jsApiList: ['checkJsApi', 'getLocation', 'chooseImage']
  }

  const mockUser: WeChatUserInfo = {
    userid: 'test_user_001',
    name: '测试用户',
    department: [1, 2],
    mobile: '13800138000',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    position: '测试工程师',
    gender: '1',
    status: 1
  }

  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks()
    
    // 重置实例状态
    weChatCore.destroy()
    weChatAuth.destroy()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('WeChat Core 测试', () => {
    it('应该正确初始化企业微信SDK', async () => {
      // 模拟SDK加载成功
      const mockScript = document.createElement('script')
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript)
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => {
        // 模拟脚本加载完成
        setTimeout(() => {
          mockScript.onload?.(new Event('load'))
        }, 0)
        return mockScript
      })

      await expect(weChatCore.initialize(mockConfig)).resolves.toBeUndefined()
      
      expect(weChatCore.isInitialized()).toBe(true)
      expect(weChatCore.getConfig()).toEqual(mockConfig)
    })

    it('应该正确配置JS-SDK', async () => {
      // 先初始化
      await weChatCore.initialize(mockConfig)
      
      // 模拟wx.ready回调
      ;(window.wx.config as any).mockImplementation((config: any) => {
        setTimeout(() => {
          window.wx.ready()
        }, 0)
      })

      await expect(weChatCore.configure(mockJSConfig)).resolves.toBeUndefined()
      
      expect(window.wx.config).toHaveBeenCalledWith(
        expect.objectContaining({
          debug: true,
          appId: mockJSConfig.corpId,
          timestamp: mockJSConfig.timestamp,
          nonceStr: mockJSConfig.nonceStr,
          signature: mockJSConfig.signature
        })
      )
      
      expect(weChatCore.isConfigured()).toBe(true)
    })

    it('应该能够分享到聊天', async () => {
      await weChatCore.initialize(mockConfig)
      await weChatCore.configure(mockJSConfig)

      const shareContent = {
        title: '测试标题',
        desc: '测试描述',
        link: 'https://example.com',
        imgUrl: 'https://example.com/image.jpg'
      }

      // 模拟分享成功
      ;(window.wx.onMenuShareAppMessage as any).mockImplementation((config: any) => {
        setTimeout(() => {
          config.success()
        }, 0)
      })

      await expect(weChatCore.shareToChat(shareContent)).resolves.toBeUndefined()
      
      expect(window.wx.onMenuShareAppMessage).toHaveBeenCalledWith(
        expect.objectContaining(shareContent)
      )
    })

    it('应该能够获取当前位置', async () => {
      await weChatCore.initialize(mockConfig)
      await weChatCore.configure(mockJSConfig)

      const mockLocation = {
        latitude: 39.908859,
        longitude: 116.397436,
        speed: 0,
        accuracy: 10
      }

      // 模拟获取位置成功
      ;(window.wx.getLocation as any).mockImplementation((config: any) => {
        setTimeout(() => {
          config.success(mockLocation)
        }, 0)
      })

      const location = await weChatCore.getCurrentLocation()
      
      expect(location).toEqual(mockLocation)
      expect(window.wx.getLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'wgs84',
          enableHighAccuracy: true
        })
      )
    })
  })

  describe('WeChat Auth 测试', () => {
    beforeEach(async () => {
      // Mock HTTP请求
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'test_access_token',
            refreshToken: 'test_refresh_token',
            tokenType: 'Bearer',
            expiresIn: 7200,
            user: mockUser
          }
        })
      })
    })

    it('应该能够处理授权回调', async () => {
      const code = 'test_auth_code'
      const state = 'test_state'

      const user = await weChatAuth.handleAuthCallback(code, state)
      
      expect(user).toEqual(mockUser)
      expect(weChatAuth.isAuthenticated()).toBe(true)
      expect(weChatAuth.getCurrentUser()).toEqual(mockUser)
    })

    it('应该能够获取授权URL', () => {
      const authUrl = weChatAuth.getAuthUrl()
      
      expect(authUrl).toContain('open.weixin.qq.com/connect/oauth2/authorize')
      expect(authUrl).toContain(`appid=${mockConfig.corpId}`)
      expect(authUrl).toContain(`agentid=${mockConfig.agentId}`)
      expect(authUrl).toContain('response_type=code')
    })

    it('应该能够刷新用户信息', async () => {
      // 先登录
      await weChatAuth.handleAuthCallback('test_code', 'test_state')
      
      const refreshedUser = { ...mockUser, name: '更新后的用户' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: refreshedUser
        })
      })

      const user = await weChatAuth.refreshUserInfo()
      
      expect(user).toEqual(refreshedUser)
      expect(weChatAuth.getCurrentUser()).toEqual(refreshedUser)
    })

    it('应该能够登出', async () => {
      // 先登录
      await weChatAuth.handleAuthCallback('test_code', 'test_state')
      expect(weChatAuth.isAuthenticated()).toBe(true)

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      await weChatAuth.logout()
      
      expect(weChatAuth.isAuthenticated()).toBe(false)
      expect(weChatAuth.getCurrentUser()).toBeNull()
    })
  })

  describe('WeChat API Service 测试', () => {
    beforeEach(() => {
      // Mock HTTP请求
      (global.fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('/js-config')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: mockJSConfig
            })
          }
        }
        
        if (url.includes('/departments')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: [
                { id: 1, name: '总部', parentid: 0, order: 1 },
                { id: 2, name: '技术部', parentid: 1, order: 1 },
                { id: 3, name: '商务部', parentid: 1, order: 2 }
              ]
            })
          }
        }
        
        if (url.includes('/sync-contacts')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                userCount: 10,
                departmentCount: 3,
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                status: 'success'
              }
            })
          }
        }

        return {
          ok: true,
          json: async () => ({ success: true, data: null })
        }
      })
    })

    it('应该能够获取JS配置', async () => {
      const config = await WeChatApiService.getJSConfig({
        url: 'http://example.com',
        agentId: 'test_agent'
      })
      
      expect(config).toEqual(mockJSConfig)
    })

    it('应该能够获取部门列表', async () => {
      const departments = await WeChatApiService.getDepartments()
      
      expect(departments).toHaveLength(3)
      expect(departments[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: '总部',
          parentid: 0,
          order: 1
        })
      )
    })

    it('应该能够同步联系人', async () => {
      const result = await WeChatApiService.syncContacts({ fullSync: true })
      
      expect(result).toEqual(
        expect.objectContaining({
          userCount: 10,
          departmentCount: 3,
          status: 'success'
        })
      )
    })

    it('应该能够发送文本消息', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { msgId: 'test_msg_id' }
        })
      })

      const msgId = await WeChatApiService.sendTextMessage(
        '测试消息',
        ['user1', 'user2'],
        [1, 2]
      )
      
      expect(msgId).toBe('test_msg_id')
    })
  })

  describe('集成场景测试', () => {
    it('应该能够完成完整的认证流程', async () => {
      // 1. 初始化SDK
      await weChatCore.initialize(mockConfig)
      expect(weChatCore.isInitialized()).toBe(true)

      // 2. 配置JS-SDK
      ;(window.wx.config as any).mockImplementation((config: any) => {
        setTimeout(() => window.wx.ready(), 0)
      })
      await weChatCore.configure(mockJSConfig)
      expect(weChatCore.isConfigured()).toBe(true)

      // 3. 模拟用户授权
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'test_token',
            refreshToken: 'test_refresh',
            tokenType: 'Bearer',
            expiresIn: 7200,
            user: mockUser
          }
        })
      })

      // 4. 处理授权回调
      const user = await weChatAuth.handleAuthCallback('test_code', 'test_state')
      expect(user).toEqual(mockUser)
      expect(weChatAuth.isAuthenticated()).toBe(true)

      // 5. 测试JS-SDK功能
      ;(window.wx.getLocation as any).mockImplementation((config: any) => {
        setTimeout(() => {
          config.success({
            latitude: 39.908859,
            longitude: 116.397436,
            speed: 0,
            accuracy: 10
          })
        }, 0)
      })

      const location = await weChatCore.getCurrentLocation()
      expect(location).toBeDefined()
      expect(location.latitude).toBe(39.908859)
    })

    it('应该能够处理错误情况', async () => {
      // 测试初始化失败
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        const mockScript = document.createElement('script')
        setTimeout(() => {
          mockScript.onerror?.(new Event('error'))
        }, 0)
        return mockScript
      })

      await expect(weChatCore.initialize(mockConfig)).rejects.toThrow()
      
      // 测试认证失败
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          message: 'Authentication failed'
        })
      })

      await expect(
        weChatAuth.handleAuthCallback('invalid_code', 'invalid_state')
      ).rejects.toThrow()
    })

    it('应该能够处理网络错误', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(WeChatApiService.getDepartments()).rejects.toThrow('Network error')
    })
  })
})

// 工具函数测试
describe('企业微信工具函数测试', () => {
  it('应该正确生成授权URL', () => {
    const { generateAuthUrl } = require('../../utils/wechat')
    
    const url = generateAuthUrl(mockConfig)
    
    expect(url).toContain('open.weixin.qq.com/connect/oauth2/authorize')
    expect(url).toContain(`appid=${mockConfig.corpId}`)
    expect(url).toContain(`redirect_uri=${encodeURIComponent(mockConfig.redirectUri)}`)
    expect(url).toContain(`agentid=${mockConfig.agentId}`)
  })

  it('应该正确检测企业微信环境', () => {
    const { detectWeChatEnvironment } = require('../../utils/wechat')
    
    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/3.0.0 MicroMessenger/8.0.0 Language/zh',
      configurable: true
    })

    const env = detectWeChatEnvironment()
    
    expect(env.isWeChatWork).toBe(true)
    expect(env.isMobile).toBe(true)
    expect(env.supportJSSDK).toBe(true)
  })
})