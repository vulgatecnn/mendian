/**
 * 移动端候选点位列表
 * 支持触摸操作、下拉刷新和上拉加载
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Input, 
  Tag, 
  Empty, 
  Spin, 
  PullToRefresh,
  InfiniteScroll 
} from '@arco-design/web-react';
import { IconSearch, IconEnvironment } from '@arco-design/web-react/icon';
import { useOfflineData } from '../../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../../utils/offlineCache';
import ExpansionService from '../../../api/expansionService';
import '../mobile.css';

/**
 * 移动端候选点位列表组件
 */
export const MobileLocationList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // 获取候选点位列表
  const { 
    data: locations, 
    loading, 
    fromCache,
    refresh 
  } = useOfflineData<any>({
    storeName: CACHE_STORES.PLANS,
    cacheKey: `locations_page_${page}`,
    fetchFn: async () => {
      const response = await ExpansionService.getLocations({
        page,
        page_size: 20,
        search: searchText
      });
      return response.data;
    },
    expiresIn: CACHE_EXPIRY.MEDIUM
  });

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    try {
      await refresh(true);
    } finally {
      setRefreshing(false);
    }
  };

  // 加载更多
  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    
    setPage(prev => prev + 1);
  };

  // 检查是否还有更多数据
  useEffect(() => {
    if (locations?.results) {
      setHasMore(locations.results.length < locations.count);
    }
  }, [locations]);

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
    refresh(true);
  };

  // 渲染点位卡片
  const renderLocationCard = (location: any) => (
    <Card
      key={location.id}
      className="mobile-location-card"
      hoverable
      onClick={() => navigate(`/mobile/expansion/locations/${location.id}`)}
    >
      <div className="mobile-location-header">
        <div className="mobile-location-name">{location.name}</div>
        <Tag color={location.status === 'available' ? 'green' : 'gray'}>
          {location.status_display}
        </Tag>
      </div>
      
      <div className="mobile-location-info">
        <div className="mobile-location-info-item">
          <IconEnvironment />
          <span>{location.province} {location.city} {location.district}</span>
        </div>
        <div className="mobile-location-info-item">
          <span>面积：{location.area}㎡</span>
        </div>
        <div className="mobile-location-info-item">
          <span>租金：¥{location.rent}/月</span>
        </div>
      </div>

      {location.business_region && (
        <div className="mobile-location-footer">
          <Tag>{location.business_region.region_name}</Tag>
        </div>
      )}
    </Card>
  );

  return (
    <div className="mobile-location-list">
      {/* 搜索栏 */}
      <div className="mobile-search-bar">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索点位名称或地址"
          value={searchText}
          onChange={handleSearch}
          allowClear
        />
      </div>

      {/* 缓存提示 */}
      {fromCache && (
        <div className="mobile-cache-notice">
          正在显示缓存数据，下拉刷新获取最新数据
        </div>
      )}

      {/* 点位列表 */}
      <PullToRefresh onRefresh={handleRefresh} loading={refreshing}>
        <div className="mobile-location-content">
          {loading && page === 1 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : locations?.results && locations.results.length > 0 ? (
            <InfiniteScroll
              onReachBottom={handleLoadMore}
              hasMore={hasMore}
              loader={<Spin style={{ display: 'block', margin: '20px auto' }} />}
            >
              {locations.results.map(renderLocationCard)}
            </InfiniteScroll>
          ) : (
            <Empty description="暂无候选点位" />
          )}
        </div>
      </PullToRefresh>
    </div>
  );
};

export default MobileLocationList;
