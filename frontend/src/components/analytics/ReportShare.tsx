/**
 * 报表分享组件
 */
import React, { useState } from 'react'
import {
  Form,
  Grid,
  Input,
  Select,
  DatePicker,
  Switch,
  Button,
  Space,
  Typography,
  Alert,
  Card,
  Divider,
  Tag,
  Tooltip,
  Message,
  Modal
} from '@arco-design/web-react'
import {
  IconExport,
  IconCopy,
  IconEmail,
  IconLink,
  IconLock,
  IconUnlock,
  IconCalendar,
  IconUser,
  IconCheck
} from '@arco-design/web-react/icon'
import { useReportService } from '../../api/reportService'
import type { ReportTask, ReportShareConfig, ReportShareInfo } from '../../api/reportService'
import styles from './ReportShare.module.css'

const { Row, Col } = Grid
const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

// 组件属性
export interface ReportShareProps {
  task: ReportTask
  onClose?: () => void
  onShared?: (shareInfo: ReportShareInfo) => void
}

/**
 * 报表分享组件
 */
const ReportShare: React.FC<ReportShareProps> = ({
  task,
  onClose,
  onShared
}) => {
  const [form] = Form.useForm()
  const [shareInfo, setShareInfo] = useState<ReportShareInfo | null>(null)
  const [shareType, setShareType] = useState<'link' | 'email'>('link')
  const [hasPassword, setHasPassword] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const { loading, error, shareReport } = useReportService()

  /**
   * 处理分享
   */
  const handleShare = async () => {
    try {
      const values = await form.validate()
      
      const config: ReportShareConfig = {
        taskId: task.taskId,
        shareType,
        allowDownload: values.allowDownload !== false,
        expiresAt: values.expiresAt?.toISOString(),
        password: hasPassword ? values.password : undefined,
        recipients: shareType === 'email' ? values.recipients : undefined
      }

      const result = await shareReport(config)
      if (result) {
        setShareInfo(result)
        onShared?.(result)
        
        if (shareType === 'email') {
          Message.success('邮件分享链接已发送')
        } else {
          Message.success('分享链接已生成')
        }
      }
    } catch (error) {
      console.error('分享失败:', error)
    }
  }

  /**
   * 复制分享链接
   */
  const handleCopyLink = async () => {
    if (!shareInfo?.shareUrl) return

    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl)
      setCopySuccess(true)
      Message.success('链接已复制到剪贴板')
      
      setTimeout(() => {
        setCopySuccess(false)
      }, 2000)
    } catch (error) {
      Message.error('复制失败，请手动复制')
    }
  }

  /**
   * 重新生成分享链接
   */
  const handleRegenerateLink = () => {
    Modal.confirm({
      title: '重新生成分享链接',
      content: '重新生成后，原有的分享链接将失效。确定要继续吗？',
      onOk: () => {
        setShareInfo(null)
        handleShare()
      }
    })
  }

  /**
   * 渲染分享配置表单
   */
  const renderShareForm = () => (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        shareType: 'link',
        allowDownload: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 默认7天后过期
      }}
    >
      {/* 分享方式 */}
      <Form.Item label="分享方式" field="shareType">
        <Select
          value={shareType}
          onChange={setShareType}
          className={styles.shareTypeSelect}
        >
          <Option value="link">
            <Space>
              <IconLink />
              <span>生成分享链接</span>
            </Space>
          </Option>
          <Option value="email">
            <Space>
              <IconEmail />
              <span>邮件发送</span>
            </Space>
          </Option>
        </Select>
      </Form.Item>

      {/* 邮件收件人 */}
      {shareType === 'email' && (
        <Form.Item
          label="收件人邮箱"
          field="recipients"
          rules={[
            { required: true, message: '请输入收件人邮箱' },
            {
              validator: (value, callback) => {
                if (!value || value.length === 0) {
                  callback('请至少输入一个邮箱地址')
                  return
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                const invalidEmails = value.filter((email: string) => !emailRegex.test(email))
                
                if (invalidEmails.length > 0) {
                  callback(`邮箱格式不正确: ${invalidEmails.join(', ')}`)
                  return
                }
                
                callback()
              }
            }
          ]}
        >
          <Select
            mode="tags"
            placeholder="请输入邮箱地址，按回车添加多个"
            allowCreate
            tokenSeparators={[',', ';', ' ']}
          />
        </Form.Item>
      )}

      {/* 过期时间 */}
      <Form.Item label="过期时间" field="expiresAt">
        <DatePicker
          showTime
          placeholder="请选择过期时间"
          disabledDate={(date) => date.isBefore(new Date(), 'day')}
          style={{ width: '100%' }}
        />
      </Form.Item>

      {/* 访问权限 */}
      <Form.Item label="访问权限">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className={styles.permissionItem}>
            <Switch
              checked={hasPassword}
              onChange={setHasPassword}
            />
            <Space>
              {hasPassword ? <IconLock /> : <IconUnlock />}
              <Text>设置访问密码</Text>
            </Space>
          </div>
          
          {hasPassword && (
            <Form.Item
              field="password"
              rules={[
                { required: true, message: '请输入访问密码' },
                { minLength: 4, message: '密码至少4位' }
              ]}
              style={{ margin: 0 }}
            >
              <Input.Password
                placeholder="请输入访问密码"
                className={styles.passwordInput}
              />
            </Form.Item>
          )}
          
          <div className={styles.permissionItem}>
            <Form.Item field="allowDownload" noStyle>
              <Switch defaultChecked />
            </Form.Item>
            <Space>
              <IconExport />
              <Text>允许下载报表文件</Text>
            </Space>
          </div>
        </Space>
      </Form.Item>
    </Form>
  )

  /**
   * 渲染分享结果
   */
  const renderShareResult = () => {
    if (!shareInfo) return null

    return (
      <Card className={styles.shareResultCard}>
        <div className={styles.shareResultHeader}>
          <Space>
            <IconCheck style={{ color: '#52c41a' }} />
            <Title heading={5} style={{ margin: 0 }}>
              分享链接已生成
            </Title>
          </Space>
        </div>

        <div className={styles.shareResultContent}>
          <div className={styles.shareUrl}>
            <Input
              value={shareInfo.shareUrl}
              readOnly
              addonAfter={
                <Button
                  type="text"
                  icon={copySuccess ? <IconCheck /> : <IconCopy />}
                  onClick={handleCopyLink}
                  className={copySuccess ? styles.copySuccess : ''}
                >
                  {copySuccess ? '已复制' : '复制'}
                </Button>
              }
            />
          </div>

          <div className={styles.shareInfo}>
            <Row gutter={16}>
              <Col span={12}>
                <div className={styles.infoItem}>
                  <IconCalendar />
                  <div>
                    <Text type="secondary">过期时间</Text>
                    <div>
                      {new Date(shareInfo.expiresAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className={styles.infoItem}>
                  <IconUser />
                  <div>
                    <Text type="secondary">访问次数</Text>
                    <div>{shareInfo.accessCount} 次</div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <div className={styles.shareActions}>
            <Space>
              <Button onClick={handleRegenerateLink}>
                重新生成
              </Button>
              <Button type="primary" onClick={onClose}>
                完成
              </Button>
            </Space>
          </div>
        </div>
      </Card>
    )
  }

  /**
   * 渲染报表信息
   */
  const renderReportInfo = () => (
    <Card className={styles.reportInfoCard}>
      <div className={styles.reportInfoHeader}>
        <Title heading={5}>报表信息</Title>
      </div>
      
      <div className={styles.reportInfoContent}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className={styles.reportInfoItem}>
            <Text type="secondary">报表名称:</Text>
            <Text>{task.fileName || '未知报表'}</Text>
          </div>
          
          <div className={styles.reportInfoItem}>
            <Text type="secondary">文件大小:</Text>
            <Text>{task.fileSize ? `${(task.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}</Text>
          </div>
          
          <div className={styles.reportInfoItem}>
            <Text type="secondary">生成时间:</Text>
            <Text>{new Date(task.createdAt).toLocaleString('zh-CN')}</Text>
          </div>
          
          <div className={styles.reportInfoItem}>
            <Text type="secondary">状态:</Text>
            <Tag color={task.status === 'completed' ? 'green' : 'orange'}>
              {task.status === 'completed' ? '已完成' : '处理中'}
            </Tag>
          </div>
        </Space>
      </div>
    </Card>
  )

  return (
    <div className={styles.reportShare}>
      {/* 错误提示 */}
      {error && (
        <Alert
          type="error"
          message="分享失败"
          description={error.message}
          closable
          className={styles.errorAlert}
        />
      )}

      {/* 报表信息 */}
      {renderReportInfo()}

      <Divider />

      {/* 分享配置或结果 */}
      {shareInfo ? renderShareResult() : (
        <div className={styles.shareConfig}>
          <Title heading={5}>分享设置</Title>
          {renderShareForm()}
          
          <div className={styles.shareActions}>
            <Space>
              <Button onClick={onClose}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<IconExport />}
                onClick={handleShare}
                loading={loading}
              >
                {shareType === 'email' ? '发送邮件' : '生成链接'}
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* 分享说明 */}
      <Alert
        type="info"
        message="分享说明"
        description={
          <ul className={styles.shareNotice}>
            <li>分享链接默认7天内有效，过期后自动失效</li>
            <li>设置访问密码可以提高分享安全性</li>
            <li>可以随时重新生成分享链接，原链接将失效</li>
            <li>分享的报表文件与原始数据保持一致</li>
          </ul>
        }
        showIcon
        className={styles.shareNoticeAlert}
      />
    </div>
  )
}

export default ReportShare