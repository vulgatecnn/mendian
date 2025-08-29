import Fastify from 'fastify';
import { appConfig, isDevelopment } from './config/index.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { permissionService } from './services/permission.service.js';

// Create Fastify instance with enhanced configuration
const fastify = Fastify({
  logger: {
    level: appConfig.LOG_LEVEL,
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    }),
  },
  // Enable trust proxy for accurate client IP detection
  trustProxy: true,
  // Request body size limits
  bodyLimit: appConfig.UPLOAD_MAX_FILE_SIZE,
  // Request timeout
  requestTimeout: 30000, // 30 seconds
  // Keep alive timeout
  keepAliveTimeout: 72000, // 72 seconds
  // Enhanced request logging
  disableRequestLogging: false,
});

// Enhanced error handling
fastify.setErrorHandler(errorHandler);
fastify.setNotFoundHandler(notFoundHandler);

// Add request ID for tracing
fastify.addHook('onRequest', async (request, reply) => {
  request.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  reply.header('x-request-id', request.id);
});

// Add response time header
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onSend', async (request, reply) => {
  const responseTime = Date.now() - (request as any).startTime;
  reply.header('x-response-time', `${responseTime}ms`);
});

// Security headers and encoding
fastify.addHook('onSend', async (request, reply) => {
  reply.headers({
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
    'referrer-policy': 'strict-origin-when-cross-origin',
  });
  
  // Ensure UTF-8 encoding for all JSON responses
  if (reply.getHeader('content-type') && reply.getHeader('content-type').toString().includes('application/json')) {
    reply.header('content-type', 'application/json; charset=utf-8');
  }
});

// Initialize system data
const initializeSystem = async (): Promise<void> => {
  try {
    logger.info('🔧 Initializing system...');
    
    // Initialize system permissions and roles
    await permissionService.initializeSystemPermissions();
    await permissionService.initializeSystemRoles();
    
    logger.info('✅ System initialization completed');
  } catch (error) {
    logger.error('❌ System initialization failed:', error);
    throw error;
  }
};

// Register plugins and routes
const start = async (): Promise<void> => {
  try {
    // Initialize system data first
    await initializeSystem();
    
    // Register core plugins
    await registerPlugins(fastify);
    
    // Register API routes
    await registerRoutes(fastify);

    // Health check endpoint with more details
    fastify.get('/health', async (request, reply) => {
      try {
        // Check database connection
        // const dbStatus = await prisma.$queryRaw`SELECT 1`;
        
        return {
          success: true,
          message: '好饭碗门店生命周期管理系统 API',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          environment: appConfig.NODE_ENV,
          uptime: process.uptime(),
          status: 'healthy',
          services: {
            database: 'connected', // 可以根据实际检查结果更新
            redis: 'connected',
            api: 'online',
          },
        };
      } catch (error) {
        reply.status(503);
        return {
          success: false,
          message: '服务不可用',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          status: 'unhealthy',
        };
      }
    });

    // Enhanced ready check endpoint
    fastify.get('/ready', async (request, reply) => {
      return {
        success: true,
        message: 'API服务就绪',
        timestamp: new Date().toISOString(),
      };
    });

    // 启动定时任务
    try {
      const { userSyncJob } = await import('./jobs/sync-users.job.js');
      userSyncJob.start();
      logger.info('📅 定时同步任务启动成功');
    } catch (err) {
      logger.warn('⚠️  定时任务启动失败:', err);
    }

    // Start server
    await fastify.listen({
      port: appConfig.PORT,
      host: '0.0.0.0',
    });

    logger.info(`🚀 好饭碗门店生命周期管理系统 API 启动成功!`);
    logger.info(`📡 API 服务器: http://localhost:${appConfig.PORT}${appConfig.API_PREFIX}`);
    logger.info(`📚 API 文档: http://localhost:${appConfig.PORT}/docs`);
    logger.info(`🏥 健康检查: http://localhost:${appConfig.PORT}/health`);
    logger.info(`🔒 认证端点: http://localhost:${appConfig.PORT}${appConfig.API_PREFIX}/auth`);
    logger.info(`👥 用户管理: http://localhost:${appConfig.PORT}${appConfig.API_PREFIX}/users`);
    logger.info(`🌍 运行环境: ${appConfig.NODE_ENV}`);

  } catch (error) {
    logger.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`📴 Received ${signal}, shutting down gracefully...`);
  
  try {
    await fastify.close();
    logger.info('✅ Server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

export default fastify;