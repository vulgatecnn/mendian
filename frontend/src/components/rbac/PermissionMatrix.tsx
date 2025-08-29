/**
 * 权限矩阵组件 - 可视化展示角色权限分配
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Space,
  Tag,
  Switch,
  Tooltip,
  Button,
  Select,
  Row,
  Col,
  Alert,
  Typography,
  Divider
} from 'antd'
import {
  SafetyOutlined,
  ReloadOutlined,
  DownloadOutlined,


} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { Title } = Typography

// 权限数据类型
interface Permission {
  id: string
  code: string
  name: string
  description?: string
  category: string
  type: 'menu' | 'button' | 'api'
}

// 角色数据类型
interface Role {
  id: string
  code: string
  name: string
  enabled: boolean
  permissions: string[]
}

// 权限矩阵行数据类型
interface PermissionMatrixRow extends Permission {
  rolePermissions: Record<string, boolean>
}

interface PermissionMatrixProps {
  /** 自定义样式类名 */
  className?: string
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  className
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [matrixData, setMatrixData] = useState<PermissionMatrixRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [_viewMode, _setViewMode] = useState<'matrix' | 'list'>('matrix')

  // 模拟数据加载
  useEffect(() => {
    loadData()
  }, [])

  // 重新构建矩阵数据
  useEffect(() => {
    buildMatrixData()
  }, [permissions, roles, selectedRoles])

  // 加载权限和角色数据
  const loadData = async () => {
    setLoading(true)
    try {
      // 模拟权限数据
      const mockPermissions: Permission[] = [
        // 系统管理
        { id: '1', code: 'system:view', name: '系统查看', category: '系统管理', type: 'menu' },
        { id: '2', code: 'system:manage', name: '系统管理', category: '系统管理', type: 'button' },
        { id: '3', code: 'user:view', name: '用户查看', category: '系统管理', type: 'menu' },
        { id: '4', code: 'user:manage', name: '用户管理', category: '系统管理', type: 'button' },
        { id: '5', code: 'role:view', name: '角色查看', category: '系统管理', type: 'menu' },
        { id: '6', code: 'role:manage', name: '角色管理', category: '系统管理', type: 'button' },
        
        // 门店管理
        { id: '7', code: 'store:view', name: '门店查看', category: '门店管理', type: 'menu' },
        { id: '8', code: 'store:create', name: '创建门店', category: '门店管理', type: 'button' },
        { id: '9', code: 'store:edit', name: '编辑门店', category: '门店管理', type: 'button' },
        { id: '10', code: 'store:delete', name: '删除门店', category: '门店管理', type: 'button' },
        { id: '11', code: 'store:plan', name: '开店计划', category: '门店管理', type: 'menu' },
        
        // 拓店管理
        { id: '12', code: 'expansion:view', name: '拓店查看', category: '拓店管理', type: 'menu' },
        { id: '13', code: 'expansion:manage', name: '拓店管理', category: '拓店管理', type: 'button' },
        { id: '14', code: 'candidate:view', name: '候选点位查看', category: '拓店管理', type: 'menu' },
        { id: '15', code: 'candidate:manage', name: '候选点位管理', category: '拓店管理', type: 'button' },
        
        // 筹备管理
        { id: '16', code: 'preparation:view', name: '筹备查看', category: '筹备管理', type: 'menu' },
        { id: '17', code: 'preparation:manage', name: '筹备管理', category: '筹备管理', type: 'button' },
        { id: '18', code: 'construction:view', name: '工程查看', category: '筹备管理', type: 'menu' },
        { id: '19', code: 'construction:manage', name: '工程管理', category: '筹备管理', type: 'button' },
        
        // 运营管理
        { id: '20', code: 'operation:view', name: '运营查看', category: '运营管理', type: 'menu' },
        { id: '21', code: 'operation:manage', name: '运营管理', category: '运营管理', type: 'button' },
        { id: '22', code: 'report:view', name: '报表查看', category: '运营管理', type: 'menu' },
        { id: '23', code: 'report:export', name: '报表导出', category: '运营管理', type: 'button' },
        
        // 审批管理
        { id: '24', code: 'approval:view', name: '审批查看', category: '审批管理', type: 'menu' },
        { id: '25', code: 'approval:submit', name: '提交审批', category: '审批管理', type: 'button' },
        { id: '26', code: 'approval:review', name: '审批处理', category: '审批管理', type: 'button' },
        { id: '27', code: 'approval:manage', name: '审批管理', category: '审批管理', type: 'button' },
        
        // 财务管理
        { id: '28', code: 'finance:view', name: '财务查看', category: '财务管理', type: 'menu' },
        { id: '29', code: 'finance:manage', name: '财务管理', category: '财务管理', type: 'button' },
        { id: '30', code: 'payment:view', name: '付款查看', category: '财务管理', type: 'menu' },
        { id: '31', code: 'payment:manage', name: '付款管理', category: '财务管理', type: 'button' }
      ]

      // 模拟角色数据
      const mockRoles: Role[] = [
        {
          id: '1',
          code: 'ADMIN',
          name: '系统管理员',
          enabled: true,
          permissions: mockPermissions.map(p => p.code) // 拥有所有权限
        },
        {
          id: '2',
          code: 'BUSINESS_MANAGER',
          name: '商务经理',
          enabled: true,
          permissions: [
            'store:view', 'store:plan', 'expansion:view', 'expansion:manage',
            'candidate:view', 'candidate:manage', 'approval:submit', 'approval:view'
          ]
        },
        {
          id: '3',
          code: 'STORE_MANAGER',
          name: '门店店长',
          enabled: true,
          permissions: [
            'store:view', 'store:edit', 'operation:view', 'operation:manage',
            'report:view', 'approval:submit'
          ]
        },
        {
          id: '4',
          code: 'FINANCE_STAFF',
          name: '财务人员',
          enabled: true,
          permissions: [
            'finance:view', 'finance:manage', 'payment:view', 'payment:manage',
            'approval:review', 'report:view'
          ]
        },
        {
          id: '5',
          code: 'OPERATION_STAFF',
          name: '运营人员',
          enabled: true,
          permissions: [
            'store:view', 'store:plan', 'operation:view', 'report:view',
            'report:export', 'approval:view'
          ]
        }
      ]

      setPermissions(mockPermissions)
      setRoles(mockRoles)
      setSelectedRoles(mockRoles.map(r => r.id)) // 默认显示所有角色
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 构建矩阵数据
  const buildMatrixData = () => {
    const filteredPermissions = permissions.filter(permission => {
      const matchesCategory = !categoryFilter || permission.category === categoryFilter
      const matchesType = !typeFilter || permission.type === typeFilter
      return matchesCategory && matchesType
    })

    const matrix = filteredPermissions.map(permission => {
      const rolePermissions: Record<string, boolean> = {}
      
      roles.forEach(role => {
        if (selectedRoles.includes(role.id)) {
          rolePermissions[role.id] = role.permissions.includes(permission.code)
        }
      })

      return {
        ...permission,
        rolePermissions
      }
    })

    setMatrixData(matrix)
  }

  // 切换权限
  const togglePermission = async (permissionCode: string, roleId: string, hasPermission: boolean) => {
    try {
      // 更新角色权限
      setRoles(prev =>
        prev.map(role =>
          role.id === roleId
            ? {
                ...role,
                permissions: hasPermission
                  ? role.permissions.filter(p => p !== permissionCode)
                  : [...role.permissions, permissionCode]
              }
            : role
        )
      )
    } catch (error) {
      console.error('权限更新失败:', error)
    }
  }

  // 获取权限类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'menu': return 'blue'
      case 'button': return 'green'
      case 'api': return 'orange'
      default: return 'default'
    }
  }

  // 获取权限类型文本
  const getTypeText = (type: string) => {
    switch (type) {
      case 'menu': return '菜单'
      case 'button': return '按钮'
      case 'api': return 'API'
      default: return '未知'
    }
  }

  // 导出权限矩阵
  const exportMatrix = () => {
    // 简单的CSV导出逻辑
    const headers = ['权限名称', '权限代码', '分类', '类型', ...roles.filter(r => selectedRoles.includes(r.id)).map(r => r.name)]
    const rows = matrixData.map(row => [
      row.name,
      row.code,
      row.category,
      getTypeText(row.type),
      ...roles.filter(r => selectedRoles.includes(r.id)).map(r => row.rolePermissions[r.id] ? '✓' : '✗')
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '权限矩阵.csv')
    link.click()
  }

  // 获取权限分类列表
  const categories = Array.from(new Set(permissions.map(p => p.category)))

  // 动态生成表格列
  const columns: ColumnsType<PermissionMatrixRow> = [
    {
      title: '权限名称',
      key: 'name',
      width: 150,
      fixed: 'left',
      render: (_, record) => (
        <Space direction="vertical" >
          <span>{record.name}</span>
          <Space>
            <Tag color={getTypeColor(record.type)} >
              {getTypeText(record.type)}
            </Tag>
            <Tag color="default" >
              {record.category}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '权限代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left',
      render: (code: string) => (
        <code style={{ fontSize: '12px', color: '#666' }}>{code}</code>
      )
    },
    // 动态生成角色列
    ...roles.filter(role => selectedRoles.includes(role.id)).map(role => ({
      title: (
        <Tooltip title={role.name}>
          <div style={{ textAlign: 'center' }}>
            <div>{role.name}</div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              ({role.code})
            </div>
          </div>
        </Tooltip>
      ),
      key: role.id,
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: PermissionMatrixRow) => {
        const hasPermission = record.rolePermissions[role.id]
        return (
          <Switch
            
            checked={hasPermission || false}
            onChange={(checked: boolean) => 
              togglePermission(record.code, role.id, hasPermission || false)
            }
            checkedChildren="✓"
            unCheckedChildren="✗"
          />
        )
      }
    }))
  ]

  return (
    <div className={className}>
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>权限矩阵</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportMatrix}
            >
              导出
            </Button>
          </Space>
        }
      >
        {/* 过滤器和控制 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="选择角色"
              mode="multiple"
              style={{ width: '100%' }}
              value={selectedRoles}
              onChange={setSelectedRoles}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="权限分类"
              allowClear
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={setCategoryFilter}
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="权限类型"
              allowClear
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={setTypeFilter}
            >
              <Option value="menu">菜单</Option>
              <Option value="button">按钮</Option>
              <Option value="api">API</Option>
            </Select>
          </Col>
        </Row>

        {/* 统计信息 */}
        <Alert
          message={
            <Space>
              <span>共 {matrixData.length} 项权限</span>
              <span>·</span>
              <span>{selectedRoles.length} 个角色</span>
              <span>·</span>
              <span>{categories.length} 个分类</span>
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />

        {/* 权限矩阵表格 */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={matrixData}
          loading={loading}
          scroll={{ x: Math.max(800, 300 + selectedRoles.length * 120) }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }}
          
        />

        {/* 图例 */}
        <Divider />
        <Row>
          <Col span={24}>
            <Title level={5}>图例说明</Title>
            <Space wrap>
              <Space>
                <Switch  checked disabled />
                <span>有权限</span>
              </Space>
              <Space>
                <Switch  checked={false} disabled />
                <span>无权限</span>
              </Space>
              <Space>
                <Tag color="blue" >菜单</Tag>
                <span>菜单权限</span>
              </Space>
              <Space>
                <Tag color="green" >按钮</Tag>
                <span>按钮权限</span>
              </Space>
              <Space>
                <Tag color="orange" >API</Tag>
                <span>API权限</span>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default PermissionMatrix