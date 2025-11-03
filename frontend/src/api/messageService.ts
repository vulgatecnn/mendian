/**
 * 消息通知 API 服务
 */
import request from './request'
import type { PaginationParams } from '../types'

// 消息类型
export type MessageType = 'approval' | 'reminder' | 'system' | 'notification'

// 消息
export interface Message {
  id: number
  type: MessageType
  title: string
  content: string
  link?: string
  is_read: boolean
  business_type?: string
  business_id?: number
  created_at: string
  read_at?: string
}

// 消息查询参数
export interface MessageQueryParams extends PaginationParams {
  type?: MessageType
  is_read?: boolean
  start_date?: string
  end_date?: string
}

// 未读消息数量
export interface UnreadCount {
  total: number
  by_type: {
    approval: number
    reminder: number
    system: number
    notification: number
  }
}

class MessageService {
  /**
   * 获取消息列表
   */
  async getMessages(params?: MessageQueryParams): Promise<{
    count: number
    results: Message[]
  }> {
    return request.get('/messages/', { params })
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(): Promise<UnreadCount> {
    return request.get('/messages/unread-count/')
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(id: number): Promise<Message> {
    return request.post(`/messages/${id}/mark-read/`)
  }

  /**
   * 批量标记消息为已读
   */
  async markMultipleAsRead(ids: number[]): Promise<{ success: boolean; count: number }> {
    return request.post('/messages/mark-read-batch/', { ids })
  }

  /**
   * 标记全部消息为已读
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    return request.post('/messages/mark-all-read/')
  }

  /**
   * 删除消息
   */
  async deleteMessage(id: number): Promise<void> {
    return request.delete(`/messages/${id}/`)
  }

  /**
   * 批量删除消息
   */
  async deleteMultipleMessages(ids: number[]): Promise<{ success: boolean; count: number }> {
    return request.post('/messages/delete-batch/', { ids })
  }
}

export default new MessageService()
