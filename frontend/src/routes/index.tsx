/**
 * 路由配置
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components';
import { useAuth } from '../contexts';
import Home from '../pages/home/Home';
import { Login, Profile } from '../pages/auth';
import { 
  DepartmentManagement, 
  UserManagement, 
  RoleManagement, 
  AuditLogManagement 
} from '../pages/system';
import { 
  PlanList, 
  PlanForm, 
  PlanDetail, 
  Dashboard, 
  AnalysisReport,
  PlanImport,
  PlanExport,
  TemplateManagement
} from '../pages/store-planning';
import {
  LocationList,
  FollowUpList,
  FollowUpDetail,
  ProfitFormulaConfig
} from '../pages/store-expansion';
import { MessageCenter } from '../pages/message';

/**
 * 系统管理模块路由
 */
export const SystemRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 部门管理路由 */}
      <Route 
        path="departments" 
        element={
          <ProtectedRoute permission="system.department.view">
            <DepartmentManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 用户管理路由 */}
      <Route 
        path="users" 
        element={
          <ProtectedRoute permission="system.user.view">
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 角色管理路由 */}
      <Route 
        path="roles" 
        element={
          <ProtectedRoute permission="system.role.view">
            <RoleManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 审计日志路由 */}
      <Route 
        path="audit-logs" 
        element={
          <ProtectedRoute permission="system.audit.view">
            <AuditLogManagement />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 拓店管理模块路由
 */
export const StoreExpansionRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 候选点位管理 */}
      <Route 
        path="locations" 
        element={
          <ProtectedRoute permission="expansion.location.view">
            <LocationList />
          </ProtectedRoute>
        } 
      />
      
      {/* 跟进单管理 */}
      <Route 
        path="follow-ups" 
        element={
          <ProtectedRoute permission="expansion.followup.view">
            <FollowUpList />
          </ProtectedRoute>
        } 
      />
      
      {/* 跟进单详情 */}
      <Route 
        path="follow-ups/:id" 
        element={
          <ProtectedRoute permission="expansion.followup.view">
            <FollowUpDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* 盈利测算配置 */}
      <Route 
        path="profit-config" 
        element={
          <ProtectedRoute permission="expansion.formula.view">
            <ProfitFormulaConfig />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 开店计划管理模块路由
 */
export const StorePlanningRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 计划执行仪表板 */}
      <Route 
        path="dashboard" 
        element={
          <ProtectedRoute permission="store_planning.plan.view">
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* 分析报表 */}
      <Route 
        path="reports" 
        element={
          <ProtectedRoute permission="store_planning.plan.view">
            <AnalysisReport />
          </ProtectedRoute>
        } 
      />
      
      {/* 计划列表 */}
      <Route 
        path="plans" 
        element={
          <ProtectedRoute permission="store_planning.plan.view">
            <PlanList />
          </ProtectedRoute>
        } 
      />
      
      {/* 创建计划 */}
      <Route 
        path="plans/create" 
        element={
          <ProtectedRoute permission="store_planning.plan.create">
            <PlanForm />
          </ProtectedRoute>
        } 
      />
      
      {/* 计划详情 */}
      <Route 
        path="plans/:id" 
        element={
          <ProtectedRoute permission="store_planning.plan.view">
            <PlanDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* 编辑计划 */}
      <Route 
        path="plans/:id/edit" 
        element={
          <ProtectedRoute permission="store_planning.plan.edit">
            <PlanForm />
          </ProtectedRoute>
        } 
      />
      
      {/* 数据导入 */}
      <Route 
        path="import" 
        element={
          <ProtectedRoute permission="store_planning.plan.import">
            <PlanImport />
          </ProtectedRoute>
        } 
      />
      
      {/* 数据导出 */}
      <Route 
        path="export" 
        element={
          <ProtectedRoute permission="store_planning.plan.export">
            <PlanExport />
          </ProtectedRoute>
        } 
      />
      
      {/* 模板管理 */}
      <Route 
        path="templates" 
        element={
          <ProtectedRoute permission="store_planning.plan.view">
            <TemplateManagement />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 主应用路由配置
 */
export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        加载中...
      </div>
    );
  }

  return (
    <Routes>
      {/* 登录页面 */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } 
      />
      
      {/* 个人中心 */}
      <Route 
        path="/profile" 
        element={
          isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* 消息中心 */}
      <Route 
        path="/messages" 
        element={
          isAuthenticated ? <MessageCenter /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* 首页 */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Home /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* 系统管理模块路由 */}
      <Route path="/system/*" element={<SystemRoutes />} />
      
      {/* 拓店管理模块路由 */}
      <Route path="/store-expansion/*" element={<StoreExpansionRoutes />} />
      
      {/* 开店计划管理模块路由 */}
      <Route path="/store-planning/*" element={<StorePlanningRoutes />} />
      
      {/* 404页面 */}
      <Route 
        path="*" 
        element={
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h2>页面未找到</h2>
            <p>请检查URL是否正确</p>
          </div>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;