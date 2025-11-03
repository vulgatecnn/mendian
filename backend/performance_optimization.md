# 性能优化文档

## 1. 数据库查询优化

### 1.1 添加数据库索引

为了提高查询性能，需要在以下字段上添加索引：

#### 拓店管理模块
- `CandidateLocation`: `business_region`, `status`, `created_at`
- `FollowUpRecord`: `location`, `status`, `priority`, `created_by`, `created_at`
- `ProfitCalculation`: `roi`, `payback_period`, `contribution_rate`

#### 开店筹备模块
- `ConstructionOrder`: `follow_up_record`, `supplier`, `status`, `created_at`
- `Milestone`: `construction_order`, `planned_date`, `status`
- `DeliveryChecklist`: `construction_order`, `status`

#### 门店档案模块
- `StoreProfile`: `store_code`, `business_region`, `status`, `opening_date`, `created_at`

#### 审批中心模块
- `ApprovalInstance`: `template`, `status`, `initiator`, `business_type`, `business_id`, `initiated_at`
- `ApprovalNode`: `instance`, `status`, `sequence`

#### 基础数据模块
- `BusinessRegion`: `code`, `is_active`
- `Supplier`: `code`, `cooperation_status`
- `LegalEntity`: `code`, `operation_status`, `unified_social_credit_code`
- `Customer`: `code`, `cooperation_status`

#### 系统管理模块
- `Department`: `wechat_dept_id`, `parent`, `is_active`
- `User`: `phone`, `wechat_user_id`, `department`, `is_active`
- `Role`: `code`, `is_active`

#### 消息通知模块
- `Message`: `recipient`, `is_read`, `message_type`, `created_at`

#### 操作日志模块
- `OperationLog`: `user`, `operation_type`, `content_type`, `object_id`, `created_at`

### 1.2 优化 N+1 查询问题

使用 `select_related` 和 `prefetch_related` 优化关联查询：

```python
# 优化前
follow_ups = FollowUpRecord.objects.all()
for follow_up in follow_ups:
    print(follow_up.location.name)  # N+1 查询
    print(follow_up.profit_calculation.roi)  # N+1 查询

# 优化后
follow_ups = FollowUpRecord.objects.select_related(
    'location',
    'profit_calculation',
    'legal_entity',
    'created_by'
).all()
```

### 1.3 使用 only() 和 defer() 减少字段查询

```python
# 只查询需要的字段
stores = StoreProfile.objects.only(
    'id', 'store_code', 'store_name', 'status'
).all()

# 延迟加载大字段
follow_ups = FollowUpRecord.objects.defer(
    'survey_data', 'business_terms', 'contract_info'
).all()
```

### 1.4 使用聚合查询减少数据库访问

```python
# 优化前
total_stores = StoreProfile.objects.count()
operating_stores = StoreProfile.objects.filter(status='operating').count()
preparing_stores = StoreProfile.objects.filter(status='preparing').count()

# 优化后
from django.db.models import Count, Q

stats = StoreProfile.objects.aggregate(
    total=Count('id'),
    operating=Count('id', filter=Q(status='operating')),
    preparing=Count('id', filter=Q(status='preparing'))
)
```

## 2. Redis 缓存策略

### 2.1 缓存配置

在 `settings.py` 中配置 Redis 缓存：

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.HiredisParser',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True
            },
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
        },
        'KEY_PREFIX': 'store_lifecycle',
        'TIMEOUT': 300,  # 默认5分钟
    }
}
```

### 2.2 缓存策略

#### 2.2.1 基础数据缓存（长期缓存）

基础数据变化频率低，可以长期缓存：

```python
from django.core.cache import cache

def get_business_regions():
    """获取业务大区列表（缓存1小时）"""
    cache_key = 'business_regions:all'
    regions = cache.get(cache_key)
    
    if regions is None:
        regions = list(BusinessRegion.objects.filter(is_active=True).values())
        cache.set(cache_key, regions, timeout=3600)  # 1小时
    
    return regions

