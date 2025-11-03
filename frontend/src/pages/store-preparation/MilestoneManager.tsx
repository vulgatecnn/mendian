/**
 * 里程碑管理组件
 */
import React, { useState } from 'react'
import {
  Timeline,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Message,
  Popconfirm
} from '@arco-design/web-react'
import { IconPlus, IconEdit, IconDelete, IconCheck } from '@arco-design/web-react/icon'
import { PreparationService } from '../../api'
import { Milestone, MilestoneStatus, MilestoneFormData } from '../../types'

const FormItem = Form.Item

// 里程碑状态配置
const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { text: string; color: string }> = {
  pending: { text: '待开始', color: 'gray' },
  in_progress: { text: '进行中', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
  delayed: { text: '已延期', color: 'red' }
}

interface MilestoneManagerProps {
  constructionOrderId: number
  milestones: Milestone[]
  onUpdate: () => void
  readonly?: boolean
}

const MilestoneManager: React.FC<MilestoneManagerProps> = ({
  constructionOrderId,
  milestones,
  onUpdate,
  readonly = false
}) => {
  const [form] = Form.useForm()
  const [formVisible, setFormVisible] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(false)

  // 打开新建表单
  const handleCreate = () => {
    setEditingMilestone(null)
    form.resetFields()
    setFormVisible(true)
  }

  // 打开编辑表单
  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    form.setFieldsValue({
      name: milestone.name,
      planned_date: milestone.planned_date,
      description: milestone.description
    })
    setFormVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate()
      setLoading(true)

      const formData: MilestoneFormData = {
        name: values.name,
        planned_date: values.planned_date,
        description: values.description
      }

      if (editingMilestone) {
        await PreparationService.updateMilestone(constructionOrderId, editingMilestone.id, formData)
        Message.success('更新里程碑成功')
      } else {
        await PreparationService.addMilestone(constructionOrderId, formData)
        Message.success('添加里程碑成功')
      }

      setFormVisible(false)
      onUpdate()
    } catch (error: any) {
      if (error.errors) {
        return
      }
      Message.error(error?.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除里程碑
  const handleDelete = async (milestone: Milestone) => {
    try {
      await PreparationService.deleteMilestone(constructionOrderId, milestone.id)
      Message.success('删除里程碑成功')
      onUpdate()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '删除失败')
    }
  }

  // 完成里程碑
  const handleComplete = async (milestone: Milestone) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await PreparationService.completeMilestone(constructionOrderId, milestone.id, today)
      Message.success('标记里程碑完成')
      onUpdate()
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '操作失败')
    }
  }

  return (
    <div>
      {!readonly && (
        <div style={{ marginBottom: '20px' }}>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={handleCreate}
          >
            添加里程碑
          </Button>
        </div>
      )}

      {milestones && milestones.length > 0 ? (
        <Timeline>
          {milestones.map((milestone) => {
            const statusConfig = MILESTONE_STATUS_CONFIG[milestone.status]
            return (
              <Timeline.Item
                key={milestone.id}
                label={milestone.planned_date}
                dot={<Tag color={statusConfig.color}>{statusConfig.text}</Tag>}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {milestone.name}
                    </div>
                    {milestone.description && (
                      <div style={{ fontSize: '12px', color: '#86909c', marginBottom: '4px' }}>
                        {milestone.description}
                      </div>
                    )}
                    {milestone.actual_date && (
                      <div style={{ fontSize: '12px', color: '#86909c' }}>
                        实际完成：{milestone.actual_date}
                      </div>
                    )}
                  </div>
                  {!readonly && milestone.status !== 'completed' && (
                    <Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<IconCheck />}
                        onClick={() => handleComplete(milestone)}
                      >
                        完成
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<IconEdit />}
                        onClick={() => handleEdit(milestone)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定要删除这个里程碑吗？"
                        onOk={() => handleDelete(milestone)}
                      >
                        <Button
                          type="text"
                          size="small"
                          status="danger"
                          icon={<IconDelete />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  )}
                </div>
              </Timeline.Item>
            )
          })}
        </Timeline>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#86909c' }}>
          暂无里程碑
        </div>
      )}

      {/* 新建/编辑表单弹窗 */}
      <Modal
        title={editingMilestone ? '编辑里程碑' : '添加里程碑'}
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <FormItem
            label="里程碑名称"
            field="name"
            rules={[{ required: true, message: '请输入里程碑名称' }]}
          >
            <Input placeholder="请输入里程碑名称" />
          </FormItem>

          <FormItem
            label="计划日期"
            field="planned_date"
            rules={[{ required: true, message: '请选择计划日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </FormItem>

          <FormItem
            label="描述"
            field="description"
          >
            <Input.TextArea
              placeholder="请输入描述"
              rows={3}
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default MilestoneManager
