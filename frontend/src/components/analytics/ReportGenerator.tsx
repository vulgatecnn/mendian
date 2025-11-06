/**
 * 报表生成器组件
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Grid,
  Select,
  Button,
  Space,
  Typography,
  Radio,
  Checkbox,
  Divider,
  Alert,
  Modal,
  Progress,
  List,
  Tag,
  Tooltip,
  Empty,
  Spin
} from '@arco-design/web-react'
import {
  IconDownload,
  IconEye,
  IconExport,
  IconDelete,
  IconRefresh,
  IconFile,
  IconClockCircle, // 修复: IconClock 不存在于 Arco Design，使用 IconClockCircle 替代 (2025-11-04)
  IconCheck,
  IconClose,
  IconExclamation
} from '@arco-design/web-react/icon'
import { useReportService } from '../../api/reportService'
import type { 
  ReportConfig, 
  ReportTask, 
  ReportType, 
  ReportFormat,
  ReportFilters,
  FilterOptions 
} from '../../api/reportService'
import ReportFilters from './ReportFilters'
import ReportPreview from './ReportPreview'
import ReportShare from './ReportShare'
import styles from './ReportGenerator.module.css'

const { Row, Col } = Grid
const { Title, Text } = Typography
const { Option } = Select

// 报表类型配置
const REPORT_TYPES: Array<{
  value: ReportType
  label: string
  description: string
  estimatedTime: number
}> = [
  {
    value: 'plan',
    label: '开店计划报表',
    description: '包含计划执行情况、区域分布、完成率等数据',
    estimatedTime: 30
  },
  {
    value: 'followUp',
    label: '拓店跟进报表',
    description: '包含跟进记录、转化漏斗、盈利测算等数据',
    estimatedTime: 45
  },
  {
    value: 'preparation',
    label: '筹备进度报表',
    description: '包含工程进度、验收情况、交付状态等数据',
    estimatedTime: 60
  },
  {
    value: 'assets',
    label: '门店资产报表',
    description: '包含资产清单、价值统计、维护记录等数据',
    estimatedTime: 40
  },
  {
    value: 'comprehensive',
    label: '综合经营报表',
    description: '包含全面的经营数据分析和统计',
    estimatedTime: 120
  }
]

// 组件属性
export interface ReportGeneratorProps {
  filterOptions: FilterOptions
  onReportGenerated?: (task: ReportTask) => void
}

/**
 * 报表生成器组件
 */
