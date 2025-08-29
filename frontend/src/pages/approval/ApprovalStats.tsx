import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Table,
  Button,
  Tag,
  Tooltip,
  Progress,
  message,
  Spin
} from 'antd'
import {
  AuditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HourglassOutlined,
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Pie, Column, Line } from '@ant-design/plots'
import dayjs from 'dayjs'
import { approvalService } from '@/services/approvalService'
import type { ApprovalStatistics } from '@/types/approval'

const { Option } = Select
const { RangePicker } = DatePicker

// 业务类型映射
const BUSINESS_TYPE_MAP = {
  'store_application': '报店审批',
  'license_approval': '执照审批',
  'price_comparison': '比价审批',
  'contract_approval': '合同审批',
  'budget_approval': '预算审批',
  'personnel_approval': '人员审批',
  'other': '其他审批'
}

// 状态映射
const STATUS_MAP = {
  'pending': '待处理',
  'approved': '已通过',
  'rejected': '已拒绝',
  'cancelled': '已取消',
  'timeout': '超时'
}

// 状态颜色映射
const STATUS_COLORS = {
  'pending': '#faad14',
  'approved': '#52c41a',
  'rejected': '#f5222d',
  'cancelled': '#d9d9d9',
  'timeout': '#ff7875'
}

const ApprovalStats: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<ApprovalStatistics | null>(null)
  const [dateRange, setDateRange] = useState<any>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ])
  const [businessType, setBusinessType] = useState<string>('all')

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const query: any = {}
      
      if (dateRange && dateRange.length === 2) {
        query.dateRange = [
          dateRange[0].format('YYYY-MM-DD'),
          dateRange[1].format('YYYY-MM-DD')
        ]
      }
      
      if (businessType !== 'all') {
        query.category = businessType
      }

      const data = await approvalService.getStatistics(query)
      setStatistics(data)
    } catch (error) {
      message.error('获取统计数据失败')
      console.error('Failed to fetch approval statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [dateRange, businessType])

  // 构造图表数据
  const getChartData = () => {
    if (!statistics) return { pieData: [], columnData: [], lineData: [], approverData: [] }

    // 状态分布饼图数据
    const pieData = [
      { type: STATUS_MAP.pending, value: statistics.pendingInstances, color: STATUS_COLORS.pending },
      { type: STATUS_MAP.approved, value: statistics.approvedInstances, color: STATUS_COLORS.approved },
      { type: STATUS_MAP.rejected, value: statistics.rejectedInstances, color: STATUS_COLORS.rejected }
    ].filter(item => item.value > 0)

    // 业务类型柱状图数据
    const columnData = Object.entries(statistics.byCategory).map(([key, stats]) => [
      { category: BUSINESS_TYPE_MAP[key] || key, type: '总数', value: stats.total },
      { category: BUSINESS_TYPE_MAP[key] || key, type: '待处理', value: stats.pending },
      { category: BUSINESS_TYPE_MAP[key] || key, type: '已通过', value: stats.approved },
      { category: BUSINESS_TYPE_MAP[key] || key, type: '已拒绝', value: stats.rejected }
    ]).flat()

    // 处理时长趋势数据（模拟月度数据）
    const lineData = Object.entries(statistics.byCategory).map(([key, stats]) => ({
      category: BUSINESS_TYPE_MAP[key] || key,
      avgDuration: stats.avgDuration
    }))

    // 审批人工作量数据
    const approverData = Object.entries(statistics.byApprover)
      .map(([approver, stats]) => ({
        approver,
        total: stats.total,
        pending: stats.pending,
        approved: stats.approved,
        rejected: stats.rejected,
        avgResponseTime: stats.avgResponseTime
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // 只显示前10名

    return { pieData, columnData, lineData, approverData }
  }

  const chartData = getChartData()

  // 饼图配置
  const pieConfig = {
    data: chartData.pieData,
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
    },
    color: chartData.pieData.map(item => item.color)
  }

  // 柱状图配置
  const columnConfig = {
    data: chartData.columnData,
    xField: 'category',
    yField: 'value',
    seriesField: 'type',
    columnWidthRatio: 0.6,
    legend: {
      position: 'top-left' as const
    },
    color: ['#1890ff', '#faad14', '#52c41a', '#f5222d']
  }

  // 处理时长趋势图配置
  const lineConfig = {
    data: chartData.lineData,
    xField: 'category',
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
        text: '平均处理时长(小时)'
      }
    }
  }

  // 审批人工作量表格列配置
  const approverColumns = [
    {
      title: '审批人',
      dataIndex: 'approver',
      key: 'approver',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      )
    },
    {
      title: '总审批数',
      dataIndex: 'total',
      key: 'total',
      sorter: (a: any, b: any) => a.total - b.total,
      render: (value: number) => (
        <Tag color="blue">{value}</Tag>
      )
    },
    {
      title: '待处理',
      dataIndex: 'pending',
      key: 'pending',
      render: (value: number) => (
        <Tag color="orange">{value}</Tag>
      )
    },
    {
      title: '已通过',
      dataIndex: 'approved',
      key: 'approved',
      render: (value: number) => (
        <Tag color="green">{value}</Tag>
      )
    },
    {
      title: '已拒绝',
      dataIndex: 'rejected',
      key: 'rejected',
      render: (value: number) => (
        <Tag color="red">{value}</Tag>
      )
    },
    {
      title: '平均响应时间',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      sorter: (a: any, b: any) => a.avgResponseTime - b.avgResponseTime,
      render: (time: number) => `${time.toFixed(1)}h`
    },
    {
      title: '工作负载',
      key: 'workload',
      render: (record: any) => {
        const workloadPercent = Math.min(100, (record.total / (statistics?.totalInstances || 1)) * 100)
        return (
          <Progress
            percent={workloadPercent}
            size="small"
            status={workloadPercent > 80 ? 'exception' : workloadPercent > 60 ? 'active' : 'success'}
            format={percent => `${percent?.toFixed(1)}%`}
          />
        )
      }
    }
  ]

  // 业务类型统计表格列配置
  const categoryColumns = [
    {
      title: '业务类型',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: '总数',
      dataIndex: 'total',
      key: 'total',
      sorter: (a: any, b: any) => a.total - b.total
    },
    {
      title: '待处理',
      dataIndex: 'pending',
      key: 'pending',
      render: (value: number) => <Tag color="orange">{value}</Tag>
    },
    {
      title: '已通过',
      dataIndex: 'approved',
      key: 'approved',
      render: (value: number) => <Tag color="green">{value}</Tag>
    },
    {
      title: '已拒绝',
      dataIndex: 'rejected',
      key: 'rejected',
      render: (value: number) => <Tag color="red">{value}</Tag>
    },
    {
      title: '通过率',
      key: 'approvalRate',
      render: (record: any) => {
        const rate = record.total > 0 ? (record.approved / record.total) * 100 : 0
        return (
          <Tag color={rate > 80 ? 'success' : rate > 60 ? 'warning' : 'error'}>
            {rate.toFixed(1)}%
          </Tag>
        )
      }
    },
    {
      title: '平均处理时长',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      render: (time: number) => `${time.toFixed(1)}h`
    }
  ]

  const categoryTableData = statistics ? Object.entries(statistics.byCategory).map(([key, stats]) => ({
    key,
    category: BUSINESS_TYPE_MAP[key] || key,
    ...stats
  })) : []

  // 导出数据
  const handleExport = () => {
    if (!statistics) return
    
    // 这里应该调用导出API
    message.success('数据导出功能开发中...')
  }

  if (!statistics && !loading) {
    return <div>暂无数据</div>
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 筛选条件 */}
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>时间范围：</span>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: 240 }}
              allowClear={false}
            />
            <span>业务类型：</span>
            <Select
              value={businessType}
              onChange={setBusinessType}
              style={{ width: 140 }}
            >
              <Option value="all">全部类型</Option>
              {Object.entries(BUSINESS_TYPE_MAP).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchStatistics}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              type="primary"
            >
              导出数据
            </Button>
          </Space>
        </Card>

        {/* 概览统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总审批数"
                value={statistics?.totalInstances || 0}
                prefix={<AuditOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理"
                value={statistics?.pendingInstances || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已通过"
                value={statistics?.approvedInstances || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已拒绝"
                value={statistics?.rejectedInstances || 0}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 效率指标 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card>
              <Statistic
                title="平均处理时长"
                value={statistics?.avgDuration || 0}
                suffix="小时"
                prefix={<HourglassOutlined />}
                precision={1}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="按时完成率"
                value={statistics?.onTimeRate || 0}
                suffix="%"
                prefix={<RiseOutlined />}
                precision={1}
                valueStyle={{ 
                  color: (statistics?.onTimeRate || 0) > 80 ? '#52c41a' : '#faad14' 
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card 
              title="审批状态分布" 
              extra={
                <Button icon={<PieChartOutlined />} type="link">
                  详细分析
                </Button>
              }
            >
              <Pie {...pieConfig} />
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              title="业务类型统计" 
              extra={
                <Button icon={<BarChartOutlined />} type="link">
                  详细分析
                </Button>
              }
            >
              <Column {...columnConfig} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card 
              title="平均处理时长对比" 
              extra={
                <Button icon={<LineChartOutlined />} type="link">
                  趋势分析
                </Button>
              }
            >
              <Line {...lineConfig} />
            </Card>
          </Col>
        </Row>

        {/* 详细数据表格 */}
        <Row gutter={16}>
          <Col span={24} style={{ marginBottom: 16 }}>
            <Card title="业务类型详细统计">
              <Table
                columns={categoryColumns}
                dataSource={categoryTableData}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col span={24}>
            <Card 
              title="审批人工作量统计"
              extra={
                <Tooltip title="显示审批量最多的前10位审批人">
                  <TeamOutlined />
                </Tooltip>
              }
            >
              <Table
                columns={approverColumns}
                dataSource={chartData.approverData}
                pagination={false}
                size="small"
                rowKey="approver"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default ApprovalStats