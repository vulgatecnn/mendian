# 部署指南

## 概述

本项目支持多种部署方式，包括本地开发、Docker容器化部署和云端部署。

## 环境要求

### 基础环境
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+

### 开发环境
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Redis 7+

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/store-lifecycle-management.git
cd store-lifecycle-management
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 启动开发环境
```bash
# Linux/Mac
./scripts/deploy.sh dev

# Windows
scripts\deploy.bat dev
```

## CI/CD 配置

### GitHub Secrets 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下 secrets：

#### 必需的 Secrets
```
DOCKER_USERNAME          # Docker Hub 用户名
DOCKER_PASSWORD          # Docker Hub 密码或访问令牌
DB_PASSWORD              # 生产环境数据库密码
SECRET_KEY               # Django 密钥
GRAFANA_PASSWORD         # Grafana 管理员密码
```

#### 可选的 Secrets
```
SLACK_WEBHOOK            # Slack 通知 Webhook URL
AWS_ACCESS_KEY_ID        # AWS 访问密钥 ID
AWS_SECRET_ACCESS_KEY    # AWS 密钥
EMAIL_HOST_PASSWORD      # 邮件服务密码
WECHAT_SECRET           # 企业微信密钥
```

### 分支策略

- `main` 分支：生产环境，自动部署到生产服务器
- `develop` 分支：测试环境，自动部署到测试服务器
- `feature/*` 分支：功能开发，仅运行测试

### CI/CD 流程

1. **代码质量检查**
   - ESLint (前端)
   - Flake8, Black, isort (后端)
   - TypeScript 类型检查

2. **安全扫描**
   - npm audit (前端依赖)
   - Safety, Bandit (后端安全)

3. **自动化测试**
   - 单元测试
   - 集成测试
   - 端到端测试
   - 性能测试

4. **构建和部署**
   - Docker 镜像构建
   - 推送到 Docker Hub
   - 自动部署到对应环境

## 部署环境

### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

访问地址：
- 前端：http://localhost:3000
- 后端：http://localhost:8000
- API文档：http://localhost:8000/api/docs/

### 生产环境

```bash
# 设置环境变量
export DB_PASSWORD="your_secure_password"
export SECRET_KEY="your_secret_key"
export DOCKER_USERNAME="your_docker_username"

# 部署到生产环境
./scripts/deploy.sh prod
```

访问地址：
- 应用：https://your-domain.com
- 监控：https://your-domain.com:3001 (Grafana)
- 指标：https://your-domain.com:9090 (Prometheus)

## 监控和日志

### 应用监控

- **Grafana**: 可视化监控面板
- **Prometheus**: 指标收集和存储
- **健康检查**: 自动检测服务状态

### 日志管理

```bash
# 查看应用日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看 Nginx 日志
docker-compose logs -f nginx

# 查看数据库日志
docker-compose logs -f db
```

## 备份和恢复

### 数据库备份

```bash
# 创建备份
docker-compose exec db pg_dump -U postgres store_lifecycle > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker-compose exec -T db psql -U postgres store_lifecycle < backup_file.sql
```

### 媒体文件备份

```bash
# 备份媒体文件
docker run --rm -v store-lifecycle_backend_media:/data -v $(pwd):/backup alpine tar czf /backup/media_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# 恢复媒体文件
docker run --rm -v store-lifecycle_backend_media:/data -v $(pwd):/backup alpine tar xzf /backup/media_backup.tar.gz -C /data
```

## 性能优化

### 数据库优化

1. **索引优化**
   ```bash
   python manage.py create_performance_indexes
   ```

2. **查询优化**
   - 使用 select_related 和 prefetch_related
   - 避免 N+1 查询问题

3. **连接池配置**
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'OPTIONS': {
               'MAX_CONNS': 20,
               'MIN_CONNS': 5,
           }
       }
   }
   ```

### 缓存优化

1. **Redis 缓存**
   - API 响应缓存
   - 数据库查询缓存
   - 会话存储

2. **前端缓存**
   - 静态资源缓存
   - API 请求缓存
   - 浏览器缓存策略

### 负载均衡

```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

upstream frontend {
    server frontend1:80;
    server frontend2:80;
}
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec db pg_isready -U postgres
   
   # 重启数据库服务
   docker-compose restart db
   ```

2. **前端构建失败**
   ```bash
   # 清除缓存
   docker-compose exec frontend npm cache clean --force
   
   # 重新安装依赖
   docker-compose exec frontend npm ci
   ```

3. **后端服务异常**
   ```bash
   # 查看详细日志
   docker-compose logs -f backend
   
   # 进入容器调试
   docker-compose exec backend bash
   ```

### 健康检查

```bash
# 检查所有服务状态
curl http://localhost:8000/api/health/
curl http://localhost:3000/health

# 检查数据库连接
docker-compose exec backend python manage.py check --database default

# 检查 Redis 连接
docker-compose exec redis redis-cli ping
```

## 安全配置

### SSL/TLS 配置

1. **获取 SSL 证书**
   ```bash
   # 使用 Let's Encrypt
   certbot certonly --webroot -w /var/www/html -d your-domain.com
   ```

2. **配置 Nginx**
   ```nginx
   server {
       listen 443 ssl http2;
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
   }
   ```

### 防火墙配置

```bash
# 开放必要端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# 限制数据库访问
ufw deny 5432/tcp
```

### 安全头配置

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## 扩展部署

### Kubernetes 部署

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: store-lifecycle-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: store-lifecycle-backend
  template:
    metadata:
      labels:
        app: store-lifecycle-backend
    spec:
      containers:
      - name: backend
        image: your-registry/store-lifecycle-backend:latest
        ports:
        - containerPort: 8000
```

### 云服务部署

#### AWS ECS
```json
{
  "family": "store-lifecycle",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/store-lifecycle-backend:latest",
      "memory": 512,
      "cpu": 256
    }
  ]
}
```

#### Google Cloud Run
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: store-lifecycle-backend
spec:
  template:
    spec:
      containers:
      - image: gcr.io/project/store-lifecycle-backend:latest
        ports:
        - containerPort: 8000
```

## 维护和更新

### 滚动更新

```bash
# 更新后端服务
docker-compose -f docker-compose.production.yml up -d --no-deps backend

# 更新前端服务
docker-compose -f docker-compose.production.yml up -d --no-deps frontend
```

### 版本回滚

```bash
# 回滚到上一个版本
./scripts/deploy.sh rollback

# 回滚到指定版本
docker-compose -f docker-compose.production.yml up -d --no-deps backend:v1.2.3
```

### 数据迁移

```bash
# 运行数据库迁移
docker-compose exec backend python manage.py migrate

# 创建新的迁移文件
docker-compose exec backend python manage.py makemigrations
```

## 联系支持

如果在部署过程中遇到问题，请：

1. 查看 [故障排除](#故障排除) 部分
2. 检查 GitHub Issues
3. 联系开发团队

---

*最后更新: 2025-11-06*