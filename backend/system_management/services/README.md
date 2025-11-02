# 企业微信集成服务

## 概述

本模块提供了与企业微信的集成功能，包括：

- 企业微信配置管理（支持凭证加密存储）
- 访问令牌管理（自动缓存和刷新）
- 部门信息同步
- 用户信息同步
- 完善的错误处理和日志记录
- 超时监控（超过 30 秒记录警告）

## 配置

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

在 `.env` 文件中配置企业微信凭证：

```env
# 企业微信配置
WECHAT_CORP_ID=your_corp_id          # 企业 ID
WECHAT_AGENT_ID=your_agent_id        # 应用 AgentId
WECHAT_SECRET=your_secret            # 应用 Secret
```

### 3. 获取企业微信凭证

1. 登录企业微信管理后台：https://work.weixin.qq.com/
2. 在"我的企业"页面获取 **企业 ID** (CorpID)
3. 在"应用管理"页面创建或选择应用，获取 **AgentId** 和 **Secret**

## 使用方法

### 基本使用

```python
from system_management.services import wechat_service

# 1. 验证配置
is_valid, error_msg = wechat_service.validate_config()
if not is_valid:
    print(f"配置无效: {error_msg}")

# 2. 测试连接
result = wechat_service.test_connection()
if result['success']:
    print("连接成功")
else:
    print(f"连接失败: {result['errors']}")

# 3. 同步部门
result = wechat_service.sync_departments()
print(f"部门同步: 总数={result['total']}, 新增={result['created']}, "
      f"更新={result['updated']}, 失败={result['failed']}")

# 4. 同步用户
result = wechat_service.sync_users()
print(f"用户同步: 总数={result['total']}, 新增={result['created']}, "
      f"更新={result['updated']}, 失败={result['failed']}")

# 5. 同步所有数据（部门 + 用户）
result = wechat_service.sync_all()

# 6. 获取部门树
tree = wechat_service.get_department_tree()
```

### 高级使用

#### 同步指定部门

```python
# 同步指定部门（不包含子部门）
result = wechat_service.sync_departments(department_id=1)

# 同步指定部门的用户（包含子部门）
result = wechat_service.sync_users(department_id=1, fetch_child=True)

# 同步指定部门的用户（不包含子部门）
result = wechat_service.sync_users(department_id=1, fetch_child=False)
```

#### 访问令牌管理

```python
from system_management.services import token_manager

# 获取访问令牌（自动缓存）
token = token_manager.get_access_token()

# 强制刷新令牌
token = token_manager.refresh_token()

# 清除令牌缓存
token_manager.clear_token_cache()

# 验证令牌
is_valid, error_msg = token_manager.validate_token(token)
```

#### 配置管理

```python
from system_management.services import wechat_config

# 获取配置信息
config = wechat_config.get_config_dict()
print(config)  # {'corp_id': '...', 'agent_id': '...', 'secret_configured': True}

# 加密 Secret
encrypted = wechat_config.encrypt_secret('my_secret')

# 解密 Secret
decrypted = wechat_config.decrypt_secret(encrypted)

# 清除缓存
wechat_config.clear_cache()
```

## 测试

运行测试脚本：

```bash
cd backend
python system_management/services/test_wechat.py
```

测试脚本会执行以下测试：

1. 配置验证
2. 连接测试
3. 部门同步
4. 用户同步
5. 获取部门树

## 错误处理

服务提供了完善的错误处理机制：

### 异常类型

- `WeChatException`: 基础异常
- `WeChatConfigError`: 配置错误
- `WeChatTokenError`: 令牌错误
- `WeChatAPIError`: API 调用错误
- `WeChatTimeoutError`: 超时错误
- `WeChatNetworkError`: 网络错误
- `WeChatSyncError`: 同步错误

### 错误处理示例

