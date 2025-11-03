/**
 * 系统首页
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Badge,
  Tag,
  Message,
  Spin,
} from '@arco-design/web-react'
import {
  IconRefresh,
  IconCheckCircle,
  IconNotification,
  IconApps,
  IconEmpty,
} from '@arco-design/web-react/icon'
import HomeService, { TodoItem, TodoStatistics } from '../../api/homeService'
import MessageService, { Message as MessageType } from '../../api/messageService'
import styles from './Home.module.css'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // 待办事项
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [todoStats, setTodoStats] = useState<TodoStatistics>({
    total: 0,
    approval_count: 0,
    contract_reminder_count: 0,
    milestone_reminder_count: 0,
    high_priority_count: 0,
  })
  
  // 消息通知
  const [messages, setMessages] = useState<MessageType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // 常用功能（默认配置）
  const [quickAccess] = useState([
    { id: 1, name: '候选点位', icon: 'icon-location', link: '/expansion/locations' },
    { id: 2, name: '铺位跟进', icon: 'icon-file', link: '/expansion/follow-ups' },
    { id: 3, name: '工程管理', icon: 'icon-tool', link: '/preparation/construction' },
    { id: 4, name: '门店档案', icon: 'icon-storage', link: '/archive/stores' },
    { id: 5, name: '待办审批', icon: 'icon-check-circle', link: '/approval/pending' },
    { id: 6, name: '基础数据', icon: 'icon-settings', link: '/base-data' },
  ])

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true)
      
      // 并行加载所有数据
      const [todosRes, statsRes, messagesRes, unreadRes] = await Promise.all([
        HomeService.getTodos({ page_size: 10 }),
        HomeService.getTodoStatistics(),
        MessageService.getMessages({ page_size: 10, is_read: false }),
        MessageService.getUnreadCount(),
      ])

      setTodos(todosRes.results)
      setTodoStats(statsRes)
      setMessages(messagesRes.results)
      setUnreadCount(unreadRes.total)
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    Message.success('刷新成功')
  }

  // 跳转到待办事项
  const handleTodoClick = (todo: TodoItem) => {
    navigate(todo.link)
  }

  // 跳转到消息详情
  const handleMessageClick = async (message: MessageType) => {
    try {
      // 标记为已读
      if (!message.is_read) {
        await MessageService.markAsRead(message.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      // 跳转到相关页面
      if (message.link) {
        navigate(message.link)
      }
    } catch (error: any) {
      Message.error('操作失败')
    }
  }

  // 跳转到常用功能
  const handleQuickAccessClick = (link: string) => {
    navigate(link)
  }

  // 查看更多待办
  const handleViewMoreTodos = () => {
    navigate('/approval/pending')
  }

  // 查看更多消息
  const handleViewMoreMessages = () => {
    navigate('/messages')
  }

  // 获取待办类型标签
  const getTodoTypeTag = (type: string) => {
    const typeMap: Record<string, { text: string; color: string }> = {
      approval: { text: '审批', color: 'blue' },
      contract_reminder: { text: '合同提醒', color: 'orange' },
      milestone_reminder: { text: '里程碑', color: 'purple' },
    }
    const config = typeMap[type] || { text: type, color: 'gray' }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 获取优先级标签
  const getPriorityTag = (priority: string) => {
    const priorityMap: Record<string, { text: string; color: string }> = {
      urgent: { text: '紧急', color: 'red' },
      high: { text: '高', color: 'orange' },
      medium: { text: '中', color: 'blue' },
      low: { text: '低', color: 'gray' },
    }
    const config = priorityMap[priority] || { text: priority, color: 'gray' }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }

  useEffect(() => {
    loadData()
    
    // 设置定时刷新（每5分钟）
    const timer = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.greeting}>{getGreeting()}！</div>
        <div className={styles.subtitle}>
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      {/* 主要内容区 */}
      <Spin loading={loading} style={{ display: 'block' }}>
        <div className={styles.content}>
          {/* 左侧列 */}
          <div className={styles.leftColumn}>
            {/* 待办事项卡片 */}
            <Card className={styles.todoCard}>
              <div className={styles.todoHeader}>
                <div className={styles.todoTitle}>
                  <IconCheckCircle />
                  待办事项
                  {todoStats.total > 0 && (
                    <Badge count={todoStats.total} />
                  )}
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<IconRefresh className={`${styles.refreshIcon} ${refreshing ? styles.spinning : ''}`} />}
                  onClick={handleRefresh}
                  loading={refreshing}
                >
                  刷新
                </Button>
              </div>

              {/* 统计数据 */}
              <div className={styles.todoStats}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>全部</div>
                  <div className={`${styles.statValue} ${styles.primary}`}>
                    {todoStats.total}
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>待审批</div>
                  <div className={styles.statValue}>
                    {todoStats.approval_count}
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>合同提醒</div>
                  <div className={`${styles.statValue} ${styles.warning}`}>
                    {todoStats.contract_reminder_count}
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>里程碑</div>
                  <div className={`${styles.statValue} ${styles.danger}`}>
                    {todoStats.milestone_reminder_count}
                  </div>
                </div>
              </div>

              {/* 待办列表 */}
              <div className={styles.todoList}>
                {todos.length > 0 ? (
                  todos.map(todo => (
                    <div
                      key={todo.id}
                      className={styles.todoItem}
                      onClick={() => handleTodoClick(todo)}
                    >
                      <div className={styles.todoItemHeader}>
                        <div className={styles.todoItemTitle}>{todo.title}</div>
                        {getPriorityTag(todo.priority)}
                      </div>
                      <div className={styles.todoItemDesc}>{todo.description}</div>
                      <div className={styles.todoItemFooter}>
                        <div className={styles.todoItemType}>
                          {getTodoTypeTag(todo.type)}
                        </div>
                        <div className={styles.todoItemTime}>
                          {todo.due_date ? `截止: ${new Date(todo.due_date).toLocaleDateString('zh-CN')}` : formatTime(todo.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <IconEmpty className={styles.emptyIcon} />
                    <div className={styles.emptyText}>暂无待办事项</div>
                  </div>
                )}
              </div>

              {todos.length > 0 && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <Button type="text" onClick={handleViewMoreTodos}>
                    查看全部待办
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* 右侧列 */}
          <div className={styles.rightColumn}>
            {/* 消息通知卡片 */}
            <Card className={styles.messageCard}>
              <div className={styles.messageHeader}>
                <div className={styles.messageTitle}>
                  <IconNotification />
                  消息通知
                  {unreadCount > 0 && (
                    <Badge count={unreadCount} />
                  )}
                </div>
                <Button
                  type="text"
                  size="small"
                  onClick={handleViewMoreMessages}
                >
                  查看全部
                </Button>
              </div>

              <div className={styles.messageList}>
                {messages.length > 0 ? (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`${styles.messageItem} ${!message.is_read ? styles.unread : ''}`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className={styles.messageItemTitle}>{message.title}</div>
                      <div className={styles.messageItemContent}>{message.content}</div>
                      <div className={styles.messageItemTime}>{formatTime(message.created_at)}</div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <IconEmpty className={styles.emptyIcon} />
                    <div className={styles.emptyText}>暂无消息通知</div>
                  </div>
                )}
              </div>
            </Card>

            {/* 常用功能卡片 */}
            <Card className={styles.quickAccessCard}>
              <div className={styles.quickAccessHeader}>
                <div className={styles.quickAccessTitle}>
                  <IconApps /> 常用功能
                </div>
              </div>

              <div className={styles.quickAccessGrid}>
                {quickAccess.map(item => (
                  <div
                    key={item.id}
                    className={styles.quickAccessItem}
                    onClick={() => handleQuickAccessClick(item.link)}
                  >
                    <div className={styles.quickAccessIcon}>
                      {/* 这里可以根据 icon 字段渲染不同的图标 */}
                      <IconApps />
                    </div>
                    <div className={styles.quickAccessName}>{item.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Spin>
    </div>
  )
}

export default Home
