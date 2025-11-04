/**
 * 经营大屏 - 数据可视化大屏页面
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Grid,
  Statistic,
  Progress,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Empty,
  Tooltip
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconFullscreen,
  IconDownload,
  IconEye
} from '@arco-design/web-react/icon'
import { useStatisticsService } from '../../api/statisticsService'
import type { DashboardData, BusinessRegion } from '../../types'
import styles from './BusinessDashboard.module.css'

const { Row, Col } = Grid
const { Title, Text } = Typography
const { RangePicker } = DatePicker

/**
 * 经营大屏组件
 */
const BusinessDashboard: React.FC = () => {
  // 状态管理
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<number | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | undefined>()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // 秒
  const dashboardRef = useRef<HTMLDivElement>(null)

  // API 服务
  const {
    loading,
    error,
    getDashboard,
    refresh,
    clearCache
  } = useStatisticsService({
    autoRefresh,
    refreshInterval: refreshInterval * 1000,
    onSuccess: (data) => {
      setDashboardData(data)
    },
    onError: (error) => {
      console.error('获取仪表板数据失败:', error)
    }
  })

  // 初始化数据
  useEffect(() => {
    loadDashboardData()
  }, [selectedRegion, dateRange])

  /**
   * 加载仪表板数据
   */
  const loadDashboardData = async () => {
    const data = await getDashboard()
    if (data) {
      setDashboardData(data)
    }
  }

  /**
   * 手动刷新数据
   */
  const handleRefresh = () => {
    clearCache()
    loadDashboardData()
  }

  /**
   * 切换全屏模式
   */
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (dashboardRef.current?.requestFullscreen) {
        dashboardRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  /**
   * 导出数据
   */
  const handleExport = () => {
    // TODO: 实现数据导出功能
    console.log('导出数据')
  }

  /**
   * 渲染概览统计卡片
   */
  const renderSummaryCards = () => {
    if (!dashboardData?.summary) return null

    const { summary } = dashboardData

    return (
      <Row gutter={16} className={styles.summaryCards}>
        <Col span={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="总计划数"
              value={summary.total_plans}
              suffix="个"
              countUp
              styleValue={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="执行中计划"
              value={summary.active_plans}
              suffix="个"
              countUp
              styleValue={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="目标门店数"
              value={summary.total_target}
              suffix="家"
              countUp
              styleValue={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.summaryCard}>
            <div className={styles.progressCard}>
              <div className={styles.progressTitle}>
                <Text>完成进度</Text>
                <Text className={styles.progressValue}>
                  {summary.total_completed}/{summary.total_target}
                </Text>
              </div>
              <Progress
                percent={summary.overall_completion_rate}
                status={summary.overall_completion_rate >= 80 ? 'success' : 'normal'}
                showText={false}
                className={styles.progress}
              />
              <Text className={styles.progressPercent}>
                {summary.overall_completion_rate.toFixed(1)}%
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    )
  }

  /**
   * 渲染区域绩效表格
   */
  const renderRegionPerformance = () => {
    if (!dashboardData?.region_performance) return null

    const columns = [
      {
        title: '区域名称',
        dataIndex: 'region_name',
        key: 'region_name',
        width: 120,
        render: (text: string) => (
          <Text style={{ fontWeight: 'bold' }}>{text}</Text>
        )
      },
      {
        title: '计划数',
        dataIndex: 'plan_count',
        key: 'plan_count',
        width: 80,
        align: 'center' as const,
        render: (value: number) => (
          <Text>{value}个</Text>
        )
      },
      {
        title: '目标门店',
        dataIndex: 'total_target',
        key: 'total_target',
        width: 100,
        align: 'center' as const,
        render: (value: number) => (
          <Text>{value}家</Text>
        )
      },
      {
        title: '已完成',
        dataIndex: 'total_completed',
        key: 'total_completed',
        width: 100,
        align: 'center' as const,
        render: (value: number) => (
          <Text style={{ color: '#52c41a' }}>{value}家</Text>
        )
      },
      {
        title: '完成率',
        dataIndex: 'completion_rate',
        key: 'completion_rate',
        width: 150,
        align: 'center' as const,
        render: (rate: number) => (
          <div className={styles.progressCell}>
            <Progress
              percent={rate}
              size="small"
              status={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'error'}
              showText={false}
            />
            <Text className={styles.progressText}>
              {rate.toFixed(1)}%
            </Text>
          </div>
        )
      }
    ]

    return (
      <Card 
        title="区域绩效排行" 
        className={styles.performanceCard}
        extra={
          <Tooltip content="查看详细报表">
            <Button 
              type="text" 
              icon={<IconEye />}
              onClick={() => {
                // TODO: 跳转到详细报表页面
                console.log('查看详细报表')
              }}
            />
          </Tooltip>
        }
      >
        <Table
          columns={columns}
          data={dashboardData.region_performance}
          pagination={false}
          size="small"
          className={styles.performanceTable}
          scroll={{ y: 300 }}
        />
      </Card>
    )
  }

  /**
   * 渲染最近计划列表
   */
  const renderRecentPlans = () => {
    if (!dashboardData?.recent_plans) return null

    const columns = [
      {
        title: '计划名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        render: (text: string) => (
          <Tooltip content={text}>
            <Text>{text}</Text>
          </Tooltip>
        )
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 80,
        render: (status: string) => {
          const statusMap = {
            'draft': { text: '草稿', color: '#d9d9d9' },
            'published': { text: '已发布', color: '#1890ff' },
            'executing': { text: '执行中', color: '#52c41a' },
            'completed': { text: '已完成', color: '#722ed1' },
            'cancelled': { text: '已取消', color: '#ff4d4f' }
          }
          const config = statusMap[status as keyof typeof statusMap] || { text: status, color: '#d9d9d9' }
          return (
            <span style={{ color: config.color }}>
              {config.text}
            </span>
          )
        }
      },
      {
        title: '完成率',
        dataIndex: 'completion_rate',
        key: 'completion_rate',
        width: 100,
        render: (rate: number) => (
          <Text>{rate.toFixed(1)}%</Text>
        )
      },
      {
        title: '计划期间',
        key: 'period',
        width: 200,
        render: (record: any) => (
          <Text>
            {record.start_date} ~ {record.end_date}
          </Text>
        )
      }
    ]

    return (
      <Card title="最近计划" className={styles.recentPlansCard}>
        <Table
          columns={columns}
          data={dashboardData.recent_plans}
          pagination={false}
          size="small"
          scroll={{ y: 300 }}
        />
      </Card>
    )
  }

  /**
   * 渲染预警信息
   */
  const renderAlerts = () => {
    if (!dashboardData?.alerts || dashboardData.alerts.length === 0) {
      return (
        <Card title="预警信息" className={styles.alertsCard}>
          <Empty description="暂无预警信息" />
        </Card>
      )
    }

    return (
      <Card title="预警信息" className={styles.alertsCard}>
        <div className={styles.alertsList}>
          {dashboardData.alerts.map((alert, index) => (
            <Alert
              key={index}
              type={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
              title={alert.message}
              content={`计划：${alert.plan_name} | ${alert.created_at}`}
              showIcon
              className={styles.alertItem}
            />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          type="error"
          title="数据加载失败"
          content={error.message}
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div 
      ref={dashboardRef}
      className={`${styles.dashboard} ${isFullscreen ? styles.fullscreen : ''}`}
    >
      {/* 头部工具栏 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Title heading={3} className={styles.title}>
            经营大屏
          </Title>
          <Text className={styles.subtitle}>
            实时监控门店开业进度和经营数据
          </Text>
        </div>
        
        <div className={styles.headerRight}>
          <Space>
            {/* 区域筛选 */}
            <Select
              placeholder="选择区域"
              allowClear
              style={{ width: 150 }}
              value={selectedRegion}
              onChange={setSelectedRegion}
            >
              {/* TODO: 从API获取区域列表 */}
            </Select>

            {/* 时间范围 */}
            <RangePicker
              style={{ width: 240 }}
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0], dates[1]])
                } else {
                  setDateRange(undefined)
                }
              }}
            />

            {/* 自动刷新设置 */}
            <Select
              value={autoRefresh ? refreshInterval : 0}
              onChange={(value) => {
                if (value === 0) {
                  setAutoRefresh(false)
                } else {
                  setAutoRefresh(true)
                  setRefreshInterval(value)
                }
              }}
              style={{ width: 120 }}
            >
              <Select.Option value={0}>手动刷新</Select.Option>
              <Select.Option value={30}>30秒</Select.Option>
              <Select.Option value={60}>1分钟</Select.Option>
              <Select.Option value={300}>5分钟</Select.Option>
            </Select>

            {/* 操作按钮 */}
            <Button
              icon={<IconRefresh />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            
            <Button
              icon={<IconDownload />}
              onClick={handleExport}
            >
              导出
            </Button>
            
            <Button
              icon={isFullscreen ? <IconFullscreen /> : <IconFullscreen />}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? '退出全屏' : '全屏'}
            </Button>
          </Space>
        </div>
      </div>

      {/* 主要内容 */}
      <Spin loading={loading} className={styles.content}>
        {dashboardData ? (
          <div className={styles.dashboardContent}>
            {/* 概览统计 */}
            {renderSummaryCards()}

            {/* 主要图表区域 */}
            <Row gutter={16} className={styles.chartsRow}>
              <Col span={16}>
                {renderRegionPerformance()}
              </Col>
              <Col span={8}>
                {renderRecentPlans()}
              </Col>
            </Row>

            {/* 预警信息 */}
            <Row gutter={16} className={styles.alertsRow}>
              <Col span={24}>
                {renderAlerts()}
              </Col>
            </Row>
          </div>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Spin>
    </div>
  )
}

export default BusinessDashboard