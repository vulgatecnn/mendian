/**
 * 拓店管理路由配置
 * 定义所有拓店相关的API路由
 */
import { FastifyInstance } from 'fastify'
import { expansionController } from '../controllers/expansion.controller.js'

async function expansionRoutes(fastify: FastifyInstance) {
  // 路由前缀
  fastify.register(async function (fastify) {
    // 健康检查
    fastify.get('/health', expansionController.healthCheck)

    // ===============================
    // 候选点位管理路由
    // ===============================
    
    // 获取候选点位列表
    fastify.get('/candidates', {
      schema: {
        description: '获取候选点位列表',
        tags: ['expansion'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            sortBy: { type: 'string', enum: ['createdAt', 'discoveryDate', 'evaluationScore', 'rentPrice'], default: 'createdAt' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            storePlanId: { type: 'string' },
            regionId: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            minArea: { type: 'number' },
            maxArea: { type: 'number' },
            minRent: { type: 'number' },
            maxRent: { type: 'number' },
            minScore: { type: 'number', minimum: 0, maximum: 10 },
            maxScore: { type: 'number', minimum: 0, maximum: 10 },
            discoveryDateStart: { type: 'string', format: 'date' },
            discoveryDateEnd: { type: 'string', format: 'date' },
            keyword: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  items: { type: 'array' },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      total: { type: 'integer' },
                      totalPages: { type: 'integer' },
                      hasNext: { type: 'boolean' },
                      hasPrev: { type: 'boolean' }
                    }
                  }
                }
              },
              message: { type: 'string' }
            }
          }
        }
      }
    }, expansionController.getCandidateLocationList)

    // 获取候选点位详情
    fastify.get('/candidates/:id', {
      schema: {
        description: '获取候选点位详情',
        tags: ['expansion'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    }, expansionController.getCandidateLocationById)

    // 创建候选点位
    fastify.post('/candidates', {
      schema: {
        description: '创建候选点位',
        tags: ['expansion'],
        body: {
          type: 'object',
          required: ['regionId', 'name', 'address'],
          properties: {
            storePlanId: { type: 'string' },
            regionId: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            detailedAddress: { type: 'string' },
            area: { type: 'number' },
            usableArea: { type: 'number' },
            rentPrice: { type: 'number' },
            rentUnit: { type: 'string', enum: ['month', 'day', 'year'] },
            depositAmount: { type: 'number' },
            transferFee: { type: 'number' },
            propertyFee: { type: 'number' },
            landlordName: { type: 'string' },
            landlordPhone: { type: 'string' },
            landlordEmail: { type: 'string' },
            intermediaryInfo: { type: 'string' },
            coordinates: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
            floorPlan: { type: 'array', items: { type: 'string' } },
            trafficInfo: { type: 'string' },
            competitorInfo: { type: 'array', items: { type: 'string' } },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
            expectedSignDate: { type: 'string', format: 'date' },
            notes: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }, expansionController.createCandidateLocation)

    // 更新候选点位
    fastify.put('/candidates/:id', {
      schema: {
        description: '更新候选点位',
        tags: ['expansion'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            storePlanId: { type: 'string' },
            name: { type: 'string' },
            address: { type: 'string' },
            detailedAddress: { type: 'string' },
            area: { type: 'number' },
            usableArea: { type: 'number' },
            rentPrice: { type: 'number' },
            rentUnit: { type: 'string', enum: ['month', 'day', 'year'] },
            depositAmount: { type: 'number' },
            transferFee: { type: 'number' },
            propertyFee: { type: 'number' },
            landlordName: { type: 'string' },
            landlordPhone: { type: 'string' },
            landlordEmail: { type: 'string' },
            intermediaryInfo: { type: 'string' },
            coordinates: { type: 'string' },
            photos: { type: 'array', items: { type: 'string' } },
            floorPlan: { type: 'array', items: { type: 'string' } },
            trafficInfo: { type: 'string' },
            competitorInfo: { type: 'array', items: { type: 'string' } },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            expectedSignDate: { type: 'string', format: 'date' },
            notes: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }, expansionController.updateCandidateLocation)

    // 删除候选点位
    fastify.delete('/candidates/:id', {
      schema: {
        description: '删除候选点位',
        tags: ['expansion'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    }, expansionController.deleteCandidateLocation)

    // 变更候选点位状态
    fastify.put('/candidates/:id/status', {
      schema: {
        description: '变更候选点位状态',
        tags: ['expansion'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'] },
            reason: { type: 'string' },
            comments: { type: 'string' }
          }
        }
      }
    }, expansionController.changeCandidateLocationStatus)

    // 更新候选点位评分
    fastify.put('/candidates/:id/score', {
      schema: {
        description: '更新候选点位评分',
        tags: ['expansion'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            evaluationScore: { type: 'number', minimum: 0, maximum: 10 },
            evaluationCriteria: {
              type: 'object',
              properties: {
                location: { type: 'number', minimum: 0, maximum: 10 },
                traffic: { type: 'number', minimum: 0, maximum: 10 },
                competition: { type: 'number', minimum: 0, maximum: 10 },
                cost: { type: 'number', minimum: 0, maximum: 10 },
                potential: { type: 'number', minimum: 0, maximum: 10 }
              }
            },
            evaluationComments: { type: 'string' }
          }
        }
      }
    }, expansionController.updateCandidateLocationScore)

    // ===============================
    // 跟进记录管理路由
    // ===============================
    
    // 获取跟进记录列表
    fastify.get('/follow-ups', {
      schema: {
        description: '获取跟进记录列表',
        tags: ['expansion', 'follow-up'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            sortBy: { type: 'string', enum: ['createdAt', 'nextFollowUpDate', 'actualFollowUpDate'], default: 'createdAt' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            candidateLocationId: { type: 'string' },
            assigneeId: { type: 'string' },
            type: { type: 'string', enum: ['PHONE_CALL', 'SITE_VISIT', 'NEGOTIATION', 'DOCUMENTATION', 'OTHER'] },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            importance: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            nextFollowUpDateStart: { type: 'string', format: 'date' },
            nextFollowUpDateEnd: { type: 'string', format: 'date' },
            keyword: { type: 'string' }
          }
        }
      }
    }, expansionController.getFollowUpRecordList)

    // 获取跟进记录详情
    fastify.get('/follow-ups/:id', {
      schema: {
        description: '获取跟进记录详情',
        tags: ['expansion', 'follow-up'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    }, expansionController.getFollowUpRecordById)

    // 创建跟进记录
    fastify.post('/follow-ups', {
      schema: {
        description: '创建跟进记录',
        tags: ['expansion', 'follow-up'],
        body: {
          type: 'object',
          required: ['candidateLocationId', 'assigneeId', 'type', 'title', 'content'],
          properties: {
            candidateLocationId: { type: 'string' },
            assigneeId: { type: 'string' },
            type: { type: 'string', enum: ['PHONE_CALL', 'SITE_VISIT', 'NEGOTIATION', 'DOCUMENTATION', 'OTHER'] },
            title: { type: 'string' },
            content: { type: 'string' },
            result: { type: 'string' },
            nextFollowUpDate: { type: 'string', format: 'date-time' },
            actualFollowUpDate: { type: 'string', format: 'date-time' },
            duration: { type: 'integer' },
            cost: { type: 'number' },
            importance: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
            attachments: { type: 'array', items: { type: 'string' } },
            location: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }, expansionController.createFollowUpRecord)

    // 更新跟进记录
    fastify.put('/follow-ups/:id', {
      schema: {
        description: '更新跟进记录',
        tags: ['expansion', 'follow-up'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            result: { type: 'string' },
            nextFollowUpDate: { type: 'string', format: 'date-time' },
            actualFollowUpDate: { type: 'string', format: 'date-time' },
            duration: { type: 'integer' },
            cost: { type: 'number' },
            importance: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            attachments: { type: 'array', items: { type: 'string' } },
            location: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }, expansionController.updateFollowUpRecord)

    // 删除跟进记录
    fastify.delete('/follow-ups/:id', {
      schema: {
        description: '删除跟进记录',
        tags: ['expansion', 'follow-up'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    }, expansionController.deleteFollowUpRecord)

    // ===============================
    // 批量操作路由
    // ===============================
    
    // 批量操作候选点位
    fastify.post('/candidates/batch', {
      schema: {
        description: '批量操作候选点位',
        tags: ['expansion'],
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
                priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                assigneeId: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    }, expansionController.batchOperationCandidateLocations)

    // ===============================
    // 地图数据路由
    // ===============================
    
    // 获取地图数据
    fastify.get('/map', {
      schema: {
        description: '获取地图数据',
        tags: ['expansion', 'map'],
        querystring: {
          type: 'object',
          properties: {
            regionId: { type: 'string' },
            bounds: {
              type: 'object',
              properties: {
                northeast: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' }
                  }
                },
                southwest: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }, expansionController.getMapData)

    // ===============================
    // 统计分析路由
    // ===============================
    
    // 获取拓店统计数据
    fastify.get('/statistics', {
      schema: {
        description: '获取拓店统计数据',
        tags: ['expansion', 'analytics'],
        querystring: {
          type: 'object',
          properties: {
            regionIds: { type: 'array', items: { type: 'string' } },
            storePlanIds: { type: 'array', items: { type: 'string' } },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date' },
                end: { type: 'string', format: 'date' }
              }
            }
          }
        }
      }
    }, expansionController.getExpansionStatistics)

    // 获取跟进统计数据
    fastify.get('/statistics/follow-up', {
      schema: {
        description: '获取跟进统计数据',
        tags: ['expansion', 'analytics'],
        querystring: {
          type: 'object',
          properties: {
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date' },
                end: { type: 'string', format: 'date' }
              }
            }
          }
        }
      }
    }, expansionController.getFollowUpStatistics)

    // 获取拓店进度数据
    fastify.get('/progress', {
      schema: {
        description: '获取拓店进度数据',
        tags: ['expansion', 'analytics']
      }
    }, expansionController.getExpansionProgress)

    // 获取拓店仪表板数据
    fastify.get('/dashboard', {
      schema: {
        description: '获取拓店仪表板数据',
        tags: ['expansion', 'analytics']
      }
    }, expansionController.getExpansionDashboard)

    // ===============================
    // 数据导出路由
    // ===============================
    
    // 导出候选点位数据
    fastify.post('/export/candidates', {
      schema: {
        description: '导出候选点位数据',
        tags: ['expansion', 'export'],
        body: {
          type: 'object',
          required: ['format'],
          properties: {
            format: { type: 'string', enum: ['csv', 'xlsx'] },
            filters: {
              type: 'object',
              properties: {
                storePlanId: { type: 'string' },
                regionId: { type: 'string' },
                status: { type: 'string', enum: ['PENDING', 'EVALUATING', 'FOLLOWING', 'NEGOTIATING', 'CONTRACTED', 'REJECTED', 'SUSPENDED'] },
                priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] }
              }
            },
            columns: { type: 'array', items: { type: 'string' } },
            includeFollowUpRecords: { type: 'boolean', default: false }
          }
        }
      }
    }, expansionController.exportCandidateLocationData)

  }, { prefix: '/api/v1/expansion' })
}

export default expansionRoutes