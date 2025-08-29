import type { FastifyInstance } from 'fastify';

const operationRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // 付款项管理
  fastify.get('/payments', {
    schema: {
      tags: ['operation'],
      summary: '获取付款项列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取付款项列表成功',
    });
  });

  fastify.post('/payments', {
    schema: {
      tags: ['operation'],
      summary: '创建付款项',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建付款项成功',
    });
  });

  // 资产管理 (二期功能)
  fastify.get('/assets', {
    schema: {
      tags: ['operation'],
      summary: '获取资产列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取资产列表成功',
    });
  });

  fastify.post('/assets', {
    schema: {
      tags: ['operation'],
      summary: '添加资产',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '添加资产成功',
    });
  });
};

export default operationRoutes;