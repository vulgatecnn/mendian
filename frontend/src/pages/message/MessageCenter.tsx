/**
 * 消息中心页面
 * 
 * 功能：
 * - 消息列表展示（分页加载、消息分类）
 * - 未读消息数量显示
 * - 消息已读标记（单个标记、批量标记）
 * - 消息跳转功能
 * - 消息搜索和筛选
 * - 消息删除功能
 * - 实时消息推送
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Space,
  Button,
  Tag,
  Input,
  Select,
  DatePicker,
  Badge,
  Message as ArcoMessage,
  Modal,
  Popconfirm,
  Typography,
  Empty
} from '@arco-design/web-react'
import {
  IconSearch,
  IconRefresh,
  IconDelete,
  IconCheck,
  IconCheckCircle,
  IconClose
} from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import messageService, { Message, MessageType, MessageQueryParams } from '../../api/messageService'
import styles from './MessageCenter.module.css'

const { RangePicker } = DatePicker
const { Title, Text } = Typography

// 消息类型配置
const MESSAGE_TYPE_CONFIG: Record<MessageType, { label: string; color: string }> = {
  approval: { label: '审批通知', color: 'blue' },
  reminder: { label: '提醒通知', color: 'orange' },
  system: { label: '系统通知', color: 'green' },
  notification: { label: '业务通知', color: 'purple' }
}

const MessageCenter: React.FC = () => {
  const navigate = useNavigate()
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [total, setTotal] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<MessageQueryParams>({
    page: 1,
    page_size: 20
  })
  
  // 筛选条件
  const [filters, setFilters] = useState({
    type: undefined as MessageType | undefined,
    is_read: undefined as boolean | undefined,
    keyword: '',
    dateRange: undefined as [string, string] | undefined
  })

  // 加载消息列表
  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params: MessageQueryParams = {
        ...queryParams,
        type: filters.type,
        is_read: filters.is_read,
        start_date: filters.dateRange?.[0],
        end_date: filters.dateRange?.[1]
      }
      
      const response = await messageService.getMessages(params)
      setMessages(response.results)
      setTotal(response.count)
    } catch (error) {
      console.error('加载消息列表失败:', error)
      ArcoMessage.error('加载消息列表失败')
    } finally {
      setLoading(false)
    }
  }, [queryParams, filters])

  // 加载未读消息数量
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await messageService.getUnreadCount()
      setUnreadCount(count.total)
    } catch (error) {
      console.error('加载未读消息数量失败:', error)
    }
  }, [])

  // 初始化加载
  useEffect(() => {
    loadMessages()
    loadUnreadCount()
  }, [loadMessages, loadUnreadCount])

  // 实时消息推送（轮询方式）
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000) // 每30秒检查一次

    return () => clearInterval(interval)
  }, [loadUnreadCount])

  // 标记单个消息为已读
  const handleMarkAsRead = async (id: number) => {
    try {
      await messageService.markAsRead(id)
      ArcoMessage.success('已标记为已读')
      loadMessages()
      loadUnreadCount()
    } catch (error) {
      console.error('标记已读失败:', error)
      ArcoMessage.error('标记已读失败')
    }
  }

  // 批量标记为已读
  const handleBatchMarkAsRead = async () => {
    if (selectedRowKeys.length === 0) {
      ArcoMessage.warning('请选择要标记的消息')
      return
    }

    try {
      await messageService.markMultipleAsRead(selectedRowKeys)
      ArcoMessage.success(`已标记 ${selectedRowKeys.length} 条消息为已读`)
      setSelectedRowKeys([])
      loadMessages()
      loadUnreadCount()
    } catch (error) {
      console.error('批量标记已读失败:', error)
      ArcoMessage.error('批量标记已读失败')
    }
  }

  // 标记全部为已读
  const handleMarkAllAsRead = async () => {
    Modal.confirm({
      title: '确认操作',
      content: '确定要将所有未读消息标记为已读吗？',
      onOk: async () => {
        try {
          const result = await messageService.markAllAsRead()
          ArcoMessage.success(`已标记 ${result.count} 条消息为已读`)
          loadMessages()
          loadUnreadCount()
        } catch (error) {
          console.error('标记全部已读失败:', error)
          ArcoMessage.error('标记全部已读失败')
        }
      }
    })
  }

  // 删除单个消息
  const handleDelete = async (id: number) => {
    try {
      await messageService.deleteMessage(id)
      ArcoMessage.success('删除成功')
      loadMessages()
    } catch (error) {
      console.error('删除消息失败:', error)
      ArcoMessage.error('删除消息失败')
    }
  }

  // 批量删除消息
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      ArcoMessage.warning('请选择要删除的消息')
      return
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条消息吗？`,
      onOk: async () => {
        try {
          await messageService.deleteMultipleMessages(selectedRowKeys)
          ArcoMessage.success(`已删除 ${selectedRowKeys.length} 条消息`)
          setSelectedRowKeys([])
          loadMessages()
        } catch (error) {
          console.error('批量删除失败:', error)
          ArcoMessage.error('批量删除失败')
        }
      }
    })
  }

  // 消息跳转
  const handleMessageClick = async (message: Message) => {
    // 如果未读，先标记为已读
    if (!message.is_read) {
      await handleMarkAsRead(message.id)
    }

    // 跳转到相关业务页面
    if (message.link) {
      navigate(message.link)
    }
  }

  // 搜索
  const handleSearch = () => {
    setQueryParams({ ...queryParams, page: 1 })
    loadMessages()
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({
      type: undefined,
      is_read: undefined,
      keyword: '',
      dateRange: undefined
    })
    setQueryParams({ page: 1, page_size: 20 })
  }

  // 刷新
  const handleRefresh = () => {
    loadMessages()
    loadUnreadCount()
  }

  // 表格列配置
  const columns = [
    {
      title: '状态',
      dataIndex: 'is_read',
      width: 80,
      render: (is_read: boolean) => (
        is_read ? (
          <Tag color="gray" icon={<IconCheckCircle />}>已读</Tag>
        ) : (
          <Badge dot>
            <Tag color="red">未读</Tag>
          </Badge>
        )
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type: MessageType) => {
        const config = MESSAGE_TYPE_CONFIG[type]
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (title: string, record: Message) => (
        <div 
          className={styles.messageTitle}
          onClick={() => handleMessageClick(record)}
          style={{ 
            cursor: record.link ? 'pointer' : 'default',
            fontWeight: record.is_read ? 'normal' : 'bold'
          }}
        >
          {title}
        </div>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (content: string) => (
        <Text ellipsis={{ rows: 2 }}>{content}</Text>
      )
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 180,
      render: (created_at: string) => (
        <Text type="secondary">{created_at}</Text>
      )
    },
    {
      title: '操作',
      width: 180,
      render: (_: any, record: Message) => (
        <Space>
          {!record.is_read && (
            <Button
              type="text"
              size="small"
              icon={<IconCheck />}
              onClick={() => handleMarkAsRead(record.id)}
            >
              标记已读
            </Button>
          )}
          <Popconfirm
            title="确定要删除这条消息吗？"
            onOk={() => handleDelete(record.id)}
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
      )
    }
  ]

  return (
    <div className={styles.container}>
      <Card>
        <div className={styles.header}>
          <Space>
            <Title heading={5}>消息中心</Title>
            <Badge count={unreadCount} maxCount={99}>
              <Tag color="red">未读消息</Tag>
            </Badge>
          </Space>
        </div>

        {/* 筛选区域 */}
        <div className={styles.filterBar}>
          <Space wrap>
            <Select
              placeholder="消息类型"
              style={{ width: 150 }}
              allowClear
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              {Object.entries(MESSAGE_TYPE_CONFIG).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  {config.label}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="阅读状态"
              style={{ width: 120 }}
              allowClear
              value={filters.is_read === undefined ? undefined : (filters.is_read ? 'true' : 'false')}
              onChange={(value) => setFilters({ 
                ...filters, 
                is_read: value === undefined ? undefined : value === 'true' 
              })}
            >
              <Select.Option value="false">未读</Select.Option>
              <Select.Option value="true">已读</Select.Option>
            </Select>

            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: 280 }}
              onChange={(dateStrings) => 
                setFilters({ ...filters, dateRange: dateStrings as [string, string] })
              }
            />

            <Input
              placeholder="搜索标题或内容"
              style={{ width: 200 }}
              value={filters.keyword}
              onChange={(value) => setFilters({ ...filters, keyword: value })}
              onPressEnter={handleSearch}
            />

            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<IconClose />} onClick={handleReset}>
              重置
            </Button>
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>
          </Space>
        </div>

        {/* 批量操作区域 */}
        <div className={styles.batchActions}>
          <Space>
            <Button
              type="primary"
              icon={<IconCheckCircle />}
              onClick={handleBatchMarkAsRead}
              disabled={selectedRowKeys.length === 0}
            >
              批量标记已读
            </Button>
            <Button
              icon={<IconCheckCircle />}
              onClick={handleMarkAllAsRead}
            >
              全部标记已读
            </Button>
            <Button
              status="danger"
              icon={<IconDelete />}
              onClick={handleBatchDelete}
              disabled={selectedRowKeys.length === 0}
            >
              批量删除
            </Button>
            {selectedRowKeys.length > 0 && (
              <Text>已选择 {selectedRowKeys.length} 条消息</Text>
            )}
          </Space>
        </div>

        {/* 消息列表 */}
        <Table
          loading={loading}
          columns={columns}
          data={messages}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys) => setSelectedRowKeys(selectedRowKeys as number[])
          }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.page_size,
            total,
            showTotal: (total) => `共 ${total} 条消息`,
            showJumper: true,
            sizeCanChange: true,
            onChange: (page, pageSize) => {
              setQueryParams({ page, page_size: pageSize })
            }
          }}
          noDataElement={
            <Empty description="暂无消息" />
          }
        />
      </Card>
    </div>
  )
}

export default MessageCenter
