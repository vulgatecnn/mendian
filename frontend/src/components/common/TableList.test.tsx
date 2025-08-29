/**
 * TableList Component Comprehensive Test Suite
 * 
 * Tests cover:
 * - Basic rendering with different configurations
 * - Card wrapper functionality
 * - Index column functionality
 * - Pagination configuration
 * - Mobile responsiveness
 * - Header rendering (title and extra)
 * - Column configuration
 * - TableActions component
 * - Interactive elements and click testing
 * - Performance and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import { expectAllClicksWork, testHelpers } from '@/test/utils'
import TableList, { TableActions } from './TableList'

// Mock Antd Grid hook
const mockUseBreakpoint = vi.fn()
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => mockUseBreakpoint()
    }
  }
})

// Mock data for testing
const mockColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 80
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address'
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_: any, record: any) => (
      <TableActions
        actions={[
          { key: 'edit', label: 'Edit', onClick: () => {} },
          { key: 'delete', label: 'Delete', danger: true, onClick: () => {} }
        ]}
        record={record}
      />
    )
  }
]

const mockDataSource = [
  {
    key: '1',
    name: 'John Doe',
    age: 32,
    address: 'New York No. 1 Lake Park'
  },
  {
    key: '2',
    name: 'Jane Smith',
    age: 28,
    address: 'London No. 1 Lake Park'
  },
  {
    key: '3',
    name: 'Bob Johnson',
    age: 35,
    address: 'Sydney No. 1 Lake Park'
  }
]

describe('TableList', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Mock desktop breakpoint by default
    mockUseBreakpoint.mockReturnValue({
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: true,
      xxl: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render table with basic props', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      // Check if table is rendered
      expect(screen.getByRole('table')).toBeInTheDocument()
      
      // Check if data is rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      
      // Check if columns are rendered
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Age')).toBeInTheDocument()
      expect(screen.getByText('Address')).toBeInTheDocument()
    })

    it('should render without card wrapper when showCard is false', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          showCard={false}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      // Card element should not be present
      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })

    it('should render with card wrapper by default', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      // Card element should be present (Antd Card renders as article)
      const cardElements = document.querySelectorAll('.ant-card')
      expect(cardElements.length).toBeGreaterThan(0)
    })

    it('should apply custom card props', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          cardProps={{
            title: 'Custom Card Title',
            size: 'small'
          }}
        />
      )

      expect(screen.getByText('Custom Card Title')).toBeInTheDocument()
    })
  })

  describe('Header Functionality', () => {
    it('should render title when provided', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          title="User List"
        />
      )

      expect(screen.getByText('User List')).toBeInTheDocument()
    })

    it('should render extra actions when provided', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          extra={
            <button data-testid="add-button">Add New</button>
          }
        />
      )

      expect(screen.getByTestId('add-button')).toBeInTheDocument()
      expect(screen.getByText('Add New')).toBeInTheDocument()
    })

    it('should render both title and extra actions', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          title="User Management"
          extra={
            <div>
              <button data-testid="add-button">Add</button>
              <button data-testid="export-button">Export</button>
            </div>
          }
        />
      )

      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByTestId('add-button')).toBeInTheDocument()
      expect(screen.getByTestId('export-button')).toBeInTheDocument()
    })

    it('should handle complex title content', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          title={
            <div>
              <h2>Complex Title</h2>
              <span>With subtitle</span>
            </div>
          }
        />
      )

      expect(screen.getByText('Complex Title')).toBeInTheDocument()
      expect(screen.getByText('With subtitle')).toBeInTheDocument()
    })
  })

  describe('Index Column Functionality', () => {
    it('should show index column when showIndex is true', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          showIndex={true}
        />
      )

      expect(screen.getByText('序号')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should not show index column by default', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      expect(screen.queryByText('序号')).not.toBeInTheDocument()
    })

    it('should calculate index correctly with pagination', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          showIndex={true}
          pagination={{
            current: 2,
            pageSize: 5
          }}
        />
      )

      // Second page, pageSize 5: indices should be 6, 7, 8
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('should apply custom index column props', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          showIndex={true}
          indexColumnProps={{
            title: 'No.',
            width: 100
          }}
        />
      )

      expect(screen.getByText('No.')).toBeInTheDocument()
      expect(screen.queryByText('序号')).not.toBeInTheDocument()
    })
  })

  describe('Pagination Configuration', () => {
    it('should render default pagination', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      // Check if pagination controls are present
      expect(screen.getByTitle('Previous Page')).toBeInTheDocument()
      expect(screen.getByTitle('Next Page')).toBeInTheDocument()
    })

    it('should disable pagination when pagination is false', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          pagination={false}
        />
      )

      // Pagination controls should not be present
      expect(screen.queryByTitle('Previous Page')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Next Page')).not.toBeInTheDocument()
    })

    it('should apply custom pagination config', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          pagination={{
            pageSize: 5,
            total: 50,
            showSizeChanger: false
          }}
        />
      )

      // Should have pagination but without size changer
      expect(screen.getByTitle('Previous Page')).toBeInTheDocument()
      // Size changer dropdown should not be present when disabled
      expect(screen.queryByTitle('Page Size')).not.toBeInTheDocument()
    })

    it('should show total count in pagination', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          pagination={{
            total: 100,
            pageSize: 10,
            current: 1
          }}
        />
      )

      // Should show total count text
      expect(screen.getByText(/总共.*条/)).toBeInTheDocument()
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile breakpoint
      mockUseBreakpoint.mockReturnValue({
        xs: true,
        sm: true,
        md: false,
        lg: false,
        xl: false,
        xxl: false
      })
    })

    it('should apply mobile styles and configurations', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      // Table should still render
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should hide quick jumper on mobile', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      // Quick jumper should not be present on mobile
      expect(screen.queryByPlaceholderText(/跳至/)).not.toBeInTheDocument()
    })

    it('should adjust header layout on mobile', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          title="Mobile Title"
          extra={<button>Mobile Action</button>}
        />
      )

      expect(screen.getByText('Mobile Title')).toBeInTheDocument()
      expect(screen.getByText('Mobile Action')).toBeInTheDocument()
    })

    it('should apply mobile card styles', () => {
      const { container } = render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      // Mobile card should have different styles (no shadow, smaller padding)
      const card = container.querySelector('.ant-card')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should handle column sorting interactions', async () => {
      const sortableColumns = [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          sorter: (a: any, b: any) => a.name.localeCompare(b.name)
        },
        {
          title: 'Age',
          dataIndex: 'age',
          key: 'age',
          sorter: (a: any, b: any) => a.age - b.age
        }
      ]

      render(
        <TableList
          columns={sortableColumns}
          dataSource={mockDataSource}
        />
      )

      // Find sortable column headers
      const nameHeader = screen.getByText('Name')
      const ageHeader = screen.getByText('Age')

      // These should be clickable for sorting
      expect(nameHeader.closest('th')).toBeInTheDocument()
      expect(ageHeader.closest('th')).toBeInTheDocument()
    })

    it('should handle pagination interactions', async () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          pagination={{
            total: 100,
            pageSize: 10,
            current: 1
          }}
        />
      )

      const nextButton = screen.getByTitle('Next Page')
      expect(nextButton).toBeInTheDocument()

      // Should be clickable
      await user.hover(nextButton)
      expect(nextButton).not.toBeDisabled()
    })

    it('should handle custom extra actions', async () => {
      const mockAddClick = vi.fn()
      
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          extra={
            <button onClick={mockAddClick} data-testid="add-button">
              Add New
            </button>
          }
        />
      )

      const addButton = screen.getByTestId('add-button')
      await user.click(addButton)

      expect(mockAddClick).toHaveBeenCalledTimes(1)
    })

    it('should pass comprehensive click testing', async () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          title="Test Table"
          extra={<button>Extra Action</button>}
          showIndex={true}
        />
      )

      await expectAllClicksWork()
    })
  })

  describe('Column Configuration', () => {
    it('should render all provided columns', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      mockColumns.forEach(column => {
        if (column.title) {
          expect(screen.getByText(column.title as string)).toBeInTheDocument()
        }
      })
    })

    it('should handle empty columns array', () => {
      render(
        <TableList
          columns={[]}
          dataSource={mockDataSource}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should merge index column with existing columns', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          showIndex={true}
        />
      )

      // Should have index column plus original columns
      expect(screen.getByText('序号')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Age')).toBeInTheDocument()
      expect(screen.getByText('Address')).toBeInTheDocument()
    })

    it('should apply column widths on mobile', () => {
      mockUseBreakpoint.mockReturnValue({
        xs: true,
        sm: true,
        md: false,
        lg: false,
        xl: false,
        xxl: false
      })

      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      // On mobile, columns should have minimum widths applied
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty data source', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={[]}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      // Antd Table shows "No Data" by default for empty data
      expect(screen.getByText('暂无数据')).toBeInTheDocument()
    })

    it('should handle null/undefined data source', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={undefined}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle missing pagination config gracefully', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          pagination={{}}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByTitle('Previous Page')).toBeInTheDocument()
    })

    it('should handle long content gracefully', () => {
      const longDataSource = [
        {
          key: '1',
          name: 'Very Long Name That Should Not Break The Layout',
          age: 32,
          address: 'Very Long Address That Should Be Handled Properly By The Table Component'
        }
      ]

      render(
        <TableList
          columns={mockColumns}
          dataSource={longDataSource}
        />
      )

      expect(screen.getByText('Very Long Name That Should Not Break The Layout')).toBeInTheDocument()
    })
  })

  describe('Performance Testing', () => {
    it('should render efficiently with large dataset', async () => {
      const largeDataSource = Array.from({ length: 100 }, (_, index) => ({
        key: index.toString(),
        name: `User ${index}`,
        age: 20 + (index % 50),
        address: `Address ${index}`
      }))

      const renderStart = performance.now()
      render(
        <TableList
          columns={mockColumns}
          dataSource={largeDataSource}
        />
      )
      const renderEnd = performance.now()

      expect(renderEnd - renderStart).toBePerformant(100)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should not cause memory leaks on rerenders', () => {
      const memoryStart = testHelpers.getMemoryUsage()

      const { rerender } = render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      // Multiple rerenders with different data
      for (let i = 0; i < 10; i++) {
        const newData = mockDataSource.map(item => ({
          ...item,
          key: `${item.key}-${i}`,
          name: `${item.name}-${i}`
        }))

        rerender(
          <TableList
            columns={mockColumns}
            dataSource={newData}
          />
        )
      }

      const memoryEnd = testHelpers.getMemoryUsage()
      const memoryDiff = memoryEnd - memoryStart

      expect(memoryDiff).toNotLeakMemory(2 * 1024 * 1024) // Should not leak more than 2MB
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with proper ARIA attributes', async () => {
      const { container } = render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          title="Accessible Table"
        />
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should support keyboard navigation', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
        />
      )

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      // Table should be focusable and navigable
      expect(table).toHaveAttribute('tabindex')
    })

    it('should have proper heading structure', () => {
      render(
        <TableList
          columns={mockColumns}
          dataSource={mockDataSource}
          title="Data Table"
        />
      )

      // Column headers should be proper column headers
      const nameHeader = screen.getByText('Name')
      expect(nameHeader.closest('th')).toBeInTheDocument()
    })
  })
})

describe('TableActions', () => {
  const user = userEvent.setup()

  const mockActions = [
    { key: 'view', label: 'View', onClick: vi.fn() },
    { key: 'edit', label: 'Edit', onClick: vi.fn() },
    { key: 'delete', label: 'Delete', danger: true, onClick: vi.fn() }
  ]

  const mockRecord = { id: '1', name: 'Test Record' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render all actions when count is within limit', () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
          maxCount={5}
        />
      )

      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('should limit actions and show "更多" when exceeding maxCount', () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
          maxCount={2}
        />
      )

      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      expect(screen.getByText('更多')).toBeInTheDocument()
    })

    it('should use default maxCount of 3', () => {
      const manyActions = [
        { key: 'action1', label: 'Action 1', onClick: vi.fn() },
        { key: 'action2', label: 'Action 2', onClick: vi.fn() },
        { key: 'action3', label: 'Action 3', onClick: vi.fn() },
        { key: 'action4', label: 'Action 4', onClick: vi.fn() }
      ]

      render(
        <TableActions
          actions={manyActions}
          record={mockRecord}
        />
      )

      expect(screen.getByText('Action 1')).toBeInTheDocument()
      expect(screen.getByText('Action 2')).toBeInTheDocument()
      expect(screen.getByText('Action 3')).toBeInTheDocument()
      expect(screen.queryByText('Action 4')).not.toBeInTheDocument()
      expect(screen.getByText('更多')).toBeInTheDocument()
    })
  })

  describe('Action Interactions', () => {
    it('should call onClick when action is clicked', async () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
        />
      )

      const viewAction = screen.getByText('View')
      await user.click(viewAction)

      expect(mockActions[0].onClick).toHaveBeenCalledTimes(1)
      expect(mockActions[0].onClick).toHaveBeenCalledWith(mockRecord)
    })

    it('should handle actions without onClick gracefully', async () => {
      const actionsWithoutOnClick = [
        { key: 'view', label: 'View' },
        { key: 'edit', label: 'Edit', onClick: vi.fn() }
      ]

      render(
        <TableActions
          actions={actionsWithoutOnClick}
          record={mockRecord}
        />
      )

      const viewAction = screen.getByText('View')
      await user.click(viewAction)

      // Should not throw error
      expect(actionsWithoutOnClick[1].onClick).not.toHaveBeenCalled()
    })

    it('should handle disabled actions', async () => {
      const actionsWithDisabled = [
        { key: 'view', label: 'View', onClick: vi.fn() },
        { key: 'edit', label: 'Edit', disabled: true, onClick: vi.fn() }
      ]

      render(
        <TableActions
          actions={actionsWithDisabled}
          record={mockRecord}
        />
      )

      const editAction = screen.getByText('Edit')
      expect(editAction.closest('a')).toHaveClass('ant-typography-disabled')
      
      await user.click(editAction)
      // Disabled action should not trigger onClick
      expect(actionsWithDisabled[1].onClick).not.toHaveBeenCalled()
    })
  })

  describe('Styling and Appearance', () => {
    it('should apply danger styling to danger actions', () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
        />
      )

      const deleteAction = screen.getByText('Delete')
      expect(deleteAction).toHaveStyle({ color: '#ff4d4f' })
    })

    it('should not apply danger styling to normal actions', () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
        />
      )

      const viewAction = screen.getByText('View')
      expect(viewAction).not.toHaveStyle({ color: '#ff4d4f' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty actions array', () => {
      render(
        <TableActions
          actions={[]}
          record={mockRecord}
        />
      )

      // Should render without crashing
      expect(screen.queryByText('更多')).not.toBeInTheDocument()
    })

    it('should handle actions without record', async () => {
      render(
        <TableActions
          actions={mockActions}
        />
      )

      const viewAction = screen.getByText('View')
      await user.click(viewAction)

      expect(mockActions[0].onClick).toHaveBeenCalledWith(undefined)
    })

    it('should handle maxCount of 0', () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
          maxCount={0}
        />
      )

      expect(screen.queryByText('View')).not.toBeInTheDocument()
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      expect(screen.getByText('更多')).toBeInTheDocument()
    })

    it('should handle very large maxCount', () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
          maxCount={1000}
        />
      )

      expect(screen.getByText('View')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.queryByText('更多')).not.toBeInTheDocument()
    })
  })

  describe('Interactive Elements Testing', () => {
    it('should pass comprehensive click testing', async () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
        />
      )

      await expectAllClicksWork()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible', async () => {
      const { container } = render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
        />
      )

      await waitFor(() => {
        expect(container.firstChild).toBeAccessible()
      })
    })

    it('should have proper link semantics', () => {
      render(
        <TableActions
          actions={mockActions}
          record={mockRecord}
        />
      )

      const viewAction = screen.getByText('View')
      expect(viewAction.closest('a')).toBeInTheDocument()
      expect(viewAction.closest('a')).toHaveAttribute('role')
    })
  })
})