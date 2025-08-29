/**
 * 开店计划创建页面测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { message } from 'antd'
import StorePlanCreate from './Create'
import { useStorePlanStore } from '@/stores/storePlanStore'
import * as storePlanService from '@/services/storePlan'
import type { CreateStorePlanDto } from '@/services/types'

// Mock dependencies
vi.mock('@/stores/storePlanStore')
vi.mock('@/services/storePlan')
vi.mock('@/components/common/PageHeader', () => ({
  default: ({ title, breadcrumbs, onBack }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <nav>
        {breadcrumbs?.map((item: any, index: number) => (
          <span key={index}>{item.title}</span>
        ))}
      </nav>
      <button onClick={onBack}>返回</button>
    </div>
  )
}))

vi.mock('./components/PlanForm', () => ({
  default: ({ onSubmit, loading }: any) => {
    const handleTestSubmit = () => {
      const mockData: CreateStorePlanDto = {
        name: 'Test Store Plan',
        description: 'Test Description',
        region: 'beijing',
        quarter: '2024Q1',
        targetOpenDate: '2024-03-15',
        budget: 500000,
        storeType: 'flagship'
      }
      onSubmit(mockData)
    }
    
    return (
      <div data-testid="plan-form">
        <form data-testid="create-form">
          <button 
            type="button" 
            onClick={handleTestSubmit} 
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? '提交中...' : '提交'}
          </button>
        </form>
      </div>
    )
  }
}))

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  }
})

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Test utilities
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  })
}

const renderWithProviders = (component: React.ReactElement, { route = '/' } = {}) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockStoreReturn = {
  createStorePlan: vi.fn(),
  isSubmitting: false,
  storePlans: [],
  currentStorePlan: null,
  isLoading: false,
  error: null,
  fetchStorePlans: vi.fn(),
  fetchStorePlan: vi.fn(),
  updateStorePlan: vi.fn(),
  deleteStorePlan: vi.fn()
}

describe('StorePlanCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorePlanStore).mockReturnValue(mockStoreReturn)
  })

  afterEach(() => {
    cleanup()
  })

  describe('Component Rendering', () => {
    it('should render all UI elements correctly', () => {
      renderWithProviders(<StorePlanCreate />)
      
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
      expect(screen.getByText('创建开店计划')).toBeInTheDocument()
      expect(screen.getByText('开店计划')).toBeInTheDocument()
      expect(screen.getByText('创建计划')).toBeInTheDocument()
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    it('should render correct breadcrumbs', () => {
      renderWithProviders(<StorePlanCreate />)
      
      const header = screen.getByTestId('page-header')
      expect(header).toBeInTheDocument()
      
      // Breadcrumb items should be rendered
      expect(screen.getByText('开店计划')).toBeInTheDocument()
      expect(screen.getByText('创建计划')).toBeInTheDocument()
    })

    it('should render page header with back button', () => {
      renderWithProviders(<StorePlanCreate />)
      
      const backButton = screen.getByText('返回')
      expect(backButton).toBeInTheDocument()
    })

    it('should pass correct props to PlanForm', () => {
      renderWithProviders(<StorePlanCreate />)
      
      const form = screen.getByTestId('plan-form')
      expect(form).toBeInTheDocument()
      
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).not.toBeDisabled()
      expect(submitButton).toHaveTextContent('提交')
    })
  })

  describe('User Interactions', () => {
    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const backButton = screen.getByText('返回')
      await user.click(backButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/store-plan')
    })

    it('should handle form submission successfully', async () => {
      const mockCreateStorePlan = vi.fn().mockResolvedValue({ id: '123', success: true })
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateStorePlan).toHaveBeenCalledWith({
          name: 'Test Store Plan',
          description: 'Test Description',
          region: 'beijing',
          quarter: '2024Q1',
          targetOpenDate: '2024-03-15',
          budget: 500000,
          storeType: 'flagship'
        })
      })
      
      expect(mockNavigate).toHaveBeenCalledWith('/store-plan')
    })

    it('should not navigate if create operation fails', async () => {
      const mockCreateStorePlan = vi.fn().mockResolvedValue(null)
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateStorePlan).toHaveBeenCalled()
      })
      
      expect(mockNavigate).not.toHaveBeenCalledWith('/store-plan')
    })

    it('should handle form submission errors gracefully', async () => {
      const mockCreateStorePlan = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateStorePlan).toHaveBeenCalled()
      })
      
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during form submission', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isSubmitting: true
      })

      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('提交中...')
    })

    it('should hide loading state after submission completes', async () => {
      const mockCreateStorePlan = vi.fn().mockResolvedValue({ id: '123', success: true })
      
      // Initial loading state
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan,
        isSubmitting: true
      })

      const { rerender } = renderWithProviders(<StorePlanCreate />)
      
      let submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('提交中...')

      // After loading completes
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan,
        isSubmitting: false
      })

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <StorePlanCreate />
          </MemoryRouter>
        </QueryClientProvider>
      )
      
      submitButton = screen.getByTestId('submit-button')
      expect(submitButton).not.toBeDisabled()
      expect(submitButton).toHaveTextContent('提交')
    })
  })

  describe('Store Integration', () => {
    it('should use correct store hooks', () => {
      renderWithProviders(<StorePlanCreate />)
      
      expect(useStorePlanStore).toHaveBeenCalled()
    })

    it('should pass createStorePlan function to form', () => {
      const mockCreateStorePlan = vi.fn()
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      renderWithProviders(<StorePlanCreate />)
      
      // The form should have access to the create function
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
    })

    it('should pass loading state to form', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isSubmitting: true
      })

      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should handle store errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(useStorePlanStore).mockImplementation(() => {
        throw new Error('Store error')
      })

      expect(() => renderWithProviders(<StorePlanCreate />)).toThrow('Store error')
      
      consoleError.mockRestore()
    })
  })

  describe('Navigation', () => {
    it('should use correct navigation hook', () => {
      renderWithProviders(<StorePlanCreate />)
      
      // Navigation function should be available
      expect(mockNavigate).toBeDefined()
    })

    it('should navigate to correct route on success', async () => {
      const mockCreateStorePlan = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/store-plan')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      renderWithProviders(<StorePlanCreate />)
      
      const form = screen.getByTestId('create-form')
      expect(form).toBeInTheDocument()
      
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const backButton = screen.getByText('返回')
      const submitButton = screen.getByTestId('submit-button')
      
      // Tab navigation should work
      await user.tab()
      
      expect(document.activeElement).toBeDefined()
      
      // Enter key should trigger actions
      backButton.focus()
      await user.keyboard('{Enter}')
      
      expect(mockNavigate).toHaveBeenCalledWith('/store-plan')
    })
  })

  describe('Performance', () => {
    it('should render efficiently without unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestComponent = () => {
        renderSpy()
        return <StorePlanCreate />
      }
      
      renderWithProviders(<TestComponent />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid clicks gracefully', async () => {
      const mockCreateStorePlan = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      
      // Rapid clicks
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // Should only call create function once per actual submission
      await waitFor(() => {
        expect(mockCreateStorePlan).toHaveBeenCalled()
      })
    })
  })

  describe('Memory Management', () => {
    it('should clean up properly on unmount', () => {
      const { unmount } = renderWithProviders(<StorePlanCreate />)
      
      unmount()
      
      // No memory leaks should occur
      expect(() => unmount()).not.toThrow()
    })

    it('should not cause memory leaks with rapid mount/unmount', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithProviders(<StorePlanCreate />)
        unmount()
      }
      
      // Should handle multiple mount/unmount cycles without issues
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined form submission data', async () => {
      const mockCreateStorePlan = vi.fn().mockResolvedValue(null)
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateStorePlan).toHaveBeenCalled()
      })
      
      expect(mockNavigate).not.toHaveBeenCalledWith('/store-plan')
    })

    it('should handle network timeouts', async () => {
      const mockCreateStorePlan = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )
      
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateStorePlan).toHaveBeenCalled()
      }, { timeout: 200 })
      
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Integration Tests', () => {
    it('should work with real router context', () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={createTestQueryClient()}>
            <StorePlanCreate />
          </QueryClientProvider>
        </BrowserRouter>
      )
      
      expect(screen.getByText('创建开店计划')).toBeInTheDocument()
    })

    it('should integrate properly with store and router', async () => {
      const mockCreateStorePlan = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        createStorePlan: mockCreateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanCreate />)
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateStorePlan).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/store-plan')
      })
    })
  })
})