import React from 'react'
import { Progress, Card, Row, Col, Statistic, Timeline, Tag, Empty } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
} from '@ant-design/icons'
import type { StorePlan, StorePlanMilestone } from '@/services/types'
import dayjs from 'dayjs'

interface ProgressChartProps {
  storePlan: StorePlan
  size?: 'small' | 'default' | 'large'
  showTimeline?: boolean
}

const ProgressChart: React.FC<ProgressChartProps> = ({
  storePlan,
  size = 'default',
  showTimeline = true
}) => {
  const { progress, milestones, status } = storePlan

  // 计算里程碑统计
  const milestoneStats = milestones.reduce((acc, milestone) => {
    acc[milestone.status]++
    return acc
  }, {
    pending: 0,
    in_progress: 0,
    completed: 0,
    delayed: 0
  })

  const completedCount = milestoneStats.completed
  const totalCount = milestones.length
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // 获取进度状态
  const getProgressStatus = () => {
    if (status === 'completed') return 'success'
    if (status === 'cancelled') return 'exception'
    if (progress >= 100) return 'success'
    if (progress >= 80) return 'active'
    if (milestoneStats.delayed > 0) return 'exception'
    return 'active'
  }

  // 获取里程碑状态配置
  const getMilestoneConfig = (milestone: StorePlanMilestone) => {
    const isOverdue = dayjs(milestone.targetDate).isBefore(dayjs()) && milestone.status !== 'completed'
    
    switch (milestone.status) {
      case 'completed':
        return {
          color: 'green',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          label: '已完成'
        }
      case 'in_progress':
        return {
          color: 'blue',
          icon: <SyncOutlined spin style={{ color: '#1890ff' }} />,
          label: '进行中'
        }
      case 'delayed':
      case 'pending':
        return {
          color: isOverdue ? 'red' : 'default',
          icon: isOverdue 
            ? <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            : <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
          label: isOverdue ? '已延期' : '待开始'
        }
      default:
        return {
          color: 'default',
          icon: <ClockCircleOutlined style={{ color: '#d9d9d9' }} />,
          label: '待开始'
        }
    }
  }

  // 渲染统计卡片
  const renderStatsCards = () => (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="总体进度"
            value={progress}
            suffix="%"
            precision={1}
            valueStyle={{ 
              color: progress >= 80 ? '#52c41a' : progress >= 50 ? '#faad14' : '#1890ff',
              fontSize: size === 'small' ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="里程碑完成率"
            value={completionRate}
            suffix="%"
            precision={1}
            valueStyle={{ 
              color: completionRate >= 80 ? '#52c41a' : completionRate >= 50 ? '#faad14' : '#1890ff',
              fontSize: size === 'small' ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="已完成"
            value={completedCount}
            suffix={`/ ${totalCount}`}
            valueStyle={{ 
              color: '#52c41a',
              fontSize: size === 'small' ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="延期项目"
            value={milestoneStats.delayed}
            valueStyle={{ 
              color: milestoneStats.delayed > 0 ? '#ff4d4f' : '#52c41a',
              fontSize: size === 'small' ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
    </Row>
  )

  // 渲染进度条
  const renderProgressBar = () => (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: 0, marginBottom: 8 }}>项目整体进度</h4>
        <Progress
          percent={progress}
          status={getProgressStatus()}
          strokeWidth={size === 'small' ? 6 : 10}
          showInfo={true}
          format={(percent) => `${percent?.toFixed(1)}%`}
        />
      </div>
      
      {totalCount > 0 && (
        <div>
          <h4 style={{ margin: 0, marginBottom: 8 }}>里程碑进度</h4>
          <Progress
            percent={completionRate}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            strokeWidth={size === 'small' ? 6 : 10}
            format={(percent) => `${completedCount}/${totalCount} (${percent?.toFixed(1)}%)`}
          />
        </div>
      )}
    </Card>
  )

  // 渲染里程碑时间线
  const renderMilestoneTimeline = () => {
    if (!showTimeline || milestones.length === 0) return null

    const sortedMilestones = [...milestones].sort(
      (a, b) => dayjs(a.targetDate).valueOf() - dayjs(b.targetDate).valueOf()
    )

    return (
      <Card size="small" title="里程碑时间线">
        <Timeline mode="left">
          {sortedMilestones.map((milestone, index) => {
            const config = getMilestoneConfig(milestone)
            const isOverdue = dayjs(milestone.targetDate).isBefore(dayjs()) && milestone.status !== 'completed'
            
            return (
              <Timeline.Item
                key={milestone.id}
                dot={config.icon}
                color={config.color}
              >
                <div style={{ minHeight: '60px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 4,
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    <h4 style={{ margin: 0, fontSize: size === 'small' ? '14px' : '16px' }}>
                      {milestone.name}
                    </h4>
                    <Tag color={config.color} size="small">
                      {config.label}
                    </Tag>
                    {isOverdue && (
                      <Tag color="red" size="small">
                        延期
                      </Tag>
                    )}
                  </div>
                  
                  <div style={{ 
                    color: '#666', 
                    fontSize: size === 'small' ? '12px' : '14px',
                    marginBottom: 4
                  }}>
                    目标日期: {dayjs(milestone.targetDate).format('YYYY-MM-DD')}
                    {milestone.actualDate && (
                      <span style={{ marginLeft: 16 }}>
                        完成日期: {dayjs(milestone.actualDate).format('YYYY-MM-DD')}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ 
                    color: '#666', 
                    fontSize: size === 'small' ? '12px' : '14px'
                  }}>
                    负责人: {milestone.responsibleName}
                  </div>
                </div>
              </Timeline.Item>
            )
          })}
        </Timeline>
      </Card>
    )
  }

  return (
    <div>
      {renderStatsCards()}
      {renderProgressBar()}
      {milestones.length > 0 ? (
        renderMilestoneTimeline()
      ) : (
        <Card size="small">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无里程碑数据"
          />
        </Card>
      )}
    </div>
  )
}

// 简化版进度组件
interface SimpleProgressProps {
  progress: number
  status: StorePlan['status']
  size?: 'small' | 'default'
}

export const SimpleProgress: React.FC<SimpleProgressProps> = ({
  progress,
  status,
  size = 'default'
}) => {
  const getProgressStatus = () => {
    if (status === 'completed') return 'success'
    if (status === 'cancelled') return 'exception'
    if (progress >= 100) return 'success'
    return 'active'
  }

  return (
    <Progress
      percent={progress}
      status={getProgressStatus()}
      size={size}
      showInfo={true}
      format={(percent) => `${percent?.toFixed(1)}%`}
    />
  )
}

export default ProgressChart