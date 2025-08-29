import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Button, Drawer, Menu, Avatar, Space, Badge, FloatButton } from 'antd'
import {
  MenuOutlined,
  DashboardOutlined,
  ShopOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  FolderOutlined,
  LineChartOutlined,
  AuditOutlined,
  DatabaseOutlined,
  BellOutlined,
  UserOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Header, Content } = Layout

interface MenuItem {
  key: string
  path: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    label: '系统首页',
    icon: <DashboardOutlined />
  },
  {
    key: 'store-plan',
    path: '/store-plan',
    label: '开店计划',
    icon: <CalendarOutlined />
  },
  {
    key: 'expansion',
    path: '/expansion',
    label: '拓店管理',
    icon: <EnvironmentOutlined />
  },
  {
    key: 'preparation',
    path: '/preparation',
    label: '开店筹备',
    icon: <ToolOutlined />
  },
  {
    key: 'store-files',
    path: '/store-files',
    label: '门店档案',
    icon: <FolderOutlined />
  },
  {
    key: 'operation',
    path: '/operation',
    label: '门店运营',
    icon: <LineChartOutlined />
  },
  {
    key: 'approval',
    path: '/approval',
    label: '审批中心',
    icon: <AuditOutlined />,
    badge: 5
  },
  {
    key: 'basic-data',
    path: '/basic-data',
    label: '基础数据',
    icon: <DatabaseOutlined />
  }
]

const MobileLayout: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // 获取当前页面标题
  const getCurrentTitle = () => {
    const currentItem = menuItems.find(item => location.pathname.startsWith(item.path))
    return currentItem ? currentItem.label : '好饭碗门店管理'
  }

  // 获取当前选中的菜单项
  const getCurrentKey = () => {
    const pathname = location.pathname
    const currentItem = menuItems.find(item => pathname.startsWith(item.path))
    return currentItem ? currentItem.key : 'dashboard'
  }

  // 菜单点击处理
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const menuItem = menuItems.find(item => item.key === key)
    if (menuItem) {
      navigate(menuItem.path)
      setDrawerVisible(false)
    }
  }

  // 转换菜单数据格式
  const antdMenuItems = menuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{item.label}</span>
        {item.badge && (
          <Badge count={item.badge} size="small" style={{ backgroundColor: '#ff4d4f' }} />
        )}
      </div>
    )
  }))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 移动端头部 */}
      <Header
        style={{
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            style={{
              fontSize: '18px',
              padding: '8px',
              marginRight: 12
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ShopOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 8 }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>
              {getCurrentTitle()}
            </span>
          </div>
        </div>

        <Space size="small">
          <Button type="text" icon={<SearchOutlined />} style={{ fontSize: '16px' }} />
          <Badge count={3} size="small">
            <Button type="text" icon={<BellOutlined />} style={{ fontSize: '16px' }} />
          </Badge>
          <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#1890ff' }} />
        </Space>
      </Header>

      {/* 侧边抽屉菜单 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ShopOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>好饭碗门店管理</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ borderBottom: '1px solid #f0f0f0' }}
      >
        <Menu
          mode="inline"
          selectedKeys={[getCurrentKey()]}
          items={antdMenuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />

        {/* 用户信息区域 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            borderTop: '1px solid #f0f0f0',
            background: '#fafafa'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff', marginRight: 12 }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>管理员</div>
              <div style={{ fontSize: '12px', color: '#8C8C8C' }}>超级管理员</div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* 内容区域 */}
      <Content
        style={{
          padding: '16px',
          minHeight: 280,
          background: '#f5f5f5'
        }}
      >
        <Outlet />
      </Content>

      {/* 悬浮操作按钮 */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 16, bottom: 80 }}
        icon={<PlusOutlined />}
      >
        <FloatButton
          icon={<CalendarOutlined />}
          tooltip="新建计划"
          onClick={() => navigate('/store-plan/create')}
        />
        <FloatButton
          icon={<EnvironmentOutlined />}
          tooltip="添加点位"
          onClick={() => navigate('/expansion/sites/create')}
        />
        <FloatButton
          icon={<AuditOutlined />}
          tooltip="发起审批"
          onClick={() => navigate('/approval/create')}
        />
      </FloatButton.Group>

      {/* 返回顶部 */}
      <FloatButton.BackTop style={{ right: 16, bottom: 16 }} visibilityHeight={200} />
    </Layout>
  )
}

export default MobileLayout
