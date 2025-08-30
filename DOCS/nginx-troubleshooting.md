# Nginx 部署故障排查指南

## 概述

本文档提供了好饭碗门店管理系统在测试服务器 (192.3.11.106:9000) 上部署时常见的nginx问题及解决方案。

## 常见问题及解决方案

### 1. 端口监听问题

#### 问题症状
- 服务器响应空内容或连接被拒绝
- `curl http://192.3.11.106:9000` 无响应

#### 排查步骤
```bash
# 1. 检查端口是否被监听
sudo netstat -tlnp | grep :9000
sudo ss -tlnp | grep :9000

# 2. 检查nginx进程状态
sudo systemctl status nginx
ps aux | grep nginx

# 3. 检查nginx配置是否正确
sudo nginx -t
```

#### 解决方案
```bash
# 重启nginx服务
sudo systemctl restart nginx

# 如果nginx未安装或配置错误，使用我们的脚本
sudo bash scripts/setup-nginx.sh
```

### 2. nginx目录结构问题

#### 问题症状
- 错误: `No such file or directory: /etc/nginx/sites-available`
- 错误: `ln: target '/etc/nginx/sites-enabled/' is not a directory`

#### 原因分析
不同Linux发行版的nginx目录结构不同：
- **Debian/Ubuntu**: 使用 `sites-available` 和 `sites-enabled`
- **CentOS/RHEL**: 通常只使用 `conf.d` 目录

#### 解决方案
```bash
# 创建标准目录结构
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
sudo mkdir -p /etc/nginx/conf.d

# 检查nginx主配置是否包含sites-enabled
grep -q "sites-enabled" /etc/nginx/nginx.conf || {
    echo "Adding sites-enabled to nginx.conf..."
    sudo sed -i '/http {/a\\tinclude /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
}
```

### 3. 权限问题

#### 问题症状
- 403 Forbidden 错误
- nginx错误日志显示权限被拒绝

#### 排查步骤
```bash
# 检查部署目录权限
ls -la /var/www/mendian-test/

# 检查nginx用户
ps aux | grep nginx
grep "user" /etc/nginx/nginx.conf

# 检查SELinux状态 (CentOS)
sestatus
```

#### 解决方案
```bash
# 设置正确的目录权限
sudo chmod -R 755 /var/www/mendian-test/
sudo chown -R nginx:nginx /var/www/mendian-test/

# 如果启用了SELinux，设置正确的上下文
sudo setsebool -P httpd_can_network_connect 1
sudo semanage fcontext -a -t httpd_exec_t "/var/www/mendian-test(/.*)?"
sudo restorecon -R /var/www/mendian-test/
```

### 4. 防火墙阻塞

#### 问题症状
- 本地curl可以访问，但外部无法访问
- 端口监听正常但外部连接超时

#### 排查步骤
```bash
# 检查iptables规则
sudo iptables -L -n | grep 9000

# 检查firewalld状态 (CentOS 7+)
sudo firewall-cmd --list-all
sudo firewall-cmd --list-ports

# 检查ufw状态 (Ubuntu)
sudo ufw status
```

#### 解决方案
```bash
# iptables方式
sudo iptables -A INPUT -p tcp --dport 9000 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4

# firewalld方式 (CentOS)
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --reload

# ufw方式 (Ubuntu)
sudo ufw allow 9000/tcp
```

### 5. 配置语法错误

#### 问题症状
- `nginx -t` 失败
- nginx无法启动或重新加载

#### 常见错误及修复
```bash
# 检查配置语法
sudo nginx -t

# 常见错误1: 缺少分号
location / {
    try_files $uri $uri/ /index.html  # 缺少分号
}
# 修复: 在行末添加分号

# 常见错误2: 变量转义问题
try_files $uri $uri/ /index.html;  # 错误
try_files \$uri \$uri/ /index.html; # 正确

# 常见错误3: 重复的server块监听相同端口
# 检查是否有其他配置文件监听9000端口
sudo grep -r "listen 9000" /etc/nginx/
```

### 6. React SPA 路由问题

#### 问题症状
- 首页可以访问，但刷新子页面显示404
- 直接访问子路由显示nginx 404页面

#### 解决方案
确保nginx配置包含正确的`try_files`指令：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 7. 静态资源加载失败

#### 问题症状
- 页面显示但CSS/JS文件404
- 控制台显示资源加载错误

#### 排查步骤
```bash
# 检查构建文件是否存在
ls -la /var/www/mendian-test/assets/

# 检查nginx访问日志
sudo tail -f /var/log/nginx/mendian-test-access.log

# 检查nginx错误日志
sudo tail -f /var/log/nginx/mendian-test-error.log
```

#### 解决方案
```bash
# 确保静态文件正确部署
# 检查React构建配置中的publicPath设置

# 在nginx配置中添加静态资源处理
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

## 快速排查工具

### 自动诊断脚本

创建快速诊断脚本：
```bash
#!/bin/bash
echo "=== Nginx 部署状态诊断 ==="

echo "1. 检查nginx进程:"
ps aux | grep nginx | grep -v grep

echo -e "\n2. 检查端口监听:"
sudo netstat -tlnp | grep :9000

echo -e "\n3. 检查nginx配置:"
sudo nginx -t

echo -e "\n4. 检查部署文件:"
ls -la /var/www/mendian-test/index.html 2>/dev/null || echo "部署文件不存在"

echo -e "\n5. 检查最新错误日志:"
sudo tail -10 /var/log/nginx/mendian-test-error.log 2>/dev/null || echo "错误日志不存在"

echo -e "\n6. HTTP连接测试:"
curl -I http://localhost:9000 2>/dev/null || echo "HTTP连接失败"
```

### 手动验证步骤

1. **基础检查**
   ```bash
   # 检查nginx是否安装
   which nginx && nginx -v
   
   # 检查nginx是否运行
   sudo systemctl status nginx
   ```

2. **配置检查**
   ```bash
   # 测试配置语法
   sudo nginx -t
   
   # 查看实际加载的配置
   sudo nginx -T
   ```

3. **网络检查**
   ```bash
   # 本地连接测试
   curl -v http://localhost:9000
   
   # 远程连接测试（从其他机器）
   curl -v http://192.3.11.106:9000
   ```

4. **日志检查**
   ```bash
   # 实时查看访问日志
   sudo tail -f /var/log/nginx/mendian-test-access.log
   
   # 实时查看错误日志
   sudo tail -f /var/log/nginx/mendian-test-error.log
   ```

## 应急修复

### 快速重置nginx配置
```bash
# 1. 停止nginx
sudo systemctl stop nginx

# 2. 备份当前配置
sudo cp -r /etc/nginx /etc/nginx.backup.$(date +%Y%m%d)

# 3. 使用我们的自动配置脚本
sudo bash scripts/setup-nginx.sh

# 4. 启动nginx
sudo systemctl start nginx
```

### 临时使用Python服务器
如果nginx配置复杂，可以临时使用Python内置服务器：
```bash
# 进入部署目录
cd /var/www/mendian-test

# 启动Python服务器（端口9000）
sudo python3 -m http.server 9000
# 或者
sudo python -m SimpleHTTPServer 9000  # Python 2
```

## 联系信息

如果遇到无法解决的问题，请联系开发团队并提供：
1. 错误日志内容 (`/var/log/nginx/mendian-test-error.log`)
2. nginx配置测试结果 (`sudo nginx -t`)
3. 系统信息 (`uname -a`, `cat /etc/os-release`)
4. 网络测试结果 (`curl -v http://localhost:9000`)

---
*最后更新: 2025-08-30*