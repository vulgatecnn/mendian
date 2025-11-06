/**
 * E2E测试API辅助函数
 */

import { Page, APIRequestContext } from '@playwright/test';

export class ApiHelper {
  constructor(
    private page: Page,
    private request: APIRequestContext
  ) {}

  /**
   * 获取认证token
   */
  async getAuthToken(): Promise<string | null> {
    // 从localStorage获取token
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('access_token');
    });
    return token;
  }

  /**
   * 发送认证请求
   */
  async authenticatedRequest(
    method: string,
    url: string,
    data?: any
  ): Promise<any> {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.request.fetch(url, {
      method,
      headers,
      data: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  /**
   * 创建测试数据
   */
  async createTestPlan(planData: any): Promise<any> {
    return this.authenticatedRequest(
      'POST',
      '/api/store-planning/plans/',
      planData
    );
  }

  /**
   * 删除测试数据
   */
  async deleteTestPlan(planId: number): Promise<void> {
    await this.authenticatedRequest(
      'DELETE',
      `/api/store-planning/plans/${planId}/`,
      null
    );
  }

  /**
   * 提交审批
   */
  async submitApproval(planId: number, approvalType: string): Promise<any> {
    return this.authenticatedRequest(
      'POST',
      `/api/store-planning/plans/${planId}/submit_for_approval/`,
      { approval_type: approvalType }
    );
  }

  /**
   * 审批通过
   */
  async approvePlan(approvalId: number, notes?: string): Promise<any> {
    return this.authenticatedRequest(
      'POST',
      `/api/store-planning/approvals/${approvalId}/approve/`,
      { approval_notes: notes || '审批通过' }
    );
  }

  /**
   * 审批拒绝
   */
  async rejectPlan(approvalId: number, reason: string): Promise<any> {
    return this.authenticatedRequest(
      'POST',
      `/api/store-planning/approvals/${approvalId}/reject/`,
      { rejection_reason: reason }
    );
  }
}
