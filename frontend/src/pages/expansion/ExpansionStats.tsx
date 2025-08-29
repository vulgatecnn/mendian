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
  Button
} from 'antd'
import {
  EnvironmentOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { Pie, Column, Line } from '@ant-design/plots'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

const ExpansionStats: React.FC = () => {
  const [dateRange, setDateRange] = useState<any>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])
  const [region, setRegion] = useState<string>('all')

  // Mock统计数据
  const mockStats = {
    overview: {
      totalCandidates: 156,
      totalCandidatesChange: 12,
      followingCount: 45,
      followingCountChange: 8,
      approvedCount: 23,
      approvedCountChange: 5,
      totalBudget: 2350000,
      totalBudgetChange: 15
    },
    regionStats: [
      { region: '华北大区', candidates: 45, following: 12, approved: 8, successRate: 72.5 },
      { region: '华东大区', candidates: 38, following: 15, approved: 6, successRate: 65.2 },
      { region: '华南大区', candidates: 42, following: 10, approved: 5, successRate: 58.8 },
      { region: '华西大区', candidates: 31, following: 8, approved: 4, successRate: 61.3 }
    ],
    statusDistribution: [
      { type: '待评估', value: 35, percent: 22.4 },
      { type: '评估中', value: 48, percent: 30.8 },
      { type: '商务洽谈', value: 28, percent: 17.9 },
      { type: '已通过', value: 23, percent: 14.7 },
      { type: '已拒绝', value: 22, percent: 14.1 }
    ],
    monthlyTrend: [
      { month: '2023-10', candidates: 12, approved: 3, successRate: 25 },
      { month: '2023-11', candidates: 15, approved: 4, successRate: 26.7 },
      { month: '2023-12', candidates: 18, approved: 6, successRate: 33.3 },
      { month: '2024-01', candidates: 22, approved: 8, successRate: 36.4 },
      { month: '2024-02', candidates: 25, approved: 10, successRate: 40 }
    ],
    followTypeStats: [
      { type: '电话沟通', count: 89, percent: 35.2 },
      { type: '实地考察', count: 76, percent: 30.0 },
      { type: '商务洽谈', count: 54, percent: 21.3 },
      { type: '资料审核', count: 23, percent: 9.1 },
      { type: '合同签署', count: 11, percent: 4.3 }
    ]
  }

  // 饼图配置
  const pieConfig = {
    data: mockStats.statusDistribution,
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

  // 柱状图配置
  const columnConfig = {
    data: mockStats.regionStats.flatMap(item => [
      { region: item.region, type: '候选点位', value: item.candidates },
      { region: item.region, type: '跟进中', value: item.following },
      { region: item.region, type: '已通过', value: item.approved }
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
  const lineConfig = {
    data: mockStats.monthlyTrend,
    xField: 'month',
    yField: 'successRate',
    point: {
      size: 5,
      shape: 'diamond'
    },
    label: {
      style: {
        fill: '#aaa'
      }
    }
  }

  // 跟进类型饼图配置
  const followTypePieConfig = {
    data: mockStats.followTypeStats,
    angleField: 'count',
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
      title: '候选点位',
      dataIndex: 'candidates',
      key: 'candidates',
      render: (value: number) => `${value} 个`
    },
    {
      title: '跟进中',
      dataIndex: 'following',
      key: 'following',
      render: (value: number) => `${value} 个`
    },
    {
      title: '已通过',
      dataIndex: 'approved',
      key: 'approved',
      render: (value: number, record: any) => (
        <div>
          <span>{value} 个</span>
          <Progress
            percent={record.successRate}
            size="small"
            style={{ margin: '4px 0 0 8px', width: '100px' }}
            format={percent => `${percent}%`}
          />
        </div>
      )
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Tag color={rate > 70 ? 'success' : rate > 60 ? 'warning' : 'error'}>
          {rate.toFixed(1)}%
        </Tag>
      )
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
        <Col span={6}>
          <Card>
            <Statistic
              title="总候选点位"
              value={mockStats.overview.totalCandidates}
              prefix={<EnvironmentOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.totalCandidatesChange}
                </span>
              }
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="跟进中"
              value={mockStats.overview.followingCount}
              prefix={<TeamOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.followingCountChange}
                </span>
              }
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已通过"
              value={mockStats.overview.approvedCount}
              prefix={<TrophyOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.approvedCountChange}
                </span>
              }
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
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
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="状态分布" extra={<Button icon={<EyeOutlined />} type="link">查看详情</Button>}>
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="各区域统计" extra={<Button icon={<BarChartOutlined />} type="link">查看详情</Button>}>
            <Column {...columnConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="成功率趋势" extra={<Button icon={<RiseOutlined />} type="link">查看详情</Button>}>
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="跟进类型分布" extra={<Button icon={<TeamOutlined />} type="link">查看详情</Button>}>
            <Pie {...followTypePieConfig} />
          </Card>
        </Col>
      </Row>

      {/* 大区详细统计 */}
      <Card title="各大区详细数据">
        <Table
          columns={regionColumns}
          dataSource={mockStats.regionStats}
          rowKey="region"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default ExpansionStats