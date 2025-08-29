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
  Divider,
  Badge,
  Tooltip,
  Rate,
  Image
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  StarOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import { useExpansion } from '@/services/query/hooks'
import type { CandidateLocation, CandidateQueryParams } from '@/services/types'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input

interface CandidateListProps {
  embedded?: boolean
}

const CandidateList: React.FC<CandidateListProps> = ({ embedded = false }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [queryParams, setQueryParams] = useState<CandidateQueryParams>({
    page: 1,
    pageSize: 10
  })
  const [showFilters, setShowFilters] = useState(false)

  // Mock数据 - 实际项目中应该从API获取
  const mockData = {
    data: [
      {
        id: '1',
        name: '万达广场A区铺位',
        address: '北京市朝阳区建国路万达广场A区1F-08',
        area: 120,
        rentPrice: 15000,
        status: 'evaluating',
        priority: 'high',
        region: { id: '1', name: '华北大区' },
        followStatus: 'following',
        score: 4.2,
        advantages: ['人流量大', '地理位置优', '交通便利'],
        disadvantages: ['租金较高', '竞争激烈'],
        createdAt: '2024-01-15T10:30:00Z',
        createdByName: '张三',
        lastFollowAt: '2024-02-01T14:20:00Z',
        images: [
          'https://via.placeholder.com/200x150?text=Location+1',
          'https://via.placeholder.com/200x150?text=Location+2'
        ]
      },
      {
        id: '2',
        name: '银泰城B座商铺',
        address: '上海市浦东新区张杨路银泰城B座2F-15',
        area: 95,
        rentPrice: 12000,
        status: 'negotiating',
        priority: 'medium',
        region: { id: '2', name: '华东大区' },
        followStatus: 'following',
        score: 3.8,
        advantages: ['性价比高', '周边配套完善'],
        disadvantages: ['面积偏小'],
        createdAt: '2024-01-20T09:15:00Z',
        createdByName: '李四',
        lastFollowAt: '2024-02-02T16:45:00Z',
        images: [
          'https://via.placeholder.com/200x150?text=Location+3'
        ]
      }
    ],
    meta: { total: 2, page: 1, pageSize: 10 }
  }

  const { data: statsData } = useExpansion?.useExpansionStats?.() || { data: null }

  // 状态映射
  const statusMap = {
    pending: { color: 'default', text: '待评估', icon: <ClockCircleOutlined /> },
    evaluating: { color: 'processing', text: '评估中', icon: <SyncOutlined spin /> },
    negotiating: { color: 'warning', text: '商务洽谈', icon: <TeamOutlined /> },
    approved: { color: 'success', text: '已通过', icon: <CheckCircleOutlined /> },
    rejected: { color: 'error', text: '已拒绝', icon: <DeleteOutlined /> },
    on_hold: { color: 'default', text: '暂缓', icon: <ClockCircleOutlined /> }
  }

  const priorityMap = {
    low: { color: 'default', text: '低' },
    medium: { color: 'warning', text: '中' },
    high: { color: 'error', text: '高' },
    urgent: { color: 'error', text: '紧急' }
  }

  const followStatusMap = {
    not_started: { color: 'default', text: '未开始' },
    following: { color: 'processing', text: '跟进中' },
    completed: { color: 'success', text: '已完成' },
    failed: { color: 'error', text: '跟进失败' }
  }

  // 计算统计数据
  const statsCards = useMemo(() => {
    const data = mockData.data
    return [
      {
        title: '候选点位总数',
        value: data.length,
        precision: 0,
        valueStyle: { color: '#1890ff' },
        prefix: <EnvironmentOutlined />
      },
      {
        title: '跟进中',
        value: data.filter(item => item.followStatus === 'following').length,
        precision: 0,
        valueStyle: { color: '#faad14' },
        prefix: <SyncOutlined spin />
      },
      {
        title: '已通过',
        value: data.filter(item => item.status === 'approved').length,
        precision: 0,
        valueStyle: { color: '#52c41a' },
        prefix: <CheckCircleOutlined />
      },
      {
        title: '平均评分',
        value: data.reduce((sum, item) => sum + item.score, 0) / data.length,
        precision: 1,
        valueStyle: { color: '#722ed1' },
        prefix: <StarOutlined />
      }
    ]
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '点位信息',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => handleView(record.id)} style={{ fontWeight: 'bold' }}>
            {text}
          </a>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            <EnvironmentOutlined /> {record.address}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            面积: {record.area}㎡ | 租金: ¥{record.rentPrice}/月
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
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <div>
          <Rate disabled value={score} allowHalf />
          <div style={{ fontSize: '12px', color: '#666' }}>{score.toFixed(1)}</div>
        </div>
      )
    },
    {
      title: '大区',
      dataIndex: ['region', 'name'],
      key: 'region',
      width: 100
    },
    {
      title: '最后跟进',
      dataIndex: 'lastFollowAt',
      key: 'lastFollowAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-'
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 100
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
            key: 'follow',
            label: '跟进记录',
            onClick: () => handleFollow(record.id)
          },
          {
            type: 'divider' as const
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record.id),
            danger: true
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
    navigate(`/expansion/candidates/${id}`)
  }

  const handleEdit = (id: string) => {
    navigate(`/expansion/candidates/${id}/edit`)
  }

  const handleCreate = () => {
    navigate('/expansion/candidates/create')
  }

  const handleFollow = (id: string) => {
    navigate(`/expansion/candidates/${id}/follow`)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个候选点位吗？删除后无法恢复。',
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

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的项目')
      return
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个点位吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          message.success(`成功删除 ${selectedRowKeys.length} 个点位`)
          setSelectedRowKeys([])
        } catch (error) {
          message.error('批量删除失败')
        }
      }
    })
  }

  const handleSearch = (values: any) => {
    const newParams = {
      ...queryParams,
      ...values,
      page: 1
    }
    setQueryParams(newParams)
  }

  const handleReset = () => {
    form.resetFields()
    setQueryParams({ page: 1, pageSize: 10 })
  }

  const handleTableChange = (pagination: any) => {
    setQueryParams({
      ...queryParams,
      page: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[], selectedRows: any[]) => {
      setSelectedRowKeys(keys as string[])
    }
  }

  const pageHeaderContent = !embedded && (
    <PageHeader
      title="候选点位管理"
      description="管理拓店候选点位，包括点位评估、商务洽谈等"
      breadcrumbs={[
        { title: '拓店管理', path: '/expansion' },
        { title: '候选点位' }
      ]}
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />}>
          刷新
        </Button>,
        <Button key="export" icon={<ExportOutlined />}>
          导出
        </Button>,
        <Button key="import" icon={<ImportOutlined />}>
          导入
        </Button>,
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增点位
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
                  placeholder="搜索点位名称、地址"
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
                <Form.Item name="status" label="状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value="pending">待评估</Option>
                    <Option value="evaluating">评估中</Option>
                    <Option value="negotiating">商务洽谈</Option>
                    <Option value="approved">已通过</Option>
                    <Option value="rejected">已拒绝</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="followStatus" label="跟进状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value="not_started">未开始</Option>
                    <Option value="following">跟进中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="failed">跟进失败</Option>
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

      {/* 操作栏 */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Divider type="vertical" />
            <Button danger onClick={handleBatchDelete}>
              批量删除
            </Button>
            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </Card>
      )}

      {/* 主表格 */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={mockData.data}
          rowSelection={rowSelection}
          loading={false}
          scroll={{ x: 1200 }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: mockData.meta.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default CandidateList