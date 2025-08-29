/**
 * 企业微信配置示例文件
 * 使用前请复制为 wechat.ts 并填入真实配置信息
 */

import type { WeChatConfig } from '../types/wechat'

/**
 * 企业微信应用配置
 * 请在企业微信管理后台获取相关信息
 */
export const weChatConfig: WeChatConfig = {
  // 企业ID - 在企业微信管理后台的"我的企业"页面可以查看
  corpId: 'wx1234567890abcdef',
  
  // 应用的AgentId - 在应用管理页面可以查看
  agentId: '1000001',
  
  // 应用的Secret - 在应用管理页面可以查看（注意保密）
  secret: 'your_secret_here',
  
  // OAuth2授权后的回调地址
  redirectUri: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com/auth/wechat/callback'
    : 'http://localhost:7000/auth/wechat/callback',
  
  // 应用授权作用域
  scope: 'snsapi_base',
  
  // 自定义状态参数（可选）
  state: 'STATE_' + Date.now()
}

/**
 * 环境相关配置
 */
export const weChatEnvConfig = {
  // 开发环境配置
  development: {
    ...weChatConfig,
    corpId: 'wx_dev_corp_id',
    agentId: 'dev_agent_id',
    redirectUri: 'http://localhost:7000/auth/wechat/callback'
  },
  
  // 测试环境配置
  testing: {
    ...weChatConfig,
    corpId: 'wx_test_corp_id', 
    agentId: 'test_agent_id',
    redirectUri: 'https://test.your-domain.com/auth/wechat/callback'
  },
  
  // 生产环境配置
  production: {
    ...weChatConfig,
    corpId: 'wx_prod_corp_id',
    agentId: 'prod_agent_id', 
    redirectUri: 'https://your-domain.com/auth/wechat/callback'
  }
}

/**
 * 根据环境获取配置
 */
export function getWeChatConfig(): WeChatConfig {
  const env = process.env.NODE_ENV as keyof typeof weChatEnvConfig
  return weChatEnvConfig[env] || weChatEnvConfig.development
}

/**
 * 企业微信JS-SDK配置
 */
export const jsSDKConfig = {
  // 是否开启调试模式
  debug: process.env.NODE_ENV === 'development',
  
  // 需要使用的JS接口列表
  jsApiList: [
    'checkJsApi',           // 判断当前客户端版本是否支持指定JS接口
    'onMenuShareTimeline',  // 分享到朋友圈
    'onMenuShareAppMessage',// 分享给朋友
    'onMenuShareQQ',        // 分享到QQ
    'onMenuShareWeibo',     // 分享到腾讯微博
    'hideMenuItems',        // 隐藏功能按钮
    'showMenuItems',        // 显示功能按钮
    'hideAllNonBaseMenuItem',// 隐藏所有非基础按钮
    'showAllNonBaseMenuItem',// 显示所有功能按钮
    'translateVoice',       // 识别音频并返回识别的结果
    'startRecord',          // 开始录音
    'stopRecord',           // 停止录音
    'playVoice',            // 播放语音
    'pauseVoice',           // 暂停播放
    'stopVoice',            // 停止播放
    'uploadVoice',          // 上传语音
    'downloadVoice',        // 下载语音
    'chooseImage',          // 拍照或从手机相册中选图
    'previewImage',         // 预览图片
    'uploadImage',          // 上传图片
    'downloadImage',        // 下载图片
    'getNetworkType',       // 获取网络状态
    'openLocation',         // 使用微信内置地图查看位置
    'getLocation',          // 获取地理位置
    'hideOptionMenu',       // 隐藏右上角菜单
    'showOptionMenu',       // 显示右上角菜单
    'closeWindow',          // 关闭当前网页窗口
    'scanQRCode',           // 扫一扫
    'chooseWXPay',          // 发起一个微信支付请求
    'openProductSpecificView', // 跳转微信商品页
    'addCard',              // 批量添加卡券
    'chooseCard',           // 拉取适用卡券列表并获取用户选择信息
    'openCard'              // 查看微信卡包中的卡券
  ],
  
  // 需要使用的开放标签列表（可选）
  openTagList: []
}

/**
 * 企业微信菜单配置
 */
