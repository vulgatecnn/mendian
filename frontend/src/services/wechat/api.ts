/**
 * 企业微信API服务
 * 负责企业微信相关的API调用和数据管理
 */

import { httpClient } from '../http'
import type {
  WeChatJSConfig,
  WeChatUserInfo,
  WeChatDepartment,
  WeChatTokenResponse,
  WeChatDepartmentListResponse
} from '../../types/wechat'

import { handleWeChatError, debugLog } from '../../utils/wechat'

/**
 * 企业微信配置请求参数
 */
interface WeChatConfigRequest {
  /** 当前页面URL */
  url: string
  /** 应用AgentId */
  agentId: string
}

/**
 * 部门成员列表请求参数
 */
interface DepartmentUsersRequest {
  /** 部门ID */
  departmentId: number
  /** 是否递归获取子部门成员 */
  fetchChild?: boolean
  /** 页码 */
  page?: number
  /** 页大小 */
  pageSize?: number
}

/**
 * 用户搜索请求参数
 */
interface UserSearchRequest {
  /** 搜索关键词（姓名、手机号、邮箱） */
  keyword?: string
  /** 部门ID列表 */
  departmentIds?: number[]
  /** 用户状态 */
  status?: Array<1 | 2 | 4 | 5>
  /** 页码 */
  page?: number
  /** 页大小 */
  pageSize?: number
}

/**
 * 企业微信通讯录同步请求参数
 */
interface SyncContactRequest {
  /** 是否强制全量同步 */
  fullSync?: boolean
  /** 同步的部门ID列表，为空时同步全部 */
  departmentIds?: number[]
}

/**
 * 通讯录同步结果
 */
interface SyncContactResult {
  /** 同步的用户数量 */
  userCount: number
  /** 同步的部门数量 */
  departmentCount: number
  /** 开始时间 */
  startTime: string
  /** 结束时间 */
  endTime: string
  /** 同步状态 */
  status: 'success' | 'failed' | 'partial'
  /** 错误信息（如果有） */
  errors?: string[]
}

/**
 * 消息发送请求参数
 */
interface SendMessageRequest {
  /** 接收者用户ID列表 */
  toUsers?: string[]
  /** 接收者部门ID列表 */
  toDepartments?: number[]
  /** 接收者标签ID列表 */
  toTags?: number[]
  /** 消息类型 */
  msgType: 'text' | 'image' | 'voice' | 'video' | 'file' | 'textcard' | 'news' | 'markdown'
  /** 消息内容 */
  content: any
  /** 是否是保密消息 */
  safe?: boolean
  /** 是否开启重复消息检查 */
  enableDuplicateCheck?: boolean
  /** 重复消息检查的时间间隔 */
  duplicateCheckInterval?: number
}

/**
 * 企业微信API服务类
 */
export class WeChatApiService {
  /**
   * 获取企业微信JS-SDK配置
   */
  public static async getJSConfig(params: WeChatConfigRequest): Promise<WeChatJSConfig> {
    try {
      debugLog('Getting WeChat JS config', params)
      
      const response = await httpClient.get<WeChatJSConfig>('/wechat/js-config', {
        params
      })

      if (response.success && response.data) {
        debugLog('WeChat JS config retrieved successfully')
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get WeChat JS config')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get JS Config')
    }
  }