def get_suppliers():
    """获取供应商列表（缓存1小时）"""
    cache_key = 'suppliers:active'
    suppliers = cache.get(cache_key)
    
    if suppliers is None:
        suppliers = list(Supplier.objects.filter(cooperation_status='active').values())
        cache.set(cache_key, suppliers, timeout=3600)
    
    return suppliers
```

#### 2.2.2 用户权限缓存

用户权限信息可以缓存，减少数据库查询：

```python
def get_user_permissions(user_id):
    """获取用户权限（缓存30分钟）"""
    cache_key = f'user:permissions:{user_id}'
    permissions = cache.get(cache_key)
    
    if permissions is None:
        user = User.objects.prefetch_related('roles__permissions').get(id=user_id)
        permissions = list(user.roles.values_list('permissions__permission_code', flat=True))
        cache.set(cache_key, permissions, timeout=1800)  # 30分钟
    
    return permissions
```

#### 2.2.3 统计数据缓存

首页统计数据可以短期缓存：

```python
def get_home_statistics(user_id):
    """获取首页统计数据（缓存5分钟）"""
    cache_key = f'home:stats:{user_id}'
    stats = cache.get(cache_key)
    
    if stats is None:
        stats = {
            'pending_approvals': get_pending_approvals_count(user_id),
            'contract_reminders': get_contract_reminders_count(user_id),
            'milestone_reminders': get_milestone_reminders_count(user_id),
            'unread_messages': get_unread_messages_count(user_id)
        }
        cache.set(cache_key, stats, timeout=300)  # 5分钟
    
    return stats
```

#### 2.2.4 列表查询缓存

对于频繁查询的列表，可以缓存查询结果：

```python
def get_approval_templates():
    """获取活跃的审批模板列表（缓存10分钟）"""
    cache_key = 'approval:templates:active'
    templates = cache.get(cache_key)
    
    if templates is None:
        templates = list(ApprovalTemplate.objects.filter(is_active=True).values())
        cache.set(cache_key, templates, timeout=600)  # 10分钟
    
    return templates
```

### 2.3 缓存失效策略

当数据更新时，需要主动清除相关缓存：

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=BusinessRegion)
@receiver(post_delete, sender=BusinessRegion)
def invalidate_business_region_cache(sender, instance, **kwargs):
    """业务大区数据变更时清除缓存"""
    cache.delete('business_regions:all')

@receiver(post_save, sender=User)
def invalidate_user_permission_cache(sender, instance, **kwargs):
    """用户信息变更时清除权限缓存"""
    cache.delete(f'user:permissions:{instance.id}')
    cache.delete(f'home:stats:{instance.id}')
```

### 2.4 缓存装饰器

创建通用的缓存装饰器：

```python
from functools import wraps
from django.core.cache import cache

def cache_result(key_prefix, timeout=300):
    """缓存函数结果的装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{key_prefix}:{':'.join(map(str, args))}"
            
            # 尝试从缓存获取
            result = cache.get(cache_key)
            
            if result is None:
                # 缓存未命中，执行函数
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout=timeout)
            
            return result
        return wrapper
    return decorator

# 使用示例
@cache_result('profit:calculation', timeout=600)
def calculate_profit(business_terms, sales_forecast):
    # 复杂的盈利计算逻辑
    pass
```

## 3. 前端性能优化

### 3.1 代码分割和懒加载

使用 React.lazy 和 Suspense 实现路由级别的代码分割：

```typescript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// 懒加载页面组件
const ExpansionPage = lazy(() => import('./pages/Expansion'));
const PreparationPage = lazy(() => import('./pages/Preparation'));
const ArchivePage = lazy(() => import('./pages/Archive'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/expansion" element={<ExpansionPage />} />
        <Route path="/preparation" element={<PreparationPage />} />
        <Route path="/archive" element={<ArchivePage />} />
      </Routes>
    </Suspense>
  );
}
```

### 3.2 列表虚拟化

对于长列表，使用虚拟滚动减少 DOM 节点：

```typescript
import { List } from '@arco-design/web-react';
import { VariableSizeList } from 'react-window';

function VirtualList({ data }) {
  return (
    <VariableSizeList
      height={600}
      itemCount={data.length}
      itemSize={() => 50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {data[index].name}
        </div>
      )}
    </VariableSizeList>
  );
}
```

