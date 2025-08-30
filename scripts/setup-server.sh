#!/bin/bash

# 好饭碗门店管理系统 - 测试服务器配置脚本
# 服务器: 192.3.11.106:9000
# 用途: 自动配置nginx和部署环境

set -e

echo "🚀 开始配置好饭碗测试服务器..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warn "建议不要使用root用户运行此脚本"
        read -p "继续吗? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    if command -v apt-get > /dev/null; then
        sudo apt-get update && sudo apt-get upgrade -y
    elif command -v yum > /dev/null; then
        sudo yum update -y
    else
        log_error "不支持的包管理器"
        exit 1
    fi
}

# 安装必要软件
install_packages() {
    log_info "安装必要软件包..."
    
    if command -v apt-get > /dev/null; then
        sudo apt-get install -y nginx curl wget unzip tar gzip
    elif command -v yum > /dev/null; then
        sudo yum install -y nginx curl wget unzip tar gzip
    fi
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙端口 9000..."
    
    # Ubuntu/Debian 使用 ufw
    if command -v ufw > /dev/null; then
        sudo ufw allow 9000/tcp
        sudo ufw allow ssh
        # 不自动启用ufw，让用户决定
        log_info "防火墙规则已添加，如需启用请运行: sudo ufw enable"
    fi
    
    # CentOS/RHEL 使用 firewalld
    if command -v firewall-cmd > /dev/null; then
        sudo firewall-cmd --permanent --add-port=9000/tcp
        sudo firewall-cmd --reload
        log_info "firewalld 端口 9000 已开启"
    fi
    
    # 传统 iptables (备用)
    if ! command -v ufw > /dev/null && ! command -v firewall-cmd > /dev/null; then
        log_warn "未检测到现代防火墙工具，请手动开放端口 9000"
    fi
}

# 创建部署目录
create_directories() {
    log_info "创建部署目录..."
    
    # 创建部署目录
    sudo mkdir -p /var/www/mendian-test
    sudo mkdir -p /var/backups/mendian
    sudo mkdir -p /var/log/nginx
    
    # 设置权限
    sudo chown -R $USER:www-data /var/www/mendian-test
    sudo chmod -R 755 /var/www/mendian-test
    sudo chown -R $USER:$USER /var/backups/mendian
    
    log_info "目录结构已创建:"
    log_info "  部署目录: /var/www/mendian-test"
    log_info "  备份目录: /var/backups/mendian"
}

# 配置 Nginx
setup_nginx() {
    log_info "配置 Nginx..."
    
    # 创建站点配置
    sudo tee /etc/nginx/sites-available/mendian-test > /dev/null <<EOF
server {
    listen 9000;
    server_name 192.3.11.106;
    root /var/www/mendian-test;
    index index.html index.htm;
    
    # 访问日志
    access_log /var/log/nginx/mendian-test.access.log;
    error_log /var/log/nginx/mendian-test.error.log;
    
    # SPA 路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 静态资源优化
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # 健康检查端点
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
    
    # 安全配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF
    
    # 创建符号链接启用站点
    sudo ln -sf /etc/nginx/sites-available/mendian-test /etc/nginx/sites-enabled/
    
    # 删除默认站点（如果存在且可能冲突）
    if [ -f /etc/nginx/sites-enabled/default ]; then
        log_warn "检测到默认站点，考虑是否移除以避免冲突"
    fi
    
    # 测试 nginx 配置
    if sudo nginx -t; then
        log_info "Nginx 配置测试通过"
    else
        log_error "Nginx 配置测试失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_info "启动和启用服务..."
    
    # 启动 nginx
    sudo systemctl start nginx || sudo service nginx start
    sudo systemctl enable nginx || sudo chkconfig nginx on
    
    # 检查服务状态
    if sudo systemctl is-active --quiet nginx || sudo service nginx status > /dev/null 2>&1; then
        log_info "Nginx 服务已启动"
    else
        log_error "Nginx 启动失败"
        exit 1
    fi
}

# 创建测试页面
create_test_page() {
    log_info "创建测试页面..."
    
    sudo tee /var/www/mendian-test/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>好饭碗门店管理系统 - 测试环境</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .success {
            color: #28a745;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .timestamp {
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍚 好饭碗门店管理系统</h1>
        <div class="success">✅ 测试服务器配置成功！</div>
        <div class="info">
            <p><strong>服务器地址:</strong> 192.3.11.106:9000</p>
            <p><strong>部署目录:</strong> /var/www/mendian-test</p>
            <p><strong>状态:</strong> 等待CI/CD部署</p>
        </div>
        <p>此页面将在首次CI/CD部署后被替换为实际应用</p>
        <div class="timestamp">配置时间: $(date)</div>
    </div>
</body>
</html>
EOF
    
    sudo chown $USER:www-data /var/www/mendian-test/index.html
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    sleep 3
    
    # 检查端口是否监听
    if netstat -tln | grep -q ":9000 "; then
        log_info "端口 9000 正在监听"
    else
        log_warn "端口 9000 未检测到监听状态"
    fi
    
    # 尝试访问网站
    if curl -f -s --max-time 10 http://localhost:9000 > /dev/null; then
        log_info "本地访问测试通过"
        echo ""
        echo "🎉 服务器配置完成！"
        echo "📍 访问地址: http://192.3.11.106:9000"
        echo "📍 健康检查: http://192.3.11.106:9000/health"
    else
        log_error "本地访问测试失败"
        echo "请检查以下项目:"
        echo "1. 防火墙设置: sudo ufw status"
        echo "2. Nginx状态: sudo systemctl status nginx"
        echo "3. 端口监听: sudo netstat -tln | grep 9000"
        echo "4. 错误日志: sudo tail -f /var/log/nginx/mendian-test.error.log"
    fi
}

# 显示配置信息
show_summary() {
    echo ""
    echo "📋 配置摘要:"
    echo "════════════════════════════════════════"
    echo "🌐 网站地址: http://192.3.11.106:9000"
    echo "📁 部署目录: /var/www/mendian-test"
    echo "📁 备份目录: /var/backups/mendian"
    echo "📄 Nginx配置: /etc/nginx/sites-available/mendian-test"
    echo "📜 访问日志: /var/log/nginx/mendian-test.access.log"
    echo "📜 错误日志: /var/log/nginx/mendian-test.error.log"
    echo "════════════════════════════════════════"
    echo ""
    echo "🔧 下一步："
    echo "1. 在 GitHub 仓库设置中添加以下 Secrets："
    echo "   TEST_SERVER_HOST = 192.3.11.106"
    echo "   TEST_SERVER_USER = $(whoami)"
    echo "   TEST_SERVER_PASSWORD = [你的服务器密码]"
    echo ""
    echo "2. 推送代码触发 CI/CD 部署"
    echo ""
    echo "3. 验证部署: curl http://192.3.11.106:9000"
}

# 主函数
main() {
    echo "🚀 好饭碗门店管理系统 - 服务器配置向导"
    echo "════════════════════════════════════════════════"
    
    check_root
    update_system
    install_packages
    setup_firewall
    create_directories
    setup_nginx
    start_services
    create_test_page
    verify_deployment
    show_summary
    
    echo "✅ 服务器配置完成！"
}

# 执行主函数
main