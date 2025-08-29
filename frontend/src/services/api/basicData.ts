import { httpClient } from '../http'
import { API_PATHS, buildUrl } from '../http/config'
import type {
  BaseResponse,
  PaginationResponse,
  Region,
  Supplier,
  SupplierQueryParams,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierStats,
  Organization,
  Customer,
  BusinessRegion,
  BusinessRegionStats,
  BusinessRegionQueryParams,
  CreateBusinessRegionDto,
  UpdateBusinessRegionDto,
  City,
  CityTransferDto
} from '../types'

/**
 * 基础数据API服务
 */
export class BasicDataApiService {
  // ==================== 地区管理 ====================

  /**
   * 获取地区列表
   */
  static async getRegions(params?: {
    parentId?: string
    level?: number
    enabled?: boolean
  }): Promise<BaseResponse<Region[]>> {
    return httpClient.get<Region[]>(buildUrl(API_PATHS.BASIC_DATA.REGIONS, undefined, params))
  }

  /**
   * 获取地区树
   */
  static async getRegionTree(rootId?: string): Promise<BaseResponse<Region[]>> {
    return httpClient.get<Region[]>(buildUrl('/basic-data/regions/tree', undefined, { rootId }))
  }

  /**
   * 创建地区
   */
  static async createRegion(
    data: Omit<Region, 'id' | 'createdAt' | 'updatedAt' | 'children'>
  ): Promise<BaseResponse<Region>> {
    return httpClient.post<Region>(API_PATHS.BASIC_DATA.REGIONS, data)
  }

  /**
   * 更新地区
   */
  static async updateRegion(id: string, data: Partial<Region>): Promise<BaseResponse<Region>> {
    return httpClient.put<Region>(buildUrl(API_PATHS.BASIC_DATA.REGION_DETAIL, { id }), data)
  }

