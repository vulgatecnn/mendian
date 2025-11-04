/**
 * PC端路由配置
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
import {
  ConstructionList,
  ConstructionDetail,
  DeliveryList,
  DeliveryDetail,
  AcceptanceManagement,
  MilestoneManagement
} from '../pages/store-preparation';
import {
  StoreList,
  StoreDetail,
  StoreForm
} from '../pages/store-archive';
import {
  ApprovalPending,
  ApprovalProcessed,
  ApprovalCC,
  ApprovalFollowed,
  ApprovalInitiated,
  ApprovalAll,
  ApprovalDetail,
  ApprovalTemplateList,
  ApprovalTemplateForm
} from '../pages/approval';
import {
  BusinessRegionManagement,
  SupplierManagement,
  LegalEntityManagement,
  CustomerManagement,
  BudgetManagement
} from '../pages/base-data';
import { MessageCenter } from '../pages/message';
import {
  BusinessDashboard,
  DataReports
} from '../pages/business-dashboard';
import {
  PaymentTracking,
  AssetManagement
} from '../pages/store-operation';

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
 * 开店筹备模块路由
 */
export const StorePreparationRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 施工管理列表 */}
      <Route 
        path="construction" 
        element={
          <ProtectedRoute permission="preparation.construction.view">
            <ConstructionList />
          </ProtectedRoute>
        } 
      />
      
      {/* 施工管理详情 */}
      <Route 
        path="construction/:id" 
        element={
          <ProtectedRoute permission="preparation.construction.view">
            <ConstructionDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* 验收管理 */}
      <Route 
        path="acceptance" 
        element={
          <ProtectedRoute permission="preparation.construction.acceptance">
            <AcceptanceManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 里程碑管理 */}
      <Route 
        path="milestones" 
        element={
          <ProtectedRoute permission="preparation.construction.view">
            <MilestoneManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 交付管理列表 */}
      <Route 
        path="delivery" 
        element={
          <ProtectedRoute permission="preparation.delivery.view">
            <DeliveryList />
          </ProtectedRoute>
        } 
      />
      
      {/* 交付管理详情 */}
      <Route 
        path="delivery/:id" 
        element={
          <ProtectedRoute permission="preparation.delivery.view">
            <DeliveryDetail />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 门店档案模块路由
 */
export const StoreArchiveRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 门店档案列表 */}
      <Route 
        path="" 
        element={
          <ProtectedRoute permission="archive.store.view">
            <StoreList />
          </ProtectedRoute>
        } 
      />
      
      {/* 新建门店档案 */}
      <Route 
        path="create" 
        element={
          <ProtectedRoute permission="archive.store.create">
            <StoreForm />
          </ProtectedRoute>
        } 
      />
      
      {/* 门店档案详情 */}
      <Route 
        path=":id" 
        element={
          <ProtectedRoute permission="archive.store.view">
            <StoreDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* 编辑门店档案 */}
      <Route 
        path=":id/edit" 
        element={
          <ProtectedRoute permission="archive.store.edit">
            <StoreForm />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 审批中心模块路由
 */
export const ApprovalRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 待办审批 */}
      <Route 
        path="pending" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <ApprovalPending />
          </ProtectedRoute>
        } 
      />
      
      {/* 已办审批 */}
      <Route 
        path="processed" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <ApprovalProcessed />
          </ProtectedRoute>
        } 
      />
      
      {/* 抄送我的 */}
      <Route 
        path="cc" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <ApprovalCC />
          </ProtectedRoute>
        } 
      />
      
      {/* 我关注的 */}
      <Route 
        path="followed" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <ApprovalFollowed />
          </ProtectedRoute>
        } 
      />
      
      {/* 我发起的 */}
      <Route 
        path="initiated" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <ApprovalInitiated />
          </ProtectedRoute>
        } 
      />
      
      {/* 全部审批 */}
      <Route 
        path="all" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <ApprovalAll />
          </ProtectedRoute>
        } 
      />
      
      {/* 审批详情 */}
      <Route 
        path="detail/:id" 
        element={
          <ProtectedRoute permission="approval.instance.view">
            <ApprovalDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* 审批模板管理 */}
      <Route 
        path="templates" 
        element={
          <ProtectedRoute permission="approval.template.view">
            <ApprovalTemplateList />
          </ProtectedRoute>
        } 
      />
      
      {/* 新建审批模板 */}
      <Route 
        path="templates/create" 
        element={
          <ProtectedRoute permission="approval.template.create">
            <ApprovalTemplateForm />
          </ProtectedRoute>
        } 
      />
      
      {/* 编辑审批模板 */}
      <Route 
        path="templates/:id/edit" 
        element={
          <ProtectedRoute permission="approval.template.edit">
            <ApprovalTemplateForm />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 基础数据管理模块路由
 */
export const BaseDataRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 业务大区管理 */}
      <Route 
        path="regions" 
        element={
          <ProtectedRoute permission="base_data.region.view">
            <BusinessRegionManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 供应商管理 */}
      <Route 
        path="suppliers" 
        element={
          <ProtectedRoute permission="base_data.supplier.view">
            <SupplierManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 法人主体管理 */}
      <Route 
        path="legal-entities" 
        element={
          <ProtectedRoute permission="base_data.legal_entity.view">
            <LegalEntityManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 客户管理 */}
      <Route 
        path="customers" 
        element={
          <ProtectedRoute permission="base_data.customer.view">
            <CustomerManagement />
          </ProtectedRoute>
        } 
      />
      
      {/* 预算管理 */}
      <Route 
        path="budgets" 
        element={
          <ProtectedRoute permission="base_data.budget.view">
            <BudgetManagement />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 经营大屏模块路由
 */
export const BusinessDashboardRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 数据可视化大屏 */}
      <Route 
        path="dashboard" 
        element={
          <ProtectedRoute permission="business_dashboard.view">
            <BusinessDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* 数据报表 */}
      <Route 
        path="reports" 
        element={
          <ProtectedRoute permission="business_dashboard.reports">
            <DataReports />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

/**
 * 门店运营管理模块路由
 */
export const StoreOperationRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 付款追踪 */}
      <Route 
        path="payment-tracking" 
        element={
          <ProtectedRoute permission="store_operation.payment.view">
            <PaymentTracking />
          </ProtectedRoute>
        } 
      />
      
      {/* 资产管理 */}
      <Route 
        path="asset-management" 
        element={
          <ProtectedRoute permission="store_operation.asset.view">
            <AssetManagement />
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
 * PC端主应用路由配置 - 仅处理PC端路由
 */
export const PCRoutes: React.FC = () => {
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
      {/* PC端登录页面 */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } 
      />
      
      {/* PC端个人中心 */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* PC端消息中心 */}
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <MessageCenter />
          </ProtectedRoute>
        } 
      />
      
      {/* PC端首页 */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      
      {/* 系统管理模块路由 */}
      <Route path="/system/*" element={<SystemRoutes />} />
      
      {/* 拓店管理模块路由 */}
      <Route path="/store-expansion/*" element={<StoreExpansionRoutes />} />
      
      {/* 开店计划管理模块路由 */}
      <Route path="/store-planning/*" element={<StorePlanningRoutes />} />
      
      {/* 开店筹备模块路由 */}
      <Route path="/store-preparation/*" element={<StorePreparationRoutes />} />
      
      {/* 门店档案模块路由 */}
      <Route path="/store-archive/*" element={<StoreArchiveRoutes />} />
      
      {/* 审批中心模块路由 */}
      <Route path="/approval/*" element={<ApprovalRoutes />} />
      
      {/* 基础数据管理模块路由 */}
      <Route path="/base-data/*" element={<BaseDataRoutes />} />
      
      {/* 经营大屏模块路由 */}
      <Route path="/business-dashboard/*" element={<BusinessDashboardRoutes />} />
      
      {/* 门店运营管理模块路由 */}
      <Route path="/store-operation/*" element={<StoreOperationRoutes />} />
      
      {/* PC端404页面 */}
      <Route 
        path="*" 
        element={
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h2>页面未找到</h2>
            <p>请检查URL是否正确</p>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              返回首页
            </button>
          </div>
        } 
      />
    </Routes>
  );
};

export default PCRoutes;