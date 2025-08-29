/**
 * 企业微信集成相关类型定义
 */

/**
 * 企业微信配置信息
 */
export interface WeChatConfig {
  /** 企业微信应用ID */
  corpId: string
  /** 应用AgentId */
  agentId: string
  /** 应用Secret (后端使用) */
  secret?: string
  /** 回调地址 */
  redirectUri: string
  /** 应用可见范围 */
  scope: string
  /** 状态参数 */
  state?: string
}

/**
 * 企业微信JS-SDK配置信息
 */
export interface WeChatJSConfig {
  /** 开启调试模式 */
  debug: boolean
  /** 必填，企业微信的corpId */
  corpId: string
  /** 必填，生成签名的时间戳 */
  timestamp: string
  /** 必填，生成签名的随机串 */
  nonceStr: string
  /** 必填，签名 */
  signature: string
  /** 必填，需要使用的JS接口列表 */
  jsApiList: string[]
  /** 选填，需要使用的开放标签列表 */
  openTagList?: string[]
}

/**
 * 企业微信用户信息
 */
export interface WeChatUserInfo {
  /** 成员UserID */
  userid: string
  /** 成员名称 */
  name: string
  /** 成员部门列表 */
  department: number[]
  /** 部门内的排序值 */
  order?: number[]
  /** 职务信息 */
  position?: string
  /** 手机号码 */
  mobile?: string
  /** 性别 */
  gender?: '1' | '2' | '0' // 1表示男性，2表示女性，0表示未定义
  /** 邮箱 */
  email?: string
  /** 企业邮箱 */
  biz_mail?: string
  /** 头像url */
  avatar?: string
  /** 头像缩略图url */
  thumb_avatar?: string
  /** 座机 */
  telephone?: string
  /** 别名 */
  alias?: string
  /** 地址 */
  address?: string
  /** 扩展属性 */
  extattr?: {
    attrs: Array<{
      type: 0 | 1 // 0-文本 1-网页
      name: string
      text?: {
        value: string
      }
      web?: {
        url: string
        title: string
      }
    }>
  }
  /** 激活状态: 1=已激活，2=已禁用，4=未激活，5=退出企业 */
  status?: 1 | 2 | 4 | 5
  /** 员工个人二维码 */
  qr_code?: string
  /** 成员对外属性 */
  external_profile?: {
    external_corp_name?: string
    wechat_channels?: {
      nickname?: string
      status?: 1 | 2 // 1-已认证 2-未认证
    }
    external_attr?: Array<{
      type: 0 | 1 | 2 // 0-文本 1-网页 2-小程序
      name: string
      text?: {
        value: string
      }
      web?: {
        url: string
        title: string
      }
      miniprogram?: {
        appid: string
        pagepath: string
        title: string
      }
    }>
  }
  /** 主部门 */
  main_department?: number
  /** 是否为上级 */
  is_leader_in_dept?: number[]
  /** 直属上级UserID */
  direct_leader?: string[]
}

/**
 * 企业微信部门信息
 */
export interface WeChatDepartment {
  /** 部门id */
  id: number
  /** 部门名称 */
  name: string
  /** 英文名称 */
  name_en?: string
  /** 父亲部门id */
  parentid: number
  /** 在父部门中的次序值 */
  order: number
  /** 部门负责人的UserID */
  department_leader?: string[]
}

/**
 * 企业微信授权响应
 */
export interface WeChatAuthResponse {
  /** 授权码 */
  code: string
  /** 状态参数 */
  state: string
  /** 用户信息 */
  userInfo?: WeChatUserInfo
}

/**
 * 企业微信API响应基础结构
 */
export interface WeChatApiResponse<T = any> {
  /** 错误码 */
  errcode: number
  /** 错误信息 */
  errmsg: string
  /** 响应数据 */
  data?: T
}

/**
 * 企业微信Token响应
 */
export interface WeChatTokenResponse extends WeChatApiResponse {
  /** 获取到的凭证 */
  access_token: string
  /** 凭证的有效时间（秒） */
  expires_in: number
}

