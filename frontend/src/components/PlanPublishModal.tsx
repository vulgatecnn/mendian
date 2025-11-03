/**
 * 计划发布确认弹窗组件
 */
import React from 'react'
import { Modal, Typography, Space, Alert } from '@arco-design/web-react'
import { IconCheckCircle } from '@arco-design/web-react/icon'

const { Paragraph } = Typography

interface PlanPublishModalProps {
  /** 是否显示弹窗 */
  visible: boolean
  /** 计划名称 */
  planName: string
  /** 确认回调 */
  onConfirm: () => void
  /** 取消回调 */
  onCancel: () => void
  /** 加载状态 */
  loading?: boolean
}

/**
 * 计划发布确认弹窗组件
 */
export const PlanPublishModal: React.FC<PlanPublishModalProps> = ({
  visible,
  planName,
  onConfirm,
  onCancel,
  loading = false
}) => {
  return (
    <Modal
      title={
        <Space>
          <IconCheckCircle style={{ color: '#00b42a' }} />
          <span>发布计划</span>
        </Space>
      }
      visible={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="确认发布"
      cancelText="取消"
    >
      <Alert
        type="info"
        content="发布后计划将进入执行状态，无法再修改计划内容"
        style={{ marginBottom: 16 }}
      />
      
      <Paragraph>
        确定要发布计划 <strong>"{planName}"</strong> 吗？
      </Paragraph>
      
      <Paragraph style={{ color: '#86909c', fontSize: 14 }}>
        发布后：
      </Paragraph>
      <ul style={{ color: '#86909c', fontSize: 14, paddingLeft: 20 }}>
        <li>计划状态将变更为"已发布"</li>
        <li>计划将开始执行，系统将跟踪执行进度</li>
        <li>无法再修改计划的基本信息和区域计划</li>
        <li>可以在执行过程中取消计划</li>
      </ul>
    </Modal>
  )
}

export default PlanPublishModal
