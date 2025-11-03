/**
 * 导入导出 API 服务
 */
import { AxiosProgressEvent } from 'axios'
import request from './request'
import { 
  ImportResult,
  ExportParams,
  UploadProgress
} from '../types'
import { useState, useCallback } from 'react'

/**
 * 导入导出 API 服务类
 */
export class ImportExportService {
  /**
   * 导入计划数据
   * @param file Excel 文件
   * @param onProgress 上传进度回调
   */
  static async importPlans(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    return request.post('/store-planning/import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage
          })
        }
      }
    })
  }

  /**
   * 导出计划数据
   * @param params 导出参数
   */
  static async exportPlans(params?: ExportParams): Promise<Blob> {
    return request.post('/store-planning/export/', params, {
      responseType: 'blob'
    })
  }

  /**
   * 下载导入模板
   */
  static async downloadTemplate(): Promise<Blob> {
    return request.get('/store-planning/template/', {
      responseType: 'blob'
    })
  }

  /**
   * 触发文件下载
   * @param blob 文件 Blob 对象
   * @param filename 文件名
   */
  static triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * 导出并下载计划数据
   * @param params 导出参数
   * @param filename 文件名（可选）
   */
  static async exportAndDownload(
    params?: ExportParams,
    filename?: string
  ): Promise<void> {
    const blob = await this.exportPlans(params)
    const defaultFilename = `开店计划_${new Date().toISOString().split('T')[0]}.xlsx`
    this.triggerDownload(blob, filename || defaultFilename)
  }

  /**
   * 下载导入模板文件
   * @param filename 文件名（可选）
   */
  static async downloadTemplateFile(filename?: string): Promise<void> {
    const blob = await this.downloadTemplate()
    const defaultFilename = '开店计划导入模板.xlsx'
    this.triggerDownload(blob, filename || defaultFilename)
  }
}

/**
 * 导入导出 Hook - 提供 loading 和进度状态管理
 */
export interface UseImportExportServiceOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onProgress?: (progress: UploadProgress) => void
}

export function useImportExportService() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0
  })

  /**
   * 重置上传进度
   */
  const resetProgress = useCallback(() => {
    setUploadProgress({
      loaded: 0,
      total: 0,
      percentage: 0
    })
  }, [])

  /**
   * 导入计划数据
   */
  const importPlans = useCallback(
    async (
      file: File,
      options?: UseImportExportServiceOptions
    ): Promise<ImportResult | null> => {
      setLoading(true)
      setError(null)
      resetProgress()

      try {
        const result = await ImportExportService.importPlans(
          file,
          (progress) => {
            setUploadProgress(progress)
            options?.onProgress?.(progress)
          }
        )
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        options?.onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [resetProgress]
  )

  /**
   * 导出计划数据
   */
  const exportPlans = useCallback(
    async (
      params?: ExportParams,
      options?: UseImportExportServiceOptions
    ): Promise<Blob | null> => {
      setLoading(true)
      setError(null)

      try {
        const result = await ImportExportService.exportPlans(params)
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        options?.onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * 导出并下载计划数据
   */
  const exportAndDownload = useCallback(
    async (
      params?: ExportParams,
      filename?: string,
      options?: UseImportExportServiceOptions
    ): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        await ImportExportService.exportAndDownload(params, filename)
        options?.onSuccess?.(true)
      } catch (err) {
        const error = err as Error
        setError(error)
        options?.onError?.(error)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * 下载导入模板
   */
  const downloadTemplate = useCallback(
    async (
      filename?: string,
      options?: UseImportExportServiceOptions
    ): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        await ImportExportService.downloadTemplateFile(filename)
        options?.onSuccess?.(true)
      } catch (err) {
        const error = err as Error
        setError(error)
        options?.onError?.(error)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * 验证文件类型
   */
  const validateFile = useCallback((file: File): { valid: boolean; message?: string } => {
    // 检查文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]
    
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        message: '请上传 Excel 文件（.xlsx 或 .xls）'
      }
    }

    // 检查文件大小（限制为 10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        message: '文件大小不能超过 10MB'
      }
    }

    return { valid: true }
  }, [])

  return {
    loading,
    error,
    uploadProgress,
    importPlans,
    exportPlans,
    exportAndDownload,
    downloadTemplate,
    validateFile,
    resetProgress
  }
}

export default ImportExportService
