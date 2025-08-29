import React from 'react'
import { Card, Button } from 'antd'

const SimpleStorePlanList: React.FC = () => {
  console.log('SimpleStorePlanList 组件已渲染')
  
  return (
    <div style={{ padding: '24px' }}>
      <Card title="开店计划管理" extra={<Button type="primary">新建计划</Button>}>
        <h3>开店计划列表</h3>
        <p>这是简化版的开店计划页面，用于测试路由是否正常工作。</p>
        <p>当前时间: {new Date().toLocaleString()}</p>
        <p>如果你能看到这个内容，说明开店计划路由已经正常工作了。</p>
      </Card>
    </div>
  )
}

export default SimpleStorePlanList