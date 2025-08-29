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
  Tooltip
} from 'antd'
import {
  ShopOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  BarChartOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import { Pie, Column, Line, Area } from '@ant-design/plots'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { RangePicker } = DatePicker

const StoreStats: React.FC = () => {
  const [dateRange, setDateRange] = useState<any>(
    [dayjs().subtract(6, 'month'), dayjs()]
  )
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // 模拟统计数据
  const mockStats = {
    overview: {
      totalStores: 48,
      totalStoresChange: 6,
      operatingStores: 42,
      operatingStoresChange: 4,
      newStoresThisMonth: 3,
      avgMonthlyRevenue: 268000,
      avgMonthlyRevenueChange: 8.5,
      totalRevenue: 11256000,
      totalRevenueChange: 12.3
    },
    storesByRegion: [
      { region: '华北大区', count: 15, revenue: 4200000, avgRating: 4.5 },
      { region: '华东大区', count: 18, revenue: 4850000, avgRating: 4.6 },
      { region: '华南大区', count: 10, revenue: 2850000, avgRating: 4.4 },
      { region: '华西大区', count: 5, revenue: 1356000, avgRating: 4.3 }
    ],
    storesByType: [
      { type: '直营店', count: 28, percent: 58.3 },
      { type: '加盟店', count: 20, percent: 41.7 }
    ],
    storesByStatus: [
      { status: '正常营业', count: 40, percent: 83.3 },
      { status: '试营业', count: 6, percent: 12.5 },
      { status: '装修中', count: 2, percent: 4.2 }
    ],
    monthlyTrend: [
      { month: '2023-03', stores: 35, revenue: 9200000, newStores: 2 },
      { month: '2023-04', stores: 37, revenue: 9850000, newStores: 2 },
      { month: '2023-05', stores: 40, revenue: 10200000, newStores: 3 },
      { month: '2023-06', stores: 42, revenue: 10650000, newStores: 2 },
      { month: '2023-07', stores: 45, revenue: 10950000, newStores: 3 },
      { month: '2023-08', stores: 48, revenue: 11256000, newStores: 3 }
    ],
    topPerformers: [
      {
        storeCode: 'HFW003',
        storeName: '好饭碗(陆家嘴店)',
        region: '华东大区',
        monthlyRevenue: 420000,
        customerFlow: 4500,
        rating: 4.8,
        efficiency: 95.2
      },
      {
        storeCode: 'HFW007',
        storeName: '好饭碗(南京路店)',
        region: '华东大区',
        monthlyRevenue: 385000,
        customerFlow: 4200,
        rating: 4.7,
        efficiency: 92.8
      },
      {
        storeCode: 'HFW001',
        storeName: '好饭碗(国贸店)',
        region: '华北大区',
        monthlyRevenue: 285000,
        customerFlow: 3200,
        rating: 4.6,
        efficiency: 88.5
      }
    ],
    areaDistribution: [
      { range: '100-150㎡', count: 12, percent: 25.0 },
      { range: '150-200㎡', count: 20, percent: 41.7 },
      { range: '200-250㎡', count: 10, percent: 20.8 },
      { range: '250㎡以上', count: 6, percent: 12.5 }
    ]
  }

  // 饼图配置
  const typesPieConfig = {
    data: mockStats.storesByType,
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

  const statusPieConfig = {
    data: mockStats.storesByStatus,
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
    data: mockStats.storesByRegion.map(item => ({
      region: item.region,
      门店数量: item.count,
      营收万元: item.revenue / 10000
    })),
    xField: 'region',
    yField: '门店数量',
    columnWidthRatio: 0.6,
    meta: {
      门店数量: { alias: '门店数量(个)' }
    }
  }

  // 趋势图配置
  const trendLineConfig = {
    data: mockStats.monthlyTrend,
    xField: 'month',
    yField: 'revenue',
    point: {
      size: 5,
      shape: 'diamond'
    },
    yAxis: {
      title: {
        text: '总营收(万元)'
      },
      label: {
        formatter: (v: string) => `${Number(v) / 10000}万`
      }
    },
    tooltip: {
      formatter: (datum: any) => ({
        name: '总营收',
        value: `${(datum.revenue / 10000).toFixed(0)}万元`
      })
    }
  }

  const performanceColumns: ColumnsType<any> = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, record, index) => (
        <div style={{ 
          width: 24, 
          height: 24, 
          borderRadius: '50%', 
          backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#d4edda' : '#f0f0f0',
          color: index < 2 ? '#fff' : '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {index + 1}
        </div>
      )
    },
    {
      title: '门店信息',
      key: 'storeInfo',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.storeName}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.storeCode} · {record.region}
          </div>
        </div>
      )
    },
    {
      title: '月营收(万)',
      dataIndex: 'monthlyRevenue',
      key: 'monthlyRevenue',
      align: 'right',
      render: (revenue: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          ¥{(revenue / 10000).toFixed(1)}
        </span>
      )
    },
    {
      title: '月客流',
      dataIndex: 'customerFlow',
      key: 'customerFlow',
      align: 'right',
      render: (flow: number) => `${flow} 人次`
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      align: 'center',
      render: (rating: number) => (
        <div style={{ color: '#faad14', fontWeight: 'bold' }}>
          {rating.toFixed(1)} ★
        </div>
      )
    },
    {
      title: '运营效率',
      dataIndex: 'efficiency',
      key: 'efficiency',
      align: 'center',
      render: (efficiency: number) => (
        <div>
          <Progress 
            percent={efficiency} 
            size="small" 
            showInfo={false}
            strokeColor={efficiency >= 90 ? '#52c41a' : efficiency >= 80 ? '#faad14' : '#ff7875'}
          />
          <div style={{ fontSize: '12px', textAlign: 'center' }}>
            {efficiency.toFixed(1)}%
          </div>
        </div>
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
            value={selectedRegion}
            onChange={setSelectedRegion}
            style={{ width: 120 }}
          >
            <Option value="all">全部大区</Option>
            <Option value="huabei">华北大区</Option>
            <Option value="huadong">华东大区</Option>
            <Option value="huanan">华南大区</Option>
            <Option value="huaxi">华西大区</Option>
          </Select>
          <span>门店类型：</span>
          <Select
            value={selectedType}
            onChange={setSelectedType}
            style={{ width: 120 }}
          >
            <Option value="all">全部类型</Option>
            <Option value="direct">直营店</Option>
            <Option value="franchise">加盟店</Option>
          </Select>
        </Space>
      </Card>

      {/* 概览统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="门店总数"
              value={mockStats.overview.totalStores}
              prefix={<ShopOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.totalStoresChange}
                </span>
              }
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="营业门店"
              value={mockStats.overview.operatingStores}
              prefix={<ShopOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.operatingStoresChange}
                </span>
              }
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月新开"
              value={mockStats.overview.newStoresThisMonth}
              prefix={<RiseOutlined />}
              suffix="家"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总营收(万)"
              value={mockStats.overview.totalRevenue / 10000}
              precision={0}
              prefix={<DollarOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.totalRevenueChange}%
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
          <Card title="门店类型分布">
            <Pie {...typesPieConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="营业状态分布">
            <Pie {...statusPieConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="各大区门店数量">
            <Column {...regionColumnConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="营收趋势">
            <Line {...trendLineConfig} />
          </Card>
        </Col>
      </Row>

      {/* 门店表现排行 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrophyOutlined style={{ color: '#faad14' }} />
              门店表现排行榜
            </div>
          }>
            <Table
              columns={performanceColumns}
              dataSource={mockStats.topPerformers}
              rowKey="storeCode"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="门店面积分布" size="small" style={{ marginBottom: 16 }}>
            <div>
              {mockStats.areaDistribution.map((item, index) => (
                <div key={index} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.range}</span>
                    <span>{item.count}家</span>
                  </div>
                  <Progress 
                    percent={item.percent} 
                    size="small" 
                    showInfo={false}
                    strokeColor="#1890ff"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="快速统计" size="small">
            <Row gutter={8}>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {(mockStats.overview.avgMonthlyRevenue / 10000).toFixed(0)}万
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>平均月营收</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    4.5
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>平均评分</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default StoreStats