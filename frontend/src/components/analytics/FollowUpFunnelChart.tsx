/**
 * 跟进漏斗图表组件
 */
import React, { useEffect, useRef, useMemo } from 'react'
import { Card, Typography, Alert, Spin, Tag } from '@arco-design/web-react'
import { IconInfoCircle } from '@arco-design/web-react/icon'
import * as echarts from 'echarts'
import type { FunnelData, FunnelStage, DataFilters } from '../../api/analyticsService'
import styles from './FollowUpFunnelChart.module.css'

const { Text } = Typography

interface FollowUpFunnelChartProps {
  data?: FunnelData
  loading?: boolean
  error?: Error | null
  filters?: DataFilters
  onStageClick?: (stage: FunnelStage, stageIndex: number) => void
  className?: string
  height?: number
}

/**
 * 跟进漏斗图表组件
 */
const FollowUpFunnelChart: React.FC<FollowUpFunnelChartProps> = ({
  data,
  loading = false,
  error,

  onStageClick,
  className,
  height = 400
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  // 准备图表数据
  const chartData = useMemo(() => {
    if (!data?.stages) return null

    const funnelData = data.stages.map((stage, index) => ({
      name: stage.name,
      value: stage.count,
      itemStyle: {
        color: stage.isWarning 
          ? '#ff4d4f' // 预警颜色
          : `hsl(${210 + index * 30}, 70%, 50%)` // 渐变蓝色系
      },
      label: {
        show: true,
        position: 'inside',
        formatter: (params: any) => {
          return `${params.name}\n${params.value}个\n${stage.percentage.toFixed(1)}%`
        },
        fontSize: 12,
        color: '#fff',
        fontWeight: 600
      },
      emphasis: {
        label: {
          fontSize: 14
        }
      }
    }))

    return {
      funnelData,
      conversionRates: data.conversionRates
    }
  }, [data])

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

    const option: echarts.EChartsOption = {
      title: {
        text: '拓店跟进漏斗',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#1d2129'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const stage = data?.stages[params.dataIndex]
          if (!stage) return ''
          
          let tooltip = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${params.name}</div>
              <div>数量: <span style="color: #1890ff; font-weight: bold;">${params.value}个</span></div>
              <div>占比: <span style="color: #52c41a; font-weight: bold;">${stage.percentage.toFixed(1)}%</span></div>
          `
          
          if (params.dataIndex > 0) {
            const conversionRate = chartData.conversionRates[params.dataIndex - 1]
            tooltip += `<div>转化率: <span style="color: #722ed1; font-weight: bold;">${conversionRate.toFixed(1)}%</span></div>`
          }
          
          if (stage.details) {
            tooltip += `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0;">
                <div>平均周期: ${stage.details.avgDuration}天</div>
                <div>成功率: ${stage.details.successRate.toFixed(1)}%</div>
              </div>
            `
          }
          
          tooltip += '</div>'
          return tooltip
        }
      },
      series: [
        {
          name: '跟进漏斗',
          type: 'funnel',
          left: '10%',
          top: '15%',
          width: '80%',
          height: '70%',
          min: 0,
          max: Math.max(...chartData.funnelData.map(item => item.value)),
          minSize: '20%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: chartData.funnelData[0].label,
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 14
            }
          },
          data: chartData.funnelData
        }
      ]
    }

    chart.setOption(option)

    // 添加点击事件
    chart.on('click', (params) => {
      if (onStageClick && data?.stages[params.dataIndex]) {
        onStageClick(data.stages[params.dataIndex], params.dataIndex)
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
  }, [chartData, data, onStageClick])

  // 渲染转化率指标
  const renderConversionRates = () => {
    if (!data?.conversionRates || !data?.stages) return null

    return (
      <div className={styles.conversionRates}>
        <div className={styles.ratesTitle}>各环节转化率</div>
        <div className={styles.ratesList}>
          {data.conversionRates.map((rate, index) => {
            const fromStage = data.stages[index]
            const toStage = data.stages[index + 1]
            const isLowRate = rate < 60 // 转化率低于60%视为预警
            
            return (
              <div key={index} className={styles.rateItem}>
                <div className={styles.rateStages}>
                  <Text className={styles.fromStage}>{fromStage.name}</Text>
                  <Text className={styles.arrow}>→</Text>
                  <Text className={styles.toStage}>{toStage.name}</Text>
                </div>
                <div className={styles.rateValue}>
                  <Tag 
                    color={isLowRate ? 'red' : 'green'}
                    className={styles.rateTag}
                  >
                    {rate.toFixed(1)}%
                  </Tag>
                  {isLowRate && (
                    <IconWarning 
                      className={styles.warningIcon}
                      style={{ color: '#ff4d4f' }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染统计摘要
  const renderSummary = () => {
    if (!data) return null

    const totalCount = data.totalCount
    const completedCount = data.stages[data.stages.length - 1]?.count || 0
    const overallConversionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    return (
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>总数量</Text>
          <Text className={styles.summaryValue}>{totalCount}个</Text>
        </div>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>已完成</Text>
          <Text className={styles.summaryValue}>{completedCount}个</Text>
        </div>
        <div className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>整体转化率</Text>
          <Text 
            className={styles.summaryValue}
            style={{ 
              color: overallConversionRate >= 20 ? '#52c41a' : '#ff4d4f' 
            }}
          >
            {overallConversionRate.toFixed(1)}%
          </Text>
        </div>
      </div>
    )
  }

  // 渲染预警信息
  const renderWarnings = () => {
    if (!data?.stages) return null

    const warningStages = data.stages.filter(stage => stage.isWarning)
    if (warningStages.length === 0) return null

    return (
      <Alert
        type="warning"
        title="转化率预警"
        content={
          <div>
            以下环节转化率偏低，需要关注：
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              {warningStages.map((stage, index) => (
                <li key={index}>
                  {stage.name}: {stage.percentage.toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
        }
        showIcon
        className={styles.warningAlert}
      />
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className={className}>
        <Alert
          type="error"
          title="漏斗数据加载失败"
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
          <Text style={{ marginTop: 16 }}>正在加载漏斗数据...</Text>
        </div>
      </Card>
    )
  }

  // 无数据状态
  if (!data || !data.stages.length) {
    return (
      <Card className={className}>
        <div className={styles.emptyContainer} style={{ height }}>
          <Text>暂无漏斗数据</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${styles.funnelCard} ${className || ''}`}>
      <div className={styles.cardHeader}>
        {renderSummary()}
        {data.timeRange && (
          <div className={styles.timeRange}>
            <IconInfoCircle style={{ marginRight: 4 }} />
            <Text type="secondary">
              统计周期: {data.timeRange.startDate} ~ {data.timeRange.endDate}
            </Text>
          </div>
        )}
      </div>

      {renderWarnings()}

      <div className={styles.chartContainer}>
        <div 
          ref={chartRef} 
          className={styles.chart}
          style={{ height }}
        />
        {renderConversionRates()}
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

export default FollowUpFunnelChart