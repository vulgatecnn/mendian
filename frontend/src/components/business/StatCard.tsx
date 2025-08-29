import React from 'react'
import { Card, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import type { CardProps } from 'antd'

interface StatCardProps extends Omit<CardProps, 'title' | 'prefix'> {
  title: string
  value: number | string
  prefix?: React.ReactNode
  suffix?: string
  precision?: number
  trend?: {
    value: number | string
    isPositive?: boolean
    label?: string
  }
  loading?: boolean
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  size?: 'default' | 'small'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  trend,
  loading = false,
  color = 'blue',
  size = 'default',
  style,
  className,
  ...rest
}) => {
  // 颜色配置
  const colorConfig = {
    blue: {
      primary: '#1890FF',
      light: '#E6F7FF',
      gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
    },
    green: {
      primary: '#52C41A',
      light: '#F6FFED',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
    },
    orange: {
      primary: '#FAAD14',
      light: '#FFFBE6',
      gradient: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)'
    },
    red: {
      primary: '#FF4D4F',
      light: '#FFF2F0',
      gradient: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)'
    },
    purple: {
      primary: '#722ED1',
      light: '#F9F0FF',
      gradient: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)'
    }
  }

  const currentColor = colorConfig[color]

  const cardStyle = {
    borderRadius: 8,
    boxShadow:
      '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
    border: '1px solid #F0F0F0',
    overflow: 'hidden',
    ...style
  }

  const headerStyle = {
    background: currentColor.light,
    borderBottom: `1px solid ${currentColor.primary}20`,
    padding: size === 'small' ? '12px 16px 8px' : '16px 20px 12px'
  }

  const bodyStyle = {
    padding: size === 'small' ? '12px 16px' : '16px 20px'
  }

  const titleStyle = {
    color: '#666666',
    fontSize: size === 'small' ? '13px' : '14px',
    fontWeight: 500,
    margin: 0,
    lineHeight: 1.5
  }

  const valueStyle = {
    color: currentColor.primary,
    fontSize: size === 'small' ? '20px' : '24px',
    fontWeight: 600,
    lineHeight: 1.2,
    marginBottom: trend ? 8 : 0
  }

  const trendStyle = {
    fontSize: '12px',
    color: trend?.isPositive !== false ? '#52C41A' : '#FF4D4F',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  }

  const prefixIconStyle = {
    color: currentColor.primary,
    fontSize: size === 'small' ? '16px' : '18px',
    marginRight: 8
  }

  return (
    <Card
      {...(className && { className })}
      style={cardStyle}
      bodyStyle={{ padding: 0 }}
      loading={loading}
      {...rest}
    >
      {/* 头部标题区域 */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {prefix && <span style={prefixIconStyle}>{prefix}</span>}
          <span style={titleStyle}>{title}</span>
        </div>
      </div>

      {/* 数值展示区域 */}
      <div style={bodyStyle}>
        <div style={valueStyle}>
          <Statistic
            value={value}
            {...(suffix && { suffix })}
            {...(precision !== undefined && { precision })}
            valueStyle={{
              color: currentColor.primary,
              fontSize: 'inherit',
              fontWeight: 'inherit',
              lineHeight: 'inherit'
            }}
          />
        </div>

        {/* 趋势指示器 */}
        {trend && (
          <div style={trendStyle}>
            {trend.isPositive !== false ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            <span>{trend.value}</span>
            {trend.label && <span style={{ color: '#8C8C8C' }}>{trend.label}</span>}
          </div>
        )}
      </div>

      {/* 渐变装饰条 */}
      <div
        style={{
          height: 3,
          background: currentColor.gradient,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }}
      />
    </Card>
  )
}

export default StatCard