  /**
   * 删除地区
   */
  static async deleteRegion(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.BASIC_DATA.REGION_DETAIL, { id }))
  }

  // ==================== 供应商管理 ====================

  /**
   * 获取供应商列表
   */
  static async getSuppliers(
    params?: SupplierQueryParams
  ): Promise<PaginationResponse<Supplier>> {
    return httpClient.get<PaginationResponse<Supplier>>(
      buildUrl(API_PATHS.BASIC_DATA.SUPPLIERS, undefined, params)
    )
  }

  /**
   * 获取供应商详情
   */
  static async getSupplier(id: string): Promise<BaseResponse<Supplier>> {
    return httpClient.get<Supplier>(buildUrl(API_PATHS.BASIC_DATA.SUPPLIER_DETAIL, { id }))
  }

  /**
   * 创建供应商
   */
  static async createSupplier(data: CreateSupplierDto): Promise<BaseResponse<Supplier>> {
    return httpClient.post<Supplier>(API_PATHS.BASIC_DATA.SUPPLIERS, data)
  }

  /**
   * 更新供应商
   */
  static async updateSupplier(
    id: string,
    data: UpdateSupplierDto
  ): Promise<BaseResponse<Supplier>> {
    return httpClient.put<Supplier>(buildUrl(API_PATHS.BASIC_DATA.SUPPLIER_DETAIL, { id }), data)
  }

  /**
   * 删除供应商
   */
  static async deleteSupplier(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.BASIC_DATA.SUPPLIER_DETAIL, { id }))
  }

  /**
   * 批量启用/禁用供应商
   */
  static async batchUpdateSupplierStatus(
    ids: string[],
    status: Supplier['status']
  ): Promise<BaseResponse<null>> {
    return httpClient.put<null>(API_PATHS.BASIC_DATA.SUPPLIERS + '/batch-status', {
      ids,
      status
    })
  }

  /**
   * 获取供应商统计信息
   */
  static async getSupplierStats(): Promise<BaseResponse<SupplierStats>> {
    return httpClient.get<SupplierStats>(API_PATHS.BASIC_DATA.SUPPLIERS + '/stats')
  }

  /**
   * 导出供应商数据
   */
  static async exportSuppliers(params?: SupplierQueryParams): Promise<BaseResponse<string>> {
    return httpClient.get<string>(
      buildUrl(API_PATHS.BASIC_DATA.SUPPLIERS + '/export', undefined, params)
    )
  }

  // ==================== 组织管理 ====================

  /**
   * 获取组织列表
   */
  static async getOrganizations(params?: {
    parentId?: string
    type?: Organization['type']
    enabled?: boolean
  }): Promise<BaseResponse<Organization[]>> {
    return httpClient.get<Organization[]>(
      buildUrl(API_PATHS.BASIC_DATA.ORGANIZATIONS, undefined, params)
    )
  }

  /**
   * 获取组织树
   */
  static async getOrganizationTree(): Promise<BaseResponse<Organization[]>> {
    return httpClient.get<Organization[]>('/basic-data/organizations/tree')
  }

  /**
   * 创建组织
   */
  static async createOrganization(
    data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'children'>
  ): Promise<BaseResponse<Organization>> {
    return httpClient.post<Organization>(API_PATHS.BASIC_DATA.ORGANIZATIONS, data)
  }

  /**
   * 更新组织
   */
  static async updateOrganization(
    id: string,
    data: Partial<Organization>
  ): Promise<BaseResponse<Organization>> {
    return httpClient.put<Organization>(
      buildUrl(API_PATHS.BASIC_DATA.ORGANIZATION_DETAIL, { id }),
      data
    )
  }

  /**
   * 删除组织
   */
  static async deleteOrganization(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.BASIC_DATA.ORGANIZATION_DETAIL, { id }))
  }

  // ==================== 客户管理 ====================

  /**
   * 获取客户列表
   */
  static async getCustomers(params?: {
    page?: number
    pageSize?: number
    type?: Customer['type']
    category?: Customer['category']
    status?: Customer['status']
    keyword?: string
  }): Promise<PaginationResponse<Customer>> {
    return httpClient.get<Customer[]>(buildUrl(API_PATHS.BASIC_DATA.CUSTOMERS, undefined, params))
  }

  /**
   * 获取客户详情
   */
  static async getCustomer(id: string): Promise<BaseResponse<Customer>> {
    return httpClient.get<Customer>(buildUrl(API_PATHS.BASIC_DATA.CUSTOMER_DETAIL, { id }))
  }

  /**
   * 创建客户
   */
  static async createCustomer(
    data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BaseResponse<Customer>> {
    return httpClient.post<Customer>(API_PATHS.BASIC_DATA.CUSTOMERS, data)
  }

  /**
   * 更新客户
   */
  static async updateCustomer(
    id: string,
    data: Partial<Customer>
  ): Promise<BaseResponse<Customer>> {
    return httpClient.put<Customer>(buildUrl(API_PATHS.BASIC_DATA.CUSTOMER_DETAIL, { id }), data)
  }

  /**
   * 删除客户
   */
  static async deleteCustomer(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl(API_PATHS.BASIC_DATA.CUSTOMER_DETAIL, { id }))
  }

  // ==================== 业务大区管理 ====================

  /**
   * 获取业务大区列表
   */
  static async getBusinessRegions(
    params?: BusinessRegionQueryParams
  ): Promise<PaginationResponse<BusinessRegion>> {
    return httpClient.get<PaginationResponse<BusinessRegion>>(
      buildUrl('/basic-data/business-regions', undefined, params)
    )
  }

  /**
   * 获取业务大区详情
   */
  static async getBusinessRegion(id: string): Promise<BaseResponse<BusinessRegion>> {
    return httpClient.get<BusinessRegion>(buildUrl('/basic-data/business-regions/{id}', { id }))
  }

  /**
   * 创建业务大区
   */
  static async createBusinessRegion(
    data: CreateBusinessRegionDto
  ): Promise<BaseResponse<BusinessRegion>> {
    return httpClient.post<BusinessRegion>('/basic-data/business-regions', data)
  }

  /**
   * 更新业务大区
   */
  static async updateBusinessRegion(
    id: string,
    data: UpdateBusinessRegionDto
  ): Promise<BaseResponse<BusinessRegion>> {
    return httpClient.put<BusinessRegion>(
      buildUrl('/basic-data/business-regions/{id}', { id }),
      data
    )
  }

  /**
   * 删除业务大区
   */
  static async deleteBusinessRegion(id: string): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(buildUrl('/basic-data/business-regions/{id}', { id }))
  }

  /**
   * 批量启用/禁用业务大区
   */
  static async batchUpdateBusinessRegionStatus(
    ids: string[],
    status: BusinessRegion['status']
  ): Promise<BaseResponse<null>> {
    return httpClient.put<null>('/basic-data/business-regions/batch-status', {
      ids,
      status
    })
  }

  /**
   * 获取业务大区统计信息
   */
  static async getBusinessRegionStats(): Promise<BaseResponse<BusinessRegionStats>> {
    return httpClient.get<BusinessRegionStats>('/basic-data/business-regions/stats')
  }

  /**
   * 获取可用城市列表（未分配给大区的城市）
   */
  static async getAvailableCities(params?: {
    provinceId?: string
    keyword?: string
  }): Promise<BaseResponse<City[]>> {
    return httpClient.get<City[]>(buildUrl('/basic-data/cities/available', undefined, params))
  }

  /**
   * 获取大区下的城市列表
   */
  static async getRegionCities(regionId: string): Promise<BaseResponse<City[]>> {
    return httpClient.get<City[]>(
      buildUrl('/basic-data/business-regions/{id}/cities', { id: regionId })
    )
  }

  /**
   * 添加城市到大区
   */
  static async addCitiesToRegion(
    regionId: string,
    cityIds: string[]
  ): Promise<BaseResponse<null>> {
    return httpClient.post<null>(
      buildUrl('/basic-data/business-regions/{id}/cities', { id: regionId }),
      { cityIds }
    )
  }

  /**
   * 从大区移除城市
   */
  static async removeCitiesFromRegion(
    regionId: string,
    cityIds: string[]
  ): Promise<BaseResponse<null>> {
    return httpClient.delete<null>(
      buildUrl('/basic-data/business-regions/{id}/cities', { id: regionId }),
      { data: { cityIds } }
    )
  }

  /**
   * 城市转移（从一个大区转移到另一个大区）
   */
  static async transferCities(data: CityTransferDto): Promise<BaseResponse<null>> {
    return httpClient.put<null>('/basic-data/cities/transfer', data)
  }

  /**
   * 获取数据字典
   */
  static async getDictionary(category?: string): Promise<
    BaseResponse<
      Record<
        string,
        Array<{
          code: string
          label: string
          value: any
          sort: number
          enabled: boolean
        }>
      >
    >
  > {
    return httpClient.get<
      Record<
        string,
        Array<{
          code: string
          label: string
          value: any
          sort: number
          enabled: boolean
        }>
      >
    >(buildUrl('/basic-data/dictionary', undefined, { category }))
  }
}
