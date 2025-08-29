# GitHub Secrets 配置指南

## 📋 概述

本指南将帮助您为好饭碗门店生命周期管理系统配置必要的 GitHub Secrets，以支持 CI/CD 流水线的正常运行。

**仓库地址**: https://github.com/vulgatecnn/mendian

## 🚀 快速配置

### 方法一：使用自动化脚本（推荐）

#### Linux/macOS 系统
```bash
# 确保有执行权限
chmod +x scripts/setup/configure-github-secrets.sh

# 运行配置脚本
./scripts/setup/configure-github-secrets.sh
```

#### Windows 系统
```powershell
# 以管理员身份运行 PowerShell
.\scripts\setup\configure-github-secrets.ps1
```

### 方法二：手动配置

访问 GitHub 仓库的 Secrets 设置页面：
https://github.com/vulgatecnn/mendian/settings/secrets/actions

## 🔑 必需的 Secrets 列表

### 基础配置

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `NODE_ENV` | `production` | Node.js 运行环境 |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-in-production-must-be-at-least-32-characters-long` | JWT 令牌签名密钥 |
| `SESSION_SECRET` | `your-session-secret-change-this` | 会话加密密钥 |
| `BCRYPT_ROUNDS` | `12` | 密码加密轮数 |

### 数据库配置

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `DATABASE_URL` | `postgresql://mendian_user:your-password@localhost:5432/mendian` | 数据库连接 URL |
| `POSTGRES_PASSWORD` | `your-super-secure-database-password` | PostgreSQL 密码 |
| `POSTGRES_USER` | `mendian_user` | PostgreSQL 用户名 |
| `POSTGRES_DB` | `mendian` | PostgreSQL 数据库名 |

### Redis 配置

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `REDIS_URL` | `redis://localhost:6379` | Redis 连接 URL |
| `REDIS_PREFIX` | `mendian:` | Redis 键前缀 |

### 企业微信配置（必需）

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `WECHAT_WORK_CORP_ID` | `your-corp-id` | 企业微信企业 ID |
| `WECHAT_WORK_AGENT_ID` | `your-agent-id` | 企业微信应用 ID |
| `WECHAT_WORK_SECRET` | `your-app-secret` | 企业微信应用密钥 |
| `WECHAT_WORK_TOKEN` | `your-callback-token` | 回调验证 Token（可选） |
| `WECHAT_WORK_ENCODING_AES_KEY` | `your-encoding-aes-key` | 回调加密 Key（可选） |
| `WECHAT_WORK_REDIRECT_URI` | `https://your-domain.com/auth/wechat/callback` | OAuth 重定向 URI |

### Docker 配置

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `DOCKER_REGISTRY` | `ghcr.io` | Docker 镜像仓库 |
| `DOCKER_USERNAME` | `vulgatecnn` | Docker 用户名 |

> **注意**: `GITHUB_TOKEN` 会自动提供，无需手动设置

### 安全配置

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `CORS_ORIGIN` | `http://localhost:7800,http://localhost:7000` | CORS 允许来源 |
| `CORS_CREDENTIALS` | `true` | CORS 允许凭据 |
| `RATE_LIMIT_WINDOW` | `900000` | 速率限制时间窗口（毫秒） |
| `RATE_LIMIT_MAX` | `100` | 速率限制最大请求数 |
| `SESSION_MAX_AGE` | `86400000` | 会话最大有效期（毫秒） |

### 应用配置

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `FRONTEND_PORT` | `7800` | 前端服务端口 |
| `BACKEND_PORT` | `7900` | 后端服务端口 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `LOG_FORMAT` | `combined` | 日志格式 |
| `TZ` | `Asia/Shanghai` | 时区设置 |
| `DEFAULT_LOCALE` | `zh-CN` | 默认语言 |

### 邮件配置（可选）

| Secret 名称 | 示例值 | 描述 |
|------------|--------|------|
| `SMTP_HOST` | `smtp.example.com` | SMTP 服务器 |
| `SMTP_PORT` | `587` | SMTP 端口 |
| `SMTP_SECURE` | `false` | 是否使用 SSL |
| `SMTP_USER` | `your-email@example.com` | SMTP 用户名 |
| `SMTP_PASSWORD` | `your-email-password` | SMTP 密码 |
| `SMTP_FROM_NAME` | `好饭碗门店管理系统` | 发件人名称 |
| `SMTP_FROM_EMAIL` | `noreply@your-domain.com` | 发件人邮箱 |

## 🛠️ 配置步骤详解

### 1. 安装 GitHub CLI（如果尚未安装）

#### Windows (Chocolatey)
```powershell
choco install gh
```

#### Windows (Scoop)
```powershell
scoop install gh
```

#### macOS (Homebrew)
```bash
brew install gh
```

#### Ubuntu/Debian
```bash
sudo apt install gh
```

### 2. 登录 GitHub CLI

```bash
gh auth login
```

选择：
- GitHub.com
- HTTPS
- Yes (在浏览器中认证)

### 3. 验证权限

确保您对仓库有 `admin` 或 `write` 权限。

### 4. 运行配置脚本

选择适合您操作系统的脚本运行。

## 🔍 验证配置

### 1. 检查 Secrets 是否设置成功

```bash
gh secret list --repo vulgatecnn/mendian
```

### 2. 查看 GitHub Actions 运行状态

访问：https://github.com/vulgatecnn/mendian/actions

### 3. 触发测试构建

```bash
# 推送一个小改动以触发 CI/CD
git commit --allow-empty -m "test: trigger CI/CD pipeline"
git push
```

## 🚨 安全注意事项

1. **敏感信息保护**
   - 所有密码和密钥都必须通过 GitHub Secrets 设置
   - 不要在代码中硬编码任何敏感信息
   - 定期轮换密钥和密码

2. **权限控制**
   - 只有必要的团队成员才能访问 Secrets
   - 使用最小权限原则
   - 定期审核权限设置

3. **密钥强度**
   - JWT Secret 必须至少 32 字符
   - 使用强密码生成器创建密码
   - 避免使用字典词汇或个人信息

## 🐛 常见问题

### 问题 1：GitHub CLI 未安装或未登录

**解决方案**：
```bash
# 检查是否安装
gh --version

# 如果未安装，请参照上面的安装方法
# 如果未登录
gh auth login
```

### 问题 2：权限不足

**错误信息**：`HTTP 403: Resource not accessible by integration`

**解决方案**：
1. 确保您对仓库有管理员权限
2. 重新登录 GitHub CLI：`gh auth login`
3. 检查 Token 权限是否包含 `repo` 和 `write:packages`

### 问题 3：Secret 设置失败

**解决方案**：
```bash
# 手动设置单个 Secret
echo "your-secret-value" | gh secret set SECRET_NAME --repo vulgatecnn/mendian

# 检查 Secret 是否存在
gh secret list --repo vulgatecnn/mendian
```

### 问题 4：CI/CD 流水线失败

**排查步骤**：
1. 检查 GitHub Actions 日志
2. 验证所有必需的 Secrets 都已设置
3. 确认 Secret 值格式正确
4. 检查环境变量引用是否正确

## 📚 相关文档

- [GitHub Secrets 官方文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI 文档](https://cli.github.com/manual/)
- [CI/CD 部署指南](./CI_CD_SETUP_GUIDE.md)
- [项目环境配置](./.env.example)

## 🆘 获取帮助

如果遇到问题，请：
1. 查看本文档的常见问题部分
2. 检查 GitHub Actions 的运行日志
3. 在项目仓库中创建 Issue
4. 联系项目维护者

---

**配置完成后，您的项目将拥有完整的 CI/CD 能力！** 🎉