/**
 * 开店计划编辑页面测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { message } from 'antd'
import StorePlanEdit from './Edit'
import { useStorePlanStore } from '@/stores/storePlanStore'
import type { UpdateStorePlanDto, StorePlan } from '@/services/types'

// Mock dependencies
vi.mock('@/stores/storePlanStore')
vi.mock('@/components/common/PageHeader', () => ({
  default: ({ title, description, breadcrumbs, onBack }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      <nav>
        {breadcrumbs?.map((item: any, index: number) => (
          <span key={index} data-testid={`breadcrumb-${index}`}>
            {item.title}
          </span>
        ))}
      </nav>
      <button onClick={onBack} data-testid="back-button">返回</button>
    </div>
  )
}))

vi.mock('./components/PlanForm', () => ({
  default: ({ initialValues, isEdit, onSubmit, loading }: any) => {
    const handleTestSubmit = () => {
      const mockData: UpdateStorePlanDto = {
        name: 'Updated Store Plan',
        description: 'Updated Description',
        budget: 600000
      }
      onSubmit(mockData)
    }
    
    return (
      <div data-testid="plan-form">
        <div data-testid="form-initial-values">
          {JSON.stringify(initialValues)}
        </div>
        <div data-testid="is-edit">{isEdit?.toString()}</div>
        <form data-testid="edit-form">
          <button 
            type="button" 
            onClick={handleTestSubmit} 
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? '更新中...' : '更新'}
          </button>
        </form>
      </div>
    )
  }
}))

// Mock antd components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    Alert: ({ message, description, type, showIcon }: any) => (
      <div data-testid={`alert-${type}`} role="alert">
        <div data-testid="alert-message">{message}</div>
        {description && <div data-testid="alert-description">{description}</div>}
      </div>
    ),
    Spin: ({ size }: any) => (
      <div data-testid="loading-spinner" data-size={size}>
        Loading...
      </div>
    )
  }
})

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-id' })
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

const renderWithProviders = (
  component: React.ReactElement, 
  { route = '/store-plan/test-id/edit' } = {}
) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockStorePlan: StorePlan = {
  id: 'test-id',
  name: 'Test Store Plan',
  description: 'Test Description',
  region: 'beijing',
  quarter: '2024Q1',
  targetOpenDate: '2024-03-15',
  budget: 500000,
  storeType: 'flagship',
  status: 'draft',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

const mockStoreReturn = {
  currentStorePlan: mockStorePlan,
  fetchStorePlan: vi.fn(),
  updateStorePlan: vi.fn(),
  createStorePlan: vi.fn(),
  isLoading: false,
  isSubmitting: false,
  storePlans: [],
  error: null,
  deleteStorePlan: vi.fn(),
  fetchStorePlans: vi.fn()
}

describe('StorePlanEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useStorePlanStore).mockReturnValue(mockStoreReturn)
  })

  afterEach(() => {
    cleanup()
  })

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isLoading: true,
        currentStorePlan: null
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render not found state when plan does not exist', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isLoading: false,
        currentStorePlan: null
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('alert-error')).toBeInTheDocument()
      expect(screen.getByTestId('alert-message')).toHaveTextContent('计划不存在')
      expect(screen.getByTestId('alert-description')).toHaveTextContent('您访问的开店计划不存在或已被删除')
    })

    it('should render cannot edit state for non-editable status', () => {
      const nonEditablePlan = { ...mockStorePlan, status: 'approved' as const }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: nonEditablePlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
      expect(screen.getByText('编辑开店计划')).toBeInTheDocument()
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument()
      expect(screen.getByTestId('alert-message')).toHaveTextContent('无法编辑')
      expect(screen.getByTestId('alert-description')).toHaveTextContent('当前计划状态为"已批准"，无法进行编辑')
    })

    it('should render edit form for editable plan', () => {
      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
      expect(screen.getByText('编辑开店计划')).toBeInTheDocument()
      expect(screen.getByText('编辑计划：Test Store Plan')).toBeInTheDocument()
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
      expect(screen.getByTestId('is-edit')).toHaveTextContent('true')
    })

    it('should render correct breadcrumbs for editable plan', () => {
      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('开店计划')
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Test Store Plan')
      expect(screen.getByTestId('breadcrumb-2')).toHaveTextContent('编辑')
    })

    it('should pass initial values to form', () => {
      renderWithProviders(<StorePlanEdit />)
      
      const initialValuesElement = screen.getByTestId('form-initial-values')
      const initialValues = JSON.parse(initialValuesElement.textContent || '{}')
      expect(initialValues.name).toBe('Test Store Plan')
      expect(initialValues.id).toBe('test-id')
    })
  })

  describe('Component Lifecycle', () => {
    it('should fetch plan data on mount', () => {
      const mockFetchStorePlan = vi.fn()
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        fetchStorePlan: mockFetchStorePlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(mockFetchStorePlan).toHaveBeenCalledWith('test-id')
    })

    it('should not fetch plan data if id is missing', () => {
      const mockFetchStorePlan = vi.fn()
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        fetchStorePlan: mockFetchStorePlan
      })

      // Mock useParams to return undefined id
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ id: undefined })
        }
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(mockFetchStorePlan).not.toHaveBeenCalled()
    })
  })

  describe('User Interactions', () => {
    it('should navigate back when back button is clicked from edit form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<StorePlanEdit />)
      
      const backButton = screen.getByTestId('back-button')
      await user.click(backButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/test-id')
    })

    it('should navigate back when back button is clicked from non-editable state', async () => {
      const nonEditablePlan = { ...mockStorePlan, status: 'approved' as const }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: nonEditablePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanEdit />)
      
      const backButton = screen.getByTestId('back-button')
      await user.click(backButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/test-id')
    })

    it('should handle form submission successfully', async () => {
      const mockUpdateStorePlan = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        updateStorePlan: mockUpdateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanEdit />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUpdateStorePlan).toHaveBeenCalledWith('test-id', {
          name: 'Updated Store Plan',
          description: 'Updated Description',
          budget: 600000
        })
      })
      
      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/test-id')
    })

    it('should not navigate if update operation fails', async () => {
      const mockUpdateStorePlan = vi.fn().mockResolvedValue(null)
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        updateStorePlan: mockUpdateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanEdit />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUpdateStorePlan).toHaveBeenCalled()
      })
      
      expect(mockNavigate).not.toHaveBeenCalledWith('/store-plan/test-id')
    })
  })

  describe('Status-based Rendering', () => {
    it('should allow editing for draft status', () => {
      const draftPlan = { ...mockStorePlan, status: 'draft' as const }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: draftPlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
      expect(screen.queryByTestId('alert-warning')).not.toBeInTheDocument()
    })

    it('should allow editing for pending status', () => {
      const pendingPlan = { ...mockStorePlan, status: 'pending' as const }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: pendingPlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
      expect(screen.queryByTestId('alert-warning')).not.toBeInTheDocument()
    })

    it('should show warning for approved status', () => {
      const approvedPlan = { ...mockStorePlan, status: 'approved' as const }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: approvedPlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument()
      expect(screen.getByTestId('alert-description')).toHaveTextContent('当前计划状态为"已批准"，无法进行编辑')
      expect(screen.queryByTestId('plan-form')).not.toBeInTheDocument()
    })

    it('should show warning for in_progress status', () => {
      const inProgressPlan = { ...mockStorePlan, status: 'in_progress' as const }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: inProgressPlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument()
      expect(screen.getByTestId('alert-description')).toHaveTextContent('当前计划状态为"进行中"，无法进行编辑')
    })

    it('should show warning for completed status', () => {
      const completedPlan = { ...mockStorePlan, status: 'completed' as const }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: completedPlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument()
      expect(screen.getByTestId('alert-description')).toHaveTextContent('当前计划状态为"已完成"，无法进行编辑')
    })
  })

  describe('Loading States', () => {
    it('should show loading during initial data fetch', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isLoading: true,
        currentStorePlan: null
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should show loading state during form submission', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isSubmitting: true
      })

      renderWithProviders(<StorePlanEdit />)
      
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('更新中...')
    })

    it('should hide loading after data is loaded', async () => {
      // Initial loading state
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isLoading: true,
        currentStorePlan: null
      })

      const { rerender } = renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

      // After loading completes
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isLoading: false,
        currentStorePlan: mockStorePlan
      })

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={['/store-plan/test-id/edit']}>
            <StorePlanEdit />
          </MemoryRouter>
        </QueryClientProvider>
      )
      
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle form submission errors', async () => {
      const mockUpdateStorePlan = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        updateStorePlan: mockUpdateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanEdit />)
      
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUpdateStorePlan).toHaveBeenCalled()
      })
      
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should handle missing id parameter', async () => {
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({})
        }
      })

      // This should not crash the component
      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Store Integration', () => {
    it('should call fetchStorePlan with correct id', () => {
      const mockFetchStorePlan = vi.fn()
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        fetchStorePlan: mockFetchStorePlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(mockFetchStorePlan).toHaveBeenCalledWith('test-id')
    })

    it('should use all required store properties', () => {
      renderWithProviders(<StorePlanEdit />)
      
      expect(useStorePlanStore).toHaveBeenCalled()
      
      // Component should access these properties from store
      const call = vi.mocked(useStorePlanStore).mock.results[0].value
      expect(call).toHaveProperty('currentStorePlan')
      expect(call).toHaveProperty('fetchStorePlan')
      expect(call).toHaveProperty('updateStorePlan')
      expect(call).toHaveProperty('isLoading')
      expect(call).toHaveProperty('isSubmitting')
    })
  })

  describe('Accessibility', () => {
    it('should have proper alert roles for error states', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isLoading: false,
        currentStorePlan: null
      })

      renderWithProviders(<StorePlanEdit />)
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should have proper loading indicator accessibility', () => {
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        isLoading: true,
        currentStorePlan: null
      })

      renderWithProviders(<StorePlanEdit />)
      
      const spinner = screen.getByTestId('loading-spinner')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveAttribute('data-size', 'large')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<StorePlanEdit />)
      
      const backButton = screen.getByTestId('back-button')
      
      backButton.focus()
      await user.keyboard('{Enter}')
      
      expect(mockNavigate).toHaveBeenCalledWith('/store-plan/test-id')
    })
  })

  describe('Performance', () => {
    it('should not re-fetch data unnecessarily', () => {
      const mockFetchStorePlan = vi.fn()
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        fetchStorePlan: mockFetchStorePlan
      })

      const { rerender } = renderWithProviders(<StorePlanEdit />)
      
      expect(mockFetchStorePlan).toHaveBeenCalledTimes(1)
      
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={['/store-plan/test-id/edit']}>
            <StorePlanEdit />
          </MemoryRouter>
        </QueryClientProvider>
      )
      
      // Should not call again on rerender
      expect(mockFetchStorePlan).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid status changes', () => {
      const { rerender } = renderWithProviders(<StorePlanEdit />)
      
      // Rapidly change between editable and non-editable states
      const states = [
        { ...mockStorePlan, status: 'draft' as const },
        { ...mockStorePlan, status: 'approved' as const },
        { ...mockStorePlan, status: 'pending' as const },
        { ...mockStorePlan, status: 'completed' as const }
      ]
      
      states.forEach(plan => {
        vi.mocked(useStorePlanStore).mockReturnValue({
          ...mockStoreReturn,
          currentStorePlan: plan
        })
        
        rerender(
          <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={['/store-plan/test-id/edit']}>
              <StorePlanEdit />
            </MemoryRouter>
          </QueryClientProvider>
        )
      })
      
      // Should handle all state changes without crashing
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })
  })

  describe('Memory Management', () => {
    it('should clean up properly on unmount', () => {
      const { unmount } = renderWithProviders(<StorePlanEdit />)
      
      unmount()
      
      expect(() => unmount()).not.toThrow()
    })

    it('should handle rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderWithProviders(<StorePlanEdit />)
        unmount()
      }
      
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle unknown status values', () => {
      const unknownStatusPlan = { ...mockStorePlan, status: 'unknown' as any }
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: unknownStatusPlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument()
      expect(screen.getByTestId('alert-description')).toHaveTextContent('当前计划状态为"未知状态"，无法进行编辑')
    })

    it('should handle malformed plan data', () => {
      const malformedPlan = { ...mockStorePlan, name: undefined } as any
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        currentStorePlan: malformedPlan
      })

      renderWithProviders(<StorePlanEdit />)
      
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    it('should work with real router context', () => {
      render(
        <BrowserRouter>
          <QueryClientProvider client={createTestQueryClient()}>
            <StorePlanEdit />
          </QueryClientProvider>
        </BrowserRouter>
      )
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should integrate properly with all dependencies', async () => {
      const mockUpdateStorePlan = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(useStorePlanStore).mockReturnValue({
        ...mockStoreReturn,
        updateStorePlan: mockUpdateStorePlan
      })

      const user = userEvent.setup()
      renderWithProviders(<StorePlanEdit />)
      
      // Should load data
      expect(screen.getByTestId('plan-form')).toBeInTheDocument()
      
      // Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockUpdateStorePlan).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/store-plan/test-id')
      })
    })
  })
})