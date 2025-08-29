/**
 * 企业微信集成演示页面
 */

import React, { useState } from 'react'
import { Card, Row, Col, Space, Button, Divider, Alert, Typography, Tabs } from 'antd'
import {
  WechatOutlined,
  LoginOutlined,
  ShareAltOutlined,
  TeamOutlined,
  SyncOutlined
} from '@ant-design/icons'

import { PageContainer, PageHeader } from '../../components/common'
import { WeChatLogin, WeChatUserCard, WeChatShare } from '../../components/wechat'
import { RoleManagement, UserRoleAssignment, PermissionMatrix } from '../../components/rbac'
import { DepartmentSync, DepartmentTree } from '../../components/department'
import { ResponsiveContainer } from '../../components/responsive'
import { useWeChat, useWeChatAuth } from '../../hooks/useWeChat'
import { useDevice } from '../../hooks/useDevice'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

export const WeChatIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login')
  const device = useDevice()
  const { user, authenticated } = useWeChatAuth()

  // 企业微信配置（示例）
  const weChatConfig = {
    corpId: 'wx1234567890abcdef',
    agentId: '1000001',
    redirectUri: window.location.origin + '/auth/callback',
    scope: 'snsapi_base',
    state: 'STATE_' + Date.now()
  }

  const handleLoginSuccess = (userInfo: any) => {
    console.log('登录成功:', userInfo)
  }

  const handleLoginError = (error: string) => {
    console.error('登录失败:', error)
  }

  return (
    <ResponsiveContainer adaptivePadding safeArea>
      <PageContainer>
        <PageHeader
          title="企业微信集成演示"
          description="好饭碗门店生命周期管理系统 - 企业微信集成功能展示"
        />

        {/* 环境信息 */}
        <Alert
          message={
            <Space direction="vertical" size="small">
              <Text strong>当前环境信息</Text>
              <Space wrap>
                <Text>设备类型: {device.type}</Text>
                <Text>企业微信环境: {device.isWeChatWork ? '是' : '否'}</Text>
                <Text>移动端: {device.isMobile ? '是' : '否'}</Text>
                <Text>认证状态: {authenticated ? '已认证' : '未认证'}</Text>
              </Space>
            </Space>
          }
          type="info"
          style={{ marginBottom: 24 }}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size={device.isMobile ? 'small' : 'default'}
        >
          {/* 企业微信登录 */}
          <TabPane
            tab={
              <Space>
                <LoginOutlined />
                <span>企微登录</span>
              </Space>
            }
            key="login"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="企业微信登录" size="small">
                  <WeChatLogin
                    config={weChatConfig}
                    onLoginSuccess={handleLoginSuccess}
                    onLoginError={handleLoginError}
                    showTraditionalLogin={true}
                  />
                </Card>
              </Col>
              
              {user && (
                <Col xs={24} lg={12}>
                  <Card title="用户信息" size="small">
                    <WeChatUserCard
                      user={user}
                      showDetails={true}
                      showActions={true}
                    />
                  </Card>
                </Col>
              )}
            </Row>
          </TabPane>

          {/* 分享功能 */}
          <TabPane
            tab={
              <Space>
                <ShareAltOutlined />
                <span>分享功能</span>
              </Space>
            }
            key="share"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="分享功能演示" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Paragraph>
                      企业微信分享功能允许用户将页面内容分享到企业微信聊天或朋友圈。
                    </Paragraph>
                    
                    <WeChatShare
                      defaultContent={{
                        title: '好饭碗门店管理系统',
                        desc: '门店生命周期管理，让开店更简单',
                        link: window.location.href,
                        imgUrl: 'https://via.placeholder.com/300x300'
                      }}
                      buttonText="分享页面"
                      buttonType="primary"
                    />
                  </Space>
                </Card>
              </Col>
              
              <Col xs={24} lg={12}>
                <Card title="分享说明" size="small">
                  <Space direction="vertical">
                    <Title level={5}>功能特性</Title>
                    <ul>
                      <li>支持分享到企业微信聊天</li>
                      <li>支持分享到朋友圈</li>
                      <li>自定义分享标题、描述和图片</li>
                      <li>支持图片上传和预览</li>
                      <li>移动端友好的交互设计</li>
                    </ul>
                    
                    <Title level={5}>使用场景</Title>
                    <ul>
                      <li>门店信息分享</li>
                      <li>工作进展汇报</li>
                      <li>业务数据展示</li>
                      <li>系统功能推广</li>
                    </ul>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 部门同步 */}
          <TabPane
            tab={
              <Space>
                <TeamOutlined />
                <span>部门同步</span>
              </Space>
            }
            key="department"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <DepartmentSync />
              </Col>
              
              <Col xs={24} xl={12}>
                <DepartmentTree
                  showActions={true}
                  showUserCount={true}
                  height={400}
                />
              </Col>
            </Row>
          </TabPane>

          {/* RBAC权限管理 */}
          <TabPane
            tab={
              <Space>
                <SyncOutlined />
                <span>权限管理</span>
              </Space>
            }
            key="rbac"
          >
            <Tabs
              type="card"
              size="small"
              items={[
                {
                  key: 'roles',
                  label: '角色管理',
                  children: <RoleManagement />
                },
                {
                  key: 'assignment',
                  label: '用户分配',
                  children: <UserRoleAssignment />
                },
                {
                  key: 'matrix',
                  label: '权限矩阵',
                  children: <PermissionMatrix />
                }
              ]}
            />
          </TabPane>
        </Tabs>

        <Divider />

        {/* 技术说明 */}
        <Card title="技术实现说明" size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card type="inner" title="企业微信SDK" size="small">
                <ul>
                  <li>JS-SDK 1.2.0 集成</li>
                  <li>OAuth 2.0 认证流程</li>
                  <li>用户信息自动同步</li>
                  <li>移动端友好设计</li>
                  <li>错误处理和重试机制</li>
                </ul>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card type="inner" title="RBAC权限系统" size="small">
                <ul>
                  <li>基于角色的访问控制</li>
                  <li>动态权限矩阵</li>
                  <li>用户角色分配</li>
                  <li>权限实时验证</li>
                  <li>审计日志记录</li>
                </ul>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card type="inner" title="移动端适配" size="small">
                <ul>
                  <li>响应式设计</li>
                  <li>触摸友好交互</li>
                  <li>安全区域适配</li>
                  <li>性能优化</li>
                  <li>PWA 支持</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </Card>
      </PageContainer>
    </ResponsiveContainer>
  )
}

export default WeChatIntegration