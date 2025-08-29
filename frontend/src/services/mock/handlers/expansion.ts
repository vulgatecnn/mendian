// 拓店管理Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'
import type { CandidateLocation } from '../../types'

export class ExpansionMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 获取候选点位列表
      http.get(`${this.config.baseUrl}/expansion/candidates`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const name = url.searchParams.get('name')
        const status = url.searchParams.get('status')

        let data = MockDataStore.getInstance().getData<CandidateLocation>('candidateLocations')

        // 应用过滤器
        if (name) {
          data = data.filter(item => item.name.includes(name))
        }
        if (status) {
          data = data.filter(item => item.status === status)
        }

        const paginatedData = MockUtils.paginate(data, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, data.length)
        )
      }),

      // 获取候选点位详情
      http.get(`${this.config.baseUrl}/expansion/candidates/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const data = MockDataStore.getInstance().getData<CandidateLocation>('candidateLocations')
        const item = data.find(item => item.id === id)

        if (!item) {
          return HttpResponse.json(MockResponse.error('候选点位不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(item))
      }),

      // 创建候选点位
      http.post(`${this.config.baseUrl}/expansion/candidates`, async ({ request }) => {
        await MockUtils.delay()

        const body = await request.json()

        const newLocation: CandidateLocation = {
          ...body,
          id: MockUtils.generateId(),
          status: 'available',
          nearbyCompetitors: [],
          followUps: [],
          businessConditions: [],
          evaluation: {
            overallScore: Math.floor(Math.random() * 40) + 60,
            locationScore: Math.floor(Math.random() * 40) + 60,
            trafficScore: Math.floor(Math.random() * 40) + 60,
            competitionScore: Math.floor(Math.random() * 40) + 60,
            rentabilityScore: Math.floor(Math.random() * 40) + 60,
            evaluatedBy: MockUtils.generateId(),
            evaluatedByName: MockUtils.generateChineseName(),
            evaluatedAt: new Date().toISOString()
          },
          discoveredBy: MockUtils.generateId(),
          discoveredByName: MockUtils.generateChineseName(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        MockDataStore.getInstance().addData('candidateLocations', newLocation)

        return HttpResponse.json(MockResponse.success(newLocation, '候选点位创建成功'))
      }),

      // 更新候选点位
      http.put(`${this.config.baseUrl}/expansion/candidates/:id`, async ({ params, request }) => {
        await MockUtils.delay()

        const { id } = params
        const body = await request.json()

        const updatedItem = MockDataStore.getInstance().updateData<CandidateLocation>(
          'candidateLocations',
          id as string,
          body
        )

        if (!updatedItem) {
          return HttpResponse.json(MockResponse.error('候选点位不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(updatedItem, '更新成功'))
      }),

      // 删除候选点位
      http.delete(`${this.config.baseUrl}/expansion/candidates/:id`, async ({ params }) => {
        await MockUtils.delay()

        const { id } = params
        const deleted = MockDataStore.getInstance().deleteData('candidateLocations', id as string)

        if (!deleted) {
          return HttpResponse.json(MockResponse.error('候选点位不存在', 404), { status: 404 })
        }

        return HttpResponse.json(MockResponse.success(null, '删除成功'))
      }),

      // 获取拓店统计
      http.get(`${this.config.baseUrl}/expansion/stats`, async () => {
        await MockUtils.delay()

        const data = MockDataStore.getInstance().getData<CandidateLocation>('candidateLocations')

        const stats = {
          total: data.length,
          byStatus: {
            available: data.filter(item => item.status === 'available').length,
            negotiating: data.filter(item => item.status === 'negotiating').length,
            reserved: data.filter(item => item.status === 'reserved').length,
            signed: data.filter(item => item.status === 'signed').length,
            rejected: data.filter(item => item.status === 'rejected').length
          },
          byPropertyType: {
            commercial: data.filter(item => item.propertyType === 'commercial').length,
            residential: data.filter(item => item.propertyType === 'residential').length,
            mixed: data.filter(item => item.propertyType === 'mixed').length
          },
          byRegion: data.reduce(
            (acc, item) => {
              const regionName = item.location.city || '其他'
              acc[regionName] = (acc[regionName] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          timeline: Array.from({ length: 12 }, (_, i) => ({
            date: `2024-${String(i + 1).padStart(2, '0')}`,
            discovered: Math.floor(Math.random() * 10),
            signed: Math.floor(Math.random() * 3)
          })),
          averageRent: data.reduce((sum, item) => sum + item.rentPrice, 0) / data.length,
          averageArea: data.reduce((sum, item) => sum + item.area, 0) / data.length,
          averageEvaluationScore:
            data.reduce((sum, item) => sum + item.evaluation.overallScore, 0) / data.length
        }

        return HttpResponse.json(MockResponse.success(stats))
      }),

      // 获取选项数据
      http.get(`${this.config.baseUrl}/expansion/options`, async () => {
        await MockUtils.delay()

        const regions = MockDataStore.getInstance().getData('regions')
        const users = MockDataStore.getInstance().getData('users')

        const options = {
          regions: regions.map((r: any) => ({ id: r.id, name: r.name, code: r.code })),
          propertyTypes: [
            { value: 'commercial', label: '商业' },
            { value: 'residential', label: '住宅' },
            { value: 'mixed', label: '综合' }
          ],
          statuses: [
            { value: 'available', label: '可用' },
            { value: 'negotiating', label: '谈判中' },
            { value: 'reserved', label: '已预定' },
            { value: 'signed', label: '已签约' },
            { value: 'rejected', label: '已拒绝' }
          ],
          followUpTypes: [
            { value: 'call', label: '电话联系' },
            { value: 'visit', label: '实地考察' },
            { value: 'meeting', label: '会议沟通' },
            { value: 'negotiation', label: '商务谈判' },
            { value: 'other', label: '其他' }
          ],
          businessConditionTypes: [
            { value: 'rent', label: '租金' },
            { value: 'transfer', label: '转让费' },
            { value: 'decoration', label: '装修费' },
            { value: 'other', label: '其他' }
          ],
          businessConditionStatuses: [
            { value: 'proposed', label: '已提出' },
            { value: 'negotiating', label: '谈判中' },
            { value: 'agreed', label: '已同意' },
            { value: 'rejected', label: '已拒绝' }
          ],
          users: users.map((u: any) => ({ id: u.id, name: u.name, department: u.department.name }))
        }

        return HttpResponse.json(MockResponse.success(options))
      })
    ]
  }
}
