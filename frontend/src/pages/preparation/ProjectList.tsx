import React, { useState, useMemo } from 'react'
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
  Dropdown,
  Progress,
  Statistic,
  Timeline,
  Badge,
  Tooltip,
  Steps
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  BuildOutlined,
  ProjectOutlined,
  TeamOutlined,
  MoreOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input
const { Step } = Steps

interface ProjectListProps {
  embedded?: boolean
}

const ProjectList: React.FC<ProjectListProps> = ({ embedded = false }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Mock数据
  const mockData = {
    data: [
      {
        id: '1',
        name: '万达广场A区门店筹备项目',
        storeLocation: '北京市朝阳区建国路万达广场A区1F-08',
        storePlanId: '1',
        status: 'construction',
        phase: 'construction',
        progress: 65,
        startDate: '2024-01-15T00:00:00Z',
        expectedEndDate: '2024-03-15T00:00:00Z',
        actualEndDate: null,
        budget: 800000,
        actualCost: 520000,
        projectManager: '张三',
        projectManagerPhone: '13800138001',
        contractor: '北京建工集团',
        region: { id: '1', name: '华北大区' },
        priority: 'high',
        risks: ['材料价格上涨', '工期紧张'],
        milestones: [
          { name: '设计确认', status: 'completed', date: '2024-01-20' },
          { name: '施工许可', status: 'completed', date: '2024-01-25' },
          { name: '主体施工', status: 'in_progress', date: '2024-02-15' },
          { name: '装修施工', status: 'pending', date: '2024-02-28' },
          { name: '验收交付', status: 'pending', date: '2024-03-10' }
        ],
        createdAt: '2024-01-10T10:30:00Z'
      },
      {
        id: '2',
        name: '银泰城B座门店筹备项目',
        storeLocation: '上海市浦东新区张杨路银泰城B座2F-15',
        storePlanId: '2',
        status: 'design',
        phase: 'design',
        progress: 25,
        startDate: '2024-02-01T00:00:00Z',
        expectedEndDate: '2024-04-30T00:00:00Z',
        actualEndDate: null,
        budget: 650000,
        actualCost: 125000,
        projectManager: '李四',
        projectManagerPhone: '13800138002',
        contractor: '上海装饰公司',
        region: { id: '2', name: '华东大区' },
        priority: 'medium',
        risks: ['设计方案待确认'],
        milestones: [
          { name: '设计确认', status: 'in_progress', date: '2024-02-10' },
          { name: '施工许可', status: 'pending', date: '2024-02-20' },
          { name: '主体施工', status: 'pending', date: '2024-03-01' },
          { name: '装修施工', status: 'pending', date: '2024-03-20' },
          { name: '验收交付', status: 'pending', date: '2024-04-25' }
        ],
        createdAt: '2024-01-25T14:20:00Z'
      }
    ],
    meta: { total: 2, page: 1, pageSize: 10 }
  }

  // 状态映射
  const statusMap = {
    planning: { color: 'default', text: '规划中', icon: <ProjectOutlined /> },
    design: { color: 'processing', text: '设计阶段', icon: <EditOutlined /> },
    approval: { color: 'warning', text: '审批中', icon: <ClockCircleOutlined /> },
    construction: { color: 'processing', text: '施工中', icon: <BuildOutlined /> },
    acceptance: { color: 'warning', text: '验收中', icon: <CheckCircleOutlined /> },
    delivery: { color: 'success', text: '交付中', icon: <SyncOutlined spin /> },
    completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
    suspended: { color: 'error', text: '已暂停', icon: <ExclamationCircleOutlined /> }
  }

  const phaseMap = {
    planning: { color: 'default', text: '规划阶段' },
    design: { color: 'blue', text: '设计阶段' },
    approval: { color: 'orange', text: '审批阶段' },
    construction: { color: 'processing', text: '施工阶段' },
    acceptance: { color: 'warning', text: '验收阶段' },
    delivery: { color: 'purple', text: '交付阶段' }
  }

  const priorityMap = {
    low: { color: 'default', text: '低' },
    medium: { color: 'warning', text: '中' },
    high: { color: 'error', text: '高' },
    urgent: { color: 'error', text: '紧急' }
  }

  // 计算统计数据
  const statsCards = useMemo(() => {
    const data = mockData.data
    return [
      {
        title: '筹备项目总数',
        value: data.length,
        precision: 0,
        valueStyle: { color: '#1890ff' },
        prefix: <ProjectOutlined />
      },
      {
        title: '施工中',
        value: data.filter(item => item.status === 'construction').length,
        precision: 0,
        valueStyle: { color: '#faad14' },
        prefix: <BuildOutlined />
      },
      {
        title: '已完成',
        value: data.filter(item => item.status === 'completed').length,
        precision: 0,
        valueStyle: { color: '#52c41a' },
        prefix: <CheckCircleOutlined />
      },
      {
        title: '平均进度',
        value: data.reduce((sum, item) => sum + item.progress, 0) / data.length,
        precision: 1,
        suffix: '%',
        valueStyle: { color: '#722ed1' },
        prefix: <SyncOutlined />
      }
    ]
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '项目信息',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => handleView(record.id)} style={{ fontWeight: 'bold' }}>
            {text}
          </a>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            <BuildOutlined /> {record.storeLocation}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            项目经理: {record.projectManager} | {record.projectManagerPhone}
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status as keyof typeof statusMap]
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '阶段',
      dataIndex: 'phase',
      key: 'phase',
      width: 100,
      render: (phase: string) => {
        const config = phaseMap[phase as keyof typeof phaseMap]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress: number, record: any) => (
        <div>
          <Progress 
            percent={progress} 
            size="small" 
            status={progress === 100 ? 'success' : record.status === 'suspended' ? 'exception' : 'active'}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            预算: ¥{(record.budget / 10000).toFixed(1)}万
          </div>
        </div>
      )
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
      title: '大区',
      dataIndex: ['region', 'name'],
      key: 'region',
      width: 100
    },
    {
      title: '工期',
      key: 'duration',
      width: 140,
      render: (_: any, record: any) => {
        const startDate = dayjs(record.startDate)
        const endDate = dayjs(record.expectedEndDate)
        const isOverdue = endDate.isBefore(dayjs()) && record.status !== 'completed'
        
        return (
          <div>
            <div style={{ fontSize: '12px' }}>
              {startDate.format('MM-DD')} ~ {endDate.format('MM-DD')}
            </div>
            <div style={{ fontSize: '12px', marginTop: 2 }}>
              <span style={{ color: isOverdue ? '#ff4d4f' : '#666' }}>
                剩余: {endDate.diff(dayjs(), 'day')}天
              </span>
              {isOverdue && <Tag color="error" size="small">逾期</Tag>}
            </div>
          </div>
        )
      }
    },
    {
      title: '承包商',
      dataIndex: 'contractor',
      key: 'contractor',
      width: 120,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        const items = [
          {
            key: 'view',
            label: '查看详情',
            icon: <EyeOutlined />,
            onClick: () => handleView(record.id)
          },
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record.id)
          },
          {
            key: 'timeline',
            label: '进度跟踪',
            onClick: () => handleTimeline(record.id)
          },
          {
            type: 'divider' as const
          },
          {
            key: 'suspend',
            label: record.status === 'suspended' ? '恢复项目' : '暂停项目',
            onClick: () => handleSuspend(record.id, record.status === 'suspended')
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record.id),
            danger: true,
            disabled: record.status !== 'planning'
          }
        ]

        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            >
              查看
            </Button>
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        )
      }
    }
  ]

  // 事件处理函数
  const handleView = (id: string) => {
    navigate(`/preparation/projects/${id}`)
  }

  const handleEdit = (id: string) => {
    navigate(`/preparation/projects/${id}/edit`)
  }

  const handleCreate = () => {
    navigate('/preparation/projects/create')
  }

  const handleTimeline = (id: string) => {
    navigate(`/preparation/projects/${id}/timeline`)
  }

  const handleSuspend = (id: string, isResume: boolean) => {
    const action = isResume ? '恢复' : '暂停'
    Modal.confirm({
      title: `确认${action}项目`,
      content: `确定要${action}这个项目吗？`,
      onOk: async () => {
        try {
          message.success(`项目${action}成功`)
        } catch (error) {
          message.error(`项目${action}失败`)
        }
      }
    })
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个项目吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          message.success('删除成功')
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSearch = (values: any) => {
    console.log('Search values:', values)
  }

  const handleReset = () => {
    form.resetFields()
  }

  const pageHeaderContent = !embedded && (
    <PageHeader
      title="筹备项目管理"
      description="管理开店筹备项目的全生命周期，包括设计、施工、验收等阶段"
      breadcrumbs={[
        { title: '开店筹备', path: '/preparation' },
        { title: '筹备项目' }
      ]}
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />}>
          刷新
        </Button>,
        <Button key="export" icon={<ExportOutlined />}>
          导出
        </Button>,
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建项目
        </Button>
      ]}
    />
  )

  return (
    <div>
      {pageHeaderContent}

      {/* 统计卡片 */}
      {!embedded && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {statsCards.map((stat, index) => (
            <Col span={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  precision={stat.precision}
                  suffix={stat.suffix}
                  valueStyle={stat.valueStyle}
                  prefix={stat.prefix}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

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
                  placeholder="搜索项目名称、门店位置、项目经理"
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
                <Form.Item name="status" label="项目状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value="planning">规划中</Option>
                    <Option value="design">设计阶段</Option>
                    <Option value="approval">审批中</Option>
                    <Option value="construction">施工中</Option>
                    <Option value="acceptance">验收中</Option>
                    <Option value="delivery">交付中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="suspended">已暂停</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="phase" label="当前阶段">
                  <Select placeholder="请选择" allowClear>
                    <Option value="planning">规划阶段</Option>
                    <Option value="design">设计阶段</Option>
                    <Option value="approval">审批阶段</Option>
                    <Option value="construction">施工阶段</Option>
                    <Option value="acceptance">验收阶段</Option>
                    <Option value="delivery">交付阶段</Option>
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
                <Form.Item name="region" label="大区">
                  <Select placeholder="请选择" allowClear>
                    <Option value="huabei">华北大区</Option>
                    <Option value="huanan">华南大区</Option>
                    <Option value="huadong">华东大区</Option>
                    <Option value="huaxi">华西大区</Option>
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
          scroll={{ x: 1400 }}
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
    </div>
  )
}

export default ProjectList