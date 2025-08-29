/**
 * 表单弹窗组件 - 统一的表单弹窗界面
 */

import React, { useEffect } from 'react'
import { Modal, Form, Grid } from 'antd'
import type { ModalProps, FormProps } from 'antd'

const { useBreakpoint } = Grid

interface FormModalProps extends Omit<ModalProps, 'onOk'> {
  /** 表单属性 */
  formProps?: FormProps
  /** 表单项 */
  children: React.ReactNode
  /** 确认回调 */
  onOk?: (values: any, form: any) => void | Promise<void>
  /** 表单实例 */
  form?: any
  /** 初始值 */
  initialValues?: any
  /** 是否在打开时重置表单 */
  resetOnOpen?: boolean
  /** 是否为只读模式 */
  readonly?: boolean
}

const FormModal: React.FC<FormModalProps> = ({
  formProps = {},
  children,
  onOk,
  onCancel,
  form: propForm,
  initialValues,
  resetOnOpen = true,
  readonly = false,
  open,
  ...modalProps
}) => {
  const [form] = Form.useForm(propForm)
  const screens = useBreakpoint()
  const isMobile = !screens.md

  // 监听弹窗打开，初始化表单
  useEffect(() => {
    if (open) {
      if (resetOnOpen) {
        form.resetFields()
      }
      if (initialValues) {
        form.setFieldsValue(initialValues)
      }
    }
  }, [open, initialValues, resetOnOpen, form])

  // 处理确认
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      await onOk?.(values, form)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 处理取消
  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    form.resetFields()
    onCancel?.(e)
  }

  return (
    <Modal
      {...modalProps}
      open={open ?? false}
      onOk={handleOk}
      onCancel={handleCancel}
      width={isMobile ? '90%' : (modalProps.width || 520)}
      style={isMobile ? { top: 20 } : (modalProps.style || {})}
      bodyStyle={{
        maxHeight: isMobile ? '70vh' : '60vh',
        overflow: 'auto',
        ...modalProps.bodyStyle
      }}
      okButtonProps={{
        loading: modalProps.confirmLoading ?? false,
        ...modalProps.okButtonProps
      }}
      footer={readonly ? null : modalProps.footer}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        disabled={readonly}
        {...formProps}
      >
        {children}
      </Form>
    </Modal>
  )
}

export default FormModal