```python
from system_management.services import wechat_service
from system_management.services import WeChatException

try:
    result = wechat_service.sync_departments()
except WeChatException as e:
    print(f"企业微信错误: {e}")
    if e.errcode:
        print(f"错误码: {e.errcode}")
except Exception as e:
    print(f"未知错误: {e}")
```

## 日志

服务会记录详细的日志信息：

- **INFO**: 正常操作（同步开始、完成等）
- **WARNING**: 警告信息（超时、令牌过期等）
- **ERROR**: 错误信息（API 调用失败、同步失败等）
- **DEBUG**: 调试信息（API 请求、数据处理等）

日志文件位置：`backend/logs/django.log`

## 性能优化

### 缓存机制

- **访问令牌缓存**: 令牌有效期 7200 秒，缓存时间 6900 秒（提前 5 分钟过期）
- **部门树缓存**: 可选，需要在应用层实现

### 超时监控

- API 请求超时: 30 秒
- 同步操作超时警告阈值: 30 秒
- 超过阈值会记录警告日志

### 批量同步

- 部门同步: 一次性获取所有部门
- 用户同步: 按部门获取，支持递归获取子部门用户

## 安全性

### 凭证加密

- 使用 `cryptography` 库的 Fernet 加密
- 基于 Django SECRET_KEY 派生加密密钥
- 使用 PBKDF2 密钥派生函数（100000 次迭代）

### 敏感信息保护

- 日志中不记录完整的 Secret
- API 响应中不包含敏感信息
- 配置信息仅显示是否已配置

## 常见问题

### 1. 配置无效

**问题**: `企业微信配置无效: 企业 ID (WECHAT_CORP_ID) 未配置`

**解决**: 检查 `.env` 文件，确保配置了所有必需的环境变量。

### 2. 访问令牌过期

**问题**: `访问令牌过期或无效`

**解决**: 服务会自动刷新令牌，无需手动处理。如果持续失败，检查 Secret 是否正确。

### 3. 同步超时

**问题**: `同步耗时过长: XX 秒`

**解决**: 
- 检查网络连接
- 考虑分批同步（按部门同步）
- 增加 `WECHAT_API_TIMEOUT` 配置

### 4. 部门关系错误

**问题**: 部门父子关系不正确

**解决**: 
- 确保先同步部门，再同步用户
- 检查企业微信中的部门结构是否正确
- 重新执行完整同步

### 5. 用户没有手机号

**问题**: 用户同步时跳过某些用户

**解决**: 在企业微信中为用户添加手机号，系统要求用户必须有手机号。

## API 参考

### WeChatService

主服务类，提供统一的企业微信集成接口。

#### 方法

- `sync_departments(department_id=None)`: 同步部门
- `sync_users(department_id=None, fetch_child=True)`: 同步用户
- `sync_all()`: 同步所有数据
- `get_department_tree()`: 获取部门树
- `validate_config()`: 验证配置
- `test_connection()`: 测试连接

### WeChatTokenManager

访问令牌管理器。

#### 方法

- `get_access_token(force_refresh=False)`: 获取访问令牌
- `refresh_token()`: 刷新令牌
- `clear_token_cache()`: 清除缓存
- `validate_token(token)`: 验证令牌

### WeChatConfig

配置管理器。

#### 方法

- `get_corp_id()`: 获取企业 ID
- `get_agent_id()`: 获取应用 ID
- `get_secret()`: 获取 Secret
- `validate_config()`: 验证配置
- `encrypt_secret(secret)`: 加密 Secret
- `decrypt_secret(encrypted_secret)`: 解密 Secret
- `get_config_dict()`: 获取配置字典
- `clear_cache()`: 清除缓存

## 更新日志

### v1.0.0 (2024-11-02)

- ✅ 实现企业微信配置管理
- ✅ 实现访问令牌管理（缓存和自动刷新）
- ✅ 实现部门同步功能
- ✅ 实现用户同步功能
- ✅ 实现错误处理和日志记录
- ✅ 实现超时监控
- ✅ 添加测试脚本

## 许可证

本项目为内部使用，未开源。
