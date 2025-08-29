import React from 'react'
import { Card } from 'antd'
import PageHeader from '@/components/common/PageHeader'

const StoreFilesList: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="门店档案"
        description="管理门店基本信息、证照管理、档案查询等门店档案信息"
        breadcrumbs={[{ title: '门店档案' }]}
      />

      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>门店档案功能开发中...</p>
        </div>
      </Card>
    </div>
  )
}

export default StoreFilesList
