import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';
import { 
  CreateStorePlanData,
  UpdateStorePlanData,
  StorePlanQuery,
  StatusChangeData,
  BatchOperationData,
  StatisticsQuery,
  ExportData,
  StorePlanWithRelations,
  PaginatedResult,
  StorePlanStatistics,
  StorePlanProgress,
  StorePlanSummary,
  StorePlanStatusType,
  StoreTypesType,
  isValidStatusTransition,
} from '@/types/storePlan.js';

const prisma = new PrismaClient();

// 生成计划编号的辅助函数
const generatePlanCode = (year: number, quarter: number | null, regionCode: string): string => {
  const yearStr = year.toString();
  const quarterStr = quarter ? `Q${quarter}` : 'FULL';
  const timestamp = Date.now().toString().slice(-6);
  return `SP${yearStr}${quarterStr}-${regionCode}-${timestamp}`;
};

export const storePlanService = {
  // 获取开店计划列表（增强版）
  async getList(query: StorePlanQuery): Promise<PaginatedResult<StorePlanWithRelations>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.StorePlanWhereInput = {};
    
    if (filters.year) where.year = filters.year;
    if (filters.quarter) where.quarter = filters.quarter;
    if (filters.regionId) where.regionId = filters.regionId;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.storeType) where.storeType = filters.storeType;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.createdById) where.createdById = filters.createdById;
    
    // 预算范围筛选
    if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
      where.budget = {};
      if (filters.budgetMin !== undefined) where.budget.gte = filters.budgetMin;
      if (filters.budgetMax !== undefined) where.budget.lte = filters.budgetMax;
    }
    
    // 日期范围筛选
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    // 排序条件
    const orderBy: Prisma.StorePlanOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // 执行查询
    const [items, total] = await Promise.all([
      prisma.storePlan.findMany({
        where,
        skip,
        take: limit,
        include: {
          region: {
            select: {
              id: true,
              name: true,
              code: true,
              fullPath: true,
            },
          },
          entity: {
            select: {
              id: true,
              name: true,
              code: true,
              legalName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              candidateLocations: true,
            },
          },
        },
        orderBy,
      }),
      prisma.storePlan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items as StorePlanWithRelations[],
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

  // 根据ID获取开店计划详情
  async getById(id: string): Promise<StorePlanWithRelations> {
    const storePlan = await prisma.storePlan.findUnique({
      where: { id },
      include: {
        region: {
          select: {
            id: true,
            name: true,
            code: true,
            fullPath: true,
            parent: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        entity: {
          select: {
            id: true,
            name: true,
            code: true,
            legalName: true,
            contactName: true,
            contactPhone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            jobTitle: true,
          },
        },
        candidateLocations: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            address: true,
            status: true,
            priority: true,
            discoveryDate: true,
            evaluationScore: true,
            rentPrice: true,
          },
          orderBy: {
            discoveryDate: 'desc',
          },
        },
        approvalFlow: {
          select: {
            id: true,
            flowNumber: true,
            status: true,
            currentStep: true,
            totalSteps: true,
          },
        },
      },
    });

    if (!storePlan) {
      throw new NotFoundError('开店计划不存在');
    }

    return storePlan as StorePlanWithRelations;
  },

  // 创建开店计划（增强版）
  async create(data: CreateStorePlanData, createdById: string): Promise<StorePlanWithRelations> {
    // 验证关联数据存在性
    const [region, entity] = await Promise.all([
      prisma.region.findUnique({ 
        where: { id: data.regionId },
        select: { id: true, code: true, name: true, isActive: true }
      }),
      prisma.companyEntity.findUnique({ 
        where: { id: data.entityId },
        select: { id: true, code: true, name: true, isActive: true }
      }),
    ]);

    if (!region || !region.isActive) {
      throw new BadRequestError('指定的区域不存在或已停用');
    }

    if (!entity || !entity.isActive) {
      throw new BadRequestError('指定的公司主体不存在或已停用');
    }

    // 检查是否存在相同的计划
    const existingPlan = await prisma.storePlan.findFirst({
      where: {
        year: data.year,
        quarter: data.quarter || null,
        regionId: data.regionId,
        entityId: data.entityId,
        storeType: data.storeType,
        status: {
          not: 'CANCELLED'  // 排除已取消的计划
        }
      },
    });

    if (existingPlan) {
      throw new ConflictError(`${data.year}年${data.quarter ? `第${data.quarter}季度` : '全年'}在${region.name}的${data.storeType}门店计划已存在`);
    }

    // 生成计划编号和标题
    const planCode = data.planCode || generatePlanCode(data.year, data.quarter || null, region.code);
    const quarterText = data.quarter ? `第${data.quarter}季度` : '全年';
    const defaultTitle = `${data.year}年${quarterText}${region.name}${data.storeType}门店开店计划`;

    // 创建开店计划
    const storePlan = await prisma.storePlan.create({
      data: {
        planCode,
        title: data.title || defaultTitle,
        year: data.year,
        quarter: data.quarter || null,
        regionId: data.regionId,
        entityId: data.entityId,
        storeType: data.storeType,
        plannedCount: data.plannedCount,
        budget: data.budget ? new Prisma.Decimal(data.budget) : null,
        actualBudget: data.actualBudget ? new Prisma.Decimal(data.actualBudget) : null,
        priority: data.priority || 'MEDIUM',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        description: data.description,
        remark: data.remark,
        status: 'DRAFT',
        createdById,
      },
      include: {
        region: {
          select: {
            id: true,
            name: true,
            code: true,
            fullPath: true,
          },
        },
        entity: {
          select: {
            id: true,
            name: true,
            code: true,
            legalName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            candidateLocations: true,
          },
        },
      },
    });

    logger.info(`Store plan created: ${storePlan.id} by user ${createdById}`);
    return storePlan as StorePlanWithRelations;
  },

  // 更新开店计划（增强版）
  async update(id: string, data: UpdateStorePlanData, operatorId: string): Promise<StorePlanWithRelations> {
    // 检查计划是否存在
    const existingPlan = await prisma.storePlan.findUnique({
      where: { id },
      include: { region: true, entity: true }
    });

    if (!existingPlan) {
      throw new NotFoundError('开店计划不存在');
    }

    // 检查是否允许修改
    if (existingPlan.status === 'COMPLETED') {
      throw new ForbiddenError('已完成的计划不能修改');
    }

    if (existingPlan.status === 'CANCELLED') {
      throw new ForbiddenError('已取消的计划不能修改');
    }

    // 准备更新数据
    const updateData: Prisma.StorePlanUpdateInput = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.quarter !== undefined) updateData.quarter = data.quarter;
    if (data.storeType !== undefined) updateData.storeType = data.storeType;
    if (data.plannedCount !== undefined) updateData.plannedCount = data.plannedCount;
    if (data.budget !== undefined) updateData.budget = data.budget ? new Prisma.Decimal(data.budget) : null;
    if (data.actualBudget !== undefined) updateData.actualBudget = data.actualBudget ? new Prisma.Decimal(data.actualBudget) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.remark !== undefined) updateData.remark = data.remark;

    // 更新计划
    const updatedPlan = await prisma.storePlan.update({
      where: { id },
      data: updateData,
      include: {
        region: {
          select: {
            id: true,
            name: true,
            code: true,
            fullPath: true,
          },
        },
        entity: {
          select: {
            id: true,
            name: true,
            code: true,
            legalName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            candidateLocations: true,
          },
        },
      },
    });

    logger.info(`Store plan updated: ${id} by user ${operatorId}`);
    return updatedPlan as StorePlanWithRelations;
  },

  // 删除开店计划（增强版）
  async delete(id: string, operatorId: string): Promise<void> {
    // 检查计划是否存在
    const existingPlan = await prisma.storePlan.findUnique({
      where: { id },
      include: {
        candidateLocations: {
          select: { id: true, status: true },
        },
      },
    });

    if (!existingPlan) {
      throw new NotFoundError('开店计划不存在');
    }

    // 检查删除权限
    if (existingPlan.status === 'APPROVED' || existingPlan.status === 'IN_PROGRESS') {
      throw new ForbiddenError('已审批或执行中的计划不能删除');
    }

    // 检查是否有关联的候选点位
    const activeLocations = existingPlan.candidateLocations.filter(
      loc => loc.status !== 'REJECTED' && loc.status !== 'SUSPENDED'
    );

    if (activeLocations.length > 0) {
      throw new BadRequestError(`存在${activeLocations.length}个关联的候选点位，无法删除`);
    }

    // 软删除：标记为已取消而不是物理删除
    await prisma.storePlan.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        remark: `${existingPlan.remark || ''}\n[系统] ${new Date().toISOString()} 由用户删除`
      }
    });

    logger.info(`Store plan deleted (cancelled): ${id} by user ${operatorId}`);
  },

  // 状态变更管理
  async changeStatus(id: string, statusData: StatusChangeData, operatorId: string): Promise<StorePlanWithRelations> {
    const existingPlan = await prisma.storePlan.findUnique({
      where: { id },
      include: { region: true, entity: true }
    });

    if (!existingPlan) {
      throw new NotFoundError('开店计划不存在');
    }

    // 验证状态转换是否合法
    if (!isValidStatusTransition(existingPlan.status as StorePlanStatusType, statusData.status)) {
      throw new BadRequestError(`不能从${existingPlan.status}状态变更为${statusData.status}状态`);
    }

    // 状态变更业务逻辑
    const updateData: Prisma.StorePlanUpdateInput = {
      status: statusData.status,
    };

    // 根据状态添加备注
    let statusRemark = '';
    switch (statusData.status) {
      case 'SUBMITTED':
        statusRemark = '计划已提交，等待审批';
        break;
      case 'APPROVED':
        statusRemark = `计划已批准${statusData.approver ? `，审批人：${statusData.approver}` : ''}`;
        break;
      case 'REJECTED':
        statusRemark = `计划已拒绝${statusData.reason ? `，拒绝原因：${statusData.reason}` : ''}`;
        break;
      case 'IN_PROGRESS':
        statusRemark = '计划开始执行';
        break;
      case 'COMPLETED':
        statusRemark = '计划执行完成';
        break;
      case 'CANCELLED':
        statusRemark = `计划已取消${statusData.reason ? `，取消原因：${statusData.reason}` : ''}`;
        break;
    }

    const newRemark = `${existingPlan.remark || ''}
[${new Date().toISOString()}] ${statusRemark}${statusData.comments ? `\n备注：${statusData.comments}` : ''}`;
    
    updateData.remark = newRemark;

    const updatedPlan = await prisma.storePlan.update({
      where: { id },
      data: updateData,
      include: {
        region: { select: { id: true, name: true, code: true, fullPath: true } },
        entity: { select: { id: true, name: true, code: true, legalName: true } },
        createdBy: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { candidateLocations: true } },
      },
    });

    logger.info(`Store plan status changed: ${id} from ${existingPlan.status} to ${statusData.status} by user ${operatorId}`);
    return updatedPlan as StorePlanWithRelations;
  },

  // 批量操作
  async batchOperation(batchData: BatchOperationData, operatorId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const id of batchData.ids) {
      try {
        switch (batchData.action) {
          case 'delete':
            await this.delete(id, operatorId);
            break;
          case 'approve':
            await this.changeStatus(id, { status: 'APPROVED', reason: batchData.reason }, operatorId);
            break;
          case 'reject':
            await this.changeStatus(id, { status: 'REJECTED', reason: batchData.reason }, operatorId);
            break;
          case 'execute':
            await this.changeStatus(id, { status: 'IN_PROGRESS', reason: batchData.reason }, operatorId);
            break;
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`ID ${id}: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    logger.info(`Batch operation ${batchData.action} completed: ${results.success} success, ${results.failed} failed`);
    return results;
  },

  // 统计分析
  async getStatistics(query: StatisticsQuery): Promise<StorePlanStatistics> {
    // 构建查询条件
    const where: Prisma.StorePlanWhereInput = {};
    
    if (query.year) where.year = query.year;
    if (query.quarter) where.quarter = query.quarter;
    if (query.regionIds?.length) where.regionId = { in: query.regionIds };
    if (query.entityIds?.length) where.entityId = { in: query.entityIds };
    if (query.storeTypes?.length) where.storeType = { in: query.storeTypes };

    // 基础统计
    const [totalPlans, plansWithStats] = await Promise.all([
      prisma.storePlan.count({ where }),
      prisma.storePlan.findMany({
        where,
        select: {
          id: true,
          plannedCount: true,
          completedCount: true,
          budget: true,
          actualBudget: true,
          status: true,
          regionId: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPlannedStores = plansWithStats.reduce((sum, plan) => sum + plan.plannedCount, 0);
    const totalCompletedStores = plansWithStats.reduce((sum, plan) => sum + plan.completedCount, 0);
    const totalBudget = plansWithStats.reduce((sum, plan) => sum + (plan.budget?.toNumber() || 0), 0);
    const actualBudget = plansWithStats.reduce((sum, plan) => sum + (plan.actualBudget?.toNumber() || 0), 0);

    // 状态分布
    const statusDistribution = plansWithStats.reduce((acc, plan) => {
      acc[plan.status as StorePlanStatusType] = (acc[plan.status as StorePlanStatusType] || 0) + 1;
      return acc;
    }, {} as Record<StorePlanStatusType, number>);

    // 地区分布
    const regionStats = await prisma.storePlan.groupBy({
      by: ['regionId'],
      where,
      _count: true,
      _sum: {
        plannedCount: true,
        completedCount: true,
        budget: true,
      },
    });

    const regionDistribution = await Promise.all(
      regionStats.map(async (stat) => {
        const region = await prisma.region.findUnique({
          where: { id: stat.regionId },
          select: { name: true },
        });
        return {
          regionId: stat.regionId,
          regionName: region?.name || '未知地区',
          count: stat._count,
          plannedStores: stat._sum.plannedCount || 0,
          completedStores: stat._sum.completedCount || 0,
          budget: stat._sum.budget?.toNumber() || 0,
        };
      })
    );

    // 月度趋势（简化版）
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthPlans = plansWithStats.filter(
        plan => plan.createdAt >= monthStart && plan.createdAt <= monthEnd
      );

      monthlyTrend.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        plannedCount: monthPlans.reduce((sum, plan) => sum + plan.plannedCount, 0),
        completedCount: monthPlans.reduce((sum, plan) => sum + plan.completedCount, 0),
        budget: monthPlans.reduce((sum, plan) => sum + (plan.budget?.toNumber() || 0), 0),
      });
    }

    return {
      totalPlans,
      totalPlannedStores,
      totalCompletedStores,
      totalBudget,
      actualBudget,
      completionRate: totalPlannedStores > 0 ? (totalCompletedStores / totalPlannedStores) * 100 : 0,
      budgetUtilization: totalBudget > 0 ? (actualBudget / totalBudget) * 100 : 0,
      statusDistribution,
      regionDistribution,
      monthlyTrend,
    };
  },

  // 进度跟踪
  async getProgress(): Promise<StorePlanProgress> {
    const currentYear = new Date().getFullYear();
    
    // 当年计划进度
    const yearPlans = await prisma.storePlan.findMany({
      where: { year: currentYear },
      include: {
        region: { select: { id: true, name: true } },
      },
    });

    const overallProgress = {
      total: yearPlans.length,
      completed: yearPlans.filter(p => p.status === 'COMPLETED').length,
      inProgress: yearPlans.filter(p => p.status === 'IN_PROGRESS').length,
      pending: yearPlans.filter(p => ['DRAFT', 'SUBMITTED', 'PENDING'].includes(p.status)).length,
      percentage: 0,
    };
    
    overallProgress.percentage = overallProgress.total > 0 
      ? (overallProgress.completed / overallProgress.total) * 100 
      : 0;

    // 地区进度
    const regionProgress = Object.values(
      yearPlans.reduce((acc, plan) => {
        const regionId = plan.regionId;
        if (!acc[regionId]) {
          acc[regionId] = {
            regionId,
            regionName: plan.region?.name || '未知地区',
            planned: 0,
            completed: 0,
            percentage: 0,
            onTrack: true,
          };
        }
        acc[regionId].planned += plan.plannedCount;
        acc[regionId].completed += plan.completedCount;
        return acc;
      }, {} as Record<string, any>)
    ).map(region => ({
      ...region,
      percentage: region.planned > 0 ? (region.completed / region.planned) * 100 : 0,
      onTrack: region.planned > 0 ? (region.completed / region.planned) >= 0.5 : true,
    }));

    // 延期计划（简化版）
    const delayedPlans = yearPlans
      .filter(plan => plan.endDate && new Date() > plan.endDate && plan.status !== 'COMPLETED')
      .map(plan => ({
        id: plan.id,
        title: plan.title,
        plannedEndDate: plan.endDate!.toISOString(),
        currentDelay: Math.floor((Date.now() - plan.endDate!.getTime()) / (1000 * 60 * 60 * 24)),
        reason: '执行中',
      }));

    return {
      overallProgress,
      regionProgress,
      delayedPlans,
    };
  },

  // 汇总信息
  async getSummary(): Promise<StorePlanSummary> {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor((currentDate.getMonth()) / 3) + 1;

    // 当年汇总
    const yearStats = await prisma.storePlan.aggregate({
      where: { year: currentYear },
      _sum: {
        plannedCount: true,
        completedCount: true,
        budget: true,
      },
      _count: true,
    });

    // 当季汇总
    const quarterStats = await prisma.storePlan.aggregate({
      where: { 
        year: currentYear,
        quarter: currentQuarter,
      },
      _sum: {
        plannedCount: true,
        completedCount: true,
        budget: true,
      },
      _count: true,
    });

    // 表现最好的地区
    const topRegions = await prisma.storePlan.groupBy({
      by: ['regionId'],
      where: { year: currentYear },
      _sum: {
        plannedCount: true,
        completedCount: true,
      },
      orderBy: {
        _sum: {
          completedCount: 'desc',
        },
      },
      take: 5,
    });

    const topRegionsWithNames = await Promise.all(
      topRegions.map(async (stat) => {
        const region = await prisma.region.findUnique({
          where: { id: stat.regionId },
          select: { name: true },
        });
        return {
          regionId: stat.regionId,
          regionName: region?.name || '未知地区',
          plannedCount: stat._sum.plannedCount || 0,
          completedCount: stat._sum.completedCount || 0,
          completionRate: stat._sum.plannedCount && stat._sum.plannedCount > 0 
            ? ((stat._sum.completedCount || 0) / stat._sum.plannedCount) * 100 
            : 0,
        };
      })
    );

    // 最近活动（简化版）
    const recentActivities = await prisma.storePlan.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
        },
      },
      include: {
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return {
      currentYear: {
        planned: yearStats._sum.plannedCount || 0,
        completed: yearStats._sum.completedCount || 0,
        budget: yearStats._sum.budget?.toNumber() || 0,
        progress: yearStats._sum.plannedCount && yearStats._sum.plannedCount > 0 
          ? ((yearStats._sum.completedCount || 0) / yearStats._sum.plannedCount) * 100 
          : 0,
      },
      currentQuarter: {
        planned: quarterStats._sum.plannedCount || 0,
        completed: quarterStats._sum.completedCount || 0,
        budget: quarterStats._sum.budget?.toNumber() || 0,
        progress: quarterStats._sum.plannedCount && quarterStats._sum.plannedCount > 0 
          ? ((quarterStats._sum.completedCount || 0) / quarterStats._sum.plannedCount) * 100 
          : 0,
      },
      topRegions: topRegionsWithNames,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        title: activity.title,
        action: '更新',
        timestamp: activity.updatedAt.toISOString(),
        user: activity.createdBy.name,
      })),
    };
  },

  // 导出数据（增强版）
  async exportData(exportData: ExportData): Promise<{ filename: string; contentType: string; buffer: Buffer }> {
    const { format, filters, columns } = exportData;
    
    // 构建查询条件
    const where: Prisma.StorePlanWhereInput = {};
    
    if (filters?.year) where.year = filters.year;
    if (filters?.quarter) where.quarter = filters.quarter;
    if (filters?.regionId) where.regionId = filters.regionId;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.storeType) where.storeType = filters.storeType;
    if (filters?.status) where.status = filters.status;

    // 获取数据
    const storePlans = await prisma.storePlan.findMany({
      where,
      include: {
        region: { select: { name: true, code: true, fullPath: true } },
        entity: { select: { name: true, code: true, legalName: true } },
        createdBy: { select: { name: true, username: true } },
      },
      orderBy: [
        { year: 'desc' },
        { quarter: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 转换数据格式
    const fullData = storePlans.map(plan => ({
      计划编号: plan.planCode,
      计划标题: plan.title,
      年份: plan.year,
      季度: plan.quarter?.toString() || '全年',
      地区名称: plan.region.name,
      地区代码: plan.region.code,
      地区路径: plan.region.fullPath || '',
      公司主体: plan.entity.name,
      主体代码: plan.entity.code,
      法定名称: plan.entity.legalName,
      门店类型: plan.storeType,
      计划数量: plan.plannedCount,
      完成数量: plan.completedCount,
      完成率: plan.plannedCount > 0 ? `${((plan.completedCount / plan.plannedCount) * 100).toFixed(1)}%` : '0%',
      计划预算: plan.budget?.toString() || '',
      实际预算: plan.actualBudget?.toString() || '',
      优先级: plan.priority,
      状态: plan.status,
      开始日期: plan.startDate?.toISOString().split('T')[0] || '',
      结束日期: plan.endDate?.toISOString().split('T')[0] || '',
      描述: plan.description || '',
      备注: plan.remark || '',
      创建人: plan.createdBy.name,
      创建时间: plan.createdAt.toISOString().replace('T', ' ').replace('Z', ''),
      更新时间: plan.updatedAt.toISOString().replace('T', ' ').replace('Z', ''),
    }));

    // 根据指定列筛选数据
    const exportColumns = columns || Object.keys(fullData[0] || {});
    const filteredData = fullData.map(row => {
      const filteredRow: Record<string, any> = {};
      exportColumns.forEach(col => {
        if (row.hasOwnProperty(col)) {
          filteredRow[col] = row[col as keyof typeof row];
        }
      });
      return filteredRow;
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `开店计划_${timestamp}.${format}`;

    if (format === 'xlsx') {
      // 这里需要实际的 Excel 生成逻辑，比如使用 xlsx 或 exceljs 库
      // 目前返回占位符
      return {
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('Excel data placeholder - 需要集成Excel生成库'),
      };
    } else {
      // 生成 CSV
      if (filteredData.length === 0) {
        throw new BadRequestError('没有数据可导出');
      }
      
      const headers = Object.keys(filteredData[0]).join(',');
      const rows = filteredData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [headers, ...rows].join('\n');
      
      return {
        filename,
        contentType: 'text/csv; charset=utf-8',
        buffer: Buffer.from('\uFEFF' + csvContent, 'utf8'), // 添加 BOM 支持中文
      };
    }
  },
};