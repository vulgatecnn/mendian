/**
 * 基础数据管理 API 服务
 */
import request from './request'
import type {
  BusinessRegion,
  BusinessRegionFormData,
  BusinessRegionQueryParams,
  Supplier,
  SupplierFormData,
  SupplierQueryParams,
  LegalEntity,
  LegalEntityFormData,
  LegalEntityQueryParams,
  Customer,
  CustomerFormData,
  CustomerQueryParams,
  Budget,
  BudgetFormData,
  BudgetQueryParams,
  PaginatedResponse,
} from '../types'

class BaseDataService {
  // ==================== 业务大区管理 ====================

  /**
   * 获取业务大区列表
   */
  async getBusinessRegions(params?: BusinessRegionQueryParams): Promise<PaginatedResponse<BusinessRegion>> {
    return request.get('/base-data/regions/', { params })
  }

  /**
   * 获取业务大区详情
   */
  async getBusinessRegion(id: number): Promise<BusinessRegion> {
    return request.get(`/base-data/regions/${id}/`)
  }

  /**
   * 创建业务大区
   */
  async createBusinessRegion(data: BusinessRegionFormData): Promise<BusinessRegion> {
    return request.post('/base-data/regions/', data)
  }

  /**
   * 更新业务大区
   */
  async updateBusinessRegion(id: number, data: Partial<BusinessRegionFormData>): Promise<BusinessRegion> {
    return request.put(`/base-data/regions/${id}/`, data)
  }

  /**
   * 删除业务大区
   */
  async deleteBusinessRegion(id: number): Promise<void> {
    return request.delete(`/base-data/regions/${id}/`)
  }

  /**
   * 切换业务大区状态
   */
  async toggleBusinessRegionStatus(id: number, is_active: boolean): Promise<BusinessRegion> {
    return request.patch(`/base-data/regions/${id}/`, { is_active })
  }

  // ==================== 供应商管理 ====================

  /**
   * 获取供应商列表
   */
  async getSuppliers(params?: SupplierQueryParams): Promise<PaginatedResponse<Supplier>> {
    return request.get('/base-data/suppliers/', { params })
  }

  /**
   * 获取供应商详情
   */
  async getSupplier(id: number): Promise<Supplier> {
    return request.get(`/base-data/suppliers/${id}/`)
  }

  /**
   * 创建供应商
   */
  async createSupplier(data: SupplierFormData): Promise<Supplier> {
    return request.post('/base-data/suppliers/', data)
  }

  /**
   * 更新供应商
   */
  async updateSupplier(id: number, data: Partial<SupplierFormData>): Promise<Supplier> {
    return request.put(`/base-data/suppliers/${id}/`, data)
  }

  /**
   * 删除供应商
   */
  async deleteSupplier(id: number): Promise<void> {
    return request.delete(`/base-data/suppliers/${id}/`)
  }

  /**
   * 切换供应商合作状态
   */
  async toggleSupplierStatus(id: number, cooperation_status: 'active' | 'inactive'): Promise<Supplier> {
    return request.patch(`/base-data/suppliers/${id}/`, { cooperation_status })
  }

  // ==================== 法人主体管理 ====================

  /**
   * 获取法人主体列表
   */
  async getLegalEntities(params?: LegalEntityQueryParams): Promise<PaginatedResponse<LegalEntity>> {
    return request.get('/base-data/legal-entities/', { params })
  }

  /**
   * 获取法人主体详情
   */
  async getLegalEntity(id: number): Promise<LegalEntity> {
    return request.get(`/base-data/legal-entities/${id}/`)
  }

  /**
   * 创建法人主体
   */
  async createLegalEntity(data: LegalEntityFormData): Promise<LegalEntity> {
    return request.post('/base-data/legal-entities/', data)
  }

  /**
   * 更新法人主体
   */
  async updateLegalEntity(id: number, data: Partial<LegalEntityFormData>): Promise<LegalEntity> {
    return request.put(`/base-data/legal-entities/${id}/`, data)
  }

  /**
   * 删除法人主体
   */
  async deleteLegalEntity(id: number): Promise<void> {
    return request.delete(`/base-data/legal-entities/${id}/`)
  }

  /**
   * 切换法人主体营运状态
   */
  async toggleLegalEntityStatus(id: number, status: 'active' | 'inactive'): Promise<LegalEntity> {
    return request.patch(`/base-data/legal-entities/${id}/`, { status })
  }

  // ==================== 客户管理 ====================

  /**
   * 获取客户列表
   */
  async getCustomers(params?: CustomerQueryParams): Promise<PaginatedResponse<Customer>> {
    return request.get('/base-data/customers/', { params })
  }

  /**
   * 获取客户详情
   */
  async getCustomer(id: number): Promise<Customer> {
    return request.get(`/base-data/customers/${id}/`)
  }

  /**
   * 创建客户
   */
  async createCustomer(data: CustomerFormData): Promise<Customer> {
    return request.post('/base-data/customers/', data)
  }

  /**
   * 更新客户
   */
  async updateCustomer(id: number, data: Partial<CustomerFormData>): Promise<Customer> {
    return request.put(`/base-data/customers/${id}/`, data)
  }

  /**
   * 删除客户
   */
  async deleteCustomer(id: number): Promise<void> {
    return request.delete(`/base-data/customers/${id}/`)
  }

  /**
   * 切换客户合作状态
   */
  async toggleCustomerStatus(id: number, cooperation_status: 'active' | 'inactive'): Promise<Customer> {
    return request.patch(`/base-data/customers/${id}/`, { cooperation_status })
  }

  // ==================== 商务预算管理 ====================

  /**
   * 获取商务预算列表
   */
  async getBudgets(params?: BudgetQueryParams): Promise<PaginatedResponse<Budget>> {
    return request.get('/base-data/budgets/', { params })
  }

  /**
   * 获取商务预算详情
   */
  async getBudget(id: number): Promise<Budget> {
    return request.get(`/base-data/budgets/${id}/`)
  }

  /**
   * 创建商务预算
   */
  async createBudget(data: BudgetFormData): Promise<Budget> {
    return request.post('/base-data/budgets/', data)
  }

  /**
   * 更新商务预算
   */
  async updateBudget(id: number, data: Partial<BudgetFormData>): Promise<Budget> {
    return request.put(`/base-data/budgets/${id}/`, data)
  }

  /**
   * 删除商务预算
   */
  async deleteBudget(id: number): Promise<void> {
    return request.delete(`/base-data/budgets/${id}/`)
  }

  /**
   * 切换商务预算状态
   */
  async toggleBudgetStatus(id: number, is_active: boolean): Promise<Budget> {
    return request.patch(`/base-data/budgets/${id}/`, { is_active })
  }
}

export default new BaseDataService()
