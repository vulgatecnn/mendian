/**
 * 权限配置弹窗组件
 */
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Tree,
  Message,
  Button,
  Spin,
  Empty,
  Typography
} from '@arco-design/web-react'
// TreeNodeData 类型定义
import { Role, Permission } from '../types'
import RoleService from '../api/roleService'

const { Title } = Typography

interface PermissionConfigModalProps {
  visible: boolean
  role: Role | null
  onCancel: () => void
  onSuccess: () => void
}

interface PermissionTreeNode {
  key: string
  title: string
  children?: PermissionTreeNode[]
  isModule?: boolean
  permissionId?: number
}

const PermissionConfigModal: React.FC<PermissionConfigModalProps> = ({
  visible,
  role,
  onCancel,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [treeData, setTreeData] = useState<PermissionTreeNode[]>([])
  const [checkedKeys, setCheckedKeys] = useState<string[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // 加载权限列表
  const loadPermissions = async () => {
    try {
      setLoading(true)
      const result = await RoleService.getPermissions()
      
      if (result.code === 0) {
        setPermissions(result.data)
        buildTreeData(result.data)
      } else {
        Message.error(result.message || '获取权限列表失败')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '获取权限列表失败'
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 构建权限树数据
  const buildTreeData = (permissionList: Permission[]) => {
    // 按模块分组
    const moduleMap = new Map<string, Permission[]>()
    
    permissionList.forEach(permission => {
      const module = permission.module
      if (!moduleMap.has(module)) {
        moduleMap.set(module, [])
      }
      moduleMap.get(module)!.push(permission)
    })

    // 构建树形结构
    const treeNodes: PermissionTreeNode[] = []
    const expandedModules: string[] = []

    moduleMap.forEach((modulePermissions, moduleName) => {
      const moduleKey = `module_${moduleName}`
      expandedModules.push(moduleKey)
      
      const moduleNode: PermissionTreeNode = {
        key: moduleKey,
        title: getModuleDisplayName(moduleName),
        isModule: true,
        children: modulePermissions.map(permission => ({
          key: `permission_${permission.id}`,
          title: permission.name,
          isModule: false,
          permissionId: permission.id
        }))
      }
      
      treeNodes.push(moduleNode)
    })

    setTreeData(treeNodes)
    setExpandedKeys(expandedModules)
  }

  // 获取模块显示名称
  const getModuleDisplayName = (module: string): string => {
    const moduleNames: Record<string, string> = {
      'system': '系统管理',
      'department': '部门管理',
      'user': '用户管理',
      'role': '角色管理',
      'audit': '审计日志',
      'store': '门店管理',
      'plan': '计划管理',
      'expansion': '拓店管理',
      'construction': '筹备管理',
      'operation': '运营管理',
      'approval': '审批中心',
      'report': '数据报表'
    }
    return moduleNames[module] || module
  }

  // 设置角色已有权限
  const setRolePermissions = () => {
    if (role && role.permission_list) {
      const rolePermissionIds = role.permission_list.map(p => `permission_${p.id}`)
      setCheckedKeys(rolePermissionIds)
    } else {
      setCheckedKeys([])
    }
  }

  // 处理权限选择变化
  const handleCheck = (checkedKeys: string[]) => {
    setCheckedKeys(checkedKeys)
  }

  // 保存权限配置
  const handleSave = async () => {
    if (!role) return

    try {
      setSaveLoading(true)
      
      // 提取权限ID
      const permissionIds = checkedKeys
        .filter(key => key.startsWith('permission_'))
        .map(key => parseInt(key.replace('permission_', '')))

      const result = await RoleService.assignPermissions(role.id, {
        permission_ids: permissionIds
      })

      if (result.code === 0) {
        Message.success('权限配置保存成功')
        onSuccess()
      } else {
        Message.error(result.message || '保存失败')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '保存失败'
      Message.error(errorMessage)
    } finally {
      setSaveLoading(false)
    }
  }

  // 取消操作
  const handleCancel = () => {
    setCheckedKeys([])
    onCancel()
  }

  // 当弹窗打开时加载数据
  useEffect(() => {
    if (visible) {
      loadPermissions()
    }
  }, [visible])

  // 当角色数据变化时设置权限
  useEffect(() => {
    if (visible && role && permissions.length > 0) {
      setRolePermissions()
    }
  }, [visible, role, permissions])

  return (
    <Modal
      title={
        <div>
          <Title heading={5} style={{ margin: 0 }}>
            配置权限 - {role?.name}
          </Title>
        </div>
      }
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={saveLoading}
          onClick={handleSave}
        >
          保存
        </Button>
      ]}
      maskClosable={false}
      style={{ maxHeight: '80vh', width: '600px' }}
    >
      <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
        <Spin loading={loading}>
          {treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              checkable
              checkedKeys={checkedKeys}
              expandedKeys={expandedKeys}
              onCheck={handleCheck}
              onExpand={setExpandedKeys}
              blockNode
              size="small"
              style={{ 
                backgroundColor: '#fafafa',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e5e6eb'
              }}
            />
          ) : (
            !loading && (
              <Empty
                description="暂无权限数据"
                style={{ padding: '40px 0' }}
              />
            )
          )}
        </Spin>
      </div>
      
      {checkedKeys.length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f2f3f5', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#86909c'
        }}>
          已选择 {checkedKeys.filter(key => key.startsWith('permission_')).length} 个权限
        </div>
      )}
    </Modal>
  )
}

export default PermissionConfigModal