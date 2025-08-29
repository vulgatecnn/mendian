import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Table,
  Progress,
  Tag,
  Button,
  Timeline
} from 'antd'
import {
  ProjectOutlined,
  BuildOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  DeliveredProcedureOutlined
} from '@ant-design/icons'
import { Pie, Column, Line, Area } from '@ant-design/plots'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

const PreparationStats: React.FC = () => {
  const [dateRange, setDateRange] = useState<any>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])
  const [region, setRegion] = useState<string>('all')

  // Mock统计数据
  const mockStats = {
    overview: {
      totalProjects: 24,
      totalProjectsChange: 8,
      ongoingProjects: 12,
      ongoingProjectsChange: 3,
      completedProjects: 9,
      completedProjectsChange: 5,
      totalBudget: 18500000,
      totalBudgetChange: 12,
      avgDeliveryTime: 45, // 平均交付时间（天）
      avgDeliveryTimeChange: -3,
      onTimeDeliveryRate: 87.5, // 按时交付率
      onTimeDeliveryRateChange: 5.2
    },
    projectsByRegion: [
      { region: '华北大区', total: 8, ongoing: 4, completed: 3, delayed: 1, onTimeRate: 85.5 },
      { region: '华东大区', total: 6, ongoing: 3, completed: 2, delayed: 1, onTimeRate: 88.2 },
      { region: '华南大区', total: 5, ongoing: 2, completed: 3, delayed: 0, onTimeRate: 92.1 },
      { region: '华西大区', total: 5, ongoing: 3, completed: 1, delayed: 1, onTimeRate: 78.9 }
    ],
    projectsByStatus: [
      { status: '规划中', count: 3, percent: 12.5 },
      { status: '设计阶段', count: 2, percent: 8.3 },
      { status: '施工中', count: 7, percent: 29.2 },
      { status: '验收中', count: 3, percent: 12.5 },
      { status: '交付中', count: 2, percent: 8.3 },
      { status: '已完成', count: 7, percent: 29.2 }
    ],
    monthlyTrend: [
      { month: '2023-10', started: 2, completed: 3, budget: 1200000, avgDuration: 52 },
      { month: '2023-11', started: 3, completed: 2, budget: 1800000, avgDuration: 48 },
      { month: '2023-12', started: 4, completed: 1, budget: 2200000, avgDuration: 46 },
      { month: '2024-01', started: 5, completed: 2, budget: 2800000, avgDuration: 44 },
      { month: '2024-02', started: 6, completed: 4, budget: 3200000, avgDuration: 42 }
    ],
    deliveryPerformance: [
      { type: '按时交付', value: 21, percent: 87.5 },
      { type: '延期交付', value: 3, percent: 12.5 }
    ],
    budgetAnalysis: [
      { category: '设计费用', budget: 2800000, actual: 2650000, variance: -5.4 },
      { category: '材料费用', budget: 8200000, actual: 8750000, variance: 6.7 },
      { category: '人工费用', budget: 5500000, actual: 5280000, variance: -4.0 },
      { category: '设备费用', budget: 2000000, actual: 1920000, variance: -4.0 }
    ],
    qualityMetrics: {
      avgQualityScore: 88.5,
      avgSafetyScore: 92.1,
      customerSatisfaction: 4.3,
      issueResolutionRate: 95.8
    }
  }

  // 饼图配置
  const statusPieConfig = {
    data: mockStats.projectsByStatus,
    angleField: 'count',
    colorField: 'status',
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

  // 柱状图配置
  const regionColumnConfig = {
    data: mockStats.projectsByRegion.flatMap(item => [
      { region: item.region, type: '总计', value: item.total },
      { region: item.region, type: '进行中', value: item.ongoing },
      { region: item.region, type: '已完成', value: item.completed },
      { region: item.region, type: '延期', value: item.delayed }
    ]),
    xField: 'region',
    yField: 'value',
    seriesField: 'type',
    columnWidthRatio: 0.6,
    legend: {
      position: 'top-left' as const
    }
  }

  // 趋势图配置
  const trendLineConfig = {
    data: mockStats.monthlyTrend,
    xField: 'month',
    yField: 'avgDuration',
    point: {
      size: 5,
      shape: 'diamond'
    },
    label: {
      style: {
        fill: '#aaa'
      }
    },
    yAxis: {
      title: {
        text: '平均工期(天)'
      }
    }
  }

  // 预算分析图配置
  const budgetColumnConfig = {
    data: mockStats.budgetAnalysis.flatMap(item => [
      { category: item.category, type: '预算', value: item.budget / 10000 },
      { category: item.category, type: '实际', value: item.actual / 10000 }
    ]),
    xField: 'category',
    yField: 'value',
    seriesField: 'type',
    columnWidthRatio: 0.6,
    legend: {
      position: 'top-left' as const
    },
    yAxis: {
      title: {
        text: '金额(万元)'
      }
    }
  }

  // 交付表现饼图配置
  const deliveryPieConfig = {
    data: mockStats.deliveryPerformance,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}'
    },
    legend: {
      position: 'bottom' as const
    }
  }

  const regionColumns = [
    {
      title: '大区',
      dataIndex: 'region',
      key: 'region'
    },
    {
      title: '项目总数',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => `${value} 个`
    },
    {
      title: '进行中',
      dataIndex: 'ongoing',
      key: 'ongoing',
      render: (value: number) => (
        <Tag color="processing">{value} 个</Tag>
      )
    },
    {
      title: '已完成',
      dataIndex: 'completed',
      key: 'completed',
      render: (value: number) => (
        <Tag color="success">{value} 个</Tag>
      )
    },
    {
      title: '延期项目',
      dataIndex: 'delayed',
      key: 'delayed',
      render: (value: number) => (
        <Tag color={value > 0 ? 'error' : 'default'}>{value} 个</Tag>
      )
    },
    {
      title: '按时交付率',
      dataIndex: 'onTimeRate',
      key: 'onTimeRate',
      render: (rate: number) => (
        <div>
          <Progress 
            percent={rate} 
            size="small" 
            status={rate >= 90 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
            style={{ width: 100 }}
          />
          <div style={{ fontSize: '12px', textAlign: 'center' }}>{rate.toFixed(1)}%</div>
        </div>
      )
    }
  ]

  const budgetColumns = [
    {
      title: '费用类别',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: '预算金额(万)',
      dataIndex: 'budget',
      key: 'budget',
      render: (value: number) => `¥${(value / 10000).toFixed(1)}`
    },
    {
      title: '实际金额(万)',
      dataIndex: 'actual',
      key: 'actual',
      render: (value: number) => `¥${(value / 10000).toFixed(1)}`
    },
    {
      title: '差异率',
      dataIndex: 'variance',
      key: 'variance',
      render: (variance: number) => {
        const color = variance > 0 ? '#ff4d4f' : variance < 0 ? '#52c41a' : '#666'
        const icon = variance > 0 ? <RiseOutlined /> : variance < 0 ? <FallOutlined /> : null
        return (
          <span style={{ color }}>
            {icon} {Math.abs(variance).toFixed(1)}%
          </span>
        )
      }
    }
  ]

  return (
    <div>
      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>时间范围：</span>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 240 }}
          />
          <span>大区：</span>
          <Select
            value={region}
            onChange={setRegion}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="huabei">华北大区</Option>
            <Option value="huadong">华东大区</Option>
            <Option value="huanan">华南大区</Option>
            <Option value="huaxi">华西大区</Option>
          </Select>
        </Space>
      </Card>

      {/* 概览统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="项目总数"
              value={mockStats.overview.totalProjects}
              prefix={<ProjectOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.totalProjectsChange}
                </span>
              }
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="进行中"
              value={mockStats.overview.ongoingProjects}
              prefix={<BuildOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.ongoingProjectsChange}
                </span>
              }
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已完成"
              value={mockStats.overview.completedProjects}
              prefix={<CheckCircleOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.completedProjectsChange}
                </span>
              }
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总预算(万)"
              value={mockStats.overview.totalBudget / 10000}
              precision={1}
              prefix={<DollarOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.totalBudgetChange}%
                </span>
              }
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="平均工期(天)"
              value={mockStats.overview.avgDeliveryTime}
              prefix={<ClockCircleOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <FallOutlined /> {mockStats.overview.avgDeliveryTimeChange}
                </span>
              }
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="按时交付率"
              value={mockStats.overview.onTimeDeliveryRate}
              precision={1}
              suffix="%"
              prefix={<DeliveredProcedureOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="项目状态分布">
            <Pie {...statusPieConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="各大区项目统计">
            <Column {...regionColumnConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="平均工期趋势">
            <Line {...trendLineConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="交付表现">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Statistic
                title="按时交付率"
                value={mockStats.overview.onTimeDeliveryRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </div>
            <Pie {...deliveryPieConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="预算执行分析">
            <Column {...budgetColumnConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="质量指标">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="质量评分"
                    value={mockStats.qualityMetrics.avgQualityScore}
                    precision={1}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="安全评分"
                    value={mockStats.qualityMetrics.avgSafetyScore}
                    precision={1}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="客户满意度"
                    value={mockStats.qualityMetrics.customerSatisfaction}
                    precision={1}
                    suffix="/5.0"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="问题解决率"
                    value={mockStats.qualityMetrics.issueResolutionRate}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 详细数据表格 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="各大区详细数据">
            <Table
              columns={regionColumns}
              dataSource={mockStats.projectsByRegion}
              rowKey="region"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="预算执行详情">
            <Table
              columns={budgetColumns}
              dataSource={mockStats.budgetAnalysis}
              rowKey="category"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PreparationStats