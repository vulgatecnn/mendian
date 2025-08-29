import React, { useState } from 'react'
import { Tabs, Card } from 'antd'
import {
  EnvironmentOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import CandidateLocationList from './CandidateLocationList'
import ExpansionDashboard from './ExpansionDashboard'

const { TabPane } = Tabs

const ExpansionIndex: React.FC = () => {
  const [activeTab, setActiveTab] = useState('candidates')

  const tabs = [
    {
      key: 'candidates',
      label: (
        <span>
          <EnvironmentOutlined />
          候选点位
        </span>
      ),
      content: <CandidateLocationList />
    },
    {
      key: 'dashboard',
      label: (
        <span>
          <BarChartOutlined />
          数据仪表板
        </span>
      ),
      content: <ExpansionDashboard />
    }
  ]

  return (
    <div>
      <PageHeader
        title="拓店管理"
        description="管理候选点位、跟进记录、商务条件等拓店相关信息"
        breadcrumbs={[{ title: '拓店管理' }]}
      />

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarGutter={32}
        >
          {tabs.map(tab => (
            <TabPane tab={tab.label} key={tab.key}>
              {tab.content}
            </TabPane>
          ))}
        </Tabs>
      </Card>
    </div>
  )
}

export default ExpansionIndex