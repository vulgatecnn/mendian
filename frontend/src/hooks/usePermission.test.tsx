/**
 * usePermission Hook Comprehensive Test Suite
 * 
 * Tests cover:
 * - All permission checking functions
 * - Role-based permissions
 * - Route permissions
 * - Menu filtering
 * - Action permissions
 * - Memoization and performance
 * - Error handling and edge cases
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  usePermission, 
  useRoutePermission, 
  useMenuPermission, 
  usePermissionGuard,
  useRolePermission,
  useActionPermission
} from './usePermission'
import { UserRoleCode } from '../constants/roles'

// Mock the stores
const mockAuthStore = {
  user: null,
  isAuthenticated: false
}

const mockPermissionStore = {
  permissions: [],
  roles: [],
  isLoading: false,
  error: null
}

const mockUseAuthStore = vi.fn(() => mockAuthStore)
const mockUsePermissionStore = vi.fn(() => mockPermissionStore)

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore()
}))

vi.mock('../stores/permissionStore', () => ({
  usePermissionStore: () => mockUsePermissionStore()
}))

// Mock useCurrentUser hook
const mockUseCurrentUser = vi.fn(() => ({
  user: null,
  isAdmin: false
}))

vi.mock('./useAuth', () => ({
  useCurrentUser: () => mockUseCurrentUser()
}))

// Mock constants
const mockRoutePermissions = {
  '/dashboard': ['dashboard:view'],
  '/store-plan': ['store-plan:view'],
  '/store-plan/create': ['store-plan:create'],
  '/admin': ['admin:view', 'admin:manage']
}

vi.mock('../constants/permissions', () => ({
  ROUTE_PERMISSIONS: mockRoutePermissions,
  hasPermission: vi.fn()
}))

describe('usePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock store states
    mockAuthStore.user = null
    mockAuthStore.isAuthenticated = false
    mockPermissionStore.permissions = []
    mockPermissionStore.roles = []
    mockPermissionStore.isLoading = false
    mockPermissionStore.error = null
  })

  describe('Basic Permission Checking', () => {
    it('should return false when not authenticated', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => usePermission())

      expect(result.current.hasPermission('store:read')).toBe(false)
      expect(result.current.hasPermission(['store:read', 'store:write'])).toBe(false)
    })

    it('should return true for empty permissions', () => {
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

      const { result } = renderHook(() => usePermission())

      expect(result.current.hasPermission('')).toBe(true)
      expect(result.current.hasPermission([])).toBe(true)
      expect(result.current.hasPermission(null as any)).toBe(true)
    })

    it('should check permissions from role permissions', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [
          {
            id: '1',
            code: 'USER',
            name: '普通用户',
            description: '普通用户角色',
            permissions: ['store:read', 'store:create']
          }
        ],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }

      const { result } = renderHook(() => usePermission())

      expect(result.current.hasPermission('store:read')).toBe(true)
      expect(result.current.hasPermission('store:create')).toBe(true)
      expect(result.current.hasPermission('store:delete')).toBe(false)
    })

    it('should check permissions from permission store', () => {
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
      mockPermissionStore.permissions = ['expansion:read', 'expansion:write']

      const { result } = renderHook(() => usePermission())

      expect(result.current.hasPermission('expansion:read')).toBe(true)
      expect(result.current.hasPermission('expansion:write')).toBe(true)
      expect(result.current.hasPermission('expansion:delete')).toBe(false)
    })

    it('should combine and deduplicate permissions from roles and store', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [
          {
            id: '1',
            code: 'USER',
            name: '普通用户',
            description: '普通用户角色',
            permissions: ['store:read', 'common:permission']
          }
        ],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }
      mockPermissionStore.permissions = ['expansion:read', 'common:permission']

      const { result } = renderHook(() => usePermission())

      // Should have all unique permissions
      const expectedPermissions = ['expansion:read', 'common:permission', 'store:read']
      expect(result.current.permissions).toEqual(expect.arrayContaining(expectedPermissions))
      expect(result.current.permissions).toHaveLength(3)
      
      expect(result.current.hasPermission('store:read')).toBe(true)
      expect(result.current.hasPermission('expansion:read')).toBe(true)
      expect(result.current.hasPermission('common:permission')).toBe(true)
    })
  })

  describe('Multiple Permission Modes', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [
          {
            id: '1',
            code: 'USER',
            name: '普通用户',
            description: '普通用户角色',
            permissions: ['store:read', 'store:create']
          }
        ],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }
    })

    it('should handle any mode correctly', () => {
      const { result } = renderHook(() => usePermission())

      // Has one of the permissions
      expect(result.current.hasPermission(['store:read', 'store:delete'], 'any')).toBe(true)
      expect(result.current.hasAnyPermission(['store:read', 'store:delete'])).toBe(true)
      
      // Has none of the permissions
      expect(result.current.hasPermission(['store:delete', 'store:admin'], 'any')).toBe(false)
      expect(result.current.hasAnyPermission(['store:delete', 'store:admin'])).toBe(false)
    })

    it('should handle all mode correctly', () => {
      const { result } = renderHook(() => usePermission())

      // Has all permissions
      expect(result.current.hasPermission(['store:read', 'store:create'], 'all')).toBe(true)
      expect(result.current.hasAllPermissions(['store:read', 'store:create'])).toBe(true)
      
      // Missing some permissions
      expect(result.current.hasPermission(['store:read', 'store:delete'], 'all')).toBe(false)
      expect(result.current.hasAllPermissions(['store:read', 'store:delete'])).toBe(false)
    })

    it('should default to any mode', () => {
      const { result } = renderHook(() => usePermission())

      // Default should be 'any' mode
      expect(result.current.hasPermission(['store:read', 'store:delete'])).toBe(true)
    })
  })

  describe('Role Checking', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [
          {
            id: '1',
            code: 'USER' as UserRoleCode,
            name: '普通用户',
            description: '普通用户角色',
            permissions: []
          },
          {
            id: '2',
            code: 'MANAGER' as UserRoleCode,
            name: '管理员',
            description: '管理员角色',
            permissions: []
          }
        ],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }
    })

    it('should check single role correctly', () => {
      const { result } = renderHook(() => usePermission())

      expect(result.current.hasRole('USER' as UserRoleCode)).toBe(true)
      expect(result.current.hasRole('MANAGER' as UserRoleCode)).toBe(true)
      expect(result.current.hasRole('ADMIN' as UserRoleCode)).toBe(false)
    })

    it('should check multiple roles correctly', () => {
      const { result } = renderHook(() => usePermission())

      expect(result.current.hasRole(['USER', 'ADMIN'] as UserRoleCode[])).toBe(true)
      expect(result.current.hasRole(['ADMIN', 'SUPER_ADMIN'] as UserRoleCode[])).toBe(false)
    })

    it('should return false when not authenticated', () => {
      mockAuthStore.isAuthenticated = false

      const { result } = renderHook(() => usePermission())

      expect(result.current.hasRole('USER' as UserRoleCode)).toBe(false)
    })
  })

  describe('Detailed Permission Checking', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [
          {
            id: '1',
            code: 'USER',
            name: '普通用户',
            description: '普通用户角色',
            permissions: ['store:read', 'store:create']
          }
        ],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }
    })

    it('should provide detailed permission check results', () => {
      const { result } = renderHook(() => usePermission())

      const checkResult = result.current.checkPermission(['store:read', 'store:write'], 'all')

      expect(checkResult).toEqual({
        hasPermission: false,
        requiredPermissions: ['store:read', 'store:write'],
        userPermissions: expect.arrayContaining(['store:read', 'store:create']),
        missingPermissions: ['store:write'],
        reason: 'Missing permissions: store:write'
      })
    })

    it('should provide success result when permissions granted', () => {
      const { result } = renderHook(() => usePermission())

      const checkResult = result.current.checkPermission(['store:read'], 'any')

      expect(checkResult).toEqual({
        hasPermission: true,
        requiredPermissions: ['store:read'],
        userPermissions: expect.arrayContaining(['store:read', 'store:create']),
        missingPermissions: [],
        reason: 'Permission granted'
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should return loading state from permission store', () => {
      mockPermissionStore.isLoading = true

      const { result } = renderHook(() => usePermission())

      expect(result.current.loading).toBe(true)
    })

    it('should return error state from permission store', () => {
      mockPermissionStore.error = 'Permission load error'

      const { result } = renderHook(() => usePermission())

      expect(result.current.error).toBe('Permission load error')
    })

    it('should return roles from permission store', () => {
      const mockRoles = [
        { id: '1', code: 'USER', name: '普通用户' },
        { id: '2', code: 'ADMIN', name: '管理员' }
      ]
      mockPermissionStore.roles = mockRoles

      const { result } = renderHook(() => usePermission())

      expect(result.current.roles).toEqual(mockRoles)
    })
  })

  describe('Memoization and Performance', () => {
    it('should memoize user permissions correctly', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [
          {
            id: '1',
            code: 'USER',
            name: '普通用户',
            description: '普通用户角色',
            permissions: ['store:read']
          }
        ],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }

      const { result, rerender } = renderHook(() => usePermission())

      const initialPermissions = result.current.permissions

      // Rerender without changing dependencies
      rerender()

      // Should be the same reference (memoized)
      expect(result.current.permissions).toBe(initialPermissions)
    })

    it('should recalculate permissions when user changes', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: '1',
        username: 'testuser',
        realName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        avatar: 'avatar-url',
        roles: [
          {
            id: '1',
            code: 'USER',
            name: '普通用户',
            description: '普通用户角色',
            permissions: ['store:read']
          }
        ],
        department: 'Test Department',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        enabled: true
      }

      const { result, rerender } = renderHook(() => usePermission())

      expect(result.current.permissions).toContain('store:read')

      // Change user permissions
      mockAuthStore.user = {
        ...mockAuthStore.user,
        roles: [
          {
            id: '1',
            code: 'USER',
            name: '普通用户',
            description: '普通用户角色',
            permissions: ['store:write']
          }
        ]
      }

      rerender()

      expect(result.current.permissions).toContain('store:write')
      expect(result.current.permissions).not.toContain('store:read')
    })
  })
})

describe('useRoutePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: '1',
      username: 'testuser',
      realName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: [
        {
          id: '1',
          code: 'USER',
          name: '普通用户',
          description: '普通用户角色',
          permissions: ['dashboard:view', 'store-plan:view']
        }
      ],
      department: 'Test Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }
  })

  it('should check route permissions correctly', () => {
    const { result } = renderHook(() => useRoutePermission('/dashboard'))

    expect(result.current.routePath).toBe('/dashboard')
    expect(result.current.requiredPermissions).toEqual(['dashboard:view'])
    expect(result.current.canAccess).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should deny access when missing route permissions', () => {
    const { result } = renderHook(() => useRoutePermission('/admin'))

    expect(result.current.routePath).toBe('/admin')
    expect(result.current.requiredPermissions).toEqual(['admin:view', 'admin:manage'])
    expect(result.current.canAccess).toBe(false)
  })

  it('should allow access for routes without permissions', () => {
    const { result } = renderHook(() => useRoutePermission('/public'))

    expect(result.current.canAccess).toBe(true)
    expect(result.current.requiredPermissions).toEqual([])
  })

  it('should handle undefined route path', () => {
    const { result } = renderHook(() => useRoutePermission())

    expect(result.current.routePath).toBeUndefined()
    expect(result.current.canAccess).toBe(true)
    expect(result.current.requiredPermissions).toEqual([])
  })

  it('should provide detailed permission check', () => {
    const { result } = renderHook(() => useRoutePermission('/admin'))

    expect(result.current.permissionCheck.hasPermission).toBe(false)
    expect(result.current.permissionCheck.missingPermissions).toEqual(['admin:view', 'admin:manage'])
  })
})

describe('useMenuPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: '1',
      username: 'testuser',
      realName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: [
        {
          id: '1',
          code: 'USER',
          name: '普通用户',
          description: '普通用户角色',
          permissions: ['store:read', 'dashboard:view']
        }
      ],
      department: 'Test Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }
    mockPermissionStore.roles = [
      { id: '1', code: 'USER', name: '普通用户' }
    ]
  })

  it('should check menu item visibility correctly', () => {
    const { result } = renderHook(() => useMenuPermission())

    expect(result.current.canShowMenuItem(['store:read'])).toBe(true)
    expect(result.current.canShowMenuItem(['admin:manage'])).toBe(false)
    expect(result.current.canShowMenuItem([])).toBe(true)
  })

  it('should filter menu items based on permissions', () => {
    const menuItems = [
      { id: 1, name: 'Dashboard', permissions: ['dashboard:view'] },
      { id: 2, name: 'Store Management', permissions: ['store:read'] },
      { id: 3, name: 'Admin Panel', permissions: ['admin:manage'] },
      { id: 4, name: 'Public Page', permissions: [] },
      { id: 5, name: 'No Permissions' }
    ]

    const { result } = renderHook(() => useMenuPermission())

    const filteredItems = result.current.filterMenuItems(menuItems)

    expect(filteredItems).toHaveLength(4)
    expect(filteredItems.map(item => item.id)).toEqual([1, 2, 4, 5])
  })

  it('should filter menu items with meta permissions', () => {
    const menuItems = [
      { id: 1, name: 'Dashboard', meta: { permissions: ['dashboard:view'] } },
      { id: 2, name: 'Admin', meta: { permissions: ['admin:manage'] } }
    ]

    const { result } = renderHook(() => useMenuPermission())

    const filteredItems = result.current.filterMenuItems(menuItems)

    expect(filteredItems).toHaveLength(1)
    expect(filteredItems[0].id).toBe(1)
  })

  it('should return user roles', () => {
    const { result } = renderHook(() => useMenuPermission())

    expect(result.current.userRoles).toEqual([
      { id: '1', code: 'USER', name: '普通用户' }
    ])
  })
})

describe('usePermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: '1',
      username: 'testuser',
      realName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: [
        {
          id: '1',
          code: 'USER',
          name: '普通用户',
          description: '普通用户角色',
          permissions: ['store:read', 'store:create']
        }
      ],
      department: 'Test Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }
  })

  it('should guard component with permissions', () => {
    const { result } = renderHook(() => 
      usePermissionGuard(['store:read'], 'any')
    )

    expect(result.current.hasPermission).toBe(true)
    expect(result.current.canRender).toBe(true)
    expect(result.current.missingPermissions).toEqual([])
    expect(result.current.reason).toBe('Permission granted')
  })

  it('should block component without permissions', () => {
    const { result } = renderHook(() => 
      usePermissionGuard(['admin:manage'], 'any')
    )

    expect(result.current.hasPermission).toBe(false)
    expect(result.current.canRender).toBe(false)
    expect(result.current.missingPermissions).toEqual(['admin:manage'])
    expect(result.current.reason).toBe('Missing permissions: admin:manage')
  })

  it('should handle all mode correctly', () => {
    const { result } = renderHook(() => 
      usePermissionGuard(['store:read', 'store:delete'], 'all')
    )

    expect(result.current.hasPermission).toBe(false)
    expect(result.current.missingPermissions).toEqual(['store:delete'])
  })
})

describe('useRolePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        roles: [
          { id: '1', code: 'USER', name: '普通用户', description: '普通用户', permissions: [] },
          { id: '2', code: 'ADMIN', name: '管理员', description: '管理员', permissions: [] }
        ]
      },
      isAdmin: true
    })
    mockPermissionStore.permissions = ['test:permission']
  })

  it('should check roles by name and code', () => {
    const { result } = renderHook(() => useRolePermission())

    expect(result.current.hasRole('普通用户')).toBe(true)
    expect(result.current.hasRole('USER')).toBe(true)
    expect(result.current.hasRole('SUPER_ADMIN')).toBe(false)
  })

  it('should check any role correctly', () => {
    const { result } = renderHook(() => useRolePermission())

    expect(result.current.hasAnyRole(['普通用户', 'SUPER_ADMIN'])).toBe(true)
    expect(result.current.hasAnyRole(['SUPER_ADMIN', 'OTHER'])).toBe(false)
  })

  it('should get role names and codes', () => {
    const { result } = renderHook(() => useRolePermission())

    expect(result.current.getRoleNames()).toEqual(['普通用户', '管理员'])
    expect(result.current.getRoleCodes()).toEqual(['USER', 'ADMIN'])
  })

  it('should return admin status and permissions', () => {
    const { result } = renderHook(() => useRolePermission())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.permissions).toEqual(['test:permission'])
  })

  it('should handle user without roles', () => {
    mockUseCurrentUser.mockReturnValue({
      user: null,
      isAdmin: false
    })

    const { result } = renderHook(() => useRolePermission())

    expect(result.current.roles).toEqual([])
    expect(result.current.hasRole('USER')).toBe(false)
    expect(result.current.getRoleNames()).toEqual([])
    expect(result.current.getRoleCodes()).toEqual([])
  })
})

describe('useActionPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: '1',
      username: 'testuser',
      realName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: [
        {
          id: '1',
          code: 'USER',
          name: '普通用户',
          description: '普通用户角色',
          permissions: [
            'store:view', 'store:create', 'store:update',
            'product:view', 'product:manage'
          ]
        }
      ],
      department: 'Test Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }
  })

  it('should check CRUD permissions correctly', () => {
    const { result } = renderHook(() => useActionPermission())

    // Store resource
    expect(result.current.canView('store')).toBe(true)
    expect(result.current.canCreate('store')).toBe(true)
    expect(result.current.canUpdate('store')).toBe(true)
    expect(result.current.canDelete('store')).toBe(false)
    expect(result.current.canManage('store')).toBe(false)

    // Product resource
    expect(result.current.canView('product')).toBe(true)
    expect(result.current.canCreate('product')).toBe(false)
    expect(result.current.canUpdate('product')).toBe(false)
    expect(result.current.canDelete('product')).toBe(false)
    expect(result.current.canManage('product')).toBe(true)
  })

  it('should handle resources without permissions', () => {
    const { result } = renderHook(() => useActionPermission())

    expect(result.current.canView('admin')).toBe(false)
    expect(result.current.canCreate('admin')).toBe(false)
    expect(result.current.canUpdate('admin')).toBe(false)
    expect(result.current.canDelete('admin')).toBe(false)
    expect(result.current.canManage('admin')).toBe(false)
  })
})

describe('Edge Cases and Error Handling', () => {
  it('should handle missing user gracefully', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = null

    const { result } = renderHook(() => usePermission())

    expect(result.current.permissions).toEqual([])
    expect(result.current.hasPermission('any:permission')).toBe(false)
    expect(result.current.hasRole('USER' as UserRoleCode)).toBe(false)
  })

  it('should handle user without roles gracefully', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = {
      id: '1',
      username: 'testuser',
      realName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      avatar: 'avatar-url',
      roles: undefined as any,
      department: 'Test Department',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      enabled: true
    }

    const { result } = renderHook(() => usePermission())

    expect(result.current.permissions).toEqual([])
    expect(result.current.hasPermission('any:permission')).toBe(false)
  })

  it('should handle invalid permission formats gracefully', () => {
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

    const { result } = renderHook(() => usePermission())

    expect(result.current.hasPermission(undefined as any)).toBe(true)
    expect(result.current.hasPermission(null as any)).toBe(true)
    expect(result.current.hasPermission('' as any)).toBe(true)
  })
})