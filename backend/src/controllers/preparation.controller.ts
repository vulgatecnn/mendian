import type { FastifyRequest, FastifyReply } from 'fastify';
import { BadRequestError, NotFoundError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';
import {
  // 业务服务
  preparationProjectService,
  engineeringTaskService,
  equipmentProcurementService,
  licenseApplicationService,
  staffRecruitmentService,
  milestoneTrackingService,
} from '@/services/business/preparation.service.js';
import {
  // 验证Schema
  createPreparationProjectSchema,
  updatePreparationProjectSchema,
  createEngineeringTaskSchema,
  updateEngineeringTaskSchema,
  createEquipmentProcurementSchema,
  updateEquipmentProcurementSchema,
  createLicenseApplicationSchema,
  updateLicenseApplicationSchema,
  createStaffRecruitmentSchema,
  updateStaffRecruitmentSchema,
  createMilestoneTrackingSchema,
  updateMilestoneTrackingSchema,
  statusChangeSchema,
  progressUpdateSchema,
  preparationProjectQuerySchema,
  batchOperationSchema,
  idParamSchema,
  
  // 类型定义
  CreatePreparationProjectData,
  UpdatePreparationProjectData,
  CreateEngineeringTaskData,
  UpdateEngineeringTaskData,
  CreateEquipmentProcurementData,
  UpdateEquipmentProcurementData,
  CreateLicenseApplicationData,
  UpdateLicenseApplicationData,
  CreateStaffRecruitmentData,
  UpdateStaffRecruitmentData,
  CreateMilestoneTrackingData,
  UpdateMilestoneTrackingData,
  StatusChangeData,
  ProgressUpdateData,
  BatchOperationData,
  IdParam,
  PreparationProjectQuery,
} from '@/types/preparation.js';

// ===============================
// 筹备项目管理控制器
// ===============================

/**
 * 获取筹备项目列表
 */
export const getPreparationProjects = async (
  request: FastifyRequest<{ Querystring: PreparationProjectQuery }>,
  reply: FastifyReply
) => {
  try {
    const query = preparationProjectQuerySchema.parse(request.query);
    const result = await preparationProjectService.getList(query);
    
    reply.send({
      success: true,
      data: result,
      message: '获取筹备项目列表成功',
    });
  } catch (error) {
    logger.error('获取筹备项目列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取筹备项目详情
 */
export const getPreparationProjectById = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const project = await preparationProjectService.getById(id);
    
    reply.send({
      success: true,
      data: project,
      message: '获取筹备项目详情成功',
    });
  } catch (error) {
    logger.error('获取筹备项目详情失败:', error);
    throw error;
  }
};

/**
 * 创建筹备项目
 */
export const createPreparationProject = async (
  request: FastifyRequest<{ Body: CreatePreparationProjectData }>,
  reply: FastifyReply
) => {
  try {
    const data = createPreparationProjectSchema.parse(request.body);
    const project = await preparationProjectService.create(data);
    
    reply.status(201).send({
      success: true,
      data: project,
      message: '创建筹备项目成功',
    });
  } catch (error) {
    logger.error('创建筹备项目失败:', error);
    throw error;
  }
};

/**
 * 更新筹备项目
 */
export const updatePreparationProject = async (
  request: FastifyRequest<{ Params: IdParam; Body: UpdatePreparationProjectData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const data = updatePreparationProjectSchema.parse(request.body);
    const project = await preparationProjectService.update(id, data);
    
    reply.send({
      success: true,
      data: project,
      message: '更新筹备项目成功',
    });
  } catch (error) {
    logger.error('更新筹备项目失败:', error);
    throw error;
  }
};

/**
 * 删除筹备项目
 */
export const deletePreparationProject = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    await preparationProjectService.delete(id);
    
    reply.send({
      success: true,
      message: '删除筹备项目成功',
    });
  } catch (error) {
    logger.error('删除筹备项目失败:', error);
    throw error;
  }
};

/**
 * 更改筹备项目状态
 */