### 3.3 请求防抖和节流

对于搜索和筛选功能，使用防抖减少请求：

```typescript
import { debounce } from 'lodash';
import { useCallback } from 'react';

function SearchComponent() {
  const handleSearch = useCallback(
    debounce((value: string) => {
      // 发起搜索请求
      api.search(value);
    }, 500),
    []
  );

  return (
    <Input
      placeholder="搜索"
      onChange={(value) => handleSearch(value)}
    />
  );
}
```

### 3.4 数据缓存

使用 React Query 或 SWR 实现数据缓存和自动重新验证：

```typescript
import { useQuery } from 'react-query';

function StoreList() {
  const { data, isLoading } = useQuery(
    'stores',
    () => api.getStores(),
    {
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      cacheTime: 10 * 60 * 1000, // 缓存10分钟
    }
  );

  if (isLoading) return <Loading />;
  
  return <List data={data} />;
}
```

### 3.5 图片优化

- 使用 WebP 格式
- 实现图片懒加载
- 使用 CDN 加速

```typescript
import { Image } from '@arco-design/web-react';

function StoreImage({ src }) {
  return (
    <Image
      src={src}
      lazyload
      placeholder={<Skeleton />}
    />
  );
}
```

## 4. 数据库连接池优化

在 `settings.py` 中配置数据库连接池：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'store_lifecycle',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
        'CONN_MAX_AGE': 600,  # 连接持久化10分钟
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  # 查询超时30秒
        }
    }
}
```

## 5. 异步任务优化

### 5.1 使用 Celery 处理耗时任务

将耗时操作移到后台任务：

```python
from celery import shared_task

@shared_task
def send_batch_notifications(user_ids, message):
    """批量发送通知（异步任务）"""
    for user_id in user_ids:
        send_notification(user_id, message)

@shared_task
def export_approval_ledger(template_code, start_date, end_date):
    """导出审批台账（异步任务）"""
    # 生成 Excel 文件
    file_path = generate_excel(template_code, start_date, end_date)
    return file_path
```

### 5.2 任务队列优先级

为不同类型的任务设置优先级：

```python
# 高优先级任务（用户等待的操作）
@shared_task(priority=9)
def send_sms_code(phone, code):
    pass

# 中优先级任务（重要但不紧急）
@shared_task(priority=5)
def sync_wechat_users():
    pass

# 低优先级任务（后台统计）
@shared_task(priority=1)
def generate_daily_report():
    pass
```

## 6. 监控和性能分析

### 6.1 使用 Django Debug Toolbar

在开发环境中使用 Django Debug Toolbar 分析性能：

```python
# settings.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']
```

### 6.2 慢查询日志

配置 PostgreSQL 记录慢查询：

```sql
-- postgresql.conf
log_min_duration_statement = 1000  -- 记录超过1秒的查询
```

### 6.3 APM 监控

使用 APM 工具（如 New Relic、Datadog）监控应用性能：

```python
# 安装 newrelic
pip install newrelic

# 在 manage.py 中初始化
import newrelic.agent
newrelic.agent.initialize('newrelic.ini')
```

## 7. 性能优化检查清单

- [ ] 为常用查询字段添加数据库索引
- [ ] 使用 select_related 和 prefetch_related 优化关联查询
- [ ] 实现 Redis 缓存策略
- [ ] 配置数据库连接池
- [ ] 将耗时任务移到 Celery 异步处理
- [ ] 前端实现代码分割和懒加载
- [ ] 对长列表使用虚拟滚动
- [ ] 实现请求防抖和节流
- [ ] 优化图片加载
- [ ] 配置 CDN 加速静态资源
- [ ] 启用 Gzip 压缩
- [ ] 配置慢查询日志
- [ ] 部署 APM 监控

## 8. 预期性能提升

实施以上优化后，预期可以达到：

- 列表查询响应时间：< 200ms
- 详情页加载时间：< 300ms
- 首页加载时间：< 500ms
- 数据库查询数量：减少 50%
- 缓存命中率：> 80%
- 并发处理能力：提升 3-5 倍
