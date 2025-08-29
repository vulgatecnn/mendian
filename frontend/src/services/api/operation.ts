import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse,
  PaymentItem,
  StoreAsset,
  MaintenanceRecord
} from '../types'

/**
 * 门店运营管理API服务
 */
export class OperationApiService {
  // ==================== 付款项管理 ====================

  /**
   * 获取付款项列表
   */
  static async getPayments(params?: {
    page?: number
    pageSize?: number
    storeId?: string
    category?: PaymentItem['category']
    status?: PaymentItem['status']
    approvalStatus?: PaymentItem['approvalStatus']
    startDate?: string
    endDate?: string
  }): Promise<PaginationResponse<PaymentItem>> {
    return httpClient.get<PaymentItem[]>(buildUrl(API_PATHS.OPERATION.PAYMENTS, undefined, params))
  }

  /**
   * 获取付款项详情
   */
  static async getPayment(id: string): Promise<BaseResponse<PaymentItem>> {
    return httpClient.get<PaymentItem>(buildUrl(API_PATHS.OPERATION.PAYMENT_DETAIL, { id }))
  }

  /**
   * 创建付款项
   */
  static async createPayment(
    data: Omit<PaymentItem, 'id' | 'createdAt' | 'updatedAt' | 'createdByName'>
  ): Promise<BaseResponse<PaymentItem>> {
    return httpClient.post<PaymentItem>(API_PATHS.OPERATION.CREATE_PAYMENT, data)
  }

  /**
   * 更新付款项
   */
  static async updatePayment(
    id: string,
    data: Partial<PaymentItem>
  ): Promise<BaseResponse<PaymentItem>> {
    return httpClient.put<PaymentItem>(buildUrl(API_PATHS.OPERATION.UPDATE_PAYMENT, { id }), data)
  }

  /**
   * 删除付款项
   */
  static async deletePayment(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.OPERATION.DELETE_PAYMENT, { id }))
  }

  /**
   * 批准付款
   */
  static async approvePayment(id: string, comment?: string): Promise<BaseResponse<PaymentItem>> {
    return httpClient.post<PaymentItem>(
      `${buildUrl(API_PATHS.OPERATION.PAYMENT_DETAIL, { id })}/approve`,
      { comment }
    )
  }

  /**
   * 拒绝付款
   */
  static async rejectPayment(id: string, reason: string): Promise<BaseResponse<PaymentItem>> {
    return httpClient.post<PaymentItem>(
      `${buildUrl(API_PATHS.OPERATION.PAYMENT_DETAIL, { id })}/reject`,
      { reason }
    )
  }

  // ==================== 资产管理 ====================

  /**
   * 获取资产列表
   */
  static async getAssets(params?: {
    page?: number
    pageSize?: number
    storeId?: string
    category?: StoreAsset['category']
    condition?: StoreAsset['condition']
    responsible?: string
  }): Promise<PaginationResponse<StoreAsset>> {
    return httpClient.get<StoreAsset[]>(buildUrl(API_PATHS.OPERATION.ASSETS, undefined, params))
  }

  /**
   * 获取资产详情
   */
  static async getAsset(id: string): Promise<BaseResponse<StoreAsset>> {
    return httpClient.get<StoreAsset>(buildUrl(API_PATHS.OPERATION.ASSET_DETAIL, { id }))
  }

  /**
   * 创建资产
   */
  static async createAsset(
    data: Omit<StoreAsset, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BaseResponse<StoreAsset>> {
    return httpClient.post<StoreAsset>('/operation/assets', data)
  }

  /**
   * 更新资产
   */
  static async updateAsset(
    id: string,
    data: Partial<StoreAsset>
  ): Promise<BaseResponse<StoreAsset>> {
    return httpClient.put<StoreAsset>(`/operation/assets/${id}`, data)
  }

  /**
   * 删除资产
   */
  static async deleteAsset(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/operation/assets/${id}`)
  }

  /**
   * 添加维护记录
   */
  static async addMaintenanceRecord(
    assetId: string,
    data: Omit<MaintenanceRecord, 'id' | 'assetId'>
  ): Promise<BaseResponse<MaintenanceRecord>> {
    return httpClient.post<MaintenanceRecord>(`/operation/assets/${assetId}/maintenance`, data)
  }

  /**
   * 获取运营报表
   */
  static async getReports(
    type: 'payment' | 'asset' | 'summary',
    params?: {
      storeId?: string
      startDate?: string
      endDate?: string
      format?: 'json' | 'excel'
    }
  ): Promise<BaseResponse<any>> {
    return httpClient.get<any>(
      buildUrl(`${API_PATHS.OPERATION.REPORTS}/${type}`, undefined, params)
    )
  }
}
