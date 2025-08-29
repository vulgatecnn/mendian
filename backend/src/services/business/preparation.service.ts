import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';
import { 
  // 筹备项目类型
  CreatePreparationProjectData,
  UpdatePreparationProjectData,
  PreparationProjectFilters,
  PreparationProjectWithRelations,
  PreparationProject,
  PreparationStatusType,
  PreparationStatus,
  PreparationDashboard,
  PreparationProgress,
  
  // 工程任务类型
  CreateEngineeringTaskData,
  UpdateEngineeringTaskData,
  EngineeringTaskFilters,
  EngineeringTaskWithRelations,
  EngineeringTask,
  EngineeringStatusType,
  EngineeringStatus,
  EngineeringStatistics,
  ProjectTypeType,
  
  // 设备采购类型
  CreateEquipmentProcurementData,
  UpdateEquipmentProcurementData,
  EquipmentProcurementFilters,
  EquipmentProcurementWithRelations,
  EquipmentProcurement,
  EquipmentStatusType,
  EquipmentStatus,
  EquipmentCategoryType,
  EquipmentStatistics,
  
  // 证照办理类型
  CreateLicenseApplicationData,
  UpdateLicenseApplicationData,
  LicenseApplicationFilters,
  LicenseApplicationWithRelations,
  LicenseApplication,
  LicenseStatusType,
  LicenseStatus,
  LicenseTypeType,
  LicenseStatistics,
  
  // 人员招聘类型
  CreateStaffRecruitmentData,
  UpdateStaffRecruitmentData,
  StaffRecruitmentFilters,
  StaffRecruitmentWithRelations,
  StaffRecruitment,
  RecruitmentStatusType,
  RecruitmentStatus,
  PositionTypeType,
  RecruitmentStatistics,
  
  // 里程碑跟踪类型
  CreateMilestoneTrackingData,
  UpdateMilestoneTrackingData,
  MilestoneTrackingFilters,
  MilestoneTrackingWithRelations,
  MilestoneTracking,
  MilestoneStatusType,
  MilestoneStatus,
  MilestoneStatistics,
  
  // 通用类型
  PaginatedResult,
  StatusChangeData,
  ProgressUpdateData,
  BatchOperationData,
  SortParams,
  Priority,
  
  // 状态转换验证
  isValidPreparationStatusTransition,
  isValidEngineeringStatusTransition,
  getAvailablePreparationStatuses,
  getAvailableEngineeringStatuses,
} from '@/types/preparation.js';

const prisma = new PrismaClient();

// ===============================
// 辅助函数
// ===============================

/**
 * 生成筹备项目编号
 */
const generatePreparationProjectCode = (candidateLocationName: string): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const locationPrefix = candidateLocationName.substring(0, 3);
  return `PREP${year}-${locationPrefix}-${timestamp}`;
};

/**
 * 生成采购编号
 */
const generateProcurementCode = (projectCode: string, category: EquipmentCategoryType): string => {
  const timestamp = Date.now().toString().slice(-4);
  const categoryPrefix = category.substring(0, 3);
  return `${projectCode}-${categoryPrefix}-${timestamp}`;
};

/**
 * 生成证照申请编号
 */
const generateLicenseApplicationCode = (projectCode: string, licenseType: LicenseTypeType): string => {
  const timestamp = Date.now().toString().slice(-4);
  const typePrefix = licenseType.substring(0, 3);
  return `${projectCode}-${typePrefix}-${timestamp}`;
};

/**
 * 生成招聘编号
 */
const generateRecruitmentCode = (projectCode: string, positionType: PositionTypeType): string => {
  const timestamp = Date.now().toString().slice(-4);
  const positionPrefix = positionType.substring(0, 3);
  return `${projectCode}-${positionPrefix}-${timestamp}`;
};

/**
 * 构建筛选条件
 */
const buildWhereCondition = (filters: any): Prisma.PreparationProjectWhereInput => {
  const where: Prisma.PreparationProjectWhereInput = {};
  
  if (filters.candidateLocationId) where.candidateLocationId = filters.candidateLocationId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.managerId) where.managerId = filters.managerId;
  
  // 日期范围筛选
  if (filters.plannedStartDateStart || filters.plannedStartDateEnd) {
    where.plannedStartDate = {};
    if (filters.plannedStartDateStart) where.plannedStartDate.gte = new Date(filters.plannedStartDateStart);
    if (filters.plannedStartDateEnd) where.plannedStartDate.lte = new Date(filters.plannedStartDateEnd);
  }
  
  if (filters.plannedEndDateStart || filters.plannedEndDateEnd) {
    where.plannedEndDate = {};
    if (filters.plannedEndDateStart) where.plannedEndDate.gte = new Date(filters.plannedEndDateStart);
    if (filters.plannedEndDateEnd) where.plannedEndDate.lte = new Date(filters.plannedEndDateEnd);
  }
  
  // 预算范围筛选
  if (filters.minBudget || filters.maxBudget) {
    where.budget = {};
    if (filters.minBudget) where.budget.gte = filters.minBudget;
    if (filters.maxBudget) where.budget.lte = filters.maxBudget;
  }
  
  // 进度范围筛选
  if (filters.minProgress !== undefined || filters.maxProgress !== undefined) {
    where.progressPercentage = {};
    if (filters.minProgress !== undefined) where.progressPercentage.gte = filters.minProgress;
    if (filters.maxProgress !== undefined) where.progressPercentage.lte = filters.maxProgress;
  }
  
  // 关键词搜索
  if (filters.keyword) {
    where.OR = [
      { projectName: { contains: filters.keyword, mode: 'insensitive' } },
      { projectCode: { contains: filters.keyword, mode: 'insensitive' } },
      { storeName: { contains: filters.keyword, mode: 'insensitive' } },
      { storeCode: { contains: filters.keyword, mode: 'insensitive' } },
    ];
  }
  
  return where;
};

// ===============================
// 筹备项目管理服务
// ===============================

