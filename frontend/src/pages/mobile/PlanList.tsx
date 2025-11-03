/**
 * 移动端 - 计划列表页面
 * 适配移动端的计划列表展示，支持下拉刷新和上拉加载
 * 支持离线缓存和网络状态检测
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { List, Card, Tag, Empty, Spin, Message, Badge, Button } from '@arco-design/web-react'
import { IconRight, IconWifi, IconRefresh } from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'
import { PlanService } from '../../api/planService'
import { StorePlan, PlanStatus, StorePlanQueryParams } from '../../types'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { offlineCache, CACHE_STORES, CACHE_EXPIRY } from '../../utils/offlineCache'
import './mobile.css'

// 计划状态配置
const STATUS_CONFIG: Record<PlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'gray' },
  published: { text: '已发布', color: 'blue' },
  executing: { text: '执行中', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' }
}

const MobilePlanList: React.FC = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<StorePlan[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [fromCache, setFromCache] = useState(false)
  const pageSize = 10
  
  const listRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  
  // 网络状态检测
  const { isOnline, isOffline, networkInfo } = useNetworkStatus()

  /**
   * 从缓存加载计划列表
   */
  const loadFromCache = useCallback(async () => {
    try {
      const cachedData = await offlineCache.get<StorePlan[]>(
        CACHE_STORES.PLANS,
        'plan_list'
      )
      
      if (cachedData) {
        setPlans(cachedData)
        setFromCache(true)
        return true
      }
      return false
    } catch (error) {
      console.error('从缓存加载失败:', error)
      return false
    }
  }, [])

  /**
   * 加载计划列表
   */
  const loadPlans = useCallback(async (pageNum: number, isRefresh = false) => {
    if (loadingRef.current) return
    
    loadingRef.current = true
    setLoading(!isRefresh)
    
    try {
      // 如果离线，尝试从缓存加载
      if (isOffline) {
        const hasCache = await loadFromCache()
        if (!hasCache) {
          Message.warning('网络未连接且无缓存数据')
        }
        return
      }
      
      const params: StorePlanQueryParams = {
        page: pageNum,
        page_size: pageSize,
        ordering: '-created_at'
      }
      
      const response = await PlanService.getPlans(params)
      
      if (isRefresh) {
        setPlans(response.results)
        // 保存到缓存
        await offlineCache.set(
          CACHE_STORES.PLANS,
          'plan_list',
          response.results,
          CACHE_EXPIRY.MEDIUM
        )
      } else {
        setPlans(prev => [...prev, ...response.results])
      }
      
      setHasMore(!!response.next)
      setPage(pageNum)
      setFromCache(false)
    } catch (error) {
      Message.error('加载计划列表失败')
      console.error('加载计划列表失败:', error)
      
      // 网络请求失败，尝试使用缓存
      const hasCache = await loadFromCache()
      if (hasCache) {
        Message.info('已加载缓存数据')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      loadingRef.current = false
    }
  }, [isOffline, loadFromCache])

  /**
   * 手动刷新
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadPlans(1, true)
  }, [loadPlans])

  /**
   * 上拉加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && !loadingRef.current) {
      loadPlans(page + 1)
    }
  }, [loading, hasMore, page, loadPlans])

  /**
   * 监听滚动事件，实现上拉加载
   */
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return
      
      const { scrollTop, scrollHeight, clientHeight } = listRef.current
      
      // 距离底部100px时触发加载
      if (scrollHeight - scrollTop - clientHeight < 100) {
        handleLoadMore()
      }
    }

    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll)
      return () => listElement.removeEventListener('scroll', handleScroll)
    }
  }, [handleLoadMore])

  /**
   * 初始加载
   */
  useEffect(() => {
    const initData = async () => {
      // 先尝试从缓存加载
      await loadFromCache()
      // 如果在线，再从网络加载最新数据
      if (isOnline) {
        loadPlans(1, true)
      }
    }
    
    initData()
  }, [])
  
  /**
   * 网络状态恢复时自动刷新
   */
  useEffect(() => {
    if (isOnline && fromCache) {
      loadPlans(1, true)
    }
  }, [isOnline, fromCache, loadPlans])

  /**
   * 跳转到计划详情
   */
  const handleViewDetail = (planId: number) => {
    navigate(`/mobile/plans/${planId}`)
  }

  /**
   * 格式化日期
   */
  const formatDate = (dateStr: string) => {
    return dateStr.split('T')[0]
  }

  /**
   * 计算完成率
   */
  const getCompletionRate = (plan: StorePlan) => {
    if (plan.total_target_count === 0) return 0
    return Math.round((plan.total_completed_count / plan.total_target_count) * 100)
  }

  return (
    <div className="mobile-plan-list">
      <div className="mobile-header">
        <h2>开店计划</h2>
        <Button
          type="text"
          icon={<IconRefresh />}
          onClick={handleRefresh}
          loading={refreshing}
          className="refresh-button"
        />
        {/* 网络状态指示器 */}
        <div className="network-status">
          {isOffline ? (
            <Badge status="error" text="离线" />
          ) : networkInfo.status === 'slow' ? (
            <Badge status="warning" text="网络较慢" />
          ) : (
            <Badge status="success" text="在线" />
          )}
        </div>
      </div>
      
      {/* 缓存数据提示 */}
      {fromCache && (
        <div className="cache-notice">
          <IconWifi style={{ marginRight: 8 }} />
          正在显示缓存数据
        </div>
      )}

      <div className="mobile-content" ref={listRef}>
        {/* 下拉刷新提示 */}
        {refreshing && (
          <div className="refresh-indicator">
            <Spin />
            <span>刷新中...</span>
          </div>
        )}
          {plans.length === 0 && !loading ? (
            <Empty description="暂无计划数据" />
          ) : (
            <List
              dataSource={plans}
              render={(plan) => (
                <Card
                  key={plan.id}
                  className="mobile-plan-card"
                  hoverable
                  onClick={() => handleViewDetail(plan.id)}
                >
                  <div className="plan-card-header">
                    <div className="plan-name">{plan.name}</div>
                    <Tag color={STATUS_CONFIG[plan.status].color}>
                      {STATUS_CONFIG[plan.status].text}
                    </Tag>
                  </div>

                  <div className="plan-card-info">
                    <div className="info-row">
                      <span className="label">计划周期：</span>
                      <span className="value">
                        {formatDate(plan.start_date)} 至 {formatDate(plan.end_date)}
                      </span>
                    </div>

                    <div className="info-row">
                      <span className="label">目标数量：</span>
                      <span className="value">{plan.total_target_count} 家</span>
                    </div>

                    <div className="info-row">
                      <span className="label">完成数量：</span>
                      <span className="value highlight">
                        {plan.total_completed_count} 家
                      </span>
                    </div>

                    <div className="info-row">
                      <span className="label">完成率：</span>
                      <span className="value">
                        <span className={`completion-rate ${getCompletionRate(plan) >= 80 ? 'high' : getCompletionRate(plan) >= 50 ? 'medium' : 'low'}`}>
                          {getCompletionRate(plan)}%
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="plan-card-footer">
                    <span className="view-detail">
                      查看详情 <IconRight />
                    </span>
                  </div>
                </Card>
              )}
            />
          )}

          {loading && (
            <div className="loading-more">
              <Spin />
              <span>加载中...</span>
            </div>
          )}

          {!loading && !hasMore && plans.length > 0 && (
            <div className="no-more">没有更多数据了</div>
          )}
        </div>
    </div>
  )
}

export default MobilePlanList
