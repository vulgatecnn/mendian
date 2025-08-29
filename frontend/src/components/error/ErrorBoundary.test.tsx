/**
 * ErrorBoundary Component Comprehensive Test Suite
 * 
 * Tests cover:
 * - Error catching and handling
 * - Error boundary state management
 * - Custom fallback components
 * - Error callbacks and reporting
 * - Retry functionality
 * - Navigation actions
 * - HOC wrapper functionality
 * - useErrorHandler hook
 * - Edge cases and accessibility
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectAllClicksWork, testHelpers } from '@/test/utils'
import { ErrorBoundary, useErrorHandler, withErrorBoundary } from './ErrorBoundary'

// Component that throws an error
const ThrowErrorComponent = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div data-testid="working-component">Component is working</div>
}

// Component for testing the error handler hook
const ErrorHandlerTestComponent = () => {
  const handleError = useErrorHandler()
  
  return (
    <button 
      data-testid="trigger-error"
      onClick={() => handleError(new Error('Hook error'), { componentStack: 'test stack' })}
    >
      Trigger Error
    </button>
  )
}

// Component for testing HOC
const TestComponent = ({ name }: { name: string }) => (
  <div data-testid="hoc-component">Hello, {name}!</div>
)

const WrappedComponent = withErrorBoundary(TestComponent)

// Mock window methods
const originalLocation = window.location
const mockReload = vi.fn()
const mockAssign = vi.fn()

Object.defineProperty(window, 'location', {
  value: {
    ...originalLocation,
    reload: mockReload,
    href: '',
    assign: mockAssign
  },
  writable: true
})

describe('ErrorBoundary', () => {
  const user = userEvent.setup()
  
  // Suppress console.error during tests since we're testing error scenarios
  const originalConsoleError = console.error
  
  beforeEach(() => {
    console.error = vi.fn()
    vi.clearAllMocks()
    mockReload.mockClear()
    mockAssign.mockClear()
  })

  afterEach(() => {
    console.error = originalConsoleError
    vi.clearAllMocks()
  })

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.getByText('Component is working')).toBeInTheDocument()
    })

    it('should render multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('working-component')).toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} errorMessage="Test error message" />
        </ErrorBoundary>
      )

      expect(screen.getByText('页面出现错误')).toBeInTheDocument()
      expect(screen.getByText('抱歉，页面发生了意外错误，请尝试刷新页面或联系技术支持')).toBeInTheDocument()
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument()
    })

    it('should display error ID in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('错误ID:')).toBeInTheDocument()
      expect(screen.getByText(/error_\d+_\w+/)).toBeInTheDocument()
    })

    it('should display error details in collapsible panel', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} errorMessage="Detailed error message" />
        </ErrorBoundary>
      )

      // Error details should be in collapsible panel
      const errorDetailsButton = screen.getByText('错误详情')
      expect(errorDetailsButton).toBeInTheDocument()

      // Expand error details
      await user.click(errorDetailsButton)

      expect(screen.getByText('错误信息:')).toBeInTheDocument()
      expect(screen.getByText('Detailed error message')).toBeInTheDocument()
    })

    it('should display error stack when available', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} errorMessage="Stack error" />
        </ErrorBoundary>
      )

      // Expand error details
      await user.click(screen.getByText('错误详情'))

      expect(screen.getByText('错误堆栈:')).toBeInTheDocument()
      // Error stack should contain error information
      const stackElement = screen.getByText(/at ThrowErrorComponent|Stack error/)
      expect(stackElement).toBeInTheDocument()
    })

    it('should call onError callback when error occurs', () => {
      const mockOnError = vi.fn()

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowErrorComponent shouldThrow={true} errorMessage="Callback error" />
        </ErrorBoundary>
      )

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })
  })

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = (error: Error, errorInfo: any, retry: () => void) => (
        <div data-testid="custom-fallback">
          <h1>Custom Error Page</h1>
          <p>Error: {error.message}</p>
          <button onClick={retry} data-testid="custom-retry">
            Custom Retry
          </button>
        </div>
      )

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowErrorComponent shouldThrow={true} errorMessage="Custom fallback error" />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error Page')).toBeInTheDocument()
      expect(screen.getByText('Error: Custom fallback error')).toBeInTheDocument()
      expect(screen.getByTestId('custom-retry')).toBeInTheDocument()
      
      // Should not show default error page
      expect(screen.queryByText('页面出现错误')).not.toBeInTheDocument()
    })

    it('should handle custom fallback retry function', async () => {
      const customFallback = (error: Error, errorInfo: any, retry: () => void) => (
        <div data-testid="custom-fallback">
          <button onClick={retry} data-testid="custom-retry">
            Retry
          </button>
        </div>
      )

      const { rerender } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()

      // Click retry
      await user.click(screen.getByTestId('custom-retry'))

      // Rerender with working component
      rerender(
        <ErrorBoundary fallback={customFallback}>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument()
    })
  })

  describe('Error Recovery Actions', () => {
    it('should handle retry button click', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('页面出现错误')).toBeInTheDocument()

      const retryButton = screen.getByText('重试')
      await user.click(retryButton)

      // Rerender with working component after retry
      rerender(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.queryByText('页面出现错误')).not.toBeInTheDocument()
    })

    it('should handle refresh page button click', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      const refreshButton = screen.getByText('刷新页面')
      await user.click(refreshButton)

      expect(mockReload).toHaveBeenCalledTimes(1)
    })

    it('should handle go home button click', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      const homeButton = screen.getByText('返回首页')
      await user.click(homeButton)

      expect(window.location.href).toBe('/')
    })

    it('should handle error reporting', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} errorMessage="Reportable error" />
        </ErrorBoundary>
      )

      // Expand error details
      await user.click(screen.getByText('错误详情'))

      // Click report error button
      const reportButton = screen.getByText('报告错误')
      await user.click(reportButton)

      expect(consoleSpy).toHaveBeenCalledWith('Report error:', expect.objectContaining({
        error: 'Reportable error',
        stack: expect.any(String),
        errorId: expect.stringMatching(/error_\d+_\w+/)
      }))

      consoleSpy.mockRestore()
    })
  })

  describe('Error State Management', () => {
    it('should generate unique error IDs', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      const firstErrorId = screen.getByText(/error_\d+_\w+/).textContent

      // Trigger retry to generate new error ID
      user.click(screen.getByText('重试'))
      
      rerender(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      const secondErrorId = screen.getByText(/error_\d+_\w+/).textContent

      expect(firstErrorId).not.toEqual(secondErrorId)
    })

    it('should reset error state on retry', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('页面出现错误')).toBeInTheDocument()

      const retryButton = screen.getByText('重试')
      await user.click(retryButton)

      rerender(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('working-component')).toBeInTheDocument()
      expect(screen.queryByText('页面出现错误')).not.toBeInTheDocument()
    })

    it('should handle errors without component stack', () => {
      // Create a mock error without componentStack in errorInfo
      const ErrorComponentWithoutStack = () => {
        throw new Error('Error without stack')
      }

      render(
        <ErrorBoundary>
          <ErrorComponentWithoutStack />
        </ErrorBoundary>
      )

      expect(screen.getByText('页面出现错误')).toBeInTheDocument()
      expect(screen.getByText('错误详情')).toBeInTheDocument()
    })
  })

  describe('useErrorHandler Hook', () => {
    it('should provide error handling function', () => {
      render(<ErrorHandlerTestComponent />)

      expect(screen.getByTestId('trigger-error')).toBeInTheDocument()
    })

    it('should handle errors when called', async () => {
      const consoleSpy = vi.spyOn(console, 'error')

      render(<ErrorHandlerTestComponent />)

      await user.click(screen.getByTestId('trigger-error'))

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handled:',
        expect.objectContaining({ message: 'Hook error' }),
        { componentStack: 'test stack' }
      )

      consoleSpy.mockRestore()
    })

    it('should memoize error handler function', () => {
      const { rerender } = render(<ErrorHandlerTestComponent />)
      
      const button = screen.getByTestId('trigger-error')
      const initialOnClick = button.onclick

      rerender(<ErrorHandlerTestComponent />)

      // The onClick handler should be the same (memoized)
      expect(button.onclick).toBe(initialOnClick)
    })
  })

  describe('withErrorBoundary HOC', () => {
    it('should render wrapped component normally', () => {
      render(<WrappedComponent name="Test User" />)

      expect(screen.getByTestId('hoc-component')).toBeInTheDocument()
      expect(screen.getByText('Hello, Test User!')).toBeInTheDocument()
    })

    it('should catch errors in wrapped component', () => {
      const ThrowingWrappedComponent = withErrorBoundary(() => {
        throw new Error('HOC error')
      })

      render(<ThrowingWrappedComponent />)

      expect(screen.getByText('页面出现错误')).toBeInTheDocument()
    })

    it('should apply custom error boundary config', () => {
      const mockOnError = vi.fn()
      const customFallback = (error: Error) => (
        <div data-testid="hoc-custom-fallback">HOC Error: {error.message}</div>
      )

      const ConfiguredWrappedComponent = withErrorBoundary(
        () => { throw new Error('Configured error') },
        { 
          fallback: customFallback,
          onError: mockOnError
        }
      )

      render(<ConfiguredWrappedComponent />)

      expect(screen.getByTestId('hoc-custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('HOC Error: Configured error')).toBeInTheDocument()
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Configured error' }),
        expect.any(Object)
      )
    })

    it('should preserve component displayName', () => {
      const NamedComponent = () => <div>Named Component</div>
      NamedComponent.displayName = 'CustomName'

      const WrappedNamed = withErrorBoundary(NamedComponent)

      expect(WrappedNamed.displayName).toBe('withErrorBoundary(CustomName)')
    })

    it('should use component name when displayName is not available', () => {
      function ComponentWithName() {
        return <div>Component With Name</div>
      }

      const WrappedWithName = withErrorBoundary(ComponentWithName)

      expect(WrappedWithName.displayName).toBe('withErrorBoundary(ComponentWithName)')
    })

    it('should forward refs correctly', () => {
      const RefComponent = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>((props, ref) => (
        <div ref={ref} data-testid="ref-component">
          {props.children}
        </div>
      ))

      const WrappedRefComponent = withErrorBoundary(RefComponent)
      const ref = React.createRef<HTMLDivElement>()

      render(
        <WrappedRefComponent ref={ref}>
          Ref content
        </WrappedRefComponent>
      )

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(screen.getByTestId('ref-component')).toBeInTheDocument()
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should pass comprehensive click testing', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      await expectAllClicksWork()
    })

    it('should handle keyboard navigation', async () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      const retryButton = screen.getByText('重试')
      
      // Button should be focusable
      retryButton.focus()
      expect(retryButton).toHaveFocus()

      // Should be activatable with Enter
      await user.keyboard('{Enter}')
      // Note: This would trigger retry, but since component hasn't changed, still shows error
    })
  })

  describe('Edge Cases', () => {
    it('should handle errors without message', () => {
      const ErrorWithoutMessage = () => {
        const error = new Error()
        error.message = ''
        throw error
      }

      render(
        <ErrorBoundary>
          <ErrorWithoutMessage />
        </ErrorBoundary>
      )

      expect(screen.getByText('页面出现错误')).toBeInTheDocument()
    })

    it('should handle errors without stack trace', async () => {
      const ErrorWithoutStack = () => {
        const error = new Error('No stack error')
        error.stack = undefined
        throw error
      }

      render(
        <ErrorBoundary>
          <ErrorWithoutStack />
        </ErrorBoundary>
      )

      expect(screen.getByText('页面出现错误')).toBeInTheDocument()
      
      // Expand details to check if it handles missing stack gracefully
      await user.click(screen.getByText('错误详情'))
      expect(screen.getByText('错误信息:')).toBeInTheDocument()
    })

    it('should handle null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      )

      // Should not crash with null children
      expect(document.body).toBeInTheDocument()
    })

    it('should handle async errors gracefully', async () => {
      const AsyncErrorComponent = () => {
        React.useEffect(() => {
          // Async errors are not caught by error boundaries
          // This test ensures the component doesn't break
          setTimeout(() => {
            console.error('Async error - not caught by boundary')
          }, 0)
        }, [])

        return <div data-testid="async-component">Async Component</div>
      }

      render(
        <ErrorBoundary>
          <AsyncErrorComponent />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('async-component')).toBeInTheDocument()
      
      // Wait for async operation
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Async error - not caught by boundary')
      }, { timeout: 100 })
    })
  })

  describe('Performance and Memory', () => {
    it('should not cause memory leaks during multiple error/recovery cycles', async () => {
      const memoryStart = testHelpers.getMemoryUsage()

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      // Simulate multiple error/recovery cycles
      for (let i = 0; i < 10; i++) {
        // Retry
        await user.click(screen.getByText('重试'))
        
        // Rerender with working component
        rerender(
          <ErrorBoundary>
            <ThrowErrorComponent shouldThrow={false} />
          </ErrorBoundary>
        )

        // Rerender with error component
        rerender(
          <ErrorBoundary>
            <ThrowErrorComponent shouldThrow={true} />
          </ErrorBoundary>
        )
      }

      const memoryEnd = testHelpers.getMemoryUsage()
      const memoryDiff = memoryEnd - memoryStart

      expect(memoryDiff).toNotLeakMemory(2 * 1024 * 1024) // Should not leak more than 2MB
    })

    it('should render efficiently even with large error stacks', async () => {
      const LargeStackError = () => {
        const error = new Error('Large stack error')
        error.stack = 'at Component (' + 'x'.repeat(10000) + ')'
        throw error
      }

      const renderStart = performance.now()
      render(
        <ErrorBoundary>
          <LargeStackError />
        </ErrorBoundary>
      )
      const renderEnd = performance.now()

      expect(renderEnd - renderStart).toBePerformant(100)
      expect(screen.getByText('页面出现错误')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible in error state', async () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should have proper ARIA attributes and structure', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      // Should have proper headings and structure
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      // All buttons should be accessible
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('should provide good screen reader experience', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ErrorBoundary>
      )

      // Main error message should be prominent
      expect(screen.getByText('页面出现错误')).toBeInTheDocument()
      
      // Buttons should have clear labels
      expect(screen.getByText('重试')).toBeInTheDocument()
      expect(screen.getByText('刷新页面')).toBeInTheDocument()
      expect(screen.getByText('返回首页')).toBeInTheDocument()
    })
  })
})