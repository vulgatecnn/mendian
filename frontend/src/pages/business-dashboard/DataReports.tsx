/**
 * 数据报表页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Typography,
  Alert,
  Spin,
  Empty,
  Statistic,
  Progress,
  Space,
  Divider,
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconDownload,
  IconFilter,
  IconDashboard
} from '@arco-design/web-react/icon'
// import { useQuery } from '../../../hooks/useQuery'
// import { ReportService } from '../../../api/reportService'
// import type {
//   ReportData,
//   ReportQueryParams,
//   BusinessRegion,
//   StoreType,
//   PlanStatus,
//   PlanType
// } from '../../../types'

// 临时类型定义
interface ReportData {
  overview: {
    total_target: number
    completed_count: number
    completion_rate: number
    total_budget: number
  }
}

interface ReportQueryParams {
  date_range?: any
  region_id?: number
  store_type_id?: number
  plan_type?: string
  status?: string
}

interface BusinessRegion {
  id: number
  name: string
}

interface StoreType {
  id: number
  name: string
}

// 临时服务
const ReportService = {
  async getReportData(params: ReportQueryParams): Promise<ReportData> {
    return {
      overview: {
        total_target: 100,
        completed_count: 75,
        completion_rate: 75,
        total_budget: 1000
      }
    }
  },
  async exportReport(params: ReportQueryParams): Promise<void> {
    console.log('导出报表', params)
  }
}
import styles from './DataReports.module.css'

const { Row, Col } = Grid
const { RangePicker } = DatePicker
const { Title, Text } = Typography

/**
 * 数据报表组件
 */
const DataReports: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // 基础数据
  const [regions, setRegions] = useState<BusinessRegion[]>([])
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([])

  // 查询参数
  const [queryParams, setQueryParams] = useState<ReportQueryParams>({
    date_range: undefined,
    region_id: undefined,
    store_type_id: undefined,
    plan_type: undefined,
    status: undefined
  })

  /**
   * 获取报表数据
   */
  const fetchReportData = async (params: ReportQueryParams) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ReportService.getReportData(params)
      setReportData(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: ReportQueryParams = {
      date_range: values.date_range,
      region_id: values.region_id,
      store_type_id: values.store_type_id,
      plan_type: values.plan_type,
      status: values.status
    }
    setQueryParams(params)
    fetchReportData(params)
  }

  /**
   * 重置搜索
   */
  const handleReset = () => {
    form.resetFields()
    const params: ReportQueryParams = {}
    setQueryParams(params)
    fetchReportData(params)
  }

  /**
   * 导出数据
   */
  const handleExport = async () => {
    try {
      await ReportService.exportReport(queryParams)
    } catch (err) {
      console.error('导出失败:', err)
    }
  }

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    fetchReportData(queryParams)
  }

  // 初始化数据
  useEffect(() => {
    fetchReportData({})
  }, [])

  /**
   * 渲染搜索表单
   */
  const renderSearchForm = () => (
    <Card className={styles.searchCard}>
      <Form
        form={form}
        layout="inline"
        onSubmit={handleSearch}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="时间范围" field="date_range">
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="业务区域" field="region_id">
              <Select placeholder="请选择区域" allowClear>
                {regions.map(region => (
                  <Select.Option key={region.id} value={region.id}>
                    {region.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="门店类型" field="store_type_id">
              <Select placeholder="请选择类型" allowClear>
                {storeTypes.map(type => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="计划类型" field="plan_type">
              <Select placeholder="请选择类型" allowClear>
                <Select.Option value="annual">年度计划</Select.Option>
                <Select.Option value="quarterly">季度计划</Select.Option>
                <Select.Option value="monthly">月度计划</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="计划状态" field="status">
              <Select placeholder="请选择状态" allowClear>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="published">已发布</Select.Option>
                <Select.Option value="executing">执行中</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="cancelled">已取消</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={2}>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  )

  /**
   * 渲染操作按钮
   */
  const renderActions = () => (
    <div className={styles.actions}>
      <Space>
        <Button icon={<IconRefresh />} onClick={handleRefresh}>
          刷新
        </Button>
        <Button icon={<IconDownload />} onClick={handleExport}>
          导出
        </Button>
      </Space>
    </div>
  )

  /**
   * 渲染概览统计
   */
  const renderOverview = () => {
    if (!reportData?.overview) return null

    const { overview } = reportData

    return (
      <Row gutter={16} className={styles.overview}>
        <Col span={6}>
          <Card>
            <Statistic
              title="目标门店数"
              value={overview.total_target}
              suffix="家"
              countUp
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={overview.completed_count}
              suffix="家"
              countUp
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className={styles.progressCard}>
              <div className={styles.progressTitle}>
                <Text>完成率</Text>
                <Text className={styles.progressValue}>
                  {overview.completion_rate.toFixed(1)}%
                </Text>
              </div>
              <Progress
                percent={overview.completion_rate}
                status={overview.completion_rate >= 80 ? 'success' : 'normal'}
                showText={false}
              />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预算总额"
              value={overview.total_budget}
              suffix="万元"
              countUp
            />
          </Card>
        </Col>
      </Row>
    )
  }

  /**
   * 渲染错误状态
   */
  const renderError = () => {
    if (!error) return null

    return (
      <div className={styles.errorContainer}>
        <Alert
          type="error"
          title="数据加载失败"
          content={error.message}
          showIcon
          action={
            <Button size="small" onClick={handleSearch}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className={styles.reports}>
      <div className={styles.header}>
        <Title heading={3}>数据报表</Title>
        <Text className={styles.subtitle}>
          门店开业进度和经营数据分析报表
        </Text>
      </div>

      {renderSearchForm()}
      {renderActions()}

      <Spin loading={loading}>
        {error ? renderError() : (
          <div className={styles.content}>
            {renderOverview()}
            
            {reportData && (
              <Card title="详细数据" className={styles.dataCard}>
                <Empty description="报表数据展示功能开发中..." />
              </Card>
            )}
          </div>
        )}
      </Spin>
    </div>
  )
}

export default DataReports