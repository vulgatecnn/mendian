// 认证相关Mock处理器
import { http, HttpResponse } from 'msw'
import { BaseMockHandler, MockResponse, MockUtils } from '../config'
import { MockDataStore } from '../data'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserProfileResponse
} from '../../types'

export class AuthMockHandler extends BaseMockHandler {
  getHandlers() {
    return [
      // 用户登录
      http.post(`${this.config.baseUrl}/auth/login`, async ({ request }) => {
        await MockUtils.delay()

        if (MockUtils.shouldReturnError()) {
          return HttpResponse.json(MockResponse.error('网络连接失败', 500), { status: 500 })
        }

        const body = (await request.json()) as LoginRequest
        const { username, password } = body

        // 模拟登录验证
        if (!username || !password) {
          return HttpResponse.json(
            MockResponse.validationError([
              { field: 'username', message: '用户名不能为空' },
              { field: 'password', message: '密码不能为空' }
            ]),
            { status: 422 }
          )
        }

        if (password === 'wrong') {
          return HttpResponse.json(MockResponse.error('用户名或密码错误', 401), { status: 401 })
        }

        // 获取用户数据
        const users = MockDataStore.getInstance().getData('users')
        const user = users.find((u: any) => u.username === username) || users[0]

        const response: LoginResponse = {
          accessToken: `mock_access_token_${MockUtils.generateId()}`,
          refreshToken: `mock_refresh_token_${MockUtils.generateId()}`,
          expiresIn: 7200, // 2小时
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            roles: user.roles.map((r: any) => r.code),
            permissions: user.permissions
          }
        }

        return HttpResponse.json(MockResponse.success(response, '登录成功'))
      }),

      // 用户登出
      http.post(`${this.config.baseUrl}/auth/logout`, async () => {
        await MockUtils.delay()
        return HttpResponse.json(MockResponse.success(null, '登出成功'))
      }),

      // 刷新Token
      http.post(`${this.config.baseUrl}/auth/refresh`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as RefreshTokenRequest

        if (!body.refreshToken) {
          return HttpResponse.json(MockResponse.error('刷新令牌无效', 401), { status: 401 })
        }

        const response: RefreshTokenResponse = {
          accessToken: `mock_access_token_${MockUtils.generateId()}`,
          expiresIn: 7200
        }

        return HttpResponse.json(MockResponse.success(response))
      }),

      // 获取用户信息
      http.get(`${this.config.baseUrl}/auth/user`, async ({ request }) => {
        await MockUtils.delay()

        const token = request.headers.get('Authorization')
        if (!token) {
          return HttpResponse.json(MockResponse.error('未授权访问', 401), { status: 401 })
        }

        // 获取用户数据
        const users = MockDataStore.getInstance().getData('users')
        const user = users[0] // 模拟当前用户

        const response: UserProfileResponse = {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          department: user.department,
          roles: user.roles,
          permissions: user.permissions,
          lastLoginAt: new Date().toISOString(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }

        return HttpResponse.json(MockResponse.success(response))
      }),

      // 获取用户权限
      http.get(`${this.config.baseUrl}/auth/permissions`, async ({ request }) => {
        await MockUtils.delay()

        const token = request.headers.get('Authorization')
        if (!token) {
          return HttpResponse.json(MockResponse.error('未授权访问', 401), { status: 401 })
        }

        const users = MockDataStore.getInstance().getData('users')
        const user = users[0]

        return HttpResponse.json(MockResponse.success(user.permissions))
      }),

      // 检查权限
      http.post(`${this.config.baseUrl}/auth/permissions/check`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as { permissions: string[] }
        const users = MockDataStore.getInstance().getData('users')
        const user = users[0]

        const hasAllPermissions = body.permissions.every(p => user.permissions.includes(p))
        const missingPermissions = body.permissions.filter(p => !user.permissions.includes(p))

        return HttpResponse.json(
          MockResponse.success({
            hasPermission: hasAllPermissions,
            permissions: user.permissions,
            missingPermissions: hasAllPermissions ? undefined : missingPermissions
          })
        )
      }),

      // 获取用户菜单
      http.get(`${this.config.baseUrl}/auth/menus`, async ({ request }) => {
        await MockUtils.delay()

        const token = request.headers.get('Authorization')
        if (!token) {
          return HttpResponse.json(MockResponse.error('未授权访问', 401), { status: 401 })
        }

        // 模拟菜单数据
        const menus = [
          {
            id: '1',
            name: '工作台',
            path: '/dashboard',
            icon: 'DashboardOutlined',
            sort: 1,
            permissions: ['dashboard:view']
          },
          {
            id: '2',
            name: '开店计划',
            path: '/store-plan',
            icon: 'ShopOutlined',
            sort: 2,
            permissions: ['store:plan:view']
          },
          {
            id: '3',
            name: '拓店管理',
            path: '/expansion',
            icon: 'ExpandOutlined',
            sort: 3,
            permissions: ['expansion:view']
          },
          {
            id: '4',
            name: '开店筹备',
            path: '/preparation',
            icon: 'ToolOutlined',
            sort: 4,
            permissions: ['preparation:view']
          },
          {
            id: '5',
            name: '门店档案',
            path: '/store-files',
            icon: 'FileOutlined',
            sort: 5,
            permissions: ['store:files:view']
          },
          {
            id: '6',
            name: '门店运营',
            path: '/operation',
            icon: 'SettingOutlined',
            sort: 6,
            permissions: ['operation:view']
          },
          {
            id: '7',
            name: '审批中心',
            path: '/approval',
            icon: 'AuditOutlined',
            sort: 7,
            permissions: ['approval:view']
          },
          {
            id: '8',
            name: '基础数据',
            path: '/basic-data',
            icon: 'DatabaseOutlined',
            sort: 8,
            permissions: ['basic:data:view']
          }
        ]

        return HttpResponse.json(MockResponse.success(menus))
      }),