export const preparationProjectService = {
  /**
   * 获取筹备项目列表
   */
  async getList(filters: PreparationProjectFilters & { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedResult<PreparationProjectWithRelations>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...queryFilters } = filters;
    const skip = (page - 1) * limit;
    
    const where = buildWhereCondition(queryFilters);
    
    const orderBy: Prisma.PreparationProjectOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.PreparationProjectOrderByWithRelationInput] = sortOrder;
    }
    
    const [items, total] = await Promise.all([
      prisma.preparationProject.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          candidateLocation: {
            include: {
              region: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              username: true,
              department: {
                select: { id: true, name: true },
              },
            },
          },
          approvalFlow: {
            select: {
              id: true,
              status: true,
              currentStep: true,
            },
          },
          _count: {
            select: {
              engineeringTasks: true,
              equipmentProcurements: true,
              licenseApplications: true,
              staffRecruitments: true,
              milestones: true,
            },
          },
        },
      }),
      prisma.preparationProject.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: items as PreparationProjectWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * 根据ID获取筹备项目详情
   */
  async getById(id: string): Promise<PreparationProjectWithRelations> {
    const project = await prisma.preparationProject.findUnique({
      where: { id },
      include: {
        candidateLocation: {
          include: {
            region: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            username: true,
            department: {
              select: { id: true, name: true },
            },
          },
        },
        approvalFlow: true,
        engineeringTasks: {
          include: {
            supplier: true,
            quotations: true,
          },
        },
        equipmentProcurements: true,
        licenseApplications: true,
        staffRecruitments: true,
        milestones: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            engineeringTasks: true,
            equipmentProcurements: true,
            licenseApplications: true,
            staffRecruitments: true,
            milestones: true,
          },
        },
      },
    });
    
    if (!project) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    return project as PreparationProjectWithRelations;
  },

  /**
   * 创建筹备项目
   */
  async create(data: CreatePreparationProjectData): Promise<PreparationProject> {
    // 检查候选点位是否存在
    const candidateLocation = await prisma.candidateLocation.findUnique({
      where: { id: data.candidateLocationId },
    });
    
    if (!candidateLocation) {
      throw new NotFoundError('候选点位不存在');
    }
    
    // 生成项目编号
    const projectCode = generatePreparationProjectCode(candidateLocation.locationName);
    
    // 检查项目编号唯一性
    const existingProject = await prisma.preparationProject.findUnique({
      where: { projectCode },
    });
    
    if (existingProject) {
      throw new ConflictError('项目编号已存在');
    }
    
    // 验证项目经理是否存在
    if (data.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
      });
      if (!manager) {
        throw new NotFoundError('指定的项目经理不存在');
      }
    }
    
    const project = await prisma.preparationProject.create({
      data: {
        projectCode,
        projectName: data.projectName,
        candidateLocationId: data.candidateLocationId,
        storeCode: data.storeCode,
        storeName: data.storeName,
        priority: data.priority || Priority.MEDIUM,
        plannedStartDate: new Date(data.plannedStartDate),
        plannedEndDate: new Date(data.plannedEndDate),
        budget: data.budget,
        description: data.description,
        notes: data.notes,
        managerId: data.managerId,
        status: PreparationStatus.PLANNING,
        progressPercentage: 0,
      },
    });
    
    logger.info(`Created preparation project: ${project.projectCode}`, { projectId: project.id });
    
    return project as PreparationProject;
  },

  /**
   * 更新筹备项目
   */
  async update(id: string, data: UpdatePreparationProjectData): Promise<PreparationProject> {
    const existingProject = await prisma.preparationProject.findUnique({
      where: { id },
    });
    
    if (!existingProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    // 验证项目经理是否存在
    if (data.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
      });
      if (!manager) {
        throw new NotFoundError('指定的项目经理不存在');
      }
    }
    
    const updateData: Prisma.PreparationProjectUpdateInput = {};
    
    if (data.projectName) updateData.projectName = data.projectName;
    if (data.storeCode) updateData.storeCode = data.storeCode;
    if (data.storeName) updateData.storeName = data.storeName;
    if (data.priority) updateData.priority = data.priority;
    if (data.plannedStartDate) updateData.plannedStartDate = new Date(data.plannedStartDate);
    if (data.plannedEndDate) updateData.plannedEndDate = new Date(data.plannedEndDate);
    if (data.actualStartDate) updateData.actualStartDate = new Date(data.actualStartDate);
    if (data.actualEndDate) updateData.actualEndDate = new Date(data.actualEndDate);
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.actualBudget !== undefined) updateData.actualBudget = data.actualBudget;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.managerId !== undefined) updateData.managerId = data.managerId;
    
    const project = await prisma.preparationProject.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Updated preparation project: ${project.projectCode}`, { projectId: project.id });
    
    return project as PreparationProject;
  },

  /**
   * 删除筹备项目
   */
  async delete(id: string): Promise<void> {
    const existingProject = await prisma.preparationProject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            engineeringTasks: true,
            equipmentProcurements: true,
            licenseApplications: true,
            staffRecruitments: true,
            milestones: true,
          },
        },
      },
    });
    
    if (!existingProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    // 检查是否有关联数据
    const hasRelatedData = existingProject._count.engineeringTasks > 0 ||
                          existingProject._count.equipmentProcurements > 0 ||
                          existingProject._count.licenseApplications > 0 ||
                          existingProject._count.staffRecruitments > 0 ||
                          existingProject._count.milestones > 0;
    
    if (hasRelatedData) {
      throw new ConflictError('该筹备项目存在关联数据，无法删除');
    }
    
    await prisma.preparationProject.delete({
      where: { id },
    });
    
    logger.info(`Deleted preparation project: ${existingProject.projectCode}`, { projectId: id });
  },

  /**
   * 更改项目状态
   */
  async changeStatus(id: string, statusData: StatusChangeData): Promise<PreparationProject> {
    const existingProject = await prisma.preparationProject.findUnique({
      where: { id },
    });
    
    if (!existingProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    const currentStatus = existingProject.status as PreparationStatusType;
    const targetStatus = statusData.status as PreparationStatusType;
    
    // 验证状态转换是否合法
    if (!isValidPreparationStatusTransition(currentStatus, targetStatus)) {
      throw new BadRequestError(`无法从状态 ${currentStatus} 转换为 ${targetStatus}`);
    }
    
    const updateData: Prisma.PreparationProjectUpdateInput = {
      status: targetStatus,
    };
    
    // 自动设置实际开始/结束时间
    if (targetStatus === PreparationStatus.IN_PROGRESS && !existingProject.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    
    if (targetStatus === PreparationStatus.COMPLETED && !existingProject.actualEndDate) {
      updateData.actualEndDate = new Date();
      updateData.progressPercentage = 100;
    }
    
    const project = await prisma.preparationProject.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Changed preparation project status: ${existingProject.projectCode} from ${currentStatus} to ${targetStatus}`, {
      projectId: id,
      reason: statusData.reason,
    });
    
    return project as PreparationProject;
  },

  /**
   * 更新项目进度
   */
  async updateProgress(id: string, progressData: ProgressUpdateData): Promise<PreparationProject> {
    const existingProject = await prisma.preparationProject.findUnique({
      where: { id },
    });
    
    if (!existingProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    const updateData: Prisma.PreparationProjectUpdateInput = {
      progressPercentage: progressData.progressPercentage,
    };
    
    if (progressData.notes !== undefined) updateData.notes = progressData.notes;
    if (progressData.actualStartDate) updateData.actualStartDate = new Date(progressData.actualStartDate);
    if (progressData.actualEndDate) updateData.actualEndDate = new Date(progressData.actualEndDate);
    if (progressData.actualBudget !== undefined) updateData.actualBudget = progressData.actualBudget;
    
    // 自动更新状态
    if (progressData.progressPercentage === 100 && existingProject.status !== PreparationStatus.COMPLETED) {
      updateData.status = PreparationStatus.COMPLETED;
      if (!existingProject.actualEndDate) {
        updateData.actualEndDate = new Date();
      }
    } else if (progressData.progressPercentage > 0 && existingProject.status === PreparationStatus.APPROVED) {
      updateData.status = PreparationStatus.IN_PROGRESS;
      if (!existingProject.actualStartDate) {
        updateData.actualStartDate = new Date();
      }
    }
    
    const project = await prisma.preparationProject.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Updated preparation project progress: ${existingProject.projectCode} to ${progressData.progressPercentage}%`, {
      projectId: id,
    });
    
    return project as PreparationProject;
  },

  /**
   * 批量操作
   */
  async batchOperation(batchData: BatchOperationData): Promise<{ success: number; failed: number }> {
    const { ids, action, actionData } = batchData;
    let success = 0;
    let failed = 0;
    
    for (const id of ids) {
      try {
        switch (action) {
          case 'delete':
            await this.delete(id);
            break;
          case 'changeStatus':
            if (actionData?.status) {
              await this.changeStatus(id, { 
                status: actionData.status,
                reason: actionData.reason,
              });
            }
            break;
          case 'changePriority':
            if (actionData?.priority) {
              await this.update(id, { priority: actionData.priority });
            }
            break;
          case 'assignManager':
            if (actionData?.managerId) {
              await this.update(id, { managerId: actionData.managerId });
            }
            break;
        }
        success++;
      } catch (error) {
        logger.error(`Batch operation failed for project ${id}:`, error);
        failed++;
      }
    }
    
    return { success, failed };
  },

  /**
   * 获取仪表板数据
   */
  async getDashboard(): Promise<PreparationDashboard> {
    const [
      statusCounts,
      budgetStats,
      progressStats,
      overdueProjects,
    ] = await Promise.all([
      prisma.preparationProject.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.preparationProject.aggregate({
        _sum: { budget: true, actualBudget: true },
        _avg: { progressPercentage: true },
      }),
      prisma.preparationProject.findMany({
        select: {
          id: true,
          status: true,
          plannedEndDate: true,
          actualEndDate: true,
        },
      }),
      prisma.preparationProject.count({
        where: {
          status: { in: [PreparationStatus.IN_PROGRESS, PreparationStatus.APPROVED] },
          plannedEndDate: { lt: new Date() },
        },
      }),
    ]);
    
    const totalProjects = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
    const inProgressProjects = statusCounts.find(s => s.status === PreparationStatus.IN_PROGRESS)?._count.id || 0;
    const completedProjects = statusCounts.find(s => s.status === PreparationStatus.COMPLETED)?._count.id || 0;
    
    // 计算按时交付率
    const completedOnTime = progressStats.filter(p => 
      p.status === PreparationStatus.COMPLETED && 
      p.actualEndDate && 
      p.actualEndDate <= p.plannedEndDate
    ).length;
    
    const onTimeDeliveryRate = completedProjects > 0 ? (completedOnTime / completedProjects) * 100 : 0;
    
    return {
      kpis: {
        totalProjects,
        inProgressProjects,
        completedProjects,
        overdueProjects,
        totalBudget: Number(budgetStats._sum.budget || 0),
        actualBudget: Number(budgetStats._sum.actualBudget || 0),
        avgProgress: Number(budgetStats._avg.progressPercentage || 0),
        onTimeDeliveryRate,
      },
      charts: {
        statusDistribution: statusCounts.map(item => ({
          status: item.status as PreparationStatusType,
          count: item._count.id,
          percentage: (item._count.id / totalProjects) * 100,
        })),
        progressTrend: [], // 需要根据具体需求实现
        budgetAnalysis: [], // 需要根据具体需求实现
        milestoneProgress: [], // 需要根据具体需求实现
      },
      alerts: [], // 需要根据具体需求实现
    };
  },
};

// ===============================
// 工程任务管理服务
// ===============================

export const engineeringTaskService = {
  /**
   * 获取工程任务列表
   */
  async getList(filters: EngineeringTaskFilters & { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedResult<EngineeringTaskWithRelations>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...queryFilters } = filters;
    const skip = (page - 1) * limit;
    
    const where: Prisma.ConstructionProjectWhereInput = {};
    
    if (queryFilters.preparationProjectId) where.preparationProjectId = queryFilters.preparationProjectId;
    if (queryFilters.candidateLocationId) where.candidateLocationId = queryFilters.candidateLocationId;
    if (queryFilters.supplierId) where.supplierId = queryFilters.supplierId;
    if (queryFilters.status) where.status = queryFilters.status as ProjectStatus;
    if (queryFilters.priority) where.riskLevel = queryFilters.priority;
    
    // 日期范围筛选
    if (queryFilters.plannedStartDateStart || queryFilters.plannedStartDateEnd) {
      where.plannedStartDate = {};
      if (queryFilters.plannedStartDateStart) where.plannedStartDate.gte = new Date(queryFilters.plannedStartDateStart);
      if (queryFilters.plannedStartDateEnd) where.plannedStartDate.lte = new Date(queryFilters.plannedStartDateEnd);
    }
    
    // 预算范围筛选
    if (queryFilters.minBudget || queryFilters.maxBudget) {
      where.contractAmount = {};
      if (queryFilters.minBudget) where.contractAmount.gte = queryFilters.minBudget;
      if (queryFilters.maxBudget) where.contractAmount.lte = queryFilters.maxBudget;
    }
    
    // 关键词搜索
    if (queryFilters.keyword) {
      where.OR = [
        { projectName: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { contractNumber: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { description: { contains: queryFilters.keyword, mode: 'insensitive' } },
      ];
    }
    
    const orderBy: Prisma.ConstructionProjectOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.ConstructionProjectOrderByWithRelationInput] = sortOrder;
    }
    
    const [items, total] = await Promise.all([
      prisma.constructionProject.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          candidateLocation: {
            include: {
              region: true,
            },
          },
          supplier: true,
          quotations: true,
          progressLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          approvalFlow: {
            select: {
              id: true,
              status: true,
              currentStep: true,
            },
          },
          preparationProject: {
            select: {
              id: true,
              projectCode: true,
              projectName: true,
            },
          },
        },
      }),
      prisma.constructionProject.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: items as EngineeringTaskWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * 根据ID获取工程任务详情
   */
  async getById(id: string): Promise<EngineeringTaskWithRelations> {
    const task = await prisma.constructionProject.findUnique({
      where: { id },
      include: {
        candidateLocation: {
          include: {
            region: true,
          },
        },
        supplier: true,
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
        progressLogs: {
          orderBy: { createdAt: 'desc' },
        },
        approvalFlow: true,
        preparationProject: {
          select: {
            id: true,
            projectCode: true,
            projectName: true,
            manager: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });
    
    if (!task) {
      throw new NotFoundError('工程任务不存在');
    }
    
    return task as EngineeringTaskWithRelations;
  },

  /**
   * 创建工程任务
   */
  async create(data: CreateEngineeringTaskData): Promise<EngineeringTask> {
    // 验证候选点位存在
    const candidateLocation = await prisma.candidateLocation.findUnique({
      where: { id: data.candidateLocationId },
    });
    
    if (!candidateLocation) {
      throw new NotFoundError('候选点位不存在');
    }
    
    // 验证供应商存在
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });
    
    if (!supplier) {
      throw new NotFoundError('供应商不存在');
    }
    
    // 验证筹备项目存在（如果提供）
    if (data.preparationProjectId) {
      const preparationProject = await prisma.preparationProject.findUnique({
        where: { id: data.preparationProjectId },
      });
      
      if (!preparationProject) {
        throw new NotFoundError('筹备项目不存在');
      }
    }
    
    const task = await prisma.constructionProject.create({
      data: {
        candidateLocationId: data.candidateLocationId,
        supplierId: data.supplierId,
        preparationProjectId: data.preparationProjectId,
        projectName: data.projectName,
        contractNumber: data.contractNumber,
        contractAmount: data.contractAmount,
        plannedStartDate: new Date(data.plannedStartDate),
        plannedEndDate: new Date(data.plannedEndDate),
        description: data.description,
        notes: data.notes,
        riskLevel: data.riskLevel || Priority.MEDIUM,
        status: ProjectStatus.PLANNED,
        progressPercentage: 0,
        qualityScore: 0,
      },
    });
    
    logger.info(`Created engineering task: ${task.projectName}`, { taskId: task.id });
    
    return task as EngineeringTask;
  },

  /**
   * 更新工程任务
   */
  async update(id: string, data: UpdateEngineeringTaskData): Promise<EngineeringTask> {
    const existingTask = await prisma.constructionProject.findUnique({
      where: { id },
    });
    
    if (!existingTask) {
      throw new NotFoundError('工程任务不存在');
    }
    
    // 验证供应商存在（如果提供）
    if (data.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: data.supplierId },
      });
      
      if (!supplier) {
        throw new NotFoundError('供应商不存在');
      }
    }
    
    const updateData: Prisma.ConstructionProjectUpdateInput = {};
    
    if (data.projectName) updateData.projectName = data.projectName;
    if (data.supplierId) updateData.supplierId = data.supplierId;
    if (data.contractNumber) updateData.contractNumber = data.contractNumber;
    if (data.contractAmount !== undefined) updateData.contractAmount = data.contractAmount;
    if (data.actualAmount !== undefined) updateData.actualAmount = data.actualAmount;
    if (data.plannedStartDate) updateData.plannedStartDate = new Date(data.plannedStartDate);
    if (data.plannedEndDate) updateData.plannedEndDate = new Date(data.plannedEndDate);
    if (data.actualStartDate) updateData.actualStartDate = new Date(data.actualStartDate);
    if (data.actualEndDate) updateData.actualEndDate = new Date(data.actualEndDate);
    if (data.progressPercentage !== undefined) updateData.progressPercentage = data.progressPercentage;
    if (data.qualityScore !== undefined) updateData.qualityScore = data.qualityScore;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.riskLevel) updateData.riskLevel = data.riskLevel;
    
    const task = await prisma.constructionProject.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Updated engineering task: ${task.projectName}`, { taskId: task.id });
    
    return task as EngineeringTask;
  },

  /**
   * 删除工程任务
   */
  async delete(id: string): Promise<void> {
    const existingTask = await prisma.constructionProject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            quotations: true,
            progressLogs: true,
          },
        },
      },
    });
    
    if (!existingTask) {
      throw new NotFoundError('工程任务不存在');
    }
    
    // 检查是否有关联数据
    if (existingTask._count.quotations > 0 || existingTask._count.progressLogs > 0) {
      throw new ConflictError('该工程任务存在关联数据，无法删除');
    }
    
    await prisma.constructionProject.delete({
      where: { id },
    });
    
    logger.info(`Deleted engineering task: ${existingTask.projectName}`, { taskId: id });
  },

  /**
   * 更改任务状态
   */
  async changeStatus(id: string, statusData: StatusChangeData): Promise<EngineeringTask> {
    const existingTask = await prisma.constructionProject.findUnique({
      where: { id },
    });
    
    if (!existingTask) {
      throw new NotFoundError('工程任务不存在');
    }
    
    const currentStatus = existingTask.status as EngineeringStatusType;
    const targetStatus = statusData.status as EngineeringStatusType;
    
    // 验证状态转换是否合法
    if (!isValidEngineeringStatusTransition(currentStatus, targetStatus)) {
      throw new BadRequestError(`无法从状态 ${currentStatus} 转换为 ${targetStatus}`);
    }
    
    const updateData: Prisma.ConstructionProjectUpdateInput = {
      status: targetStatus as ProjectStatus,
    };
    
    // 自动设置实际开始/结束时间
    if (targetStatus === EngineeringStatus.IN_PROGRESS && !existingTask.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    
    if (targetStatus === EngineeringStatus.COMPLETED && !existingTask.actualEndDate) {
      updateData.actualEndDate = new Date();
      updateData.progressPercentage = 100;
    }
    
    const task = await prisma.constructionProject.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Changed engineering task status: ${existingTask.projectName} from ${currentStatus} to ${targetStatus}`, {
      taskId: id,
      reason: statusData.reason,
    });
    
    return task as EngineeringTask;
  },

  /**
   * 获取工程任务统计数据
   */
  async getStatistics(): Promise<EngineeringStatistics> {
    const [statusCounts, totalTasks] = await Promise.all([
      prisma.constructionProject.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.constructionProject.count(),
    ]);
    
    const statusDistribution: Record<EngineeringStatusType, number> = {
      [EngineeringStatus.PLANNED]: 0,
      [EngineeringStatus.APPROVED]: 0,
      [EngineeringStatus.IN_PROGRESS]: 0,
      [EngineeringStatus.SUSPENDED]: 0,
      [EngineeringStatus.COMPLETED]: 0,
      [EngineeringStatus.CANCELLED]: 0,
      [EngineeringStatus.ACCEPTED]: 0,
      [EngineeringStatus.WARRANTY]: 0,
    };
    
    statusCounts.forEach(item => {
      if (item.status in statusDistribution) {
        statusDistribution[item.status as EngineeringStatusType] = item._count.id;
      }
    });
    
    return {
      overview: {
        totalTasks,
        plannedTasks: statusDistribution[EngineeringStatus.PLANNED],
        inProgressTasks: statusDistribution[EngineeringStatus.IN_PROGRESS],
        completedTasks: statusDistribution[EngineeringStatus.COMPLETED],
        suspendedTasks: statusDistribution[EngineeringStatus.SUSPENDED],
        cancelledTasks: statusDistribution[EngineeringStatus.CANCELLED],
      },
      statusDistribution,
      typeDistribution: {}, // 需要根据taskType字段实现
      progressMetrics: {
        avgProgress: 0,
        onTimeCompletionRate: 0,
        qualityScore: 0,
        budgetVariance: 0,
      },
      riskAnalysis: [],
    };
  },
};

// ===============================
// 设备采购管理服务
// ===============================

export const equipmentProcurementService = {
  /**
   * 获取设备采购列表
   */
  async getList(filters: EquipmentProcurementFilters & { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedResult<EquipmentProcurementWithRelations>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...queryFilters } = filters;
    const skip = (page - 1) * limit;
    
    const where: Prisma.EquipmentProcurementWhereInput = {};
    
    if (queryFilters.preparationProjectId) where.preparationProjectId = queryFilters.preparationProjectId;
    if (queryFilters.category) where.category = queryFilters.category;
    if (queryFilters.status) where.status = queryFilters.status;
    if (queryFilters.priority) where.priority = queryFilters.priority;
    if (queryFilters.supplier) where.supplier = { contains: queryFilters.supplier, mode: 'insensitive' };
    
    // 日期范围筛选
    if (queryFilters.plannedDeliveryDateStart || queryFilters.plannedDeliveryDateEnd) {
      where.plannedDeliveryDate = {};
      if (queryFilters.plannedDeliveryDateStart) where.plannedDeliveryDate.gte = new Date(queryFilters.plannedDeliveryDateStart);
      if (queryFilters.plannedDeliveryDateEnd) where.plannedDeliveryDate.lte = new Date(queryFilters.plannedDeliveryDateEnd);
    }
    
    // 价格范围筛选
    if (queryFilters.minPrice || queryFilters.maxPrice) {
      where.totalPrice = {};
      if (queryFilters.minPrice) where.totalPrice.gte = queryFilters.minPrice;
      if (queryFilters.maxPrice) where.totalPrice.lte = queryFilters.maxPrice;
    }
    
    // 关键词搜索
    if (queryFilters.keyword) {
      where.OR = [
        { equipmentName: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { brand: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { model: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { procurementCode: { contains: queryFilters.keyword, mode: 'insensitive' } },
      ];
    }
    
    const orderBy: Prisma.EquipmentProcurementOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.EquipmentProcurementOrderByWithRelationInput] = sortOrder;
    }
    
    const [items, total] = await Promise.all([
      prisma.equipmentProcurement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          preparationProject: {
            select: {
              id: true,
              projectCode: true,
              projectName: true,
              candidateLocation: {
                select: {
                  id: true,
                  locationName: true,
                },
              },
            },
          },
        },
      }),
      prisma.equipmentProcurement.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: items as EquipmentProcurementWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * 根据ID获取设备采购详情
   */
  async getById(id: string): Promise<EquipmentProcurementWithRelations> {
    const procurement = await prisma.equipmentProcurement.findUnique({
      where: { id },
      include: {
        preparationProject: {
          include: {
            candidateLocation: {
              include: {
                region: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });
    
    if (!procurement) {
      throw new NotFoundError('设备采购记录不存在');
    }
    
    return procurement as EquipmentProcurementWithRelations;
  },

  /**
   * 创建设备采购
   */
  async create(data: CreateEquipmentProcurementData): Promise<EquipmentProcurement> {
    // 验证筹备项目存在
    const preparationProject = await prisma.preparationProject.findUnique({
      where: { id: data.preparationProjectId },
    });
    
    if (!preparationProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    // 生成采购编号
    const procurementCode = generateProcurementCode(
      preparationProject.projectCode,
      data.category
    );
    
    const procurement = await prisma.equipmentProcurement.create({
      data: {
        procurementCode,
        preparationProjectId: data.preparationProjectId,
        category: data.category,
        equipmentName: data.equipmentName,
        brand: data.brand,
        model: data.model,
        specifications: data.specifications,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
        currency: data.currency || 'CNY',
        priority: data.priority || Priority.MEDIUM,
        plannedDeliveryDate: data.plannedDeliveryDate ? new Date(data.plannedDeliveryDate) : null,
        warrantyPeriod: data.warrantyPeriod,
        supplier: data.supplier,
        supplierContact: data.supplierContact,
        deliveryAddress: data.deliveryAddress,
        installationRequirements: data.installationRequirements,
        notes: data.notes,
        status: EquipmentStatus.PENDING,
      },
    });
    
    logger.info(`Created equipment procurement: ${procurement.procurementCode}`, { procurementId: procurement.id });
    
    return procurement as EquipmentProcurement;
  },

  /**
   * 更新设备采购
   */
  async update(id: string, data: UpdateEquipmentProcurementData): Promise<EquipmentProcurement> {
    const existingProcurement = await prisma.equipmentProcurement.findUnique({
      where: { id },
    });
    
    if (!existingProcurement) {
      throw new NotFoundError('设备采购记录不存在');
    }
    
    const updateData: Prisma.EquipmentProcurementUpdateInput = {};
    
    if (data.category) updateData.category = data.category;
    if (data.equipmentName) updateData.equipmentName = data.equipmentName;
    if (data.brand) updateData.brand = data.brand;
    if (data.model) updateData.model = data.model;
    if (data.specifications !== undefined) updateData.specifications = data.specifications;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice;
    if (data.priority) updateData.priority = data.priority;
    if (data.plannedDeliveryDate) updateData.plannedDeliveryDate = new Date(data.plannedDeliveryDate);
    if (data.actualDeliveryDate) updateData.actualDeliveryDate = new Date(data.actualDeliveryDate);
    if (data.installationDate) updateData.installationDate = new Date(data.installationDate);
    if (data.acceptanceDate) updateData.acceptanceDate = new Date(data.acceptanceDate);
    if (data.warrantyPeriod !== undefined) updateData.warrantyPeriod = data.warrantyPeriod;
    if (data.warrantyExpiry) updateData.warrantyExpiry = new Date(data.warrantyExpiry);
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.supplierContact !== undefined) updateData.supplierContact = data.supplierContact;
    if (data.purchaseOrder !== undefined) updateData.purchaseOrder = data.purchaseOrder;
    if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
    if (data.installationRequirements !== undefined) updateData.installationRequirements = data.installationRequirements;
    if (data.operationManual !== undefined) updateData.operationManual = data.operationManual;
    if (data.maintenanceSchedule !== undefined) updateData.maintenanceSchedule = data.maintenanceSchedule;
    if (data.photos !== undefined) updateData.photos = data.photos;
    if (data.documents !== undefined) updateData.documents = data.documents;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    const procurement = await prisma.equipmentProcurement.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Updated equipment procurement: ${procurement.procurementCode}`, { procurementId: procurement.id });
    
    return procurement as EquipmentProcurement;
  },

  /**
   * 删除设备采购
   */
  async delete(id: string): Promise<void> {
    const existingProcurement = await prisma.equipmentProcurement.findUnique({
      where: { id },
    });
    
    if (!existingProcurement) {
      throw new NotFoundError('设备采购记录不存在');
    }
    
    await prisma.equipmentProcurement.delete({
      where: { id },
    });
    
    logger.info(`Deleted equipment procurement: ${existingProcurement.procurementCode}`, { procurementId: id });
  },

  /**
   * 获取设备采购统计数据
   */
  async getStatistics(): Promise<EquipmentStatistics> {
    const [statusCounts, categoryStats, budgetStats] = await Promise.all([
      prisma.equipmentProcurement.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.equipmentProcurement.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.equipmentProcurement.aggregate({
        _sum: { totalPrice: true },
        _avg: { unitPrice: true },
      }),
    ]);
    
    const totalEquipment = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
    
    const statusDistribution: Record<EquipmentStatusType, number> = {
      [EquipmentStatus.PENDING]: 0,
      [EquipmentStatus.QUOTED]: 0,
      [EquipmentStatus.APPROVED]: 0,
      [EquipmentStatus.ORDERED]: 0,
      [EquipmentStatus.DELIVERED]: 0,
      [EquipmentStatus.INSTALLED]: 0,
      [EquipmentStatus.ACCEPTED]: 0,
      [EquipmentStatus.WARRANTY]: 0,
      [EquipmentStatus.MAINTENANCE]: 0,
    };
    
    const categoryDistribution: Record<EquipmentCategoryType, number> = {
      KITCHEN: 0,
      DINING: 0,
      COOLING: 0,
      CLEANING: 0,
      SAFETY: 0,
      FURNITURE: 0,
      TECHNOLOGY: 0,
      DECORATION: 0,
      OTHER: 0,
    };
    
    statusCounts.forEach(item => {
      if (item.status in statusDistribution) {
        statusDistribution[item.status as EquipmentStatusType] = item._count.id;
      }
    });
    
    categoryStats.forEach(item => {
      if (item.category in categoryDistribution) {
        categoryDistribution[item.category as EquipmentCategoryType] = item._count.id;
      }
    });
    
    return {
      overview: {
        totalEquipment,
        pendingCount: statusDistribution[EquipmentStatus.PENDING],
        orderedCount: statusDistribution[EquipmentStatus.ORDERED],
        deliveredCount: statusDistribution[EquipmentStatus.DELIVERED],
        installedCount: statusDistribution[EquipmentStatus.INSTALLED],
        acceptedCount: statusDistribution[EquipmentStatus.ACCEPTED],
      },
      categoryDistribution,
      statusDistribution,
      budgetAnalysis: {
        totalBudget: Number(budgetStats._sum.totalPrice || 0),
        actualCost: 0,
        variance: 0,
        avgUnitPrice: Number(budgetStats._avg.unitPrice || 0),
      },
      deliveryMetrics: {
        onTimeDeliveryRate: 0,
        avgDeliveryDays: 0,
        overdueCount: 0,
      },
    };
  },
};

