import React from 'react'
import { Card } from 'antd'
import PageHeader from '@/components/common/PageHeader'

const OperationList: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="门店运营"
        description="管理付款项管理、资产管理等门店运营相关事务"
        breadcrumbs={[{ title: '门店运营' }]}
      />

      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>门店运营功能开发中...</p>
        </div>
      </Card>
    </div>
  )
}

export default OperationList
