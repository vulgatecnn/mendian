#!/bin/bash

# 好饭碗门店管理系统 - Nginx配置脚本
# 用于手动配置测试服务器的nginx环境

set -e

echo "🚀 好饭碗门店管理系统 - Nginx配置脚本"
echo "============================================"

# 默认配置
DEFAULT_DEPLOY_PATH="/var/www/mendian-test"
DEFAULT_PORT="9000"
DEFAULT_SERVER_NAME="192.3.11.106"

# 读取用户输入或使用默认值
DEPLOY_PATH=${1:-$DEFAULT_DEPLOY_PATH}
PORT=${2:-$DEFAULT_PORT}
SERVER_NAME=${3:-$DEFAULT_SERVER_NAME}

echo "📋 配置信息:"
echo "   部署路径: $DEPLOY_PATH"
echo "   监听端口: $PORT"
echo "   服务器名: $SERVER_NAME"
echo ""

# 检测Linux发行版
detect_distro() {
    if command -v apt-get >/dev/null 2>&1; then
        echo "debian"
    elif command -v yum >/dev/null 2>&1; then
        echo "centos-yum"
    elif command -v dnf >/dev/null 2>&1; then
        echo "centos-dnf"
    else
        echo "unknown"
    fi
}

DISTRO=$(detect_distro)
echo "📋 检测到系统类型: $DISTRO"

# 检查是否为root用户或有sudo权限
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo "❌ 此脚本需要root权限或sudo权限"
    echo "💡 请使用: sudo $0 或以root用户运行"
    exit 1
fi

# 使用sudo前缀（如果不是root用户）
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

# 安装nginx
install_nginx() {
    echo "📦 检查并安装nginx..."
    
    if command -v nginx >/dev/null 2>&1; then
        echo "✅ nginx已安装"
        nginx -v
        return 0
    fi
    
    echo "📥 开始安装nginx..."
    case $DISTRO in
        "debian")
            $SUDO apt-get update -y
            $SUDO apt-get install -y nginx
            ;;
        "centos-yum")
            $SUDO yum install -y epel-release
            $SUDO yum install -y nginx
            ;;
        "centos-dnf")
            $SUDO dnf install -y epel-release
            $SUDO dnf install -y nginx
            ;;
        *)
            echo "❌ 不支持的Linux发行版: $DISTRO"
            echo "💡 请手动安装nginx后重新运行此脚本"
            exit 1
            ;;
    esac
    
    if command -v nginx >/dev/null 2>&1; then
        echo "✅ nginx安装成功"
        nginx -v
    else
        echo "❌ nginx安装失败"
        exit 1
    fi
}

# 配置nginx目录结构
setup_nginx_directories() {
    echo "📁 设置nginx目录结构..."
    
    # 创建标准目录
    $SUDO mkdir -p /etc/nginx/conf.d
    $SUDO mkdir -p /etc/nginx/sites-available
    $SUDO mkdir -p /etc/nginx/sites-enabled
    $SUDO mkdir -p /var/log/nginx
    
    # 检查nginx主配置文件
    NGINX_CONF="/etc/nginx/nginx.conf"
    if [ ! -f "$NGINX_CONF" ]; then
        echo "❌ nginx主配置文件不存在: $NGINX_CONF"
        exit 1
    fi
    
    # 检查是否已包含sites-enabled
    if ! grep -q "sites-enabled" "$NGINX_CONF" 2>/dev/null; then
        echo "🔧 更新nginx主配置以包含sites-enabled目录..."
        # 备份原配置
        $SUDO cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # 在http块中添加include语句
        if $SUDO sed -i '/http {/a\\tinclude /etc/nginx/sites-enabled/*;' "$NGINX_CONF"; then
            echo "✅ nginx主配置更新成功"
        else
            echo "⚠️ 无法自动更新nginx.conf，将使用conf.d目录"
            export USE_CONF_D=true
        fi
    else
        echo "✅ nginx主配置已包含sites-enabled目录"
    fi
}

