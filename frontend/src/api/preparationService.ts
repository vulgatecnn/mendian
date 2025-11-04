/**
 * 开店筹备 API 服务
 */
import request from './request'
import {
  ConstructionOrder,
  ConstructionOrderFormData,
  ConstructionOrderQueryParams,
  MilestoneFormData,
  Milestone,
  AcceptanceParams,
  RectificationMarkParams,
  DeliveryChecklist,
  DeliveryChecklistFormData,
  DeliveryChecklistQueryParams,
  Supplier,
  PaginatedResponse
} from '../types'

/**
 * 开店筹备 API 服务类
 */
export class PreparationService {
  // 工程单相关接口

  /**
   * 获取工程单列表
   */
  static async getConstructionOrders(params?: ConstructionOrderQueryParams): Promise<PaginatedResponse<ConstructionOrder>> {
    return request.get('/preparation/construction/', { params })
  }

  /**
   * 获取工程单详情
   */
  static async getConstructionOrderDetail(id: number): Promise<ConstructionOrder> {
    return request.get(`/preparation/construction/${id}/`)
  }

  /**
   * 创建工程单
   */
  static async createConstructionOrder(data: ConstructionOrderFormData): Promise<ConstructionOrder> {
    return request.post('/preparation/construction/', data)
  }

  /**
   * 更新工程单
   */
  static async updateConstructionOrder(id: number, data: Partial<ConstructionOrderFormData>): Promise<ConstructionOrder> {
    return request.put(`/preparation/construction/${id}/`, data)
  }

  /**
   * 删除工程单
   */
  static async deleteConstructionOrder(id: number): Promise<void> {
    return request.delete(`/preparation/construction/${id}/`)
  }

  /**
   * 上传设计图纸
   */
  static async uploadDesignFiles(id: number, files: FormData): Promise<ConstructionOrder> {
    return request.post(`/preparation/construction/${id}/upload-design/`, files, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // 里程碑相关接口

  /**
   * 添加里程碑
   */
  static async addMilestone(constructionOrderId: number, data: MilestoneFormData): Promise<Milestone> {
    return request.post(`/preparation/construction/${constructionOrderId}/milestones/`, data)
  }

  /**
   * 更新里程碑
   */
  static async updateMilestone(constructionOrderId: number, milestoneId: number, data: Partial<MilestoneFormData>): Promise<Milestone> {
    return request.put(`/preparation/construction/${constructionOrderId}/milestones/${milestoneId}/`, data)
  }

  /**
   * 删除里程碑
   */
  static async deleteMilestone(constructionOrderId: number, milestoneId: number): Promise<void> {
    return request.delete(`/preparation/construction/${constructionOrderId}/milestones/${milestoneId}/`)
  }

  /**
   * 完成里程碑
   */
  static async completeMilestone(constructionOrderId: number, milestoneId: number, actualDate: string): Promise<Milestone> {
    return request.post(`/preparation/construction/${constructionOrderId}/milestones/${milestoneId}/complete/`, {
      actual_date: actualDate
    })
  }

  // 验收相关接口

  /**
   * 执行验收
   */
  static async performAcceptance(id: number, data: AcceptanceParams): Promise<ConstructionOrder> {
    return request.post(`/preparation/construction/${id}/acceptance/`, data)
  }

  /**
   * 标记整改项
   */
  static async markRectification(id: number, data: RectificationMarkParams): Promise<ConstructionOrder> {
    return request.post(`/preparation/construction/${id}/rectification/`, data)
  }

  // 交付清单相关接口

  /**
   * 获取交付清单列表
   */
  static async getDeliveryChecklists(params?: DeliveryChecklistQueryParams): Promise<PaginatedResponse<DeliveryChecklist>> {
    return request.get('/preparation/delivery/', { params })
  }

  /**
   * 获取交付清单详情
   */
  static async getDeliveryChecklistDetail(id: number): Promise<DeliveryChecklist> {
    return request.get(`/preparation/delivery/${id}/`)
  }

  /**
   * 创建交付清单
   */
  static async createDeliveryChecklist(data: DeliveryChecklistFormData): Promise<DeliveryChecklist> {
    return request.post('/preparation/delivery/', data)
  }

  /**
   * 更新交付清单
   */
  static async updateDeliveryChecklist(id: number, data: Partial<DeliveryChecklistFormData>): Promise<DeliveryChecklist> {
    return request.put(`/preparation/delivery/${id}/`, data)
  }

  /**
   * 删除交付清单
   */
  static async deleteDeliveryChecklist(id: number): Promise<void> {
    return request.delete(`/preparation/delivery/${id}/`)
  }

  /**
   * 上传交付文档
   */
  static async uploadDeliveryDocuments(id: number, files: FormData): Promise<DeliveryChecklist> {
    return request.post(`/preparation/delivery/${id}/upload/`, files, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * 更新交付项状态
   */
  static async updateDeliveryItemStatus(id: number, itemId: number, isCompleted: boolean): Promise<DeliveryChecklist> {
    return request.post(`/preparation/delivery/${id}/items/${itemId}/status/`, {
      is_completed: isCompleted
    })
  }

  /**
   * 更新交付项列表
   */
  static async updateDeliveryItems(id: number, items: any[]): Promise<DeliveryChecklist> {
    return request.put(`/preparation/delivery/${id}/items/`, {
      delivery_items: items
    })
  }

  // 基础数据接口

  /**
   * 获取供应商列表
   */
  static async getSuppliers(): Promise<Supplier[]> {
    return request.get('/base-data/suppliers/')
  }

  /**
   * 获取可用的跟进单列表（已签约状态）
   */
  static async getAvailableFollowUps(): Promise<any[]> {
    const response: any = await request.get('/expansion/follow-ups/', {
      params: {
        status: 'signed',
        page_size: 1000
      }
    })
    return response.results || []
  }
}

export default PreparationService
