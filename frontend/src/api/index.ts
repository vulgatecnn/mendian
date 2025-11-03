/**
 * API 服务统一导出
 */

// 基础请求
export { default as request, clearRequestCache, clearCacheByUrl } from './request'

// 认证和个人中心服务
export { default as AuthService } from './authService'
export { default as ProfileService } from './profileService'

// 系统管理服务
export { default as UserService } from './userService'
export { default as RoleService } from './roleService'
export { default as DepartmentService } from './departmentService'
export { default as AuditLogService } from './auditLogService'

// 开店计划服务
export { default as PlanService, usePlanService } from './planService'
export { default as StatisticsService, useStatisticsService } from './statisticsService'
export { default as ImportExportService, useImportExportService } from './importExportService'

// 企业微信服务
export { default as WeChatService } from './wechatService'

// 拓店管理服务
export { default as ExpansionService, useExpansionService } from './expansionService'

// 开店筹备服务
export { default as PreparationService } from './preparationService'

// 门店档案服务
export { default as ArchiveService } from './archiveService'

// 审批中心服务
export { default as ApprovalService } from './approvalService'

// 基础数据服务
export { default as BaseDataService } from './baseDataService'

// 系统首页服务
export { default as HomeService } from './homeService'

// 消息通知服务
export { default as MessageService } from './messageService'

// 文件上传服务
export { default as UploadService } from './uploadService'

// 导出类型
export type { UsePlanServiceOptions } from './planService'
export type { UseStatisticsServiceOptions } from './statisticsService'
export type { UseImportExportServiceOptions } from './importExportService'
export type { UseExpansionServiceOptions } from './expansionService'
export type { UploadConfig, UploadResponse } from './uploadService'
