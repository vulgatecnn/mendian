import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Descriptions,
  Modal,
  Tabs
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  UserOutlined,
  TeamOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ShopOutlined
} from '@ant-design/icons'
import { DataTable, FormModal, ImportExport } from '@/components/common/crud'
import type { FormField, FormModalRef, SearchField } from '@/components/common/crud'
import PageHeader from '@/components/common/PageHeader'
import { BasicDataApiService } from '@/services/api/basicData'
import { useDevice } from '@/hooks/useDevice'
import type { Customer, CustomerContract } from '@/services/types'

const { Title, Text } = Typography
const { TabPane } = Tabs

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  customersByCategory: Array<{
    category: string
    count: number
  }>
  customersByType: Array<{
    type: string
    count: number
  }>
  totalContracts: number
}

const CustomerManagement: React.FC = () => {
  const { isMobile } = useDevice()
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    customersByCategory: [],
    customersByType: [],
    totalContracts: 0
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    onChange: (page: number, pageSize: number) => {
      setQueryParams({ ...queryParams, page, pageSize })
    }
  })
  const [queryParams, setQueryParams] = useState({
    page: 1,
    pageSize: 10
  })
  
  // 表单相关
  const [formVisible, setFormVisible] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const formRef = useRef<FormModalRef>(null)
  
  // 详情相关
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // 导入导出
  const [importVisible, setImportVisible] = useState(false)
  
  // 客户类型和分类配置
  const CUSTOMER_TYPE_CONFIG = {
    individual: { name: '个人', color: 'blue', icon: <UserOutlined /> },
    company: { name: '企业', color: 'green', icon: <TeamOutlined /> }
  }
  
  const CUSTOMER_CATEGORY_CONFIG = {
    franchisee: { name: '加盟商', color: 'gold' },
    partner: { name: '合作伙伴', color: 'blue' },
    supplier: { name: '供应商', color: 'purple' },
    other: { name: '其他', color: 'default' }
  }
  
  // 加载客户数据
  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await BasicDataApiService.getCustomers(queryParams)
      if (response.code === 200) {
        setCustomers(response.data)
        setPagination(prev => ({
          ...prev,
          current: response.pagination.page,
          total: response.pagination.total
        }))
      }
    } catch (error) {
      console.error('加载客户数据失败:', error)
      message.error('加载客户数据失败')
    } finally {
      setLoading(false)
    }
  }, [queryParams])
  
  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      // 这里模拟统计数据，实际项目中应该调用API
      const stats: CustomerStats = {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.status === 'active').length,
        customersByCategory: Object.values(
          customers.reduce((acc, customer) => {
            const key = customer.category
            if (!acc[key]) {
              acc[key] = { category: key, count: 0 }
            }
            acc[key].count++
            return acc
          }, {} as Record<string, { category: string; count: number }>)
        ),
        customersByType: Object.values(
          customers.reduce((acc, customer) => {
            const key = customer.type
            if (!acc[key]) {
              acc[key] = { type: key, count: 0 }
            }
            acc[key].count++
            return acc
          }, {} as Record<string, { type: string; count: number }>)
        ),
        totalContracts: customers.reduce((total, customer) => total + customer.contracts.length, 0)
      }
      setStats(stats)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }, [customers])
  
  // 初始化
  React.useEffect(() => {
    loadCustomers()
  }, [loadCustomers])
  
  React.useEffect(() => {
    loadStats()
  }, [loadStats])
  
  // 搜索字段配置
  const searchFields: SearchField[] = [
    {
      name: 'keyword',
      label: '关键字',
      type: 'input',
      placeholder: '搜索客户名称、编码或联系人'
    },
    {
      name: 'type',
      label: '客户类型',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '个人', value: 'individual' },
        { label: '企业', value: 'company' }
      ]
    },
    {
      name: 'category',
      label: '客户分类',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '加盟商', value: 'franchisee' },
        { label: '合作伙伴', value: 'partner' },
        { label: '供应商', value: 'supplier' },
        { label: '其他', value: 'other' }
      ]
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '活跃', value: 'active' },
        { label: '非活跃', value: 'inactive' },
        { label: '潜在', value: 'potential' }
      ]
    }
  ]
  
  // 表单字段配置
  const formFields: FormField[] = [
    {
      name: 'name',
      label: '客户名称',
      type: 'input',
      required: true,
      placeholder: '请输入客户名称',
      span: 12
    },
    {
      name: 'code',
      label: '客户编码',
      type: 'input',
      required: true,
      placeholder: '请输入客户编码',
      disabled: formMode === 'edit',
      span: 12
    },
    {
      name: 'type',
      label: '客户类型',
      type: 'select',
      required: true,
      options: [
        { label: '个人', value: 'individual' },
        { label: '企业', value: 'company' }
      ],
      span: 12
    },
    {
      name: 'category',
      label: '客户分类',
      type: 'select',
      required: true,
      options: [
        { label: '加盟商', value: 'franchisee' },
        { label: '合作伙伴', value: 'partner' },
        { label: '供应商', value: 'supplier' },
        { label: '其他', value: 'other' }
      ],
      span: 12
    },
    {
      name: 'contactInfo.contact',
      label: '联系人',
      type: 'input',
      required: true,
      placeholder: '请输入联系人',
      span: 12
    },
    {
      name: 'contactInfo.phone',
      label: '联系电话',
      type: 'phone',
      required: true,
      placeholder: '请输入联系电话',
      span: 12
    },
    {
      name: 'contactInfo.email',
      label: '邮箱',
      type: 'email',
      placeholder: '请输入邮箱',
      span: 12
    },
    {
      name: 'contactInfo.wechat',
      label: '微信',
      type: 'input',
      placeholder: '请输入微信号',
      span: 12
    },
    {
      name: 'contactInfo.address',
      label: '联系地址',
      type: 'input',
      placeholder: '请输入联系地址',
      span: 24
    },
    {
      name: 'contactInfo.idNumber',
      label: '身份证号',
      type: 'input',
      placeholder: '请输入身份证号（个人客户）',
      span: 12,
      visible: (values) => values.type === 'individual'
    },
    // 企业信息字段
    {
      name: 'businessInfo.companyName',
      label: '企业名称',
      type: 'input',
      required: true,
      placeholder: '请输入企业名称',
      span: 12,
      visible: (values) => values.type === 'company'
    },
    {
      name: 'businessInfo.businessLicense',
      label: '营业执照号',
      type: 'input',
      placeholder: '请输入营业执照号',
      span: 12,
      visible: (values) => values.type === 'company'
    },
    {
      name: 'businessInfo.taxNumber',
      label: '税号',
      type: 'input',
      placeholder: '请输入税号',
      span: 12,
      visible: (values) => values.type === 'company'
    },
    {
      name: 'businessInfo.legalPerson',
      label: '法人代表',
      type: 'input',
      placeholder: '请输入法人代表',
      span: 12,
      visible: (values) => values.type === 'company'
    },
    {
      name: 'businessInfo.registeredAddress',
      label: '注册地址',
      type: 'input',
      placeholder: '请输入注册地址',
      span: 24,
      visible: (values) => values.type === 'company'
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      required: true,
      options: [
        { label: '活跃', value: 'active' },
        { label: '非活跃', value: 'inactive' },
        { label: '潜在', value: 'potential' }
      ],
      span: 12
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      placeholder: '请输入备注信息',
      span: 24
    }
  ]
  
  // 表格列配置
  const columns = useMemo(() => [
    {
      title: '客户信息',
      key: 'info',
      render: (_: any, record: Customer) => (
        <Space direction="vertical" size={2}>
          <Space>
            {CUSTOMER_TYPE_CONFIG[record.type]?.icon}
            <Text strong>{record.name}</Text>
            <Text type="secondary">({record.code})</Text>
          </Space>
          <Space>
            <Tag color={CUSTOMER_TYPE_CONFIG[record.type]?.color}>
              {CUSTOMER_TYPE_CONFIG[record.type]?.name}
            </Tag>
            <Tag color={CUSTOMER_CATEGORY_CONFIG[record.category]?.color}>
              {CUSTOMER_CATEGORY_CONFIG[record.category]?.name}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '联系信息',
      key: 'contact',
      render: (_: any, record: Customer) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <Text>{record.contactInfo.contact}</Text>
          </Space>
          <Space size={4}>
            <PhoneOutlined style={{ color: '#52c41a' }} />
            <Text>{record.contactInfo.phone}</Text>
          </Space>
          {record.contactInfo.email && (
            <Space size={4}>
              <MailOutlined style={{ color: '#fa541c' }} />
              <Text>{record.contactInfo.email}</Text>
            </Space>
          )}
        </Space>
      )
    },
    {
      title: '合同数量',
      key: 'contracts',
      render: (_: any, record: Customer) => (
        <Space direction="vertical" size={2}>
          <Space>
            <FileTextOutlined style={{ color: '#722ed1' }} />
            <Text>共 {record.contracts.length} 个合同</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.contracts.filter(c => c.status === 'active').length} 个有效
          </Text>
        </Space>
      )
    },
    {
      title: '关联门店',
      key: 'stores',
      render: (_: any, record: Customer) => (
        <Space>
          <ShopOutlined style={{ color: '#13c2c2' }} />
          <Text>{record.stores?.length || 0} 家门店</Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Customer['status']) => {
        const statusConfig = {
          active: { color: 'green', text: '活跃' },
          inactive: { color: 'red', text: '非活跃' },
          potential: { color: 'orange', text: '潜在' }
        }
        const config = statusConfig[status]
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (
        <Text style={{ fontSize: 12 }}>
          {new Date(text).toLocaleDateString()}
        </Text>
      )
    }
  ], [])
  
  // 操作配置
  const actions = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: Customer) => {
        setSelectedCustomer(record)
        setDetailVisible(true)
      }
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: Customer) => {
        setFormMode('edit')
        setEditingCustomer(record)
        setFormVisible(true)
        
        setTimeout(() => {
          formRef.current?.setFieldsValue({
            name: record.name,
            code: record.code,
            type: record.type,
            category: record.category,
            contactInfo: record.contactInfo,
            businessInfo: record.businessInfo,
            status: record.status,
            notes: record.notes
          })
        }, 100)
      }
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (record: Customer) => {
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除客户"${record.name}"吗？删除后无法恢复。`,
          onOk: async () => {
            try {
              const response = await BasicDataApiService.deleteCustomer(record.id)
              if (response.code === 200) {
                message.success('删除成功')
                loadCustomers()
              }
            } catch (error) {
              console.error('删除失败:', error)
              message.error('删除失败')
            }
          }
        })
      }
    }
  ]
  
  // 批量操作配置
  const batchActions = [
    {
      key: 'activate',
      label: '批量激活',
      onClick: async (selectedKeys: React.Key[]) => {
        // 实现批量激活逻辑
        message.success(`已激活 ${selectedKeys.length} 个客户`)
        loadCustomers()
      }
    },
    {
      key: 'deactivate',
      label: '批量禁用',
      danger: true,
      confirm: {
        title: '确认批量禁用',
        description: '禁用后客户将无法进行业务操作'
      },
      onClick: async (selectedKeys: React.Key[]) => {
        // 实现批量禁用逻辑
        message.success(`已禁用 ${selectedKeys.length} 个客户`)
        loadCustomers()
      }
    }
  ]
  
  // 创建客户
  const handleCreate = useCallback(() => {
    setFormMode('create')
    setEditingCustomer(null)
    setFormVisible(true)
    
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        type: 'individual',
        category: 'franchisee',
        status: 'active'
      })
    }, 100)
  }, [])
  
  // 提交表单
  const handleSubmit = useCallback(async (values: any) => {
    try {
      if (formMode === 'create') {
        const response = await BasicDataApiService.createCustomer({
          ...values,
          createdBy: 'current-user', // 实际应用中从用户状态获取
          createdByName: '当前用户'
        })
        if (response.code === 200) {
          message.success('创建成功')
          setFormVisible(false)
          loadCustomers()
        }
      } else if (formMode === 'edit' && editingCustomer) {
        const response = await BasicDataApiService.updateCustomer(editingCustomer.id, values)
        if (response.code === 200) {
          message.success('更新成功')
          setFormVisible(false)
          loadCustomers()
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }, [formMode, editingCustomer, loadCustomers])
  
  // 搜索处理
  const handleSearch = useCallback((values: any) => {
    setQueryParams({ ...queryParams, page: 1, ...values })
  }, [queryParams])
  
  // 重置搜索
  const handleReset = useCallback(() => {
    setQueryParams({ page: 1, pageSize: 10 })
  }, [])
  
  // 刷新数据
  const handleRefresh = useCallback(() => {
    loadCustomers()
  }, [loadCustomers])
  
  // 导出数据
  const handleExport = useCallback(async () => {
    // 实现导出逻辑
    message.success('导出成功')
  }, [])
  
  // 渲染合同列表
  const renderContracts = (contracts: CustomerContract[]) => (
    <div>
      {contracts.map(contract => (
        <Card key={contract.id} size="small" style={{ marginBottom: 8 }}>
          <Row>
            <Col span={12}>
              <Text strong>{contract.name}</Text>
              <br />
              <Text type="secondary">类型: {contract.type}</Text>
            </Col>
            <Col span={12}>
              <Tag color={
                contract.status === 'active' ? 'green' :
                contract.status === 'expired' ? 'red' : 'orange'
              }>
                {contract.status === 'active' ? '有效' :
                 contract.status === 'expired' ? '已过期' : '草稿'}
              </Tag>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {contract.startDate} ~ {contract.endDate || '无限期'}
              </Text>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  )
  
  return (
    <div>
      <PageHeader
        title="客户管理"
        description="管理加盟商、合作伙伴等客户信息及合作关系"
        breadcrumbs={[{ title: '基础数据' }, { title: '客户管理' }]}
      />
      
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总客户数"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="活跃客户"
              value={stats.activeCustomers}
              valueStyle={{ color: '#3f8600' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="合同总数"
              value={stats.totalContracts}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>客户分类</Text>
              <Space wrap>
                {stats.customersByCategory.map(item => (
                  <Tag key={item.category} color={CUSTOMER_CATEGORY_CONFIG[item.category as keyof typeof CUSTOMER_CATEGORY_CONFIG]?.color}>
                    {CUSTOMER_CATEGORY_CONFIG[item.category as keyof typeof CUSTOMER_CATEGORY_CONFIG]?.name}: {item.count}
                  </Tag>
                ))}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
      
      {/* 数据表格 */}
      <DataTable
        title="客户列表"
        dataSource={customers}
        columns={columns}
        loading={loading}
        pagination={pagination}
        rowSelection={true}
        searchFields={searchFields}
        onSearch={handleSearch}
        onReset={handleReset}
        actions={actions}
        batchActions={batchActions}
        onCreate={handleCreate}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onImport={() => setImportVisible(true)}
        createPermission="customer:create"
        exportPermission="customer:export"
        importPermission="customer:import"
      />
      
      {/* 表单模态框 */}
      <FormModal
        ref={formRef}
        title={formMode === 'create' ? '新建客户' : '编辑客户'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleSubmit}
        fields={formFields}
        width={800}
      />
      
      {/* 客户详情模态框 */}
      <Modal
        title="客户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedCustomer && (
          <Tabs>
            <TabPane tab="基本信息" key="basic">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="客户名称">
                  {selectedCustomer.name}
                </Descriptions.Item>
                <Descriptions.Item label="客户编码">
                  {selectedCustomer.code}
                </Descriptions.Item>
                <Descriptions.Item label="客户类型">
                  <Tag color={CUSTOMER_TYPE_CONFIG[selectedCustomer.type]?.color}>
                    {CUSTOMER_TYPE_CONFIG[selectedCustomer.type]?.name}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="客户分类">
                  <Tag color={CUSTOMER_CATEGORY_CONFIG[selectedCustomer.category]?.color}>
                    {CUSTOMER_CATEGORY_CONFIG[selectedCustomer.category]?.name}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="联系人">
                  {selectedCustomer.contactInfo.contact}
                </Descriptions.Item>
                <Descriptions.Item label="联系电话">
                  {selectedCustomer.contactInfo.phone}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {selectedCustomer.contactInfo.email || '未填写'}
                </Descriptions.Item>
                <Descriptions.Item label="微信">
                  {selectedCustomer.contactInfo.wechat || '未填写'}
                </Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>
                  {selectedCustomer.contactInfo.address || '未填写'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={
                    selectedCustomer.status === 'active' ? 'green' :
                    selectedCustomer.status === 'inactive' ? 'red' : 'orange'
                  }>
                    {selectedCustomer.status === 'active' ? '活跃' :
                     selectedCustomer.status === 'inactive' ? '非活跃' : '潜在'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(selectedCustomer.createdAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
              
              {selectedCustomer.businessInfo && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>企业信息</Title>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="企业名称">
                      {selectedCustomer.businessInfo.companyName}
                    </Descriptions.Item>
                    <Descriptions.Item label="营业执照">
                      {selectedCustomer.businessInfo.businessLicense || '未填写'}
                    </Descriptions.Item>
                    <Descriptions.Item label="税号">
                      {selectedCustomer.businessInfo.taxNumber || '未填写'}
                    </Descriptions.Item>
                    <Descriptions.Item label="法人代表">
                      {selectedCustomer.businessInfo.legalPerson || '未填写'}
                    </Descriptions.Item>
                    <Descriptions.Item label="注册地址" span={2}>
                      {selectedCustomer.businessInfo.registeredAddress || '未填写'}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              )}
            </TabPane>
            
            <TabPane tab={`合同信息 (${selectedCustomer.contracts.length})`} key="contracts">
              {selectedCustomer.contracts.length > 0 ? (
                renderContracts(selectedCustomer.contracts)
              ) : (
                <Text type="secondary">暂无合同信息</Text>
              )}
            </TabPane>
            
            <TabPane tab={`关联门店 (${selectedCustomer.stores?.length || 0})`} key="stores">
              {selectedCustomer.stores && selectedCustomer.stores.length > 0 ? (
                <div>
                  {selectedCustomer.stores.map(storeId => (
                    <Card key={storeId} size="small" style={{ marginBottom: 8 }}>
                      <Text>门店ID: {storeId}</Text>
                    </Card>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无关联门店</Text>
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
      
      {/* 导入导出 */}
      <ImportExport
        type="import"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        title="客户数据导入"
        importConfig={{
          accept: '.xlsx,.xls,.csv',
          maxSize: 10 * 1024 * 1024,
          templateUrl: '/templates/customers-template.xlsx',
          templateFields: [
            { key: 'name', title: '客户名称', required: true, type: 'string', example: '张三' },
            { key: 'code', title: '客户编码', required: true, type: 'string', example: 'CUS001' },
            { key: 'type', title: '客户类型', required: true, type: 'string', example: 'individual' },
            { key: 'category', title: '客户分类', required: true, type: 'string', example: 'franchisee' },
            { key: 'contact', title: '联系人', required: true, type: 'string', example: '张三' },
            { key: 'phone', title: '联系电话', required: true, type: 'string', example: '13800138000' }
          ],
          onImport: async (file: File) => ({
            success: true,
            total: 0,
            successCount: 0,
            failCount: 0,
            errors: [],
            warnings: []
          })
        }}
      />
    </div>
  )
}

export default CustomerManagement