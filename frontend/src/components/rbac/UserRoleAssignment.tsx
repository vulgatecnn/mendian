/**
 * 用户角色分配组件
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Avatar,
  Tag,
  message,
  Input,
  Row,
  Col,
  Alert,
  Tooltip,
  Badge
} from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  SwapOutlined,
  UserSwitchOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select

// 用户数据类型
interface User {
  id: string
  userid: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  department?: string
  roles: Role[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// 角色数据类型
interface Role {
  id: string
  code: string
  name: string
  description?: string
  enabled: boolean
}

interface UserRoleAssignmentProps {
  /** 自定义样式类名 */
  className?: string
}

export const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  className
}) => {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchText, setSearchText] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()

  // 模拟数据加载
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      const mockUsers: User[] = [
        {
          id: '1',
          userid: 'admin001',
          name: '张管理员',
          email: 'admin@example.com',
          phone: '13800138001',
          avatar: 'https://via.placeholder.com/64',
          department: '技术部',
          roles: [
            { id: '1', code: 'ADMIN', name: '系统管理员', enabled: true }
          ],
          enabled: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        {
          id: '2',
          userid: 'business001',
          name: '李商务',
          email: 'business@example.com',
          phone: '13800138002',
          department: '商务部',
          roles: [
            { id: '2', code: 'BUSINESS_MANAGER', name: '商务经理', enabled: true }
          ],
          enabled: true,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02'
        },
        {
          id: '3',
          userid: 'store001',
          name: '王店长',
          email: 'store@example.com',
          phone: '13800138003',
          department: '运营部',
          roles: [
            { id: '3', code: 'STORE_MANAGER', name: '门店店长', enabled: true }
          ],
          enabled: true,
          createdAt: '2024-01-03',
          updatedAt: '2024-01-03'
        },
        {
          id: '4',
          userid: 'finance001',
          name: '赵财务',
          email: 'finance@example.com',
          phone: '13800138004',
          department: '财务部',
          roles: [
            { id: '4', code: 'FINANCE_STAFF', name: '财务人员', enabled: true }
          ],
          enabled: true,
          createdAt: '2024-01-04',
          updatedAt: '2024-01-04'
        },
        {
          id: '5',
          userid: 'multi001',
          name: '钱多角',
          email: 'multi@example.com',
          phone: '13800138005',
          department: '综合部',
          roles: [
            { id: '2', code: 'BUSINESS_MANAGER', name: '商务经理', enabled: true },
            { id: '3', code: 'STORE_MANAGER', name: '门店店长', enabled: true }
          ],
          enabled: true,
          createdAt: '2024-01-05',
          updatedAt: '2024-01-05'
        }
      ]
      setUsers(mockUsers)
    } catch (error) {
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const mockRoles: Role[] = [
        { id: '1', code: 'ADMIN', name: '系统管理员', description: '拥有系统所有权限', enabled: true },
        { id: '2', code: 'BUSINESS_MANAGER', name: '商务经理', description: '负责门店拓展和商务谈判', enabled: true },
        { id: '3', code: 'STORE_MANAGER', name: '门店店长', description: '门店日常运营管理', enabled: true },
        { id: '4', code: 'FINANCE_STAFF', name: '财务人员', description: '财务审核和报表查看', enabled: true },
        { id: '5', code: 'OPERATION_STAFF', name: '运营人员', description: '运营数据分析和计划管理', enabled: true }
      ]
      setRoles(mockRoles)
    } catch (error) {
      message.error('加载角色列表失败')
    }
  }

  // 打开角色分配弹窗
  const openAssignModal = (user: User) => {
    setSelectedUser(user)
    form.setFieldsValue({
      userId: user.id,
      roleIds: user.roles.map(role => role.id)
    })
    setModalVisible(true)
  }

  // 保存角色分配
  const handleSaveAssignment = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 获取选中的角色
      const selectedRoles = roles.filter(role => values.roleIds.includes(role.id))

      // 更新用户角色
      setUsers(prev =>
        prev.map(user =>
          user.id === values.userId
            ? { ...user, roles: selectedRoles, updatedAt: new Date().toISOString() }
            : user
        )
      )

      message.success('角色分配成功')
      setModalVisible(false)
    } catch (error) {
      message.error('角色分配失败')
    } finally {
      setLoading(false)
    }
  }

  // 批量分配角色
  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要分配角色的用户')
      return
    }

    Modal.confirm({
      title: '批量分配角色',
      content: (
        <Form layout="vertical">
          <Alert
            message={`将为选中的 ${selectedRowKeys.length} 个用户批量分配角色`}
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Form.Item
            label="选择角色"
            name="roleIds"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要分配的角色"
              style={{ width: '100%' }}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      ),
      onOk: async (close) => {
        // 这里应该从表单获取选中的角色
        // 简化处理，直接提示成功
        message.success(`已为 ${selectedRowKeys.length} 个用户分配角色`)
        setSelectedRowKeys([])
        close?.()
      }
    })
  }

  // 移除用户角色
  const removeUserRole = async (userId: string, roleId: string) => {
    try {
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? {
                ...user,
                roles: user.roles.filter(role => role.id !== roleId),
                updatedAt: new Date().toISOString()
              }
            : user
        )
      )
      message.success('角色移除成功')
    } catch (error) {
      message.error('角色移除失败')
    }
  }

  // 获取去重的部门列表
  const departments = Array.from(
    new Set(users.map(user => user.department).filter(Boolean))
  )

  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.userid.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchText.toLowerCase()))
    
    const matchesDepartment = !departmentFilter || user.department === departmentFilter
    
    const matchesRole = !roleFilter || user.roles.some(role => role.id === roleFilter)
    
    return matchesSearch && matchesDepartment && matchesRole
  })

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record: User) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              @{record.userid}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department: string) => (
        <Tag icon={<TeamOutlined />} color="blue">
          {department || '未设置'}
        </Tag>
      )
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: Role[]) => (
        <Space wrap>
          {roles.length === 0 ? (
            <Tag color="default">未分配角色</Tag>
          ) : (
            roles.map(role => (
              <Tag key={role.id} color="green">
                {role.name}
              </Tag>
            ))
          )}
          <Badge count={roles.length} color="#52c41a" />
        </Space>
      )
    },
    {
      title: '联系信息',
      key: 'contact',
      width: 150,
      render: (_, record: User) => (
        <Space direction="vertical" size="small">
          {record.email && (
            <div style={{ fontSize: '12px' }}>📧 {record.email}</div>
          )}
          {record.phone && (
            <div style={{ fontSize: '12px' }}>📱 {record.phone}</div>
          )}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean) => (
        <Badge
          status={enabled ? 'success' : 'error'}
          text={enabled ? '正常' : '禁用'}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: User) => (
        <Space>
          <Tooltip title="分配角色">
            <Button
              type="text"
              icon={<UserSwitchOutlined />}
              onClick={() => openAssignModal(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className={className}>
      <Card
        title={
          <Space>
            <UserSwitchOutlined />
            <span>用户角色分配</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<SwapOutlined />}
              onClick={handleBatchAssign}
              disabled={selectedRowKeys.length === 0}
            >
              批量分配
            </Button>
          </Space>
        }
      >
        {/* 过滤器 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索用户名、账号、邮箱..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选部门"
              allowClear
              style={{ width: '100%' }}
              onChange={setDepartmentFilter}
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>
                  {dept}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选角色"
              allowClear
              style={{ width: '100%' }}
              onChange={setRoleFilter}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 统计信息 */}
        <Alert
          message={
            <Space>
              <span>共 {users.length} 个用户</span>
              <span>·</span>
              <span>已分配角色用户 {users.filter(u => u.roles.length > 0).length} 个</span>
              <span>·</span>
              <span>未分配角色用户 {users.filter(u => u.roles.length === 0).length} 个</span>
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 角色分配弹窗 */}
      <Modal
        title={
          <Space>
            <SafetyOutlined />
            <span>分配角色 - {selectedUser?.name}</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSaveAssignment}
        onCancel={() => setModalVisible(false)}
        width={600}
        confirmLoading={loading}
        destroyOnClose
      >
        {selectedUser && (
          <div style={{ marginBottom: 24 }}>
            <Alert
              message={
                <Space>
                  <Avatar src={selectedUser.avatar} icon={<UserOutlined />} />
                  <span>{selectedUser.name} (@{selectedUser.userid})</span>
                  <Tag color="blue">{selectedUser.department}</Tag>
                </Space>
              }
              type="info"
            />
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item name="userId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="选择角色"
            name="roleIds"
            rules={[{ required: true, message: '请选择至少一个角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              style={{ width: '100%' }}
              optionLabelProp="label"
            >
              {roles.filter(role => role.enabled).map(role => (
                <Option
                  key={role.id}
                  value={role.id}
                  label={role.name}
                >
                  <Space>
                    <span>{role.name}</span>
                    {role.description && (
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        ({role.description})
                      </span>
                    )}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 当前角色显示 */}
          {selectedUser?.roles && selectedUser.roles.length > 0 && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>当前角色:</div>
              <Space wrap>
                {selectedUser?.roles?.map(role => (
                  <Tag
                    key={role.id}
                    color="green"
                    closable
                    onClose={() => selectedUser && removeUserRole(selectedUser.id, role.id)}
                  >
                    {role.name}
                  </Tag>
                )) || []}
              </Space>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default UserRoleAssignment