  /**
   * 获取企业微信访问令牌（后端使用）
   */
  public static async getAccessToken(): Promise<WeChatTokenResponse> {
    try {
      const response = await httpClient.get<WeChatTokenResponse>('/wechat/access-token')

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get access token')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get Access Token')
    }
  }

  /**
   * 获取用户详细信息
   */
  public static async getUserDetail(userId: string): Promise<WeChatUserInfo> {
    try {
      debugLog('Getting user detail', { userId })
      
      const response = await httpClient.get<WeChatUserInfo>(`/wechat/users/${userId}`)

      if (response.success && response.data) {
        debugLog('User detail retrieved successfully')
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get user detail')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get User Detail')
    }
  }

  /**
   * 获取部门列表
   */
  public static async getDepartments(parentId?: number): Promise<WeChatDepartment[]> {
    try {
      debugLog('Getting departments', { parentId })
      
      const params = parentId ? { parentId } : undefined
      const response = await httpClient.get<WeChatDepartment[]>('/wechat/departments', {
        params
      })

      if (response.success && response.data) {
        debugLog('Departments retrieved successfully', response.data.length)
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get departments')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get Departments')
    }
  }

  /**
   * 获取部门成员列表
   */
  public static async getDepartmentUsers(
    params: DepartmentUsersRequest
  ): Promise<PaginationResponse<WeChatUserInfo>> {
    try {
      debugLog('Getting department users', params)
      
      const response = await httpClient.get<PaginationResponse<WeChatUserInfo>>(
        '/wechat/department-users',
        { params }
      )

      if (response.success && response.data) {
        debugLog('Department users retrieved successfully', response.data.total)
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get department users')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get Department Users')
    }
  }

  /**
   * 搜索用户
   */
  public static async searchUsers(
    params: UserSearchRequest
  ): Promise<PaginationResponse<WeChatUserInfo>> {
    try {
      debugLog('Searching users', params)
      
      const response = await httpClient.get<PaginationResponse<WeChatUserInfo>>(
        '/wechat/users/search',
        { params }
      )

      if (response.success && response.data) {
        debugLog('Users search completed successfully', response.data.total)
        return response.data
      } else {
        throw new Error(response.message || 'Failed to search users')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Search Users')
    }
  }

  /**
   * 同步企业微信通讯录
   */
  public static async syncContacts(params: SyncContactRequest = {}): Promise<SyncContactResult> {
    try {
      debugLog('Syncing WeChat contacts', params)
      
      const response = await httpClient.post<SyncContactResult>('/wechat/sync-contacts', params)

      if (response.success && response.data) {
        debugLog('Contacts sync completed', response.data)
        return response.data
      } else {
        throw new Error(response.message || 'Failed to sync contacts')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Sync Contacts')
    }
  }

  /**
   * 获取通讯录同步状态
   */
  public static async getSyncStatus(): Promise<{
    isRunning: boolean
    lastSyncTime: string | null
    lastResult: SyncContactResult | null
  }> {
    try {
      const response = await httpClient.get<{
        isRunning: boolean
        lastSyncTime: string | null
        lastResult: SyncContactResult | null
      }>('/wechat/sync-status')

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get sync status')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get Sync Status')
    }
  }

  /**
   * 发送企业微信消息
   */
  public static async sendMessage(params: SendMessageRequest): Promise<{
    msgId: string
    invalidUsers?: string[]
    invalidDepartments?: number[]
    invalidTags?: number[]
  }> {
    try {
      debugLog('Sending WeChat message', params)
      
      const response = await httpClient.post<{
        msgId: string
        invalidUsers?: string[]
        invalidDepartments?: number[]
        invalidTags?: number[]
      }>('/wechat/send-message', params)

      if (response.success && response.data) {
        debugLog('Message sent successfully', response.data.msgId)
        return response.data
      } else {
        throw new Error(response.message || 'Failed to send message')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Send Message')
    }
  }

  /**
   * 发送文本消息
   */
  public static async sendTextMessage(
    text: string,
    toUsers?: string[],
    toDepartments?: number[]
  ): Promise<string> {
    const result = await this.sendMessage({
      toUsers: toUsers || [],
      toDepartments: toDepartments || [],
      msgType: 'text',
      content: { content: text }
    })
    return result.msgId
  }

  /**
   * 发送文本卡片消息
   */
  public static async sendTextCardMessage(
    title: string,
    description: string,
    url: string,
    buttonText: string = '详情',
    toUsers?: string[],
    toDepartments?: number[]
  ): Promise<string> {
    const result = await this.sendMessage({
      toUsers: toUsers || [],
      toDepartments: toDepartments || [],
      msgType: 'textcard',
      content: {
        title,
        description,
        url,
        btntxt: buttonText
      }
    })
    return result.msgId
  }

  /**
   * 发送Markdown消息
   */
  public static async sendMarkdownMessage(
    markdown: string,
    toUsers?: string[],
    toDepartments?: number[]
  ): Promise<string> {
    const result = await this.sendMessage({
      toUsers: toUsers || [],
      toDepartments: toDepartments || [],
      msgType: 'markdown',
      content: { content: markdown }
    })
    return result.msgId
  }

  /**
   * 上传临时媒体文件
   */
  public static async uploadMedia(
    file: File,
    type: 'image' | 'voice' | 'video' | 'file'
  ): Promise<{
    mediaId: string
    createdAt: string
  }> {
    try {
      debugLog('Uploading media file', { fileName: file.name, type })
      
      const formData = new FormData()
      formData.append('media', file)
      formData.append('type', type)

      const response = await httpClient.post<{
        mediaId: string
        createdAt: string
      }>('/wechat/upload-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.success && response.data) {
        debugLog('Media uploaded successfully', response.data.mediaId)
        return response.data
      } else {
        throw new Error(response.message || 'Failed to upload media')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Upload Media')
    }
  }

  /**
   * 获取媒体文件信息
   */
  public static async getMediaInfo(mediaId: string): Promise<{
    mediaId: string
    filename: string
    filesize: number
    createdAt: string
  }> {
    try {
      const response = await httpClient.get<{
        mediaId: string
        filename: string
        filesize: number
        createdAt: string
      }>(`/wechat/media/${mediaId}`)

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get media info')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get Media Info')
    }
  }

  /**
   * 获取应用信息
   */
  public static async getAppInfo(agentId: string): Promise<{
    agentId: string
    name: string
    description: string
    squareLogoUrl: string
    roundLogoUrl: string
    allowUserInfos: {
      user: string[]
      party: number[]
      tag: number[]
    }
    allowPartys: {
      partyid: number[]
    }
    allowTags: {
      tagid: number[]
    }
    close: 0 | 1
    redirectDomain: string
    reportLocationFlag: 0 | 1
    isReportenter: 0 | 1
    homeUrl: string
  }> {
    try {
      debugLog('Getting app info', { agentId })
      
      const response = await httpClient.get<{
        agentId: string
        name: string
        description: string
        squareLogoUrl: string
        roundLogoUrl: string
        allowUserInfos: {
          user: string[]
          party: number[]
          tag: number[]
        }
        allowPartys: {
          partyid: number[]
        }
        allowTags: {
          tagid: number[]
        }
        close: 0 | 1
        redirectDomain: string
        reportLocationFlag: 0 | 1
        isReportenter: 0 | 1
        homeUrl: string
      }>(`/wechat/apps/${agentId}`)

      if (response.success && response.data) {
        debugLog('App info retrieved successfully')
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get app info')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get App Info')
    }
  }

  /**
   * 创建应用菜单
   */
  public static async createAppMenu(agentId: string, menu: any): Promise<void> {
    try {
      debugLog('Creating app menu', { agentId, menu })
      
      const response = await httpClient.post<null>(`/wechat/apps/${agentId}/menu`, {
        menu
      })

      if (response.success) {
        debugLog('App menu created successfully')
      } else {
        throw new Error(response.message || 'Failed to create app menu')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Create App Menu')
    }
  }

  /**
   * 获取应用菜单
   */
  public static async getAppMenu(agentId: string): Promise<any> {
    try {
      const response = await httpClient.get<any>(`/wechat/apps/${agentId}/menu`)

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get app menu')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get App Menu')
    }
  }

  /**
   * 删除应用菜单
   */
  public static async deleteAppMenu(agentId: string): Promise<void> {
    try {
      const response = await httpClient.delete<null>(`/wechat/apps/${agentId}/menu`)

      if (response.success) {
        debugLog('App menu deleted successfully')
      } else {
        throw new Error(response.message || 'Failed to delete app menu')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Delete App Menu')
    }
  }

  /**
   * 获取服务商配置信息
   */
  public static async getProviderConfig(): Promise<{
    corpId: string
    providerSecret: string
    token: string
    encodingAESKey: string
  }> {
    try {
      const response = await httpClient.get<{
        corpId: string
        providerSecret: string
        token: string
        encodingAESKey: string
      }>('/wechat/provider-config')

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to get provider config')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Get Provider Config')
    }
  }

  /**
   * 验证企业微信回调URL
   */
  public static async verifyCallback(
    msgSignature: string,
    timestamp: string,
    nonce: string,
    echostr: string
  ): Promise<string> {
    try {
      const response = await httpClient.post<{ echostr: string }>('/wechat/verify-callback', {
        msg_signature: msgSignature,
        timestamp,
        nonce,
        echostr
      })

      if (response.success && response.data) {
        return response.data.echostr
      } else {
        throw new Error(response.message || 'Failed to verify callback')
      }
    } catch (error) {
      throw handleWeChatError(error, 'Verify Callback')
    }
  }
}