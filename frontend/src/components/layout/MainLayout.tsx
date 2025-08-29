import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  Layout, 
  Menu, 
  Button, 
  Avatar, 
  Dropdown, 
  Space, 
  Badge, 
  Breadcrumb, 
  Spin, 
  Drawer,
  Grid
} from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  FolderOutlined,
  AuditOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  TableOutlined,
  TeamOutlined,
  DatabaseOutlined,
  HomeOutlined,
  ProjectOutlined,
  BuildOutlined,
  MonitorOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuthStore } from '../../stores/authStore'
import { usePermission } from '../../hooks/usePermission'
import { useMenuConfig } from '../../hooks/useMenuConfig'
import { usePermissionStore } from '../../stores/permissionStore'
import { routerUtils } from '../../router'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  project: <ProjectOutlined />,
  shop: <ShopOutlined />,
  build: <BuildOutlined />,
  folder: <FolderOutlined />,
  monitor: <MonitorOutlined />,
  audit: <AuditOutlined />,
  database: <DatabaseOutlined />,
  environment: <EnvironmentOutlined />,
  table: <TableOutlined />,
  tool: <ToolOutlined />,
  team: <TeamOutlined />,
  bell: <BellOutlined />
}

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
  const screens = useBreakpoint()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { roles } = usePermission()
  const { initializePermissions } = usePermissionStore()
  const menuItems = useMenuConfig()

  // 确保权限初始化
  useEffect(() => {
    if (developmentUser && !user) {
      // 开发环境下手动触发权限初始化
      initializePermissions()
    }
  }, [user, initializePermissions])

  // 判断是否为移动端
  const isMobile = !screens.md

  // 开发环境：如果没有用户信息，创建临时用户以避免阻塞界面
  const developmentUser = user || {
    id: 'dev-user',
    username: 'developer',
    realName: '开发者',
    email: 'dev@example.com',
    phone: '13800138000',
    avatar: 'https://via.placeholder.com/64',
    roles: [
      {
        id: 'dev-role',
        code: 'ADMIN',
        name: '系统管理员',
        description: '开发环境临时角色',
        permissions: [
          // 添加所有必要的权限以确保菜单正常显示
          'dashboard:view',
          'store-plan:view', 'store-plan:manage',
          'expansion:view', 'expansion:manage',
          'preparation:view', 'preparation:manage',
          'store-files:view', 'store-files:manage',
          'operation:view', 'operation:manage',
          'approval:view', 'approval:manage',
          'basic-data:view', 'basic-data:manage'
        ]
      }
    ],
    department: '开发部',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    enabled: true
  }

  // 获取用户显示名称和角色
  const realName = developmentUser.realName || developmentUser.username || '用户'
  const roleNames = roles?.map(role => role.name) || developmentUser.roles.map(role => role.name)

  // 获取当前选中的菜单项
  const getCurrentKey = () => {
    const pathname = location.pathname

    // 递归查找菜单项
    const findCurrentKey = (items: any[], path: string): string | null => {
      for (const item of items) {
        if (item.path && path.startsWith(item.path)) {
          return item.key
        }
        if (item.children) {
          const childKey = findCurrentKey(item.children, path)
          if (childKey) return childKey
        }
      }
      return null
    }

    return findCurrentKey(menuItems, pathname) || '/dashboard'
  }

  // 获取面包屑数据
  const getBreadcrumbItems = () => {
    return routerUtils.generateBreadcrumb(location.pathname)
  }

  // 菜单点击处理
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
    // 移动端菜单点击后关闭抽屉
    if (isMobile) {
      setMobileMenuVisible(false)
    }
  }

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人设置',
      icon: <UserOutlined />
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />
    }
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'logout':
        logout()
        break
      case 'profile':
        navigate('/profile')
        break
      default:
        break
    }
  }

  // 转换菜单数据格式并添加图标
  const antdMenuItems = menuItems.map((item: any) => ({
    key: item.key,
    icon: iconMap[item.icon] || <FolderOutlined />,
    label: item.label,
    children: item.children?.map((child: any) => ({
      key: child.key,
      icon: iconMap[child.icon] || <TableOutlined />,
      label: child.label
    }))
  }))
  
  // 如果是生产环境且用户信息未加载完成，显示加载状态
  if (process.env.NODE_ENV === 'production' && !user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <Spin size="large" tip="加载用户信息..." />
      </div>
    )
  }

  // 侧边栏菜单组件
  const SiderMenu = (
    <>
      {/* Logo区域 */}
      <div
        style={{
          height: 64,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid #1f1f1f',
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
        }}
      >
        <ShopOutlined style={{ fontSize: 24, marginRight: (!isMobile && collapsed) ? 0 : 8 }} />
        {(!collapsed || isMobile) && <span>好饭碗门店管理</span>}
      </div>

      {/* 菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getCurrentKey()]}
        items={antdMenuItems}
        onClick={handleMenuClick}
      />
    </>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={256}>
          {SiderMenu}
        </Sider>
      )}

      {/* 移动端抽屉菜单 */}
      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          closable={false}
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          styles={{ body: { padding: 0 } }}
          width={256}
        >
          <div style={{ backgroundColor: '#001529', minHeight: '100%' }}>
            {SiderMenu}
          </div>
        </Drawer>
      )}

      <Layout>
        {/* 头部 */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}
        >
          <div className="flex align-center">
            <Button
              type="text"
              icon={
                isMobile 
                  ? <MenuUnfoldOutlined />
                  : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)
              }
              onClick={() => {
                if (isMobile) {
                  setMobileMenuVisible(true)
                } else {
                  setCollapsed(!collapsed)
                }
              }}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64
              }}
            />

            {/* 面包屑导航 */}
            <Breadcrumb 
              style={{ marginLeft: 16 }}
              items={[
                {
                  title: <HomeOutlined />,
                },
                ...getBreadcrumbItems().map((item) => ({
                  title: item.title,
                }))
              ]}
            />
          </div>

          <Space size="large">
            {/* 通知 */}
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                size="large"
                style={{ fontSize: '16px' }}
              />
            </Badge>

            {/* 用户信息 */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              placement="bottomRight"
            >
              <Space
                style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                className="hover:bg-gray-50"
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                  size="small"
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    {realName}
                  </span>
                  <span style={{ fontSize: '12px', color: '#666', lineHeight: 1 }}>
                    {roleNames.join('、') || '普通用户'}
                  </span>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: isMobile ? '16px 8px' : '24px 16px',
            padding: isMobile ? 16 : 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
            overflow: 'auto'
          }}
        >
          <div style={{ padding: '16px', backgroundColor: '#f0f2f5', marginBottom: '16px', border: '1px dashed #d9d9d9' }}>
            <strong>🔍 MainLayout 调试信息：</strong><br />
            当前路径: {location.pathname}<br />
            用户状态: {user ? '已登录' : '未登录（使用开发环境临时用户）'}<br />
            开发环境用户: {developmentUser.realName}<br />
            Outlet渲染状态: 正常
          </div>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
