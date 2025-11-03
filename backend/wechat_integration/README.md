# 企业微信集成模块

## 概述

企业微信集成模块提供了与企业微信平台的完整集成功能，包括部门同步、用户同步和消息推送等核心功能。

## 功能特性

### 1. 数据同步
- **部门同步**：从企业微信同步部门结构到本地数据库
- **用户同步**：从企业微信同步用户信息到本地数据库
- **全量同步**：一次性同步所有部门和用户数据
- **增量同步**：支持定时增量同步，保持数据最新

### 2. 消息推送
- **文本消息**：发送纯文本消息到企业微信
- **文本卡片**：发送带链接的卡片消息
- **多种接收人**：支持指定用户、部门或标签
- **业务集成**：与审批、提醒等业务场景集成

### 3. 定时任务
- **自动同步**：通过 Celery 定时任务自动同步数据
- **失败重试**：同步失败时自动重试机制
- **日志记录**：完整的同步日志和错误追踪

## API 接口

### 同步管理 API

#### 同步企业微信部门
```
POST /api/v1/wechat/sync/sync_departments/
```

#### 同步企业微信用户
```
POST /api/v1/wechat/sync/sync_users/
```

#### 全量同步
```
POST /api/v1/wechat/sync/sync_all/
```

#### 获取同步日志
```
GET /api/v1/wechat/sync/sync_logs/
```

### 数据查询 API

#### 企业微信部门列表
```
GET /api/v1/wechat/departments/
```

#### 企业微信用户列表
```
GET /api/v1/wechat/users/
```

### 消息推送 API

#### 发送企业微信消息
```
POST /api/v1/wechat/messages/send_message/
```

请求示例：
```json
{
    "message_type": "textcard",
    "title": "审批通知",
    "content": "您有一个新的审批待处理",
    "url": "https://example.com/approval/123",
    "to_users": ["user001", "user002"],
    "business_type": "approval",
    "business_id": 123
}
```

#### 向本地用户发送消息
```
POST /api/v1/wechat/messages/send_to_users/
```

请求示例：
```json
{
    "message_type": "text",
    "content": "系统维护通知：今晚22:00-24:00进行系统维护",
    "user_ids": [1, 2, 3]
}
```

## 配置说明

### 环境变量配置

在 `.env` 文件中配置企业微信相关参数：

```env
# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_AGENT_ID=your_agent_id
WECHAT_SECRET=your_secret
```

### Django 设置

在 `settings.py` 中已包含以下配置：

```python
# 企业微信配置
WECHAT_CORP_ID = os.environ.get('WECHAT_CORP_ID', '')
WECHAT_AGENT_ID = os.environ.get('WECHAT_AGENT_ID', '')
WECHAT_SECRET = os.environ.get('WECHAT_SECRET', '')
WECHAT_API_BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin'
WECHAT_TOKEN_CACHE_KEY = 'wechat_access_token'
WECHAT_TOKEN_EXPIRES_IN = 7200
WECHAT_API_TIMEOUT = 30

# Celery Beat 定时任务配置
CELERY_BEAT_SCHEDULE = {
    'sync-wechat-all-daily': {
        'task': 'wechat_integration.tasks.sync_wechat_all',
        'schedule': crontab(hour=2, minute=0),
    },
    'sync-wechat-users-4hours': {
        'task': 'wechat_integration.tasks.sync_wechat_users',
        'schedule': crontab(minute=0, hour='*/4'),
    },
    'sync-wechat-departments-6hours': {
        'task': 'wechat_integration.tasks.sync_wechat_departments',
        'schedule': crontab(minute=0, hour='*/6'),
    },
}
```

## 权限控制

模块包含以下权限：

- `wechat.sync.department` - 同步企业微信部门
- `wechat.sync.user` - 同步企业微信用户
- `wechat.sync.all` - 全量同步企业微信
- `wechat.sync.view` - 查看同步日志
- `wechat.department.view` - 查看企业微信部门
- `wechat.user.view` - 查看企业微信用户
- `wechat.message.view` - 查看企业微信消息
- `wechat.message.send` - 发送企业微信消息

## 使用示例

### 1. 手动同步数据

```python
from wechat_integration.services.wechat_sync_service import WechatSyncService

# 创建同步服务实例
sync_service = WechatSyncService()

# 同步部门
dept_log = sync_service.sync_departments()
print(f"部门同步完成: 成功 {dept_log.success_count}, 失败 {dept_log.failed_count}")

# 同步用户
user_log = sync_service.sync_users()
print(f"用户同步完成: 成功 {user_log.success_count}, 失败 {user_log.failed_count}")
```

### 2. 发送消息

```python
from wechat_integration.services.wechat_message_service import WechatMessageService

# 创建消息服务实例
message_service = WechatMessageService()

# 发送审批通知
message = message_service.send_approval_notification(
    approval_title="报店审批",
    approval_content="张三提交了新的报店申请，请及时处理",
    approval_url="https://example.com/approval/123",
    approver_ids=[1, 2, 3],
    approval_id=123
)

print(f"消息发送状态: {message.status}")
```

### 3. 发送里程碑提醒

```python
# 发送里程碑提醒
message = message_service.send_milestone_reminder(
    milestone_name="装修验收",
    store_name="北京朝阳店",
    due_date="2023-12-01",
    reminder_url="https://example.com/construction/456",
    recipient_ids=[4, 5, 6],
    construction_order_id=456
)
```

## 错误处理

### 常见错误码

- `2001` - 部门同步失败
- `2002` - 用户同步失败  
- `2003` - 全量同步失败
- `2004` - 消息发送失败
- `2005` - 向本地用户发送消息失败
- `2006` - 重试失败消息出错

### 错误响应格式

```json
{
    "code": 2001,
    "message": "部门同步失败: 企业微信API错误 [40014]: access_token过期",
    "data": null
}
```

## 监控和日志

### 同步日志

系统会记录每次同步的详细日志，包括：
- 同步类型（部门/用户/全量）
- 同步状态（运行中/成功/失败）
- 处理数量统计
- 错误信息
- 执行时间

### 消息记录

所有发送的消息都会记录在数据库中，包括：
- 消息类型和内容
- 接收人信息
- 发送状态
- 企业微信消息ID
- 业务关联信息

## 注意事项

1. **企业微信配置**：确保企业微信应用配置正确，包括 Corp ID、Agent ID 和 Secret
2. **网络访问**：服务器需要能够访问企业微信 API（qyapi.weixin.qq.com）
3. **权限管理**：合理分配用户权限，避免未授权的同步和消息发送操作
4. **定时任务**：确保 Celery 服务正常运行，以支持定时同步功能
5. **缓存配置**：访问令牌会缓存以提高性能，确保缓存服务可用