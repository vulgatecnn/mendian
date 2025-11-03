/**
 * 开店计划分析报表页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Table,
  Button,
  DatePicker,
  Select,
  Space,
  Message,
  Empty,
  Spin,
  Tabs,
  Descriptions
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconDownload,
  IconFilter
} from '@arco-design/web-react/icon'
import { useStatisticsService } from '../../api/statisticsService'
import { AnalysisReport as AnalysisReportType, ReportQueryParams, PlanType, PlanStatus } from '../../types'
import styles from './AnalysisReport.module.css'

const { Row, Col } = Grid
const { RangePicker } = DatePicker
const { Option } = Select
const TabPane = Tabs.TabPane

const AnalysisReport: React.FC = () => {
  const [reportData, setReportData] = useState<AnalysisReportType | null>(null)
  const [queryParams, setQueryParams] = useState<ReportQueryParams>({})
  const [exporting, setExporting] = useState(false)
  
  const {
    loading,
    getReport,
    exportReport,
    refresh: refreshCache
  } = useStatisticsService({
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000
  })

  // 加载报表数据
  const loadReport = async () => {
    try {
      const data = await getReport(queryParams)
      if (data) {
        setReportData(data)
      }
    } catch (error: any) {
      Message.error('加载报表数据失败')
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    refreshCache()
    loadReport()
    Message.success('数据已刷新')
  }

  // 导出报表
  const handleExport = async () => {
    try {
      setExporting(true)
      const blob = await exportReport(queryParams)
      
      if (blob) {
        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `开店计划分析报表_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        Message.success('报表导出成功')
      }
    } catch (error: any) {
      Message.error('报表导出失败')
    } finally {
      setExporting(false)
    }
  }

  // 时间范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setQueryParams({
        ...queryParams,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD')
      })
    } else {
      const { start_date, end_date, ...rest } = queryParams
      setQueryParams(rest)
    }
  }

  // 计划类型变化
  const handlePlanTypeChange = (value: PlanType | undefined) => {
    if (value) {
      setQueryParams({ ...queryParams, plan_type: value })
    } else {
      const { plan_type, ...rest } = queryParams
      setQueryParams(rest)
    }
  }

  // 计划状态变化
  const handleStatusChange = (value: PlanStatus | undefined) => {
    if (value) {
      setQueryParams({ ...queryParams, status: value })
    } else {
      const { status, ...rest } = queryParams
      setQueryParams(rest)
    }
  }

  // 应用筛选
  const handleApplyFilter = () => {
    loadReport()
  }

  // 按区域统计表格列配置
  const byRegionColumns = [
    {
      title: '经营区域',
      dataIndex: 'region_name',
      fixed: 'left' as const
    },
    {
      title: '计划数量',
      dataIndex: 'plan_count',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.plan_count - b.plan_count,
      render: (count: number) => `${count} 个`
    },
    {
      title: '目标数量',
      dataIndex: 'target_count',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.target_count - b.target_count,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成数量',
      dataIndex: 'completed_count',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.completed_count - b.completed_count,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.completion_rate - b.completion_rate,
      render: (rate: number) => (
        <span style={{ 
          color: rate >= 100 ? '#00b42a' : rate >= 50 ? '#ff7d00' : '#f53f3f',
          fontWeight: 500
        }}>
          {rate.toFixed(1)}%
        </span>
      )
    },
    {
      title: '预算金额',
      dataIndex: 'budget_amount',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.budget_amount - b.budget_amount,
      render: (amount: number) => `¥${amount.toLocaleString()}`
    }
  ]

  // 按门店类型统计表格列配置
  const byStoreTypeColumns = [
    {
      title: '门店类型',
      dataIndex: 'store_type_name',
      fixed: 'left' as const
    },
    {
      title: '计划数量',
      dataIndex: 'plan_count',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.plan_count - b.plan_count,
      render: (count: number) => `${count} 个`
    },
    {
      title: '目标数量',
      dataIndex: 'target_count',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.target_count - b.target_count,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成数量',
      dataIndex: 'completed_count',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.completed_count - b.completed_count,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      align: 'right' as const,
      sorter: (a: any, b: any) => a.completion_rate - b.completion_rate,
      render: (rate: number) => (
        <span style={{ 
          color: rate >= 100 ? '#00b42a' : rate >= 50 ? '#ff7d00' : '#f53f3f',
          fontWeight: 500
        }}>
          {rate.toFixed(1)}%
        </span>
      )
    }
  ]

  // 按月统计表格列配置
  const byMonthColumns = [
    {
      title: '月份',
      dataIndex: 'month'
    },
    {
      title: '目标数量',
      dataIndex: 'target_count',
      align: 'right' as const,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成数量',
      dataIndex: 'completed_count',
      align: 'right' as const,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      align: 'right' as const,
      render: (rate: number) => (
        <span style={{ 
          color: rate >= 100 ? '#00b42a' : rate >= 50 ? '#ff7d00' : '#f53f3f',
          fontWeight: 500
        }}>
          {rate.toFixed(1)}%
        </span>
      )
    }
  ]

  // 优秀表现表格列配置
  const topPerformersColumns = [
    {
      title: '排名',
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '经营区域',
      dataIndex: 'region_name'
    },
    {
      title: '完成数量',
      dataIndex: 'completed_count',
      align: 'right' as const,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      align: 'right' as const,
      render: (rate: number) => (
        <span style={{ color: '#00b42a', fontWeight: 500 }}>
          {rate.toFixed(1)}%
        </span>
      )
    }
  ]

  // 待改进表格列配置
  const underperformersColumns = [
    {
      title: '经营区域',
      dataIndex: 'region_name'
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      align: 'right' as const,
      render: (rate: number) => (
        <span style={{ color: '#f53f3f', fontWeight: 500 }}>
          {rate.toFixed(1)}%
        </span>
      )
    },
    {
      title: '差距',
      dataIndex: 'gap',
      align: 'right' as const,
      render: (gap: number) => (
        <span style={{ color: '#f53f3f' }}>
          {gap} 家
        </span>
      )
    }
  ]

  // 初始加载
  useEffect(() => {
    loadReport()
  }, [])

  return (
    <div className={styles.container}>
      {/* 页面标题和操作 */}
      <div className={styles.header}>
        <h2>分析报表</h2>
        <Space>
          <Button
            type="primary"
            icon={<IconDownload />}
            onClick={handleExport}
            loading={exporting}
          >
            导出报表
          </Button>
          <Button
            icon={<IconRefresh />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新数据
          </Button>
        </Space>
      </div>

      {/* 筛选条件 */}
      <Card className={styles.filterCard}>
        <Space size="large" wrap>
          <Space>
            <span>时间范围：</span>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateRangeChange}
              style={{ width: 260 }}
            />
          </Space>
          
          <Space>
            <span>计划类型：</span>
            <Select
              placeholder="全部"
              allowClear
              onChange={handlePlanTypeChange}
              style={{ width: 120 }}
            >
              <Option value="annual">年度计划</Option>
              <Option value="quarterly">季度计划</Option>
            </Select>
          </Space>
          
          <Space>
            <span>计划状态：</span>
            <Select
              placeholder="全部"
              allowClear
              onChange={handleStatusChange}
              style={{ width: 120 }}
            >
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
              <Option value="executing">执行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Space>
          
          <Button
            type="primary"
            icon={<IconFilter />}
            onClick={handleApplyFilter}
          >
            应用筛选
          </Button>
        </Space>
      </Card>

      <Spin loading={loading} style={{ display: 'block' }}>
        {reportData ? (
          <>
            {/* 总览信息 */}
            <Card className={styles.card} title="总览">
              <Descriptions
                column={3}
                data={[
                  {
                    label: '统计周期',
                    value: `${reportData.period.start_date} 至 ${reportData.period.end_date}`
                  },
                  {
                    label: '总计划数',
                    value: `${reportData.overview.total_plans} 个`
                  },
                  {
                    label: '总目标数量',
                    value: `${reportData.overview.total_target} 家`
                  },
                  {
                    label: '已完成数量',
                    value: `${reportData.overview.total_completed} 家`
                  },
                  {
                    label: '完成率',
                    value: (
                      <span style={{ 
                        color: reportData.overview.completion_rate >= 100 
                          ? '#00b42a' 
                          : reportData.overview.completion_rate >= 50
                          ? '#ff7d00'
                          : '#f53f3f',
                        fontWeight: 500
                      }}>
                        {reportData.overview.completion_rate.toFixed(1)}%
                      </span>
                    )
                  },
                  {
                    label: '总预算',
                    value: `¥${reportData.overview.total_budget.toLocaleString()}`
                  }
                ]}
              />
            </Card>

            {/* 多维度分析 */}
            <Card className={styles.card}>
              <Tabs defaultActiveTab="region">
                <TabPane key="region" title="按区域分析">
                  <Table
                    columns={byRegionColumns}
                    data={reportData.by_region}
                    pagination={{ pageSize: 10 }}
                    rowKey="region_id"
                  />
                </TabPane>
                
                <TabPane key="storeType" title="按门店类型分析">
                  <Table
                    columns={byStoreTypeColumns}
                    data={reportData.by_store_type}
                    pagination={{ pageSize: 10 }}
                    rowKey="store_type_id"
                  />
                </TabPane>
                
                <TabPane key="month" title="按月趋势分析">
                  <Table
                    columns={byMonthColumns}
                    data={reportData.by_month}
                    pagination={false}
                    rowKey="month"
                  />
                </TabPane>
              </Tabs>
            </Card>

            {/* 绩效分析 */}
            <Row gutter={16}>
              <Col span={12}>
                <Card className={styles.card} title="优秀表现 TOP 5">
                  {reportData.top_performers && reportData.top_performers.length > 0 ? (
                    <Table
                      columns={topPerformersColumns}
                      data={reportData.top_performers.slice(0, 5)}
                      pagination={false}
                      rowKey="region_id"
                    />
                  ) : (
                    <Empty description="暂无数据" />
                  )}
                </Card>
              </Col>
              
              <Col span={12}>
                <Card className={styles.card} title="待改进区域">
                  {reportData.underperformers && reportData.underperformers.length > 0 ? (
                    <Table
                      columns={underperformersColumns}
                      data={reportData.underperformers}
                      pagination={false}
                      rowKey="region_id"
                    />
                  ) : (
                    <Empty description="暂无数据" />
                  )}
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Spin>
    </div>
  )
}

export default AnalysisReport
