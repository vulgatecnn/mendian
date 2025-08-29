import Redis from 'ioredis';
import { appConfig } from '@/config/index.js';
import { logger } from '@/utils/logger.js';

class RedisService {
  private client: Redis;
  
  constructor() {
    this.client = new Redis({
      host: appConfig.REDIS_HOST,
      port: appConfig.REDIS_PORT,
      password: appConfig.REDIS_PASSWORD || undefined,
      db: appConfig.REDIS_DB,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      logger.error('❌ Redis connection error:', error);
    });
  }

  // 获取Redis实例
  getClient(): Redis {
    return this.client;
  }

  // 设置用户会话
  async setUserSession(userId: string, token: string, refreshToken: string): Promise<void> {
    const sessionKey = `session:${userId}`;
    const sessionData = {
      token,
      refreshToken,
      createdAt: new Date().toISOString(),
    };

    await this.client.setex(sessionKey, 7 * 24 * 60 * 60, JSON.stringify(sessionData)); // 7天
  }

  // 获取用户会话
  async getUserSession(userId: string): Promise<{ token: string; refreshToken: string; createdAt: string } | null> {
    const sessionKey = `session:${userId}`;
    const sessionData = await this.client.get(sessionKey);
    
    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData);
  }

  // 删除用户会话
  async deleteUserSession(userId: string): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.client.del(sessionKey);
  }

  // 添加令牌到黑名单
  async addTokenToBlacklist(token: string, ttl: number = 7 * 24 * 60 * 60): Promise<void> {
    const blacklistKey = `blacklist:${token}`;
    await this.client.setex(blacklistKey, ttl, 'true');
  }

  // 检查令牌是否在黑名单中
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = `blacklist:${token}`;
    const result = await this.client.get(blacklistKey);
    return result === 'true';
  }

  // 缓存企业微信访问令牌
  async setCacheWeChatAccessToken(token: string, ttl: number = 7200): Promise<void> {
    const key = 'wechat:access_token';
    await this.client.setex(key, ttl, token);
  }

  // 获取缓存的企业微信访问令牌
  async getCachedWeChatAccessToken(): Promise<string | null> {
    const key = 'wechat:access_token';
    return await this.client.get(key);
  }

  // 设置API频率限制
  async setRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, window);
    }
    
    return current <= limit;
  }

  // 缓存数据
  async cache(key: string, data: any, ttl: number = 300): Promise<void> {
    await this.client.setex(key, ttl, JSON.stringify(data));
  }

  // 获取缓存数据
  async getCache<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    
    if (!data) {
      return null;
    }
    
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to parse cached data:', error);
      return null;
    }
  }

  // 删除缓存
  async deleteCache(key: string): Promise<void> {
    await this.client.del(key);
  }

  // 批量删除缓存
  async deleteCacheByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // 设置分布式锁
  async acquireLock(key: string, ttl: number = 30): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.client.set(lockKey, 'locked', 'EX', ttl, 'NX');
    return result === 'OK';
  }

  // 释放分布式锁
  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.client.del(lockKey);
  }

  // 关闭连接
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}

export const redisService = new RedisService();
export default redisService;