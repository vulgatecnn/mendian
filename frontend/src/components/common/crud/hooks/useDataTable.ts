import { useState, useCallback, useMemo } from 'react'
import { message } from 'antd'
import type { UseDataTableOptions, UseDataTableReturn } from './types'

/**
 * 数据表格Hook - 处理表格状态管理、搜索、分页等逻辑
 */
export function useDataTable<T = any>(
  options: UseDataTableOptions<T>
): UseDataTableReturn<T> {
  const {
    service,
    initialParams = {},
    initialPageSize = 20,
    onError,
    onSuccess
  } = options

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<T[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: initialPageSize,
    total: 0
  })
  const [searchParams, setSearchParams] = useState(initialParams)

  // 加载数据
  const loadData = useCallback(async (params?: any) => {
    try {
      setLoading(true)
      const queryParams = {
        ...searchParams,
        ...params,
        page: params?.page || pagination.current,
        pageSize: params?.pageSize || pagination.pageSize
      }

      const response = await service(queryParams)
      
      if (response.success) {
        setData(response.data || [])
        setPagination(prev => ({
          ...prev,
          current: response.pagination?.page || prev.current,
          pageSize: response.pagination?.pageSize || prev.pageSize,
          total: response.pagination?.total || 0
        }))
        onSuccess?.(response)
      } else {
        throw new Error(response.message || '加载失败')
      }
    } catch (error) {
      console.error('数据加载失败:', error)
      const errorMsg = error instanceof Error ? error.message : '加载失败'
      message.error(errorMsg)
      onError?.(error as Error)
    } finally {
      setLoading(false)
    }
  }, [service, searchParams, pagination.current, pagination.pageSize, onError, onSuccess])

  // 搜索
  const handleSearch = useCallback(async (values: Record<string, any>) => {
    setSearchParams(values)
    setPagination(prev => ({ ...prev, current: 1 }))
    await loadData({ ...values, page: 1 })
  }, [loadData])

  // 重置搜索
  const handleReset = useCallback(async () => {
    setSearchParams(initialParams)
    setPagination(prev => ({ ...prev, current: 1 }))
    await loadData({ ...initialParams, page: 1 })
  }, [initialParams, loadData])

  // 刷新
  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  // 分页变化
  const handlePaginationChange = useCallback(async (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }))
    await loadData({ page, pageSize })
  }, [loadData])

  // 行选择
  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: (keys: React.Key[], rows: T[]) => {
      setSelectedRowKeys(keys)
      setSelectedRows(rows)
    },
    onSelectAll: (_selected: boolean, _rows: T[], _changeRows: T[]) => {
      // 处理全选逻辑
    }
  }), [selectedRowKeys])

  // 清除选择
  const clearSelection = useCallback(() => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }, [])

  return {
    loading,
    data,
    pagination: {
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
      onChange: handlePaginationChange
    },
    selectedRowKeys,
    selectedRows,
    searchParams,
    loadData,
    handleSearch,
    handleReset,
    refresh,
    rowSelection,
    clearSelection
  }
}