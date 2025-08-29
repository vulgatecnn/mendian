import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  Typography,
  Tooltip,
  Button,
  Statistic,
  Progress,
  Tag
} from 'antd'
import {
  Column,
  Pie,
  Line,
  Area,
  Gauge,
  Bar
} from '@ant-design/plots'
import {
  DownloadOutlined,
  FullscreenOutlined,
  QuestionCircleOutlined,
  RiseOutlined as TrendingUpOutlined,
  FallOutlined as TrendingDownOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { 
  StorePlanStatistics, 
  StorePlanProgress 
} from '@/services/types/business'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

interface ChartsPanelProps {
  statistics?: StorePlanStatistics
  progress?: StorePlanProgress
  loading?: boolean
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
  onDateRangeChange?: (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => void
  onExport?: (chartType: string) => void
}

const ChartsPanel: React.FC<ChartsPanelProps> = ({
  statistics,
  progress,
  loading = false,
  dateRange,
  onDateRangeChange,
  onExport
}) => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // 状态分布饼图
  const renderStatusPieChart = () => {
    if (!statistics) return null

    const data = Object.entries(statistics.statusDistribution).map(([status, count]) => ({
      type: getStatusText(status),
      value: count,
      percentage: statistics.totalPlans > 0 ? (count / statistics.totalPlans * 100).toFixed(1) : '0'
    }))

    const config = {
      data,
      angleField: 'value',
      colorField: 'type',
      radius: 0.75,
      innerRadius: 0.6,
      label: {
        type: 'inner',
        offset: '-50%',
        content: '{percentage}%',
        style: {
          textAlign: 'center',
          fontSize: 14,
          fill: '#fff',
          fontWeight: 'bold'
        }
      },
      legend: {
        position: 'bottom' as const,
        itemName: {
          style: {
            fill: '#666',
            fontSize: 12
          }
        }
      },
      tooltip: {
        formatter: (datum: any) => ({
          name: datum.type,
          value: `${datum.value} 个 (${datum.percentage}%)`
        })
      },
      interactions: [
        { type: 'element-selected' },
        { type: 'element-active' }
      ],
      statistic: {
        title: {
          style: {
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          },
          content: '总计划'
        },
        content: {
          style: {
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1890ff'
          },
          content: statistics.totalPlans
        }
      }
    }

    return (
      <Card 
        title="计划状态分布" 
        loading={loading}
        extra={
          <Space>
            <Tooltip title="导出图表">
              <Button 
                size="small" 
                icon={<DownloadOutlined />}
                onClick={() => onExport?.('status-pie')}
              />
            </Tooltip>
            <Tooltip title="全屏查看">
              <Button size="small" icon={<FullscreenOutlined />} />
            </Tooltip>
          </Space>
        }
      >
        <Pie {...config} height={300} />
      </Card>
    )
  }

  // 地区对比柱状图
  const renderRegionComparisonChart = () => {
    if (!statistics?.regionDistribution) return null

    const data = statistics.regionDistribution
      .sort((a, b) => b.completedStores - a.completedStores)
      .slice(0, 10) // 取前10个地区
      .map(region => ({
        region: region.regionName,
        计划数: region.plannedStores,
        完成数: region.completedStores,
        完成率: region.plannedStores > 0 ? (region.completedStores / region.plannedStores * 100).toFixed(1) : '0'
      }))

    // 转换为图表需要的数据格式
    const chartData: any[] = []
    data.forEach(item => {
      chartData.push(
        { region: item.region, type: '计划数', value: item.计划数, category: '计划' },
        { region: item.region, type: '完成数', value: item.完成数, category: '完成' }
      )
    })

    const config = {
      data: chartData,
      isGroup: true,
      xField: 'region',
      yField: 'value',
      seriesField: 'type',
      color: ['#5B8FF9', '#5AD8A6'],
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
          opacity: 0.8,
          fontSize: 11,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        shared: true,
        showCrosshairs: true
      },
      interactions: [
        { type: 'active-region', enable: false }
      ]
    }

    return (
      <Card 
        title="各地区完成情况对比" 
        loading={loading}
        extra={
          <Space>
            <Select
              mode="multiple"
              placeholder="筛选地区"
              style={{ minWidth: 120 }}
              size="small"
              value={selectedRegions}
              onChange={setSelectedRegions}
              allowClear
            >
              {statistics.regionDistribution.map(region => (
                <Option key={region.regionId} value={region.regionId}>
                  {region.regionName}
                </Option>
              ))}
            </Select>
            <Button 
              size="small" 
              icon={<DownloadOutlined />}
              onClick={() => onExport?.('region-comparison')}
            />
          </Space>
        }
      >
        <Column {...config} height={350} />
      </Card>
    )
  }

  // 月度趋势线图
  const renderMonthlyTrendChart = () => {
    if (!statistics?.monthlyTrend) return null

    const data = statistics.monthlyTrend.flatMap(item => [
      {
        month: item.month,
        value: item.plannedCount,
        type: '计划数',
        category: 'planned'
      },
      {
        month: item.month,
        value: item.completedCount,
        type: '完成数',
        category: 'completed'
      }
    ])

    const config = {
      data,
      xField: 'month',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      color: ['#1890ff', '#52c41a'],
      point: {
        size: 4,
        shape: 'circle',
        style: {
          fill: 'white',
          stroke: '#1890ff',
          lineWidth: 2
        }
      },
      tooltip: {
        showCrosshairs: true,
        shared: true
      },
      legend: {
        position: 'top' as const
      },
      annotations: [
        {
          type: 'regionFilter',
          start: ['min', 'median'],
          end: ['max', 'median'],
          style: {
            stroke: '#F4664A',
            lineDash: [4, 5]
          }
        }
      ]
    }

    return (
      <Card 
        title="月度开店趋势" 
        loading={loading}
        extra={
          <Space>
            <RangePicker
              size="small"
              picker="month"
              value={dateRange}
              onChange={onDateRangeChange}
            />
            <Button 
              size="small" 
              icon={<DownloadOutlined />}
              onClick={() => onExport?.('monthly-trend')}
            />
          </Space>
        }
      >
        <Line {...config} height={300} />
        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="月均计划"
                value={statistics.monthlyTrend.reduce((acc, item) => acc + item.plannedCount, 0) / statistics.monthlyTrend.length}
                precision={1}
                suffix="个"
                prefix={<RiseOutlined as TrendingUpOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="月均完成"
                value={statistics.monthlyTrend.reduce((acc, item) => acc + item.completedCount, 0) / statistics.monthlyTrend.length}
                precision={1}
                suffix="个"
                prefix={<RiseOutlined as TrendingUpOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="增长趋势"
                value={12.5}
                precision={1}
                suffix="%"
                prefix={<RiseOutlined as TrendingUpOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </div>
      </Card>
    )
  }

  // 完成率仪表盘
  const renderCompletionGauge = () => {
    if (!statistics) return null

    const completionRate = statistics.completionRate

    const config = {
      percent: completionRate / 100,
      range: {
        color: '#30BF78'
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
        title: {
          formatter: ({ percent }: any) => {
            return `完成率: ${(percent * 100).toFixed(1)}%`
          },
          style: ({ percent }: any) => ({
            fontSize: '14px',
            lineHeight: 1,
            color: percent > 0.65 ? '#30BF78' : percent > 0.45 ? '#FAAD14' : '#F4664A'
          })
        },
        content: {
          style: {
            fontSize: '24px',
            lineHeight: 1,
            fontWeight: 'bold',
            color: completionRate > 65 ? '#30BF78' : completionRate > 45 ? '#FAAD14' : '#F4664A'
          }
        }
      }
    }

    return (
      <Card 
        title="总体完成率" 
        loading={loading}
        extra={
          <Tooltip title="完成率 = 已完成门店数 ÷ 计划门店数">
            <QuestionCircleOutlined />
          </Tooltip>
        }
      >
        <Gauge {...config} height={250} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space direction="vertical">
            <Text type="secondary">
              已完成 {statistics.totalCompletedStores} / 计划 {statistics.totalPlannedStores} 家门店
            </Text>
            <Progress 
              percent={completionRate} 
              strokeColor={completionRate > 65 ? '#52c41a' : completionRate > 45 ? '#faad14' : '#f5222d'}
              trailColor="#f0f0f0"
              size="small"
            />
          </Space>
        </div>
      </Card>
    )
  }

  // 预算使用情况条形图
  const renderBudgetUsageChart = () => {
    if (!statistics?.regionDistribution) return null

    const data = statistics.regionDistribution
      .filter(region => region.budget > 0)
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 8)
      .map(region => ({
        region: region.regionName,
        预算: region.budget / 10000, // 转换为万元
        type: '预算分配'
      }))

    const config = {
      data,
      xField: '预算',
      yField: 'region',
      seriesField: 'type',
      color: '#5B8FF9',
      barStyle: {
        radius: [0, 4, 4, 0]
      },
      label: {
        position: 'middle' as const,
        style: {
          fill: '#FFFFFF',
          opacity: 0.8,
          fontSize: 12,
          fontWeight: 'bold'
        },
        formatter: (datum: any) => `${datum.预算.toFixed(1)}万`
      },
      tooltip: {
        formatter: (datum: any) => ({
          name: '预算金额',
          value: `${datum.预算.toFixed(1)} 万元`
        })
      }
    }

    return (
      <Card 
        title="各地区预算分配" 
        loading={loading}
        extra={
          <Space>
            <Tag color="blue">总预算: {(statistics.totalBudget / 10000).toFixed(1)}万元</Tag>
            <Button 
              size="small" 
              icon={<DownloadOutlined />}
              onClick={() => onExport?.('budget-usage')}
            />
          </Space>
        }
      >
        <Bar {...config} height={300} />
        <div style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="预算利用率"
                value={statistics.budgetUtilization}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: statistics.budgetUtilization > 80 ? '#52c41a' : 
                         statistics.budgetUtilization > 60 ? '#faad14' : '#f5222d'
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="已使用"
                value={statistics.actualBudget / 10000}
                precision={1}
                suffix="万元"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="剩余预算"
                value={(statistics.totalBudget - statistics.actualBudget) / 10000}
                precision={1}
                suffix="万元"
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </div>
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
    <div>
      {/* 第一行：状态分布、完成率仪表盘 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          {renderStatusPieChart()}
        </Col>
        <Col xs={24} lg={12}>
          {renderCompletionGauge()}
        </Col>
      </Row>

      {/* 第二行：地区对比 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          {renderRegionComparisonChart()}
        </Col>
      </Row>

      {/* 第三行：趋势分析、预算分配 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          {renderMonthlyTrendChart()}
        </Col>
        <Col xs={24} lg={10}>
          {renderBudgetUsageChart()}
        </Col>
      </Row>
    </div>
  )
}

export default ChartsPanel