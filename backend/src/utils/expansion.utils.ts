/**
 * 拓店管理工具函数
 * 提供地理位置处理、评分计算、状态转换等通用工具函数
 */

import { 
  CandidateLocationStatusType,
  PriorityLevelType,
  statusTransitions,
  EVALUATION_WEIGHTS,
} from '@/types/expansion.js';

// ===============================
// 地理位置工具函数
// ===============================

/**
 * 解析坐标字符串
 */
export const parseCoordinates = (coordinateString: string): { latitude: number; longitude: number } | null => {
  try {
    const parts = coordinateString.split(',');
    if (parts.length !== 2) return null;
    
    const longitude = parseFloat(parts[0]?.trim() || '0');
    const latitude = parseFloat(parts[1]?.trim() || '0');
    
    if (isNaN(longitude) || isNaN(latitude)) return null;
    if (latitude < -90 || latitude > 90) return null;
    if (longitude < -180 || longitude > 180) return null;
    
    return { latitude, longitude };
  } catch {
    return null;
  }
};

/**
 * 格式化坐标为字符串
 */
export const formatCoordinates = (latitude: number, longitude: number): string => {
  return `${longitude.toFixed(6)},${latitude.toFixed(6)}`;
};

/**
 * 计算两点间距离（haversine公式，单位：米）
 */
export const calculateDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number => {
  const R = 6371000; // 地球半径（米）
  const φ1 = coord1.latitude * Math.PI / 180;
  const φ2 = coord2.latitude * Math.PI / 180;
  const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * 判断点是否在矩形区域内
 */
export const isPointInBounds = (
  point: { latitude: number; longitude: number },
  bounds: {
    northeast: { latitude: number; longitude: number };
    southwest: { latitude: number; longitude: number };
  }
): boolean => {
  return (
    point.latitude >= bounds.southwest.latitude &&
    point.latitude <= bounds.northeast.latitude &&
    point.longitude >= bounds.southwest.longitude &&
    point.longitude <= bounds.northeast.longitude
  );
};

// ===============================
// 评分计算工具函数
// ===============================

/**
 * 计算综合评分
 */
export const calculateOverallScore = (criteria: {
  location: number;
  traffic: number;
  competition: number;
  cost: number;
  potential: number;
}): number => {
  const score = (
    criteria.location * EVALUATION_WEIGHTS.location +
    criteria.traffic * EVALUATION_WEIGHTS.traffic +
    criteria.competition * EVALUATION_WEIGHTS.competition +
    criteria.cost * EVALUATION_WEIGHTS.cost +
    criteria.potential * EVALUATION_WEIGHTS.potential
  );
  
  return Math.round(score * 10) / 10; // 保留一位小数
};

/**
 * 获取评分等级
 */
export const getScoreGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (score >= 9.0) return 'A';
  if (score >= 8.0) return 'B';
  if (score >= 7.0) return 'C';
  if (score >= 6.0) return 'D';
  return 'F';
};

/**
 * 获取评分颜色代码
 */
export const getScoreColor = (score: number): string => {
  if (score >= 9.0) return '#52c41a'; // 绿色
  if (score >= 8.0) return '#1890ff'; // 蓝色
  if (score >= 7.0) return '#faad14'; // 黄色
  if (score >= 6.0) return '#fa8c16'; // 橙色
  return '#ff4d4f'; // 红色
};

// ===============================
// 状态转换工具函数
// ===============================

/**
 * 验证状态转换是否合法
 */
export const isValidStatusTransition = (
  currentStatus: CandidateLocationStatusType,
  targetStatus: CandidateLocationStatusType
): boolean => {
  return statusTransitions[currentStatus]?.includes(targetStatus) || false;
};

/**
 * 获取可用的下一状态
 */
export const getAvailableStatuses = (
  currentStatus: CandidateLocationStatusType
): CandidateLocationStatusType[] => {
  return statusTransitions[currentStatus] || [];
};

/**
 * 获取状态描述
 */
