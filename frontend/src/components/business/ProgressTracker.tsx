import React from 'react'
import { Steps, Progress } from 'antd'
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

interface StepItem {
  title: string
  description?: string
  status: 'wait' | 'process' | 'finish' | 'error'
  date?: string
  duration?: number // 天数
}

interface ProgressTrackerProps {
  steps: StepItem[]
  current: number
  direction?: 'horizontal' | 'vertical'
  size?: 'default' | 'small'
  showProgress?: boolean
  className?: string
  style?: React.CSSProperties
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  current,
  direction = 'horizontal',
  size = 'default',
  showProgress = true,
  className,
  style
}) => {
  // 计算整体进度百分比
  const progressPercent = Math.round(((current + 1) / steps.length) * 100)

  // 获取状态图标
  const getStatusIcon = (status: StepItem['status']) => {
    switch (status) {
      case 'finish':
        return <CheckCircleFilled style={{ color: '#52C41A' }} />
      case 'process':
        return <ClockCircleOutlined style={{ color: '#1890FF' }} />
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#FF4D4F' }} />
      default:
        return undefined
    }
  }

  // 转换为Antd Steps格式
  const antdSteps = steps.map(step => ({
    title: step.title,
    description: (
      <div style={{ fontSize: '12px' }}>
        {step.description && (
          <div style={{ color: '#666', marginBottom: 4 }}>{step.description}</div>
        )}
        {step.date && <div style={{ color: '#8C8C8C', fontSize: '11px' }}>{step.date}</div>}
        {step.duration && step.status === 'process' && (
          <div style={{ color: '#1890FF', fontSize: '11px', marginTop: 2 }}>
            预计 {step.duration} 天完成
          </div>
        )}
      </div>
    ),
    status: step.status,
    icon: getStatusIcon(step.status)
  }))

  const containerStyle = {
    ...style
  }

  return (
    <div className={className} style={containerStyle}>
      {/* 整体进度条 */}
      {showProgress && (
        <div style={{ marginBottom: direction === 'vertical' ? 16 : 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}>整体进度</span>
            <span style={{ fontSize: '14px', color: '#1890FF', fontWeight: 500 }}>
              {progressPercent}%
            </span>
          </div>
          <Progress
            percent={progressPercent}
            strokeColor="#1890FF"
            trailColor="#F0F0F0"
            strokeWidth={6}
            showInfo={false}
          />
        </div>
      )}

      {/* 步骤展示 */}
      <Steps
        current={current}
        direction={direction}
        size={size}
        items={antdSteps}
        style={{
          ...(direction === 'vertical' && {
            maxHeight: '400px',
            overflowY: 'auto'
          })
        }}
      />

      {/* 当前步骤详情 */}
      {steps[current] && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: '#FAFAFA',
            borderRadius: 6,
            border: '1px solid #F0F0F0'
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#262626',
              marginBottom: 8
            }}
          >
            当前阶段: {steps[current].title}
          </div>

          {steps[current].description && (
            <div
              style={{
                fontSize: '13px',
                color: '#666',
                lineHeight: 1.5,
                marginBottom: 8
              }}
            >
              {steps[current].description}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {steps[current].date && (
              <span style={{ fontSize: '12px', color: '#8C8C8C' }}>
                开始时间: {steps[current].date}
              </span>
            )}

            {steps[current].duration && (
              <span style={{ fontSize: '12px', color: '#1890FF' }}>
                预计用时: {steps[current].duration} 天
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker
