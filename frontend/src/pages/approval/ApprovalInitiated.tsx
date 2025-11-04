/**
 * 我发起的审批列表页面
 */
import React from 'react'
import ApprovalList from './components/ApprovalList'

const ApprovalInitiated: React.FC = () => {
  return <ApprovalList type="initiated" title="我发起的审批" />
}

export default ApprovalInitiated