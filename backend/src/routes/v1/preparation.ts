import type { FastifyInstance } from 'fastify';
import {
  // 筹备项目管理
  getPreparationProjects,
  getPreparationProjectById,
  createPreparationProject,
  updatePreparationProject,
  deletePreparationProject,
  changePreparationProjectStatus,
  updatePreparationProjectProgress,
  batchOperationPreparationProjects,
  getPreparationDashboard,
  
  // 工程任务管理
  getEngineeringTasks,
  getEngineeringTaskById,
  createEngineeringTask,
  updateEngineeringTask,
  deleteEngineeringTask,
  changeEngineeringTaskStatus,
  getEngineeringStatistics,
  
  // 设备采购管理
  getEquipmentProcurements,
  getEquipmentProcurementById,
  createEquipmentProcurement,
  updateEquipmentProcurement,
  deleteEquipmentProcurement,
  getEquipmentStatistics,
  
  // 证照办理管理
  getLicenseApplications,
  getLicenseApplicationById,
  createLicenseApplication,
  updateLicenseApplication,
  deleteLicenseApplication,
  getLicenseStatistics,
  
  // 人员招聘管理
  getStaffRecruitments,
  getStaffRecruitmentById,
  createStaffRecruitment,
  updateStaffRecruitment,
  deleteStaffRecruitment,
  getRecruitmentStatistics,
  
  // 里程碑跟踪管理
  getMilestoneTrackings,
  getMilestoneTrackingById,
  createMilestoneTracking,
  updateMilestoneTracking,
  deleteMilestoneTracking,
  changeMilestoneStatus,
  getMilestoneStatistics,
} from '@/controllers/preparation.controller.js';

const preparationRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // ===============================
  // 筹备项目管理路由
  // ===============================
  
  // 筹备项目CRUD
  fastify.get('/projects', {
    schema: {
      tags: ['preparation'],
      summary: '获取筹备项目列表',
      description: '分页获取筹备项目列表，支持筛选、排序、搜索',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'projectName', 'status', 'priority', 'plannedStartDate', 'plannedEndDate', 'budget', 'progressPercentage'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          candidateLocationId: { type: 'string' },
          status: { type: 'string', enum: ['PLANNING', 'APPROVED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED', 'CANCELLED', 'OVERDUE'] },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
          managerId: { type: 'string' },
          keyword: { type: 'string' },
        },
      },
    },
  }, getPreparationProjects);

  fastify.get('/projects/:id', {
    schema: {
      tags: ['preparation'],
      summary: '获取筹备项目详情',
      description: '根据ID获取筹备项目的详细信息，包含关联数据',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, getPreparationProjectById);

  fastify.post('/projects', {
    schema: {
      tags: ['preparation'],
      summary: '创建筹备项目',
      description: '创建新的筹备项目',
      body: {
        type: 'object',
        properties: {
          candidateLocationId: { type: 'string' },
          projectName: { type: 'string', minLength: 2, maxLength: 200 },
          storeCode: { type: 'string', maxLength: 50 },
          storeName: { type: 'string', maxLength: 200 },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
          plannedStartDate: { type: 'string', format: 'date-time' },
          plannedEndDate: { type: 'string', format: 'date-time' },
          budget: { type: 'number', minimum: 0 },
          description: { type: 'string', maxLength: 2000 },
          notes: { type: 'string', maxLength: 2000 },
          managerId: { type: 'string' },
        },
        required: ['candidateLocationId', 'projectName', 'plannedStartDate', 'plannedEndDate', 'budget'],
      },
    },
  }, createPreparationProject);

  fastify.put('/projects/:id', {
    schema: {
      tags: ['preparation'],
      summary: '更新筹备项目',
      description: '根据ID更新筹备项目信息',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          projectName: { type: 'string', minLength: 2, maxLength: 200 },
          storeCode: { type: 'string', maxLength: 50 },
          storeName: { type: 'string', maxLength: 200 },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
          plannedStartDate: { type: 'string', format: 'date-time' },
          plannedEndDate: { type: 'string', format: 'date-time' },
          actualStartDate: { type: 'string', format: 'date-time' },
          actualEndDate: { type: 'string', format: 'date-time' },
          budget: { type: 'number', minimum: 0 },
          actualBudget: { type: 'number', minimum: 0 },
          description: { type: 'string', maxLength: 2000 },
          notes: { type: 'string', maxLength: 2000 },
          managerId: { type: 'string' },
        },
      },
    },
  }, updatePreparationProject);

  fastify.delete('/projects/:id', {
    schema: {
      tags: ['preparation'],
      summary: '删除筹备项目',
      description: '根据ID删除筹备项目（必须无关联数据）',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, deletePreparationProject);

  // 筹备项目状态和进度管理
  fastify.post('/projects/:id/status', {
    schema: {
      tags: ['preparation'],
      summary: '更改筹备项目状态',
      description: '更改筹备项目的状态，支持状态流转验证',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          reason: { type: 'string', maxLength: 500 },
          comments: { type: 'string', maxLength: 1000 },
        },
        required: ['status'],
      },
    },
  }, changePreparationProjectStatus);

  fastify.post('/projects/:id/progress', {
    schema: {
      tags: ['preparation'],
      summary: '更新筹备项目进度',
      description: '更新筹备项目的进度百分比和相关信息',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          progressPercentage: { type: 'number', minimum: 0, maximum: 100 },
          notes: { type: 'string', maxLength: 1000 },
          actualStartDate: { type: 'string', format: 'date-time' },
          actualEndDate: { type: 'string', format: 'date-time' },
          actualBudget: { type: 'number', minimum: 0 },
        },
        required: ['progressPercentage'],
      },
    },
  }, updatePreparationProjectProgress);

  // 批量操作
  fastify.post('/projects/batch', {
    schema: {
      tags: ['preparation'],
      summary: '批量操作筹备项目',
      description: '对多个筹备项目执行批量操作（删除、状态变更等）',
      body: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
          action: { type: 'string', enum: ['delete', 'changeStatus', 'changePriority', 'assignManager'] },
          actionData: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
              managerId: { type: 'string' },
              reason: { type: 'string', maxLength: 500 },
            },
          },
        },
        required: ['ids', 'action'],
      },
    },
  }, batchOperationPreparationProjects);

  // 仪表板和统计
  fastify.get('/dashboard', {
    schema: {
      tags: ['preparation'],
      summary: '获取筹备项目仪表板数据',
      description: '获取筹备项目的统计数据和图表数据',
    },
  }, getPreparationDashboard);

  // ===============================
  // 工程任务管理路由
  // ===============================
  
  fastify.get('/projects/:projectId/engineering', {
    schema: {
      tags: ['preparation'],
      summary: '获取工程任务列表',
      description: '获取指定筹备项目的工程任务列表',
    },
  }, getEngineeringTasks);

  fastify.post('/projects/:projectId/engineering', {
    schema: {
      tags: ['preparation'],
      summary: '创建工程任务',
      description: '为筹备项目创建新的工程任务',
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
        },
        required: ['projectId'],
      },
      body: {
        type: 'object',
        properties: {
          candidateLocationId: { type: 'string' },
          supplierId: { type: 'string' },
          taskType: { type: 'string', enum: ['CONSTRUCTION', 'DECORATION', 'EQUIPMENT', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'FIRE_SAFETY', 'SECURITY', 'NETWORK', 'OTHER'] },
          projectName: { type: 'string', minLength: 2, maxLength: 200 },
          contractNumber: { type: 'string', maxLength: 100 },
          contractAmount: { type: 'number', minimum: 0 },
          plannedStartDate: { type: 'string', format: 'date-time' },
          plannedEndDate: { type: 'string', format: 'date-time' },
          description: { type: 'string', maxLength: 2000 },
          notes: { type: 'string', maxLength: 2000 },
          riskLevel: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
        },
        required: ['candidateLocationId', 'supplierId', 'taskType', 'projectName', 'contractAmount', 'plannedStartDate', 'plannedEndDate'],
      },
    },
  }, createEngineeringTask);

  fastify.get('/engineering/:id', {
    schema: {
      tags: ['preparation'],
      summary: '获取工程任务详情',
      description: '根据ID获取工程任务详情',
    },
  }, getEngineeringTaskById);

  fastify.put('/engineering/:id', {
    schema: {
      tags: ['preparation'],
      summary: '更新工程任务',
      description: '更新工程任务信息',
    },
  }, updateEngineeringTask);

  fastify.delete('/engineering/:id', {
    schema: {
      tags: ['preparation'],
      summary: '删除工程任务',
      description: '删除指定的工程任务',
    },
  }, deleteEngineeringTask);

  fastify.post('/engineering/:id/status', {
    schema: {
      tags: ['preparation'],
      summary: '更改工程任务状态',
      description: '更改工程任务状态',
    },
  }, changeEngineeringTaskStatus);

  fastify.get('/engineering/statistics', {
    schema: {
      tags: ['preparation'],
      summary: '获取工程任务统计数据',
      description: '获取工程任务的统计和分析数据',
    },
  }, getEngineeringStatistics);

  // ===============================
  // 设备采购管理路由
  // ===============================
  
  fastify.get('/projects/:projectId/equipment', {
    schema: {
      tags: ['preparation'],
      summary: '获取设备采购列表',
      description: '获取指定筹备项目的设备采购列表',
    },
  }, getEquipmentProcurements);

  fastify.post('/projects/:projectId/equipment', {
    schema: {
      tags: ['preparation'],
      summary: '创建设备采购',
      description: '为筹备项目创建设备采购记录',
      body: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['KITCHEN', 'DINING', 'COOLING', 'CLEANING', 'SAFETY', 'FURNITURE', 'TECHNOLOGY', 'DECORATION', 'OTHER'] },
          equipmentName: { type: 'string', minLength: 2, maxLength: 200 },
          brand: { type: 'string', maxLength: 100 },
          model: { type: 'string', maxLength: 100 },
          specifications: { type: 'object' },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: { type: 'number', minimum: 0 },
          totalPrice: { type: 'number', minimum: 0 },
          currency: { type: 'string', default: 'CNY' },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
          plannedDeliveryDate: { type: 'string', format: 'date-time' },
          warrantyPeriod: { type: 'integer', minimum: 0 },
          supplier: { type: 'string', maxLength: 200 },
          supplierContact: { type: 'string', maxLength: 200 },
          deliveryAddress: { type: 'string', maxLength: 500 },
          installationRequirements: { type: 'string', maxLength: 2000 },
          notes: { type: 'string', maxLength: 2000 },
        },
        required: ['category', 'equipmentName', 'quantity'],
      },
    },
  }, createEquipmentProcurement);

  fastify.get('/equipment/:id', {
    schema: {
      tags: ['preparation'],
      summary: '获取设备采购详情',
      description: '根据ID获取设备采购详情',
    },
  }, getEquipmentProcurementById);

  fastify.put('/equipment/:id', {
    schema: {
      tags: ['preparation'],
      summary: '更新设备采购',
      description: '更新设备采购信息',
    },
  }, updateEquipmentProcurement);

  fastify.delete('/equipment/:id', {
    schema: {
      tags: ['preparation'],
      summary: '删除设备采购',
      description: '删除指定的设备采购记录',
    },
  }, deleteEquipmentProcurement);

  fastify.get('/equipment/statistics', {
    schema: {
      tags: ['preparation'],
      summary: '获取设备采购统计数据',
      description: '获取设备采购的统计和分析数据',
    },
  }, getEquipmentStatistics);

  // ===============================
  // 证照办理管理路由
  // ===============================
  
  fastify.get('/projects/:projectId/licenses', {
    schema: {
      tags: ['preparation'],
      summary: '获取证照办理列表',
      description: '获取指定筹备项目的证照办理列表',
    },
  }, getLicenseApplications);

  fastify.post('/projects/:projectId/licenses', {
    schema: {
      tags: ['preparation'],
      summary: '创建证照办理',
      description: '为筹备项目创建证照办理记录',
      body: {
        type: 'object',
        properties: {
          licenseType: { type: 'string', enum: ['BUSINESS', 'FOOD_SERVICE', 'FIRE_SAFETY', 'HEALTH', 'TAX', 'SIGNBOARD', 'ENVIRONMENTAL', 'SPECIAL', 'OTHER'] },
          licenseName: { type: 'string', minLength: 2, maxLength: 200 },
          issuingAuthority: { type: 'string', minLength: 2, maxLength: 200 },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
          applicationDate: { type: 'string', format: 'date-time' },
          applicationFee: { type: 'number', minimum: 0 },
          currency: { type: 'string', default: 'CNY' },
          applicant: { type: 'string', maxLength: 100 },
          contactPerson: { type: 'string', maxLength: 50 },
          contactPhone: { type: 'string', pattern: '^1[3-9]\\d{9}$' },
          applicationAddress: { type: 'string', maxLength: 500 },
          requiredDocuments: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string', maxLength: 2000 },
        },
        required: ['licenseType', 'licenseName', 'issuingAuthority', 'requiredDocuments'],
      },
    },
  }, createLicenseApplication);

  fastify.get('/licenses/:id', {
    schema: {
      tags: ['preparation'],
      summary: '获取证照办理详情',
      description: '根据ID获取证照办理详情',
    },
  }, getLicenseApplicationById);

  fastify.put('/licenses/:id', {
    schema: {
      tags: ['preparation'],
      summary: '更新证照办理',
      description: '更新证照办理信息',
    },
  }, updateLicenseApplication);

  fastify.delete('/licenses/:id', {
    schema: {
      tags: ['preparation'],
      summary: '删除证照办理',
      description: '删除指定的证照办理记录',
    },
  }, deleteLicenseApplication);

  fastify.get('/licenses/statistics', {
    schema: {
      tags: ['preparation'],
      summary: '获取证照办理统计数据',
      description: '获取证照办理的统计和分析数据',
    },
  }, getLicenseStatistics);

  // ===============================
  // 人员招聘管理路由
  // ===============================
  
  fastify.get('/projects/:projectId/staff', {
    schema: {
      tags: ['preparation'],
      summary: '获取人员招聘列表',
      description: '获取指定筹备项目的人员招聘列表',
    },
  }, getStaffRecruitments);

  fastify.post('/projects/:projectId/staff', {
    schema: {
      tags: ['preparation'],
      summary: '创建人员招聘',
      description: '为筹备项目创建人员招聘记录',
      body: {
        type: 'object',
        properties: {
          positionType: { type: 'string', enum: ['MANAGER', 'CHEF', 'SERVER', 'CASHIER', 'CLEANER', 'SECURITY', 'MAINTENANCE', 'SALES', 'OTHER'] },
          positionTitle: { type: 'string', minLength: 2, maxLength: 200 },
          department: { type: 'string', maxLength: 100 },
          plannedCount: { type: 'integer', minimum: 1 },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          salaryRange: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 },
              currency: { type: 'string', default: 'CNY' },
            },
            required: ['min', 'max'],
          },
          workLocation: { type: 'string', maxLength: 200 },
          workSchedule: { type: 'string', maxLength: 500 },
          qualificationRequirements: { type: 'string', minLength: 10, maxLength: 2000 },
          jobDescription: { type: 'string', minLength: 20, maxLength: 5000 },
          benefits: { type: 'string', maxLength: 2000 },
          recruitmentChannels: { type: 'array', items: { type: 'string' } },
          recruiters: { type: 'array', items: { type: 'string' } },
          interviewers: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string', maxLength: 2000 },
        },
        required: ['positionType', 'positionTitle', 'plannedCount', 'qualificationRequirements', 'jobDescription'],
      },
    },
  }, createStaffRecruitment);

  fastify.get('/staff/:id', {
    schema: {
      tags: ['preparation'],
      summary: '获取人员招聘详情',
      description: '根据ID获取人员招聘详情',
    },
  }, getStaffRecruitmentById);

  fastify.put('/staff/:id', {
    schema: {
      tags: ['preparation'],
      summary: '更新人员招聘',
      description: '更新人员招聘信息',
    },
  }, updateStaffRecruitment);

  fastify.delete('/staff/:id', {
    schema: {
      tags: ['preparation'],
      summary: '删除人员招聘',
      description: '删除指定的人员招聘记录',
    },
  }, deleteStaffRecruitment);

  fastify.get('/staff/statistics', {
    schema: {
      tags: ['preparation'],
      summary: '获取人员招聘统计数据',
      description: '获取人员招聘的统计和分析数据',
    },
  }, getRecruitmentStatistics);

  // ===============================
  // 里程碑跟踪管理路由
  // ===============================
  
  fastify.get('/projects/:projectId/milestones', {
    schema: {
      tags: ['preparation'],
      summary: '获取里程碑跟踪列表',
      description: '获取指定筹备项目的里程碑跟踪列表',
    },
  }, getMilestoneTrackings);

  fastify.post('/projects/:projectId/milestones', {
    schema: {
      tags: ['preparation'],
      summary: '创建里程碑跟踪',
      description: '为筹备项目创建里程碑跟踪记录',
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          category: { type: 'string', minLength: 2, maxLength: 50 },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
          plannedDate: { type: 'string', format: 'date-time' },
          dependencies: { type: 'array', items: { type: 'string' } },
          relatedTasks: { type: 'array', items: { type: 'string' } },
          deliverables: { type: 'array', items: { type: 'string' } },
          criteria: { type: 'string', maxLength: 1000 },
          owner: { type: 'string' },
          stakeholders: { type: 'array', items: { type: 'string' } },
          riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
          notes: { type: 'string', maxLength: 2000 },
        },
        required: ['name', 'category', 'plannedDate'],
      },
    },
  }, createMilestoneTracking);

  fastify.get('/milestones/:id', {
    schema: {
      tags: ['preparation'],
      summary: '获取里程碑跟踪详情',
      description: '根据ID获取里程碑跟踪详情',
    },
  }, getMilestoneTrackingById);

  fastify.put('/milestones/:id', {
    schema: {
      tags: ['preparation'],
      summary: '更新里程碑跟踪',
      description: '更新里程碑跟踪信息',
    },
  }, updateMilestoneTracking);

  fastify.delete('/milestones/:id', {
    schema: {
      tags: ['preparation'],
      summary: '删除里程碑跟踪',
      description: '删除指定的里程碑跟踪记录',
    },
  }, deleteMilestoneTracking);

  fastify.post('/milestones/:id/status', {
    schema: {
      tags: ['preparation'],
      summary: '更改里程碑状态',
      description: '更改里程碑跟踪的状态',
    },
  }, changeMilestoneStatus);

  fastify.get('/milestones/statistics', {
    schema: {
      tags: ['preparation'],
      summary: '获取里程碑跟踪统计数据',
      description: '获取里程碑跟踪的统计和分析数据',
    },
  }, getMilestoneStatistics);
};

export default preparationRoutes;