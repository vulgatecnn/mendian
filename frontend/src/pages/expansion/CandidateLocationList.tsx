import React, { useState, useEffect } from 'react'
import {
  Button,
  Table,
  Tag,
  Space,
  Card,
  Modal,
  message,
  Dropdown,
  Progress,
  Statistic,
  Badge,
  Row,
  Col,
  Avatar,
  Tooltip,
  Rate,
  Typography
} from 'antd'

const { Text } = Typography
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  MoreOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  HomeOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import AdaptiveTable from '@/components/responsive/AdaptiveTable'
import dayjs from 'dayjs'

const CandidateLocationList: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Mock 数据
  const mockData = [
    {
      id: '1',
      name: '万达广场A区候选点位',
      businessCircle: '中关村商圈',
      propertyType: 'MALL_SHOP',
      status: 'INVESTIGATING',
      priority: 'HIGH',
      score: 8.5,
      area: 120,
      rent: 25000,
      address: '北京市海淀区中关村大街1号万达广场A区1F-08',
      discoveredAt: '2024-01-15T10:30:00Z',
      discoveredByName: '张三',
      _count: { followUpRecords: 5 }
    },
    {
      id: '2',
      name: '银泰城B座潜力点位',
      businessCircle: '王府井商圈',
      propertyType: 'STREET_SHOP',
      status: 'NEGOTIATING',
      priority: 'URGENT',
      score: 9.2,
      area: 85,
      rent: 18000,
      address: '北京市东城区王府井大街100号银泰城B座2F-15',
      discoveredAt: '2024-01-20T14:20:00Z',
      discoveredByName: '李四',
      _count: { followUpRecords: 8 }
    }
  ]

  // 状态映射
  const statusMap = {
    DISCOVERED: { color: 'default', text: '已发现', icon: <EyeOutlined /> },
    INVESTIGATING: { color: 'processing', text: '调研中', icon: <BarChartOutlined /> },
    NEGOTIATING: { color: 'warning', text: '谈判中', icon: <TeamOutlined /> },
    APPROVED: { color: 'success', text: '已通过', icon: <StarOutlined /> },
    REJECTED: { color: 'error', text: '已拒绝', icon: <ExclamationCircleOutlined /> },
    SIGNED: { color: 'success', text: '已签约', icon: <StarOutlined /> }
  }

  const priorityMap = {
    LOW: { color: 'default', text: '低' },
    MEDIUM: { color: 'blue', text: '中' },
    HIGH: { color: 'orange', text: '高' },
    URGENT: { color: 'red', text: '紧急' }
  }

  const propertyTypeMap = {
    STREET_SHOP: { color: 'blue', text: '临街商铺' },
    MALL_SHOP: { color: 'green', text: '商场店铺' },
    OFFICE_BUILDING: { color: 'purple', text: '写字楼' },
    RESIDENTIAL: { color: 'orange', text: '住宅底商' },
    STANDALONE: { color: 'cyan', text: '独立建筑' }
  }

  // 统计卡片数据
  const statsCards = [
    {
      title: '总候选点位',
      value: mockData.length,
      precision: 0,
      valueStyle: { color: '#1890ff' },
      prefix: <HomeOutlined />
    },
    {
      title: '调研中',
      value: mockData.filter(item => item.status === 'INVESTIGATING').length,
      precision: 0,
      valueStyle: { color: '#faad14' },
      prefix: <BarChartOutlined />
    },
    {
      title: '谈判中',
      value: mockData.filter(item => item.status === 'NEGOTIATING').length,
      precision: 0,
      valueStyle: { color: '#fa8c16' },
      prefix: <TeamOutlined />
    },
    {
      title: '已签约',
      value: mockData.filter(item => item.status === 'SIGNED').length,
      precision: 0,
      valueStyle: { color: '#52c41a' },
      prefix: <StarOutlined />
    }
  ]

  // 表格列定义
  const columns = [
    {
      title: '点位名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Space>
            <a onClick={() => handleView(record.id)}>{text}</a>
            {record.priority === 'URGENT' && <Badge color="red" text="紧急" />}
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.businessCircle}
          </Text>
        </Space>
      )
    },
    {
      title: '物业类型',
      dataIndex: 'propertyType',
      key: 'propertyType',
      width: 120,
      render: (type: any) => {
        const config = propertyTypeMap[type as keyof typeof propertyTypeMap]
        return <Tag color={config?.color}>{config?.text || type}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: any, record: any) => {
        const config = statusMap[status as keyof typeof statusMap]
        return (
          <Space>
            <Tag color={config?.color} icon={config?.icon}>
              {config?.text}
            </Tag>
            {record.priority === 'URGENT' && <Badge status="error" />}
          </Space>
        )
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: any) => {
        const config = priorityMap[priority as keyof typeof priorityMap]
        return <Tag color={config?.color}>{config?.text}</Tag>
      }
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <Space direction="vertical" size={0}>
          <Rate disabled value={score / 2} allowHalf style={{ fontSize: 14 }} />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {score ? score.toFixed(1) : '-'}/10
          </span>
        </Space>
      )
    },
    {
      title: '面积/租金',
      key: 'areaRent',
      width: 120,
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <span>{record.area || '-'}㎡</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            ¥{record.rent ? (record.rent / 10000).toFixed(1) : '-'}万/月
          </span>
        </Space>
      )
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 200,
      ellipsis: true,
      render: (address: string) => (
        <Tooltip title={address}>
          <Space>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            {address}
          </Space>
        </Tooltip>
      )
    },
    {
      title: '发现时间',
      dataIndex: 'discoveredAt',
      key: 'discoveredAt',
      width: 120,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <span>{dayjs(date).format('MM-DD')}</span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(date).format('HH:mm')}
          </span>
        </Space>
      )
    },
    {
      title: '发现人',
      dataIndex: 'discoveredByName',
      key: 'discoveredByName',
      width: 100,
      render: (name: string) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {name?.[0] || '?'}
          </Avatar>
          <span>{name || '-'}</span>
        </Space>
      )
    },
    {
      title: '跟进数',
      key: 'followUpCount',
      width: 80,
      align: 'center' as const,
      render: (record: any) => (
        <Badge 
          count={record._count?.followUpRecords || 0} 
          style={{ backgroundColor: '#52c41a' }}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
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
            key: 'followUp',
            label: '添加跟进',
            icon: <PhoneOutlined />,
            onClick: () => handleAddFollowUp(record.id)
          },
          {
            type: 'divider' as const
          },
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            onClick: () => handleDelete(record.id),
            danger: true,
            disabled: record.status === 'SIGNED'
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
            <Button
              size="small"
              icon={<PhoneOutlined />}
              onClick={() => handleAddFollowUp(record.id)}
            >
              跟进
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

  const handleAddFollowUp = (id: string) => {
    navigate(`/expansion/candidates/${id}/follow-up/create`)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个候选点位吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        message.success('删除成功')
      }
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success('数据已刷新')
    }, 1000)
  }

  return (
    <div>
      <PageHeader
        title="候选点位管理"
        description="管理拓店候选点位，包括实地调研、商务谈判等全流程跟进"
        breadcrumbs={[
          { title: '拓店管理', path: '/expansion' },
          { title: '候选点位' }
        ]}
        extra={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>,
          <Button key="export" icon={<ExportOutlined />}>
            导出
          </Button>,
          <Button key="import" icon={<ImportOutlined />}>
            导入
          </Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增候选点位
          </Button>
        ]}
      />

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statsCards.map((stat, index) => (
          <Col xs={24} sm={12} md={6} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={stat.precision}
                valueStyle={stat.valueStyle}
                prefix={stat.prefix}
                loading={loading}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 主表格 */}
      <Card>
        <AdaptiveTable
          rowKey="id"
          columns={columns}
          dataSource={mockData}
          loading={loading}
          mobileCardLayout
          mobilePagination
          pagination={{
            current: 1,
            pageSize: 10,
            total: mockData.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          mobileCardRender={(record, index) => (
            <Card
              size="small"
              title={
                <Space>
                  <span>{record.name}</span>
                  {record.priority === 'URGENT' && <Badge color="red" text="紧急" />}
                </Space>
              }
              extra={
                <Button size="small" type="primary" onClick={() => handleView(record.id)}>
                  查看
                </Button>
              }
              style={{ marginBottom: 8 }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {record.businessCircle}
                </Text>
                <div>
                  <Tag color={propertyTypeMap[record.propertyType as keyof typeof propertyTypeMap]?.color}>
                    {propertyTypeMap[record.propertyType as keyof typeof propertyTypeMap]?.text}
                  </Tag>
                  <Tag color={statusMap[record.status as keyof typeof statusMap]?.color} 
                       icon={statusMap[record.status as keyof typeof statusMap]?.icon}>
                    {statusMap[record.status as keyof typeof statusMap]?.text}
                  </Tag>
                  <Tag color={priorityMap[record.priority as keyof typeof priorityMap]?.color}>
                    {priorityMap[record.priority as keyof typeof priorityMap]?.text}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>评分：{record.score?.toFixed(1)}/10</span>
                  <span style={{ color: '#666' }}>面积：{record.area}㎡</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>租金：¥{(record.rent / 10000).toFixed(1)}万/月</span>
                  <span style={{ color: '#666' }}>跟进：{record._count?.followUpRecords || 0}次</span>
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  {record.address}
                </div>
              </Space>
            </Card>
          )}
        />
      </Card>
    </div>
  )
}

export default CandidateLocationList