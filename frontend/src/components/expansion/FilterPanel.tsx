import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Slider,
  Collapse,
  Typography,
  Divider
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  SaveOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons'
import type { CandidateLocationQueryParams } from '@/services/types'
// dayjs removed - not used

const { RangePicker } = DatePicker
const { Panel } = Collapse
const { Text } = Typography

interface FilterPanelProps {
  onFilter: (params: CandidateLocationQueryParams) => void
  initialValues?: Partial<CandidateLocationQueryParams>
  compact?: boolean
  showSaveFilter?: boolean
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilter,
  initialValues = {},
  compact = false,
  showSaveFilter = true
}) => {
  const [form] = Form.useForm()
  const [_expanded, setExpanded] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
      updateActiveFilters(initialValues)
    }
  }, [initialValues, form])

  const updateActiveFilters = (values: any) => {
    const filters: string[] = []
    
    if (values.name) filters.push('name')
    if (values.status) filters.push('status')
    if (values.propertyType) filters.push('propertyType')
    if (values.priority) filters.push('priority')
    if (values.regionId) filters.push('regionId')
    if (values.minArea || values.maxArea) filters.push('area')
    if (values.minRent || values.maxRent) filters.push('rent')
    if (values.minScore || values.maxScore) filters.push('score')
    if (values.discoveredDateRange) filters.push('discoveredDate')
    if (values.tags && values.tags.length > 0) filters.push('tags')
    if (values.discoveredBy) filters.push('discoveredBy')
    
    setActiveFilters(filters)
  }

  const handleSearch = () => {
    form.validateFields().then(values => {
      const params: CandidateLocationQueryParams = {
        page: 1,
        pageSize: 20,
        name: values.name,
        status: values.status,
        propertyType: values.propertyType,
        priority: values.priority,
        regionId: values.regionId,
        minArea: values.minArea,
        maxArea: values.maxArea,
        minRent: values.minRent,
        maxRent: values.maxRent,
        minScore: values.minScore,
        maxScore: values.maxScore,
        discoveredBy: values.discoveredBy,
        discoveredStartDate: values.discoveredDateRange?.[0]?.toISOString(),
        discoveredEndDate: values.discoveredDateRange?.[1]?.toISOString(),
        tags: values.tags,
        keyword: values.keyword
      }
      
      updateActiveFilters(values)
      onFilter(params)
    })
  }

  const handleReset = () => {
    form.resetFields()
    setActiveFilters([])
    onFilter({ page: 1, pageSize: 20 })
  }

  const handleQuickFilter = (filterType: string, value: any) => {
    form.setFieldValue(filterType, value)
    handleSearch()
  }

  const removeFilter = (filterType: string) => {
    form.setFieldValue(filterType, undefined)
    handleSearch()
  }

  const renderQuickFilters = () => (
    <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
      <Col>
        <Text type="secondary">快速筛选：</Text>
      </Col>
      <Col>
        <Tag.CheckableTag
          checked={form.getFieldValue('status') === 'INVESTIGATING'}
          onChange={(checked) => handleQuickFilter('status', checked ? 'INVESTIGATING' : undefined)}
        >
          调研中
        </Tag.CheckableTag>
      </Col>
      <Col>
        <Tag.CheckableTag
          checked={form.getFieldValue('status') === 'NEGOTIATING'}
          onChange={(checked) => handleQuickFilter('status', checked ? 'NEGOTIATING' : undefined)}
        >
          谈判中
        </Tag.CheckableTag>
      </Col>
      <Col>
        <Tag.CheckableTag
          checked={form.getFieldValue('priority') === 'URGENT'}
          onChange={(checked) => handleQuickFilter('priority', checked ? 'URGENT' : undefined)}
        >
          紧急
        </Tag.CheckableTag>
      </Col>
      <Col>
        <Tag.CheckableTag
          checked={form.getFieldValue('priority') === 'HIGH'}
          onChange={(checked) => handleQuickFilter('priority', checked ? 'HIGH' : undefined)}
        >
          高优先级
        </Tag.CheckableTag>
      </Col>
      <Col>
        <Tag.CheckableTag
          checked={form.getFieldValue('propertyType') === 'STREET_SHOP'}
          onChange={(checked) => handleQuickFilter('propertyType', checked ? 'STREET_SHOP' : undefined)}
        >
          临街商铺
        </Tag.CheckableTag>
      </Col>
      <Col>
        <Tag.CheckableTag
          checked={form.getFieldValue('propertyType') === 'MALL_SHOP'}
          onChange={(checked) => handleQuickFilter('propertyType', checked ? 'MALL_SHOP' : undefined)}
        >
          商场店铺
        </Tag.CheckableTag>
      </Col>
    </Row>
  )

  const renderActiveFilters = () => {
    if (activeFilters.length === 0) return null

    return (
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col>
          <Text type="secondary">已选筛选：</Text>
        </Col>
        {activeFilters.map(filter => {
          const filterLabels = {
            name: '名称',
            status: '状态',
            propertyType: '物业类型',
            priority: '优先级',
            regionId: '地区',
            area: '面积',
            rent: '租金',
            score: '评分',
            discoveredDate: '发现时间',
            tags: '标签',
            discoveredBy: '发现人'
          }
          
          return (
            <Col key={filter}>
              <Tag
                closable
                onClose={() => removeFilter(filter)}
                color="blue"
              >
                {filterLabels[filter as keyof typeof filterLabels]}
              </Tag>
            </Col>
          )
        })}
      </Row>
    )
  }

  const renderBasicFilters = () => (
    <Row gutter={16}>
      <Col span={6}>
        <Form.Item name="keyword" label="关键词搜索">
          <Input
            placeholder="点位名称、地址"
            prefix={<SearchOutlined />}
            allowClear
          />
        </Form.Item>
      </Col>
      
      <Col span={4}>
        <Form.Item name="status" label="状态">
          <Select placeholder="选择状态" allowClear>
            <Select.Option value="DISCOVERED">已发现</Select.Option>
            <Select.Option value="INVESTIGATING">调研中</Select.Option>
            <Select.Option value="NEGOTIATING">谈判中</Select.Option>
            <Select.Option value="APPROVED">已通过</Select.Option>
            <Select.Option value="REJECTED">已拒绝</Select.Option>
            <Select.Option value="SIGNED">已签约</Select.Option>
          </Select>
        </Form.Item>
      </Col>
      
      <Col span={4}>
        <Form.Item name="priority" label="优先级">
          <Select placeholder="选择优先级" allowClear>
            <Select.Option value="LOW">低</Select.Option>
            <Select.Option value="MEDIUM">中</Select.Option>
            <Select.Option value="HIGH">高</Select.Option>
            <Select.Option value="URGENT">紧急</Select.Option>
          </Select>
        </Form.Item>
      </Col>

      <Col span={5}>
        <Form.Item name="propertyType" label="物业类型">
          <Select placeholder="选择物业类型" allowClear>
            <Select.Option value="STREET_SHOP">临街商铺</Select.Option>
            <Select.Option value="MALL_SHOP">商场店铺</Select.Option>
            <Select.Option value="OFFICE_BUILDING">写字楼</Select.Option>
            <Select.Option value="RESIDENTIAL">住宅底商</Select.Option>
            <Select.Option value="STANDALONE">独立建筑</Select.Option>
          </Select>
        </Form.Item>
      </Col>
      
      <Col span={5}>
        <Form.Item name="discoveredDateRange" label="发现时间">
          <RangePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder={['开始日期', '结束日期']}
          />
        </Form.Item>
      </Col>
    </Row>
  )

  const renderAdvancedFilters = () => (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="regionId" label="地区">
            <Select placeholder="选择地区" allowClear>
              <Select.Option value="region1">核心商圈</Select.Option>
              <Select.Option value="region2">次级商圈</Select.Option>
              <Select.Option value="region3">社区商圈</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item name="discoveredBy" label="发现人">
            <Select placeholder="选择发现人" allowClear>
              <Select.Option value="user1">张三</Select.Option>
              <Select.Option value="user2">李四</Select.Option>
              <Select.Option value="user3">王五</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item name="tags" label="标签">
            <Select mode="multiple" placeholder="选择标签" allowClear>
              <Select.Option value="核心商圈">核心商圈</Select.Option>
              <Select.Option value="地铁沿线">地铁沿线</Select.Option>
              <Select.Option value="商场内铺">商场内铺</Select.Option>
              <Select.Option value="临街门面">临街门面</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={6}>
          <Form.Item name="hasElevator" label="电梯">
            <Select placeholder="是否有电梯" allowClear>
              <Select.Option value={true}>有</Select.Option>
              <Select.Option value={false}>无</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="面积范围(㎡)">
            <Input.Group compact>
              <Form.Item name="minArea" noStyle>
                <InputNumber placeholder="最小面积" style={{ width: '45%' }} min={0} />
              </Form.Item>
              <Input
                style={{ width: '10%', textAlign: 'center', pointerEvents: 'none' }}
                placeholder="~"
                disabled
              />
              <Form.Item name="maxArea" noStyle>
                <InputNumber placeholder="最大面积" style={{ width: '45%' }} min={0} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="租金范围(万/月)">
            <Input.Group compact>
              <Form.Item name="minRent" noStyle>
                <InputNumber 
                  placeholder="最低租金" 
                  style={{ width: '45%' }} 
                  min={0}
                  formatter={value => value ? `${value}万` : ''}
                  parser={value => value?.replace('万', '') as any}
                />
              </Form.Item>
              <Input
                style={{ width: '10%', textAlign: 'center', pointerEvents: 'none' }}
                placeholder="~"
                disabled
              />
              <Form.Item name="maxRent" noStyle>
                <InputNumber 
                  placeholder="最高租金" 
                  style={{ width: '45%' }} 
                  min={0}
                  formatter={value => value ? `${value}万` : ''}
                  parser={value => value?.replace('万', '') as any}
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="评分范围">
            <Form.Item name="scoreRange" noStyle>
              <Slider
                range
                min={0}
                max={10}
                step={0.1}
                marks={{
                  0: '0',
                  2.5: '2.5',
                  5: '5',
                  7.5: '7.5',
                  10: '10'
                }}
                tipFormatter={value => `${value}分`}
              />
            </Form.Item>
          </Form.Item>
        </Col>
      </Row>
    </div>
  )

  if (compact) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="keyword">
            <Input
              placeholder="搜索点位名称、地址"
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              allowClear
            />
          </Form.Item>
          
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Select.Option value="INVESTIGATING">调研中</Select.Option>
              <Select.Option value="NEGOTIATING">谈判中</Select.Option>
              <Select.Option value="APPROVED">已通过</Select.Option>
              <Select.Option value="SIGNED">已签约</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="priority">
            <Select placeholder="优先级" style={{ width: 100 }} allowClear>
              <Select.Option value="URGENT">紧急</Select.Option>
              <Select.Option value="HIGH">高</Select.Option>
              <Select.Option value="MEDIUM">中</Select.Option>
              <Select.Option value="LOW">低</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    )
  }

  return (
    <Card 
      title={
        <Space>
          <FilterOutlined />
          筛选器
          {activeFilters.length > 0 && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {activeFilters.length} 项筛选
            </Tag>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Form form={form} layout="vertical">
        {renderQuickFilters()}
        {renderActiveFilters()}
        
        <div style={{ marginBottom: 16 }}>
          {renderBasicFilters()}
        </div>

        <Collapse
          ghost
          expandIcon={({ isActive }) => isActive ? <UpOutlined /> : <DownOutlined />}
          onChange={(keys) => setExpanded(keys.length > 0)}
        >
          <Panel header="高级筛选" key="advanced">
            {renderAdvancedFilters()}
          </Panel>
        </Collapse>

        <Divider style={{ margin: '16px 0' }} />

        <Row justify="space-between">
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索 ({activeFilters.length})
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleSearch}>
                刷新
              </Button>
            </Space>
          </Col>
          
          {showSaveFilter && (
            <Col>
              <Button icon={<SaveOutlined />}>
                保存筛选条件
              </Button>
            </Col>
          )}
        </Row>
      </Form>
    </Card>
  )
}

export default FilterPanel