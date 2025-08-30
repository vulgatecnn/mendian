/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Custom Hook Test Template
 * 
 * This template provides comprehensive testing structure for custom React hooks.
 * Hooks require special testing considerations including proper wrapper setup,
 * dependency mocking, and state change validation.
 * 
 * Usage:
 * 1. Copy this file to your test directory
 * 2. Rename to match your hook (e.g., useStorePlan.test.tsx)
 * 3. Replace HOOK_NAME with your actual hook name
 * 4. Update imports and mock dependencies
 * 5. Customize test scenarios for your hook's functionality
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {
  createTestQueryClient,
  MockFactory,
  cleanup,
} from '@/test/utils'
import { setupAllMocks } from '@/test/mocks'

// Import your hook
// import { HOOK_NAME } from '@/hooks/HOOK_NAME'

// Mock dependencies
vi.mock('@/services/api/yourApi')
setupAllMocks()

// Test data factories
const createMockHookParams = () => ({
  id: MockFactory.generateId(),
  options: {
    enabled: true,
    refetchOnWindowFocus: false,
  },
})

const createMockApiResponse = () => ({
  data: MockFactory.generateStorePlan(),
  success: true,
  message: '操作成功',
})

// Hook wrapper for React Query hooks
const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient()
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}

// Mock hook implementation for template
const mockUseHook = (_params: any) => {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error] = React.useState(null)

  const refetch = React.useCallback(() => {
    setLoading(true)
    // Simulate async operation
    setTimeout(() => {
      setData(createMockApiResponse())
      setLoading(false)
    }, 100)
  }, [])

  return { data, loading, error, refetch }
}

