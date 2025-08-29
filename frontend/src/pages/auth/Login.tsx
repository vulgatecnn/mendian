/**
 * 登录页面
 */

import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import type { LoginRequest } from '../../types/auth'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { login, error, clearError } = useAuth()

  const handleSubmit = async (values: LoginRequest) => {
    try {
      setLoading(true)
      clearError()
      await login(values)
      message.success('登录成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            好饭碗门店管理系统
          </Title>
          <Text type="secondary">请输入您的账号密码登录</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          size="large"
          layout="vertical"
          requiredMark={false}
          initialValues={{
            username: 'admin',
            password: '123456',
            remember: true
          }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住密码</Checkbox>
              </Form.Item>
              <Button type="link" size="small">
                忘记密码？
              </Button>
            </div>
          </Form.Item>

          {error && (
            <div
              style={{
                color: '#ff4d4f',
                textAlign: 'center',
                marginBottom: 16
              }}
            >
              {error}
            </div>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48 }}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            测试账号：admin / 123456
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default Login
