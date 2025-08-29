import React, { useState } from 'react'
import { Tabs, Card } from 'antd'
import {
  BuildOutlined,
  CheckSquareOutlined,
  DeliveredProcedureOutlined,
  BarChartOutlined,
  ProjectOutlined
} from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import ProjectList from './ProjectList'
import ConstructionList from './ConstructionList'
import DeliveryList from './DeliveryList'
import PreparationStats from './PreparationStats'

const { TabPane } = Tabs

const PreparationIndex: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects')

  const tabs = [
    {
      key: 'projects',
      label: (
        <span>
          <ProjectOutlined />
          筹备项目
        </span>
      ),
      content: <ProjectList embedded />
    },
    {
      key: 'construction',
      label: (
        <span>
          <BuildOutlined />
          施工管理
        </span>
      ),
      content: <ConstructionList embedded />
    },
    {
      key: 'delivery',
      label: (
        <span>
          <DeliveredProcedureOutlined />
          交付管理
        </span>
      ),
      content: <DeliveryList embedded />
    },
    {
      key: 'stats',
      label: (
        <span>
          <BarChartOutlined />
          数据统计
        </span>
      ),
      content: <PreparationStats />
    }
  ]

  return (
    <div>
      <PageHeader
        title="开店筹备管理"
        description="管理工程施工、验收确认、门店交付等开店筹备相关事务"
        breadcrumbs={[{ title: '开店筹备' }]}
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

export default PreparationIndex