/**
 * 开店筹备管理工具函数
 */
import { Priority } from '@prisma/client';
import {
  PreparationStatusType,
  PreparationStatus,
  EngineeringStatusType,
  EngineeringStatus,
  EquipmentStatusType,
  EquipmentStatus,
  LicenseStatusType,
  LicenseStatus,
  RecruitmentStatusType,
  RecruitmentStatus,
  MilestoneStatusType,
  MilestoneStatus,
  PRIORITY_COLORS,
  PREPARATION_STATUS_COLORS,
  ENGINEERING_STATUS_COLORS,
  EquipmentCategoryType,
  LicenseTypeType,
  PositionTypeType,
} from '@/types/preparation.js';

// ===============================
// 状态相关工具函数
// ===============================

/**
 * 获取状态显示颜色
 */
export const getStatusColor = (status: string, type: 'preparation' | 'engineering' = 'preparation'): string => {
  if (type === 'preparation') {
    return PREPARATION_STATUS_COLORS[status as PreparationStatusType] || '#d9d9d9';
  }
  return ENGINEERING_STATUS_COLORS[status as EngineeringStatusType] || '#d9d9d9';
};

/**
 * 获取优先级显示颜色
 */
export const getPriorityColor = (priority: Priority): string => {
  return PRIORITY_COLORS[priority] || '#1890ff';
};

/**
 * 检查状态是否为完成状态
 */
export const isCompletedStatus = (status: string, type: 'preparation' | 'engineering' | 'milestone' = 'preparation'): boolean => {
  switch (type) {
    case 'preparation':
      return status === PreparationStatus.COMPLETED;
    case 'engineering':
      return status === EngineeringStatus.COMPLETED || status === EngineeringStatus.ACCEPTED;
    case 'milestone':
      return status === MilestoneStatus.COMPLETED;
    default:
      return false;
  }
};

/**
 * 检查状态是否为进行中状态
 */
export const isInProgressStatus = (status: string, type: 'preparation' | 'engineering' | 'milestone' = 'preparation'): boolean => {
  switch (type) {
    case 'preparation':
      return status === PreparationStatus.IN_PROGRESS;
    case 'engineering':
      return status === EngineeringStatus.IN_PROGRESS;
    case 'milestone':
      return status === MilestoneStatus.IN_PROGRESS;
    default:
      return false;
  }
};

/**
 * 检查状态是否为逾期状态
 */
export const isOverdueStatus = (status: string, type: 'preparation' | 'milestone' = 'preparation'): boolean => {
  switch (type) {
    case 'preparation':
      return status === PreparationStatus.OVERDUE;
    case 'milestone':
      return status === MilestoneStatus.OVERDUE;
    default:
      return false;
  }
};

// ===============================
// 日期相关工具函数
// ===============================

/**
 * 计算两个日期之间的天数差
 */
export const getDaysDifference = (startDate: Date, endDate: Date): number => {
  const timeDifference = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24));
};

/**
 * 检查项目是否逾期
 */
export const isProjectOverdue = (plannedEndDate: Date, actualEndDate?: Date): boolean => {
  const compareDate = actualEndDate || new Date();
  return compareDate > plannedEndDate;
};

/**
 * 计算项目剩余天数
 */
export const getProjectRemainingDays = (plannedEndDate: Date): number => {
  const today = new Date();
  return getDaysDifference(today, plannedEndDate);
};

/**
 * 获取日期范围描述
 */
export const getDateRangeDescription = (startDate: Date, endDate: Date): string => {
  const days = getDaysDifference(startDate, endDate);
  if (days <= 7) return '一周内';
  if (days <= 30) return '一月内';
  if (days <= 90) return '一季度内';
  return '长期项目';
};

/**
 * 检查证照是否即将到期
 */
export const isLicenseExpiringSoon = (expiryDate: Date, reminderDays: number = 30): boolean => {
  if (!expiryDate) return false;
  const today = new Date();
  const reminderDate = new Date(expiryDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);
  return today >= reminderDate && today <= expiryDate;
};

