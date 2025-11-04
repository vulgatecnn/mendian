/**
 * 路由模块导出
 */

// PC端路由配置
export { default as PCRoutes } from './pc';
export {
  SystemRoutes,
  StoreExpansionRoutes,
  StorePreparationRoutes,
  StoreArchiveRoutes,
  ApprovalRoutes,
  BaseDataRoutes,
  BusinessDashboardRoutes,
  StorePlanningRoutes,
  StoreOperationRoutes
} from './pc';

// 移动端路由配置
export { default as MobileRoutes } from './mobile';
export {
  MobileExpansionRoutes,
  MobilePreparationRoutes,
  MobileApprovalRoutes
} from './mobile';

// 路由工具函数
export * from './utils';