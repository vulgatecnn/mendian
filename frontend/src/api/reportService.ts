/**
 * 报表生成 API 服务
 */
import { useState, useCallback } from 'react'

// 报表类型
export type ReportType = 'plan' | 'followUp' | 'preparation' | 'assets' | 'comprehensive'

// 报表格式
export type ReportFormat = 'excel' | 'pdf'

// 报表状态
export type ReportTaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

// 报表筛选条件
export interface ReportFilters {
  dateRange?: {
    startDate: string
    endDate: string
  }
  regions?: number[]
  storeTypes?: string[]
  statuses?: string[]
  contributionTypes?: string[]
  businessRegions?: number[]
}

// 报表配置
export interface ReportConfig {
  reportType: ReportType
  filters: ReportFilters
  format: ReportFormat
  includeCharts: boolean
  includeSummary: boolean
  customFields?: string[]
}

// 报表任务
export interface ReportTask {
  taskId: string
  reportType: ReportType
  status: ReportTaskStatus
  progress: number
  fileName?: string
  downloadUrl?: string
  fileSize?: number
  estimatedTime?: number
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

// 报表预览数据
export interface ReportPreviewData {
  reportType: ReportType
  title: string
  summary: {
    totalRecords: number
    dateRange: string
    generatedAt: string
  }
  charts: Array<{
    type: 'bar' | 'pie' | 'line' | 'funnel'
    title: string
    data: any
  }>
  tables: Array<{
    title: string
    headers: string[]
    rows: any[][]
    totalRows: number
  }>
}

// 报表分享配置
export interface ReportShareConfig {
  taskId: string
  shareType: 'link' | 'email'
  recipients?: string[]
  expiresAt?: string
  password?: string
  allowDownload: boolean
}

// 报表分享信息
export interface ReportShareInfo {
  shareId: string
  shareUrl: string
  expiresAt: string
  accessCount: number
  createdAt: string
}

/**
 * 报表服务类
 */
export class ReportService {
  // 模拟任务存储
  private static tasks = new Map<string, ReportTask>()

  /**
   * 生成报表任务ID
   */
  private static generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 创建报表生成任务
   */
  static async generateReport(config: ReportConfig): Promise<ReportTask> {
    const taskId = this.generateTaskId()
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const task: ReportTask = {
      taskId,
      reportType: config.reportType,
      status: 'pending',
      progress: 0,
      estimatedTime: this.getEstimatedTime(config.reportType),
      createdAt: new Date().toISOString()
    }
    
    this.tasks.set(taskId, task)
    
    // 模拟异步处理
    this.simulateReportGeneration(taskId, config)
    
    return task
  }

  /**
   * 查询报表任务状态
   */
  static async getReportStatus(taskId: string): Promise<ReportTask | null> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return this.tasks.get(taskId) || null
  }

