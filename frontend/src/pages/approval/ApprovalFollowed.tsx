/**
 * 关注审批列表页面
 */
import React from 'react'
import ApprovalList from './components/ApprovalList'

const ApprovalFollowed: React.FC = () => {
  return <ApprovalList type="followed" title="关注审批" />
}

export default ApprovalFollowed
