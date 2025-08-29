import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Typography,
  Divider,
  Space,
  Badge,
  Tooltip,
  Button,
  DatePicker,
  Select,
  Alert
} from 'antd'
import {
  BarChartOutlined,
  RiseOutlined as TrendingUpOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { Column, Pie, Line, Area } from '@ant-design/plots'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useStorePlan } from '@/services/query/hooks/useStorePlan'
import type { StorePlanStatistics, StorePlanProgress, StorePlanSummary } from '@/services/types/business'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const StorePlanDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('year'),
    dayjs().endOf('year')
  ])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const { 
    data: statistics, 
    isLoading: statsLoading 
  } = useStorePlan.useStatistics({
    year: dateRange[0].year(),
    regionIds: selectedRegions.length > 0 ? selectedRegions : undefined,
    storeTypes: selectedTypes.length > 0 ? selectedTypes : undefined
  })

  const { 
    data: progress, 
    isLoading: progressLoading 
  } = useStorePlan.useProgress()

  const { 
    data: summary, 
    isLoading: summaryLoading 
  } = useStorePlan.useSummary()

  // 状态颜色映射
  const statusColors = {
    DRAFT: '#d9d9d9',
    SUBMITTED: '#1890ff',
    PENDING: '#faad14',
    APPROVED: '#52c41a',
    REJECTED: '#f5222d',
    IN_PROGRESS: '#faad14',
    COMPLETED: '#52c41a',
    CANCELLED: '#f5222d'
  }

  // 门店类型配置
  const storeTypeOptions = [
    { value: 'DIRECT', label: '直营店', color: 'blue' },
    { value: 'FRANCHISE', label: '加盟店', color: 'green' },
    { value: 'FLAGSHIP', label: '旗舰店', color: 'purple' },
    { value: 'POPUP', label: '快闪店', color: 'orange' }
  ]

  // 计算同比增长
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // 概览统计卡片
  const renderOverviewCards = () => {
    if (!statistics || !summary) return null

    const cards = [
      {
        title: '本年计划数',
        value: summary.currentYear.planned,
        suffix: '个',
        prefix: <BarChartOutlined />,
        color: '#1890ff',
        growth: calculateGrowthRate(summary.currentYear.planned, 120), // 假设去年120个
        extra: `目标完成: ${summary.currentYear.completed}个`
      },
      {
        title: '完成率',
        value: summary.currentYear.progress,
        suffix: '%',
        precision: 1,
        prefix: <TrendingUpOutlined />,
        color: summary.currentYear.progress >= 80 ? '#52c41a' : summary.currentYear.progress >= 60 ? '#faad14' : '#f5222d',
        growth: calculateGrowthRate(summary.currentYear.progress, 75), // 假设去年75%
        extra: `本季: ${summary.currentQuarter.progress.toFixed(1)}%`
      },
      {
        title: '投资预算',
        value: summary.currentYear.budget / 10000,
        suffix: '万元',
        precision: 1,
        prefix: <DollarOutlined />,
        color: '#722ed1',
        growth: calculateGrowthRate(summary.currentYear.budget, 80000000), // 假设去年8000万
        extra: `已使用: ${(statistics.actualBudget / 10000).toFixed(1)}万`
      },
      {
        title: '平均耗时',
        value: 45, // 假设平均45天
        suffix: '天',
        prefix: <ClockCircleOutlined />,
        color: '#fa8c16',
        growth: -8, // 假设比去年减少8%
        extra: '最快: 30天'
      }
    ]

    return (
      <Row gutter={[16, 16]}>
        {cards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <span>{card.title}</span>
                    {card.growth && (
                      <Tooltip title={`同比${card.growth > 0 ? '增长' : '下降'}${Math.abs(card.growth).toFixed(1)}%`}>
                        <Tag 
                          color={card.growth > 0 ? 'green' : 'red'}
                          icon={card.growth > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          style={{ marginLeft: 8 }}
                        >
                          {Math.abs(card.growth).toFixed(1)}%
                        </Tag>
                      </Tooltip>
                    )}
                  </Space>
                }
                value={card.value}
                suffix={card.suffix}
                precision={card.precision}
                prefix={card.prefix}
                valueStyle={{ color: card.color }}
                loading={statsLoading || summaryLoading}
              />
              {card.extra && (
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  {card.extra}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  // 状态分布饼图
  const renderStatusDistribution = () => {
    if (!statistics) return null

    const data = Object.entries(statistics.statusDistribution).map(([status, count]) => ({
      type: getStatusText(status),
      value: count,
      color: statusColors[status as keyof typeof statusColors]
    }))

    const config = {
      data,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      innerRadius: 0.6,
      label: {
        type: 'inner',
        offset: '-50%',
        content: '{value}',
        style: {
          textAlign: 'center',
          fontSize: 14,
          fill: '#fff'
        }
      },
      legend: {
        position: 'right' as const,
        itemName: {
          style: {
            fill: '#666',
            fontSize: 12
          }
        }
      },
      interactions: [{ type: 'element-selected' }, { type: 'element-active' }]
    }

    return (
      <Card title="计划状态分布" loading={statsLoading}>
        <Pie {...config} height={300} />
      </Card>
    )
  }

  // 地区完成情况柱状图
  const renderRegionCompletion = () => {
    if (!statistics) return null

    const data = statistics.regionDistribution.map(region => ({
      region: region.regionName,
      计划数: region.plannedStores,
      完成数: region.completedStores,
      完成率: region.plannedStores > 0 ? (region.completedStores / region.plannedStores) * 100 : 0
    }))

    const config = {
      data,
      xField: 'region',
      yField: 'value',
      seriesField: 'type',
      isGroup: true,
      columnStyle: {
        radius: [4, 4, 0, 0]
      },
      legend: {
        position: 'top' as const
      },
      label: {
        position: 'middle' as const,
        style: {
          fill: '#FFFFFF',
          opacity: 0.6,
          fontSize: 12
        }
      }
    }

    // 转换数据格式
    const chartData: any[] = []
    data.forEach(item => {
      chartData.push(
        { region: item.region, type: '计划数', value: item.计划数 },
        { region: item.region, type: '完成数', value: item.完成数 }
      )
    })

    return (
      <Card title="各地区完成情况" loading={statsLoading}>
        <Column {...{ ...config, data: chartData }} height={300} />
      </Card>
    )
  }

  // 月度趋势图
  const renderMonthlyTrend = () => {
    if (!statistics) return null

    const data = statistics.monthlyTrend.map(item => ({
      month: item.month,
      value: item.plannedCount,
      type: '计划数'
    })).concat(
      statistics.monthlyTrend.map(item => ({
        month: item.month,
        value: item.completedCount,
        type: '完成数'
      }))
    )

    const config = {
      data,
      xField: 'month',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 1000
        }
      },
      legend: {
        position: 'top' as const
      },
      point: {
        size: 4,
        shape: 'circle'
      },
      yAxis: {
        nice: true,
        label: {
          formatter: (v: string) => `${v}个`
        }
      }
    }

    return (
      <Card title="月度开店趋势" loading={statsLoading}>
        <Line {...config} height={300} />
      </Card>
    )
  }

  // 进度跟踪表格
  const renderProgressTable = () => {
    if (!progress) return null

    const columns = [
      {
        title: '地区',
        dataIndex: 'regionName',
        key: 'regionName',
        width: 120
      },
      {
        title: '计划门店',
        dataIndex: 'planned',
        key: 'planned',
        width: 100,
        align: 'right' as const,
        render: (value: number) => <Text strong>{value}</Text>
      },
      {
        title: '已完成',
        dataIndex: 'completed',
        key: 'completed',
        width: 100,
        align: 'right' as const,
        render: (value: number, record: any) => (
          <Text type={record.completed >= record.planned ? 'success' : undefined}>
            {value}
          </Text>
        )
      },
      {
        title: '完成率',
        dataIndex: 'percentage',
        key: 'percentage',
        width: 150,
        render: (value: number, record: any) => (
          <div>
            <Progress
              percent={value}
              size="small"
              status={record.onTrack ? 'success' : 'exception'}
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
          </div>
        )
      },
      {
        title: '进度状态',
        dataIndex: 'onTrack',
        key: 'onTrack',
        width: 100,
        render: (onTrack: boolean, record: any) => (
          <Badge
            status={onTrack ? 'success' : 'warning'}
            text={onTrack ? '正常' : '延期'}
          />
        )
      }
    ]

    return (
      <Card title="地区进度跟踪" loading={progressLoading}>
        <Table
          dataSource={progress.regionProgress}
          columns={columns}
          size="small"
          pagination={false}
          rowKey="regionId"
        />
        
        {progress.delayedPlans.length > 0 && (
          <>
            <Divider orientation="left">延期计划</Divider>
            <Alert
              message={`发现 ${progress.delayedPlans.length} 个延期计划`}
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => navigate('/store-plan?status=delayed')}>
                  查看详情
                </Button>
              }
            />
          </>
        )}
      </Card>
    )
  }

  // 最近活动
  const renderRecentActivities = () => {
    if (!summary) return null

    return (
      <Card title="最近活动" loading={summaryLoading}>
        {summary.recentActivities.map((activity, index) => (
          <div key={activity.id} style={{ marginBottom: 12 }}>
            <Space>
              <Text strong>{activity.user}</Text>
              <Text type="secondary">{activity.action}</Text>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/store-plan/${activity.id}`)}
              >
                {activity.title}
              </Button>
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {dayjs(activity.timestamp).fromNow()}
              </Text>
            </div>
            {index < summary.recentActivities.length - 1 && <Divider style={{ margin: '8px 0' }} />}
          </div>
        ))}
      </Card>
    )
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: '草稿',
      SUBMITTED: '已提交',
      PENDING: '待审批',
      APPROVED: '已批准',
      REJECTED: '已拒绝',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }
    return statusMap[status] || status
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>开店计划执行看板</Title>
        <Text type="secondary">实时监控开店计划执行情况，掌握各地区开店进度</Text>
      </div>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <span>时间范围:</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates)}
                picker="month"
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <span>地区:</span>
              <Select
                mode="multiple"
                placeholder="选择地区"
                style={{ minWidth: 200 }}
                value={selectedRegions}
                onChange={setSelectedRegions}
                allowClear
              >
                {/* 这里需要从地区API获取数据 */}
                <Option value="region1">华东地区</Option>
                <Option value="region2">华南地区</Option>
                <Option value="region3">华北地区</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <span>门店类型:</span>
              <Select
                mode="multiple"
                placeholder="选择类型"
                style={{ minWidth: 150 }}
                value={selectedTypes}
                onChange={setSelectedTypes}
                allowClear
              >
                {storeTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={option.color}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 概览统计 */}
      {renderOverviewCards()}

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          {renderStatusDistribution()}
        </Col>
        <Col xs={24} lg={16}>
          {renderRegionCompletion()}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          {renderMonthlyTrend()}
        </Col>
        <Col xs={24} lg={8}>
          {renderRecentActivities()}
        </Col>
      </Row>

      {/* 进度跟踪 */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          {renderProgressTable()}
        </Col>
      </Row>
    </div>
  )
}

export default StorePlanDashboard