// ===============================
// 进度计算工具函数
// ===============================

/**
 * 计算整体项目进度
 */
export const calculateProjectProgress = (
  engineeringProgress: number = 0,
  equipmentProgress: number = 0,
  licenseProgress: number = 0,
  staffProgress: number = 0,
  milestoneProgress: number = 0,
  weights: {
    engineering: number;
    equipment: number;
    license: number;
    staff: number;
    milestone: number;
  } = {
    engineering: 0.3,
    equipment: 0.2,
    license: 0.2,
    staff: 0.15,
    milestone: 0.15,
  }
): number => {
  const totalProgress = 
    engineeringProgress * weights.engineering +
    equipmentProgress * weights.equipment +
    licenseProgress * weights.license +
    staffProgress * weights.staff +
    milestoneProgress * weights.milestone;
  
  return Math.round(totalProgress);
};

/**
 * 根据状态计算进度百分比
 */
export const getProgressByStatus = (
  status: string,
  type: 'preparation' | 'engineering' | 'equipment' | 'license' | 'recruitment' | 'milestone'
): number => {
  switch (type) {
    case 'preparation':
      switch (status as PreparationStatusType) {
        case PreparationStatus.PLANNING: return 0;
        case PreparationStatus.APPROVED: return 10;
        case PreparationStatus.IN_PROGRESS: return 50;
        case PreparationStatus.COMPLETED: return 100;
        case PreparationStatus.SUSPENDED: return 30;
        case PreparationStatus.CANCELLED: return 0;
        case PreparationStatus.OVERDUE: return 40;
        default: return 0;
      }
    
    case 'engineering':
      switch (status as EngineeringStatusType) {
        case EngineeringStatus.PLANNED: return 0;
        case EngineeringStatus.APPROVED: return 10;
        case EngineeringStatus.IN_PROGRESS: return 60;
        case EngineeringStatus.COMPLETED: return 90;
        case EngineeringStatus.ACCEPTED: return 100;
        case EngineeringStatus.WARRANTY: return 100;
        case EngineeringStatus.SUSPENDED: return 40;
        case EngineeringStatus.CANCELLED: return 0;
        default: return 0;
      }
    
    case 'equipment':
      switch (status as EquipmentStatusType) {
        case EquipmentStatus.PENDING: return 0;
        case EquipmentStatus.QUOTED: return 20;
        case EquipmentStatus.APPROVED: return 30;
        case EquipmentStatus.ORDERED: return 40;
        case EquipmentStatus.DELIVERED: return 70;
        case EquipmentStatus.INSTALLED: return 90;
        case EquipmentStatus.ACCEPTED: return 100;
        case EquipmentStatus.WARRANTY: return 100;
        case EquipmentStatus.MAINTENANCE: return 100;
        default: return 0;
      }
    
    case 'license':
      switch (status as LicenseStatusType) {
        case LicenseStatus.PENDING: return 0;
        case LicenseStatus.SUBMITTED: return 20;
        case LicenseStatus.UNDER_REVIEW: return 50;
        case LicenseStatus.APPROVED: return 80;
        case LicenseStatus.ISSUED: return 100;
        case LicenseStatus.RENEWED: return 100;
        case LicenseStatus.REJECTED: return 0;
        case LicenseStatus.EXPIRED: return 0;
        default: return 0;
      }
    
    case 'recruitment':
      switch (status as RecruitmentStatusType) {
        case RecruitmentStatus.PLANNING: return 0;
        case RecruitmentStatus.PUBLISHED: return 20;
        case RecruitmentStatus.INTERVIEWING: return 50;
        case RecruitmentStatus.OFFERED: return 80;
        case RecruitmentStatus.ONBOARDED: return 100;
        case RecruitmentStatus.COMPLETED: return 100;
        case RecruitmentStatus.CANCELLED: return 0;
        default: return 0;
      }
    
    case 'milestone':
      switch (status as MilestoneStatusType) {
        case MilestoneStatus.PENDING: return 0;
        case MilestoneStatus.IN_PROGRESS: return 50;
        case MilestoneStatus.COMPLETED: return 100;
        case MilestoneStatus.OVERDUE: return 40;
        case MilestoneStatus.BLOCKED: return 20;
        case MilestoneStatus.CANCELLED: return 0;
        default: return 0;
      }
    
    default:
      return 0;
  }
};

