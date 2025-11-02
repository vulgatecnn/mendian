/**
 * 用户管理页面组件
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Message,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  Popconfirm,
  Tooltip
} from '@arco-design/web-react'
import {
  IconSync,
  IconSearch,
  IconRefresh,
  IconUserGroup,
  IconCheck,
  IconClose
} from '@arco-design/web-react/icon'
import { ColumnProps } from '@arco-design/web-react/es/Table'
import { User, Department } from '../../types'
import UserService, { UserQueryParams } from '../../api/userService'
import DepartmentService from '../../api/departmentService'
import RoleAssignModal from '../../components/RoleAssignModal'
import { PermissionGuard } from '../../components/PermissionGuard'
import { usePermission } from '../../hooks/usePermission'
import styles from './UserManagement.module.css'

const { Title } = Typography
const { Option } = Select

const UserManagement: React.FC = () => {
  // 状态管理
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  
  // 权限检查
  const { hasPermission } = usePermission()

  // 筛选条件
  const [filters, setFilters] = useState<UserQueryParams>({
    name: '',
    department_id: undefined,
    is_active: undefined
  })

  // 角色分配弹窗
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 加载用户列表
  const loadUsers = async (params?: UserQueryParams) => {
    try {
      setLoading(true)
      const queryParams = {
        ...filters,
        ...params,
        page: pagination.current,
        page_size: pagination.pageSize
      }
      
      // 清理空值参数
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof UserQueryParams] === '' || 
            queryParams[key as keyof UserQueryParams] === undefined) {
          delete queryParams[key as keyof UserQueryParams]
        }
      })

      const response = await UserService.getUsers(queryParams)
      setUsers(response.results)
      setPagination(prev => ({
        ...prev,
        total: response.count
      }))
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '获取用户列表失败'
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 加载部门列表（用于筛选）
  const loadDepartments = async () => {
    try {
      const data = await DepartmentService.getDepartments()
      setDepartments(data)
    } catch (error: any) {
      console.error('获取部门列表失败:', error)
    }
  }

  // 从企业微信同步用户
  const handleSyncFromWechat = async () => {
    try {
      setSyncLoading(true)
      const result = await UserService.syncFromWechat()
      
      if (result.code === 0) {
        const { total, created, updated } = result.data
        Message.success(
          `同步成功！共处理 ${total} 个用户，新增 ${created} 个，更新 ${updated} 个`
        )
        // 重新加载用户数据
        await loadUsers()
      } else {
        Message.error(result.message || '同步失败')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '同步失败，请稍后重试'
      Message.error(errorMessage)
    } finally {
      setSyncLoading(false)
    }
  }

  // 启用/停用用户
  const handleToggleUserStatus = async (user: User) => {
    try {
      const result = await UserService.toggleUserStatus(user.id, !user.is_active)
      
      if (result.code === 0) {
        Message.success(`用户已${user.is_active ? '停用' : '启用'}`)
        // 更新本地数据
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        ))
      } else {
        Message.error(result.message || '操作失败')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '操作失败'
      Message.error(errorMessage)
    }
  }

  // 打开角色分配弹窗
  const handleAssignRoles = (user: User) => {
    setSelectedUser(user)
    setRoleModalVisible(true)
  }

  // 角色分配成功回调
  const handleRoleAssignSuccess = () => {
    setRoleModalVisible(false)
    setSelectedUser(null)
    loadUsers() // 重新加载用户数据
  }

  // 搜索处理
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers()
  }

  // 重置筛选条件
  const handleReset = () => {
    setFilters({
      name: '',
      department_id: undefined,
      is_active: undefined
    })
    setPagination(prev => ({ ...prev, current: 1 }))
    // 延迟执行以确保状态更新
    setTimeout(() => {
      loadUsers()
    }, 0)
  }

  // 分页变化处理
  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  // 表格列定义
  const columns: ColumnProps<User>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (username: string, record: User) => (
        <div>
          <div>{username}</div>
          <div className={styles.subText}>{record.full_name}</div>
        </div>
      )
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 120
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      width: 150,
      render: (departmentName: string) => departmentName || '-'
    },
    {
      title: '职位',
      dataIndex: 'position',
      width: 120,
      render: (position: string) => position || '-'
    },
    {
      title: '角色',
      dataIndex: 'role_list',
      width: 200,
      render: (roles: User['role_list']) => (
        <div>
          {roles && roles.length > 0 ? (
            roles.map(role => (
              <Tag key={role.id} color="blue" size="small" style={{ marginBottom: '2px' }}>
                {role.name}
              </Tag>
            ))
          ) : (
            <span className={styles.subText}>未分配角色</span>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      width: 150,
      render: (lastLogin: string | null) => {
        if (!lastLogin) return <span className={styles.subText}>从未登录</span>
        return new Date(lastLogin).toLocaleString('zh-CN')
      }
    },
    {
      title: '操作',
      width: 200,
      render: (_, record: User) => (
        <Space>
          <PermissionGuard permission="system.user.manage">
            <Tooltip content="分配角色">
              <Button
                type="text"
                size="small"
                icon={<IconUserGroup />}
                onClick={() => handleAssignRoles(record)}
              >
                角色
              </Button>
            </Tooltip>
          </PermissionGuard>
          
          <PermissionGuard permission="system.user.manage">
            <Popconfirm
              title={`确定要${record.is_active ? '停用' : '启用'}用户 "${record.full_name}" 吗？`}
              onOk={() => handleToggleUserStatus(record)}
            >
              <Tooltip content={record.is_active ? '停用用户' : '启用用户'}>
                <Button
                  type="text"
                  size="small"
                  status={record.is_active ? 'warning' : 'success'}
                  icon={record.is_active ? <IconClose /> : <IconCheck />}
                >
                  {record.is_active ? '停用' : '启用'}
                </Button>
              </Tooltip>
            </Popconfirm>
          </PermissionGuard>
        </Space>
      )
    }
  ]

  // 组件挂载时加载数据
  useEffect(() => {
    loadUsers()
    loadDepartments()
  }, [pagination.current, pagination.pageSize])

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title heading={3} className={styles.title}>
            用户管理
          </Title>
          <div className={styles.actions}>
            <Space>
              <PermissionGuard permission="system.user.sync">
                <Button
                  type="primary"
                  icon={<IconSync />}
                  loading={syncLoading}
                  onClick={handleSyncFromWechat}
                >
                  从企业微信同步
                </Button>
              </PermissionGuard>
              <Button
                icon={<IconRefresh />}
                onClick={() => loadUsers()}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>
        </div>

        {/* 筛选条件 */}
        <div className={styles.filters}>
          <Space wrap>
            <Input
              placeholder="搜索用户名或姓名"
              value={filters.name}
              onChange={(value) => setFilters(prev => ({ ...prev, name: value }))}
              style={{ width: 200 }}
              allowClear
            />
            
            <Select
              placeholder="选择部门"
              value={filters.department_id}
              onChange={(value) => setFilters(prev => ({ ...prev, department_id: value as number }))}
              style={{ width: 150 }}
              allowClear
            >
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
            
            <Select
              placeholder="用户状态"
              value={filters.is_active === undefined ? undefined : (filters.is_active ? 'true' : 'false')}
              onChange={(value) => setFilters(prev => ({ 
                ...prev, 
                is_active: value === undefined ? undefined : value === 'true' 
              }))}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="true">启用</Option>
              <Option value="false">停用</Option>
            </Select>
            
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
              搜索
            </Button>
            
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>

        {/* 用户列表表格 */}
        <Table
          columns={columns}
          data={users}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`
          }}
          onChange={handleTableChange}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 角色分配弹窗 */}
      <RoleAssignModal
        visible={roleModalVisible}
        user={selectedUser}
        onCancel={() => {
          setRoleModalVisible(false)
          setSelectedUser(null)
        }}
        onSuccess={handleRoleAssignSuccess}
      />
    </div>
  )
}

export default UserManagement