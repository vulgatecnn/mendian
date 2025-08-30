import { vi } from 'vitest'
import type { QueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'

// React Query Mock实现
export const reactQueryMocks = {
  // QueryClient mock
  QueryClient: vi.fn().mockImplementation(() => ({
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    getDefaultOptions: vi.fn(() => ({})),
    setDefaultOptions: vi.fn(),
    getQueryDefaults: vi.fn(),
    setQueryDefaults: vi.fn(),
    getMutationDefaults: vi.fn(),
    setMutationDefaults: vi.fn(),
  })),

  // QueryClientProvider mock
  QueryClientProvider: vi.fn(({ children, client }) =>
    React.createElement('div', {
      'data-testid': 'mock-query-client-provider',
      'data-client': !!client,
    }, children)
  ),

  // useQuery hook mock
  useQuery: vi.fn(<TData = unknown, TError = unknown>(
    options: any
  ): UseQueryResult<TData, TError> => ({
    data: undefined as TData,
    error: null as TError | null,
    isError: false,
    isIdle: false,
    isLoading: false,
    isLoadingError: false,
    isRefetchError: false,
    isSuccess: true,
    status: 'success' as const,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    isRefetching: false,
    isFetching: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isStale: false,
    refetch: vi.fn(),
    remove: vi.fn(),
  })),

  // useInfiniteQuery hook mock
  useInfiniteQuery: vi.fn((options: any) => ({
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    isSuccess: true,
    status: 'success',
    fetchNextPage: vi.fn(),
    fetchPreviousPage: vi.fn(),
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    refetch: vi.fn(),
    remove: vi.fn(),
  })),

  // useMutation hook mock
  useMutation: vi.fn(<TData = unknown, TError = unknown, TVariables = unknown>(
    options?: any
  ): UseMutationResult<TData, TError, TVariables> => ({
    data: undefined as TData,
    error: null as TError | null,
    isError: false,
    isIdle: true,
    isLoading: false,
    isPaused: false,
    isSuccess: false,
    status: 'idle' as const,
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve({} as TData)),
    reset: vi.fn(),
    variables: undefined as TVariables,
    context: undefined,
    failureCount: 0,
  })),

  // useQueryClient hook mock
  useQueryClient: vi.fn(() => ({
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    refetchQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getDefaultOptions: vi.fn(() => ({})),
    setDefaultOptions: vi.fn(),
  })),

  // useIsFetching hook mock
  useIsFetching: vi.fn(() => 0),

  // useIsMutating hook mock
  useIsMutating: vi.fn(() => 0),
}

// 创建Mock查询结果的工具函数
export class QueryMockUtils {
  // 创建成功的查询结果
  static createSuccessQuery<T>(data: T): UseQueryResult<T> {
    return {
      data,
      error: null,
      isError: false,
      isIdle: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      isRefetching: false,
      isFetching: false,
      isPaused: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      refetch: vi.fn(() => Promise.resolve({ data })),
      remove: vi.fn(),
    } as UseQueryResult<T>
  }

  // 创建加载中的查询结果
  static createLoadingQuery<T>(): UseQueryResult<T> {
    return {
      data: undefined,
      error: null,
      isError: false,
      isIdle: false,
      isLoading: true,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      status: 'loading',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      isRefetching: false,
      isFetching: true,
      isPaused: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      refetch: vi.fn(() => Promise.resolve({})),
      remove: vi.fn(),
    } as UseQueryResult<T>
  }

  // 创建错误的查询结果
  static createErrorQuery<T>(error: any): UseQueryResult<T> {
    return {
      data: undefined,
      error,
      isError: true,
      isIdle: false,
      isLoading: false,
      isLoadingError: true,
      isRefetchError: false,
      isSuccess: false,
      status: 'error',
      dataUpdatedAt: 0,
      errorUpdatedAt: Date.now(),
      failureCount: 1,
      isRefetching: false,
      isFetching: false,
      isPaused: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isStale: false,
      refetch: vi.fn(() => Promise.reject(error)),
      remove: vi.fn(),
    } as UseQueryResult<T>
  }

