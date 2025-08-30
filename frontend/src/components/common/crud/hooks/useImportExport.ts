import { useState, useCallback } from 'react'
import { message } from 'antd'
import type { UseImportExportOptions, UseImportExportReturn } from './types'

/**
 * 导入导出Hook - 处理数据导入导出功能
 */
export function useImportExport<T = any>(
  options: UseImportExportOptions<T>
): UseImportExportReturn<T> {
  const {
    exportService,
    importService,
    templateDownloadService,
    onSuccess,
    onError
  } = options

  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importVisible, setImportVisible] = useState(false)

  // 导出数据
  const handleExport = useCallback(async (params?: any) => {
    try {
      setExportLoading(true)
      
      if (!exportService) {
        throw new Error('导出服务未配置')
      }

      const response = await exportService(params)
      
      if (response.success) {
        // 处理文件下载
        if (response.data && typeof response.data === 'string') {
          // 如果返回下载链接
          const link = document.createElement('a')
          link.href = response.data
          link.download = `export_${Date.now()}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else if (response.data instanceof Blob) {
          // 如果返回Blob数据
          const url = URL.createObjectURL(response.data)
          const link = document.createElement('a')
          link.href = url
          link.download = `export_${Date.now()}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        
        message.success('导出成功')
        onSuccess?.('export', response.data)
      } else {
        throw new Error(response.message || '导出失败')
      }
    } catch (error) {
      console.error('导出失败:', error)
      const errorMsg = error instanceof Error ? error.message : '导出失败'
      message.error(errorMsg)
      onError?.(error as Error)
    } finally {
      setExportLoading(false)
    }
  }, [exportService, onSuccess, onError])

  // 下载模板
  const downloadTemplate = useCallback(async () => {
    try {
      if (!templateDownloadService) {
        throw new Error('模板下载服务未配置')
      }

      const response = await templateDownloadService()
      
      if (response.success) {
        // 处理模板文件下载
        if (response.data && typeof response.data === 'string') {
          const link = document.createElement('a')
          link.href = response.data
          link.download = `template_${Date.now()}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        message.success('模板下载成功')
      } else {
        throw new Error(response.message || '模板下载失败')
      }
    } catch (error) {
      console.error('模板下载失败:', error)
      const errorMsg = error instanceof Error ? error.message : '模板下载失败'
      message.error(errorMsg)
      onError?.(error as Error)
    }
  }, [templateDownloadService, onError])

  // 导入数据
  const handleImport = useCallback(async (file: File) => {
    try {
      setImportLoading(true)
      
      if (!importService) {
        throw new Error('导入服务未配置')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await importService(formData)
      
      if (response.success) {
        message.success(`导入成功: ${response.data?.successCount || 0} 条记录`)
        setImportVisible(false)
        onSuccess?.('import', response.data)
        
        // 如果有失败记录，显示详细信息
        if (response.data?.errors?.length > 0) {
          console.warn('导入过程中出现错误:', response.data.errors)
        }
      } else {
        throw new Error(response.message || '导入失败')
      }
    } catch (error) {
      console.error('导入失败:', error)
      const errorMsg = error instanceof Error ? error.message : '导入失败'
      message.error(errorMsg)
      onError?.(error as Error)
    } finally {
      setImportLoading(false)
    }
  }, [importService, onSuccess, onError])

  // 上传配置
  const uploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: (file: File) => {
      handleImport(file)
      return false // 阻止自动上传
    },
    showUploadList: false
  }

  // 打开导入弹窗
  const openImport = useCallback(() => {
    setImportVisible(true)
  }, [])

  // 关闭导入弹窗
  const closeImport = useCallback(() => {
    setImportVisible(false)
  }, [])

  return {
    exportLoading,
    importLoading,
    importVisible,
    handleExport,
    handleImport,
    downloadTemplate,
    openImport,
    closeImport,
    uploadProps
  }
}