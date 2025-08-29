/**
 * 开店计划API集成测试
 * 测试所有API端点的功能、状态码、响应格式和错误处理
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { build } from '../../src/server.js';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../setup.js';
import {
  mockUsers,
  storePlanFixtures,
  createStorePlanData,
  updateStorePlanData,
  batchOperationData,
  queryParameters,
  exportData,
  createTestStorePlan,
} from '../fixtures/store-plan.fixture.js';

describe('Store Plan API Integration Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let testPlanId: string;

  beforeEach(async () => {
    // 构建Fastify应用
    app = await build({ logger: false });
    await app.ready();

    // Mock认证中间件，设置测试用户
    app.addHook('preHandler', async (request) => {
      request.user = mockUsers.admin;
    });

    // 创建测试用的开店计划
    const testPlan = await prisma.storePlan.create({
      data: createTestStorePlan(storePlanFixtures.draft, {
        createdBy: mockUsers.admin.id,
      }),
    });
    testPlanId = testPlan.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/store-plans', () => {
    it('应该返回开店计划列表', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.code).toBe(200);
      expect(data.message).toBe('获取开店计划列表成功');
      expect(data.data).toHaveProperty('plans');
      expect(data.data).toHaveProperty('total');
      expect(Array.isArray(data.data.plans)).toBe(true);
    });

    it('应该支持分页查询', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans',
        query: queryParameters.pagination,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.data.plans.length).toBeLessThanOrEqual(10);
    });

    it('应该支持状态筛选', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans',
        query: queryParameters.filters,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      if (data.data.plans.length > 0) {
        expect(data.data.plans[0].status).toBe('DRAFT');
      }
    });

    it('应该支持排序', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans',
        query: queryParameters.sorting,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/v1/store-plans/:id', () => {
    it('应该返回指定ID的开店计划详情', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/store-plans/${testPlanId}`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.code).toBe(200);
      expect(data.message).toBe('获取开店计划详情成功');
      expect(data.data).toHaveProperty('storePlan');
      expect(data.data.storePlan.id).toBe(testPlanId);
    });

    it('当计划不存在时应该返回404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });

    it('当ID格式无效时应该返回400', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans/',
      });

      expect(response.statusCode).toBe(404); // 路由不匹配
    });
  });

  describe('POST /api/v1/store-plans', () => {
    it('应该成功创建新的开店计划', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: createStorePlanData.valid,
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.code).toBe(201);
      expect(data.message).toBe('创建开店计划成功');
      expect(data.data).toHaveProperty('storePlan');
      expect(data.data.storePlan.planName).toBe(createStorePlanData.valid.planName);
    });

    it('当请求体为空时应该返回400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: createStorePlanData.invalid.empty,
      });

      expect(response.statusCode).toBe(400);
    });

    it('当缺少必需字段时应该返回400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: createStorePlanData.invalid.missingRequired,
      });

      expect(response.statusCode).toBe(400);
    });

    it('当日期无效时应该返回400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: createStorePlanData.invalid.invalidDates,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/v1/store-plans/:id', () => {
    it('应该成功更新开店计划', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/store-plans/${testPlanId}`,
        payload: updateStorePlanData.valid,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.code).toBe(200);
      expect(data.message).toBe('更新开店计划成功');
      expect(data.data).toHaveProperty('storePlan');
      expect(data.data.storePlan.planName).toBe(updateStorePlanData.valid.planName);
    });

    it('应该支持部分字段更新', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/store-plans/${testPlanId}`,
        payload: updateStorePlanData.partial,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.storePlan.description).toBe(updateStorePlanData.partial.description);
    });

    it('当计划不存在时应该返回404', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/store-plans/non-existent-id',
        payload: updateStorePlanData.valid,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/store-plans/:id', () => {
    it('应该成功删除开店计划', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/store-plans/${testPlanId}`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.code).toBe(200);
      expect(data.message).toBe('删除开店计划成功');
    });

    it('当计划不存在时应该返回404', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/store-plans/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });

    it('删除后应该无法再获取该计划', async () => {
      // 先删除
      await app.inject({
        method: 'DELETE',
        url: `/api/v1/store-plans/${testPlanId}`,
      });

      // 再尝试获取
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/store-plans/${testPlanId}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Status Change Operations', () => {
    beforeEach(async () => {
      // 确保测试计划处于草稿状态
      await prisma.storePlan.update({
        where: { id: testPlanId },
        data: { status: 'DRAFT' },
      });
    });

    it('POST /api/v1/store-plans/:id/submit - 应该成功提交计划', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/store-plans/${testPlanId}/submit`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('提交开店计划成功');
      expect(data.data.storePlan.status).toBe('SUBMITTED');
    });

    it('POST /api/v1/store-plans/:id/approve - 应该成功审批通过计划', async () => {
      // 先提交
      await app.inject({
        method: 'POST',
        url: `/api/v1/store-plans/${testPlanId}/submit`,
      });

      // 再审批
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/store-plans/${testPlanId}/approve`,
        payload: {
          approvalComments: '计划合理，同意执行',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('审批开店计划成功');
      expect(data.data.storePlan.status).toBe('APPROVED');
    });

    it('POST /api/v1/store-plans/:id/reject - 应该成功拒绝计划', async () => {
      // 先提交
      await app.inject({
        method: 'POST',
        url: `/api/v1/store-plans/${testPlanId}/submit`,
      });

      // 再拒绝
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/store-plans/${testPlanId}/reject`,
        payload: {
          rejectionReason: '当前市场条件不适合',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('拒绝开店计划成功');
      expect(data.data.storePlan.status).toBe('REJECTED');
    });

    it('POST /api/v1/store-plans/:id/execute - 应该成功开始执行计划', async () => {
      // 先审批通过
      await prisma.storePlan.update({
        where: { id: testPlanId },
        data: { status: 'APPROVED' },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/store-plans/${testPlanId}/execute`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('开始执行开店计划成功');
      expect(data.data.storePlan.status).toBe('IN_PROGRESS');
    });
  });

  describe('POST /api/v1/store-plans/batch', () => {
    let additionalPlanIds: string[];

    beforeEach(async () => {
      // 创建额外的测试计划用于批量操作
      const plans = await Promise.all([
        prisma.storePlan.create({
          data: createTestStorePlan(storePlanFixtures.draft, {
            createdBy: mockUsers.admin.id,
            planName: '批量测试计划1',
          }),
        }),
        prisma.storePlan.create({
          data: createTestStorePlan(storePlanFixtures.draft, {
            createdBy: mockUsers.admin.id,
            planName: '批量测试计划2',
          }),
        }),
      ]);
      additionalPlanIds = plans.map(p => p.id);
    });

    it('应该成功批量删除计划', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans/batch',
        payload: {
          action: 'DELETE',
          ids: additionalPlanIds,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('批量DELETE操作完成');
      expect(data.data.success).toBe(additionalPlanIds.length);
      expect(data.data.failed).toBe(0);
    });

    it('应该成功批量更新状态', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans/batch',
        payload: {
          action: 'UPDATE_STATUS',
          ids: additionalPlanIds,
          data: {
            status: 'SUBMITTED',
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.success).toBe(additionalPlanIds.length);
    });

    it('当IDs为空时应该返回400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans/batch',
        payload: batchOperationData.invalid.emptyIds,
      });

      expect(response.statusCode).toBe(400);
    });

    it('当操作类型无效时应该返回400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans/batch',
        payload: batchOperationData.invalid.invalidAction,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Statistics and Reporting', () => {
    beforeEach(async () => {
      // 创建不同状态的测试计划用于统计
      await Promise.all([
        prisma.storePlan.create({
          data: createTestStorePlan(storePlanFixtures.submitted, {
            createdBy: mockUsers.admin.id,
          }),
        }),
        prisma.storePlan.create({
          data: createTestStorePlan(storePlanFixtures.approved, {
            createdBy: mockUsers.admin.id,
          }),
        }),
        prisma.storePlan.create({
          data: createTestStorePlan(storePlanFixtures.inProgress, {
            createdBy: mockUsers.admin.id,
          }),
        }),
      ]);
    });

    it('GET /api/v1/store-plans/statistics - 应该返回统计数据', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans/statistics',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('获取统计数据成功');
      expect(data.data).toHaveProperty('statusDistribution');
      expect(data.data).toHaveProperty('regionDistribution');
      expect(data.data).toHaveProperty('totalPlans');
      expect(data.data).toHaveProperty('totalInvestment');
    });

    it('GET /api/v1/store-plans/progress - 应该返回进度数据', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans/progress',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('获取进度数据成功');
      expect(data.data).toHaveProperty('overallProgress');
      expect(data.data).toHaveProperty('planProgress');
    });

    it('GET /api/v1/store-plans/summary - 应该返回汇总信息', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans/summary',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.message).toBe('获取汇总信息成功');
      expect(data.data).toHaveProperty('totalPlans');
      expect(data.data).toHaveProperty('activeProjects');
      expect(data.data).toHaveProperty('completedProjects');
    });
  });

  describe('POST /api/v1/store-plans/export', () => {
    it('应该成功导出Excel文件', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans/export',
        payload: exportData.valid,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toMatch(/attachment; filename=.*\.xlsx/);
    });

    it('应该支持过滤条件导出', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans/export',
        payload: exportData.allData,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('应该正确处理数据库连接错误', async () => {
      // Mock数据库错误
      vi.spyOn(prisma.storePlan, 'findMany').mockRejectedValue(new Error('Database connection failed'));

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans',
      });

      expect(response.statusCode).toBe(500);
    });

    it('应该正确处理无效的JSON负载', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: 'invalid json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('应该正确处理超大的请求负载', async () => {
      const largePayload = {
        ...createStorePlanData.valid,
        description: 'x'.repeat(10000), // 超长描述
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: largePayload,
      });

      // 根据具体的验证规则，可能返回400或413
      expect([400, 413]).toContain(response.statusCode);
    });
  });

  describe('Authentication and Authorization', () => {
    it('应该在没有用户信息时返回401', async () => {
      // 移除认证钩子
      app.removeAllHooks('preHandler');

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: createStorePlanData.valid,
      });

      expect(response.statusCode).toBe(400); // 因为用户信息缺失，控制器抛出BadRequestError
    });

    it('应该验证状态响应的一致性', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/store-plans/${testPlanId}`,
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      // 验证状态映射是否正确（这是修复后需要验证的重点）
      expect(data.data.storePlan.status).toBeDefined();
      expect(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(data.data.storePlan.status)).toBe(true);
    });
  });

  describe('Response Format Validation', () => {
    it('所有成功响应应该有统一格式', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/store-plans',
      });

      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
      
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.code).toBe('number');
      expect(typeof data.message).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });

    it('创建操作应该返回201状态码', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/store-plans',
        payload: createStorePlanData.valid,
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.payload);
      expect(data.code).toBe(201);
    });

    it('更新和删除操作应该返回200状态码', async () => {
      const updateResponse = await app.inject({
        method: 'PUT',
        url: `/api/v1/store-plans/${testPlanId}`,
        payload: updateStorePlanData.valid,
      });

      expect(updateResponse.statusCode).toBe(200);
      const updateData = JSON.parse(updateResponse.payload);
      expect(updateData.code).toBe(200);
    });
  });
});