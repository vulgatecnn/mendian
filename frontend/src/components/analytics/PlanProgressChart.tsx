/**
 * 计划完成进度图表组件
 */
import React, { useEffect, useRef, useMemo, useState } from 'react'
import { 
  Card, 
  Typography, 
  Alert, 
  Spin, 
  Space, 
  Tag, 
  Select, 
  Progress,
  Statistic,
  Grid
} from '@arco-design/web-react'
// import { IconInfoCircle } from '@arco-design/web-react/icon' // 暂时未使用
import * as echarts from 'echarts'
import type { PlanProgressData, PlanProgressItem, DataFilters } from '../../api/analyticsService'
import styles from './PlanProgressChart.module.css'

const { Text } = Typography
const { Row, Col } = Grid

interface PlanProgressChartProps {
  data?: PlanProgressData
  loading?: boolean
  error?: Error | null
  filters?: DataFilters
  onPlanClick?: (plan: PlanProgressItem) => void
  className?: string
  height?: number
}

type ChartType = 'bar' | 'pie' | 'line'

/**
 * 计划完成进度图表组件
 */
const PlanProgressChart: React.FC<PlanProgressChartProps> = ({
  data,
  loading = false,
  error,

  onPlanClick,
  className,
  height = 400
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [selectedContributionType, setSelectedContributionType] = useState<string>()

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!data) return null

    let plans = data.plans
    if (selectedContributionType) {
      plans = plans.filter(plan => plan.contributionType === selectedContributionType)
    }

    return {
      ...data,
      plans
    }
  }, [data, selectedContributionType])

  // 准备图表数据
  const chartData = useMemo(() => {
    if (!filteredData) return null

    const plans = filteredData.plans
    const contributionTypes = filteredData.byContributionType

    // 柱状图数据
    const barData = {
      categories: plans.map(plan => plan.planName),
      targetData: plans.map(plan => plan.targetCount),
      completedData: plans.map(plan => plan.completedCount),
      progressData: plans.map(plan => plan.progressRate)
    }

    // 饼图数据（按贡献率类型）
    const pieData = contributionTypes.map(type => ({
      name: type.typeName,
      value: type.totalCompleted,
      target: type.totalTarget,
      rate: type.progressRate,
      itemStyle: {
        color: getContributionTypeColor(type.type)
      }
    }))

    // 折线图数据（进度趋势）
    const lineData = {
      categories: plans.map(plan => plan.planName),
      progressData: plans.map(plan => plan.progressRate),
      statusData: plans.map(plan => ({
        value: plan.progressRate,
        itemStyle: {
          color: getStatusColor(plan.status)
        }
      }))
    }

    return {
      barData,
      pieData,
      lineData
    }
  }, [filteredData])

  // 获取贡献率类型颜色
  const getContributionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'high': '#52c41a',
      'medium': '#1890ff',
      'low': '#faad14',
      'strategic': '#722ed1'
    }
    return colors[type] || '#d9d9d9'
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'on_track': '#52c41a',
      'at_risk': '#faad14',
      'delayed': '#ff4d4f'
    }
    return colors[status] || '#d9d9d9'
  }

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'on_track': '正常',
      'at_risk': '风险',
      'delayed': '延期'
    }
    return labels[status] || status
  }

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current || !chartData) return

    // 销毁现有图表实例
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
    }

    // 创建新的图表实例
    const chart = echarts.init(chartRef.current)
    chartInstanceRef.current = chart

    let option: echarts.EChartsOption = {}

    if (chartType === 'bar') {
      option = {
        title: {
          text: '计划完成进度对比',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            const planIndex = params[0].dataIndex
            const plan = filteredData?.plans[planIndex]
            if (!plan) return ''

            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 8px;">${plan.planName}</div>
                <div>目标: <span style="color: #1890ff;">${plan.targetCount}家</span></div>
                <div>完成: <span style="color: #52c41a;">${plan.completedCount}家</span></div>
                <div>进度: <span style="color: #722ed1;">${plan.progressRate.toFixed(1)}%</span></div>
                <div>状态: <span style="color: ${getStatusColor(plan.status)};">${getStatusLabel(plan.status)}</span></div>
              </div>
            `
          }
        },
        legend: {
          data: ['目标数量', '完成数量'],
          top: 40
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: 80,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: chartData.barData.categories,
          axisLabel: {
            rotate: 45,
            interval: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '数量'
        },
        series: [
          {
            name: '目标数量',
            type: 'bar',
            data: chartData.barData.targetData,
            itemStyle: {
              color: '#e6f7ff',
              borderColor: '#1890ff',
              borderWidth: 1
            }
          },
          {
            name: '完成数量',
            type: 'bar',
            data: chartData.barData.completedData,
            itemStyle: {
              color: '#52c41a'
            }
          }
        ]
      }
    } else if (chartType === 'pie') {
      option = {
        title: {
          text: '按贡献率类型完成情况',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const data = params.data
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
                <div>完成: <span style="color: #52c41a;">${data.value}家</span></div>
                <div>目标: <span style="color: #1890ff;">${data.target}家</span></div>
                <div>进度: <span style="color: #722ed1;">${data.rate.toFixed(1)}%</span></div>
                <div>占比: <span style="color: #fa8c16;">${params.percent.toFixed(1)}%</span></div>
              </div>
            `
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle'
        },
        series: [
          {
            name: '完成情况',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: chartData.pieData
          }
        ]
      }
    } else if (chartType === 'line') {
      option = {
        title: {
          text: '计划进度趋势',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const planIndex = params[0].dataIndex
            const plan = filteredData?.plans[planIndex]
            if (!plan) return ''

            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 8px;">${plan.planName}</div>
                <div>进度: <span style="color: #722ed1;">${plan.progressRate.toFixed(1)}%</span></div>
                <div>状态: <span style="color: ${getStatusColor(plan.status)};">${getStatusLabel(plan.status)}</span></div>
              </div>
            `
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: 60,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: chartData.lineData.categories,
          axisLabel: {
            rotate: 45,
            interval: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '完成率(%)',
          min: 0,
          max: 100
        },
        series: [
          {
            name: '完成率',
            type: 'line',
            data: chartData.lineData.statusData,
            smooth: true,
            lineStyle: {
              width: 3
            },
            symbol: 'circle',
            symbolSize: 8,
            markLine: {
              data: [
                { yAxis: 80, name: '目标线', lineStyle: { color: '#52c41a', type: 'dashed' } },
                { yAxis: 60, name: '预警线', lineStyle: { color: '#faad14', type: 'dashed' } }
              ]
            }
          }
        ]
      }
    }

    chart.setOption(option)

    // 添加点击事件
    chart.on('click', (params) => {
      if (onPlanClick && filteredData?.plans[params.dataIndex]) {
        onPlanClick(filteredData.plans[params.dataIndex])
      }
    })

    // 响应式处理
    const handleResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [chartData, chartType, filteredData, onPlanClick])

  // 渲染控制面板
  const renderControls = () => (
    <div className={styles.controls}>
      <Space>
        <Select
          value={chartType}
          onChange={setChartType}
          style={{ width: 120 }}
        >
          <Select.Option value="bar">柱状图</Select.Option>
          <Select.Option value="pie">饼图</Select.Option>
          <Select.Option value="line">折线图</Select.Option>
        </Select>
        
        <Select
          placeholder="贡献率类型"
          allowClear
          style={{ width: 150 }}
          value={selectedContributionType}
          onChange={setSelectedContributionType}
        >
          {data?.byContributionType.map(type => (
            <Select.Option key={type.type} value={type.type}>
              {type.typeName}
            </Select.Option>
          ))}
        </Select>
      </Space>
    </div>
  )

  // 渲染统计摘要
  const renderSummary = () => {
    if (!data?.summary) return null

    const { summary } = data
    const progressColor = summary.overallProgress >= 80 ? '#52c41a' : 
                         summary.overallProgress >= 60 ? '#faad14' : '#ff4d4f'

    return (
      <Row gutter={16} className={styles.summary}>
        <Col span={8}>
          <Statistic
            title="总目标"
            value={summary.totalTarget}
            suffix="家"
            style={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="已完成"
            value={summary.totalCompleted}
            suffix="家"
            style={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <div className={styles.progressStat}>
            <Text className={styles.progressTitle}>整体进度</Text>
            <div className={styles.progressContent}>
              <Progress
                percent={summary.overallProgress}
                status={summary.overallProgress >= 80 ? 'success' : 'normal'}
                showText={false}
                size="large"
              />
              <Text 
                className={styles.progressValue}
                style={{ color: progressColor }}
              >
                {summary.overallProgress.toFixed(1)}%
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    )
  }

  // 渲染贡献率类型统计
  const renderContributionTypeStats = () => {
    if (!data?.byContributionType) return null

    return (
      <div className={styles.contributionStats}>
        <div className={styles.statsTitle}>按贡献率类型统计</div>
        <div className={styles.statsList}>
          {data.byContributionType.map(type => (
            <div key={type.type} className={styles.statsItem}>
              <div className={styles.statsHeader}>
                <Text style={{ fontWeight: 'bold' }}>{type.typeName}</Text>
                <Tag 
                  color={type.progressRate >= 80 ? 'green' : type.progressRate >= 60 ? 'orange' : 'red'}
                >
                  {type.progressRate.toFixed(1)}%
                </Tag>
              </div>
              <div className={styles.statsContent}>
                <Text type="secondary">
                  {type.totalCompleted}/{type.totalTarget}家 ({type.planCount}个计划)
                </Text>
                <Progress
                  percent={type.progressRate}
                  showText={false}
                  size="small"
                  status={type.progressRate >= 80 ? 'success' : 'normal'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 渲染预警信息
  const renderWarnings = () => {
    if (!filteredData?.plans) return null

    const delayedPlans = filteredData.plans.filter(plan => plan.status === 'delayed')
    const atRiskPlans = filteredData.plans.filter(plan => plan.status === 'at_risk')

    if (delayedPlans.length === 0 && atRiskPlans.length === 0) return null

    return (
      <div className={styles.warnings}>
        {delayedPlans.length > 0 && (
          <Alert
            type="error"
            title={`${delayedPlans.length}个计划进度延期`}
            content={
              <ul className={styles.warningList}>
                {delayedPlans.map(plan => (
                  <li key={plan.planId}>
                    {plan.planName}: {plan.progressRate.toFixed(1)}%
                  </li>
                ))}
              </ul>
            }
            showIcon
            className={styles.warningAlert}
          />
        )}
        
        {atRiskPlans.length > 0 && (
          <Alert
            type="warning"
            title={`${atRiskPlans.length}个计划存在风险`}
            content={
              <ul className={styles.warningList}>
                {atRiskPlans.map(plan => (
                  <li key={plan.planId}>
                    {plan.planName}: {plan.progressRate.toFixed(1)}%
                  </li>
                ))}
              </ul>
            }
            showIcon
            className={styles.warningAlert}
          />
        )}
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className={className}>
        <Alert
          type="error"
          title="进度数据加载失败"
          content={error.message}
          showIcon
        />
      </Card>
    )
  }

  // 加载状态
  if (loading && !data) {
    return (
      <Card className={className}>
        <div className={styles.loadingContainer} style={{ height }}>
          <Spin size={40} />
          <Text style={{ marginTop: 16 }}>正在加载进度数据...</Text>
        </div>
      </Card>
    )
  }

  // 无数据状态
  if (!data || !data.plans.length) {
    return (
      <Card className={className}>
        <div className={styles.emptyContainer} style={{ height }}>
          <Text>暂无进度数据</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${styles.progressCard} ${className || ''}`}>
      <div className={styles.cardHeader}>
        <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>计划完成进度分析</Text>
        {renderControls()}
      </div>

      {renderSummary()}
      {renderWarnings()}

      <div className={styles.chartContainer}>
        <div 
          ref={chartRef} 
          className={styles.chart}
          style={{ height }}
        />
        {renderContributionTypeStats()}
      </div>

      {data.lastUpdated && (
        <div className={styles.updateTime}>
          <Text type="secondary">
            最后更新: {new Date(data.lastUpdated).toLocaleString()}
          </Text>
        </div>
      )}
    </Card>
  )
}

export default PlanProgressChart