/**
 * 登录表单组件测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'
import { AuthService } from '../../../api'

// Mock API
vi.mock('../../../api', () => ({
  AuthService: {
    loginByPassword: vi.fn(),
    loginByPhonePassword: vi.fn(),
    loginBySmsCode: vi.fn(),
    sendSmsCode: vi.fn(),
  },
}))

// Mock useAuth hook
vi.mock('../../../contexts', () => ({
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
  }),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('登录表单组件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
  }

  it('应该正确渲染登录页面', () => {
    renderLogin()
    
    expect(screen.getByText('门店生命周期管理系统')).toBeInTheDocument()
    expect(screen.getByText('账号登录')).toBeInTheDocument()
    expect(screen.getByText('手机号登录')).toBeInTheDocument()
    expect(screen.getByText('验证码登录')).toBeInTheDocument()
  })

  it('应该显示账号密码登录表单', () => {
    renderLogin()
    
    expect(screen.getByPlaceholderText('用户名 / 手机号')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
    expect(screen.getByText('记住登录')).toBeInTheDocument()
  })

  it('应该验证必填字段', async () => {
    renderLogin()
    
    const loginButton = screen.getAllByText('登录')[0]
    await userEvent.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('请输入用户名或手机号')).toBeInTheDocument()
    })
  })

  it('应该成功提交账号密码登录', async () => {
    vi.mocked(AuthService.loginByPassword).mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      user: { id: 1, username: 'testuser' },
    })

    renderLogin()
    
    const usernameInput = screen.getByPlaceholderText('用户名 / 手机号')
    const passwordInput = screen.getByPlaceholderText('密码')
    
    await userEvent.type(usernameInput, 'testuser')
    await userEvent.type(passwordInput, 'password123')
    
    const loginButton = screen.getAllByText('登录')[0]
    await userEvent.click(loginButton)
    
    await waitFor(() => {
      expect(AuthService.loginByPassword).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
        remember: undefined,
      })
    })
  })

  it('应该处理登录失败', async () => {
    vi.mocked(AuthService.loginByPassword).mockRejectedValue({
      response: { data: { message: '用户名或密码错误' } },
    })

    renderLogin()
    
    const usernameInput = screen.getByPlaceholderText('用户名 / 手机号')
    const passwordInput = screen.getByPlaceholderText('密码')
    
    await userEvent.type(usernameInput, 'wronguser')
    await userEvent.type(passwordInput, 'wrongpass')
    
    const loginButton = screen.getAllByText('登录')[0]
    await userEvent.click(loginButton)
    
    await waitFor(() => {
      expect(AuthService.loginByPassword).toHaveBeenCalled()
    })
  })

  it('应该切换到手机号登录标签', async () => {
    renderLogin()
    
    const phoneTab = screen.getByText('手机号登录')
    await userEvent.click(phoneTab)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('手机号')).toBeInTheDocument()
    })
  })

  it('应该验证手机号格式', async () => {
    renderLogin()
    
    const phoneTab = screen.getByText('手机号登录')
    await userEvent.click(phoneTab)
    
    await waitFor(async () => {
      const phoneInput = screen.getByPlaceholderText('手机号')
      await userEvent.type(phoneInput, '123')
      
      const loginButton = screen.getAllByText('登录')[1]
      await userEvent.click(loginButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument()
    })
  })

  it('应该切换到验证码登录标签', async () => {
    renderLogin()
    
    const smsTab = screen.getByText('验证码登录')
    await userEvent.click(smsTab)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('验证码')).toBeInTheDocument()
      expect(screen.getByText('获取验证码')).toBeInTheDocument()
    })
  })

  it('应该发送短信验证码', async () => {
    vi.mocked(AuthService.sendSmsCode).mockResolvedValue({ success: true })

    renderLogin()
    
    const smsTab = screen.getByText('验证码登录')
    await userEvent.click(smsTab)
    
    await waitFor(async () => {
      const phoneInput = screen.getByPlaceholderText('手机号')
      await userEvent.type(phoneInput, '13800138000')
      
      const sendButton = screen.getByText('获取验证码')
      await userEvent.click(sendButton)
    })
    
    await waitFor(() => {
      expect(AuthService.sendSmsCode).toHaveBeenCalledWith({
        phone: '13800138000',
        type: 'login',
      })
    })
  })

  it('应该显示记住登录选项', () => {
    renderLogin()
    
    const rememberCheckbox = screen.getByText('记住登录')
    expect(rememberCheckbox).toBeInTheDocument()
  })

  it('应该显示企业微信登录按钮', () => {
    renderLogin()
    
    expect(screen.getByText('企业微信登录')).toBeInTheDocument()
  })
})
