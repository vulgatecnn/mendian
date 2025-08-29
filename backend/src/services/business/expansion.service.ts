/**
 * 拓店管理业务服务层
 * 候选点位管理、跟进记录管理、数据分析服务
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';
import { 
  CreateCandidateLocationData,
  UpdateCandidateLocationData,
  CandidateLocationQuery,
  StatusChangeData,
  ScoreUpdateData,
  CreateFollowUpRecordData,
  UpdateFollowUpRecordData,
  FollowUpRecordQuery,
  BatchOperationData,
  MapQuery,
  StatisticsQuery,
  ExportData,
  CandidateLocationWithRelations,
  FollowUpRecordWithRelations,
  PaginatedResult,
  MapDataResponse,
  ExpansionStatistics,
  FollowUpStatistics,
  ExpansionProgress,
  ExpansionDashboard,
  CandidateLocationStatusType,
  isValidStatusTransition,
} from '@/types/expansion.js';

const prisma = new PrismaClient();

// 生成候选点位编号的辅助函数
const generateLocationCode = (regionCode: string): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CL${regionCode}-${timestamp}-${random}`;
};

// 计算综合评分的辅助函数
const calculateOverallScore = (criteria?: {
  location: number;
  traffic: number;
  competition: number;
  cost: number;
  potential: number;
}): number => {
  if (!criteria) return 0;
  
  const weights = {
    location: 0.3,
    traffic: 0.2,
    competition: 0.2,
    cost: 0.15,
    potential: 0.15,
  };

  return (
    criteria.location * weights.location +
    criteria.traffic * weights.traffic +
    criteria.competition * weights.competition +
    criteria.cost * weights.cost +
    criteria.potential * weights.potential
  );
};

export const expansionService = {
  // ===============================
  // 候选点位管理
  // ===============================

  /**
   * 获取候选点位列表
   */
  async getCandidateLocationList(query: CandidateLocationQuery): Promise<PaginatedResult<CandidateLocationWithRelations>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.CandidateLocationWhereInput = {};
    
    if (filters.storePlanId) where.storePlanId = filters.storePlanId;
    if (filters.regionId) where.regionId = filters.regionId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    
    // 面积范围筛选
    if (filters.minArea !== undefined || filters.maxArea !== undefined) {
      where.area = {};
      if (filters.minArea !== undefined) where.area.gte = filters.minArea;
      if (filters.maxArea !== undefined) where.area.lte = filters.maxArea;
    }
    
    // 租金范围筛选
    if (filters.minRent !== undefined || filters.maxRent !== undefined) {
      where.rentPrice = {};
      if (filters.minRent !== undefined) where.rentPrice.gte = new Prisma.Decimal(filters.minRent);
      if (filters.maxRent !== undefined) where.rentPrice.lte = new Prisma.Decimal(filters.maxRent);
    }
    
    // 评分范围筛选
    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      where.evaluationScore = {};
      if (filters.minScore !== undefined) where.evaluationScore.gte = new Prisma.Decimal(filters.minScore);
      if (filters.maxScore !== undefined) where.evaluationScore.lte = new Prisma.Decimal(filters.maxScore);
    }
    
    // 发现日期范围筛选
    if (filters.discoveryDateStart || filters.discoveryDateEnd) {
      where.discoveryDate = {};
      if (filters.discoveryDateStart) where.discoveryDate.gte = new Date(filters.discoveryDateStart);
      if (filters.discoveryDateEnd) where.discoveryDate.lte = new Date(filters.discoveryDateEnd);
    }
    
    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }
    
    // 关键词搜索
    if (filters.keyword) {
      where.OR = [
        { name: { contains: filters.keyword, mode: 'insensitive' } },
        { address: { contains: filters.keyword, mode: 'insensitive' } },
        { detailedAddress: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    // 排序条件
    const orderBy: Prisma.CandidateLocationOrderByWithRelationInput = {};
    if (sortBy === 'rentPrice' || sortBy === 'evaluationScore') {
      orderBy[sortBy] = { sort: sortOrder, nulls: 'last' };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // 执行查询
    const [items, total] = await Promise.all([
      prisma.candidateLocation.findMany({
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
          storePlan: {
            select: {
              id: true,
              planCode: true,
              title: true,
              year: true,
              quarter: true,
              status: true,
            },
          },
          _count: {
            select: {
              followUpRecords: true,
            },
          },
        },
        orderBy,
      }),
      prisma.candidateLocation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items as CandidateLocationWithRelations[],
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
   * 根据ID获取候选点位详情
   */
  async getCandidateLocationById(id: string): Promise<CandidateLocationWithRelations> {
    const candidateLocation = await prisma.candidateLocation.findUnique({
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
        storePlan: {
          select: {
            id: true,
            planCode: true,
            title: true,
            year: true,
            quarter: true,
            status: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        followUpRecords: {
          select: {
            id: true,
            type: true,
            title: true,
            content: true,
            result: true,
            nextFollowUpDate: true,
            actualFollowUpDate: true,
            status: true,
            importance: true,
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!candidateLocation) {
      throw new NotFoundError('候选点位不存在');
    }

    return candidateLocation as CandidateLocationWithRelations;
  },

  /**
   * 创建候选点位
   */
  async createCandidateLocation(data: CreateCandidateLocationData, operatorId: string): Promise<CandidateLocationWithRelations> {
    // 验证关联数据存在性
    const region = await prisma.region.findUnique({ 
      where: { id: data.regionId },
      select: { id: true, code: true, name: true, isActive: true }
    });

    if (!region || !region.isActive) {
      throw new BadRequestError('指定的区域不存在或已停用');
    }

    // 如果指定了开店计划，验证计划存在性和状态
    if (data.storePlanId) {
      const storePlan = await prisma.storePlan.findUnique({
        where: { id: data.storePlanId },
        select: { id: true, status: true }
      });

      if (!storePlan) {
        throw new BadRequestError('指定的开店计划不存在');
      }

      if (storePlan.status === 'CANCELLED') {
        throw new BadRequestError('不能关联已取消的开店计划');
      }
    }

    // 检查同一地址是否已存在候选点位
    const existingLocation = await prisma.candidateLocation.findFirst({
      where: {
        address: data.address,
        status: {
          not: 'REJECTED'  // 排除已拒绝的点位
        }
      },
    });

    if (existingLocation) {
      throw new ConflictError('该地址已存在候选点位');
    }

    // 生成点位编号
    const locationCode = generateLocationCode(region.code);

    // 创建候选点位
    const candidateLocation = await prisma.candidateLocation.create({
      data: {
        locationCode,
        storePlanId: data.storePlanId || null,
        regionId: data.regionId,
        name: data.name,
        address: data.address,
        detailedAddress: data.detailedAddress,
        area: data.area ? new Prisma.Decimal(data.area) : null,
        usableArea: data.usableArea ? new Prisma.Decimal(data.usableArea) : null,
        rentPrice: data.rentPrice ? new Prisma.Decimal(data.rentPrice) : null,
        rentUnit: data.rentUnit,
        depositAmount: data.depositAmount ? new Prisma.Decimal(data.depositAmount) : null,
        transferFee: data.transferFee ? new Prisma.Decimal(data.transferFee) : null,
        propertyFee: data.propertyFee ? new Prisma.Decimal(data.propertyFee) : null,
        landlordName: data.landlordName,
        landlordPhone: data.landlordPhone,
        landlordEmail: data.landlordEmail,
        intermediaryInfo: data.intermediaryInfo,
        coordinates: data.coordinates,
        photos: data.photos || [],
        floorPlan: data.floorPlan || [],
        trafficInfo: data.trafficInfo,
        competitorInfo: data.competitorInfo || [],
        priority: data.priority || 'MEDIUM',
        expectedSignDate: data.expectedSignDate ? new Date(data.expectedSignDate) : null,
        notes: data.notes,
        tags: data.tags || [],
        status: 'PENDING',
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
        storePlan: {
          select: {
            id: true,
            planCode: true,
            title: true,
            year: true,
            quarter: true,
          },
        },
        _count: {
          select: {
            followUpRecords: true,
          },
        },
      },
    });

    // 自动创建首次跟进任务
    await prisma.followUpRecord.create({
      data: {
        candidateLocationId: candidateLocation.id,
        assigneeId: operatorId,
        createdById: operatorId,
        type: 'SITE_VISIT',
        title: '初步实地考察',
        content: '对新发现的候选点位进行初步实地考察，了解基本情况',
        nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
        importance: data.priority || 'MEDIUM',
        status: 'PENDING',
        tags: ['初步考察'],
      },
    });

    logger.info(`Candidate location created: ${candidateLocation.id} by user ${operatorId}`);
    return candidateLocation as CandidateLocationWithRelations;
  },

  /**
   * 更新候选点位
   */
  async updateCandidateLocation(id: string, data: UpdateCandidateLocationData, operatorId: string): Promise<CandidateLocationWithRelations> {
    // 检查点位是否存在
    const existingLocation = await prisma.candidateLocation.findUnique({
      where: { id },
      include: { region: true }
    });

    if (!existingLocation) {
      throw new NotFoundError('候选点位不存在');
    }

    // 检查是否允许修改
    if (existingLocation.status === 'CONTRACTED') {
      throw new ForbiddenError('已签约的点位不能修改基本信息');
    }

    // 验证开店计划关联
    if (data.storePlanId !== undefined && data.storePlanId !== existingLocation.storePlanId) {
      if (data.storePlanId) {
        const storePlan = await prisma.storePlan.findUnique({
          where: { id: data.storePlanId },
          select: { id: true, status: true }
        });

        if (!storePlan) {
          throw new BadRequestError('指定的开店计划不存在');
        }

        if (storePlan.status === 'CANCELLED') {
          throw new BadRequestError('不能关联已取消的开店计划');
        }
      }
    }

    // 准备更新数据
    const updateData: Prisma.CandidateLocationUpdateInput = {};
    
    if (data.storePlanId !== undefined) updateData.storePlanId = data.storePlanId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.detailedAddress !== undefined) updateData.detailedAddress = data.detailedAddress;
    if (data.area !== undefined) updateData.area = data.area ? new Prisma.Decimal(data.area) : null;
    if (data.usableArea !== undefined) updateData.usableArea = data.usableArea ? new Prisma.Decimal(data.usableArea) : null;
    if (data.rentPrice !== undefined) updateData.rentPrice = data.rentPrice ? new Prisma.Decimal(data.rentPrice) : null;
    if (data.rentUnit !== undefined) updateData.rentUnit = data.rentUnit;
    if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount ? new Prisma.Decimal(data.depositAmount) : null;
    if (data.transferFee !== undefined) updateData.transferFee = data.transferFee ? new Prisma.Decimal(data.transferFee) : null;
    if (data.propertyFee !== undefined) updateData.propertyFee = data.propertyFee ? new Prisma.Decimal(data.propertyFee) : null;
    if (data.landlordName !== undefined) updateData.landlordName = data.landlordName;
    if (data.landlordPhone !== undefined) updateData.landlordPhone = data.landlordPhone;
    if (data.landlordEmail !== undefined) updateData.landlordEmail = data.landlordEmail;
    if (data.intermediaryInfo !== undefined) updateData.intermediaryInfo = data.intermediaryInfo;
    if (data.coordinates !== undefined) updateData.coordinates = data.coordinates;
    if (data.photos !== undefined) updateData.photos = data.photos;
    if (data.floorPlan !== undefined) updateData.floorPlan = data.floorPlan;
    if (data.trafficInfo !== undefined) updateData.trafficInfo = data.trafficInfo;
    if (data.competitorInfo !== undefined) updateData.competitorInfo = data.competitorInfo;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.expectedSignDate !== undefined) updateData.expectedSignDate = data.expectedSignDate ? new Date(data.expectedSignDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // 更新点位
    const updatedLocation = await prisma.candidateLocation.update({
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
        storePlan: {
          select: {
            id: true,
            planCode: true,
            title: true,
            year: true,
            quarter: true,
          },
        },
        _count: {
          select: {
            followUpRecords: true,
          },
        },
      },
    });

    logger.info(`Candidate location updated: ${id} by user ${operatorId}`);
    return updatedLocation as CandidateLocationWithRelations;
  },

  /**
   * 删除候选点位
   */
  async deleteCandidateLocation(id: string, operatorId: string): Promise<void> {
    // 检查点位是否存在
    const existingLocation = await prisma.candidateLocation.findUnique({
      where: { id },
      include: {
        followUpRecords: {
          select: { id: true, status: true },
        },
      },
    });

    if (!existingLocation) {
      throw new NotFoundError('候选点位不存在');
    }

    // 检查删除权限
    if (existingLocation.status === 'CONTRACTED') {
      throw new ForbiddenError('已签约的点位不能删除');
    }

    if (existingLocation.status === 'NEGOTIATING') {
      throw new ForbiddenError('商务谈判中的点位不能删除，请先更改状态');
    }

    // 检查是否有进行中的跟进记录
    const activeFollowUps = existingLocation.followUpRecords.filter(
      record => record.status === 'PENDING' || record.status === 'IN_PROGRESS'
    );

    if (activeFollowUps.length > 0) {
      throw new BadRequestError(`存在${activeFollowUps.length}个进行中的跟进记录，请先处理完成`);
    }

    // 软删除：标记为已拒绝而不是物理删除
    await prisma.candidateLocation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        notes: `${existingLocation.notes || ''}\n[系统] ${new Date().toISOString()} 由用户删除`
      }
    });

    logger.info(`Candidate location deleted (rejected): ${id} by user ${operatorId}`);
  },

  /**
   * 变更候选点位状态
   */
  async changeCandidateLocationStatus(id: string, statusData: StatusChangeData, operatorId: string): Promise<CandidateLocationWithRelations> {
    const existingLocation = await prisma.candidateLocation.findUnique({
      where: { id },
      include: { region: true, storePlan: true }
    });

    if (!existingLocation) {
      throw new NotFoundError('候选点位不存在');
    }

    // 验证状态转换是否合法
    if (!isValidStatusTransition(existingLocation.status as CandidateLocationStatusType, statusData.status)) {
      throw new BadRequestError(`不能从${existingLocation.status}状态变更为${statusData.status}状态`);
    }

    // 状态变更业务逻辑
    const updateData: Prisma.CandidateLocationUpdateInput = {
      status: statusData.status,
    };

    // 根据状态添加备注
    let statusRemark = '';
    switch (statusData.status) {
      case 'EVALUATING':
        statusRemark = '开始评估候选点位';
        break;
      case 'FOLLOWING':
        statusRemark = '开始跟进候选点位';
        break;
      case 'NEGOTIATING':
        statusRemark = '开始商务谈判';
        break;
      case 'CONTRACTED':
        statusRemark = '点位签约成功';
        // 更新关联的开店计划完成数量
        if (existingLocation.storePlanId) {
          await prisma.storePlan.update({
            where: { id: existingLocation.storePlanId },
            data: {
              completedCount: {
                increment: 1,
              },
            },
          });
        }
        break;
      case 'REJECTED':
        statusRemark = `点位被拒绝${statusData.reason ? `，原因：${statusData.reason}` : ''}`;
        break;
      case 'SUSPENDED':
        statusRemark = `点位暂停跟进${statusData.reason ? `，原因：${statusData.reason}` : ''}`;
        break;
    }

    const newNotes = `${existingLocation.notes || ''}
[${new Date().toISOString()}] ${statusRemark}${statusData.comments ? `\n备注：${statusData.comments}` : ''}`;
    
    updateData.notes = newNotes;

    const updatedLocation = await prisma.candidateLocation.update({
      where: { id },
      data: updateData,
      include: {
        region: { select: { id: true, name: true, code: true, fullPath: true } },
        storePlan: { select: { id: true, planCode: true, title: true } },
        _count: { select: { followUpRecords: true } },
      },
    });

    // 根据状态变更自动创建跟进任务
    if (statusData.status === 'FOLLOWING') {
      await prisma.followUpRecord.create({
        data: {
          candidateLocationId: id,
          assigneeId: operatorId,
          createdById: operatorId,
          type: 'SITE_VISIT',
          title: '详细实地考察',
          content: '对候选点位进行详细的实地考察和评估',
          nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
          importance: existingLocation.priority,
          status: 'PENDING',
          tags: ['状态变更', '实地考察'],
        },
      });
    } else if (statusData.status === 'NEGOTIATING') {
      await prisma.followUpRecord.create({
        data: {
          candidateLocationId: id,
          assigneeId: operatorId,
          createdById: operatorId,
          type: 'NEGOTIATION',
          title: '商务条件谈判',
          content: '就租金、装修期、免租期等商务条件进行谈判',
          nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1天后
          importance: 'HIGH',
          status: 'PENDING',
          tags: ['状态变更', '商务谈判'],
        },
      });
    }

    logger.info(`Candidate location status changed: ${id} from ${existingLocation.status} to ${statusData.status} by user ${operatorId}`);
    return updatedLocation as CandidateLocationWithRelations;
  },

  /**
   * 更新候选点位评分
   */
  async updateCandidateLocationScore(id: string, scoreData: ScoreUpdateData, operatorId: string): Promise<CandidateLocationWithRelations> {
    const existingLocation = await prisma.candidateLocation.findUnique({
      where: { id }
    });

    if (!existingLocation) {
      throw new NotFoundError('候选点位不存在');
    }

    // 计算综合评分
    const overallScore = scoreData.evaluationCriteria 
      ? calculateOverallScore(scoreData.evaluationCriteria)
      : scoreData.evaluationScore;

    const updateData: Prisma.CandidateLocationUpdateInput = {
      evaluationScore: new Prisma.Decimal(overallScore),
    };

    // 添加评估备注
    if (scoreData.evaluationComments) {
      const newNotes = `${existingLocation.notes || ''}
[${new Date().toISOString()}] 评分更新：${overallScore.toFixed(1)}分
评价意见：${scoreData.evaluationComments}`;
      updateData.notes = newNotes;
    }

    const updatedLocation = await prisma.candidateLocation.update({
      where: { id },
      data: updateData,
      include: {
        region: { select: { id: true, name: true, code: true, fullPath: true } },
        storePlan: { select: { id: true, planCode: true, title: true } },
        _count: { select: { followUpRecords: true } },
      },
    });

    // 创建评分记录的跟进
    await prisma.followUpRecord.create({
      data: {
        candidateLocationId: id,
        assigneeId: operatorId,
        createdById: operatorId,
        type: 'DOCUMENTATION',
        title: `点位评分更新：${overallScore.toFixed(1)}分`,
        content: `点位综合评分已更新为${overallScore.toFixed(1)}分${scoreData.evaluationComments ? `\n评价意见：${scoreData.evaluationComments}` : ''}`,
        status: 'COMPLETED',
        importance: 'MEDIUM',
        actualFollowUpDate: new Date(),
        tags: ['评分更新'],
      },
    });

    logger.info(`Candidate location score updated: ${id} to ${overallScore.toFixed(1)} by user ${operatorId}`);
    return updatedLocation as CandidateLocationWithRelations;
  },

  // ===============================
  // 跟进记录管理
  // ===============================

  /**
   * 获取跟进记录列表
   */
  async getFollowUpRecordList(query: FollowUpRecordQuery): Promise<PaginatedResult<FollowUpRecordWithRelations>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: Prisma.FollowUpRecordWhereInput = {};
    
    if (filters.candidateLocationId) where.candidateLocationId = filters.candidateLocationId;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.importance) where.importance = filters.importance;
    
    // 日期范围筛选
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    
    // 下次跟进日期范围筛选
    if (filters.nextFollowUpDateStart || filters.nextFollowUpDateEnd) {
      where.nextFollowUpDate = {};
      if (filters.nextFollowUpDateStart) where.nextFollowUpDate.gte = new Date(filters.nextFollowUpDateStart);
      if (filters.nextFollowUpDateEnd) where.nextFollowUpDate.lte = new Date(filters.nextFollowUpDateEnd);
    }
    
    // 关键词搜索
    if (filters.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { content: { contains: filters.keyword, mode: 'insensitive' } },
        { result: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    // 排序条件
    const orderBy: Prisma.FollowUpRecordOrderByWithRelationInput = {};
    if (sortBy === 'nextFollowUpDate' || sortBy === 'actualFollowUpDate') {
      orderBy[sortBy] = { sort: sortOrder, nulls: 'last' };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // 执行查询
    const [items, total] = await Promise.all([
      prisma.followUpRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          candidateLocation: {
            select: {
              id: true,
              locationCode: true,
              name: true,
              address: true,
              status: true,
              priority: true,
            },
          },
          assignee: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
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
        },
        orderBy,
      }),
      prisma.followUpRecord.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items as FollowUpRecordWithRelations[],
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
   * 根据ID获取跟进记录详情
   */
  async getFollowUpRecordById(id: string): Promise<FollowUpRecordWithRelations> {
    const followUpRecord = await prisma.followUpRecord.findUnique({
      where: { id },
      include: {
        candidateLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            address: true,
            status: true,
            priority: true,
            region: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            jobTitle: true,
            phone: true,
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
      },
    });

    if (!followUpRecord) {
      throw new NotFoundError('跟进记录不存在');
    }

    return followUpRecord as FollowUpRecordWithRelations;
  },

  /**
   * 创建跟进记录
   */
  async createFollowUpRecord(data: CreateFollowUpRecordData, createdById: string): Promise<FollowUpRecordWithRelations> {
    // 验证候选点位是否存在
    const candidateLocation = await prisma.candidateLocation.findUnique({ 
      where: { id: data.candidateLocationId },
      select: { id: true, status: true }
    });

    if (!candidateLocation) {
      throw new BadRequestError('指定的候选点位不存在');
    }

    if (candidateLocation.status === 'CONTRACTED' || candidateLocation.status === 'REJECTED') {
      throw new BadRequestError('已签约或已拒绝的点位不能添加新的跟进记录');
    }

    // 验证负责人是否存在
    const assignee = await prisma.user.findUnique({
      where: { id: data.assigneeId },
      select: { id: true, status: true }
    });

    if (!assignee || assignee.status !== 'ACTIVE') {
      throw new BadRequestError('指定的负责人不存在或已停用');
    }

    // 创建跟进记录
    const followUpRecord = await prisma.followUpRecord.create({
      data: {
        candidateLocationId: data.candidateLocationId,
        assigneeId: data.assigneeId,
        createdById,
        type: data.type,
        title: data.title,
        content: data.content,
        result: data.result,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        actualFollowUpDate: data.actualFollowUpDate ? new Date(data.actualFollowUpDate) : null,
        duration: data.duration,
        cost: data.cost ? new Prisma.Decimal(data.cost) : null,
        importance: data.importance || 'MEDIUM',
        attachments: data.attachments || [],
        location: data.location,
        participants: data.participants || [],
        tags: data.tags || [],
        status: 'PENDING',
      },
      include: {
        candidateLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            address: true,
            status: true,
            priority: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
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
      },
    });

    logger.info(`Follow-up record created: ${followUpRecord.id} by user ${createdById}`);
    return followUpRecord as FollowUpRecordWithRelations;
  },

  /**
   * 更新跟进记录
   */
  async updateFollowUpRecord(id: string, data: UpdateFollowUpRecordData, operatorId: string): Promise<FollowUpRecordWithRelations> {
    // 检查跟进记录是否存在
    const existingRecord = await prisma.followUpRecord.findUnique({
      where: { id },
      include: { candidateLocation: true }
    });

    if (!existingRecord) {
      throw new NotFoundError('跟进记录不存在');
    }

    // 检查是否允许修改
    if (existingRecord.status === 'COMPLETED' && !data.status) {
      throw new ForbiddenError('已完成的跟进记录不能修改内容');
    }

    // 准备更新数据
    const updateData: Prisma.FollowUpRecordUpdateInput = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.nextFollowUpDate !== undefined) updateData.nextFollowUpDate = data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null;
    if (data.actualFollowUpDate !== undefined) updateData.actualFollowUpDate = data.actualFollowUpDate ? new Date(data.actualFollowUpDate) : null;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.cost !== undefined) updateData.cost = data.cost ? new Prisma.Decimal(data.cost) : null;
    if (data.importance !== undefined) updateData.importance = data.importance;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.participants !== undefined) updateData.participants = data.participants;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // 更新跟进记录
    const updatedRecord = await prisma.followUpRecord.update({
      where: { id },
      data: updateData,
      include: {
        candidateLocation: {
          select: {
            id: true,
            locationCode: true,
            name: true,
            address: true,
            status: true,
            priority: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
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
      },
    });

    logger.info(`Follow-up record updated: ${id} by user ${operatorId}`);
    return updatedRecord as FollowUpRecordWithRelations;
  },

  /**
   * 删除跟进记录
   */
  async deleteFollowUpRecord(id: string, operatorId: string): Promise<void> {
    // 检查跟进记录是否存在
    const existingRecord = await prisma.followUpRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      throw new NotFoundError('跟进记录不存在');
    }

    // 检查删除权限
    if (existingRecord.status === 'COMPLETED') {
      throw new ForbiddenError('已完成的跟进记录不能删除');
    }

    // 物理删除跟进记录（因为跟进记录相对来说不是特别重要的业务数据）
    await prisma.followUpRecord.delete({
      where: { id }
    });

    logger.info(`Follow-up record deleted: ${id} by user ${operatorId}`);
  },

  // ===============================
  // 批量操作
  // ===============================

  /**
   * 批量操作候选点位
   */
  async batchOperationCandidateLocations(batchData: BatchOperationData, operatorId: string): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const id of batchData.ids) {
      try {
        switch (batchData.action) {
          case 'delete':
            await this.deleteCandidateLocation(id, operatorId);
            break;
          case 'changeStatus':
            if (batchData.actionData?.status) {
              await this.changeCandidateLocationStatus(
                id, 
                { 
                  status: batchData.actionData.status, 
                  reason: batchData.actionData.reason 
                }, 
                operatorId
              );
            }
            break;
          case 'changePriority':
            if (batchData.actionData?.priority) {
              await this.updateCandidateLocation(
                id,
                { priority: batchData.actionData.priority },
                operatorId
              );
            }
            break;
          case 'assignFollowUp':
            if (batchData.actionData?.assigneeId) {
              const location = await this.getCandidateLocationById(id);
              await this.createFollowUpRecord({
                candidateLocationId: id,
                assigneeId: batchData.actionData.assigneeId,
                type: 'OTHER',
                title: '批量分配的跟进任务',
                content: `批量操作分配的跟进任务${batchData.actionData.reason ? `\n原因：${batchData.actionData.reason}` : ''}`,
                importance: location.priority,
              }, operatorId);
            }
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

  // ===============================
  // 地图数据服务
  // ===============================

  /**
   * 获取地图数据
   */
  async getMapData(query: MapQuery): Promise<MapDataResponse> {
    const where: Prisma.CandidateLocationWhereInput = {};
    
    if (query.regionId) where.regionId = query.regionId;
    
    // 地理边界筛选
    if (query.bounds) {
      where.coordinates = {
        not: null,
        // 这里需要实际的地理位置查询逻辑，暂时用简单的字符串匹配
      };
    }

    const locations = await prisma.candidateLocation.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        coordinates: true,
        status: true,
        priority: true,
        rentPrice: true,
        evaluationScore: true,
        storePlan: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            followUpRecords: true,
          },
        },
      },
    });

    // 转换坐标数据
    const mapLocations = locations
      .filter(loc => loc.coordinates)
      .map(loc => {
        const [lng, lat] = loc.coordinates!.split(',').map(Number);
        return {
          id: loc.id,
          name: loc.name,
          address: loc.address,
          coordinates: { latitude: lat, longitude: lng },
          status: loc.status as CandidateLocationStatusType,
          priority: loc.priority,
          rentPrice: loc.rentPrice?.toNumber(),
          evaluationScore: loc.evaluationScore?.toNumber(),
          followUpCount: loc._count.followUpRecords,
          storePlanTitle: loc.storePlan?.title,
        };
      });

    return {
      locations: mapLocations,
      bounds: query.bounds,
    };
  },

  // ===============================
  // 统计分析服务
  // ===============================

  /**
   * 获取拓店统计数据
   */
  async getExpansionStatistics(query: StatisticsQuery): Promise<ExpansionStatistics> {
    // 构建查询条件
    const where: Prisma.CandidateLocationWhereInput = {};
    
    if (query.regionIds?.length) where.regionId = { in: query.regionIds };
    if (query.storePlanIds?.length) where.storePlanId = { in: query.storePlanIds };
    
    if (query.dateRange) {
      where.discoveryDate = {
        gte: new Date(query.dateRange.start),
        lte: new Date(query.dateRange.end),
      };
    }

    // 基础统计
    const [locationsWithStats] = await Promise.all([
      prisma.candidateLocation.findMany({
        where,
        select: {
          id: true,
          status: true,
          priority: true,
          evaluationScore: true,
          rentPrice: true,
          regionId: true,
          discoveryDate: true,
          createdAt: true,
        },
      }),
    ]);

    const totalLocations = locationsWithStats.length;

    // 状态分布统计
    const statusDistribution = locationsWithStats.reduce((acc, location) => {
      const status = location.status as CandidateLocationStatusType;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<CandidateLocationStatusType, number>);

    // 优先级分布
    const priorityDistribution = locationsWithStats.reduce((acc, location) => {
      acc[location.priority] = (acc[location.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 地区分布统计
    const regionStats = await prisma.candidateLocation.groupBy({
      by: ['regionId'],
      where,
      _count: true,
      _avg: {
        evaluationScore: true,
        rentPrice: true,
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
          avgScore: stat._avg.evaluationScore?.toNumber() || 0,
          avgRent: stat._avg.rentPrice?.toNumber() || 0,
        };
      })
    );

    // 趋势数据（简化版）
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayLocations = locationsWithStats.filter(
        location => location.createdAt >= dayStart && location.createdAt < dayEnd
      );

      const contractedLocations = dayLocations.filter(
        location => location.status === 'CONTRACTED'
      );

      // 简化的跟进统计
      const followUpCount = dayLocations.length * 2; // 假设平均每个点位2个跟进

      trendData.push({
        date: dayStart.toISOString().split('T')[0],
        newLocations: dayLocations.length,
        contractedLocations: contractedLocations.length,
        followUpCount,
      });
    }

    // 性能指标
    const validScores = locationsWithStats.filter(l => l.evaluationScore !== null);
    const validRents = locationsWithStats.filter(l => l.rentPrice !== null);
    
    const performanceMetrics = {
      avgEvaluationScore: validScores.length > 0 
        ? validScores.reduce((sum, l) => sum + l.evaluationScore!.toNumber(), 0) / validScores.length
        : 0,
      avgRentPrice: validRents.length > 0
        ? validRents.reduce((sum, l) => sum + l.rentPrice!.toNumber(), 0) / validRents.length
        : 0,
      avgFollowUpDays: 7, // 简化的平均跟进天数
      contractConversionRate: totalLocations > 0 
        ? ((statusDistribution.CONTRACTED || 0) / totalLocations) * 100
        : 0,
    };

    return {
      overview: {
        totalLocations,
        pendingCount: statusDistribution.PENDING || 0,
        followingCount: statusDistribution.FOLLOWING || 0,
        negotiatingCount: statusDistribution.NEGOTIATING || 0,
        contractedCount: statusDistribution.CONTRACTED || 0,
        rejectedCount: statusDistribution.REJECTED || 0,
      },
      statusDistribution,
      priorityDistribution,
      regionDistribution,
      trendData,
      performanceMetrics,
    };
  },

  /**
   * 获取跟进统计数据
   */
  async getFollowUpStatistics(query: StatisticsQuery): Promise<FollowUpStatistics> {
    const where: Prisma.FollowUpRecordWhereInput = {};
    
    if (query.dateRange) {
      where.createdAt = {
        gte: new Date(query.dateRange.start),
        lte: new Date(query.dateRange.end),
      };
    }

    const followUpRecords = await prisma.followUpRecord.findMany({
      where,
      select: {
        id: true,
        type: true,
        status: true,
        assigneeId: true,
        nextFollowUpDate: true,
        createdAt: true,
        assignee: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalRecords = followUpRecords.length;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 基础统计
    const overview = {
      totalRecords,
      pendingCount: followUpRecords.filter(r => r.status === 'PENDING').length,
      completedCount: followUpRecords.filter(r => r.status === 'COMPLETED').length,
      overdueCount: followUpRecords.filter(r => 
        r.status === 'PENDING' && r.nextFollowUpDate && r.nextFollowUpDate < now
      ).length,
      todayCount: followUpRecords.filter(r => 
        r.nextFollowUpDate && r.nextFollowUpDate >= today && 
        r.nextFollowUpDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      ).length,
      weekCount: followUpRecords.filter(r => 
        r.nextFollowUpDate && r.nextFollowUpDate >= now && r.nextFollowUpDate <= weekFromNow
      ).length,
    };

    // 类型分布
    const typeDistribution = followUpRecords.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 负责人分布
    const assigneeStats = followUpRecords.reduce((acc, record) => {
      const assigneeId = record.assigneeId;
      if (!acc[assigneeId]) {
        acc[assigneeId] = {
          assigneeId,
          assigneeName: record.assignee.name,
          totalCount: 0,
          completedCount: 0,
          pendingCount: 0,
        };
      }
      acc[assigneeId].totalCount++;
      if (record.status === 'COMPLETED') {
        acc[assigneeId].completedCount++;
      } else if (record.status === 'PENDING') {
        acc[assigneeId].pendingCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    const assigneeDistribution = Object.values(assigneeStats).map((assignee: any) => ({
      ...assignee,
      completionRate: assignee.totalCount > 0 
        ? (assignee.completedCount / assignee.totalCount) * 100 
        : 0,
    }));

    // 活动时间线（简化版）
    const activityTimeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayRecords = followUpRecords.filter(
        record => record.createdAt >= dayStart && record.createdAt < dayEnd
      );

      activityTimeline.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayRecords.length,
        completedCount: dayRecords.filter(r => r.status === 'COMPLETED').length,
      });
    }

    return {
      overview,
      typeDistribution,
      assigneeDistribution,
      activityTimeline,
    };
  },

  /**
   * 获取拓店进度数据
   */
  async getExpansionProgress(): Promise<ExpansionProgress> {
    const currentYear = new Date().getFullYear();

    // 开店计划进度
    const storePlans = await prisma.storePlan.findMany({
      where: { year: currentYear },
      include: {
        candidateLocations: {
          select: {
            id: true,
            status: true,
            evaluationScore: true,
          },
        },
      },
    });

    const storePlanProgress = storePlans.map(plan => {
      const totalLocations = plan.candidateLocations.length;
      const contractedLocations = plan.candidateLocations.filter(l => l.status === 'CONTRACTED').length;
      const followingLocations = plan.candidateLocations.filter(l => l.status === 'FOLLOWING').length;
      const avgScore = plan.candidateLocations.length > 0
        ? plan.candidateLocations
            .filter(l => l.evaluationScore !== null)
            .reduce((sum, l) => sum + l.evaluationScore!.toNumber(), 0) / 
          plan.candidateLocations.filter(l => l.evaluationScore !== null).length
        : 0;

      return {
        storePlanId: plan.id,
        storePlanTitle: plan.title,
        totalLocations,
        contractedLocations,
        followingLocations,
        completionRate: totalLocations > 0 ? (contractedLocations / totalLocations) * 100 : 0,
        avgEvaluationScore: avgScore || 0,
      };
    });

    // 地区进度
    const regionStats = await prisma.candidateLocation.groupBy({
      by: ['regionId'],
      _count: true,
      _avg: {
        evaluationScore: true,
      },
    });

    const regionProgress = await Promise.all(
      regionStats.map(async (stat) => {
        const region = await prisma.region.findUnique({
          where: { id: stat.regionId },
          select: { name: true },
        });

        const contractedCount = await prisma.candidateLocation.count({
          where: {
            regionId: stat.regionId,
            status: 'CONTRACTED',
          },
        });

        return {
          regionId: stat.regionId,
          regionName: region?.name || '未知地区',
          totalLocations: stat._count,
          contractedCount,
          completionRate: stat._count > 0 ? (contractedCount / stat._count) * 100 : 0,
          avgScore: stat._avg.evaluationScore?.toNumber() || 0,
        };
      })
    );

    // 即将到期的任务
    const upcomingTasks = await prisma.followUpRecord.findMany({
      where: {
        status: 'PENDING',
        nextFollowUpDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天内
        },
      },
      include: {
        candidateLocation: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        nextFollowUpDate: 'asc',
      },
      take: 20,
    });

    const upcomingTasksFormatted = upcomingTasks.map(task => ({
      type: 'followUp' as const,
      locationId: task.candidateLocation.id,
      locationName: task.candidateLocation.name,
      dueDate: task.nextFollowUpDate!.toISOString(),
      assigneeName: task.assignee.name,
      priority: task.importance,
    }));

    return {
      storePlanProgress,
      regionProgress,
      upcomingTasks: upcomingTasksFormatted,
    };
  },

  /**
   * 获取拓店仪表板数据
   */
  async getExpansionDashboard(): Promise<ExpansionDashboard> {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // KPI指标
    const [
      totalCandidates,
      thisMonthNew,
      contractedThisMonth,
      allLocations
    ] = await Promise.all([
      prisma.candidateLocation.count(),
      prisma.candidateLocation.count({
        where: { createdAt: { gte: thisMonth } }
      }),
      prisma.candidateLocation.count({
        where: { 
          status: 'CONTRACTED',
          updatedAt: { gte: thisMonth }
        }
      }),
      prisma.candidateLocation.findMany({
        select: {
          evaluationScore: true,
          rentPrice: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const validScores = allLocations.filter(l => l.evaluationScore !== null);
    const validRents = allLocations.filter(l => l.rentPrice !== null);
    const contractedCount = allLocations.filter(l => l.status === 'CONTRACTED').length;

    const kpis = {
      totalCandidates,
      thisMonthNew,
      contractedThisMonth,
      avgEvaluationScore: validScores.length > 0 
        ? validScores.reduce((sum, l) => sum + l.evaluationScore!.toNumber(), 0) / validScores.length
        : 0,
      avgRentPrice: validRents.length > 0
        ? validRents.reduce((sum, l) => sum + l.rentPrice!.toNumber(), 0) / validRents.length
        : 0,
      contractConversionRate: totalCandidates > 0 ? (contractedCount / totalCandidates) * 100 : 0,
    };

    // 图表数据（简化版）
    const charts = {
      statusTrend: [] as any[],  // 需要实际的时间序列数据
      regionDistribution: [] as any[], // 需要实际的地区分布数据
      priorityDistribution: [] as any[], // 需要实际的优先级分布数据
    };

    // 告警信息
    const alerts: any[] = [];

    // 过期的跟进任务
    const overdueCount = await prisma.followUpRecord.count({
      where: {
        status: 'PENDING',
        nextFollowUpDate: { lt: now },
      },
    });

    if (overdueCount > 0) {
      alerts.push({
        type: 'overdue',
        message: `有 ${overdueCount} 个跟进任务已逾期`,
        urgency: 'HIGH',
      });
    }

    // 高优先级未处理点位
    const highPriorityPending = await prisma.candidateLocation.count({
      where: {
        priority: 'URGENT',
        status: 'PENDING',
      },
    });

    if (highPriorityPending > 0) {
      alerts.push({
        type: 'highPriority',
        message: `有 ${highPriorityPending} 个紧急优先级点位待处理`,
        urgency: 'HIGH',
      });
    }

    return {
      kpis,
      charts,
      alerts,
    };
  },

  /**
   * 导出候选点位数据
   */
  async exportCandidateLocationData(exportData: ExportData): Promise<{ filename: string; contentType: string; buffer: Buffer }> {
    const { format, filters, columns, includeFollowUpRecords } = exportData;
    
    // 构建查询条件
    const where: Prisma.CandidateLocationWhereInput = {};
    
    if (filters?.storePlanId) where.storePlanId = filters.storePlanId;
    if (filters?.regionId) where.regionId = filters.regionId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    // 获取数据
    const candidateLocations = await prisma.candidateLocation.findMany({
      where,
      include: {
        region: { select: { name: true, code: true, fullPath: true } },
        storePlan: { select: { planCode: true, title: true } },
        followUpRecords: includeFollowUpRecords ? {
          select: {
            type: true,
            title: true,
            content: true,
            status: true,
            assignee: { select: { name: true } },
            createdAt: true,
          },
        } : false,
      },
      orderBy: [
        { discoveryDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // 转换数据格式
    const fullData = candidateLocations.map(location => ({
      点位编号: location.locationCode,
      点位名称: location.name,
      地址: location.address,
      详细地址: location.detailedAddress || '',
      所属地区: location.region.name,
      地区代码: location.region.code,
      关联计划: location.storePlan?.title || '',
      面积: location.area?.toString() || '',
      可用面积: location.usableArea?.toString() || '',
      租金: location.rentPrice?.toString() || '',
      租金单位: location.rentUnit || '',
      押金: location.depositAmount?.toString() || '',
      转让费: location.transferFee?.toString() || '',
      物业费: location.propertyFee?.toString() || '',
      房东姓名: location.landlordName || '',
      房东电话: location.landlordPhone || '',
      评估分数: location.evaluationScore?.toString() || '',
      状态: location.status,
      优先级: location.priority,
      发现日期: location.discoveryDate.toISOString().split('T')[0],
      预计签约: location.expectedSignDate?.toISOString().split('T')[0] || '',
      备注: location.notes || '',
      标签: Array.isArray(location.tags) ? location.tags.join(', ') : '',
      跟进记录数: includeFollowUpRecords ? location.followUpRecords?.length || 0 : '',
      创建时间: location.createdAt.toISOString().replace('T', ' ').replace('Z', ''),
      更新时间: location.updatedAt.toISOString().replace('T', ' ').replace('Z', ''),
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
    const filename = `候选点位_${timestamp}.${format}`;

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