export const changePreparationProjectStatus = async (
  request: FastifyRequest<{ Params: IdParam; Body: StatusChangeData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const statusData = statusChangeSchema.parse(request.body);
    const project = await preparationProjectService.changeStatus(id, statusData);
    
    reply.send({
      success: true,
      data: project,
      message: '更改筹备项目状态成功',
    });
  } catch (error) {
    logger.error('更改筹备项目状态失败:', error);
    throw error;
  }
};

/**
 * 更新筹备项目进度
 */
export const updatePreparationProjectProgress = async (
  request: FastifyRequest<{ Params: IdParam; Body: ProgressUpdateData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const progressData = progressUpdateSchema.parse(request.body);
    const project = await preparationProjectService.updateProgress(id, progressData);
    
    reply.send({
      success: true,
      data: project,
      message: '更新筹备项目进度成功',
    });
  } catch (error) {
    logger.error('更新筹备项目进度失败:', error);
    throw error;
  }
};

/**
 * 批量操作筹备项目
 */
export const batchOperationPreparationProjects = async (
  request: FastifyRequest<{ Body: BatchOperationData }>,
  reply: FastifyReply
) => {
  try {
    const batchData = batchOperationSchema.parse(request.body);
    const result = await preparationProjectService.batchOperation(batchData);
    
    reply.send({
      success: true,
      data: result,
      message: `批量操作完成，成功：${result.success}，失败：${result.failed}`,
    });
  } catch (error) {
    logger.error('批量操作筹备项目失败:', error);
    throw error;
  }
};

/**
 * 获取筹备项目仪表板数据
 */
export const getPreparationDashboard = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const dashboard = await preparationProjectService.getDashboard();
    
    reply.send({
      success: true,
      data: dashboard,
      message: '获取筹备项目仪表板数据成功',
    });
  } catch (error) {
    logger.error('获取筹备项目仪表板数据失败:', error);
    throw error;
  }
};

// ===============================
// 工程任务管理控制器
// ===============================

/**
 * 获取工程任务列表
 */
export const getEngineeringTasks = async (
  request: FastifyRequest<{ Querystring: any }>,
  reply: FastifyReply
) => {
  try {
    const query = preparationProjectQuerySchema.parse(request.query); // 复用查询schema，可能需要专门的工程任务schema
    const result = await engineeringTaskService.getList(query as any);
    
    reply.send({
      success: true,
      data: result,
      message: '获取工程任务列表成功',
    });
  } catch (error) {
    logger.error('获取工程任务列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取工程任务详情
 */
export const getEngineeringTaskById = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const task = await engineeringTaskService.getById(id);
    
    reply.send({
      success: true,
      data: task,
      message: '获取工程任务详情成功',
    });
  } catch (error) {
    logger.error('获取工程任务详情失败:', error);
    throw error;
  }
};

/**
 * 创建工程任务
 */
export const createEngineeringTask = async (
  request: FastifyRequest<{ Body: CreateEngineeringTaskData }>,
  reply: FastifyReply
) => {
  try {
    const data = createEngineeringTaskSchema.parse(request.body);
    const task = await engineeringTaskService.create(data);
    
    reply.status(201).send({
      success: true,
      data: task,
      message: '创建工程任务成功',
    });
  } catch (error) {
    logger.error('创建工程任务失败:', error);
    throw error;
  }
};

/**
 * 更新工程任务
 */
export const updateEngineeringTask = async (
  request: FastifyRequest<{ Params: IdParam; Body: UpdateEngineeringTaskData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const data = updateEngineeringTaskSchema.parse(request.body);
    const task = await engineeringTaskService.update(id, data);
    
    reply.send({
      success: true,
      data: task,
      message: '更新工程任务成功',
    });
  } catch (error) {
    logger.error('更新工程任务失败:', error);
    throw error;
  }
};

/**
 * 删除工程任务
 */
export const deleteEngineeringTask = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    await engineeringTaskService.delete(id);
    
    reply.send({
      success: true,
      message: '删除工程任务成功',
    });
  } catch (error) {
    logger.error('删除工程任务失败:', error);
    throw error;
  }
};

