/**
 * 移动端抽屉组件
 */

import React, { useState, useEffect } from 'react'
import { Drawer, Button, Space } from 'antd'
import { MenuOutlined, CloseOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import { useMobile } from '../../hooks/useDevice'

interface MobileDrawerProps {
  /** 抽屉内容 */
  children: React.ReactNode
  /** 触发按钮文本 */
  triggerText?: string
  /** 触发按钮图标 */
  triggerIcon?: React.ReactNode
  /** 抽屉标题 */
  title?: React.ReactNode
  /** 抽屉位置 */
  placement?: 'top' | 'right' | 'bottom' | 'left'
  /** 是否显示遮罩 */
  mask?: boolean
  /** 是否点击遮罩关闭 */
  maskClosable?: boolean
  /** 自定义宽度/高度 */
  size?: number | string
  /** 额外的操作按钮 */
  extra?: React.ReactNode
  /** 自定义类名 */
  className?: string
  /** 抽屉打开回调 */
  onOpen?: () => void
  /** 抽屉关闭回调 */
  onClose?: () => void
  /** 是否在桌面端也显示（默认只在移动端显示） */
  showOnDesktop?: boolean
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  children,
  triggerText,
  triggerIcon = <MenuOutlined />,
  title,
  placement = 'right',
  mask = true,
  maskClosable = true,
  size,
  extra,
  className,
  onOpen,
  onClose,
  showOnDesktop = false
}) => {
  const [visible, setVisible] = useState(false)
  const isMobile = useMobile()

  // 如果不是移动端且未设置showOnDesktop，则不渲染
  if (!isMobile && !showOnDesktop) {
    return <>{children}</>
  }

  const handleOpen = () => {
    setVisible(true)
    onOpen?.()
  }

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  // 获取抽屉尺寸
  const getDrawerSize = () => {
    if (size) return size
    
    switch (placement) {
      case 'top':
      case 'bottom':
        return '60vh'
      case 'left':
      case 'right':
        return '80vw'
      default:
        return '80vw'
    }
  }

  // 根据位置判断是否为垂直抽屉
  const isVertical = placement === 'top' || placement === 'bottom'

  return (
    <>
      {/* 触发按钮 */}
      <Button
        type="text"
        icon={triggerIcon}
        onClick={handleOpen}
        className={classNames('mobile-drawer-trigger', className)}
      >
        {triggerText}
      </Button>

      {/* 抽屉 */}
      <Drawer
        title={title}
        placement={placement}
        open={visible}
        onClose={handleClose}
        mask={mask}
        maskClosable={maskClosable}
        width={isVertical ? '100vw' : getDrawerSize()}
        height={isVertical ? getDrawerSize() : '100vh'}
        className={classNames(
          'mobile-drawer',
          `mobile-drawer--${placement}`,
          {
            'mobile-drawer--vertical': isVertical,
            'mobile-drawer--horizontal': !isVertical
          }
        )}
        styles={{
          body: {
            padding: isMobile ? '12px' : '24px',
            height: '100%',
            overflow: 'auto'
          },
          header: {
            padding: isMobile ? '12px 16px' : '16px 24px',
            borderBottom: '1px solid #f0f0f0'
          }
        }}
        extra={
          <Space>
            {extra}
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleClose}
              size="small"
            />
          </Space>
        }
        closeIcon={false} // 使用自定义关闭按钮
      >
        <div className="mobile-drawer-content">
          {children}
        </div>
      </Drawer>
    </>
  )
}

export default MobileDrawer