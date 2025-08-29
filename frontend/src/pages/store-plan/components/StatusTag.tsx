import React from 'react'
import { Tag, Tooltip } from 'antd'
import {
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import type { StorePlan } from '@/services/types'

interface StatusTagProps {
  status: StorePlan['status']
  priority?: StorePlan['priority']
  showIcon?: boolean
  size?: 'small' | 'default'
}

interface StatusConfig {
  color: string
  text: string
  icon: React.ReactNode
  description: string
}

const StatusTag: React.FC<StatusTagProps> = ({ 
  status, 
  priority, 
  showIcon = true, 
  size = 'default' 
}) => {
  const statusConfigs: Record<StorePlan['status'], StatusConfig> = {
    draft: {
      color: 'default',
      text: '草稿',
      icon: <EditOutlined />,
      description: '计划正在编辑中，尚未提交审批'
    },
    pending: {
      color: 'processing',
      text: '待审批',
      icon: <ClockCircleOutlined />,
      description: '计划已提交，等待审批'
    },
    approved: {
      color: 'success',
      text: '已批准',
      icon: <CheckCircleOutlined />,
      description: '计划已通过审批，可以开始执行'
    },
    in_progress: {
      color: 'warning',
      text: '进行中',
      icon: <SyncOutlined spin />,
      description: '计划正在执行中'
    },
    completed: {
      color: 'success',
      text: '已完成',
      icon: <CheckCircleOutlined />,
      description: '计划已完成执行'
    },
    cancelled: {
      color: 'error',
      text: '已取消',
      icon: <CloseCircleOutlined />,
      description: '计划已被取消'
    }
  }

  const priorityConfigs: Record<StorePlan['priority'], { color: string; text: string }> = {
    low: { color: 'default', text: '低' },
    medium: { color: 'blue', text: '中' },
    high: { color: 'orange', text: '高' },
    urgent: { color: 'red', text: '紧急' }
  }

  const statusConfig = statusConfigs[status]
  
  const statusTag = (
    <Tag
      color={statusConfig.color}
      icon={showIcon ? statusConfig.icon : undefined}
      style={{ 
        fontSize: size === 'small' ? '12px' : '14px',
        padding: size === 'small' ? '2px 6px' : '4px 8px',
        borderRadius: '4px',
        fontWeight: 500
      }}
    >
      {statusConfig.text}
    </Tag>
  )

  const priorityTag = priority && priority !== 'medium' ? (
    <Tag
      color={priorityConfigs[priority].color}
      icon={priority === 'urgent' ? <ExclamationCircleOutlined /> : undefined}
      style={{
        fontSize: size === 'small' ? '12px' : '14px',
        padding: size === 'small' ? '2px 6px' : '4px 8px',
        borderRadius: '4px',
        fontWeight: 500,
        marginLeft: 4
      }}
    >
      {priorityConfigs[priority].text}
    </Tag>
  ) : null

  return (
    <span>
      <Tooltip title={statusConfig.description}>
        {statusTag}
      </Tooltip>
      {priorityTag && (
        <Tooltip title={`优先级：${priorityConfigs[priority!].text}`}>
          {priorityTag}
        </Tooltip>
      )}
    </span>
  )
}

// 预设的状态组合组件
export const DraftStatus: React.FC<{ size?: 'small' | 'default' }> = ({ size }) => (
  <StatusTag status="draft" size={size} />
)

export const PendingStatus: React.FC<{ size?: 'small' | 'default' }> = ({ size }) => (
  <StatusTag status="pending" size={size} />
)

export const ApprovedStatus: React.FC<{ size?: 'small' | 'default' }> = ({ size }) => (
  <StatusTag status="approved" size={size} />
)

export const InProgressStatus: React.FC<{ size?: 'small' | 'default' }> = ({ size }) => (
  <StatusTag status="in_progress" size={size} />
)

export const CompletedStatus: React.FC<{ size?: 'small' | 'default' }> = ({ size }) => (
  <StatusTag status="completed" size={size} />
)

export const CancelledStatus: React.FC<{ size?: 'small' | 'default' }> = ({ size }) => (
  <StatusTag status="cancelled" size={size} />
)

// 状态变更历史组件
interface StatusHistoryProps {
  history: Array<{
    status: StorePlan['status']
    timestamp: string
    operator: string
    comment?: string
  }>
}

export const StatusHistory: React.FC<StatusHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) return null

  return (
    <div style={{ marginTop: 8 }}>
      {history.map((item, index) => (
        <div key={index} style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
          <StatusTag status={item.status} size="small" showIcon={false} />
          <span style={{ marginLeft: 8 }}>
            {item.timestamp} {item.operator}
          </span>
          {item.comment && (
            <span style={{ marginLeft: 8, fontStyle: 'italic' }}>
              {item.comment}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default StatusTag