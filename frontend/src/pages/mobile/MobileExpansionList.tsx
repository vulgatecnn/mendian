import React, { useState, useEffect } from 'react'
import {
  List,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  FloatButton,
  Tabs,
  Badge,
  Drawer,
  Form,
  Switch,
  Slider,
  Empty,
  PullToRefresh,
  InfiniteScroll,
  message
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  HomeOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import MobileCandidateCard from '@/components/mobile/MobileCandidateCard'
import MobileFollowUpCard from '@/components/mobile/MobileFollowUpCard'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

interface CandidateLocation {
  id: string
  locationCode: string
  name: string
  address: string
  status: 'PENDING' | 'EVALUATING' | 'FOLLOWING' | 'NEGOTIATING' | 'CONTRACTED' | 'REJECTED' | 'SUSPENDED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  evaluationScore?: number
  area?: number
  rentPrice?: number
  rentUnit?: string
  region?: { name: string }
  storePlan?: { title: string }
  followUpCount: number
  discoveryDate: string
  expectedSignDate?: string
  landlordName?: string
  landlordPhone?: string
  notes?: string
}

interface FollowUpRecord {
  id: string
  type: 'PHONE_CALL' | 'SITE_VISIT' | 'NEGOTIATION' | 'DOCUMENTATION' | 'OTHER'
  title: string
  content: string
  result?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  nextFollowUpDate?: string
  actualFollowUpDate?: string
  duration?: number
  candidateLocation: {
    id: string
    name: string
    address: string
    status: string
  }
  assignee: {
    id: string
    name: string
    avatar?: string
  }
  createdBy: {
    id: string
    name: string
  }
  createdAt: string
  tags?: string[]
}

const MobileExpansionList: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('candidates')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filterForm] = Form.useForm()

  // 模拟数据
  const [candidateList, setCandidateList] = useState<CandidateLocation[]>([
    {
      id: '1',
      locationCode: 'CL001-240215-001',
      name: '万达广场A区候选点位',
      address: '北京市海淀区中关村大街1号万达广场A区1F-08',
      status: 'FOLLOWING',
      priority: 'HIGH',
      evaluationScore: 8.5,
      area: 120,
      rentPrice: 25000,
      rentUnit: 'month',
      region: { name: '海淀区' },
      storePlan: { title: '2024年北京地区扩张计划' },
      followUpCount: 5,
      discoveryDate: '2024-02-15T10:30:00Z',
      expectedSignDate: '2024-03-15T00:00:00Z',
      landlordName: '王老板',
      landlordPhone: '13800138001',
      notes: '人流量大，但租金偏高，需要进一步谈判'
    },
    {
      id: '2',
      locationCode: 'CL001-240220-002',
      name: '银泰城B座潜力点位',
      address: '北京市东城区王府井大街100号银泰城B座2F-15',
      status: 'NEGOTIATING',
      priority: 'URGENT',
      evaluationScore: 9.2,
      area: 85,
      rentPrice: 18000,
      rentUnit: 'month',
      region: { name: '东城区' },
      storePlan: { title: '2024年北京地区扩张计划' },
      followUpCount: 8,
      discoveryDate: '2024-02-20T14:20:00Z',
      expectedSignDate: '2024-02-28T00:00:00Z',
      landlordName: '李经理',
      landlordPhone: '13800138002',
      notes: '地理位置极佳，正在商务谈判中'
    }
  ])

  const [followUpList, setFollowUpList] = useState<FollowUpRecord[]>([
    {
      id: '1',
      type: 'SITE_VISIT',
      title: '万达广场A区实地考察',
      content: '对万达广场A区候选点位进行详细实地考察，重点评估人流量和商业价值。考察发现该点位地理位置优越，人流量较大，但租金相对偏高，需要进一步商务谈判。',
      result: '基本满意，建议继续谈判租金',
      status: 'COMPLETED',
      importance: 'HIGH',
      actualFollowUpDate: '2024-02-18T14:30:00Z',
      duration: 120,
      candidateLocation: {
        id: '1',
        name: '万达广场A区候选点位',
        address: '北京市海淀区中关村大街1号',
        status: 'FOLLOWING'
      },
      assignee: {
        id: '1',
        name: '张三'
      },
      createdBy: {
        id: '2',
        name: '李经理'
      },
      createdAt: '2024-02-15T10:00:00Z',
      tags: ['实地考察', '重要', '万达']
    },
    {
      id: '2',
      type: 'NEGOTIATION',
      title: '银泰城B座商务谈判',
      content: '与银泰城B座业主进行租金和合同条款谈判，重点讨论租金价格、装修期免租、合同期限等关键条款。',
      status: 'PENDING',
      importance: 'URGENT',
      nextFollowUpDate: '2024-02-25T10:00:00Z',
      candidateLocation: {
        id: '2',
        name: '银泰城B座潜力点位',
        address: '北京市东城区王府井大街100号',
        status: 'NEGOTIATING'
      },
      assignee: {
        id: '2',
        name: '李四'
      },
      createdBy: {
        id: '3',
        name: '王主管'
      },
      createdAt: '2024-02-22T09:00:00Z',
      tags: ['商务谈判', '紧急', '银泰城']
    }
  ])

  // 筛选状态统计
  const candidateStats = {
    all: candidateList.length,
    pending: candidateList.filter(item => item.status === 'PENDING').length,
    following: candidateList.filter(item => item.status === 'FOLLOWING').length,
    negotiating: candidateList.filter(item => item.status === 'NEGOTIATING').length,
    contracted: candidateList.filter(item => item.status === 'CONTRACTED').length
  }

  const followUpStats = {
    all: followUpList.length,
    pending: followUpList.filter(item => item.status === 'PENDING').length,
    inProgress: followUpList.filter(item => item.status === 'IN_PROGRESS').length,
    overdue: followUpList.filter(item => 
      item.nextFollowUpDate && 
      dayjs(item.nextFollowUpDate).isBefore(dayjs()) &&
      item.status === 'PENDING'
    ).length,
    today: followUpList.filter(item => 
      item.nextFollowUpDate && 
      dayjs(item.nextFollowUpDate).isSame(dayjs(), 'day') &&
      item.status === 'PENDING'
    ).length
  }

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    // 模拟刷新数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
    message.success('刷新成功')
  }

  // 无限滚动加载更多
  const loadMore = async () => {
    if (loading) return
    setLoading(true)
    
    // 模拟加载数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟没有更多数据
    setHasMore(false)
    setLoading(false)
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setKeyword(value)
    console.log('搜索:', value)
  }

  // 筛选处理
  const handleFilter = (values: any) => {
    console.log('筛选条件:', values)
    setShowFilter(false)
  }

  // 候选点位操作
  const handleViewCandidate = (candidate: CandidateLocation) => {
    navigate(`/mobile/expansion/candidates/${candidate.id}`)
  }

  const handleFollowUpCandidate = (candidate: CandidateLocation) => {
    navigate(`/mobile/expansion/candidates/${candidate.id}/follow-up`)
  }

  const handleCallLandlord = (candidate: CandidateLocation) => {
    if (candidate.landlordPhone) {
      window.open(`tel:${candidate.landlordPhone}`)
    }
  }

  // 跟进记录操作
  const handleViewFollowUp = (followUp: FollowUpRecord) => {
    navigate(`/mobile/expansion/follow-ups/${followUp.id}`)
  }

  const handleEditFollowUp = (followUp: FollowUpRecord) => {
    navigate(`/mobile/expansion/follow-ups/${followUp.id}/edit`)
  }

  const handleCompleteFollowUp = (followUp: FollowUpRecord) => {
    message.success('跟进任务已完成')
    // 这里应该调用API更新状态
  }

  const handleCallFollowUp = (followUp: FollowUpRecord) => {
    if (followUp.candidateLocation) {
      // 这里可以获取候选点位的联系电话
      message.info('正在拨打电话...')
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      paddingBottom: '60px' // 为浮动按钮预留空间
    }}>
      {/* 搜索栏 */}
      <div style={{ 
        padding: '12px 16px', 
        backgroundColor: '#fff',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <Search
            placeholder={activeTab === 'candidates' ? '搜索候选点位...' : '搜索跟进记录...'}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ flex: 1 }}
          />
          <Button 
            icon={<FilterOutlined />}
            onClick={() => setShowFilter(true)}
          />
        </Space.Compact>
      </div>

      {/* 主要内容 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ backgroundColor: '#fff' }}
        tabBarStyle={{ 
          margin: 0, 
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <TabPane 
          tab={
            <Badge count={candidateStats.all} offset={[10, 0]} size="small">
              <span>候选点位</span>
            </Badge>
          } 
          key="candidates"
        >
          <div style={{ padding: '16px' }}>
            {/* 快速筛选 */}
            <div style={{ marginBottom: '12px' }}>
              <Space wrap size="small">
                <Tag color="blue">全部 ({candidateStats.all})</Tag>
                <Tag>跟进中 ({candidateStats.following})</Tag>
                <Tag>谈判中 ({candidateStats.negotiating})</Tag>
                <Tag>已签约 ({candidateStats.contracted})</Tag>
              </Space>
            </div>

            {/* 候选点位列表 */}
            <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
              <InfiniteScroll
                dataLength={candidateList.length}
                next={loadMore}
                hasMore={hasMore}
                loader={<div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>}
                endMessage={
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    没有更多数据了
                  </div>
                }
              >
                {candidateList.length > 0 ? (
                  candidateList.map(candidate => (
                    <MobileCandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onView={() => handleViewCandidate(candidate)}
                      onFollowUp={() => handleFollowUpCandidate(candidate)}
                      onCall={() => handleCallLandlord(candidate)}
                    />
                  ))
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无候选点位数据"
                    style={{ padding: '40px 0' }}
                  />
                )}
              </InfiniteScroll>
            </PullToRefresh>
          </div>
        </TabPane>

        <TabPane 
          tab={
            <Badge count={followUpStats.pending + followUpStats.overdue} offset={[10, 0]} size="small">
              <span>跟进记录</span>
            </Badge>
          } 
          key="followups"
        >
          <div style={{ padding: '16px' }}>
            {/* 快速筛选 */}
            <div style={{ marginBottom: '12px' }}>
              <Space wrap size="small">
                <Tag color="blue">全部 ({followUpStats.all})</Tag>
                <Tag color="orange">待处理 ({followUpStats.pending})</Tag>
                <Tag color="red">逾期 ({followUpStats.overdue})</Tag>
                <Tag color="gold">今日 ({followUpStats.today})</Tag>
              </Space>
            </div>

            {/* 跟进记录列表 */}
            <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
              <InfiniteScroll
                dataLength={followUpList.length}
                next={loadMore}
                hasMore={hasMore}
                loader={<div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>}
                endMessage={
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    没有更多数据了
                  </div>
                }
              >
                {followUpList.length > 0 ? (
                  followUpList.map(followUp => (
                    <MobileFollowUpCard
                      key={followUp.id}
                      followUp={followUp}
                      onView={() => handleViewFollowUp(followUp)}
                      onEdit={() => handleEditFollowUp(followUp)}
                      onComplete={() => handleCompleteFollowUp(followUp)}
                      onCall={() => handleCallFollowUp(followUp)}
                    />
                  ))
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无跟进记录数据"
                    style={{ padding: '40px 0' }}
                  />
                )}
              </InfiniteScroll>
            </PullToRefresh>
          </div>
        </TabPane>
      </Tabs>

      {/* 浮动按钮 */}
      <FloatButton.Group
        trigger="click"
        type="primary"
        icon={<PlusOutlined />}
        style={{ right: 24, bottom: 24 }}
      >
        <FloatButton
          icon={<HomeOutlined />}
          tooltip="新增候选点位"
          onClick={() => navigate('/mobile/expansion/candidates/create')}
        />
        <FloatButton
          icon={<PhoneOutlined />}
          tooltip="新增跟进记录"
          onClick={() => navigate('/mobile/expansion/follow-ups/create')}
        />
        <FloatButton
          icon={<EnvironmentOutlined />}
          tooltip="地图查看"
          onClick={() => navigate('/mobile/expansion/map')}
        />
      </FloatButton.Group>

      {/* 筛选抽屉 */}
      <Drawer
        title="筛选条件"
        placement="bottom"
        height="70%"
        open={showFilter}
        onClose={() => setShowFilter(false)}
        extra={
          <Button type="link" onClick={() => filterForm.resetFields()}>
            重置
          </Button>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={handleFilter}
        >
          {activeTab === 'candidates' ? (
            <>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value="PENDING">待评估</Option>
                  <Option value="EVALUATING">评估中</Option>
                  <Option value="FOLLOWING">跟进中</Option>
                  <Option value="NEGOTIATING">谈判中</Option>
                  <Option value="CONTRACTED">已签约</Option>
                  <Option value="REJECTED">已拒绝</Option>
                </Select>
              </Form.Item>

              <Form.Item name="priority" label="优先级">
                <Select placeholder="请选择优先级" allowClear>
                  <Option value="LOW">低</Option>
                  <Option value="MEDIUM">中</Option>
                  <Option value="HIGH">高</Option>
                  <Option value="URGENT">紧急</Option>
                </Select>
              </Form.Item>

              <Form.Item name="scoreRange" label="评分范围">
                <Slider range min={0} max={10} step={0.1} />
              </Form.Item>

              <Form.Item name="hasPhone" label="有房东联系方式">
                <Switch />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="followUpStatus" label="跟进状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value="PENDING">待处理</Option>
                  <Option value="IN_PROGRESS">进行中</Option>
                  <Option value="COMPLETED">已完成</Option>
                  <Option value="CANCELLED">已取消</Option>
                </Select>
              </Form.Item>

              <Form.Item name="followUpType" label="跟进类型">
                <Select placeholder="请选择类型" allowClear>
                  <Option value="PHONE_CALL">电话沟通</Option>
                  <Option value="SITE_VISIT">实地考察</Option>
                  <Option value="NEGOTIATION">商务谈判</Option>
                  <Option value="DOCUMENTATION">资料整理</Option>
                  <Option value="OTHER">其他</Option>
                </Select>
              </Form.Item>

              <Form.Item name="importance" label="重要程度">
                <Select placeholder="请选择重要程度" allowClear>
                  <Option value="LOW">低</Option>
                  <Option value="MEDIUM">中</Option>
                  <Option value="HIGH">高</Option>
                  <Option value="URGENT">紧急</Option>
                </Select>
              </Form.Item>

              <Form.Item name="overdueOnly" label="仅显示逾期">
                <Switch />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button style={{ flex: 1 }} onClick={() => setShowFilter(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" style={{ flex: 1 }}>
                应用筛选
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default MobileExpansionList