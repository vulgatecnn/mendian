/**
 * 认证状态管理测试
 */
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { AuthService, ProfileService } from '../../api'

// Mock API services
vi.mock('../../api', () => ({
  AuthService: {
    logout: vi.fn(),
  },
  ProfileService: {
    getProfile: vi.fn(),
  },
}))

// 测试组件
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="username">{user?.username || 'none'}</div>
      <button onClick={() => login({
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        user: { id: 1, username: 'testuser', name: '测试用户' },
      })}>
        登录
      </button>
      <button onClick={logout}>退出</button>
    </div>
  )
}

describe('AuthContext 状态管理测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('初始状态', () => {
    it('应该正确初始化状态', async () => {
      vi.mocked(ProfileService.getProfile).mockRejectedValue(new Error('未登录'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
        expect(screen.getByTestId('username')).toHaveTextContent('none')
      })
    })

    it('应该从localStorage恢复登录状态', async () => {
      localStorage.setItem('access_token', 'test-token')
      vi.mocked(ProfileService.getProfile).mockResolvedValue({
        id: 1,
        username: 'testuser',
        name: '测试用户',
        phone: '13800138000',
        email: 'test@example.com',
        department: { id: 1, name: '测试部门' },
        roles: [],
        permissions: [],
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
        expect(screen.getByTestId('username')).toHaveTextContent('testuser')
      })
    })
  })

  describe('登录功能', () => {
    it('应该正确处理登录', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const loginButton = screen.getByText('登录')
      await act(async () => {
        loginButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
        expect(screen.getByTestId('username')).toHaveTextContent('testuser')
        expect(localStorage.getItem('access_token')).toBe('test-token')
        expect(localStorage.getItem('refresh_token')).toBe('refresh-token')
      })
    })
  })

  describe('登出功能', () => {
    it('应该正确处理登出', async () => {
      vi.mocked(AuthService.logout).mockResolvedValue(undefined)
      localStorage.setItem('access_token', 'test-token')

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // 先登录
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const loginButton = screen.getByText('登录')
      await act(async () => {
        loginButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
      })

      // 再登出
      const logoutButton = screen.getByText('退出')
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
        expect(screen.getByTestId('username')).toHaveTextContent('none')
        expect(localStorage.getItem('access_token')).toBeNull()
        expect(localStorage.getItem('refresh_token')).toBeNull()
      })
    })
  })

  describe('状态持久化', () => {
    it('应该将token保存到localStorage', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const loginButton = screen.getByText('登录')
      await act(async () => {
        loginButton.click()
      })

      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBe('test-token')
        expect(localStorage.getItem('refresh_token')).toBe('refresh-token')
      })
    })

    it('应该在登出时清除localStorage', async () => {
      vi.mocked(AuthService.logout).mockResolvedValue(undefined)
      localStorage.setItem('access_token', 'test-token')
      localStorage.setItem('refresh_token', 'refresh-token')

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const loginButton = screen.getByText('登录')
      await act(async () => {
        loginButton.click()
      })

      const logoutButton = screen.getByText('退出')
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBeNull()
        expect(localStorage.getItem('refresh_token')).toBeNull()
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理获取用户信息失败', async () => {
      localStorage.setItem('access_token', 'invalid-token')
      vi.mocked(ProfileService.getProfile).mockRejectedValue(new Error('Token无效'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
        expect(localStorage.getItem('access_token')).toBeNull()
      })
    })

    it('应该处理登出失败', async () => {
      vi.mocked(AuthService.logout).mockRejectedValue(new Error('网络错误'))
      localStorage.setItem('access_token', 'test-token')

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const loginButton = screen.getByText('登录')
      await act(async () => {
        loginButton.click()
      })

      const logoutButton = screen.getByText('退出')
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        // 即使API失败，也应该清除本地状态
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no')
        expect(localStorage.getItem('access_token')).toBeNull()
      })
    })
  })
})
