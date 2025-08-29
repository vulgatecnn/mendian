/**
 * 企业微信API服务
 * WeChat Work API Service
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { wechatConfig, wechatApiConfig } from '../config/wechat.config.js';
import { redisService } from './redis.service.js';
import { logger } from '../utils/logger.js';

export interface WeChatAccessToken {
  access_token: string;
  expires_in: number;
}

export interface WeChatUserInfo {
  errcode: number;
  errmsg: string;
  UserId?: string;
  OpenId?: string;
  DeviceId?: string;
  user_ticket?: string;
}

export interface WeChatUserDetail {
  errcode: number;
  errmsg: string;
  userid: string;
  name: string;
  department: number[];
  position?: string;
  mobile?: string;
  gender: string;
  email?: string;
  avatar?: string;
  thumb_avatar?: string;
  telephone?: string;
  address?: string;
  open_userid?: string;
  main_department?: number;
}

export interface WeChatDepartment {
  id: number;
  name: string;
  name_en?: string;
  parentid: number;
  order: number;
}

export interface WeChatDepartmentList {
  errcode: number;
  errmsg: string;
  department: WeChatDepartment[];
}

export interface WeChatUserList {
  errcode: number;
  errmsg: string;
  userlist: WeChatUserDetail[];
}

class WeChatWorkService {
  private client: AxiosInstance;
  private readonly cachePrefix = 'wechat:';

  constructor() {
    this.client = axios.create({
      baseURL: wechatConfig.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MendianSystem/1.0'
      }
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`WeChat API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('WeChat API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.info(`WeChat API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('WeChat API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取企业微信Access Token
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = `${this.cachePrefix}access_token`;
    
    try {
      // 先从缓存获取
      const cachedToken = await redisService.get(cacheKey);
      if (cachedToken) {
        logger.info('Retrieved WeChat access token from cache');
        return cachedToken;
      }

      // 从API获取
      const response = await this.client.get<WeChatAccessToken>(
        wechatApiConfig.endpoints.getToken,
        {
          params: {
            corpid: wechatConfig.corpId,
            corpsecret: wechatConfig.secret
          }
        }
      );

      const { access_token, expires_in } = response.data;
      
      if (!access_token) {
        throw new Error('Failed to get access token from WeChat API');
      }

      // 缓存token
      await redisService.setex(
        cacheKey,
        wechatApiConfig.cache.tokenTtl,
        access_token
      );

      logger.info('Retrieved new WeChat access token from API');
      return access_token;

    } catch (error) {
      logger.error('Failed to get WeChat access token:', error);
      throw new Error('Unable to authenticate with WeChat Work API');
    }
  }

  /**
   * 通过OAuth code获取用户信息
   */
  async getUserInfoByCode(code: string): Promise<WeChatUserInfo> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await this.client.get<WeChatUserInfo>(
        wechatApiConfig.endpoints.getOAuthUserInfo,
        {
          params: {
            access_token: accessToken,
            code
          }
        }
      );

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to get user info by code:', error);
      throw error;
    }
  }

  /**
   * 获取用户详细信息
   */
  async getUserDetail(userId: string): Promise<WeChatUserDetail> {
    const cacheKey = `${this.cachePrefix}user:${userId}`;
    
    try {
      // 先从缓存获取
      const cachedUser = await redisService.get(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      const accessToken = await this.getAccessToken();
      
      const response = await this.client.get<WeChatUserDetail>(
        wechatApiConfig.endpoints.getUserInfo,
        {
          params: {
            access_token: accessToken,
            userid: userId
          }
        }
      );

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      // 缓存用户信息
      await redisService.setex(
        cacheKey,
        wechatApiConfig.cache.userInfoTtl,
        JSON.stringify(response.data)
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to get user detail for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 获取部门列表
   */
  async getDepartmentList(): Promise<WeChatDepartment[]> {
    const cacheKey = `${this.cachePrefix}departments`;
    
    try {
      // 先从缓存获取
      const cachedDepts = await redisService.get(cacheKey);
      if (cachedDepts) {
        return JSON.parse(cachedDepts);
      }

      const accessToken = await this.getAccessToken();
      
      const response = await this.client.get<WeChatDepartmentList>(
        wechatApiConfig.endpoints.getDepartmentList,
        {
          params: {
            access_token: accessToken
          }
        }
      );

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      const departments = response.data.department;

      // 缓存部门信息
      await redisService.setex(
        cacheKey,
        wechatApiConfig.cache.departmentTtl,
        JSON.stringify(departments)
      );

      return departments;
    } catch (error) {
      logger.error('Failed to get department list:', error);
      throw error;
    }
  }

  /**
   * 获取部门用户列表
   */
  async getDepartmentUsers(departmentId: number, fetchChild: boolean = true): Promise<WeChatUserDetail[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await this.client.get<WeChatUserList>(
        wechatApiConfig.endpoints.getDepartmentUsers,
        {
          params: {
            access_token: accessToken,
            department_id: departmentId,
            fetch_child: fetchChild ? 1 : 0
          }
        }
      );

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      return response.data.userlist;
    } catch (error) {
      logger.error(`Failed to get users for department ${departmentId}:`, error);
      throw error;
    }
  }

  /**
   * 批量获取所有用户（用于全量同步）
   */
  async getAllUsers(): Promise<WeChatUserDetail[]> {
    try {
      const departments = await this.getDepartmentList();
      const allUsers: WeChatUserDetail[] = [];
      const processedUserIds = new Set<string>();

      for (const dept of departments) {
        try {
          const users = await this.getDepartmentUsers(dept.id, false);
          
          // 去重处理
          for (const user of users) {
            if (!processedUserIds.has(user.userid)) {
              allUsers.push(user);
              processedUserIds.add(user.userid);
            }
          }

          // 添加延时避免频率限制
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`Failed to get users for department ${dept.name}:`, error);
          continue;
        }
      }

      logger.info(`Retrieved ${allUsers.length} users from WeChat Work`);
      return allUsers;
    } catch (error) {
      logger.error('Failed to get all users:', error);
      throw error;
    }
  }

  /**
   * 清除缓存
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern || `${this.cachePrefix}*`;
      const keys = await redisService.keys(searchPattern);
      
      if (keys.length > 0) {
        await redisService.del(...keys);
        logger.info(`Cleared ${keys.length} WeChat cache entries`);
      }
    } catch (error) {
      logger.error('Failed to clear WeChat cache:', error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      logger.error('WeChat Work service health check failed:', error);
      return false;
    }
  }
}

export const wechatWorkService = new WeChatWorkService();
export default wechatWorkService;