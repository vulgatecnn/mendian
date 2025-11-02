/**
 * 审计日志 API 服务
 */
import request from './request'
import { AuditLog, AuditLogQueryParams, PaginatedResponse } from '../types'

export class AuditLogService {
  /**
   * 获取审计日志列表
   */
  static async getAuditLogs(params?: AuditLogQueryParams): Promise<PaginatedResponse<AuditLog>> {
    return request.get('/audit-logs/', { params })
  }

  /**
   * 获取审计日志详情
   */
  static async getAuditLogDetail(id: number): Promise<AuditLog> {
    return request.get(`/audit-logs/${id}/`)
  }
}

export default AuditLogService