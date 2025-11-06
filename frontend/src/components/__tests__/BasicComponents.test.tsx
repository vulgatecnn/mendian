/**
 * 基础组件测试
 * 测试Arco Design基础组件的渲染和交互
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  Button,
  Input,
  Modal,
  Table,
  Form,
  Select,
  DatePicker,
  Checkbox,
  Radio,
  Switch,
} from '@arco-design/web-react'

describe('基础组件测试', () => {
  describe('Button 组件', () => {
    it('应该正确渲染按钮', () => {
      render(<Button>点击我</Button>)
      expect(screen.getByText('点击我')).toBeInTheDocument()
    })

    it('应该响应点击事件', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>点击我</Button>)
      
      const button = screen.getByText('点击我')
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('应该支持禁用状态', () => {
      render(<Button disabled>禁用按钮</Button>)
      const button = screen.getByText('禁用按钮')
      expect(button).toBeDisabled()
    })

    it('应该支持不同类型', () => {
      const { container } = render(
        <>
          <Button type="primary">主要按钮</Button>
          <Button type="secondary">次要按钮</Button>
          <Button type="dashed">虚线按钮</Button>
        </>
      )
      
      expect(container.querySelector('.arco-btn-primary')).toBeInTheDocument()
      expect(container.querySelector('.arco-btn-secondary')).toBeInTheDocument()
      expect(container.querySelector('.arco-btn-dashed')).toBeInTheDocument()
    })
  })

  describe('Input 组件', () => {
    it('应该正确渲染输入框', () => {
      render(<Input placeholder="请输入" />)
      expect(screen.getByPlaceholderText('请输入')).toBeInTheDocument()
    })

    it('应该支持输入文本', async () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, '测试文本')
      
      expect(input).toHaveValue('测试文本')
      expect(handleChange).toHaveBeenCalled()
    })

    it('应该支持禁用状态', () => {
      render(<Input disabled placeholder="禁用输入框" />)
      const input = screen.getByPlaceholderText('禁用输入框')
      expect(input).toBeDisabled()
    })

    it('应该支持最大长度限制', async () => {
      render(<Input maxLength={5} />)
      const input = screen.getByRole('textbox')
      
      await userEvent.type(input, '123456789')
      expect(input).toHaveValue('12345')
    })
  })

  describe('Modal 组件', () => {
    it('应该在visible为true时显示', () => {
      render(
        <Modal visible={true} title="测试弹窗">
          <div>弹窗内容</div>
        </Modal>
      )
      
      expect(screen.getByText('测试弹窗')).toBeInTheDocument()
      expect(screen.getByText('弹窗内容')).toBeInTheDocument()
    })

    it('应该在visible为false时隐藏', () => {
      render(
        <Modal visible={false} title="测试弹窗">
          <div>弹窗内容</div>
        </Modal>
      )
      
      expect(screen.queryByText('测试弹窗')).not.toBeInTheDocument()
    })

    it('应该响应关闭事件', async () => {
      const handleCancel = vi.fn()
      render(
        <Modal visible={true} title="测试弹窗" onCancel={handleCancel}>
          <div>弹窗内容</div>
        </Modal>
      )
      
      const cancelButton = screen.getByText('取消')
      await userEvent.click(cancelButton)
      
      expect(handleCancel).toHaveBeenCalled()
    })

    it('应该响应确认事件', async () => {
      const handleOk = vi.fn()
      render(
        <Modal visible={true} title="测试弹窗" onOk={handleOk}>
          <div>弹窗内容</div>
        </Modal>
      )
      
      const okButton = screen.getByText('确定')
      await userEvent.click(okButton)
      
      expect(handleOk).toHaveBeenCalled()
    })
  })

  describe('Table 组件', () => {
    const columns = [
      { title: '姓名', dataIndex: 'name' },
      { title: '年龄', dataIndex: 'age' },
      { title: '地址', dataIndex: 'address' },
    ]

    const data = [
      { key: '1', name: '张三', age: 32, address: '北京' },
      { key: '2', name: '李四', age: 28, address: '上海' },
    ]

    it('应该正确渲染表格', () => {
      render(<Table columns={columns} data={data} />)
      
      expect(screen.getByText('姓名')).toBeInTheDocument()
      expect(screen.getByText('年龄')).toBeInTheDocument()
      expect(screen.getByText('地址')).toBeInTheDocument()
      expect(screen.getByText('张三')).toBeInTheDocument()
      expect(screen.getByText('李四')).toBeInTheDocument()
    })

    it('应该显示空状态', () => {
      render(<Table columns={columns} data={[]} />)
      expect(screen.getByText('暂无数据')).toBeInTheDocument()
    })

    it('应该支持分页', () => {
      const pagination = {
        total: 100,
        pageSize: 10,
        current: 1,
      }
      
      render(<Table columns={columns} data={data} pagination={pagination} />)
      
      const paginationElement = document.querySelector('.arco-pagination')
      expect(paginationElement).toBeInTheDocument()
    })
  })

  describe('Form 组件', () => {
    it('应该正确渲染表单', () => {
      render(
        <Form>
          <Form.Item label="用户名" field="username">
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" field="password">
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      )
      
      expect(screen.getByText('用户名')).toBeInTheDocument()
      expect(screen.getByText('密码')).toBeInTheDocument()
    })

    it('应该支持表单验证', async () => {
      const handleSubmit = vi.fn()
      
      render(
        <Form onSubmit={handleSubmit}>
          <Form.Item
            label="用户名"
            field="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Button htmlType="submit">提交</Button>
        </Form>
      )
      
      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('请输入用户名')).toBeInTheDocument()
      })
    })

    it('应该支持表单提交', async () => {
      const handleSubmit = vi.fn()
      
      render(
        <Form onSubmit={handleSubmit}>
          <Form.Item label="用户名" field="username">
            <Input />
          </Form.Item>
          <Button htmlType="submit">提交</Button>
        </Form>
      )
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'testuser')
      
      const submitButton = screen.getByText('提交')
      await userEvent.click(submitButton)
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })
    })
  })

  describe('Select 组件', () => {
    const options = [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
      { label: '选项3', value: '3' },
    ]

    it('应该正确渲染下拉框', () => {
      render(<Select placeholder="请选择" options={options} />)
      expect(screen.getByText('请选择')).toBeInTheDocument()
    })

    it('应该支持选择选项', async () => {
      const handleChange = vi.fn()
      render(<Select placeholder="请选择" options={options} onChange={handleChange} />)
      
      const select = screen.getByText('请选择')
      await userEvent.click(select)
      
      await waitFor(() => {
        const option1 = screen.getByText('选项1')
        expect(option1).toBeInTheDocument()
      })
    })
  })

  describe('Checkbox 组件', () => {
    it('应该正确渲染复选框', () => {
      render(<Checkbox>同意协议</Checkbox>)
      expect(screen.getByText('同意协议')).toBeInTheDocument()
    })

    it('应该支持选中状态切换', async () => {
      const handleChange = vi.fn()
      render(<Checkbox onChange={handleChange}>同意协议</Checkbox>)
      
      const checkbox = screen.getByRole('checkbox')
      await userEvent.click(checkbox)
      
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Radio 组件', () => {
    it('应该正确渲染单选框组', () => {
      render(
        <Radio.Group>
          <Radio value="1">选项1</Radio>
          <Radio value="2">选项2</Radio>
        </Radio.Group>
      )
      
      expect(screen.getByText('选项1')).toBeInTheDocument()
      expect(screen.getByText('选项2')).toBeInTheDocument()
    })

    it('应该支持选择', async () => {
      const handleChange = vi.fn()
      render(
        <Radio.Group onChange={handleChange}>
          <Radio value="1">选项1</Radio>
          <Radio value="2">选项2</Radio>
        </Radio.Group>
      )
      
      const radio1 = screen.getByLabelText('选项1')
      await userEvent.click(radio1)
      
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Switch 组件', () => {
    it('应该正确渲染开关', () => {
      const { container } = render(<Switch />)
      expect(container.querySelector('.arco-switch')).toBeInTheDocument()
    })

    it('应该支持状态切换', async () => {
      const handleChange = vi.fn()
      const { container } = render(<Switch onChange={handleChange} />)
      
      const switchElement = container.querySelector('.arco-switch')
      if (switchElement) {
        await userEvent.click(switchElement)
        expect(handleChange).toHaveBeenCalled()
      }
    })
  })
})
