import axios from 'axios';
import { appConfig } from '@/config/index.js';
import { UnauthorizedError, BadRequestError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';

export interface WeChatWorkUser {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  departmentId?: string;
}

export interface WeChatWorkDepartment {
  id: string;
  name: string;
  parentId?: string;
  order: number;
}

export const weChatWorkService = {
  // 获取访问令牌
  getAccessToken: async (): Promise<string> => {
    try {
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/gettoken', {
        params: {
          corpid: appConfig.WECHAT_WORK_CORP_ID,
          corpsecret: appConfig.WECHAT_WORK_CORP_SECRET,
        },
      });

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to get WeChat Work access token:', error);
      throw new BadRequestError('获取企业微信访问令牌失败');
    }
  },

  // 通过code获取用户ID
  getUserIdByCode: async (code: string): Promise<string> => {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo', {
        params: {
          access_token: accessToken,
          code,
        },
      });

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      if (!response.data.userid) {
        throw new UnauthorizedError('未获取到用户信息');
      }

      return response.data.userid;
    } catch (error) {
      logger.error('Failed to get user ID by code:', error);
      throw new UnauthorizedError('获取用户信息失败');
    }
  },

  // 获取用户详细信息
  getUserDetail: async (userId: string): Promise<WeChatWorkUser> => {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/user/get', {
        params: {
          access_token: accessToken,
          userid: userId,
        },
      });

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      const userData = response.data;
      
      return {
        userId: userData.userid,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        departmentId: userData.main_department?.toString(),
      };
    } catch (error) {
      logger.error('Failed to get user detail:', error);
      throw new BadRequestError('获取用户详细信息失败');
    }
  },

  // 通过OAuth code获取用户信息
  getUserInfo: async (code: string): Promise<WeChatWorkUser> => {
    const userId = await this.getUserIdByCode(code);
    return await this.getUserDetail(userId);
  },

  // 获取部门列表
  getDepartments: async (): Promise<WeChatWorkDepartment[]> => {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/department/list', {
        params: {
          access_token: accessToken,
        },
      });

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      return response.data.department.map((dept: any) => ({
        id: dept.id.toString(),
        name: dept.name,
        parentId: dept.parentid !== 1 ? dept.parentid.toString() : undefined,
        order: dept.order,
      }));
    } catch (error) {
      logger.error('Failed to get departments:', error);
      throw new BadRequestError('获取部门列表失败');
    }
  },

  // 同步部门数据
  syncDepartments: async (): Promise<void> => {
    try {
      const departments = await this.getDepartments();
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // 批量更新部门数据
      for (const dept of departments) {
        await prisma.department.upsert({
          where: { wechatId: dept.id },
          update: {
            name: dept.name,
            parentId: dept.parentId,
          },
          create: {
            wechatId: dept.id,
            name: dept.name,
            parentId: dept.parentId,
            level: dept.parentId ? 2 : 1, // 简化层级计算
          },
        });
      }

      await prisma.$disconnect();
      logger.info('Department synchronization completed');
    } catch (error) {
      logger.error('Failed to sync departments:', error);
      throw error;
    }
  },

  // 获取部门用户列表
  getDepartmentUsers: async (departmentId: string): Promise<string[]> => {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get('https://qyapi.weixin.qq.com/cgi-bin/user/simplelist', {
        params: {
          access_token: accessToken,
          department_id: departmentId,
          fetch_child: 1,
        },
      });

      if (response.data.errcode !== 0) {
        throw new Error(`WeChat API Error: ${response.data.errmsg}`);
      }

      return response.data.userlist.map((user: any) => user.userid);
    } catch (error) {
      logger.error('Failed to get department users:', error);
      throw new BadRequestError('获取部门用户失败');
    }
  },
};