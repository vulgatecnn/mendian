# 🔧 GitHub Actions 配置指南

## 📍 服务器信息
- **IP地址**: 192.3.11.106
- **端口**: 9000
- **访问地址**: http://192.3.11.106:9000

## 🚀 快速配置步骤

### 步骤1: 配置服务器环境

在你的服务器 (192.3.11.106) 上执行：

```bash
# 下载并运行服务器配置脚本
curl -sSL https://raw.githubusercontent.com/vulgatecnn/mendian/main/scripts/setup-server.sh -o setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

或者手动执行：

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

# 4. 配置 nginx (端口 9000)
sudo tee /etc/nginx/sites-available/mendian-test > /dev/null <<'EOF'
server {
    listen 9000;
    server_name 192.3.11.106;
    root /var/www/mendian-test;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 5. 启用站点
sudo ln -sf /etc/nginx/sites-available/mendian-test /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. 开放防火墙端口
sudo ufw allow 9000/tcp
```

### 步骤2: 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. 进入仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加以下 Secrets：

```bash
# 必需的 Secrets
TEST_SERVER_HOST = 192.3.11.106
TEST_SERVER_USER = root  # 或你的用户名
TEST_SERVER_PASSWORD = rtN8gHpcZRM01K2v97
TEST_SERVER_PORT = 22  # SSH端口，通常是22
```

### 步骤3: 配置 Repository Variables (可选)

在 GitHub 仓库设置中添加 Variables：

```bash
DEPLOY_PATH = /var/www/mendian-test
BACKUP_PATH = /var/backups/mendian
TEST_PORT = 9000
```

## 🎯 部署流程

### 自动部署
推送代码到 main/master/develop 分支会自动触发部署：

```bash
git add .
git commit -m "feat: 新功能开发"
git push origin main
```

### 手动部署
1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "🚀 部署到测试服务器" workflow
4. 点击 "Run workflow"
5. 选择环境 (test/staging) 并运行

## 📊 部署监控

### 查看部署状态
- **GitHub Actions**: https://github.com/[username]/mendian/actions
- **部署日志**: 在 Actions 中查看详细日志

### 访问网站
- **测试网站**: http://192.3.11.106:9000
- **健康检查**: http://192.3.11.106:9000/health

### 服务器日志
```bash
# 查看 nginx 访问日志
sudo tail -f /var/log/nginx/mendian-test.access.log

# 查看 nginx 错误日志
sudo tail -f /var/log/nginx/mendian-test.error.log

# 查看 nginx 状态
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tln | grep 9000
```

## 🔧 故障排除

### 常见问题

#### 1. SSH 连接失败
```bash
# 检查 SSH 连接
ssh root@192.3.11.106

# 检查防火墙
sudo ufw status
```

#### 2. 权限问题
```bash
# 修复目录权限
sudo chown -R $USER:www-data /var/www/mendian-test
sudo chmod -R 755 /var/www/mendian-test
```

#### 3. Nginx 配置错误
```bash
# 测试配置
sudo nginx -t

# 重启 nginx
sudo systemctl restart nginx
```

#### 4. 端口不可访问
```bash
# 检查端口监听
sudo netstat -tln | grep 9000

# 检查防火墙
sudo ufw allow 9000/tcp
```

### 部署失败处理

1. **查看 GitHub Actions 日志**
   - 进入 Actions 页面查看详细错误信息

2. **验证 Secrets 配置**
   - 确认所有必需的 Secrets 都已正确配置

3. **手动验证服务器连接**
   ```bash
   # 测试 SSH 连接
   ssh root@192.3.11.106
   
   # 测试密码登录
   ssh -o PreferredAuthentications=password root@192.3.11.106
   ```

4. **检查服务器磁盘空间**
   ```bash
   df -h
   ```

## 🎉 部署成功验证

部署成功后，你应该能够：

1. ✅ 访问 http://192.3.11.106:9000 看到应用
2. ✅ 所有 React 路由正常工作
3. ✅ 静态资源正常加载
4. ✅ 移动端适配正常

## 📋 维护命令

### 备份管理
```bash
# 查看备份
ls -la /var/backups/mendian/

# 手动备份
tar -czf /var/backups/mendian/manual-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www/mendian-test .
```

### 日志清理
```bash
# 清理 nginx 日志
sudo truncate -s 0 /var/log/nginx/mendian-test.access.log
sudo truncate -s 0 /var/log/nginx/mendian-test.error.log
```

### 更新 nginx 配置
```bash
# 编辑配置
sudo nano /etc/nginx/sites-available/mendian-test

# 测试并重载
sudo nginx -t && sudo systemctl reload nginx
```

## 🚀 高级配置

### HTTPS 支持 (可选)
如果后续需要 HTTPS，可以使用 Let's Encrypt：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书（需要域名）
sudo certbot --nginx -d your-domain.com
```

### 自动清理日志
创建定时任务清理日志：

```bash
# 添加到 crontab
echo "0 2 * * 0 find /var/log/nginx/ -name '*.log' -mtime +30 -delete" | sudo crontab -
```

---

现在你可以开始使用自动化部署了！🎉