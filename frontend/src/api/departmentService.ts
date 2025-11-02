/**
 * 部门管理 API 服务
 */
import request from './request'
import { Department, DepartmentSyncResponse } from '../types'

export class DepartmentService {
  /**
   * 获取部门列表
   */
  static async getDepartments(): Promise<Department[]> {
    return request.get('/departments/')
  }

  /**
   * 获取部门树形结构
   */
  static async getDepartmentTree(): Promise<Department[]> {
    return request.get('/departments/tree/')
  }

  /**
   * 获取部门详情
   */
  static async getDepartmentDetail(id: number): Promise<Department> {
    return request.get(`/departments/${id}/`)
  }

  /**
   * 从企业微信同步部门
   */
  static async syncFromWechat(): Promise<DepartmentSyncResponse> {
    return request.post('/departments/sync_from_wechat/')
  }
}

export default DepartmentService