/**
 * 拓店管理服务单元测试
 * 测试候选点位和跟进记录的业务逻辑
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { expansionService } from '@/services/business/expansion.service.js';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@/utils/errors.js';
import expansionFixtures from '../fixtures/expansion.fixture.js';

// Mock Prisma Client
const mockPrisma = {
  candidateLocation: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  followUpRecord: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  region: {
    findUnique: vi.fn(),
  },
  storePlan: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

// Mock Prisma Client constructor
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    Decimal: class MockDecimal {
      constructor(public value: number) {}
      toNumber() { return this.value; }
      toString() { return this.value.toString(); }
    }
  }
}));

describe('ExpansionService', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('候选点位管理', () => {
    describe('getCandidateLocationList', () => {
      it('应该返回候选点位列表', async () => {
        // Arrange
        const mockQuery = {
          page: 1,
          limit: 20,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
        };

        const mockItems = expansionFixtures.mockCandidateLocationList;
        const mockTotal = mockItems.length;

        mockPrisma.candidateLocation.findMany.mockResolvedValue(mockItems);
        mockPrisma.candidateLocation.count.mockResolvedValue(mockTotal);

        // Act
        const result = await expansionService.getCandidateLocationList(mockQuery);

        // Assert
        expect(result).toEqual({
          items: mockItems,
          pagination: {
            page: 1,
            limit: 20,
            total: mockTotal,
            totalPages: Math.ceil(mockTotal / 20),
            hasNext: false,
            hasPrev: false,
          },
        });

        expect(mockPrisma.candidateLocation.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 20,
          include: expect.objectContaining({
            region: expect.any(Object),
            storePlan: expect.any(Object),
            _count: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
        });

        expect(mockPrisma.candidateLocation.count).toHaveBeenCalledWith({ where: {} });
      });

      it('应该支持筛选条件', async () => {
        // Arrange
        const mockQuery = {
          page: 1,
          limit: 20,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
          regionId: 'region-test-001',
          status: 'FOLLOWING' as const,
          priority: 'HIGH' as const,
          minRent: 20000,
          maxRent: 30000,
          keyword: '中关村',
        };

        mockPrisma.candidateLocation.findMany.mockResolvedValue([]);
        mockPrisma.candidateLocation.count.mockResolvedValue(0);

        // Act
        await expansionService.getCandidateLocationList(mockQuery);

        // Assert
        expect(mockPrisma.candidateLocation.findMany).toHaveBeenCalledWith({
          where: {
            regionId: 'region-test-001',
            status: 'FOLLOWING',
            priority: 'HIGH',
            rentPrice: {
              gte: expect.any(Object), // Prisma.Decimal
              lte: expect.any(Object), // Prisma.Decimal
            },
            OR: [
              { name: { contains: '中关村', mode: 'insensitive' } },
              { address: { contains: '中关村', mode: 'insensitive' } },
              { detailedAddress: { contains: '中关村', mode: 'insensitive' } },
            ],
          },
          skip: 0,
          take: 20,
          include: expect.any(Object),
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('getCandidateLocationById', () => {
      it('应该返回候选点位详情', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockLocation = expansionFixtures.mockCandidateLocationWithRelations;

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockLocation);

        // Act
        const result = await expansionService.getCandidateLocationById(mockId);

        // Assert
        expect(result).toEqual(mockLocation);
        expect(mockPrisma.candidateLocation.findUnique).toHaveBeenCalledWith({
          where: { id: mockId },
          include: expect.objectContaining({
            region: expect.any(Object),
            storePlan: expect.any(Object),
            followUpRecords: expect.any(Object),
          }),
        });
      });

      it('当候选点位不存在时应该抛出NotFoundError', async () => {
        // Arrange
        const mockId = 'non-existent-id';
        mockPrisma.candidateLocation.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(expansionService.getCandidateLocationById(mockId))
          .rejects
          .toThrow(NotFoundError);

        expect(mockPrisma.candidateLocation.findUnique).toHaveBeenCalledWith({
          where: { id: mockId },
          include: expect.any(Object),
        });
      });
    });

    describe('createCandidateLocation', () => {
      it('应该成功创建候选点位', async () => {
        // Arrange
        const mockData = {
          regionId: 'region-test-001',
          name: '测试点位',
          address: '测试地址123号',
          area: 150,
          rentPrice: 20000,
          priority: 'MEDIUM' as const,
        };

        const mockOperatorId = 'user-test-001';
        const mockRegion = { ...expansionFixtures.mockRegion, isActive: true };
        const mockCreatedLocation = expansionFixtures.mockCandidateLocation;

        mockPrisma.region.findUnique.mockResolvedValue(mockRegion);
        mockPrisma.candidateLocation.findFirst.mockResolvedValue(null); // 没有重复地址
        mockPrisma.candidateLocation.create.mockResolvedValue(mockCreatedLocation);
        mockPrisma.followUpRecord.create.mockResolvedValue({}); // 自动创建的跟进记录

        // Act
        const result = await expansionService.createCandidateLocation(mockData, mockOperatorId);

        // Assert
        expect(result).toEqual(mockCreatedLocation);

        // 验证区域存在性检查
        expect(mockPrisma.region.findUnique).toHaveBeenCalledWith({
          where: { id: mockData.regionId },
          select: { id: true, code: true, name: true, isActive: true },
        });

        // 验证地址重复检查
        expect(mockPrisma.candidateLocation.findFirst).toHaveBeenCalledWith({
          where: {
            address: mockData.address,
            status: { not: 'REJECTED' },
          },
        });

        // 验证创建候选点位
        expect(mockPrisma.candidateLocation.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            regionId: mockData.regionId,
            name: mockData.name,
            address: mockData.address,
            area: expect.any(Object), // Prisma.Decimal
            rentPrice: expect.any(Object), // Prisma.Decimal
            priority: mockData.priority,
            status: 'PENDING',
            locationCode: expect.stringMatching(/^CL.*-\d+-\d+$/),
          }),
          include: expect.any(Object),
        });

        // 验证自动创建跟进记录
        expect(mockPrisma.followUpRecord.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            candidateLocationId: expect.any(String),
            assigneeId: mockOperatorId,
            createdById: mockOperatorId,
            type: 'SITE_VISIT',
            title: '初步实地考察',
            status: 'PENDING',
          }),
        });
      });

      it('当指定区域不存在时应该抛出BadRequestError', async () => {
        // Arrange
        const mockData = {
          regionId: 'non-existent-region',
          name: '测试点位',
          address: '测试地址123号',
        };
        const mockOperatorId = 'user-test-001';

        mockPrisma.region.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(expansionService.createCandidateLocation(mockData, mockOperatorId))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.region.findUnique).toHaveBeenCalled();
        expect(mockPrisma.candidateLocation.create).not.toHaveBeenCalled();
      });

      it('当地址已存在时应该抛出ConflictError', async () => {
        // Arrange
        const mockData = {
          regionId: 'region-test-001',
          name: '测试点位',
          address: '已存在的地址',
        };
        const mockOperatorId = 'user-test-001';
        const mockRegion = { ...expansionFixtures.mockRegion, isActive: true };
        const existingLocation = { id: 'existing-location-001' };

        mockPrisma.region.findUnique.mockResolvedValue(mockRegion);
        mockPrisma.candidateLocation.findFirst.mockResolvedValue(existingLocation);

        // Act & Assert
        await expect(expansionService.createCandidateLocation(mockData, mockOperatorId))
          .rejects
          .toThrow(ConflictError);

        expect(mockPrisma.candidateLocation.findFirst).toHaveBeenCalled();
        expect(mockPrisma.candidateLocation.create).not.toHaveBeenCalled();
      });
    });

    describe('updateCandidateLocation', () => {
      it('应该成功更新候选点位', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockData = {
          name: '更新后的点位名称',
          rentPrice: 22000,
          notes: '更新备注',
        };
        const mockOperatorId = 'user-test-001';
        const mockExistingLocation = expansionFixtures.mockCandidateLocation;
        const mockUpdatedLocation = { ...mockExistingLocation, ...mockData };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockExistingLocation);
        mockPrisma.candidateLocation.update.mockResolvedValue(mockUpdatedLocation);

        // Act
        const result = await expansionService.updateCandidateLocation(mockId, mockData, mockOperatorId);

        // Assert
        expect(result).toEqual(mockUpdatedLocation);

        expect(mockPrisma.candidateLocation.findUnique).toHaveBeenCalledWith({
          where: { id: mockId },
          include: { region: true },
        });

        expect(mockPrisma.candidateLocation.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            name: mockData.name,
            rentPrice: expect.any(Object), // Prisma.Decimal
            notes: mockData.notes,
          }),
          include: expect.any(Object),
        });
      });

      it('当点位不存在时应该抛出NotFoundError', async () => {
        // Arrange
        const mockId = 'non-existent-id';
        const mockData = { name: '更新名称' };
        const mockOperatorId = 'user-test-001';

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(expansionService.updateCandidateLocation(mockId, mockData, mockOperatorId))
          .rejects
          .toThrow(NotFoundError);

        expect(mockPrisma.candidateLocation.update).not.toHaveBeenCalled();
      });

      it('当点位已签约时应该抛出ForbiddenError', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockData = { name: '更新名称' };
        const mockOperatorId = 'user-test-001';
        const mockContractedLocation = { ...expansionFixtures.mockCandidateLocation, status: 'CONTRACTED' };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockContractedLocation);

        // Act & Assert
        await expect(expansionService.updateCandidateLocation(mockId, mockData, mockOperatorId))
          .rejects
          .toThrow(ForbiddenError);

        expect(mockPrisma.candidateLocation.update).not.toHaveBeenCalled();
      });
    });

    describe('deleteCandidateLocation', () => {
      it('应该成功删除候选点位（软删除）', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockOperatorId = 'user-test-001';
        const mockExistingLocation = {
          ...expansionFixtures.mockCandidateLocation,
          status: 'PENDING',
          followUpRecords: [],
        };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockExistingLocation);
        mockPrisma.candidateLocation.update.mockResolvedValue({});

        // Act
        await expansionService.deleteCandidateLocation(mockId, mockOperatorId);

        // Assert
        expect(mockPrisma.candidateLocation.findUnique).toHaveBeenCalledWith({
          where: { id: mockId },
          include: {
            followUpRecords: {
              select: { id: true, status: true },
            },
          },
        });

        expect(mockPrisma.candidateLocation.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: {
            status: 'REJECTED',
            notes: expect.stringContaining('由用户删除'),
          },
        });
      });

      it('当点位已签约时应该抛出ForbiddenError', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockOperatorId = 'user-test-001';
        const mockContractedLocation = {
          ...expansionFixtures.mockCandidateLocation,
          status: 'CONTRACTED',
          followUpRecords: [],
        };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockContractedLocation);

        // Act & Assert
        await expect(expansionService.deleteCandidateLocation(mockId, mockOperatorId))
          .rejects
          .toThrow(ForbiddenError);

        expect(mockPrisma.candidateLocation.update).not.toHaveBeenCalled();
      });

      it('当有进行中的跟进记录时应该抛出BadRequestError', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockOperatorId = 'user-test-001';
        const mockLocationWithActiveFollowUps = {
          ...expansionFixtures.mockCandidateLocation,
          status: 'FOLLOWING',
          followUpRecords: [
            { id: 'follow-up-001', status: 'PENDING' },
            { id: 'follow-up-002', status: 'IN_PROGRESS' },
          ],
        };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockLocationWithActiveFollowUps);

        // Act & Assert
        await expect(expansionService.deleteCandidateLocation(mockId, mockOperatorId))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.candidateLocation.update).not.toHaveBeenCalled();
      });
    });

    describe('changeCandidateLocationStatus', () => {
      it('应该成功变更候选点位状态', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockStatusData = {
          status: 'FOLLOWING' as const,
          reason: '开始跟进',
          comments: '重点关注项目',
        };
        const mockOperatorId = 'user-test-001';
        const mockExistingLocation = {
          ...expansionFixtures.mockCandidateLocation,
          status: 'PENDING',
        };
        const mockUpdatedLocation = {
          ...mockExistingLocation,
          status: 'FOLLOWING',
        };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockExistingLocation);
        mockPrisma.candidateLocation.update.mockResolvedValue(mockUpdatedLocation);
        mockPrisma.followUpRecord.create.mockResolvedValue({}); // 自动创建的跟进任务

        // Act
        const result = await expansionService.changeCandidateLocationStatus(mockId, mockStatusData, mockOperatorId);

        // Assert
        expect(result).toEqual(mockUpdatedLocation);

        expect(mockPrisma.candidateLocation.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: {
            status: 'FOLLOWING',
            notes: expect.stringContaining('开始跟进候选点位'),
          },
          include: expect.any(Object),
        });

        // 验证自动创建跟进任务
        expect(mockPrisma.followUpRecord.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            candidateLocationId: mockId,
            type: 'SITE_VISIT',
            title: '详细实地考察',
          }),
        });
      });

      it('当状态转换不合法时应该抛出BadRequestError', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockStatusData = {
          status: 'CONTRACTED' as const, // 从PENDING直接到CONTRACTED是不合法的
        };
        const mockOperatorId = 'user-test-001';
        const mockExistingLocation = {
          ...expansionFixtures.mockCandidateLocation,
          status: 'PENDING',
        };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockExistingLocation);

        // Act & Assert
        await expect(expansionService.changeCandidateLocationStatus(mockId, mockStatusData, mockOperatorId))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.candidateLocation.update).not.toHaveBeenCalled();
      });

      it('当点位签约时应该更新开店计划完成数量', async () => {
        // Arrange
        const mockId = 'candidate-location-001';
        const mockStatusData = {
          status: 'CONTRACTED' as const,
        };
        const mockOperatorId = 'user-test-001';
        const mockExistingLocation = {
          ...expansionFixtures.mockCandidateLocation,
          status: 'NEGOTIATING',
          storePlanId: 'store-plan-001',
        };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockExistingLocation);
        mockPrisma.candidateLocation.update.mockResolvedValue(mockExistingLocation);
        mockPrisma.storePlan.update.mockResolvedValue({});

        // Act
        await expansionService.changeCandidateLocationStatus(mockId, mockStatusData, mockOperatorId);

        // Assert
        expect(mockPrisma.storePlan.update).toHaveBeenCalledWith({
          where: { id: 'store-plan-001' },
          data: {
            completedCount: {
              increment: 1,
            },
          },
        });
      });
    });
  });

  describe('跟进记录管理', () => {
    describe('getFollowUpRecordList', () => {
      it('应该返回跟进记录列表', async () => {
        // Arrange
        const mockQuery = {
          page: 1,
          limit: 20,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
          candidateLocationId: 'candidate-location-001',
        };

        const mockItems = expansionFixtures.mockFollowUpRecordList;
        const mockTotal = mockItems.length;

        mockPrisma.followUpRecord.findMany.mockResolvedValue(mockItems);
        mockPrisma.followUpRecord.count.mockResolvedValue(mockTotal);

        // Act
        const result = await expansionService.getFollowUpRecordList(mockQuery);

        // Assert
        expect(result).toEqual({
          items: mockItems,
          pagination: {
            page: 1,
            limit: 20,
            total: mockTotal,
            totalPages: Math.ceil(mockTotal / 20),
            hasNext: false,
            hasPrev: false,
          },
        });

        expect(mockPrisma.followUpRecord.findMany).toHaveBeenCalledWith({
          where: {
            candidateLocationId: 'candidate-location-001',
          },
          skip: 0,
          take: 20,
          include: expect.objectContaining({
            candidateLocation: expect.any(Object),
            assignee: expect.any(Object),
            createdBy: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('createFollowUpRecord', () => {
      it('应该成功创建跟进记录', async () => {
        // Arrange
        const mockData = {
          candidateLocationId: 'candidate-location-001',
          assigneeId: 'user-test-001',
          type: 'SITE_VISIT' as const,
          title: '实地考察',
          content: '前往现场查看情况',
          importance: 'HIGH' as const,
        };
        const mockCreatedById = 'user-test-001';
        const mockCandidateLocation = { id: 'candidate-location-001', status: 'FOLLOWING' };
        const mockAssignee = { id: 'user-test-001', status: 'ACTIVE' };
        const mockCreatedRecord = expansionFixtures.mockFollowUpRecord;

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockCandidateLocation);
        mockPrisma.user.findUnique.mockResolvedValue(mockAssignee);
        mockPrisma.followUpRecord.create.mockResolvedValue(mockCreatedRecord);

        // Act
        const result = await expansionService.createFollowUpRecord(mockData, mockCreatedById);

        // Assert
        expect(result).toEqual(mockCreatedRecord);

        expect(mockPrisma.candidateLocation.findUnique).toHaveBeenCalledWith({
          where: { id: mockData.candidateLocationId },
          select: { id: true, status: true },
        });

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: mockData.assigneeId },
          select: { id: true, status: true },
        });

        expect(mockPrisma.followUpRecord.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            candidateLocationId: mockData.candidateLocationId,
            assigneeId: mockData.assigneeId,
            createdById: mockCreatedById,
            type: mockData.type,
            title: mockData.title,
            content: mockData.content,
            importance: mockData.importance,
            status: 'PENDING',
          }),
          include: expect.any(Object),
        });
      });

      it('当候选点位不存在时应该抛出BadRequestError', async () => {
        // Arrange
        const mockData = {
          candidateLocationId: 'non-existent-location',
          assigneeId: 'user-test-001',
          type: 'SITE_VISIT' as const,
          title: '实地考察',
          content: '前往现场查看情况',
        };
        const mockCreatedById = 'user-test-001';

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(expansionService.createFollowUpRecord(mockData, mockCreatedById))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.followUpRecord.create).not.toHaveBeenCalled();
      });

      it('当候选点位已签约时应该抛出BadRequestError', async () => {
        // Arrange
        const mockData = {
          candidateLocationId: 'candidate-location-001',
          assigneeId: 'user-test-001',
          type: 'SITE_VISIT' as const,
          title: '实地考察',
          content: '前往现场查看情况',
        };
        const mockCreatedById = 'user-test-001';
        const mockContractedLocation = { id: 'candidate-location-001', status: 'CONTRACTED' };

        mockPrisma.candidateLocation.findUnique.mockResolvedValue(mockContractedLocation);

        // Act & Assert
        await expect(expansionService.createFollowUpRecord(mockData, mockCreatedById))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.followUpRecord.create).not.toHaveBeenCalled();
      });
    });

    describe('updateFollowUpRecord', () => {
      it('应该成功更新跟进记录', async () => {
        // Arrange
        const mockId = 'follow-up-001';
        const mockData = {
          result: '跟进完成，效果良好',
          status: 'COMPLETED' as const,
          duration: 90,
        };
        const mockOperatorId = 'user-test-001';
        const mockExistingRecord = {
          ...expansionFixtures.mockFollowUpRecord,
          status: 'PENDING',
        };
        const mockUpdatedRecord = {
          ...mockExistingRecord,
          ...mockData,
        };

        mockPrisma.followUpRecord.findUnique.mockResolvedValue(mockExistingRecord);
        mockPrisma.followUpRecord.update.mockResolvedValue(mockUpdatedRecord);

        // Act
        const result = await expansionService.updateFollowUpRecord(mockId, mockData, mockOperatorId);

        // Assert
        expect(result).toEqual(mockUpdatedRecord);

        expect(mockPrisma.followUpRecord.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            result: mockData.result,
            status: mockData.status,
            duration: mockData.duration,
          }),
          include: expect.any(Object),
        });
      });

      it('当跟进记录不存在时应该抛出NotFoundError', async () => {
        // Arrange
        const mockId = 'non-existent-record';
        const mockData = { result: '更新结果' };
        const mockOperatorId = 'user-test-001';

        mockPrisma.followUpRecord.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(expansionService.updateFollowUpRecord(mockId, mockData, mockOperatorId))
          .rejects
          .toThrow(NotFoundError);

        expect(mockPrisma.followUpRecord.update).not.toHaveBeenCalled();
      });

      it('当跟进记录已完成且不更改状态时应该抛出ForbiddenError', async () => {
        // Arrange
        const mockId = 'follow-up-001';
        const mockData = { result: '尝试修改已完成的记录' }; // 没有status字段
        const mockOperatorId = 'user-test-001';
        const mockCompletedRecord = {
          ...expansionFixtures.mockFollowUpRecord,
          status: 'COMPLETED',
        };

        mockPrisma.followUpRecord.findUnique.mockResolvedValue(mockCompletedRecord);

        // Act & Assert
        await expect(expansionService.updateFollowUpRecord(mockId, mockData, mockOperatorId))
          .rejects
          .toThrow(ForbiddenError);

        expect(mockPrisma.followUpRecord.update).not.toHaveBeenCalled();
      });
    });

    describe('deleteFollowUpRecord', () => {
      it('应该成功删除跟进记录', async () => {
        // Arrange
        const mockId = 'follow-up-001';
        const mockOperatorId = 'user-test-001';
        const mockPendingRecord = {
          ...expansionFixtures.mockFollowUpRecord,
          status: 'PENDING',
        };

        mockPrisma.followUpRecord.findUnique.mockResolvedValue(mockPendingRecord);
        mockPrisma.followUpRecord.delete.mockResolvedValue({});

        // Act
        await expansionService.deleteFollowUpRecord(mockId, mockOperatorId);

        // Assert
        expect(mockPrisma.followUpRecord.delete).toHaveBeenCalledWith({
          where: { id: mockId },
        });
      });

      it('当跟进记录已完成时应该抛出ForbiddenError', async () => {
        // Arrange
        const mockId = 'follow-up-001';
        const mockOperatorId = 'user-test-001';
        const mockCompletedRecord = {
          ...expansionFixtures.mockFollowUpRecord,
          status: 'COMPLETED',
        };

        mockPrisma.followUpRecord.findUnique.mockResolvedValue(mockCompletedRecord);

        // Act & Assert
        await expect(expansionService.deleteFollowUpRecord(mockId, mockOperatorId))
          .rejects
          .toThrow(ForbiddenError);

        expect(mockPrisma.followUpRecord.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('统计分析', () => {
    describe('getExpansionStatistics', () => {
      it('应该返回拓店统计数据', async () => {
        // Arrange
        const mockQuery = {
          regionIds: ['region-test-001'],
          dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z',
          },
        };

        const mockLocations = expansionFixtures.mockCandidateLocationList;
        const mockRegionStats = [
          {
            regionId: 'region-test-001',
            _count: 5,
            _avg: { evaluationScore: { toNumber: () => 7.5 }, rentPrice: { toNumber: () => 22000 } },
          },
        ];

        mockPrisma.candidateLocation.findMany.mockResolvedValue(mockLocations);
        mockPrisma.candidateLocation.groupBy.mockResolvedValue(mockRegionStats);
        mockPrisma.region.findUnique.mockResolvedValue(expansionFixtures.mockRegion);

        // Act
        const result = await expansionService.getExpansionStatistics(mockQuery);

        // Assert
        expect(result).toEqual(
          expect.objectContaining({
            overview: expect.objectContaining({
              totalLocations: expect.any(Number),
              pendingCount: expect.any(Number),
              followingCount: expect.any(Number),
              negotiatingCount: expect.any(Number),
              contractedCount: expect.any(Number),
              rejectedCount: expect.any(Number),
            }),
            statusDistribution: expect.any(Object),
            priorityDistribution: expect.any(Object),
            regionDistribution: expect.arrayContaining([
              expect.objectContaining({
                regionId: expect.any(String),
                regionName: expect.any(String),
                count: expect.any(Number),
                avgScore: expect.any(Number),
                avgRent: expect.any(Number),
              }),
            ]),
            trendData: expect.arrayContaining([
              expect.objectContaining({
                date: expect.any(String),
                newLocations: expect.any(Number),
                contractedLocations: expect.any(Number),
                followUpCount: expect.any(Number),
              }),
            ]),
            performanceMetrics: expect.objectContaining({
              avgEvaluationScore: expect.any(Number),
              avgRentPrice: expect.any(Number),
              avgFollowUpDays: expect.any(Number),
              contractConversionRate: expect.any(Number),
            }),
          })
        );

        expect(mockPrisma.candidateLocation.findMany).toHaveBeenCalledWith({
          where: {
            regionId: { in: ['region-test-001'] },
            discoveryDate: {
              gte: new Date('2024-01-01T00:00:00Z'),
              lte: new Date('2024-01-31T23:59:59Z'),
            },
          },
          select: expect.any(Object),
        });
      });
    });
  });

  describe('批量操作', () => {
    describe('batchOperationCandidateLocations', () => {
      it('应该成功执行批量删除操作', async () => {
        // Arrange
        const mockBatchData = {
          ids: ['location-001', 'location-002'],
          action: 'delete' as const,
        };
        const mockOperatorId = 'user-test-001';

        // Mock删除操作成功
        vi.spyOn(expansionService, 'deleteCandidateLocation')
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined);

        // Act
        const result = await expansionService.batchOperationCandidateLocations(mockBatchData, mockOperatorId);

        // Assert
        expect(result).toEqual({
          success: 2,
          failed: 0,
          errors: [],
        });

        expect(expansionService.deleteCandidateLocation).toHaveBeenCalledTimes(2);
        expect(expansionService.deleteCandidateLocation).toHaveBeenCalledWith('location-001', mockOperatorId);
        expect(expansionService.deleteCandidateLocation).toHaveBeenCalledWith('location-002', mockOperatorId);
      });

      it('应该处理部分失败的批量操作', async () => {
        // Arrange
        const mockBatchData = {
          ids: ['location-001', 'location-002', 'location-003'],
          action: 'delete' as const,
        };
        const mockOperatorId = 'user-test-001';

        // Mock部分操作失败
        vi.spyOn(expansionService, 'deleteCandidateLocation')
          .mockResolvedValueOnce(undefined) // 成功
          .mockRejectedValueOnce(new NotFoundError('点位不存在')) // 失败
          .mockResolvedValueOnce(undefined); // 成功

        // Act
        const result = await expansionService.batchOperationCandidateLocations(mockBatchData, mockOperatorId);

        // Assert
        expect(result).toEqual({
          success: 2,
          failed: 1,
          errors: ['ID location-002: 点位不存在'],
        });

        expect(expansionService.deleteCandidateLocation).toHaveBeenCalledTimes(3);
      });

      it('应该成功执行批量状态变更操作', async () => {
        // Arrange
        const mockBatchData = {
          ids: ['location-001', 'location-002'],
          action: 'changeStatus' as const,
          actionData: {
            status: 'FOLLOWING' as const,
            reason: '批量开始跟进',
          },
        };
        const mockOperatorId = 'user-test-001';

        // Mock状态变更操作成功
        vi.spyOn(expansionService, 'changeCandidateLocationStatus')
          .mockResolvedValue(expansionFixtures.mockCandidateLocation as any);

        // Act
        const result = await expansionService.batchOperationCandidateLocations(mockBatchData, mockOperatorId);

        // Assert
        expect(result).toEqual({
          success: 2,
          failed: 0,
          errors: [],
        });

        expect(expansionService.changeCandidateLocationStatus).toHaveBeenCalledTimes(2);
        expect(expansionService.changeCandidateLocationStatus).toHaveBeenCalledWith(
          'location-001',
          { status: 'FOLLOWING', reason: '批量开始跟进' },
          mockOperatorId
        );
      });
    });
  });
});