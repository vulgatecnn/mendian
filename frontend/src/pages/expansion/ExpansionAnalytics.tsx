import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Button,
  Space,
  Progress,
  Table,
  Tag,
  Typography,
  Alert,
  Tooltip,
  Divider,
  Badge,
  Avatar,
  Timeline,
  List
} from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined as TrendingUpOutlined,
  HomeOutlined,
  PhoneOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PercentageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

// 模拟图表组件
const SimpleChart: React.FC<{
  type: 'bar' | 'line' | 'pie'
  data: any[]
  height?: number
  title?: string
}> = ({ type, data, height = 200, title }) => {
  const getIcon = () => {
    switch (type) {
      case 'bar': return <BarChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
      case 'line': return <LineChartOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
      case 'pie': return <PieChartOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
      default: return <BarChartOutlined style={{ fontSize: '24px' }} />
    }
  }

  return (
    <div
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        border: '1px dashed #d9d9d9'
      }}
    >
      {getIcon()}
      <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 'bold' }}>
        {title || `${type.toUpperCase()}图表`}
      </div>
      <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
        数据点：{data.length}
      </div>
    </div>
  )
}

const ExpansionAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // 模拟数据
  const mockAnalytics = {
    overview: {
      totalCandidates: 24,
      thisMonthNew: 8,
      contractedThisMonth: 3,
      avgEvaluationScore: 8.3,
      avgRentPrice: 22500,
      contractConversionRate: 12.5,
      avgFollowUpDays: 15.2,
      totalFollowUps: 156,
      activeFollowUps: 42,
      overdueFollowUps: 3
    },
    trends: {
      candidateDiscovery: [
        { date: '01-01', count: 2, cumulative: 2 },
        { date: '01-08', count: 3, cumulative: 5 },
        { date: '01-15', count: 4, cumulative: 9 },
        { date: '01-22', count: 2, cumulative: 11 },
        { date: '01-29', count: 5, cumulative: 16 },
        { date: '02-05', count: 3, cumulative: 19 },
        { date: '02-12', count: 2, cumulative: 21 },
        { date: '02-19', count: 3, cumulative: 24 }
      ],
      statusTransition: [
        { status: 'PENDING', count: 5, percentage: 20.8 },
        { status: 'EVALUATING', count: 3, percentage: 12.5 },
        { status: 'FOLLOWING', count: 8, percentage: 33.3 },
        { status: 'NEGOTIATING', count: 5, percentage: 20.8 },
        { status: 'CONTRACTED', count: 2, percentage: 8.3 },
        { status: 'REJECTED', count: 1, percentage: 4.2 }
      ]
    },
    regionAnalysis: [
      { 
        region: '海淀区',
        totalCount: 8,
        contractedCount: 2,
        avgScore: 8.5,
        avgRent: 28000,
        conversionRate: 25.0,
        trendIcon: <ArrowUpOutlined style={{ color: '#52c41a' }} />
      },
      { 
        region: '朝阳区',
        totalCount: 6,
        contractedCount: 1,
        avgScore: 7.8,
        avgRent: 24000,
        conversionRate: 16.7,
        trendIcon: <MinusOutlined style={{ color: '#faad14' }} />
      },
      { 
        region: '东城区',
        totalCount: 5,
        contractedCount: 0,
        avgScore: 8.2,
        avgRent: 26000,
        conversionRate: 0,
        trendIcon: <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
      },
      { 
        region: '西城区',
        totalCount: 3,
        contractedCount: 1,
        avgScore: 9.1,
        avgRent: 32000,
        conversionRate: 33.3,
        trendIcon: <ArrowUpOutlined style={{ color: '#52c41a' }} />
      },
      { 
        region: '其他',
        totalCount: 2,
        contractedCount: 0,
        avgScore: 7.5,
        avgRent: 18000,
        conversionRate: 0,
        trendIcon: <MinusOutlined style={{ color: '#faad14' }} />
      }
    ],
    topPerformers: [
      {
        id: '1',
        name: '张三',
        avatar: 'Z',
        totalFollowUps: 45,
        completedFollowUps: 38,
        completionRate: 84.4,
        avgResponseTime: 2.3,
        contractedCount: 2
      },
      {
        id: '2',
        name: '李四',
        avatar: 'L',
        totalFollowUps: 38,
        completedFollowUps: 32,
        completionRate: 84.2,
        avgResponseTime: 1.8,
        contractedCount: 1
      },
      {
        id: '3',
        name: '王五',
        avatar: 'W',
        totalFollowUps: 32,
        completedFollowUps: 26,
        completionRate: 81.3,
        avgResponseTime: 3.1,
        contractedCount: 1
      },
      {
        id: '4',
        name: '赵六',
        avatar: 'Z',
        totalFollowUps: 28,
        completedFollowUps: 21,
        completionRate: 75.0,
        avgResponseTime: 4.2,
        contractedCount: 0
      }
    ],
    recentActivity: [
      {
        id: '1',
        type: 'contract',
        title: '西单大悦城商铺签约成功',
        description: '经过2个月跟进，成功签约150㎡商铺',
        time: '2024-02-15 14:30',
        user: '张三',
        importance: 'high'
      },
      {
        id: '2',
        type: 'negotiation',
        title: '万达广场A区进入商务谈判',
        description: '与业主就租金和装修期进行深入谈判',
        time: '2024-02-14 10:15',
        user: '李四',
        importance: 'medium'
      },
      {
        id: '3',
        type: 'evaluation',
        title: '银泰城B座完成实地评估',
        description: '综合评分9.2分，推荐优先跟进',
        time: '2024-02-13 16:45',
        user: '王五',
        importance: 'high'
      },
      {
        id: '4',
        type: 'discovery',
        title: '发现朝阳大悦城潜在点位',
        description: '新商圈，地理位置优越，需要进一步调研',
        time: '2024-02-12 09:20',
        user: '赵六',
        importance: 'medium'
      }
    ],
    upcomingTasks: [
      {
        id: '1',
        title: '万达广场A区商务谈判',
        location: '万达广场A区候选点位',
        assignee: '张三',
        dueDate: '2024-02-16 10:00',
        priority: 'high',
        type: 'negotiation'
      },
      {
        id: '2',
        title: '朝阳大悦城实地考察',
        location: '朝阳大悦城潜在店铺',
        assignee: '李四',
        dueDate: '2024-02-17 14:00',
        priority: 'medium',
        type: 'site_visit'
      },
      {
        id: '3',
        title: '银泰城B座跟进回访',
        location: '银泰城B座潜力点位',
        assignee: '王五',
        dueDate: '2024-02-18 09:30',
        priority: 'medium',
        type: 'follow_up'
      }
    ]
  }

  const statusMap = {
    PENDING: { color: '#d9d9d9', text: '待评估' },
    EVALUATING: { color: '#1890ff', text: '评估中' },
    FOLLOWING: { color: '#faad14', text: '跟进中' },
    NEGOTIATING: { color: '#fa8c16', text: '谈判中' },
    CONTRACTED: { color: '#52c41a', text: '已签约' },
    REJECTED: { color: '#ff4d4f', text: '已拒绝' }
  }

  const activityTypeMap = {
    contract: { color: '#52c41a', icon: <CheckCircleOutlined />, text: '签约成功' },
    negotiation: { color: '#fa8c16', icon: <TeamOutlined />, text: '商务谈判' },
    evaluation: { color: '#1890ff', icon: <StarOutlined />, text: '完成评估' },
    discovery: { color: '#722ed1', icon: <EyeOutlined />, text: '发现点位' }
  }

  const taskTypeMap = {
    negotiation: { color: '#fa8c16', icon: <TeamOutlined />, text: '商务谈判' },
    site_visit: { color: '#52c41a', icon: <EnvironmentOutlined />, text: '实地考察' },
    follow_up: { color: '#1890ff', icon: <PhoneOutlined />, text: '跟进回访' }
  }

  // 地区分析表格列
  const regionColumns = [
    {
      title: '地区',
      dataIndex: 'region',
      key: 'region',
      render: (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          {text}
        </div>
      )
    },
    {
      title: '总点位',
      dataIndex: 'totalCount',
      key: 'totalCount',
      align: 'center' as const,
      render: (count: number) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
    },
    {
      title: '已签约',
      dataIndex: 'contractedCount',
      key: 'contractedCount',
      align: 'center' as const,
      render: (count: number) => <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
    },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      align: 'center' as const,
      render: (rate: number, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ marginRight: '8px' }}>{rate.toFixed(1)}%</span>
          {record.trendIcon}
        </div>
      )
    },
    {
      title: '平均评分',
      dataIndex: 'avgScore',
      key: 'avgScore',
      align: 'center' as const,
      render: (score: number) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StarOutlined style={{ color: '#faad14', marginRight: '4px' }} />
          {score.toFixed(1)}
        </div>
      )
    },
    {
      title: '平均租金',
      dataIndex: 'avgRent',
      key: 'avgRent',
      align: 'center' as const,
      render: (rent: number) => (
        <div style={{ color: '#1890ff' }}>
          ¥{(rent / 1000).toFixed(1)}k/月
        </div>
      )
    }
  ]

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  // 导出报表
  const handleExport = () => {
    // 模拟导出
    setTimeout(() => {
      const blob = new Blob(['拓店分析报表数据...'], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `拓店分析报表_${dayjs().format('YYYYMMDD')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }, 500)
  }

  return (
    <div>
      <PageHeader
        title="拓店数据分析"
        description="全面分析拓店情况，提供数据驱动的决策支持"
        breadcrumbs={[
          { title: '拓店管理', path: '/expansion' },
          { title: '数据分析' }
        ]}
        extra={[
          <Space key="filters">
            <Select
              placeholder="选择地区"
              style={{ width: 120 }}
              allowClear
              value={selectedRegion}
              onChange={setSelectedRegion}
            >
              <Option value="">全部地区</Option>
              <Option value="haidian">海淀区</Option>
              <Option value="chaoyang">朝阳区</Option>
              <Option value="dongcheng">东城区</Option>
              <Option value="xicheng">西城区</Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          </Space>,
          <Button key="refresh" icon={<ReloadOutlined />} loading={loading} onClick={handleRefresh}>
            刷新
          </Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
            导出报表
          </Button>
        ]}
      />

      {/* 核心指标概览 */}
      <Card title="核心指标" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总候选点位"
                value={mockAnalytics.overview.totalCandidates}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#1890ff' }}
                suffix={
                  <Tooltip title="本月新增">
                    <Badge
                      count={`+${mockAnalytics.overview.thisMonthNew}`}
                      style={{ backgroundColor: '#52c41a', marginLeft: '8px' }}
                    />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="签约转化率"
                value={mockAnalytics.overview.contractConversionRate}
                precision={1}
                suffix="%"
                prefix={<PercentageOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress
                percent={mockAnalytics.overview.contractConversionRate}
                showInfo={false}
                size="small"
                strokeColor="#52c41a"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="平均评分"
                value={mockAnalytics.overview.avgEvaluationScore}
                precision={1}
                suffix="/10"
                prefix={<StarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
              <Progress
                percent={mockAnalytics.overview.avgEvaluationScore * 10}
                showInfo={false}
                size="small"
                strokeColor="#faad14"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="平均租金"
                value={mockAnalytics.overview.avgRentPrice / 1000}
                precision={1}
                suffix="k/月"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总跟进记录"
                value={mockAnalytics.overview.totalFollowUps}
                prefix={<PhoneOutlined />}
                valueStyle={{ color: '#722ed1' }}
                suffix={
                  <Tooltip title="进行中">
                    <Badge
                      count={mockAnalytics.overview.activeFollowUps}
                      style={{ backgroundColor: '#1890ff', marginLeft: '8px' }}
                    />
                  </Tooltip>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="平均跟进天数"
                value={mockAnalytics.overview.avgFollowUpDays}
                precision={1}
                suffix="天"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="逾期跟进"
                value={mockAnalytics.overview.overdueFollowUps}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: mockAnalytics.overview.overdueFollowUps > 0 ? '#ff4d4f' : '#52c41a' }}
              />
              {mockAnalytics.overview.overdueFollowUps > 0 && (
                <Alert
                  message={`有${mockAnalytics.overview.overdueFollowUps}个跟进任务已逾期`}
                  type="warning"
                  showIcon
                  size="small"
                  style={{ marginTop: '8px' }}
                />
              )}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="本月签约"
                value={mockAnalytics.overview.contractedThisMonth}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* 趋势分析 */}
        <Col span={12}>
          <Card title="候选点位发现趋势" extra={<RiseOutlined as TrendingUpOutlined />}>
            <SimpleChart
              type="line"
              data={mockAnalytics.trends.candidateDiscovery}
              title="发现趋势"
              height={250}
            />
          </Card>
        </Col>

        {/* 状态分布 */}
        <Col span={12}>
          <Card title="点位状态分布" extra={<PieChartOutlined />}>
            <div style={{ padding: '20px 0' }}>
              {mockAnalytics.trends.statusTransition.map(item => (
                <div key={item.status} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Tag color={statusMap[item.status as keyof typeof statusMap]?.color} style={{ minWidth: '80px' }}>
                    {statusMap[item.status as keyof typeof statusMap]?.text}
                  </Tag>
                  <Progress
                    percent={item.percentage}
                    size="small"
                    style={{ flex: 1, marginLeft: '12px', marginRight: '8px' }}
                    strokeColor={statusMap[item.status as keyof typeof statusMap]?.color}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>
                    {item.count}个
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* 地区分析 */}
        <Col span={14}>
          <Card title="地区分析" extra={<EnvironmentOutlined />}>
            <Table
              dataSource={mockAnalytics.regionAnalysis}
              columns={regionColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 团队表现 */}
        <Col span={10}>
          <Card title="团队表现排行" extra={<UserOutlined />}>
            <List
              itemLayout="horizontal"
              dataSource={mockAnalytics.topPerformers}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge count={index + 1} style={{ backgroundColor: index < 3 ? '#fa8c16' : '#d9d9d9' }}>
                        <Avatar style={{ backgroundColor: '#1890ff' }}>
                          {item.avatar}
                        </Avatar>
                      </Badge>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.name}</span>
                        <Tag color="#52c41a">签约{item.contractedCount}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span>跟进数: {item.totalFollowUps}</span>
                          <span>完成率: {item.completionRate}%</span>
                        </div>
                        <Progress
                          percent={item.completionRate}
                          size="small"
                          showInfo={false}
                          strokeColor="#52c41a"
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 最近活动 */}
        <Col span={12}>
          <Card
            title="最近活动"
            extra={
              <Button type="link" onClick={() => navigate('/expansion/follow')}>
                查看更多
              </Button>
            }
          >
            <Timeline>
              {mockAnalytics.recentActivity.map(activity => (
                <Timeline.Item
                  key={activity.id}
                  color={activityTypeMap[activity.type as keyof typeof activityTypeMap]?.color}
                  dot={activityTypeMap[activity.type as keyof typeof activityTypeMap]?.icon}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text strong>{activity.title}</Text>
                      <Tag
                        color={activity.importance === 'high' ? '#fa8c16' : '#1890ff'}
                        size="small"
                      >
                        {activity.importance === 'high' ? '重要' : '一般'}
                      </Tag>
                    </div>
                    <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                      {activity.description}
                    </div>
                    <div style={{ color: '#999', fontSize: '11px' }}>
                      {activity.user} • {activity.time}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* 即将到期任务 */}
        <Col span={12}>
          <Card
            title="即将到期任务"
            extra={
              <Button type="link" onClick={() => navigate('/expansion/follow')}>
                查看全部
              </Button>
            }
          >
            <List
              itemLayout="vertical"
              size="small"
              dataSource={mockAnalytics.upcomingTasks}
              renderItem={task => (
                <List.Item
                  style={{ padding: '12px 0' }}
                  actions={[
                    <Button key="view" type="link" size="small">
                      查看
                    </Button>,
                    <Button key="edit" type="link" size="small">
                      处理
                    </Button>
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ marginRight: '8px' }}>
                      {taskTypeMap[task.type as keyof typeof taskTypeMap]?.icon}
                    </div>
                    <Text strong style={{ flex: 1 }}>{task.title}</Text>
                    <Tag
                      color={task.priority === 'high' ? '#ff4d4f' : '#1890ff'}
                      size="small"
                    >
                      {task.priority === 'high' ? '高优先级' : '中优先级'}
                    </Tag>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    <EnvironmentOutlined style={{ marginRight: '4px' }} />
                    {task.location}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <UserOutlined style={{ marginRight: '4px' }} />
                      {task.assignee}
                    </span>
                    <span>
                      <CalendarOutlined style={{ marginRight: '4px' }} />
                      {dayjs(task.dueDate).format('MM-DD HH:mm')}
                    </span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ExpansionAnalytics