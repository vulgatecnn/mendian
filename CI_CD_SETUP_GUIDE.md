# 好饭碗门店生命周期管理系统 - CI/CD 完整配置指南

## 📋 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [快速开始](#快速开始)
4. [GitHub Actions 配置](#github-actions-配置)
5. [容器化部署](#容器化部署)
6. [环境配置](#环境配置)
7. [部署脚本使用](#部署脚本使用)
8. [云平台部署](#云平台部署)
9. [监控和日志](#监控和日志)
10. [故障排除](#故障排除)
11. [最佳实践](#最佳实践)

---

## 📖 概述

本系统提供了完整的 CI/CD 解决方案，支持从代码提交到生产部署的全自动化流程。主要特性包括：

### 🎯 核心特性

- ✅ **多环境支持**: Development, Staging, Production
- ✅ **多种部署方式**: Docker, Kubernetes, AWS, 本地部署
- ✅ **自动化测试**: 单元测试、集成测试、E2E测试
- ✅ **代码质量检查**: ESLint, Prettier, TypeScript检查
- ✅ **安全扫描**: 依赖漏洞扫描、许可证检查
- ✅ **容器化**: Docker 多阶段构建，优化镜像大小
- ✅ **健康检查**: 自动化健康监控和故障检测
- ✅ **回滚机制**: 支持快速回滚到上一版本
- ✅ **监控集成**: Prometheus, Grafana, Loki 日志收集

### 📊 工作流程图

```mermaid
graph TD
    A[代码提交] --> B[触发 CI/CD]
    B --> C[预检查]
    C --> D[代码质量检查]
    D --> E[构建应用]
    E --> F[运行测试]
    F --> G[安全扫描]
    G --> H{部署环境判断}
    
    H -->|develop分支| I[部署到 Staging]
    H -->|main分支| J[部署到 Production]
    H -->|feature分支| K[仅构建和测试]
    
    I --> L[健康检查]
    J --> M[生产健康检查]
    L --> N[发送通知]
    M --> N
    
    N --> O[部署完成]
```

---

## 🏗️ 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline Architecture              │
├─────────────────────────────────────────────────────────────┤
│  GitHub Actions                                            │
│  ├── Pre-flight Checks (代码变更检测)                        │
│  ├── Quality Gates (代码质量 + 安全扫描)                     │
│  ├── Testing (单元/集成/组件测试)                            │
│  ├── Build & Optimization (多环境构建)                      │
│  ├── Security Scanning (漏洞扫描)                          │
│  └── Deployment (多平台部署)                               │
├─────────────────────────────────────────────────────────────┤
│  Container Registry (GHCR)                                │
│  ├── Frontend Images                                      │
│  └── Backend Images                                       │
├─────────────────────────────────────────────────────────────┤
│  Deployment Targets                                       │
│  ├── Docker Compose (本地开发)                             │
│  ├── Kubernetes (生产集群)                                 │
│  ├── AWS ECS/Fargate (云部署)                             │
│  └── Static Hosting (S3/CloudFront)                       │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

| 组件 | 技术选择 | 用途 |
|------|----------|------|
| **CI/CD** | GitHub Actions | 持续集成和部署 |
| **容器化** | Docker, Docker Compose | 应用打包和本地开发 |
| **编排** | Kubernetes | 生产环境容器编排 |
| **注册表** | GitHub Container Registry | 镜像存储 |
| **云服务** | AWS (ECS, S3, CloudFront) | 云端部署 |
| **监控** | Prometheus, Grafana | 系统监控 |
| **日志** | Loki, 集中化日志 | 日志收集和分析 |
| **安全** | Snyk, 依赖扫描 | 安全漏洞检测 |

---

## 🚀 快速开始

### 前置条件

确保您的开发环境已安装以下工具：

```bash
# 必需工具
node >= 18.0.0
pnpm >= 8.0.0
docker >= 20.0.0
docker-compose >= 2.0.0

# 可选工具 (用于云部署)
kubectl >= 1.24.0
aws-cli >= 2.0.0
```

### 1️⃣ 克隆项目并安装依赖

```bash
# 克隆项目
git clone <your-repository-url>
cd mendian

# 安装依赖
pnpm install

# 复制环境配置文件
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
```

### 2️⃣ 本地开发环境搭建

```bash
# 使用 Docker Compose 启动完整环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 或者分别启动前后端
pnpm dev  # 启动前端 (端口 7800) 和后端 (端口 7900)
```

### 3️⃣ 验证安装

```bash
# 检查服务状态
curl http://localhost:7800  # 前端
curl http://localhost:7900/health  # 后端健康检查
```

---

## ⚙️ GitHub Actions 配置

### 工作流文件结构

```
.github/
├── workflows/
│   ├── ci.yml                 # 原有基础 CI/CD
│   ├── enhanced-ci.yml        # 增强版 CI/CD (推荐使用)
│   └── test-coverage.yml      # 测试覆盖率分析
└── actions/
    └── setup-env/             # 自定义环境设置动作 (可选)
```

### 主要工作流说明

#### 🔥 Enhanced CI/CD Pipeline (`enhanced-ci.yml`)

这是推荐使用的主要工作流，包含以下阶段：

1. **Pre-flight Checks**: 检测代码变更，确定是否需要构建/测试/部署
2. **Quality & Security**: 并行执行代码质量检查和安全扫描
3. **Comprehensive Testing**: 多类型测试（单元、集成、组件）
4. **Build & Optimize**: 多环境构建和优化
5. **Deployment**: 支持 staging 和 production 部署
6. **Cleanup & Notification**: 清理临时文件并发送通知

#### 触发条件

```yaml
on:
  push:
    branches: [ main, develop, 'feature/*', 'hotfix/*' ]
    paths:
      - 'frontend/**'
      - 'backend/**' 
      - 'shared/**'
      - 'package.json'
      - 'pnpm-workspace.yaml'
      - '.github/workflows/**'
  pull_request:
    branches: [ main, develop ]
  workflow_dispatch:  # 手动触发
    inputs:
      environment:
        type: choice
        options: [staging, production]
      skip_tests:
        type: boolean
        default: false
```

### 🔐 必需的 Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets：

#### 基础 Secrets
```
# 代码质量和安全
CODECOV_TOKEN=<your-codecov-token>
SNYK_TOKEN=<your-snyk-token>

# 容器注册表 (自动配置，使用 GITHUB_TOKEN)
GITHUB_TOKEN=<自动提供>
```

#### 云部署 Secrets (按需配置)
```bash
# AWS 部署
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-east-1
AWS_S3_STAGING_BUCKET=<staging-bucket>
AWS_S3_PRODUCTION_BUCKET=<production-bucket>
AWS_CLOUDFRONT_DISTRIBUTION_STAGING=<staging-distribution-id>
AWS_CLOUDFRONT_DISTRIBUTION_PRODUCTION=<production-distribution-id>

# Kubernetes 部署
KUBE_CONFIG_DATA=<base64-encoded-kubeconfig>

# 监控和通知
MONITORING_WEBHOOK_URL=<your-webhook-url>
```

---

## 🐳 容器化部署

### Docker 镜像架构

#### 多阶段构建策略

```dockerfile
# 1. 构建阶段 - 编译代码
FROM node:18-alpine AS builder
# ... 构建逻辑

# 2. 生产阶段 - 最小化运行时镜像  
FROM nginx:1.25-alpine AS production
# ... 生产配置

# 3. 开发阶段 - 开发热重载
FROM node:18-alpine AS development  
# ... 开发配置
```

#### 镜像优化特性

- ✅ **多阶段构建**: 减少最终镜像大小 (< 50MB)
- ✅ **Alpine Linux**: 轻量级基础镜像
- ✅ **分层缓存**: 优化构建速度
- ✅ **安全增强**: 非 root 用户运行
- ✅ **健康检查**: 内置健康检查脚本
- ✅ **优化配置**: Nginx 性能调优

### Docker Compose 配置

#### 服务架构

```yaml
services:
  database:      # PostgreSQL 15
  redis:         # Redis 7 缓存
  backend:       # Node.js API 服务
  frontend:      # Nginx + 静态文件
  nginx-lb:      # 负载均衡器 (可选)
  prometheus:    # 监控服务 (可选)
  grafana:       # 监控面板 (可选)
  adminer:       # 数据库管理 (开发)
```

#### 环境特定配置

```bash
# 生产环境
docker-compose up -d

# 开发环境  
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 测试环境
docker-compose --profile testing up -d

# 监控环境
docker-compose --profile monitoring up -d
```

### 端口映射

| 服务 | 生产端口 | 开发端口 | 用途 |
|------|----------|----------|------|
| Frontend | 80 | 7801 | Web 界面 |
| Backend | 7900 | 7901 | API 服务 |
| Database | 5432 | 5433 | PostgreSQL |
| Redis | 6379 | 6380 | 缓存服务 |
| Adminer | - | 8081 | 数据库管理 |
| Redis Commander | - | 8082 | Redis 管理 |
| Prometheus | - | 9090 | 监控数据 |
| Grafana | - | 3000 | 监控面板 |

---

## 🔧 环境配置

### 环境变量管理

#### 配置文件层次结构

```
.env.example          # 模板文件，包含所有可配置项
.env.development     # 开发环境配置
.env.staging         # 预生产环境配置  
.env.production      # 生产环境配置
```

#### 关键配置项

##### 数据库配置
```bash
# PostgreSQL
POSTGRES_DB=mendian
POSTGRES_USER=mendian_user  
POSTGRES_PASSWORD=<secure-password>
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}

# 连接池配置
DB_POOL_MIN=5
DB_POOL_MAX=25
DB_POOL_IDLE_TIMEOUT=30000
```

##### 认证配置
```bash
# JWT 配置
JWT_SECRET=<your-super-secret-jwt-key-change-in-production>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# 企业微信集成
WECHAT_WORK_CORP_ID=<your-corp-id>
WECHAT_WORK_AGENT_ID=<your-agent-id>  
WECHAT_WORK_SECRET=<your-app-secret>
```

##### 文件上传配置
```bash
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# 对象存储 (可选)
OSS_ENDPOINT=<your-oss-endpoint>
OSS_ACCESS_KEY_ID=<access-key>
OSS_ACCESS_KEY_SECRET=<secret-key>  
OSS_BUCKET=<bucket-name>
```

##### 性能配置
```bash
# Node.js 优化
NODE_OPTIONS=--max-old-space-size=4096

# 缓存配置
CACHE_TTL_DEFAULT=3600
CACHE_TTL_USER_SESSION=86400
CACHE_TTL_API_RESPONSE=300

# 速率限制
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 安全配置

#### CORS 设置
```bash
CORS_ORIGIN=http://localhost:3000,http://localhost:7800
CORS_CREDENTIALS=true
```

#### 安全头配置 (在 Nginx 中)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always; 
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'..." always;
```

---

## 🛠️ 部署脚本使用

### Linux/macOS 部署脚本

#### 基本使用

```bash
# 给予执行权限
chmod +x scripts/deployment/deploy.sh

# 部署到 staging 环境
./scripts/deployment/deploy.sh -e staging -m docker

# 部署到生产环境
./scripts/deployment/deploy.sh -e production -m docker -t v1.2.3

# 模拟运行 (不执行实际操作)
./scripts/deployment/deploy.sh --dry-run --verbose
```

#### 高级用法

```bash
# 强制重新构建并清理旧资源
./scripts/deployment/deploy.sh -e staging -m docker -b -c

# Kubernetes 部署
./scripts/deployment/deploy.sh -e production -m kubernetes -t v1.2.3

# AWS 部署
./scripts/deployment/deploy.sh -e production -m aws -t v1.2.3
```

### Windows PowerShell 部署脚本

```powershell
# 基本部署
.\scripts\deployment\deploy.ps1 -Environment staging -Method docker

# 生产环境部署
.\scripts\deployment\deploy.ps1 -Environment production -Tag "v1.2.3"

# 强制构建
.\scripts\deployment\deploy.ps1 -Environment staging -Build -Cleanup

# 模拟运行
.\scripts\deployment\deploy.ps1 -DryRun -Verbose
```

### 脚本功能特性

#### 🔍 预检查功能
- ✅ Docker 运行状态检查
- ✅ 环境文件存在性验证
- ✅ Git 工作目录状态检查
- ✅ 必需命令可用性检查

#### 🏗️ 构建功能
- ✅ 智能构建缓存 (跳过已存在镜像)
- ✅ 多阶段构建支持
- ✅ 构建参数注入 (版本、时间戳等)
- ✅ 构建失败自动回滚

#### 🚀 部署功能
- ✅ 多环境配置自动切换
- ✅ 服务健康检查
- ✅ 优雅关闭和启动
- ✅ 部署状态实时显示

#### 🩺 健康检查
- ✅ HTTP 端点检查
- ✅ 服务响应时间监控
- ✅ 多次重试机制
- ✅ 失败自动告警

---

## ☁️ 云平台部署

### AWS 部署配置

#### ECS Fargate 部署

1. **创建 ECS 集群**
```bash
aws ecs create-cluster --cluster-name mendian-cluster
```

2. **任务定义配置**
```json
{
  "family": "mendian-frontend",
  "networkMode": "awsvpc", 
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "ghcr.io/your-org/mendian-frontend:latest",
      "portMappings": [{"containerPort": 80}],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mendian",
          "awslogs-region": "us-east-1"
        }
      }
    }
  ]
}
```

#### S3 + CloudFront 部署

```bash
# 同步静态文件到 S3
aws s3 sync ./frontend/dist s3://your-bucket/ --delete

# 创建 CloudFront 缓存失效
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Kubernetes 部署

#### 集群配置结构

```
k8s/
├── base/                    # 基础配置
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
└── overlays/               # 环境特定配置
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches/
    └── production/
        ├── kustomization.yaml
        └── patches/
```

#### 部署命令

```bash
# 部署到 staging
kubectl apply -k k8s/overlays/staging

# 部署到 production
kubectl apply -k k8s/overlays/production

# 检查部署状态
kubectl rollout status deployment/mendian-frontend
kubectl get pods -l app=mendian
```

---

## 📊 监控和日志

### Prometheus 监控配置

#### 监控指标

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mendian-frontend'
    static_configs:
      - targets: ['frontend:80']
    
  - job_name: 'mendian-backend'
    static_configs:
      - targets: ['backend:7900']
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['database:5432']
```

#### 关键指标监控

- **应用指标**: 请求延迟、错误率、吞吐量
- **系统指标**: CPU、内存、磁盘使用率
- **业务指标**: 用户登录、门店操作、数据处理量
- **基础设施指标**: 容器状态、网络连接

### Grafana 仪表盘

#### 预配置仪表盘

1. **应用总览**: 整体系统健康状况
2. **前端性能**: 页面加载时间、用户交互
3. **后端 API**: 接口响应时间、错误统计
4. **数据库性能**: 连接数、查询执行时间
5. **基础设施**: 服务器资源使用情况

### 日志管理

#### 集中化日志收集

```yaml
# docker-compose.yml 中的日志配置
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

#### 日志级别配置

```bash
# 开发环境
LOG_LEVEL=debug

# 生产环境  
LOG_LEVEL=info

# 关键错误
LOG_LEVEL=error
```

---

## 🚨 故障排除

### 常见问题和解决方案

#### 🔧 部署失败

**问题**: Docker 构建失败
```bash
# 解决方案
# 1. 清理 Docker 缓存
docker system prune -a

# 2. 检查 Dockerfile 语法
docker build --no-cache -t test-image .

# 3. 检查磁盘空间
df -h
```

**问题**: 端口冲突
```bash
# 解决方案
# 1. 检查端口占用
netstat -tulpn | grep :7800

# 2. 停止冲突服务
docker-compose down

# 3. 修改端口配置
# 在 .env 文件中更改 FRONTEND_PORT
```

#### 🔧 性能问题

**问题**: 容器启动慢
```bash
# 解决方案
# 1. 增加内存限制
docker run -m 2g your-image

# 2. 检查健康检查超时
# 修改 docker-compose.yml 中的 healthcheck
```

**问题**: 数据库连接失败
```bash
# 解决方案  
# 1. 检查数据库状态
docker-compose ps database

# 2. 查看数据库日志
docker-compose logs database

# 3. 验证连接字符串
echo $DATABASE_URL
```

### 🔍 调试技巧

#### 容器内部调试

```bash
# 进入容器内部
docker exec -it mendian-frontend sh

# 查看容器日志
docker-compose logs -f --tail 100 frontend

# 检查容器资源使用
docker stats mendian-frontend
```

#### 网络连接调试

```bash
# 测试容器间连接
docker exec -it mendian-frontend ping backend

# 检查端口监听
docker exec -it mendian-backend netstat -tlnp
```

### 📋 健康检查清单

#### 部署前检查

- [ ] 环境变量配置正确
- [ ] 必需的 Secrets 已配置  
- [ ] Docker 服务运行正常
- [ ] 磁盘空间充足 (> 2GB)
- [ ] 网络连接正常

#### 部署后验证

- [ ] 所有容器状态为 healthy
- [ ] HTTP 端点响应正常
- [ ] 数据库连接成功
- [ ] 缓存服务可用
- [ ] 日志输出正常

---

## ✨ 最佳实践

### 🔐 安全最佳实践

#### 1. 密钥管理
```bash
# ❌ 错误做法：硬编码密钥
JWT_SECRET=hardcoded-secret

# ✅ 正确做法：使用强随机密钥
JWT_SECRET=$(openssl rand -hex 32)
```

#### 2. 容器安全
```dockerfile
# ✅ 使用非 root 用户
USER nginx

# ✅ 最小权限原则
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx
```

#### 3. 网络安全
```yaml
# ✅ 网络隔离
networks:
  frontend:
    internal: false
  backend:
    internal: true
```

### 🚀 性能最佳实践

#### 1. 构建优化
```dockerfile
# ✅ 多阶段构建
FROM node:18-alpine AS builder
# ... 构建阶段

FROM nginx:alpine AS production  
# ... 生产阶段
```

#### 2. 缓存策略
```yaml
# ✅ Layer 缓存优化
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
```

#### 3. 资源限制
```yaml
# ✅ 设置资源限制
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### 📈 可扩展性最佳实践

#### 1. 水平扩展
```yaml
# ✅ 支持多实例
replicas: 3
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
```

#### 2. 负载均衡
```nginx
# ✅ 负载均衡配置
upstream backend {
    server backend-1:7900;
    server backend-2:7900;
    server backend-3:7900;
}
```

#### 3. 数据持久化
```yaml
# ✅ 数据卷持久化
volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
```

### 🔄 版本管理最佳实践

#### 1. 语义化版本
```bash
# ✅ 使用语义化版本
git tag v1.2.3
docker build -t mendian:v1.2.3 .
```

#### 2. 分支策略
```bash
# ✅ Git Flow 分支模型
main      # 生产环境
develop   # 开发环境  
feature/* # 功能分支
hotfix/*  # 热修复分支
```

#### 3. 回滚策略
```bash
# ✅ 支持快速回滚
kubectl rollout undo deployment/mendian-frontend
docker-compose down && docker-compose up -d
```

---

## 📚 相关文档

### 内部文档
- [项目概览](./DOCS/00-项目概览/README.md)
- [API 文档](./API_SPECIFICATION.md)
- [部署指南](./DOCS/05-部署运维/部署指南/)

### 外部资源
- [Docker 官方文档](https://docs.docker.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Kubernetes 文档](https://kubernetes.io/docs/)
- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)

---

## 🤝 贡献指南

### 提交规范

```bash
# ✅ 提交信息格式
git commit -m "feat(frontend): 添加用户认证功能

- 实现企业微信登录
- 添加 JWT token 管理
- 更新路由守卫逻辑

Close #123"
```

### Pull Request 流程

1. 🔀 Fork 项目并创建功能分支
2. 📝 编写代码并添加测试  
3. ✅ 确保所有检查通过
4. 📋 填写 PR 模板
5. 👥 请求代码审查
6. 🚀 合并到目标分支

---

## 📞 支持和帮助

### 获取帮助

- 📖 查看 [FAQ 文档](./DOCS/FAQ.md)
- 🐛 提交 [Issue](https://github.com/your-org/mendian/issues)
- 💬 加入讨论 [Discussions](https://github.com/your-org/mendian/discussions)
- 📧 联系维护者: dev-team@your-company.com

### 版本信息

- **当前版本**: v1.0.0
- **最后更新**: 2025-08-29
- **维护团队**: 好饭碗开发团队
- **许可证**: MIT

---

*本文档持续更新，如有疑问或建议，请及时反馈。*