/**
 * 更改工程任务状态
 */
export const changeEngineeringTaskStatus = async (
  request: FastifyRequest<{ Params: IdParam; Body: StatusChangeData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const statusData = statusChangeSchema.parse(request.body);
    const task = await engineeringTaskService.changeStatus(id, statusData);
    
    reply.send({
      success: true,
      data: task,
      message: '更改工程任务状态成功',
    });
  } catch (error) {
    logger.error('更改工程任务状态失败:', error);
    throw error;
  }
};

/**
 * 获取工程任务统计数据
 */
export const getEngineeringStatistics = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const statistics = await engineeringTaskService.getStatistics();
    
    reply.send({
      success: true,
      data: statistics,
      message: '获取工程任务统计数据成功',
    });
  } catch (error) {
    logger.error('获取工程任务统计数据失败:', error);
    throw error;
  }
};

// ===============================
// 设备采购管理控制器
// ===============================

/**
 * 获取设备采购列表
 */
export const getEquipmentProcurements = async (
  request: FastifyRequest<{ Querystring: any }>,
  reply: FastifyReply
) => {
  try {
    const query = preparationProjectQuerySchema.parse(request.query); // 需要专门的设备采购查询schema
    const result = await equipmentProcurementService.getList(query as any);
    
    reply.send({
      success: true,
      data: result,
      message: '获取设备采购列表成功',
    });
  } catch (error) {
    logger.error('获取设备采购列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取设备采购详情
 */
export const getEquipmentProcurementById = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const procurement = await equipmentProcurementService.getById(id);
    
    reply.send({
      success: true,
      data: procurement,
      message: '获取设备采购详情成功',
    });
  } catch (error) {
    logger.error('获取设备采购详情失败:', error);
    throw error;
  }
};

/**
 * 创建设备采购
 */
export const createEquipmentProcurement = async (
  request: FastifyRequest<{ Body: CreateEquipmentProcurementData }>,
  reply: FastifyReply
) => {
  try {
    const data = createEquipmentProcurementSchema.parse(request.body);
    const procurement = await equipmentProcurementService.create(data);
    
    reply.status(201).send({
      success: true,
      data: procurement,
      message: '创建设备采购成功',
    });
  } catch (error) {
    logger.error('创建设备采购失败:', error);
    throw error;
  }
};

/**
 * 更新设备采购
 */
export const updateEquipmentProcurement = async (
  request: FastifyRequest<{ Params: IdParam; Body: UpdateEquipmentProcurementData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const data = updateEquipmentProcurementSchema.parse(request.body);
    const procurement = await equipmentProcurementService.update(id, data);
    
    reply.send({
      success: true,
      data: procurement,
      message: '更新设备采购成功',
    });
  } catch (error) {
    logger.error('更新设备采购失败:', error);
    throw error;
  }
};

/**
 * 删除设备采购
 */
export const deleteEquipmentProcurement = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    await equipmentProcurementService.delete(id);
    
    reply.send({
      success: true,
      message: '删除设备采购成功',
    });
  } catch (error) {
    logger.error('删除设备采购失败:', error);
    throw error;
  }
};

/**
 * 获取设备采购统计数据
 */
export const getEquipmentStatistics = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const statistics = await equipmentProcurementService.getStatistics();
    
    reply.send({
      success: true,
      data: statistics,
      message: '获取设备采购统计数据成功',
    });
  } catch (error) {
    logger.error('获取设备采购统计数据失败:', error);
    throw error;
  }
};

// ===============================
// 证照办理管理控制器
// ===============================

/**
 * 获取证照办理列表
 */
