/**
 * 企业微信用户卡片组件
 */

import React from 'react'
import { Card, Avatar, Space, Typography, Tag, Button, Divider, Descriptions } from 'antd'
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  LogoutOutlined,
  EditOutlined
} from '@ant-design/icons'
import type { WeChatUserInfo } from '../../types/wechat'

const { Text, Title } = Typography

interface WeChatUserCardProps {
  /** 用户信息 */
  user: WeChatUserInfo
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 登出回调 */
  onLogout?: () => void
  /** 编辑回调 */
  onEdit?: () => void
  /** 自定义样式类名 */
  className?: string
  /** 卡片大小 */
  size?: 'small' | 'default'
}

export const WeChatUserCard: React.FC<WeChatUserCardProps> = ({
  user,
  showDetails = true,
  showActions = true,
  onLogout,
  onEdit,
  className,
  size = 'default'
}) => {
  // 获取用户状态文本和颜色
  const getUserStatus = (status?: 1 | 2 | 4 | 5) => {
    switch (status) {
      case 1:
        return { text: '已激活', color: 'green' }
      case 2:
        return { text: '已禁用', color: 'red' }
      case 4:
        return { text: '未激活', color: 'orange' }
      case 5:
        return { text: '已退出', color: 'default' }
      default:
        return { text: '未知', color: 'default' }
    }
  }

  // 获取性别文本
  const getGenderText = (gender?: '1' | '2' | '0') => {
    switch (gender) {
      case '1':
        return '男'
      case '2':
        return '女'
      default:
        return '未设置'
    }
  }

  // 处理部门显示
  const getDepartmentText = (user: WeChatUserInfo) => {
    if (typeof user.department === 'string') {
      return user.department
    }
    if (Array.isArray(user.department) && user.department.length > 0) {
      return `部门ID: ${user.department.join(', ')}`
    }
    return '未设置'
  }

  const statusInfo = getUserStatus(user.status)

  const actions: React.ReactNode[] = []

  if (showActions) {
    if (onEdit) {
      actions.push(
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={onEdit}
        >
          编辑
        </Button>
      )
    }

    if (onLogout) {
      actions.push(
        <Button
          key="logout"
          type="text"
          danger
          icon={<LogoutOutlined />}
          onClick={onLogout}
        >
          登出
        </Button>
      )
    }
  }

  return (
    <Card
      className={className}
      size={size}
      actions={actions.length > 0 ? actions : undefined}
    >
      <Card.Meta
        avatar={
          <Avatar
            size={size === 'small' ? 48 : 64}
            src={user.avatar || user.thumb_avatar}
            icon={<UserOutlined />}
          />
        }
        title={
          <Space align="center">
            <Title level={size === 'small' ? 5 : 4} style={{ margin: 0 }}>
              {user.name}
            </Title>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size="small">
            <Text type="secondary">@{user.userid}</Text>
            {user.position && <Text>{user.position}</Text>}
          </Space>
        }
      />

      {showDetails && (
        <>
          <Divider />
          <Descriptions
            size="small"
            column={1}
            labelStyle={{ width: '80px' }}
          >
            {/* 基本信息 */}
            <Descriptions.Item label="部门">
              <Space>
                <TeamOutlined />
                <Text>{getDepartmentText(user)}</Text>
              </Space>
            </Descriptions.Item>

            {user.mobile && (
              <Descriptions.Item label="手机">
                <Space>
                  <PhoneOutlined />
                  <Text copyable>{user.mobile}</Text>
                </Space>
              </Descriptions.Item>
            )}

            {user.email && (
              <Descriptions.Item label="邮箱">
                <Space>
                  <MailOutlined />
                  <Text copyable>{user.email}</Text>
                </Space>
              </Descriptions.Item>
            )}

            {user.biz_mail && user.biz_mail !== user.email && (
              <Descriptions.Item label="企业邮箱">
                <Space>
                  <MailOutlined />
                  <Text copyable>{user.biz_mail}</Text>
                </Space>
              </Descriptions.Item>
            )}

            {user.telephone && (
              <Descriptions.Item label="座机">
                <Text copyable>{user.telephone}</Text>
              </Descriptions.Item>
            )}

            {user.gender && (
              <Descriptions.Item label="性别">
                <Text>{getGenderText(user.gender)}</Text>
              </Descriptions.Item>
            )}

            {user.alias && (
              <Descriptions.Item label="别名">
                <Text>{user.alias}</Text>
              </Descriptions.Item>
            )}

            {user.address && (
              <Descriptions.Item label="地址">
                <Text>{user.address}</Text>
              </Descriptions.Item>
            )}

            {/* 部门信息 */}
            {user.main_department && (
              <Descriptions.Item label="主部门">
                <Text>部门ID: {user.main_department}</Text>
              </Descriptions.Item>
            )}

            {user.is_leader_in_dept && user.is_leader_in_dept.length > 0 && (
              <Descriptions.Item label="部门领导">
                <Text>
                  {user.is_leader_in_dept.map((isLeader, index) => 
                    isLeader === 1 ? `部门${index + 1}` : null
                  ).filter(Boolean).join(', ') || '否'}
                </Text>
              </Descriptions.Item>
            )}

            {user.direct_leader && user.direct_leader.length > 0 && (
              <Descriptions.Item label="直属上级">
                <Text>{user.direct_leader.join(', ')}</Text>
              </Descriptions.Item>
            )}

            {/* 扩展属性 */}
            {user.extattr?.attrs && user.extattr.attrs.length > 0 && (
              <Descriptions.Item label="扩展属性">
                <Space direction="vertical" size="small">
                  {user.extattr.attrs.map((attr, index) => (
                    <Space key={index}>
                      <Tag>{attr.name}</Tag>
                      {attr.text && <Text>{attr.text.value}</Text>}
                      {attr.web && (
                        <a href={attr.web.url} target="_blank" rel="noopener noreferrer">
                          {attr.web.title}
                        </a>
                      )}
                    </Space>
                  ))}
                </Space>
              </Descriptions.Item>
            )}

            {/* 对外信息 */}
            {user.external_profile?.external_corp_name && (
              <Descriptions.Item label="对外企业">
                <Text>{user.external_profile.external_corp_name}</Text>
              </Descriptions.Item>
            )}

            {user.external_profile?.wechat_channels && (
              <Descriptions.Item label="视频号">
                <Space>
                  <Text>{user.external_profile.wechat_channels.nickname}</Text>
                  <Tag color={user.external_profile.wechat_channels.status === 1 ? 'green' : 'orange'}>
                    {user.external_profile.wechat_channels.status === 1 ? '已认证' : '未认证'}
                  </Tag>
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* 二维码 */}
          {user.qr_code && (
            <>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <img
                  src={user.qr_code}
                  alt="用户二维码"
                  style={{
                    maxWidth: '100px',
                    maxHeight: '100px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}
                />
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    个人二维码
                  </Text>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  )
}

export default WeChatUserCard