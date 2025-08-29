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
  Tabs,
  Table,
  Progress,
  Tag,
  Empty,
  Spin,
  Tooltip,
  Alert
} from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  ShopOutlined,
  DollarOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Line, Column, Pie, Area } from '@ant-design/plots'
import PageHeader from '@/components/common/PageHeader'
import { useStorePlanStore } from '@/stores/storePlanStore'
import StatusTag from './components/StatusTag'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs

interface StatisticsFilters {
  period: 'week' | 'month' | 'quarter' | 'year'
  regionId?: string
  type?: string
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
}

const StorePlanStatistics: React.FC = () => {
  const [filters, setFilters] = useState<StatisticsFilters>({
    period: 'month'
  })
  const [activeTab, setActiveTab] = useState('overview')
  
  const { 
    stats, 
    storePlans,
    fetchStats,
    fetchStorePlans,
    isStatsLoading 
  } = useStorePlanStore()

  useEffect(() => {
    fetchStats()
    fetchStorePlans()
  }, [fetchStats, fetchStorePlans])

  const handleFilterChange = (key: keyof StatisticsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleRefresh = () => {
    fetchStats()
    fetchStorePlans()
  }

  const handleExport = () => {
    // 实现导出功能
    console.log('Export statistics')
  }

  // 模拟统计数据
  const mockStats = stats || {
    total: { count: 45, totalBudget: 2500000 },
    byStatus: {
      draft: 8,
      pending: 5,
      approved: 12,
      in_progress: 15,
      completed: 5,
      cancelled: 0
    },
    byType: {
      direct: 25,
      franchise: 15,
      joint_venture: 5
    },
    byRegion: {
      '华北': 12,
      '华南': 15,
      '华东': 8,
      '西南': 6,
      '西北': 4
    },
    timeline: [
      { date: '2024-01', planned: 8, completed: 5 },
      { date: '2024-02', planned: 10, completed: 7 },
      { date: '2024-03', planned: 12, completed: 9 },
      { date: '2024-04', planned: 15, completed: 12 },
      { date: '2024-05', planned: 18, completed: 14 },
      { date: '2024-06', planned: 20, completed: 16 }
    ]
  }

  // 计算完成率
  const completionRate = mockStats.total.count > 0 
    ? ((mockStats.byStatus.completed / mockStats.total.count) * 100) 
    : 0

  const inProgressRate = mockStats.total.count > 0
    ? ((mockStats.byStatus.in_progress / mockStats.total.count) * 100)
    : 0

  // 图表配置
  const statusPieConfig = {
    data: Object.entries(mockStats.byStatus).map(([status, count]) => ({
      type: status === 'draft' ? '草稿' :
            status === 'pending' ? '待审批' :
            status === 'approved' ? '已批准' :
            status === 'in_progress' ? '进行中' :
            status === 'completed' ? '已完成' : '已取消',
      value: count
    })),
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

  const regionColumnConfig = {
    data: Object.entries(mockStats.byRegion).map(([region, count]) => ({
      region,
      count
    })),
    xField: 'region',
    yField: 'count',
    columnWidthRatio: 0.6,
    label: {
      position: 'middle' as const,
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      }
    },
    meta: {
      region: { alias: '大区' },
      count: { alias: '计划数量' }
    }
  }

  const timelineConfig = {
    data: mockStats.timeline,
    xField: 'date',
    yField: 'completed',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    point: {
      size: 5,
      shape: 'diamond',
    }
  }

  const trendAreaConfig = {
    data: mockStats.timeline.flatMap(item => [
      { date: item.date, type: '计划数', value: item.planned },
      { date: item.date, type: '完成数', value: item.completed }
    ]),
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    areaStyle: {
      fillOpacity: 0.6,
    },
    legend: {
      position: 'top-left' as const
    }
  }

  // 表格列定义
  const rankingColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, record: any, index: number) => (
        <div style={{ 
          fontWeight: 'bold',
          color: index < 3 ? ['#faad14', '#faad14', '#fa8c16'][index] : '#666'
        }}>
          {index + 1}
        </div>
      )
    },
    {
      title: '大区',
      dataIndex: 'region',
      key: 'region'
    },
    {
      title: '计划总数',
      dataIndex: 'totalPlans',
      key: 'totalPlans',
      render: (count: number) => <Tag color="blue">{count} 个</Tag>
    },
    {
      title: '已完成',
      dataIndex: 'completedPlans',
      key: 'completedPlans',
      render: (count: number) => <Tag color="green">{count} 个</Tag>
    },
    {
      title: '完成率',
      key: 'rate',
      render: (_: any, record: any) => {
        const rate = record.totalPlans > 0 
          ? (record.completedPlans / record.totalPlans) * 100 
          : 0
        return <Progress percent={rate} size="small" />
      }
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      render: (budget: number) => `¥${(budget / 10000).toFixed(1)}万`
    }
  ]

  const rankingData = Object.entries(mockStats.byRegion).map(([region, count]) => ({
    region,
    totalPlans: count,
    completedPlans: Math.floor(count * 0.3), // 模拟完成数
    totalBudget: count * 500000 // 模拟预算
  })).sort((a, b) => b.totalPlans - a.totalPlans)

  if (isStatsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="统计分析"
        description="开店计划数据统计分析和可视化展示"
        breadcrumbs={[
          { title: '开店计划', path: '/store-plan' },
          { title: '统计分析' }
        ]}
        extra={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>,
          <Button key="export" type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出报告
          </Button>
        ]}
      />

      {/* 筛选条件 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <span>统计周期:</span>
              <Select
                value={filters.period}
                style={{ width: 120 }}
                onChange={(value) => handleFilterChange('period', value)}
              >
                <Option value="week">周</Option>
                <Option value="month">月</Option>
                <Option value="quarter">季度</Option>
                <Option value="year">年</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <span>时间范围:</span>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <span>大区:</span>
              <Select
                placeholder="选择大区"
                style={{ width: 120 }}
                allowClear
                value={filters.regionId}
                onChange={(value) => handleFilterChange('regionId', value)}
              >
                <Option value="1">华北大区</Option>
                <Option value="2">华南大区</Option>
                <Option value="3">华东大区</Option>
                <Option value="4">西南大区</Option>
                <Option value="5">西北大区</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="计划总数"
              value={mockStats.total.count}
              suffix="个"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={completionRate}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: completionRate >= 80 ? '#52c41a' : completionRate >= 60 ? '#faad14' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="执行中"
              value={inProgressRate}
              precision={1}
              suffix="%"
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总投资"
              value={mockStats.total.totalBudget / 10000}
              precision={1}
              suffix="万元"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="总体概览" key="overview">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="状态分布" extra={<PieChartOutlined />}>
                <Pie {...statusPieConfig} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="地区分布" extra={<BarChartOutlined />}>
                <Column {...regionColumnConfig} />
              </Card>
            </Col>
          </Row>

          <Card title="完成趋势" style={{ marginTop: 16 }} extra={<LineChartOutlined />}>
            <Area {...trendAreaConfig} />
          </Card>
        </TabPane>

        <TabPane tab="地区排行" key="ranking">
          <Card title="大区执行排行榜">
            <Alert
              message="数据说明"
              description="按照计划总数、完成率等维度对各大区进行排名，帮助识别表现优秀和需要关注的区域。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={rankingColumns}
              dataSource={rankingData}
              rowKey="region"
              pagination={false}
              size="small"
            />
          </Card>
        </TabPane>

        <TabPane tab="趋势分析" key="trend">
          <Row gutter={16}>
            <Col span={24}>
              <Card title="月度执行趋势" extra={<CalendarOutlined />}>
                <Line {...timelineConfig} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Card title="平均完成周期" size="small">
                <Statistic
                  value={42}
                  suffix="天"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="平均预算" size="small">
                <Statistic
                  value={55.6}
                  suffix="万元"
                  precision={1}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="延期率" size="small">
                <Statistic
                  value={12.5}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="实时数据" key="realtime">
          <Card title="实时监控面板">
            {storePlans && storePlans.length > 0 ? (
              <Table
                dataSource={storePlans.slice(0, 10)}
                rowKey="id"
                size="small"
                columns={[
                  {
                    title: '计划名称',
                    dataIndex: 'name',
                    key: 'name',
                    ellipsis: true
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status, record: any) => (
                      <StatusTag status={status} priority={record.priority} size="small" />
                    )
                  },
                  {
                    title: '进度',
                    dataIndex: 'progress',
                    key: 'progress',
                    render: (progress: number) => (
                      <Progress percent={progress} size="small" />
                    )
                  },
                  {
                    title: '更新时间',
                    dataIndex: 'updatedAt',
                    key: 'updatedAt',
                    render: (date: string) => (
                      <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
                        {dayjs(date).fromNow()}
                      </Tooltip>
                    )
                  }
                ]}
                pagination={{
                  size: 'small',
                  showQuickJumper: true,
                  showSizeChanger: true,
                  showTotal: (total, range) => 
                    `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
                }}
              />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default StorePlanStatistics