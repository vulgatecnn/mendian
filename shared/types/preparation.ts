/**
 * 开店筹备管理相关类型定义
 */

// 优先级枚举
export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM', 
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

// 工程项目状态枚举
export const EngineeringStatus = {
  PLANNED: 'PLANNED',             // 已计划
  APPROVED: 'APPROVED',           // 已批准
  IN_PROGRESS: 'IN_PROGRESS',     // 施工中
  SUSPENDED: 'SUSPENDED',         // 已暂停
  COMPLETED: 'COMPLETED',         // 已完成
  CANCELLED: 'CANCELLED',         // 已取消
  ACCEPTED: 'ACCEPTED',           // 已验收
  WARRANTY: 'WARRANTY',           // 保修期
} as const;

export type EngineeringStatusType = typeof EngineeringStatus[keyof typeof EngineeringStatus];

// 状态颜色映射
export const ENGINEERING_STATUS_COLORS: Record<EngineeringStatusType, string> = {
  PLANNED: 'default',
  APPROVED: 'blue',
  IN_PROGRESS: 'processing',
  SUSPENDED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
  ACCEPTED: 'success',
  WARRANTY: 'cyan',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'green',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

// 工程任务接口
export interface EngineeringTask {
  id: string;
  name: string;
  description?: string;
  status: EngineeringStatusType;
  priority: Priority;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress: number;
  assignee?: string;
  estimatedCost?: number;
  actualCost?: number;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

// 质量检查记录
export interface QualityCheck {
  id: string;
  taskId: string;
  checkDate: string;
  checkType?: string;
  inspector: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  score?: number;
  overallScore?: number;
  checkPoints?: Array<{
    name: string;
    standard: string;
    score: number;
    result: 'PASS' | 'FAIL';
  }>;
  notes?: string;
  photos?: string[];
  createdAt: string;
}

// 安全记录
export interface SafetyRecord {
  id: string;
  taskId: string;
  recordDate: string;
  type: 'INCIDENT' | 'INSPECTION' | 'TRAINING';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  actions?: string;
  responsible: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

// 材料使用记录
export interface MaterialUsage {
  id: string;
  taskId: string;
  materialName: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  supplierId?: string;
  usageDate: string;
  createdAt: string;
}

// 创建工程任务请求
export interface CreateEngineeringTaskRequest {
  name: string;
  description?: string;
  priority: Priority;
  startDate: string;
  endDate: string;
  assignee?: string;
  estimatedCost?: number;
  supplierId?: string;
}

// 更新工程任务请求
export interface UpdateEngineeringTaskRequest {
  name?: string;
  description?: string;
  status?: EngineeringStatusType;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  progress?: number;
  assignee?: string;
  estimatedCost?: number;
  actualCost?: number;
  supplierId?: string;
}