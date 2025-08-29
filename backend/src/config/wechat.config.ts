/**
 * 企业微信配置管理
 * WeChat Work Configuration Management
 */

export interface WeChatWorkConfig {
  corpId: string;
  agentId: string;
  secret: string;
  baseUrl: string;
  redirectUri: string;
  scope: string;
  state: string;
}

export const wechatConfig: WeChatWorkConfig = {
  corpId: process.env.WECHAT_WORK_CORP_ID || '',
  agentId: process.env.WECHAT_WORK_AGENT_ID || '',
  secret: process.env.WECHAT_WORK_CORP_SECRET || '',
  baseUrl: 'https://qyapi.weixin.qq.com',
  redirectUri: process.env.WECHAT_WORK_REDIRECT_URI || 'http://localhost:7100/api/v1/auth/wechat/callback',
  scope: 'snsapi_base',
  state: 'mendian_auth'
};

export const wechatApiConfig = {
  // API端点
  endpoints: {
    getToken: '/cgi-bin/gettoken',
    getUserInfo: '/cgi-bin/user/get',
    getDepartmentList: '/cgi-bin/department/list',
    getDepartmentUsers: '/cgi-bin/user/list',
    getOAuthUserInfo: '/cgi-bin/user/getuserinfo',
    getContactWayUrl: '/cgi-bin/service/get_contact_way'
  },
  
  // 缓存配置
  cache: {
    tokenTtl: 7000, // access_token有效期7200秒，提前200秒刷新
    userInfoTtl: 3600, // 用户信息缓存1小时
    departmentTtl: 1800 // 部门信息缓存30分钟
  },
  
  // 重试配置
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2
  }
};

/**
 * 获取企业微信OAuth授权URL
 */
export function getWeChatOAuthUrl(): string {
  const { corpId, redirectUri, scope, state } = wechatConfig;
  const params = new URLSearchParams({
    appid: corpId,
    redirect_uri: encodeURIComponent(redirectUri),
    response_type: 'code',
    scope,
    state
  });
  
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

/**
 * 验证企业微信配置是否完整
 */
export function validateWeChatConfig(): boolean {
  const { corpId, agentId, secret } = wechatConfig;
  return !!(corpId && agentId && secret);
}

export default wechatConfig;