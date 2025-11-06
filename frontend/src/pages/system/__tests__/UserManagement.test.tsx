/**
 * 用户列表组件测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import UserManagement from '../UserManagement'
import { UserService } from '../../../api'

// Mock API
vi.mock('../../../api', () => ({
  UserService: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    syncWechatUsers: vi.fn(),
  },
  DepartmentService: {
    getDepartments: vi.fn(),
  },
  RoleService: {
    getRoles: vi.fn(),
  },
}))

// Mock hooks
vi.mock('../../../hooks/usePermission', () => ({
  usePermission: () => ({
    hasPermission: vi.fn(() => true),
  }),
}))

describe('用户列表组件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock 用户列表数据
    vi.mocked(UserService.getUsers).mockResolvedValue({
      count: 2,
      results: [
        {
          id: 1,
          username: 'admin',
          name: '管理员',
          phone: '13800138000',
          email: 'admin@example.com',
          department: { id: 1, name: '总部' },
          roles: [{ id: 1, name: '系统管理员' }],
          is_active: true,
        },
        {
          id: 2,
          username: 'user1',
          name: '用户1',
          phone: '13800138001',
          email: 'user1@example.com',
          department: { id: 2, name: '销售部' },
          roles: [{ id: 2, name: '销售人员' }],
          is_active: true,
        },
      ],
    })
  })

  const renderUserManagement = () => {
    return render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    )
  }

  it('应该正确渲染用户列表', async () => {
    renderUserManagement()
    
    await waitFor(() => {
      expect(screen.getByText('用户管理')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('user1')).toBeInTheDocument()
    })
  })

  it('应该显示用户信息列', async () => {
    renderUserManagement()
    
    await waitFor(() => {
      expect(screen.getByText('用户名')).toBeInTheDocument()
      expect(screen.getByText('姓名')).toBeInTheDocument()
      expect(screen.getByText('手机号')).toBeInTheDocument()
      expect(screen.getByText('邮箱')).toBeInTheDocument()
      expect(screen.getByText('部门')).toBeInTheDocument()
      expect(screen.getByText('角色')).toBeInTheDocument()
    })
  })

  it('应该显示新增用户按钮', async () => {
    renderUserManagement()
    
    await waitFor(() => {
      expect(screen.getByText('新增用户')).toBeInTheDocument()
    })
  })

  it('应该显示同步企业微信按钮', async () => {
    renderUserManagement()
    
    await waitFor(() => {
      expect(screen.getByText('同步企业微信')).toBeInTheDocument()
    })
  })

  it('应该支持搜索功能', async () => {
    renderUserManagement()
    
    await waitFor(async () => {
      const searchInput = screen.getByPlaceholderText(/搜索/)
      expect(searchInput).toBeInTheDocument()
    })
  })

  it('应该显示操作按钮', async () => {
    renderUserManagement()
    
    await waitFor(() => {
      const editButtons = screen.getAllByText('编辑')
      expect(editButtons.length).toBeGreaterThan(0)
    })
  })
})
