import React, { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  List,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Tabs,
  Badge,
  Typography,
  Alert,
  Timeline,
  Avatar,
  Tooltip,
  Empty,
  Spin
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  TeamOutlined,
  ToolOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  CalendarOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined,
  FlagOutlined
} from '@ant-design/icons'
import { Line, Column, Pie, Area } from '@ant-design/plots'
import dayjs from 'dayjs'

import PageContainer from '@/components/common/PageContainer'
import { usePreparationStore } from '@/stores/preparationStore'
import {
  PREPARATION_STATUS_COLORS,
  PRIORITY_COLORS
} from '@/constants/colors'
import type {
  PreparationDashboard as DashboardData,
  PreparationStatusType,
  Priority
} from '@shared/types/preparation'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

// 关键指标卡片组件
const KPICards: React.FC<{ dashboard: DashboardData }> = ({ dashboard }) => {
  const { kpis } = dashboard

  const budgetVariance = kpis.totalBudget > 0 
    ? ((kpis.actualBudget - kpis.totalBudget) / kpis.totalBudget * 100) 
    : 0

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="项目总数"
            value={kpis.totalProjects}
            prefix={<ExclamationCircleOutlined />}
            suffix="个"
            valueStyle={{ color: '#1890ff' }}
          />
          <div style={{ marginTop: 8 }}>
            <Progress
              percent={(kpis.completedProjects / kpis.totalProjects * 100) || 0}
              size="small"
              strokeColor="#52c41a"
              format={() => `完成 ${kpis.completedProjects}`}
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="进行中项目"
            value={kpis.inProgressProjects}
            prefix={<PlayCircleOutlined />}
            suffix="个"
            valueStyle={{ color: '#faad14' }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            平均进度 {kpis.avgProgress.toFixed(1)}%
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="预算执行率"
            value={(kpis.actualBudget / kpis.totalBudget * 100) || 0}
            precision={1}
            suffix="%"
            prefix={budgetVariance > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            valueStyle={{ color: budgetVariance > 10 ? '#cf1322' : '#3f8600' }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: budgetVariance > 10 ? '#cf1322' : '#666' }}>
            {budgetVariance > 0 ? '超支' : '节省'} {Math.abs(budgetVariance).toFixed(1)}%
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="准时交付率"
            value={kpis.onTimeDeliveryRate}
            precision={1}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: kpis.onTimeDeliveryRate >= 80 ? '#3f8600' : '#cf1322' }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: kpis.overdueProjects > 0 ? '#cf1322' : '#666' }}>
            逾期项目 {kpis.overdueProjects} 个
          </div>
        </Card>
      </Col>
    </Row>
  )
}

// 状态分布图表组件
const StatusDistributionChart: React.FC<{ data: DashboardData['charts']['statusDistribution'] }> = ({ data }) => {
  const chartData = data.map(item => ({
    type: STATUS_OPTIONS.find(opt => opt.value === item.status)?.label || item.status,
    value: item.count,
    percentage: item.percentage
  }))

  const config = {
    data: chartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    color: data.map(item => 
      PREPARATION_STATUS_COLORS[item.status] || '#1890ff'
    ),
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  }

  return <Pie {...config} />
}

// 进度趋势图表组件
const ProgressTrendChart: React.FC<{ data: DashboardData['charts']['progressTrend'] }> = ({ data }) => {
  const config = {
    data,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: ['#1890ff', '#52c41a'],
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type === 'planned' ? '计划' : '实际',
          value: datum.value + ' 个',
        }
      },
    },
  }

  const chartData = data.flatMap(item => [
    { date: item.date, value: item.planned, type: 'planned' },
    { date: item.date, value: item.actual, type: 'actual' }
  ])

  return <Line {...config} data={chartData} />
}

// 预算分析图表组件
const BudgetAnalysisChart: React.FC<{ data: DashboardData['charts']['budgetAnalysis'] }> = ({ data }) => {
  const config = {
    data,
    xField: 'category',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    color: ['#1890ff', '#52c41a'],
    legend: {
      position: 'top' as const,
    },
    columnWidthRatio: 0.8,
  }

  const chartData = data.flatMap(item => [
    { category: item.category, value: item.planned / 10000, type: '计划预算' },
    { category: item.category, value: item.actual / 10000, type: '实际支出' }
  ])

  return <Column {...config} data={chartData} />
}

// 状态选项配置
const STATUS_OPTIONS = [
  { value: 'PLANNING', label: '规划中' },
  { value: 'APPROVED', label: '已批准' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'SUSPENDED', label: '已暂停' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'OVERDUE', label: '已逾期' },
]

