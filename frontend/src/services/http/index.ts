// HTTP客户端统一导出
export { HttpClient, httpClient } from './client'
export type { HttpClientConfig } from './client'

// 配置相关
export {
  API_CONFIG,
  API_PATHS,
  API_CODES,
  ERROR_MESSAGES,
  TIMEOUT_CONFIG,
  DEFAULT_HTTP_CONFIG,
  isDevelopment,
  isProduction,
  isMockEnabled,
  replaceUrlParams,
  buildQueryString,
  buildUrl
} from './config'

// 工具函数
export {
  requestCache,
  requestMerger,
  withDebounce,
  withThrottle,
  withCache,
  withRetry,
  withTimeout,
  withMerge,
  ResponseTransformer,
  RequestBuilder,
  createRequestBuilder,
  REQUEST_PRESETS,
  RETRY_STRATEGIES
} from './utils'

export type { DebounceConfig, ThrottleConfig, CacheConfig } from './utils'
