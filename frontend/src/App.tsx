import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout, Dropdown, Menu, Avatar, Space, Badge } from '@arco-design/web-react'
import { IconUser, IconPoweroff, IconSettings, IconNotification } from '@arco-design/web-react/icon'
import { AuthProvider, PermissionProvider, StorePlanProvider, useAuth } from './contexts'
import { MainNavigation } from './components'
import { PCRoutes, MobileRoutes } from './routes'
import messageService from './api/messageService'
import { isMobileEnvironment, convertPCRouteToMobile } from './routes/utils'
import './App.css'

const { Header, Content, Sider } = Layout

const AppLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const isLoginPage = location.pathname === '/login' || location.pathname === '/mobile/login'
  const isMobile = isMobileEnvironment()
  const [unreadCount, setUnreadCount] = useState(0)

  // 如果是移动端环境但访问PC端路由，重定向到移动端
  useEffect(() => {
    if (isMobile && !location.pathname.startsWith('/mobile') && isAuthenticated) {
      const mobilePath = convertPCRouteToMobile(location.pathname)
      navigate(mobilePath, { replace: true })
    }
  }, [isMobile, location.pathname, isAuthenticated, navigate])

  // 加载未读消息数量
  const loadUnreadCount = async () => {
    try {
      const count = await messageService.getUnreadCount()
      setUnreadCount(count.total)
    } catch (error) {
      console.error('加载未读消息数量失败:', error)
    }
  }

  // 初始化加载未读消息数量
  useEffect(() => {
    if (isAuthenticated && !isLoginPage) {
      loadUnreadCount()
      
      // 每30秒刷新一次未读消息数量
      const interval = setInterval(loadUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, isLoginPage])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const handleGoToMessages = () => {
    navigate('/messages')
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={() => window.location.href = '/profile'}>
        <Space>
          <IconUser />
          个人中心
        </Space>
      </Menu.Item>
      <Menu.Item key="settings">
        <Space>
          <IconSettings />
          设置
        </Space>
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout} style={{ borderTop: '1px solid #e5e6eb' }}>
        <Space>
          <IconPoweroff />
          退出登录
        </Space>
      </Menu.Item>
    </Menu>
  )

  // 如果是移动端环境，直接返回移动端路由
  if (isMobile) {
    return <MobileRoutes />
  }

  // PC端登录页面或未认证状态
  if (isLoginPage || !isAuthenticated) {
    return <PCRoutes />
  }

  // PC端主布局
  return (
    <Layout className="layout">
      <Header className="header">
        <div className="logo">门店生命周期管理系统</div>
        <div className="header-right">
          <Space size="large">
            {/* 消息中心入口 */}
            <Badge count={unreadCount} maxCount={99} dot={unreadCount > 0}>
              <div 
                onClick={handleGoToMessages}
                style={{ 
                  cursor: 'pointer', 
                  color: '#fff',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconNotification />
              </div>
            </Badge>
            
            {/* 用户菜单 */}
            <Dropdown droplist={userMenu} position="br">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size={32}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" />
                  ) : (
                    <IconUser />
                  )}
                </Avatar>
                <span style={{ color: '#fff' }}>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </div>
      </Header>
      <Layout>
        <Sider className="sider" width={250}>
          <MainNavigation mode="vertical" />
        </Sider>
        <Content className="content">
          <PCRoutes />
        </Content>
      </Layout>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PermissionProvider>
        <StorePlanProvider>
          <AppLayout />
        </StorePlanProvider>
      </PermissionProvider>
    </AuthProvider>
  )
}

export default App
