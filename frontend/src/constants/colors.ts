/**
 * UI颜色常量定义
 */

export const PREPARATION_STATUS_COLORS = {
  draft: '#d9d9d9',
  planning: '#1890ff',
  in_progress: '#52c41a',
  completed: '#13c2c2',
  paused: '#fa8c16',
  cancelled: '#f5222d'
}

export const PRIORITY_COLORS = {
  low: '#52c41a',
  medium: '#fa8c16',
  high: '#f5222d',
  urgent: '#722ed1'
}

export const PRIORITY_OPTIONS = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' }
]