// ===============================
// 数据统计工具函数
// ===============================

/**
 * 计算完成率
 */
export const calculateCompletionRate = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * 计算按时完成率
 */
export const calculateOnTimeCompletionRate = (
  items: Array<{
    status: string;
    plannedEndDate: Date;
    actualEndDate?: Date;
  }>,
  statusType: 'preparation' | 'engineering' | 'milestone' = 'preparation'
): number => {
  const completedItems = items.filter(item => isCompletedStatus(item.status, statusType));
  if (completedItems.length === 0) return 0;
  
  const onTimeItems = completedItems.filter(item => 
    item.actualEndDate && item.actualEndDate <= item.plannedEndDate
  );
  
  return Math.round((onTimeItems.length / completedItems.length) * 100);
};

/**
 * 计算平均进度
 */
export const calculateAverageProgress = (progresses: number[]): number => {
  if (progresses.length === 0) return 0;
  const sum = progresses.reduce((acc, progress) => acc + progress, 0);
  return Math.round(sum / progresses.length);
};

/**
 * 获取进度趋势
 */
export const getProgressTrend = (
  currentProgress: number,
  previousProgress: number
): 'up' | 'down' | 'stable' => {
  if (currentProgress > previousProgress) return 'up';
  if (currentProgress < previousProgress) return 'down';
  return 'stable';
};

// ===============================
// 格式化工具函数
// ===============================

/**
 * 格式化金额显示
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'CNY',
  showSymbol: boolean = true
): string => {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  
  const symbol = showSymbol ? (symbols[currency] || '') : '';
  const formattedAmount = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol}${formattedAmount}`;
};

/**
 * 格式化百分比显示
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * 格式化日期显示
 */
export const formatDate = (date: Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'short':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      options.weekday = 'long';
      break;
    case 'time':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
  }
  
  return new Intl.DateTimeFormat('zh-CN', options).format(date);
};

/**
 * 格式化相对日期（几天前/几天后）
 */
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffDays = getDaysDifference(now, date);
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays > 0) return `${diffDays}天后`;
  return `${Math.abs(diffDays)}天前`;
};

// ===============================
// 业务规则工具函数
// ===============================

/**
 * 获取设备类别显示名称
 */
export const getEquipmentCategoryName = (category: EquipmentCategoryType): string => {
  const names: Record<EquipmentCategoryType, string> = {
    KITCHEN: '厨房设备',
    DINING: '餐厅设备',
    COOLING: '制冷设备',
    CLEANING: '清洁设备',
    SAFETY: '安全设备',
    FURNITURE: '家具设备',
    TECHNOLOGY: '技术设备',
    DECORATION: '装饰设备',
    OTHER: '其他设备',
  };
  return names[category] || '未知类别';
};

/**
 * 获取证照类型显示名称
 */
export const getLicenseTypeName = (licenseType: LicenseTypeType): string => {
  const names: Record<LicenseTypeType, string> = {
    BUSINESS: '营业执照',
    FOOD_SERVICE: '食品经营许可证',
    FIRE_SAFETY: '消防安全检查合格证',
    HEALTH: '健康证',
    TAX: '税务登记证',
    SIGNBOARD: '门头招牌许可证',
    ENVIRONMENTAL: '环保许可证',
    SPECIAL: '特殊许可证',
    OTHER: '其他证照',
  };
  return names[licenseType] || '未知证照';
};

/**
 * 获取职位类型显示名称
 */
export const getPositionTypeName = (positionType: PositionTypeType): string => {
  const names: Record<PositionTypeType, string> = {
    MANAGER: '店长/经理',
    CHEF: '厨师',
    SERVER: '服务员',
    CASHIER: '收银员',
    CLEANER: '保洁员',
    SECURITY: '保安',
    MAINTENANCE: '维修工',
    SALES: '销售员',
    OTHER: '其他职位',
  };
  return names[positionType] || '未知职位';
};

