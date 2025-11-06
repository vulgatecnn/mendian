/**
 * 经营大屏 - 数据可视化大屏页面
 */
import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Grid,
  Statistic,
  Progress,
  Select,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Empty,

} from '@arco-design/web-react'
import {
  IconRefresh,
  IconFullscreen,
  IconDownload,

} from '@arco-design/web-react/icon'
import { useAnalyticsService } from '../../api/analyticsService'
import type { DataFilters, DashboardOverviewData } from '../../api/analyticsService'

import { 
  StoreMapVisualization, 
  FollowUpFunnelChart, 
  PlanProgressChart, 
  DataFilters as DataFiltersComponent 
} from '../../components/analytics'
import styles from './BusinessDashboard.module.css'

const { Row, Col } = Grid
const { Title, Text } = Typography


/**
 * 经营大屏组件
 */
const BusinessDashboard: React.FC = () => {
  // 状态管理
  const [dashboardData, setDashboardData] = useState<DashboardOverviewData | null>(null)
  const [filters, setFilters] = useState<DataFilters>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(300) // 5分钟
  const dashboardRef = useRef<HTMLDivElement>(null)

  // API 服务
  const {
    loading,
    error,
    getDashboardOverview,

    clearCache
  } = useAnalyticsService({
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
  }, [filters])

  /**
   * 加载仪表板数据
   */
  const loadDashboardData = async () => {
    const data = await getDashboardOverview(filters)
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
   * 处理筛选变化
   */
  const handleFiltersChange = (newFilters: DataFilters) => {
    setFilters(newFilters)
  }

  /**
   * 重置筛选
   */
  const handleFiltersReset = () => {
    setFilters({})
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
   * 处理漏斗阶段点击
   */
  const handleFunnelStageClick = (stage: any, stageIndex: number) => {
    console.log('点击漏斗阶段:', stage, stageIndex)
    // TODO: 跳转到跟进列表页面
  }

  /**
   * 处理计划点击
   */
  const handlePlanClick = (plan: any) => {
    console.log('点击计划:', plan)
    // TODO: 跳转到计划详情页面
  }

  /**
   * 渲染概览统计卡片
   */
  const renderSummaryCards = () => {
    if (!dashboardData?.planProgress?.summary) return null

    const { summary } = dashboardData.planProgress
    const storeCount = dashboardData.storeMap?.stores?.length || 0
    const openedStores = dashboardData.storeMap?.stores?.filter(s => s.status === 'opened').length || 0

    return (
      <Row gutter={16} className={styles.summaryCards}>
        <Col span={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="总门店数"
              value={storeCount}
              suffix="家"
              countUp
              styleValue={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="已开业"
              value={openedStores}
              suffix="家"
              countUp
              styleValue={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.summaryCard}>
            <Statistic
              title="目标门店数"
              value={summary.totalTarget}
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
                  {summary.totalCompleted}/{summary.totalTarget}
                </Text>
              </div>
              <Progress
                percent={summary.overallProgress}
                status={summary.overallProgress >= 80 ? 'success' : 'normal'}
                showText={false}
                className={styles.progress}
              />
              <Text className={styles.progressPercent}>
                {summary.overallProgress.toFixed(1)}%
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    )
  }





  /**
   * 渲染预警信息
   */
  const renderAlerts = () => {
    // 从各个组件收集预警信息
    const alerts: Array<{
      type: 'error' | 'warning' | 'info'
      title: string
      content: string
    }> = []
    
    // 从漏斗数据收集预警
    if (dashboardData?.followUpFunnel?.stages) {
      const warningStages = dashboardData.followUpFunnel.stages.filter(stage => stage.isWarning)
      warningStages.forEach(stage => {
        alerts.push({
          type: 'warning' as const,
          title: '跟进转化率预警',
          content: `${stage.name}环节转化率偏低: ${stage.percentage.toFixed(1)}%`
        })
      })
    }
    
    // 从计划进度收集预警
    if (dashboardData?.planProgress?.plans) {
      const delayedPlans = dashboardData.planProgress.plans.filter(plan => plan.status === 'delayed')
      const atRiskPlans = dashboardData.planProgress.plans.filter(plan => plan.status === 'at_risk')
      
      delayedPlans.forEach(plan => {
        alerts.push({
          type: 'error' as const,
          title: '计划进度延期',
          content: `${plan.planName}: ${plan.progressRate.toFixed(1)}%`
        })
      })
      
      atRiskPlans.forEach(plan => {
        alerts.push({
          type: 'warning' as const,
          title: '计划存在风险',
          content: `${plan.planName}: ${plan.progressRate.toFixed(1)}%`
        })
      })
    }

    if (alerts.length === 0) {
      return (
        <Card title="预警信息" className={styles.alertsCard}>
          <Empty description="暂无预警信息" />
        </Card>
      )
    }

    return (
      <Card title="预警信息" className={styles.alertsCard}>
        <div className={styles.alertsList}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              type={alert.type}
              title={alert.title}
              content={alert.content}
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
              <Select.Option value={60}>1分钟</Select.Option>
              <Select.Option value={300}>5分钟</Select.Option>
              <Select.Option value={600}>10分钟</Select.Option>
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

      {/* 数据筛选 */}
      <DataFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFiltersReset}
        loading={loading}
      />

      {/* 主要内容 */}
      <Spin loading={loading} className={styles.content}>
        {dashboardData ? (
          <div className={styles.dashboardContent}>
            {/* 开店地图 */}
            <Row gutter={16} className={styles.mapRow}>
              <Col span={24}>
                <StoreMapVisualization
                  data={dashboardData.storeMap}
                  loading={loading}
                  error={error}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onRefresh={handleRefresh}
                />
              </Col>
            </Row>

            {/* 漏斗图和进度图 */}
            <Row gutter={16} className={styles.chartsRow}>
              <Col span={12}>
                <FollowUpFunnelChart
                  data={dashboardData.followUpFunnel}
                  loading={loading}
                  error={error}
                  filters={filters}
                  onStageClick={handleFunnelStageClick}
                  height={500}
                />
              </Col>
              <Col span={12}>
                <PlanProgressChart
                  data={dashboardData.planProgress}
                  loading={loading}
                  error={error}
                  filters={filters}
                  onPlanClick={handlePlanClick}
                  height={500}
                />
              </Col>
            </Row>

            {/* 概览统计 */}
            {renderSummaryCards()}

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