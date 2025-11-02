/**
 * 角色成员管理弹窗组件
 */
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Table,
  Button,
  Message,
  Space,
  Typography,
  Input,
  Tag,
  Transfer,
  Tabs,
  Empty,
  Spin
} from '@arco-design/web-react'
import {
  IconSearch,

  IconRefresh
} from '@arco-design/web-react/icon'
import { ColumnProps } from '@arco-design/web-react/es/Table'
import { Role, User } from '../types'
import RoleService from '../api/roleService'
import UserService from '../api/userService'

const { Title } = Typography
const { TabPane } = Tabs

interface RoleMembersModalProps {
  visible: boolean
  role: Role | null
  onCancel: () => void
  onSuccess: () => void
}

const RoleMembersModal: React.FC<RoleMembersModalProps> = ({
  visible,
  role,
  onCancel,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('members')
  
  // 成员列表相关状态
  const [members, setMembers] = useState<User[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  
  // 添加成员相关状态
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [transferTargetKeys, setTransferTargetKeys] = useState<string[]>([])
  const [transferDataSource, setTransferDataSource] = useState<any[]>([])

  // 加载角色成员列表
  const loadMembers = async () => {
    if (!role) return

    try {
      setLoading(true)
      const result = await RoleService.getRoleMembers(role.id)
      
      if (result.code === 0) {
        setMembers(result.data)
      } else {
        Message.error(result.message || '获取成员列表失败')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '获取成员列表失败'
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 加载所有用户（用于添加成员）
  const loadAllUsers = async () => {
    try {
      const response = await UserService.getUsers({ 
        is_active: true, 
        page_size: 1000 
      })
      setAllUsers(response.results)
      
      // 构建穿梭框数据源
      const dataSource = response.results.map(user => ({
        key: user.id.toString(),
        title: `${user.full_name} (${user.username})`,
        description: user.department_name || '未分配部门',
        disabled: false
      }))
      setTransferDataSource(dataSource)
      
      // 设置已选中的用户
      if (role) {
        const currentMemberIds = members.map(member => member.id.toString())
        setTransferTargetKeys(currentMemberIds)
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '获取用户列表失败'
      Message.error(errorMessage)
    }
  }

  // 添加成员
  const handleAddMembers = async () => {
    if (!role) return

    try {
      setSaveLoading(true)
      
      // 获取新增的用户ID
      const currentMemberIds = members.map(member => member.id.toString())
      const newMemberIds = transferTargetKeys.filter(key => !currentMemberIds.includes(key))
      
      if (newMemberIds.length === 0) {
        Message.info('没有新增的成员')
        return
      }

      const result = await RoleService.addRoleMembers(role.id, {
        user_ids: newMemberIds.map(id => parseInt(id))
      })

      if (result.code === 0) {
        Message.success(`成功添加 ${newMemberIds.length} 个成员`)
        await loadMembers() // 重新加载成员列表
        onSuccess() // 通知父组件更新
      } else {
        Message.error(result.message || '添加成员失败')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '添加成员失败'
      Message.error(errorMessage)
    } finally {
      setSaveLoading(false)
    }
  }

  // 筛选成员
  const filteredMembers = members.filter(member => {
    if (!memberSearch) return true
    return (
      member.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (member.department_name && member.department_name.toLowerCase().includes(memberSearch.toLowerCase()))
    )
  })

  // 成员列表表格列定义
  const memberColumns: ColumnProps<User>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (username: string, record: User) => (
        <div>
          <div>{username}</div>
          <div style={{ fontSize: '12px', color: '#86909c' }}>{record.full_name}</div>
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
      title: '状态',
      dataIndex: 'is_active',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '停用'}
        </Tag>
      )
    }
  ]

  // 当弹窗打开时加载数据
  useEffect(() => {
    if (visible && role) {
      loadMembers()
    }
  }, [visible, role])

  // 当切换到添加成员标签页时加载用户数据
  useEffect(() => {
    if (visible && activeTab === 'add' && allUsers.length === 0) {
      loadAllUsers()
    }
  }, [visible, activeTab])

  // 当成员数据变化时更新穿梭框选中状态
  useEffect(() => {
    if (members.length > 0 && transferDataSource.length > 0) {
      const currentMemberIds = members.map(member => member.id.toString())
      setTransferTargetKeys(currentMemberIds)
    }
  }, [members, transferDataSource])

  return (
    <Modal
      title={
        <div>
          <Title heading={5} style={{ margin: 0 }}>
            管理成员 - {role?.name}
          </Title>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={
        activeTab === 'add' ? [
          <Button key="cancel" onClick={onCancel}>
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saveLoading}
            onClick={handleAddMembers}
          >
            添加成员
          </Button>
        ] : [
          <Button key="close" type="primary" onClick={onCancel}>
            关闭
          </Button>
        ]
      }
      maskClosable={false}
      style={{ maxHeight: '80vh', width: '800px' }}
    >
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <TabPane key="members" title={`当前成员 (${members.length})`}>
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Input
                placeholder="搜索成员"
                value={memberSearch}
                onChange={setMemberSearch}
                prefix={<IconSearch />}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                icon={<IconRefresh />}
                onClick={loadMembers}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>

          <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {filteredMembers.length > 0 ? (
              <Table
                columns={memberColumns}
                data={filteredMembers}
                loading={loading}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ x: 600 }}
              />
            ) : (
              <Empty
                description={memberSearch ? '没有找到匹配的成员' : '暂无成员'}
                style={{ padding: '40px 0' }}
              />
            )}
          </div>
        </TabPane>

        <TabPane key="add" title="添加成员">
          <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
            {transferDataSource.length > 0 ? (
              <Transfer
                dataSource={transferDataSource}
                targetKeys={transferTargetKeys}
                onChange={setTransferTargetKeys}
                showSearch
                searchPlaceholder="搜索用户"

                listStyle={{
                  width: 300,
                  height: 400
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
                <div style={{ marginTop: '8px', color: '#86909c' }}>
                  加载用户数据中...
                </div>
              </div>
            )}
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  )
}

export default RoleMembersModal