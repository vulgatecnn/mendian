/**
 * 部门同步组件
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Progress,
  Alert,
  Table,
  Tree,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Modal,
  List,
  Avatar,
  Tooltip,
  Badge,
  message
} from 'antd'
import {
  SyncOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BranchesOutlined
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import type { ColumnsType } from 'antd/es/table'
import { WeChatApiService } from '../../services/wechat/api'
import type { WeChatDepartment, WeChatUserInfo } from '../../types/wechat'

const { Text } = Typography

// 同步状态
interface SyncStatus {
  isRunning: boolean
  lastSyncTime: string | null
  progress: number
  stage: 'idle' | 'departments' | 'users' | 'complete' | 'error'
  totalDepartments: number
  syncedDepartments: number
  totalUsers: number
  syncedUsers: number
  errors: string[]
}

// 部门统计信息
interface DepartmentStats {
  totalDepartments: number
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  departmentsByLevel: Record<number, number>
}

interface DepartmentSyncProps {
  /** 自定义样式类名 */
  className?: string
}

export const DepartmentSync: React.FC<DepartmentSyncProps> = ({
  className
}) => {
  const [departments, setDepartments] = useState<WeChatDepartment[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSyncTime: null,
    progress: 0,
    stage: 'idle',
    totalDepartments: 0,
    syncedDepartments: 0,
    totalUsers: 0,
    syncedUsers: 0,
    errors: []
  })
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
    totalDepartments: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    departmentsByLevel: {}
  })
  const [loading, setLoading] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<WeChatDepartment | null>(null)
  const [departmentUsers, setDepartmentUsers] = useState<WeChatUserInfo[]>([])
  const [usersModalVisible, setUsersModalVisible] = useState(false)

  useEffect(() => {
    loadDepartments()
    loadSyncStatus()
  }, [])

  // 加载部门列表
  const loadDepartments = async () => {
    setLoading(true)
    try {
      const depts = await WeChatApiService.getDepartments()
      setDepartments(depts)
      calculateStats(depts)
    } catch (error) {
      message.error('加载部门列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载同步状态
  const loadSyncStatus = async () => {
    try {
      const status = await WeChatApiService.getSyncStatus()
      setSyncStatus({
        isRunning: status.isRunning,
        lastSyncTime: status.lastSyncTime,
        progress: 0,
        stage: status.isRunning ? 'departments' : 'idle',
        totalDepartments: 0,
        syncedDepartments: 0,
        totalUsers: 0,
        syncedUsers: 0,
        errors: status.lastResult?.errors || []
      })
    } catch (error) {
      console.error('加载同步状态失败:', error)
    }
  }

  // 计算统计信息
  const calculateStats = (depts: WeChatDepartment[]) => {
    const stats: DepartmentStats = {
      totalDepartments: depts.length,
      totalUsers: 0, // 需要从用户接口获取
      activeUsers: 0,
      inactiveUsers: 0,
      departmentsByLevel: {}
    }

    // 计算层级分布（简化处理）
    depts.forEach(dept => {
      const level = dept.parentid === 1 ? 1 : 2 // 简化层级计算
      stats.departmentsByLevel[level] = (stats.departmentsByLevel[level] || 0) + 1
    })

    setDepartmentStats(stats)
  }

  // 开始同步
  const startSync = async (fullSync = false) => {
    try {
      setSyncStatus(prev => ({
        ...prev,
        isRunning: true,
        progress: 0,
        stage: 'departments',
        errors: []
      }))

      // 模拟同步过程
      await simulateSync(fullSync)

      // 实际调用同步API
      const result = await WeChatApiService.syncContacts({ fullSync })
      
      message.success(`同步完成：${result.userCount} 个用户，${result.departmentCount} 个部门`)
      
      // 重新加载数据
      await loadDepartments()
      
      setSyncStatus(prev => ({
        ...prev,
        isRunning: false,
        lastSyncTime: new Date().toISOString(),
        progress: 100,
        stage: 'complete'
      }))
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isRunning: false,
        stage: 'error',
        errors: [error instanceof Error ? error.message : '同步失败']
      }))
      message.error('同步失败')
    }
  }

  // 模拟同步过程
  const simulateSync = async (_fullSync: boolean) => {
    const steps = [
      { stage: 'departments', message: '正在同步部门信息...' },
      { stage: 'users', message: '正在同步用户信息...' },
      { stage: 'complete', message: '同步完成' }
    ]

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      setSyncStatus(prev => ({
        ...prev,
        stage: step?.stage as any,
        progress: ((i + 1) / steps.length) * 100
      }))
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // 查看部门用户
  const viewDepartmentUsers = async (department: WeChatDepartment) => {
    try {
      setSelectedDepartment(department)
      setLoading(true)
      
      const response = await WeChatApiService.getDepartmentUsers({
        departmentId: department.id
      })
      
      setDepartmentUsers(response.data || [])
      setUsersModalVisible(true)
    } catch (error) {
      message.error('加载部门用户失败')
    } finally {
      setLoading(false)
    }
  }

  // 构建部门树
  const buildDepartmentTree = (departments: WeChatDepartment[]): DataNode[] => {
    const tree: DataNode[] = []
    const departmentMap = new Map<number, WeChatDepartment>()
    
    // 构建映射
    departments.forEach(dept => {
      departmentMap.set(dept.id, dept)
    })

    // 构建树结构
    departments.forEach(dept => {
      if (dept.parentid === 1) {
        // 根部门
        tree.push({
          key: dept.id.toString(),
          title: (
            <Space>
              <TeamOutlined />
              <span>{dept.name}</span>
              <Tag>ID: {dept.id}</Tag>
            </Space>
          ),
          children: buildChildren(dept.id, departments)
        })
      }
    })

    return tree
  }

  // 构建子部门
  const buildChildren = (parentId: number, departments: WeChatDepartment[]): DataNode[] => {
    return departments
      .filter(dept => dept.parentid === parentId)
      .map(dept => ({
        key: dept.id.toString(),
        title: (
          <Space>
            <TeamOutlined />
            <span>{dept.name}</span>
            <Tag>ID: {dept.id}</Tag>
          </Space>
        ),
        children: buildChildren(dept.id, departments)
      }))
  }

  // 获取同步状态文本
  const getSyncStatusText = (stage: string) => {
    switch (stage) {
      case 'departments':
        return '正在同步部门信息...'
      case 'users':
        return '正在同步用户信息...'
      case 'complete':
        return '同步完成'
      case 'error':
        return '同步失败'
      default:
        return '准备就绪'
    }
  }

  // 获取同步状态颜色
  const getSyncStatusColor = (stage: string) => {
    switch (stage) {
      case 'departments':
      case 'users':
        return 'blue'
      case 'complete':
        return 'green'
      case 'error':
        return 'red'
      default:
        return 'default'
    }
  }

  // 部门表格列定义
  const departmentColumns: ColumnsType<WeChatDepartment> = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: WeChatDepartment) => (
        <Space>
          <TeamOutlined />
          <span>{name}</span>
          {record.name_en && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ({record.name_en})
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '部门ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Tag>{id}</Tag>
    },
    {
      title: '父部门ID',
      dataIndex: 'parentid',
      key: 'parentid',
      width: 100,
      render: (parentid: number) => (
        parentid === 1 ? <Tag color="blue">根部门</Tag> : <Tag>{parentid}</Tag>
      )
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 80
    },
    {
      title: '部门负责人',
      dataIndex: 'department_leader',
      key: 'department_leader',
      render: (leaders: string[]) => (
        leaders && leaders.length > 0 ? (
          <Space wrap>
            {leaders.map(leader => (
              <Tag key={leader} color="green">
                {leader}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">未设置</Text>
        )
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record: WeChatDepartment) => (
        <Button
          type="text"
          icon={<UserOutlined />}
          onClick={() => viewDepartmentUsers(record)}
          size="small"
        >
          查看成员
        </Button>
      )
    }
  ]

  return (
    <div className={className}>
      {/* 同步控制面板 */}
      <Card
        title={
          <Space>
            <BranchesOutlined />
            <span>企业微信部门同步</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadDepartments}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => startSync(false)}
              loading={syncStatus.isRunning}
              disabled={syncStatus.isRunning}
            >
              增量同步
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={() => startSync(true)}
              loading={syncStatus.isRunning}
              disabled={syncStatus.isRunning}
            >
              全量同步
            </Button>
          </Space>
        }
      >
        {/* 同步状态 */}
        {syncStatus.isRunning && (
          <Alert
            message={
              <Space>
                <span>{getSyncStatusText(syncStatus.stage)}</span>
                <Progress
                  percent={Math.round(syncStatus.progress)}
                  size="small"
                  style={{ width: 200 }}
                />
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 错误信息 */}
        {syncStatus.errors.length > 0 && (
          <Alert
            message="同步错误"
            description={
              <List
                size="small"
                dataSource={syncStatus.errors}
                renderItem={(error, index) => (
                  <List.Item key={index}>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span style={{ marginLeft: 8 }}>{error}</span>
                  </List.Item>
                )}
              />
            }
            type="error"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="部门总数"
              value={departmentStats.totalDepartments}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="用户总数"
              value={departmentStats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="上次同步"
              value={syncStatus.lastSyncTime ? '成功' : '从未同步'}
              prefix={
                syncStatus.lastSyncTime ? 
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                <ClockCircleOutlined style={{ color: '#faad14' }} />
              }
              suffix={
                syncStatus.lastSyncTime && (
                  <Tooltip title={new Date(syncStatus.lastSyncTime).toLocaleString()}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(syncStatus.lastSyncTime).toLocaleDateString()}
                    </Text>
                  </Tooltip>
                )
              }
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="同步状态"
              value={getSyncStatusText(syncStatus.stage)}
              valueStyle={{ 
                color: getSyncStatusColor(syncStatus.stage) === 'green' ? '#52c41a' : 
                       getSyncStatusColor(syncStatus.stage) === 'red' ? '#ff4d4f' : '#1890ff'
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* 部门结构 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="部门结构树" size="small">
            <Tree
              treeData={buildDepartmentTree(departments)}
              height={400}
              defaultExpandAll
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="部门列表" size="small">
            <Table
              rowKey="id"
              columns={departmentColumns}
              dataSource={departments}
              loading={loading}
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: false
              }}
              scroll={{ y: 350 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 部门用户弹窗 */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>部门成员 - {selectedDepartment?.name}</span>
          </Space>
        }
        open={usersModalVisible}
        onCancel={() => setUsersModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <List
          loading={loading}
          dataSource={departmentUsers}
          renderItem={(user) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Badge
                    status={user.status === 1 ? 'success' : 'error'}
                    offset={[-3, 3]}
                  >
                    <Avatar src={user.avatar} icon={<UserOutlined />} />
                  </Badge>
                }
                title={
                  <Space>
                    <span>{user.name}</span>
                    <Tag>@{user.userid}</Tag>
                    {user.position && <Tag color="blue">{user.position}</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    {user.mobile && <Text type="secondary">📱 {user.mobile}</Text>}
                    {user.email && <Text type="secondary">📧 {user.email}</Text>}
                  </Space>
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 名成员`
          }}
        />
      </Modal>
    </div>
  )
}

export default DepartmentSync