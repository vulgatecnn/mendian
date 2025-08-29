import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse
} from '../types'
import type { Store, StoreCertificate, StoreDocument, OperationRecord } from '../types/business'

// 门店查询参数
export interface StoreQueryParams {
  page?: number
  limit?: number
  storeName?: string
  storeCode?: string
  storeType?: 'DIRECT' | 'FRANCHISE' | 'FLAGSHIP' | 'POPUP'
  status?: 'PREPARING' | 'OPEN' | 'RENOVATING' | 'SUSPENDED' | 'CLOSED'
  entityId?: string
  keyword?: string
  areaMin?: number
  areaMax?: number
  revenueMin?: number
  revenueMax?: number
}

/**
 * 门店档案管理API服务
 */
export class StoreFilesApiService {
  // ==================== 门店管理 ====================

  /**
   * 获取门店列表
   */
  static async getStores(params?: StoreQueryParams): Promise<PaginationResponse<Store>> {
    return httpClient.get<Store[]>('/store-files', { params })
  }

  /**
   * 获取门店详情
   */
  static async getStore(id: string): Promise<BaseResponse<Store>> {
    return httpClient.get<Store>(`/store-files/${id}`)
  }

  /**
   * 创建门店
   */
  static async createStore(data: Partial<Store>): Promise<BaseResponse<Store>> {
    return httpClient.post<Store>('/store-files', data)
  }

  /**
   * 更新门店
   */
  static async updateStore(id: string, data: Partial<Store>): Promise<BaseResponse<Store>> {
    return httpClient.put<Store>(`/store-files/${id}`, data)
  }

  /**
   * 删除门店
   */
  static async deleteStore(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/store-files/${id}`)
  }

  /**
   * 更改门店状态
   */
  static async changeStatus(id: string, data: { 
    status: 'PREPARING' | 'OPEN' | 'RENOVATING' | 'SUSPENDED' | 'CLOSED'
    reason?: string 
    notes?: string
  }): Promise<BaseResponse<Store>> {
    return httpClient.put<Store>(`/store-files/${id}/status`, data)
  }

  /**
   * 开业门店
   */
  static async openStore(id: string, data?: { reason?: string }): Promise<BaseResponse<Store>> {
    return httpClient.post<Store>(`/store-files/${id}/open`, data)
  }

  /**
   * 暂停营业
   */
  static async suspendStore(id: string, data?: { reason?: string }): Promise<BaseResponse<Store>> {
    return httpClient.post<Store>(`/store-files/${id}/suspend`, data)
  }

  /**
   * 关闭门店
   */
  static async closeStore(id: string, data?: { reason?: string }): Promise<BaseResponse<Store>> {
    return httpClient.post<Store>(`/store-files/${id}/close`, data)
  }

  /**
   * 批量操作
   */
  static async batchOperation(data: {
    action: 'delete' | 'updateStatus' | 'updateTags' | 'export'
    ids: string[]
    data?: any
  }): Promise<BaseResponse<{ success: number; failed: number; errors: string[] }>> {
    return httpClient.post('/store-files/batch', data)
  }

  /**
   * 获取统计数据
   */
  static async getStatistics(params?: {
    year?: number
    month?: number
    quarter?: number
    storeType?: string
    entityId?: string
    status?: string
  }): Promise<BaseResponse<any>> {
    return httpClient.get('/store-files/statistics', { params })
  }

  /**
   * 获取门店汇总信息
   */
  static async getSummary(): Promise<BaseResponse<any>> {
    return httpClient.get('/store-files/summary')
  }

  /**
   * 获取进度数据
   */
  static async getProgress(): Promise<BaseResponse<any>> {
    return httpClient.get('/store-files/progress')
  }

  /**
   * 导出数据
   */
  static async exportData(data: {
    format?: 'xlsx' | 'csv'
    filters?: StoreQueryParams
    fields?: string[]
    includeRelations?: boolean
  }): Promise<Blob> {
    return httpClient.post('/store-files/export', data, {
      responseType: 'blob'
    })
  }

  // ==================== 证照管理 ====================

  /**
   * 获取门店证照文档
   */
  static async getStoreDocuments(storeId: string): Promise<BaseResponse<{ storeId: string; documents: any[] }>> {
    return httpClient.get<{ storeId: string; documents: any[] }>(`/store-files/${storeId}/documents`)
  }

  /**
   * 上传门店证照文档
   */
  static async uploadDocuments(
    storeId: string,
    data: {
      documents: Record<string, any>
    }
  ): Promise<BaseResponse<{ storeFile: Store; documents: any[] }>> {
    return httpClient.post(`/store-files/${storeId}/documents`, data)
  }

  /**
   * 删除门店证照文档
   */
  static async deleteDocument(storeId: string, documentId: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(`/store-files/${storeId}/documents/${documentId}`)
  }

}
