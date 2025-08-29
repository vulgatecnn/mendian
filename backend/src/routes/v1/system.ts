import type { FastifyInstance } from 'fastify';

const systemRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // 用户管理
  fastify.get('/users', {
    schema: {
      tags: ['system'],
      summary: '获取用户列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取用户列表成功',
    });
  });

  fastify.post('/users', {
    schema: {
      tags: ['system'],
      summary: '创建用户',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建用户成功',
    });
  });

  // 角色管理
  fastify.get('/roles', {
    schema: {
      tags: ['system'],
      summary: '获取角色列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取角色列表成功',
    });
  });

  fastify.post('/roles', {
    schema: {
      tags: ['system'],
      summary: '创建角色',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '创建角色成功',
    });
  });

  // 权限管理
  fastify.get('/permissions', {
    schema: {
      tags: ['system'],
      summary: '获取权限列表',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取权限列表成功',
    });
  });

  // 企业微信同步
  fastify.post('/wechat/sync-departments', {
    schema: {
      tags: ['system'],
      summary: '同步企业微信部门',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '同步企业微信部门成功',
    });
  });

  fastify.post('/wechat/sync-users', {
    schema: {
      tags: ['system'],
      summary: '同步企业微信用户',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      message: '同步企业微信用户成功',
    });
  });

  // 系统日志
  fastify.get('/audit-logs', {
    schema: {
      tags: ['system'],
      summary: '获取审计日志',
    },
  }, async (request, reply) => {
    reply.send({
      success: true,
      data: { items: [], pagination: {} },
      message: '获取审计日志成功',
    });
  });
};

export default systemRoutes;