# 创建站点配置
create_site_config() {
    echo "🔧 创建站点配置..."
    
    # 确定配置文件路径
    if [ "$USE_CONF_D" = true ]; then
        SITE_CONFIG="/etc/nginx/conf.d/mendian-test.conf"
        echo "📝 使用conf.d目录: $SITE_CONFIG"
    else
        SITE_CONFIG="/etc/nginx/sites-available/mendian-test"
        echo "📝 使用sites-available目录: $SITE_CONFIG"
    fi
    
    # 备份现有配置（如果存在）
    if [ -f "$SITE_CONFIG" ]; then
        echo "📦 备份现有配置文件..."
        $SUDO cp "$SITE_CONFIG" "${SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 创建新的配置文件
    $SUDO tee "$SITE_CONFIG" > /dev/null <<EOF
# 好饭碗门店管理系统 - Nginx配置
# 生成时间: $(date)
# 配置信息: 端口=$PORT, 服务器=$SERVER_NAME, 路径=$DEPLOY_PATH

server {
    listen $PORT;
    server_name $SERVER_NAME localhost _;
    root $DEPLOY_PATH;
    index index.html index.htm;
    
    # 访问日志和错误日志
    access_log /var/log/nginx/mendian-test-access.log;
    error_log /var/log/nginx/mendian-test-error.log warn;
    
    # 主要位置块 - SPA路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # CORS头（开发环境）
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
        
        # OPTIONS预检请求处理
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # 静态资源优化
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
        access_log off;
        
        # 处理不存在的文件（避免404错误）
        try_files \$uri =404;
    }
    
    # API代理配置（如果后端在同一服务器）
    location /api/ {
        proxy_pass http://localhost:7900/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查端点
    location /health {
        access_log off;
        return 200 "OK\\n";
        add_header Content-Type text/plain;
    }
    
    # 安全配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 禁止访问隐藏文件和敏感文件
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~* \\.(env|log|ini)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF
    
    echo "✅ 站点配置文件创建成功: $SITE_CONFIG"
    
    # 如果使用sites-available，则创建符号链接
    if [ "$USE_CONF_D" != true ] && [ -d "/etc/nginx/sites-enabled" ]; then
        echo "🔗 启用站点配置..."
        $SUDO ln -sf "$SITE_CONFIG" /etc/nginx/sites-enabled/mendian-test
        
        # 移除冲突的默认站点（如果存在）
        if [ -f "/etc/nginx/sites-enabled/default" ] && [ "$PORT" = "80" ]; then
            echo "🗑️ 移除默认站点配置（端口冲突）..."
            $SUDO rm -f /etc/nginx/sites-enabled/default
        fi
        
        echo "✅ 站点配置已启用"
    fi
}

# 创建部署目录
create_deploy_directory() {
    echo "📁 创建部署目录..."
    
    $SUDO mkdir -p "$DEPLOY_PATH"
    $SUDO chmod 755 "$DEPLOY_PATH"
    
    # 如果目录为空，创建一个测试页面
    if [ ! -f "$DEPLOY_PATH/index.html" ]; then
        echo "📝 创建测试页面..."
        $SUDO tee "$DEPLOY_PATH/index.html" > /dev/null <<EOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>好饭碗门店管理系统 - 测试页面</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; text-align: center; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍚 好饭碗门店管理系统</h1>
        <div class="status success">
            ✅ Nginx配置成功！测试页面正常显示
        </div>
        <div class="status info">
            📋 配置信息:<br>
            • 服务器: $SERVER_NAME<br>
            • 端口: $PORT<br>
            • 部署路径: $DEPLOY_PATH<br>
            • 配置时间: $(date)
        </div>
        <p>此页面表示nginx配置正确，可以正常提供Web服务。</p>
        <p>当您部署实际的React应用时，此测试页面将被替换。</p>
    </div>
</body>
</html>
EOF
        echo "✅ 测试页面创建成功"
    fi
    
    echo "✅ 部署目录准备完成: $DEPLOY_PATH"
}

# 启动和配置nginx服务
start_nginx_service() {
    echo "🚀 启动nginx服务..."
    
    # 启用nginx服务
    if command -v systemctl >/dev/null 2>&1; then
        $SUDO systemctl enable nginx
        $SUDO systemctl start nginx
        SERVICE_MANAGER="systemctl"
    else
        $SUDO chkconfig nginx on 2>/dev/null || true
        $SUDO service nginx start
        SERVICE_MANAGER="service"
    fi
    
    # 测试nginx配置
    echo "🧪 测试nginx配置..."
    if $SUDO nginx -t; then
        echo "✅ nginx配置测试通过"
    else
        echo "❌ nginx配置测试失败"
        echo "📋 配置文件内容:"
        $SUDO cat "$SITE_CONFIG" 2>/dev/null || echo "无法读取配置文件"
        exit 1
    fi
    
    # 重新加载nginx
    echo "🔄 重新加载nginx配置..."
    if [ "$SERVICE_MANAGER" = "systemctl" ]; then
        if $SUDO systemctl reload nginx; then
            echo "✅ nginx重新加载成功"
        else
            echo "⚠️ nginx重新加载失败，尝试重启..."
            $SUDO systemctl restart nginx
            echo "✅ nginx重启成功"
        fi
    else
        if $SUDO service nginx reload; then
            echo "✅ nginx重新加载成功"
        else
            echo "⚠️ nginx重新加载失败，尝试重启..."
            $SUDO service nginx restart
            echo "✅ nginx重启成功"
        fi
    fi
}

# 验证部署
verify_deployment() {
    echo "🧪 验证部署..."
    
    # 检查nginx进程
    if pgrep nginx >/dev/null; then
        echo "✅ nginx进程运行正常"
    else
        echo "❌ nginx进程未运行"
        return 1
    fi
    
    # 检查端口监听
    if $SUDO netstat -tlnp 2>/dev/null | grep ":$PORT " >/dev/null || $SUDO ss -tlnp 2>/dev/null | grep ":$PORT " >/dev/null; then
        echo "✅ 端口 $PORT 正在监听"
    else
        echo "❌ 端口 $PORT 未在监听"
        return 1
    fi
    
    # HTTP健康检查
    echo "📡 执行HTTP健康检查..."
    sleep 3
    
    for i in {1..3}; do
        if curl -f -s --max-time 10 "http://localhost:$PORT" >/dev/null; then
            echo "✅ HTTP健康检查通过 (尝试 $i/3)"
            break
        else
            echo "⚠️ HTTP健康检查失败，重试中... (尝试 $i/3)"
            if [ $i -eq 3 ]; then
                echo "❌ HTTP健康检查最终失败"
                return 1
            fi
            sleep 2
        fi
    done
    
    return 0
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署配置完成！"
    echo "============================================"
    echo "📋 部署信息:"
    echo "   🌐 访问地址: http://$SERVER_NAME:$PORT"
    echo "   📁 部署路径: $DEPLOY_PATH"
    echo "   ⚙️  配置文件: $SITE_CONFIG"
    echo "   📝 访问日志: /var/log/nginx/mendian-test-access.log"
    echo "   📝 错误日志: /var/log/nginx/mendian-test-error.log"
    echo ""
    echo "🔧 常用命令:"
    echo "   重启nginx: sudo systemctl restart nginx (或 sudo service nginx restart)"
    echo "   查看状态: sudo systemctl status nginx (或 sudo service nginx status)"
    echo "   测试配置: sudo nginx -t"
    echo "   查看日志: sudo tail -f /var/log/nginx/mendian-test-error.log"
    echo ""
    echo "💡 提示:"
    echo "   • 要部署React应用，请将构建文件放到: $DEPLOY_PATH"
    echo "   • 当前显示的是测试页面，部署后将被替换"
    echo "   • 如有问题，请检查nginx错误日志"
}

# 主执行流程
main() {
    echo "开始nginx配置流程..."
    
    install_nginx
    setup_nginx_directories
    create_site_config
    create_deploy_directory
    start_nginx_service
    
    if verify_deployment; then
        show_deployment_info
        echo ""
        echo "✅ 所有配置完成！nginx已成功运行"
        exit 0
    else
        echo ""
        echo "❌ 部署验证失败，请检查配置和日志"
        echo "🔍 故障排查建议:"
        echo "   1. 检查nginx错误日志: sudo tail -20 /var/log/nginx/mendian-test-error.log"
        echo "   2. 检查nginx状态: sudo systemctl status nginx"
        echo "   3. 检查端口占用: sudo netstat -tlnp | grep $PORT"
        echo "   4. 测试nginx配置: sudo nginx -t"
        exit 1
    fi
}

# 脚本使用说明
show_usage() {
    echo "用法: $0 [部署路径] [端口] [服务器名]"
    echo ""
    echo "参数说明:"
    echo "  部署路径   React应用的部署目录 (默认: $DEFAULT_DEPLOY_PATH)"
    echo "  端口       nginx监听端口 (默认: $DEFAULT_PORT)"
    echo "  服务器名   服务器域名或IP (默认: $DEFAULT_SERVER_NAME)"
    echo ""
    echo "示例:"
    echo "  $0                                    # 使用默认配置"
    echo "  $0 /var/www/myapp 8080 example.com   # 自定义配置"
    echo ""
    exit 0
}

# 检查命令行参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_usage
fi

# 执行主流程
main