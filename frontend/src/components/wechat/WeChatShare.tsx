/**
 * 企业微信分享组件
 */

import React, { useState } from 'react'
import { Button, Space, Modal, Input, Form, Upload, message, Tooltip } from 'antd'
import {
  ShareAltOutlined,
  WechatOutlined,
  PictureOutlined,
  LinkOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useWeChat } from '../../hooks/useWeChat'
import type { WeChatShareContent } from '../../types/wechat'
import type { UploadFile } from 'antd/es/upload/interface'

const { TextArea } = Input
const { Dragger } = Upload

interface WeChatShareProps {
  /** 默认分享内容 */
  defaultContent?: Partial<WeChatShareContent>
  /** 分享成功回调 */
  onShareSuccess?: () => void
  /** 分享失败回调 */
  onShareError?: (error: string) => void
  /** 按钮文本 */
  buttonText?: string
  /** 按钮类型 */
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义样式类名 */
  className?: string
}

export const WeChatShare: React.FC<WeChatShareProps> = ({
  defaultContent,
  onShareSuccess,
  onShareError,
  buttonText = '分享',
  buttonType = 'default',
  disabled,
  className
}) => {
  const { shareToChat, shareToMoments, environment, error } = useWeChat()
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  // 处理分享操作
  const handleShare = async (type: 'chat' | 'moments') => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      const shareContent: WeChatShareContent = {
        title: values.title,
        desc: values.desc || values.title,
        link: values.link,
        imgUrl: values.imgUrl || ''
      }

      if (type === 'chat') {
        await shareToChat(shareContent)
      } else {
        await shareToMoments(shareContent)
      }

      message.success(`分享到${type === 'chat' ? '聊天' : '朋友圈'}成功`)
      setModalVisible(false)
      
      if (onShareSuccess) {
        onShareSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分享失败'
      message.error(errorMessage)
      
      if (onShareError) {
        onShareError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // 处理图片上传
  const handleImageUpload = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        form.setFieldsValue({ imgUrl: e.target?.result })
        resolve(false) // 阻止默认上传行为
      }
      reader.readAsDataURL(file)
    })
  }

  // 打开分享弹窗
  const openShareModal = () => {
    // 设置默认值
    if (defaultContent) {
      form.setFieldsValue({
        title: defaultContent.title || document.title,
        desc: defaultContent.desc || '',
        link: defaultContent.link || window.location.href,
        imgUrl: defaultContent.imgUrl || ''
      })
    } else {
      form.setFieldsValue({
        title: document.title,
        desc: '',
        link: window.location.href,
        imgUrl: ''
      })
    }
    
    setModalVisible(true)
  }

  // 检查是否支持分享
  const isShareSupported = environment?.isWeChatWork || false

  return (
    <>
      <Tooltip
        title={!isShareSupported ? '请在企业微信中使用分享功能' : ''}
      >
        <Button
          type={buttonType}
          icon={<ShareAltOutlined />}
          onClick={openShareModal}
          disabled={disabled || !isShareSupported}
          className={className}
        >
          {buttonText}
        </Button>
      </Tooltip>

      <Modal
        title="分享到企业微信"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: document.title,
            desc: '',
            link: window.location.href,
            imgUrl: ''
          }}
        >
          <Form.Item
            label="分享标题"
            name="title"
            rules={[
              { required: true, message: '请输入分享标题' },
              { max: 100, message: '标题不能超过100个字符' }
            ]}
          >
            <Input
              placeholder="请输入分享标题"
              prefix={<FileTextOutlined />}
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="分享描述"
            name="desc"
            rules={[
              { max: 200, message: '描述不能超过200个字符' }
            ]}
          >
            <TextArea
              placeholder="请输入分享描述（可选）"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="分享链接"
            name="link"
            rules={[
              { required: true, message: '请输入分享链接' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input
              placeholder="https://example.com"
              prefix={<LinkOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="分享图片"
            name="imgUrl"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="图片URL（可选）"
                prefix={<PictureOutlined />}
              />
              
              <Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleImageUpload}
                style={{ padding: '20px' }}
              >
                <p className="ant-upload-drag-icon">
                  <PictureOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传分享图片</p>
                <p className="ant-upload-hint">
                  支持 JPG、PNG 格式，建议尺寸 300x300
                </p>
              </Dragger>
            </Space>
          </Form.Item>

          {/* 图片预览 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.imgUrl !== currentValues.imgUrl
            }
          >
            {({ getFieldValue }) => {
              const imgUrl = getFieldValue('imgUrl')
              return imgUrl ? (
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <img
                    src={imgUrl}
                    alt="分享图片预览"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              ) : null
            }}
          </Form.Item>

          {/* 分享按钮 */}
          <Space style={{ width: '100%', justifyContent: 'center' }}>
            <Button
              type="primary"
              icon={<WechatOutlined />}
              onClick={() => handleShare('chat')}
              loading={loading}
              size="large"
            >
              分享到聊天
            </Button>
            
            <Button
              icon={<WechatOutlined />}
              onClick={() => handleShare('moments')}
              loading={loading}
              size="large"
            >
              分享到朋友圈
            </Button>
          </Space>

          {error && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span style={{ color: '#ff4d4f', fontSize: '14px' }}>
                {error}
              </span>
            </div>
          )}
        </Form>
      </Modal>
    </>
  )
}

export default WeChatShare