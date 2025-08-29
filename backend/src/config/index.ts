import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(7100),
  API_PREFIX: z.string().default('/api/v1'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_TEST: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // WeChat Work
  WECHAT_WORK_CORP_ID: z.string().min(1, 'WECHAT_WORK_CORP_ID is required'),
  WECHAT_WORK_CORP_SECRET: z.string().min(1, 'WECHAT_WORK_CORP_SECRET is required'),
  WECHAT_WORK_AGENT_ID: z.string().min(1, 'WECHAT_WORK_AGENT_ID is required'),
  WECHAT_WORK_REDIRECT_URI: z.string().url('Invalid WECHAT_WORK_REDIRECT_URI'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(8).max(15).default(12),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:7000'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // File Upload
  UPLOAD_MAX_FILE_SIZE: z.coerce.number().default(10485760), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),

  // Swagger
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  SWAGGER_TITLE: z.string().default('好饭碗门店生命周期管理系统 API'),
  SWAGGER_VERSION: z.string().default('1.0.0'),
  SWAGGER_DESCRIPTION: z.string().default('Enterprise Store Lifecycle Management System API'),
});

const parseConfig = (): z.infer<typeof configSchema> => {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Invalid environment configuration:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
};

export const appConfig = parseConfig();

export const isDevelopment = appConfig.NODE_ENV === 'development';
export const isProduction = appConfig.NODE_ENV === 'production';
export const isTest = appConfig.NODE_ENV === 'test';

export default appConfig;