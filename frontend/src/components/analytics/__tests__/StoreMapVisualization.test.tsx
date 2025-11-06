/**
 * 开店地图可视化组件测试
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StoreMapVisualization from '../StoreMapVisualization'
import type { StoreMapData } from '../../../api/analyticsService'

// 模拟 Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: vi.fn()
  })
}))

// 模拟 Leaflet 库
vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn()
      }
    },
    divIcon: vi.fn(() => ({}))
  }
}))

const mockData: StoreMapData = {
  stores: [
    {
      id: '1',
      name: '测试门店',
      coordinates: [116.4074, 39.9042],
      status: 'opened',
      region: '华北区',
      storeType: '直营店',
      address: '北京市朝阳区测试路123号',
      openDate: '2024-01-15'
    }
  ],
  regions: [
    {
      regionId: '1',
      regionName: '华北区',
      totalStores: 1,
      statusCounts: { planned: 0, expanding: 0, preparing: 0, opened: 1 }
    }
  ],
  mapCenter: [116.4074, 39.9042],
  zoomLevel: 10,
  lastUpdated: '2024-01-01T00:00:00Z'
}

describe('StoreMapVisualization', () => {
  it('应该正确渲染地图组件', () => {
    render(<StoreMapVisualization data={mockData} />)
    
    expect(screen.getByText('开店地图')).toBeInTheDocument()
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('应该显示门店统计信息', () => {
    render(<StoreMapVisualization data={mockData} />)
    
    expect(screen.getByText('门店状态统计')).toBeInTheDocument()
    expect(screen.getByText('总计: 1 家')).toBeInTheDocument()
  })

  it('应该在无数据时显示空状态', () => {
    render(<StoreMapVisualization />)
    
    expect(screen.getByText('暂无门店数据')).toBeInTheDocument()
  })

  it('应该在加载时显示加载状态', () => {
    render(<StoreMapVisualization loading={true} />)
    
    expect(screen.getByText('正在加载地图数据...')).toBeInTheDocument()
  })
})