import React from 'react'
import {
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Rate,
  Progress,
  Avatar,
  Badge
} from 'antd'
import {
  EnvironmentOutlined,
  PhoneOutlined,
  EyeOutlined,
  StarOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  SearchOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

interface MobileCandidateCardProps {
  candidate: {
    id: string
    locationCode: string
    name: string
    address: string
    status: 'PENDING' | 'EVALUATING' | 'FOLLOWING' | 'NEGOTIATING' | 'CONTRACTED' | 'REJECTED' | 'SUSPENDED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    evaluationScore?: number
    area?: number
    rentPrice?: number
    rentUnit?: string
    region?: {
      name: string
    }
    storePlan?: {
      title: string
    }
    followUpCount: number
    discoveryDate: string
    expectedSignDate?: string
    landlordName?: string
    landlordPhone?: string
    notes?: string
  }
  onView?: () => void
  onFollowUp?: () => void
  onCall?: () => void
}

const MobileCandidateCard: React.FC<MobileCandidateCardProps> = ({
  candidate,
  onView,
  onFollowUp,
  onCall
}) => {
  const statusMap = {
    PENDING: { color: '#d9d9d9', text: '待评估', icon: <SearchOutlined /> },
    EVALUATING: { color: '#1890ff', text: '评估中', icon: <SearchOutlined /> },
    FOLLOWING: { color: '#faad14', text: '跟进中', icon: <PhoneOutlined /> },
    NEGOTIATING: { color: '#fa8c16', text: '谈判中', icon: <TeamOutlined /> },
    CONTRACTED: { color: '#52c41a', text: '已签约', icon: <CheckCircleOutlined /> },
    REJECTED: { color: '#ff4d4f', text: '已拒绝', icon: <CloseCircleOutlined /> },
    SUSPENDED: { color: '#722ed1', text: '已暂停', icon: <PauseCircleOutlined /> }
  }

  const priorityMap = {
    LOW: { color: '#52c41a', text: '低' },
    MEDIUM: { color: '#1890ff', text: '中' },
    HIGH: { color: '#fa8c16', text: '高' },
    URGENT: { color: '#ff4d4f', text: '紧急' }
  }

  const isOverdue = candidate.expectedSignDate && 
    dayjs(candidate.expectedSignDate).isBefore(dayjs()) && 
    candidate.status !== 'CONTRACTED'

  return (
    <Card
      size="small"
      style={{
        marginBottom: '12px',
        borderLeft: `4px solid ${statusMap[candidate.status].color}`,
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
            <Text strong style={{ fontSize: '16px' }}>
              {candidate.name}
            </Text>
            {candidate.priority === 'URGENT' && (
              <Badge 
                color="red" 
                text="紧急" 
                style={{ marginLeft: '8px' }}
              />
            )}
          </div>
          <Tag 
            color={statusMap[candidate.status].color}
            icon={statusMap[candidate.status].icon}
          >
            {statusMap[candidate.status].text}
          </Tag>
        </div>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          编号：{candidate.locationCode}
        </Text>
      </div>

      {/* 地址信息 */}
      <div style={{ marginBottom: '8px' }}>
        <Space size="small" style={{ fontSize: '13px', color: '#666' }}>
          <EnvironmentOutlined />
          <Text type="secondary">{candidate.region?.name}</Text>
        </Space>
        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
          {candidate.address}
        </div>
      </div>

      {/* 基本信息 */}
      <div style={{ marginBottom: '12px' }}>
        <Space size="large" style={{ width: '100%' }}>
          {candidate.area && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                {candidate.area}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>面积(㎡)</div>
            </div>
          )}
          
          {candidate.rentPrice && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                ¥{(candidate.rentPrice / 1000).toFixed(1)}k
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                租金/{candidate.rentUnit || '月'}
              </div>
            </div>
          )}
          
          {candidate.evaluationScore && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#faad14' }}>
                {candidate.evaluationScore.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>评分</div>
              <Rate
                disabled
                value={candidate.evaluationScore / 2}
                allowHalf
                style={{ fontSize: '10px', marginTop: '2px' }}
              />
            </div>
          )}
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
              {candidate.followUpCount}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>跟进次数</div>
          </div>
        </Space>
      </div>

      {/* 关联信息 */}
      {candidate.storePlan?.title && (
        <div style={{ marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            关联计划：{candidate.storePlan.title}
          </Text>
        </div>
      )}

      {/* 联系人信息 */}
      {candidate.landlordName && (
        <div style={{ marginBottom: '8px' }}>
          <Space size="small">
            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
              {candidate.landlordName[0]}
            </Avatar>
            <Text style={{ fontSize: '12px' }}>{candidate.landlordName}</Text>
            {candidate.landlordPhone && (
              <Button 
                type="link" 
                size="small" 
                icon={<PhoneOutlined />}
                onClick={onCall}
                style={{ padding: '0 4px', height: 'auto' }}
              />
            )}
          </Space>
        </div>
      )}

      {/* 时间信息 */}
      <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>
            <CalendarOutlined style={{ marginRight: '4px' }} />
            发现时间：{dayjs(candidate.discoveryDate).format('MM-DD')}
          </span>
          {candidate.expectedSignDate && (
            <span style={{ color: isOverdue ? '#ff4d4f' : '#666' }}>
              预计签约：{dayjs(candidate.expectedSignDate).format('MM-DD')}
              {isOverdue && <Text type="danger"> (逾期)</Text>}
            </span>
          )}
        </div>
      </div>

      {/* 优先级和标签 */}
      <div style={{ marginBottom: '12px' }}>
        <Space size="small">
          <Tag color={priorityMap[candidate.priority].color}>
            {priorityMap[candidate.priority].text}优先级
          </Tag>
          {isOverdue && <Tag color="error">逾期</Tag>}
          {candidate.status === 'FOLLOWING' && candidate.followUpCount > 5 && (
            <Tag color="warning">高频跟进</Tag>
          )}
        </Space>
      </div>

      {/* 备注信息 */}
      {candidate.notes && (
        <div style={{ marginBottom: '12px' }}>
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '12px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {candidate.notes}
          </Text>
        </div>
      )}

      {/* 操作按钮 */}
      <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Button 
          type="primary" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={onView}
          style={{ flex: 1 }}
        >
          查看详情
        </Button>
        
        {candidate.status !== 'CONTRACTED' && candidate.status !== 'REJECTED' && (
          <Button 
            size="small" 
            icon={<PhoneOutlined />}
            onClick={onFollowUp}
            style={{ flex: 1, marginLeft: '8px' }}
          >
            添加跟进
          </Button>
        )}
        
        {candidate.landlordPhone && (
          <Button 
            size="small" 
            type="link"
            icon={<PhoneOutlined />}
            onClick={onCall}
            style={{ color: '#52c41a' }}
          />
        )}
      </Space>

      {/* 进度指示器（针对不同状态显示不同的进度） */}
      {candidate.status !== 'REJECTED' && candidate.status !== 'CONTRACTED' && (
        <div style={{ marginTop: '12px' }}>
          <Progress 
            percent={
              candidate.status === 'PENDING' ? 10 :
              candidate.status === 'EVALUATING' ? 30 :
              candidate.status === 'FOLLOWING' ? 50 :
              candidate.status === 'NEGOTIATING' ? 80 : 0
            }
            size="small"
            strokeColor={statusMap[candidate.status].color}
            showInfo={false}
          />
          <div style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: '4px' }}>
            拓店进度
          </div>
        </div>
      )}
    </Card>
  )
}

export default MobileCandidateCard