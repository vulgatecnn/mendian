/**
 * 审批详情页面
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Steps,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Message,
  Spin,
  Tag,
  Timeline,
  Empty,
  Divider,
} from '@arco-design/web-react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  IconCheck,
  IconClose,
  IconSwap,
  IconUserAdd,
  IconStar,
  IconStarFill,
} from '@arco-design/web-react/icon'
import ApprovalService from '../../api/approvalService'
import UserService from '../../api/userService'
import type {
  ApprovalInstance,
  ApprovalProcessParams,
  ApprovalComment,
  User,
} from '../../types'

const FormItem = Form.Item
const { Step } = Steps

const ApprovalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [instance, setInstance] = useState<ApprovalInstance | null>(null)
  const [comments, setComments] = useState<ApprovalComment[]>([])
  const [users, setUsers] = useState<User[]>([])

  // 审批处理相关状态
  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [processAction, setProcessAction] = useState<'approve' | 'reject' | 'transfer' | 'countersign'>('approve')
  const [processForm] = Form.useForm()
  const [processing, setProcessing] = useState(false)

  // 撤销审批相关状态
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false)
  const [withdrawForm] = Form.useForm()
  const [withdrawing, setWithdrawing] = useState(false)

  // 评论相关状态
  const [commentModalVisible, setCommentModalVisible] = useState(false)
  const [commentForm] = Form.useForm()
  const [commenting, setCommenting] = useState(false)

  useEffect(() => {
    if (id) {
      loadInstanceDetail()
      loadComments()
      loadUsers()
    }
  }, [id])

  const loadInstanceDetail = async () => {
    try {
      setLoading(true)
      const data = await ApprovalService.getInstance(Number(id))
      setInstance(data)
    } catch (error) {
      Message.error('加载审批详情失败')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const data = await ApprovalService.getComments(Number(id))
      setComments(data)
    } catch (error) {
      console.error('加载评论失败', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await UserService.getUsers({ is_active: true })
      setUsers(response.results)
    } catch (error) {
      console.error('加载用户列表失败', error)
    }
  }

  // 打开审批处理对话框
  const openProcessModal = (action: 'approve' | 'reject' | 'transfer' | 'countersign') => {
    setProcessAction(action)
    setProcessModalVisible(true)
    processForm.resetFields()
  }

  // 处理审批
  const handleProcess = async () => {
    try {
      await processForm.validate()
      const values = processForm.getFieldsValue()

      setProcessing(true)

      const params: ApprovalProcessParams = {
        node_id: instance!.current_node_id!,
        action: processAction,
        comment: values.comment,
      }

      if (processAction === 'transfer') {
        params.transfer_to_user_id = values.transfer_to_user_id
      } else if (processAction === 'countersign') {
        params.countersign_user_ids = values.countersign_user_ids
      }

      await ApprovalService.processApproval(Number(id), params)
      Message.success('审批处理成功')
      setProcessModalVisible(false)
      loadInstanceDetail()
      loadComments()
    } catch (error) {
      Message.error('审批处理失败')
    } finally {
      setProcessing(false)
    }
  }

  // 撤销审批
  const handleWithdraw = async () => {
    try {
      await withdrawForm.validate()
      const values = withdrawForm.getFieldsValue()

      setWithdrawing(true)
      await ApprovalService.withdrawApproval(Number(id), { reason: values.reason })
      Message.success('审批撤销成功')
      setWithdrawModalVisible(false)
      loadInstanceDetail()
    } catch (error) {
      Message.error('审批撤销失败')
    } finally {
      setWithdrawing(false)
    }
  }

  // 关注/取消关注
  const handleToggleFollow = async () => {
    try {
      const isFollowed = instance?.follows?.some((f) => f.user_id === getCurrentUserId())
      await ApprovalService.toggleFollow(Number(id), { follow: !isFollowed })
      Message.success(isFollowed ? '已取消关注' : '已关注')
      loadInstanceDetail()
    } catch (error) {
      Message.error('操作失败')
    }
  }

  // 添加评论
  const handleAddComment = async () => {
    try {
      await commentForm.validate()
      const values = commentForm.getFieldsValue()

      setCommenting(true)
      await ApprovalService.addComment(Number(id), { content: values.content })
      Message.success('评论发表成功')
      setCommentModalVisible(false)
      commentForm.resetFields()
      loadComments()
    } catch (error) {
      Message.error('评论发表失败')
    } finally {
      setCommenting(false)
    }
  }

  // 获取当前用户ID（这里需要从实际的用户上下文中获取）
  const getCurrentUserId = () => {
    // TODO: 从用户上下文中获取当前用户ID
    return 1
  }

  // 渲染审批状态标签
  const renderStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'gray', text: '待审批' },
      in_progress: { color: 'blue', text: '审批中' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' },
      cancelled: { color: 'orange', text: '已取消' },
      withdrawn: { color: 'gray', text: '已撤销' },
    }
    const config = statusMap[status] || { color: 'gray', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 渲染审批流程图
  const renderApprovalFlow = () => {
    if (!instance || !instance.nodes || instance.nodes.length === 0) {
      return <Empty description="暂无审批流程" />
    }

    const currentStep = instance.nodes.findIndex((node) => node.id === instance.current_node_id)

    return (
      <Steps
        current={currentStep}
        direction="vertical"
        style={{ marginTop: 20 }}
      >
        {instance.nodes.map((node) => {
          let status: 'wait' | 'process' | 'finish' | 'error' = 'wait'
          if (node.status === 'approved') {
            status = 'finish'
          } else if (node.status === 'rejected') {
            status = 'error'
          } else if (node.status === 'in_progress') {
            status = 'process'
          }

          return (
            <Step
              key={node.id}
              title={node.node_name}
              description={
                <div>
                  <div>
                    审批人：
                    {node.approvers.map((u) => u.full_name).join('、')}
                  </div>
                  {node.approved_by && (
                    <div>
                      处理人：{node.approved_by.full_name}
                      <br />
                      处理时间：{node.approved_at}
                    </div>
                  )}
                  {node.approval_comment && (
                    <div>审批意见：{node.approval_comment}</div>
                  )}
                </div>
              }
              status={status}
            />
          )
        })}
      </Steps>
    )
  }

  // 渲染评论列表
  const renderComments = () => {
    if (comments.length === 0) {
      return <Empty description="暂无评论" />
    }

    return (
      <Timeline>
        {comments.map((comment) => (
          <Timeline.Item key={comment.id}>
            <div>
              <strong>{comment.user?.full_name}</strong>
              <span style={{ marginLeft: 10, color: '#999', fontSize: 12 }}>
                {comment.created_at}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>{comment.content}</div>
          </Timeline.Item>
        ))}
      </Timeline>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin />
      </div>
    )
  }

  if (!instance) {
    return (
      <div style={{ padding: '20px' }}>
        <Empty description="审批不存在" />
      </div>
    )
  }

  const isFollowed = instance.follows?.some((f) => f.user_id === getCurrentUserId())
  const canProcess = instance.status === 'in_progress' && instance.current_node?.approvers.some((u) => u.id === getCurrentUserId())
  const canWithdraw = instance.status === 'pending' && instance.initiator_id === getCurrentUserId()

  return (
    <div style={{ padding: '20px' }}>
      <Card
        title={
          <Space>
            <span>{instance.title}</span>
            {renderStatusTag(instance.status)}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={isFollowed ? <IconStarFill /> : <IconStar />}
              onClick={handleToggleFollow}
            >
              {isFollowed ? '已关注' : '关注'}
            </Button>
            {canProcess && (
              <>
                <Button
                  type="primary"
                  icon={<IconCheck />}
                  onClick={() => openProcessModal('approve')}
                >
                  通过
                </Button>
                <Button
                  status="danger"
                  icon={<IconClose />}
                  onClick={() => openProcessModal('reject')}
                >
                  拒绝
                </Button>
                <Button
                  icon={<IconSwap />}
                  onClick={() => openProcessModal('transfer')}
                >
                  转交
                </Button>
                <Button
                  icon={<IconUserAdd />}
                  onClick={() => openProcessModal('countersign')}
                >
                  加签
                </Button>
              </>
            )}
            {canWithdraw && (
              <Button onClick={() => setWithdrawModalVisible(true)}>
                撤销
              </Button>
            )}
            <Button onClick={() => navigate(-1)}>返回</Button>
          </Space>
        }
        bordered={false}
      >
        <Descriptions
          column={2}
          data={[
            { label: '审批单号', value: instance.instance_no },
            { label: '审批模板', value: instance.template?.template_name },
            { label: '发起人', value: instance.initiator?.full_name },
            { label: '发起部门', value: instance.initiator?.department_name },
            { label: '发起时间', value: instance.initiated_at },
            { label: '完成时间', value: instance.completed_at || '-' },
            { label: '业务类型', value: instance.business_type },
            { label: '业务ID', value: instance.business_id },
          ]}
        />

        <Divider />

        <div style={{ marginBottom: 20 }}>
          <h3>表单信息</h3>
          <Descriptions
            column={2}
            data={Object.entries(instance.form_data).map(([key, value]) => ({
              label: key,
              value: String(value),
            }))}
          />
        </div>

        <Divider />

        <div style={{ marginBottom: 20 }}>
          <h3>审批流程</h3>
          {renderApprovalFlow()}
        </div>

        <Divider />

        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <h3>评论</h3>
              <Button
                type="primary"
                size="small"
                onClick={() => setCommentModalVisible(true)}
              >
                发表评论
              </Button>
            </Space>
          </div>
          {renderComments()}
        </div>
      </Card>

      {/* 审批处理对话框 */}
      <Modal
        title={
          processAction === 'approve'
            ? '审批通过'
            : processAction === 'reject'
            ? '审批拒绝'
            : processAction === 'transfer'
            ? '转交审批'
            : '加签审批'
        }
        visible={processModalVisible}
        onOk={handleProcess}
        onCancel={() => setProcessModalVisible(false)}
        confirmLoading={processing}
      >
        <Form form={processForm} layout="vertical">
          {processAction === 'transfer' && (
            <FormItem
              label="转交给"
              field="transfer_to_user_id"
              rules={[{ required: true, message: '请选择转交人' }]}
            >
              <Select placeholder="请选择转交人" showSearch>
                {users.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.full_name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          )}

          {processAction === 'countersign' && (
            <FormItem
              label="加签人员"
              field="countersign_user_ids"
              rules={[{ required: true, message: '请选择加签人员' }]}
            >
              <Select
                placeholder="请选择加签人员"
                mode="multiple"
                showSearch
              >
                {users.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.full_name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          )}

          <FormItem
            label="审批意见"
            field="comment"
            rules={[
              {
                required: processAction === 'reject',
                message: '请输入审批意见',
              },
            ]}
          >
            <Input.TextArea
              placeholder="请输入审批意见"
              rows={4}
            />
          </FormItem>
        </Form>
      </Modal>

      {/* 撤销审批对话框 */}
      <Modal
        title="撤销审批"
        visible={withdrawModalVisible}
        onOk={handleWithdraw}
        onCancel={() => setWithdrawModalVisible(false)}
        confirmLoading={withdrawing}
      >
        <Form form={withdrawForm} layout="vertical">
          <FormItem
            label="撤销原因"
            field="reason"
            rules={[{ required: true, message: '请输入撤销原因' }]}
          >
            <Input.TextArea
              placeholder="请输入撤销原因"
              rows={4}
            />
          </FormItem>
        </Form>
      </Modal>

      {/* 评论对话框 */}
      <Modal
        title="发表评论"
        visible={commentModalVisible}
        onOk={handleAddComment}
        onCancel={() => setCommentModalVisible(false)}
        confirmLoading={commenting}
      >
        <Form form={commentForm} layout="vertical">
          <FormItem
            label="评论内容"
            field="content"
            rules={[{ required: true, message: '请输入评论内容' }]}
          >
            <Input.TextArea
              placeholder="请输入评论内容"
              rows={4}
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default ApprovalDetail
