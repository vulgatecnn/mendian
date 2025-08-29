import React from 'react'
import { Space, Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<{
    path?: string
    title: string
  }>
  extra?: React.ReactNode
  children?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  extra,
  children
}) => {
  const defaultBreadcrumbs = [
    {
      title: <HomeOutlined />,
      path: '/'
    }
  ]

  const allBreadcrumbs = breadcrumbs ? [...defaultBreadcrumbs, ...breadcrumbs] : defaultBreadcrumbs

  const breadcrumbItems = allBreadcrumbs.map((item, index) => ({
    key: index,
    title: item.path ? <a href={item.path}>{item.title}</a> : item.title
  }))

  return (
    <div className="page-header">
      {allBreadcrumbs.length > 1 && (
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: description ? 8 : 16
        }}
      >
        <h1 className="page-title">{title}</h1>
        {extra && <Space>{extra}</Space>}
      </div>

      {description && <p className="page-description">{description}</p>}

      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

export default PageHeader
