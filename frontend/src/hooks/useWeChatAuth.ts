/**
 * 企业微信认证 Hook
 * 处理企业微信OAuth认证流程
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Message } from '@arco-design/web-react'
import WeChatService from '../api/wechatService'

interface UseWeChatAuthOptions {
  redirectPath?: string
  onSuccess?: (userInfo: any) => void
  onError?: (error: Error) => void
}

export function useWeChatAuth(options: UseWeChatAuthOptions = {}) {
  const { redirectPath = '/mobile/plans', onSuccess, onError } = options
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  /**
   * 检查是否在企业微信环境中
   */
  const isWeChatEnv = WeChatService.isWeChatEnvironment()

  /**
   * 处理企业微信认证回调
   */
  const handleAuthCallback = useCallback(async () => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return
    }

    setLoading(true)

    try {
      // 使用code换取用户信息
      const response = await WeChatService.authenticate({ code, state: state || undefined })
      
      // 保存认证信息
      localStorage.setItem('wechat_access_token', response.access_token)
      localStorage.setItem('wechat_user_info', JSON.stringify(response.user_info))
      
      setAuthenticated(true)
      Message.success('登录成功')
      
      // 回调成功处理
      onSuccess?.(response.user_info)
      
      // 跳转到目标页面
      navigate(redirectPath, { replace: true })
    } catch (error) {
      console.error('企业微信认证失败:', error)
      Message.error('登录失败，请重试')
      
      // 回调错误处理
      onError?.(error as Error)
    } finally {
      setLoading(false)
    }
  }, [searchParams, navigate, redirectPath, onSuccess, onError])

  /**
   * 发起企业微信认证
   */
  const startAuth = useCallback(async () => {
    if (!isWeChatEnv) {
      Message.warning('请在企业微信中打开')
      return
    }

    try {
      const currentUrl = window.location.href.split('?')[0]
      const authUrl = await WeChatService.getAuthUrl(currentUrl, 'login')
      window.location.href = authUrl
    } catch (error) {
      console.error('获取认证URL失败:', error)
      Message.error('启动认证失败')
    }
  }, [isWeChatEnv])

  /**
   * 检查认证状态
   */
  const checkAuthStatus = useCallback(() => {
    const token = localStorage.getItem('wechat_access_token')
    const userInfo = localStorage.getItem('wechat_user_info')
    
    if (token && userInfo) {
      setAuthenticated(true)
      return true
    }
    
    return false
  }, [])

  /**
   * 退出登录
   */
  const logout = useCallback(() => {
    localStorage.removeItem('wechat_access_token')
    localStorage.removeItem('wechat_user_info')
    setAuthenticated(false)
    Message.success('已退出登录')
  }, [])

  /**
   * 获取当前用户信息
   */
  const getUserInfo = useCallback(() => {
    const userInfoStr = localStorage.getItem('wechat_user_info')
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        return null
      }
    }
    return null
  }, [])

  /**
   * 初始化：检查URL中的code参数
   */
  useEffect(() => {
    if (searchParams.has('code')) {
      handleAuthCallback()
    } else {
      checkAuthStatus()
    }
  }, [searchParams, handleAuthCallback, checkAuthStatus])

  return {
    loading,
    authenticated,
    isWeChatEnv,
    startAuth,
    logout,
    getUserInfo,
    checkAuthStatus
  }
}

export default useWeChatAuth
