/**
 * 登录页面
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Form,
  Input,
  Button,
  Tabs,
  Checkbox,
  Message,
  Space
} from '@arco-design/web-react'
import { IconUser, IconLock, IconPhone, IconSafe } from '@arco-design/web-react/icon'
import { AuthService } from '../../api'
import { useAuth } from '../../contexts'
import './Login.module.css'

const FormItem = Form.Item
const TabPane = Tabs.TabPane

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('password')
  const [countdown, setCountdown] = useState(0)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)

  // 账号密码登录
  const handlePasswordLogin = async (values: any) => {
    console.log('handlePasswordLogin called', values)
    
    if (isLocked) {
      Message.error('账号已被锁定，请30分钟后再试')
      return
    }

    setLoading(true)
    try {
      console.log('Calling AuthService.loginByPassword...')
      const response = await AuthService.loginByPassword({
        username: values.username,
        password: values.password,
        remember: values.remember
      })
      
      console.log('Login response:', response)
      login(response)
      Message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      console.error('Login error:', error)
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      
      if (newAttempts >= 5) {
        setIsLocked(true)
        Message.error('登录失败次数过多，账号已被锁定30分钟')
        setTimeout(() => {
          setIsLocked(false)
          setLoginAttempts(0)
        }, 30 * 60 * 1000)
      } else {
        Message.error(error.response?.data?.message || '登录失败，请检查用户名和密码')
        if (newAttempts >= 3) {
          Message.warning(`登录失败${newAttempts}次，还有${5 - newAttempts}次机会`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 手机号密码登录
  const handlePhonePasswordLogin = async (values: any) => {
    if (isLocked) {
      Message.error('账号已被锁定，请30分钟后再试')
      return
    }

    setLoading(true)
    try {
      const response = await AuthService.loginByPhonePassword({
        phone: values.phone,
        password: values.password,
        remember: values.remember
      })
      
      login(response)
      Message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      
      if (newAttempts >= 5) {
        setIsLocked(true)
        Message.error('登录失败次数过多，账号已被锁定30分钟')
        setTimeout(() => {
          setIsLocked(false)
          setLoginAttempts(0)
        }, 30 * 60 * 1000)
      } else {
        Message.error(error.response?.data?.message || '登录失败，请检查手机号和密码')
      }
    } finally {
      setLoading(false)
    }
  }

  // 手机号验证码登录
  const handleSmsCodeLogin = async (values: any) => {
    setLoading(true)
    try {
      const response = await AuthService.loginBySmsCode({
        phone: values.phone,
        code: values.code,
        remember: values.remember
      })
      
      login(response)
      Message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      Message.error(error.response?.data?.message || '登录失败，请检查手机号和验证码')
    } finally {
      setLoading(false)
    }
  }

  // 发送短信验证码
  const handleSendSmsCode = async () => {
    const phone = form.getFieldValue('phone')
    
    if (!phone) {
      Message.error('请输入手机号')
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Message.error('请输入正确的手机号')
      return
    }

    try {
      await AuthService.sendSmsCode({
        phone,
        type: 'login'
      })
      
      Message.success('验证码已发送')
      setCountdown(60)
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      Message.error(error.response?.data?.message || '发送验证码失败')
    }
  }

  // 企业微信登录（移动端）
  const handleWechatLogin = () => {
    // 检测是否在企业微信环境
    const isWechat = /MicroMessenger/i.test(navigator.userAgent)
    
    if (!isWechat) {
      Message.warning('请在企业微信中打开')
      return
    }

    // 跳转到企业微信授权页面
    window.location.href = '/api/auth/wechat-authorize/'
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>门店生命周期管理系统</h1>
          <p>Store Lifecycle Management System</p>
        </div>

        <Tabs activeTab={activeTab} onChange={setActiveTab} className="login-tabs">
          {/* 账号密码登录 */}
          <TabPane key="password" title="账号登录">
            <Form
              form={form}
              layout="vertical"
              autoComplete="off"
            >
              <FormItem
                field="username"
                rules={[{ required: true, message: '请输入用户名或手机号' }]}
              >
                <Input
                  prefix={<IconUser />}
                  placeholder="用户名 / 手机号"
                  size="large"
                  disabled={isLocked}
                />
              </FormItem>

              <FormItem
                field="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<IconLock />}
                  placeholder="密码"
                  size="large"
                  disabled={isLocked}
                />
              </FormItem>

              <FormItem>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <FormItem field="remember" noStyle>
                    <Checkbox>记住登录</Checkbox>
                  </FormItem>
                  <a href="#" style={{ color: '#165DFF' }}>忘记密码？</a>
                </div>
              </FormItem>

              {isLocked && (
                <div style={{ color: '#F53F3F', marginBottom: 16, textAlign: 'center' }}>
                  账号已被锁定30分钟，请稍后再试
                </div>
              )}

              {loginAttempts >= 3 && !isLocked && (
                <div style={{ color: '#FF7D00', marginBottom: 16, textAlign: 'center' }}>
                  登录失败{loginAttempts}次，还有{5 - loginAttempts}次机会
                </div>
              )}

              <FormItem>
                <Button
                  type="primary"
                  size="large"
                  long
                  loading={loading}
                  disabled={isLocked}
                  onClick={async () => {
                    try {
                      await form.validate()
                      const values = form.getFieldsValue()
                      handlePasswordLogin(values)
                    } catch (error) {
                      console.log('Form validation failed:', error)
                    }
                  }}
                >
                  登录
                </Button>
              </FormItem>
            </Form>
          </TabPane>

          {/* 手机号密码登录 */}
          <TabPane key="phone-password" title="手机号登录">
            <Form
              form={form}
              layout="vertical"
              onSubmit={handlePhonePasswordLogin}
              autoComplete="off"
            >
              <FormItem
                field="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { 
                    match: /^1[3-9]\d{9}$/, 
                    message: '请输入正确的手机号' 
                  }
                ]}
              >
                <Input
                  prefix={<IconPhone />}
                  placeholder="手机号"
                  size="large"
                  maxLength={11}
                  disabled={isLocked}
                />
              </FormItem>

              <FormItem
                field="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<IconLock />}
                  placeholder="密码"
                  size="large"
                  disabled={isLocked}
                />
              </FormItem>

              <FormItem>
                <FormItem field="remember" noStyle>
                  <Checkbox>记住登录</Checkbox>
                </FormItem>
              </FormItem>

              {isLocked && (
                <div style={{ color: '#F53F3F', marginBottom: 16, textAlign: 'center' }}>
                  账号已被锁定30分钟，请稍后再试
                </div>
              )}

              <FormItem>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  long
                  loading={loading}
                  disabled={isLocked}
                >
                  登录
                </Button>
              </FormItem>
            </Form>
          </TabPane>

          {/* 手机号验证码登录 */}
          <TabPane key="sms-code" title="验证码登录">
            <Form
              form={form}
              layout="vertical"
              onSubmit={handleSmsCodeLogin}
              autoComplete="off"
            >
              <FormItem
                field="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { 
                    match: /^1[3-9]\d{9}$/, 
                    message: '请输入正确的手机号' 
                  }
                ]}
              >
                <Input
                  prefix={<IconPhone />}
                  placeholder="手机号"
                  size="large"
                  maxLength={11}
                />
              </FormItem>

              <FormItem
                field="code"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Space style={{ width: '100%' }}>
                  <Input
                    prefix={<IconSafe />}
                    placeholder="验证码"
                    size="large"
                    maxLength={6}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="large"
                    onClick={handleSendSmsCode}
                    disabled={countdown > 0}
                    style={{ width: 120 }}
                  >
                    {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                  </Button>
                </Space>
              </FormItem>

              <FormItem>
                <FormItem field="remember" noStyle>
                  <Checkbox>记住登录</Checkbox>
                </FormItem>
              </FormItem>

              <FormItem>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  long
                  loading={loading}
                >
                  登录
                </Button>
              </FormItem>
            </Form>
          </TabPane>
        </Tabs>

        {/* 企业微信登录按钮（移动端） */}
        <div className="wechat-login">
          <Button
            type="outline"
            size="large"
            long
            onClick={handleWechatLogin}
            style={{ marginTop: 16 }}
          >
            企业微信登录
          </Button>
        </div>

        <div className="login-footer">
          <p>© 2024 门店生命周期管理系统. All rights reserved.</p>
          <p style={{ marginTop: 8, fontSize: 12 }}>
            <a href="/mobile" style={{ color: '#165DFF' }}>切换到移动端</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
