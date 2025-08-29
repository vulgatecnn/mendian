import { useState, useCallback } from 'react'
import { Modal, message } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import type { UseCrudOperationsOptions, UseCrudOperationsReturn } from './types'

/**
 * CRUD操作Hook - 处理创建、删除、批量操作等通用逻辑
 */
export function useCrudOperations<T = any>(
  options: UseCrudOperationsOptions<T>
): UseCrudOperationsReturn<T> {
  const {
    deleteService,
    batchDeleteService,
    onSuccess,
    onError,
    afterOperation
  } = options

  const [loading, setLoading] = useState(false)

  // 删除单项
  const handleDelete = useCallback(async (record: T) => {
    return new Promise<void>((resolve, reject) => {
      Modal.confirm({
        title: '确认删除',
        icon: <ExclamationCircleOutlined />,
        content: '确定要删除这条记录吗？此操作不可恢复。',
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            setLoading(true)
            
            if (!deleteService) {
              throw new Error('删除服务未配置')
            }

            const recordKey = (record as any)?.id || (record as any)?.key
            const response = await deleteService(recordKey)
            
            if (response.success) {
              message.success('删除成功')
              onSuccess?.('delete', response.data)
              afterOperation?.()
              resolve()
            } else {
              throw new Error(response.message || '删除失败')
            }
          } catch (error) {
            console.error('删除失败:', error)
            const errorMsg = error instanceof Error ? error.message : '删除失败'
            message.error(errorMsg)
            onError?.(error as Error)
            reject(error)
          } finally {
            setLoading(false)
          }
        },
        onCancel: () => {
          resolve()
        }
      })
    })
  }, [deleteService, onSuccess, onError, afterOperation])

  // 批量删除
  const handleBatchDelete = useCallback(async (selectedKeys: React.Key[], selectedRows: T[]) => {
    if (selectedKeys.length === 0) {
      message.warning('请选择要删除的记录')
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      Modal.confirm({
        title: '确认批量删除',
        icon: <ExclamationCircleOutlined />,
        content: `确定要删除选中的 ${selectedKeys.length} 条记录吗？此操作不可恢复。`,
        okText: '确认删除',
        cancelText: '取消',
        onOk: async () => {
          try {
            setLoading(true)
            
            if (!batchDeleteService) {
              throw new Error('批量删除服务未配置')
            }

            const response = await batchDeleteService(selectedKeys as string[])
            
            if (response.success) {
              message.success(`批量删除成功: ${selectedKeys.length} 条记录`)
              onSuccess?.('batchDelete', response.data)
              afterOperation?.()
              resolve()
            } else {
              throw new Error(response.message || '批量删除失败')
            }
          } catch (error) {
            console.error('批量删除失败:', error)
            const errorMsg = error instanceof Error ? error.message : '批量删除失败'
            message.error(errorMsg)
            onError?.(error as Error)
            reject(error)
          } finally {
            setLoading(false)
          }
        },
        onCancel: () => {
          resolve()
        }
      })
    })
  }, [batchDeleteService, onSuccess, onError, afterOperation])

  // 复制记录
  const handleCopy = useCallback(async (record: T) => {
    try {
      // 创建记录副本（移除id等唯一标识）
      const { id, createdAt, updatedAt, ...copyData } = record as any
      const copiedRecord = {
        ...copyData,
        name: `${copyData.name}_副本`,
        title: copyData.title ? `${copyData.title}_副本` : undefined
      }

      onSuccess?.('copy', copiedRecord)
      message.success('记录已复制，请修改相关信息后保存')
    } catch (error) {
      console.error('复制失败:', error)
      const errorMsg = error instanceof Error ? error.message : '复制失败'
      message.error(errorMsg)
      onError?.(error as Error)
    }
  }, [onSuccess, onError])

  // 批量操作通用处理
  const handleBatchOperation = useCallback(async (
    operation: string,
    selectedKeys: React.Key[],
    selectedRows: T[],
    service: (keys: string[]) => Promise<any>,
    confirmConfig?: {
      title: string
      content: string
      okText?: string
    }
  ) => {
    if (selectedKeys.length === 0) {
      message.warning('请选择要操作的记录')
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const config = {
        title: confirmConfig?.title || '确认操作',
        icon: <ExclamationCircleOutlined />,
        content: confirmConfig?.content || `确定要对选中的 ${selectedKeys.length} 条记录执行此操作吗？`,
        okText: confirmConfig?.okText || '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            setLoading(true)
            const response = await service(selectedKeys as string[])
            
            if (response.success) {
              message.success(`${operation}成功`)
              onSuccess?.(operation, response.data)
              afterOperation?.()
              resolve()
            } else {
              throw new Error(response.message || `${operation}失败`)
            }
          } catch (error) {
            console.error(`${operation}失败:`, error)
            const errorMsg = error instanceof Error ? error.message : `${operation}失败`
            message.error(errorMsg)
            onError?.(error as Error)
            reject(error)
          } finally {
            setLoading(false)
          }
        },
        onCancel: () => {
          resolve()
        }
      }

      Modal.confirm(config)
    })
  }, [onSuccess, onError, afterOperation])

  return {
    loading,
    handleDelete,
    handleBatchDelete,
    handleCopy,
    handleBatchOperation
  }
}