export const getLicenseApplications = async (
  request: FastifyRequest<{ Querystring: any }>,
  reply: FastifyReply
) => {
  try {
    const query = preparationProjectQuerySchema.parse(request.query); // 需要专门的证照办理查询schema
    const result = await licenseApplicationService.getList(query as any);
    
    reply.send({
      success: true,
      data: result,
      message: '获取证照办理列表成功',
    });
  } catch (error) {
    logger.error('获取证照办理列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取证照办理详情
 */
export const getLicenseApplicationById = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const application = await licenseApplicationService.getById(id);
    
    reply.send({
      success: true,
      data: application,
      message: '获取证照办理详情成功',
    });
  } catch (error) {
    logger.error('获取证照办理详情失败:', error);
    throw error;
  }
};

/**
 * 创建证照办理
 */
export const createLicenseApplication = async (
  request: FastifyRequest<{ Body: CreateLicenseApplicationData }>,
  reply: FastifyReply
) => {
  try {
    const data = createLicenseApplicationSchema.parse(request.body);
    const application = await licenseApplicationService.create(data);
    
    reply.status(201).send({
      success: true,
      data: application,
      message: '创建证照办理成功',
    });
  } catch (error) {
    logger.error('创建证照办理失败:', error);
    throw error;
  }
};

/**
 * 更新证照办理
 */
export const updateLicenseApplication = async (
  request: FastifyRequest<{ Params: IdParam; Body: UpdateLicenseApplicationData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const data = updateLicenseApplicationSchema.parse(request.body);
    const application = await licenseApplicationService.update(id, data);
    
    reply.send({
      success: true,
      data: application,
      message: '更新证照办理成功',
    });
  } catch (error) {
    logger.error('更新证照办理失败:', error);
    throw error;
  }
};

/**
 * 删除证照办理
 */
export const deleteLicenseApplication = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    await licenseApplicationService.delete(id);
    
    reply.send({
      success: true,
      message: '删除证照办理成功',
    });
  } catch (error) {
    logger.error('删除证照办理失败:', error);
    throw error;
  }
};

/**
 * 获取证照办理统计数据
 */
export const getLicenseStatistics = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const statistics = await licenseApplicationService.getStatistics();
    
    reply.send({
      success: true,
      data: statistics,
      message: '获取证照办理统计数据成功',
    });
  } catch (error) {
    logger.error('获取证照办理统计数据失败:', error);
    throw error;
  }
};

// ===============================
// 人员招聘管理控制器
// ===============================

/**
 * 获取人员招聘列表
 */
export const getStaffRecruitments = async (
  request: FastifyRequest<{ Querystring: any }>,
  reply: FastifyReply
) => {
  try {
    const query = preparationProjectQuerySchema.parse(request.query); // 需要专门的人员招聘查询schema
    const result = await staffRecruitmentService.getList(query as any);
    
    reply.send({
      success: true,
      data: result,
      message: '获取人员招聘列表成功',
    });
  } catch (error) {
    logger.error('获取人员招聘列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取人员招聘详情
 */
export const getStaffRecruitmentById = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const recruitment = await staffRecruitmentService.getById(id);
    
    reply.send({
      success: true,
      data: recruitment,
      message: '获取人员招聘详情成功',
    });
  } catch (error) {
    logger.error('获取人员招聘详情失败:', error);
    throw error;
  }
};

/**
 * 创建人员招聘
 */
export const createStaffRecruitment = async (
  request: FastifyRequest<{ Body: CreateStaffRecruitmentData }>,
  reply: FastifyReply
) => {
  try {
    const data = createStaffRecruitmentSchema.parse(request.body);
    const recruitment = await staffRecruitmentService.create(data);
    
    reply.status(201).send({
      success: true,
      data: recruitment,
      message: '创建人员招聘成功',
    });
  } catch (error) {
    logger.error('创建人员招聘失败:', error);
    throw error;
  }
};

/**
 * 更新人员招聘
 */
export const updateStaffRecruitment = async (
  request: FastifyRequest<{ Params: IdParam; Body: UpdateStaffRecruitmentData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const data = updateStaffRecruitmentSchema.parse(request.body);
    const recruitment = await staffRecruitmentService.update(id, data);
    
    reply.send({
      success: true,
      data: recruitment,
      message: '更新人员招聘成功',
    });
  } catch (error) {
    logger.error('更新人员招聘失败:', error);
    throw error;
  }
};

/**
 * 删除人员招聘
 */
export const deleteStaffRecruitment = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    await staffRecruitmentService.delete(id);
    
    reply.send({
      success: true,
      message: '删除人员招聘成功',
    });
  } catch (error) {
    logger.error('删除人员招聘失败:', error);
    throw error;
  }
};

