/**
 * 待办审批列表页面
 */
import React from 'react'
import ApprovalList from './components/ApprovalList'

const ApprovalPending: React.FC = () => {
  return <ApprovalList type="pending" title="待办审批" />
}

export default ApprovalPending
