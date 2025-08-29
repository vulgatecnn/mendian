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
  Alert
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  GlobalOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import type { DataNode, TreeProps } from 'antd/es/tree'
import { DataTable, FormModal, ImportExport, RegionCascader } from '@/components/common/crud'
import type { FormField, FormModalRef } from '@/components/common/crud'
import PageHeader from '@/components/common/PageHeader'
import { BasicDataApiService } from '@/services/api/basicData'
import { useDevice } from '@/hooks/useDevice'
import type { Region } from '@/services/types'

const { Title, Text } = Typography

interface RegionTreeNode extends DataNode {
  level: number
  region: Region
  children?: RegionTreeNode[]
}

interface RegionStats {
  totalRegions: number
  provinces: number
  cities: number
  districts: number
  streets: number
}

const AdminRegionManagement: React.FC = () => {
  const { isMobile } = useDevice()
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<Region[]>([])
  const [treeData, setTreeData] = useState<RegionTreeNode[]>([])
  const [stats, setStats] = useState<RegionStats>({
    totalRegions: 0,
    provinces: 0,
    cities: 0,
    districts: 0,
    streets: 0
  })
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  
  // 表单相关
  const [formVisible, setFormVisible] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const formRef = useRef<FormModalRef>(null)
  
  // 导入导出
  const [importVisible, setImportVisible] = useState(false)
  
  // 级别配置
  const LEVEL_CONFIG = {
    1: { name: '省份', color: 'red', icon: <GlobalOutlined /> },
    2: { name: '城市', color: 'orange', icon: <EnvironmentOutlined /> },
    3: { name: '区县', color: 'blue', icon: <EnvironmentOutlined /> },
    4: { name: '街道', color: 'green', icon: <EnvironmentOutlined /> }
  }
  
  // 转换区域数据为树形结构
  const transformToTreeData = useCallback((regions: Region[]): RegionTreeNode[] => {
    return regions.map(region => ({
      key: region.id,
      title: (
        <Space>
          <span>{region.name}</span>
          <Tag color={LEVEL_CONFIG[region.level as keyof typeof LEVEL_CONFIG]?.color}>
            {LEVEL_CONFIG[region.level as keyof typeof LEVEL_CONFIG]?.name}
          </Tag>
          <Text type="secondary">({region.code})</Text>
        </Space>
      ),
      level: region.level,
      region,
      children: region.children ? transformToTreeData(region.children) : undefined,
      isLeaf: !region.children || region.children.length === 0
    }))
  }, [])
  
  // 加载区域数据
  const loadRegions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await BasicDataApiService.getRegionTree()
      if (response.code === 200) {
        setRegions(response.data)
        const treeData = transformToTreeData(response.data)
        setTreeData(treeData)
        
        // 计算统计数据
        const calculateStats = (regions: Region[]): RegionStats => {
          const stats = { totalRegions: 0, provinces: 0, cities: 0, districts: 0, streets: 0 }
          
          const traverse = (regions: Region[]) => {
            regions.forEach(region => {
              stats.totalRegions++
              switch (region.level) {
                case 1: stats.provinces++; break
                case 2: stats.cities++; break
                case 3: stats.districts++; break
                case 4: stats.streets++; break
              }
              if (region.children) {
                traverse(region.children)
              }
            })
          }
          
          traverse(regions)
          return stats
        }
        
        setStats(calculateStats(response.data))
        
        // 默认展开省级节点
        const provinceKeys = response.data.map(region => region.id)
        setExpandedKeys(provinceKeys)
      }
    } catch (error) {
      console.error('加载区域数据失败:', error)
      message.error('加载区域数据失败')
    } finally {
      setLoading(false)
    }
  }, [transformToTreeData])
  
  // 初始化
  React.useEffect(() => {
    loadRegions()
  }, [loadRegions])
  
  // 表单字段配置
  const formFields: FormField[] = [
    {
      name: 'name',
      label: '区域名称',
      type: 'input',
      required: true,
      placeholder: '请输入区域名称',
      span: 12
    },
    {
      name: 'code',
      label: '区域编码',
      type: 'input',
      required: true,
      placeholder: '请输入区域编码',
      disabled: formMode === 'edit',
      span: 12
    },
    {
      name: 'level',
      label: '级别',
      type: 'select',
      required: true,
      disabled: formMode === 'edit',
      options: [
        { label: '省份', value: 1 },
        { label: '城市', value: 2 },
        { label: '区县', value: 3 },
        { label: '街道', value: 4 }
      ],
      span: 12
    },
    {
      name: 'parentId',
      label: '上级区域',
      type: 'select', // 这里可以改为使用RegionCascader
      placeholder: '请选择上级区域（省份可不选）',
      options: [], // 动态生成
      span: 12,
      visible: (values) => values.level > 1
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
  
  // 树形选择处理
  const handleTreeSelect = useCallback((selectedKeys: React.Key[], info: any) => {
    setSelectedKeys(selectedKeys)
    if (selectedKeys.length > 0 && info.selectedNodes[0]) {
      setSelectedRegion(info.selectedNodes[0].region)
    } else {
      setSelectedRegion(null)
    }
  }, [])
  
  // 创建区域
  const handleCreate = useCallback(() => {
    const parentId = selectedRegion?.id
    const level = selectedRegion ? selectedRegion.level + 1 : 1
    
    if (level > 4) {
      message.warning('已达到最大层级，无法继续添加下级区域')
      return
    }
    
    setFormMode('create')
    setEditingRegion(null)
    setFormVisible(true)
    
    // 设置默认值
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        level,
        parentId,
        enabled: true,
        sort: 0
      })
    }, 100)
  }, [selectedRegion])
  
  // 编辑区域
  const handleEdit = useCallback((region: Region) => {
    setFormMode('edit')
    setEditingRegion(region)
    setFormVisible(true)
    
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        name: region.name,
        code: region.code,
        level: region.level,
        parentId: region.parentId,
        sort: region.sort,
        enabled: region.enabled
      })
    }, 100)
  }, [])
  
  // 查看区域详情
  const handleView = useCallback((region: Region) => {
    setFormMode('view')
    setEditingRegion(region)
    setFormVisible(true)
    
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        name: region.name,
        code: region.code,
        level: region.level,
        parentId: region.parentId,
        sort: region.sort,
        enabled: region.enabled
      })
    }, 100)
  }, [])
  
  // 删除区域
  const handleDelete = useCallback((region: Region) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除区域"${region.name}"吗？删除后无法恢复。`,
      onOk: async () => {
        try {
          const response = await BasicDataApiService.deleteRegion(region.id)
          if (response.code === 200) {
            message.success('删除成功')
            loadRegions()
            if (selectedRegion?.id === region.id) {
              setSelectedRegion(null)
              setSelectedKeys([])
            }
          }
        } catch (error) {
          console.error('删除失败:', error)
          message.error('删除失败')
        }
      }
    })
  }, [selectedRegion, loadRegions])
  
  // 提交表单
  const handleSubmit = useCallback(async (values: any) => {
    try {
      if (formMode === 'create') {
        const response = await BasicDataApiService.createRegion(values)
        if (response.code === 200) {
          message.success('创建成功')
          setFormVisible(false)
          loadRegions()
        }
      } else if (formMode === 'edit' && editingRegion) {
        const response = await BasicDataApiService.updateRegion(editingRegion.id, values)
        if (response.code === 200) {
          message.success('更新成功')
          setFormVisible(false)
          loadRegions()
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }, [formMode, editingRegion, loadRegions])
  
  // 渲染树形节点标题
  const renderTreeTitle = useCallback((nodeData: RegionTreeNode) => {
    const { region } = nodeData
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          {LEVEL_CONFIG[region.level as keyof typeof LEVEL_CONFIG]?.icon}
          <span>{region.name}</span>
          <Tag color={LEVEL_CONFIG[region.level as keyof typeof LEVEL_CONFIG]?.color}>
            {LEVEL_CONFIG[region.level as keyof typeof LEVEL_CONFIG]?.name}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {region.code}
          </Text>
          {!region.enabled && <Tag color="red">已禁用</Tag>}
        </Space>
        
        {!isMobile && (
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="查看">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleView(region)}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(region)}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(region)}
              />
            </Tooltip>
          </Space>
        )}
      </div>
    )
  }, [isMobile, handleView, handleEdit, handleDelete])
  
  // 处理导入
  const handleImport = useCallback(async (file: File) => {
    // 这里实现导入逻辑
    return {
      success: true,
      total: 0,
      successCount: 0,
      failCount: 0,
      errors: [],
      warnings: []
    }
  }, [])
  
  // 处理导出
  const handleExport = useCallback(async (config: any) => {
    // 这里实现导出逻辑
    return '/api/export/regions.xlsx'
  }, [])
  
  return (
    <div>
      <PageHeader
        title="行政区域管理"
        description="管理省市区县等行政区域信息和层级关系"
        breadcrumbs={[{ title: '基础数据' }, { title: '行政区域管理' }]}
      />
      
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总区域数"
              value={stats.totalRegions}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="省份"
              value={stats.provinces}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="城市"
              value={stats.cities}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="区县"
              value={stats.districts}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16}>
        {/* 左侧：区域树 */}
        <Col span={isMobile ? 24 : 16}>
          <Card
            title="区域结构"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  添加{selectedRegion ? '下级' : ''}区域
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadRegions}
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
                  onClick={() => handleExport({})}
                >
                  导出
                </Button>
              </Space>
            }
          >
            {treeData.length > 0 ? (
              <Tree
                treeData={treeData.map(node => ({
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
                message="暂无区域数据"
                description="请先导入基础区域数据或手动添加"
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>
        
        {/* 右侧：区域详情 */}
        {!isMobile && (
          <Col span={8}>
            <Card title="区域详情">
              {selectedRegion ? (
                <div>
                  <Title level={5}>{selectedRegion.name}</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>区域编码：</Text>
                      <Text>{selectedRegion.code}</Text>
                    </div>
                    <div>
                      <Text strong>级别：</Text>
                      <Tag color={LEVEL_CONFIG[selectedRegion.level as keyof typeof LEVEL_CONFIG]?.color}>
                        {LEVEL_CONFIG[selectedRegion.level as keyof typeof LEVEL_CONFIG]?.name}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>状态：</Text>
                      <Tag color={selectedRegion.enabled ? 'green' : 'red'}>
                        {selectedRegion.enabled ? '启用' : '禁用'}
                      </Tag>
                    </div>
                    <div>
                      <Text strong>排序：</Text>
                      <Text>{selectedRegion.sort}</Text>
                    </div>
                    <div>
                      <Text strong>创建时间：</Text>
                      <Text>{new Date(selectedRegion.createdAt).toLocaleString()}</Text>
                    </div>
                    <div>
                      <Text strong>更新时间：</Text>
                      <Text>{new Date(selectedRegion.updatedAt).toLocaleString()}</Text>
                    </div>
                  </Space>
                  
                  <div style={{ marginTop: 16 }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(selectedRegion)}
                      >
                        编辑
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(selectedRegion)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : (
                <Text type="secondary">请选择左侧区域节点查看详情</Text>
              )}
            </Card>
          </Col>
        )}
      </Row>
      
      {/* 表单模态框 */}
      <FormModal
        ref={formRef}
        title={
          formMode === 'create' ? '添加区域' :
          formMode === 'edit' ? '编辑区域' : '区域详情'
        }
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleSubmit}
        fields={formFields}
        width={600}
        readOnly={formMode === 'view'}
      />
      
      {/* 导入导出 */}
      <ImportExport
        type="import"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        title="区域数据导入"
        importConfig={{
          accept: '.xlsx,.xls,.csv',
          maxSize: 10 * 1024 * 1024,
          templateUrl: '/templates/regions-template.xlsx',
          templateFields: [
            { key: 'name', title: '区域名称', required: true, type: 'string', example: '北京市' },
            { key: 'code', title: '区域编码', required: true, type: 'string', example: '110000' },
            { key: 'level', title: '级别', required: true, type: 'number', example: '1' },
            { key: 'parentCode', title: '上级编码', required: false, type: 'string', example: '' },
            { key: 'sort', title: '排序', required: false, type: 'number', example: '1' }
          ],
          onImport: handleImport
        }}
      />
    </div>
  )
}

export default AdminRegionManagement