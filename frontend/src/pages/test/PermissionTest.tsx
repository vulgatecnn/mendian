/**
 * 权限测试页面 - 用于测试RBAC权限系统
 */

import React from 'react'
import { Card, Space, Tag, Descriptions, Divider, Table } from 'antd'
import { useCurrentUser } from '../../hooks/useAuth'
import { usePermission, useRolePermission, useActionPermission } from '../../hooks/usePermission'
import { PermissionWrapper, PermissionButton } from '../../components/permission'
import { PERMISSIONS } from '../../constants/permissions'
// import { UserRoleCode, ROLE_NAMES } from '../../constants/roles'

const PermissionTest: React.FC = () => {
  const { user, roles, isAdmin } = useCurrentUser()
  const { permissions, permissionMap } = usePermission()
  const { getRoleNames, getRoleCodes } = useRolePermission()
  const { canCreate, canUpdate, canDelete, canView, canManage } = useActionPermission()

  // 测试权限数据
  const testPermissions = [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.STORE_PLAN.CREATE,
    PERMISSIONS.EXPANSION.MANAGE,
    PERMISSIONS.PREPARATION.DELIVERY_CONFIRM,
    PERMISSIONS.OPERATION.PAYMENTS_VIEW,
    PERMISSIONS.APPROVAL.PENDING_HANDLE,
    PERMISSIONS.BASIC_DATA.MANAGE,
    PERMISSIONS.SYSTEM.MANAGE
  ]

  // 权限表格列
  const permissionColumns = [
    {
      title: '权限代码',
      dataIndex: 'permission',
      key: 'permission',
      width: '40%'
    },
    {
      title: '权限状态',
      dataIndex: 'hasPermission',
      key: 'hasPermission',
      render: (hasPermission: boolean) => (
        <Tag color={hasPermission ? 'success' : 'error'}>{hasPermission ? '有权限' : '无权限'}</Tag>
      )
    }
  ]

  // 权限表格数据
  const permissionData = testPermissions.map((permission, index) => ({
    key: index,
    permission,
    hasPermission: permissionMap[permission] || false
  }))

  // 操作权限测试数据
  const operationData = [
    { resource: 'store-plan', name: '开店计划' },
    { resource: 'expansion', name: '拓店管理' },
    { resource: 'preparation', name: '开店筹备' },
    { resource: 'store-files', name: '门店档案' },
    { resource: 'operation', name: '门店运营' },
    { resource: 'approval', name: '审批中心' },
    { resource: 'basic-data', name: '基础数据' }
  ]

  const operationColumns = [
    {
      title: '资源',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '查看',
      dataIndex: 'resource',
      key: 'view',
      render: (resource: string) => (
        <Tag color={canView(resource) ? 'success' : 'default'}>{canView(resource) ? '✓' : '✗'}</Tag>
      )
    },
    {
      title: '创建',
      dataIndex: 'resource',
      key: 'create',
      render: (resource: string) => (
        <Tag color={canCreate(resource) ? 'success' : 'default'}>
          {canCreate(resource) ? '✓' : '✗'}
        </Tag>
      )
    },
    {
      title: '更新',
      dataIndex: 'resource',
      key: 'update',
      render: (resource: string) => (
        <Tag color={canUpdate(resource) ? 'success' : 'default'}>
          {canUpdate(resource) ? '✓' : '✗'}
        </Tag>
      )
    },
    {
      title: '删除',
      dataIndex: 'resource',
      key: 'delete',
      render: (resource: string) => (
        <Tag color={canDelete(resource) ? 'success' : 'default'}>
          {canDelete(resource) ? '✓' : '✗'}
        </Tag>
      )
    },
    {
      title: '管理',
      dataIndex: 'resource',
      key: 'manage',
      render: (resource: string) => (
        <Tag color={canManage(resource) ? 'success' : 'default'}>
          {canManage(resource) ? '✓' : '✗'}
        </Tag>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 用户信息 */}
        <Card title="用户信息" size="small">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="用户ID">{user?.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="真实姓名">{user?.realName}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="是否管理员">
              <Tag color={isAdmin ? 'gold' : 'default'}>{isAdmin ? '是' : '否'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户状态">
              <Tag color={user?.enabled ? 'success' : 'error'}>
                {user?.enabled ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 角色信息 */}
        <Card title="角色信息" size="small">
          <Space wrap>
            {roles.map(role => (
              <Tag key={role.id} color="blue">
                {role.name} ({role.code})
              </Tag>
            ))}
          </Space>
          <Divider />
          <div>
            <strong>角色名称：</strong> {getRoleNames().join('、')}
          </div>
          <div>
            <strong>角色代码：</strong> {getRoleCodes().join('、')}
          </div>
        </Card>

        {/* 权限统计 */}
        <Card title="权限统计" size="small">
          <Space>
            <Tag color="blue">总权限数: {permissions.length}</Tag>
            <Tag color="green">
              通过权限: {testPermissions.filter(p => permissionMap[p]).length}
            </Tag>
            <Tag color="red">拒绝权限: {testPermissions.filter(p => !permissionMap[p]).length}</Tag>
          </Space>
        </Card>

        {/* 权限测试 */}
        <Card title="权限测试" size="small">
          <Table
            dataSource={permissionData}
            columns={permissionColumns}
            pagination={false}
            size="small"
          />
        </Card>

        {/* 操作权限测试 */}
        <Card title="操作权限测试" size="small">
          <Table
            dataSource={operationData}
            columns={operationColumns}
            pagination={false}
            size="small"
          />
        </Card>

        {/* 权限组件测试 */}
        <Card title="权限组件测试" size="small">
          <Space direction="vertical">
            {/* 权限包装器测试 */}
            <div>
              <strong>权限包装器测试：</strong>
              <Space>
                <PermissionWrapper permissions={[PERMISSIONS.STORE_PLAN.CREATE]}>
                  <Tag color="success">有创建开店计划权限</Tag>
                </PermissionWrapper>

                <PermissionWrapper
                  permissions={[PERMISSIONS.SYSTEM.MANAGE]}
                  fallback={<Tag color="error">无系统管理权限</Tag>}
                >
                  <Tag color="success">有系统管理权限</Tag>
                </PermissionWrapper>
              </Space>
            </div>

            {/* 权限按钮测试 */}
            <div>
              <strong>权限按钮测试：</strong>
              <Space>
                <PermissionButton permissions={[PERMISSIONS.STORE_PLAN.CREATE]} type="primary">
                  创建开店计划
                </PermissionButton>

                <PermissionButton permissions={[PERMISSIONS.SYSTEM.MANAGE]} type="default">
                  系统管理
                </PermissionButton>

                <PermissionButton
                  permissions={[PERMISSIONS.BASIC_DATA.DELETE]}
                  danger
                  hideWhenNoPermission
                >
                  删除基础数据
                </PermissionButton>
              </Space>
            </div>
          </Space>
        </Card>

        {/* 所有用户权限列表 */}
        <Card title="用户所有权限" size="small">
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <Space wrap>
              {permissions.map((permission: string) => (
                <Tag key={permission} color="processing">
                  {permission}
                </Tag>
              ))}
            </Space>
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default PermissionTest
