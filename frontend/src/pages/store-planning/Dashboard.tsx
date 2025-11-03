/**
 * 开店计划执行仪表板
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Statistic,
  Table,
  Tag,
  Button,
  DatePicker,
  Space,
  Message,
  Empty,
  Spin,
  Typography
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconClockCircle,
  IconCheckCircle,
  IconCloseCircle
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import { useStatisticsService } from '../../api/statisticsService'
import { DashboardData, PlanStatus } from '../../types'
import styles from './Dashboard.module.css'

const { Row, Col } = Grid
const { RangePicker } = DatePicker
const { Text } = Typography

// 计划状态配置
const PLAN_STATUS_CONFIG: Record<PlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'gray' },
  published: { text: '已发布', color: 'blue' },
  executing: { text: '执行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' }
}

// 预警严重程度配置
const ALERT_SEVERITY_CONFIG = {
  low: { text: '低', color: 'blue' },
  medium: { text: '中', color: 'orange' },
  high: { text: '高', color: 'red' }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  
  const {
    loading,
    getDashboard,
    refresh: refreshCache
  } = useStatisticsService({
    autoRefresh: true,
    refreshInterval: 60000, // 每分钟自动刷新
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000 // 缓存5分钟
  })

  // 加载仪表板数据
  const loadDashboard = async () => {
    try {
      const data = await getDashboard()
      if (data) {
        setDashboardData(data)
      }
    } catch (error: any) {
      Message.error('加载仪表板数据失败')
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    refreshCache()
    loadDashboard()
    Message.success('数据已刷新')
  }

  // 时间筛选变化（预留功能）
  const handleDateRangeChange = (_dates: any) => {
    // 时间筛选功能待后端API支持
    Message.info('时间筛选功能即将上线')
  }

  // 最近计划表格列配置
  const recentPlansColumns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      render: (name: string, record: any) => (
        <a onClick={() => navigate(`/store-planning/plans/${record.id}`)}>
          {name}
        </a>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: PlanStatus) => {
        const config = PLAN_STATUS_CONFIG[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '完成率',
      dataIndex: 'completion_rate',
      align: 'right' as const,
      render: (rate: number) => (
        <span style={{ 
          color: rate >= 100 ? '#00b42a' : rate >= 50 ? '#ff7d00' : '#f53f3f' 
        }}>
          {rate.toFixed(1)}%
        </span>
      )
    },
    {
      title: '计划周期',
      dataIndex: 'start_date',
      render: (_: any, record: any) => (
        `${record.start_date} 至 ${record.end_date}`
      )
    }
  ]

  // 区域绩效表格列配置
  const regionPerformanceColumns = [
    {
      title: '经营区域',
      dataIndex: 'region_name'
    },
    {
      title: '计划数量',
      dataIndex: 'plan_count',
      align: 'right' as const,
      render: (count: number) => `${count} 个`
    },
    {
      title: '目标数量',
      dataIndex: 'total_target',
      align: 'right' as const,
      render: (count: number) => `${count} 家`
    },
    {
      title: '完成数量',
      dataIndex: 'total_completed',
      align: 'right' as const,
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

  // 预警信息表格列配置
  const alertsColumns = [
    {
      title: '计划名称',
      dataIndex: 'plan_name',
      render: (name: string, record: any) => (
        <a onClick={() => navigate(`/store-planning/plans/${record.plan_id}`)}>
          {name}
        </a>
      )
    },
    {
      title: '预警类型',
      dataIndex: 'type'
    },
    {
      title: '预警信息',
      dataIndex: 'message'
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      render: (severity: 'low' | 'medium' | 'high') => {
        const config = ALERT_SEVERITY_CONFIG[severity]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      render: (time: string) => new Date(time).toLocaleString('zh-CN')
    }
  ]

  // 初始加载
  useEffect(() => {
    loadDashboard()
  }, [])

  return (
    <div className={styles.container}>
      {/* 页面标题和操作 */}
      <div className={styles.header}>
        <h2>计划执行仪表板</h2>
        <Space>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            onChange={handleDateRangeChange}
            style={{ width: 260 }}
          />
          <Button
            icon={<IconRefresh />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新数据
          </Button>
        </Space>
      </div>

      <Spin loading={loading} style={{ display: 'block' }}>
        {dashboardData ? (
          <>
            {/* 关键指标统计 */}
            <Card className={styles.summaryCard}>
              <Row gutter={24}>
                <Col span={4}>
                  <Statistic
                    title="总计划数"
                    value={dashboardData.summary.total_plans}
                    suffix="个"
                    prefix={<IconClockCircle />}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="执行中计划"
                    value={dashboardData.summary.active_plans}
                    suffix="个"
                    prefix={<IconClockCircle />}
                  />
                  <Text type="warning" style={{ fontSize: 12 }}>执行中</Text>
                </Col>
                <Col span={4}>
                  <Statistic
                    title="已完成计划"
                    value={dashboardData.summary.completed_plans}
                    suffix="个"
                    prefix={<IconCheckCircle />}
                  />
                  <Text type="success" style={{ fontSize: 12 }}>已完成</Text>
                </Col>
                <Col span={4}>
                  <Statistic
                    title="总目标数量"
                    value={dashboardData.summary.total_target}
                    suffix="家"
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="已完成数量"
                    value={dashboardData.summary.total_completed}
                    suffix="家"
                  />
                  <Text type="success" style={{ fontSize: 12 }}>已完成</Text>
                </Col>
                <Col span={4}>
                  <Statistic
                    title="总体完成率"
                    value={dashboardData.summary.overall_completion_rate.toFixed(1)}
                    suffix="%"
                  />
                  <Text 
                    type={
                      dashboardData.summary.overall_completion_rate >= 100 
                        ? 'success' 
                        : 'warning'
                    }
                    style={{ fontSize: 12 }}
                  >
                    {dashboardData.summary.overall_completion_rate >= 100 ? '已达标' : '进行中'}
                  </Text>
                </Col>
              </Row>
            </Card>

            <Row gutter={16}>
              {/* 最近计划 */}
              <Col span={12}>
                <Card 
                  title="最近计划"
                  className={styles.card}
                >
                  <Table
                    columns={recentPlansColumns}
                    data={dashboardData.recent_plans}
                    pagination={false}
                    rowKey="id"
                  />
                </Card>
              </Col>

              {/* 区域绩效 */}
              <Col span={12}>
                <Card 
                  title="区域绩效"
                  className={styles.card}
                >
                  <Table
                    columns={regionPerformanceColumns}
                    data={dashboardData.region_performance}
                    pagination={false}
                    rowKey="region_id"
                  />
                </Card>
              </Col>
            </Row>

            {/* 预警信息 */}
            {dashboardData.alerts && dashboardData.alerts.length > 0 && (
              <Card 
                title="预警信息"
                className={styles.card}
                extra={
                  <Tag color="red" icon={<IconCloseCircle />}>
                    {dashboardData.alerts.length} 条预警
                  </Tag>
                }
              >
                <Table
                  columns={alertsColumns}
                  data={dashboardData.alerts}
                  pagination={{ pageSize: 10 }}
                  rowKey={(record: any) => `${record.plan_id}-${record.created_at}`}
                />
              </Card>
            )}
          </>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Spin>
    </div>
  )
}

export default Dashboard