export const getStatusDescription = (status: CandidateLocationStatusType): string => {
  const descriptions = {
    PENDING: '待评估',
    EVALUATING: '评估中',
    FOLLOWING: '跟进中',
    NEGOTIATING: '商务谈判',
    CONTRACTED: '已签约',
    REJECTED: '已拒绝',
    SUSPENDED: '暂停',
  };
  return descriptions[status] || status;
};

/**
 * 获取状态颜色
 */
export const getStatusColor = (status: CandidateLocationStatusType): string => {
  const colors = {
    PENDING: '#d9d9d9',        // 灰色
    EVALUATING: '#1890ff',     // 蓝色
    FOLLOWING: '#faad14',      // 黄色
    NEGOTIATING: '#fa8c16',    // 橙色
    CONTRACTED: '#52c41a',     // 绿色
    REJECTED: '#ff4d4f',       // 红色
    SUSPENDED: '#722ed1',      // 紫色
  };
  return colors[status] || '#d9d9d9';
};

// ===============================
// 优先级工具函数
// ===============================

/**
 * 获取优先级描述
 */
export const getPriorityDescription = (priority: PriorityLevelType): string => {
  const descriptions = {
    URGENT: '紧急',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return descriptions[priority] || priority;
};

/**
 * 获取优先级颜色
 */
export const getPriorityColor = (priority: PriorityLevelType): string => {
  const colors = {
    URGENT: '#ff4d4f',    // 红色
    HIGH: '#fa8c16',      // 橙色
    MEDIUM: '#1890ff',    // 蓝色
    LOW: '#52c41a',       // 绿色
  };
  return colors[priority] || '#1890ff';
};

/**
 * 获取优先级权重（用于排序）
 */
export const getPriorityWeight = (priority: PriorityLevelType): number => {
  const weights = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };
  return weights[priority] || 0;
};

// ===============================
// 数据格式化工具函数
// ===============================

/**
 * 格式化面积显示
 */
export const formatArea = (area: number): string => {
  if (area < 1000) {
    return `${area}㎡`;
  }
  return `${(area / 1000).toFixed(1)}k㎡`;
};

/**
 * 格式化价格显示
 */
export const formatPrice = (price: number): string => {
  if (price < 10000) {
    return `¥${price.toFixed(0)}`;
  }
  if (price < 100000) {
    return `¥${(price / 10000).toFixed(1)}万`;
  }
  return `¥${(price / 10000).toFixed(0)}万`;
};

