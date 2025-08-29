/**
 * 面包屑导航组件
 */

import React from 'react'
import { Breadcrumb, Space } from 'antd'
import { HomeOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { routerUtils } from '../../router'
import type { BreadcrumbItem } from '../../router/types'

export interface BreadcrumbNavProps {
  /** 自定义面包屑项 */
  items?: BreadcrumbItem[]
  /** 是否显示首页 */
  showHome?: boolean
  /** 首页标题 */
  homeTitle?: string
  /** 首页路径 */
  homePath?: string
  /** 分隔符 */
  separator?: React.ReactNode
  /** 自定义样式 */
  style?: React.CSSProperties
  /** 自定义类名 */
  className?: string
  /** 最大显示项数 */
  maxItems?: number
  /** 是否可点击 */
  clickable?: boolean
}

/**
 * 面包屑导航组件
 */
export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items: customItems,
  showHome = true,
  homeTitle = '首页',
  homePath = '/',
  separator = <RightOutlined style={{ fontSize: 12, color: '#ccc' }} />,
  style,
  className,
  maxItems = 6,
  clickable = true
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  // 获取面包屑数据
  const breadcrumbItems = React.useMemo(() => {
    let items: BreadcrumbItem[] = []

    // 添加首页
    if (showHome) {
      items.push({
        title: homeTitle,
        path: homePath,
        icon: <HomeOutlined />
      })
    }

    // 使用自定义项或从路由生成
    if (customItems) {
      items = items.concat(customItems)
    } else {
      const routeItems = routerUtils.generateBreadcrumb(location.pathname)
      items = items.concat(routeItems)
    }

    // 限制最大显示项数
    if (items.length > maxItems) {
      const firstItem = items[0]
      const lastItems = items.slice(-(maxItems - 2))
      items = [
        firstItem,
        { title: '...', path: undefined },
        ...lastItems
      ]
    }

    return items
  }, [customItems, location.pathname, showHome, homeTitle, homePath, maxItems])

  // 处理点击事件
  const handleItemClick = (item: BreadcrumbItem) => {
    if (clickable && item.path && item.path !== location.pathname) {
      navigate(item.path)
    }
  }

  // 转换为Antd Breadcrumb格式
  const antdItems = breadcrumbItems.map((item, index) => {
    const isLast = index === breadcrumbItems.length - 1
    const isEllipsis = item.title === '...'
    
    return {
      key: `breadcrumb-${index}`,
      title: (
        <span
          style={{
            cursor: clickable && item.path && !isLast && !isEllipsis ? 'pointer' : 'default',
            color: isLast ? '#000' : isEllipsis ? '#999' : clickable && item.path ? '#1890ff' : 'inherit',
            fontWeight: isLast ? 500 : 'normal'
          }}
          onClick={() => !isLast && !isEllipsis && handleItemClick(item)}
        >
          <Space size={4}>
            {item.icon}
            {item.title}
          </Space>
        </span>
      )
    }
  })

  // 如果没有面包屑项，不显示
  if (breadcrumbItems.length === 0) {
    return null
  }

  return (
    <Breadcrumb
      items={antdItems}
      separator={separator}
      style={{
        margin: '0',
        fontSize: '14px',
        ...style
      }}
      className={className}
    />
  )
}

/**
 * 使用面包屑Hook
 */
export const useBreadcrumb = () => {
  const location = useLocation()

  // 获取当前路径的面包屑
  const breadcrumbs = React.useMemo(() => {
    return routerUtils.generateBreadcrumb(location.pathname)
  }, [location.pathname])

  // 设置页面标题
  React.useEffect(() => {
    const currentTitle = breadcrumbs[breadcrumbs.length - 1]?.title
    if (currentTitle) {
      document.title = `${currentTitle} - 好饭碗门店管理系统`
    }
  }, [breadcrumbs])

  return {
    breadcrumbs,
    currentTitle: breadcrumbs[breadcrumbs.length - 1]?.title,
    parentTitle: breadcrumbs[breadcrumbs.length - 2]?.title
  }
}

export default BreadcrumbNav