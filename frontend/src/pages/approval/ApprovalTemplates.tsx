import React, { useState, useMemo, useCallback } from 'react'
import {
  Button,
  Card,
  Space,
  Tag,
  Form,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Dropdown,
  Badge,
  Tooltip,
  Empty,
  Spin,
  Switch,
  Divider,
  Avatar,
  List,
  Typography,
  Popconfirm,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  CopyOutlined,
  FilterOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  NodeIndexOutlined,
  SettingOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import { approvalService } from '@/services/approvalService'
import type { ApprovalTemplate } from '@/types/approval'
import dayjs from 'dayjs'
import styles from './ApprovalTemplates.module.css'

const { Option } = Select
const { Search } = Input
const { Text, Title, Paragraph } = Typography

// 业务类型配置
const BUSINESS_TYPE_CONFIG = {
  store_application: { 
    label: '报店审批', 
    color: 'blue', 
    icon: <FileTextOutlined /> 
  },
  license_approval: { 
    label: '执照审批', 
    color: 'green', 
    icon: <CheckCircleOutlined /> 
  },
  price_comparison: { 
    label: '比价审批', 
    color: 'orange', 
    icon: <NodeIndexOutlined /> 
  },
  contract_approval: { 
    label: '合同审批', 
    color: 'purple', 
    icon: <FileTextOutlined /> 
  },
  budget_approval: { 
    label: '预算审批', 
    color: 'gold', 
    icon: <NodeIndexOutlined /> 
  },
  personnel_approval: { 
    label: '人事审批', 
    color: 'cyan', 
    icon: <TeamOutlined /> 
  },
  other: { 
    label: '其他', 
    color: 'default', 
    icon: <MoreOutlined /> 
  }
} as const

interface QueryParams {
  keyword?: string
  businessType?: string
  category?: string
  isActive?: boolean
}

interface TemplateFormData {
  name: string
  category: string
  description: string
  businessType: ApprovalTemplate['businessType']
  isActive: boolean
}

const ApprovalTemplates: React.FC = () => {
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  
  // 状态管理
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [queryParams, setQueryParams] = useState<QueryParams>({})
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  
  // 弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<ApprovalTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // 统计数据
  const statisticsData = useMemo(() => {
    const total = templates.length
    const active = templates.filter(t => t.isActive).length
    const inactive = total - active
    
    const byBusinessType = templates.reduce((acc, template) => {
      const type = template.businessType
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      active,
      inactive,
      byBusinessType
    }
  }, [templates])

  // 过滤后的模板列表
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      if (queryParams.keyword) {
        const keyword = queryParams.keyword.toLowerCase()
        if (
          !template.name.toLowerCase().includes(keyword) &&
          !template.description.toLowerCase().includes(keyword) &&
          !template.category.toLowerCase().includes(keyword)
        ) {
          return false
        }
      }
      
      if (queryParams.businessType && template.businessType !== queryParams.businessType) {
        return false
      }
      
      if (queryParams.category && template.category !== queryParams.category) {
        return false
      }
      
      if (queryParams.isActive !== undefined && template.isActive !== queryParams.isActive) {
        return false
      }
      
      return true
    })
  }, [templates, queryParams])

  // 加载模板列表
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const result = await approvalService.listTemplates()
      setTemplates(result)
    } catch (error) {
      message.error('加载模板列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化加载
  React.useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // 搜索处理
  const handleSearch = (values: any) => {
    setQueryParams({
      ...queryParams,
      ...values
    })
  }

  // 重置搜索
  const handleReset = () => {
    form.resetFields()
    setQueryParams({})
  }

  // 创建新模板
  const handleCreate = () => {
    setCurrentTemplate(null)
    setIsEditing(false)
    editForm.resetFields()
    editForm.setFieldsValue({
      isActive: true,
      businessType: 'store_application'
    })
    setEditModalVisible(true)
  }

  // 编辑模板
  const handleEdit = (template: ApprovalTemplate) => {
    setCurrentTemplate(template)
    setIsEditing(true)
    editForm.setFieldsValue({
      name: template.name,
      category: template.category,
      description: template.description,
      businessType: template.businessType,
      isActive: template.isActive
    })
    setEditModalVisible(true)
  }

  // 预览模板
  const handlePreview = (template: ApprovalTemplate) => {
    setCurrentTemplate(template)
    setPreviewModalVisible(true)
  }

  // 复制模板
  const handleClone = async (template: ApprovalTemplate) => {
    try {
      const clonedTemplate = {
        ...template,
        name: `${template.name}_副本`,
        category: template.category,
        description: template.description,
        businessType: template.businessType,
        isActive: false,
        nodes: template.nodes.map(node => ({
          ...node,
          id: `${node.id}_clone_${Date.now()}`
        })),
        formConfig: template.formConfig
      }
      
      await approvalService.createTemplate(clonedTemplate)
      message.success('模板复制成功')
      fetchTemplates()
    } catch (error) {
      message.error('模板复制失败')
      console.error(error)
    }
  }

  // 启用/禁用模板
  const handleToggleStatus = async (template: ApprovalTemplate) => {
    try {
      await approvalService.updateTemplate(template.id, {
        isActive: !template.isActive
      })
      message.success(template.isActive ? '模板已禁用' : '模板已启用')
      fetchTemplates()
    } catch (error) {
      message.error('状态更新失败')
      console.error(error)
    }
  }

  // 删除模板
  const handleDelete = async (template: ApprovalTemplate) => {
    try {
      await approvalService.deleteTemplate(template.id)
      message.success('模板删除成功')
      fetchTemplates()
    } catch (error) {
      message.error('模板删除失败')
      console.error(error)
    }
  }

  // 保存模板
  const handleSave = async (values: TemplateFormData) => {
    try {
      if (isEditing && currentTemplate) {
        await approvalService.updateTemplate(currentTemplate.id, values)
        message.success('模板更新成功')
      } else {
        const templateData = {
          ...values,
          nodes: [],
          formConfig: {
            fields: [],
            layout: 'vertical' as const,
            sections: []
          }
        }
        await approvalService.createTemplate(templateData)
        message.success('模板创建成功')
      }
      
      setEditModalVisible(false)
      fetchTemplates()
    } catch (error) {
      message.error(isEditing ? '模板更新失败' : '模板创建失败')
      console.error(error)
    }
  }

  // 模板验证
  const handleValidateTemplate = async (template: ApprovalTemplate) => {
    try {
      const result = await approvalService.validateTemplate(template)
      if (result.valid) {
        message.success('模板配置正确')
      } else {
        Modal.warning({
          title: '模板配置问题',
          content: (
            <div>
              {result.errors.length > 0 && (
                <div>
                  <strong>错误：</strong>
                  <ul>
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.warnings.length > 0 && (
                <div>
                  <strong>警告：</strong>
                  <ul>
                    {result.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })
      }
    } catch (error) {
      message.error('模板验证失败')
      console.error(error)
    }
  }

  // 渲染模板卡片
  const renderTemplateCard = (template: ApprovalTemplate) => {
    const businessTypeConfig = BUSINESS_TYPE_CONFIG[template.businessType]
    
    const actions = [
      <Tooltip title="预览" key="preview">
        <EyeOutlined onClick={() => handlePreview(template)} />
      </Tooltip>,
      <Tooltip title="编辑" key="edit">
        <EditOutlined onClick={() => handleEdit(template)} />
      </Tooltip>,
      <Tooltip title="复制" key="clone">
        <CopyOutlined onClick={() => handleClone(template)} />
      </Tooltip>,
      <Dropdown
        key="more"
        menu={{
          items: [
            {
              key: 'validate',
              label: '验证配置',
              icon: <CheckCircleOutlined />,
              onClick: () => handleValidateTemplate(template)
            },
            {
              key: 'toggle',
              label: template.isActive ? '禁用模板' : '启用模板',
              icon: template.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
              onClick: () => handleToggleStatus(template)
            },
            {
              type: 'divider'
            },
            {
              key: 'delete',
              label: '删除模板',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除模板"${template.name}"吗？此操作无法恢复。`,
                  okText: '确定',
                  cancelText: '取消',
                  okButtonProps: { danger: true },
                  onOk: () => handleDelete(template)
                })
              }
            }
          ]
        }}
        trigger={['click']}
      >
        <MoreOutlined />
      </Dropdown>
    ]

    return (
      <Card
        hoverable
        actions={actions}
        className={styles.templateCard}
        style={{ height: '100%' }}
      >
        <Card.Meta
          avatar={
            <Avatar
              icon={businessTypeConfig.icon}
              style={{ 
                backgroundColor: businessTypeConfig.color === 'blue' ? '#1890ff' : 
                                businessTypeConfig.color === 'green' ? '#52c41a' :
                                businessTypeConfig.color === 'orange' ? '#fa8c16' :
                                businessTypeConfig.color === 'purple' ? '#722ed1' :
                                businessTypeConfig.color === 'gold' ? '#faad14' :
                                businessTypeConfig.color === 'cyan' ? '#13c2c2' : '#d9d9d9'
              }}
            />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{template.name}</span>
              <Badge 
                status={template.isActive ? 'success' : 'default'} 
                text={template.isActive ? '已启用' : '已禁用'} 
              />
            </div>
          }
          description={
            <div>
              <Paragraph ellipsis={{ rows: 2, tooltip: template.description }}>
                {template.description}
              </Paragraph>
              <div style={{ marginTop: 8 }}>
                <Space size="small">
                  <Tag color={businessTypeConfig.color}>{businessTypeConfig.label}</Tag>
                  <Tag>{template.category}</Tag>
                </Space>
              </div>
            </div>
          }
        />
        <div className={styles.templateStats}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="节点数"
                value={template.nodes.length}
                prefix={<NodeIndexOutlined />}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="表单字段"
                value={template.formConfig.fields.length}
                prefix={<FileTextOutlined />}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>更新时间</Text>
                <br />
                <Text style={{ fontSize: 12 }}>{dayjs(template.updateTime).format('MM-DD HH:mm')}</Text>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    )
  }

  // 渲染列表项
  const renderTemplateListItem = (template: ApprovalTemplate) => {
    const businessTypeConfig = BUSINESS_TYPE_CONFIG[template.businessType]
    
    return (
      <List.Item
        className={styles.templateListItem}
        actions={[
          <Button
            key="preview"
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(template)}
          >
            预览
          </Button>,
          <Button
            key="edit"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(template)}
          >
            编辑
          </Button>,
          <Button
            key="clone"
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleClone(template)}
          >
            复制
          </Button>,
          <Popconfirm
            key="delete"
            title={`确定要删除模板"${template.name}"吗？`}
            onConfirm={() => handleDelete(template)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar
              icon={businessTypeConfig.icon}
              style={{ 
                backgroundColor: businessTypeConfig.color === 'blue' ? '#1890ff' : 
                                businessTypeConfig.color === 'green' ? '#52c41a' :
                                businessTypeConfig.color === 'orange' ? '#fa8c16' :
                                businessTypeConfig.color === 'purple' ? '#722ed1' :
                                businessTypeConfig.color === 'gold' ? '#faad14' :
                                businessTypeConfig.color === 'cyan' ? '#13c2c2' : '#d9d9d9'
              }}
            />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{template.name}</span>
              <Badge 
                status={template.isActive ? 'success' : 'default'} 
                text={template.isActive ? '已启用' : '已禁用'} 
              />
              <Tag color={businessTypeConfig.color}>{businessTypeConfig.label}</Tag>
              <Tag>{template.category}</Tag>
            </div>
          }
          description={
            <div>
              <Paragraph ellipsis={{ rows: 1, tooltip: template.description }}>
                {template.description}
              </Paragraph>
              <Space size="large" style={{ marginTop: 4 }}>
                <Text type="secondary">
                  <NodeIndexOutlined style={{ marginRight: 4 }} />
                  {template.nodes.length} 个节点
                </Text>
                <Text type="secondary">
                  <FileTextOutlined style={{ marginRight: 4 }} />
                  {template.formConfig.fields.length} 个字段
                </Text>
                <Text type="secondary">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {dayjs(template.updateTime).format('YYYY-MM-DD HH:mm')}
                </Text>
              </Space>
            </div>
          }
        />
      </List.Item>
    )
  }

  return (
    <div>
      <PageHeader
        title="审批模板管理"
        description="管理审批流程模板，支持创建、编辑、复制和配置验证等功能"
        breadcrumbs={[{ title: '审批中心' }, { title: '模板管理' }]}
        extra={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchTemplates}>
            刷新
          </Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建模板
          </Button>
        ]}
      />

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总模板数"
              value={statisticsData.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已启用"
              value={statisticsData.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已禁用"
              value={statisticsData.inactive}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#d9d9d9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="业务类型"
              value={Object.keys(statisticsData.byBusinessType).length}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card className={styles.filterCard} style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col flex="auto">
              <Form.Item name="keyword">
                <Search
                  placeholder="搜索模板名称、分类、描述"
                  allowClear
                  style={{ width: 300 }}
                  onSearch={() => form.submit()}
                />
              </Form.Item>
            </Col>
            <Col>
              <Space>
                <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? '收起筛选' : '展开筛选'}
                </Button>
                <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Divider type="vertical" />
                <Button
                  icon={viewMode === 'card' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
                  onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
                >
                  {viewMode === 'card' ? '列表视图' : '卡片视图'}
                </Button>
              </Space>
            </Col>
          </Row>

          {showFilters && (
            <Row gutter={16} style={{ marginTop: 16, width: '100%' }}>
              <Col span={6}>
                <Form.Item name="businessType" label="业务类型">
                  <Select placeholder="请选择" allowClear>
                    {Object.entries(BUSINESS_TYPE_CONFIG).map(([key, config]) => (
                      <Option key={key} value={key}>
                        {config.icon} {config.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="category" label="分类">
                  <Select placeholder="请选择" allowClear>
                    {Array.from(new Set(templates.map(t => t.category))).map(category => (
                      <Option key={category} value={category}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="isActive" label="状态">
                  <Select placeholder="请选择" allowClear>
                    <Option value={true}>已启用</Option>
                    <Option value={false}>已禁用</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Card>

      {/* 模板列表 */}
      <Card>
        <Spin spinning={loading}>
          {filteredTemplates.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无模板"
              style={{ padding: '40px 0' }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                创建首个模板
              </Button>
            </Empty>
          ) : viewMode === 'card' ? (
            <Row gutter={[16, 16]}>
              {filteredTemplates.map(template => (
                <Col key={template.id} xs={24} sm={12} lg={8} xl={6}>
                  {renderTemplateCard(template)}
                </Col>
              ))}
            </Row>
          ) : (
            <List
              dataSource={filteredTemplates}
              renderItem={renderTemplateListItem}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
              }}
            />
          )}
        </Spin>
      </Card>

      {/* 编辑模板弹窗 */}
      <Modal
        title={isEditing ? '编辑模板' : '创建模板'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="模板分类"
            rules={[{ required: true, message: '请输入模板分类' }]}
          >
            <Input placeholder="如：店铺管理、人事管理等" />
          </Form.Item>

          <Form.Item
            name="businessType"
            label="业务类型"
            rules={[{ required: true, message: '请选择业务类型' }]}
          >
            <Select placeholder="请选择业务类型">
              {Object.entries(BUSINESS_TYPE_CONFIG).map(([key, config]) => (
                <Option key={key} value={key}>
                  {config.icon} {config.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="模板描述"
            rules={[{ required: true, message: '请输入模板描述' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请描述该模板的用途和适用场景"
            />
          </Form.Item>

          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {isEditing ? '更新' : '创建'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 预览模板弹窗 */}
      <Modal
        title="模板预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {currentTemplate && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" title="基本信息">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>模板名称：</Text>
                      <Text>{currentTemplate.name}</Text>
                    </div>
                    <div>
                      <Text strong>业务类型：</Text>
                      <Tag color={BUSINESS_TYPE_CONFIG[currentTemplate.businessType].color}>
                        {BUSINESS_TYPE_CONFIG[currentTemplate.businessType].label}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>分类：</Text>
                      <Tag>{currentTemplate.category}</Tag>
                    </div>
                    <div>
                      <Text strong>状态：</Text>
                      <Badge 
                        status={currentTemplate.isActive ? 'success' : 'default'} 
                        text={currentTemplate.isActive ? '已启用' : '已禁用'} 
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="统计信息">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="审批节点"
                        value={currentTemplate.nodes.length}
                        prefix={<NodeIndexOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="表单字段"
                        value={currentTemplate.formConfig.fields.length}
                        prefix={<FileTextOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="模板描述" style={{ marginBottom: 16 }}>
              <Paragraph>{currentTemplate.description}</Paragraph>
            </Card>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="审批节点">
                  {currentTemplate.nodes.length > 0 ? (
                    <List
                      dataSource={currentTemplate.nodes}
                      renderItem={(node, index) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar size="small">{index + 1}</Avatar>}
                            title={node.name}
                            description={
                              <Space>
                                <Tag color="blue">{node.type}</Tag>
                                <Text type="secondary">
                                  {node.nodeConfig.approvers.length} 人审批
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无审批节点" />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="表单字段">
                  {currentTemplate.formConfig.fields.length > 0 ? (
                    <List
                      dataSource={currentTemplate.formConfig.fields}
                      renderItem={field => (
                        <List.Item>
                          <List.Item.Meta
                            title={field.label}
                            description={
                              <Space>
                                <Tag color="green">{field.type}</Tag>
                                {field.required && <Tag color="red">必填</Tag>}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无表单字段" />
                  )}
                </Card>
              </Col>
            </Row>

            <Card size="small" title="创建信息" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>创建人：</Text>
                  <Text>{currentTemplate.creator}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>创建时间：</Text>
                  <Text>{dayjs(currentTemplate.createTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>更新时间：</Text>
                  <Text>{dayjs(currentTemplate.updateTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ApprovalTemplates