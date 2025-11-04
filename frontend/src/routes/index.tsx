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
      {/* 根路径智能重定向 */}
      <Route path="/" element={<SmartRouteRedirect />} />
      
      {/* 移动端路由 - 优先匹配 */}
      <Route path="/mobile/*" element={<MobileRoutes />} />
      
      {/* PC端路由 - 仅在非移动端环境下生效 */}
      {!isMobile && (
        <Route path="/*" element={<PCRoutes />} />
      )}
      
      {/* 移动端环境下的PC端路由重定向 */}
      {isMobile && (
        <Route path="/*" element={<Navigate to="/mobile/home" replace />} />
      )}
      
      {/* 平台自动检测路由 */}
      <Route 
        path="/auto-redirect" 
        element={<SmartRouteRedirect />} 
      />
    </Routes>
  );
};

export default AppRoutes;