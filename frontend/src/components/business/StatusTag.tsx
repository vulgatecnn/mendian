import React from 'react'
import { Tag } from 'antd'
import type { TagProps } from 'antd'

// 状态类型定义
export type StatusType =
  | 'draft' // 草稿
  | 'pending' // 待审批
  | 'approved' // 已批准
  | 'rejected' // 已拒绝
  | 'in_progress' // 进行中
  | 'completed' // 已完成
  | 'cancelled' // 已取消
  | 'expired' // 已过期
  | 'on_hold' // 暂停

// 优先级类型定义
export type PriorityType =
  | 'urgent' // 紧急
  | 'high' // 高
  | 'medium' // 中
  | 'low' // 低

// 门店类型定义
export type StoreType =
  | 'direct' // 直营
  | 'franchise' // 加盟
  | 'joint_venture' // 合资

interface StatusTagProps extends Omit<TagProps, 'color'> {
  type: 'status' | 'priority' | 'store'
  value: StatusType | PriorityType | StoreType
  size?: 'small' | 'default'
}

// 状态配置映射
const statusConfig = {
  draft: { color: '#8C8C8C', bgColor: '#FAFAFA', text: '草稿' },
  pending: { color: '#FAAD14', bgColor: '#FFFBE6', text: '待审批' },
  approved: { color: '#52C41A', bgColor: '#F6FFED', text: '已批准' },
  rejected: { color: '#FF4D4F', bgColor: '#FFF2F0', text: '已拒绝' },
  in_progress: { color: '#1890FF', bgColor: '#E6F7FF', text: '进行中' },
  completed: { color: '#52C41A', bgColor: '#F6FFED', text: '已完成' },
  cancelled: { color: '#8C8C8C', bgColor: '#FAFAFA', text: '已取消' },
  expired: { color: '#FF4D4F', bgColor: '#FFF2F0', text: '已过期' },
  on_hold: { color: '#FAAD14', bgColor: '#FFFBE6', text: '暂停' }
}

const priorityConfig = {
  urgent: { color: '#FF4D4F', bgColor: '#FFF2F0', text: '紧急' },
  high: { color: '#FA541C', bgColor: '#FFF2E8', text: '高' },
  medium: { color: '#FAAD14', bgColor: '#FFFBE6', text: '中' },
  low: { color: '#52C41A', bgColor: '#F6FFED', text: '低' }
}

const storeTypeConfig = {
  direct: { color: '#1890FF', bgColor: '#E6F7FF', text: '直营' },
  franchise: { color: '#52C41A', bgColor: '#F6FFED', text: '加盟' },
  joint_venture: { color: '#FAAD14', bgColor: '#FFFBE6', text: '合资' }
}

const StatusTag: React.FC<StatusTagProps> = ({
  type,
  value,
  size = 'default',
  style,
  className,
  ...rest
}) => {
  // 根据类型获取配置
  const getConfig = () => {
    switch (type) {
      case 'status':
        return statusConfig[value as StatusType]
      case 'priority':
        return priorityConfig[value as PriorityType]
      case 'store':
        return storeTypeConfig[value as StoreType]
      default:
        return statusConfig.draft
    }
  }

  const config = getConfig()

  const tagStyle = {
    color: config.color,
    backgroundColor: config.bgColor,
    borderColor: config.color + '40', // 40% opacity
    borderRadius: size === 'small' ? 10 : 11,
    padding: size === 'small' ? '0 6px' : '2px 8px',
    fontSize: size === 'small' ? '11px' : '12px',
    fontWeight: 400,
    lineHeight: size === 'small' ? '18px' : '20px',
    border: '1px solid',
    ...style
  }

  return (
    <Tag {...(className && { className })} style={tagStyle} {...rest}>
      {config.text}
    </Tag>
  )
}

export default StatusTag
