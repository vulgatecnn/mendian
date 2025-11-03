/**
 * 流程设计器组件
 */
import React, { useState, useEffect } from 'react'
import {
  Button,
  Space,
  Form,
  Input,
  Select,
  Modal,
  Table,
  Message,
} from '@arco-design/web-react'
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconUp,
  IconDown,
} from '@arco-design/web-react/icon'
import UserService from '../../../api/userService'
import RoleService from '../../../api/roleService'
import type { User, Role, ApprovalFlowNode } from '../../../types'

const FormItem = Form.Item

interface FlowDesignerProps {
  value?: { nodes: ApprovalFlowNode[] }
  onChange?: (value: { nodes: ApprovalFlowNode[] }) => void
}

const FlowDesigner: React.FC<FlowDesignerProps> = ({ value, onChange }) => {
  const [nodes, setNodes] = useState<ApprovalFlowNode[]>(value?.nodes || [])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [form] = Form.useForm()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await UserService.getUsers({ is_active: true })
      setUsers(response.results)
    } catch (error) {
      console.error('加载用户列表失败', error)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await RoleService.getRoles({ is_active: true })
      setRoles(response.results)
    } catch (error) {
      console.error('加载角色列表失败', error)
    }
  }

  const handleAddNode = () => {
    setEditingIndex(-1)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditNode = (node: ApprovalFlowNode, index: number) => {
    setEditingIndex(index)
    form.setFieldsValue({
      name: node.name,
      type: node.type,
      approver_type: node.approvers.type,
      approver_user_ids: node.approvers.user_ids,
      approver_role_code: node.approvers.role_code,
      cc_type: node.cc_users?.type,
      cc_user_ids: node.cc_users?.user_ids,
      cc_role_code: node.cc_users?.role_code,
    })
    setModalVisible(true)
  }

  const handleDeleteNode = (index: number) => {
    const newNodes = nodes.filter((_, i) => i !== index)
    setNodes(newNodes)
    onChange?.({ nodes: newNodes })
    Message.success('节点删除成功')
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newNodes = [...nodes]
    ;[newNodes[index - 1], newNodes[index]] = [newNodes[index], newNodes[index - 1]]
    setNodes(newNodes)
    onChange?.({ nodes: newNodes })
  }

  const handleMoveDown = (index: number) => {
    if (index === nodes.length - 1) return
    const newNodes = [...nodes]
    ;[newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]]
    setNodes(newNodes)
    onChange?.({ nodes: newNodes })
  }

  const handleSaveNode = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()

      const node: ApprovalFlowNode = {
        name: values.name,
        type: values.type,
        approvers: {
          type: values.approver_type,
          user_ids: values.approver_user_ids,
          role_code: values.approver_role_code,
        },
      }

      if (values.cc_type) {
        node.cc_users = {
          type: values.cc_type,
          user_ids: values.cc_user_ids,
          role_code: values.cc_role_code,
        }
      }

      let newNodes: ApprovalFlowNode[]
      if (editingIndex >= 0) {
        newNodes = [...nodes]
        newNodes[editingIndex] = node
        Message.success('节点更新成功')
      } else {
        newNodes = [...nodes, node]
        Message.success('节点添加成功')
      }

      setNodes(newNodes)
      onChange?.({ nodes: newNodes })
      setModalVisible(false)
    } catch (error) {
      // 验证失败
    }
  }

  const renderApproverInfo = (node: ApprovalFlowNode) => {
    const { type, user_ids, role_code } = node.approvers

    switch (type) {
      case 'fixed_users':
        const userNames = users
          .filter((u) => user_ids?.includes(u.id))
          .map((u) => u.full_name)
          .join('、')
        return `固定人员：${userNames || '未设置'}`
      case 'role':
        const role = roles.find((r) => r.name === role_code)
        return `角色：${role?.name || role_code || '未设置'}`
      case 'department_manager':
        return '部门负责人'
      case 'initiator_manager':
        return '发起人上级'
      default:
        return type
    }
  }

  const columns = [
    {
      title: '序号',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '节点名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '节点类型',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          approval: '审批',
          cc: '抄送',
          condition: '条件',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '审批人配置',
      width: 250,
      render: (_: any, record: ApprovalFlowNode) => renderApproverInfo(record),
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: ApprovalFlowNode, index: number) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconUp />}
            onClick={() => handleMoveUp(index)}
            disabled={index === 0}
          />
          <Button
            type="text"
            size="small"
            icon={<IconDown />}
            onClick={() => handleMoveDown(index)}
            disabled={index === nodes.length - 1}
          />
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEditNode(record, index)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDeleteNode(index)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={handleAddNode}
        >
          添加节点
        </Button>
      </div>

      <Table
        columns={columns}
        data={nodes}
        pagination={false}
        rowKey={(_record: any, index?: number) => String(index)}
      />

      <Modal
        title={editingIndex >= 0 ? '编辑节点' : '添加节点'}
        visible={modalVisible}
        onOk={handleSaveNode}
        onCancel={() => setModalVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="节点名称"
            field="name"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </FormItem>

          <FormItem
            label="节点类型"
            field="type"
            rules={[{ required: true, message: '请选择节点类型' }]}
          >
            <Select placeholder="请选择节点类型">
              <Select.Option value="approval">审批</Select.Option>
              <Select.Option value="cc">抄送</Select.Option>
              <Select.Option value="condition">条件</Select.Option>
            </Select>
          </FormItem>

          <FormItem
            label="审批人类型"
            field="approver_type"
            rules={[{ required: true, message: '请选择审批人类型' }]}
          >
            <Select placeholder="请选择审批人类型">
              <Select.Option value="fixed_users">固定人员</Select.Option>
              <Select.Option value="role">角色</Select.Option>
              <Select.Option value="department_manager">部门负责人</Select.Option>
              <Select.Option value="initiator_manager">发起人上级</Select.Option>
            </Select>
          </FormItem>

          <Form.Item noStyle shouldUpdate>
            {(values) => {
              const approverType = values.approver_type

              if (approverType === 'fixed_users') {
                return (
                  <FormItem
                    label="审批人"
                    field="approver_user_ids"
                    rules={[{ required: true, message: '请选择审批人' }]}
                  >
                    <Select
                      placeholder="请选择审批人"
                      mode="multiple"
                      showSearch
                    >
                      {users.map((user) => (
                        <Select.Option key={user.id} value={user.id}>
                          {user.full_name}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                )
              }

              if (approverType === 'role') {
                return (
                  <FormItem
                    label="角色"
                    field="approver_role_code"
                    rules={[{ required: true, message: '请选择角色' }]}
                  >
                    <Select placeholder="请选择角色" showSearch>
                      {roles.map((role) => (
                        <Select.Option key={role.id} value={role.name}>
                          {role.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                )
              }

              return null
            }}
          </Form.Item>

          <FormItem label="抄送人类型" field="cc_type">
            <Select placeholder="请选择抄送人类型" allowClear>
              <Select.Option value="fixed_users">固定人员</Select.Option>
              <Select.Option value="role">角色</Select.Option>
            </Select>
          </FormItem>

          <Form.Item noStyle shouldUpdate>
            {(values) => {
              const ccType = values.cc_type

              if (ccType === 'fixed_users') {
                return (
                  <FormItem label="抄送人" field="cc_user_ids">
                    <Select
                      placeholder="请选择抄送人"
                      mode="multiple"
                      showSearch
                    >
                      {users.map((user) => (
                        <Select.Option key={user.id} value={user.id}>
                          {user.full_name}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                )
              }

              if (ccType === 'role') {
                return (
                  <FormItem label="角色" field="cc_role_code">
                    <Select placeholder="请选择角色" showSearch>
                      {roles.map((role) => (
                        <Select.Option key={role.id} value={role.name}>
                          {role.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </FormItem>
                )
              }

              return null
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FlowDesigner
