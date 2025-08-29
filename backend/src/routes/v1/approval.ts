import type { FastifyInstance } from 'fastify';

const approvalRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // 审批流程管理
  fastify.get('/flows', {
    schema: {
      tags: ['approval'],
      summary: '获取审批流程列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取审批流程列表成功',
    });
  });

  fastify.post('/flows', {
    schema: {
      tags: ['approval'],
      summary: '创建审批流程',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建审批流程成功',
    });
  });

  // 审批操作
  fastify.post('/flows/:id/approve', {
    schema: {
      tags: ['approval'],
      summary: '审批通过',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '审批通过成功',
    });
  });

  fastify.post('/flows/:id/reject', {
    schema: {
      tags: ['approval'],
      summary: '审批拒绝',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '审批拒绝成功',
    });
  });

  // 审批模板管理
  fastify.get('/templates', {
    schema: {
      tags: ['approval'],
      summary: '获取审批模板列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取审批模板列表成功',
    });
  });

  fastify.post('/templates', {
    schema: {
      tags: ['approval'],
      summary: '创建审批模板',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建审批模板成功',
    });
  });
};

export default approvalRoutes;