import React from 'react'
import { Card, Space, Button, Image } from 'antd'
import {
  EnvironmentOutlined,
  ShopOutlined,
  CalendarOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined
} from '@ant-design/icons'
import StatusTag from './StatusTag'
import type { StatusType, StoreType } from './StatusTag'

interface StoreCardProps {
  id: string
  name: string
  address: string
  storeType: StoreType
  status: StatusType
  area?: number
  openDate?: string
  manager?: string
  image?: string
  revenue?: number
  customers?: number
  className?: string
  style?: React.CSSProperties
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onMore?: (id: string) => void
}

const StoreCard: React.FC<StoreCardProps> = ({
  id,
  name,
  address,
  storeType,
  status,
  area,
  openDate,
  manager,
  image,
  revenue,
  customers,
  className,
  style,
  onView,
  onEdit,
  onMore
}) => {
  const cardStyle = {
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow:
      '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
    border: '1px solid #F0F0F0',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    ...style
  }

  const imageStyle = {
    width: '100%',
    height: 140,
    objectFit: 'cover' as const,
    backgroundColor: '#f5f5f5'
  }

  const contentStyle = {
    padding: '16px'
  }

  const titleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#262626',
    marginBottom: 8,
    lineHeight: 1.4
  }

  const infoItemStyle = {
    display: 'flex',
    alignItems: 'center',
    color: '#666666',
    fontSize: '13px',
    marginBottom: 6,
    lineHeight: 1.4
  }

  const iconStyle = {
    marginRight: 6,
    fontSize: '12px',
    color: '#8C8C8C'
  }

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #F0F0F0'
  }

  const statItemStyle = {
    textAlign: 'center' as const
  }

  const statValueStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#262626',
    lineHeight: 1.2
  }

  const statLabelStyle = {
    fontSize: '12px',
    color: '#8C8C8C',
    marginTop: 2
  }

  const actionsStyle = {
    padding: '12px 16px',
    borderTop: '1px solid #F0F0F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }

  return (
    <Card
      {...(className && { className })}
      style={cardStyle}
      bodyStyle={{ padding: 0 }}
      hoverable
      onClick={() => onView?.(id)}
    >
      {/* 门店图片 */}
      {image ? (
        <Image src={image} alt={name} style={imageStyle} preview={false} />
      ) : (
        <div
          style={{
            ...imageStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa'
          }}
        >
          <ShopOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
        </div>
      )}

      {/* 门店信息 */}
      <div style={contentStyle}>
        {/* 标题和状态 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12
          }}
        >
          <h3 style={titleStyle} className="text-ellipsis">
            {name}
          </h3>
          <Space size={4}>
            <StatusTag type="store" value={storeType} size="small" />
            <StatusTag type="status" value={status} size="small" />
          </Space>
        </div>

        {/* 基本信息 */}
        <div style={infoItemStyle}>
          <EnvironmentOutlined style={iconStyle} />
          <span className="text-ellipsis">{address}</span>
        </div>

        {area && (
          <div style={infoItemStyle}>
            <ShopOutlined style={iconStyle} />
            <span>{area}㎡</span>
          </div>
        )}

        {openDate && (
          <div style={infoItemStyle}>
            <CalendarOutlined style={iconStyle} />
            <span>开业时间: {openDate}</span>
          </div>
        )}

        {manager && (
          <div style={infoItemStyle}>
            <UserOutlined style={iconStyle} />
            <span>店长: {manager}</span>
          </div>
        )}

        {/* 经营数据 */}
        {(revenue !== undefined || customers !== undefined) && (
          <div style={statsStyle}>
            {revenue !== undefined && (
              <div style={statItemStyle}>
                <div style={statValueStyle}>{revenue}万</div>
                <div style={statLabelStyle}>月营业额</div>
              </div>
            )}
            {customers !== undefined && (
              <div style={statItemStyle}>
                <div style={statValueStyle}>{customers}</div>
                <div style={statLabelStyle}>月客流</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div style={actionsStyle} onClick={e => e.stopPropagation()}>
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView?.(id)}>
            查看
          </Button>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit?.(id)}>
            编辑
          </Button>
        </Space>

        <Button type="text" size="small" icon={<MoreOutlined />} onClick={() => onMore?.(id)} />
      </div>
    </Card>
  )
}

export default StoreCard
