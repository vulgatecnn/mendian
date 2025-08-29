/**
 * 认证相关Mock处理器
 */
import { rest } from 'msw'
import { 
  API_BASE_URL, 
  HTTP_STATUS, 
  createSuccessResponse, 
  createErrorResponse,
  mockDelay,
  mockError,
} from './base.handler'
import { mockUsers, mockAuthData } from '../mockData'

// 登录请求接口
interface LoginRequest {
  username: string
  password: string
  remember?: boolean
}

// 登录响应接口
interface LoginResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    username: string
    name: string
    email: string
    avatar?: string
    departmentId: string
    departmentName: string
    roleIds: string[]
    roleNames: string[]
    permissions: string[]
  }
  expiresIn: number
}

export const authHandlers = [
  // POST /auth/login - 用户登录
  rest.post(`${API_BASE_URL}/auth/login`, async (req, res, ctx) => {
    try {
      await mockDelay(800, 1500) // 登录稍微慢一些，模拟真实场景
      mockError(0.02) // 2%错误率

      const { username, password, remember }: LoginRequest = await req.json()

      // 验证请求参数
      if (!username || !password) {
        return res(
          ctx.status(HTTP_STATUS.BAD_REQUEST),
          ctx.json(createErrorResponse('用户名和密码不能为空'))
        )
      }

      // 查找用户
      const user = mockUsers.find(u => u.username === username)
      if (!user) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('用户名或密码错误'))
        )
      }

      // 简化密码验证（实际项目中应该有更严格的验证）
      const validPasswords = ['admin123', 'password123', '123456']
      if (!validPasswords.includes(password)) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('用户名或密码错误'))
        )
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res(
          ctx.status(HTTP_STATUS.FORBIDDEN),
          ctx.json(createErrorResponse('账户已被禁用，请联系管理员'))
        )
      }

      // 生成token
      const token = mockAuthData.generateToken(user)
      const refreshToken = `refresh-${token}`
      const expiresIn = remember ? 7 * 24 * 60 * 60 : 24 * 60 * 60 // 记住登录7天，否则1天

      // 模拟更新最后登录时间
      user.lastLoginAt = new Date().toISOString()

      // 构造响应数据
      const loginResponse: LoginResponse = {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          departmentId: user.departmentId,
          departmentName: user.departmentName,
          roleIds: user.roleIds,
          roleNames: user.roleNames,
          permissions: ['*'], // 简化处理，实际项目中应该根据角色计算权限
        },
        expiresIn,
      }

      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse(loginResponse, '登录成功'))
      )

    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('服务器内部错误'))
      )
    }
  }),

  // POST /auth/logout - 用户登出
  rest.post(`${API_BASE_URL}/auth/logout`, async (req, res, ctx) => {
    try {
      await mockDelay()
      
      // 实际项目中应该验证token并将其加入黑名单
      
      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse(null, '登出成功'))
      )
    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('服务器内部错误'))
      )
    }
  }),

  // POST /auth/refresh - 刷新token
  rest.post(`${API_BASE_URL}/auth/refresh`, async (req, res, ctx) => {
    try {
      await mockDelay()
      
      const { refreshToken }: { refreshToken: string } = await req.json()
      
      if (!refreshToken) {
        return res(
          ctx.status(HTTP_STATUS.BAD_REQUEST),
          ctx.json(createErrorResponse('刷新令牌不能为空'))
        )
      }

      // 简化处理：生成新的token
      const originalToken = refreshToken.replace('refresh-', '')
      const payload = mockAuthData.parseToken(originalToken)
      
      if (!payload || payload.exp < Date.now()) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('刷新令牌已过期'))
        )
      }

      const user = mockUsers.find(u => u.id === payload.userId)
      if (!user) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('用户不存在'))
        )
      }

      const newToken = mockAuthData.generateToken(user)
      const newRefreshToken = `refresh-${newToken}`

      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse({
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn: 24 * 60 * 60
        }))
      )

    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('服务器内部错误'))
      )
    }
  }),

  // GET /auth/me - 获取当前用户信息
  rest.get(`${API_BASE_URL}/auth/me`, async (req, res, ctx) => {
    try {
      await mockDelay()

      // 从请求头中获取token
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('未提供认证令牌'))
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const payload = mockAuthData.parseToken(token)
      
      if (!payload || payload.exp < Date.now()) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('认证令牌已过期'))
        )
      }

      const user = mockUsers.find(u => u.id === payload.userId)
      if (!user) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('用户不存在'))
        )
      }

      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          departmentId: user.departmentId,
          departmentName: user.departmentName,
          positionId: user.positionId,
          positionName: user.positionName,
          roleIds: user.roleIds,
          roleNames: user.roleNames,
          permissions: ['*'], // 简化处理
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        }))
      )

    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('服务器内部错误'))
      )
    }
  }),

  // PUT /auth/profile - 更新用户资料
  rest.put(`${API_BASE_URL}/auth/profile`, async (req, res, ctx) => {
    try {
      await mockDelay()

      // 验证token（简化处理）
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return res(
          ctx.status(HTTP_STATUS.UNAUTHORIZED),
          ctx.json(createErrorResponse('未提供认证令牌'))
        )
      }

      const { name, email, phone, avatar } = await req.json()

      // 简化处理：直接返回更新后的用户信息
      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse({
          name,
          email,
          phone,
          avatar,
        }, '资料更新成功'))
      )

    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('服务器内部错误'))
      )
    }
  }),

  // POST /auth/change-password - 修改密码
  rest.post(`${API_BASE_URL}/auth/change-password`, async (req, res, ctx) => {
    try {
      await mockDelay()

      const { oldPassword, newPassword } = await req.json()

      if (!oldPassword || !newPassword) {
        return res(
          ctx.status(HTTP_STATUS.BAD_REQUEST),
          ctx.json(createErrorResponse('原密码和新密码不能为空'))
        )
      }

      if (newPassword.length < 6) {
        return res(
          ctx.status(HTTP_STATUS.BAD_REQUEST),
          ctx.json(createErrorResponse('新密码长度至少6位'))
        )
      }

      // 模拟密码修改成功
      return res(
        ctx.status(HTTP_STATUS.OK),
        ctx.json(createSuccessResponse(null, '密码修改成功'))
      )

    } catch (error) {
      return res(
        ctx.status(HTTP_STATUS.INTERNAL_SERVER_ERROR),
        ctx.json(createErrorResponse('服务器内部错误'))
      )
    }
  }),
]