/**
 * 企业微信用户详情响应
 */
export interface WeChatUserDetailResponse extends WeChatApiResponse {
  /** 用户详细信息 */
  data: WeChatUserInfo
}

/**
 * 企业微信部门列表响应
 */
export interface WeChatDepartmentListResponse extends WeChatApiResponse {
  /** 部门列表 */
  department: WeChatDepartment[]
}

/**
 * 企业微信环境检测结果
 */
export interface WeChatEnvironment {
  /** 是否在企业微信客户端中 */
  isWeChatWork: boolean
  /** 是否在移动端 */
  isMobile: boolean
  /** 是否支持JS-SDK */
  supportJSSDK: boolean
  /** 用户代理信息 */
  userAgent: string
  /** 设备信息 */
  device: {
    type: 'mobile' | 'desktop'
    os: string
    browser: string
    version: string
  }
}

/**
 * 企业微信分享内容
 */
export interface WeChatShareContent {
  /** 分享标题 */
  title: string
  /** 分享描述 */
  desc: string
  /** 分享链接 */
  link: string
  /** 分享图标 */
  imgUrl: string
}

/**
 * 企业微信地理位置信息
 */
export interface WeChatLocation {
  /** 纬度 */
  latitude: number
  /** 经度 */
  longitude: number
  /** 速度，以米/每秒计 */
  speed: number
  /** 位置精度 */
  accuracy: number
}

/**
 * 企业微信拍照或选择图片配置
 */
export interface WeChatImageConfig {
  /** 照片数量 */
  count: number
  /** 图片类型 */
  sizeType: ('original' | 'compressed')[]
  /** 图片来源 */
  sourceType: ('album' | 'camera')[]
}

/**
 * 企业微信联系人选择配置
 */
export interface WeChatContactConfig {
  /** 选择模式 */
  mode: 'single' | 'multi'
  /** 选择类型 */
  type: ('user' | 'department')[]
  /** 选中状态的用户列表 */
  selectedUserList?: string[]
  /** 选中状态的部门列表 */
  selectedDepartmentList?: number[]
}

/**
 * 企业微信状态管理
 */
export interface WeChatState {
  /** 是否已初始化 */
  initialized: boolean
  /** 是否已配置 */
  configured: boolean
  /** 是否已授权 */
  authorized: boolean
  /** 当前用户信息 */
  currentUser: WeChatUserInfo | null
  /** 部门列表 */
  departments: WeChatDepartment[]
  /** 环境信息 */
  environment: WeChatEnvironment | null
  /** 配置信息 */
  config: WeChatConfig | null
  /** 错误信息 */
  error: string | null
  /** 是否正在加载 */
  loading: boolean
}

/**
 * 企业微信事件类型
 */
export type WeChatEventType = 
  | 'ready'           // SDK准备就绪
  | 'error'           // SDK发生错误
  | 'authSuccess'     // 授权成功
  | 'authFailed'      // 授权失败
  | 'userInfoLoaded'  // 用户信息加载完成
  | 'departmentLoaded' // 部门信息加载完成
  | 'shareSuccess'    // 分享成功
  | 'shareFailed'     // 分享失败
  | 'locationSuccess' // 获取位置成功
  | 'locationFailed'  // 获取位置失败
  | 'imageSuccess'    // 选择图片成功
  | 'imageFailed'     // 选择图片失败
  | 'contactSuccess'  // 选择联系人成功
  | 'contactFailed'   // 选择联系人失败

/**
 * 企业微信事件数据
 */
export interface WeChatEventData<T = any> {
  /** 事件类型 */
  type: WeChatEventType
  /** 事件数据 */
  data: T
  /** 时间戳 */
  timestamp: number
  /** 错误信息（如果有） */
  error?: string
}

/**
 * 企业微信回调函数类型
 */
export type WeChatCallback<T = any> = (result: T) => void
export type WeChatErrorCallback = (error: Error) => void
export type WeChatEventCallback<T = any> = (event: WeChatEventData<T>) => void