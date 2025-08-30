# 🚀 测试服务器部署指南

## 📋 目录
- [部署方案对比](#部署方案对比)
- [推荐方案：直接部署](#推荐方案直接部署)
- [备选方案：Docker部署](#备选方案docker部署)
- [配置步骤](#配置步骤)
- [常见问题](#常见问题)

## 部署方案对比

### 🎯 直接部署 (推荐)
**适用场景**：前端静态文件部署，快速测试环境

✅ **优点**：
- 部署速度极快（15-30秒）
- 资源消耗最低
- 配置简单，易维护
- 性能最优（nginx直接托管）

❌ **缺点**：
- 需要服务器预安装nginx
- 环境隔离性较弱

### 🐳 Docker部署 (备选)
**适用场景**：需要环境隔离，或服务器环境复杂

✅ **优点**：
- 环境完全隔离
- 配置标准化
- 易于横向扩展

❌ **缺点**：
- 部署时间较长（2-5分钟）
- 资源消耗更大
- 配置相对复杂

## 📊 性能对比

| 指标 | 直接部署 | Docker部署 |
|------|----------|------------|
| 部署时间 | 15-30秒 | 2-5分钟 |
| 内存使用 | ~10MB | ~50MB |
| 启动时间 | 即时 | 10-15秒 |
| 响应时间 | 最优 | 轻微增加 |

## 🎯 推荐方案：直接部署

### 配置 GitHub Secrets
在仓库设置中添加以下 Secrets：

```bash
# 必需的 Secrets
TEST_SERVER_HOST=192.168.1.100          # 你的服务器IP
TEST_SERVER_USER=ubuntu                 # SSH用户名
TEST_SERVER_SSH_KEY=-----BEGIN RSA...   # SSH私钥内容
TEST_SERVER_PORT=22                     # SSH端口（可选，默认22）
```

### 配置 Repository Variables
在仓库设置中添加以下 Variables：

```bash
# 部署配置
DEPLOY_PATH=/var/www/mendian-test        # 部署目录
BACKUP_PATH=/var/backups/mendian        # 备份目录
TEST_DOMAIN=test.yourdomain.com          # 测试域名
API_URL=http://api.test.com              # API地址
```

### 服务器预配置

```bash
# 1. 安装 nginx
sudo apt update
sudo apt install nginx -y

# 2. 创建部署目录
sudo mkdir -p /var/www/mendian-test
sudo mkdir -p /var/backups/mendian

# 3. 设置权限
sudo chown -R $USER:www-data /var/www/mendian-test
sudo chmod -R 755 /var/www/mendian-test

# 4. 启动 nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 🐳 备选方案：Docker部署

### 额外的 Variables 配置
```bash
TEST_PORT=8080                          # 容器暴露端口
```

### 服务器预配置

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 3. 添加用户到 docker 组
sudo usermod -aG docker $USER
```

## 🔧 配置步骤

### 步骤1：选择部署方式
根据你的需求选择一个工作流文件：

```bash
# 直接部署（推荐）
.github/workflows/deploy-test-server.yml

# Docker部署（备选）
.github/workflows/deploy-test-server-docker.yml
```

### 步骤2：配置服务器信息
1. 进入 GitHub 仓库设置
2. 点击 "Secrets and variables" → "Actions"
3. 添加必要的 Secrets 和 Variables

### 步骤3：生成SSH密钥
```bash
# 在你的本地机器上生成
ssh-keygen -t rsa -b 4096 -C "github-actions"

# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server

# 将私钥内容复制到 GitHub Secrets
cat ~/.ssh/id_rsa
```

### 步骤4：测试部署
```bash
# 手动触发部署
git push origin main

# 或使用 workflow_dispatch
# 在 GitHub Actions 页面点击 "Run workflow"
```

## 🔍 监控和维护

### 日志查看
```bash
# 直接部署 - nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Docker部署 - 容器日志
docker logs -f mendian-test
```

### 健康检查
```bash
# 直接部署
curl -I http://your-domain.com

# Docker部署
curl -I http://your-server:8080/health
```

### 故障恢复
```bash
# 直接部署 - 从备份恢复
sudo tar -xzf /var/backups/mendian/backup-YYYYMMDD-HHMMSS.tar.gz -C /var/www/mendian-test

# Docker部署 - 重启容器
docker restart mendian-test
```

## ❓ 常见问题

### Q1: SSH连接失败
```bash
# 检查SSH配置
ssh -v user@server-ip

# 确保防火墙开放22端口
sudo ufw allow 22
```

### Q2: 权限问题
```bash
# 修复权限
sudo chown -R www-data:www-data /var/www/mendian-test
sudo chmod -R 755 /var/www/mendian-test
```

### Q3: nginx配置错误
```bash
# 测试nginx配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
```

### Q4: Docker容器启动失败
```bash
# 查看容器日志
docker logs mendian-test

# 检查端口占用
netstat -tlnp | grep :8080
```

## 🎯 总结建议

**对于你的前端项目，我强烈推荐使用直接部署方案**：

1. ✅ **部署速度快** - 适合频繁测试
2. ✅ **资源消耗低** - 适合资源有限的测试服务器  
3. ✅ **配置简单** - 减少维护成本
4. ✅ **性能最优** - nginx直接托管静态文件

只有在以下情况考虑Docker：
- 服务器环境复杂，需要完全隔离
- 需要同时部署多个版本
- 需要快速横向扩展

现在你可以根据实际情况选择合适的方案！需要我帮你配置哪个方案？