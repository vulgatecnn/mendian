import React from 'react'
import { Card } from 'antd'
import PageHeader from '@/components/common/PageHeader'

const ExpansionList: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="拓店管理"
        description="管理候选点位、跟进记录、商务条件等拓店相关信息"
        breadcrumbs={[{ title: '拓店管理' }]}
      />

      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>拓店管理功能开发中...</p>
        </div>
      </Card>
    </div>
  )
}

export default ExpansionList
