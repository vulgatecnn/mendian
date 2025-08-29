import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Progress,
  Table,
  Tag,
  Tooltip,
  Badge
} from 'antd'
import {
  DollarOutlined,
  PropertySafetyOutlined,
  CreditCardOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ShopOutlined
} from '@ant-design/icons'
import { Pie, Column, Line, Area, Gauge } from '@ant-design/plots'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { RangePicker } = DatePicker

const OperationStats: React.FC = () => {
  const [dateRange, setDateRange] = useState<any>([
    dayjs().subtract(6, 'month'),
    dayjs()
  ])
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

  // 模拟运营统计数据
  const mockStats = {
    overview: {
      totalPayments: 2850000,
      totalPaymentsChange: 15.8,
      pendingPayments: 568000,
      pendingPaymentsChange: -8.2,
      totalAssets: 18500000,
      totalAssetsChange: 12.3,
      assetsCount: 285,
      assetsCountChange: 18,
      maintenanceCost: 125000,
      maintenanceCostChange: 5.6,
      utilizationRate: 87.5,
      utilizationRateChange: 2.3
    },
    paymentsByType: [
      { type: '装修费用', amount: 1200000, percent: 42.1 },
      { type: '设备采购', amount: 850000, percent: 29.8 },
      { type: '租金费用', amount: 480000, percent: 16.8 },
      { type: '营销费用', amount: 320000, percent: 11.2 }
    ],
    paymentsByStatus: [
      { status: '已支付', count: 156, percent: 65.0 },
      { status: '待审批', count: 48, percent: 20.0 },
      { status: '已审批', count: 28, percent: 11.7 },
      { status: '已拒绝', count: 8, percent: 3.3 }
    ],
    assetsByCategory: [
      { category: '厨房设备', count: 125, value: 8500000, percent: 43.9 },
      { category: 'IT设备', count: 85, value: 3200000, percent: 29.8 },
      { category: '空调设备', count: 45, value: 4800000, percent: 15.8 },
      { category: '安防设备', count: 30, value: 2000000, percent: 10.5 }
    ],
    monthlyTrend: [
      { month: '2023-06', payments: 420000, assets: 16800000, maintenance: 85000 },
      { month: '2023-07', payments: 485000, assets: 17200000, maintenance: 92000 },
      { month: '2023-08', payments: 525000, assets: 17650000, maintenance: 105000 },
      { month: '2023-09', payments: 468000, assets: 18000000, maintenance: 98000 },
      { month: '2023-10', payments: 512000, assets: 18200000, maintenance: 115000 },
      { month: '2023-11', payments: 440000, assets: 18500000, maintenance: 125000 }
    ],
    storePerformance: [
      {
        storeCode: 'HFW001',
        storeName: '好饭碗(国贸店)',
        region: '华北大区',
        totalPayments: 585000,
        assetsValue: 3800000,
        assetsCount: 68,
        utilizationRate: 92.5,
        maintenanceCost: 28000
      },
      {
        storeCode: 'HFW003',
        storeName: '好饭碗(陆家嘴店)',
        region: '华东大区',
        totalPayments: 520000,
        assetsValue: 4200000,
        assetsCount: 75,
        utilizationRate: 89.2,
        maintenanceCost: 32000
      },
      {
        storeCode: 'HFW002',
        storeName: '好饭碗(三里屯店)',
        region: '华北大区',
        totalPayments: 420000,
        assetsValue: 3200000,
        assetsCount: 52,
        utilizationRate: 85.8,
        maintenanceCost: 22000
      },
      {
        storeCode: 'HFW004',
        storeName: '好饭碗(天河店)',
        region: '华南大区',
        totalPayments: 385000,
        assetsValue: 2800000,
        assetsCount: 45,
        utilizationRate: 82.1,
        maintenanceCost: 18000
      }
    ],
    alertItems: [
      {
        type: '保修到期',
        content: '商用燃气灶保修期将于12月15日到期',
        store: '好饭碗(国贸店)',
        level: 'warning'
      },
      {
        type: '设备故障',
        content: '冷藏冷冻柜温控系统故障，需立即维修',
        store: '好饭碗(三里屯店)',
        level: 'error'
      },
      {
        type: '付款逾期',
        content: '装修费用付款已逾期3天',
        store: '好饭碗(春熙路店)',
        level: 'error'
      },
      {
        type: '保养提醒',
        content: '空调系统保养期将至，请安排维护',
        store: '好饭碗(陆家嘴店)',
        level: 'info'
      }
    ]
  }

  // 付款类型饼图配置
  const paymentPieConfig = {
    data: mockStats.paymentsByType,
    angleField: 'amount',
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

  // 资产分类柱状图配置
  const assetColumnConfig = {
    data: mockStats.assetsByCategory,
    xField: 'category',
    yField: 'value',
    columnWidthRatio: 0.6,
    meta: {
      value: {
        formatter: (v: number) => `${(v / 10000).toFixed(0)}万元`
      }
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${Number(v) / 10000}万`
      }
    }
  }

  // 月度趋势线图配置
  const trendLineConfig = {
    data: mockStats.monthlyTrend.flatMap(item => [
      { month: item.month, type: '付款金额', value: item.payments },
      { month: item.month, type: '维护费用', value: item.maintenance }
    ]),
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    point: {
      size: 4
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${Number(v) / 10000}万`
      }
    }
  }

  // 利用率仪表盘配置
  const utilizationGaugeConfig = {
    percent: mockStats.overview.utilizationRate / 100,
    range: {
      color: ['#30BF78', '#FAAD14', '#F4664A']
    },
    indicator: {
      pointer: {
        style: {
          stroke: '#D0D0D0'
        }
      },
      pin: {
        style: {
          stroke: '#D0D0D0'
        }
      }
    },
    statistic: {
      content: {
        style: {
          fontSize: '24px',
          lineHeight: '24px'
        }
      }
    }
  }

  // 门店表现列表
  const storeColumns: ColumnsType<any> = [
    {
      title: '门店',
      key: 'storeInfo',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.storeName}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.storeCode}</div>
        </div>
      )
    },
    {
      title: '大区',
      dataIndex: 'region',
      key: 'region',
      render: (region: string) => <Tag color="blue">{region}</Tag>
    },
    {
      title: '总付款(万)',
      dataIndex: 'totalPayments',
      key: 'totalPayments',
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold' }}>
          ¥{(amount / 10000).toFixed(1)}
        </span>
      )
    },
    {
      title: '资产价值(万)',
      dataIndex: 'assetsValue',
      key: 'assetsValue',
      align: 'right',
      render: (value: number) => (
        <span style={{ color: '#52c41a' }}>
          ¥{(value / 10000).toFixed(0)}
        </span>
      )
    },
    {
      title: '设备数量',
      dataIndex: 'assetsCount',
      key: 'assetsCount',
      align: 'center',
      render: (count: number) => `${count}件`
    },
    {
      title: '利用率',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      align: 'center',
      render: (rate: number) => (
        <div>
          <Progress
            percent={rate}
            size="small"
            status={rate >= 90 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
            style={{ width: 80 }}
          />
          <div style={{ fontSize: '12px', textAlign: 'center', marginTop: 2 }}>
            {rate.toFixed(1)}%
          </div>
        </div>
      )
    },
    {
      title: '维护费用(万)',
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      align: 'right',
      render: (cost: number) => (
        <span style={{ color: '#faad14' }}>
          ¥{(cost / 10000).toFixed(1)}
        </span>
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
        </Space>
      </Card>

      {/* 概览统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="总付款额(万)"
              value={mockStats.overview.totalPayments / 10000}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CreditCardOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.totalPaymentsChange}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="待付款项(万)"
              value={mockStats.overview.pendingPayments / 10000}
              precision={1}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <FallOutlined /> {mockStats.overview.pendingPaymentsChange}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="资产总值(万)"
              value={mockStats.overview.totalAssets / 10000}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<PropertySafetyOutlined />}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.totalAssetsChange}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="设备数量"
              value={mockStats.overview.assetsCount}
              valueStyle={{ color: '#722ed1' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.assetsCountChange}
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="维护费用(万)"
              value={mockStats.overview.maintenanceCost / 10000}
              precision={1}
              valueStyle={{ color: '#eb2f96' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  <RiseOutlined /> +{mockStats.overview.maintenanceCostChange}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="设备利用率"
              value={mockStats.overview.utilizationRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card title="付款类型分布">
            <Pie {...paymentPieConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="资产分类统计">
            <Column {...assetColumnConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="设备利用率">
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <Gauge {...utilizationGaugeConfig} />
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {mockStats.overview.utilizationRate.toFixed(1)}%
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  设备总体利用率
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="月度趋势">
            <Line {...trendLineConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="运营提醒" size="small">
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {mockStats.alertItems.map((alert, index) => (
                <div 
                  key={index} 
                  style={{ 
                    padding: '12px',
                    borderBottom: '1px solid #f0f0f0',
                    borderLeft: `3px solid ${
                      alert.level === 'error' ? '#ff4d4f' :
                      alert.level === 'warning' ? '#faad14' : '#1890ff'
                    }`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 4 
                  }}>
                    {alert.level === 'error' && (
                      <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    )}
                    {alert.level === 'warning' && (
                      <ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    )}
                    {alert.level === 'info' && (
                      <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                    )}
                    <Tag 
                      color={
                        alert.level === 'error' ? 'red' :
                        alert.level === 'warning' ? 'orange' : 'blue'
                      }
                      size="small"
                    >
                      {alert.type}
                    </Tag>
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: 4 }}>
                    {alert.content}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    <ShopOutlined /> {alert.store}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 门店表现列表 */}
      <Card title="门店运营表现">
        <Table
          columns={storeColumns}
          dataSource={mockStats.storePerformance}
          rowKey="storeCode"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default OperationStats