import React, { useState, useCallback, useMemo } from 'react'
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Form,
  Row,
  Col,
  Modal,
  message,
  Tooltip,
  Typography,
  theme,
  Empty
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  FilterOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { TableRowSelection } from 'antd/es/table/interface'
import { useDevice } from '@/hooks/useDevice'

const { RangePicker } = DatePicker
const { Option } = Select
const { Text } = Typography

export interface SearchField {
  name: string
  label: string
  type: 'input' | 'select' | 'dateRange' | 'date' | 'number'
  placeholder?: string
  options?: Array<{ label: string; value: string | number }>
  allowClear?: boolean
  span?: number
}

export interface ActionConfig {
  key: string
  label: string
  icon?: React.ReactNode
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link'
  danger?: boolean
  disabled?: boolean | ((record: any) => boolean)
  visible?: boolean | ((record: any) => boolean)
  permission?: string
  onClick: (record: any) => void | Promise<void>
}

export interface BatchAction {
  key: string
  label: string
  icon?: React.ReactNode
  type?: 'primary' | 'default' | 'dashed'
  danger?: boolean
  disabled?: boolean
  permission?: string
  confirm?: {
    title: string
    description?: string
  }
  onClick: (selectedKeys: React.Key[], selectedRows: any[]) => void | Promise<void>
}

export interface ColumnConfig {
  key?: React.Key
  title?: React.ReactNode
  dataIndex?: string | string[]
  width?: string | number
  fixed?: 'left' | 'right' | boolean
  align?: 'left' | 'center' | 'right'
  className?: string
  render?: (value: any, record: any, index: number) => React.ReactNode
  searchable?: boolean
  sortable?: boolean
  filterable?: boolean
  copyable?: boolean
  ellipsis?: boolean
}

export interface DataTableProps<T = any> {
  // 数据相关
  dataSource: T[]
  columns: ColumnConfig[]
  rowKey?: string | ((record: T) => string)
  loading?: boolean
  
  // 分页相关
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    showTotal?: ((total: number, range: [number, number]) => React.ReactNode)
    onChange: (page: number, pageSize: number) => void
  }
  
  // 搜索相关
  searchFields?: SearchField[]
  onSearch?: (values: Record<string, any>) => void
  onReset?: () => void
  
  // 操作相关
  actions?: ActionConfig[]
  batchActions?: BatchAction[]
  onRefresh?: () => void | Promise<void>
  onCreate?: () => void
  onExport?: () => void | Promise<void>
  onImport?: () => void
  
  // 选择相关
  rowSelection?: boolean | TableRowSelection<T>
  
  // 样式相关
  title?: string
  subtitle?: string
  size?: 'small' | 'middle' | 'large'
  bordered?: boolean
  
  // 功能开关
  showHeader?: boolean
  showSearch?: boolean
  showRefresh?: boolean
  showCreate?: boolean
  showExport?: boolean
  showImport?: boolean
  showColumnSettings?: boolean
  
  // 权限
  createPermission?: string
  exportPermission?: string
  importPermission?: string
  
  // 额外配置
  extra?: React.ReactNode
  emptyDescription?: string
  expandable?: any
}

