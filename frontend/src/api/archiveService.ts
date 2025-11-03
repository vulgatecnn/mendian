/**
 * 门店档案 API 服务
 */

import request from './request'
import type {
  StoreProfile,
  StoreProfileFormData,
  StoreProfileQueryParams,
  StoreFullInfo,
  StoreStatusChangeParams,
  PaginatedResponse,
  ApiResponse
} from '../types'

/**
 * 查询门店档案列表
 */
export const getStoreProfiles = (params?: StoreProfileQueryParams) => {
  return request.get<PaginatedResponse<StoreProfile>>('/api/archive/stores/', { params })
}

/**
 * 获取门店档案详情
 */
export const getStoreProfile = (id: number) => {
  return request.get<StoreProfile>(`/api/archive/stores/${id}/`)
}

/**
 * 获取门店完整档案
 */
export const getStoreFullInfo = (id: number) => {
  return request.get<StoreFullInfo>(`/api/archive/stores/${id}/full/`)
}

/**
 * 创建门店档案
 */
export const createStoreProfile = (data: StoreProfileFormData) => {
  return request.post<StoreProfile>('/api/archive/stores/', data)
}

/**
 * 更新门店档案
 */
export const updateStoreProfile = (id: number, data: Partial<StoreProfileFormData>) => {
  return request.put<StoreProfile>(`/api/archive/stores/${id}/`, data)
}

/**
 * 删除门店档案
 */
export const deleteStoreProfile = (id: number) => {
  return request.delete<ApiResponse>(`/api/archive/stores/${id}/`)
}

/**
 * 变更门店状态
 */
export const changeStoreStatus = (id: number, data: StoreStatusChangeParams) => {
  return request.post<StoreProfile>(`/api/archive/stores/${id}/change-status/`, data)
}

export default {
  getStoreProfiles,
  getStoreProfile,
  getStoreFullInfo,
  createStoreProfile,
  updateStoreProfile,
  deleteStoreProfile,
  changeStoreStatus
}
