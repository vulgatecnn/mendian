import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Image,
  Timeline,
  Modal,
  Rate,
  Badge,
  Statistic,
  Divider,
  Avatar,
  Progress,
  Tooltip,
  Typography,
  Tabs,
  Upload,
  message,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  PlusOutlined,
  PhoneOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  StarOutlined,
  CalendarOutlined,
  DollarOutlined,
  HomeOutlined,
  FileTextOutlined,
  CameraOutlined,
  PlayCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  LinkOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useExpansionStore } from '@/stores/expansionStore'
import type { CandidateLocation, FollowUpRecord } from '@/services/types'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const CandidateLocationDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('basic')
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [scoreForm] = Form.useForm()
  const [followUpForm] = Form.useForm()
  
  const { 
    currentCandidateLocation: location,
    followUpRecords,
    businessConditions,
    isLoading,
    isSubmitting,
    fetchCandidateLocation,
    fetchCandidateFollowUps,
    fetchCandidateBusinessConditions,
    updateLocationScore,
    createFollowUpRecord,
    uploadLocationPhotos,
    deleteLocationPhoto,
    updateLocationStatus
  } = useExpansionStore()

  useEffect(() => {
    if (id) {
      fetchCandidateLocation(id)
      fetchCandidateFollowUps(id)
      fetchCandidateBusinessConditions(id)
    }
  }, [id, fetchCandidateLocation, fetchCandidateFollowUps, fetchCandidateBusinessConditions])

  // 状态映射
  const statusMap = {
    DISCOVERED: { color: 'default', text: '已发现', icon: <EyeOutlined /> },
    INVESTIGATING: { color: 'processing', text: '调研中', icon: <FileTextOutlined /> },
    NEGOTIATING: { color: 'warning', text: '谈判中', icon: <TeamOutlined /> },
    APPROVED: { color: 'success', text: '已通过', icon: <CheckCircleOutlined /> },
    REJECTED: { color: 'error', text: '已拒绝', icon: <ExclamationCircleOutlined /> },
    SIGNED: { color: 'success', text: '已签约', icon: <StarOutlined /> }
  }

  const priorityMap = {
    LOW: { color: 'default', text: '低' },
    MEDIUM: { color: 'blue', text: '中' },
    HIGH: { color: 'orange', text: '高' },
    URGENT: { color: 'red', text: '紧急' }
  }

  const followUpTypeMap = {
    SITE_VISIT: { color: 'blue', text: '实地考察', icon: <EnvironmentOutlined /> },
    NEGOTIATION: { color: 'orange', text: '商务谈判', icon: <TeamOutlined /> },
    DOCUMENT_REVIEW: { color: 'purple', text: '资料审核', icon: <FileTextOutlined /> },
    DECISION: { color: 'green', text: '决策讨论', icon: <CheckCircleOutlined /> }
  }

  const handleBack = () => {
    navigate('/expansion/candidates')
  }

  const handleEdit = () => {
    navigate(`/expansion/candidates/${id}/edit`)
  }

  const handleDelete = () => {
    if (!location) return

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个候选点位吗？删除后无法恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        // 删除逻辑
        navigate('/expansion/candidates')
      }
    })
  }

  const handleStatusChange = (status: CandidateLocation['status']) => {
    if (!id) return
    
    Modal.confirm({
      title: '确认状态变更',
      content: `确定将状态变更为"${statusMap[status]?.text}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await updateLocationStatus(id, status)
      }
    })
  }

  const handleScoreSubmit = async (values: any) => {
    if (!id) return
    
    const success = await updateLocationScore(id, values.score, values.comments)
    if (success) {
      setShowScoreModal(false)
      scoreForm.resetFields()
    }
  }

  const handleFollowUpSubmit = async (values: any) => {
    if (!id) return
    
    const followUpData = {
      candidateLocationId: id,
      type: values.type,
      content: values.content,
      nextActionDate: values.nextActionDate?.toISOString(),
      attachments: values.attachments || []
    }
    
    const result = await createFollowUpRecord(followUpData)
    if (result) {
      setShowFollowUpModal(false)
      followUpForm.resetFields()
      fetchCandidateFollowUps(id)
    }
  }

  const handlePhotoUpload = async (info: any) => {
    if (!id) return
    
    if (info.file.status === 'done') {
      await uploadLocationPhotos(id, [info.file.originFileObj])
    }
  }

  const handlePhotoDelete = async (photoId: string) => {
    if (!id) return
    await deleteLocationPhoto(id, photoId)
  }

  if (!location && !isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>候选点位不存在</Title>
        <Button type="primary" onClick={handleBack}>
          返回列表
        </Button>
      </div>
    )
  }

  const renderBasicInfo = () => (
    <Card title="基本信息" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Descriptions column={2} labelStyle={{ fontWeight: 'bold' }}>
            <Descriptions.Item label="点位名称">
              <Space>
                {location?.name}
                {location?.priority === 'URGENT' && <Badge color="red" text="紧急" />}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="物业类型">
              <Tag color="blue">{location?.propertyType || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="地址">
              <Space>
                <EnvironmentOutlined style={{ color: '#1890ff' }} />
                <Text copyable>{location?.address}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="商圈">
              {location?.businessCircle || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="面积">
              {location?.area ? `${location.area}㎡` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="租金">
              {location?.rent ? `¥${(location.rent / 10000).toFixed(1)}万/月` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Space>
                <Tag 
                  color={statusMap[location?.status as keyof typeof statusMap]?.color} 
                  icon={statusMap[location?.status as keyof typeof statusMap]?.icon}
                >
                  {statusMap[location?.status as keyof typeof statusMap]?.text}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={priorityMap[location?.priority as keyof typeof priorityMap]?.color}>
                {priorityMap[location?.priority as keyof typeof priorityMap]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="综合评分">
              <Space direction="vertical" size={4}>
                <Rate disabled value={location?.score ? location.score / 2 : 0} allowHalf />
                <Text type="secondary">
                  {location?.score ? `${location.score.toFixed(1)}/10` : '未评分'}
                </Text>
                <Button size="small" type="link" onClick={() => setShowScoreModal(true)}>
                  更新评分
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="发现时间">
              {location?.discoveredAt ? dayjs(location.discoveredAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发现人">
              <Space>
                <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                  {location?.discoveredByName?.[0] || '?'}
                </Avatar>
                {location?.discoveredByName || '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="预计签约日期">
              {location?.expectedSignDate ? dayjs(location.expectedSignDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
          </Descriptions>
          
          {location?.notes && (
            <div style={{ marginTop: 16 }}>
              <Title level={5}>备注信息</Title>
              <Paragraph>{location.notes}</Paragraph>
            </div>
          )}
        </Col>
        
        <Col span={8}>
          {/* 统计卡片 */}
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="跟进次数"
                  value={followUpRecords.length}
                  prefix={<PhoneOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="商务条件"
                  value={businessConditions.length}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="跟进天数"
                  value={location?.discoveredAt ? dayjs().diff(dayjs(location.discoveredAt), 'days') : 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <Statistic
                  title="照片数量"
                  value={location?.photos?.length || 0}
                  prefix={<CameraOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          
          {/* 快捷操作 */}
          <Card title="快捷操作" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PhoneOutlined />} 
                block 
                onClick={() => setShowFollowUpModal(true)}
              >
                添加跟进记录
              </Button>
              <Button 
                icon={<StarOutlined />} 
                block 
                onClick={() => setShowScoreModal(true)}
              >
                更新评分
              </Button>
              <Divider style={{ margin: '8px 0' }} />
              <Button.Group style={{ width: '100%' }}>
                <Button 
                  style={{ flex: 1 }}
                  onClick={() => handleStatusChange('INVESTIGATING')}
                >
                  开始调研
                </Button>
                <Button 
                  style={{ flex: 1 }}
                  onClick={() => handleStatusChange('NEGOTIATING')}
                >
                  进入谈判
                </Button>
              </Button.Group>
              <Button.Group style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  style={{ flex: 1 }}
                  onClick={() => handleStatusChange('APPROVED')}
                >
                  通过审核
                </Button>
                <Button 
                  danger 
                  style={{ flex: 1 }}
                  onClick={() => handleStatusChange('REJECTED')}
                >
                  拒绝
                </Button>
              </Button.Group>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  )

  const renderPhotos = () => (
    <Card title="现场照片" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        {location?.photos?.map((photo: any, index: number) => (
          <Col span={6} key={index}>
            <div style={{ position: 'relative' }}>
              <Image
                src={photo.url}
                alt={`照片${index + 1}`}
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }}
                preview={{
                  mask: <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>查看大图</div>
                }}
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.8)' }}
                onClick={() => handlePhotoDelete(photo.id)}
              />
            </div>
          </Col>
        ))}
        <Col span={6}>
          <Upload
            name="photos"
            listType="picture-card"
            className="photo-uploader"
            showUploadList={false}
            action="/api/upload"
            beforeUpload={(file) => {
              const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
              if (!isJpgOrPng) {
                message.error('只能上传 JPG/PNG 格式的图片!')
              }
              const isLt5M = file.size / 1024 / 1024 < 5
              if (!isLt5M) {
                message.error('图片大小不能超过 5MB!')
              }
              return isJpgOrPng && isLt5M
            }}
            onChange={handlePhotoUpload}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传照片</div>
            </div>
          </Upload>
        </Col>
      </Row>
    </Card>
  )

  const renderFollowUpRecords = () => (
    <Card title="跟进记录" style={{ marginBottom: 16 }}>
      <Timeline
        items={followUpRecords.map((record: FollowUpRecord) => ({
          color: followUpTypeMap[record.type as keyof typeof followUpTypeMap]?.color || 'blue',
          dot: followUpTypeMap[record.type as keyof typeof followUpTypeMap]?.icon,
          children: (
            <div>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <Tag color={followUpTypeMap[record.type as keyof typeof followUpTypeMap]?.color}>
                    {followUpTypeMap[record.type as keyof typeof followUpTypeMap]?.text}
                  </Tag>
                  <Text type="secondary">
                    {dayjs(record.createdAt).format('MM-DD HH:mm')}
                  </Text>
                  <Text type="secondary">
                    {record.createdByName}
                  </Text>
                </Space>
              </div>
              <Paragraph style={{ margin: 0 }}>
                {record.content}
              </Paragraph>
              {record.nextActionDate && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  下次跟进：{dayjs(record.nextActionDate).format('MM-DD HH:mm')}
                </Text>
              )}
            </div>
          )
        }))}
      />
      
      {followUpRecords.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <PhoneOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>暂无跟进记录</div>
          <Button type="link" onClick={() => setShowFollowUpModal(true)}>
            添加第一条跟进记录
          </Button>
        </div>
      )}
    </Card>
  )

  const renderBusinessConditions = () => (
    <Card title="商务条件" style={{ marginBottom: 16 }}>
      {businessConditions.length > 0 ? (
        <Row gutter={[16, 16]}>
          {businessConditions.map((condition: any, index: number) => (
            <Col span={8} key={index}>
              <Card size="small">
                <Statistic
                  title={condition.type}
                  value={condition.amount}
                  precision={2}
                  prefix="¥"
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">{condition.description}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <DollarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>暂无商务条件</div>
        </div>
      )}
    </Card>
  )

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <>
          {renderBasicInfo()}
          {renderPhotos()}
        </>
      )
    },
    {
      key: 'followup',
      label: `跟进记录 (${followUpRecords.length})`,
      children: renderFollowUpRecords()
    },
    {
      key: 'business',
      label: `商务条件 (${businessConditions.length})`,
      children: renderBusinessConditions()
    }
  ]

  return (
    <div>
      {/* 页面头部 */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          <Divider type="vertical" />
          <Title level={3} style={{ margin: 0 }}>
            {location?.name || '候选点位详情'}
          </Title>
          <Tag 
            color={statusMap[location?.status as keyof typeof statusMap]?.color}
            icon={statusMap[location?.status as keyof typeof statusMap]?.icon}
          >
            {statusMap[location?.status as keyof typeof statusMap]?.text}
          </Tag>
        </Space>

        <Space>
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            编辑
          </Button>
          <Button icon={<ShareAltOutlined />}>
            分享
          </Button>
          <Button icon={<DownloadOutlined />}>
            导出报告
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除
          </Button>
        </Space>
      </div>

      {/* 标签页内容 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* 评分模态框 */}
      <Modal
        title="更新评分"
        open={showScoreModal}
        onCancel={() => setShowScoreModal(false)}
        footer={null}
      >
        <Form
          form={scoreForm}
          layout="vertical"
          onFinish={handleScoreSubmit}
          initialValues={{ score: location?.score || 5 }}
        >
          <Form.Item 
            name="score" 
            label="综合评分"
            rules={[{ required: true, message: '请输入评分' }]}
          >
            <InputNumber
              min={0}
              max={10}
              step={0.1}
              style={{ width: '100%' }}
              placeholder="0-10分"
            />
          </Form.Item>
          
          <Form.Item name="comments" label="评价意见">
            <TextArea rows={4} placeholder="请输入评价意见..." />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowScoreModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 跟进记录模态框 */}
      <Modal
        title="添加跟进记录"
        open={showFollowUpModal}
        onCancel={() => setShowFollowUpModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={followUpForm}
          layout="vertical"
          onFinish={handleFollowUpSubmit}
        >
          <Form.Item 
            name="type" 
            label="跟进类型"
            rules={[{ required: true, message: '请选择跟进类型' }]}
          >
            <Select placeholder="请选择跟进类型">
              <Select.Option value="SITE_VISIT">实地考察</Select.Option>
              <Select.Option value="NEGOTIATION">商务谈判</Select.Option>
              <Select.Option value="DOCUMENT_REVIEW">资料审核</Select.Option>
              <Select.Option value="DECISION">决策讨论</Select.Option>
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
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowFollowUpModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CandidateLocationDetail