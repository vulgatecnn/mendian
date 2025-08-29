import React, { useState } from 'react'
import {
  Button,
  Table,
  Tag,
  Space,
  Card,
  Form,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Timeline,
  Avatar,
  Progress,
  Statistic,
  Badge,
  Tooltip,
  Drawer
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  CommentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input
const { TextArea } = TextArea

interface FollowListProps {
  embedded?: boolean
}

const FollowList: React.FC<FollowListProps> = ({ embedded = false }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showFollowDrawer, setShowFollowDrawer] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<any>(null)

  // Mock数据
  const mockData = {
    data: [
      {
        id: '1',
        candidateId: '1',
        candidateName: '万达广场A区铺位',
        followType: 'site_visit',
        followStatus: 'completed',
        nextFollowDate: '2024-02-05T10:00:00Z',
        priority: 'high',
        followerName: '张三',
        followerPhone: '13800138001',
        content: '实地考察了铺位位置，人流量确实不错，但租金偏高需要进一步谈判',
        result: '基本满意，建议继续谈判',
        createdAt: '2024-02-01T14:20:00Z',
        images: [],
        timeline: [
          {
            id: '1',
            type: 'site_visit',
            title: '实地考察',
            content: '实地考察了铺位位置，人流量确实不错',
            result: 'positive',
            createdAt: '2024-02-01T14:20:00Z',
            createdBy: '张三'
          },
          {
            id: '2',
            type: 'negotiation',
            title: '商务洽谈',
            content: '与业主进行了初步价格谈判',
            result: 'pending',
            createdAt: '2024-01-28T10:30:00Z',
            createdBy: '李四'
          }
        ]
      },
      {
        id: '2',
        candidateId: '2',
        candidateName: '银泰城B座商铺',
        followType: 'negotiation',
        followStatus: 'in_progress',
        nextFollowDate: '2024-02-03T15:00:00Z',
        priority: 'medium',
        followerName: '李四',
        followerPhone: '13800138002',
        content: '与业主商讨租金和装修补贴事宜',
        result: '需要进一步协商',
        createdAt: '2024-02-02T16:45:00Z',
        images: [],
        timeline: [
          {
            id: '3',
            type: 'phone_call',
            title: '电话沟通',
            content: '与业主电话沟通基本条件',
            result: 'positive',
            createdAt: '2024-02-02T16:45:00Z',
            createdBy: '李四'
          }
        ]
      }
    ],
    meta: { total: 2, page: 1, pageSize: 10 }
  }

  // 跟进类型映射
  const followTypeMap = {
    phone_call: { color: 'blue', text: '电话沟通', icon: <PhoneOutlined /> },
    site_visit: { color: 'green', text: '实地考察', icon: <EyeOutlined /> },
    negotiation: { color: 'orange', text: '商务洽谈', icon: <CommentOutlined /> },
    document_review: { color: 'purple', text: '资料审核', icon: <EditOutlined /> },
    contract_signing: { color: 'red', text: '合同签署', icon: <EditOutlined /> }
  }

  const followStatusMap = {
    pending: { color: 'default', text: '待跟进' },
    in_progress: { color: 'processing', text: '跟进中' },
    completed: { color: 'success', text: '已完成' },
    cancelled: { color: 'error', text: '已取消' }
  }

  const priorityMap = {
    low: { color: 'default', text: '低' },
    medium: { color: 'warning', text: '中' },
    high: { color: 'error', text: '高' },
    urgent: { color: 'error', text: '紧急' }
  }

  const resultMap = {
    positive: { color: 'success', text: '积极' },
    neutral: { color: 'warning', text: '一般' },
    negative: { color: 'error', text: '消极' },
    pending: { color: 'processing', text: '待定' }
  }

  // 表格列定义
  const columns = [
    {
      title: '候选点位',
      dataIndex: 'candidateName',
      key: 'candidateName',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => navigate(`/expansion/candidates/${record.candidateId}`)}>
            {text}
          </a>
        </div>
      )
    },
    {
      title: '跟进类型',
      dataIndex: 'followType',
      key: 'followType',
      width: 120,
      render: (type: string) => {
        const config = followTypeMap[type as keyof typeof followTypeMap]
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '跟进状态',
      dataIndex: 'followStatus',
      key: 'followStatus',
      width: 100,
      render: (status: string) => {
        const config = followStatusMap[status as keyof typeof followStatusMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const config = priorityMap[priority as keyof typeof priorityMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '跟进人',
      dataIndex: 'followerName',
      key: 'followerName',
      width: 100,
      render: (name: string, record: any) => (
        <div>
          <Avatar size="small" icon={<UserOutlined />} />
          <span style={{ marginLeft: 8 }}>{name}</span>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <PhoneOutlined /> {record.followerPhone}
          </div>
        </div>
      )
    },
    {
      title: '下次跟进',
      dataIndex: 'nextFollowDate',
      key: 'nextFollowDate',
      width: 120,
      render: (date: string) => {
        if (!date) return '-'
        const nextDate = dayjs(date)
        const isOverdue = nextDate.isBefore(dayjs())
        return (
          <div>
            <div style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
              {nextDate.format('MM-DD HH:mm')}
            </div>
            {isOverdue && (
              <Tag color="error" size="small">逾期</Tag>
            )}
          </div>
        )
      }
    },
    {
      title: '最新跟进',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleAddFollow(record)}
          >
            添加跟进
          </Button>
        </Space>
      )
    }
  ]

  // 事件处理
  const handleViewDetail = (record: any) => {
    setCurrentRecord(record)
    setShowFollowDrawer(true)
  }

  const handleAddFollow = (record: any) => {
    navigate(`/expansion/candidates/${record.candidateId}/follow/create`)
  }

  const handleCreate = () => {
    navigate('/expansion/follow/create')
  }

  const handleSearch = (values: any) => {
    console.log('Search values:', values)
  }

  const handleReset = () => {
    form.resetFields()
  }

  const renderFollowTimeline = (timeline: any[]) => {
    const timelineItems = timeline.map(item => ({
      color: resultMap[item.result as keyof typeof resultMap]?.color || 'blue',
      children: (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {followTypeMap[item.type as keyof typeof followTypeMap]?.text}
            <Tag size="small" color={resultMap[item.result as keyof typeof resultMap]?.color} style={{ marginLeft: 8 }}>
              {resultMap[item.result as keyof typeof resultMap]?.text}
            </Tag>
          </div>
          <div style={{ color: '#666', marginBottom: 4 }}>
            {item.content}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {item.createdBy} • {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      )
    }))

    return <Timeline items={timelineItems} />
  }

  const pageHeaderContent = !embedded && (
    <PageHeader
      title="跟进管理"
      description="管理候选点位跟进记录和任务安排"
      breadcrumbs={[
        { title: '拓店管理', path: '/expansion' },
        { title: '跟进管理' }
      ]}
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />}>
          刷新
        </Button>,
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增跟进
        </Button>
      ]}
    />
  )

  return (
    <div>
      {pageHeaderContent}

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col flex="auto">
              <Form.Item name="keyword">
                <Search
                  placeholder="搜索候选点位、跟进人"
                  allowClear
                  style={{ width: 300 }}
                  onSearch={() => form.submit()}
                />
              </Form.Item>
            </Col>
            <Col>
              <Space>
                <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? '收起筛选' : '展开筛选'}
                </Button>
                <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>

          {showFilters && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Form.Item name="followType" label="跟进类型">
                  <Select placeholder="请选择" allowClear>
                    <Option value="phone_call">电话沟通</Option>
                    <Option value="site_visit">实地考察</Option>
                    <Option value="negotiation">商务洽谈</Option>
                    <Option value="document_review">资料审核</Option>
                    <Option value="contract_signing">合同签署</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="followStatus" label="跟进状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value="pending">待跟进</Option>
                    <Option value="in_progress">跟进中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="cancelled">已取消</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="priority" label="优先级">
                  <Select placeholder="请选择" allowClear>
                    <Option value="low">低</Option>
                    <Option value="medium">中</Option>
                    <Option value="high">高</Option>
                    <Option value="urgent">紧急</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="follower" label="跟进人">
                  <Select placeholder="请选择" allowClear>
                    <Option value="zhangsan">张三</Option>
                    <Option value="lisi">李四</Option>
                    <Option value="wangwu">王五</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Card>

      {/* 主表格 */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={mockData.data}
          loading={false}
          scroll={{ x: 1000 }}
          pagination={{
            current: 1,
            pageSize: 10,
            total: mockData.meta.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 跟进详情抽屉 */}
      <Drawer
        title="跟进详情"
        open={showFollowDrawer}
        onClose={() => setShowFollowDrawer(false)}
        width={600}
      >
        {currentRecord && (
          <div>
            <Card title="候选点位信息" size="small" style={{ marginBottom: 16 }}>
              <p><strong>点位名称：</strong>{currentRecord.candidateName}</p>
              <p><strong>跟进人：</strong>{currentRecord.followerName}</p>
              <p><strong>联系电话：</strong>{currentRecord.followerPhone}</p>
              <p><strong>下次跟进：</strong>{dayjs(currentRecord.nextFollowDate).format('YYYY-MM-DD HH:mm')}</p>
            </Card>

            <Card title="跟进历程" size="small">
              {renderFollowTimeline(currentRecord.timeline)}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default FollowList