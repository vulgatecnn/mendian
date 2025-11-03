/**
 * 计划取消原因输入弹窗组件
 */
import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Typography, Space, Alert } from '@arco-design/web-react'
import { IconCloseCircle } from '@arco-design/web-react/icon'

const { Paragraph } = Typography
const FormItem = Form.Item

interface PlanCancelModalProps {
  /** 是否显示弹窗 */
  visible: boolean
  /** 计划名称 */
  planName: string
  /** 确认回调 */
  onConfirm: (reason: string) => void
  /** 取消回调 */
  onCancel: () => void
  /** 加载状态 */
  loading?: boolean
}

/**
 * 计划取消原因输入弹窗组件
 */
export const PlanCancelModal: React.FC<PlanCancelModalProps> = ({
  visible,
  planName,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm()
  const [cancelReason, setCancelReason] = useState('')

  // 重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields()
      setCancelReason('')
    }
  }, [visible, form])

  // 确认取消
  const handleConfirm = async () => {
    try {
      await form.validate()
      onConfirm(cancelReason)
    } catch (error) {
      // 表单验证失败
    }
  }

  return (
    <Modal
      title={
        <Space>
          <IconCloseCircle style={{ color: '#f53f3f' }} />
          <span>取消计划</span>
        </Space>
      }
      visible={visible}
      onOk={handleConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="确认取消"
      cancelText="返回"
      okButtonProps={{ status: 'danger' }}
    >
      <Alert
        type="warning"
        content="取消后计划将无法恢复执行，请谨慎操作"
        style={{ marginBottom: 16 }}
      />
      
      <Paragraph>
        确定要取消计划 <strong>"{planName}"</strong> 吗？
      </Paragraph>
      
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <FormItem
          label="取消原因"
          field="cancel_reason"
          rules={[
            { required: true, message: '请输入取消原因' },
            { minLength: 5, message: '取消原因至少需要5个字符' },
            { maxLength: 500, message: '取消原因不能超过500个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请详细说明取消计划的原因"
            rows={4}
            maxLength={500}
            showWordLimit
            value={cancelReason}
            onChange={setCancelReason}
          />
        </FormItem>
      </Form>
      
      <Paragraph style={{ color: '#86909c', fontSize: 14, marginTop: 16 }}>
        取消后：
      </Paragraph>
      <ul style={{ color: '#86909c', fontSize: 14, paddingLeft: 20 }}>
        <li>计划状态将变更为"已取消"</li>
        <li>计划将停止执行，不再跟踪进度</li>
        <li>取消原因将被记录到计划中</li>
        <li>已完成的进度数据将被保留</li>
      </ul>
    </Modal>
  )
}

export default PlanCancelModal
