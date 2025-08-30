import React, { useState } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Modal,
  message,
  Tabs,
  Row,
  Col,
  Progress,
  Timeline,
  Badge,
  Avatar,
  Statistic,
  Alert,
  Typography,
  List,
  Form,
  Input,
  Tooltip,
  Empty,
  Spin
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  DownloadOutlined,
  PlusOutlined,
  SyncOutlined,
  SendOutlined,
  RollbackOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useStorePlan } from '@/services/query/hooks/useStorePlan'
import { useDevice } from '@/hooks/useDevice'
import PageHeader from '@/components/common/PageHeader'
import StatusTag from './components/StatusTag'
import ProgressTracker from './components/ProgressTracker'
import ChartsPanel from './components/ChartsPanel'
import dayjs from 'dayjs'
// StorePlan type removed - not used

const { Text, Paragraph } = Typography
const { TextArea } = Input
// Option removed - not used

interface ActivityLog {
  id: string
  action: string
  description: string
  user: string
  userAvatar?: string
  timestamp: string
  type: 'create' | 'update' | 'status' | 'comment' | 'approval'
}

interface Comment {
  id: string
  content: string
  author: string
  authorAvatar?: string
  createdAt: string
  replies?: Comment[]
}

interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedBy: string
  uploadedAt: string
}

