import React from 'react'
import { Layout } from '@arco-design/web-react'
import { PermissionProvider } from './contexts/PermissionContext'
import { MainNavigation } from './components'
import { AppRoutes } from './routes'
import './App.css'

const { Header, Content, Sider } = Layout

const App: React.FC = () => {
  return (
    <PermissionProvider>
      <Layout className="layout">
        <Header className="header">
          <div className="logo">门店生命周期管理系统</div>
        </Header>
        <Layout>
          <Sider className="sider" width={250}>
            <MainNavigation mode="vertical" />
          </Sider>
          <Content className="content">
            <AppRoutes />
          </Content>
        </Layout>
      </Layout>
    </PermissionProvider>
  )
}

export default App
