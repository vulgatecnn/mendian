/**
 * 表单验证测试
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Form, Input, Button, DatePicker, Select } from '@arco-design/web-react'

describe('表单验证测试', () => {
  describe('登录表单验证', () => {
    const LoginForm = () => {
      const [form] = Form.useForm()
      const handleSubmit = vi.fn()

      return (
        <Form form={form} onSubmit={handleSubmit}>
          <Form.Item
            label="用户名"
            field="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            field="password"
            rules={[
              { required: true, message: '请输入密码' },
              { minLength: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Button htmlType="submit">登录</Button>
        </Form>
      )
    }

    it('应该验证必填字段', async () => {
      render(<LoginForm />)

      const submitButton = screen.getByText('登录')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请输入用户名')).toBeInTheDocument()
        expect(screen.getByText('请输入密码')).toBeInTheDocument()
      })
    })

    it('应该验证密码最小长度', async () => {
      render(<LoginForm />)

      const usernameInput = screen.getByPlaceholderText('请输入用户名')
      const passwordInput = screen.getByPlaceholderText('请输入密码')

      await userEvent.type(usernameInput, 'testuser')
      await userEvent.type(passwordInput, '123')

      const submitButton = screen.getByText('登录')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('密码至少6位')).toBeInTheDocument()
      })
    })

    it('应该在输入有效数据后通过验证', async () => {
      const handleSubmit = vi.fn()
      
      const ValidLoginForm = () => {
        const [form] = Form.useForm()

        return (
          <Form form={form} onSubmit={handleSubmit}>
            <Form.Item
              label="用户名"
              field="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              label="密码"
              field="password"
              rules={[
                { required: true, message: '请输入密码' },
                { minLength: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Button htmlType="submit">登录</Button>
          </Form>
        )
      }

      render(<ValidLoginForm />)

      const usernameInput = screen.getByPlaceholderText('请输入用户名')
      const passwordInput = screen.getByPlaceholderText('请输入密码')

      await userEvent.type(usernameInput, 'testuser')
      await userEvent.type(passwordInput, 'password123')

      const submitButton = screen.getByText('登录')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('门店计划表单验证', () => {
    const PlanForm = () => {
      const [form] = Form.useForm()
      const handleSubmit = vi.fn()

      return (
        <Form form={form} onSubmit={handleSubmit}>
          <Form.Item
            label="计划名称"
            field="name"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入计划名称" />
          </Form.Item>
          <Form.Item
            label="计划类型"
            field="type"
            rules={[{ required: true, message: '请选择计划类型' }]}
          >
            <Select placeholder="请选择计划类型">
              <Select.Option value="annual">年度计划</Select.Option>
              <Select.Option value="quarterly">季度计划</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="目标数量"
            field="target_count"
            rules={[
              { required: true, message: '请输入目标数量' },
              { 
                validator: (value, callback) => {
                  if (value && value <= 0) {
                    callback('目标数量必须大于0')
                  } else {
                    callback()
                  }
                }
              },
            ]}
          >
            <Input type="number" placeholder="请输入目标数量" />
          </Form.Item>
          <Button htmlType="submit">提交</Button>
        </Form>
      )
    }

    it('应该验证必填项', async () => {
      render(<PlanForm />)

      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请输入计划名称')).toBeInTheDocument()
        expect(screen.getByText('请选择计划类型')).toBeInTheDocument()
        expect(screen.getByText('请输入目标数量')).toBeInTheDocument()
      })
    })

    it('应该验证数字范围', async () => {
      render(<PlanForm />)

      const nameInput = screen.getByPlaceholderText('请输入计划名称')
      const targetInput = screen.getByPlaceholderText('请输入目标数量')

      await userEvent.type(nameInput, '2024年度计划')
      await userEvent.type(targetInput, '-1')

      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('目标数量必须大于0')).toBeInTheDocument()
      })
    })
  })

  describe('手机号格式验证', () => {
    const PhoneForm = () => {
      const [form] = Form.useForm()
      const handleSubmit = vi.fn()

      return (
        <Form form={form} onSubmit={handleSubmit}>
          <Form.Item
            label="手机号"
            field="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { 
                match: /^1[3-9]\d{9}$/, 
                message: '请输入正确的手机号格式' 
              },
            ]}
          >
            <Input placeholder="请输入手机号" maxLength={11} />
          </Form.Item>
          <Button htmlType="submit">提交</Button>
        </Form>
      )
    }

    it('应该验证手机号格式', async () => {
      render(<PhoneForm />)

      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      await userEvent.type(phoneInput, '123456')

      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请输入正确的手机号格式')).toBeInTheDocument()
      })
    })

    it('应该接受正确的手机号格式', async () => {
      const handleSubmit = vi.fn()
      
      const ValidPhoneForm = () => {
        const [form] = Form.useForm()

        return (
          <Form form={form} onSubmit={handleSubmit}>
            <Form.Item
              label="手机号"
              field="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { 
                  match: /^1[3-9]\d{9}$/, 
                  message: '请输入正确的手机号格式' 
                },
              ]}
            >
              <Input placeholder="请输入手机号" maxLength={11} />
            </Form.Item>
            <Button htmlType="submit">提交</Button>
          </Form>
        )
      }

      render(<ValidPhoneForm />)

      const phoneInput = screen.getByPlaceholderText('请输入手机号')
      await userEvent.type(phoneInput, '13800138000')

      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('日期范围验证', () => {
    const DateRangeForm = () => {
      const [form] = Form.useForm()
      const handleSubmit = vi.fn()

      return (
        <Form form={form} onSubmit={handleSubmit}>
          <Form.Item
            label="开始日期"
            field="start_date"
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker placeholder="请选择开始日期" />
          </Form.Item>
          <Form.Item
            label="结束日期"
            field="end_date"
            rules={[
              { required: true, message: '请选择结束日期' },
              {
                validator: (value, callback) => {
                  const startDate = form.getFieldValue('start_date')
                  if (value && startDate && value < startDate) {
                    callback('结束日期不能早于开始日期')
                  } else {
                    callback()
                  }
                }
              },
            ]}
          >
            <DatePicker placeholder="请选择结束日期" />
          </Form.Item>
          <Button htmlType="submit">提交</Button>
        </Form>
      )
    }

    it('应该验证日期必填', async () => {
      render(<DateRangeForm />)

      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请选择开始日期')).toBeInTheDocument()
        expect(screen.getByText('请选择结束日期')).toBeInTheDocument()
      })
    })
  })

  describe('错误提示显示', () => {
    it('应该在字段下方显示错误提示', async () => {
      const SimpleForm = () => {
        const [form] = Form.useForm()

        return (
          <Form form={form}>
            <Form.Item
              label="邮箱"
              field="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入正确的邮箱格式' },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Button htmlType="submit">提交</Button>
          </Form>
        )
      }

      render(<SimpleForm />)

      const emailInput = screen.getByPlaceholderText('请输入邮箱')
      await userEvent.type(emailInput, 'invalid-email')

      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请输入正确的邮箱格式')).toBeInTheDocument()
      })
    })

    it('应该在修正错误后清除错误提示', async () => {
      const SimpleForm = () => {
        const [form] = Form.useForm()

        return (
          <Form form={form}>
            <Form.Item
              label="用户名"
              field="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Button htmlType="submit">提交</Button>
          </Form>
        )
      }

      render(<SimpleForm />)

      // 先触发错误
      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('请输入用户名')).toBeInTheDocument()
      })

      // 输入内容修正错误
      const usernameInput = screen.getByPlaceholderText('请输入用户名')
      await userEvent.type(usernameInput, 'testuser')

      await waitFor(() => {
        expect(screen.queryByText('请输入用户名')).not.toBeInTheDocument()
      })
    })
  })
})
