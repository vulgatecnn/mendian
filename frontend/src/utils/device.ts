/**
 * 设备检测和移动端适配工具
 */

import { UAParser } from 'ua-parser-js'

/**
 * 设备类型
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * 屏幕尺寸断点
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600
} as const

/**
 * 设备信息接口
 */
export interface DeviceInfo {
  type: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWeChatWork: boolean
  isWeChat: boolean
  os: {
    name: string
    version: string
  }
  browser: {
    name: string
    version: string
  }
  screen: {
    width: number
    height: number
    pixelRatio: number
  }
  viewport: {
    width: number
    height: number
  }
  orientation: 'portrait' | 'landscape'
  touchSupported: boolean
}

/**
 * 获取设备信息
 */
export function getDeviceInfo(): DeviceInfo {
  const parser = new UAParser()
  const result = parser.getResult()
  const userAgent = navigator.userAgent.toLowerCase()
  
  // 检测设备类型
  const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                   result.device.type === 'mobile' ||
                   (window.innerWidth <= BREAKPOINTS.md)
  
  const isTablet = /tablet|ipad/i.test(userAgent) ||
                   result.device.type === 'tablet' ||
                   (window.innerWidth > BREAKPOINTS.md && window.innerWidth <= BREAKPOINTS.lg)
  
  const isDesktop = !isMobile && !isTablet
  
  const type: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  
  // 检测微信环境
  const isWeChatWork = /wxwork|wechatwork/i.test(userAgent)
  const isWeChat = /micromessenger/i.test(userAgent)
  
  // 屏幕信息
  const screen = {
    width: window.screen.width,
    height: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1
  }
  
  // 视口信息
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }
  
  // 屏幕方向
  const orientation: 'portrait' | 'landscape' = viewport.width > viewport.height ? 'landscape' : 'portrait'
  
  // 触摸支持
  const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  return {
    type,
    isMobile,
    isTablet,
    isDesktop,
    isWeChatWork,
    isWeChat,
    os: {
      name: result.os.name || 'unknown',
      version: result.os.version || 'unknown'
    },
    browser: {
      name: result.browser.name || 'unknown',
      version: result.browser.version || 'unknown'
    },
    screen,
    viewport,
    orientation,
    touchSupported
  }
}

/**
 * 检测是否为移动设备
 */
export function isMobile(): boolean {
  return getDeviceInfo().isMobile
}

/**
 * 检测是否为平板设备
 */
export function isTablet(): boolean {
  return getDeviceInfo().isTablet
}

/**
 * 检测是否为桌面设备
 */
export function isDesktop(): boolean {
  return getDeviceInfo().isDesktop
}

/**
 * 检测是否在企业微信中
 */
export function isWeChatWork(): boolean {
  return getDeviceInfo().isWeChatWork
}

/**
 * 检测是否在微信中
 */
export function isWeChat(): boolean {
  return getDeviceInfo().isWeChat
}

/**
 * 检测是否支持触摸
 */
export function isTouchDevice(): boolean {
  return getDeviceInfo().touchSupported
}

/**
 * 获取视口尺寸
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

/**
 * 获取当前屏幕方向
 */
export function getOrientation(): 'portrait' | 'landscape' {
  const { width, height } = getViewportSize()
  return width > height ? 'landscape' : 'portrait'
}

/**
 * 根据屏幕宽度获取断点类型
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS {
  const width = window.innerWidth
  
  if (width >= BREAKPOINTS.xxl) return 'xxl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

/**
 * 检查是否匹配指定断点
 */
export function matchBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return window.innerWidth >= BREAKPOINTS[breakpoint]
}

/**
 * 设置视口元标签
 */
export function setViewportMeta(): void {
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
  
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta')
    viewportMeta.name = 'viewport'
    document.head.appendChild(viewportMeta)
  }
  
  // 移动端优化的viewport设置
  if (isMobile()) {
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
  } else {
    viewportMeta.content = 'width=device-width, initial-scale=1.0'
  }
}

/**
 * 防止iOS Safari地址栏高度变化导致的布局问题
 */
export function fixIOSSafariViewportHeight(): void {
  if (!isMobile()) return
  
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  // 初始设置
  setViewportHeight()
  
  // 监听resize事件
  window.addEventListener('resize', setViewportHeight, { passive: true })
  
  // 监听orientationchange事件（iOS）
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100)
  }, { passive: true })
}

/**
 * 禁用移动端双击缩放
 */
export function disableMobileZoom(): void {
  if (!isTouchDevice()) return
  
  let lastTouchEnd = 0
  document.addEventListener('touchend', (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, { passive: false })
}

/**
 * 移动端优化的滚动处理
 */
export function optimizeMobileScroll(): void {
  if (!isMobile()) return
  
  // 添加 -webkit-overflow-scrolling: touch 样式
  const style = document.createElement('style')
  style.textContent = `
    .mobile-scroll {
      -webkit-overflow-scrolling: touch;
      overflow-scrolling: touch;
    }
    
    body {
      -webkit-text-size-adjust: 100%;
      -webkit-tap-highlight-color: transparent;
    }
  `
  document.head.appendChild(style)
  
  // 为可滚动元素添加mobile-scroll类
  const scrollableElements = document.querySelectorAll('[style*="overflow"], .ant-table-body, .ant-list-items')
  scrollableElements.forEach(el => {
    el.classList.add('mobile-scroll')
  })
}

/**
 * 获取安全区域内边距（用于处理刘海屏等）
 */
export function getSafeAreaInsets(): {
  top: number
  right: number
  bottom: number
  left: number
} {
  const style = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
  }
}

/**
 * 初始化移动端优化
 */
export function initMobileOptimization(): void {
  // 设置viewport元标签
  setViewportMeta()
  
  // 修复iOS Safari视口高度问题
  fixIOSSafariViewportHeight()
  
  // 禁用双击缩放
  disableMobileZoom()
  
  // 优化滚动
  optimizeMobileScroll()
  
  // 添加设备类型class到body
  const deviceInfo = getDeviceInfo()
  document.body.classList.add(`device-${deviceInfo.type}`)
  
  if (deviceInfo.isWeChatWork) {
    document.body.classList.add('wechat-work')
  }
  
  if (deviceInfo.isWeChat) {
    document.body.classList.add('wechat')
  }
  
  // 添加屏幕方向class
  const updateOrientationClass = () => {
    document.body.classList.remove('portrait', 'landscape')
    document.body.classList.add(getOrientation())
  }
  
  updateOrientationClass()
  window.addEventListener('orientationchange', updateOrientationClass, { passive: true })
  window.addEventListener('resize', updateOrientationClass, { passive: true })
}

/**
 * 创建响应式媒体查询监听器
 */
export function createMediaQueryListener(
  query: string,
  callback: (matches: boolean) => void
): () => void {
  const mediaQuery = window.matchMedia(query)
  
  // 初始调用
  callback(mediaQuery.matches)
  
  // 监听变化
  const listener = (e: MediaQueryListEvent) => callback(e.matches)
  
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  } else {
    // 兼容旧版浏览器
    mediaQuery.addListener(listener)
    return () => mediaQuery.removeListener(listener)
  }
}

/**
 * 监听断点变化
 */
export function watchBreakpoint(
  breakpoint: keyof typeof BREAKPOINTS,
  callback: (matches: boolean) => void
): () => void {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`
  return createMediaQueryListener(query, callback)
}

/**
 * 节流函数（用于resize事件优化）
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(globalThis, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

/**
 * 防抖函数（用于resize事件优化）
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(globalThis, args), delay)
  }) as T
}