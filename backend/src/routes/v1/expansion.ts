/**
 * 拓店管理路由配置
 * 包含候选点位管理、跟进记录管理、地图数据、统计分析等完整API端点
 */
import type { FastifyInstance } from 'fastify';
import { expansionController } from '@/controllers/v1/expansion.controller.js';

const expansionRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // ===============================
  // 候选点位管理路由
  // ===============================

  // 获取候选点位列表
  fastify.get('/candidate-locations', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取候选点位列表',
      description: '支持分页、排序、筛选的候选点位列表查询',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          sortBy: { 
            type: 'string', 
            enum: ['discoveryDate', 'evaluationScore', 'rentPrice', 'area', 'priority', 'status', 'createdAt', 'updatedAt'],
            default: 'createdAt'
          },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          storePlanId: { type: 'string' },
          regionId: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'] },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
          minArea: { type: 'number', minimum: 0 },
          maxArea: { type: 'number', minimum: 0 },
          minRent: { type: 'number', minimum: 0 },
          maxRent: { type: 'number', minimum: 0 },
          minScore: { type: 'number', minimum: 0, maximum: 10 },
          maxScore: { type: 'number', minimum: 0, maximum: 10 },
          discoveryDateStart: { type: 'string', format: 'date-time' },
          discoveryDateEnd: { type: 'string', format: 'date-time' },
          keyword: { type: 'string', maxLength: 100 },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, expansionController.getCandidateLocationList);

  // 创建候选点位
  fastify.post('/candidate-locations', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '创建候选点位',
      description: '添加新的候选点位',
      body: {
        type: 'object',
        required: ['regionId', 'name', 'address'],
        properties: {
          storePlanId: { type: 'string' },
          regionId: { type: 'string' },
          name: { type: 'string', minLength: 2, maxLength: 200 },
          address: { type: 'string', minLength: 5, maxLength: 500 },
          detailedAddress: { type: 'string', maxLength: 500 },
          area: { type: 'number', minimum: 0, maximum: 100000 },
          usableArea: { type: 'number', minimum: 0, maximum: 100000 },
          rentPrice: { type: 'number', minimum: 0, maximum: 1000000 },
          rentUnit: { type: 'string', maxLength: 50 },
          depositAmount: { type: 'number', minimum: 0, maximum: 10000000 },
          transferFee: { type: 'number', minimum: 0, maximum: 10000000 },
          propertyFee: { type: 'number', minimum: 0, maximum: 100000 },
          landlordName: { type: 'string', maxLength: 50 },
          landlordPhone: { type: 'string', pattern: '^1[3-9]\\d{9}$' },
          landlordEmail: { type: 'string', format: 'email' },
          coordinates: { type: 'string', maxLength: 50 },
          photos: { type: 'array', items: { type: 'string', format: 'uri' } },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
          expectedSignDate: { type: 'string', format: 'date-time' },
          notes: { type: 'string', maxLength: 2000 },
          tags: { type: 'array', items: { type: 'string', maxLength: 20 }, maxItems: 10 },
        },
      },
    },
  }, expansionController.createCandidateLocation);

  // 获取候选点位详情
  fastify.get('/candidate-locations/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取候选点位详情',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, expansionController.getCandidateLocationById);

  // 更新候选点位
  fastify.put('/candidate-locations/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '更新候选点位',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          storePlanId: { type: 'string' },
          name: { type: 'string', minLength: 2, maxLength: 200 },
          address: { type: 'string', minLength: 5, maxLength: 500 },
          detailedAddress: { type: 'string', maxLength: 500 },
          area: { type: 'number', minimum: 0, maximum: 100000 },
          usableArea: { type: 'number', minimum: 0, maximum: 100000 },
          rentPrice: { type: 'number', minimum: 0, maximum: 1000000 },
          rentUnit: { type: 'string', maxLength: 50 },
          depositAmount: { type: 'number', minimum: 0, maximum: 10000000 },
          transferFee: { type: 'number', minimum: 0, maximum: 10000000 },
          propertyFee: { type: 'number', minimum: 0, maximum: 100000 },
          landlordName: { type: 'string', maxLength: 50 },
          landlordPhone: { type: 'string', pattern: '^1[3-9]\\d{9}$' },
          landlordEmail: { type: 'string', format: 'email' },
          coordinates: { type: 'string', maxLength: 50 },
          photos: { type: 'array', items: { type: 'string', format: 'uri' } },
          priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
          expectedSignDate: { type: 'string', format: 'date-time' },
          notes: { type: 'string', maxLength: 2000 },
          tags: { type: 'array', items: { type: 'string', maxLength: 20 }, maxItems: 10 },
        },
      },
    },
  }, expansionController.updateCandidateLocation);

  // 删除候选点位
  fastify.delete('/candidate-locations/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '删除候选点位',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, expansionController.deleteCandidateLocation);

  // 变更候选点位状态
  fastify.post('/candidate-locations/:id/status', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '变更候选点位状态',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'] },
          reason: { type: 'string', maxLength: 500 },
          comments: { type: 'string', maxLength: 1000 },
        },
      },
    },
  }, expansionController.changeCandidateLocationStatus);

  // 更新候选点位评分
  fastify.post('/candidate-locations/:id/score', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '更新候选点位评分',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['evaluationScore'],
        properties: {
          evaluationScore: { type: 'number', minimum: 0, maximum: 10 },
          evaluationComments: { type: 'string', maxLength: 1000 },
          evaluationCriteria: {
            type: 'object',
            properties: {
              location: { type: 'number', minimum: 0, maximum: 10 },
              traffic: { type: 'number', minimum: 0, maximum: 10 },
              competition: { type: 'number', minimum: 0, maximum: 10 },
              cost: { type: 'number', minimum: 0, maximum: 10 },
              potential: { type: 'number', minimum: 0, maximum: 10 },
            },
          },
        },
      },
    },
  }, expansionController.updateCandidateLocationScore);

  // 批量操作候选点位
  fastify.post('/candidate-locations/batch', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '批量操作候选点位',
      body: {
        type: 'object',
        required: ['ids', 'action'],
        properties: {
          ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
          action: { type: 'string', enum: ['delete', 'changeStatus', 'changePriority', 'assignFollowUp'] },
          actionData: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'] },
              priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
              assigneeId: { type: 'string' },
              reason: { type: 'string', maxLength: 500 },
            },
          },
        },
      },
    },
  }, expansionController.batchOperationCandidateLocations);

  // 快速操作端点
  fastify.post('/candidate-locations/:id/start-following', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '开始跟进候选点位',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, expansionController.startFollowing);

  fastify.post('/candidate-locations/:id/start-negotiation', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '开始商务谈判',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, expansionController.startNegotiation);

  fastify.post('/candidate-locations/:id/sign-contract', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '签约候选点位',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500 },
          comments: { type: 'string', maxLength: 1000 },
        },
      },
    },
  }, expansionController.signContract);

  // ===============================
  // 跟进记录管理路由
  // ===============================

  // 获取跟进记录列表
  fastify.get('/follow-up-records', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取跟进记录列表',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          sortBy: { 
            type: 'string', 
            enum: ['createdAt', 'nextFollowUpDate', 'actualFollowUpDate', 'importance', 'status', 'type'],
            default: 'createdAt'
          },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          candidateLocationId: { type: 'string' },
          assigneeId: { type: 'string' },
          type: { type: 'string', enum: ['PHONE_CALL', 'SITE_VISIT', 'NEGOTIATION', 'EMAIL', 'MEETING', 'DOCUMENTATION', 'OTHER'] },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'] },
          importance: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          nextFollowUpDateStart: { type: 'string', format: 'date-time' },
          nextFollowUpDateEnd: { type: 'string', format: 'date-time' },
          keyword: { type: 'string', maxLength: 100 },
        },
      },
    },
  }, expansionController.getFollowUpRecordList);

  // 获取候选点位的跟进时间线
  fastify.get('/candidate-locations/:id/timeline', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取候选点位跟进时间线',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 100 },
        },
      },
    },
  }, expansionController.getCandidateLocationTimeline);

  // 创建跟进记录
  fastify.post('/follow-up-records', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '创建跟进记录',
      body: {
        type: 'object',
        required: ['candidateLocationId', 'assigneeId', 'type', 'title', 'content'],
        properties: {
          candidateLocationId: { type: 'string' },
          assigneeId: { type: 'string' },
          type: { type: 'string', enum: ['PHONE_CALL', 'SITE_VISIT', 'NEGOTIATION', 'EMAIL', 'MEETING', 'DOCUMENTATION', 'OTHER'] },
          title: { type: 'string', minLength: 2, maxLength: 200 },
          content: { type: 'string', minLength: 5, maxLength: 5000 },
          result: { type: 'string', maxLength: 2000 },
          nextFollowUpDate: { type: 'string', format: 'date-time' },
          actualFollowUpDate: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 0, maximum: 1440 },
          cost: { type: 'number', minimum: 0, maximum: 100000 },
          importance: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
          attachments: { type: 'array', items: { type: 'string', format: 'uri' } },
          location: { type: 'string', maxLength: 200 },
          participants: { type: 'array', items: { type: 'string' }, maxItems: 20 },
          tags: { type: 'array', items: { type: 'string', maxLength: 20 }, maxItems: 10 },
        },
      },
    },
  }, expansionController.createFollowUpRecord);

  // 获取跟进记录详情
  fastify.get('/follow-up-records/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取跟进记录详情',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, expansionController.getFollowUpRecordById);

  // 更新跟进记录
  fastify.put('/follow-up-records/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '更新跟进记录',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 2, maxLength: 200 },
          content: { type: 'string', minLength: 5, maxLength: 5000 },
          result: { type: 'string', maxLength: 2000 },
          nextFollowUpDate: { type: 'string', format: 'date-time' },
          actualFollowUpDate: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', minimum: 0, maximum: 1440 },
          cost: { type: 'number', minimum: 0, maximum: 100000 },
          importance: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
          status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'] },
          attachments: { type: 'array', items: { type: 'string', format: 'uri' } },
          location: { type: 'string', maxLength: 200 },
          participants: { type: 'array', items: { type: 'string' }, maxItems: 20 },
          tags: { type: 'array', items: { type: 'string', maxLength: 20 }, maxItems: 10 },
        },
      },
    },
  }, expansionController.updateFollowUpRecord);

  // 删除跟进记录
  fastify.delete('/follow-up-records/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '删除跟进记录',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, expansionController.deleteFollowUpRecord);

  // 完成跟进记录
  fastify.post('/follow-up-records/:id/complete', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '完成跟进记录',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          result: { type: 'string', maxLength: 2000 },
          duration: { type: 'integer', minimum: 0, maximum: 1440 },
          cost: { type: 'number', minimum: 0, maximum: 100000 },
          attachments: { type: 'array', items: { type: 'string', format: 'uri' } },
        },
      },
    },
  }, expansionController.completeFollowUpRecord);

  // 获取我的待办任务
  fastify.get('/expansion/my-tasks', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取我的待办跟进任务',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        },
      },
    },
  }, expansionController.getMyTasks);

  // ===============================
  // 地图数据服务路由
  // ===============================

  fastify.get('/expansion/map-data', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取地图数据',
      querystring: {
        type: 'object',
        properties: {
          regionId: { type: 'string' },
          zoom: { type: 'integer', minimum: 1, maximum: 20 },
          bounds: {
            type: 'object',
            properties: {
              northeast: {
                type: 'object',
                required: ['latitude', 'longitude'],
                properties: {
                  latitude: { type: 'number', minimum: -90, maximum: 90 },
                  longitude: { type: 'number', minimum: -180, maximum: 180 },
                },
              },
              southwest: {
                type: 'object',
                required: ['latitude', 'longitude'],
                properties: {
                  latitude: { type: 'number', minimum: -90, maximum: 90 },
                  longitude: { type: 'number', minimum: -180, maximum: 180 },
                },
              },
            },
          },
        },
      },
    },
  }, expansionController.getMapData);

  // ===============================
  // 统计分析服务路由
  // ===============================

  fastify.get('/expansion/statistics', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取拓店统计数据',
      querystring: {
        type: 'object',
        properties: {
          regionIds: { type: 'array', items: { type: 'string' } },
          storePlanIds: { type: 'array', items: { type: 'string' } },
          dateRange: {
            type: 'object',
            required: ['start', 'end'],
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' },
            },
          },
          groupBy: { type: 'string', enum: ['region', 'status', 'priority', 'month'] },
        },
      },
    },
  }, expansionController.getExpansionStatistics);

  fastify.get('/expansion/follow-up-statistics', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取跟进统计数据',
      querystring: {
        type: 'object',
        properties: {
          regionIds: { type: 'array', items: { type: 'string' } },
          storePlanIds: { type: 'array', items: { type: 'string' } },
          dateRange: {
            type: 'object',
            required: ['start', 'end'],
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' },
            },
          },
          groupBy: { type: 'string', enum: ['region', 'status', 'priority', 'month'] },
        },
      },
    },
  }, expansionController.getFollowUpStatistics);

  fastify.get('/expansion/progress', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取拓店进度数据',
    },
  }, expansionController.getExpansionProgress);

  fastify.get('/expansion/dashboard', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '获取拓店仪表板数据',
    },
  }, expansionController.getExpansionDashboard);

  // ===============================
  // 数据导出服务路由
  // ===============================

  fastify.post('/expansion/export', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['expansion'],
      summary: '导出候选点位数据',
      body: {
        type: 'object',
        required: ['format'],
        properties: {
          format: { type: 'string', enum: ['xlsx', 'csv'] },
          columns: { type: 'array', items: { type: 'string' } },
          includeFollowUpRecords: { type: 'boolean', default: false },
          filters: {
            type: 'object',
            properties: {
              storePlanId: { type: 'string' },
              regionId: { type: 'string' },
              status: { type: 'string', enum: ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'] },
              priority: { type: 'string', enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] },
              minArea: { type: 'number', minimum: 0 },
              maxArea: { type: 'number', minimum: 0 },
              minRent: { type: 'number', minimum: 0 },
              maxRent: { type: 'number', minimum: 0 },
              minScore: { type: 'number', minimum: 0, maximum: 10 },
              maxScore: { type: 'number', minimum: 0, maximum: 10 },
              discoveryDateStart: { type: 'string', format: 'date-time' },
              discoveryDateEnd: { type: 'string', format: 'date-time' },
              keyword: { type: 'string', maxLength: 100 },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  }, expansionController.exportCandidateLocationData);
};

export default expansionRoutes;