      // 修改密码
      http.post(`${this.config.baseUrl}/auth/password/change`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as {
          oldPassword: string
          newPassword: string
          confirmPassword: string
        }

        if (body.newPassword !== body.confirmPassword) {
          return HttpResponse.json(
            MockResponse.validationError([
              { field: 'confirmPassword', message: '两次输入的密码不一致' }
            ]),
            { status: 422 }
          )
        }

        if (body.oldPassword === 'wrong') {
          return HttpResponse.json(MockResponse.error('原密码错误', 400), { status: 400 })
        }

        return HttpResponse.json(MockResponse.success(null, '密码修改成功'))
      }),

      // 获取验证码
      http.get(`${this.config.baseUrl}/auth/captcha`, async () => {
        await MockUtils.delay()

        return HttpResponse.json(
          MockResponse.success({
            id: MockUtils.generateId(),
            image:
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUwIiB5PSIyNSIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MTIzNDwvdGV4dD48L3N2Zz4='
          })
        )
      }),

      // 验证验证码
      http.post(`${this.config.baseUrl}/auth/captcha/verify`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as { id: string; code: string }

        // 模拟验证码验证
        const isValid = body.code === '1234'

        return HttpResponse.json(MockResponse.success(isValid))
      }),

      // 企业微信授权URL
      http.get(`${this.config.baseUrl}/auth/wechat/url`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const redirectUri = url.searchParams.get('redirectUri')

        return HttpResponse.json(
          MockResponse.success({
            authUrl: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx123&redirect_uri=${encodeURIComponent(redirectUri || window.location.origin)}&response_type=code&scope=snsapi_base&state=mock_state#wechat_redirect`,
            state: 'mock_state'
          })
        )
      }),

      // 企业微信登录
      http.post(`${this.config.baseUrl}/auth/wechat/login`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as { code: string; state: string }

        if (!body.code) {
          return HttpResponse.json(MockResponse.error('授权码无效', 400), { status: 400 })
        }

        // 获取用户数据
        const users = MockDataStore.getInstance().getData('users')
        const user = users[0]

        const response: LoginResponse = {
          accessToken: `mock_wechat_token_${MockUtils.generateId()}`,
          refreshToken: `mock_wechat_refresh_${MockUtils.generateId()}`,
          expiresIn: 7200,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            roles: user.roles.map((r: any) => r.code),
            permissions: user.permissions
          }
        }

        return HttpResponse.json(MockResponse.success(response, '企微登录成功'))
      }),

      // 绑定企业微信
      http.post(`${this.config.baseUrl}/auth/wechat/bind`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as { code: string; state: string }

        if (!body.code) {
          return HttpResponse.json(MockResponse.error('授权码无效', 400), { status: 400 })
        }

        return HttpResponse.json(MockResponse.success(null, '绑定成功'))
      }),

      // 解绑企业微信
      http.post(`${this.config.baseUrl}/auth/wechat/unbind`, async () => {
        await MockUtils.delay()
        return HttpResponse.json(MockResponse.success(null, '解绑成功'))
      }),

      // 更新用户资料
      http.patch(`${this.config.baseUrl}/auth/profile`, async ({ request }) => {
        await MockUtils.delay()

        const body = (await request.json()) as {
          name?: string
          email?: string
          phone?: string
          avatar?: string
        }

        const users = MockDataStore.getInstance().getData('users')
        const user = users[0]

        const updatedUser = { ...user, ...body, updatedAt: new Date().toISOString() }
        MockDataStore.getInstance().updateData('users', user.id, body)

        const response: UserProfileResponse = {
          id: updatedUser.id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          department: updatedUser.department,
          roles: updatedUser.roles,
          permissions: updatedUser.permissions,
          lastLoginAt: updatedUser.lastLoginAt,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }

        return HttpResponse.json(MockResponse.success(response, '资料更新成功'))
      }),

      // 上传头像
      http.post(`${this.config.baseUrl}/auth/avatar`, async ({ request }) => {
        await MockUtils.delay()

        // 模拟文件上传
        const formData = await request.formData()
        const file = formData.get('avatar') as File

        if (!file) {
          return HttpResponse.json(MockResponse.error('请选择头像文件', 400), { status: 400 })
        }

        // 模拟上传成功
        const avatarUrl = `https://example.com/avatars/${MockUtils.generateId()}.jpg`

        return HttpResponse.json(MockResponse.success({ url: avatarUrl }, '头像上传成功'))
      }),

      // 获取登录历史
      http.get(`${this.config.baseUrl}/auth/login-history`, async ({ request }) => {
        await MockUtils.delay()

        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

        // 生成模拟登录历史
        const history = Array.from({ length: 50 }, () => ({
          id: MockUtils.generateId(),
          ip: '192.168.1.' + Math.floor(Math.random() * 255),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: '北京市',
          loginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          logoutAt:
            Math.random() > 0.3
              ? new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000).toISOString()
              : undefined,
          duration: Math.floor(Math.random() * 8 * 60 * 60), // 秒
          status: Math.random() > 0.1 ? 'success' : 'failed'
        }))

        const paginatedData = MockUtils.paginate(history, page, pageSize)

        return HttpResponse.json(
          MockResponse.pagination(paginatedData, page, pageSize, history.length)
        )
      })
    ]
  }
}
