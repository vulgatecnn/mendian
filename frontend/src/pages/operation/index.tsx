import React, { useState } from 'react'
import { Tabs, Card } from 'antd'
import {
  CreditCardOutlined,
  PropertySafetyOutlined,
  BarChartOutlined,
  DollarCircleOutlined
} from '@ant-design/icons'
import PageHeader from '@/components/common/PageHeader'
import PaymentList from './PaymentList'
import AssetList from './AssetList'
import OperationStats from './OperationStats'

const { TabPane } = Tabs

interface OperationIndexProps {
  embedded?: boolean
}

const OperationIndex: React.FC<OperationIndexProps> = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('payments')

  const tabs = [
    {
      key: 'payments',
      label: (
        <span>
          <CreditCardOutlined />
          待付款项
        </span>
      ),
      content: <PaymentList />
    },
    {
      key: 'assets',
      label: (
        <span>
          <PropertySafetyOutlined />
          资产管理
        </span>
      ),
      content: <AssetList />
    },
    {
      key: 'stats',
      label: (
        <span>
          <BarChartOutlined />
          运营统计
        </span>
      ),
      content: <OperationStats />
    }
  ]

  if (embedded) {
    return (
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
    )
  }

  return (
    <div>
      <PageHeader
        title="门店运营管理"
        description="管理门店日常运营中的付款项目、资产设备等运营支撑事务"
        breadcrumbs={[{ title: '门店运营' }]}
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

export default OperationIndex