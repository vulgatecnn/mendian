import React, { useMemo } from 'react'
import { Row, Col, Card, Table, List, Tag, Progress, Button } from 'antd'
import {
  ShopOutlined,
  ToolOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import { StatCard, StatusTag } from '@/components/business'

const Dashboard: React.FC = () => {
  // 模拟数据 - 使用新的StatCard组件数据格式
  const statisticsData = useMemo(
    () => [
      {
        title: '总门店数',
        value: 128,
        prefix: <ShopOutlined />,
        color: 'blue' as const,
        trend: {
          value: '+12%',
          isPositive: true,
          label: '较上月'
        }
      },
      {
        title: '本月新开门店',
        value: 8,
        suffix: '家',
        prefix: <TrophyOutlined />,
        color: 'green' as const,
        trend: {
          value: '+3',
          isPositive: true,
          label: '较计划'
        }
      },
      {
        title: '筹备中门店',
        value: 15,
        suffix: '家',
        prefix: <ToolOutlined />,
        color: 'orange' as const,
        trend: {
          value: '-2',
          isPositive: false,
          label: '较上月'
        }
      },
      {
        title: '待审批事项',
        value: 23,
        suffix: '项',
        prefix: <ExclamationCircleOutlined />,
        color: 'red' as const,
        trend: {
          value: '5',
          isPositive: true,
          label: '紧急事项'
        }
      }
    ],
    []
  )

  const recentPlansColumns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <StatusTag type="store" value={type as any} size="small" />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag type="status" value={status as any} size="small" />
    },
    {
      title: '目标日期',
      dataIndex: 'targetDate',
      key: 'targetDate'
    }
  ]

  const recentPlansData = [
    {
      key: '1',
      name: '北京朝阳门店',
      type: 'direct',
      status: 'in_progress',
      targetDate: '2024-03-15'
    },
    {
      key: '2',
      name: '上海徐汇门店',
      type: 'franchise',
      status: 'pending',
      targetDate: '2024-03-20'
    },
    {
      key: '3',
      name: '深圳南山门店',
      type: 'direct',
      status: 'approved',
      targetDate: '2024-04-01'
    }
  ]

  const todoListData = [
    {
      title: '北京朝阳门店装修审批',
      description: '需要审批装修方案和预算',
      status: 'urgent'
    },
    {
      title: '上海徐汇门店证照办理',
      description: '营业执照和食品经营许可证',
      status: 'normal'
    },
    {
      title: '深圳南山门店验收确认',
      description: '工程验收和设备调试',
      status: 'normal'
    },
    {
      title: '广州天河门店开店计划审批',
      description: '开店计划书和选址报告',
      status: 'urgent'
    }
  ]

  return (
    <div>
      <PageHeader title="系统首页" description="好饭碗门店生命周期管理系统" />

      {/* 统计卡片 - 使用新的StatCard组件 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statisticsData.map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <StatCard
              title={item.title}
              value={item.value}
              prefix={item.prefix}
              {...(item.suffix && { suffix: item.suffix })}
              color={item.color}
              trend={item.trend}
            />
          </Col>
        ))}
      </Row>

      {/* 业务概览仪表板 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="业务进度概览" extra={<Button type="primary">查看详情</Button>}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={75}
                    format={percent => `${percent}%`}
                    strokeColor="#52C41A"
                    size={120}
                  />
                  <div style={{ marginTop: 12, fontSize: '16px', fontWeight: 500 }}>年度计划</div>
                  <div style={{ color: '#8C8C8C', fontSize: '12px' }}>120/160 家</div>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={85}
                    format={percent => `${percent}%`}
                    strokeColor="#1890FF"
                    size={120}
                  />
                  <div style={{ marginTop: 12, fontSize: '16px', fontWeight: 500 }}>拓店进度</div>
                  <div style={{ color: '#8C8C8C', fontSize: '12px' }}>68/80 个点位</div>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={60}
                    format={percent => `${percent}%`}
                    strokeColor="#FAAD14"
                    size={120}
                  />
                  <div style={{ marginTop: 12, fontSize: '16px', fontWeight: 500 }}>筹备进度</div>
                  <div style={{ color: '#8C8C8C', fontSize: '12px' }}>12/20 家</div>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={90}
                    format={percent => `${percent}%`}
                    strokeColor="#722ED1"
                    size={120}
                  />
                  <div style={{ marginTop: 12, fontSize: '16px', fontWeight: 500 }}>运营率</div>
                  <div style={{ color: '#8C8C8C', fontSize: '12px' }}>115/128 家</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 内容区域 */}
      <Row gutter={[16, 16]}>
        {/* 最近门店计划 */}
        <Col xs={24} lg={16}>
          <Card title="最近门店计划" extra={<a href="/store-plan">查看全部</a>}>
            <Table
              columns={recentPlansColumns}
              dataSource={recentPlansData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 待办事项 */}
        <Col xs={24} lg={8}>
          <Card title="待办事项" extra={<a href="/approval">查看全部</a>}>
            <List
              dataSource={todoListData}
              renderItem={item => (
                <List.Item
                  extra={
                    item.status === 'urgent' ? (
                      <Tag color="red">紧急</Tag>
                    ) : (
                      <Tag color="blue">普通</Tag>
                    )
                  }
                >
                  <List.Item.Meta title={<a>{item.title}</a>} description={item.description} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
