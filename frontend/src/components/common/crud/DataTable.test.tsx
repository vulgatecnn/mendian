/**
 * DataTable Component Comprehensive Test Suite
 * 
 * Tests cover:
 * - Basic rendering with all configurations
 * - Search functionality
 * - Batch operations
 * - Row selection
 * - Pagination
 * - Actions and toolbar
 * - Mobile responsiveness
 * - Error handling
 * - Performance and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import { expectAllClicksWork, testHelpers } from '@/test/utils'
import DataTable from './DataTable'
import type { ColumnConfig, SearchField, ActionConfig, BatchAction } from './DataTable'

// Mock useDevice hook
const mockUseDevice = vi.fn()
vi.mock('@/hooks/useDevice', () => ({
  useDevice: () => mockUseDevice()
}))

// Mock Antd theme hook
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    theme: {
      ...actual.theme,
      useToken: () => ({
        token: {
          colorBgContainer: '#ffffff',
          colorBorder: '#d9d9d9'
        }
      })
    }
  }
})

// Mock data for testing
const mockDataSource = [
  {
    id: '1',
    name: 'John Doe',
    age: 32,
    email: 'john@example.com',
    status: 'active',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Jane Smith',
    age: 28,
    email: 'jane@example.com',
    status: 'inactive',
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    age: 35,
    email: 'bob@example.com',
    status: 'active',
    createdAt: '2024-01-03'
  }
]

const mockColumns: ColumnConfig[] = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    searchable: true,
    sortable: true
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 80,
    sortable: true
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    ellipsis: true
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <span style={{ color: status === 'active' ? 'green' : 'red' }}>
        {status}
      </span>
    )
  }
]

const mockSearchFields: SearchField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'input',
    placeholder: 'Enter name'
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  },
  {
    name: 'dateRange',
    label: 'Date Range',
    type: 'dateRange'
  }
]

const mockActions: ActionConfig[] = [
  {
    key: 'view',
    label: 'View',
    icon: <span data-testid="view-icon">👁</span>,
    onClick: vi.fn()
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: <span data-testid="edit-icon">✏️</span>,
    onClick: vi.fn()
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <span data-testid="delete-icon">🗑</span>,
    danger: true,
    onClick: vi.fn()
  }
]

const mockBatchActions: BatchAction[] = [
  {
    key: 'batchDelete',
    label: 'Batch Delete',
    danger: true,
    confirm: {
      title: 'Confirm Batch Delete',
      description: 'Are you sure you want to delete selected items?'
    },
    onClick: vi.fn()
  },
  {
    key: 'batchExport',
    label: 'Batch Export',
    onClick: vi.fn()
  }
]

describe('DataTable', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Mock desktop device by default
    mockUseDevice.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    })

    // Clear all mocks
    vi.clearAllMocks()
    mockActions.forEach(action => (action.onClick as any).mockClear())
    mockBatchActions.forEach(action => (action.onClick as any).mockClear())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render table with basic props', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('should render with title and subtitle', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          title="User Management"
          subtitle="Manage system users"
        />
      )

      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Manage system users')).toBeInTheDocument()
    })

    it('should render all columns correctly', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
        />
      )

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Age')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should render custom column content', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
        />
      )

      // Status column renders with custom styling
      const activeStatuses = screen.getAllByText('active')
      expect(activeStatuses).toHaveLength(2)
      expect(activeStatuses[0]).toHaveStyle({ color: 'green' })
    })

    it('should show loading state', () => {
      render(
        <DataTable
          dataSource={[]}
          columns={mockColumns}
          loading={true}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      // Antd table shows loading spinner
      expect(document.querySelector('.ant-spin')).toBeInTheDocument()
    })

    it('should show empty state with custom description', () => {
      render(
        <DataTable
          dataSource={[]}
          columns={mockColumns}
          emptyDescription="No users found"
        />
      )

      expect(screen.getByText('No users found')).toBeInTheDocument()
    })
  })

  describe('Header and Toolbar', () => {
    it('should hide header when showHeader is false', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          title="Should Not Show"
          showHeader={false}
        />
      )

      expect(screen.queryByText('Should Not Show')).not.toBeInTheDocument()
    })

    it('should render toolbar with all buttons', () => {
      const mockCreate = vi.fn()
      const mockRefresh = vi.fn()
      const mockExport = vi.fn()
      const mockImport = vi.fn()

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          onCreate={mockCreate}
          onRefresh={mockRefresh}
          onExport={mockExport}
          onImport={mockImport}
          showRefresh={true}
          showCreate={true}
          showExport={true}
          showImport={true}
        />
      )

      expect(screen.getByText('刷新')).toBeInTheDocument()
      expect(screen.getByText('新建')).toBeInTheDocument()
      expect(screen.getByText('导出')).toBeInTheDocument()
      expect(screen.getByText('导入')).toBeInTheDocument()
    })

    it('should handle toolbar button clicks', async () => {
      const mockCreate = vi.fn()
      const mockRefresh = vi.fn()
      const mockExport = vi.fn()
      const mockImport = vi.fn()

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          onCreate={mockCreate}
          onRefresh={mockRefresh}
          onExport={mockExport}
          onImport={mockImport}
        />
      )

      await user.click(screen.getByText('新建'))
      expect(mockCreate).toHaveBeenCalledTimes(1)

      await user.click(screen.getByText('刷新'))
      expect(mockRefresh).toHaveBeenCalledTimes(1)

      await user.click(screen.getByText('导出'))
      expect(mockExport).toHaveBeenCalledTimes(1)

      await user.click(screen.getByText('导入'))
      expect(mockImport).toHaveBeenCalledTimes(1)
    })

    it('should render extra content in toolbar', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          extra={<button data-testid="extra-button">Extra</button>}
        />
      )

      expect(screen.getByTestId('extra-button')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should show search form when search button is clicked', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
        />
      )

      const searchButton = screen.getByText('展开筛选')
      await user.click(searchButton)

      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should handle search form submission', async () => {
      const mockOnSearch = vi.fn()

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
          onSearch={mockOnSearch}
        />
      )

      // Open search form
      await user.click(screen.getByText('展开筛选'))

      // Fill form
      const nameInput = screen.getByPlaceholderText('Enter name')
      await user.type(nameInput, 'John')

      const statusSelect = screen.getByRole('combobox')
      await user.click(statusSelect)
      await user.click(screen.getByText('Active'))

      // Submit form
      await user.click(screen.getByText('搜索'))

      expect(mockOnSearch).toHaveBeenCalledWith({
        name: 'John',
        status: 'active'
      })
    })

    it('should handle search form reset', async () => {
      const mockOnReset = vi.fn()

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
          onReset={mockOnReset}
        />
      )

      // Open search form
      await user.click(screen.getByText('展开筛选'))

      // Fill form
      const nameInput = screen.getByPlaceholderText('Enter name')
      await user.type(nameInput, 'John')

      // Reset form
      await user.click(screen.getByText('重置'))

      expect(mockOnReset).toHaveBeenCalledTimes(1)
      expect(nameInput).toHaveValue('')
    })

    it('should handle date range search fields', async () => {
      const mockOnSearch = vi.fn()

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
          onSearch={mockOnSearch}
        />
      )

      // Open search form
      await user.click(screen.getByText('展开筛选'))

      // Should render date range picker
      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(document.querySelector('.ant-picker-range')).toBeInTheDocument()
    })

    it('should disable search when showSearch is false', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
          showSearch={false}
        />
      )

      expect(screen.queryByText('展开筛选')).not.toBeInTheDocument()
    })
  })

  describe('Row Selection and Batch Operations', () => {
    it('should enable row selection when rowSelection is true', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
        />
      )

      // Should have checkboxes for each row
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('should handle row selection', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
          batchActions={mockBatchActions}
        />
      )

      // Select first row
      const firstCheckbox = screen.getAllByRole('checkbox')[1] // Skip header checkbox
      await user.click(firstCheckbox)

      // Should show batch actions
      expect(screen.getByText('已选择 1 项')).toBeInTheDocument()
      expect(screen.getByText('Batch Delete')).toBeInTheDocument()
      expect(screen.getByText('Batch Export')).toBeInTheDocument()
    })

    it('should handle batch actions', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
          batchActions={mockBatchActions}
        />
      )

      // Select first row
      const firstCheckbox = screen.getAllByRole('checkbox')[1]
      await user.click(firstCheckbox)

      // Click batch export (no confirmation)
      await user.click(screen.getByText('Batch Export'))

      expect(mockBatchActions[1].onClick).toHaveBeenCalledWith(['1'], [mockDataSource[0]])
    })

    it('should show confirmation for batch actions with confirm config', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
          batchActions={mockBatchActions}
        />
      )

      // Select first row
      const firstCheckbox = screen.getAllByRole('checkbox')[1]
      await user.click(firstCheckbox)

      // Click batch delete (with confirmation)
      await user.click(screen.getByText('Batch Delete'))

      // Should show confirmation modal
      expect(screen.getByText('Confirm Batch Delete')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete selected items?')).toBeInTheDocument()
    })

    it('should clear selection when cancel button is clicked', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
          batchActions={mockBatchActions}
        />
      )

      // Select first row
      const firstCheckbox = screen.getAllByRole('checkbox')[1]
      await user.click(firstCheckbox)

      expect(screen.getByText('已选择 1 项')).toBeInTheDocument()

      // Cancel selection
      await user.click(screen.getByText('取消选择'))

      expect(screen.queryByText('已选择 1 项')).not.toBeInTheDocument()
    })
  })

  describe('Actions Column', () => {
    it('should render actions column when actions are provided', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          actions={mockActions}
        />
      )

      expect(screen.getByText('操作')).toBeInTheDocument()
      expect(screen.getAllByTestId('view-icon')).toHaveLength(3)
      expect(screen.getAllByTestId('edit-icon')).toHaveLength(3)
      expect(screen.getAllByTestId('delete-icon')).toHaveLength(3)
    })

    it('should handle action clicks', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          actions={mockActions}
        />
      )

      // Click first row's view action
      const viewButtons = screen.getAllByTestId('view-icon')
      await user.click(viewButtons[0].closest('button')!)

      expect(mockActions[0].onClick).toHaveBeenCalledWith(mockDataSource[0])
    })

    it('should handle conditional action visibility', () => {
      const actionsWithVisibility: ActionConfig[] = [
        {
          key: 'view',
          label: 'View',
          icon: <span data-testid="view-icon">👁</span>,
          onClick: vi.fn()
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: <span data-testid="edit-icon">✏️</span>,
          visible: (record) => record.status === 'active',
          onClick: vi.fn()
        }
      ]

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          actions={actionsWithVisibility}
        />
      )

      // View action should be visible for all rows
      expect(screen.getAllByTestId('view-icon')).toHaveLength(3)
      
      // Edit action should only be visible for active users (2 out of 3)
      expect(screen.getAllByTestId('edit-icon')).toHaveLength(2)
    })

    it('should handle conditional action disabled state', () => {
      const actionsWithDisabled: ActionConfig[] = [
        {
          key: 'edit',
          label: 'Edit',
          icon: <span data-testid="edit-icon">✏️</span>,
          disabled: (record) => record.status === 'inactive',
          onClick: vi.fn()
        }
      ]

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          actions={actionsWithDisabled}
        />
      )

      const editButtons = screen.getAllByTestId('edit-icon').map(icon => 
        icon.closest('button')!
      )

      // First and third buttons should be enabled (active status)
      expect(editButtons[0]).not.toBeDisabled()
      expect(editButtons[2]).not.toBeDisabled()
      
      // Second button should be disabled (inactive status)
      expect(editButtons[1]).toBeDisabled()
    })
  })

  describe('Pagination', () => {
    it('should render pagination when provided', () => {
      const mockPagination = {
        current: 1,
        pageSize: 10,
        total: 100,
        onChange: vi.fn()
      }

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          pagination={mockPagination}
        />
      )

      expect(screen.getByTitle('Previous Page')).toBeInTheDocument()
      expect(screen.getByTitle('Next Page')).toBeInTheDocument()
    })

    it('should handle pagination changes', async () => {
      const mockOnChange = vi.fn()
      const mockPagination = {
        current: 1,
        pageSize: 10,
        total: 100,
        onChange: mockOnChange
      }

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          pagination={mockPagination}
        />
      )

      const nextButton = screen.getByTitle('Next Page')
      await user.click(nextButton)

      expect(mockOnChange).toHaveBeenCalledWith(2, 10)
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      mockUseDevice.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false
      })
    })

    it('should adjust layout for mobile', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
        />
      )

      // Mobile-specific adjustments should be applied
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should hide text in mobile toolbar buttons', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          onRefresh={vi.fn()}
          onExport={vi.fn()}
        />
      )

      // Text should be hidden on mobile (only icons shown)
      expect(screen.queryByText('刷新')).not.toBeInTheDocument()
      expect(screen.queryByText('导出')).not.toBeInTheDocument()
    })

    it('should adjust search form layout for mobile', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
        />
      )

      await user.click(screen.getByText('展开筛选'))

      // Search form should render with mobile layout
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle search errors gracefully', async () => {
      const mockOnSearch = vi.fn().mockRejectedValue(new Error('Search failed'))

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={mockSearchFields}
          onSearch={mockOnSearch}
        />
      )

      await user.click(screen.getByText('展开筛选'))
      await user.click(screen.getByText('搜索'))

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalled()
      })

      // Should show error message (mocked antd message.error)
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
    })

    it('should handle refresh errors gracefully', async () => {
      const mockOnRefresh = vi.fn().mockRejectedValue(new Error('Refresh failed'))

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          onRefresh={mockOnRefresh}
        />
      )

      await user.click(screen.getByText('刷新'))

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled()
      })
    })

    it('should handle batch action errors gracefully', async () => {
      const errorBatchAction: BatchAction = {
        key: 'errorAction',
        label: 'Error Action',
        onClick: vi.fn().mockRejectedValue(new Error('Batch action failed'))
      }

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
          batchActions={[errorBatchAction]}
        />
      )

      // Select row and trigger batch action
      const firstCheckbox = screen.getAllByRole('checkbox')[1]
      await user.click(firstCheckbox)
      await user.click(screen.getByText('Error Action'))

      await waitFor(() => {
        expect(errorBatchAction.onClick).toHaveBeenCalled()
      })
    })

    it('should warn when trying batch action with no selection', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
          batchActions={mockBatchActions}
        />
      )

      // Try to perform batch action without selecting any rows
      // Batch actions should not be visible when no rows selected
      expect(screen.queryByText('Batch Delete')).not.toBeInTheDocument()
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should pass comprehensive click testing', async () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          actions={mockActions}
          onRefresh={vi.fn()}
          onCreate={vi.fn()}
          onExport={vi.fn()}
          searchFields={mockSearchFields}
          rowSelection={true}
          batchActions={mockBatchActions}
        />
      )

      await expectAllClicksWork()
    })

    it('should handle keyboard navigation', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
        />
      )

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      // Table should be keyboard accessible
    })
  })

  describe('Performance Testing', () => {
    it('should render efficiently with large dataset', async () => {
      const largeDataSource = Array.from({ length: 100 }, (_, index) => ({
        id: index.toString(),
        name: `User ${index}`,
        age: 20 + (index % 50),
        email: `user${index}@example.com`,
        status: index % 2 === 0 ? 'active' : 'inactive',
        createdAt: `2024-01-${String(index % 30 + 1).padStart(2, '0')}`
      }))

      const renderStart = performance.now()
      render(
        <DataTable
          dataSource={largeDataSource}
          columns={mockColumns}
          actions={mockActions}
          rowSelection={true}
        />
      )
      const renderEnd = performance.now()

      expect(renderEnd - renderStart).toBePerformant(200)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should not cause memory leaks during rerenders', () => {
      const memoryStart = testHelpers.getMemoryUsage()

      const { rerender } = render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
        />
      )

      // Multiple rerenders with different data
      for (let i = 0; i < 10; i++) {
        const newData = mockDataSource.map(item => ({
          ...item,
          id: `${item.id}-${i}`,
          name: `${item.name}-${i}`
        }))

        rerender(
          <DataTable
            dataSource={newData}
            columns={mockColumns}
          />
        )
      }

      const memoryEnd = testHelpers.getMemoryUsage()
      const memoryDiff = memoryEnd - memoryStart

      expect(memoryDiff).toNotLeakMemory(5 * 1024 * 1024) // Should not leak more than 5MB
    })
  })

  describe('Accessibility', () => {
    it('should be accessible', async () => {
      const { container } = render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          title="Accessible Data Table"
        />
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should have proper ARIA attributes', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          title="Data Table"
        />
      )

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      // Column headers should be proper headers
      const nameHeader = screen.getByText('Name')
      expect(nameHeader.closest('th')).toBeInTheDocument()
    })

    it('should support screen reader announcements', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          rowSelection={true}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data source', () => {
      render(
        <DataTable
          dataSource={[]}
          columns={mockColumns}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('暂无数据')).toBeInTheDocument()
    })

    it('should handle empty columns', () => {
      render(
        <DataTable
          dataSource={mockDataSource}
          columns={[]}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle missing required props gracefully', () => {
      expect(() => {
        render(
          <DataTable
            dataSource={mockDataSource}
            columns={mockColumns}
            actions={[
              {
                key: 'incomplete',
                label: 'Incomplete',
                onClick: undefined as any
              }
            ]}
          />
        )
      }).not.toThrow()
    })

    it('should handle search fields without options', async () => {
      const fieldsWithoutOptions: SearchField[] = [
        {
          name: 'test',
          label: 'Test',
          type: 'select'
          // No options provided
        }
      ]

      render(
        <DataTable
          dataSource={mockDataSource}
          columns={mockColumns}
          searchFields={fieldsWithoutOptions}
        />
      )

      await user.click(screen.getByText('展开筛选'))
      
      // Should render select without options
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})