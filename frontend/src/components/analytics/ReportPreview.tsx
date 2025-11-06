/**
 * 报表预览组件
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Tabs,
  Table,
  Statistic,
  Empty,
  Divider
} from '@arco-design/web-react'
import {
  IconDownload,
  IconExport,
  IconRefresh,
  IconEye,
  IconDashboard,
  IconFile
} from '@arco-design/web-react/icon'
import * as echarts from 'echarts'
import { useReportService } from '../../api/reportService'
import type { ReportConfig, ReportPreviewData } from '../../api/reportService'
import styles from './ReportPreview.module.css'

const { Row, Col } = Grid
const { Title, Text } = Typography
const { TabPane } = Tabs

// 组件属性
export interface ReportPreviewProps {
  config: ReportConfig
  onClose?: () => void
  onDownload?: () => void
  onShare?: () => void
}

/**
 * 报表预览组件
 */
const ReportPreview: React.FC<ReportPreviewProps> = ({
  config,
  onClose,
  onDownload,
  onShare
}) => {
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null)
  const [activeTab, setActiveTab] = useState('summary')

  const { loading, error, getReportPreview } = useReportService()

  // 加载预览数据
  useEffect(() => {
    loadPreviewData()
  }, [config])

  /**
   * 加载预览数据
   */
  const loadPreviewData = async () => {
    const data = await getReportPreview(config)
    if (data) {
      setPreviewData(data)
    }
  }

  /**
   * 刷新预览数据
   */
  const handleRefresh = () => {
    loadPreviewData()
  }

  /**
   * 渲染图表
   */
  const renderChart = (chartConfig: any) => {
    const chartRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (!chartRef.current || !chartConfig.data) return

      const chart = echarts.init(chartRef.current)
      
      let option: any = {}

      switch (chartConfig.type) {
        case 'bar':
          option = {
            title: {
              text: chartConfig.title,
              left: 'center',
              textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            legend: {
              top: 30,
              data: chartConfig.data.series?.map((s: any) => s.name) || []
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: chartConfig.data.categories || []
            },
            yAxis: {
              type: 'value'
            },
            series: chartConfig.data.series?.map((s: any) => ({
              ...s,
              type: 'bar',
              barWidth: '60%'
            })) || []
          }
          break

        case 'pie':
          option = {
            title: {
              text: chartConfig.title,
              left: 'center',
              textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
              top: 30,
              data: chartConfig.data.map((item: any) => item.name)
            },
            series: [
              {
                name: chartConfig.title,
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '60%'],
                avoidLabelOverlap: false,
                label: {
                  show: false,
                  position: 'center'
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: '18',
                    fontWeight: 'bold'
                  }
                },
                labelLine: {
                  show: false
                },
                data: chartConfig.data
              }
            ]
          }
          break

        case 'line':
          option = {
            title: {
              text: chartConfig.title,
              left: 'center',
              textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'axis'
            },
            legend: {
              top: 30,
              data: chartConfig.data.series?.map((s: any) => s.name) || []
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              boundaryGap: false,
              data: chartConfig.data.categories || []
            },
            yAxis: {
              type: 'value'
            },
            series: chartConfig.data.series?.map((s: any) => ({
              ...s,
              type: 'line',
              smooth: true
            })) || []
          }
          break

        case 'funnel':
          option = {
            title: {
              text: chartConfig.title,
              left: 'center',
              textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c}'
            },
            series: [
              {
                name: chartConfig.title,
                type: 'funnel',
                left: '10%',
                top: '15%',
                width: '80%',
                height: '70%',
                minSize: '0%',
                maxSize: '100%',
                sort: 'descending',
                gap: 2,
                label: {
                  show: true,
                  position: 'inside'
                },
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
                    fontSize: 20
                  }
                },
                data: chartConfig.data
              }
            ]
          }
          break
      }

      chart.setOption(option)

      // 响应式调整
      const handleResize = () => {
        chart.resize()
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.dispose()
      }
    }, [chartConfig])

    return (
      <div
        ref={chartRef}
        className={styles.chartContainer}
        style={{ width: '100%', height: '300px' }}
      />
    )
  }

  /**
   * 渲染汇总信息
   */
  const renderSummary = () => {
    if (!previewData) return null

    return (
      <div className={styles.summarySection}>
        <Row gutter={16} className={styles.summaryStats}>
          <Col span={8}>
            <Card className={styles.statCard}>
              <Statistic
                title="数据记录数"
                value={previewData.summary.totalRecords}
                suffix="条"
                countUp
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className={styles.statCard}>
              <Statistic
                title="数据范围"
                value={previewData.summary.dateRange}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className={styles.statCard}>
              <Statistic
                title="生成时间"
                value={previewData.summary.generatedAt}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        <div className={styles.reportInfo}>
          <Title heading={4}>报表信息</Title>
          <Space direction="vertical" size="small">
            <Text>
              <strong>报表类型:</strong> {previewData.title}
            </Text>
            <Text>
              <strong>导出格式:</strong> {config.format.toUpperCase()}
            </Text>
            <Text>
              <strong>包含图表:</strong> {config.includeCharts ? '是' : '否'}
            </Text>
            <Text>
              <strong>包含汇总:</strong> {config.includeSummary ? '是' : '否'}
            </Text>
          </Space>
        </div>
      </div>
    )
  }

  /**
   * 渲染图表标签页
   */
  const renderCharts = () => {
    if (!previewData?.charts || previewData.charts.length === 0) {
      return (
        <Empty
          description="暂无图表数据"
          image={<IconDashboard style={{ fontSize: 48, color: '#ccc' }} />}
        />
      )
    }

    return (
      <div className={styles.chartsSection}>
        <Row gutter={16}>
          {previewData.charts.map((chart, index) => (
            <Col span={12} key={index}>
              <Card className={styles.chartCard}>
                {renderChart(chart)}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  /**
   * 渲染数据表格标签页
   */
  const renderTables = () => {
    if (!previewData?.tables || previewData.tables.length === 0) {
      return (
        <Empty
          description="暂无表格数据"
          image={<IconFile style={{ fontSize: 48, color: '#ccc' }} />}
        />
      )
    }

    return (
      <div className={styles.tablesSection}>
        {previewData.tables.map((table, index) => (
          <Card key={index} title={table.title} className={styles.tableCard}>
            <Table
              columns={table.headers.map((header, idx) => ({
                title: header,
                dataIndex: idx.toString(),
                key: idx.toString(),
                width: 150
              }))}
              data={table.rows.map((row, rowIdx) => {
                const rowData: Record<string, any> = { key: rowIdx }
                row.forEach((cell, cellIdx) => {
                  rowData[cellIdx.toString()] = cell
                })
                return rowData
              })}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `共 ${table.totalRows} 条记录，当前显示 ${Math.min(total, 10)} 条`
              }}
              scroll={{ x: table.headers.length * 150 }}
              size="small"
            />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="预览失败"
        description={error.message}
        showIcon
        action={
          <Button size="small" onClick={handleRefresh}>
            重试
          </Button>
        }
      />
    )
  }

  return (
    <div className={styles.reportPreview}>
      {/* 预览头部 */}
      <div className={styles.previewHeader}>
        <div className={styles.headerLeft}>
          <Title heading={4} style={{ margin: 0 }}>
            {previewData?.title || '报表预览'}
          </Title>
        </div>
        
        <div className={styles.headerRight}>
          <Space>
            <Button
              icon={<IconRefresh />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            {onDownload && (
              <Button
                type="primary"
                icon={<IconDownload />}
                onClick={onDownload}
              >
                下载报表
              </Button>
            )}
            {onShare && (
              <Button
                icon={<IconExport />}
                onClick={onShare}
              >
                分享报表
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* 预览内容 */}
      <div className={styles.previewContent}>
        <Spin loading={loading}>
          {previewData ? (
            <Tabs
              activeTab={activeTab}
              onChange={setActiveTab}
              className={styles.previewTabs}
            >
              <TabPane key="summary" title="汇总信息" icon={<IconEye />}>
                {renderSummary()}
              </TabPane>
              
              {config.includeCharts && (
                <TabPane key="charts" title="图表分析" icon={<IconDashboard />}>
                  {renderCharts()}
                </TabPane>
              )}
              
              <TabPane key="tables" title="数据详情" icon={<IconFile />}>
                {renderTables()}
              </TabPane>
            </Tabs>
          ) : (
            <Empty description="暂无预览数据" />
          )}
        </Spin>
      </div>
    </div>
  )
}

export default ReportPreview