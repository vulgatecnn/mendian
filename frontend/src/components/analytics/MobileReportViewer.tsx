/**
 * 移动端报表查看器组件
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Typography,
  Button, 
  Space,
  Tabs,
  List,
  Tag,
  Statistic,
  Empty,
  Spin,
  Alert,
  Drawer,
  Modal,
  Message
} from '@arco-design/web-react'
import {
  IconDownload,
  IconExport,
  IconRefresh,
  IconEye,
  IconDashboard,
  IconFile,
  IconMore,
  IconFilter
} from '@arco-design/web-react/icon'
import { useReportService } from '../../api/reportService'
import type { 
  ReportTask, 
  ReportPreviewData, 
  ReportConfig,
  ReportFilters as ReportFiltersType,
  FilterOptions 
} from '../../api/reportService'
import ReportFilters from './ReportFilters'
import styles from './MobileReportViewer.module.css'

const { Row, Col } = Grid
const { Title, Text } = Typography
const { TabPane } = Tabs

// 组件属性
export interface MobileReportViewerProps {
  tasks: ReportTask[]
  filterOptions: FilterOptions
  onTaskSelect?: (task: ReportTask) => void
  onDownload?: (taskId: string) => void
  onShare?: (task: ReportTask) => void
  onRefresh?: () => void
}

/**
 * 移动端报表查看器组件
 */
