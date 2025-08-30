import React, { useState, useEffect } from 'react'
import { Grid } from 'antd'
import MainLayout from './MainLayout'
import MobileLayout from './MobileLayout'

const { useBreakpoint } = Grid

interface ResponsiveLayoutProps {
  children?: React.ReactNode
  forceMobile?: boolean
  forceDesktop?: boolean
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  forceMobile = false,
  forceDesktop = false
}) => {
  const screens = useBreakpoint()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 强制模式优先
    if (forceMobile) {
      setIsMobile(true)
      document.body.classList.add('mobile-layout')
      document.body.classList.remove('desktop-layout')
      return
    }

    if (forceDesktop) {
      setIsMobile(false)
      document.body.classList.add('desktop-layout')
      document.body.classList.remove('mobile-layout')
      return
    }

    // 根据屏幕尺寸判断 - 使用更准确的判断逻辑
    const width = window.innerWidth
    const shouldUseMobile = width < 768 || !screens.md
    
    setIsMobile(shouldUseMobile)

    // 设置全局CSS类
    if (shouldUseMobile) {
      document.body.classList.add('mobile-layout')
      document.body.classList.remove('desktop-layout')
      // 添加设备相关类名
      document.body.classList.add('device-mobile')
    } else {
      document.body.classList.add('desktop-layout')
      document.body.classList.remove('mobile-layout')
      document.body.classList.remove('device-mobile')
      // 添加桌面设备类名
      if (width >= 1024) {
        document.body.classList.add('device-desktop')
      } else {
        document.body.classList.add('device-tablet')
        document.body.classList.remove('device-desktop')
      }
    }
  }, [screens, forceMobile, forceDesktop])

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (forceMobile || forceDesktop) return

      const width = window.innerWidth
      const shouldUseMobile = width < 768

      if (shouldUseMobile !== isMobile) {
        setIsMobile(shouldUseMobile)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile, forceMobile, forceDesktop])

  // 渲染对应的布局组件
  return isMobile ? <MobileLayout /> : <MainLayout />
}

export default ResponsiveLayout
