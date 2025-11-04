/**
 * 路由分离功能测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isMobileEnvironment,
  isWeChatWorkEnvironment,
  isMobileDevice,
  isMobileScreen,
  convertPCRouteToMobile,
  convertMobileRouteToPC,
  getHomeRoute,
  getLoginRoute,
  smartNavigate,
  shouldRedirectRoute,
  getPlatformInfo
} from '../utils'

// Mock window对象
const mockWindow = (width: number, userAgent: string, pathname: string = '/') => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent,
  })
  
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: {
      pathname,
    },
  })
}

describe('路由分离工具函数测试', () => {
  beforeEach(() => {
    // 重置为默认值
    mockWindow(1920, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '/')
  })

  describe('平台检测', () => {
    it('应该正确检测PC端环境', () => {
      mockWindow(1920, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(isMobileEnvironment()).toBe(false)
    })

    it('应该正确检测移动端屏幕尺寸', () => {
      mockWindow(375, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(isMobileEnvironment()).toBe(true)
    })

    it('应该正确检测企业微信环境', () => {
      mockWindow(1920, 'Mozilla/5.0 (Linux; Android 10; wxwork/4.0.8) AppleWebKit/537.36')
      expect(isWeChatWorkEnvironment()).toBe(true)
      expect(isMobileEnvironment()).toBe(true)
    })

    it('应该正确检测移动端路径', () => {
      mockWindow(1920, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '/mobile/home')
      expect(isMobileEnvironment()).toBe(true)
    })

    it('应该正确检测移动设备User-Agent', () => {
      mockWindow(1920, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(isMobileDevice()).toBe(true)
    })

    it('应该正确检测移动端屏幕', () => {
      mockWindow(768, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(isMobileScreen()).toBe(true)
      
      mockWindow(769, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(isMobileScreen()).toBe(false)
    })
  })

  describe('路由转换', () => {
    it('应该正确转换PC端路由到移动端', () => {
      expect(convertPCRouteToMobile('/')).toBe('/mobile/home')
      expect(convertPCRouteToMobile('/login')).toBe('/mobile/login')
      expect(convertPCRouteToMobile('/profile')).toBe('/mobile/profile')
      expect(convertPCRouteToMobile('/messages')).toBe('/mobile/messages')
      expect(convertPCRouteToMobile('/store-expansion/locations')).toBe('/mobile/expansion/locations')
      expect(convertPCRouteToMobile('/approval/pending')).toBe('/mobile/approvals/pending')
      expect(convertPCRouteToMobile('/unknown-route')).toBe('/mobile/home')
    })

    it('应该正确转换移动端路由到PC端', () => {
      expect(convertMobileRouteToPC('/mobile/')).toBe('/')
      expect(convertMobileRouteToPC('/mobile/home')).toBe('/')
      expect(convertMobileRouteToPC('/mobile/login')).toBe('/login')
      expect(convertMobileRouteToPC('/mobile/profile')).toBe('/profile')
      expect(convertMobileRouteToPC('/mobile/messages')).toBe('/messages')
      expect(convertMobileRouteToPC('/mobile/expansion/locations')).toBe('/store-expansion/locations')
      expect(convertMobileRouteToPC('/mobile/approvals/pending')).toBe('/approval/pending')
      expect(convertMobileRouteToPC('/mobile/unknown-route')).toBe('/')
    })
  })

  describe('智能路由', () => {
    it('PC端环境应该返回PC端路由', () => {
      mockWindow(1920, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(getHomeRoute()).toBe('/')
      expect(getLoginRoute()).toBe('/login')
    })

    it('移动端环境应该返回移动端路由', () => {
      mockWindow(375, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(getHomeRoute()).toBe('/mobile/home')
      expect(getLoginRoute()).toBe('/mobile/login')
    })

    it('智能导航应该根据平台选择正确路由', () => {
      // PC端环境
      mockWindow(1920, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(smartNavigate('/profile')).toBe('/profile')
      expect(smartNavigate('/mobile/profile')).toBe('/profile')

      // 移动端环境
      mockWindow(375, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(smartNavigate('/profile')).toBe('/mobile/profile')
      expect(smartNavigate('/mobile/profile')).toBe('/mobile/profile')
    })
  })

  describe('重定向检测', () => {
    it('移动端环境访问PC端路由应该需要重定向', () => {
      mockWindow(375, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
      expect(shouldRedirectRoute('/profile')).toBe(true)
      expect(shouldRedirectRoute('/mobile/profile')).toBe(false)
    })

    it('PC端环境访问移动端路由不需要重定向', () => {
      mockWindow(1920, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(shouldRedirectRoute('/profile')).toBe(false)
      expect(shouldRedirectRoute('/mobile/profile')).toBe(false)
    })
  })

  describe('平台信息', () => {
    it('应该正确获取平台信息', () => {
      mockWindow(375, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
      
      const info = getPlatformInfo()
      expect(info.isMobile).toBe(true)
      expect(info.isMobileDevice).toBe(true)
      expect(info.isMobileScreen).toBe(true)
      expect(info.isWeChatWork).toBe(false)
      expect(info.screenWidth).toBe(375)
      expect(info.userAgent).toContain('iPhone')
    })

    it('应该正确检测企业微信环境', () => {
      mockWindow(375, 'Mozilla/5.0 (Linux; Android 10; wxwork/4.0.8) AppleWebKit/537.36')
      
      const info = getPlatformInfo()
      expect(info.isMobile).toBe(true)
      expect(info.isWeChatWork).toBe(true)
    })
  })
})

describe('路由优先级测试', () => {
  it('URL路径优先级最高', () => {
    // PC端设备访问移动端路径
    mockWindow(1920, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '/mobile/home')
    expect(isMobileEnvironment()).toBe(true)
  })

  it('企业微信环境优先级高于设备检测', () => {
    // 大屏幕但是企业微信环境
    mockWindow(1920, 'Mozilla/5.0 (Linux; Android 10; wxwork/4.0.8) AppleWebKit/537.36')
    expect(isMobileEnvironment()).toBe(true)
  })

  it('移动设备检测优先级最低', () => {
    // 小屏幕且移动设备
    mockWindow(375, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
    expect(isMobileEnvironment()).toBe(true)
    
    // 小屏幕但非移动设备
    mockWindow(375, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    expect(isMobileEnvironment()).toBe(false)
  })
})