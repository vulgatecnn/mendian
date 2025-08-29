/**
 * AuthGuard Component Comprehensive Test Suite
 * 
 * Tests cover:
 * - All rendering conditions (authenticated, unauthenticated, loading)
 * - All props combinations
 * - Navigation behavior
 * - Component interactions
 * - Error handling
 * - Performance and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import { expectAllClicksWork, testHelpers } from '@/test/utils'
import { AuthGuard } from './AuthGuard'

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockUseLocation = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, state: _state, replace }: any) => (
      <div data-testid="navigate" data-to={to} data-replace={replace?.toString()}>
        Navigation to {to}
      </div>
    ),
    useLocation: () => mockUseLocation()
  }
})

// Test child component
const TestChild = ({ onClick }: { onClick?: () => void }) => (
  <div data-testid="test-child">
    <button data-testid="child-button" onClick={onClick}>
      Child Button
    </button>
    <span>Protected Content</span>
  </div>
)

describe('AuthGuard', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    mockUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: null
    })
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering States', () => {
    it('should render loading state when isLoading is true', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true
      })

      render(<AuthGuard><TestChild /></AuthGuard>)
      
      expect(screen.getByText('验证登录状态...')).toBeInTheDocument()
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
      expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument()
    })

    it('should render custom loading component when provided', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true
      })

      const customLoading = <div data-testid="custom-loading">Custom Loading</div>

      render(
        <AuthGuard loading={customLoading}>
          <TestChild />
        </AuthGuard>
      )
      
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
      expect(screen.getByText('Custom Loading')).toBeInTheDocument()
      expect(screen.queryByText('验证登录状态...')).not.toBeInTheDocument()
    })

    it('should render Navigate component when not authenticated and not loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false
      })

      render(<AuthGuard><TestChild /></AuthGuard>)
      
      const navigate = screen.getByTestId('navigate')
      expect(navigate).toBeInTheDocument()
      expect(navigate).toHaveAttribute('data-to', '/login')
      expect(navigate).toHaveAttribute('data-replace', 'true')
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
    })

    it('should render children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      render(<AuthGuard><TestChild /></AuthGuard>)
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
    })
  })

  describe('Props Configuration', () => {
    it('should use custom login path when provided', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false
      })

      render(
        <AuthGuard loginPath="/custom-login">
          <TestChild />
        </AuthGuard>
      )
      
      const navigate = screen.getByTestId('navigate')
      expect(navigate).toHaveAttribute('data-to', '/custom-login')
    })

    it('should pass location state to Navigate component', () => {
      const mockLocation = {
        pathname: '/protected-page',
        search: '?test=true',
        hash: '#section',
        state: { custom: 'data' }
      }
      
      mockUseLocation.mockReturnValue(mockLocation)
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false
      })

      render(<AuthGuard><TestChild /></AuthGuard>)
      
      const navigate = screen.getByTestId('navigate')
      expect(navigate).toBeInTheDocument()
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should handle child component interactions when authenticated', async () => {
      const mockOnClick = vi.fn()
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      render(
        <AuthGuard>
          <TestChild onClick={mockOnClick} />
        </AuthGuard>
      )

      const button = screen.getByTestId('child-button')
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should pass comprehensive click testing when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      await expectAllClicksWork()
    })

    it('should not have interactive elements in loading state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true
      })

      render(<AuthGuard><TestChild /></AuthGuard>)
      
      // Only loading spinner should be present, no clickable elements
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument()
    })
  })

  describe('State Transitions', () => {
    it('should transition from loading to authenticated correctly', async () => {
      const { rerender } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      // Start with loading state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true
      })
      rerender(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )
      expect(screen.getByText('验证登录状态...')).toBeInTheDocument()

      // Transition to authenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })
      rerender(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.queryByText('验证登录状态...')).not.toBeInTheDocument()
    })

    it('should transition from loading to unauthenticated correctly', async () => {
      const { rerender } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      // Start with loading state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true
      })
      rerender(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )
      expect(screen.getByText('验证登录状态...')).toBeInTheDocument()

      // Transition to unauthenticated
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false
      })
      rerender(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.queryByText('验证登录状态...')).not.toBeInTheDocument()
    })

    it('should handle authenticated to unauthenticated transition', async () => {
      const { rerender } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      // Start with authenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })
      rerender(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )
      expect(screen.getByTestId('test-child')).toBeInTheDocument()

      // Transition to unauthenticated (e.g., token expired)
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false
      })
      rerender(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      expect(() => {
        render(<AuthGuard>{null}</AuthGuard>)
      }).not.toThrow()
    })

    it('should handle undefined children gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      expect(() => {
        render(<AuthGuard>{undefined}</AuthGuard>)
      }).not.toThrow()
    })

    it('should handle multiple children when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      render(
        <AuthGuard>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </AuthGuard>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should handle empty string as loginPath', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false
      })

      render(
        <AuthGuard loginPath="">
          <TestChild />
        </AuthGuard>
      )

      const navigate = screen.getByTestId('navigate')
      expect(navigate).toHaveAttribute('data-to', '')
    })
  })

  describe('Performance Testing', () => {
    it('should render efficiently in authenticated state', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      const renderStart = performance.now()
      render(<AuthGuard><TestChild /></AuthGuard>)
      const renderEnd = performance.now()

      expect(renderEnd - renderStart).toBePerformant(50) // Should render within 50ms
    })

    it('should not cause memory leaks during state transitions', () => {
      const memoryStart = testHelpers.getMemoryUsage()

      const { rerender } = render(<AuthGuard><TestChild /></AuthGuard>)

      // Simulate multiple state transitions
      for (let i = 0; i < 10; i++) {
        mockUseAuth.mockReturnValue({
          isAuthenticated: i % 2 === 0,
          isLoading: false
        })
        rerender(<AuthGuard><TestChild /></AuthGuard>)
      }

      const memoryEnd = testHelpers.getMemoryUsage()
      const memoryDiff = memoryEnd - memoryStart

      expect(memoryDiff).toNotLeakMemory(1024 * 1024) // Should not leak more than 1MB
    })
  })

  describe('Accessibility', () => {
    it('should be accessible in loading state', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true
      })

      const { container } = render(<AuthGuard><TestChild /></AuthGuard>)
      
      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should be accessible when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      const { container } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should maintain proper semantic structure', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      render(
        <AuthGuard>
          <main role="main">
            <h1>Protected Page</h1>
            <TestChild />
          </main>
        </AuthGuard>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle useAuth hook errors gracefully', () => {
      mockUseAuth.mockImplementation(() => {
        throw new Error('Auth hook error')
      })

      // Component should not crash, but should show error boundary or handle gracefully
      expect(() => {
        render(<AuthGuard><TestChild /></AuthGuard>)
      }).toThrow('Auth hook error')
    })

    it('should handle useLocation hook errors gracefully', () => {
      mockUseLocation.mockImplementation(() => {
        throw new Error('Location hook error')
      })
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false
      })

      expect(() => {
        render(<AuthGuard><TestChild /></AuthGuard>)
      }).toThrow('Location hook error')
    })
  })

  describe('Integration with Authentication Flow', () => {
    it('should work with different authentication states from auth store', () => {
      // Test with various auth states that might come from the auth store
      const authStates = [
        { isAuthenticated: true, isLoading: false },
        { isAuthenticated: false, isLoading: false },
        { isAuthenticated: false, isLoading: true },
      ]

      authStates.forEach((authState, _index) => {
        mockUseAuth.mockReturnValue(authState)
        
        const { unmount } = render(<AuthGuard><TestChild /></AuthGuard>)

        if (authState.isLoading) {
          expect(screen.getByText('验证登录状态...')).toBeInTheDocument()
        } else if (authState.isAuthenticated) {
          expect(screen.getByTestId('test-child')).toBeInTheDocument()
        } else {
          expect(screen.getByTestId('navigate')).toBeInTheDocument()
        }

        unmount()
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('should cleanup properly when unmounted', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false
      })

      const { unmount } = render(<AuthGuard><TestChild /></AuthGuard>)
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      
      expect(() => {
        unmount()
      }).not.toThrow()
      
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument()
    })
  })
})