/**
 * 移动端路由配置
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components';
import { useAuth } from '../contexts';
import './mobile.css';
import {
  MobileLayout,
  MobileHome,
  MobileWorkbench,
  MobileMessages,
  MobileProfile,
  MobileLocationList,
  MobileFollowUpList,
  MobileFollowUpDetail,
  MobileConstructionAcceptance,
  MobileApprovalList,
  MobileApprovalDetail,
  MobileAnalytics,
  WeChatLogin
} from '../pages/mobile';

/**
 * 移动端拓店管理路由
 */
export const MobileExpansionRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 候选点位列表 */}
      <Route 
        path="locations" 
        element={
          <ProtectedRoute permission="expansion.location.view">
            <MobileLocationList />
          </ProtectedRoute>
        } 
      />
      
      {/* 跟进单列表 */}
      <Route 
        path="follow-ups" 
        element={
          <ProtectedRoute permission="expansion.followup.view">
            <MobileFollowUpList />
          </ProtectedRoute>
        } 
      />
      
      {/* 跟进单详情 */}
      <Route 
        path="follow-ups/:id" 
        element={
          <ProtectedRoute permission="expansion.followup.view">
            <MobileFollowUpDetail />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 移动端开店筹备路由
 */
export const MobilePreparationRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 工程验收 */}
      <Route 
        path="construction/:id/acceptance" 
        element={
          <ProtectedRoute permission="preparation.construction.acceptance">
            <MobileConstructionAcceptance />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 移动端审批中心路由
 */
export const MobileApprovalRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 审批列表（默认显示全部） */}
      <Route 
        index 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <MobileApprovalList />
          </ProtectedRoute>
        } 
      />
      
      {/* 待办审批 */}
      <Route 
        path="pending" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <MobileApprovalList />
          </ProtectedRoute>
        } 
      />
      
      {/* 已办审批 */}
      <Route 
        path="processed" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <MobileApprovalList />
          </ProtectedRoute>
        } 
      />
      
      {/* 我发起的 */}
      <Route 
        path="initiated" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <MobileApprovalList />
          </ProtectedRoute>
        } 
      />
      
      {/* 审批详情 */}
      <Route 
        path=":id" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <MobileApprovalDetail />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 移动端主路由配置 - 完全独立的移动端路由系统
 */
export const MobileRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mobile-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">加载中...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 移动端登录页面（独立路由，不使用布局） */}
      <Route 
        path="login" 
        element={
          isAuthenticated ? <Navigate to="/mobile/home" replace /> : <WeChatLogin />
        } 
      />
      
      {/* 移动端主布局路由 */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <MobileLayout /> : <Navigate to="/mobile/login" replace />
        }
      >
        {/* 移动端首页 */}
        <Route 
          index 
          element={<Navigate to="home" replace />} 
        />
        
        <Route 
          path="home" 
          element={<MobileHome />} 
        />
        
        {/* 移动端工作台 */}
        <Route 
          path="work" 
          element={<MobileWorkbench />} 
        />
        
        {/* 移动端拓店管理模块 */}
        <Route path="expansion/*" element={<MobileExpansionRoutes />} />
        
        {/* 移动端开店筹备模块 */}
        <Route path="preparation/*" element={<MobilePreparationRoutes />} />
        
        {/* 移动端审批中心模块 */}
        <Route path="approvals/*" element={<MobileApprovalRoutes />} />
        
        {/* 移动端数据分析模块 */}
        <Route 
          path="analytics" 
          element={
            <ProtectedRoute permission="analytics.view">
              <MobileAnalytics />
            </ProtectedRoute>
          } 
        />
        
        {/* 移动端消息中心 */}
        <Route 
          path="messages" 
          element={<MobileMessages />} 
        />
        
        {/* 移动端个人中心 */}
        <Route 
          path="profile" 
          element={<MobileProfile />} 
        />
      </Route>
      
      {/* 移动端404页面 */}
      <Route 
        path="*" 
        element={
          <div className="mobile-404">
            <div className="error-icon">📱</div>
            <h3>页面未找到</h3>
            <p>请检查URL是否正确</p>
            <button 
              onClick={() => window.location.href = '/mobile/home'}
              className="back-home-btn"
            >
              返回首页
            </button>
          </div>
        } 
      />
    </Routes>
  );
};

export default MobileRoutes;