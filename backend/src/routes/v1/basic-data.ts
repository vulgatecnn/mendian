import type { FastifyInstance } from 'fastify';

const basicDataRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // 区域管理
  fastify.get('/regions', {
    schema: {
      tags: ['basic-data'],
      summary: '获取区域列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取区域列表成功',
    });
  });

  fastify.post('/regions', {
    schema: {
      tags: ['basic-data'],
      summary: '创建区域',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建区域成功',
    });
  });

  // 公司主体管理
  fastify.get('/entities', {
    schema: {
      tags: ['basic-data'],
      summary: '获取公司主体列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取公司主体列表成功',
    });
  });

  fastify.post('/entities', {
    schema: {
      tags: ['basic-data'],
      summary: '创建公司主体',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建公司主体成功',
    });
  });

  // 供应商管理
  fastify.get('/suppliers', {
    schema: {
      tags: ['basic-data'],
      summary: '获取供应商列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取供应商列表成功',
    });
  });

  fastify.post('/suppliers', {
    schema: {
      tags: ['basic-data'],
      summary: '创建供应商',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建供应商成功',
    });
  });
};

export default basicDataRoutes;