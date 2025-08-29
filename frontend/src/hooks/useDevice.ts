/**
 * 设备检测React Hook
 */

import { useState, useEffect } from 'react'
import {
  getDeviceInfo,
  getViewportSize,
  getCurrentBreakpoint,
  getOrientation,
  watchBreakpoint,
  createMediaQueryListener,
  throttle,
  type DeviceInfo,
  BREAKPOINTS
} from '../utils/device'

/**
 * 设备信息Hook
 */
export function useDevice() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo())

  useEffect(() => {
    const updateDeviceInfo = throttle(() => {
      setDeviceInfo(getDeviceInfo())
    }, 100)

    window.addEventListener('resize', updateDeviceInfo, { passive: true })
    window.addEventListener('orientationchange', updateDeviceInfo, { passive: true })

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

/**
 * 视口尺寸Hook
 */
export function useViewport() {
  const [viewport, setViewport] = useState(() => getViewportSize())

  useEffect(() => {
    const updateViewport = throttle(() => {
      setViewport(getViewportSize())
    }, 100)

    window.addEventListener('resize', updateViewport, { passive: true })
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return viewport
}

/**
 * 屏幕方向Hook
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState(() => getOrientation())

  useEffect(() => {
    const updateOrientation = () => {
      // 延迟更新，等待屏幕旋转完成
      setTimeout(() => {
        setOrientation(getOrientation())
      }, 100)
    }

    window.addEventListener('orientationchange', updateOrientation, { passive: true })
    window.addEventListener('resize', updateOrientation, { passive: true })

    return () => {
      window.removeEventListener('orientationchange', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
    }
  }, [])

  return orientation
}

/**
 * 断点匹配Hook
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => getCurrentBreakpoint())
  const [matches, setMatches] = useState(() => {
    const current = getCurrentBreakpoint()
    return {
      xs: current === 'xs',
      sm: ['xs', 'sm'].includes(current),
      md: ['xs', 'sm', 'md'].includes(current),
      lg: ['xs', 'sm', 'md', 'lg'].includes(current),
      xl: ['xs', 'sm', 'md', 'lg', 'xl'].includes(current),
      xxl: true
    }
  })

  useEffect(() => {
    const updateBreakpoint = throttle(() => {
      const current = getCurrentBreakpoint()
      setBreakpoint(current)
      setMatches({
        xs: current === 'xs',
        sm: ['xs', 'sm'].includes(current),
        md: ['xs', 'sm', 'md'].includes(current),
        lg: ['xs', 'sm', 'md', 'lg'].includes(current),
        xl: ['xs', 'sm', 'md', 'lg', 'xl'].includes(current),
        xxl: true
      })
    }, 100)

    window.addEventListener('resize', updateBreakpoint, { passive: true })
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return { breakpoint, ...matches }
}

/**
 * 媒体查询Hook
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const cleanup = createMediaQueryListener(query, setMatches)
    return cleanup
  }, [query])

  return matches
}

/**
 * 移动端检测Hook
 */
export function useMobile() {
  const device = useDevice()
  return device.isMobile
}

/**
 * 平板检测Hook
 */
export function useTablet() {
  const device = useDevice()
  return device.isTablet
}

/**
 * 桌面端检测Hook
 */
export function useDesktop() {
  const device = useDevice()
  return device.isDesktop
}

/**
 * 触摸支持检测Hook
 */
export function useTouch() {
  const device = useDevice()
  return device.touchSupported
}

/**
 * 企业微信环境检测Hook
 */
export function useWeChatWork() {
  const device = useDevice()
  return device.isWeChatWork
}

/**
 * 微信环境检测Hook
 */
export function useWeChat() {
  const device = useDevice()
  return device.isWeChat
}

/**
 * 响应式断点Hook
 * @param breakpoint 断点名称
 */
export function useResponsive(breakpoint: keyof typeof BREAKPOINTS) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= BREAKPOINTS[breakpoint]
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const cleanup = watchBreakpoint(breakpoint, setMatches)
    return cleanup
  }, [breakpoint])

  return matches
}

/**
 * 多断点响应式Hook
 */
export function useResponsiveBreakpoints() {
  const [breakpoints, setBreakpoints] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        xs: false,
        sm: false,
        md: false,
        lg: false,
        xl: false,
        xxl: false
      }
    }

    const width = window.innerWidth
    return {
      xs: width >= BREAKPOINTS.xs,
      sm: width >= BREAKPOINTS.sm,
      md: width >= BREAKPOINTS.md,
      lg: width >= BREAKPOINTS.lg,
      xl: width >= BREAKPOINTS.xl,
      xxl: width >= BREAKPOINTS.xxl
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateBreakpoints = throttle(() => {
      const width = window.innerWidth
      setBreakpoints({
        xs: width >= BREAKPOINTS.xs,
        sm: width >= BREAKPOINTS.sm,
        md: width >= BREAKPOINTS.md,
        lg: width >= BREAKPOINTS.lg,
        xl: width >= BREAKPOINTS.xl,
        xxl: width >= BREAKPOINTS.xxl
      })
    }, 100)

    window.addEventListener('resize', updateBreakpoints, { passive: true })
    return () => window.removeEventListener('resize', updateBreakpoints)
  }, [])

  return breakpoints
}

/**
 * 设备类型Hook（简化版）
 */
export function useDeviceType() {
  const device = useDevice()
  return {
    isMobile: device.isMobile,
    isTablet: device.isTablet,
    isDesktop: device.isDesktop,
    type: device.type
  }
}

/**
 * 屏幕信息Hook
 */
export function useScreen() {
  const device = useDevice()
  const viewport = useViewport()
  const orientation = useOrientation()

  return {
    screen: device.screen,
    viewport,
    orientation,
    pixelRatio: device.screen.pixelRatio
  }
}

/**
 * 浏览器信息Hook
 */
export function useBrowser() {
  const device = useDevice()
  return {
    ...device.browser,
    os: device.os,
    isWeChatWork: device.isWeChatWork,
    isWeChat: device.isWeChat
  }
}