const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  filterOptions,
  onReportGenerated
}) => {
  const [form] = Form.useForm()
  const [filters, setFilters] = useState<ReportFilters>({})
  const [previewVisible, setPreviewVisible] = useState(false)
  const [shareVisible, setShareVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ReportTask | null>(null)
  const [taskListVisible, setTaskListVisible] = useState(false)
  const [pollingTasks, setPollingTasks] = useState<Set<string>>(new Set())

  // 使用报表服务
  const {
    loading,
    error,
    tasks,
    generateReport,
    getReportStatus,
    getReportPreview,
    downloadReport,
    shareReport,
    getUserReportTasks,
    deleteReportTask
  } = useReportService({
    onTaskCreated: (task) => {
      onReportGenerated?.(task)
      // 开始轮询任务状态
      startPollingTask(task.taskId)
    },
    onTaskCompleted: (task) => {
      // 停止轮询
      stopPollingTask(task.taskId)
    },
    onTaskFailed: (task, error) => {
      // 停止轮询
      stopPollingTask(task.taskId)
    }
  })

  // 初始化加载任务列表
  useEffect(() => {
    getUserReportTasks()
  }, [getUserReportTasks])

  // 轮询任务状态
  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {}

    pollingTasks.forEach(taskId => {
      intervals[taskId] = setInterval(async () => {
        const task = await getReportStatus(taskId)
        if (task && (task.status === 'completed' || task.status === 'failed')) {
          stopPollingTask(taskId)
        }
      }, 2000) // 每2秒轮询一次
    })

    return () => {
      Object.values(intervals).forEach(clearInterval)
    }
  }, [pollingTasks, getReportStatus])

  /**
   * 开始轮询任务状态
   */
  const startPollingTask = (taskId: string) => {
    setPollingTasks(prev => new Set([...prev, taskId]))
  }

  /**
   * 停止轮询任务状态
   */
  const stopPollingTask = (taskId: string) => {
    setPollingTasks(prev => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  /**
   * 生成报表
   */
  const handleGenerateReport = async () => {
    try {
      const values = await form.validate()
      
      const config: ReportConfig = {
        reportType: values.reportType,
        filters,
        format: values.format || 'excel',
        includeCharts: values.includeCharts !== false,
        includeSummary: values.includeSummary !== false,
        customFields: values.customFields
      }

      await generateReport(config)
      
      // 显示任务列表
      setTaskListVisible(true)
    } catch (error) {
      console.error('生成报表失败:', error)
    }
  }

  /**
   * 预览报表
   */
  const handlePreviewReport = async () => {
    try {
      const values = await form.validate()
      
      const config: ReportConfig = {
        reportType: values.reportType,
        filters,
        format: values.format || 'excel',
        includeCharts: values.includeCharts !== false,
        includeSummary: values.includeSummary !== false,
        customFields: values.customFields
      }

      setPreviewVisible(true)
    } catch (error) {
      console.error('预览报表失败:', error)
    }
  }

  /**
   * 下载报表
   */
  const handleDownloadReport = async (taskId: string) => {
    try {
      await downloadReport(taskId)
    } catch (error) {
      console.error('下载报表失败:', error)
    }
  }

  /**
   * 分享报表
   */
  const handleShareReport = (task: ReportTask) => {
    setSelectedTask(task)
    setShareVisible(true)
  }

  /**
   * 删除报表任务
   */
  const handleDeleteTask = async (taskId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报表任务吗？此操作不可撤销。',
      onOk: async () => {
        await deleteReportTask(taskId)
        stopPollingTask(taskId)
      }
    })
  }

  /**
   * 刷新任务列表
   */
  const handleRefreshTasks = () => {
    getUserReportTasks()
  }

  /**
   * 获取任务状态图标
   */
  const getTaskStatusIcon = (status: ReportTask['status']) => {
    switch (status) {
      case 'pending':
        // 修复: 使用 IconClockCircle 替代不存在的 IconClock (2025-11-04)
        return <IconClockCircle style={{ color: '#faad14' }} />
      case 'processing':
        return <IconRefresh spin style={{ color: '#1890ff' }} />
      case 'completed':
        return <IconCheck style={{ color: '#52c41a' }} />
      case 'failed':
        return <IconClose style={{ color: '#f5222d' }} />
      default:
        return <IconFile />
    }
  }

  /**
   * 获取任务状态文本
   */
  const getTaskStatusText = (status: ReportTask['status']) => {
    const statusMap = {
      pending: '等待中',
      processing: '生成中',
      completed: '已完成',
      failed: '失败'
    }
    return statusMap[status] || '未知'
  }

  /**
   * 获取任务状态颜色
   */
  const getTaskStatusColor = (status: ReportTask['status']) => {
    const colorMap = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      failed: 'red'
    }
    return colorMap[status] || 'default'
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * 渲染报表配置表单
   */
  const renderConfigForm = () => (
    <Card title="报表配置" className={styles.configCard}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          format: 'excel',
          includeCharts: true,
          includeSummary: true
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="报表类型"
              field="reportType"
              rules={[{ required: true, message: '请选择报表类型' }]}
            >
              <Select placeholder="请选择报表类型">
                {REPORT_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>
                    <div>
                      <div>{type.label}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {type.description}
                      </Text>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item label="导出格式" field="format">
              <Radio.Group>
                <Radio value="excel">Excel (.xlsx)</Radio>
                <Radio value="pdf">PDF (.pdf)</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="报表选项">
              <Space direction="vertical">
                <Form.Item field="includeCharts" noStyle>
                  <Checkbox defaultChecked>包含图表</Checkbox>
                </Form.Item>
                <Form.Item field="includeSummary" noStyle>
                  <Checkbox defaultChecked>包含汇总统计</Checkbox>
                </Form.Item>
              </Space>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <div className={styles.actionButtons}>
          <Space>
            <Button
              type="primary"
              icon={<IconDownload />}
              onClick={handleGenerateReport}
              loading={loading}
            >
              生成报表
            </Button>
            <Button
              icon={<IconEye />}
              onClick={handlePreviewReport}
              loading={loading}
            >
              预览报表
            </Button>
            <Button
              icon={<IconRefresh />}
              onClick={() => setTaskListVisible(true)}
            >
              查看任务
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  )

  /**
   * 渲染任务列表
   */
  const renderTaskList = () => (
    <Card 
      title="报表任务" 
      className={styles.taskListCard}
      extra={
        <Button
          type="text"
          icon={<IconRefresh />}
          onClick={handleRefreshTasks}
          loading={loading}
        >
          刷新
        </Button>
      }
    >
      {tasks.length === 0 ? (
        <Empty description="暂无报表任务" />
      ) : (
        <List
          className={styles.taskList}
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              key={task.taskId}
              className={styles.taskItem}
              actions={[
                task.status === 'completed' && (
                  <Tooltip title="下载报表">
                    <Button
                      type="text"
                      icon={<IconDownload />}
                      onClick={() => handleDownloadReport(task.taskId)}
                    />
                  </Tooltip>
                ),
                task.status === 'completed' && (
                  <Tooltip title="分享报表">
                    <Button
                      type="text"
                      icon={<IconExport />}
                      onClick={() => handleShareReport(task)}
                    />
                  </Tooltip>
                ),
                <Tooltip title="删除任务">
                  <Button
                    type="text"
                    icon={<IconDelete />}
                    onClick={() => handleDeleteTask(task.taskId)}
                    status="danger"
                  />
                </Tooltip>
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getTaskStatusIcon(task.status)}
                title={
                  <Space>
                    <Text>{REPORT_TYPES.find(t => t.value === task.reportType)?.label}</Text>
                    <Tag color={getTaskStatusColor(task.status)} size="small">
                      {getTaskStatusText(task.status)}
                    </Tag>
                  </Space>
                }
                description={
                  <div className={styles.taskMeta}>
                    <Text type="secondary">
                      创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </Text>
                    {task.fileName && (
                      <Text type="secondary">
                        文件: {task.fileName} ({formatFileSize(task.fileSize)})
                      </Text>
                    )}
                    {task.status === 'processing' && (
                      <Progress
                        percent={task.progress}
                        size="small"
                        className={styles.taskProgress}
                      />
                    )}
                    {task.status === 'failed' && task.errorMessage && (
                      <Text type="danger">
                        错误: {task.errorMessage}
                      </Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )

  return (
    <div className={styles.reportGenerator}>
      {/* 错误提示 */}
      {error && (
        <Alert
          type="error"
          message="操作失败"
          description={error.message}
          closable
          className={styles.errorAlert}
        />
      )}

      {/* 数据筛选 */}
      <ReportFilters
        filters={filters}
        options={filterOptions}
        onFiltersChange={setFilters}
        onReset={() => setFilters({})}
        loading={loading}
      />

      {/* 报表配置 */}
      {renderConfigForm()}

      {/* 任务列表 */}
      {taskListVisible && renderTaskList()}

      {/* 报表预览模态框 */}
      <Modal
        title="报表预览"
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="90%"
        style={{ maxWidth: 1200 }}
        footer={null}
      >
        <ReportPreview
          config={{
            reportType: form.getFieldValue('reportType'),
            filters,
            format: form.getFieldValue('format') || 'excel',
            includeCharts: form.getFieldValue('includeCharts') !== false,
            includeSummary: form.getFieldValue('includeSummary') !== false
          }}
          onClose={() => setPreviewVisible(false)}
        />
      </Modal>

      {/* 报表分享模态框 */}
      <Modal
        title="分享报表"
        visible={shareVisible}
        onCancel={() => setShareVisible(false)}
        footer={null}
      >
        {selectedTask && (
          <ReportShare
            task={selectedTask}
            onClose={() => setShareVisible(false)}
          />
        )}
      </Modal>
    </div>
  )
}

export default ReportGenerator