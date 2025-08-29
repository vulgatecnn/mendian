/**
 * PermissionButton Component Comprehensive Test Suite
 * 
 * Tests cover:
 * - Permission validation logic
 * - Button interaction states
 * - Tooltip behavior
 * - Hide/show functionality
 * - Click event handling
 * - All props combinations
 * - Performance and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import { expectAllClicksWork, testHelpers } from '@/test/utils'
import { PermissionButton } from '../permission'

// Mock the usePermission hook
const mockUsePermission = vi.fn()
vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => mockUsePermission()
}))

describe('PermissionButton', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    mockUsePermission.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render button with children when no permissions required', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton>
          Test Button
        </PermissionButton>
      )

      expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    it('should render button with all antd button props', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton
          type="primary"
          size="large"
          loading={false}
          disabled={false}
          icon={<span data-testid="button-icon">🔒</span>}
          className="custom-class"
          data-testid="permission-button"
        >
          Primary Button
        </PermissionButton>
      )

      const button = screen.getByTestId('permission-button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('custom-class')
      expect(screen.getByTestId('button-icon')).toBeInTheDocument()
    })

    it('should pass through all standard button props', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton
          id="test-button"
          role="button"
          tabIndex={0}
          aria-label="Test Permission Button"
        >
          Button Content
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Test Permission Button' })
      expect(button).toHaveAttribute('id', 'test-button')
      expect(button).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Permission Validation', () => {
    it('should render enabled button when user has required permission', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockImplementation((perms) => perms === 'store:create')
      })

      render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Create Store' })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })

    it('should render disabled button when user lacks required permission', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton permissions="store:delete">
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })

    it('should handle multiple permissions in any mode', () => {
      const hasPermissionMock = vi.fn()
        .mockImplementation((perms, mode) => {
          if (Array.isArray(perms) && mode === 'any') {
            return perms.includes('store:read')
          }
          return perms === 'store:read'
        })

      mockUsePermission.mockReturnValue({
        hasPermission: hasPermissionMock
      })

      render(
        <PermissionButton 
          permissions={['store:create', 'store:read']} 
          mode="any"
        >
          Store Action
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Store Action' })
      expect(button).not.toBeDisabled()
      expect(hasPermissionMock).toHaveBeenCalledWith(['store:create', 'store:read'], 'any')
    })

    it('should handle multiple permissions in all mode', () => {
      const hasPermissionMock = vi.fn()
        .mockImplementation((perms, mode) => {
          if (Array.isArray(perms) && mode === 'all') {
            return false // User doesn't have all permissions
          }
          return true
        })

      mockUsePermission.mockReturnValue({
        hasPermission: hasPermissionMock
      })

      render(
        <PermissionButton 
          permissions={['store:create', 'store:delete']} 
          mode="all"
        >
          Store Admin Action
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Store Admin Action' })
      expect(button).toBeDisabled()
      expect(hasPermissionMock).toHaveBeenCalledWith(['store:create', 'store:delete'], 'all')
    })
  })

  describe('Tooltip Behavior', () => {
    it('should show tooltip when user lacks permission', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton permissions="store:delete">
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      
      // Hover over the button to trigger tooltip
      await user.hover(button)
      
      await waitFor(() => {
        expect(screen.getByText('您没有权限执行此操作')).toBeInTheDocument()
      })
    })

    it('should show custom tooltip message', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton 
          permissions="store:delete"
          noPermissionTooltip="需要删除权限才能执行此操作"
        >
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      await user.hover(button)
      
      await waitFor(() => {
        expect(screen.getByText('需要删除权限才能执行此操作')).toBeInTheDocument()
      })
    })

    it('should not show tooltip when user has permission', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Create Store' })
      await user.hover(button)
      
      // Wait a bit to ensure tooltip doesn't appear
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(screen.queryByText('您没有权限执行此操作')).not.toBeInTheDocument()
    })

    it('should not show tooltip when noPermissionTooltip is empty', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton 
          permissions="store:delete"
          noPermissionTooltip=""
        >
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      await user.hover(button)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(screen.queryByText('您没有权限执行此操作')).not.toBeInTheDocument()
    })
  })

  describe('Hide When No Permission', () => {
    it('should hide button when hideWhenNoPermission is true and user lacks permission', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton 
          permissions="store:delete"
          hideWhenNoPermission={true}
        >
          Delete Store
        </PermissionButton>
      )

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should show button when hideWhenNoPermission is true but user has permission', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton 
          permissions="store:delete"
          hideWhenNoPermission={true}
        >
          Delete Store
        </PermissionButton>
      )

      expect(screen.getByRole('button', { name: 'Delete Store' })).toBeInTheDocument()
    })

    it('should show disabled button when hideWhenNoPermission is false', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton 
          permissions="store:delete"
          hideWhenNoPermission={false}
        >
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      expect(button).toBeInTheDocument()
      expect(button).toBeDisabled()
    })
  })

  describe('Click Event Handling', () => {
    it('should call onClick when user has permission and button is clicked', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="store:create" onClick={mockOnClick}>
          Create Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Create Store' })
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should not call onClick when user lacks permission', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton permissions="store:delete" onClick={mockOnClick}>
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      await user.click(button)

      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should call onNoPermission when user lacks permission and clicks', async () => {
      const mockOnClick = vi.fn()
      const mockOnNoPermission = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton 
          permissions="store:delete" 
          onClick={mockOnClick}
          onNoPermission={mockOnNoPermission}
        >
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      await user.click(button)

      expect(mockOnClick).not.toHaveBeenCalled()
      expect(mockOnNoPermission).toHaveBeenCalledTimes(1)
    })

    it('should prevent default and stop propagation when no permission', async () => {
      const mockOnClick = vi.fn()
      const mockOnNoPermission = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <div onClick={mockOnClick}>
          <PermissionButton 
            permissions="store:delete" 
            onNoPermission={mockOnNoPermission}
          >
            Delete Store
          </PermissionButton>
        </div>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      
      // Create a custom event to test preventDefault and stopPropagation
      const clickEvent = new MouseEvent('click', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation')
      
      fireEvent(button, clickEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(mockOnNoPermission).toHaveBeenCalled()
    })

    it('should handle disabled prop correctly with permissions', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton 
          permissions="store:create" 
          onClick={mockOnClick}
          disabled={true}
        >
          Create Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Create Store' })
      expect(button).toBeDisabled()
      
      await user.click(button)
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Permission Memoization', () => {
    it('should memoize permission checks', () => {
      const hasPermissionMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasPermission: hasPermissionMock
      })

      const { rerender } = render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      expect(hasPermissionMock).toHaveBeenCalledWith('store:create', 'any')
      hasPermissionMock.mockClear()

      // Rerender with same props
      rerender(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      // Should use memoized result
      expect(hasPermissionMock).toHaveBeenCalledTimes(1)
    })

    it('should recalculate when permissions change', () => {
      const hasPermissionMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasPermission: hasPermissionMock
      })

      const { rerender } = render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      expect(hasPermissionMock).toHaveBeenCalledWith('store:create', 'any')
      hasPermissionMock.mockClear()

      // Rerender with different permissions
      rerender(
        <PermissionButton permissions="store:delete">
          Delete Store
        </PermissionButton>
      )

      expect(hasPermissionMock).toHaveBeenCalledWith('store:delete', 'any')
    })

    it('should recalculate when mode changes', () => {
      const hasPermissionMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasPermission: hasPermissionMock
      })

      const { rerender } = render(
        <PermissionButton permissions={['store:create', 'store:read']} mode="any">
          Store Action
        </PermissionButton>
      )

      expect(hasPermissionMock).toHaveBeenCalledWith(['store:create', 'store:read'], 'any')
      hasPermissionMock.mockClear()

      // Change mode
      rerender(
        <PermissionButton permissions={['store:create', 'store:read']} mode="all">
          Store Action
        </PermissionButton>
      )

      expect(hasPermissionMock).toHaveBeenCalledWith(['store:create', 'store:read'], 'all')
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should pass comprehensive click testing when enabled', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      await expectAllClicksWork()
    })

    it('should handle keyboard interactions correctly', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="store:create" onClick={mockOnClick}>
          Create Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Create Store' })
      
      // Focus the button
      button.focus()
      expect(button).toHaveFocus()
      
      // Press Enter
      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalledTimes(1)
      
      // Press Space
      await user.keyboard(' ')
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('should not respond to keyboard when no permission', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton permissions="store:delete" onClick={mockOnClick}>
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      button.focus()
      
      await user.keyboard('{Enter}')
      await user.keyboard(' ')
      
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle usePermission hook errors gracefully', () => {
      mockUsePermission.mockImplementation(() => {
        throw new Error('Permission hook error')
      })

      expect(() => {
        render(
          <PermissionButton permissions="store:create">
            Create Store
          </PermissionButton>
        )
      }).toThrow('Permission hook error')
    })

    it('should handle invalid permission formats', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockImplementation(() => {
          throw new Error('Invalid permission format')
        })
      })

      expect(() => {
        render(
          <PermissionButton permissions={null as any}>
            Invalid Button
          </PermissionButton>
        )
      }).toThrow('Invalid permission format')
    })

    it('should handle onClick errors gracefully', async () => {
      const mockOnClick = vi.fn().mockImplementation(() => {
        throw new Error('Click handler error')
      })
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="store:create" onClick={mockOnClick}>
          Create Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Create Store' })
      
      expect(async () => {
        await user.click(button)
      }).rejects.toThrow('Click handler error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string permissions', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="">
          Empty Permission Button
        </PermissionButton>
      )

      expect(screen.getByRole('button')).not.toBeDisabled()
    })

    it('should handle null children gracefully', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      expect(() => {
        render(
          <PermissionButton permissions="store:create">
            {null}
          </PermissionButton>
        )
      }).not.toThrow()
    })

    it('should handle complex children structures', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="store:create">
          <span>Create</span>
          <strong>Store</strong>
          <em>Now</em>
        </PermissionButton>
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(screen.getByText('Create')).toBeInTheDocument()
      expect(screen.getByText('Store')).toBeInTheDocument()
      expect(screen.getByText('Now')).toBeInTheDocument()
    })
  })

  describe('Performance Testing', () => {
    it('should render efficiently', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      const renderStart = performance.now()
      render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )
      const renderEnd = performance.now()

      expect(renderEnd - renderStart).toBePerformant(50)
    })

    it('should not cause memory leaks during permission changes', () => {
      const memoryStart = testHelpers.getMemoryUsage()
      
      const hasPermissionMock = vi.fn().mockReturnValue(true)
      mockUsePermission.mockReturnValue({
        hasPermission: hasPermissionMock
      })

      const { rerender } = render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      // Simulate multiple permission changes
      const permissions = ['store:create', 'store:read', 'store:update', 'store:delete']
      permissions.forEach(permission => {
        rerender(
          <PermissionButton permissions={permission}>
            Store Action
          </PermissionButton>
        )
      })

      const memoryEnd = testHelpers.getMemoryUsage()
      const memoryDiff = memoryEnd - memoryStart

      expect(memoryDiff).toNotLeakMemory(512 * 1024) // Should not leak more than 512KB
    })

    it('should handle rapid click events efficiently', async () => {
      const mockOnClick = vi.fn()
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      render(
        <PermissionButton permissions="store:create" onClick={mockOnClick}>
          Create Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Create Store' })
      const clickStart = performance.now()
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        await user.click(button)
      }
      
      const clickEnd = performance.now()

      expect(clickEnd - clickStart).toBePerformant(100)
      expect(mockOnClick).toHaveBeenCalledTimes(10)
    })
  })

  describe('Accessibility', () => {
    it('should be accessible when enabled', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(true)
      })

      const { container } = render(
        <PermissionButton permissions="store:create">
          Create Store
        </PermissionButton>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should be accessible when disabled', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      const { container } = render(
        <PermissionButton permissions="store:delete">
          Delete Store
        </PermissionButton>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should maintain proper ARIA attributes', () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton 
          permissions="store:delete"
          aria-describedby="helper-text"
        >
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      expect(button).toHaveAttribute('aria-describedby', 'helper-text')
      expect(button).toHaveAttribute('disabled')
    })

    it('should support screen reader announcements', async () => {
      mockUsePermission.mockReturnValue({
        hasPermission: vi.fn().mockReturnValue(false)
      })

      render(
        <PermissionButton permissions="store:delete">
          Delete Store
        </PermissionButton>
      )

      const button = screen.getByRole('button', { name: 'Delete Store' })
      expect(button).toHaveAccessibleName('Delete Store')
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
        }
      })

      render(
        <div>
          <PermissionButton permissions="store:create">
            Should be enabled
          </PermissionButton>
          <PermissionButton permissions="store:delete">
            Should be disabled
          </PermissionButton>
          <PermissionButton permissions={['store:read', 'expansion:read']} mode="all">
            Should be enabled (has both)
          </PermissionButton>
          <PermissionButton permissions={['store:delete', 'store:admin']} mode="any">
            Should be disabled (has neither)
          </PermissionButton>
        </div>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).not.toBeDisabled() // store:create - has permission
      expect(buttons[1]).toBeDisabled()     // store:delete - no permission
      expect(buttons[2]).not.toBeDisabled() // both permissions - has both
      expect(buttons[3]).toBeDisabled()     // neither permission - has none
    })
  })
})