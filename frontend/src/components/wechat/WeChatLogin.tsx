/**
 * 企业微信登录组件
 */

import React, { useEffect, useState } from 'react'
import { Button, Card, Alert, Spin, Typography, Space, Divider } from 'antd'
import { WechatOutlined, LoginOutlined, LoadingOutlined } from '@ant-design/icons'
import { useWeChat, useWeChatEnvironment } from '../../hooks/useWeChat'
import type { WeChatConfig } from '../../types/wechat'

const { Title, Text, Paragraph } = Typography

interface WeChatLoginProps {
  /** 企业微信配置 */
  config: WeChatConfig
  /** 登录成功回调 */
  onLoginSuccess?: (user: any) => void
  /** 登录失败回调 */
  onLoginError?: (error: string) => void
  /** 自定义样式类名 */
  className?: string
  /** 是否显示传统登录选项 */
  showTraditionalLogin?: boolean
  /** 传统登录回调 */
  onTraditionalLogin?: () => void
}

export const WeChatLogin: React.FC<WeChatLoginProps> = ({
  config,
  onLoginSuccess,
  onLoginError,
  className,
  showTraditionalLogin = true,
  onTraditionalLogin
}) => {
  const {
    initialized,
    authenticated,
    user,
    environment,
    loading,
    error,
    initialize,
    startAuth,
    clearError
  } = useWeChat({ ...config, autoInit: true })

  const { isWeChatWork, isMobile } = useWeChatEnvironment()
  const [initializing, setInitializing] = useState(true)

  // 监听认证状态变化
  useEffect(() => {
    if (authenticated && user && onLoginSuccess) {
      onLoginSuccess(user)
    }
  }, [authenticated, user, onLoginSuccess])

  // 监听错误状态
  useEffect(() => {
    if (error && onLoginError) {
      onLoginError(error)
    }
  }, [error, onLoginError])

  // 初始化完成
  useEffect(() => {
    if (initialized) {
      setInitializing(false)
    }
  }, [initialized])

  // 处理企业微信登录
  const handleWeChatLogin = async () => {
    try {
      clearError()
      await startAuth()
    } catch (error) {
      console.error('WeChat login failed:', error)
    }
  }

  // 处理传统登录
  const handleTraditionalLogin = () => {
    if (onTraditionalLogin) {
      onTraditionalLogin()
    }
  }

  // 如果正在初始化，显示加载状态
  if (initializing || loading) {
    return (
      <Card className={className} style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="large">
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            size="large"
          />
          <Text>正在初始化企业微信登录...</Text>
        </Space>
      </Card>
    )
  }

  // 如果已认证，显示用户信息
  if (authenticated && user) {
    return (
      <Card className={className}>
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <WechatOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <Title level={4}>企业微信登录成功</Title>
          <Text>欢迎，{user.name}！</Text>
          {user.department && <Text type="secondary">部门：{user.department}</Text>}
        </Space>
      </Card>
    )
  }

  return (
    <Card className={className} title="登录" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 错误提示 */}
        {error && (
          <Alert
            message="登录错误"
            description={error}
            type="error"
            closable
            onClose={clearError}
          />
        )}

        {/* 企业微信环境检测 */}
        {isWeChatWork ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="企业微信环境"
              description="检测到您在企业微信中，推荐使用企业微信登录"
              type="success"
              showIcon
            />
            
            <Button
              type="primary"
              size="large"
              icon={<WechatOutlined />}
              onClick={handleWeChatLogin}
              loading={loading}
              block
            >
              企业微信登录
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="请在企业微信中打开"
              description={
                <Space direction="vertical" size="small">
                  <Text>为了获得最佳体验，请在企业微信客户端中打开此页面</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    您也可以使用传统登录方式
                  </Text>
                </Space>
              }
              type="warning"
              showIcon
            />
            
            <Button
              type="primary"
              size="large"
              icon={<WechatOutlined />}
              onClick={handleWeChatLogin}
              loading={loading}
              disabled={!environment?.supportJSSDK}
              block
            >
              {environment?.supportJSSDK ? '企业微信登录' : '不支持企业微信登录'}
            </Button>
          </Space>
        )}

        {/* 传统登录选项 */}
        {showTraditionalLogin && (
          <>
            <Divider>或</Divider>
            <Button
              type="default"
              size="large"
              icon={<LoginOutlined />}
              onClick={handleTraditionalLogin}
              block
            >
              账号密码登录
            </Button>
          </>
        )}

        {/* 环境信息（开发模式） */}
        {process.env.NODE_ENV === 'development' && environment && (
          <Card size="small" title="环境信息" type="inner">
            <Space direction="vertical" size="small">
              <Text>企业微信环境: {environment.isWeChatWork ? '是' : '否'}</Text>
              <Text>移动端: {environment.isMobile ? '是' : '否'}</Text>
              <Text>支持JS-SDK: {environment.supportJSSDK ? '是' : '否'}</Text>
              <Text>浏览器: {environment.device.browser} {environment.device.version}</Text>
              <Text>操作系统: {environment.device.os}</Text>
            </Space>
          </Card>
        )}

        {/* 使用说明 */}
        <Card size="small" type="inner">
          <Space direction="vertical" size="small">
            <Text strong>使用说明：</Text>
            <Text style={{ fontSize: 12 }}>
              1. 推荐在企业微信客户端中使用本系统
            </Text>
            <Text style={{ fontSize: 12 }}>
              2. 企业微信登录可享受免密登录体验
            </Text>
            <Text style={{ fontSize: 12 }}>
              3. 如有问题请联系系统管理员
            </Text>
          </Space>
        </Card>
      </Space>
    </Card>
  )
}

export default WeChatLogin