/**
 * 获取人员招聘统计数据
 */
export const getRecruitmentStatistics = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const statistics = await staffRecruitmentService.getStatistics();
    
    reply.send({
      success: true,
      data: statistics,
      message: '获取人员招聘统计数据成功',
    });
  } catch (error) {
    logger.error('获取人员招聘统计数据失败:', error);
    throw error;
  }
};

// ===============================
// 里程碑跟踪管理控制器
// ===============================

/**
 * 获取里程碑跟踪列表
 */
export const getMilestoneTrackings = async (
  request: FastifyRequest<{ Querystring: any }>,
  reply: FastifyReply
) => {
  try {
    const query = preparationProjectQuerySchema.parse(request.query); // 需要专门的里程碑跟踪查询schema
    const result = await milestoneTrackingService.getList(query as any);
    
    reply.send({
      success: true,
      data: result,
      message: '获取里程碑跟踪列表成功',
    });
  } catch (error) {
    logger.error('获取里程碑跟踪列表失败:', error);
    throw error;
  }
};

/**
 * 根据ID获取里程碑跟踪详情
 */
export const getMilestoneTrackingById = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const milestone = await milestoneTrackingService.getById(id);
    
    reply.send({
      success: true,
      data: milestone,
      message: '获取里程碑跟踪详情成功',
    });
  } catch (error) {
    logger.error('获取里程碑跟踪详情失败:', error);
    throw error;
  }
};

/**
 * 创建里程碑跟踪
 */
export const createMilestoneTracking = async (
  request: FastifyRequest<{ Body: CreateMilestoneTrackingData }>,
  reply: FastifyReply
) => {
  try {
    const data = createMilestoneTrackingSchema.parse(request.body);
    const milestone = await milestoneTrackingService.create(data);
    
    reply.status(201).send({
      success: true,
      data: milestone,
      message: '创建里程碑跟踪成功',
    });
  } catch (error) {
    logger.error('创建里程碑跟踪失败:', error);
    throw error;
  }
};

/**
 * 更新里程碑跟踪
 */
export const updateMilestoneTracking = async (
  request: FastifyRequest<{ Params: IdParam; Body: UpdateMilestoneTrackingData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const data = updateMilestoneTrackingSchema.parse(request.body);
    const milestone = await milestoneTrackingService.update(id, data);
    
    reply.send({
      success: true,
      data: milestone,
      message: '更新里程碑跟踪成功',
    });
  } catch (error) {
    logger.error('更新里程碑跟踪失败:', error);
    throw error;
  }
};

/**
 * 删除里程碑跟踪
 */
export const deleteMilestoneTracking = async (
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    await milestoneTrackingService.delete(id);
    
    reply.send({
      success: true,
      message: '删除里程碑跟踪成功',
    });
  } catch (error) {
    logger.error('删除里程碑跟踪失败:', error);
    throw error;
  }
};

/**
 * 更改里程碑状态
 */
export const changeMilestoneStatus = async (
  request: FastifyRequest<{ Params: IdParam; Body: StatusChangeData }>,
  reply: FastifyReply
) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const statusData = statusChangeSchema.parse(request.body);
    const milestone = await milestoneTrackingService.changeStatus(id, statusData);
    
    reply.send({
      success: true,
      data: milestone,
      message: '更改里程碑状态成功',
    });
  } catch (error) {
    logger.error('更改里程碑状态失败:', error);
    throw error;
  }
};

/**
 * 获取里程碑跟踪统计数据
 */
export const getMilestoneStatistics = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const statistics = await milestoneTrackingService.getStatistics();
    
    reply.send({
      success: true,
      data: statistics,
      message: '获取里程碑跟踪统计数据成功',
    });
  } catch (error) {
    logger.error('获取里程碑跟踪统计数据失败:', error);
    throw error;
  }
};