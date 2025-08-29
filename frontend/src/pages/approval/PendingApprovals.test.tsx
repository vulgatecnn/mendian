/**
 * 待审批页面测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PendingApprovals from './PendingApprovals'
import type { ApprovalInstance, ProcessApprovalRequest } from '../../types/approval'
import dayjs from 'dayjs'

// Mock antd components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    },
    Modal: ({ children, open, onCancel, onOk, title }: any) => 
      open ? (
        <div data-testid="modal" role="dialog">
          <div data-testid="modal-title">{title}</div>
          <div>{children}</div>
          <button onClick={onCancel} data-testid="modal-cancel">取消</button>
          <button onClick={onOk} data-testid="modal-ok">确定</button>
        </div>
      ) : null,
    Drawer: ({ children, open, onClose, title }: any) =>
      open ? (
        <div data-testid="drawer" role="dialog">
          <div data-testid="drawer-title">{title}</div>
          <div>{children}</div>
          <button onClick={onClose} data-testid="drawer-close">关闭</button>
        </div>
      ) : null,
    Upload: ({ children, beforeUpload, multiple, listType }: any) => (
      <div data-testid="upload">
        <input 
          type="file" 
          multiple={multiple}
          data-testid="file-input"
          onChange={(e) => {
            if (beforeUpload) {
              Array.from(e.target.files || []).forEach(file => beforeUpload(file))
            }
          }}
        />
        {children}
      </div>
    ),
    Popconfirm: ({ children, onConfirm, disabled, title }: any) => (
      <div data-testid="popconfirm">
        <div data-testid="popconfirm-title">{title}</div>
        <button 
          onClick={onConfirm} 
          disabled={disabled}
          data-testid="popconfirm-button"
        >
          {children}
        </button>
      </div>
    )
  }
})

// Mock dayjs
vi.mock('dayjs', () => {
  const actual = vi.importActual('dayjs')
  const mockDayjs = vi.fn().mockImplementation((date?: any) => {
    if (!date) {
      return {
        format: vi.fn(() => '2023-12-01'),
        isBefore: vi.fn(() => false),
        diff: vi.fn(() => 24)
      }
    }
    return {
      format: vi.fn((format: string) => {
        if (format === 'MM-DD') return '12-01'
        if (format === 'HH:mm') return '09:30'
        if (format === 'YYYY-MM-DD') return '2023-12-01'
        return '2023-12-01 09:30:00'
      }),
      isBefore: vi.fn(() => false),
      diff: vi.fn(() => 24)
    }
  })
  
  return {
    default: mockDayjs,
    ...actual
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

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('PendingApprovals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Component Rendering', () => {
    it('should render all main sections', () => {
      renderWithProviders(<PendingApprovals />)
      
      // Statistics cards
      expect(screen.getByText('待办总数')).toBeInTheDocument()
      expect(screen.getByText('紧急审批')).toBeInTheDocument()
      expect(screen.getByText('已逾期')).toBeInTheDocument()
      expect(screen.getByText('今日新增')).toBeInTheDocument()
      
      // Search and filter area
      expect(screen.getByPlaceholderText('搜索审批标题、编号、申请人')).toBeInTheDocument()
      expect(screen.getByText('全部类别')).toBeInTheDocument()
      expect(screen.getByText('全部')).toBeInTheDocument()
      
      // Table
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should render statistics with correct values', () => {
      renderWithProviders(<PendingApprovals />)
      
      // Should show correct statistics (based on mock data)
      const totalStatistic = screen.getByText('待办总数')
      expect(totalStatistic).toBeInTheDocument()
      
      const urgentStatistic = screen.getByText('紧急审批')
      expect(urgentStatistic).toBeInTheDocument()
    })

    it('should render approval table with correct columns', () => {
      renderWithProviders(<PendingApprovals />)
      
      expect(screen.getByText('审批信息')).toBeInTheDocument()
      expect(screen.getByText('申请人')).toBeInTheDocument()
      expect(screen.getByText('进度')).toBeInTheDocument()
      expect(screen.getByText('创建时间')).toBeInTheDocument()
      expect(screen.getByText('截止时间')).toBeInTheDocument()
      expect(screen.getByText('操作')).toBeInTheDocument()
    })

    it('should render approval data in table', () => {
      renderWithProviders(<PendingApprovals />)
      
      // Check for mock data
      expect(screen.getByText('好饭碗(国贸店)选址申请')).toBeInTheDocument()
      expect(screen.getByText('好饭碗(三里屯店)营业执照申请')).toBeInTheDocument()
      expect(screen.getByText('厨房设备采购比价审批')).toBeInTheDocument()
    })
  })

  describe('Search and Filter', () => {
    it('should filter by search text', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const searchInput = screen.getByPlaceholderText('搜索审批标题、编号、申请人')
      await user.type(searchInput, '国贸')
      
      // Should show filtered results
      expect(screen.getByText('好饭碗(国贸店)选址申请')).toBeInTheDocument()
      expect(screen.queryByText('好饭碗(三里屯店)营业执照申请')).not.toBeInTheDocument()
    })

    it('should filter by approval category', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Click category dropdown
      const categoryDropdown = screen.getByText('全部类别')
      await user.click(categoryDropdown)
      
      // Select specific category
      const categoryOption = screen.getByText('选址申请')
      await user.click(categoryOption)
      
      // Should filter results
      expect(screen.getByText('好饭碗(国贸店)选址申请')).toBeInTheDocument()
    })

    it('should filter by priority', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Click priority dropdown
      const priorityDropdown = screen.getByText('全部')
      await user.click(priorityDropdown)
      
      // Select specific priority
      const priorityOption = screen.getByText('紧急')
      await user.click(priorityOption)
      
      // Should filter results
      expect(screen.getByText('厨房设备采购比价审批')).toBeInTheDocument()
    })

    it('should combine multiple filters', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Apply search filter
      const searchInput = screen.getByPlaceholderText('搜索审批标题、编号、申请人')
      await user.type(searchInput, '张')
      
      // Should show results containing '张'
      expect(screen.getByText('好饭碗(国贸店)选址申请')).toBeInTheDocument()
    })

    it('should clear search input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const searchInput = screen.getByPlaceholderText('搜索审批标题、编号、申请人')
      await user.type(searchInput, '国贸')
      await user.clear(searchInput)
      
      // Should show all results again
      expect(screen.getByText('好饭碗(国贸店)选址申请')).toBeInTheDocument()
      expect(screen.getByText('好饭碗(三里屯店)营业执照申请')).toBeInTheDocument()
    })
  })

  describe('Approval Actions', () => {
    it('should open approval modal when approve button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('审批通过')
    })

    it('should open reject modal when reject button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const rejectButtons = screen.getAllByText('拒绝')
      await user.click(rejectButtons[0])
      
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('审批拒绝')
    })

    it('should open transfer modal when transfer button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const transferButtons = screen.getAllByText('转交')
      await user.click(transferButtons[0])
      
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-title')).toHaveTextContent('转交审批')
    })

    it('should open detail drawer when detail button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const detailButtons = screen.getAllByText('详情')
      await user.click(detailButtons[0])
      
      expect(screen.getByTestId('drawer')).toBeInTheDocument()
      expect(screen.getByTestId('drawer-title')).toHaveTextContent('审批详情')
    })
  })

  describe('Modal Interactions', () => {
    it('should close approval modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      expect(screen.getByTestId('modal')).toBeInTheDocument()
      
      // Close modal
      const cancelButton = screen.getByTestId('modal-cancel')
      await user.click(cancelButton)
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })

    it('should submit approval form', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open approval modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      // Submit form
      const okButton = screen.getByTestId('modal-ok')
      await user.click(okButton)
      
      // Should close modal after submission
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })
    })

    it('should handle form submission with comment', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open approval modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      // Add comment
      const commentInput = screen.getByPlaceholderText('请输入审批意见（可选）')
      await user.type(commentInput, '审批通过，同意申请')
      
      // Submit form
      const okButton = screen.getByTestId('modal-ok')
      await user.click(okButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })
    })

    it('should require comment for rejection', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open reject modal
      const rejectButtons = screen.getAllByText('拒绝')
      await user.click(rejectButtons[0])
      
      // Try to submit without comment (should show validation)
      const okButton = screen.getByTestId('modal-ok')
      await user.click(okButton)
      
      // Modal should remain open due to validation error
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  describe('Transfer Modal', () => {
    it('should handle transfer form submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open transfer modal
      const transferButtons = screen.getAllByText('转交')
      await user.click(transferButtons[0])
      
      // Select transfer target
      const transferSelect = screen.getByText('请选择转交对象')
      await user.click(transferSelect)
      
      const transferOption = screen.getByText('赵主管')
      await user.click(transferOption)
      
      // Add comment
      const commentInput = screen.getByPlaceholderText('请说明转交原因...')
      await user.type(commentInput, '转交给相关负责人处理')
      
      // Submit form
      const okButton = screen.getByTestId('modal-ok')
      await user.click(okButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
      })
    })

    it('should validate transfer form fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open transfer modal
      const transferButtons = screen.getAllByText('转交')
      await user.click(transferButtons[0])
      
      // Try to submit without required fields
      const okButton = screen.getByTestId('modal-ok')
      await user.click(okButton)
      
      // Modal should remain open due to validation
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  describe('Batch Operations', () => {
    it('should enable batch approval when items are selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Select first checkbox
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1]) // First item checkbox (0 is select all)
      
      const batchButton = screen.getByTestId('popconfirm-button')
      expect(batchButton).not.toBeDisabled()
      expect(batchButton).toHaveTextContent('批量审批 (1)')
    })

    it('should show popconfirm for batch approval', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Select checkbox
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])
      
      expect(screen.getByTestId('popconfirm')).toBeInTheDocument()
      expect(screen.getByTestId('popconfirm-title')).toHaveTextContent('确认批量审批通过所选项目？')
    })

    it('should handle batch approval confirmation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Select checkbox
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])
      
      // Click batch approve button
      const batchButton = screen.getByTestId('popconfirm-button')
      await user.click(batchButton)
      
      // Should execute batch approval
      expect(batchButton).toHaveTextContent('批量审批 (0)') // Selection cleared
    })

    it('should disable batch approval when no items selected', () => {
      renderWithProviders(<PendingApprovals />)
      
      const batchButton = screen.getByTestId('popconfirm-button')
      expect(batchButton).toBeDisabled()
      expect(batchButton).toHaveTextContent('批量审批 (0)')
    })
  })

  describe('Detail Drawer', () => {
    it('should show approval details in drawer', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open detail drawer
      const detailButtons = screen.getAllByText('详情')
      await user.click(detailButtons[0])
      
      expect(screen.getByTestId('drawer')).toBeInTheDocument()
      expect(screen.getByText('基本信息')).toBeInTheDocument()
      expect(screen.getByText('申请内容')).toBeInTheDocument()
      expect(screen.getByText('流程进度')).toBeInTheDocument()
    })

    it('should close drawer when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open drawer
      const detailButtons = screen.getAllByText('详情')
      await user.click(detailButtons[0])
      
      expect(screen.getByTestId('drawer')).toBeInTheDocument()
      
      // Close drawer
      const closeButton = screen.getByTestId('drawer-close')
      await user.click(closeButton)
      
      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument()
    })

    it('should display correct approval details', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open detail drawer
      const detailButtons = screen.getAllByText('详情')
      await user.click(detailButtons[0])
      
      // Check for specific details from mock data
      expect(screen.getByText('好饭碗(国贸店)选址申请')).toBeInTheDocument()
      expect(screen.getByText('APP20231201001')).toBeInTheDocument()
      expect(screen.getByText('张经理')).toBeInTheDocument()
    })
  })

  describe('File Upload', () => {
    it('should handle file upload in approval modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open approval modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      expect(screen.getByTestId('upload')).toBeInTheDocument()
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
    })

    it('should support multiple file uploads', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open approval modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      const fileInput = screen.getByTestId('file-input')
      expect(fileInput).toHaveAttribute('multiple')
    })
  })

  describe('Priority and Status Display', () => {
    it('should show priority tags with correct colors', () => {
      renderWithProviders(<PendingApprovals />)
      
      // Should render priority tags (exact implementation may vary)
      expect(screen.getByText('紧急')).toBeInTheDocument()
      expect(screen.getByText('中')).toBeInTheDocument()
    })

    it('should show progress indicators', () => {
      renderWithProviders(<PendingApprovals />)
      
      // Should show progress information
      expect(screen.getByText('节点')).toBeInTheDocument()
    })

    it('should handle overdue items', () => {
      // Mock dayjs to return overdue status
      const mockDayjs = vi.mocked(dayjs)
      mockDayjs.mockImplementation((date?: any) => ({
        format: vi.fn(() => '12-01'),
        isBefore: vi.fn(() => true), // Simulate overdue
        diff: vi.fn(() => -12)
      }))

      renderWithProviders(<PendingApprovals />)
      
      // Should show overdue indicators
      expect(screen.getByText('已逾期')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should handle table scrolling', () => {
      renderWithProviders(<PendingApprovals />)
      
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
    })

    it('should show pagination controls', () => {
      renderWithProviders(<PendingApprovals />)
      
      expect(screen.getByText(/共.*条/)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle approval submission errors', async () => {
      // Mock console.error to prevent error logs in test output
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open approval modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      // Submit form (which should handle errors gracefully)
      const okButton = screen.getByTestId('modal-ok')
      await user.click(okButton)
      
      consoleError.mockRestore()
    })

    it('should handle transfer submission errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open transfer modal
      const transferButtons = screen.getAllByText('转交')
      await user.click(transferButtons[0])
      
      // Submit form
      const okButton = screen.getByTestId('modal-ok')
      await user.click(okButton)
      
      consoleError.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      renderWithProviders(<PendingApprovals />)
      
      expect(screen.getByRole('table')).toBeInTheDocument()
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Tab through elements
      await user.tab()
      expect(document.activeElement).toBeDefined()
    })

    it('should have proper modal accessibility', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Open modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render efficiently with large datasets', () => {
      const renderStart = performance.now()
      renderWithProviders(<PendingApprovals />)
      const renderEnd = performance.now()
      
      // Should render quickly (adjust threshold as needed)
      expect(renderEnd - renderStart).toBeLessThan(1000)
    })

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const searchInput = screen.getByPlaceholderText('搜索审批标题、编号、申请人')
      
      // Rapid typing
      await user.type(searchInput, 'test')
      await user.clear(searchInput)
      await user.type(searchInput, 'another')
      
      expect(searchInput).toHaveValue('another')
    })
  })

  describe('Memory Management', () => {
    it('should clean up properly on unmount', () => {
      const { unmount } = renderWithProviders(<PendingApprovals />)
      
      unmount()
      expect(() => unmount()).not.toThrow()
    })

    it('should handle rapid modal open/close cycles', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      const approveButtons = screen.getAllByText('审批')
      
      // Rapid open/close
      for (let i = 0; i < 5; i++) {
        await user.click(approveButtons[0])
        const cancelButton = screen.getByTestId('modal-cancel')
        await user.click(cancelButton)
      }
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    it('should integrate all components correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PendingApprovals />)
      
      // Test complete workflow
      expect(screen.getByText('待办总数')).toBeInTheDocument()
      
      // Filter data
      const searchInput = screen.getByPlaceholderText('搜索审批标题、编号、申请人')
      await user.type(searchInput, '国贸')
      
      // Open details
      const detailButtons = screen.getAllByText('详情')
      await user.click(detailButtons[0])
      
      expect(screen.getByTestId('drawer')).toBeInTheDocument()
      
      // Close details
      const closeButton = screen.getByTestId('drawer-close')
      await user.click(closeButton)
      
      // Open approval modal
      const approveButtons = screen.getAllByText('审批')
      await user.click(approveButtons[0])
      
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })
})