  // 创建成功的Mutation结果
  static createSuccessMutation<TData, TError, TVariables>(
    data: TData
  ): UseMutationResult<TData, TError, TVariables> {
    return {
      data,
      error: null,
      isError: false,
      isIdle: false,
      isLoading: false,
      isPaused: false,
      isSuccess: true,
      status: 'success',
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => Promise.resolve(data)),
      reset: vi.fn(),
      variables: undefined,
      context: undefined,
      failureCount: 0,
    } as UseMutationResult<TData, TError, TVariables>
  }

  // 创建加载中的Mutation结果
  static createLoadingMutation<TData, TError, TVariables>(): UseMutationResult<TData, TError, TVariables> {
    return {
      data: undefined,
      error: null,
      isError: false,
      isIdle: false,
      isLoading: true,
      isPaused: false,
      isSuccess: false,
      status: 'loading',
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => new Promise(() => {})), // 永不resolve的Promise
      reset: vi.fn(),
      variables: undefined,
      context: undefined,
      failureCount: 0,
    } as UseMutationResult<TData, TError, TVariables>
  }

  // 创建错误的Mutation结果
  static createErrorMutation<TData, TError, TVariables>(
    error: TError
  ): UseMutationResult<TData, TError, TVariables> {
    return {
      data: undefined,
      error,
      isError: true,
      isIdle: false,
      isLoading: false,
      isPaused: false,
      isSuccess: false,
      status: 'error',
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => Promise.reject(error)),
      reset: vi.fn(),
      variables: undefined,
      context: undefined,
      failureCount: 1,
    } as UseMutationResult<TData, TError, TVariables>
  }

  // 创建分页查询结果
  static createPaginatedQuery<T>(
    data: T[],
    page: number = 1,
    pageSize: number = 20,
    total: number = data.length
  ) {
    return this.createSuccessQuery({
      list: data,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  }

  // 创建无限查询结果
  static createInfiniteQuery<T>(pages: T[][]) {
    return {
      data: {
        pages,
        pageParams: pages.map((_, index) => index),
      },
      error: null,
      isError: false,
      isLoading: false,
      isSuccess: true,
      status: 'success',
      fetchNextPage: vi.fn(),
      fetchPreviousPage: vi.fn(),
      hasNextPage: true,
      hasPreviousPage: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      refetch: vi.fn(),
      remove: vi.fn(),
    }
  }
}

// 业务相关的查询Mock
export class BusinessQueryMocks {
  // 开店计划相关查询Mock
  static storePlan = {
    useStorePlanList: (data: any[] = [], loading: boolean = false) => 
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createPaginatedQuery(data),
    
    useStorePlanDetail: (data: any = null, loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createSuccessQuery(data),
    
    useStorePlanStats: (data: any = {}, loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createSuccessQuery(data),
    
    useStorePlanMutation: (loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingMutation() : QueryMockUtils.createSuccessMutation({}),
  }

  // 拓店管理相关查询Mock
  static expansion = {
    useCandidateLocationList: (data: any[] = [], loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createPaginatedQuery(data),
    
    useFollowUpList: (data: any[] = [], loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createPaginatedQuery(data),
    
    useExpansionMutation: (loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingMutation() : QueryMockUtils.createSuccessMutation({}),
  }

  // 开店筹备相关查询Mock
  static preparation = {
    usePreparationProjectList: (data: any[] = [], loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createPaginatedQuery(data),
    
    usePreparationMutation: (loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingMutation() : QueryMockUtils.createSuccessMutation({}),
  }

  // 认证相关查询Mock
  static auth = {
    useUserProfile: (data: any = null, loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createSuccessQuery(data),
    
    usePermissions: (data: string[] = [], loading: boolean = false) =>
      loading ? QueryMockUtils.createLoadingQuery() : QueryMockUtils.createSuccessQuery(data),
  }
}

// 高级查询Mock工具
export class AdvancedQueryMocks {
  private queryCache = new Map<string, any>()

  // 设置查询缓存
  setQueryData(queryKey: string, data: any) {
    this.queryCache.set(queryKey, data)
  }

  // 获取查询缓存
  getQueryData(queryKey: string) {
    return this.queryCache.get(queryKey)
  }

  // 清除查询缓存
  clearQueryData(queryKey?: string) {
    if (queryKey) {
      this.queryCache.delete(queryKey)
    } else {
      this.queryCache.clear()
    }
  }

  // 模拟查询失效
  invalidateQueries(queryKey: string) {
    if (this.queryCache.has(queryKey)) {
      // 触发重新获取
      console.log(`Invalidating query: ${queryKey}`)
    }
  }

  // 创建带缓存的查询Mock
  createCachedQuery<T>(queryKey: string, data: T) {
    this.setQueryData(queryKey, data)
    return QueryMockUtils.createSuccessQuery(data)
  }

  // 模拟乐观更新
  createOptimisticMutation<TData, TVariables>(
    queryKey: string,
    updateFn: (oldData: any, variables: TVariables) => any
  ) {
    const mutate = vi.fn((variables: TVariables) => {
      const oldData = this.getQueryData(queryKey)
      const optimisticData = updateFn(oldData, variables)
      this.setQueryData(queryKey, optimisticData)
    })

    return {
      ...QueryMockUtils.createSuccessMutation({}),
      mutate,
      mutateAsync: vi.fn(async (variables: TVariables) => {
        mutate(variables)
        return {} as TData
      }),
    }
  }
}

// 创建单例实例
export const advancedQueryMocks = new AdvancedQueryMocks()

// 设置React Query mocks
export const setupReactQueryMocks = () => {
  vi.mock('@tanstack/react-query', () => reactQueryMocks)
  
  // 模拟DevTools
  vi.mock('@tanstack/react-query-devtools', () => ({
    ReactQueryDevtools: vi.fn(() => null),
  }))
}

// 测试用的QueryClient工厂
export const createTestQueryClient = () => {
  const client = {
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    refetchQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getDefaultOptions: vi.fn(() => ({
      queries: { retry: false, cacheTime: 0, staleTime: 0 },
      mutations: { retry: false },
    })),
    setDefaultOptions: vi.fn(),
  }
  
  return client
}

export {
  reactQueryMocks as default,
}