// 紧急事项列表组件
const AlertsList: React.FC<{ alerts: DashboardData['alerts'] }> = ({ alerts }) => {
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'overdue': return '#ff4d4f'
      case 'budget': return '#faad14'
      case 'quality': return '#722ed1'
      case 'safety': return '#f50'
      default: return '#1890ff'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <ClockCircleOutlined />
      case 'budget': return <BankOutlined />
      case 'quality': return <ToolOutlined />
      case 'safety': return <SafetyCertificateOutlined />
      default: return <ExclamationCircleOutlined />
    }
  }

  if (alerts.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无紧急事项"
      />
    )
  }

  return (
    <List
      dataSource={alerts}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar
                icon={getAlertIcon(item.type)}
                style={{ backgroundColor: getAlertColor(item.type) }}
              />
            }
            title={
              <Space>
                <Text>{item.message}</Text>
                <Tag color={item.urgency === 'HIGH' ? 'red' : item.urgency === 'MEDIUM' ? 'orange' : 'blue'}>
                  {item.urgency === 'HIGH' ? '高' : item.urgency === 'MEDIUM' ? '中' : '低'}
                </Tag>
              </Space>
            }
            description={
              item.projectName && (
                <Text type="secondary">项目：{item.projectName}</Text>
              )
            }
          />
        </List.Item>
      )}
    />
  )
}

// 最近活动组件
const RecentActivities: React.FC = () => {
  // 这里应该从API获取最近活动数据
  const activities = [
    {
      id: '1',
      type: 'create',
      message: '创建了新项目：朝阳公园店筹备',
      user: '张三',
      time: '2024-01-15 14:30'
    },
    {
      id: '2',
      type: 'update',
      message: '更新了项目进度：陆家嘴店筹备 -> 80%',
      user: '李四',
      time: '2024-01-15 11:20'
    },
    {
      id: '3',
      type: 'complete',
      message: '完成了设备采购：科技园店厨房设备',
      user: '王五',
      time: '2024-01-15 09:15'
    },
    {
      id: '4',
      type: 'alert',
      message: '珠江新城店筹备项目已逾期',
      user: '系统',
      time: '2024-01-14 18:45'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <PlusOutlined />
      case 'update': return <EditOutlined />
      case 'complete': return <CheckCircleOutlined />
      case 'alert': return <ExclamationCircleOutlined />
      default: return <UserOutlined />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create': return 'blue'
      case 'update': return 'orange'
      case 'complete': return 'green'
      case 'alert': return 'red'
      default: return 'default'
    }
  }

  return (
    <Timeline>
      {activities.map((activity) => (
        <Timeline.Item
          key={activity.id}
          dot={getActivityIcon(activity.type)}
          color={getActivityColor(activity.type)}
        >
          <div>
            <Text>{activity.message}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {activity.user} · {activity.time}
            </Text>
          </div>
        </Timeline.Item>
      ))}
    </Timeline>
  )
}

const PreparationDashboard: React.FC = () => {
  // Store状态
  const {
    dashboard,
    isStatsLoading,
    fetchDashboard
  } = usePreparationStore()

  // 本地状态
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // 初始化数据
  useEffect(() => {
    const params = dateRange ? {
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD')
    } : undefined

    fetchDashboard(params)
  }, [fetchDashboard, dateRange])

  // 刷新数据
  const handleRefresh = () => {
    const params = dateRange ? {
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD')
    } : undefined

    fetchDashboard(params)
  }

  if (isStatsLoading || !dashboard) {
    return (
      <PageContainer title="筹备仪表板">
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="筹备仪表板"
      extra={
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            placeholder={['开始日期', '结束日期']}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isStatsLoading}
          >
            刷新
          </Button>
        </Space>
      }
      breadcrumb={{
        routes: [
          { path: '/', breadcrumbName: '首页' },
          { path: '/preparation', breadcrumbName: '开店筹备' },
          { path: '/preparation/dashboard', breadcrumbName: '筹备仪表板' },
        ]
      }}
    >
      {/* 关键指标卡片 */}
      <div style={{ marginBottom: 24 }}>
        <KPICards dashboard={dashboard} />
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              综合概览
            </span>
          }
          key="overview"
        >
          <Row gutter={[24, 24]}>
            {/* 状态分布 */}
            <Col xs={24} lg={12}>
              <Card title="项目状态分布" extra={<PieChartOutlined />}>
                <StatusDistributionChart data={dashboard.charts.statusDistribution} />
              </Card>
            </Col>

            {/* 预算分析 */}
            <Col xs={24} lg={12}>
              <Card title="预算执行分析" extra={<BarChartOutlined />}>
                <BudgetAnalysisChart data={dashboard.charts.budgetAnalysis} />
              </Card>
            </Col>

            {/* 进度趋势 */}
            <Col xs={24}>
              <Card title="项目进度趋势" extra={<LineChartOutlined />}>
                <ProgressTrendChart data={dashboard.charts.progressTrend} />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ExclamationCircleOutlined />
              异常监控
            </span>
          }
          key="alerts"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                title="紧急事项"
                extra={
                  <Badge count={dashboard.alerts.length} style={{ backgroundColor: '#f50' }}>
                    <FlagOutlined />
                  </Badge>
                }
              >
                <AlertsList alerts={dashboard.alerts} />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="最近活动" extra={<CalendarOutlined />}>
                <RecentActivities />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              团队效率
            </span>
          }
          key="team"
        >
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Alert
                message="团队效率分析"
                description="此功能正在开发中，将提供项目经理工作效率、团队协作情况等分析数据。"
                type="info"
                showIcon
              />
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </PageContainer>
  )
}

export default PreparationDashboard