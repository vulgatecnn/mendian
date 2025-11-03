# 认证服务使用说明

## 概述

本系统实现了完整的用户认证服务，支持多种登录方式和安全机制。

## 功能特性

### 1. 多种登录方式

- **用户名密码登录**：支持用户名或手机号 + 密码
- **手机号密码登录**：手机号 + 密码
- **手机号验证码登录**：手机号 + 短信验证码
- **企业微信登录**：移动端企业微信授权登录（待实现）

### 2. 安全机制

- **登录失败限制**：5次失败后锁定账号30分钟
- **JWT令牌认证**：访问令牌（2小时）+ 刷新令牌（7天）
- **会话超时处理**：自动检测和处理过期令牌
- **安全头设置**：防XSS、防点击劫持等安全头

### 3. 个人中心功能

- 获取个人信息
- 更新个人信息
- 修改密码（强度验证）

## API接口

### 认证相关

```
POST /api/auth/login/              # 用户登录
POST /api/auth/send-sms-code/      # 发送短信验证码
POST /api/auth/refresh-token/      # 刷新访问令牌
POST /api/auth/logout/             # 用户登出
```

### 个人中心

```
GET  /api/profile/                 # 获取个人信息
PUT  /api/profile/update/          # 更新个人信息
POST /api/profile/change-password/ # 修改密码
```

## 使用示例

### 1. 用户名密码登录

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "login_type": "username_password",
    "username": "testuser",
    "password": "testpass123"
  }'
```

### 2. 手机号密码登录

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "login_type": "phone_password",
    "phone": "13800138000",
    "password": "testpass123"
  }'
```

### 3. 发送短信验证码

```bash
curl -X POST http://localhost:8000/api/auth/send-sms-code/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000"
  }'
```

### 4. 手机号验证码登录

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "login_type": "phone_sms",
    "phone": "13800138000",
    "sms_code": "123456"
  }'
```

### 5. 使用JWT令牌访问API

```bash
curl -X GET http://localhost:8000/api/profile/ \
  -H "Authorization: Bearer <access_token>"
```

### 6. 刷新访问令牌

```bash
curl -X POST http://localhost:8000/api/auth/refresh-token/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "testuser",
      "full_name": "测试用户",
      "phone": "13800138000",
      "department_name": "技术部",
      "role_names": ["系统管理员"],
      "permissions": ["system.user.view", "system.user.create"]
    }
  }
}
```

### 错误响应

```json
{
  "code": 1002,
  "message": "用户名或密码错误",
  "data": null
}
```

## 错误码说明

- `0`: 成功
- `1001`: 参数错误
- `1002`: 认证失败（用户名密码错误、令牌无效等）
- `1003`: 账号锁定
- `1004`: 验证码发送频繁

## 测试

### 运行单元测试

```bash
python manage.py test system_management.tests.test_authentication
```

### 运行API测试脚本

```bash
# 先启动Django服务器
python manage.py runserver

# 在另一个终端运行测试脚本
python test_auth_api.py
```

## 配置说明

### JWT配置

在 `authentication.py` 中的 `JWTTokenManager` 类：

```python
ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 访问令牌过期时间（分钟）
REFRESH_TOKEN_EXPIRE_DAYS = 7      # 刷新令牌过期时间（天）
```

### 登录安全配置

在 `authentication.py` 中的 `LoginAttemptTracker` 类：

```python
MAX_ATTEMPTS = 5           # 最大失败次数
LOCKOUT_DURATION = 30 * 60 # 锁定时长（秒）
```

### 短信验证码配置

在 `authentication.py` 中的 `SMSVerificationService` 类：

```python
CODE_EXPIRE_MINUTES = 5  # 验证码有效期（分钟）
SEND_INTERVAL = 60       # 发送间隔（秒）
```

## 注意事项

1. **短信服务**：当前短信验证码只是模拟发送，实际部署时需要集成真实的短信服务商API
2. **企业微信登录**：需要配置企业微信应用信息和回调地址
3. **缓存依赖**：登录尝试跟踪和验证码功能依赖Django缓存，建议生产环境使用Redis
4. **HTTPS**：生产环境建议启用HTTPS以保护令牌传输安全
5. **密码强度**：系统已配置密码强度验证，要求至少8位且包含字母和数字

## 扩展功能

### 添加新的登录方式

1. 在 `AuthenticationService` 类中添加新的登录方法
2. 在 `LoginSerializer` 中添加新的登录类型和参数
3. 在 `login_view` 中添加对应的处理逻辑

### 自定义安全策略

1. 修改 `LoginAttemptTracker` 类的配置参数
2. 在 `SecurityHeadersMiddleware` 中添加自定义安全头
3. 实现自定义的令牌验证逻辑