const StorePlanDetailEnhanced: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useDevice()
  const [activeTab, setActiveTab] = useState('overview')
  const [_commentDrawer, _setCommentDrawer] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [_form] = Form.useForm()
  
  // 查询计划详情
  const { 
    data: plan, 
    isLoading,
    error 
  } = useStorePlan.useDetail(id || '')

  // 查询统计数据
  const { 
    data: statistics 
  } = useStorePlan.useStatistics({
    regionIds: plan ? [plan.regionId] : undefined
  })

  // 模拟数据
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: '1',
      action: '创建计划',
      description: '创建了新的开店计划',
      user: '张三',
      timestamp: '2024-01-15 09:00:00',
      type: 'create'
    },
    {
      id: '2',
      action: '状态变更',
      description: '计划状态从"草稿"变更为"审批中"',
      user: '张三',
      timestamp: '2024-01-15 10:30:00',
      type: 'status'
    },
    {
      id: '3',
      action: '审批通过',
      description: '计划已通过审批，开始执行',
      user: '李经理',
      timestamp: '2024-01-16 14:20:00',
      type: 'approval'
    }
  ])

  const [comments] = useState<Comment[]>([
    {
      id: '1',
      content: '这个计划的选址需要进一步调研，建议增加竞品分析环节。',
      author: '王五',
      createdAt: '2024-01-16 16:30:00',
      replies: [
        {
          id: '1-1',
          content: '好的，我会安排团队进行详细的市场调研。',
          author: '张三',
          createdAt: '2024-01-16 17:00:00'
        }
      ]
    }
  ])

  const [attachments] = useState<Attachment[]>([
    {
      id: '1',
      name: '市场调研报告.pdf',
      url: '/files/market-research.pdf',
      size: 2048000,
      type: 'pdf',
      uploadedBy: '张三',
      uploadedAt: '2024-01-15 14:30:00'
    },
    {
      id: '2',
      name: '选址照片.jpg',
      url: '/images/location.jpg',
      size: 1024000,
      type: 'image',
      uploadedBy: '王五',
      uploadedAt: '2024-01-16 10:00:00'
    }
  ])

  // 模拟里程碑数据
  const [milestones] = useState([
    {
      id: '1',
      name: '选址确认',
      description: '完成门店选址并签订租赁协议',
      targetDate: '2024-02-01T00:00:00Z',
      actualDate: '2024-01-28T00:00:00Z',
      status: 'completed' as const,
      responsible: 'user1',
      responsibleName: '张三',
      progress: 100
    },
    {
      id: '2',
      name: '装修设计',
      description: '完成门店装修设计方案',
      targetDate: '2024-02-15T00:00:00Z',
      status: 'in_progress' as const,
      responsible: 'user2',
      responsibleName: '李四',
      progress: 60
    },
    {
      id: '3',
      name: '证照办理',
      description: '办理营业执照和相关许可证',
      targetDate: '2024-03-01T00:00:00Z',
      status: 'pending' as const,
      responsible: 'user3',
      responsibleName: '王五',
      progress: 0
    }
  ])

  const handleEdit = () => {
    navigate(`/store-plan/${id}/edit`)
  }

  const handleDelete = () => {
    if (!plan) return

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个开店计划吗？删除后无法恢复。',
      icon: <ExclamationCircleOutlined />,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // 调用删除API
          message.success('计划删除成功')
          navigate('/store-plan')
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleBack = () => {
    navigate('/store-plan')
  }

  const handleStatusChange = (newStatus: string) => {
    Modal.confirm({
      title: '确认状态变更',
      content: `确定要将计划状态变更为"${newStatus}"吗？`,
      onOk: async () => {
        try {
          // 调用状态变更API
          message.success('状态变更成功')
        } catch (error) {
          message.error('状态变更失败')
        }
      }
    })
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    try {
      // 调用添加评论API
      setNewComment('')
      message.success('评论添加成功')
    } catch (error) {
      message.error('评论添加失败')
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板')
    })
  }

  const handleExport = () => {
    message.info('导出功能开发中')
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Alert
          message="加载失败"
          description={error?.message || '计划不存在或已被删除'}
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/store-plan')}>
              返回列表
            </Button>
          }
        />
      </div>
    )
  }

  // 基本信息卡片
  const BasicInfo = () => {
    const isOverdue = plan.endDate && dayjs().isAfter(dayjs(plan.endDate)) && plan.status !== 'COMPLETED'
    const remainingDays = plan.endDate ? dayjs(plan.endDate).diff(dayjs(), 'day') : null

    return (
      <Card title="基本信息">
        {isOverdue && (
          <Alert
            message="计划延期"
            description={`计划已延期 ${Math.abs(remainingDays || 0)} 天，请及时调整计划或联系相关负责人`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" type="primary">
                调整计划
              </Button>
            }
          />
        )}

        <Descriptions bordered column={isMobile ? 1 : 2}>
          <Descriptions.Item label="计划名称" span={isMobile ? 1 : 2}>
            <Space>
              {plan.title}
              {plan.priority === 'URGENT' && <Badge color="red" text="紧急" />}
              {isOverdue && <Badge color="orange" text="延期" />}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="计划编号">
            {plan.planCode || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="门店类型">
            <Tag color={
              plan.storeType === 'DIRECT' ? 'blue' : 
              plan.storeType === 'FRANCHISE' ? 'green' :
              plan.storeType === 'FLAGSHIP' ? 'purple' : 'orange'
            }>
              {plan.storeType === 'DIRECT' ? '直营' : 
               plan.storeType === 'FRANCHISE' ? '加盟' :
               plan.storeType === 'FLAGSHIP' ? '旗舰店' : '快闪店'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag status={plan.status} />
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={
              plan.priority === 'URGENT' ? 'red' :
              plan.priority === 'HIGH' ? 'orange' :
              plan.priority === 'MEDIUM' ? 'blue' : 'default'
            }>
              {plan.priority === 'URGENT' ? '紧急' :
               plan.priority === 'HIGH' ? '高' :
               plan.priority === 'MEDIUM' ? '中' : '低'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="所属地区">
            <Space>
              {plan.region?.name}
              <Text type="secondary">({plan.region?.code})</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="公司主体">
            <Tooltip title={plan.entity?.legalName}>
              {plan.entity?.name}
            </Tooltip>
          </Descriptions.Item>
          <Descriptions.Item label="计划数量">
            <Space>
              <Text strong>{plan.plannedCount}</Text>
              <Text type="secondary">家门店</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="完成数量">
            <Space>
              <Text strong style={{ color: '#52c41a' }}>{plan.completedCount}</Text>
              <Text type="secondary">家门店</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="预算金额">
            <Space direction="vertical" size="small">
              <Text strong>
                ¥{plan.budget ? (plan.budget.toNumber() / 10000).toFixed(1) : '0'}万元
              </Text>
              {plan.actualBudget && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  已用: ¥{(plan.actualBudget.toNumber() / 10000).toFixed(1)}万
                </Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="计划时间">
            <Space direction="vertical" size="small">
              {plan.startDate && (
                <div>
                  <Text type="secondary">开始: </Text>
                  <Text>{dayjs(plan.startDate).format('YYYY-MM-DD')}</Text>
                </div>
              )}
              {plan.endDate && (
                <div>
                  <Text type="secondary">结束: </Text>
                  <Text style={{ color: isOverdue ? '#f5222d' : undefined }}>
                    {dayjs(plan.endDate).format('YYYY-MM-DD')}
                  </Text>
                  {remainingDays !== null && (
                    <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                      ({remainingDays > 0 ? `剩余${remainingDays}天` : `延期${Math.abs(remainingDays)}天`})
                    </Text>
                  )}
                </div>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            <Space>
              <Avatar size="small" src={plan.createdBy?.avatar} icon={<UserOutlined />} />
              <Text>{plan.createdBy?.name}</Text>
              {plan.createdBy?.jobTitle && (
                <Text type="secondary">({plan.createdBy.jobTitle})</Text>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(plan.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(plan.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="计划描述" span={isMobile ? 1 : 2}>
            <Paragraph ellipsis={{ rows: 3, expandable: true }}>
              {plan.description || '暂无描述'}
            </Paragraph>
          </Descriptions.Item>
          {plan.remark && (
            <Descriptions.Item label="备注说明" span={isMobile ? 1 : 2}>
              <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                {plan.remark}
              </Paragraph>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    )
  }

  // 进度统计卡片
  const ProgressStats = () => {
    const completionRate = plan.plannedCount > 0 ? (plan.completedCount / plan.plannedCount * 100) : 0
    const budgetUsage = plan.budget && plan.actualBudget ? 
      (plan.actualBudget.toNumber() / plan.budget.toNumber() * 100) : 0
    const remainingDays = plan.endDate ? dayjs(plan.endDate).diff(dayjs(), 'day') : null

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="完成率"
              value={completionRate}
              precision={1}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: completionRate >= 80 ? '#52c41a' : completionRate >= 60 ? '#faad14' : '#f5222d' }}
            />
            <Progress 
              percent={completionRate} 
              size="small" 
              strokeColor={completionRate >= 80 ? '#52c41a' : completionRate >= 60 ? '#faad14' : '#f5222d'}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="预算使用"
              value={budgetUsage}
              precision={1}
              suffix="%"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              {plan.actualBudget ? `${(plan.actualBudget.toNumber() / 10000).toFixed(1)}万` : '0万'} / 
              {plan.budget ? `${(plan.budget.toNumber() / 10000).toFixed(1)}万` : '0万'}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={remainingDays && remainingDays >= 0 ? "剩余天数" : "延期天数"}
              value={remainingDays ? Math.abs(remainingDays) : 0}
              suffix="天"
              prefix={<CalendarOutlined />}
              valueStyle={{ 
                color: !remainingDays ? '#999' :
                       remainingDays < 0 ? '#f5222d' : 
                       remainingDays < 30 ? '#faad14' : '#52c41a'
              }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              {plan.endDate ? `截止 ${dayjs(plan.endDate).format('MM-DD')}` : '无截止日期'}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="里程碑进度"
              value={`${milestones.filter(m => m.status === 'completed').length}/${milestones.length}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              已完成 {milestones.filter(m => m.status === 'completed').length} 个
            </div>
          </Card>
        </Col>
      </Row>
    )
  }

  // 活动日志
  const ActivityLogView = () => (
    <Card title="活动日志">
      <Timeline>
        {activityLogs.map(log => (
          <Timeline.Item
            key={log.id}
            color={log.type === 'create' ? 'green' : 
                   log.type === 'approval' ? 'blue' : 
                   log.type === 'status' ? 'orange' : 'gray'}
          >
            <div>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text strong>{log.user}</Text>
                <Text>{log.action}</Text>
              </Space>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {log.description}
                </Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  )

  // 附件列表
  const AttachmentsView = () => (
    <Card 
      title="相关文档" 
      extra={
        <Button type="primary" size="small" icon={<PlusOutlined />}>
          上传文档
        </Button>
      }
    >
      <List
        dataSource={attachments}
        renderItem={item => (
          <List.Item
            actions={[
              <Button type="link" size="small" icon={<DownloadOutlined />}>
                下载
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title={item.name}
              description={
                <Space>
                  <Text type="secondary">{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
                  <Text type="secondary">由 {item.uploadedBy} 上传</Text>
                  <Text type="secondary">{dayjs(item.uploadedAt).format('YYYY-MM-DD HH:mm')}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )

  // 评论区
  const CommentsView = () => (
    <Card title="讨论区">
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="添加评论..."
        />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button 
            type="primary" 
            size="small" 
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            发表评论
          </Button>
        </div>
      </div>
      
      <List
        dataSource={comments}
        renderItem={comment => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text strong>{comment.author}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </Space>
              </div>
              <Paragraph>{comment.content}</Paragraph>
              {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginLeft: 32, marginTop: 8, paddingLeft: 16, borderLeft: '2px solid #f0f0f0' }}>
                  {comment.replies.map(reply => (
                    <div key={reply.id} style={{ marginBottom: 8 }}>
                      <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text strong>{reply.author}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </Space>
                      <Paragraph style={{ marginTop: 4 }}>{reply.content}</Paragraph>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </List.Item>
        )}
      />
    </Card>
  )

  // 根据状态获取操作按钮
  const getActionButtons = () => {
    const buttons = []

    // 基础操作按钮
    buttons.push(
      <Button key="share" icon={<ShareAltOutlined />} onClick={handleShare}>
        分享
      </Button>,
      <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
        导出
      </Button>,
      <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
        打印
      </Button>
    )

    // 根据状态显示特定操作
    if (plan.status === 'DRAFT') {
      buttons.push(
        <Button key="submit" type="primary" icon={<SendOutlined />} onClick={() => handleStatusChange('SUBMITTED')}>
          提交审批
        </Button>,
        <Button key="edit" icon={<EditOutlined />} onClick={handleEdit}>
          编辑
        </Button>,
        <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleDelete}>
          删除
        </Button>
      )
    } else if (plan.status === 'SUBMITTED' || plan.status === 'PENDING') {
      buttons.push(
        <Button key="withdraw" icon={<RollbackOutlined />} onClick={() => handleStatusChange('DRAFT')}>
          撤回
        </Button>
      )
    } else if (plan.status === 'APPROVED') {
      buttons.push(
        <Button key="start" type="primary" icon={<SyncOutlined />} onClick={() => handleStatusChange('IN_PROGRESS')}>
          开始执行
        </Button>
      )
    } else if (plan.status === 'IN_PROGRESS') {
      buttons.push(
        <Button key="complete" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange('COMPLETED')}>
          完成计划
        </Button>
      )
    }

    return buttons
  }

  const tabItems = [
    {
      key: 'overview',
      label: '基本信息',
      children: (
        <div>
          <ProgressStats />
          <BasicInfo />
        </div>
      )
    },
    {
      key: 'progress',
      label: '执行进度',
      children: (
        <ProgressTracker 
          plan={plan}
          milestones={milestones}
          editable={plan.status === 'IN_PROGRESS'}
        />
      )
    },
    {
      key: 'analytics',
      label: '数据分析',
      children: statistics ? (
        <ChartsPanel 
          statistics={statistics}
          loading={false}
        />
      ) : (
        <Card>
          <Empty description="暂无统计数据" />
        </Card>
      )
    },
    {
      key: 'files',
      label: '相关文档',
      children: <AttachmentsView />
    },
    {
      key: 'activity',
      label: '活动日志',
      children: <ActivityLogView />
    },
    {
      key: 'comments',
      label: '讨论区',
      children: <CommentsView />
    }
  ]

  return (
    <div>
      <PageHeader
        title={plan.title}
        description="查看开店计划详细信息和执行进度"
        onBack={handleBack}
        breadcrumbs={[
          { title: '开店计划', path: '/store-plan' },
          { title: '计划详情' }
        ]}
        tags={[
          <StatusTag key="status" status={plan.status} />,
          <Tag key="type" color="blue">{
            plan.storeType === 'DIRECT' ? '直营' : 
            plan.storeType === 'FRANCHISE' ? '加盟' :
            plan.storeType === 'FLAGSHIP' ? '旗舰店' : '快闪店'
          }</Tag>,
          plan.priority === 'URGENT' && <Tag key="priority" color="red">紧急</Tag>
        ]}
        extra={getActionButtons()}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size={isMobile ? 'small' : 'default'}
        tabPosition={isMobile ? 'top' : 'top'}
        style={{ minHeight: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 200px)' }}
      />
    </div>
  )
}

export default StorePlanDetailEnhanced