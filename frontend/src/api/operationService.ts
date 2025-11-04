/**
 * 门店运营管理 API 服务
 */

import request from './request'
import type { 
  ApiResponse, 
  PaginatedResponse,
  PaymentRecord,
  PaymentRecordFormData,
  PaymentQueryParams,
  AssetRecord,
  AssetRecordFormData,
  AssetQueryParams,
  MaintenanceRecord,
  MaintenanceRecordFormData
} from '../types'

// 付款追踪相关 API

/**
 * 获取付款记录列表
 */
export const getPaymentRecords = (params?: PaymentQueryParams): Promise<ApiResponse<PaginatedResponse<PaymentRecord>>> => {
  return request.get('/api/v1/operation/payments/', { params })
}

/**
 * 获取付款记录详情
 */
export const getPaymentRecord = (id: number): Promise<ApiResponse<PaymentRecord>> => {
  return request.get(`/api/v1/operation/payments/${id}/`)
}

/**
 * 创建付款记录
 */
export const createPaymentRecord = (data: PaymentRecordFormData): Promise<ApiResponse<PaymentRecord>> => {
  return request.post('/api/v1/operation/payments/', data)
}

/**
 * 更新付款记录
 */
export const updatePaymentRecord = (id: number, data: Partial<PaymentRecordFormData>): Promise<ApiResponse<PaymentRecord>> => {
  return request.put(`/api/v1/operation/payments/${id}/`, data)
}

/**
 * 删除付款记录
 */
export const deletePaymentRecord = (id: number): Promise<ApiResponse<void>> => {
  return request.delete(`/api/v1/operation/payments/${id}/`)
}

/**
 * 标记付款
 */
export const markPaymentPaid = (id: number, paymentDate: string): Promise<ApiResponse<PaymentRecord>> => {
  return request.post(`/api/v1/operation/payments/${id}/mark-paid/`, {
    payment_date: paymentDate
  })
}

/**
 * 获取付款统计数据
 */
export const getPaymentStatistics = (): Promise<ApiResponse<{
  total_amount: number
  pending_amount: number
  paid_amount: number
  overdue_count: number
}>> => {
  return request.get('/api/v1/operation/payments/statistics/')
}

/**
 * 导出付款记录
 */
export const exportPaymentRecords = (params?: PaymentQueryParams): Promise<Blob> => {
  return request.get('/api/v1/operation/payments/export/', {
    params,
    responseType: 'blob'
  })
}

// 资产管理相关 API

/**
 * 获取资产记录列表
 */
export const getAssetRecords = (params?: AssetQueryParams): Promise<ApiResponse<PaginatedResponse<AssetRecord>>> => {
  return request.get('/api/v1/operation/assets/', { params })
}

/**
 * 获取资产记录详情
 */
export const getAssetRecord = (id: number): Promise<ApiResponse<AssetRecord>> => {
  return request.get(`/api/v1/operation/assets/${id}/`)
}

/**
 * 创建资产记录
 */
export const createAssetRecord = (data: AssetRecordFormData): Promise<ApiResponse<AssetRecord>> => {
  return request.post('/api/v1/operation/assets/', data)
}

/**
 * 更新资产记录
 */
export const updateAssetRecord = (id: number, data: Partial<AssetRecordFormData>): Promise<ApiResponse<AssetRecord>> => {
  return request.put(`/api/v1/operation/assets/${id}/`, data)
}

/**
 * 删除资产记录
 */
export const deleteAssetRecord = (id: number): Promise<ApiResponse<void>> => {
  return request.delete(`/api/v1/operation/assets/${id}/`)
}

/**
 * 获取资产统计数据
 */
export const getAssetStatistics = (): Promise<ApiResponse<{
  total_count: number
  total_value: number
  normal_count: number
  maintenance_count: number
  repair_count: number
}>> => {
  return request.get('/api/v1/operation/assets/statistics/')
}

/**
 * 生成资产二维码
 */
export const generateAssetQRCode = (id: number): Promise<ApiResponse<{
  qr_code: string
  qr_code_url: string
}>> => {
  return request.post(`/api/v1/operation/assets/${id}/generate-qr/`)
}

/**
 * 导出资产记录
 */
export const exportAssetRecords = (params?: AssetQueryParams): Promise<Blob> => {
  return request.get('/api/v1/operation/assets/export/', {
    params,
    responseType: 'blob'
  })
}

// 维护记录相关 API

/**
 * 获取资产维护记录列表
 */
export const getMaintenanceRecords = (assetId: number): Promise<ApiResponse<MaintenanceRecord[]>> => {
  return request.get(`/api/v1/operation/assets/${assetId}/maintenance/`)
}

/**
 * 创建维护记录
 */
export const createMaintenanceRecord = (data: MaintenanceRecordFormData): Promise<ApiResponse<MaintenanceRecord>> => {
  return request.post('/api/v1/operation/maintenance/', data)
}

/**
 * 更新维护记录
 */
export const updateMaintenanceRecord = (id: number, data: Partial<MaintenanceRecordFormData>): Promise<ApiResponse<MaintenanceRecord>> => {
  return request.put(`/api/v1/operation/maintenance/${id}/`, data)
}

/**
 * 删除维护记录
 */
export const deleteMaintenanceRecord = (id: number): Promise<ApiResponse<void>> => {
  return request.delete(`/api/v1/operation/maintenance/${id}/`)
}

/**
 * 获取维护提醒列表
 */
export const getMaintenanceReminders = (): Promise<ApiResponse<Array<{
  asset_id: number
  asset_name: string
  asset_no: string
  store_name: string
  next_maintenance_date: string
  days_until_maintenance: number
}>>> => {
  return request.get('/api/v1/operation/maintenance/reminders/')
}

// 默认导出
const operationService = {
  // 付款追踪
  getPaymentRecords,
  getPaymentRecord,
  createPaymentRecord,
  updatePaymentRecord,
  deletePaymentRecord,
  markPaymentPaid,
  getPaymentStatistics,
  exportPaymentRecords,
  
  // 资产管理
  getAssetRecords,
  getAssetRecord,
  createAssetRecord,
  updateAssetRecord,
  deleteAssetRecord,
  getAssetStatistics,
  generateAssetQRCode,
  exportAssetRecords,
  
  // 维护记录
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceReminders
}

export default operationService