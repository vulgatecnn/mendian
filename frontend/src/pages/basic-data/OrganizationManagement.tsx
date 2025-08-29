import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  Card,
  Tree,
  Button,
  Space,
  Tag,
  Tooltip,
  Modal,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Input,
  Select,
  Avatar,
  Descriptions,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { DataTable, FormModal, ImportExport } from '@/components/common/crud'
import type { FormField, FormModalRef } from '@/components/common/crud'
import PageHeader from '@/components/common/PageHeader'
import { BasicDataApiService } from '@/services/api/basicData'
import { useDevice } from '@/hooks/useDevice'
import type { Organization } from '@/services/types'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface OrgTreeNode extends DataNode {
  organization: Organization
  children?: OrgTreeNode[]
}

interface OrganizationStats {
  totalOrganizations: number
  companies: number
  departments: number
  teams: number
  branches: number
}

const OrganizationManagement: React.FC = () => {
  const { isMobile } = useDevice()
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [treeData, setTreeData] = useState<OrgTreeNode[]>([])
  const [filteredTreeData, setFilteredTreeData] = useState<OrgTreeNode[]>([])
  const [stats, setStats] = useState<OrganizationStats>({
    totalOrganizations: 0,
    companies: 0,
    departments: 0,
    teams: 0,
    branches: 0
  })
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')
  
  // 表单相关
  const [formVisible, setFormVisible] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const formRef = useRef<FormModalRef>(null)
  
  // 导入导出
  const [importVisible, setImportVisible] = useState(false)
  
  // 组织类型配置
  const ORG_TYPE_CONFIG = {
    company: { name: '公司', color: 'red', icon: <BankOutlined /> },
    department: { name: '部门', color: 'blue', icon: <TeamOutlined /> },
    team: { name: '团队', color: 'green', icon: <UserOutlined /> },
    branch: { name: '分支机构', color: 'orange', icon: <BankOutlined /> }
  }
  
  // 转换组织数据为树形结构
  const transformToTreeData = useCallback((organizations: Organization[]): OrgTreeNode[] => {
    return organizations.map(org => ({
      key: org.id,
      title: (
        <Space>
          {ORG_TYPE_CONFIG[org.type]?.icon}
          <span>{org.name}</span>
          <Tag color={ORG_TYPE_CONFIG[org.type]?.color}>
            {ORG_TYPE_CONFIG[org.type]?.name}
          </Tag>
          <Text type="secondary">({org.code})</Text>
          {!org.enabled && <Tag color="red">已禁用</Tag>}
        </Space>
      ),
      organization: org,
      children: org.children ? transformToTreeData(org.children) : undefined,
      isLeaf: !org.children || org.children.length === 0
    }))
  }, [])
  
  // 树形搜索
  const searchTreeData = useCallback((data: OrgTreeNode[], searchValue: string): OrgTreeNode[] => {
    if (!searchValue) return data
    
    const filterNode = (node: OrgTreeNode): OrgTreeNode | null => {
      const { organization } = node
      const isMatch = organization.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                     organization.code.toLowerCase().includes(searchValue.toLowerCase())
      
      const filteredChildren = node.children
        ?.map(child => filterNode(child))
        .filter(Boolean) as OrgTreeNode[]
      
      if (isMatch || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren
        }
      }
      
      return null
    }
    
    return data.map(node => filterNode(node)).filter(Boolean) as OrgTreeNode[]
  }, [])
  
  // 加载组织数据
  const loadOrganizations = useCallback(async () => {
    setLoading(true)
    try {
      const response = await BasicDataApiService.getOrganizationTree()
      if (response.code === 200) {
        setOrganizations(response.data)
        const treeData = transformToTreeData(response.data)
        setTreeData(treeData)
        setFilteredTreeData(treeData)
        
        // 计算统计数据
        const calculateStats = (organizations: Organization[]): OrganizationStats => {
          const stats = { totalOrganizations: 0, companies: 0, departments: 0, teams: 0, branches: 0 }
          
          const traverse = (organizations: Organization[]) => {
            organizations.forEach(org => {
              stats.totalOrganizations++
              switch (org.type) {
                case 'company': stats.companies++; break
                case 'department': stats.departments++; break
                case 'team': stats.teams++; break
                case 'branch': stats.branches++; break
              }
              if (org.children) {
                traverse(org.children)
              }
            })
          }
          
          traverse(organizations)
          return stats
        }
        
        setStats(calculateStats(response.data))
        
        // 默认展开公司节点
        const companyKeys = response.data
          .filter(org => org.type === 'company')
          .map(org => org.id)
        setExpandedKeys(companyKeys)
      }
    } catch (error) {
      console.error('加载组织数据失败:', error)
      message.error('加载组织数据失败')
    } finally {
      setLoading(false)
    }
  }, [transformToTreeData])
  
  // 初始化
  React.useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])
  
  // 搜索处理
  React.useEffect(() => {
    const filtered = searchTreeData(treeData, searchValue)
    setFilteredTreeData(filtered)
    
    if (searchValue) {
      // 搜索时自动展开所有匹配的节点
      const expandKeys: React.Key[] = []
      const collectKeys = (nodes: OrgTreeNode[]) => {
        nodes.forEach(node => {
          expandKeys.push(node.key)
          if (node.children) {
            collectKeys(node.children)
          }
        })
      }
      collectKeys(filtered)
      setExpandedKeys(expandKeys)
    }
  }, [treeData, searchValue, searchTreeData])
  
  // 表单字段配置
  const formFields: FormField[] = [
    {
      name: 'name',
      label: '组织名称',
      type: 'input',
      required: true,
      placeholder: '请输入组织名称',
      span: 12
    },
    {
      name: 'code',
      label: '组织编码',
      type: 'input',
      required: true,
      placeholder: '请输入组织编码',
      disabled: formMode === 'edit',
      span: 12
    },
    {
      name: 'shortName',
      label: '简称',
      type: 'input',
      placeholder: '请输入简称',
      span: 12
    },
    {
      name: 'type',
      label: '组织类型',
      type: 'select',
      required: true,
      options: [
        { label: '公司', value: 'company' },
        { label: '部门', value: 'department' },
        { label: '团队', value: 'team' },
        { label: '分支机构', value: 'branch' }
      ],
      span: 12
    },
    {
      name: 'parentId',
      label: '上级组织',
      type: 'select',
      placeholder: '请选择上级组织（公司可不选）',
      options: [], // 动态生成
      span: 12,
      visible: (values) => values.type !== 'company'
    },
    {
      name: 'managerId',
      label: '负责人ID',
      type: 'input',
      placeholder: '请输入负责人ID',
      span: 12
    },
    {
      name: 'level',
      label: '层级',
      type: 'number',
      placeholder: '组织层级',
      min: 1,
      disabled: true,
      span: 12
    },
    {
      name: 'contactInfo.phone',
      label: '联系电话',
      type: 'phone',
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
      name: 'contactInfo.address',
      label: '地址',
      type: 'input',
      placeholder: '请输入地址',
      span: 24
    },
    {
      name: 'sort',
      label: '排序',
      type: 'number',
      placeholder: '数字越小越靠前',
      min: 0,
      span: 12
    },
    {
      name: 'enabled',
      label: '启用状态',
      type: 'switch',
      span: 12
    }
  ]
  
  // 扁平化所有组织数据（用于表格视图）
  const flattenOrganizations = useCallback((orgs: Organization[]): Organization[] => {
    const result: Organization[] = []
    
    const traverse = (organizations: Organization[]) => {
      organizations.forEach(org => {
        result.push(org)
        if (org.children) {
          traverse(org.children)
        }
      })
    }
    
    traverse(orgs)
    return result
  }, [])
  
  // 表格列配置
  const tableColumns = useMemo(() => [
    {
      title: '组织名称',
      key: 'name',
      render: (_: any, record: Organization) => (
        <Space>
          {ORG_TYPE_CONFIG[record.type]?.icon}
          <Text strong>{record.name}</Text>
          <Text type="secondary">({record.code})</Text>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: Organization['type']) => (
        <Tag color={ORG_TYPE_CONFIG[type]?.color}>
          {ORG_TYPE_CONFIG[type]?.name}
        </Tag>
      )
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level'
    },
    {
      title: '负责人',
      key: 'manager',
      render: (_: any, record: Organization) => (
        record.manager ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{record.manager.name}</Text>
          </Space>
        ) : (
          <Text type="secondary">未设置</Text>
        )
      )
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_: any, record: Organization) => (
        <div>
          {record.contactInfo.phone && <div>{record.contactInfo.phone}</div>}
          {record.contactInfo.email && <div>{record.contactInfo.email}</div>}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      )
    }
  ], [])
  
  // 树形选择处理
  const handleTreeSelect = useCallback((selectedKeys: React.Key[], info: any) => {
    setSelectedKeys(selectedKeys)
    if (selectedKeys.length > 0 && info.selectedNodes[0]) {
      setSelectedOrganization(info.selectedNodes[0].organization)
    } else {
      setSelectedOrganization(null)
    }
  }, [])
  
  // 创建组织
  const handleCreate = useCallback(() => {
    const parentId = selectedOrganization?.id
    const level = selectedOrganization ? selectedOrganization.level + 1 : 1
    
    setFormMode('create')
    setEditingOrganization(null)
    setFormVisible(true)
    
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        type: 'department',
        level,
        parentId,
        enabled: true,
        sort: 0
      })
    }, 100)
  }, [selectedOrganization])
  
  // 编辑组织
  const handleEdit = useCallback((organization: Organization) => {
    setFormMode('edit')
    setEditingOrganization(organization)
    setFormVisible(true)
    
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        name: organization.name,
        code: organization.code,
        shortName: organization.shortName,
        type: organization.type,
        level: organization.level,
        parentId: organization.parentId,
        managerId: organization.manager?.id,
        contactInfo: organization.contactInfo,
        sort: organization.sort,
        enabled: organization.enabled
      })
    }, 100)
  }, [])
  
  // 查看组织详情
  const handleView = useCallback((organization: Organization) => {
    setFormMode('view')
    setEditingOrganization(organization)
    setFormVisible(true)
    
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        name: organization.name,
        code: organization.code,
        shortName: organization.shortName,
        type: organization.type,
        level: organization.level,
        parentId: organization.parentId,
        managerId: organization.manager?.id,
        contactInfo: organization.contactInfo,
        sort: organization.sort,
        enabled: organization.enabled
      })
    }, 100)
  }, [])
  
  // 删除组织
  const handleDelete = useCallback((organization: Organization) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除组织"${organization.name}"吗？删除后无法恢复。`,
      onOk: async () => {
        try {
          const response = await BasicDataApiService.deleteOrganization(organization.id)
          if (response.code === 200) {
            message.success('删除成功')
            loadOrganizations()
            if (selectedOrganization?.id === organization.id) {
              setSelectedOrganization(null)
              setSelectedKeys([])
            }
          }
        } catch (error) {
          console.error('删除失败:', error)
          message.error('删除失败')
        }
      }
    })
  }, [selectedOrganization, loadOrganizations])
  
  // 提交表单
  const handleSubmit = useCallback(async (values: any) => {
    try {
      if (formMode === 'create') {
        const response = await BasicDataApiService.createOrganization(values)
        if (response.code === 200) {
          message.success('创建成功')
          setFormVisible(false)
          loadOrganizations()
        }
      } else if (formMode === 'edit' && editingOrganization) {
        const response = await BasicDataApiService.updateOrganization(editingOrganization.id, values)
        if (response.code === 200) {
          message.success('更新成功')
          setFormVisible(false)
          loadOrganizations()
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }, [formMode, editingOrganization, loadOrganizations])
  
  // 渲染树形节点操作按钮
  const renderTreeNodeActions = useCallback((org: Organization) => {
    if (isMobile) return null
    
    return (
      <Space size="small" onClick={(e) => e.stopPropagation()}>
        <Tooltip title="查看">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(org)}
          />
        </Tooltip>
        <Tooltip title="编辑">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(org)}
          />
        </Tooltip>
        <Tooltip title="删除">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(org)}
          />
        </Tooltip>
      </Space>
    )
  }, [isMobile, handleView, handleEdit, handleDelete])
  
  // 渲染树形节点标题
  const renderTreeTitle = useCallback((nodeData: OrgTreeNode) => {
    const { organization } = nodeData
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          {ORG_TYPE_CONFIG[organization.type]?.icon}
          <span>{organization.name}</span>
          <Tag color={ORG_TYPE_CONFIG[organization.type]?.color}>
            {ORG_TYPE_CONFIG[organization.type]?.name}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {organization.code}
          </Text>
          {!organization.enabled && <Tag color="red">已禁用</Tag>}
        </Space>
        {renderTreeNodeActions(organization)}
      </div>
    )
  }, [renderTreeNodeActions])
  
  return (
    <div>
      <PageHeader
        title="组织架构管理"
        description="管理公司组织架构、部门信息和层级关系"
        breadcrumbs={[{ title: '基础数据' }, { title: '组织架构管理' }]}
      />
      
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总组织数"
              value={stats.totalOrganizations}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="公司"
              value={stats.companies}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="部门"
              value={stats.departments}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="团队"
              value={stats.teams}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="分支机构"
              value={stats.branches}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16}>
        {/* 左侧：组织树/表格 */}
        <Col span={isMobile ? 24 : 16}>
          <Card
            title="组织结构"
            extra={
              <Space>
                <Button.Group>
                  <Button
                    type={viewMode === 'tree' ? 'primary' : 'default'}
                    onClick={() => setViewMode('tree')}
                    icon={<BankOutlined />}
                  >
                    树形视图
                  </Button>
                  <Button
                    type={viewMode === 'table' ? 'primary' : 'default'}
                    onClick={() => setViewMode('table')}
                    icon={<SettingOutlined />}
                  >
                    表格视图
                  </Button>
                </Button.Group>
                
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  添加组织
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadOrganizations}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button
                  icon={<ImportOutlined />}
                  onClick={() => setImportVisible(true)}
                >
                  导入
                </Button>
                <Button
                  icon={<ExportOutlined />}
                >
                  导出
                </Button>
              </Space>
            }
          >
            {viewMode === 'tree' ? (
              <div>
                {/* 搜索框 */}
                <Search
                  placeholder="搜索组织名称或编码"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  style={{ marginBottom: 16 }}
                  allowClear
                />
                
                {filteredTreeData.length > 0 ? (
                  <Tree
                    treeData={filteredTreeData.map(node => ({
                      ...node,
                      title: renderTreeTitle(node)
                    }))}
                    onSelect={handleTreeSelect}
                    expandedKeys={expandedKeys}
                    onExpand={setExpandedKeys}
                    selectedKeys={selectedKeys}
                    showLine={{ showLeafIcon: false }}
                    height={600}
                    virtual
                  />
                ) : (
                  <Alert
                    message="暂无组织数据"
                    description="请先添加组织或检查搜索条件"
                    type="info"
                    showIcon
                  />
                )}
              </div>
            ) : (
              <DataTable
                dataSource={flattenOrganizations(organizations)}
                columns={tableColumns}
                rowKey="id"
                loading={loading}
                showHeader={false}
                showSearch={false}
                showRefresh={false}
                showCreate={false}
                actions={[
                  {
                    key: 'view',
                    label: '查看',
                    icon: <EyeOutlined />,
                    onClick: handleView
                  },
                  {
                    key: 'edit',
                    label: '编辑',
                    icon: <EditOutlined />,
                    onClick: handleEdit
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: handleDelete
                  }
                ]}
                pagination={{
                  current: 1,
                  pageSize: 50,
                  total: flattenOrganizations(organizations).length,
                  onChange: () => {}
                }}
              />
            )}
          </Card>
        </Col>
        
        {/* 右侧：组织详情 */}
        {!isMobile && (
          <Col span={8}>
            <Card title="组织详情">
              {selectedOrganization ? (
                <div>
                  <Title level={5}>
                    {ORG_TYPE_CONFIG[selectedOrganization.type]?.icon}{' '}
                    {selectedOrganization.name}
                  </Title>
                  
                  <Descriptions
                    column={1}
                    size="small"
                    bordered
                  >
                    <Descriptions.Item label="组织编码">
                      {selectedOrganization.code}
                    </Descriptions.Item>
                    <Descriptions.Item label="组织类型">
                      <Tag color={ORG_TYPE_CONFIG[selectedOrganization.type]?.color}>
                        {ORG_TYPE_CONFIG[selectedOrganization.type]?.name}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="层级">
                      {selectedOrganization.level}
                    </Descriptions.Item>
                    <Descriptions.Item label="负责人">
                      {selectedOrganization.manager ? (
                        <Space>
                          <Avatar size="small" icon={<UserOutlined />} />
                          {selectedOrganization.manager.name}
                        </Space>
                      ) : (
                        <Text type="secondary">未设置</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="联系电话">
                      {selectedOrganization.contactInfo.phone || '未填写'}
                    </Descriptions.Item>
                    <Descriptions.Item label="邮箱">
                      {selectedOrganization.contactInfo.email || '未填写'}
                    </Descriptions.Item>
                    <Descriptions.Item label="地址">
                      {selectedOrganization.contactInfo.address || '未填写'}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={selectedOrganization.enabled ? 'green' : 'red'}>
                        {selectedOrganization.enabled ? '启用' : '禁用'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {new Date(selectedOrganization.createdAt).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                      {new Date(selectedOrganization.updatedAt).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                  
                  <div style={{ marginTop: 16 }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(selectedOrganization)}
                      >
                        编辑
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(selectedOrganization)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : (
                <Text type="secondary">请选择左侧组织节点查看详情</Text>
              )}
            </Card>
          </Col>
        )}
      </Row>
      
      {/* 表单模态框 */}
      <FormModal
        ref={formRef}
        title={
          formMode === 'create' ? '添加组织' :
          formMode === 'edit' ? '编辑组织' : '组织详情'
        }
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleSubmit}
        fields={formFields}
        width={700}
        readOnly={formMode === 'view'}
      />
      
      {/* 导入导出 */}
      <ImportExport
        type="import"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        title="组织架构数据导入"
        importConfig={{
          accept: '.xlsx,.xls,.csv',
          maxSize: 10 * 1024 * 1024,
          templateUrl: '/templates/organizations-template.xlsx',
          templateFields: [
            { key: 'name', title: '组织名称', required: true, type: 'string', example: '研发部' },
            { key: 'code', title: '组织编码', required: true, type: 'string', example: 'DEV001' },
            { key: 'type', title: '组织类型', required: true, type: 'string', example: 'department' },
            { key: 'parentCode', title: '上级编码', required: false, type: 'string', example: 'COMP001' },
            { key: 'sort', title: '排序', required: false, type: 'number', example: '1' }
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

export default OrganizationManagement