/**
 * 系统首页 API 服务
 */
import request from './request'
import type { PaginationParams } from '../types'

// 待办事项类型
export type TodoType = 'approval' | 'contract_reminder' | 'milestone_reminder'

// 待办事项
export interface TodoItem {
  id: number
  type: TodoType
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  link: string
  business_type: string
  business_id: number
  due_date?: string
  created_at: string
}

// 待办事项统计
export interface TodoStatistics {
  total: number
  approval_count: number
  contract_reminder_count: number
  milestone_reminder_count: number
  high_priority_count: number
}

// 待办事项查询参数
export interface TodoQueryParams extends PaginationParams {
  type?: TodoType
  priority?: string
  start_date?: string
  end_date?: string
}

// 常用功能
export interface QuickAccess {
  id: number
  name: string
  icon: string
  link: string
  order: number
}

// 常用功能配置参数
export interface QuickAccessConfig {
  items: Array<{
    name: string
    icon: string
    link: string
    order: number
  }>
}

class HomeService {
  /**
   * 获取待办事项列表
   */
  async getTodos(params?: TodoQueryParams): Promise<{
    count: number
    results: TodoItem[]
  }> {
    return request.get('/home/todos/', { params })
  }

  /**
   * 获取待办事项统计
   */
  async getTodoStatistics(): Promise<TodoStatistics> {
    return request.get('/home/todos/statistics/')
  }

  /**
   * 获取常用功能列表
   */
  async getQuickAccess(): Promise<QuickAccess[]> {
    return request.get('/home/quick-access/')
  }

  /**
   * 更新常用功能配置
   */
  async updateQuickAccess(data: QuickAccessConfig): Promise<QuickAccess[]> {
    return request.post('/home/quick-access/', data)
  }
}

export default new HomeService()
