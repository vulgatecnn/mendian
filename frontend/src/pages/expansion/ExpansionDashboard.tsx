import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
  Alert,
  Empty,
  Tooltip,
  Typography,
  Divider,
  Badge,
  Avatar,
  List
} from 'antd'
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  HomeOutlined,
  TeamOutlined,
  BarChartOutlined,
  EyeOutlined,
  PhoneOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const ExpansionDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ])
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // Mock数据
  const mockStats = {
    overview: {
      total: 35,
      discovered: 8,
      investigating: 12,
      negotiating: 6,
      signed: 4,
      rejected: 5
    },
    byStatus: {
      DISCOVERED: 8,
      INVESTIGATING: 12,
      NEGOTIATING: 6,
      APPROVED: 3,
      REJECTED: 5,
      SIGNED: 4
    },
    byRegion: [
      { regionId: '1', regionName: '华北大区', count: 15, averageScore: 8.2, averageRent: 12000 },
      { regionId: '2', regionName: '华东大区', count: 12, averageScore: 7.8, averageRent: 15000 },
      { regionId: '3', regionName: '华南大区', count: 8, averageScore: 8.5, averageRent: 18000 }
    ],
    performance: {
      averageScore: 8.1,
      averageRent: 14500,
      conversionRate: 15.8,
      averageFollowUpDays: 12
    }
  }

  const mockCandidateLocations = [
    {
      id: '1',
      name: '万达广场A区候选点位',
      status: 'NEGOTIATING',
      priority: 'URGENT'
    },
    {
      id: '2',
      name: '银泰城B座潜力点位',
      status: 'INVESTIGATING',
      priority: 'HIGH'
    }
  ]

  const mockFollowUpRecords = [
    {
      id: '1',
      candidateLocationName: '万达广场A区候选点位',
      createdAt: '2024-01-20T10:30:00Z',
      content: '实地考察完成，租金谈判中',
      nextActionDate: '2024-01-18T10:00:00Z'
    }
  ]

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const handleExport = () => {
    console.log('导出统计报告')
  }

  // 状态映射
  const statusMap = {
    DISCOVERED: { color: 'default', text: '已发现' },
    INVESTIGATING: { color: 'processing', text: '调研中' },
    NEGOTIATING: { color: 'warning', text: '谈判中' },
    APPROVED: { color: 'success', text: '已通过' },
    REJECTED: { color: 'error', text: '已拒绝' },
    SIGNED: { color: 'success', text: '已签约' }
  }

  // KPI指标卡片
  const renderKPICards = () => {
    const kpis = [
      {
        title: '总候选点位',
        value: mockStats.overview.total,
        precision: 0,
        prefix: <HomeOutlined />,
        suffix: '个',
        trend: '+12%',
        trendIcon: <RiseOutlined style={{ color: '#52c41a' }} />,
        color: '#1890ff'
      },
      {
        title: '本月新增',
        value: mockStats.overview.discovered,
        precision: 0,
        prefix: <EyeOutlined />,
        suffix: '个',
        trend: '+8%',
        trendIcon: <RiseOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      },
      {
        title: '谈判中',
        value: mockStats.overview.negotiating,
        precision: 0,
        prefix: <TeamOutlined />,
        suffix: '个',
        trend: '+5%',
        trendIcon: <RiseOutlined style={{ color: '#52c41a' }} />,
        color: '#faad14'
      },
      {
        title: '已签约',
        value: mockStats.overview.signed,
        precision: 0,
        prefix: <StarOutlined />,
        suffix: '个',
        trend: '+15%',
        trendIcon: <RiseOutlined style={{ color: '#52c41a' }} />,
        color: '#722ed1'
      },
      {
        title: '平均评分',
        value: mockStats.performance.averageScore,
        precision: 1,
        suffix: '分',
        color: '#fa8c16'
      },
      {
        title: '平均租金',
        value: mockStats.performance.averageRent / 10000,
        precision: 1,
        prefix: <DollarOutlined />,
        suffix: '万/月',
        color: '#13c2c2'
      },
      {
        title: '转化率',
        value: mockStats.performance.conversionRate,
        precision: 1,
        suffix: '%',
        color: '#eb2f96'
      },
      {
        title: '跟进天数',
        value: mockStats.performance.averageFollowUpDays,
        precision: 0,
        prefix: <CalendarOutlined />,
        suffix: '天',
        color: '#f5222d'
      }
    ]

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {kpis.map((kpi, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={kpi.title}
                value={kpi.value}
                precision={kpi.precision}
                prefix={kpi.prefix}
                suffix={kpi.suffix}
                valueStyle={{ color: kpi.color }}
                loading={loading}
              />
              {kpi.trend && (
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  {kpi.trendIcon}
                  <span style={{ marginLeft: 4, color: '#666' }}>
                    较上期 {kpi.trend}
                  </span>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  // 状态分布图表（简化版本）
  const renderStatusChart = () => {
    const data = Object.entries(mockStats.byStatus).map(([status, count]) => ({
      type: statusMap[status as keyof typeof statusMap]?.text || status,
      value: count as number
    })).filter(item => item.value > 0)

    return (
      <Card title="状态分布" style={{ height: 400 }}>
        <div style={{ padding: 20 }}>
          {data.map((item, index) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{item.type}</span>
                <span>{item.value}</span>
              </div>
              <Progress 
                percent={(item.value / mockStats.overview.total) * 100} 
                showInfo={false}
                strokeColor={['#1890ff', '#52c41a', '#faad14', '#fa8c16', '#f5222d'][index % 5]}
              />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // 待办事项列表
  const renderTodoList = () => {
    const urgentTasks = mockCandidateLocations
      .filter(location => location.priority === 'URGENT' || location.status === 'NEGOTIATING')
      .slice(0, 5)

    const overdueFollowUps = mockFollowUpRecords
      .filter(record => 
        record.nextActionDate && 
        dayjs(record.nextActionDate).isBefore(dayjs())
      )
      .slice(0, 5)

    return (
      <Card 
        title="待办事项" 
        extra={
          <Badge count={urgentTasks.length + overdueFollowUps.length} style={{ backgroundColor: '#f5222d' }} />
        }
        style={{ height: 400 }}
      >
        <List size="small">
          {urgentTasks.map(task => (
            <List.Item key={`urgent-${task.id}`}>
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: '#f5222d' }}>紧</Avatar>}
                title={
                  <Space>
                    <Text strong>{task.name}</Text>
                    <Tag color="red">紧急</Tag>
                  </Space>
                }
                description={`状态：${statusMap[task.status as keyof typeof statusMap]?.text || task.status}`}
              />
            </List.Item>
          ))}
          
          {overdueFollowUps.map(followUp => (
            <List.Item key={`overdue-${followUp.id}`}>
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: '#faad14' }}><ClockCircleOutlined /></Avatar>}
                title={
                  <Space>
                    <Text>跟进逾期</Text>
                    <Tag color="orange">逾期</Tag>
                  </Space>
                }
                description={`应于 ${dayjs(followUp.nextActionDate).format('MM-DD HH:mm')} 跟进`}
              />
            </List.Item>
          ))}
        </List>
        
        {urgentTasks.length === 0 && overdueFollowUps.length === 0 && (
          <Empty 
            description="暂无待办事项" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    )
  }

  // 最近活动
  const renderRecentActivity = () => {
    const recentActivities = [
      ...mockCandidateLocations.slice(0, 3).map(location => ({
        type: 'location',
        title: `新增候选点位：${location.name}`,
        time: '2024-01-20T10:30:00Z',
        status: location.status,
        priority: location.priority
      })),
      ...mockFollowUpRecords.slice(0, 3).map(record => ({
        type: 'followup',
        title: `跟进记录：${record.candidateLocationName}`,
        time: record.createdAt,
        content: record.content
      }))
    ].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()).slice(0, 6)

    return (
      <Card title="最近活动" style={{ height: 400 }}>
        <List size="small">
          {recentActivities.map((activity, index) => (
            <List.Item key={index}>
              <List.Item.Meta
                avatar={
                  <Avatar style={{ 
                    backgroundColor: activity.type === 'location' ? '#1890ff' : '#52c41a' 
                  }}>
                    {activity.type === 'location' ? <HomeOutlined /> : <PhoneOutlined />}
                  </Avatar>
                }
                title={activity.title}
                description={
                  <Space>
                    <Text type="secondary">
                      {dayjs(activity.time).fromNow()}
                    </Text>
                    {activity.status && (
                      <Tag color={statusMap[activity.status as keyof typeof statusMap]?.color}>
                        {statusMap[activity.status as keyof typeof statusMap]?.text}
                      </Tag>
                    )}
                    {activity.priority === 'URGENT' && (
                      <Tag color="red">紧急</Tag>
                    )}
                  </Space>
                }
              />
            </List.Item>
          ))}
        </List>
        
        {recentActivities.length === 0 && (
          <Empty 
            description="暂无活动记录" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    )
  }

  return (
    <div>
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>拓店数据仪表板</Title>
            <Text type="secondary">实时监控拓店进展和关键指标</Text>
          </Col>
          
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                format="YYYY-MM-DD"
              />
              <Select
                value={selectedRegion}
                onChange={setSelectedRegion}
                placeholder="选择地区"
                style={{ width: 120 }}
              >
                <Option value="all">全部地区</Option>
                {mockStats.byRegion.map(region => (
                  <Option key={region.regionId} value={region.regionId}>
                    {region.regionName}
                  </Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                刷新
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出报告
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* KPI指标卡片 */}
      {renderKPICards()}

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          {renderStatusChart()}
        </Col>
        <Col span={8}>
          {renderTodoList()}
        </Col>
        <Col span={8}>
          {renderRecentActivity()}
        </Col>
      </Row>

      {/* 数据表格区域 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="地区表现统计">
            <Table
              dataSource={mockStats.byRegion}
              rowKey="regionId"
              pagination={false}
              size="small"
              loading={loading}
              columns={[
                {
                  title: '地区',
                  dataIndex: 'regionName',
                  key: 'regionName'
                },
                {
                  title: '数量',
                  dataIndex: 'count',
                  key: 'count',
                  align: 'right'
                },
                {
                  title: '平均评分',
                  dataIndex: 'averageScore',
                  key: 'averageScore',
                  render: (score: number) => score ? score.toFixed(1) : '-',
                  align: 'right'
                },
                {
                  title: '平均租金',
                  dataIndex: 'averageRent',
                  key: 'averageRent',
                  render: (rent: number) => rent ? `¥${(rent / 10000).toFixed(1)}万` : '-',
                  align: 'right'
                }
              ]}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="状态统计">
            <Table
              dataSource={Object.entries(mockStats.byStatus).map(([status, count]) => ({
                status,
                statusText: statusMap[status as keyof typeof statusMap]?.text || status,
                color: statusMap[status as keyof typeof statusMap]?.color,
                count
              }))}
              rowKey="status"
              pagination={false}
              size="small"
              loading={loading}
              columns={[
                {
                  title: '状态',
                  dataIndex: 'statusText',
                  key: 'statusText',
                  render: (text: string, record: any) => (
                    <Tag color={record.color}>{text}</Tag>
                  )
                },
                {
                  title: '数量',
                  dataIndex: 'count',
                  key: 'count',
                  align: 'right'
                },
                {
                  title: '占比',
                  key: 'percentage',
                  render: (record: any) => {
                    const total = mockStats.overview.total || 1
                    const percentage = ((record.count / total) * 100).toFixed(1)
                    return (
                      <Space direction="vertical" size={4}>
                        <span>{percentage}%</span>
                        <Progress 
                          percent={parseFloat(percentage)} 
                          showInfo={false} 
                          size="small"
                          strokeColor={record.color === 'default' ? '#d9d9d9' : undefined}
                        />
                      </Space>
                    )
                  },
                  align: 'right'
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ExpansionDashboard