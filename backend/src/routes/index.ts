/**
 * 路由注册
 * 统一注册所有API路由
 */
import type { FastifyInstance } from 'fastify';
import { appConfig } from '../config/index.js';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Register API routes with prefix
  await fastify.register(async function(fastify) {
    // Core authentication and user management routes
    await fastify.register(import('./auth.js'), { prefix: '/auth' });
    await fastify.register(import('./users.js'), { prefix: '/users' });
    
    // Business module routes (existing)
    await fastify.register(import('./v1/store-plans.js'), { prefix: '/store-plans' });
    await fastify.register(import('./v1/expansion.js'), { prefix: '/expansion' });
    await fastify.register(import('./v1/preparation.js'), { prefix: '/preparation' });
    await fastify.register(import('./v1/store-files.js'), { prefix: '/store-files' });
    await fastify.register(import('./v1/operation.js'), { prefix: '/operation' });
    await fastify.register(import('./v1/approval.js'), { prefix: '/approval' });
    await fastify.register(import('./v1/basic-data.js'), { prefix: '/basic-data' });
    await fastify.register(import('./v1/system.js'), { prefix: '/system' });
    
  }, { prefix: appConfig.API_PREFIX });
  
  // API info endpoint
  fastify.get(appConfig.API_PREFIX, async (request, reply) => {
    return {
      success: true,
      message: '好饭碗门店生命周期管理系统 API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: `${appConfig.API_PREFIX}/auth`,
        users: `${appConfig.API_PREFIX}/users`,
        storePlans: `${appConfig.API_PREFIX}/store-plans`,
        expansion: `${appConfig.API_PREFIX}/expansion`,
        preparation: `${appConfig.API_PREFIX}/preparation`,
        storeFiles: `${appConfig.API_PREFIX}/store-files`,
        operation: `${appConfig.API_PREFIX}/operation`,
        approval: `${appConfig.API_PREFIX}/approval`,
        basicData: `${appConfig.API_PREFIX}/basic-data`,
        system: `${appConfig.API_PREFIX}/system`,
      },
    };
  });
}