/**
 * 权限系统使用示例
 */

import React from 'react'
import { Card, Space, Button, Divider, Typography, Row, Col } from 'antd'
import { 
  PermissionButton, 
  PermissionWrapper, 
  RoleGuard 
} from '../components/auth'
import { usePermission } from '../hooks/usePermission'
import { PERMISSIONS } from '../constants/permissions'
import { UserRoleCode } from '../constants/roles'

const { Title, Paragraph, Text } = Typography

/**
 * 权限系统使用示例组件
 */
export const PermissionExample: React.FC = () => {
  const { 
    hasPermission, 
    hasRole, 
    permissions, 
    roles,
    checkPermission 
  } = usePermission()

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>权限系统使用示例</Title>
      
      <Row gutter={[24, 24]}>
        {/* 权限按钮示例 */}
        <Col span={24} lg={12}>
          <Card title="1. 权限控制按钮" size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph>
                <Text strong>PermissionButton</Text> - 基于权限控制的按钮组件
              </Paragraph>
              
              <Space wrap>
                <PermissionButton 
                  permissions={PERMISSIONS.STORE_PLAN.CREATE}
                  type="primary"
                >
                  新建开店计划
                </PermissionButton>
                
                <PermissionButton 
                  permissions={PERMISSIONS.EXPANSION.DELETE}
                  type="primary" 
                  danger
                  noPermissionTooltip="您没有删除拓店信息的权限"
                >
                  删除拓店信息
                </PermissionButton>
                
                <PermissionButton 
                  permissions="non-existent:permission"
                  hideWhenNoPermission
                >
                  隐藏的按钮
                </PermissionButton>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* 权限包装器示例 */}
        <Col span={24} lg={12}>
          <Card title="2. 权限包装器" size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph>
                <Text strong>PermissionWrapper</Text> - 基于权限控制的内容包装器
              </Paragraph>
              
              <PermissionWrapper 
                permissions={PERMISSIONS.APPROVAL.VIEW}
                noPermissionTitle="审批权限不足"
                noPermissionSubtitle="您需要审批查看权限才能访问此内容"
              >
                <div style={{ padding: 12, background: '#f0f9ff', border: '1px solid #91caff', borderRadius: 6 }}>
                  ✅ 有权限时显示的内容 - 审批中心
                </div>
              </PermissionWrapper>
              
              <PermissionWrapper 
                permissions="non-existent:permission"
                fallback={<Text type="secondary">自定义无权限提示</Text>}
              >
                <div>不会显示的内容</div>
              </PermissionWrapper>
            </Space>
          </Card>
        </Col>

        {/* 角色守卫示例 */}
        <Col span={24} lg={12}>
          <Card title="3. 角色守卫" size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph>
                <Text strong>RoleGuard</Text> - 基于角色的内容控制
              </Paragraph>
              
              <RoleGuard roles={UserRoleCode.ADMIN}>
                <div style={{ padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                  ✅ 管理员专用内容
                </div>
              </RoleGuard>
              
              <RoleGuard 
                roles={[UserRoleCode.BUSINESS, UserRoleCode.OPERATION]} 
                mode="any"
              >
                <div style={{ padding: 12, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6 }}>
                  ✅ 商务或运营人员可见内容
                </div>
              </RoleGuard>
            </Space>
          </Card>
        </Col>

        {/* Hook使用示例 */}
        <Col span={24} lg={12}>
          <Card title="4. Permission Hook" size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Paragraph>
                <Text strong>usePermission</Text> - 权限检查Hook
              </Paragraph>
              
              <div>
                <Text>当前权限数量: <Text code>{permissions.length}</Text></Text>
              </div>
              
              <div>
                <Text>用户角色: </Text>
                {roles?.map(role => (
                  <Text key={role.id} code style={{ marginRight: 8 }}>
                    {role.name}
                  </Text>
                ))}
              </div>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Space direction="vertical" size="small">
                <div>
                  <Text>hasPermission示例：</Text>
                </div>
                
                <div>
                  <Text>开店计划查看: </Text>
                  <Text type={hasPermission(PERMISSIONS.STORE_PLAN.VIEW) ? 'success' : 'danger'}>
                    {hasPermission(PERMISSIONS.STORE_PLAN.VIEW) ? '✅ 有权限' : '❌ 无权限'}
                  </Text>
                </div>
                
                <div>
                  <Text>系统管理: </Text>
                  <Text type={hasPermission(PERMISSIONS.SYSTEM.MANAGE) ? 'success' : 'danger'}>
                    {hasPermission(PERMISSIONS.SYSTEM.MANAGE) ? '✅ 有权限' : '❌ 无权限'}
                  </Text>
                </div>
                
                <div>
                  <Text>管理员角色: </Text>
                  <Text type={hasRole(UserRoleCode.ADMIN) ? 'success' : 'danger'}>
                    {hasRole(UserRoleCode.ADMIN) ? '✅ 是管理员' : '❌ 非管理员'}
                  </Text>
                </div>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* 权限检查详情 */}
        <Col span={24}>
          <Card title="5. 权限检查详情" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {(() => {
                const result = checkPermission([
                  PERMISSIONS.STORE_PLAN.VIEW,
                  PERMISSIONS.EXPANSION.VIEW,
                  PERMISSIONS.PREPARATION.VIEW
                ], 'all')
                
                return (
                  <div>
                    <Text strong>检查多个权限 (all模式)：</Text>
                    <pre style={{ 
                      marginTop: 8, 
                      padding: 12, 
                      background: '#fafafa', 
                      borderRadius: 6,
                      fontSize: 12
                    }}>
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )
              })()}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PermissionExample