  /**
   * 获取报表预览数据
   */
  static async getReportPreview(config: ReportConfig): Promise<ReportPreviewData> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return this.generateMockPreviewData(config)
  }

  /**
   * 下载报表文件
   */
  static async downloadReport(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'completed' || !task.downloadUrl) {
      throw new Error('报表文件不可用')
    }
    
    // 模拟文件下载
    const link = document.createElement('a')
    link.href = task.downloadUrl
    link.download = task.fileName || `report_${taskId}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * 分享报表
   */
  static async shareReport(config: ReportShareConfig): Promise<ReportShareInfo> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const shareUrl = `${window.location.origin}/shared-reports/${shareId}`
    
    return {
      shareId,
      shareUrl,
      expiresAt: config.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 0,
      createdAt: new Date().toISOString()
    }
  }

  /**
   * 获取用户的报表任务列表
   */
  static async getUserReportTasks(): Promise<ReportTask[]> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * 删除报表任务
   */
  static async deleteReportTask(taskId: string): Promise<void> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 200))
    
    this.tasks.delete(taskId)
  }

  /**
   * 获取预估生成时间（秒）
   */
  private static getEstimatedTime(reportType: ReportType): number {
    const timeMap: Record<ReportType, number> = {
      plan: 30,
      followUp: 45,
      preparation: 60,
      assets: 40,
      comprehensive: 120
    }
    return timeMap[reportType] || 60
  }

  /**
   * 模拟报表生成过程
   */
  private static simulateReportGeneration(taskId: string, config: ReportConfig): void {
    const task = this.tasks.get(taskId)
    if (!task) return

    const totalTime = task.estimatedTime! * 1000 // 转换为毫秒
    const updateInterval = 1000 // 每秒更新一次进度
    const progressStep = 100 / (totalTime / updateInterval)

    let currentProgress = 0
    
    const timer = setInterval(() => {
      currentProgress += progressStep + Math.random() * 5 // 添加一些随机性
      currentProgress = Math.min(currentProgress, 95) // 最多到95%，完成时设为100%

      const updatedTask = this.tasks.get(taskId)
      if (updatedTask) {
        updatedTask.status = 'processing'
        updatedTask.progress = Math.round(currentProgress)
      }

      if (currentProgress >= 95) {
        clearInterval(timer)
        
        // 模拟完成
        setTimeout(() => {
          const finalTask = this.tasks.get(taskId)
          if (finalTask) {
            finalTask.status = 'completed'
            finalTask.progress = 100
            finalTask.completedAt = new Date().toISOString()
            finalTask.fileName = this.generateFileName(config)
            finalTask.downloadUrl = this.generateDownloadUrl(taskId)
            finalTask.fileSize = Math.floor(Math.random() * 5000000) + 1000000 // 1-5MB
          }
        }, 2000)
      }
    }, updateInterval)
  }

  /**
   * 生成文件名
   */
  private static generateFileName(config: ReportConfig): string {
    const typeNames: Record<ReportType, string> = {
      plan: '开店计划报表',
      followUp: '拓店跟进报表',
      preparation: '筹备进度报表',
      assets: '门店资产报表',
      comprehensive: '综合经营报表'
    }
    
    const typeName = typeNames[config.reportType]
    const timestamp = new Date().toISOString().slice(0, 10)
    const extension = config.format === 'pdf' ? 'pdf' : 'xlsx'
    
    return `${typeName}_${timestamp}.${extension}`
  }

  /**
   * 生成下载URL（模拟）
   */
  private static generateDownloadUrl(taskId: string): string {
    return `blob:${window.location.origin}/${taskId}`
  }

  /**
   * 生成模拟预览数据
   */
  private static generateMockPreviewData(config: ReportConfig): ReportPreviewData {
    const typeNames: Record<ReportType, string> = {
      plan: '开店计划报表',
      followUp: '拓店跟进报表',
      preparation: '筹备进度报表',
      assets: '门店资产报表',
      comprehensive: '综合经营报表'
    }

    return {
      reportType: config.reportType,
      title: typeNames[config.reportType],
      summary: {
        totalRecords: Math.floor(Math.random() * 500) + 100,
        dateRange: config.filters.dateRange 
          ? `${config.filters.dateRange.startDate} 至 ${config.filters.dateRange.endDate}`
          : '全部时间',
        generatedAt: new Date().toLocaleString('zh-CN')
      },
      charts: this.generateMockCharts(config.reportType),
      tables: this.generateMockTables(config.reportType)
    }
  }

  /**
   * 生成模拟图表数据
   */
  private static generateMockCharts(reportType: ReportType): any[] {
    const charts: Record<ReportType, any[]> = {
      plan: [
        {
          type: 'bar',
          title: '各区域计划完成情况',
          data: {
            categories: ['华北区', '华东区', '华南区', '西南区'],
            series: [
              { name: '目标数量', data: [50, 80, 60, 40] },
              { name: '完成数量', data: [45, 75, 55, 35] }
            ]
          }
        },
        {
          type: 'pie',
          title: '门店类型分布',
          data: [
            { name: '直营店', value: 120 },
            { name: '加盟店', value: 80 },
            { name: '合作店', value: 30 }
          ]
        }
      ],
      followUp: [
        {
          type: 'funnel',
          title: '跟进转化漏斗',
          data: [
            { name: '调研', value: 100 },
            { name: '谈判', value: 80 },
            { name: '测算', value: 60 },
            { name: '报店', value: 45 },
            { name: '签约', value: 30 }
          ]
        }
      ],
      preparation: [
        {
          type: 'line',
          title: '筹备进度趋势',
          data: {
            categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
            series: [
              { name: '计划开工', data: [10, 15, 20, 25, 30, 35] },
              { name: '实际开工', data: [8, 12, 18, 22, 28, 32] }
            ]
          }
        }
      ],
      assets: [
        {
          type: 'pie',
          title: '资产类型分布',
          data: [
            { name: '设备', value: 45 },
            { name: '家具', value: 30 },
            { name: '装修', value: 15 },
            { name: '电子设备', value: 10 }
          ]
        }
      ],
      comprehensive: [
        {
          type: 'bar',
          title: '综合经营指标',
          data: {
            categories: ['Q1', 'Q2', 'Q3', 'Q4'],
            series: [
              { name: '新开门店', data: [25, 30, 35, 40] },
              { name: '营业收入', data: [1200, 1500, 1800, 2100] }
            ]
          }
        }
      ]
    }

    return charts[reportType] || []
  }

  /**
   * 生成模拟表格数据
   */
  private static generateMockTables(reportType: ReportType): any[] {
    const tables: Record<ReportType, any[]> = {
      plan: [
        {
          title: '计划执行详情',
          headers: ['计划名称', '区域', '目标数量', '完成数量', '完成率', '状态'],
          rows: [
            ['2024年度开店计划', '华北区', '50', '45', '90%', '执行中'],
            ['Q1季度计划', '华东区', '20', '18', '90%', '已完成'],
            ['Q2季度计划', '华南区', '25', '20', '80%', '执行中']
          ],
          totalRows: 15
        }
      ],
      followUp: [
        {
          title: '跟进记录详情',
          headers: ['跟进单号', '点位名称', '状态', '负责人', '创建时间', '最后更新'],
          rows: [
            ['FU202401001', '北京朝阳店', '谈判中', '张三', '2024-01-15', '2024-01-20'],
            ['FU202401002', '上海浦东店', '已签约', '李四', '2024-01-10', '2024-01-25'],
            ['FU202401003', '深圳南山店', '测算中', '王五', '2024-01-12', '2024-01-18']
          ],
          totalRows: 25
        }
      ],
      preparation: [
        {
          title: '筹备项目详情',
          headers: ['工程单号', '门店名称', '开工日期', '预计完工', '实际完工', '状态'],
          rows: [
            ['CO202401001', '北京朝阳店', '2024-01-15', '2024-03-15', '2024-03-10', '已完工'],
            ['CO202401002', '上海浦东店', '2024-02-01', '2024-04-01', '-', '施工中'],
            ['CO202401003', '深圳南山店', '2024-02-15', '2024-04-15', '-', '设计中']
          ],
          totalRows: 18
        }
      ],
      assets: [
        {
          title: '资产清单详情',
          headers: ['资产编号', '资产名称', '门店', '类型', '购买日期', '当前价值', '状态'],
          rows: [
            ['AS202401001', '收银设备', '北京朝阳店', '设备', '2024-01-15', '¥5,000', '正常'],
            ['AS202401002', '餐桌椅', '上海浦东店', '家具', '2024-01-20', '¥3,000', '正常'],
            ['AS202401003', '空调设备', '深圳南山店', '设备', '2024-01-25', '¥8,000', '维修中']
          ],
          totalRows: 120
        }
      ],
      comprehensive: [
        {
          title: '综合经营数据',
          headers: ['门店名称', '开业日期', '月营业额', '投资回报率', '员工数量', '状态'],
          rows: [
            ['北京朝阳店', '2024-01-15', '¥120,000', '15%', '8', '营业中'],
            ['上海浦东店', '2024-02-01', '¥150,000', '18%', '10', '营业中'],
            ['深圳南山店', '2024-02-15', '¥100,000', '12%', '6', '营业中']
          ],
          totalRows: 45
        }
      ]
    }

    return tables[reportType] || []
  }
}

/**
 * 报表服务 Hook
 */
export interface UseReportServiceOptions {
  onTaskCreated?: (task: ReportTask) => void
  onTaskCompleted?: (task: ReportTask) => void
  onTaskFailed?: (task: ReportTask, error: string) => void
}

export function useReportService(options?: UseReportServiceOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [tasks, setTasks] = useState<ReportTask[]>([])

  /**
   * 包装API调用
   */
  const wrapApiCall = useCallback(
    async <T,>(apiCall: () => Promise<T>): Promise<T | null> => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await apiCall()
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * 生成报表
   */
  const generateReport = useCallback(
    async (config: ReportConfig) => {
      return wrapApiCall(async () => {
        const task = await ReportService.generateReport(config)
        options?.onTaskCreated?.(task)
        return task
      })
    },
    [wrapApiCall, options]
  )

  /**
   * 获取报表状态
   */
  const getReportStatus = useCallback(
    (taskId: string) => {
      return wrapApiCall(() => ReportService.getReportStatus(taskId))
    },
    [wrapApiCall]
  )

  /**
   * 获取报表预览
   */
  const getReportPreview = useCallback(
    (config: ReportConfig) => {
      return wrapApiCall(() => ReportService.getReportPreview(config))
    },
    [wrapApiCall]
  )

  /**
   * 下载报表
   */
  const downloadReport = useCallback(
    (taskId: string) => {
      return wrapApiCall(() => ReportService.downloadReport(taskId))
    },
    [wrapApiCall]
  )

  /**
   * 分享报表
   */
  const shareReport = useCallback(
    (config: ReportShareConfig) => {
      return wrapApiCall(() => ReportService.shareReport(config))
    },
    [wrapApiCall]
  )

  /**
   * 获取用户报表任务
   */
  const getUserReportTasks = useCallback(
    async () => {
      const result = await wrapApiCall(() => ReportService.getUserReportTasks())
      if (result) {
        setTasks(result)
      }
      return result
    },
    [wrapApiCall]
  )

  /**
   * 删除报表任务
   */
  const deleteReportTask = useCallback(
    (taskId: string) => {
      return wrapApiCall(async () => {
        await ReportService.deleteReportTask(taskId)
        setTasks(prev => prev.filter(task => task.taskId !== taskId))
      })
    },
    [wrapApiCall]
  )

  return {
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
  }
}

export default ReportService