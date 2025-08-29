/**
 * 页面容器组件 - 统一页面布局和样式
 */

import React from 'react'
import { Card, Space, Divider, Grid } from 'antd'
import type { CardProps } from 'antd'

const { useBreakpoint } = Grid

interface PageContainerProps extends Omit<CardProps, 'title'> {
  /** 页面标题 */
  title?: React.ReactNode
  /** 页面描述 */
  description?: React.ReactNode
  /** 额外操作区域 */
  extra?: React.ReactNode
  /** 是否显示返回按钮 */
  showBack?: boolean
  /** 返回按钮点击事件 */
  onBack?: () => void
  /** 子内容 */
  children: React.ReactNode
  /** 是否为紧凑模式 */
  compact?: boolean
}

const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  extra,
  showBack = false,
  onBack,
  children,
  compact = false,
  style,
  ...cardProps
}) => {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  // 页面头部组件
  const PageHeader = title && (
    <div style={{ marginBottom: compact ? 16 : 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 16
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {showBack && (
            <Space size="middle" style={{ marginBottom: 8 }}>
              <a onClick={onBack} style={{ fontSize: 14 }}>
                ← 返回
              </a>
            </Space>
          )}
          
          <div
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 'bold',
              color: '#262626',
              marginBottom: description ? 8 : 0
            }}
          >
            {title}
          </div>
          
          {description && (
            <div
              style={{
                fontSize: 14,
                color: '#8c8c8c',
                lineHeight: 1.5
              }}
            >
              {description}
            </div>
          )}
        </div>
        
        {extra && (
          <div
            style={{
              flexShrink: 0,
              width: isMobile ? '100%' : 'auto',
              marginTop: isMobile ? 16 : 0
            }}
          >
            {extra}
          </div>
        )}
      </div>
      
      <Divider style={{ margin: '16px 0 0 0' }} />
    </div>
  )

  return (
    <div
      style={{
        minHeight: '100%',
        ...style
      }}
    >
      {PageHeader}
      
      {compact ? (
        <div>{children}</div>
      ) : (
        <Card
          bordered={false}
          style={{
            boxShadow: isMobile ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}
          bodyStyle={{
            padding: isMobile ? 16 : 24
          }}
          {...cardProps}
        >
          {children}
        </Card>
      )}
    </div>
  )
}

export default PageContainer