/**
 * 404页面组件
 */

import React from 'react'
import { Result, Button, Space, Typography } from 'antd'
import { HomeOutlined, LeftOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Text, Paragraph } = Typography

export interface NotFoundProps {
  /** 自定义标题 */
  title?: string
  /** 自定义描述 */
  description?: string
  /** 是否显示返回上一页按钮 */
  showBackButton?: boolean
  /** 是否显示搜索建议 */
  showSearchSuggestion?: boolean
  /** 自定义操作按钮 */
  extra?: React.ReactNode[]
}

/**
 * 404页面组件
 */
export const NotFound: React.FC<NotFoundProps> = ({
  title = '页面不存在',
  description,
  showBackButton = true,
  showSearchSuggestion = true,
  extra
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  // 返回首页
  const handleGoHome = () => {
    navigate('/', { replace: true })
  }

  // 返回上一页
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
  }

  // 搜索页面
  const handleSearch = () => {
    // 这里可以跳转到搜索页面或显示搜索框
    console.log('Search functionality not implemented yet')
  }

  // 默认描述
  const defaultDescription = (
    <div>
      <Paragraph>抱歉，您访问的页面不存在或已被移除。</Paragraph>
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">当前路径: </Text>
        <Text code>{location.pathname}</Text>
      </div>
      {showSearchSuggestion && (
        <Paragraph style={{ marginTop: 16 }}>
          <Text type="secondary">可能的原因：</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>页面链接已过期或不正确</li>
            <li>页面已被移动或删除</li>
            <li>您没有访问此页面的权限</li>
            <li>网络连接出现问题</li>
          </ul>
        </Paragraph>
      )}
    </div>
  )

  // 默认操作按钮
  const defaultExtra = [
    <Button key="home" type="primary" icon={<HomeOutlined />} onClick={handleGoHome}>
      返回首页
    </Button>
  ]

  if (showBackButton) {
    defaultExtra.unshift(
      <Button key="back" icon={<LeftOutlined />} onClick={handleGoBack}>
        返回上一页
      </Button>
    )
  }

  if (showSearchSuggestion) {
    defaultExtra.push(
      <Button key="search" icon={<SearchOutlined />} onClick={handleSearch}>
        搜索页面
      </Button>
    )
  }

  return (
    <div style={{ 
      padding: '60px 20px',
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Result
        status="404"
        title="404"
        subTitle={title}
        extra={
          <Space direction="vertical" align="center" size="large" style={{ width: '100%' }}>
            <div style={{ maxWidth: 600, textAlign: 'left' }}>
              {description || defaultDescription}
            </div>
            <Space wrap>
              {extra || defaultExtra}
            </Space>
          </Space>
        }
      />
    </div>
  )
}

export default NotFound