/**
 * useAuth Hook Comprehensive Test Suite
 * 
 * Tests cover:
 * - All hook functions and return values
 * - Authentication flows (login, logout, refresh)
 * - Navigation behavior
 * - Error handling scenarios
 * - Store integration
 * - Performance and edge cases
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { useAuth, useCurrentUser, useAuthGuard } from './useAuth'
import { LoginRequest } from '../types/auth'

// Mock the auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  accessToken: null,
  isTokenExpired: vi.fn().mockReturnValue(false),
  login: vi.fn(),
  logout: vi.fn(),
  refreshTokenAction: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  initialize: vi.fn(),
}

const mockUseAuthStore = vi.fn(() => mockAuthStore)
vi.mock('../stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore()
}))

// Mock permission store
const mockPermissionStore = {
  getState: vi.fn(() => ({
    clearPermissions: vi.fn()
  }))
}

vi.mock('../stores/permissionStore', () => ({
  usePermissionStore: mockPermissionStore
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockUseLocation = vi.fn(() => ({
  pathname: '/dashboard',
  search: '',
  hash: '',
  state: null
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation()
  }
})

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/'] 
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    {children}
  </MemoryRouter>
)

describe('useAuth', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Reset auth store state
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
    mockAuthStore.isLoading = false
    mockAuthStore.error = null
    mockAuthStore.accessToken = null
    mockAuthStore.isTokenExpired.mockReturnValue(false)
    mockAuthStore.login.mockResolvedValue(undefined)
    mockAuthStore.logout.mockImplementation(() => {})
    mockAuthStore.refreshTokenAction.mockResolvedValue(undefined)
    mockAuthStore.initialize.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Hook Initialization', () => {
    it('should initialize auth store on mount', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(mockAuthStore.initialize).toHaveBeenCalledTimes(1)
    })

    it('should return initial auth state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.accessToken).toBe(null)
    })

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.refreshToken).toBe('function')
      expect(typeof result.current.setError).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.isTokenExpired).toBe('function')
    })
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      mockAuthStore.login.mockResolvedValueOnce(undefined)
      mockUseLocation.mockReturnValue({
        pathname: '/login',
        search: '',
        hash: '',
        state: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123'
      }

      await act(async () => {
        await result.current.login(credentials)
      })

      expect(mockAuthStore.login).toHaveBeenCalledWith(credentials)
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })

    it('should navigate to original location after login', async () => {
      mockAuthStore.login.mockResolvedValueOnce(undefined)
      mockUseLocation.mockReturnValue({
        pathname: '/login',
        search: '',
        hash: '',
        state: { from: { pathname: '/protected-page' } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123'
      }

      await act(async () => {
        await result.current.login(credentials)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/protected-page', { replace: true })
    })

    it('should handle login failure', async () => {
      const loginError = new Error('Invalid credentials')
      mockAuthStore.login.mockRejectedValueOnce(loginError)

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword'
      }

      await expect(act(async () => {
        await result.current.login(credentials)
      })).rejects.toThrow('Invalid credentials')

      expect(mockAuthStore.login).toHaveBeenCalledWith(credentials)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should be memoized and not change reference unnecessarily', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      const loginFunction = result.current.login

      rerender()

      expect(result.current.login).toBe(loginFunction)
    })
  })

  describe('Logout Flow', () => {
    it('should handle logout correctly', () => {
      const mockClearPermissions = vi.fn()
      mockPermissionStore.getState.mockReturnValue({
        clearPermissions: mockClearPermissions
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      act(() => {
        result.current.logout()
      })

      expect(mockAuthStore.logout).toHaveBeenCalledTimes(1)
      expect(mockClearPermissions).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })

    it('should be memoized correctly', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      const logoutFunction = result.current.logout

      rerender()

      expect(result.current.logout).toBe(logoutFunction)
    })
  })

  describe('Token Refresh Flow', () => {
    it('should handle successful token refresh', async () => {
      mockAuthStore.refreshTokenAction.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await act(async () => {
        await result.current.refreshToken()
      })

      expect(mockAuthStore.refreshTokenAction).toHaveBeenCalledTimes(1)
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should handle token refresh failure and redirect to login', async () => {
      const refreshError = new Error('Refresh token expired')
      mockAuthStore.refreshTokenAction.mockRejectedValueOnce(refreshError)
      mockUseLocation.mockReturnValue({
        pathname: '/dashboard',
        search: '',
        hash: '',
        state: null
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await expect(act(async () => {
        await result.current.refreshToken()
      })).rejects.toThrow('Refresh token expired')

      expect(mockAuthStore.refreshTokenAction).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { from: { pathname: '/dashboard', search: '', hash: '', state: null } }
      })
    })

    it('should be memoized correctly', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      const refreshTokenFunction = result.current.refreshToken

      rerender()

      expect(result.current.refreshToken).toBe(refreshTokenFunction)
    })
  })

  describe('Auth State Updates', () => {
    it('should reflect auth store changes', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      // Initial state
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)

      // Update mock store
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }

      rerender()

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockAuthStore.user)
    })

    it('should reflect loading state changes', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      // Initial state
      expect(result.current.isLoading).toBe(false)

      // Update loading state
      mockAuthStore.isLoading = true
      rerender()

      expect(result.current.isLoading).toBe(true)
    })

    it('should reflect error state changes', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      // Initial state
      expect(result.current.error).toBe(null)

      // Update error state
      mockAuthStore.error = 'Test error message'
      rerender()

      expect(result.current.error).toBe('Test error message')
    })
  })

  describe('Error Handling', () => {
    it('should handle auth store initialization errors', async () => {
      mockAuthStore.initialize.mockRejectedValueOnce(new Error('Initialization failed'))

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      // Hook should still work even if initialization fails
      expect(result.current.isAuthenticated).toBe(false)
      expect(typeof result.current.login).toBe('function')
    })

    it('should provide error management functions', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(typeof result.current.setError).toBe('function')
      expect(typeof result.current.clearError).toBe('function')

      // Test that functions are bound to auth store
      expect(result.current.setError).toBe(mockAuthStore.setError)
      expect(result.current.clearError).toBe(mockAuthStore.clearError)
    })
  })

  describe('Token Management', () => {
    it('should provide token management functions', () => {
      mockAuthStore.accessToken = 'test-access-token'
      mockAuthStore.isTokenExpired.mockReturnValue(false)

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(result.current.accessToken).toBe('test-access-token')
      expect(typeof result.current.isTokenExpired).toBe('function')
      expect(result.current.isTokenExpired).toBe(mockAuthStore.isTokenExpired)
    })

    it('should handle token expiration checks', () => {
      mockAuthStore.isTokenExpired.mockReturnValue(true)

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(result.current.isTokenExpired()).toBe(true)
      expect(mockAuthStore.isTokenExpired).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance and Memory', () => {
    it('should not cause memory leaks on multiple rerenders', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      const initialLogin = result.current.login
      const initialLogout = result.current.logout
      const initialRefreshToken = result.current.refreshToken

      // Multiple rerenders
      for (let i = 0; i < 10; i++) {
        rerender()
      }

      // Functions should remain the same (memoized)
      expect(result.current.login).toBe(initialLogin)
      expect(result.current.logout).toBe(initialLogout)
      expect(result.current.refreshToken).toBe(initialRefreshToken)
    })

    it('should only initialize auth store once', () => {
      const { rerender } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(mockAuthStore.initialize).toHaveBeenCalledTimes(1)

      // Multiple rerenders should not call initialize again
      for (let i = 0; i < 5; i++) {
        rerender()
      }

      expect(mockAuthStore.initialize).toHaveBeenCalledTimes(1)
    })
  })
})

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.user = null
  })

  it('should return null user initially', () => {
    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.user).toBe(null)
    expect(result.current.userId).toBeUndefined()
    expect(result.current.username).toBeUndefined()
    expect(result.current.realName).toBeUndefined()
    expect(result.current.roles).toEqual([])
    expect(result.current.roleNames).toEqual([])
    expect(result.current.isAdmin).toBe(false)
  })

  it('should return user information when user is set', () => {
    const testUser = {
      id: '1',
      username: 'testuser',
      realName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: [
        { id: '1', code: 'USER', name: '普通用户', description: '普通用户角色', permissions: [] },
        { id: '2', code: 'ADMIN', name: '管理员', description: '管理员角色', permissions: [] }
      ],
      department: 'Test Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }

    mockAuthStore.user = testUser

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.user).toEqual(testUser)
    expect(result.current.userId).toBe('1')
    expect(result.current.username).toBe('testuser')
    expect(result.current.realName).toBe('Test User')
    expect(result.current.roles).toEqual(testUser.roles)
    expect(result.current.roleNames).toEqual(['普通用户', '管理员'])
    expect(result.current.isAdmin).toBe(true)
  })

  it('should handle user without roles', () => {
    const testUser = {
      id: '1',
      username: 'testuser',
      realName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: [],
      department: 'Test Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }

    mockAuthStore.user = testUser

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.roles).toEqual([])
    expect(result.current.roleNames).toEqual([])
    expect(result.current.isAdmin).toBe(false)
  })

  it('should detect admin role correctly', () => {
    const testUser = {
      id: '1',
      username: 'admin',
      realName: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: [
        { id: '1', code: 'ADMIN', name: '系统管理员', description: '系统管理员角色', permissions: [] }
      ],
      department: 'Admin Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }

    mockAuthStore.user = testUser

    const { result } = renderHook(() => useCurrentUser())

    expect(result.current.isAdmin).toBe(true)
  })
})

describe('useAuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.isTokenExpired.mockReturnValue(false)
    mockAuthStore.refreshTokenAction.mockResolvedValue(undefined)
    
    mockUseLocation.mockReturnValue({
      pathname: '/protected',
      search: '',
      hash: '',
      state: null
    })
  })

  it('should redirect to login when not authenticated', () => {
    mockAuthStore.isAuthenticated = false

    renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { from: { pathname: '/protected', search: '', hash: '', state: null } }
    })
  })

  it('should not redirect when authenticated and token valid', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isTokenExpired.mockReturnValue(false)

    const { result } = renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.needsLogin).toBe(false)
  })

  it('should attempt token refresh when authenticated but token expired', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isTokenExpired.mockReturnValue(true)
    mockAuthStore.refreshTokenAction.mockResolvedValueOnce(undefined)

    renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    await waitFor(() => {
      expect(mockAuthStore.refreshTokenAction).toHaveBeenCalledTimes(1)
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should redirect to login when token refresh fails', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isTokenExpired.mockReturnValue(true)
    mockAuthStore.refreshTokenAction.mockRejectedValueOnce(new Error('Refresh failed'))

    renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { from: { pathname: '/protected', search: '', hash: '', state: null } }
      })
    })
  })

  it('should return correct authentication status', () => {
    // Case 1: Not authenticated
    mockAuthStore.isAuthenticated = false
    const { result: result1 } = renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    expect(result1.current.isAuthenticated).toBe(false)
    expect(result1.current.needsLogin).toBe(true)

    // Case 2: Authenticated with valid token
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isTokenExpired.mockReturnValue(false)
    const { result: result2 } = renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    expect(result2.current.isAuthenticated).toBe(true)
    expect(result2.current.needsLogin).toBe(false)

    // Case 3: Authenticated but token expired
    mockAuthStore.isAuthenticated = true
    mockAuthStore.isTokenExpired.mockReturnValue(true)
    const { result: result3 } = renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    expect(result3.current.isAuthenticated).toBe(false)
    expect(result3.current.needsLogin).toBe(true)
  })

  it('should handle location state changes', () => {
    mockAuthStore.isAuthenticated = false
    
    const { rerender } = renderHook(() => useAuthGuard(), {
      wrapper: TestWrapper
    })

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { from: { pathname: '/protected', search: '', hash: '', state: null } }
    })

    // Clear navigate mock and change location
    mockNavigate.mockClear()
    mockUseLocation.mockReturnValue({
      pathname: '/another-protected',
      search: '?param=value',
      hash: '#section',
      state: { custom: 'data' }
    })

    rerender()

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { from: { pathname: '/another-protected', search: '?param=value', hash: '#section', state: { custom: 'data' } } }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle auth store errors gracefully', () => {
      mockUseAuthStore.mockImplementationOnce(() => {
        throw new Error('Auth store error')
      })

      expect(() => {
        renderHook(() => useAuthGuard(), {
          wrapper: TestWrapper
        })
      }).toThrow('Auth store error')
    })

    it('should handle navigation errors gracefully', () => {
      mockAuthStore.isAuthenticated = false
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Navigation error')
      })

      expect(() => {
        renderHook(() => useAuthGuard(), {
          wrapper: TestWrapper
        })
      }).toThrow('Navigation error')
    })
  })
})