export const weChatMenuConfig = {
  button: [
    {
      type: 'view',
      name: '门店管理',
      url: 'https://your-domain.com/stores'
    },
    {
      name: '业务功能',
      sub_button: [
        {
          type: 'view',
          name: '开店计划',
          url: 'https://your-domain.com/plans'
        },
        {
          type: 'view', 
          name: '拓店管理',
          url: 'https://your-domain.com/expansion'
        },
        {
          type: 'view',
          name: '门店档案',
          url: 'https://your-domain.com/files'
        }
      ]
    },
    {
      name: '系统工具',
      sub_button: [
        {
          type: 'view',
          name: '数据报表',
          url: 'https://your-domain.com/reports'
        },
        {
          type: 'click',
          name: '系统帮助',
          key: 'HELP'
        }
      ]
    }
  ]
}

/**
 * 企业微信消息模板配置
 */
export const messageTemplates = {
  // 审批通知模板
  approvalNotice: {
    msgtype: 'textcard',
    textcard: {
      title: '审批通知',
      description: '您有新的审批任务需要处理',
      url: 'https://your-domain.com/approvals',
      btntxt: '立即处理'
    }
  },
  
  // 门店开业通知模板
  storeOpenNotice: {
    msgtype: 'news',
    news: {
      articles: [
        {
          title: '门店开业通知',
          description: '恭喜新店开业！',
          url: 'https://your-domain.com/stores/new',
          picurl: 'https://your-domain.com/images/store-open.jpg'
        }
      ]
    }
  },
  
  // 任务提醒模板
  taskReminder: {
    msgtype: 'markdown',
    markdown: {
      content: `## 任务提醒
      
您有以下任务需要完成：
> **任务名称**：{{taskName}}
> **截止时间**：{{deadline}}
> **任务描述**：{{description}}

请及时处理，点击[这里]({{taskUrl}})查看详情。`
    }
  }
}

/**
 * 企业微信API端点配置
 */
export const apiEndpoints = {
  // 获取access_token
  getToken: '/cgi-bin/gettoken',
  
  // 用户相关
  getUserInfo: '/cgi-bin/user/get',
  getDepartmentUsers: '/cgi-bin/user/simplelist',
  
  // 部门相关
  getDepartments: '/cgi-bin/department/list',
  
  // 消息发送
  sendMessage: '/cgi-bin/message/send',
  
  // 媒体文件
  uploadMedia: '/cgi-bin/media/upload',
  getMedia: '/cgi-bin/media/get',
  
  // 应用管理
  getApp: '/cgi-bin/agent/get',
  setApp: '/cgi-bin/agent/set',
  
  // 菜单管理
  createMenu: '/cgi-bin/menu/create',
  getMenu: '/cgi-bin/menu/get',
  deleteMenu: '/cgi-bin/menu/delete'
}

/**
 * 使用说明
 */
export const usageInstructions = `
# 企业微信集成配置说明

## 1. 基础配置
1. 复制此文件为 wechat.ts
2. 在企业微信管理后台获取 corpId 和 agentId
3. 设置正确的回调地址
4. 配置应用的可见范围和权限

## 2. 应用设置
1. 登录企业微信管理后台
2. 进入"应用管理" -> "自建应用"
3. 创建新应用或编辑现有应用
4. 记录 AgentId 和 Secret
5. 设置应用可见范围
6. 配置回调域名

## 3. 网络配置
1. 将回调域名添加到企业微信的可信域名列表
2. 确保域名支持HTTPS（生产环境必须）
3. 配置CORS允许企业微信域名

## 4. 权限配置
1. 根据业务需求选择所需的API权限
2. 配置用户授权范围
3. 设置应用在工作台的显示

## 5. 安全注意事项
1. Secret 信息不要提交到版本控制系统
2. 使用环境变量管理敏感信息
3. 定期更新 Secret
4. 监控 API 调用频率避免超限

## 6. 测试验证
1. 在企业微信客户端中测试登录功能
2. 验证JS-SDK接口调用
3. 测试消息发送和接收
4. 检查权限控制是否正常

## 7. 常见问题
- invalid corpid: 检查 corpId 是否正确
- invalid agent: 检查 agentId 和应用权限
- redirect_uri 参数错误: 检查回调地址配置
- 签名错误: 检查 timestamp、nonceStr 和 signature
`