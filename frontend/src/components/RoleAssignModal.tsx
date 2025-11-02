/**
 * 角色分配弹窗组件
 */
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Transfer,
  Message,
  Spin
} from '@arco-design/web-react'
import { User, Role } from '../types'
import RoleService from '../api/roleService'
import UserService from '../api/userService'

interface RoleAssignModalProps {
  visible: boolean
  user: User | null
  onCancel: () => void
  onSuccess: () => void
}

const RoleAssignModal: React.FC<RoleAssignModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  // 加载所有角色
  const loadRoles = async () => {
    try {
      setLoading(true)
      const roles = await RoleService.getActiveRoles()
      setAllRoles(roles)
    } catch (error: any) {
      Message.error('获取角色列表失败')
      console.error('获取角色列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化用户已有角色
  const initUserRoles = () => {
    if (user && user.role_list) {
      const roleIds = user.role_list.map(role => role.id.toString())
      setSelectedRoleIds(roleIds)
    } else {
      setSelectedRoleIds([])
    }
  }

  // 提交角色分配
  const handleSubmit = async () => {
    if (!user) return

    try {
      setSubmitting(true)
      const roleIds = selectedRoleIds.map(id => parseInt(id))
      await UserService.assignRoles(user.id, { role_ids: roleIds })
      Message.success('角色分配成功')
      onSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '角色分配失败'
      Message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // 转换角色数据为 Transfer 组件需要的格式
  const transferData = allRoles.map(role => ({
    key: role.id.toString(),
    value: role.id.toString(),
    title: role.name,
    description: role.description || '暂无描述'
  }))

  // 监听弹窗显示状态
  useEffect(() => {
    if (visible) {
      loadRoles()
      initUserRoles()
    }
  }, [visible, user])

  return (
    <Modal
      title={`为用户 "${user?.full_name}" 分配角色`}
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      style={{ width: '600px' }}
      maskClosable={false}
    >
      <Spin loading={loading}>
        <div style={{ minHeight: '300px' }}>
          <Transfer
            dataSource={transferData}
            targetKeys={selectedRoleIds}
            onChange={setSelectedRoleIds}
            showSearch
            searchPlaceholder="搜索角色"
            listStyle={{
              width: '250px',
              height: '300px'
            }}
          />
        </div>
      </Spin>
    </Modal>
  )
}

export default RoleAssignModal