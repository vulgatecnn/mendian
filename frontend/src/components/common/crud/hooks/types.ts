import type { FormInstance } from 'antd/es/form'
import type { 
  SearchField, 
  ActionConfig, 
  BatchAction,
  FormField,
  FormModalRef
} from '../'

/**
 * 数据表格Hook类型定义
 */
export interface UseDataTableOptions<T = any> {
  // 数据服务
  service: (params: any) => Promise<{ success: boolean; data: T[]; pagination?: any; message?: string }>
  
  // 初始参数
  initialParams?: Record<string, any>
  
  // 分页配置
  initialPageSize?: number
  
  // 回调函数
  onSuccess?: (response: any) => void
  onError?: (error: Error) => void
}

export interface UseDataTableReturn<T = any> {
  // 数据状态
  loading: boolean
  data: T[]
  pagination: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  
  // 选择状态
  selectedRowKeys: React.Key[]
  selectedRows: T[]
  searchParams: Record<string, any>
  
  // 操作方法
  loadData: (params?: any) => Promise<void>
  handleSearch: (values: Record<string, any>) => Promise<void>
  handleReset: () => Promise<void>
  refresh: () => Promise<void>
  rowSelection: any
  clearSelection: () => void
}

/**
 * 表单模态框Hook类型定义
 */
export interface UseFormModalOptions<T = any> {
  // 数据服务
  createService?: (values: any) => Promise<{ success: boolean; data?: T; message?: string }>
  updateService?: (id: string, values: any) => Promise<{ success: boolean; data?: T; message?: string }>
  
  // 回调函数
  onSuccess?: (data: T, mode: 'create' | 'edit') => void
  onError?: (error: Error) => void
  afterSubmit?: () => void
}

export interface UseFormModalReturn<T = any> {
  // 表单实例
  form: any
  
  // 状态
  visible: boolean
  loading: boolean
  mode: 'create' | 'edit'
  editingRecord: T | null
  
  // 操作方法
  openCreate: () => void
  openEdit: (record: T) => void
  close: () => void
  handleSubmit: (values: any) => Promise<void>
}

/**
 * 导入导出Hook类型定义
 */
export interface UseImportExportOptions<T = any> {
  // 服务
  exportService?: (params?: any) => Promise<{ success: boolean; data?: any; message?: string }>
  importService?: (formData: FormData) => Promise<{ success: boolean; data?: any; message?: string }>
  templateDownloadService?: () => Promise<{ success: boolean; data?: any; message?: string }>
  
  // 回调
  onSuccess?: (type: 'export' | 'import', data?: any) => void
  onError?: (error: Error) => void
}

export interface UseImportExportReturn<T = any> {
  // 状态
  exportLoading: boolean
  importLoading: boolean
  importVisible: boolean
  
  // 操作方法
  handleExport: (params?: any) => Promise<void>
  handleImport: (file: File) => Promise<void>
  downloadTemplate: () => Promise<void>
  openImport: () => void
  closeImport: () => void
  uploadProps: any
}

/**
 * CRUD操作Hook类型定义
 */
export interface UseCrudOperationsOptions<T = any> {
  // 服务
  deleteService?: (id: string) => Promise<{ success: boolean; data?: any; message?: string }>
  batchDeleteService?: (ids: string[]) => Promise<{ success: boolean; data?: any; message?: string }>
  
  // 回调
  onSuccess?: (operation: string, data?: any) => void
  onError?: (error: Error) => void
  afterOperation?: () => void
}

export interface UseCrudOperationsReturn<T = any> {
  // 状态
  loading: boolean
  
  // 操作方法
  handleDelete: (record: T) => Promise<void>
  handleBatchDelete: (selectedKeys: React.Key[], selectedRows: T[]) => Promise<void>
  handleCopy: (record: T) => Promise<void>
  handleBatchOperation: (
    operation: string,
    selectedKeys: React.Key[],
    selectedRows: T[],
    service: (keys: string[]) => Promise<any>,
    confirmConfig?: {
      title: string
      content: string
      okText?: string
    }
  ) => Promise<void>
}