/**
 * 获取优先级显示名称
 */
export const getPriorityName = (priority: Priority): string => {
  const names: Record<Priority, string> = {
    URGENT: '紧急',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return names[priority] || '未知';
};

/**
 * 获取状态显示名称
 */
export const getStatusName = (
  status: string,
  type: 'preparation' | 'engineering' | 'equipment' | 'license' | 'recruitment' | 'milestone'
): string => {
  const preparationNames: Record<PreparationStatusType, string> = {
    PLANNING: '规划中',
    APPROVED: '已批准',
    IN_PROGRESS: '进行中',
    SUSPENDED: '已暂停',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    OVERDUE: '已逾期',
  };
  
  const engineeringNames: Record<EngineeringStatusType, string> = {
    PLANNED: '已计划',
    APPROVED: '已批准',
    IN_PROGRESS: '施工中',
    SUSPENDED: '已暂停',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    ACCEPTED: '已验收',
    WARRANTY: '保修期',
  };
  
  const equipmentNames: Record<EquipmentStatusType, string> = {
    PENDING: '待采购',
    QUOTED: '已报价',
    APPROVED: '已批准',
    ORDERED: '已下单',
    DELIVERED: '已交付',
    INSTALLED: '已安装',
    ACCEPTED: '已验收',
    WARRANTY: '保修期',
    MAINTENANCE: '维护中',
  };
  
  const licenseNames: Record<LicenseStatusType, string> = {
    PENDING: '待办理',
    SUBMITTED: '已提交',
    UNDER_REVIEW: '审核中',
    APPROVED: '已批准',
    ISSUED: '已发证',
    REJECTED: '已拒绝',
    EXPIRED: '已过期',
    RENEWED: '已续期',
  };
  
  const recruitmentNames: Record<RecruitmentStatusType, string> = {
    PLANNING: '规划中',
    PUBLISHED: '已发布',
    INTERVIEWING: '面试中',
    OFFERED: '已发offer',
    ONBOARDED: '已入职',
    CANCELLED: '已取消',
    COMPLETED: '已完成',
  };
  
  const milestoneNames: Record<MilestoneStatusType, string> = {
    PENDING: '待开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    OVERDUE: '已逾期',
    CANCELLED: '已取消',
    BLOCKED: '被阻塞',
  };
  
  switch (type) {
    case 'preparation':
      return preparationNames[status as PreparationStatusType] || '未知状态';
    case 'engineering':
      return engineeringNames[status as EngineeringStatusType] || '未知状态';
    case 'equipment':
      return equipmentNames[status as EquipmentStatusType] || '未知状态';
    case 'license':
      return licenseNames[status as LicenseStatusType] || '未知状态';
    case 'recruitment':
      return recruitmentNames[status as RecruitmentStatusType] || '未知状态';
    case 'milestone':
      return milestoneNames[status as MilestoneStatusType] || '未知状态';
    default:
      return '未知状态';
  }
};

/**
 * 验证日期范围
 */
export const validateDateRange = (startDate: Date, endDate: Date): { valid: boolean; message?: string } => {
  if (startDate >= endDate) {
    return { valid: false, message: '开始日期必须早于结束日期' };
  }
  
  const daysDiff = getDaysDifference(startDate, endDate);
  if (daysDiff > 365 * 2) {
    return { valid: false, message: '项目周期不能超过两年' };
  }
  
  return { valid: true };
};

/**
 * 生成项目编号
 */
export const generateProjectCode = (prefix: string, locationCode: string): string => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const day = new Date().getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${prefix}${year}${month}${day}${locationCode}${random}`;
};

/**
 * 检查项目编号唯一性
 */
export const isValidProjectCode = (code: string): boolean => {
  // 项目编号格式：PREP20241201BJ001
  const regex = /^[A-Z]{3,4}\d{8}[A-Z]{2,3}\d{3}$/;
  return regex.test(code);
};