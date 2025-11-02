# 企业微信集成配置指南

本文档详细说明如何配置企业微信集成所需的凭证和参数。

## 配置概述

系统通过企业微信API实现以下功能：
- 部门架构同步
- 用户信息同步
- 组织架构管理

## 必需的配置参数

### 1. 企业ID (WECHAT_CORP_ID)

**获取方式：**
1. 登录企业微信管理后台：https://work.weixin.qq.com/
2. 进入"我的企业" → "企业信息"
3. 复制"企业ID"

**配置示例：**
```bash
WECHAT_CORP_ID=ww1234567890abcdef
```

### 2. 应用AgentId (WECHAT_AGENT_ID)

**获取方式：**
1. 在企业微信管理后台，进入"应用管理"
2. 选择或创建一个自建应用
3. 在应用详情页面找到"AgentId"

**配置示例：**
```bash
WECHAT_AGENT_ID=1000001
```

### 3. 应用Secret (WECHAT_SECRET)

**获取方式：**
1. 在企业微信管理后台的应用详情页面
2. 找到"Secret"字段
3. 点击"查看"获取Secret值

**配置示例：**
```bash
WECHAT_SECRET=your_secret_key_here
```

## 配置步骤

### 步骤1：创建企业微信应用

1. 登录企业微信管理后台
2. 进入"应用管理" → "自建"
3. 点击"创建应用"
4. 填写应用信息：
   - 应用名称：门店生命周期管理系统
   - 应用介绍：用于同步部门和用户信息
   - 应用logo：上传应用图标
5. 设置可见范围：选择需要使用系统的部门和成员

### 步骤2：配置应用权限

在应用详情页面，确保应用具有以下权限：
- **通讯录管理权限**：
  - 读取通讯录：用于获取部门和用户信息
  - 管理通讯录：如果需要创建或修改通讯录信息

### 步骤3：配置环境变量

#### 开发环境配置

编辑 `backend/.env` 文件：
```bash
# 企业微信配置
WECHAT_CORP_ID=你的企业ID
WECHAT_AGENT_ID=你的应用AgentId
WECHAT_SECRET=你的应用Secret
```

#### 生产环境配置

**方式1：环境变量**
```bash
export WECHAT_CORP_ID="你的企业ID"
export WECHAT_AGENT_ID="你的应用AgentId"
export WECHAT_SECRET="你的应用Secret"
```

**方式2：系统配置文件**
在生产环境的配置文件中设置：
```python
# production_settings.py
WECHAT_CORP_ID = "你的企业ID"
WECHAT_AGENT_ID = "你的应用AgentId"
WECHAT_SECRET = "你的应用Secret"
```

### 步骤4：验证配置

运行配置验证命令：
```bash
python manage.py check_wechat_config
```

## 高级配置

### API超时设置

默认API请求超时时间为30秒，可以通过以下方式修改：

```python
# settings.py
WECHAT_API_TIMEOUT = 60  # 60秒超时
```

### 访问令牌缓存

系统会自动缓存企业微信访问令牌，默认配置：
- 缓存键：`wechat_access_token`
- 有效期：7200秒（2小时）

可以通过以下方式自定义：
```python
# settings.py
WECHAT_TOKEN_CACHE_KEY = 'custom_wechat_token'
WECHAT_TOKEN_EXPIRES_IN = 3600  # 1小时
```

### API基础URL

默认使用企业微信官方API地址，一般不需要修改：
```python
# settings.py
WECHAT_API_BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin'
```

## 安全注意事项

### 1. 凭证保护

- **不要**将企业微信凭证提交到版本控制系统
- 使用环境变量或安全的配置管理工具
- 定期轮换Secret密钥

### 2. 网络安全

- 确保服务器能够访问企业微信API（https://qyapi.weixin.qq.com）
- 配置防火墙允许HTTPS出站连接
- 使用HTTPS协议保护API通信

### 3. 权限控制

- 只授予应用必需的最小权限
- 定期审查应用权限和可见范围
- 监控API调用日志

## 故障排除

### 常见错误

#### 1. 40013 - 不合法的corpid

**原因：** 企业ID配置错误
**解决：** 检查WECHAT_CORP_ID是否正确

#### 2. 40014 - 不合法的access_token

**原因：** 访问令牌无效或过期
**解决：** 检查WECHAT_SECRET是否正确，系统会自动刷新令牌

#### 3. 40001 - 不合法的secret

**原因：** 应用Secret配置错误
**解决：** 重新获取并配置正确的Secret

#### 4. 60011 - 不合法的agentid

**原因：** 应用AgentId配置错误
**解决：** 检查WECHAT_AGENT_ID是否正确

### 调试方法

#### 1. 启用详细日志

```python
# settings.py
LOGGING = {
    'loggers': {
        'system_management.services.wechat': {
            'level': 'DEBUG',
            'handlers': ['console', 'file'],
        },
    },
}
```

#### 2. 测试API连接

```bash
python manage.py shell -c "
from system_management.services.wechat_service import WeChatService
service = WeChatService()
token = service.get_access_token()
print('访问令牌获取成功:', token[:10] + '...')
"
```

#### 3. 检查网络连接

```bash
curl -I https://qyapi.weixin.qq.com/cgi-bin/gettoken
```

## 配置验证清单

在完成配置后，请确认以下项目：

- [ ] 企业ID (WECHAT_CORP_ID) 已正确配置
- [ ] 应用AgentId (WECHAT_AGENT_ID) 已正确配置  
- [ ] 应用Secret (WECHAT_SECRET) 已正确配置
- [ ] 应用具有通讯录读取权限
- [ ] 应用可见范围包含目标部门和用户
- [ ] 服务器能够访问企业微信API
- [ ] 配置验证命令执行成功
- [ ] 部门同步功能测试通过
- [ ] 用户同步功能测试通过

## 联系支持

如果在配置过程中遇到问题，请：

1. 查看系统日志文件：`backend/logs/django.log`
2. 运行配置验证命令获取详细错误信息
3. 参考企业微信官方文档：https://developer.work.weixin.qq.com/
4. 联系系统管理员或技术支持团队

---

**注意：** 本配置指南基于企业微信API v2.0，如果企业微信更新API版本，可能需要相应调整配置。