/**
 * 移动端数据分析页面
 * 整合经营大屏、数据报表和通知功能
 */
import React, { useState } from 'react'
import { 
  Tabs, 
  Button, 
  Space, 
  Typography, 
  Badge,
  Message 
} from '@arco-design/web-react'
import {
  IconDashboard,
  IconFile,
  IconNotification,
  IconSettings
} from '@arco-design/web-react/icon'
import MobileDashboard from '../../components/analytics/MobileDashboard'
import MobileReportViewer from '../../components/analytics/MobileReportViewer'
import { useMobileNotification } from '../../hooks/useMobileNotification'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import './MobileAnalytics.css'

const { Title, Text } = Typography
const TabPane = Tabs.TabPane

/**
 * 移动端数据分析页面组件
 */
const MobileAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  
  // 网络状态
  const { isOnline, isOffline } = useNetworkStatus()
  
  // 通知服务
  const { 
    isSupported: isNotificationSupported, 
    permission: notificationPermission,
    requestPermission 
  } = useMobileNotification({
    autoRequestPermission: false,
    enableDataUpdateNotification: notificationEnabled
  })
  
  // 处理通知设置
  const handleNotificationToggle = async () => {
    if (!notificationEnabled) {
      // 启用通知
      if (notificationPermission === 'default') {
        const newPermission = await requestPermission()
        if (newPermission === 'granted') {
          setNotificationEnabled(true)
          Message.success('通知已启用')
        } else {
          Message.warning('通知权限被拒绝')
        }
      } else if (notificationPermission === 'granted') {
        setNotificationEnabled(true)
        Message.success('通知已启用')
      } else {
        Message.warning('请在浏览器设置中允许通知权限')
      }
    } else {
      // 禁用通知
      setNotificationEnabled(false)
      Message.info('通知已禁用')
    }
  }
  
  // 渲染页面头部
  const renderHeader = () => {
    return (
      <div className="mobile-analytics-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title heading={5} style={{ margin: 0 }}>数据分析</Title>
          
          <Space>
            {isOffline && (
              <Badge status="error" text="离线" />
            )}
            
            {isNotificationSupported && (
              <Button
                type={notificationEnabled ? 'primary' : 'default'}
                icon={<IconNotification />}
                size="small"
                onClick={handleNotificationToggle}
              >
                {notificationEnabled ? '通知已开启' : '通知已关闭'}
              </Button>
            )}
          </Space>
        </Space>
      </div>
    )
  }
  
  // 渲染经营大屏标签页
  const renderDashboardTab = () => {
    return (
      <div className="mobile-analytics-content">
        <MobileDashboard 
          refreshInterval={300000} // 5分钟
          enableNotifications={notificationEnabled}
        />
      </div>
    )
  }
  
  // 渲染数据报表标签页
  const renderReportsTab = () => {
    return (
      <div className="mobile-analytics-content">
        <MobileReportViewer 
          tasks={[]}
          filterOptions={{
            reportTypes: [],
            regions: [],
            storeTypes: []
          }}
        />
      </div>
    )
  }
  
  // 渲染设置标签页
  const renderSettingsTab = () => {
    return (
      <div className="mobile-analytics-content">
        <div className="settings-section">
          <Title heading={6}>通知设置</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>数据更新通知</Text>
              <Button
                type={notificationEnabled ? 'primary' : 'default'}
                size="small"
                onClick={handleNotificationToggle}
              >
                {notificationEnabled ? '已开启' : '已关闭'}
              </Button>
            </Space>
            
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>通知权限状态</Text>
              <Badge 
                status={
                  notificationPermission === 'granted' ? 'success' :
                  notificationPermission === 'denied' ? 'error' : 'default'
                }
                text={
                  notificationPermission === 'granted' ? '已授权' :
                  notificationPermission === 'denied' ? '已拒绝' : '未设置'
                }
              />
            </Space>
            
            {notificationPermission === 'default' && (
              <Button
                type="primary"
                long
                onClick={requestPermission}
              >
                请求通知权限
              </Button>
            )}
          </Space>
        </div>
        
        <div className="settings-section">
          <Title heading={6}>网络状态</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>当前状态</Text>
              <Badge 
                status={isOnline ? 'success' : 'error'}
                text={isOnline ? '在线' : '离线'}
              />
            </Space>
            
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isOffline && '离线模式下将使用缓存数据'}
            </Text>
          </Space>
        </div>
        
        <div className="settings-section">
          <Title heading={6}>关于</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>版本</Text>
              <Text type="secondary">1.0.0</Text>
            </Space>
            
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>最后更新</Text>
              <Text type="secondary">{new Date().toLocaleDateString('zh-CN')}</Text>
            </Space>
          </Space>
        </div>
      </div>
    )
  }
  
  return (
    <div className="mobile-analytics-page">
      {renderHeader()}
      
      <Tabs 
        activeTab={activeTab} 
        onChange={setActiveTab}
        type="rounded"
        className="mobile-analytics-tabs"
      >
        <TabPane 
          key="dashboard" 
          title={
            <span>
              <IconDashboard style={{ marginRight: 4 }} />
              大屏
            </span>
          }
        >
          {renderDashboardTab()}
        </TabPane>
        
        <TabPane 
          key="reports" 
          title={
            <span>
              <IconFile style={{ marginRight: 4 }} />
              报表
            </span>
          }
        >
          {renderReportsTab()}
        </TabPane>
        
        <TabPane 
          key="settings" 
          title={
            <span>
              <IconSettings style={{ marginRight: 4 }} />
              设置
            </span>
          }
        >
          {renderSettingsTab()}
        </TabPane>
      </Tabs>
    </div>
  )
}

export default MobileAnalytics
