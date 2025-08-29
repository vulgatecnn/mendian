/**
 * 角色管理组件
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Tree,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  Alert
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  UserOutlined,
  KeyOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'

const { TextArea } = Input
const { Search } = Input

// 角色数据类型
interface Role {
  id: string
  code: string
  name: string
  description?: string
  permissions: string[]
  userCount: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// 权限数据类型
interface Permission {
  id: string
  code: string
  name: string
  description?: string
  parentId?: string
  type: 'menu' | 'button' | 'api'
  children?: Permission[]
}

interface RoleManagementProps {
  /** 自定义样式类名 */
  className?: string
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  className
}) => {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()

  // 模拟数据加载
  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  // 加载角色列表
  const loadRoles = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      const mockRoles: Role[] = [
        {
          id: '1',
          code: 'ADMIN',
          name: '系统管理员',
          description: '拥有系统所有权限',
          permissions: ['system:manage', 'user:manage', 'role:manage'],
          userCount: 2,
          enabled: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        {
          id: '2',
          code: 'BUSINESS_MANAGER',
          name: '商务经理',
          description: '负责门店拓展和商务谈判',
          permissions: ['store:plan', 'expansion:manage', 'approval:submit'],
          userCount: 5,
          enabled: true,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02'
        },
        {
          id: '3',
          code: 'STORE_MANAGER',
          name: '门店店长',
          description: '门店日常运营管理',
          permissions: ['store:view', 'operation:manage'],
          userCount: 15,
          enabled: true,
          createdAt: '2024-01-03',
          updatedAt: '2024-01-03'
        },
        {
          id: '4',
          code: 'FINANCE_STAFF',
          name: '财务人员',
          description: '财务审核和报表查看',
          permissions: ['approval:review', 'finance:view'],
          userCount: 3,
          enabled: true,
          createdAt: '2024-01-04',
          updatedAt: '2024-01-04'
        }
      ]
      setRoles(mockRoles)
    } catch (error) {
      message.error('加载角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载权限树
  const loadPermissions = async () => {
    try {
      // 模拟权限树数据
      const mockPermissions: Permission[] = [
        {
          id: '1',
          code: 'system',
          name: '系统管理',
          type: 'menu',
          children: [
            { id: '1-1', code: 'system:manage', name: '系统设置', type: 'menu' },
            { id: '1-2', code: 'user:manage', name: '用户管理', type: 'menu' },
            { id: '1-3', code: 'role:manage', name: '角色管理', type: 'menu' }
          ]
        },
        {
          id: '2',
          code: 'store',
          name: '门店管理',
          type: 'menu',
          children: [
            { id: '2-1', code: 'store:plan', name: '开店计划', type: 'menu' },
            { id: '2-2', code: 'store:view', name: '门店档案', type: 'menu' },
            { id: '2-3', code: 'store:edit', name: '门店编辑', type: 'button' }
          ]
        },
        {
          id: '3',
          code: 'expansion',
          name: '拓店管理',
          type: 'menu',
          children: [
            { id: '3-1', code: 'expansion:manage', name: '拓店管理', type: 'menu' },
            { id: '3-2', code: 'expansion:edit', name: '拓店编辑', type: 'button' }
          ]
        },
        {
          id: '4',
          code: 'operation',
          name: '运营管理',
          type: 'menu',
          children: [
            { id: '4-1', code: 'operation:manage', name: '运营管理', type: 'menu' },
            { id: '4-2', code: 'operation:report', name: '运营报表', type: 'menu' }
          ]
        },
        {
          id: '5',
          code: 'approval',
          name: '审批中心',
          type: 'menu',
          children: [
            { id: '5-1', code: 'approval:submit', name: '提交审批', type: 'button' },
            { id: '5-2', code: 'approval:review', name: '审批处理', type: 'button' }
          ]
        },
        {
          id: '6',
          code: 'finance',
          name: '财务管理',
          type: 'menu',
          children: [
            { id: '6-1', code: 'finance:view', name: '财务查看', type: 'menu' },
            { id: '6-2', code: 'finance:manage', name: '财务管理', type: 'menu' }
          ]
        }
      ]
      setPermissions(mockPermissions)
    } catch (error) {
      message.error('加载权限列表失败')
    }
  }

  // 转换权限数据为Tree组件需要的格式
  const convertToTreeData = (permissions: Permission[]): DataNode[] => {
    return permissions.map(permission => ({
      key: permission.code,
      title: (
        <Space>
          <span>{permission.name}</span>
          <Tag color={permission.type === 'menu' ? 'blue' : 'green'}>
            {permission.type === 'menu' ? '菜单' : '按钮'}
          </Tag>
        </Space>
      ),
      children: permission.children ? convertToTreeData(permission.children) : []
    }))
  }

  // 打开新增/编辑弹窗
  const openModal = (role?: Role) => {
    setEditingRole(role || null)
    if (role) {
      form.setFieldsValue({
        code: role.code,
        name: role.name,
        description: role.description,
        enabled: role.enabled,
        permissions: role.permissions
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 保存角色
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 模拟API调用
      if (editingRole) {
        // 更新角色
        setRoles(prev =>
          prev.map(role =>
            role.id === editingRole.id
              ? { ...role, ...values, updatedAt: new Date().toISOString() }
              : role
          )
        )
        message.success('角色更新成功')
      } else {
        // 新增角色
        const newRole: Role = {
          id: Date.now().toString(),
          ...values,
          userCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setRoles(prev => [...prev, newRole])
        message.success('角色创建成功')
      }

      setModalVisible(false)
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除角色
  const handleDelete = async (roleId: string) => {
    try {
      setLoading(true)
      // 模拟API调用
      setRoles(prev => prev.filter(role => role.id !== roleId))
      message.success('角色删除成功')
    } catch (error) {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的角色')
      return
    }

    try {
      setLoading(true)
      setRoles(prev => prev.filter(role => !selectedRowKeys.includes(role.id)))
      setSelectedRowKeys([])
      message.success(`成功删除 ${selectedRowKeys.length} 个角色`)
    } catch (error) {
      message.error('批量删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换角色状态
  const toggleRoleStatus = async (roleId: string, enabled: boolean) => {
    try {
      setRoles(prev =>
        prev.map(role =>
          role.id === roleId
            ? { ...role, enabled, updatedAt: new Date().toISOString() }
            : role
        )
      )
      message.success(`角色${enabled ? '启用' : '禁用'}成功`)
    } catch (error) {
      message.error('状态切换失败')
    }
  }

  // 过滤角色列表
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchText.toLowerCase()) ||
    role.code.toLowerCase().includes(searchText.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchText.toLowerCase()))
  )

  // 表格列定义
  const columns: ColumnsType<Role> = [
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 100,
      render: (permissions: string[]) => (
        <Tooltip title={`权限：${permissions.join(', ')}`}>
          <Tag color="green">{permissions.length}</Tag>
        </Tooltip>
      )
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 100,
      render: (count: number) => (
        <Space>
          <UserOutlined />
          <span>{count}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: Role) => (
        <Switch
          checked={enabled}
          onChange={(checked) => toggleRoleStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: Role) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除角色"${record.name}"吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              disabled={record.userCount > 0}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className={className}>
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>角色管理</span>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="搜索角色..."
              allowClear
              style={{ width: 200 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
            >
              新增角色
            </Button>
          </Space>
        }
      >
        {/* 批量操作 */}
        {selectedRowKeys.length > 0 && (
          <Alert
            message={
              <Space>
                <span>已选择 {selectedRowKeys.length} 项</span>
                <Button size="small" onClick={() => setSelectedRowKeys([])}>
                  取消选择
                </Button>
                <Popconfirm
                  title="批量删除确认"
                  description={`确定要删除选中的 ${selectedRowKeys.length} 个角色吗？`}
                  onConfirm={handleBatchDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="small" danger>
                    批量删除
                  </Button>
                </Popconfirm>
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRoles}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.userCount > 0 // 有用户的角色不允许删除
            })
          }}
          pagination={{
            total: filteredRoles.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={
          <Space>
            <KeyOutlined />
            <span>{editingRole ? '编辑角色' : '新增角色'}</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={800}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
            permissions: []
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色代码"
                name="code"
                rules={[
                  { required: true, message: '请输入角色代码' },
                  { pattern: /^[A-Z_]+$/, message: '只能包含大写字母和下划线' }
                ]}
              >
                <Input
                  placeholder="如：BUSINESS_MANAGER"
                  disabled={!!editingRole}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="角色名称"
                name="name"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="如：商务经理" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="角色描述"
            name="description"
          >
            <TextArea
              placeholder="请输入角色描述"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="角色状态"
            name="enabled"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            label="权限配置"
            name="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Tree
              checkable
              checkedKeys={form.getFieldValue('permissions')}
              onCheck={(checkedKeys) => {
                form.setFieldsValue({
                  permissions: Array.isArray(checkedKeys) ? checkedKeys : []
                })
              }}
              treeData={convertToTreeData(permissions)}
              height={300}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                padding: '8px'
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RoleManagement