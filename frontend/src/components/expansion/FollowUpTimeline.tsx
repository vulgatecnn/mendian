import React, { useState } from 'react'
import {
  Timeline,
  Card,
  Space,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Typography,
  Avatar,
  Tooltip,
  Divider,
  Badge,
  message
} from 'antd'
import {
  PhoneOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useExpansionStore } from '@/stores/expansionStore'
import type { FollowUpRecord } from '@/services/types'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography
const { TextArea } = Input

interface FollowUpTimelineProps {
  candidateLocationId: string
  records: FollowUpRecord[]
  onRecordAdded?: () => void
  onRecordUpdated?: (id: string) => void
  onRecordDeleted?: (id: string) => void
}

const FollowUpTimeline: React.FC<FollowUpTimelineProps> = ({
  candidateLocationId,
  records,
  onRecordAdded,
  onRecordUpdated,
  onRecordDeleted
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FollowUpRecord | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const {
    isSubmitting,
    createFollowUpRecord,
    updateFollowUpRecord,
    deleteFollowUpRecord
  } = useExpansionStore()

  // 跟进类型映射
  const followUpTypeMap = {
    SITE_VISIT: { 
      color: 'blue', 
      text: '实地考察', 
      icon: <EnvironmentOutlined />,
      bgColor: '#e6f7ff'
    },
    NEGOTIATION: { 
      color: 'orange', 
      text: '商务谈判', 
      icon: <TeamOutlined />,
      bgColor: '#fff7e6'
    },
    DOCUMENT_REVIEW: { 
      color: 'purple', 
      text: '资料审核', 
      icon: <FileTextOutlined />,
      bgColor: '#f9f0ff'
    },
    DECISION: { 
      color: 'green', 
      text: '决策讨论', 
      icon: <CheckCircleOutlined />,
      bgColor: '#f6ffed'
    },
    PHONE_CALL: {
      color: 'cyan',
      text: '电话沟通',
      icon: <PhoneOutlined />,
      bgColor: '#e6fffb'
    }
  }

  const handleAddRecord = async (values: any) => {
    const recordData = {
      candidateLocationId,
      type: values.type,
      content: values.content,
      nextActionDate: values.nextActionDate?.toISOString(),
      attachments: values.attachments?.map((file: any) => file.response?.url || file.url) || []
    }

    const result = await createFollowUpRecord(recordData)
    if (result) {
      setShowAddModal(false)
      addForm.resetFields()
      onRecordAdded?.()
    }
  }

  const handleEditRecord = async (values: any) => {
    if (!editingRecord) return

    const recordData = {
      type: values.type,
      content: values.content,
      nextActionDate: values.nextActionDate?.toISOString(),
      attachments: values.attachments?.map((file: any) => file.response?.url || file.url) || []
    }

    const result = await updateFollowUpRecord(editingRecord.id, recordData)
    if (result) {
      setShowEditModal(false)
      setEditingRecord(null)
      editForm.resetFields()
      onRecordUpdated?.(editingRecord.id)
    }
  }

  const handleDeleteRecord = (record: FollowUpRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条跟进记录吗？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const success = await deleteFollowUpRecord(record.id)
        if (success) {
          onRecordDeleted?.(record.id)
        }
      }
    })
  }

  const openEditModal = (record: FollowUpRecord) => {
    setEditingRecord(record)
    editForm.setFieldsValue({
      type: record.type,
      content: record.content,
      nextActionDate: record.nextActionDate ? dayjs(record.nextActionDate) : undefined,
      attachments: record.attachments?.map((url: string, index: number) => ({
        uid: `${index}`,
        name: `attachment-${index}`,
        status: 'done',
        url
      })) || []
    })
    setShowEditModal(true)
  }

  const renderTimelineItem = (record: FollowUpRecord) => {
    const typeConfig = followUpTypeMap[record.type as keyof typeof followUpTypeMap]
    const isOverdue = record.nextActionDate && dayjs(record.nextActionDate).isBefore(dayjs())

    return (
      <div style={{ background: typeConfig?.bgColor || '#f5f5f5', padding: 16, borderRadius: 8 }}>
        {/* 跟进头部信息 */}
        <div style={{ marginBottom: 12 }}>
          <Space size="large" split={<Divider type="vertical" />}>
            <Space>
              <Tag color={typeConfig?.color} icon={typeConfig?.icon}>
                {typeConfig?.text}
              </Tag>
              {record.priority === 'URGENT' && <Badge status="error" text="紧急" />}
            </Space>
            
            <Space>
              <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                {record.createdByName?.[0] || '?'}
              </Avatar>
              <Text type="secondary">{record.createdByName}</Text>
            </Space>
            
            <Text type="secondary">
              {dayjs(record.createdAt).format('MM-DD HH:mm')}
            </Text>

            <Space>
              <Button 
                type="text" 
                size="small" 
                icon={<EditOutlined />} 
                onClick={() => openEditModal(record)}
              />
              <Button 
                type="text" 
                size="small" 
                icon={<DeleteOutlined />} 
                onClick={() => handleDeleteRecord(record)}
                danger
              />
            </Space>
          </Space>
        </div>

        {/* 跟进内容 */}
        <Paragraph style={{ margin: 0, marginBottom: 12 }}>
          {record.content}
        </Paragraph>

        {/* 附件信息 */}
        {record.attachments && record.attachments.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              <PaperClipOutlined style={{ marginRight: 4 }} />
              附件：
            </Text>
            <Space wrap>
              {record.attachments.map((attachment: string, index: number) => (
                <Tag key={index} icon={<PaperClipOutlined />}>
                  <a href={attachment} target="_blank" rel="noopener noreferrer">
                    附件{index + 1}
                  </a>
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 下次跟进信息 */}
        {record.nextActionDate && (
          <div>
            <Space>
              <CalendarOutlined style={{ color: isOverdue ? '#f5222d' : '#1890ff' }} />
              <Text type={isOverdue ? 'danger' : 'secondary'}>
                下次跟进：{dayjs(record.nextActionDate).format('YYYY-MM-DD HH:mm')}
                {isOverdue && ' (已逾期)'}
              </Text>
            </Space>
          </div>
        )}
      </div>
    )
  }

  const timelineItems = records.map((record) => {
    const typeConfig = followUpTypeMap[record.type as keyof typeof followUpTypeMap]
    
    return {
      color: typeConfig?.color || 'blue',
      dot: typeConfig?.icon,
      children: renderTimelineItem(record)
    }
  })

  return (
    <div>
      {/* 操作栏 */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setShowAddModal(true)}
        >
          添加跟进记录
        </Button>
      </div>

      {/* 时间轴 */}
      <Card>
        {records.length > 0 ? (
          <Timeline items={timelineItems} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <PhoneOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>暂无跟进记录</div>
            <Button 
              type="link" 
              onClick={() => setShowAddModal(true)}
              style={{ marginTop: 8 }}
            >
              添加第一条跟进记录
            </Button>
          </div>
        )}
      </Card>

      {/* 添加跟进记录模态框 */}
      <Modal
        title="添加跟进记录"
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddRecord}
        >
          <Form.Item 
            name="type" 
            label="跟进类型"
            rules={[{ required: true, message: '请选择跟进类型' }]}
          >
            <Select placeholder="请选择跟进类型">
              {Object.entries(followUpTypeMap).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  <Space>
                    {config.icon}
                    {config.text}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="content" 
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请详细描述跟进情况..." />
          </Form.Item>
          
          <Form.Item name="nextActionDate" label="下次跟进时间">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择下次跟进时间"
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>

          <Form.Item name="attachments" label="附件">
            <Upload
              multiple
              beforeUpload={() => false} // 阻止自动上传
              onChange={(info) => {
                // 处理文件列表
              }}
            >
              <Button icon={<PlusOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑跟进记录模态框 */}
      <Modal
        title="编辑跟进记录"
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditRecord}
        >
          <Form.Item 
            name="type" 
            label="跟进类型"
            rules={[{ required: true, message: '请选择跟进类型' }]}
          >
            <Select placeholder="请选择跟进类型">
              {Object.entries(followUpTypeMap).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  <Space>
                    {config.icon}
                    {config.text}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="content" 
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请详细描述跟进情况..." />
          </Form.Item>
          
          <Form.Item name="nextActionDate" label="下次跟进时间">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择下次跟进时间"
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>

          <Form.Item name="attachments" label="附件">
            <Upload
              multiple
              beforeUpload={() => false}
            >
              <Button icon={<PlusOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowEditModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FollowUpTimeline