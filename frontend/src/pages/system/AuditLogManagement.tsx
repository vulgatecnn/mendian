/**
 * 审计日志管理页面组件
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Message,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  DatePicker,
  Modal,
  Descriptions,
  Empty
} from '@arco-design/web-react'
import {
  IconSearch,
  IconRefresh,
  IconEye
} from '@arco-design/web-react/icon'
import { ColumnProps } from '@arco-design/web-react/es/Table'
import { AuditLog, AUDIT_ACTIONS, AUDIT_TARGET_TYPES, AuditLogQueryParams } from '../../types'
import AuditLogService from '../../api/auditLogService'
import { PermissionGuard } from '../../components/PermissionGuard'
import { usePermission } from '../../hooks/usePermission'
import styles from './AuditLogManagement.module.css'

const { Title } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

// 操作类型映射
const ACTION_LABELS: Record<string, string> = {
  [AUDIT_ACTIONS.CREATE]: '创建',
  [AUDIT_ACTIONS.UPDATE]: '更新',
  [AUDIT_ACTIONS.DELETE]: '删除',
  [AUDIT_ACTIONS.ENABLE]: '启用',
  [AUDIT_ACTIONS.DISABLE]: '停用',
  [AUDIT_ACTIONS.ASSIGN]: '分配',
  [AUDIT_ACTIONS.ASSIGN_PERMISSIONS]: '分配权限',
  [AUDIT_ACTIONS.ADD_MEMBERS]: '添加成员',
  [AUDIT_ACTIONS.SYNC]: '同步'
}

// 对象类型映射
const TARGET_TYPE_LABELS: Record<string, string> = {
  [AUDIT_TARGET_TYPES.USER]: '用户',
  [AUDIT_TARGET_TYPES.ROLE]: '角色',
  [AUDIT_TARGET_TYPES.PERMISSION]: '权限',
  [AUDIT_TARGET_TYPES.DEPARTMENT]: '部门'
}

// 操作类型颜色映射
const ACTION_COLORS: Record<string, string> = {
  [AUDIT_ACTIONS.CREATE]: 'green',
  [AUDIT_ACTIONS.UPDATE]: 'blue',
  [AUDIT_ACTIONS.DELETE]: 'red',
  [AUDIT_ACTIONS.ENABLE]: 'green',
  [AUDIT_ACTIONS.DISABLE]: 'orange',
  [AUDIT_ACTIONS.ASSIGN]: 'purple',
  [AUDIT_ACTIONS.ASSIGN_PERMISSIONS]: 'purple',
  [AUDIT_ACTIONS.ADD_MEMBERS]: 'purple',
  [AUDIT_ACTIONS.SYNC]: 'cyan'
}

const AuditLogManagement: React.FC = () => {
  // 状态管理
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  
  // 权限检查
  const { hasPermission } = usePermission()

  // 筛选条件
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    username: '',
    action: undefined,
    target_type: undefined,
    start_time: undefined,
    end_time: undefined
  })

  // 详情弹窗
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  // 加载审计日志列表
  const loadAuditLogs = async (params?: AuditLogQueryParams) => {
    try {
      setLoading(true)
      const queryParams = {
        ...filters,
        ...params,
        page: pagination.current,
        page_size: pagination.pageSize
      }
      
      // 清理空值参数
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof AuditLogQueryParams] === '' || 
            queryParams[key as keyof AuditLogQueryParams] === undefined) {
          delete queryParams[key as keyof AuditLogQueryParams]
        }
      })

      const response = await AuditLogService.getAuditLogs(queryParams)
      setAuditLogs(response.results)
      setPagination(prev => ({
        ...prev,
        total: response.count
      }))
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '获取审计日志失败'
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 查看日志详情
  const handleViewDetail = async (log: AuditLog) => {
    try {
      const detail = await AuditLogService.getAuditLogDetail(log.id)
      setSelectedLog(detail)
      setDetailModalVisible(true)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '获取日志详情失败'
      Message.error(errorMessage)
    }
  }

  // 搜索处理
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadAuditLogs()
  }

  // 重置筛选条件
  const handleReset = () => {
    setFilters({
      username: '',
      action: undefined,
      target_type: undefined,
      start_time: undefined,
      end_time: undefined
    })
    setPagination(prev => ({ ...prev, current: 1 }))
    // 延迟执行以确保状态更新
    setTimeout(() => {
      loadAuditLogs()
    }, 0)
  }

  // 时间范围变化处理
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters((prev: AuditLogQueryParams) => ({
        ...prev,
        start_time: dates[0].format('YYYY-MM-DDTHH:mm:ss'),
        end_time: dates[1].format('YYYY-MM-DDTHH:mm:ss')
      }))
    } else {
      setFilters((prev: AuditLogQueryParams) => ({
        ...prev,
        start_time: undefined,
        end_time: undefined
      }))
    }
  }

  // 分页变化处理
  const handleTableChange = (pagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  // 格式化操作详情
  const formatDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) {
      return <Empty description="无详细信息" />
    }

    const items = Object.entries(details).map(([key, value]) => ({
      label: key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    }))

    return (
      <Descriptions
        column={1}
        data={items}
        labelStyle={{ width: '120px' }}
        valueStyle={{ wordBreak: 'break-all' }}
      />
    )
  }

  // 表格列定义
  const columns: ColumnProps<AuditLog>[] = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      width: 160,
      render: (createdAt: string) => (
        <div>
          <div>{new Date(createdAt).toLocaleDateString('zh-CN')}</div>
          <div className={styles.subText}>
            {new Date(createdAt).toLocaleTimeString('zh-CN')}
          </div>
        </div>
      )
    },
    {
      title: '操作人',
      dataIndex: 'user_full_name',
      width: 120,
      render: (userFullName: string, record: AuditLog) => (
        <div>
          <div>{userFullName || '系统'}</div>
          <div className={styles.subText}>{record.username || '-'}</div>
        </div>
      )
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color={ACTION_COLORS[action] || 'gray'}>
          {ACTION_LABELS[action] || action}
        </Tag>
      )
    },
    {
      title: '对象类型',
      dataIndex: 'target_type',
      width: 100,
      render: (targetType: string) => (
        <Tag color="blue">
          {TARGET_TYPE_LABELS[targetType] || targetType}
        </Tag>
      )
    },
    {
      title: '对象ID',
      dataIndex: 'target_id',
      width: 80
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      width: 120
    },
    {
      title: '部门',
      width: 120,
      render: (_, record: AuditLog) => (
        record.user_info?.department_name || '-'
      )
    },
    {
      title: '操作',
      width: 80,
      render: (_, record: AuditLog) => (
        <Button
          type="text"
          size="small"
          icon={<IconEye />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      )
    }
  ]

  // 组件挂载时加载数据
  useEffect(() => {
    loadAuditLogs()
  }, [pagination.current, pagination.pageSize])

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Title heading={3} className={styles.title}>
            审计日志
          </Title>
          <div className={styles.actions}>
            <Space>
              <Button
                icon={<IconRefresh />}
                onClick={() => loadAuditLogs()}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>
        </div>

        {/* 筛选条件 */}
        <div className={styles.filters}>
          <Space wrap>
            <Input
              placeholder="搜索操作人用户名"
              value={filters.username}
              onChange={(value) => setFilters((prev: AuditLogQueryParams) => ({ ...prev, username: value }))}
              style={{ width: 200 }}
              allowClear
            />
            
            <Select
              placeholder="操作类型"
              value={filters.action}
              onChange={(value) => setFilters((prev: AuditLogQueryParams) => ({ ...prev, action: value as string }))}
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            
            <Select
              placeholder="对象类型"
              value={filters.target_type}
              onChange={(value) => setFilters((prev: AuditLogQueryParams) => ({ ...prev, target_type: value as string }))}
              style={{ width: 120 }}
              allowClear
            >
              {Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            
            <RangePicker
              placeholder={['开始时间', '结束时间']}
              onChange={handleDateRangeChange}
              style={{ width: 280 }}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
            />
            
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
              搜索
            </Button>
            
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>

        {/* 审计日志列表表格 */}
        <Table
          columns={columns}
          data={auditLogs}
          loading={loading}
          pagination={{
            ...pagination,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 项，共 ${total} 项`
          }}
          onChange={handleTableChange}
          rowKey="id"
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 日志详情弹窗 */}
      <Modal
        title="审计日志详情"
        visible={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false)
          setSelectedLog(null)
        }}
        footer={null}
        style={{ width: '800px' }}
      >
        {selectedLog && (
          <div>
            <Descriptions
              column={2}
              data={[
                {
                  label: '日志ID',
                  value: selectedLog.id
                },
                {
                  label: '操作时间',
                  value: new Date(selectedLog.created_at).toLocaleString('zh-CN')
                },
                {
                  label: '操作人',
                  value: selectedLog.user_full_name || '系统'
                },
                {
                  label: '用户名',
                  value: selectedLog.username || '-'
                },
                {
                  label: '操作类型',
                  value: (
                    <Tag color={ACTION_COLORS[selectedLog.action] || 'gray'}>
                      {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                    </Tag>
                  )
                },
                {
                  label: '对象类型',
                  value: (
                    <Tag color="blue">
                      {TARGET_TYPE_LABELS[selectedLog.target_type] || selectedLog.target_type}
                    </Tag>
                  )
                },
                {
                  label: '对象ID',
                  value: selectedLog.target_id
                },
                {
                  label: 'IP地址',
                  value: selectedLog.ip_address
                },
                {
                  label: '部门',
                  value: selectedLog.user_info?.department_name || '-'
                },
                {
                  label: '职位',
                  value: selectedLog.user_info?.position || '-'
                }
              ]}
              labelStyle={{ width: '100px' }}
            />
            
            <div style={{ marginTop: '20px' }}>
              <Title heading={6}>操作详情</Title>
              <div style={{ 
                background: '#f7f8fa', 
                padding: '12px', 
                borderRadius: '6px',
                marginTop: '8px'
              }}>
                {formatDetails(selectedLog.details)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AuditLogManagement