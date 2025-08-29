/**
 * RoleGuard Component Comprehensive Test Suite
 * 
 * Tests cover:
 * - All role checking scenarios (any/all modes)
 * - Permission validation flows
 * - Custom fallback components
 * - Interactive elements
 * - Error states and edge cases
 * - Performance and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import { expectAllClicksWork, testHelpers } from '@/test/utils'
import { RoleGuard } from './RoleGuard'
import { UserRoleCode } from '../../constants/roles'

// Mock the usePermission hook
const mockUsePermission = vi.fn()
vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => mockUsePermission()
}))

// Test child component
const TestChild = ({ onClick }: { onClick?: () => void }) => (
  <div data-testid="test-child">
    <button data-testid="child-button" onClick={onClick}>
      Role Protected Action
    </button>
    <span>Role Protected Content</span>
  </div>
)

// Custom fallback component
const CustomFallback = () => (
  <div data-testid="custom-fallback">
    <h3>Custom Access Denied</h3>
    <p>You need different permissions</p>
    <button data-testid="fallback-button">Request Access</button>
  </div>
)

describe('RoleGuard', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Reset mock
    mockUsePermission.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Single Role Validation', () => {
    it('should render children when user has required role', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: [
          { id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }
        ]
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Role Protected Content')).toBeInTheDocument()
      expect(screen.queryByText('角色权限不足')).not.toBeInTheDocument()
    })

    it('should show access denied when user lacks required role', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: [
          { id: '2', code: 'USER' as UserRoleCode, name: '普通用户' }
        ]
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
      expect(screen.getByText('角色权限不足')).toBeInTheDocument()
      expect(screen.getByText('您的角色无权访问此内容')).toBeInTheDocument()
      expect(screen.getByText('需要角色: ADMIN')).toBeInTheDocument()
      expect(screen.getByText('当前角色: 普通用户')).toBeInTheDocument()
    })

    it('should handle null/undefined roles gracefully', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: null
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByText('当前角色: 无')).toBeInTheDocument()
    })
  })

  describe('Multiple Roles Validation', () => {
    it('should render children when user has any required role (default mode)', () => {
      const hasRoleMock = vi.fn()
        .mockImplementation((role: string) => role === 'MANAGER')

      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [
          { id: '3', code: 'MANAGER' as UserRoleCode, name: '管理员' }
        ]
      })

      render(
        <RoleGuard roles={['ADMIN', 'MANAGER'] as UserRoleCode[]}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(hasRoleMock).toHaveBeenCalledWith('ADMIN')
      expect(hasRoleMock).toHaveBeenCalledWith('MANAGER')
    })

    it('should render children when user has all required roles (all mode)', () => {
      const hasRoleMock = vi.fn().mockReturnValue(true)

      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [
          { id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' },
          { id: '3', code: 'MANAGER' as UserRoleCode, name: '管理员' }
        ]
      })

      render(
        <RoleGuard 
          roles={['ADMIN', 'MANAGER'] as UserRoleCode[]} 
          mode="all"
        >
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(hasRoleMock).toHaveBeenCalledWith('ADMIN')
      expect(hasRoleMock).toHaveBeenCalledWith('MANAGER')
    })

    it('should show access denied when user lacks all required roles (all mode)', () => {
      const hasRoleMock = vi.fn()
        .mockImplementation((role: string) => role === 'ADMIN')

      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [
          { id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }
        ]
      })

      render(
        <RoleGuard 
          roles={['ADMIN', 'MANAGER'] as UserRoleCode[]} 
          mode="all"
        >
          <TestChild />
        </RoleGuard>
      )

      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
      expect(screen.getByText('角色权限不足')).toBeInTheDocument()
      expect(screen.getByText('需要角色: ADMIN, MANAGER')).toBeInTheDocument()
    })

    it('should show access denied when user has no required roles (any mode)', () => {
      const hasRoleMock = vi.fn().mockReturnValue(false)

      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [
          { id: '2', code: 'USER' as UserRoleCode, name: '普通用户' }
        ]
      })

      render(
        <RoleGuard roles={['ADMIN', 'MANAGER'] as UserRoleCode[]}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
      expect(screen.getByText('角色权限不足')).toBeInTheDocument()
    })
  })

  describe('Custom Props and Configuration', () => {
    it('should render custom fallback component when provided', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN} fallback={<CustomFallback />}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Access Denied')).toBeInTheDocument()
      expect(screen.queryByText('角色权限不足')).not.toBeInTheDocument()
    })

    it('should use custom titles and subtitles', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      render(
        <RoleGuard 
          roles={UserRoleCode.ADMIN}
          noRoleTitle="自定义权限标题"
          noRoleSubtitle="自定义权限副标题"
        >
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByText('自定义权限标题')).toBeInTheDocument()
      expect(screen.getByText('自定义权限副标题')).toBeInTheDocument()
    })

    it('should handle empty role array', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: []
      })

      render(
        <RoleGuard roles={[]}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('should allow access when no roles specified', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      render(
        <RoleGuard roles={undefined as any}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should handle child interactions when access is granted', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild onClick={mockOnClick} />
        </RoleGuard>
      )

      const button = screen.getByTestId('child-button')
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should handle fallback component interactions', async () => {
      const mockFallbackClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      const InteractiveFallback = () => (
        <div data-testid="interactive-fallback">
          <button data-testid="request-button" onClick={mockFallbackClick}>
            Request Access
          </button>
        </div>
      )

      render(
        <RoleGuard roles={UserRoleCode.ADMIN} fallback={<InteractiveFallback />}>
          <TestChild />
        </RoleGuard>
      )

      const button = screen.getByTestId('request-button')
      await user.click(button)

      expect(mockFallbackClick).toHaveBeenCalledTimes(1)
    })

    it('should pass comprehensive click testing when access granted', async () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      await expectAllClicksWork()
    })

    it('should pass comprehensive click testing for fallback component', async () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN} fallback={<CustomFallback />}>
          <TestChild />
        </RoleGuard>
      )

      await expectAllClicksWork()
    })
  })

  describe('Role Checking Logic', () => {
    it('should memoize role checking results', () => {
      const hasRoleMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      const { rerender } = render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      expect(hasRoleMock).toHaveBeenCalledWith('ADMIN')
      hasRoleMock.mockClear()

      // Rerender with same props - should use memoized result
      rerender(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      // hasRole should not be called again due to memoization
      expect(hasRoleMock).toHaveBeenCalledTimes(1)
    })

    it('should recalculate when roles change', () => {
      const hasRoleMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      const { rerender } = render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      expect(hasRoleMock).toHaveBeenCalledWith('ADMIN')
      hasRoleMock.mockClear()

      // Rerender with different roles
      rerender(
        <RoleGuard roles={UserRoleCode.BUSINESS}>
          <TestChild />
        </RoleGuard>
      )

      expect(hasRoleMock).toHaveBeenCalledWith('MANAGER')
    })

    it('should recalculate when mode changes', () => {
      const hasRoleMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      const { rerender } = render(
        <RoleGuard roles={['ADMIN', 'MANAGER'] as UserRoleCode[]} mode="any">
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()

      // Change mode to 'all' - should recalculate
      rerender(
        <RoleGuard roles={['ADMIN', 'MANAGER'] as UserRoleCode[]} mode="all">
          <TestChild />
        </RoleGuard>
      )

      // Should still show child since user has ADMIN role
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle usePermission hook errors gracefully', () => {
      mockUsePermission.mockImplementation(() => {
        throw new Error('Permission hook error')
      })

      expect(() => {
        render(
          <RoleGuard roles={UserRoleCode.ADMIN}>
            <TestChild />
          </RoleGuard>
        )
      }).toThrow('Permission hook error')
    })

    it('should handle invalid role types', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      render(
        <RoleGuard roles={null as any}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('should handle hasRole function errors', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockImplementation(() => {
          throw new Error('Role check error')
        }),
        roles: []
      })

      expect(() => {
        render(
          <RoleGuard roles={UserRoleCode.ADMIN}>
            <TestChild />
          </RoleGuard>
        )
      }).toThrow('Role check error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: []
      })

      expect(() => {
        render(
          <RoleGuard roles={UserRoleCode.ADMIN}>
            {null}
          </RoleGuard>
        )
      }).not.toThrow()
    })

    it('should handle undefined children gracefully', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: []
      })

      expect(() => {
        render(
          <RoleGuard roles={UserRoleCode.ADMIN}>
            {undefined}
          </RoleGuard>
        )
      }).not.toThrow()
    })

    it('should handle multiple children when access granted', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </RoleGuard>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should handle role names with special characters', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: [
          { id: '1', code: 'SPECIAL' as UserRoleCode, name: '特殊角色@#$%' }
        ]
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByText('当前角色: 特殊角色@#$%')).toBeInTheDocument()
    })
  })

  describe('Performance Testing', () => {
    it('should render efficiently with role checking', async () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      const renderStart = performance.now()
      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )
      const renderEnd = performance.now()

      expect(renderEnd - renderStart).toBePerformant(50)
    })

    it('should not cause memory leaks during role updates', () => {
      const memoryStart = testHelpers.getMemoryUsage()
      
      const hasRoleMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasRole: hasRoleMock,
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      const { rerender } = render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      // Simulate multiple role changes
      const roles: UserRoleCode[] = [UserRoleCode.ADMIN, UserRoleCode.BUSINESS, UserRoleCode.OPERATION, UserRoleCode.ADMIN]
      roles.forEach(role => {
        rerender(
          <RoleGuard roles={role}>
            <TestChild />
          </RoleGuard>
        )
      })

      const memoryEnd = testHelpers.getMemoryUsage()
      const memoryDiff = memoryEnd - memoryStart

      expect(memoryDiff).toNotLeakMemory(512 * 1024) // Should not leak more than 512KB
    })
  })

  describe('Accessibility', () => {
    it('should be accessible when access granted', async () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(true),
        roles: [{ id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' }]
      })

      const { container } = render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should be accessible when access denied', async () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      const { container } = render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should maintain proper semantic structure in error state', () => {
      mockUsePermission.mockReturnValue({
        hasRole: vi.fn().mockReturnValue(false),
        roles: []
      })

      render(
        <RoleGuard roles={UserRoleCode.ADMIN}>
          <TestChild />
        </RoleGuard>
      )

      // The Result component should have proper ARIA attributes
      expect(screen.getByText('角色权限不足')).toBeInTheDocument()
      expect(screen.getByText('您的角色无权访问此内容')).toBeInTheDocument()
    })
  })

  describe('Integration Testing', () => {
    it('should work with real permission system', () => {
      // Simulate real permission hook behavior
      mockUsePermission.mockReturnValue({
        hasRole: (roleCode: string) => {
          const userRoles = ['ADMIN', 'MANAGER']
          return userRoles.includes(roleCode)
        },
        roles: [
          { id: '1', code: 'ADMIN' as UserRoleCode, name: '系统管理员' },
          { id: '2', code: 'MANAGER' as UserRoleCode, name: '管理员' }
        ]
      })

      render(
        <RoleGuard roles={['ADMIN', 'SUPER_ADMIN'] as UserRoleCode[]}>
          <TestChild />
        </RoleGuard>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })
  })
})