/**
 * 格式化距离显示
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${distance.toFixed(0)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

/**
 * 格式化时长显示
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${remainingMinutes}分钟`;
};

// ===============================
// 数据验证工具函数
// ===============================

/**
 * 验证手机号格式
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证URL格式
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 清理和格式化文本
 */
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // 替换多个空白字符为单个空格
    .replace(/[<>\"']/g, ''); // 移除潜在的HTML字符
};

// ===============================
// 日期时间工具函数
// ===============================

/**
 * 格式化日期显示
 */
export const formatDate = (date: Date | string, format: 'date' | 'datetime' | 'relative' = 'date'): string => {
  const d = new Date(date);
  
  if (format === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays === -1) return '明天';
    if (diffDays > 0) return `${diffDays}天前`;
    return `${Math.abs(diffDays)}天后`;
  }
  
  if (format === 'datetime') {
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * 计算预计处理时间
 */
export const getEstimatedProcessTime = (status: CandidateLocationStatusType, priority: PriorityLevelType): number => {
  const baseTime = {
    PENDING: 3,      // 3天
    EVALUATING: 7,   // 7天
    FOLLOWING: 14,   // 14天
    NEGOTIATING: 21, // 21天
    CONTRACTED: 0,   // 已完成
    REJECTED: 0,     // 已完成
    SUSPENDED: 0,    // 暂停
  };
  
  const priorityMultiplier = {
    URGENT: 0.5,   // 紧急减半
    HIGH: 0.7,     // 高优先级
    MEDIUM: 1.0,   // 正常
    LOW: 1.5,      // 低优先级增加50%
  };
  
  return Math.ceil(baseTime[status] * priorityMultiplier[priority]);
};

// ===============================
// 统计计算工具函数
// ===============================

/**
 * 计算转化率
 */
export const calculateConversionRate = (converted: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((converted / total) * 100 * 100) / 100; // 保留两位小数
};

/**
 * 计算平均值
 */
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
};

/**
 * 计算增长率
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
};

// ===============================
// 数据导出工具函数
// ===============================

/**
 * 转换对象为CSV行
 */
export const objectToCsvRow = (obj: Record<string, any>): string => {
  return Object.values(obj)
    .map(value => {
      const str = String(value || '');
      // 如果包含逗号、双引号或换行符，则用双引号包围并转义双引号
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
    .join(',');
};

/**
 * 获取CSV文件头
 */
export const getCsvHeaders = (data: Record<string, any>[]): string => {
  if (data.length === 0) return '';
  return Object.keys(data[0] || {}).join(',');
};

/**
 * 生成CSV内容
 */
export const generateCsvContent = (data: Record<string, any>[]): string => {
  if (data.length === 0) return '';
  
  const headers = getCsvHeaders(data);
  const rows = data.map(objectToCsvRow);
  
  return [headers, ...rows].join('\n');
};

// ===============================
// 标签管理工具函数
// ===============================

/**
 * 解析标签字符串
 */
export const parseTags = (tagString: string): string[] => {
  if (!tagString) return [];
  return tagString
    .split(/[,，]/) // 支持中英文逗号
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 20)
    .slice(0, 10); // 最多10个标签
};

/**
 * 格式化标签数组为字符串
 */
export const formatTags = (tags: string[]): string => {
  return tags.filter(tag => tag && tag.trim()).join(', ');
};

/**
 * 获取推荐标签
 */
export const getRecommendedTags = (
  status: CandidateLocationStatusType,
  priority: PriorityLevelType,
  area?: number,
  rentPrice?: number
): string[] => {
  const tags: string[] = [];
  
  // 状态相关标签
  if (status === 'FOLLOWING') tags.push('跟进中');
  if (status === 'NEGOTIATING') tags.push('商务谈判');
  if (status === 'CONTRACTED') tags.push('已签约');
  
  // 优先级相关标签
  if (priority === 'URGENT') tags.push('紧急');
  if (priority === 'HIGH') tags.push('高优先级');
  
  // 面积相关标签
  if (area) {
    if (area < 100) tags.push('小面积');
    else if (area > 500) tags.push('大面积');
  }
  
  // 租金相关标签
  if (rentPrice) {
    if (rentPrice < 10000) tags.push('低租金');
    else if (rentPrice > 50000) tags.push('高租金');
  }
  
  return tags;
};

// ===============================
// 工具函数导出
// ===============================

export const ExpansionUtils = {
  // 地理位置
  parseCoordinates,
  formatCoordinates,
  calculateDistance,
  isPointInBounds,
  
  // 评分计算
  calculateOverallScore,
  getScoreGrade,
  getScoreColor,
  
  // 状态转换
  isValidStatusTransition,
  getAvailableStatuses,
  getStatusDescription,
  getStatusColor,
  
  // 优先级
  getPriorityDescription,
  getPriorityColor,
  getPriorityWeight,
  
  // 数据格式化
  formatArea,
  formatPrice,
  formatDistance,
  formatDuration,
  
  // 数据验证
  isValidPhone,
  isValidEmail,
  isValidUrl,
  sanitizeText,
  
  // 日期时间
  formatDate,
  getEstimatedProcessTime,
  
  // 统计计算
  calculateConversionRate,
  calculateAverage,
  calculateGrowthRate,
  
  // 数据导出
  objectToCsvRow,
  getCsvHeaders,
  generateCsvContent,
  
  // 标签管理
  parseTags,
  formatTags,
  getRecommendedTags,
};

export default ExpansionUtils;