/**
 * 角色创建/编辑弹窗组件
 */
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Switch,
  Message,
  Button
} from '@arco-design/web-react'
import { Role } from '../types'
import RoleService, { RoleFormData } from '../api/roleService'

const FormItem = Form.Item

interface RoleFormModalProps {
  visible: boolean
  role: Role | null
  isEditing: boolean
  onCancel: () => void
  onSuccess: () => void
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({
  visible,
  role,
  isEditing,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validate()
      setLoading(true)

      const formData: RoleFormData = {
        name: values.name,
        description: values.description || '',
        is_active: values.is_active !== false // 默认为 true
      }

      let result
      if (isEditing && role) {
        result = await RoleService.updateRole(role.id, formData)
      } else {
        result = await RoleService.createRole(formData)
      }

      if (result.code === 0) {
        Message.success(isEditing ? '角色更新成功' : '角色创建成功')
        form.resetFields()
        onSuccess()
      } else {
        Message.error(result.message || '操作失败')
      }
    } catch (error: any) {
      if (error.name === 'ValidateError') {
        // 表单验证错误，不需要显示消息
        return
      }
      
      const errorMessage = error?.response?.data?.message || '操作失败'
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 取消操作
  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  // 当弹窗打开且是编辑模式时，填充表单数据
  useEffect(() => {
    if (visible && isEditing && role) {
      form.setFieldsValue({
        name: role.name,
        description: role.description,
        is_active: role.is_active
      })
    } else if (visible && !isEditing) {
      // 创建模式时设置默认值
      form.setFieldsValue({
        is_active: true
      })
    }
  }, [visible, isEditing, role, form])

  return (
    <Modal
      title={isEditing ? '编辑角色' : '创建角色'}
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {isEditing ? '更新' : '创建'}
        </Button>
      ]}
      maskClosable={false}
      style={{ width: '500px' }}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <FormItem
          label="角色名称"
          field="name"
          rules={[
            { required: true, message: '请输入角色名称' },
            { minLength: 2, message: '角色名称至少2个字符' },
            { maxLength: 50, message: '角色名称不能超过50个字符' }
          ]}
        >
          <Input
            placeholder="请输入角色名称"
            maxLength={50}
            showWordLimit
          />
        </FormItem>

        <FormItem
          label="角色描述"
          field="description"
          rules={[
            { maxLength: 200, message: '角色描述不能超过200个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入角色描述（可选）"
            maxLength={200}
            showWordLimit
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </FormItem>

        <FormItem
          label="启用状态"
          field="is_active"
          triggerPropName="checked"
        >
          <Switch
            checkedText="启用"
            uncheckedText="停用"
          />
        </FormItem>
      </Form>
    </Modal>
  )
}

export default RoleFormModal