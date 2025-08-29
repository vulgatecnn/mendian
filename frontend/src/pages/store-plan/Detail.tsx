import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Progress,
  Row,
  Col,
  Table,
  Timeline,
  Tabs,
  Statistic,
  Badge,
  Modal,
  message,
  Empty,
  Tooltip,
  Spin,
  Divider
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  RollbackOutlined,
  TrophyOutlined,
  ShopOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import { useStorePlanStore } from '@/stores/storePlanStore'
import StatusTag from './components/StatusTag'
import ProgressChart from './components/ProgressChart'
import dayjs from 'dayjs'

const { TabPane } = Tabs

const StorePlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  
  const { 
    currentStorePlan,
    fetchStorePlan,
    deleteStorePlan,
    submitForApproval,
    withdrawApproval,
    updateProgress,
    isLoading,
    isSubmitting
  } = useStorePlanStore()

  useEffect(() => {
    if (id) {
      fetchStorePlan(id)
    }
  }, [id, fetchStorePlan])

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!currentStorePlan) {
    return (
      <Card>
        <Empty 
          description="计划不存在或已被删除" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    )
  }

  const plan = currentStorePlan

  // 状态和类型映射
  const statusMap = {
    draft: { color: 'default', text: '草稿', icon: <EditOutlined /> },
    pending: { color: 'processing', text: '待审批', icon: <ClockCircleOutlined /> },
    approved: { color: 'success', text: '已批准', icon: <CheckCircleOutlined /> },
    in_progress: { color: 'warning', text: '进行中', icon: <SyncOutlined spin /> },
    completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
    cancelled: { color: 'error', text: '已取消', icon: <ExclamationCircleOutlined /> }
  }

  const typeMap = {
    direct: { color: 'blue', text: '直营' },
    franchise: { color: 'green', text: '加盟' },
    joint_venture: { color: 'orange', text: '合营' }
  }

  const priorityMap = {
    low: { color: 'default', text: '低' },
    medium: { color: 'warning', text: '中' },
    high: { color: 'error', text: '高' },
    urgent: { color: 'error', text: '紧急' }
  }

  // 处理计划操作
  const handleEdit = () => {
    if (plan.status === 'draft' || plan.status === 'pending') {
      navigate(`/store-plan/${id}/edit`)
    } else {
      message.warning('当前状态不支持编辑')
    }
  }

  const handleDelete = () => {
    if (plan.status !== 'draft') {
      message.warning('只有草稿状态的计划可以删除')
      return
    }

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个开店计划吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (id && await deleteStorePlan(id)) {
          navigate('/store-plan')
        }
      }
    })
  }

  const handleSubmitApproval = () => {
    if (plan.status !== 'draft') {
      message.warning('只有草稿状态的计划可以提交审批')
      return
    }

    Modal.confirm({
      title: '提交审批',
      content: '确定要提交这个计划进行审批吗？提交后将无法修改。',
      okText: '确定提交',
      cancelText: '取消',
      onOk: async () => {
        if (id && await submitForApproval(id, { urgency: 'normal' })) {
          message.success('已提交审批')
        }
      }
    })
  }

  const handleWithdrawApproval = () => {
    if (plan.status !== 'pending') {
      message.warning('只有待审批状态的计划可以撤回')
      return
    }

    Modal.confirm({
      title: '撤回审批',
      content: '确定要撤回这个计划的审批吗？撤回后可以重新修改。',
      okText: '确定撤回',
      cancelText: '取消',
      onOk: async () => {
        if (id && await withdrawApproval(id, '主动撤回')) {
          message.success('已撤回审批')
        }
      }
    })
  }

  const handleShare = () => {
    const url = `${window.location.origin}/store-plan/${id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
      message.success('分享链接已复制到剪贴板')
    } else {
      message.info(`分享链接：${url}`)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // 计算统计数据
  const stats = plan.targets?.reduce((acc, target) => {
    acc.totalTarget += target.targetCount
    acc.totalBudget += target.budget
    return acc
  }, { totalTarget: 0, totalBudget: 0 }) || { totalTarget: 0, totalBudget: 0 }

  const actualCount = storesData?.data?.length || 0
  const completionRate = stats.totalTarget > 0 ? (actualCount / stats.totalTarget * 100) : 0

  // 图表数据
  const regionData = plan.targets?.map(target => ({
    region: target.regionName,
    target: target.targetCount,
    actual: storesData?.data?.filter(store => store.regionId === target.regionId)?.length || 0,
    budget: target.budget / 10000
  })) || []

  const pieData = regionData.map(item => ({
    type: item.region,
    value: item.actual
  }))

  const columnData = regionData.flatMap(item => [
    { region: item.region, type: '目标', value: item.target },
    { region: item.region, type: '实际', value: item.actual }
  ])

  // 门店列表列定义
  const storeColumns = [
    {
      title: '门店名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '地区',
      dataIndex: ['region', 'name'],
      key: 'region'
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          preparing: { color: 'processing', text: '筹备中' },
          construction: { color: 'warning', text: '施工中' },
          opening: { color: 'success', text: '开业' },
          closed: { color: 'error', text: '停业' }
        }
        const config = statusConfig[status as keyof typeof statusConfig]
        return <Tag color={config?.color}>{config?.text}</Tag>
      }
    },
    {
      title: '开业时间',
      dataIndex: 'openDate',
      key: 'openDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StoreInfo) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => navigate(`/store-files/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
  ]

  // 历史记录
  const historyItems = historyData?.data?.map((item: any) => ({
    color: item.type === 'success' ? 'green' : item.type === 'warning' ? 'orange' : 'blue',
    children: (
      <div>
        <div style={{ fontWeight: 'bold' }}>{item.title}</div>
        <div style={{ color: '#666', fontSize: '12px' }}>
          {item.operator} • {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
        </div>
        {item.description && <div style={{ marginTop: 4 }}>{item.description}</div>}
      </div>
    )
  })) || []

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'spider',
      labelHeight: 28,
      content: '{name}\n{percentage}'
    },
    legend: {
      position: 'bottom' as const
    }
  }

  const columnConfig = {
    data: columnData,
    xField: 'region',
    yField: 'value',
    seriesField: 'type',
    columnWidthRatio: 0.6,
    legend: {
      position: 'top-left' as const
    },
    label: {
      position: 'middle' as const
    }
  }

  // 根据状态显示不同的操作按钮
  const getActionButtons = () => {
    const buttons = []

    // 基础操作按钮
    buttons.push(
      <Button key="share" icon={<ShareAltOutlined />} onClick={handleShare}>
        分享
      </Button>,
      <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
        打印
      </Button>
    )

    // 根据状态显示特定操作
    if (plan.status === 'draft') {
      buttons.push(
        <Button key="submit" type="primary" icon={<SendOutlined />} onClick={handleSubmitApproval} loading={isSubmitting}>
          提交审批
        </Button>,
        <Button key="edit" icon={<EditOutlined />} onClick={handleEdit}>
          编辑
        </Button>,
        <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleDelete}>
          删除
        </Button>
      )
    } else if (plan.status === 'pending') {
      buttons.push(
        <Button key="withdraw" icon={<RollbackOutlined />} onClick={handleWithdrawApproval} loading={isSubmitting}>
          撤回审批
        </Button>
      )
    } else if (plan.status === 'approved' || plan.status === 'in_progress') {
      // 已批准或进行中的计划可以查看，但不能编辑
    }

    return buttons
  }

  return (
    <div>
      <PageHeader
        title={plan.name}
        description={
          <Space>
            <span>开店计划详情</span>
            <Divider type="vertical" />
            <CalendarOutlined />
            <span>创建时间：{dayjs(plan.createdAt).format('YYYY-MM-DD HH:mm')}</span>
            <Divider type="vertical" />
            <UserOutlined />
            <span>创建人：{plan.createdByName}</span>
          </Space>
        }
        breadcrumbs={[
          { title: '开店计划', path: '/store-plan' },
          { title: plan.name }
        ]}
        onBack={() => navigate('/store-plan')}
        extra={getActionButtons()}
        tags={[
          <StatusTag 
            key="status" 
            status={plan.status} 
            priority={plan.priority}
          />,
          <Tag key="type" color="blue">
            {plan.type === 'direct' ? '直营' : plan.type === 'franchise' ? '加盟' : '合营'}
          </Tag>
        ]}
      />

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成进度"
              value={plan.progress}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ 
                color: plan.progress >= 80 ? '#52c41a' : plan.progress >= 50 ? '#faad14' : '#1890ff'
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="里程碑数量"
              value={plan.milestones?.length || 0}
              suffix="个"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="目标日期"
              value={dayjs(plan.targetOpenDate).diff(dayjs(), 'day')}
              suffix="天后"
              prefix={<CalendarOutlined />}
              valueStyle={{ 
                color: dayjs(plan.targetOpenDate).diff(dayjs(), 'day') < 30 ? '#faad14' : '#52c41a'
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预算金额"
              value={plan.budget / 10000}
              precision={1}
              suffix="万元"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="计划概览" key="overview">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="基本信息" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="计划名称">{plan.name}</Descriptions.Item>
                  <Descriptions.Item label="门店类型">
                    <Tag color="blue">
                      {plan.type === 'direct' ? '直营' : plan.type === 'franchise' ? '加盟' : '合营'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="计划状态">
                    <StatusTag status={plan.status} priority={plan.priority} />
                  </Descriptions.Item>
                  <Descriptions.Item label="目标日期">
                    {dayjs(plan.targetOpenDate).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="预算金额">
                    ¥{(plan.budget / 10000).toFixed(1)} 万元
                  </Descriptions.Item>
                  <Descriptions.Item label="负责人">{plan.createdByName}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {dayjs(plan.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {dayjs(plan.updatedAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col span={12}>
              <ProgressChart storePlan={plan} size="default" showTimeline={false} />
            </Col>
          </Row>

          {plan.description && (
            <Card title="计划描述" style={{ marginTop: 16 }} size="small">
              <p>{plan.description}</p>
            </Card>
          )}
        </TabPane>

        <TabPane tab="进度跟踪" key="progress">
          <ProgressChart storePlan={plan} size="default" showTimeline={true} />
        </TabPane>

        <TabPane tab="审批历史" key="history">
          <Card title="审批历史">
            {plan.approvalHistory && plan.approvalHistory.length > 0 ? (
              <Timeline
                items={plan.approvalHistory.map((item, index) => ({
                  color: item.action === 'approve' ? 'green' : item.action === 'reject' ? 'red' : 'blue',
                  children: (
                    <div key={index}>
                      <div style={{ fontWeight: 'bold' }}>
                        {item.action === 'approve' ? '审批通过' : 
                         item.action === 'reject' ? '审批拒绝' : '审批处理'}
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        {item.approverName} • {dayjs(item.processedAt).format('YYYY-MM-DD HH:mm')}
                      </div>
                      {item.comment && (
                        <div style={{ marginTop: 4 }}>
                          审批意见：{item.comment}
                        </div>
                      )}
                    </div>
                  )
                }))}
              />
            ) : (
              <Empty 
                description="暂无审批记录" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default StorePlanDetail