const DataTable = <T extends Record<string, any>>({
  dataSource,
  columns,
  rowKey = 'id',
  loading = false,
  pagination,
  searchFields,
  onSearch,
  onReset,
  actions = [],
  batchActions = [],
  onRefresh,
  onCreate,
  onExport,
  onImport,
  rowSelection,
  title,
  subtitle,
  size = 'middle',
  bordered = false,
  showHeader = true,
  showSearch = true,
  showRefresh = true,
  showCreate = true,
  showExport = true,
  showImport = false,
  showColumnSettings: _showColumnSettings = false,
  createPermission: _createPermission,
  exportPermission: _exportPermission,
  importPermission: _importPermission,
  extra,
  emptyDescription,
  expandable,
  ...restProps
}: DataTableProps<T>): React.ReactElement => {
  const { isMobile } = useDevice()
  const { token } = theme.useToken()
  
  // 状态管理
  const [searchForm] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<T[]>([])
  const [searchVisible, setSearchVisible] = useState(false)
  
  // 搜索处理
  const handleSearch = useCallback(async (values: Record<string, any>) => {
    try {
      // 处理日期范围
      const processedValues = { ...values }
      Object.keys(processedValues).forEach(key => {
        const field = searchFields?.find(f => f.name === key)
        if (field?.type === 'dateRange' && Array.isArray(processedValues[key])) {
          processedValues[`${key}Start`] = processedValues[key][0]?.format('YYYY-MM-DD')
          processedValues[`${key}End`] = processedValues[key][1]?.format('YYYY-MM-DD')
          delete processedValues[key]
        }
      })
      
      await onSearch?.(processedValues)
    } catch (error) {
      console.error('搜索失败:', error)
      message.error('搜索失败，请重试')
    }
  }, [onSearch, searchFields])
  
  // 重置搜索
  const handleReset = useCallback(async () => {
    try {
      searchForm.resetFields()
      await onReset?.()
    } catch (error) {
      console.error('重置失败:', error)
      message.error('重置失败，请重试')
    }
  }, [onReset, searchForm])
  
  // 刷新处理
  const handleRefresh = useCallback(async () => {
    try {
      await onRefresh?.()
      message.success('刷新成功')
    } catch (error) {
      console.error('刷新失败:', error)
      message.error('刷新失败，请重试')
    }
  }, [onRefresh])
  
  // 导出处理
  const handleExport = useCallback(async () => {
    try {
      await onExport?.()
      message.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败，请重试')
    }
  }, [onExport])
  
  // 批量操作处理
  const handleBatchAction = useCallback(async (action: BatchAction) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的数据')
      return
    }
    
    try {
      if (action.confirm) {
        Modal.confirm({
          title: action.confirm.title,
          content: action.confirm.description || `确认对 ${selectedRowKeys.length} 项数据执行"${action.label}"操作吗？`,
          onOk: async () => {
            await action.onClick(selectedRowKeys, selectedRows)
            setSelectedRowKeys([])
            setSelectedRows([])
          }
        })
      } else {
        await action.onClick(selectedRowKeys, selectedRows)
        setSelectedRowKeys([])
        setSelectedRows([])
      }
    } catch (error) {
      console.error('批量操作失败:', error)
      message.error('操作失败，请重试')
    }
  }, [selectedRowKeys, selectedRows])
  
  // 行选择配置
  const tableRowSelection = useMemo(() => {
    if (!rowSelection) return undefined
    
    if (typeof rowSelection === 'boolean') {
      return {
        selectedRowKeys,
        onChange: (keys: React.Key[], rows: T[]) => {
          setSelectedRowKeys(keys)
          setSelectedRows(rows)
        },
        getCheckboxProps: (record: T) => ({
          name: record[typeof rowKey === 'function' ? rowKey(record) : rowKey]
        })
      }
    }
    
    return {
      ...rowSelection,
      selectedRowKeys,
      onChange: (keys: React.Key[], rows: T[]) => {
        setSelectedRowKeys(keys)
        setSelectedRows(rows)
        rowSelection.onChange?.(keys, rows, { type: 'all' })
      }
    }
  }, [rowSelection, selectedRowKeys, rowKey])
  
  // 表格列配置
  const tableColumns = useMemo(() => {
    const processedColumns = [...columns]
    
    // 添加操作列
    if (actions.length > 0) {
      processedColumns.push({
        title: '操作',
        key: 'actions',
        fixed: isMobile ? false : 'right',
        width: Math.min(actions.length * 40 + 40, 200),
        render: (_, record) => (
          <Space size="small">
            {actions
              .filter(action => action.visible !== false && 
                (typeof action.visible !== 'function' || action.visible(record)))
              .map(action => (
                <Tooltip key={action.key} title={action.label}>
                  <Button
                    type={action.type || 'text'}
                    size="small"
                    icon={action.icon}
                    danger={action.danger}
                    disabled={
                      action.disabled === true ||
                      (typeof action.disabled === 'function' && action.disabled(record))
                    }
                    onClick={() => action.onClick(record)}
                  />
                </Tooltip>
              ))}
          </Space>
        )
      })
    }
    
    return processedColumns.map(col => ({
      ...col,
      ellipsis: col.ellipsis !== false,
      sorter: col.sortable !== false ? true : false,
      showSorterTooltip: false
    }))
  }, [columns, actions, isMobile])
  
  // 搜索表单渲染
  const renderSearchForm = () => {
    if (!searchFields || searchFields.length === 0) return null
    
    return (
      <Form
        form={searchForm}
        onFinish={handleSearch}
        layout="vertical"
      >
        <Row gutter={16}>
          {searchFields.map(field => (
            <Col
              key={field.name}
              span={field.span || (isMobile ? 24 : 8)}
            >
              <Form.Item
                name={field.name}
                label={field.label}
              >
                {field.type === 'input' && (
                  <Input
                    placeholder={field.placeholder}
                    allowClear={field.allowClear !== false}
                  />
                )}
                {field.type === 'select' && (
                  <Select
                    placeholder={field.placeholder}
                    allowClear={field.allowClear !== false}
                  >
                    {field.options?.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                )}
                {field.type === 'dateRange' && (
                  <RangePicker style={{ width: '100%' }} />
                )}
                {field.type === 'date' && (
                  <DatePicker style={{ width: '100%' }} />
                )}
                {field.type === 'number' && (
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    allowClear={field.allowClear !== false}
                  />
                )}
              </Form.Item>
            </Col>
          ))}
        </Row>
        
        <Row>
          <Col>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    )
  }
  
  // 工具栏渲染
  const renderToolbar = () => {
    return (
      <Space wrap>
        {showRefresh && (
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {!isMobile && '刷新'}
          </Button>
        )}
        
        {showCreate && onCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
          >
            新建
          </Button>
        )}
        
        {showExport && onExport && (
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            {!isMobile && '导出'}
          </Button>
        )}
        
        {showImport && onImport && (
          <Button
            icon={<ImportOutlined />}
            onClick={onImport}
          >
            {!isMobile && '导入'}
          </Button>
        )}
        
        {searchFields && searchFields.length > 0 && (
          <Button
            icon={<FilterOutlined />}
            onClick={() => setSearchVisible(!searchVisible)}
            type={searchVisible ? 'primary' : 'default'}
          >
            {!isMobile && (searchVisible ? '收起筛选' : '展开筛选')}
          </Button>
        )}
        
        {extra}
      </Space>
    )
  }
  
  // 批量操作栏渲染
  const renderBatchActions = () => {
    if (!batchActions.length || selectedRowKeys.length === 0) return null
    
    return (
      <div
        style={{
          padding: '12px 16px',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Text>已选择 {selectedRowKeys.length} 项</Text>
        <Space>
          {batchActions.map(action => (
            <Button
              key={action.key}
              type={action.type}
              danger={action.danger}
              disabled={action.disabled}
              icon={action.icon}
              size="small"
              onClick={() => handleBatchAction(action)}
            >
              {action.label}
            </Button>
          ))}
          <Button
            size="small"
            onClick={() => {
              setSelectedRowKeys([])
              setSelectedRows([])
            }}
          >
            取消选择
          </Button>
        </Space>
      </div>
    )
  }
  
  return (
    <Card
      title={showHeader && (
        <div>
          {title && <Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>}
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </div>
      )}
      extra={showHeader && renderToolbar()}
      bodyStyle={{ padding: 0 }}
      bordered={bordered}
    >
      {/* 搜索区域 */}
      {showSearch && searchVisible && (
        <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorder}` }}>
          {renderSearchForm()}
        </div>
      )}
      
      {/* 批量操作栏 */}
      {renderBatchActions()}
      
      {/* 表格 */}
      <Table<T>
        {...restProps}
        dataSource={dataSource}
        columns={tableColumns as ColumnsType<T>}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        rowSelection={tableRowSelection}
        size={size}
        scroll={isMobile ? { x: 'max-content' } : undefined}
        locale={{
          emptyText: (
            <Empty
              description={emptyDescription || '暂无数据'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        }}
        expandable={expandable}
      />
    </Card>
  )
}

export default DataTable