const MobileReportViewer: React.FC<MobileReportViewerProps> = ({
  tasks,
  filterOptions,
  onTaskSelect,
  onDownload,
  onShare,
  onRefresh
}) => {
  const [selectedTask, setSelectedTask] = useState<ReportTask | null>(null)
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null)
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [filters, setFilters] = useState<ReportFiltersType>({})
  const [actionSheetVisible, setActionSheetVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

  const { loading, error, getReportPreview, downloadReport } = useReportService()

  /**
   * 选择报表任务
   */
  const handleTaskSelect = async (task: ReportTask) => {
    setSelectedTask(task)
    onTaskSelect?.(task)
    
    if (task.status === 'completed') {
      // 加载预览数据
      const config: ReportConfig = {
        reportType: task.reportType,
        filters: {},
        format: 'excel',
        includeCharts: true,
        includeSummary: true
      }
      
      const preview = await getReportPreview(config)
      if (preview) {
        setPreviewData(preview)
      }
    }
    
    setActiveTab('preview')
  }

  /**
   * 下载报表
   */
  const handleDownload = async (taskId: string) => {
    try {
      await downloadReport(taskId)
      Message.success('下载开始')
    } catch (error) {
      Message.error('下载失败')
    }
  }

  /**
   * 分享报表
   */
  const handleShare = (task: ReportTask) => {
    onShare?.(task)
    setActionSheetVisible(false)
  }

  /**
   * 显示操作菜单
   */
  const showActionSheet = (task: ReportTask) => {
    setSelectedTask(task)
    setActionSheetVisible(true)
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
   * 格式化文件大小
   */
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * 渲染任务列表
   */
  const renderTaskList = () => (
    <div className={styles.taskList}>
      {tasks.length === 0 ? (
        <Empty
          description="暂无报表任务"
          className={styles.emptyState}
        />
      ) : (
        <List
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              key={task.taskId}
              className={styles.taskItem}
              onClick={() => handleTaskSelect(task)}
              actions={[
                <Button
                  type="text"
                  icon={<IconMore />}
                  onClick={(e) => {
                    e.stopPropagation()
                    showActionSheet(task)
                  }}
                  className={styles.moreButton}
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <div className={styles.taskTitle}>
                    <Text className={styles.taskName}>
                      {task.fileName || `${task.reportType}报表`}
                    </Text>
                    <Tag 
                      color={getTaskStatusColor(task.status)} 
                      size="small"
                      className={styles.statusTag}
                    >
                      {getTaskStatusText(task.status)}
                    </Tag>
                  </div>
                }
                description={
                  <div className={styles.taskMeta}>
                    <Text type="secondary" className={styles.metaText}>
                      {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                    </Text>
                    {task.fileSize && (
                      <Text type="secondary" className={styles.metaText}>
                        {formatFileSize(task.fileSize)}
                      </Text>
                    )}
                    {task.status === 'processing' && (
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )

  /**
   * 渲染预览内容
   */
  const renderPreview = () => {
    if (!selectedTask) {
      return (
        <Empty
          description="请选择一个报表任务"
          className={styles.emptyState}
        />
      )
    }

    if (selectedTask.status !== 'completed') {
      return (
        <div className={styles.taskStatus}>
          <div className={styles.statusIcon}>
            {selectedTask.status === 'processing' ? (
              <IconRefresh spin />
            ) : (
              <IconFile />
            )}
          </div>
          <Title heading={5}>
            {getTaskStatusText(selectedTask.status)}
          </Title>
          <Text type="secondary">
            {selectedTask.status === 'processing' 
              ? `进度: ${selectedTask.progress}%`
              : '报表尚未完成生成'
            }
          </Text>
        </div>
      )
    }

    if (!previewData) {
      return (
        <div className={styles.loadingState}>
          <Spin size={24} />
          <Text type="secondary">加载预览数据中...</Text>
        </div>
      )
    }

    return (
      <div className={styles.previewContent}>
        {/* 汇总统计 */}
        <Card className={styles.summaryCard}>
          <Row gutter={8}>
            <Col span={8}>
              <Statistic
                title="记录数"
                value={previewData.summary.totalRecords}
                suffix="条"
                className={styles.mobileStat}
              />
            </Col>
            <Col span={8}>
              <div className={styles.statItem}>
                <Text type="secondary" className={styles.statTitle}>
                  数据范围
                </Text>
                <Text className={styles.statValue}>
                  {previewData.summary.dateRange}
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div className={styles.statItem}>
                <Text type="secondary" className={styles.statTitle}>
                  生成时间
                </Text>
                <Text className={styles.statValue}>
                  {new Date(previewData.summary.generatedAt).toLocaleDateString('zh-CN')}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 图表预览 */}
        {previewData.charts && previewData.charts.length > 0 && (
          <Card title="图表分析" className={styles.chartsCard}>
            <div className={styles.chartsList}>
              {previewData.charts.map((chart, index) => (
                <div key={index} className={styles.chartItem}>
                  <Text className={styles.chartTitle}>{chart.title}</Text>
                  <div className={styles.chartPlaceholder}>
                    <IconDashboard />
                    <Text type="secondary">图表预览</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 数据表格 */}
        {previewData.tables && previewData.tables.length > 0 && (
          <Card title="数据详情" className={styles.tablesCard}>
            <div className={styles.tablesList}>
              {previewData.tables.map((table, index) => (
                <div key={index} className={styles.tableItem}>
                  <div className={styles.tableHeader}>
                    <Text className={styles.tableTitle}>{table.title}</Text>
                    <Text type="secondary" className={styles.tableCount}>
                      共 {table.totalRows} 条
                    </Text>
                  </div>
                  <div className={styles.tablePreview}>
                    <div className={styles.tableHeaders}>
                      {table.headers.slice(0, 3).map((header, idx) => (
                        <Text key={idx} className={styles.headerCell}>
                          {header}
                        </Text>
                      ))}
                      {table.headers.length > 3 && (
                        <Text className={styles.headerCell}>...</Text>
                      )}
                    </div>
                    <div className={styles.tableRows}>
                      {table.rows.slice(0, 3).map((row, rowIdx) => (
                        <div key={rowIdx} className={styles.tableRow}>
                          {row.slice(0, 3).map((cell, cellIdx) => (
                            <Text key={cellIdx} className={styles.tableCell}>
                              {cell}
                            </Text>
                          ))}
                          {row.length > 3 && (
                            <Text className={styles.tableCell}>...</Text>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className={styles.mobileReportViewer}>
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

      {/* 头部工具栏 */}
      <div className={styles.toolbar}>
        <Space>
          <Button
            type="text"
            icon={<IconFilter />}
            onClick={() => setFiltersVisible(true)}
            className={styles.toolbarButton}
          >
            筛选
          </Button>
          <Button
            type="text"
            icon={<IconRefresh />}
            onClick={onRefresh}
            loading={loading}
            className={styles.toolbarButton}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 标签页内容 */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        className={styles.mobileTabs}
      >
        <TabPane key="tasks" title="报表列表" icon={<IconFile />}>
          {renderTaskList()}
        </TabPane>
        
        <TabPane key="preview" title="预览" icon={<IconEye />}>
          {renderPreview()}
        </TabPane>
      </Tabs>

      {/* 筛选抽屉 */}
      <Drawer
        title="数据筛选"
        visible={filtersVisible}
        onCancel={() => setFiltersVisible(false)}
        placement="bottom"
        height="70%"
        className={styles.filtersDrawer}
      >
        <ReportFilters
          filters={filters}
          options={filterOptions}
          onFiltersChange={setFilters}
          onReset={() => setFilters({})}
          collapsed={false}
          showAdvanced={false}
        />
      </Drawer>

      {/* 操作菜单 */}
      <Modal
        visible={actionSheetVisible}
        onCancel={() => setActionSheetVisible(false)}
        footer={null}
        title="操作"
        style={{ maxWidth: '90vw' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {selectedTask?.status === 'completed' && (
            <Button
              type="text"
              icon={<IconDownload />}
              long
              onClick={() => {
                if (selectedTask) {
                  handleDownload(selectedTask.taskId)
                }
                setActionSheetVisible(false)
              }}
            >
              下载报表
            </Button>
          )}
          {selectedTask?.status === 'completed' && (
            <Button
              type="text"
              icon={<IconExport />}
              long
              onClick={() => {
                if (selectedTask) {
                  handleShare(selectedTask)
                }
                setActionSheetVisible(false)
              }}
            >
              分享报表
            </Button>
          )}
          <Button
            type="text"
            icon={<IconEye />}
            long
            onClick={() => {
              if (selectedTask) {
                handleTaskSelect(selectedTask)
              }
              setActionSheetVisible(false)
            }}
          >
            查看预览
          </Button>
        </Space>
      </Modal>
    </div>
  )
}

export default MobileReportViewer