// ===============================
// 证照办理管理服务
// ===============================

export const licenseApplicationService = {
  /**
   * 获取证照办理列表
   */
  async getList(filters: LicenseApplicationFilters & { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedResult<LicenseApplicationWithRelations>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...queryFilters } = filters;
    const skip = (page - 1) * limit;
    
    const where: Prisma.LicenseApplicationWhereInput = {};
    
    if (queryFilters.preparationProjectId) where.preparationProjectId = queryFilters.preparationProjectId;
    if (queryFilters.licenseType) where.licenseType = queryFilters.licenseType;
    if (queryFilters.status) where.status = queryFilters.status;
    if (queryFilters.priority) where.priority = queryFilters.priority;
    if (queryFilters.issuingAuthority) where.issuingAuthority = { contains: queryFilters.issuingAuthority, mode: 'insensitive' };
    
    // 日期范围筛选
    if (queryFilters.applicationDateStart || queryFilters.applicationDateEnd) {
      where.applicationDate = {};
      if (queryFilters.applicationDateStart) where.applicationDate.gte = new Date(queryFilters.applicationDateStart);
      if (queryFilters.applicationDateEnd) where.applicationDate.lte = new Date(queryFilters.applicationDateEnd);
    }
    
    if (queryFilters.expiryDateStart || queryFilters.expiryDateEnd) {
      where.expiryDate = {};
      if (queryFilters.expiryDateStart) where.expiryDate.gte = new Date(queryFilters.expiryDateStart);
      if (queryFilters.expiryDateEnd) where.expiryDate.lte = new Date(queryFilters.expiryDateEnd);
    }
    
    // 续期筛选
    if (queryFilters.needsRenewal) {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      where.expiryDate = { lte: thirtyDaysLater };
      where.status = { not: LicenseStatus.EXPIRED };
    }
    
    // 关键词搜索
    if (queryFilters.keyword) {
      where.OR = [
        { licenseName: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { applicationCode: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { licenseNumber: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { applicant: { contains: queryFilters.keyword, mode: 'insensitive' } },
      ];
    }
    
    const orderBy: Prisma.LicenseApplicationOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.LicenseApplicationOrderByWithRelationInput] = sortOrder;
    }
    
    const [items, total] = await Promise.all([
      prisma.licenseApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          preparationProject: {
            select: {
              id: true,
              projectCode: true,
              projectName: true,
              candidateLocation: {
                select: {
                  id: true,
                  locationName: true,
                },
              },
            },
          },
        },
      }),
      prisma.licenseApplication.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: items as LicenseApplicationWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * 根据ID获取证照办理详情
   */
  async getById(id: string): Promise<LicenseApplicationWithRelations> {
    const application = await prisma.licenseApplication.findUnique({
      where: { id },
      include: {
        preparationProject: {
          include: {
            candidateLocation: {
              include: {
                region: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });
    
    if (!application) {
      throw new NotFoundError('证照办理记录不存在');
    }
    
    return application as LicenseApplicationWithRelations;
  },

  /**
   * 创建证照办理
   */
  async create(data: CreateLicenseApplicationData): Promise<LicenseApplication> {
    // 验证筹备项目存在
    const preparationProject = await prisma.preparationProject.findUnique({
      where: { id: data.preparationProjectId },
    });
    
    if (!preparationProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    // 生成申请编号
    const applicationCode = generateLicenseApplicationCode(
      preparationProject.projectCode,
      data.licenseType
    );
    
    const application = await prisma.licenseApplication.create({
      data: {
        applicationCode,
        preparationProjectId: data.preparationProjectId,
        licenseType: data.licenseType,
        licenseName: data.licenseName,
        issuingAuthority: data.issuingAuthority,
        priority: data.priority || Priority.MEDIUM,
        applicationDate: data.applicationDate ? new Date(data.applicationDate) : null,
        applicationFee: data.applicationFee,
        currency: data.currency || 'CNY',
        applicant: data.applicant,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        applicationAddress: data.applicationAddress,
        requiredDocuments: data.requiredDocuments,
        notes: data.notes,
        status: LicenseStatus.PENDING,
      },
    });
    
    logger.info(`Created license application: ${application.applicationCode}`, { applicationId: application.id });
    
    return application as LicenseApplication;
  },

  /**
   * 更新证照办理
   */
  async update(id: string, data: UpdateLicenseApplicationData): Promise<LicenseApplication> {
    const existingApplication = await prisma.licenseApplication.findUnique({
      where: { id },
    });
    
    if (!existingApplication) {
      throw new NotFoundError('证照办理记录不存在');
    }
    
    const updateData: Prisma.LicenseApplicationUpdateInput = {};
    
    if (data.licenseName) updateData.licenseName = data.licenseName;
    if (data.issuingAuthority) updateData.issuingAuthority = data.issuingAuthority;
    if (data.priority) updateData.priority = data.priority;
    if (data.applicationDate) updateData.applicationDate = new Date(data.applicationDate);
    if (data.submissionDate) updateData.submissionDate = new Date(data.submissionDate);
    if (data.reviewStartDate) updateData.reviewStartDate = new Date(data.reviewStartDate);
    if (data.approvalDate) updateData.approvalDate = new Date(data.approvalDate);
    if (data.issuanceDate) updateData.issuanceDate = new Date(data.issuanceDate);
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);
    if (data.renewalDate) updateData.renewalDate = new Date(data.renewalDate);
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
    if (data.applicationFee !== undefined) updateData.applicationFee = data.applicationFee;
    if (data.actualFee !== undefined) updateData.actualFee = data.actualFee;
    if (data.applicant !== undefined) updateData.applicant = data.applicant;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
    if (data.applicationAddress !== undefined) updateData.applicationAddress = data.applicationAddress;
    if (data.requiredDocuments !== undefined) updateData.requiredDocuments = data.requiredDocuments;
    if (data.submittedDocuments !== undefined) updateData.submittedDocuments = data.submittedDocuments;
    if (data.missingDocuments !== undefined) updateData.missingDocuments = data.missingDocuments;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.renewalReminder) updateData.renewalReminder = new Date(data.renewalReminder);
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    const application = await prisma.licenseApplication.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Updated license application: ${application.applicationCode}`, { applicationId: application.id });
    
    return application as LicenseApplication;
  },

  /**
   * 删除证照办理
   */
  async delete(id: string): Promise<void> {
    const existingApplication = await prisma.licenseApplication.findUnique({
      where: { id },
    });
    
    if (!existingApplication) {
      throw new NotFoundError('证照办理记录不存在');
    }
    
    await prisma.licenseApplication.delete({
      where: { id },
    });
    
    logger.info(`Deleted license application: ${existingApplication.applicationCode}`, { applicationId: id });
  },

  /**
   * 获取证照办理统计数据
   */
  async getStatistics(): Promise<LicenseStatistics> {
    const [statusCounts, typeStats] = await Promise.all([
      prisma.licenseApplication.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.licenseApplication.groupBy({
        by: ['licenseType'],
        _count: { id: true },
      }),
    ]);
    
    const totalApplications = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
    
    const statusDistribution: Record<LicenseStatusType, number> = {
      [LicenseStatus.PENDING]: 0,
      [LicenseStatus.SUBMITTED]: 0,
      [LicenseStatus.UNDER_REVIEW]: 0,
      [LicenseStatus.APPROVED]: 0,
      [LicenseStatus.ISSUED]: 0,
      [LicenseStatus.REJECTED]: 0,
      [LicenseStatus.EXPIRED]: 0,
      [LicenseStatus.RENEWED]: 0,
    };
    
    const typeDistribution: Record<LicenseTypeType, number> = {
      BUSINESS: 0,
      FOOD_SERVICE: 0,
      FIRE_SAFETY: 0,
      HEALTH: 0,
      TAX: 0,
      SIGNBOARD: 0,
      ENVIRONMENTAL: 0,
      SPECIAL: 0,
      OTHER: 0,
    };
    
    statusCounts.forEach(item => {
      if (item.status in statusDistribution) {
        statusDistribution[item.status as LicenseStatusType] = item._count.id;
      }
    });
    
    typeStats.forEach(item => {
      if (item.licenseType in typeDistribution) {
        typeDistribution[item.licenseType as LicenseTypeType] = item._count.id;
      }
    });
    
    return {
      overview: {
        totalApplications,
        pendingCount: statusDistribution[LicenseStatus.PENDING],
        underReviewCount: statusDistribution[LicenseStatus.UNDER_REVIEW],
        approvedCount: statusDistribution[LicenseStatus.APPROVED],
        issuedCount: statusDistribution[LicenseStatus.ISSUED],
        rejectedCount: statusDistribution[LicenseStatus.REJECTED],
      },
      typeDistribution,
      statusDistribution,
      timingMetrics: {
        avgProcessingDays: 0,
        onTimeApprovalRate: 0,
        expiringCount: 0,
        expiredCount: statusDistribution[LicenseStatus.EXPIRED],
      },
    };
  },
};

// ===============================
// 人员招聘管理服务
// ===============================

export const staffRecruitmentService = {
  /**
   * 获取人员招聘列表
   */
  async getList(filters: StaffRecruitmentFilters & { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedResult<StaffRecruitmentWithRelations>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...queryFilters } = filters;
    const skip = (page - 1) * limit;
    
    const where: Prisma.StaffRecruitmentWhereInput = {};
    
    if (queryFilters.preparationProjectId) where.preparationProjectId = queryFilters.preparationProjectId;
    if (queryFilters.positionType) where.positionType = queryFilters.positionType;
    if (queryFilters.status) where.status = queryFilters.status;
    if (queryFilters.priority) where.priority = queryFilters.priority;
    if (queryFilters.department) where.department = { contains: queryFilters.department, mode: 'insensitive' };
    
    // 日期范围筛选
    if (queryFilters.startDateStart || queryFilters.startDateEnd) {
      where.startDate = {};
      if (queryFilters.startDateStart) where.startDate.gte = new Date(queryFilters.startDateStart);
      if (queryFilters.startDateEnd) where.startDate.lte = new Date(queryFilters.startDateEnd);
    }
    
    if (queryFilters.endDateStart || queryFilters.endDateEnd) {
      where.endDate = {};
      if (queryFilters.endDateStart) where.endDate.gte = new Date(queryFilters.endDateStart);
      if (queryFilters.endDateEnd) where.endDate.lte = new Date(queryFilters.endDateEnd);
    }
    
    // 关键词搜索
    if (queryFilters.keyword) {
      where.OR = [
        { positionTitle: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { recruitmentCode: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { department: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { jobDescription: { contains: queryFilters.keyword, mode: 'insensitive' } },
      ];
    }
    
    const orderBy: Prisma.StaffRecruitmentOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.StaffRecruitmentOrderByWithRelationInput] = sortOrder;
    }
    
    const [items, total] = await Promise.all([
      prisma.staffRecruitment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          preparationProject: {
            select: {
              id: true,
              projectCode: true,
              projectName: true,
              candidateLocation: {
                select: {
                  id: true,
                  locationName: true,
                },
              },
            },
          },
        },
      }),
      prisma.staffRecruitment.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: items as StaffRecruitmentWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * 根据ID获取人员招聘详情
   */
  async getById(id: string): Promise<StaffRecruitmentWithRelations> {
    const recruitment = await prisma.staffRecruitment.findUnique({
      where: { id },
      include: {
        preparationProject: {
          include: {
            candidateLocation: {
              include: {
                region: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });
    
    if (!recruitment) {
      throw new NotFoundError('人员招聘记录不存在');
    }
    
    return recruitment as StaffRecruitmentWithRelations;
  },

  /**
   * 创建人员招聘
   */
  async create(data: CreateStaffRecruitmentData): Promise<StaffRecruitment> {
    // 验证筹备项目存在
    const preparationProject = await prisma.preparationProject.findUnique({
      where: { id: data.preparationProjectId },
    });
    
    if (!preparationProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    // 生成招聘编号
    const recruitmentCode = generateRecruitmentCode(
      preparationProject.projectCode,
      data.positionType
    );
    
    const recruitment = await prisma.staffRecruitment.create({
      data: {
        recruitmentCode,
        preparationProjectId: data.preparationProjectId,
        positionType: data.positionType,
        positionTitle: data.positionTitle,
        department: data.department,
        plannedCount: data.plannedCount,
        priority: data.priority || Priority.MEDIUM,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        salaryRange: data.salaryRange,
        workLocation: data.workLocation,
        workSchedule: data.workSchedule,
        qualificationRequirements: data.qualificationRequirements,
        jobDescription: data.jobDescription,
        benefits: data.benefits,
        recruitmentChannels: data.recruitmentChannels || [],
        recruiters: data.recruiters || [],
        interviewers: data.interviewers || [],
        notes: data.notes,
        status: RecruitmentStatus.PLANNING,
        recruitedCount: 0,
        onboardedCount: 0,
      },
    });
    
    logger.info(`Created staff recruitment: ${recruitment.recruitmentCode}`, { recruitmentId: recruitment.id });
    
    return recruitment as StaffRecruitment;
  },

  /**
   * 更新人员招聘
   */
  async update(id: string, data: UpdateStaffRecruitmentData): Promise<StaffRecruitment> {
    const existingRecruitment = await prisma.staffRecruitment.findUnique({
      where: { id },
    });
    
    if (!existingRecruitment) {
      throw new NotFoundError('人员招聘记录不存在');
    }
    
    const updateData: Prisma.StaffRecruitmentUpdateInput = {};
    
    if (data.positionTitle) updateData.positionTitle = data.positionTitle;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.plannedCount !== undefined) updateData.plannedCount = data.plannedCount;
    if (data.recruitedCount !== undefined) updateData.recruitedCount = data.recruitedCount;
    if (data.onboardedCount !== undefined) updateData.onboardedCount = data.onboardedCount;
    if (data.priority) updateData.priority = data.priority;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange;
    if (data.workLocation !== undefined) updateData.workLocation = data.workLocation;
    if (data.workSchedule !== undefined) updateData.workSchedule = data.workSchedule;
    if (data.qualificationRequirements !== undefined) updateData.qualificationRequirements = data.qualificationRequirements;
    if (data.jobDescription !== undefined) updateData.jobDescription = data.jobDescription;
    if (data.benefits !== undefined) updateData.benefits = data.benefits;
    if (data.recruitmentChannels !== undefined) updateData.recruitmentChannels = data.recruitmentChannels;
    if (data.recruiters !== undefined) updateData.recruiters = data.recruiters;
    if (data.interviewers !== undefined) updateData.interviewers = data.interviewers;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    const recruitment = await prisma.staffRecruitment.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Updated staff recruitment: ${recruitment.recruitmentCode}`, { recruitmentId: recruitment.id });
    
    return recruitment as StaffRecruitment;
  },

  /**
   * 删除人员招聘
   */
  async delete(id: string): Promise<void> {
    const existingRecruitment = await prisma.staffRecruitment.findUnique({
      where: { id },
    });
    
    if (!existingRecruitment) {
      throw new NotFoundError('人员招聘记录不存在');
    }
    
    await prisma.staffRecruitment.delete({
      where: { id },
    });
    
    logger.info(`Deleted staff recruitment: ${existingRecruitment.recruitmentCode}`, { recruitmentId: id });
  },

  /**
   * 获取人员招聘统计数据
   */
  async getStatistics(): Promise<RecruitmentStatistics> {
    const [statusCounts, positionStats, totals] = await Promise.all([
      prisma.staffRecruitment.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.staffRecruitment.groupBy({
        by: ['positionType'],
        _count: { id: true },
      }),
      prisma.staffRecruitment.aggregate({
        _sum: { 
          plannedCount: true, 
          recruitedCount: true, 
          onboardedCount: true 
        },
      }),
    ]);
    
    const totalPositions = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
    const plannedRecruitment = Number(totals._sum.plannedCount || 0);
    const actualRecruitment = Number(totals._sum.recruitedCount || 0);
    const onboardedCount = Number(totals._sum.onboardedCount || 0);
    
    const statusDistribution: Record<RecruitmentStatusType, number> = {
      [RecruitmentStatus.PLANNING]: 0,
      [RecruitmentStatus.PUBLISHED]: 0,
      [RecruitmentStatus.INTERVIEWING]: 0,
      [RecruitmentStatus.OFFERED]: 0,
      [RecruitmentStatus.ONBOARDED]: 0,
      [RecruitmentStatus.CANCELLED]: 0,
      [RecruitmentStatus.COMPLETED]: 0,
    };
    
    const positionDistribution: Record<PositionTypeType, number> = {
      MANAGER: 0,
      CHEF: 0,
      SERVER: 0,
      CASHIER: 0,
      CLEANER: 0,
      SECURITY: 0,
      MAINTENANCE: 0,
      SALES: 0,
      OTHER: 0,
    };
    
    statusCounts.forEach(item => {
      if (item.status in statusDistribution) {
        statusDistribution[item.status as RecruitmentStatusType] = item._count.id;
      }
    });
    
    positionStats.forEach(item => {
      if (item.positionType in positionDistribution) {
        positionDistribution[item.positionType as PositionTypeType] = item._count.id;
      }
    });
    
    return {
      overview: {
        totalPositions,
        plannedRecruitment,
        actualRecruitment,
        onboardedCount,
        recruitmentRate: plannedRecruitment > 0 ? (actualRecruitment / plannedRecruitment) * 100 : 0,
        onboardingRate: actualRecruitment > 0 ? (onboardedCount / actualRecruitment) * 100 : 0,
      },
      positionDistribution,
      statusDistribution,
      channelEffectiveness: [], // 需要根据具体需求实现
      timeMetrics: {
        avgTimeToHire: 0,
        avgTimeToOnboard: 0,
      },
    };
  },
};

// ===============================
// 里程碑跟踪管理服务
// ===============================

export const milestoneTrackingService = {
  /**
   * 获取里程碑跟踪列表
   */
  async getList(filters: MilestoneTrackingFilters & { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedResult<MilestoneTrackingWithRelations>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', ...queryFilters } = filters;
    const skip = (page - 1) * limit;
    
    const where: Prisma.MilestoneTrackingWhereInput = {};
    
    if (queryFilters.preparationProjectId) where.preparationProjectId = queryFilters.preparationProjectId;
    if (queryFilters.category) where.category = queryFilters.category;
    if (queryFilters.status) where.status = queryFilters.status;
    if (queryFilters.priority) where.priority = queryFilters.priority;
    if (queryFilters.ownerId) where.ownerId = queryFilters.ownerId;
    if (queryFilters.riskLevel) where.riskLevel = queryFilters.riskLevel;
    
    // 日期范围筛选
    if (queryFilters.plannedDateStart || queryFilters.plannedDateEnd) {
      where.plannedDate = {};
      if (queryFilters.plannedDateStart) where.plannedDate.gte = new Date(queryFilters.plannedDateStart);
      if (queryFilters.plannedDateEnd) where.plannedDate.lte = new Date(queryFilters.plannedDateEnd);
    }
    
    // 关键词搜索
    if (queryFilters.keyword) {
      where.OR = [
        { name: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { description: { contains: queryFilters.keyword, mode: 'insensitive' } },
        { category: { contains: queryFilters.keyword, mode: 'insensitive' } },
      ];
    }
    
    const orderBy: Prisma.MilestoneTrackingOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy as keyof Prisma.MilestoneTrackingOrderByWithRelationInput] = sortOrder;
    }
    
    const [items, total] = await Promise.all([
      prisma.milestoneTracking.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          preparationProject: {
            select: {
              id: true,
              projectCode: true,
              projectName: true,
              candidateLocation: {
                select: {
                  id: true,
                  locationName: true,
                },
              },
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      prisma.milestoneTracking.count({ where }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      items: items as MilestoneTrackingWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * 根据ID获取里程碑跟踪详情
   */
  async getById(id: string): Promise<MilestoneTrackingWithRelations> {
    const milestone = await prisma.milestoneTracking.findUnique({
      where: { id },
      include: {
        preparationProject: {
          include: {
            candidateLocation: {
              include: {
                region: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });
    
    if (!milestone) {
      throw new NotFoundError('里程碑跟踪记录不存在');
    }
    
    return milestone as MilestoneTrackingWithRelations;
  },

  /**
   * 创建里程碑跟踪
   */
  async create(data: CreateMilestoneTrackingData): Promise<MilestoneTracking> {
    // 验证筹备项目存在
    const preparationProject = await prisma.preparationProject.findUnique({
      where: { id: data.preparationProjectId },
    });
    
    if (!preparationProject) {
      throw new NotFoundError('筹备项目不存在');
    }
    
    // 验证负责人存在（如果提供）
    if (data.owner) {
      const owner = await prisma.user.findUnique({
        where: { id: data.owner },
      });
      if (!owner) {
        throw new NotFoundError('指定的负责人不存在');
      }
    }
    
    const milestone = await prisma.milestoneTracking.create({
      data: {
        preparationProjectId: data.preparationProjectId,
        name: data.name,
        description: data.description,
        category: data.category,
        priority: data.priority || Priority.MEDIUM,
        plannedDate: new Date(data.plannedDate),
        dependencies: data.dependencies || [],
        relatedTasks: data.relatedTasks || [],
        deliverables: data.deliverables || [],
        criteria: data.criteria,
        ownerId: data.owner,
        stakeholders: data.stakeholders || [],
        riskLevel: data.riskLevel || 'MEDIUM',
        notes: data.notes,
        status: MilestoneStatus.PENDING,
      },
    });
    
    logger.info(`Created milestone tracking: ${milestone.name}`, { milestoneId: milestone.id });
    
    return milestone as MilestoneTracking;
  },

  /**
   * 更新里程碑跟踪
   */
  async update(id: string, data: UpdateMilestoneTrackingData): Promise<MilestoneTracking> {
    const existingMilestone = await prisma.milestoneTracking.findUnique({
      where: { id },
    });
    
    if (!existingMilestone) {
      throw new NotFoundError('里程碑跟踪记录不存在');
    }
    
    // 验证负责人存在（如果提供）
    if (data.owner) {
      const owner = await prisma.user.findUnique({
        where: { id: data.owner },
      });
      if (!owner) {
        throw new NotFoundError('指定的负责人不存在');
      }
    }
    
    const updateData: Prisma.MilestoneTrackingUpdateInput = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.priority) updateData.priority = data.priority;
    if (data.plannedDate) updateData.plannedDate = new Date(data.plannedDate);
    if (data.actualDate) updateData.actualDate = new Date(data.actualDate);
    if (data.dependencies !== undefined) updateData.dependencies = data.dependencies;
    if (data.relatedTasks !== undefined) updateData.relatedTasks = data.relatedTasks;
    if (data.deliverables !== undefined) updateData.deliverables = data.deliverables;
    if (data.criteria !== undefined) updateData.criteria = data.criteria;
    if (data.owner !== undefined) updateData.ownerId = data.owner;
    if (data.stakeholders !== undefined) updateData.stakeholders = data.stakeholders;
    if (data.riskLevel) updateData.riskLevel = data.riskLevel;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    const milestone = await prisma.milestoneTracking.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Updated milestone tracking: ${milestone.name}`, { milestoneId: milestone.id });
    
    return milestone as MilestoneTracking;
  },

  /**
   * 删除里程碑跟踪
   */
  async delete(id: string): Promise<void> {
    const existingMilestone = await prisma.milestoneTracking.findUnique({
      where: { id },
    });
    
    if (!existingMilestone) {
      throw new NotFoundError('里程碑跟踪记录不存在');
    }
    
    await prisma.milestoneTracking.delete({
      where: { id },
    });
    
    logger.info(`Deleted milestone tracking: ${existingMilestone.name}`, { milestoneId: id });
  },

  /**
   * 更改里程碑状态
   */
  async changeStatus(id: string, statusData: StatusChangeData): Promise<MilestoneTracking> {
    const existingMilestone = await prisma.milestoneTracking.findUnique({
      where: { id },
    });
    
    if (!existingMilestone) {
      throw new NotFoundError('里程碑跟踪记录不存在');
    }
    
    const targetStatus = statusData.status as MilestoneStatusType;
    
    const updateData: Prisma.MilestoneTrackingUpdateInput = {
      status: targetStatus,
    };
    
    // 自动设置实际完成时间
    if (targetStatus === MilestoneStatus.COMPLETED && !existingMilestone.actualDate) {
      updateData.actualDate = new Date();
    }
    
    const milestone = await prisma.milestoneTracking.update({
      where: { id },
      data: updateData,
    });
    
    logger.info(`Changed milestone status: ${existingMilestone.name} to ${targetStatus}`, {
      milestoneId: id,
      reason: statusData.reason,
    });
    
    return milestone as MilestoneTracking;
  },

  /**
   * 获取里程碑跟踪统计数据
   */
  async getStatistics(): Promise<MilestoneStatistics> {
    const [statusCounts, categoryStats] = await Promise.all([
      prisma.milestoneTracking.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.milestoneTracking.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
    ]);
    
    const totalMilestones = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
    
    const statusDistribution: Record<MilestoneStatusType, number> = {
      [MilestoneStatus.PENDING]: 0,
      [MilestoneStatus.IN_PROGRESS]: 0,
      [MilestoneStatus.COMPLETED]: 0,
      [MilestoneStatus.OVERDUE]: 0,
      [MilestoneStatus.CANCELLED]: 0,
      [MilestoneStatus.BLOCKED]: 0,
    };
    
    const categoryDistribution: Record<string, number> = {};
    
    statusCounts.forEach(item => {
      if (item.status in statusDistribution) {
        statusDistribution[item.status as MilestoneStatusType] = item._count.id;
      }
    });
    
    categoryStats.forEach(item => {
      categoryDistribution[item.category] = item._count.id;
    });
    
    return {
      overview: {
        totalMilestones,
        pendingCount: statusDistribution[MilestoneStatus.PENDING],
        inProgressCount: statusDistribution[MilestoneStatus.IN_PROGRESS],
        completedCount: statusDistribution[MilestoneStatus.COMPLETED],
        overdueCount: statusDistribution[MilestoneStatus.OVERDUE],
        blockedCount: statusDistribution[MilestoneStatus.BLOCKED],
      },
      categoryDistribution,
      statusDistribution,
      completionMetrics: {
        onTimeCompletionRate: 0,
        avgCompletionDays: 0,
        criticalPathDelay: 0,
      },
    };
  },
};