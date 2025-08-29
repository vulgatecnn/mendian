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
      return
    }

    if (forceDesktop) {
      setIsMobile(false)
      return
    }

    // 根据屏幕尺寸判断
    // md断点以下(768px)使用移动端布局
    const shouldUseMobile = !screens.md
    setIsMobile(shouldUseMobile)

    // 设置全局CSS类
    if (shouldUseMobile) {
      document.body.classList.add('mobile-layout')
      document.body.classList.remove('desktop-layout')
    } else {
      document.body.classList.add('desktop-layout')
      document.body.classList.remove('mobile-layout')
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
