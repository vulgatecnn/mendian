/**
 * PermissionWrapper Component Comprehensive Test Suite
 * 
 * Tests cover:
 * - Permission validation logic
 * - Loading states
 * - Fallback component rendering
 * - Missing permissions display
 * - All permission modes
 * - Interactive elements
 * - Performance and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import { expectAllClicksWork, testHelpers } from '@/test/utils'
import { PermissionWrapper } from '../permission'

// Mock the usePermission hook
const mockUsePermission = vi.fn()
vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => mockUsePermission()
}))

// Test child component
const TestChild = ({ onClick }: { onClick?: () => void }) => (
  <div data-testid="test-child">
    <h2>Protected Content</h2>
    <button data-testid="child-button" onClick={onClick}>
      Protected Action
    </button>
    <p>This content requires permissions</p>
  </div>
)

// Custom fallback component
const CustomFallback = () => (
  <div data-testid="custom-fallback">
    <h3>Custom Access Denied</h3>
    <p>Please contact admin for access</p>
    <button data-testid="contact-admin">Contact Admin</button>
  </div>
)

// Custom loading component
const CustomLoading = () => (
  <div data-testid="custom-loading">
    <div>Custom loading spinner...</div>
  </div>
)

describe('PermissionWrapper', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    mockUsePermission.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render children when no permissions required', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions={undefined as any}>
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should render children when user has required permissions', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: ['store:read'],
          userPermissions: ['store:read']
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should show access denied when user lacks permissions', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['store:write'],
          requiredPermissions: ['store:write'],
          userPermissions: ['store:read']
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:write">
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
      expect(screen.getByText('访问受限')).toBeInTheDocument()
      expect(screen.getByText('您没有权限访问此内容')).toBeInTheDocument()
      expect(screen.getByText('缺少权限: store:write')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show default loading state when permissions are loading', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: true
      })

      render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByText('权限检查中...')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument()
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
    })

    it('should show custom loading component when provided', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: true
      })

      render(
        <PermissionWrapper permissions="store:read" loading={<CustomLoading />}>
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.getByText('Custom loading spinner...')).toBeInTheDocument()
      expect(screen.queryByText('权限检查中...')).not.toBeInTheDocument()
    })

    it('should transition from loading to content correctly', () => {
      const { rerender } = render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      // Start with loading state
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: true
      })
      rerender(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )
      expect(screen.getByText('权限检查中...')).toBeInTheDocument()

      // Transition to loaded with permissions
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: ['store:read'],
          userPermissions: ['store:read']
        }),
        loading: false
      })
      rerender(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.queryByText('权限检查中...')).not.toBeInTheDocument()
    })
  })

  describe('Permission Modes', () => {
    it('should handle single permission correctly', () => {
      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: ['store:read'],
        userPermissions: ['store:read']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: checkPermissionMock,
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:read'], 'any')
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('should handle multiple permissions with any mode', () => {
      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: ['store:read', 'store:write'],
        userPermissions: ['store:read']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: checkPermissionMock,
        loading: false
      })

      render(
        <PermissionWrapper permissions={['store:read', 'store:write']} mode="any">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:read', 'store:write'], 'any')
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('should handle multiple permissions with all mode', () => {
      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: false,
        missingPermissions: ['store:write'],
        requiredPermissions: ['store:read', 'store:write'],
        userPermissions: ['store:read']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: checkPermissionMock,
        loading: false
      })

      render(
        <PermissionWrapper permissions={['store:read', 'store:write']} mode="all">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:read', 'store:write'], 'all')
      expect(screen.getByText('访问受限')).toBeInTheDocument()
      expect(screen.getByText('缺少权限: store:write')).toBeInTheDocument()
    })

    it('should show multiple missing permissions', () => {
      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: false,
        missingPermissions: ['store:write', 'store:delete'],
        requiredPermissions: ['store:read', 'store:write', 'store:delete'],
        userPermissions: ['store:read']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: checkPermissionMock,
        loading: false
      })

      render(
        <PermissionWrapper permissions={['store:read', 'store:write', 'store:delete']} mode="all">
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByText('缺少权限: store:write, store:delete')).toBeInTheDocument()
    })
  })

  describe('Custom Props and Configuration', () => {
    it('should render custom fallback component', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['store:admin'],
          requiredPermissions: ['store:admin'],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:admin" fallback={<CustomFallback />}>
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Access Denied')).toBeInTheDocument()
      expect(screen.queryByText('访问受限')).not.toBeInTheDocument()
    })

    it('should use custom titles and subtitles', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['custom:permission'],
          requiredPermissions: ['custom:permission'],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper 
          permissions="custom:permission"
          noPermissionTitle="自定义访问限制"
          noPermissionSubtitle="需要特殊权限才能访问"
        >
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByText('自定义访问限制')).toBeInTheDocument()
      expect(screen.getByText('需要特殊权限才能访问')).toBeInTheDocument()
    })

    it('should hide missing permissions when showMissingPermissions is false', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['store:admin'],
          requiredPermissions: ['store:admin'],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper 
          permissions="store:admin" 
          showMissingPermissions={false}
        >
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByText('访问受限')).toBeInTheDocument()
      expect(screen.queryByText(/缺少权限/)).not.toBeInTheDocument()
    })

    it('should handle empty permissions array', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions={[]}>
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should handle child interactions when permissions granted', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: ['store:read'],
          userPermissions: ['store:read']
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:read">
          <TestChild onClick={mockOnClick} />
        </PermissionWrapper>
      )

      const button = screen.getByTestId('child-button')
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should handle fallback component interactions', async () => {
      const mockContactAdmin = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['store:admin'],
          requiredPermissions: ['store:admin'],
          userPermissions: []
        }),
        loading: false
      })

      const InteractiveFallback = () => (
        <div data-testid="interactive-fallback">
          <button data-testid="contact-admin" onClick={mockContactAdmin}>
            Contact Admin
          </button>
        </div>
      )

      render(
        <PermissionWrapper permissions="store:admin" fallback={<InteractiveFallback />}>
          <TestChild />
        </PermissionWrapper>
      )

      const button = screen.getByTestId('contact-admin')
      await user.click(button)

      expect(mockContactAdmin).toHaveBeenCalledTimes(1)
    })

    it('should pass comprehensive click testing when permissions granted', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: ['store:read'],
          userPermissions: ['store:read']
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      await expectAllClicksWork()
    })

    it('should pass comprehensive click testing for access denied state', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['store:admin'],
          requiredPermissions: ['store:admin'],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:admin">
          <TestChild />
        </PermissionWrapper>
      )

      await expectAllClicksWork()
    })
  })

  describe('Permission Memoization', () => {
    it('should memoize permission checking results', () => {
      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: ['store:read'],
        userPermissions: ['store:read']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: checkPermissionMock,
        loading: false
      })

      const { rerender } = render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:read'], 'any')
      checkPermissionMock.mockClear()

      // Rerender with same props - should use memoized result
      rerender(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledTimes(1)
    })

    it('should recalculate when permissions change', () => {
      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: ['store:read'],
        userPermissions: ['store:read']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: checkPermissionMock,
        loading: false
      })

      const { rerender } = render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:read'], 'any')
      checkPermissionMock.mockClear()

      // Change permissions
      rerender(
        <PermissionWrapper permissions="store:write">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:write'], 'any')
    })

    it('should recalculate when mode changes', () => {
      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: ['store:read', 'store:write'],
        userPermissions: ['store:read', 'store:write']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: checkPermissionMock,
        loading: false
      })

      const { rerender } = render(
        <PermissionWrapper permissions={['store:read', 'store:write']} mode="any">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:read', 'store:write'], 'any')
      checkPermissionMock.mockClear()

      // Change mode
      rerender(
        <PermissionWrapper permissions={['store:read', 'store:write']} mode="all">
          <TestChild />
        </PermissionWrapper>
      )

      expect(checkPermissionMock).toHaveBeenCalledWith(['store:read', 'store:write'], 'all')
    })
  })

  describe('Error Handling', () => {
    it('should handle usePermission hook errors gracefully', () => {
      mockUsePermission.mockImplementation(() => {
        throw new Error('Permission hook error')
      })

      expect(() => {
        render(
          <PermissionWrapper permissions="store:read">
            <TestChild />
          </PermissionWrapper>
        )
      }).toThrow('Permission hook error')
    })

    it('should handle checkPermission function errors', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockImplementation(() => {
          throw new Error('Permission check error')
        }),
        loading: false
      })

      expect(() => {
        render(
          <PermissionWrapper permissions="store:read">
            <TestChild />
          </PermissionWrapper>
        )
      }).toThrow('Permission check error')
    })

    it('should handle invalid permission formats', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions={null as any}>
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: false
      })

      expect(() => {
        render(
          <PermissionWrapper permissions="store:read">
            {null}
          </PermissionWrapper>
        )
      }).not.toThrow()
    })

    it('should handle multiple children', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: ['store:read'],
          userPermissions: ['store:read']
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:read">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </PermissionWrapper>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should handle empty missing permissions array', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: [],
          requiredPermissions: ['store:admin'],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:admin">
          <TestChild />
        </PermissionWrapper>
      )

      expect(screen.getByText('访问受限')).toBeInTheDocument()
      expect(screen.queryByText(/缺少权限/)).not.toBeInTheDocument()
    })
  })

  describe('Performance Testing', () => {
    it('should render efficiently', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: ['store:read'],
          userPermissions: ['store:read']
        }),
        loading: false
      })

      const renderStart = performance.now()
      render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )
      const renderEnd = performance.now()

      expect(renderEnd - renderStart).toBePerformant(50)
    })

    it('should not cause memory leaks during permission changes', () => {
      const memoryStart = testHelpers.getMemoryUsage()

      const checkPermissionMock = vi.fn().mockReturnValue({
        hasPermission: true,
        missingPermissions: [],
        requiredPermissions: ['store:read'],
        userPermissions: ['store:read']
      })

      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: checkPermissionMock,
        loading: false
      })

      const { rerender } = render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      // Simulate multiple permission changes
      const permissions = ['store:create', 'store:read', 'store:update', 'store:delete']
      permissions.forEach(permission => {
        rerender(
          <PermissionWrapper permissions={permission}>
            <TestChild />
          </PermissionWrapper>
        )
      })

      const memoryEnd = testHelpers.getMemoryUsage()
      const memoryDiff = memoryEnd - memoryStart

      expect(memoryDiff).toNotLeakMemory(512 * 1024) // Should not leak more than 512KB
    })
  })

  describe('Accessibility', () => {
    it('should be accessible when permissions granted', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: true,
          missingPermissions: [],
          requiredPermissions: ['store:read'],
          userPermissions: ['store:read']
        }),
        loading: false
      })

      const { container } = render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should be accessible when permissions denied', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['store:admin'],
          requiredPermissions: ['store:admin'],
          userPermissions: []
        }),
        loading: false
      })

      const { container } = render(
        <PermissionWrapper permissions="store:admin">
          <TestChild />
        </PermissionWrapper>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should be accessible in loading state', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: [],
          requiredPermissions: [],
          userPermissions: []
        }),
        loading: true
      })

      const { container } = render(
        <PermissionWrapper permissions="store:read">
          <TestChild />
        </PermissionWrapper>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should maintain proper semantic structure', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false),
        checkPermission: vi.fn().mockReturnValue({
          hasPermission: false,
          missingPermissions: ['store:admin'],
          requiredPermissions: ['store:admin'],
          userPermissions: []
        }),
        loading: false
      })

      render(
        <PermissionWrapper permissions="store:admin">
          <TestChild />
        </PermissionWrapper>
      )

      // The Result component should have proper ARIA structure
      expect(screen.getByText('访问受限')).toBeInTheDocument()
      expect(screen.getByText('您没有权限访问此内容')).toBeInTheDocument()
    })
  })

  describe('Integration Testing', () => {
    it('should work with real permission system', () => {
      // Simulate real permission hook behavior
      mockUsePermission.mockReturnValue({
        hasPermission: (permissions: string | string[], mode = 'any') => {
          const userPermissions = ['store:read', 'store:create', 'expansion:read']
          
          if (Array.isArray(permissions)) {
            if (mode === 'all') {
              return permissions.every(p => userPermissions.includes(p))
            } else {
              return permissions.some(p => userPermissions.includes(p))
            }
          }
          
          return userPermissions.includes(permissions)
        },
        checkPermission: (permissions: string[], mode = 'any') => {
          const userPermissions = ['store:read', 'store:create', 'expansion:read']
          let hasPermission = false
          let missingPermissions: string[] = []

          if (mode === 'all') {
            hasPermission = permissions.every(p => userPermissions.includes(p))
            missingPermissions = permissions.filter(p => !userPermissions.includes(p))
          } else {
            hasPermission = permissions.some(p => userPermissions.includes(p))
            if (!hasPermission) {
              missingPermissions = permissions
            }
          }

          return {
            hasPermission,
            missingPermissions,
            requiredPermissions: permissions,
            userPermissions
          }
        },
        loading: false
      })

      render(
        <div>
          <PermissionWrapper permissions="store:read">
            <div data-testid="should-show-1">Should show - has permission</div>
          </PermissionWrapper>
          <PermissionWrapper permissions="store:admin">
            <div data-testid="should-not-show-1">Should not show - no permission</div>
          </PermissionWrapper>
          <PermissionWrapper permissions={['store:read', 'expansion:read']} mode="all">
            <div data-testid="should-show-2">Should show - has all permissions</div>
          </PermissionWrapper>
          <PermissionWrapper permissions={['store:admin', 'super:admin']} mode="any">
            <div data-testid="should-not-show-2">Should not show - has no permissions</div>
          </PermissionWrapper>
        </div>
      )

      expect(screen.getByTestId('should-show-1')).toBeInTheDocument()
      expect(screen.queryByTestId('should-not-show-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('should-show-2')).toBeInTheDocument()
      expect(screen.queryByTestId('should-not-show-2')).not.toBeInTheDocument()

      // Check that access denied messages are shown for restricted content
      expect(screen.getAllByText('访问受限')).toHaveLength(2)
    })
  })
})