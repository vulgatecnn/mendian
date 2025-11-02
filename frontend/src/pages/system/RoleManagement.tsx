/**
 * 角色管理页面组件
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
  Tooltip,

} from '@arco-design/web-react'
import {
  IconPlus,
  IconSearch,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconSettings,
  IconUserGroup
} from '@arco-design/web-react/icon'
import { ColumnProps } from '@arco-design/web-react/es/Table'
import { Role } from '../../types'
import RoleService, { RoleQueryParams } from '../../api/roleService'
import { RoleFormModal, PermissionConfigModal, RoleMembersModal } from '../../components'
import { PermissionGuard } from '../../components/PermissionGuard'
import { usePermission } from '../../hooks/usePermission'
import styles from './RoleManagement.module.css'

const { Title } = Typography
const { Option } = Select

const RoleManagement: React.FC = () => {
  // 状态管理
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  
  // 权限检查
  const { hasPermission } = usePermission()

  // 筛选条件
  const [filters, setFilters] = useState<RoleQueryParams>({
    name: '',
    is_active: undefined
  })

  // 弹窗状态
  const [roleFormVisible, setRoleFormVisible] = useState(false)
  const [permissionConfigVisible, setPermissionConfigVisible] = useState(false)
  const [roleMembersVisible, setRoleMembersVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // 加载角色列表
  const loadRoles = async (params?: RoleQueryParams) => {
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
        if (queryParams[key as keyof RoleQueryParams] === '' || 
            queryParams[key as keyof RoleQueryParams] === undefined) {
          delete queryParams[key as keyof RoleQueryParams]
        }
      })

      const response = await RoleService.getRoles(queryParams)
      setRoles(response.results)
      setPagination(prev => ({
        ...prev,
        total: response.count
      }))
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '获取角色列表失败'
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 创建角色
  const handleCreateRole = () => {
    setSelectedRole(null)
    setIsEditing(false)
    setRoleFormVisible(true)
  }

  // 编辑角色
  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsEditing(true)
    setRoleFormVisible(true)
  }

  // 删除角色
  const handleDeleteRole = async (role: Role) => {
    try {
      const result = await RoleService.deleteRole(role.id)
      
      if (result.code === 0) {
        Message.success('角色删除成功')
        await loadRoles()
      } else {
        Message.error(result.message || '删除失败')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '删除失败'
      Message.error(errorMessage)
    }
  }

  // 配置权限
  const handleConfigPermissions = (role: Role) => {
    setSelectedRole(role)
    setPermissionConfigVisible(true)
  }

  // 管理成员
  const handleManageMembers = (role: Role) => {
    setSelectedRole(role)
    setRoleMembersVisible(true)
  }

  // 角色表单成功回调
  const handleRoleFormSuccess = () => {
    setRoleFormVisible(false)
    setSelectedRole(null)
    setIsEditing(false)
    loadRoles()
  }

  // 权限配置成功回调
  const handlePermissionConfigSuccess = () => {
    setPermissionConfigVisible(false)
    setSelectedRole(null)
    loadRoles() // 重新加载以更新权限信息
  }

  // 成员管理成功回调
  const handleMembersSuccess = () => {
    setRoleMembersVisible(false)
    setSelectedRole(null)
    loadRoles() // 重新加载以更新成员数量
  }

  // 搜索处理
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadRoles()
  }

  // 重置筛选条件
  const handleReset = () => {
    setFilters({
      name: '',
      is_active: undefined
    })
    setPagination(prev => ({ ...prev, current: 1 }))
    // 延迟执行以确保状态更新
    setTimeout(() => {
      loadRoles()
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
  const columns: ColumnProps<Role>[] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      width: 150,
      render: (name: string, record: Role) => (
        <div>
          <div className={styles.roleName}>{name}</div>
          {record.description && (
            <div className={styles.subText}>{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: '权限数量',
      dataIndex: 'permission_list',
      width: 100,
      render: (permissions: Role['permission_list']) => (
        <span>{permissions ? permissions.length : 0}</span>
      )
    },
    {
      title: '成员数量',
      dataIndex: 'member_count',
      width: 100,
      render: (count: number) => (
        <span>{count || 0}</span>
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
      title: '创建时间',
      dataIndex: 'created_at',
      width: 150,
      render: (createdAt: string) => {
        return new Date(createdAt).toLocaleString('zh-CN')
      }
    },
    {
      title: '操作',
      width: 250,
      render: (_, record: Role) => (
        <Space>
          <PermissionGuard permission="system.role.manage">
            <Tooltip content="编辑角色">
              <Button
                type="text"
                size="small"
                icon={<IconEdit />}
                onClick={() => handleEditRole(record)}
              >
                编辑
              </Button>
            </Tooltip>
          </PermissionGuard>
          
          <PermissionGuard permission="system.role.manage">
            <Tooltip content="配置权限">
              <Button
                type="text"
                size="small"
                icon={<IconSettings />}
                onClick={() => handleConfigPermissions(record)}
              >
                权限
              </Button>
            </Tooltip>
          </PermissionGuard>
          
          <PermissionGuard permission="system.role.manage">
            <Tooltip content="管理成员">
              <Button
                type="text"
                size="small"
                icon={<IconUserGroup />}
                onClick={() => handleManageMembers(record)}
              >
                成员
              </Button>
            </Tooltip>
          </PermissionGuard>
          
          <PermissionGuard permission="system.role.manage">
            <Popconfirm
              title={`确定要删除角色 "${record.name}" 吗？`}
              content="删除后不可恢复，请谨慎操作"
              onOk={() => handleDeleteRole(record)}
            >
              <Tooltip content="删除角色">
                <Button
                  type="text"
                  size="small"
                  status="danger"
                  icon={<IconDelete />}
                >
                  删除
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
    loadRoles()
  }, [pagination.current, pagination.pageSize])

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title heading={3} className={styles.title}>
            角色管理
          </Title>
          <div className={styles.actions}>
            <Space>
              <PermissionGuard permission="system.role.manage">
                <Button
                  type="primary"
                  icon={<IconPlus />}
                  onClick={handleCreateRole}
                >
                  创建角色
                </Button>
              </PermissionGuard>
              <Button
                icon={<IconRefresh />}
                onClick={() => loadRoles()}
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
              placeholder="搜索角色名称"
              value={filters.name}
              onChange={(value) => setFilters(prev => ({ ...prev, name: value }))}
              style={{ width: 200 }}
              allowClear
            />
            
            <Select
              placeholder="角色状态"
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

        {/* 角色列表表格 */}
        <Table
          columns={columns}
          data={roles}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`
          }}
          onChange={handleTableChange}
          rowKey="id"
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 角色创建/编辑弹窗 */}
      <RoleFormModal
        visible={roleFormVisible}
        role={selectedRole}
        isEditing={isEditing}
        onCancel={() => {
          setRoleFormVisible(false)
          setSelectedRole(null)
          setIsEditing(false)
        }}
        onSuccess={handleRoleFormSuccess}
      />

      {/* 权限配置弹窗 */}
      <PermissionConfigModal
        visible={permissionConfigVisible}
        role={selectedRole}
        onCancel={() => {
          setPermissionConfigVisible(false)
          setSelectedRole(null)
        }}
        onSuccess={handlePermissionConfigSuccess}
      />

      {/* 角色成员管理弹窗 */}
      <RoleMembersModal
        visible={roleMembersVisible}
        role={selectedRole}
        onCancel={() => {
          setRoleMembersVisible(false)
          setSelectedRole(null)
        }}
        onSuccess={handleMembersSuccess}
      />
    </div>
  )
}

export default RoleManagement