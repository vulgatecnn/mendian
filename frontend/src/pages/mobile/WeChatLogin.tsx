/**
 * 企业微信登录页面
 * 处理企业微信OAuth认证流程
 */
import React, { useEffect } from 'react'
import { Spin, Result, Button } from '@arco-design/web-react'
import { IconWechat } from '@arco-design/web-react/icon'
import { useWeChatAuth } from '../../hooks/useWeChatAuth'
import './mobile.css'

const WeChatLogin: React.FC = () => {
  const {
    loading,
    authenticated,
    isWeChatEnv,
    startAuth,
    checkAuthStatus
  } = useWeChatAuth({
    redirectPath: '/mobile/plans'
  })

  /**
   * 检查认证状态，如果已认证则自动跳转
   */
  useEffect(() => {
    if (checkAuthStatus()) {
      // 已认证，会自动跳转
      return
    }

    // 如果在企业微信环境中且未认证，自动发起认证
    if (isWeChatEnv && !authenticated && !loading) {
      const timer = setTimeout(() => {
        startAuth()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isWeChatEnv, authenticated, loading, startAuth, checkAuthStatus])

  /**
   * 加载中状态
   */
  if (loading) {
    return (
      <div className="wechat-login-page">
        <div className="login-content">
          <Spin size={40} />
          <p className="login-tip">正在登录...</p>
        </div>
      </div>
    )
  }

  /**
   * 非企业微信环境
   */
  if (!isWeChatEnv) {
    return (
      <div className="wechat-login-page">
        <Result
          status="warning"
          title="请在企业微信中打开"
          subTitle="移动端功能需要在企业微信应用中使用"
          extra={
            <div className="login-tips">
              <p>使用步骤：</p>
              <ol>
                <li>打开企业微信应用</li>
                <li>找到"好饭碗门店管理"应用</li>
                <li>点击进入即可使用</li>
              </ol>
            </div>
          }
        />
      </div>
    )
  }

  /**
   * 等待认证
   */
  return (
    <div className="wechat-login-page">
      <div className="login-content">
        <div className="login-icon">
          <IconWechat style={{ fontSize: 64, color: '#07c160' }} />
        </div>
        <h2>好饭碗门店管理</h2>
        <p className="login-subtitle">开店计划移动端</p>
        
        <Button
          type="primary"
          size="large"
          className="login-button"
          onClick={startAuth}
          loading={loading}
        >
          企业微信登录
        </Button>

        <div className="login-footer">
          <p>使用企业微信账号登录</p>
          <p className="login-tip">安全 · 便捷 · 高效</p>
        </div>
      </div>
    </div>
  )
}

export default WeChatLogin
