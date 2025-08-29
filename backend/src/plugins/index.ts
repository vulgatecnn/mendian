import type { FastifyInstance } from 'fastify';
import { appConfig } from '@/config/index.js';

export async function registerPlugins(fastify: FastifyInstance): Promise<void> {
  // Security plugins
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  // CORS configuration
  await fastify.register(import('@fastify/cors'), {
    origin: appConfig.CORS_ORIGIN,
    credentials: appConfig.CORS_CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Rate limiting
  await fastify.register(import('@fastify/rate-limit'), {
    max: appConfig.RATE_LIMIT_MAX,
    timeWindow: appConfig.RATE_LIMIT_WINDOW_MS,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // Multipart support for file uploads
  await fastify.register(import('@fastify/multipart'), {
    limits: {
      fileSize: appConfig.UPLOAD_MAX_FILE_SIZE,
      files: 10,
    },
  });

  // Sensible defaults and utilities
  await fastify.register(import('@fastify/sensible'));

  // Health monitoring
  await fastify.register(import('@fastify/under-pressure'), {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100000000,
    maxRssBytes: 100000000,
    maxEventLoopUtilization: 0.98,
    message: 'Under pressure!',
    retryAfter: 50,
  });

  // JWT authentication
  await fastify.register(import('@fastify/jwt'), {
    secret: appConfig.JWT_SECRET,
    sign: {
      expiresIn: appConfig.JWT_EXPIRES_IN,
    },
    verify: {
      extractToken: (request) => {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.slice(7);
        }
        return null;
      },
    },
  });

  // Redis connection
  await fastify.register(import('@fastify/redis'), {
    host: appConfig.REDIS_HOST,
    port: appConfig.REDIS_PORT,
    ...(appConfig.REDIS_PASSWORD && { password: appConfig.REDIS_PASSWORD }),
    db: appConfig.REDIS_DB,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  // Swagger documentation
  if (appConfig.SWAGGER_ENABLED) {
    await fastify.register(import('@fastify/swagger'), {
      openapi: {
        info: {
          title: appConfig.SWAGGER_TITLE,
          description: appConfig.SWAGGER_DESCRIPTION,
          version: appConfig.SWAGGER_VERSION,
        },
        servers: [
          {
            url: `http://localhost:${appConfig.PORT}`,
            description: 'Development server',
          },
        ],
        tags: [
          { name: 'auth', description: '认证相关接口' },
          { name: 'store-plan', description: '开店计划管理' },
          { name: 'expansion', description: '拓店管理' },
          { name: 'preparation', description: '开店筹备管理' },
          { name: 'store-files', description: '门店档案' },
          { name: 'operation', description: '门店运营' },
          { name: 'approval', description: '审批中心' },
          { name: 'basic-data', description: '基础数据' },
          { name: 'system', description: '系统管理' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    });

    await fastify.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      staticCSP: true,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      transformStaticCSP: (header) => header,
    });
  }

  // Database connection (Prisma will be initialized in database service)
  await fastify.register(import('./database.js'));
  
  // Authentication plugin
  await fastify.register(import('./auth.js'));
  
  // Business plugins
  await fastify.register(import('./validation.js'));
}