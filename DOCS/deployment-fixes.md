# 测试服务器部署修复说明

## 问题背景

测试服务器 `192.3.11.106:9000` 部署存在以下问题：
- nginx sites-available/sites-enabled 目录结构不存在
- 端口监听正常但返回空响应
- nginx配置不完整导致静态文件无法正确服务

## 解决方案

### 1. 修复后的 GitHub Actions 工作流

**文件**: `.github/workflows/deploy-test-server.yml`

**主要改进**:
- 自动检测Linux发行版（Debian/CentOS）
- 自动安装和配置nginx
- 创建必要的目录结构
- 智能选择配置文件位置（sites-available 或 conf.d）
- 增强的健康检查和故障排查
- 详细的部署日志和错误诊断

**核心功能**:
```bash
# 自动检测系统类型
if command -v apt-get; then DISTRO="debian"
elif command -v yum; then DISTRO="centos"

# 创建目录结构
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
sudo mkdir -p /etc/nginx/conf.d

# 智能配置文件选择
if sites-enabled目录可用; then
    使用 /etc/nginx/sites-available/mendian-test
else
    使用 /etc/nginx/conf.d/mendian-test.conf
```

### 2. 手动部署脚本

**文件**: `scripts/setup-nginx.sh`

**使用方法**:
```bash
# 使用默认配置
sudo bash scripts/setup-nginx.sh

# 自定义配置
sudo bash scripts/setup-nginx.sh /var/www/myapp 8080 example.com
```

**功能特点**:
- 自动检测并安装nginx
- 创建完整的nginx配置
- 支持React SPA路由
- 包含API代理配置
- 自动创建测试页面
- 完整的错误处理和回滚

### 3. 部署状态检查工具

**文件**: `scripts/check-deployment.sh`

**使用方法**:
```bash
# 执行完整检查
bash scripts/check-deployment.sh

# 详细模式
bash scripts/check-deployment.sh --verbose
```

**检查项目**:
1. ✅ Nginx 安装状态
2. ✅ Nginx 服务状态  
3. ✅ Nginx 配置文件
4. ✅ 端口监听状态
5. ✅ 部署文件状态
6. ✅ 日志文件状态
7. ✅ HTTP连接测试
8. ✅ 系统信息

### 4. 故障排查指南

**文件**: `docs/nginx-troubleshooting.md`

**涵盖问题**:
- 端口监听问题
- nginx目录结构问题
- 权限问题
- 防火墙阻塞
- 配置语法错误
- React SPA路由问题
- 静态资源加载失败

## 使用建议

### 自动部署（推荐）
通过GitHub Actions自动部署：
1. 推送代码到 `main/master/develop` 分支
2. 工作流自动触发
3. 自动构建、部署和配置nginx
4. 自动健康检查和故障诊断

### 手动部署
如果自动部署失败，使用手动脚本：
```bash
# 1. SSH登录服务器
ssh user@192.3.11.106

# 2. 下载项目代码（如果需要）
git clone <repository-url>
cd mendian

# 3. 运行nginx配置脚本
sudo bash scripts/setup-nginx.sh

# 4. 检查部署状态
bash scripts/check-deployment.sh

# 5. 上传构建文件到 /var/www/mendian-test/
```

### 故障排查
遇到问题时的排查步骤：
```bash
# 1. 运行状态检查
bash scripts/check-deployment.sh

# 2. 查看nginx错误日志
sudo tail -20 /var/log/nginx/mendian-test-error.log

# 3. 测试nginx配置
sudo nginx -t

# 4. 重启nginx服务
sudo systemctl restart nginx

# 5. 检查端口监听
sudo ss -tlnp | grep :9000
```

## 配置文件模板

### Nginx站点配置
```nginx
server {
    listen 9000;
    server_name 192.3.11.106 localhost _;
    root /var/www/mendian-test;
    index index.html index.htm;
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理（如果需要）
    location /api/ {
        proxy_pass http://localhost:7900/api/;
        # ... proxy设置
    }
}
```

## 环境要求

### 服务器要求
- **操作系统**: CentOS 7+, Ubuntu 16.04+, Debian 9+
- **权限**: sudo 权限或 root 用户
- **端口**: 9000 端口可用
- **防火墙**: 允许入站端口 9000

### 软件依赖
- **Nginx**: 自动安装
- **curl**: 用于健康检查
- **tar**: 用于文件解压
- **基础工具**: sed, grep, awk (通常预装)

## 验证部署

部署完成后，通过以下方式验证：

1. **浏览器访问**: http://192.3.11.106:9000
2. **命令行测试**: `curl -I http://192.3.11.106:9000`
3. **状态检查**: `bash scripts/check-deployment.sh`

期望结果：
- HTTP 200 响应
- 返回完整的HTML页面
- React应用正常加载
- 路由功能正常

## 注意事项

1. **权限管理**: 所有脚本都需要sudo权限
2. **端口冲突**: 确保端口9000未被其他服务占用
3. **防火墙设置**: 可能需要手动开放端口9000
4. **SELinux**: CentOS系统可能需要配置SELinux策略
5. **备份恢复**: 所有脚本都会自动备份现有配置

---
*创建时间: 2025-08-30*
*适用版本: v1.0*