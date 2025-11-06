/**
 * 主路由配置 - 智能平台路由分发
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import PCRoutes from './pc';
import MobileRoutes from './mobile';
import { isMobileEnvironment, getHomeRoute, getLoginRoute } from './utils';

/**
 * 智能路由重定向组件
 */
const SmartRouteRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to={getLoginRoute()} replace />;
  }
  
  return <Navigate to={getHomeRoute()} replace />;
};

/**
 * 平台检测加载组件
 */
const PlatformLoadingScreen: React.FC = () => {
  const isMobile = isMobileEnvironment();
  
  if (isMobile) {
    return (
      <div className="mobile-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">加载中...</div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '16px'
    }}>
      加载中...
    </div>
  );
};

/**
 * 主应用路由配置 - 智能平台路由分发
 */
export const AppRoutes: React.FC = () => {
  const { isLoading } = useAuth();
  const isMobile = isMobileEnvironment();

  if (isLoading) {
    return <PlatformLoadingScreen />;
  }

  return (
    <Routes>
      {/* 根路径重定向到 PC 端 */}
      <Route path="/" element={<Navigate to="/pc" replace />} />
      
      {/* PC端路由 */}
      <Route path="/pc/*" element={<PCRoutes />} />
      
      {/* 移动端路由 */}
      <Route path="/mobile/*" element={<MobileRoutes />} />
      
      {/* 404 - 重定向到 PC 端 */}
      <Route path="*" element={<Navigate to="/pc" replace />} />
    </Routes>
  );
};

export default AppRoutes;