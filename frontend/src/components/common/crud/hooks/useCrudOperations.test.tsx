/**
 * useCrudOperations Hook Comprehensive Test Suite
 * 
 * Tests cover:
 * - Delete operations with confirmation
 * - Batch delete operations
 * - Copy operations
 * - Generic batch operations
 * - Error handling
 * - Loading states
 * - Modal confirmations
 * - Success callbacks
 * - Edge cases and performance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCrudOperations } from './useCrudOperations'
import type { UseCrudOperationsOptions } from './types'

// Mock Antd components
const mockConfirm = vi.fn()
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn()
}

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Modal: {
      ...actual.Modal,
      confirm: mockConfirm
    },
    message: mockMessage
  }
})

// Test data interfaces
interface TestRecord {
  id: string
  name: string
  title?: string
  createdAt?: string
  updatedAt?: string
}

// Mock services
const mockDeleteService = vi.fn()
const mockBatchDeleteService = vi.fn()
const mockGenericService = vi.fn()

// Mock callbacks
const mockOnSuccess = vi.fn()
const mockOnError = vi.fn()
const mockAfterOperation = vi.fn()

describe('useCrudOperations', () => {
  const testRecord: TestRecord = {
    id: '1',
    name: 'Test Record',
    title: 'Test Title',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }

  const testRecords: TestRecord[] = [
    { id: '1', name: 'Record 1' },
    { id: '2', name: 'Record 2' },
    { id: '3', name: 'Record 3' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    mockDeleteService.mockResolvedValue({ success: true, data: null })
    mockBatchDeleteService.mockResolvedValue({ success: true, data: null })
    mockGenericService.mockResolvedValue({ success: true, data: null })

    // Setup modal confirm to immediately call onOk
    mockConfirm.mockImplementation(({ onOk }) => {
      onOk?.()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onSuccess: mockOnSuccess
      }

      const { result } = renderHook(() => useCrudOperations(options))

      expect(result.current.loading).toBe(false)
      expect(typeof result.current.handleDelete).toBe('function')
      expect(typeof result.current.handleBatchDelete).toBe('function')
      expect(typeof result.current.handleCopy).toBe('function')
      expect(typeof result.current.handleBatchOperation).toBe('function')
    })

    it('should accept all optional configuration', () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        batchDeleteService: mockBatchDeleteService,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
        afterOperation: mockAfterOperation
      }

      const { result } = renderHook(() => useCrudOperations(options))

      expect(result.current).toBeDefined()
    })
  })

  describe('Delete Operations', () => {
    it('should handle successful delete operation', async () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onSuccess: mockOnSuccess,
        afterOperation: mockAfterOperation
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleDelete(testRecord)
      })

      expect(mockConfirm).toHaveBeenCalledWith({
        title: '确认删除',
        icon: expect.any(Object),
        content: '确定要删除这条记录吗？此操作不可恢复。',
        okText: '确认',
        cancelText: '取消',
        onOk: expect.any(Function),
        onCancel: expect.any(Function)
      })

      expect(mockDeleteService).toHaveBeenCalledWith('1')
      expect(mockMessage.success).toHaveBeenCalledWith('删除成功')
      expect(mockOnSuccess).toHaveBeenCalledWith('delete', null)
      expect(mockAfterOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle delete operation with record key instead of id', async () => {
      const recordWithKey = { key: 'key-1', name: 'Test' }
      
      const options: UseCrudOperationsOptions = {
        deleteService: mockDeleteService,
        onSuccess: mockOnSuccess
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleDelete(recordWithKey)
      })

      expect(mockDeleteService).toHaveBeenCalledWith('key-1')
    })

    it('should handle delete service error', async () => {
      const error = new Error('Delete failed')
      mockDeleteService.mockRejectedValueOnce(error)

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleDelete(testRecord)).rejects.toThrow('Delete failed')
      })

      expect(mockMessage.error).toHaveBeenCalledWith('Delete failed')
      expect(mockOnError).toHaveBeenCalledWith(error)
    })

    it('should handle delete service returning failure response', async () => {
      mockDeleteService.mockResolvedValueOnce({
        success: false,
        message: 'Cannot delete this record'
      })

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleDelete(testRecord)).rejects.toThrow('Cannot delete this record')
      })

      expect(mockMessage.error).toHaveBeenCalledWith('Cannot delete this record')
    })

    it('should handle missing delete service', async () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleDelete(testRecord)).rejects.toThrow('删除服务未配置')
      })

      expect(mockMessage.error).toHaveBeenCalledWith('删除服务未配置')
      expect(mockOnError).toHaveBeenCalled()
    })

    it('should handle delete operation cancellation', async () => {
      mockConfirm.mockImplementation(({ onCancel }) => {
        onCancel?.()
      })

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleDelete(testRecord)
      })

      expect(mockDeleteService).not.toHaveBeenCalled()
      expect(mockMessage.success).not.toHaveBeenCalled()
    })

    it('should update loading state during delete operation', async () => {
      let resolveDelete: () => void
      const deletePromise = new Promise<any>((resolve) => {
        resolveDelete = () => resolve({ success: true, data: null })
      })
      mockDeleteService.mockReturnValueOnce(deletePromise)

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService
      }

      const { result } = renderHook(() => useCrudOperations(options))

      expect(result.current.loading).toBe(false)

      act(() => {
        result.current.handleDelete(testRecord)
      })

      // Loading should be true during operation
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // Resolve the delete operation
      act(() => {
        resolveDelete!()
      })

      // Loading should be false after operation
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Batch Delete Operations', () => {
    it('should handle successful batch delete', async () => {
      const selectedKeys = ['1', '2', '3']
      const selectedRows = testRecords

      const options: UseCrudOperationsOptions<TestRecord> = {
        batchDeleteService: mockBatchDeleteService,
        onSuccess: mockOnSuccess,
        afterOperation: mockAfterOperation
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleBatchDelete(selectedKeys, selectedRows)
      })

      expect(mockConfirm).toHaveBeenCalledWith({
        title: '确认批量删除',
        icon: expect.any(Object),
        content: '确定要删除选中的 3 条记录吗？此操作不可恢复。',
        okText: '确认删除',
        cancelText: '取消',
        onOk: expect.any(Function),
        onCancel: expect.any(Function)
      })

      expect(mockBatchDeleteService).toHaveBeenCalledWith(['1', '2', '3'])
      expect(mockMessage.success).toHaveBeenCalledWith('批量删除成功: 3 条记录')
      expect(mockOnSuccess).toHaveBeenCalledWith('batchDelete', null)
      expect(mockAfterOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle empty selection for batch delete', async () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        batchDeleteService: mockBatchDeleteService
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleBatchDelete([], [])
      })

      expect(mockMessage.warning).toHaveBeenCalledWith('请选择要删除的记录')
      expect(mockBatchDeleteService).not.toHaveBeenCalled()
    })

    it('should handle batch delete service error', async () => {
      const error = new Error('Batch delete failed')
      mockBatchDeleteService.mockRejectedValueOnce(error)

      const options: UseCrudOperationsOptions<TestRecord> = {
        batchDeleteService: mockBatchDeleteService,
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleBatchDelete(['1'], [testRecord])).rejects.toThrow('Batch delete failed')
      })

      expect(mockMessage.error).toHaveBeenCalledWith('Batch delete failed')
      expect(mockOnError).toHaveBeenCalledWith(error)
    })

    it('should handle missing batch delete service', async () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleBatchDelete(['1'], [testRecord])).rejects.toThrow('批量删除服务未配置')
      })

      expect(mockMessage.error).toHaveBeenCalledWith('批量删除服务未配置')
    })
  })

  describe('Copy Operations', () => {
    it('should handle successful copy operation', async () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        onSuccess: mockOnSuccess
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleCopy(testRecord)
      })

      expect(mockOnSuccess).toHaveBeenCalledWith('copy', {
        name: 'Test Record_副本',
        title: 'Test Title_副本'
      })
      expect(mockMessage.success).toHaveBeenCalledWith('记录已复制，请修改相关信息后保存')
    })

    it('should handle copy operation for record without title', async () => {
      const recordWithoutTitle = { id: '1', name: 'Test Record' }

      const options: UseCrudOperationsOptions = {
        onSuccess: mockOnSuccess
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleCopy(recordWithoutTitle)
      })

      expect(mockOnSuccess).toHaveBeenCalledWith('copy', {
        name: 'Test Record_副本',
        title: undefined
      })
    })

    it('should handle copy operation error', async () => {
      // Force an error by making onSuccess throw
      const errorOnSuccess = vi.fn().mockImplementation(() => {
        throw new Error('Copy callback failed')
      })

      const options: UseCrudOperationsOptions<TestRecord> = {
        onSuccess: errorOnSuccess,
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleCopy(testRecord)
      })

      expect(mockMessage.error).toHaveBeenCalledWith('Copy callback failed')
      expect(mockOnError).toHaveBeenCalled()
    })
  })

  describe('Generic Batch Operations', () => {
    it('should handle successful generic batch operation', async () => {
      const selectedKeys = ['1', '2']
      const selectedRows = testRecords.slice(0, 2)

      const options: UseCrudOperationsOptions<TestRecord> = {
        onSuccess: mockOnSuccess,
        afterOperation: mockAfterOperation
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleBatchOperation(
          '批量启用',
          selectedKeys,
          selectedRows,
          mockGenericService
        )
      })

      expect(mockConfirm).toHaveBeenCalledWith({
        title: '确认操作',
        icon: expect.any(Object),
        content: '确定要对选中的 2 条记录执行此操作吗？',
        okText: '确认',
        cancelText: '取消',
        onOk: expect.any(Function),
        onCancel: expect.any(Function)
      })

      expect(mockGenericService).toHaveBeenCalledWith(['1', '2'])
      expect(mockMessage.success).toHaveBeenCalledWith('批量启用成功')
      expect(mockOnSuccess).toHaveBeenCalledWith('批量启用', null)
      expect(mockAfterOperation).toHaveBeenCalledTimes(1)
    })

    it('should handle generic batch operation with custom confirm config', async () => {
      const confirmConfig = {
        title: '确认批量启用',
        content: '这将启用所有选中的记录',
        okText: '立即启用'
      }

      const options: UseCrudOperationsOptions<TestRecord> = {
        onSuccess: mockOnSuccess
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleBatchOperation(
          '批量启用',
          ['1'],
          [testRecord],
          mockGenericService,
          confirmConfig
        )
      })

      expect(mockConfirm).toHaveBeenCalledWith({
        title: '确认批量启用',
        icon: expect.any(Object),
        content: '这将启用所有选中的记录',
        okText: '立即启用',
        cancelText: '取消',
        onOk: expect.any(Function),
        onCancel: expect.any(Function)
      })
    })

    it('should handle empty selection for generic batch operation', async () => {
      const options: UseCrudOperationsOptions<TestRecord> = {}

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleBatchOperation(
          '批量操作',
          [],
          [],
          mockGenericService
        )
      })

      expect(mockMessage.warning).toHaveBeenCalledWith('请选择要操作的记录')
      expect(mockGenericService).not.toHaveBeenCalled()
    })

    it('should handle generic batch operation service error', async () => {
      const error = new Error('Batch operation failed')
      mockGenericService.mockRejectedValueOnce(error)

      const options: UseCrudOperationsOptions<TestRecord> = {
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleBatchOperation(
          '批量操作',
          ['1'],
          [testRecord],
          mockGenericService
        )).rejects.toThrow('Batch operation failed')
      })

      expect(mockMessage.error).toHaveBeenCalledWith('Batch operation failed')
      expect(mockOnError).toHaveBeenCalledWith(error)
    })
  })

  describe('Loading States', () => {
    it('should manage loading state correctly during operations', async () => {
      let resolveOperation: (value: any) => void
      const operationPromise = new Promise((resolve) => {
        resolveOperation = resolve
      })
      mockDeleteService.mockReturnValueOnce(operationPromise)

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService
      }

      const { result } = renderHook(() => useCrudOperations(options))

      expect(result.current.loading).toBe(false)

      // Start operation
      act(() => {
        result.current.handleDelete(testRecord)
      })

      // Should be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // Complete operation
      act(() => {
        resolveOperation!({ success: true, data: null })
      })

      // Should not be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should reset loading state after operation error', async () => {
      mockDeleteService.mockRejectedValueOnce(new Error('Operation failed'))

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        try {
          await result.current.handleDelete(testRecord)
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('Callback Integration', () => {
    it('should call all callbacks in correct order for successful operations', async () => {
      const callOrder: string[] = []

      const onSuccess = vi.fn().mockImplementation(() => {
        callOrder.push('onSuccess')
      })
      
      const afterOperation = vi.fn().mockImplementation(() => {
        callOrder.push('afterOperation')
      })

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onSuccess,
        afterOperation
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleDelete(testRecord)
      })

      expect(callOrder).toEqual(['onSuccess', 'afterOperation'])
    })

    it('should not call afterOperation when onSuccess fails', async () => {
      const onSuccess = vi.fn().mockImplementation(() => {
        throw new Error('Success callback failed')
      })

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onSuccess,
        onError: mockOnError,
        afterOperation: mockAfterOperation
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleDelete(testRecord)).rejects.toThrow('Success callback failed')
      })

      expect(onSuccess).toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalled()
      expect(mockAfterOperation).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle service response without success field', async () => {
      mockDeleteService.mockResolvedValueOnce({
        data: null
        // Missing success field
      })

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await expect(result.current.handleDelete(testRecord)).rejects.toThrow('删除失败')
      })

      expect(mockMessage.error).toHaveBeenCalledWith('删除失败')
    })

    it('should handle non-Error thrown values', async () => {
      mockDeleteService.mockRejectedValueOnce('String error')

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onError: mockOnError
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleDelete(testRecord)
      })

      expect(mockMessage.error).toHaveBeenCalledWith('删除失败')
    })

    it('should handle record without id or key', async () => {
      const recordWithoutId = { name: 'No ID Record' }

      const options: UseCrudOperationsOptions = {
        deleteService: mockDeleteService
      }

      const { result } = renderHook(() => useCrudOperations(options))

      await act(async () => {
        await result.current.handleDelete(recordWithoutId)
      })

      expect(mockDeleteService).toHaveBeenCalledWith(undefined)
    })
  })

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with multiple operations', async () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        batchDeleteService: mockBatchDeleteService,
        onSuccess: mockOnSuccess,
        afterOperation: mockAfterOperation
      }

      const { result, rerender } = renderHook(() => useCrudOperations(options))

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.handleDelete({ id: `${i}`, name: `Record ${i}` })
        })

        await act(async () => {
          await result.current.handleCopy({ id: `${i}`, name: `Record ${i}` })
        })

        // Rerender to simulate component updates
        rerender()
      }

      expect(mockDeleteService).toHaveBeenCalledTimes(10)
      expect(mockOnSuccess).toHaveBeenCalledTimes(20) // 10 deletes + 10 copies
    })

    it('should handle rapid successive operations', async () => {
      let callCount = 0
      mockDeleteService.mockImplementation(async () => {
        callCount++
        await new Promise(resolve => setTimeout(resolve, 10))
        return { success: true, data: null }
      })

      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService
      }

      const { result } = renderHook(() => useCrudOperations(options))

      // Start multiple operations rapidly
      const operations = []
      for (let i = 0; i < 5; i++) {
        operations.push(
          act(async () => {
            await result.current.handleDelete({ id: `${i}`, name: `Record ${i}` })
          })
        )
      }

      await Promise.all(operations)

      expect(callCount).toBe(5)
    })
  })

  describe('Hook Memoization', () => {
    it('should memoize handler functions correctly', () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onSuccess: mockOnSuccess
      }

      const { result, rerender } = renderHook(() => useCrudOperations(options))

      const initialHandlers = {
        handleDelete: result.current.handleDelete,
        handleBatchDelete: result.current.handleBatchDelete,
        handleCopy: result.current.handleCopy,
        handleBatchOperation: result.current.handleBatchOperation
      }

      // Rerender with same options
      rerender()

      expect(result.current.handleDelete).toBe(initialHandlers.handleDelete)
      expect(result.current.handleBatchDelete).toBe(initialHandlers.handleBatchDelete)
      expect(result.current.handleCopy).toBe(initialHandlers.handleCopy)
      expect(result.current.handleBatchOperation).toBe(initialHandlers.handleBatchOperation)
    })

    it('should update handlers when dependencies change', () => {
      const options: UseCrudOperationsOptions<TestRecord> = {
        deleteService: mockDeleteService,
        onSuccess: mockOnSuccess
      }

      const { result, rerender } = renderHook(
        (props) => useCrudOperations(props),
        { initialProps: options }
      )

      const initialHandlers = {
        handleDelete: result.current.handleDelete,
        handleBatchDelete: result.current.handleBatchDelete,
        handleCopy: result.current.handleCopy,
        handleBatchOperation: result.current.handleBatchOperation
      }

      // Rerender with different service
      const newDeleteService = vi.fn()
      rerender({
        ...options,
        deleteService: newDeleteService
      })

      // Handlers should be different due to dependency change
      expect(result.current.handleDelete).not.toBe(initialHandlers.handleDelete)
      expect(result.current.handleBatchDelete).not.toBe(initialHandlers.handleBatchDelete)
    })
  })
})