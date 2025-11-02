/**
 * 路由配置
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components';
import { 
  DepartmentManagement, 
  UserManagement, 
  RoleManagement, 
  AuditLogManagement 
} from '../pages/system';

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
 * 主应用路由配置
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 首页 */}
      <Route 
        path="/" 
        element={
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h1>欢迎使用门店生命周期管理系统</h1>
            <p>请从左侧菜单选择功能模块</p>
          </div>
        } 
      />
      
      {/* 系统管理模块路由 */}
      <Route path="/system/*" element={<SystemRoutes />} />
      
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