describe('HOOK_NAME Hook', () => {
  let mockParams: ReturnType<typeof createMockHookParams>
  let queryClient: QueryClient

  beforeEach(() => {
    mockParams = createMockHookParams()
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
  })

  describe('Basic Functionality', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.data).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.refetch).toBe('function')
    })

    it('should return correct initial state', () => {
      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: null,
        refetch: expect.any(Function),
      })
    })

    it('should handle parameters correctly', () => {
      const customParams = {
        ...mockParams,
        id: 'custom-id',
      }

      const { result } = renderHook(() => mockUseHook(customParams), {
        wrapper: createWrapper(queryClient),
      })

      // Hook should use the custom parameters
      expect(result.current).toBeDefined()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during fetch', async () => {
      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      act(() => {
        result.current.refetch()
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should handle initial loading state', () => {
      // Mock initial loading state
      const mockInitialLoading = () => ({
        data: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => mockInitialLoading(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeNull()
    })
  })

  describe('Data Fetching', () => {
    it('should fetch data successfully', async () => {
      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
      })
    })

    it('should refetch data when requested', async () => {
      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      // Initial fetch
      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
      })

      // Store first data for comparison if needed
      // const firstData = result.current.data

      // Refetch
      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data).not.toBeNull()
        // Data might be the same or different depending on implementation
      })
    })

    it('should handle conditional fetching', () => {
      const disabledParams = {
        ...mockParams,
        options: { ...mockParams.options, enabled: false },
      }

      const { result } = renderHook(() => mockUseHook(disabledParams), {
        wrapper: createWrapper(queryClient),
      })

      // Should not fetch when disabled
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      // Mock hook that returns error
      const mockErrorHook = () => ({
        data: null,
        loading: false,
        error: new Error('Fetch failed'),
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => mockErrorHook(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Fetch failed')
      expect(result.current.data).toBeNull()
    })

    it('should recover from errors on retry', async () => {
      let shouldError = true

      const mockRecoveryHook = () => {
        const [state, setState] = React.useState({
          data: null,
          loading: false,
          error: shouldError ? new Error('Network error') : null,
        })

        const refetch = () => {
          shouldError = false
          setState({
            data: createMockApiResponse(),
            loading: false,
            error: null,
          })
        }

        return { ...state, refetch }
      }

      const { result } = renderHook(() => mockRecoveryHook(), {
        wrapper: createWrapper(queryClient),
      })

      // Initially should have error
      expect(result.current.error).toBeInstanceOf(Error)

      // Retry should succeed
      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.error).toBeNull()
        expect(result.current.data).not.toBeNull()
      })
    })

    it('should handle network errors gracefully', () => {
      const networkError = new Error('Network unavailable')
      
      const mockNetworkErrorHook = () => ({
        data: null,
        loading: false,
        error: networkError,
        refetch: vi.fn(),
      })

      const { result } = renderHook(() => mockNetworkErrorHook(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.error).toBe(networkError)
    })
  })

  describe('Parameter Changes', () => {
    it('should refetch when parameters change', async () => {
      const { result, rerender } = renderHook(
        (params) => mockUseHook(params),
        {
          wrapper: createWrapper(queryClient),
          initialProps: mockParams,
        }
      )

      const initialRefetch = result.current.refetch
      expect(typeof initialRefetch).toBe('function')

      // Change parameters
      const newParams = {
        ...mockParams,
        id: 'new-id',
      }

      rerender(newParams)

      // Hook should handle parameter changes
      expect(result.current).toBeDefined()
    })

    it('should handle parameter validation', () => {
      const invalidParams = {
        ...mockParams,
        id: '', // Invalid empty ID
      }

      const { result } = renderHook(() => mockUseHook(invalidParams), {
        wrapper: createWrapper(queryClient),
      })

      // Hook should handle invalid parameters gracefully
      expect(result.current).toBeDefined()
    })

    it('should memoize parameters correctly', () => {
      const stableParams = mockParams
      
      const { result, rerender } = renderHook(
        () => mockUseHook(stableParams),
        {
          wrapper: createWrapper(queryClient),
        }
      )

      const firstRender = result.current
      
      rerender()
      
      const secondRender = result.current

      // With stable parameters, hook should maintain reference equality where appropriate
      expect(typeof firstRender.refetch).toBe('function')
      expect(typeof secondRender.refetch).toBe('function')
    })
  })

  describe('Caching Behavior', () => {
    it('should use cached data when available', async () => {
      const cacheKey = ['test-key', mockParams.id]
      const cachedData = createMockApiResponse()

      // Pre-populate cache
      queryClient.setQueryData(cacheKey, cachedData)

      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      // Should use cached data if implemented
      // This test depends on actual hook implementation
      expect(result.current).toBeDefined()
    })

    it('should invalidate cache when needed', async () => {
      const cacheKey = ['test-key', mockParams.id]
      
      queryClient.setQueryData(cacheKey, createMockApiResponse())
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: cacheKey })
      
      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      // Hook should handle cache invalidation
      expect(result.current).toBeDefined()
    })

    it('should respect cache time settings', () => {
      const queryWithCacheTime = {
        ...mockParams,
        options: {
          ...mockParams.options,
          cacheTime: 1000, // 1 second
          staleTime: 500,  // 0.5 seconds
        },
      }

      const { result } = renderHook(() => mockUseHook(queryWithCacheTime), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current).toBeDefined()
    })
  })

  describe('Mutations (if applicable)', () => {
    it('should handle mutation operations', async () => {
      const mockMutationHook = () => {
        const [state, setState] = React.useState({
          data: null,
          loading: false,
          error: null,
        })

        const mutate = React.useCallback((variables: any) => {
          setState({ data: null, loading: true, error: null })
          
          // Simulate mutation
          setTimeout(() => {
            setState({
              data: { ...createMockApiResponse(), ...variables },
              loading: false,
              error: null,
            })
          }, 100)
        }, [])

        return { ...state, mutate }
      }

      const { result } = renderHook(() => mockMutationHook(), {
        wrapper: createWrapper(queryClient),
      })

      const mutationData = { name: 'Test Update' }

      act(() => {
        result.current.mutate(mutationData)
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toMatchObject(mutationData)
      })
    })

    it('should handle mutation errors', async () => {
      const mockErrorMutationHook = () => {
        const mutate = React.useCallback(() => {
          throw new Error('Mutation failed')
        }, [])

        return {
          data: null,
          loading: false,
          error: new Error('Mutation failed'),
          mutate,
        }
      }

      const { result } = renderHook(() => mockErrorMutationHook(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.error?.message).toBe('Mutation failed')
    })

    it('should handle optimistic updates', async () => {
      const mockOptimisticHook = () => {
        const [optimisticData, setOptimisticData] = React.useState(null)
        
        const mutateWithOptimistic = React.useCallback((newData: any) => {
          // Immediately update with optimistic data
          setOptimisticData(newData)
          
          // Simulate server update
          setTimeout(() => {
            setOptimisticData({ ...newData, confirmed: true })
          }, 100)
        }, [])

        return {
          data: optimisticData,
          loading: false,
          error: null,
          mutate: mutateWithOptimistic,
        }
      }

      const { result } = renderHook(() => mockOptimisticHook(), {
        wrapper: createWrapper(queryClient),
      })

      const optimisticData = { name: 'Optimistic Update' }

      act(() => {
        result.current.mutate(optimisticData)
      })

      // Should immediately show optimistic data
      expect(result.current.data).toEqual(optimisticData)

      await waitFor(() => {
        expect(result.current.data).toEqual({
          ...optimisticData,
          confirmed: true,
        })
      })
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('should cleanup resources on unmount', () => {
      let cleanupCalled = false
      
      const mockCleanupHook = () => {
        React.useEffect(() => {
          return () => {
            cleanupCalled = true
          }
        }, [])

        return mockUseHook(mockParams)
      }

      const { result, unmount } = renderHook(() => mockCleanupHook(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current).toBeDefined()
      
      unmount()
      
      expect(cleanupCalled).toBe(true)
    })

    it('should cancel pending requests on unmount', () => {
      const abortController = new AbortController()
      const cancelRequest = vi.fn()

      const mockCancellableHook = () => {
        React.useEffect(() => {
          return () => {
            cancelRequest()
            abortController.abort()
          }
        }, [])

        return mockUseHook(mockParams)
      }

      const { result, unmount } = renderHook(() => mockCancellableHook(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current).toBeDefined()
      
      unmount()
      
      expect(cancelRequest).toHaveBeenCalled()
    })

    it('should not update state after unmount', async () => {
      let setState: any = null
      
      const mockAsyncHook = () => {
        const [data, _setState] = React.useState(null)
        setState = _setState
        
        return { data, loading: false, error: null, refetch: vi.fn() }
      }

      const { result, unmount } = renderHook(() => mockAsyncHook(), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current.data).toBeNull()
      
      unmount()

      // Attempting to set state after unmount should not cause issues
      expect(() => {
        act(() => {
          setState('new data')
        })
      }).not.toThrow()
    })
  })

  describe('Custom Hook Options', () => {
    it('should handle custom options correctly', () => {
      const customOptions = {
        ...mockParams.options,
        retry: 3,
        retryDelay: 1000,
        refetchOnWindowFocus: true,
      }

      const customParams = {
        ...mockParams,
        options: customOptions,
      }

      const { result } = renderHook(() => mockUseHook(customParams), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current).toBeDefined()
    })

    it('should merge default and custom options', () => {
      const partialOptions = {
        retry: 5,
      }

      const paramsWithPartialOptions = {
        ...mockParams,
        options: partialOptions,
      }

      const { result } = renderHook(() => mockUseHook(paramsWithPartialOptions), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined parameters', () => {
      const { result } = renderHook(() => mockUseHook(undefined), {
        wrapper: createWrapper(queryClient),
      })

      // Hook should handle undefined parameters gracefully
      expect(result.current).toBeDefined()
    })

    it('should handle null parameters', () => {
      const { result } = renderHook(() => mockUseHook(null), {
        wrapper: createWrapper(queryClient),
      })

      expect(result.current).toBeDefined()
    })

    it('should handle rapid parameter changes', () => {
      const { result, rerender } = renderHook(
        (id) => mockUseHook({ ...mockParams, id }),
        {
          wrapper: createWrapper(queryClient),
          initialProps: 'id-1',
        }
      )

      // Rapidly change parameters
      for (let i = 2; i <= 10; i++) {
        rerender(`id-${i}`)
      }

      expect(result.current).toBeDefined()
    })

    it('should handle concurrent requests', async () => {
      const { result } = renderHook(() => mockUseHook(mockParams), {
        wrapper: createWrapper(queryClient),
      })

      // Trigger multiple concurrent requests
      act(() => {
        result.current.refetch()
        result.current.refetch()
        result.current.refetch()
      })

      // Should handle concurrent requests gracefully
      expect(result.current).toBeDefined()
    })
  })
})

/**
 * Hook Test Coverage Checklist:
 * 
 * □ Hook initializes with correct default values
 * □ Hook returns correct initial state
 * □ Hook handles parameters correctly
 * □ Loading states are handled properly
 * □ Data fetching works correctly
 * □ Refetch functionality works
 * □ Conditional fetching is handled
 * □ Errors are handled gracefully
 * □ Error recovery works
 * □ Network errors are handled
 * □ Parameter changes trigger appropriate behavior
 * □ Parameter validation works
 * □ Parameter memoization works correctly
 * □ Caching behavior is correct
 * □ Cache invalidation works
 * □ Cache time settings are respected
 * □ Mutations work correctly (if applicable)
 * □ Mutation errors are handled
 * □ Optimistic updates work (if applicable)
 * □ Resources are cleaned up on unmount
 * □ Pending requests are cancelled on unmount
 * □ State updates after unmount don't cause errors
 * □ Custom options are handled correctly
 * □ Default and custom options are merged properly
 * □ Edge cases (undefined/null params) are handled
 * □ Rapid parameter changes are handled
 * □ Concurrent requests are handled properly
 * 
 * Additional Notes:
 * - Replace HOOK_NAME with your actual hook name
 * - Update imports to match your hook location
 * - Add hook-specific test scenarios
 * - Update API mocks to match your endpoints
 * - Customize error handling tests for your use cases
 * - Add business logic specific to your hook
 * - Consider testing hook composition if applicable
 */