import React from 'react'
import {
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Avatar,
  Timeline,
  Badge,
  Divider
} from 'antd'
import {
  PhoneOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  TeamOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  MessageOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

interface MobileFollowUpCardProps {
  followUp: {
    id: string
    type: 'PHONE_CALL' | 'SITE_VISIT' | 'NEGOTIATION' | 'DOCUMENTATION' | 'OTHER'
    title: string
    content: string
    result?: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    nextFollowUpDate?: string
    actualFollowUpDate?: string
    duration?: number
    candidateLocation: {
      id: string
      name: string
      address: string
      status: string
    }
    assignee: {
      id: string
      name: string
      avatar?: string
    }
    createdBy: {
      id: string
      name: string
    }
    createdAt: string
    tags?: string[]
  }
  onView?: () => void
  onEdit?: () => void
  onComplete?: () => void
  onCall?: () => void
}

const MobileFollowUpCard: React.FC<MobileFollowUpCardProps> = ({
  followUp,
  onView,
  onEdit,
  onComplete,
  onCall
}) => {
  const followUpTypeMap = {
    PHONE_CALL: { color: '#1890ff', text: '电话沟通', icon: <PhoneOutlined /> },
    SITE_VISIT: { color: '#52c41a', text: '实地考察', icon: <EnvironmentOutlined /> },
    NEGOTIATION: { color: '#fa8c16', text: '商务谈判', icon: <TeamOutlined /> },
    DOCUMENTATION: { color: '#722ed1', text: '资料整理', icon: <EditOutlined /> },
    OTHER: { color: '#13c2c2', text: '其他', icon: <MessageOutlined /> }
  }

  const statusMap = {
    PENDING: { color: '#faad14', text: '待处理', icon: <ClockCircleOutlined /> },
    IN_PROGRESS: { color: '#1890ff', text: '进行中', icon: <ExclamationCircleOutlined /> },
    COMPLETED: { color: '#52c41a', text: '已完成', icon: <CheckCircleOutlined /> },
    CANCELLED: { color: '#ff4d4f', text: '已取消', icon: <ExclamationCircleOutlined /> }
  }

  const importanceMap = {
    LOW: { color: '#52c41a', text: '低' },
    MEDIUM: { color: '#1890ff', text: '中' },
    HIGH: { color: '#fa8c16', text: '高' },
    URGENT: { color: '#ff4d4f', text: '紧急' }
  }

  const isOverdue = followUp.nextFollowUpDate && 
    dayjs(followUp.nextFollowUpDate).isBefore(dayjs()) && 
    followUp.status === 'PENDING'

  const isDueToday = followUp.nextFollowUpDate && 
    dayjs(followUp.nextFollowUpDate).isSame(dayjs(), 'day') &&
    followUp.status === 'PENDING'

  return (
    <Card
      size="small"
      style={{
        marginBottom: '12px',
        borderLeft: `4px solid ${followUpTypeMap[followUp.type].color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      bodyStyle={{ padding: '12px' }}
    >
      {/* 头部信息 */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '4px'
        }}>
          <div style={{ flex: 1, marginRight: '8px' }}>
            <Space size="small">
              <Tag 
                color={followUpTypeMap[followUp.type].color}
                icon={followUpTypeMap[followUp.type].icon}
                style={{ marginBottom: '4px' }}
              >
                {followUpTypeMap[followUp.type].text}
              </Tag>
              <Tag 
                color={importanceMap[followUp.importance].color}
              >
                {importanceMap[followUp.importance].text}
              </Tag>
            </Space>
            <div>
              <Text strong style={{ fontSize: '16px' }}>
                {followUp.title}
              </Text>
              {followUp.importance === 'URGENT' && (
                <Badge 
                  color="red" 
                  text="紧急" 
                  style={{ marginLeft: '8px' }}
                />
              )}
            </div>
          </div>
          <Tag 
            color={statusMap[followUp.status].color}
            icon={statusMap[followUp.status].icon}
          >
            {statusMap[followUp.status].text}
          </Tag>
        </div>
      </div>

      {/* 候选点位信息 */}
      <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>
          <EnvironmentOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
          {followUp.candidateLocation.name}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {followUp.candidateLocation.address}
        </div>
      </div>

      {/* 跟进内容 */}
      <div style={{ marginBottom: '8px' }}>
        <Paragraph
          style={{ 
            fontSize: '13px',
            marginBottom: '4px',
            color: '#333'
          }}
          ellipsis={{ 
            rows: 2, 
            expandable: true, 
            symbol: '展开' 
          }}
        >
          {followUp.content}
        </Paragraph>
      </div>

      {/* 跟进结果 */}
      {followUp.result && (
        <div style={{ marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            跟进结果：
          </Text>
          <Paragraph
            style={{ 
              fontSize: '12px',
              color: '#666',
              marginTop: '2px',
              marginBottom: '4px'
            }}
            ellipsis={{ 
              rows: 1, 
              expandable: true, 
              symbol: '展开' 
            }}
          >
            {followUp.result}
          </Paragraph>
        </div>
      )}

      {/* 负责人和创建人信息 */}
      <div style={{ marginBottom: '8px' }}>
        <Space size="small">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size="small" 
              style={{ backgroundColor: '#1890ff', marginRight: '4px' }}
            >
              {followUp.assignee.name[0]}
            </Avatar>
            <Text style={{ fontSize: '12px' }}>
              负责：{followUp.assignee.name}
            </Text>
          </div>
          
          <Divider type="vertical" style={{ margin: '0 4px' }} />
          
          <Text type="secondary" style={{ fontSize: '12px' }}>
            创建：{followUp.createdBy.name}
          </Text>
        </Space>
      </div>

      {/* 时间信息 */}
      <div style={{ marginBottom: '12px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#666' }}>
              <CalendarOutlined style={{ marginRight: '4px' }} />
              创建时间：{dayjs(followUp.createdAt).format('MM-DD HH:mm')}
            </span>
            {followUp.duration && (
              <span style={{ color: '#666' }}>
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                耗时：{followUp.duration}分钟
              </span>
            )}
          </div>

          {followUp.nextFollowUpDate && followUp.status === 'PENDING' && (
            <div style={{ 
              fontSize: '12px',
              color: isOverdue ? '#ff4d4f' : isDueToday ? '#fa8c16' : '#666'
            }}>
              <CalendarOutlined style={{ marginRight: '4px' }} />
              下次跟进：{dayjs(followUp.nextFollowUpDate).format('MM-DD HH:mm')}
              {isOverdue && <Tag color="error" style={{ marginLeft: '8px' }}>逾期</Tag>}
              {isDueToday && <Tag color="warning" style={{ marginLeft: '8px' }}>今日</Tag>}
            </div>
          )}

          {followUp.actualFollowUpDate && (
            <div style={{ fontSize: '12px', color: '#52c41a' }}>
              <CheckCircleOutlined style={{ marginRight: '4px' }} />
              完成时间：{dayjs(followUp.actualFollowUpDate).format('MM-DD HH:mm')}
            </div>
          )}
        </Space>
      </div>

      {/* 标签 */}
      {followUp.tags && followUp.tags.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Space size="small" wrap>
            {followUp.tags.map(tag => (
              <Tag key={tag} style={{ fontSize: '11px' }}>
                {tag}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* 操作按钮 */}
      <Space size="small" style={{ width: '100%' }}>
        <Button 
          type="primary" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={onView}
          style={{ flex: 1 }}
        >
          查看详情
        </Button>
        
        {followUp.status !== 'COMPLETED' && followUp.status !== 'CANCELLED' && (
          <>
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ flex: 1 }}
            >
              编辑
            </Button>
            
            {followUp.status === 'PENDING' && (
              <Button 
                size="small" 
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={onComplete}
                style={{ color: '#52c41a' }}
              >
                完成
              </Button>
            )}
          </>
        )}
        
        <Button 
          size="small" 
          type="link"
          icon={<PhoneOutlined />}
          onClick={onCall}
          style={{ color: '#1890ff' }}
        />
      </Space>

      {/* 进度提示 */}
      {followUp.status === 'PENDING' && isOverdue && (
        <div style={{ 
          marginTop: '8px', 
          padding: '6px', 
          backgroundColor: '#fff2f0', 
          borderRadius: '4px',
          borderLeft: '3px solid #ff4d4f'
        }}>
          <Text style={{ fontSize: '11px', color: '#ff4d4f' }}>
            <ExclamationCircleOutlined style={{ marginRight: '4px' }} />
            此跟进任务已逾期，请及时处理
          </Text>
        </div>
      )}

      {followUp.status === 'PENDING' && isDueToday && !isOverdue && (
        <div style={{ 
          marginTop: '8px', 
          padding: '6px', 
          backgroundColor: '#fffbe6', 
          borderRadius: '4px',
          borderLeft: '3px solid #faad14'
        }}>
          <Text style={{ fontSize: '11px', color: '#fa8c16' }}>
            <ClockCircleOutlined style={{ marginRight: '4px' }} />
            今日需要跟进，请及时处理
          </Text>
        </div>
      )}

      {followUp.status === 'COMPLETED' && (
        <div style={{ 
          marginTop: '8px', 
          padding: '6px', 
          backgroundColor: '#f6ffed', 
          borderRadius: '4px',
          borderLeft: '3px solid #52c41a'
        }}>
          <Text style={{ fontSize: '11px', color: '#52c41a' }}>
            <CheckCircleOutlined style={{ marginRight: '4px' }} />
            跟进任务已完成
          </Text>
        </div>
      )}
    </Card>
  )
}

export default MobileFollowUpCard