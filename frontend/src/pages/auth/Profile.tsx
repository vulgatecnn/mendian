/**
 * 个人中心页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Message,
  Space,
  Descriptions,
  Table,
  Tag,
  Tree
} from '@arco-design/web-react'
import { IconCamera, IconUser, IconPhone, IconEmail, IconLock } from '@arco-design/web-react/icon'
import { ProfileService } from '../../api'
import { useAuth } from '../../contexts'
import type { OperationLog } from '../../api/profileService'
import './Profile.module.css'

const FormItem = Form.Item
const TabPane = Tabs.TabPane

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>()
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        phone: user.phone,
        email: user.email
      })
      setAvatarUrl(user.avatar)
    }
  }, [user, form])

  // 加载操作日志
  const loadOperationLogs = async (page = 1) => {
    setLogsLoading(true)
    try {
      const response = await ProfileService.getOperationLogs({
        page,
        page_size: pagination.pageSize
      })
      setOperationLogs(response.results)
      setPagination({
        ...pagination,
        current: page,
        total: response.count
      })
    } catch (error) {
      Message.error('加载操作日志失败')
    } finally {
      setLogsLoading(false)
    }
  }

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    setLoading(true)
    try {
      await ProfileService.updateProfile(values)
      await refreshUser()
      Message.success('个人信息更新成功')
    } catch (error: any) {
      Message.error(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 修改密码
  const handleChangePassword = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      Message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      await ProfileService.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password
      })
      Message.success('密码修改成功，请重新登录')
      passwordForm.resetFields()
    } catch (error: any) {
      Message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  // 上传头像
  const handleAvatarUpload = async (file: File) => {
    try {
      const response = await ProfileService.uploadAvatar(file)
      setAvatarUrl(response.avatar_url)
      await refreshUser()
      Message.success('头像上传成功')
    } catch (error: any) {
      Message.error(error.response?.data?.message || '头像上传失败')
    }
    return false // 阻止默认上传行为
  }

  // 操作日志表格列
  const logColumns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      width: 120,
      render: (text: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          create: { color: 'green', text: '创建' },
          update: { color: 'blue', text: '更新' },
          delete: { color: 'red', text: '删除' },
          login: { color: 'arcoblue', text: '登录' },
          logout: { color: 'gray', text: '退出' }
        }
        const config = typeMap[text] || { color: 'gray', text: text }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '操作描述',
      dataIndex: 'operation_desc'
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      width: 150
    }
  ]

  // 构建权限树数据
  const buildPermissionTree = () => {
    if (!user?.permissions) return []
    
    const tree: any[] = []
    const moduleMap: Record<string, any> = {}

    user.permissions.forEach((permission) => {
      const parts = permission.split('.')
      const module = parts[0]
      const action = parts.slice(1).join('.')

      if (!moduleMap[module]) {
        moduleMap[module] = {
          key: module,
          title: module,
          children: []
        }
        tree.push(moduleMap[module])
      }

      moduleMap[module].children.push({
        key: permission,
        title: action
      })
    })

    return tree
  }

  return (
    <div className="profile-container">
      <Card>
        <Tabs 
          defaultActiveTab="basic"
          onChange={(key) => {
            if (key === 'logs') {
              loadOperationLogs(1)
            }
          }}
        >
          {/* 基本信息 */}
          <TabPane key="basic" title="基本信息">
            <div className="profile-basic">
              <div className="avatar-section">
                <Avatar size={100} className="avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" />
                  ) : (
                    <IconUser />
                  )}
                </Avatar>
                <Upload
                  accept="image/*"
                  beforeUpload={handleAvatarUpload}
                  showUploadList={false}
                >
                  <Button type="text" icon={<IconCamera />} className="upload-btn">
                    更换头像
                  </Button>
                </Upload>
              </div>

              <div className="info-section">
                <Descriptions
                  column={2}
                  data={[
                    {
                      label: '用户名',
                      value: user?.username
                    },
                    {
                      label: '姓名',
                      value: user?.name
                    },
                    {
                      label: '手机号',
                      value: user?.phone
                    },
                    {
                      label: '邮箱',
                      value: user?.email || '-'
                    },
                    {
                      label: '部门',
                      value: user?.department?.name || '-'
                    },
                    {
                      label: '角色',
                      value: user?.roles.map(r => r.name).join(', ') || '-'
                    },
                    {
                      label: '创建时间',
                      value: user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '-'
                    },
                    {
                      label: '最后登录',
                      value: user?.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '-'
                    }
                  ]}
                />
              </div>
            </div>
          </TabPane>

          {/* 编辑信息 */}
          <TabPane key="edit" title="编辑信息">
            <Form
              form={form}
              layout="vertical"
              onSubmit={handleUpdateProfile}
              style={{ maxWidth: 600 }}
            >
              <FormItem
                label="姓名"
                field="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input
                  prefix={<IconUser />}
                  placeholder="请输入姓名"
                  size="large"
                />
              </FormItem>

              <FormItem
                label="手机号"
                field="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { match: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input
                  prefix={<IconPhone />}
                  placeholder="请输入手机号"
                  size="large"
                  maxLength={11}
                />
              </FormItem>

              <FormItem
                label="邮箱"
                field="email"
                rules={[
                  { type: 'email', message: '请输入正确的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<IconEmail />}
                  placeholder="请输入邮箱"
                  size="large"
                />
              </FormItem>

              <FormItem>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    保存修改
                  </Button>
                  <Button onClick={() => form.resetFields()}>
                    重置
                  </Button>
                </Space>
              </FormItem>
            </Form>
          </TabPane>

          {/* 修改密码 */}
          <TabPane key="password" title="修改密码">
            <Form
              form={passwordForm}
              layout="vertical"
              onSubmit={handleChangePassword}
              style={{ maxWidth: 600 }}
            >
              <FormItem
                label="原密码"
                field="old_password"
                rules={[{ required: true, message: '请输入原密码' }]}
              >
                <Input.Password
                  prefix={<IconLock />}
                  placeholder="请输入原密码"
                  size="large"
                />
              </FormItem>

              <FormItem
                label="新密码"
                field="new_password"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { 
                    minLength: 8, 
                    message: '密码长度至少8位' 
                  },
                  {
                    match: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                    message: '密码必须包含字母和数字'
                  }
                ]}
              >
                <Input.Password
                  prefix={<IconLock />}
                  placeholder="请输入新密码（至少8位，包含字母和数字）"
                  size="large"
                />
              </FormItem>

              <FormItem
                label="确认密码"
                field="confirm_password"
                rules={[{ required: true, message: '请再次输入新密码' }]}
              >
                <Input.Password
                  prefix={<IconLock />}
                  placeholder="请再次输入新密码"
                  size="large"
                />
              </FormItem>

              <FormItem>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    修改密码
                  </Button>
                  <Button onClick={() => passwordForm.resetFields()}>
                    重置
                  </Button>
                </Space>
              </FormItem>
            </Form>
          </TabPane>

          {/* 权限查看 */}
          <TabPane key="permissions" title="权限查看">
            <div style={{ marginBottom: 16 }}>
              <h3>我的角色</h3>
              <Space>
                {user?.roles.map(role => (
                  <Tag key={role.id} color="arcoblue" size="large">
                    {role.name}
                  </Tag>
                ))}
              </Space>
            </div>

            <div>
              <h3>我的权限</h3>
              <Tree
                treeData={buildPermissionTree()}
                defaultExpandedKeys={buildPermissionTree().map(item => item.key)}
                blockNode
              />
            </div>
          </TabPane>

          {/* 操作日志 */}
          <TabPane 
            key="logs" 
            title="操作日志"
          >
            <Table
              columns={logColumns}
              data={operationLogs}
              loading={logsLoading}
              pagination={{
                ...pagination,
                onChange: (page) => loadOperationLogs(page)
              }}
              rowKey="id"
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Profile
