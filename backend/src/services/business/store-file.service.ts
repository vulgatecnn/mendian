/**
 * 门店档案管理服务层
 * 提供完整的CRUD操作、状态管理、统计分析和数据导出功能
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@/utils/errors.js';
import { logger } from '@/utils/logger.js';
import { 
  CreateStoreFileData,
  UpdateStoreFileData,
  StoreFileQuery,
  StatusChangeData,
  BatchOperationData,
  StatisticsQuery,
  ExportData,
  StoreFileWithRelations,
  PaginatedResult,
  StoreFileStatistics,
  StoreFileProgress,
  StoreFileSummary,
  StoreFileStatusEnum,
  isValidStoreStatusTransition,
} from '@/types/storeFile.js';

const prisma = new PrismaClient();

// 生成门店编码的辅助函数
const generateStoreCode = async (storeType: string, entityCode?: string): Promise<string> => {
  // 获取当前日期
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // 门店类型前缀
  const typePrefix = {
    DIRECT: 'DR',
    FRANCHISE: 'FR',
    FLAGSHIP: 'FL',
    POPUP: 'PU'
  }[storeType] || 'ST';
  
  // 获取主体编码或使用默认
  const entityPrefix = entityCode?.substring(0, 2) || 'GE';
  
  // 获取当天该类型门店数量作为序号
  const startOfDay = new Date(year, now.getMonth(), now.getDate());
  const endOfDay = new Date(year, now.getMonth(), now.getDate() + 1);
  
  const count = await prisma.storeFile.count({
    where: {
      storeType: storeType as any,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(3, '0');
  
  return `${typePrefix}${entityPrefix}${year}${month}${sequence}`;
};

export const storeFileService = {
  /**
   * 获取门店档案列表
   */
  async getList(query: StoreFileQuery): Promise<PaginatedResult<StoreFileWithRelations>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    
    // 添加合理的查询限制
    const safeLimit = Math.min(Math.max(limit, 1), 100); // 限制每页最多100条
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    // 构建查询条件
    const where: Prisma.StoreFileWhereInput = {};
    
    if (filters.storeCode) where.storeCode = { contains: filters.storeCode, mode: 'insensitive' };
    if (filters.storeName) where.storeName = { contains: filters.storeName, mode: 'insensitive' };
    if (filters.storeType) where.storeType = filters.storeType;
    if (filters.status) where.status = filters.status;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.candidateLocationId) where.candidateLocationId = filters.candidateLocationId;
    if (filters.brandName) where.brandName = { contains: filters.brandName, mode: 'insensitive' };
    if (filters.address) where.address = { contains: filters.address, mode: 'insensitive' };

    // 日期范围筛选
    if (filters.openDateFrom || filters.openDateTo) {
      where.openDate = {};
      if (filters.openDateFrom) where.openDate.gte = new Date(filters.openDateFrom);
      if (filters.openDateTo) where.openDate.lte = new Date(filters.openDateTo);
    }
    
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      if (filters.createdFrom) where.createdAt.gte = new Date(filters.createdFrom);
      if (filters.createdTo) where.createdAt.lte = new Date(filters.createdTo);
    }

    // 数值范围筛选
    if (filters.areaMin !== undefined || filters.areaMax !== undefined) {
      where.area = {};
      if (filters.areaMin !== undefined) where.area.gte = filters.areaMin;
      if (filters.areaMax !== undefined) where.area.lte = filters.areaMax;
    }

    if (filters.revenueMin !== undefined || filters.revenueMax !== undefined) {
      where.monthlyRevenue = {};
      if (filters.revenueMin !== undefined) where.monthlyRevenue.gte = filters.revenueMin;
      if (filters.revenueMax !== undefined) where.monthlyRevenue.lte = filters.revenueMax;
    }

    if (filters.employeeMin !== undefined || filters.employeeMax !== undefined) {
      where.employeeCount = {};
      if (filters.employeeMin !== undefined) where.employeeCount.gte = filters.employeeMin;
      if (filters.employeeMax !== undefined) where.employeeCount.lte = filters.employeeMax;
    }

    // 关键字搜索
    if (filters.keyword) {
      where.OR = [
        { storeName: { contains: filters.keyword, mode: 'insensitive' } },
        { storeCode: { contains: filters.keyword, mode: 'insensitive' } },
        { brandName: { contains: filters.keyword, mode: 'insensitive' } },
        { address: { contains: filters.keyword, mode: 'insensitive' } },
      ];
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // 排序条件
    const orderBy: Prisma.StoreFileOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    try {
      const [items, total] = await Promise.all([
        prisma.storeFile.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy,
          include: {
            entity: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            candidateLocation: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true,
              },
            },
            // 对于列表页面，不加载详细的关联数据以提高性能
            // paymentItems 和 assets 只获取计数信息
            _count: {
              select: {
                paymentItems: true,
                assets: true,
              },
            },
          },
        }),
        prisma.storeFile.count({ where }),
      ]);

      const pages = Math.ceil(total / safeLimit);

      return {
        items: items as StoreFileWithRelations[],
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          pages,
          hasNext: safePage < pages,
          hasPrev: safePage > 1,
        },
      };
    } catch (error) {
      logger.error('Failed to get store file list:', error);
      throw error;
    }
  },

  /**
   * 根据ID获取门店档案详情
   */
  async getById(id: string): Promise<StoreFileWithRelations> {
    try {
      const storeFile = await prisma.storeFile.findUnique({
        where: { id },
        include: {
          entity: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              address: true,
              contactPhone: true,
            },
          },
          candidateLocation: {
            select: {
              id: true,
              name: true,
              address: true,
              detailedAddress: true,
              status: true,
              area: true,
              rent: true,
            },
          },
          paymentItems: {
            take: 20, // 限制返回数量
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              dueDate: true,
              createdAt: true,
            },
          },
          assets: {
            take: 20, // 限制返回数量  
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              category: true,
              currentValue: true,
              status: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              paymentItems: true,
              assets: true,
            },
          },
        },
      });

      if (!storeFile) {
        throw new NotFoundError('门店档案不存在');
      }

      return storeFile as StoreFileWithRelations;
    } catch (error) {
      logger.error(`Failed to get store file by id ${id}:`, error);
      throw error;
    }
  },

  /**
   * 创建门店档案
   */
  async create(data: CreateStoreFileData, creatorId: string): Promise<StoreFileWithRelations> {
    try {
      // 检查门店编码是否已存在
      const existingStore = await prisma.storeFile.findUnique({
        where: { storeCode: data.storeCode },
      });

      if (existingStore) {
        throw new ConflictError('门店编码已存在');
      }

      // 验证公司主体是否存在
      const entity = await prisma.companyEntity.findUnique({
        where: { id: data.entityId },
      });

      if (!entity) {
        throw new NotFoundError('公司主体不存在');
      }

      // 如果指定了候选点位，验证其是否存在且可用
      if (data.candidateLocationId) {
        const candidateLocation = await prisma.candidateLocation.findUnique({
          where: { id: data.candidateLocationId },
        });

        if (!candidateLocation) {
          throw new NotFoundError('候选点位不存在');
        }

        // 检查该点位是否已被使用
        const existingStoreFile = await prisma.storeFile.findFirst({
          where: { 
            candidateLocationId: data.candidateLocationId,
            status: { notIn: ['CLOSED'] }, // 除了已关闭的门店
          },
        });

        if (existingStoreFile) {
          throw new ConflictError('该候选点位已被使用');
        }
      }

      // 创建门店档案
      const storeFile = await prisma.storeFile.create({
        data: {
          ...data,
          // 如果没有提供门店编码，自动生成
          storeCode: data.storeCode || await generateStoreCode(data.storeType, entity.code),
        },
        include: {
          entity: true,
          candidateLocation: true,
          paymentItems: true,
          assets: true,
          _count: {
            select: {
              paymentItems: true,
              assets: true,
            },
          },
        },
      });

      logger.info(`Store file created: ${storeFile.id} (${storeFile.storeCode}) by user ${creatorId}`);

      return storeFile as StoreFileWithRelations;
    } catch (error) {
      logger.error('Failed to create store file:', error);
      throw error;
    }
  },

  /**
   * 更新门店档案
   */
  async update(
    id: string, 
    data: UpdateStoreFileData & { expectedUpdatedAt?: Date }, 
    updaterId: string
  ): Promise<StoreFileWithRelations> {
    try {
      // 检查门店档案是否存在
      const existingStore = await prisma.storeFile.findUnique({
        where: { id },
      });

      if (!existingStore) {
        throw new NotFoundError('门店档案不存在');
      }

      // 乐观锁检查：如果提供了expectedUpdatedAt，检查数据是否被其他用户修改
      if (data.expectedUpdatedAt) {
        const expectedTime = new Date(data.expectedUpdatedAt).getTime();
        const currentTime = existingStore.updatedAt.getTime();
        
        if (expectedTime !== currentTime) {
          throw new ConflictError('数据已被其他用户修改，请刷新后重试');
        }
      }

      // 如果更新公司主体，验证其是否存在
      if (data.entityId && data.entityId !== existingStore.entityId) {
        const entity = await prisma.companyEntity.findUnique({
          where: { id: data.entityId },
        });

        if (!entity) {
          throw new NotFoundError('公司主体不存在');
        }
      }

      // 如果更新候选点位，验证其是否存在且可用
      if (data.candidateLocationId && data.candidateLocationId !== existingStore.candidateLocationId) {
        const candidateLocation = await prisma.candidateLocation.findUnique({
          where: { id: data.candidateLocationId },
        });

        if (!candidateLocation) {
          throw new NotFoundError('候选点位不存在');
        }

        // 检查该点位是否已被其他门店使用
        const existingStoreFile = await prisma.storeFile.findFirst({
          where: { 
            candidateLocationId: data.candidateLocationId,
            id: { not: id }, // 排除当前门店
            status: { notIn: ['CLOSED'] },
          },
        });

        if (existingStoreFile) {
          throw new ConflictError('该候选点位已被其他门店使用');
        }
      }

      // 从更新数据中移除expectedUpdatedAt字段
      const { expectedUpdatedAt, ...updateData } = data;

      // 更新门店档案
      const updatedStore = await prisma.storeFile.update({
        where: { id },
        data: updateData,
        include: {
          entity: true,
          candidateLocation: true,
          paymentItems: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          assets: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              paymentItems: true,
              assets: true,
            },
          },
        },
      });

      logger.info(`Store file updated: ${id} by user ${updaterId}`);

      return updatedStore as StoreFileWithRelations;
    } catch (error) {
      logger.error(`Failed to update store file ${id}:`, error);
      throw error;
    }
  },

  /**
   * 删除门店档案
   */
  async delete(id: string, deleterId: string): Promise<void> {
    try {
      const storeFile = await prisma.storeFile.findUnique({
        where: { id },
        include: {
          paymentItems: true,
          assets: true,
        },
      });

      if (!storeFile) {
        throw new NotFoundError('门店档案不存在');
      }

      // 检查是否有关联的付款项或资产
      if (storeFile.paymentItems.length > 0 || storeFile.assets.length > 0) {
        throw new ForbiddenError('门店存在关联的付款项或资产，无法删除');
      }

      // 执行删除
      await prisma.storeFile.delete({
        where: { id },
      });

      logger.info(`Store file deleted: ${id} by user ${deleterId}`);
    } catch (error) {
      logger.error(`Failed to delete store file ${id}:`, error);
      throw error;
    }
  },

  /**
   * 更改门店状态
   */
  async changeStatus(
    id: string, 
    statusData: StatusChangeData & { expectedUpdatedAt?: Date }, 
    operatorId: string
  ): Promise<StoreFileWithRelations> {
    try {
      const storeFile = await this.getById(id);

      // 乐观锁检查
      if (statusData.expectedUpdatedAt) {
        const expectedTime = new Date(statusData.expectedUpdatedAt).getTime();
        const currentTime = storeFile.updatedAt.getTime();
        
        if (expectedTime !== currentTime) {
          throw new ConflictError('门店数据已被其他用户修改，请刷新后重试');
        }
      }

      // 验证状态转换是否有效
      if (!isValidStoreStatusTransition(storeFile.status, statusData.status)) {
        throw new BadRequestError(`无法从状态 ${storeFile.status} 转换到 ${statusData.status}`);
      }

      const updatedStore = await prisma.storeFile.update({
        where: { 
          id,
          // 添加updatedAt条件作为额外的并发保护
          updatedAt: statusData.expectedUpdatedAt || storeFile.updatedAt
        },
        data: {
          status: statusData.status,
          notes: statusData.notes ? 
            `${storeFile.notes || ''}\n[${new Date().toISOString()}] 状态变更: ${storeFile.status} -> ${statusData.status}. ${statusData.reason || ''}`.trim() :
            storeFile.notes,
        },
        include: {
          entity: true,
          candidateLocation: true,
          paymentItems: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          assets: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              paymentItems: true,
              assets: true,
            },
          },
        },
      });

      logger.info(`Store file status changed: ${id} from ${storeFile.status} to ${statusData.status} by user ${operatorId}`);

      return updatedStore as StoreFileWithRelations;
    } catch (error) {
      logger.error(`Failed to change store file status ${id}:`, error);
      throw error;
    }
  },

  /**
   * 批量操作
   */
  async batchOperation(
    operationData: BatchOperationData, 
    operatorId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const { action, ids, data } = operationData;
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (const id of ids) {
        try {
          switch (action) {
            case 'delete':
              await this.delete(id, operatorId);
              success++;
              break;
            
            case 'updateStatus':
              if (!data?.status) {
                throw new BadRequestError('状态数据缺失');
              }
              await this.changeStatus(id, data as StatusChangeData, operatorId);
              success++;
              break;
            
            case 'updateTags':
              if (!data?.tags) {
                throw new BadRequestError('标签数据缺失');
              }
              await prisma.storeFile.update({
                where: { id },
                data: { tags: data.tags as string[] },
              });
              success++;
              break;
            
            default:
              throw new BadRequestError(`不支持的操作: ${action}`);
          }
        } catch (error) {
          failed++;
          errors.push(`门店 ${id}: ${error instanceof Error ? error.message : '操作失败'}`);
          logger.warn(`Batch operation failed for store ${id}:`, error);
        }
      }

      logger.info(`Batch operation ${action} completed by user ${operatorId}: ${success} success, ${failed} failed`);

      return { success, failed, errors };
    } catch (error) {
      logger.error('Batch operation failed:', error);
      throw error;
    }
  },

  /**
   * 获取统计数据
   */
  async getStatistics(query: StatisticsQuery): Promise<StoreFileStatistics> {
    try {
      // 基础筛选条件
      const where: Prisma.StoreFileWhereInput = {};
      
      if (query.storeType) where.storeType = query.storeType;
      if (query.entityId) where.entityId = query.entityId;
      if (query.status) where.status = query.status;

      // 日期筛选
      if (query.year || query.month || query.quarter) {
        where.openDate = {};
        
        if (query.year) {
          const startOfYear = new Date(query.year, 0, 1);
          const endOfYear = new Date(query.year + 1, 0, 1);
          where.openDate.gte = startOfYear;
          where.openDate.lt = endOfYear;
        }
        
        if (query.month && query.year) {
          const startOfMonth = new Date(query.year, query.month - 1, 1);
          const endOfMonth = new Date(query.year, query.month, 1);
          where.openDate.gte = startOfMonth;
          where.openDate.lt = endOfMonth;
        }
        
        if (query.quarter && query.year) {
          const startMonth = (query.quarter - 1) * 3;
          const startOfQuarter = new Date(query.year, startMonth, 1);
          const endOfQuarter = new Date(query.year, startMonth + 3, 1);
          where.openDate.gte = startOfQuarter;
          where.openDate.lt = endOfQuarter;
        }
      }

      // 获取基础统计
      const [
        totalStores,
        statusStats,
        typeStats,
        entityStats,
        revenueData,
        areaData,
      ] = await Promise.all([
        // 总门店数
        prisma.storeFile.count({ where }),
        
        // 按状态统计
        prisma.storeFile.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        
        // 按门店类型统计
        prisma.storeFile.groupBy({
          by: ['storeType'],
          where,
          _count: true,
        }),
        
        // 按主体统计
        prisma.storeFile.groupBy({
          by: ['entityId'],
          where,
          _count: true,
          include: {
            entity: {
              select: { name: true }
            }
          }
        }),
        
        // 收入统计数据
        prisma.storeFile.aggregate({
          where: {
            ...where,
            monthlyRevenue: { not: null },
          },
          _sum: { monthlyRevenue: true },
          _avg: { monthlyRevenue: true },
          _max: { monthlyRevenue: true },
          _min: { monthlyRevenue: true },
        }),
        
        // 面积统计数据
        prisma.storeFile.aggregate({
          where: {
            ...where,
            area: { not: null },
          },
          _sum: { area: true },
          _avg: { area: true },
          _max: { area: true },
          _min: { area: true },
        }),
      ]);

      // 月度增长数据（最近12个月）
      const monthlyGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const [openings, closures] = await Promise.all([
          prisma.storeFile.count({
            where: {
              ...where,
              openDate: {
                gte: startOfMonth,
                lt: endOfMonth,
              },
            },
          }),
          prisma.storeFile.count({
            where: {
              ...where,
              status: 'CLOSED',
              updatedAt: {
                gte: startOfMonth,
                lt: endOfMonth,
              },
            },
          }),
        ]);

        monthlyGrowth.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          openings,
          closures,
          netGrowth: openings - closures,
        });
      }

      // 组织返回数据
      const byStatus = statusStats.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<StoreFileStatusEnum, number>);

      const byStoreType = typeStats.reduce((acc, item) => {
        acc[item.storeType] = item._count;
        return acc;
      }, {} as any);

      const byEntity = await Promise.all(
        entityStats.map(async (item) => {
          const entity = await prisma.companyEntity.findUnique({
            where: { id: item.entityId },
            select: { name: true },
          });
          return {
            entityId: item.entityId,
            entityName: entity?.name || '未知主体',
            count: item._count,
          };
        })
      );

      return {
        totalStores,
        byStatus,
        byStoreType,
        byEntity,
        monthlyGrowth,
        revenueStats: {
          totalRevenue: Number(revenueData._sum.monthlyRevenue || 0),
          averageRevenue: Number(revenueData._avg.monthlyRevenue || 0),
          highestRevenue: Number(revenueData._max.monthlyRevenue || 0),
          lowestRevenue: Number(revenueData._min.monthlyRevenue || 0),
        },
        areaStats: {
          totalArea: Number(areaData._sum.area || 0),
          averageArea: Number(areaData._avg.area || 0),
          largestStore: Number(areaData._max.area || 0),
          smallestStore: Number(areaData._min.area || 0),
        },
      };
    } catch (error) {
      logger.error('Failed to get store file statistics:', error);
      throw error;
    }
  },

  /**
   * 获取门店档案汇总信息
   */
  async getSummary(): Promise<StoreFileSummary> {
    try {
      const [overview, performance, distribution, trends] = await Promise.all([
        // 概况数据
        this.getOverviewData(),
        // 性能数据
        this.getPerformanceData(),
        // 分布数据
        this.getDistributionData(),
        // 趋势数据
        this.getTrendsData(),
      ]);

      return {
        overview,
        performance,
        distribution,
        trends,
      };
    } catch (error) {
      logger.error('Failed to get store file summary:', error);
      throw error;
    }
  },

  /**
   * 获取进度数据
   */
  async getProgress(): Promise<StoreFileProgress> {
    try {
      const [preparingStores, recentOpenings, upcomingMilestones] = await Promise.all([
        // 筹备中的门店
        this.getPreparingStores(),
        // 最近开业的门店
        this.getRecentOpenings(),
        // 即将到来的里程碑
        this.getUpcomingMilestones(),
      ]);

      return {
        preparingStores,
        recentOpenings,
        upcomingMilestones,
      };
    } catch (error) {
      logger.error('Failed to get store file progress:', error);
      throw error;
    }
  },

  // 私有辅助方法
  private async getOverviewData() {
    const statusCounts = await prisma.storeFile.groupBy({
      by: ['status'],
      _count: true,
    });

    const total = statusCounts.reduce((sum, item) => sum + item._count, 0);
    
    return statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase() as keyof typeof acc] = item._count;
      return acc;
    }, {
      total,
      open: 0,
      preparing: 0,
      closed: 0,
      renovating: 0,
      suspended: 0,
    });
  },

  private async getPerformanceData() {
    const aggregates = await prisma.storeFile.aggregate({
      _sum: {
        monthlyRevenue: true,
        area: true,
        employeeCount: true,
      },
      _avg: {
        monthlyRevenue: true,
        area: true,
        employeeCount: true,
      },
      _count: true,
    });

    return {
      totalRevenue: Number(aggregates._sum.monthlyRevenue || 0),
      averageRevenue: Number(aggregates._avg.monthlyRevenue || 0),
      totalArea: Number(aggregates._sum.area || 0),
      averageArea: Number(aggregates._avg.area || 0),
      totalEmployees: Number(aggregates._sum.employeeCount || 0),
      averageEmployees: Number(aggregates._avg.employeeCount || 0),
    };
  },

  private async getDistributionData() {
    const [byType, byStatus] = await Promise.all([
      prisma.storeFile.groupBy({
        by: ['storeType'],
        _count: true,
      }),
      prisma.storeFile.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      byType: byType.reduce((acc, item) => {
        acc[item.storeType] = item._count;
        return acc;
      }, {} as any),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as any),
    };
  },

  private async getTrendsData() {
    // 最近12个月的开店趋势
    const monthlyOpenings = [];
    const revenueGrowth = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const [openings, revenue] = await Promise.all([
        prisma.storeFile.count({
          where: {
            openDate: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
          },
        }),
        prisma.storeFile.aggregate({
          where: {
            openDate: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
            monthlyRevenue: { not: null },
          },
          _sum: { monthlyRevenue: true },
        }),
      ]);

      monthlyOpenings.push({
        month: monthStr,
        count: openings,
      });

      revenueGrowth.push({
        month: monthStr,
        revenue: Number(revenue._sum.monthlyRevenue || 0),
      });
    }

    return {
      monthlyOpenings,
      revenueGrowth,
    };
  },

  private async getPreparingStores() {
    const stores = await prisma.storeFile.findMany({
      where: { status: 'PREPARING' },
      select: {
        id: true,
        storeName: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    return stores.map(store => ({
      id: store.id,
      storeName: store.storeName,
      status: store.status,
      daysInPreparation: Math.floor((Date.now() - store.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      completionPercentage: Math.floor(Math.random() * 100), // TODO: 实际计算完成百分比
      nextMilestone: '装修验收', // TODO: 实际获取下一个里程碑
    }));
  },

  private async getRecentOpenings() {
    const stores = await prisma.storeFile.findMany({
      where: { 
        status: 'OPEN',
        openDate: { not: null },
      },
      select: {
        id: true,
        storeName: true,
        openDate: true,
        storeType: true,
        monthlyRevenue: true,
      },
      orderBy: { openDate: 'desc' },
      take: 10,
    });

    return stores.map(store => ({
      id: store.id,
      storeName: store.storeName,
      openDate: store.openDate!,
      storeType: store.storeType,
      monthlyRevenue: store.monthlyRevenue ? Number(store.monthlyRevenue) : null,
    }));
  },

  private async getUpcomingMilestones() {
    // TODO: 实现里程碑逻辑，这里返回模拟数据
    return [];
  },

  /**
   * 导出数据
   */
  async exportData(exportData: ExportData): Promise<{
    filename: string;
    contentType: string;
    buffer: Buffer;
  }> {
    try {
      // 根据筛选条件获取数据
      const query = exportData.filters || { page: 1, limit: 10000 };
      const { items } = await this.getList(query);

      // TODO: 实现Excel/CSV导出逻辑
      // 这里简化返回JSON格式
      const jsonData = JSON.stringify(items, null, 2);
      const buffer = Buffer.from(jsonData, 'utf8');

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `store-files-${timestamp}.json`;

      return {
        filename,
        contentType: 'application/json',
        buffer,
      };
    } catch (error) {
      logger.error('Failed to export store files:', error);
      throw error;
    }
  },
};