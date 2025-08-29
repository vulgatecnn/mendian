import type { FastifyInstance } from 'fastify';
import { storeFileController } from '@/controllers/v1/store-file.controller.js';
import { 
  requirePermission,
  requireBusinessAccess,
  requireFinanceAccess,
  requireAnyPermission 
} from '@/middleware/permission.middleware.js';

const storeFilesRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // 门店档案基础CRUD操作
  fastify.get('/', {
    preHandler: requirePermission('store-files:read'),
    schema: {
      tags: ['store-files'],
      summary: '获取门店档案列表',
      description: '支持分页、筛选、搜索和排序的门店档案列表查询',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          sortBy: { 
            type: 'string', 
            enum: ['createdAt', 'updatedAt', 'openDate', 'storeName', 'area', 'monthlyRevenue'],
            default: 'createdAt'
          },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          storeCode: { type: 'string' },
          storeName: { type: 'string' },
          storeType: { type: 'string', enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'] },
          status: { type: 'string', enum: ['PREPARING', 'OPEN', 'RENOVATING', 'SUSPENDED', 'CLOSED'] },
          entityId: { type: 'string' },
          keyword: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            code: { type: 'integer' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                pagination: { type: 'object' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, storeFileController.getList);

  fastify.get('/:id', {
    preHandler: requirePermission('store-files:read'),
    schema: {
      tags: ['store-files'],
      summary: '获取门店档案详情',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, storeFileController.getById);

  fastify.post('/', {
    preHandler: requirePermission('store-files:create'),
    schema: {
      tags: ['store-files'],
      summary: '创建门店档案',
      body: {
        type: 'object',
        required: ['entityId', 'storeCode', 'storeName', 'storeType', 'address'],
        properties: {
          candidateLocationId: { type: 'string' },
          entityId: { type: 'string' },
          storeCode: { type: 'string', maxLength: 50 },
          storeName: { type: 'string', maxLength: 200 },
          storeType: { type: 'string', enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'] },
          brandName: { type: 'string', maxLength: 100 },
          address: { type: 'string', maxLength: 500 },
          detailedAddress: { type: 'string', maxLength: 500 },
          area: { type: 'number', minimum: 0 },
          usableArea: { type: 'number', minimum: 0 },
          floors: { type: 'integer', minimum: 1 },
          seatCount: { type: 'integer', minimum: 1 },
          openDate: { type: 'string', format: 'date-time' },
          status: { 
            type: 'string', 
            enum: ['PREPARING', 'OPEN', 'RENOVATING', 'SUSPENDED', 'CLOSED'],
            default: 'PREPARING'
          },
          contactPhone: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          monthlyRevenue: { type: 'number', minimum: 0 },
          monthlyRent: { type: 'number', minimum: 0 },
          employeeCount: { type: 'integer', minimum: 0 },
          notes: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, storeFileController.create);

  fastify.put('/:id', {
    preHandler: requirePermission('store-files:update'),
    schema: {
      tags: ['store-files'],
      summary: '更新门店档案',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, storeFileController.update);

  fastify.delete('/:id', {
    preHandler: requirePermission('store-files:delete'),
    schema: {
      tags: ['store-files'],
      summary: '删除门店档案',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, storeFileController.delete);

  // 门店状态管理
  fastify.put('/:id/status', {
    preHandler: requirePermission('store-files:update-status'),
    schema: {
      tags: ['store-files'],
      summary: '更改门店状态',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['PREPARING', 'OPEN', 'RENOVATING', 'SUSPENDED', 'CLOSED'] },
          reason: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  }, storeFileController.changeStatus);

  fastify.post('/:id/open', {
    preHandler: requirePermission('store-files:open'),
    schema: {
      tags: ['store-files'],
      summary: '开业门店',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, storeFileController.openStore);

  fastify.post('/:id/suspend', {
    preHandler: requirePermission('store-files:suspend'),
    schema: {
      tags: ['store-files'],
      summary: '暂停营业',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, storeFileController.suspendStore);

  fastify.post('/:id/close', {
    preHandler: requirePermission('store-files:close'),
    schema: {
      tags: ['store-files'],
      summary: '关闭门店',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, storeFileController.closeStore);

  // 批量操作
  fastify.post('/batch', {
    preHandler: requireAnyPermission(['store-files:delete', 'store-files:update', 'store-files:export']),
    schema: {
      tags: ['store-files'],
      summary: '批量操作门店档案',
      body: {
        type: 'object',
        required: ['action', 'ids'],
        properties: {
          action: { type: 'string', enum: ['delete', 'updateStatus', 'updateTags', 'export'] },
          ids: { type: 'array', items: { type: 'string' }, minItems: 1 },
          data: { type: 'object' },
        },
      },
    },
  }, storeFileController.batchOperation);

  // 统计和分析
  fastify.get('/statistics', {
    preHandler: requireBusinessAccess,
    schema: {
      tags: ['store-files'],
      summary: '获取门店统计数据',
      querystring: {
        type: 'object',
        properties: {
          year: { type: 'integer', minimum: 2020, maximum: 2030 },
          month: { type: 'integer', minimum: 1, maximum: 12 },
          quarter: { type: 'integer', minimum: 1, maximum: 4 },
          storeType: { type: 'string', enum: ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP'] },
          entityId: { type: 'string' },
          status: { type: 'string', enum: ['PREPARING', 'OPEN', 'RENOVATING', 'SUSPENDED', 'CLOSED'] },
          groupBy: { 
            type: 'string', 
            enum: ['storeType', 'status', 'entity', 'month', 'quarter'],
            default: 'status'
          },
        },
      },
    },
  }, storeFileController.getStatistics);

  fastify.get('/progress', {
    preHandler: requireBusinessAccess,
    schema: {
      tags: ['store-files'],
      summary: '获取门店进度数据',
    },
  }, storeFileController.getProgress);

  fastify.get('/summary', {
    preHandler: requireBusinessAccess,
    schema: {
      tags: ['store-files'],
      summary: '获取门店汇总信息',
    },
  }, storeFileController.getSummary);

  // 数据导出
  fastify.post('/export', {
    preHandler: requirePermission('store-files:export'),
    schema: {
      tags: ['store-files'],
      summary: '导出门店档案数据',
      body: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['xlsx', 'csv'], default: 'xlsx' },
          filters: { type: 'object' },
          fields: { type: 'array', items: { type: 'string' } },
          includeRelations: { type: 'boolean', default: false },
        },
      },
    },
  }, storeFileController.exportData);

  // 证照管理
  fastify.get('/:id/documents', {
    preHandler: requirePermission('store-files:read-documents'),
    schema: {
      tags: ['store-files'],
      summary: '获取门店证照文档',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, storeFileController.getDocuments);

  fastify.post('/:id/documents', {
    preHandler: requirePermission('store-files:upload-documents'),
    schema: {
      tags: ['store-files'],
      summary: '上传门店证照文档',
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
          documents: { type: 'object' },
        },
      },
    },
  }, storeFileController.uploadDocuments);

  fastify.delete('/:id/documents/:documentId', {
    preHandler: requirePermission('store-files:delete-documents'),
    schema: {
      tags: ['store-files'],
      summary: '删除门店证照文档',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          documentId: { type: 'string' },
        },
        required: ['id', 'documentId'],
      },
    },
  }, storeFileController.deleteDocument);
};

export default storeFilesRoutes;