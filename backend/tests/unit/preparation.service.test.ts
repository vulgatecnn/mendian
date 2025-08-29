/**
 * 开店筹备管理服务单元测试
 * 测试筹备项目、工程施工、设备采购、证照办理、人员招聘、里程碑跟踪的业务逻辑
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  preparationProjectService,
  constructionProjectService,
  equipmentProcurementService,
  licenseApplicationService,
  staffRecruitmentService,
  milestoneTrackingService,
} from '@/services/business/preparation.service.js';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '@/utils/errors.js';
import preparationFixtures from '../fixtures/preparation.fixture.js';

// Mock Prisma Client
const mockPrisma = {
  preparationProject: {
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
  constructionProject: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  equipmentProcurement: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  licenseApplication: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  staffRecruitment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  milestoneTracking: {
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
  store: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

describe('PreparationService', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('筹备项目管理', () => {
    describe('getList', () => {
      it('应该返回筹备项目列表', async () => {
        // Arrange
        const mockQuery = {
          page: 1,
          limit: 20,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
        };

        const mockItems = preparationFixtures.mockPreparationProjectList;
        const mockTotal = mockItems.length;

        mockPrisma.preparationProject.findMany.mockResolvedValue(mockItems);
        mockPrisma.preparationProject.count.mockResolvedValue(mockTotal);

        // Act
        const result = await preparationProjectService.getList(mockQuery);

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

        expect(mockPrisma.preparationProject.findMany).toHaveBeenCalledWith({
          where: {},
          skip: 0,
          take: 20,
          include: expect.objectContaining({
            region: expect.any(Object),
            storePlan: expect.any(Object),
            manager: expect.any(Object),
            _count: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
        });

        expect(mockPrisma.preparationProject.count).toHaveBeenCalledWith({ where: {} });
      });

      it('应该支持筛选条件', async () => {
        // Arrange
        const mockQuery = {
          page: 1,
          limit: 20,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
          regionId: 'region-test-001',
          status: 'IN_PROGRESS' as const,
          priority: 'HIGH' as const,
          storeType: 'FLAGSHIP' as const,
          keyword: '陆家嘴',
        };

        mockPrisma.preparationProject.findMany.mockResolvedValue([]);
        mockPrisma.preparationProject.count.mockResolvedValue(0);

        // Act
        await preparationProjectService.getList(mockQuery);

        // Assert
        expect(mockPrisma.preparationProject.findMany).toHaveBeenCalledWith({
          where: {
            regionId: 'region-test-001',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            storeType: 'FLAGSHIP',
            OR: [
              { storeName: { contains: '陆家嘴', mode: 'insensitive' } },
              { storeAddress: { contains: '陆家嘴', mode: 'insensitive' } },
              { description: { contains: '陆家嘴', mode: 'insensitive' } },
            ],
          },
          skip: 0,
          take: 20,
          include: expect.any(Object),
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('getById', () => {
      it('应该返回筹备项目详情', async () => {
        // Arrange
        const mockId = 'prep-project-001';
        const mockProject = preparationFixtures.mockPreparationProjectWithRelations;

        mockPrisma.preparationProject.findUnique.mockResolvedValue(mockProject);

        // Act
        const result = await preparationProjectService.getById(mockId);

        // Assert
        expect(result).toEqual(mockProject);
        expect(mockPrisma.preparationProject.findUnique).toHaveBeenCalledWith({
          where: { id: mockId },
          include: expect.objectContaining({
            region: expect.any(Object),
            storePlan: expect.any(Object),
            manager: expect.any(Object),
            constructionProjects: expect.any(Object),
            equipmentProcurements: expect.any(Object),
            licenseApplications: expect.any(Object),
            staffRecruitments: expect.any(Object),
            milestoneTrackings: expect.any(Object),
            _count: expect.any(Object),
          }),
        });
      });

      it('当筹备项目不存在时应该抛出NotFoundError', async () => {
        // Arrange
        const mockId = 'non-existent-id';
        mockPrisma.preparationProject.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(preparationProjectService.getById(mockId))
          .rejects
          .toThrow(NotFoundError);

        expect(mockPrisma.preparationProject.findUnique).toHaveBeenCalledWith({
          where: { id: mockId },
          include: expect.any(Object),
        });
      });
    });

    describe('create', () => {
      it('应该成功创建筹备项目', async () => {
        // Arrange
        const mockData = {
          storePlanId: 'store-plan-001',
          regionId: 'region-test-001',
          storeName: '测试门店',
          storeAddress: '测试地址123号',
          storeType: 'STANDARD' as const,
          planningArea: 200,
          expectedOpenDate: new Date('2024-06-01'),
          totalBudget: 1000000,
          managerId: 'user-test-001',
        };

        const mockRegion = { ...preparationFixtures.mockRegion, isActive: true };
        const mockStorePlan = { ...preparationFixtures.mockStorePlan, status: 'APPROVED' };
        const mockManager = { ...preparationFixtures.mockUser, status: 'ACTIVE' };
        const mockCreatedProject = preparationFixtures.mockPreparationProject;

        mockPrisma.region.findUnique.mockResolvedValue(mockRegion);
        mockPrisma.storePlan.findUnique.mockResolvedValue(mockStorePlan);
        mockPrisma.user.findUnique.mockResolvedValue(mockManager);
        mockPrisma.preparationProject.findFirst.mockResolvedValue(null); // 没有重复门店名称
        mockPrisma.preparationProject.create.mockResolvedValue(mockCreatedProject);

        // Act
        const result = await preparationProjectService.create(mockData);

        // Assert
        expect(result).toEqual(mockCreatedProject);

        // 验证区域存在性检查
        expect(mockPrisma.region.findUnique).toHaveBeenCalledWith({
          where: { id: mockData.regionId },
          select: { id: true, code: true, name: true, isActive: true },
        });

        // 验证开店计划存在性检查
        expect(mockPrisma.storePlan.findUnique).toHaveBeenCalledWith({
          where: { id: mockData.storePlanId },
          select: { id: true, status: true, regionId: true },
        });

        // 验证管理员存在性检查
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: mockData.managerId },
          select: { id: true, name: true, status: true },
        });

        // 验证门店名称重复检查
        expect(mockPrisma.preparationProject.findFirst).toHaveBeenCalledWith({
          where: {
            storeName: mockData.storeName,
            regionId: mockData.regionId,
            status: { not: 'CANCELLED' },
          },
        });

        // 验证创建筹备项目
        expect(mockPrisma.preparationProject.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            projectCode: expect.stringMatching(/^PREP\d{4}-.*-\d+$/),
            storePlanId: mockData.storePlanId,
            regionId: mockData.regionId,
            storeName: mockData.storeName,
            storeAddress: mockData.storeAddress,
            storeType: mockData.storeType,
            planningArea: expect.any(Object), // Prisma.Decimal
            expectedOpenDate: mockData.expectedOpenDate,
            totalBudget: expect.any(Object), // Prisma.Decimal
            managerId: mockData.managerId,
            status: 'PLANNING',
            priority: 'MEDIUM',
            progress: 0,
          }),
          include: expect.any(Object),
        });
      });

      it('当指定区域不存在时应该抛出BadRequestError', async () => {
        // Arrange
        const mockData = {
          storePlanId: 'store-plan-001',
          regionId: 'non-existent-region',
          storeName: '测试门店',
          storeAddress: '测试地址123号',
          managerId: 'user-test-001',
        };

        mockPrisma.region.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(preparationProjectService.create(mockData))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.region.findUnique).toHaveBeenCalled();
        expect(mockPrisma.preparationProject.create).not.toHaveBeenCalled();
      });

      it('当门店名称已存在时应该抛出ConflictError', async () => {
        // Arrange
        const mockData = {
          storePlanId: 'store-plan-001',
          regionId: 'region-test-001',
          storeName: '已存在的门店名',
          storeAddress: '测试地址123号',
          managerId: 'user-test-001',
        };

        const mockRegion = { ...preparationFixtures.mockRegion, isActive: true };
        const mockStorePlan = { ...preparationFixtures.mockStorePlan, status: 'APPROVED' };
        const mockManager = { ...preparationFixtures.mockUser, status: 'ACTIVE' };
        const existingProject = { id: 'existing-project-001' };

        mockPrisma.region.findUnique.mockResolvedValue(mockRegion);
        mockPrisma.storePlan.findUnique.mockResolvedValue(mockStorePlan);
        mockPrisma.user.findUnique.mockResolvedValue(mockManager);
        mockPrisma.preparationProject.findFirst.mockResolvedValue(existingProject);

        // Act & Assert
        await expect(preparationProjectService.create(mockData))
          .rejects
          .toThrow(ConflictError);

        expect(mockPrisma.preparationProject.findFirst).toHaveBeenCalled();
        expect(mockPrisma.preparationProject.create).not.toHaveBeenCalled();
      });
    });

    describe('update', () => {
      it('应该成功更新筹备项目', async () => {
        // Arrange
        const mockId = 'prep-project-001';
        const mockData = {
          storeName: '更新后的门店名称',
          totalBudget: 1200000,
          description: '更新后的描述',
        };
        const mockExistingProject = preparationFixtures.mockPreparationProject;
        const mockUpdatedProject = { ...mockExistingProject, ...mockData };

        mockPrisma.preparationProject.findUnique.mockResolvedValue(mockExistingProject);
        mockPrisma.preparationProject.update.mockResolvedValue(mockUpdatedProject);

        // Act
        const result = await preparationProjectService.update(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedProject);

        expect(mockPrisma.preparationProject.findUnique).toHaveBeenCalledWith({
          where: { id: mockId },
          include: { region: true, storePlan: true, manager: true },
        });

        expect(mockPrisma.preparationProject.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            storeName: mockData.storeName,
            totalBudget: expect.any(Object), // Prisma.Decimal
            description: mockData.description,
          }),
          include: expect.any(Object),
        });
      });

      it('当项目不存在时应该抛出NotFoundError', async () => {
        // Arrange
        const mockId = 'non-existent-id';
        const mockData = { storeName: '更新名称' };

        mockPrisma.preparationProject.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(preparationProjectService.update(mockId, mockData))
          .rejects
          .toThrow(NotFoundError);

        expect(mockPrisma.preparationProject.update).not.toHaveBeenCalled();
      });

      it('当项目已完成时应该抛出ForbiddenError', async () => {
        // Arrange
        const mockId = 'prep-project-001';
        const mockData = { storeName: '更新名称' };
        const mockCompletedProject = { ...preparationFixtures.mockPreparationProject, status: 'COMPLETED' };

        mockPrisma.preparationProject.findUnique.mockResolvedValue(mockCompletedProject);

        // Act & Assert
        await expect(preparationProjectService.update(mockId, mockData))
          .rejects
          .toThrow(ForbiddenError);

        expect(mockPrisma.preparationProject.update).not.toHaveBeenCalled();
      });
    });

    describe('changeStatus', () => {
      it('应该成功变更筹备项目状态', async () => {
        // Arrange
        const mockId = 'prep-project-001';
        const mockStatusData = {
          status: 'IN_PROGRESS' as const,
          reason: '开始筹备',
          comments: '项目正式启动',
        };
        const mockExistingProject = {
          ...preparationFixtures.mockPreparationProject,
          status: 'PLANNING',
        };
        const mockUpdatedProject = {
          ...mockExistingProject,
          status: 'IN_PROGRESS',
        };

        mockPrisma.preparationProject.findUnique.mockResolvedValue(mockExistingProject);
        mockPrisma.preparationProject.update.mockResolvedValue(mockUpdatedProject);

        // Act
        const result = await preparationProjectService.changeStatus(mockId, mockStatusData);

        // Assert
        expect(result).toEqual(mockUpdatedProject);

        expect(mockPrisma.preparationProject.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: {
            status: 'IN_PROGRESS',
            notes: expect.stringContaining('开始筹备'),
          },
          include: expect.any(Object),
        });
      });

      it('当状态转换不合法时应该抛出BadRequestError', async () => {
        // Arrange
        const mockId = 'prep-project-001';
        const mockStatusData = {
          status: 'COMPLETED' as const, // 从PLANNING直接到COMPLETED是不合法的
        };
        const mockExistingProject = {
          ...preparationFixtures.mockPreparationProject,
          status: 'PLANNING',
        };

        mockPrisma.preparationProject.findUnique.mockResolvedValue(mockExistingProject);

        // Act & Assert
        await expect(preparationProjectService.changeStatus(mockId, mockStatusData))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.preparationProject.update).not.toHaveBeenCalled();
      });

      it('当项目完成时应该创建门店记录并更新开店计划', async () => {
        // Arrange
        const mockId = 'prep-project-001';
        const mockStatusData = {
          status: 'COMPLETED' as const,
          reason: '筹备完成',
          actualOpenDate: new Date('2024-05-15'),
        };
        const mockExistingProject = {
          ...preparationFixtures.mockPreparationProject,
          status: 'IN_PROGRESS',
          storePlanId: 'store-plan-001',
        };

        mockPrisma.preparationProject.findUnique.mockResolvedValue(mockExistingProject);
        mockPrisma.preparationProject.update.mockResolvedValue(mockExistingProject);
        mockPrisma.store.create.mockResolvedValue({});
        mockPrisma.storePlan.update.mockResolvedValue({});

        // Act
        await preparationProjectService.changeStatus(mockId, mockStatusData);

        // Assert
        // 验证创建门店记录
        expect(mockPrisma.store.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: mockExistingProject.storeName,
            address: mockExistingProject.storeAddress,
            storeType: mockExistingProject.storeType,
            regionId: mockExistingProject.regionId,
            openDate: mockStatusData.actualOpenDate,
            status: 'ACTIVE',
          }),
        });

        // 验证更新开店计划完成数量
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

  describe('工程施工管理', () => {
    describe('getList', () => {
      it('应该返回工程项目列表', async () => {
        // Arrange
        const mockQuery = {
          page: 1,
          limit: 20,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
          preparationProjectId: 'prep-project-001',
        };

        const mockItems = [preparationFixtures.mockConstructionProject];
        const mockTotal = mockItems.length;

        mockPrisma.constructionProject.findMany.mockResolvedValue(mockItems);
        mockPrisma.constructionProject.count.mockResolvedValue(mockTotal);

        // Act
        const result = await constructionProjectService.getList(mockQuery);

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

        expect(mockPrisma.constructionProject.findMany).toHaveBeenCalledWith({
          where: {
            preparationProjectId: 'prep-project-001',
          },
          skip: 0,
          take: 20,
          include: expect.objectContaining({
            preparationProject: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('create', () => {
      it('应该成功创建工程项目', async () => {
        // Arrange
        const mockData = {
          preparationProjectId: 'prep-project-001',
          contractorName: '测试装修公司',
          contractorContact: '张工',
          contractorPhone: '13800138888',
          projectType: 'DECORATION' as const,
          contractAmount: 500000,
          startDate: new Date('2024-03-01'),
          expectedEndDate: new Date('2024-04-30'),
        };

        const mockPreparationProject = { id: 'prep-project-001', status: 'IN_PROGRESS' };
        const mockCreatedProject = preparationFixtures.mockConstructionProject;

        mockPrisma.preparationProject.findUnique.mockResolvedValue(mockPreparationProject);
        mockPrisma.constructionProject.create.mockResolvedValue(mockCreatedProject);

        // Act
        const result = await constructionProjectService.create(mockData);

        // Assert
        expect(result).toEqual(mockCreatedProject);

        // 验证筹备项目存在性检查
        expect(mockPrisma.preparationProject.findUnique).toHaveBeenCalledWith({
          where: { id: mockData.preparationProjectId },
          select: { id: true, status: true },
        });

        // 验证创建工程项目
        expect(mockPrisma.constructionProject.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            preparationProjectId: mockData.preparationProjectId,
            contractorName: mockData.contractorName,
            contractorContact: mockData.contractorContact,
            contractorPhone: mockData.contractorPhone,
            projectType: mockData.projectType,
            contractAmount: expect.any(Object), // Prisma.Decimal
            startDate: mockData.startDate,
            expectedEndDate: mockData.expectedEndDate,
            status: 'PLANNING',
            progress: 0,
          }),
          include: expect.any(Object),
        });
      });

      it('当筹备项目不存在时应该抛出BadRequestError', async () => {
        // Arrange
        const mockData = {
          preparationProjectId: 'non-existent-project',
          contractorName: '测试装修公司',
          projectType: 'DECORATION' as const,
          contractAmount: 500000,
        };

        mockPrisma.preparationProject.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(constructionProjectService.create(mockData))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.constructionProject.create).not.toHaveBeenCalled();
      });
    });

    describe('updateProgress', () => {
      it('应该成功更新工程进度', async () => {
        // Arrange
        const mockId = 'construction-001';
        const mockData = {
          progress: 50,
          progressDescription: '水电改造完成，开始泥瓦工程',
          actualAmount: 250000,
        };

        const mockExistingProject = { ...preparationFixtures.mockConstructionProject, progress: 25 };
        const mockUpdatedProject = { ...mockExistingProject, ...mockData };

        mockPrisma.constructionProject.findUnique.mockResolvedValue(mockExistingProject);
        mockPrisma.constructionProject.update.mockResolvedValue(mockUpdatedProject);

        // Act
        const result = await constructionProjectService.updateProgress(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedProject);

        expect(mockPrisma.constructionProject.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            progress: mockData.progress,
            actualAmount: expect.any(Object), // Prisma.Decimal
          }),
          include: expect.any(Object),
        });
      });

      it('当工程项目已完成时应该抛出ForbiddenError', async () => {
        // Arrange
        const mockId = 'construction-001';
        const mockData = { progress: 60 };
        const mockCompletedProject = { ...preparationFixtures.mockConstructionProject, status: 'COMPLETED' };

        mockPrisma.constructionProject.findUnique.mockResolvedValue(mockCompletedProject);

        // Act & Assert
        await expect(constructionProjectService.updateProgress(mockId, mockData))
          .rejects
          .toThrow(ForbiddenError);

        expect(mockPrisma.constructionProject.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('设备采购管理', () => {
    describe('getList', () => {
      it('应该返回设备采购列表', async () => {
        // Arrange
        const mockQuery = {
          page: 1,
          limit: 20,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
          preparationProjectId: 'prep-project-001',
        };

        const mockItems = [preparationFixtures.mockEquipmentProcurement];
        const mockTotal = mockItems.length;

        mockPrisma.equipmentProcurement.findMany.mockResolvedValue(mockItems);
        mockPrisma.equipmentProcurement.count.mockResolvedValue(mockTotal);

        // Act
        const result = await equipmentProcurementService.getList(mockQuery);

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

        expect(mockPrisma.equipmentProcurement.findMany).toHaveBeenCalledWith({
          where: {
            preparationProjectId: 'prep-project-001',
          },
          skip: 0,
          take: 20,
          include: expect.objectContaining({
            preparationProject: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('confirmDelivery', () => {
      it('应该成功确认设备交付', async () => {
        // Arrange
        const mockId = 'equipment-001';
        const mockData = {
          actualDeliveryDate: new Date('2024-03-22'),
          deliveryNotes: '设备完好到货，包装完整',
          qualityInspection: {
            inspector: '质检员',
            inspectionDate: '2024-03-22',
            result: 'PASS',
            notes: '设备功能正常，外观完好'
          },
        };

        const mockExistingEquipment = { ...preparationFixtures.mockEquipmentProcurement, status: 'SHIPPED' };
        const mockUpdatedEquipment = { ...mockExistingEquipment, status: 'DELIVERED', ...mockData };

        mockPrisma.equipmentProcurement.findUnique.mockResolvedValue(mockExistingEquipment);
        mockPrisma.equipmentProcurement.update.mockResolvedValue(mockUpdatedEquipment);

        // Act
        const result = await equipmentProcurementService.confirmDelivery(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedEquipment);

        expect(mockPrisma.equipmentProcurement.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            status: 'DELIVERED',
            actualDeliveryDate: mockData.actualDeliveryDate,
            qualityInspection: mockData.qualityInspection,
          }),
          include: expect.any(Object),
        });
      });

      it('当设备未发货时应该抛出BadRequestError', async () => {
        // Arrange
        const mockId = 'equipment-001';
        const mockData = { actualDeliveryDate: new Date() };
        const mockEquipment = { ...preparationFixtures.mockEquipmentProcurement, status: 'ORDERED' };

        mockPrisma.equipmentProcurement.findUnique.mockResolvedValue(mockEquipment);

        // Act & Assert
        await expect(equipmentProcurementService.confirmDelivery(mockId, mockData))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.equipmentProcurement.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('证照办理管理', () => {
    describe('updateProgress', () => {
      it('应该成功更新证照办理进度', async () => {
        // Arrange
        const mockId = 'license-001';
        const mockData = {
          currentStep: '现场核查',
          stepStatus: 'IN_PROGRESS' as const,
          followUpNotes: '已安排现场核查时间',
        };

        const mockExistingLicense = preparationFixtures.mockLicenseApplication;
        const mockUpdatedLicense = { ...mockExistingLicense, ...mockData };

        mockPrisma.licenseApplication.findUnique.mockResolvedValue(mockExistingLicense);
        mockPrisma.licenseApplication.update.mockResolvedValue(mockUpdatedLicense);

        // Act
        const result = await licenseApplicationService.updateProgress(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedLicense);

        expect(mockPrisma.licenseApplication.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            processingSteps: expect.any(Array),
            followUpRecords: expect.any(Array),
          }),
          include: expect.any(Object),
        });
      });
    });

    describe('confirmIssued', () => {
      it('应该成功确认证照下发', async () => {
        // Arrange
        const mockId = 'license-001';
        const mockData = {
          actualIssueDate: new Date('2024-03-20'),
          licenseNumber: 'BL20240320001',
          certificateUrl: 'https://example.com/certificate.pdf',
          expiryDate: new Date('2025-03-20'),
        };

        const mockExistingLicense = { ...preparationFixtures.mockLicenseApplication, status: 'PROCESSING' };
        const mockUpdatedLicense = { ...mockExistingLicense, status: 'ISSUED', ...mockData };

        mockPrisma.licenseApplication.findUnique.mockResolvedValue(mockExistingLicense);
        mockPrisma.licenseApplication.update.mockResolvedValue(mockUpdatedLicense);

        // Act
        const result = await licenseApplicationService.confirmIssued(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedLicense);

        expect(mockPrisma.licenseApplication.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            status: 'ISSUED',
            actualIssueDate: mockData.actualIssueDate,
            licenseNumber: mockData.licenseNumber,
            certificateUrl: mockData.certificateUrl,
            expiryDate: mockData.expiryDate,
          }),
          include: expect.any(Object),
        });
      });
    });
  });

  describe('人员招聘管理', () => {
    describe('updateInterviewResult', () => {
      it('应该成功更新面试结果', async () => {
        // Arrange
        const mockId = 'recruitment-001';
        const mockData = {
          candidateId: 'candidate-001',
          interviewResult: {
            score: 85,
            evaluation: '表现优秀，符合岗位要求',
            result: 'PASS' as const,
            nextStep: 'OFFER' as const,
          },
        };

        const mockExistingRecruitment = preparationFixtures.mockStaffRecruitment;
        const mockUpdatedRecruitment = { ...mockExistingRecruitment, ...mockData };

        mockPrisma.staffRecruitment.findUnique.mockResolvedValue(mockExistingRecruitment);
        mockPrisma.staffRecruitment.update.mockResolvedValue(mockUpdatedRecruitment);

        // Act
        const result = await staffRecruitmentService.updateInterviewResult(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedRecruitment);

        expect(mockPrisma.staffRecruitment.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            interviews: expect.any(Array),
            applicationStats: expect.any(Object),
          }),
          include: expect.any(Object),
        });
      });
    });

    describe('confirmOnboard', () => {
      it('应该成功确认员工入职', async () => {
        // Arrange
        const mockId = 'recruitment-001';
        const mockData = {
          candidateId: 'candidate-001',
          onboardDate: new Date('2024-05-01'),
          employeeId: 'EMP001',
          onboardNotes: '入职手续完成，开始试用期',
        };

        const mockExistingRecruitment = { ...preparationFixtures.mockStaffRecruitment, status: 'OFFER_ACCEPTED' };
        const mockUpdatedRecruitment = { ...mockExistingRecruitment, status: 'COMPLETED', ...mockData };

        mockPrisma.staffRecruitment.findUnique.mockResolvedValue(mockExistingRecruitment);
        mockPrisma.staffRecruitment.update.mockResolvedValue(mockUpdatedRecruitment);

        // Act
        const result = await staffRecruitmentService.confirmOnboard(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedRecruitment);

        expect(mockPrisma.staffRecruitment.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            status: 'COMPLETED',
            hiredCandidates: expect.any(Array),
          }),
          include: expect.any(Object),
        });
      });
    });
  });

  describe('里程碑跟踪管理', () => {
    describe('updateProgress', () => {
      it('应该成功更新里程碑进度', async () => {
        // Arrange
        const mockId = 'milestone-001';
        const mockData = {
          progress: 100,
          progressDescription: '里程碑已完成',
          completedCriteria: ['criteria-001', 'criteria-002'],
          actualDate: new Date('2024-03-02'),
        };

        const mockExistingMilestone = { ...preparationFixtures.mockMilestoneTracking, status: 'IN_PROGRESS' };
        const mockUpdatedMilestone = { ...mockExistingMilestone, status: 'COMPLETED', ...mockData };

        mockPrisma.milestoneTracking.findUnique.mockResolvedValue(mockExistingMilestone);
        mockPrisma.milestoneTracking.update.mockResolvedValue(mockUpdatedMilestone);

        // Act
        const result = await milestoneTrackingService.updateProgress(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedMilestone);

        expect(mockPrisma.milestoneTracking.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            actualDate: mockData.actualDate,
            status: 'COMPLETED',
            criteriaChecklist: expect.any(Array),
            progressUpdates: expect.any(Array),
          }),
          include: expect.any(Object),
        });
      });
    });

    describe('approve', () => {
      it('应该成功审批里程碑', async () => {
        // Arrange
        const mockId = 'milestone-001';
        const mockData = {
          approverId: 'user-test-001',
          approverName: '审批人',
          approvalComments: '里程碑完成质量良好，予以通过',
        };

        const mockExistingMilestone = { ...preparationFixtures.mockMilestoneTracking, status: 'COMPLETED' };
        const mockUpdatedMilestone = { ...mockExistingMilestone, status: 'APPROVED', ...mockData };

        mockPrisma.milestoneTracking.findUnique.mockResolvedValue(mockExistingMilestone);
        mockPrisma.milestoneTracking.update.mockResolvedValue(mockUpdatedMilestone);

        // Act
        const result = await milestoneTrackingService.approve(mockId, mockData);

        // Assert
        expect(result).toEqual(mockUpdatedMilestone);

        expect(mockPrisma.milestoneTracking.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: expect.objectContaining({
            status: 'APPROVED',
            approvals: expect.any(Array),
          }),
          include: expect.any(Object),
        });
      });

      it('当里程碑未完成时应该抛出BadRequestError', async () => {
        // Arrange
        const mockId = 'milestone-001';
        const mockData = { approverId: 'user-test-001' };
        const mockMilestone = { ...preparationFixtures.mockMilestoneTracking, status: 'IN_PROGRESS' };

        mockPrisma.milestoneTracking.findUnique.mockResolvedValue(mockMilestone);

        // Act & Assert
        await expect(milestoneTrackingService.approve(mockId, mockData))
          .rejects
          .toThrow(BadRequestError);

        expect(mockPrisma.milestoneTracking.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('统计分析', () => {
    describe('getDashboardStatistics', () => {
      it('应该返回筹备项目统计数据', async () => {
        // Arrange
        const mockQuery = {
          regionIds: ['region-test-001'],
          dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-03-31T23:59:59Z',
          },
        };

        const mockProjects = preparationFixtures.mockPreparationProjectList;
        const mockRegionStats = [
          {
            regionId: 'region-test-001',
            _count: 3,
            _avg: { 
              progress: { toNumber: () => 65 }, 
              totalBudget: { toNumber: () => 1200000 },
              actualCost: { toNumber: () => 400000 }
            },
          },
        ];

        mockPrisma.preparationProject.findMany.mockResolvedValue(mockProjects);
        mockPrisma.preparationProject.groupBy.mockResolvedValue(mockRegionStats);
        mockPrisma.region.findUnique.mockResolvedValue(preparationFixtures.mockRegion);

        // Act
        const result = await preparationProjectService.getDashboardStatistics(mockQuery);

        // Assert
        expect(result).toEqual(
          expect.objectContaining({
            overview: expect.objectContaining({
              totalProjects: expect.any(Number),
              planningCount: expect.any(Number),
              inProgressCount: expect.any(Number),
              completedCount: expect.any(Number),
              pausedCount: expect.any(Number),
              cancelledCount: expect.any(Number),
              overdueCount: expect.any(Number),
            }),
            statusDistribution: expect.any(Object),
            progressDistribution: expect.any(Object),
            regionDistribution: expect.arrayContaining([
              expect.objectContaining({
                regionId: expect.any(String),
                regionName: expect.any(String),
                projectCount: expect.any(Number),
                avgProgress: expect.any(Number),
                totalBudget: expect.any(Number),
                actualCost: expect.any(Number),
              }),
            ]),
            timelineData: expect.arrayContaining([
              expect.objectContaining({
                date: expect.any(String),
                newProjects: expect.any(Number),
                completedProjects: expect.any(Number),
                totalActive: expect.any(Number),
              }),
            ]),
            budgetAnalysis: expect.objectContaining({
              totalPlannedBudget: expect.any(Number),
              totalActualCost: expect.any(Number),
              budgetUtilization: expect.any(Number),
              avgCostPerProject: expect.any(Number),
              overBudgetProjects: expect.any(Number),
            }),
          })
        );

        expect(mockPrisma.preparationProject.findMany).toHaveBeenCalledWith({
          where: {
            regionId: { in: ['region-test-001'] },
            createdAt: {
              gte: new Date('2024-01-01T00:00:00Z'),
              lte: new Date('2024-03-31T23:59:59Z'),
            },
          },
          select: expect.any(Object),
        });
      });
    });
  });

  describe('批量操作', () => {
    describe('batchOperation', () => {
      it('应该成功执行批量状态变更操作', async () => {
        // Arrange
        const mockBatchData = {
          ids: ['project-001', 'project-002'],
          action: 'changeStatus' as const,
          actionData: {
            status: 'IN_PROGRESS' as const,
            reason: '批量启动项目',
          },
        };

        // Mock状态变更操作成功
        vi.spyOn(preparationProjectService, 'changeStatus')
          .mockResolvedValue(preparationFixtures.mockPreparationProject as any);

        // Act
        const result = await preparationProjectService.batchOperation(mockBatchData);

        // Assert
        expect(result).toEqual({
          success: 2,
          failed: 0,
          errors: [],
        });

        expect(preparationProjectService.changeStatus).toHaveBeenCalledTimes(2);
        expect(preparationProjectService.changeStatus).toHaveBeenCalledWith(
          'project-001',
          { status: 'IN_PROGRESS', reason: '批量启动项目' }
        );
      });

      it('应该处理部分失败的批量操作', async () => {
        // Arrange
        const mockBatchData = {
          ids: ['project-001', 'project-002', 'project-003'],
          action: 'changeStatus' as const,
          actionData: {
            status: 'IN_PROGRESS' as const,
            reason: '批量启动项目',
          },
        };

        // Mock部分操作失败
        vi.spyOn(preparationProjectService, 'changeStatus')
          .mockResolvedValueOnce(preparationFixtures.mockPreparationProject as any) // 成功
          .mockRejectedValueOnce(new NotFoundError('项目不存在')) // 失败
          .mockResolvedValueOnce(preparationFixtures.mockPreparationProject as any); // 成功

        // Act
        const result = await preparationProjectService.batchOperation(mockBatchData);

        // Assert
        expect(result).toEqual({
          success: 2,
          failed: 1,
          errors: ['ID project-002: 项目不存在'],
        });

        expect(preparationProjectService.changeStatus).toHaveBeenCalledTimes(3);
      });
    });
  });
});