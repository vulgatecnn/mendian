import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout, Dropdown, Menu, Avatar, Space, Badge } from '@arco-design/web-react'
import { IconUser, IconPoweroff, IconSettings, IconNotification } from '@arco-design/web-react/icon'
import { AuthProvider, PermissionProvider, StorePlanProvider } from './contexts'
import AppRoutes from './routes/index.tsx'
import './App.css'

// App 组件现在只负责提供全局 Context，路由由 AppRoutes 统一管理

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PermissionProvider>
        <StorePlanProvider>
          <AppRoutes />
        </StorePlanProvider>
      </PermissionProvider>
    </AuthProvider>
  )
}

export default App
