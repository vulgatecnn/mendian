/**
 * 移动端应用入口
 */
import React from 'react'
import { AuthProvider, PermissionProvider } from './contexts'
import MobileRoutes from './routes/mobile'
import './pages/mobile/mobile.css'

/**
 * 移动端应用组件
 */
const MobileApp: React.FC = () => {
  return (
    <AuthProvider>
      <PermissionProvider>
        <div className="mobile-app">
          <MobileRoutes />
        </div>
      </PermissionProvider>
    </AuthProvider>
  )
}

export default MobileApp