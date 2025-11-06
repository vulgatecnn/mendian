/**
 * 数据报表页面 - 增强版
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Grid,
  Typography,
  Alert,
  Spin,
  Empty,
  Tabs,
  Button,
  Space,
  Modal
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconDownload,
  IconFilter,
  IconDashboard,
  IconFile,
  IconExport,
  IconMobile
} from '@arco-design/web-react/icon'
import { 
  ReportGenerator, 
  ReportFilters, 
  MobileReportViewer 
} from '../../components/analytics'
import { useReportService } from '../../api/reportService'
import type { 
  ReportTask, 
  ReportFilters as ReportFiltersType,
  FilterOptions 
} from '../../api/reportService'
import styles from './DataReports.module.css'

const { Row, Col } = Grid
const { Title, Text } = Typography
const { TabPane } = Tabs

/**
 * 数据报表组件 - 增强版
 */
const DataReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generator')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileViewerVisible, setMobileViewerVisible] = useState(false)

  // 使用报表服务
  const {
    loading,
    error,
    tasks,
    getUserReportTasks
  } = useReportService()

  // 模拟筛选选项数据
  const filterOptions: FilterOptions = {
    regions: [
      { id: 1, name: '华北区' },
      { id: 2, name: '华东区' },
      { id: 3, name: '华南区' },
      { id: 4, name: '西南区' }
    ],
    storeTypes: [
      { code: 'direct', name: '直营店' },
      { code: 'franchise', name: '加盟店' },
      { code: 'joint', name: '合作店' }
    ],
    statuses: [
      { code: 'draft', name: '草稿' },
      { code: 'published', name: '已发布' },
      { code: 'executing', name: '执行中' },
      { code: 'completed', name: '已完成' },
      { code: 'cancelled', name: '已取消' }
    ],
    contributionTypes: [
      { code: 'high', name: '高贡献率' },
      { code: 'medium', name: '中贡献率' },
      { code: 'low', name: '低贡献率' }
    ],
    businessRegions: [
      { id: 1, name: '华北区' },
      { id: 2, name: '华东区' },
      { id: 3, name: '华南区' },
      { id: 4, name: '西南区' }
    ]
  }

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // 初始化加载任务列表
  useEffect(() => {
    getUserReportTasks()
  }, [getUserReportTasks])

  /**
   * 处理报表生成完成
   */
  const handleReportGenerated = (task: ReportTask) => {
    console.log('报表生成任务创建:', task)
  }

  /**
   * 刷新任务列表
   */
  const handleRefreshTasks = () => {
    getUserReportTasks()
  }

  /**
   * 显示移动端查看器
   */
  const showMobileViewer = () => {
    setMobileViewerVisible(true)
  }

  /**
   * 渲染桌面端内容
   */
  const renderDesktopContent = () => (
    <Tabs
      activeTab={activeTab}
      onChange={setActiveTab}
      className={styles.reportTabs}
      extra={
        <Space>
          <Button
            icon={<IconRefresh />}
            onClick={handleRefreshTasks}
            loading={loading}
          >
            刷新
          </Button>
          {isMobile && (
            <Button
              icon={<IconMobile />}
              onClick={showMobileViewer}
            >
              移动端查看
            </Button>
          )}
        </Space>
      }
    >
      <TabPane key="generator" title="报表生成" icon={<IconDashboard />}>
        <ReportGenerator
          filterOptions={filterOptions}
          onReportGenerated={handleReportGenerated}
        />
      </TabPane>
      
      <TabPane key="tasks" title="任务管理" icon={<IconFile />}>
        <Card title="报表任务列表" className={styles.tasksCard}>
          {tasks.length === 0 ? (
            <Empty description="暂无报表任务" />
          ) : (
            <div className={styles.tasksList}>
              {tasks.map(task => (
                <Card key={task.taskId} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <Text className={styles.taskTitle}>
                      {task.fileName || '未知报表'}
                    </Text>
                    <Space>
                      {task.status === 'completed' && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<IconDownload />}
                        >
                          下载
                        </Button>
                      )}
                      {task.status === 'completed' && (
                        <Button
                          size="small"
                          icon={<IconExport />}
                        >
                          分享
                        </Button>
                      )}
                    </Space>
                  </div>
                  <div className={styles.taskMeta}>
                    <Text type="secondary">
                      创建时间: {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </Text>
                    <Text type="secondary">
                      状态: {task.status === 'completed' ? '已完成' : '处理中'}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </TabPane>
    </Tabs>
  )

  return (
    <div className={styles.reports}>
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

      <div className={styles.header}>
        <Title heading={3}>数据报表</Title>
        <Text className={styles.subtitle}>
          门店开业进度和经营数据分析报表 - 支持多维度筛选、预览和分享
        </Text>
      </div>

      {/* 桌面端内容 */}
      {renderDesktopContent()}

      {/* 移动端查看器模态框 */}
      <Modal
        title="移动端报表查看"
        visible={mobileViewerVisible}
        onCancel={() => setMobileViewerVisible(false)}
        width="100%"
        style={{ 
          maxWidth: '400px',
          height: '80vh',
          top: '10vh'
        }}
        footer={null}
        className={styles.mobileModal}
      >
        <MobileReportViewer
          tasks={tasks}
          filterOptions={filterOptions}
          onRefresh={handleRefreshTasks}
        />
      </Modal>
    </div>
  )
}

export default DataReports