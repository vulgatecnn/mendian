/**
 * 响应式容器组件
 */

import React from 'react'
import { ConfigProvider } from 'antd'
import classNames from 'classnames'
import { useDevice, useBreakpoint } from '../../hooks/useDevice'
import type { DeviceType } from '../../utils/device'

interface ResponsiveContainerProps {
  children: React.ReactNode
  /** 自定义类名 */
  className?: string
  /** 是否启用自适应内边距 */
  adaptivePadding?: boolean
  /** 是否启用安全区域适配 */
  safeArea?: boolean
  /** 移动端专用样式 */
  mobileClassName?: string
  /** 平板端专用样式 */
  tabletClassName?: string
  /** 桌面端专用样式 */
  desktopClassName?: string
  /** 最大宽度 */
  maxWidth?: number | string
  /** 是否居中 */
  center?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  adaptivePadding = true,
  safeArea = true,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  maxWidth,
  center = false
}) => {
  const device = useDevice()
  const { xs, sm, md, lg } = useBreakpoint()

  // 根据设备类型选择类名
  const deviceSpecificClassName = React.useMemo(() => {
    switch (device.type) {
      case 'mobile':
        return mobileClassName
      case 'tablet':
        return tabletClassName
      case 'desktop':
        return desktopClassName
      default:
        return ''
    }
  }, [device.type, mobileClassName, tabletClassName, desktopClassName])

  // 构建容器样式
  const containerStyle = React.useMemo(() => {
    const style: React.CSSProperties = {}

    if (maxWidth) {
      style.maxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
    }

    if (center) {
      style.margin = '0 auto'
    }

    // 响应式内边距
    if (adaptivePadding) {
      if (xs) {
        style.padding = '8px'
      } else if (sm) {
        style.padding = '12px'
      } else if (md) {
        style.padding = '16px'
      } else {
        style.padding = '24px'
      }
    }

    // 安全区域适配
    if (safeArea && device.isMobile) {
      style.paddingTop = `max(${style.paddingTop || 0}, env(safe-area-inset-top))`
      style.paddingBottom = `max(${style.paddingBottom || 0}, env(safe-area-inset-bottom))`
      style.paddingLeft = `max(${style.paddingLeft || 0}, env(safe-area-inset-left))`
      style.paddingRight = `max(${style.paddingRight || 0}, env(safe-area-inset-right))`
    }

    return style
  }, [maxWidth, center, adaptivePadding, safeArea, device.isMobile, xs, sm, md])

  // 构建CSS类名
  const containerClassName = classNames(
    'responsive-container',
    {
      'responsive-container--mobile': device.isMobile,
      'responsive-container--tablet': device.isTablet,
      'responsive-container--desktop': device.isDesktop,
      'responsive-container--wechat-work': device.isWeChatWork,
      'responsive-container--wechat': device.isWeChat,
      'responsive-container--touch': device.touchSupported,
      'responsive-container--portrait': device.orientation === 'portrait',
      'responsive-container--landscape': device.orientation === 'landscape',
      'responsive-container--xs': xs,
      'responsive-container--sm': sm && !xs,
      'responsive-container--md': md && !sm,
      'responsive-container--lg': lg && !md,
      'responsive-container--adaptive-padding': adaptivePadding,
      'responsive-container--safe-area': safeArea,
      'responsive-container--center': center
    },
    className,
    deviceSpecificClassName
  )

  // 移动端优化的Antd配置
  const antdConfig = React.useMemo(() => {
    if (device.isMobile) {
      return {
        componentSize: 'middle' as const,
        theme: {
          components: {
            Button: {
              controlHeight: 44, // 移动端按钮高度
              borderRadius: 8
            },
            Input: {
              controlHeight: 44, // 移动端输入框高度
              borderRadius: 8
            },
            Select: {
              controlHeight: 44,
              borderRadius: 8
            },
            Table: {
              cellPaddingInline: 8, // 移动端表格内边距
              cellPaddingBlock: 12
            },
            Card: {
              paddingLG: 12, // 移动端卡片内边距
              borderRadiusLG: 12
            },
            Modal: {
              padding: 16,
              paddingContentHorizontalLG: 16
            }
          }
        }
      }
    }

    return {}
  }, [device.isMobile])

  return (
    <ConfigProvider {...antdConfig}>
      <div 
        className={containerClassName}
        style={containerStyle}
      >
        {children}
      </div>
    </ConfigProvider>
  )
}

export default ResponsiveContainer