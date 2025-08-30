#!/bin/bash

# 好饭碗门店管理系统 - 部署状态检查脚本
# 用于快速检查测试服务器的部署状态

set -e

echo "🔍 好饭碗门店管理系统 - 部署状态检查"
echo "============================================"

# 配置变量
SITE_URL="http://192.3.11.106:9000"
LOCAL_URL="http://localhost:9000"
DEPLOY_PATH="/var/www/mendian-test"
NGINX_CONFIG_SITES="/etc/nginx/sites-available/mendian-test"
NGINX_CONFIG_CONF="/etc/nginx/conf.d/mendian-test.conf"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}📋 $message${NC}"
            ;;
    esac
}

# 检查nginx安装
check_nginx_installation() {
    echo -e "\n${BLUE}1. 检查 Nginx 安装状态${NC}"
    echo "----------------------------------------"
    
    if command -v nginx >/dev/null 2>&1; then
        local version=$(nginx -v 2>&1 | cut -d: -f2 | tr -d ' ')
        print_status "OK" "nginx已安装，版本: $version"
        return 0
    else
        print_status "ERROR" "nginx未安装"
        echo "💡 运行以下命令安装: sudo bash scripts/setup-nginx.sh"
        return 1
    fi
}

# 检查nginx服务状态
check_nginx_service() {
    echo -e "\n${BLUE}2. 检查 Nginx 服务状态${NC}"
    echo "----------------------------------------"
    
    # 检查进程
    if pgrep nginx >/dev/null; then
        print_status "OK" "nginx进程运行中"
        print_status "INFO" "nginx进程: $(pgrep nginx | wc -l) 个"
    else
        print_status "ERROR" "nginx进程未运行"
        return 1
    fi
    
    # 检查服务状态
    if command -v systemctl >/dev/null 2>&1; then
        if systemctl is-active nginx >/dev/null 2>&1; then
            print_status "OK" "nginx服务状态: active"
        else
            print_status "ERROR" "nginx服务状态: inactive"
            echo "💡 运行以下命令启动: sudo systemctl start nginx"
        fi
    else
        if service nginx status >/dev/null 2>&1; then
            print_status "OK" "nginx服务运行中 (使用service命令检测)"
        else
            print_status "ERROR" "nginx服务未运行 (使用service命令检测)"
            echo "💡 运行以下命令启动: sudo service nginx start"
        fi
    fi
}

# 检查nginx配置
check_nginx_config() {
    echo -e "\n${BLUE}3. 检查 Nginx 配置${NC}"
    echo "----------------------------------------"
    
    # 检查配置语法
    if sudo nginx -t >/dev/null 2>&1; then
        print_status "OK" "nginx配置语法正确"
    else
        print_status "ERROR" "nginx配置语法错误"
        echo "详细错误信息:"
        sudo nginx -t
        return 1
    fi
    
    # 检查站点配置文件
    local config_file=""
    if [ -f "$NGINX_CONFIG_SITES" ]; then
        config_file="$NGINX_CONFIG_SITES"
        print_status "OK" "站点配置文件存在: $config_file"
    elif [ -f "$NGINX_CONFIG_CONF" ]; then
        config_file="$NGINX_CONFIG_CONF"
        print_status "OK" "站点配置文件存在: $config_file"
    else
        print_status "ERROR" "站点配置文件不存在"
        echo "💡 运行以下命令创建配置: sudo bash scripts/setup-nginx.sh"
        return 1
    fi
    
    # 检查配置文件内容
    if [ -n "$config_file" ]; then
        if grep -q "listen 9000" "$config_file"; then
            print_status "OK" "配置文件包含端口9000监听"
        else
            print_status "ERROR" "配置文件未配置端口9000监听"
        fi
        
        if grep -q "$DEPLOY_PATH" "$config_file"; then
            print_status "OK" "配置文件包含正确的root路径"
        else
            print_status "WARNING" "配置文件root路径可能不正确"
        fi
    fi
}

# 检查端口监听
check_port_listening() {
    echo -e "\n${BLUE}4. 检查端口监听状态${NC}"
    echo "----------------------------------------"
    
    local port_info=""
    if command -v ss >/dev/null 2>&1; then
        port_info=$(sudo ss -tlnp | grep :9000 || echo "")
    elif command -v netstat >/dev/null 2>&1; then
        port_info=$(sudo netstat -tlnp | grep :9000 || echo "")
    else
        print_status "WARNING" "无法检查端口监听状态 (ss和netstat命令都不可用)"
        return 1
    fi
    
    if [ -n "$port_info" ]; then
        print_status "OK" "端口9000正在监听"
        print_status "INFO" "监听详情: $port_info"
    else
        print_status "ERROR" "端口9000未在监听"
        echo "💡 检查nginx配置和服务状态"
        return 1
    fi
}

# 检查部署文件
check_deployment_files() {
    echo -e "\n${BLUE}5. 检查部署文件${NC}"
    echo "----------------------------------------"
    
    # 检查部署目录
    if [ -d "$DEPLOY_PATH" ]; then
        print_status "OK" "部署目录存在: $DEPLOY_PATH"
        
        # 检查目录权限
        local dir_perms=$(stat -c "%a" "$DEPLOY_PATH" 2>/dev/null || echo "unknown")
        print_status "INFO" "目录权限: $dir_perms"
        
        # 检查index.html
        if [ -f "$DEPLOY_PATH/index.html" ]; then
            local file_size=$(ls -lh "$DEPLOY_PATH/index.html" | awk '{print $5}')
            print_status "OK" "index.html文件存在 (大小: $file_size)"
            
            # 检查文件内容
            if grep -q "<html" "$DEPLOY_PATH/index.html" 2>/dev/null; then
                print_status "OK" "index.html包含HTML内容"
            else
                print_status "WARNING" "index.html可能不是有效的HTML文件"
            fi
        else
            print_status "ERROR" "index.html文件不存在"
            echo "💡 请确保React应用已正确构建并部署到 $DEPLOY_PATH"
            return 1
        fi
        
        # 检查静态资源
        if [ -d "$DEPLOY_PATH/assets" ] || [ -d "$DEPLOY_PATH/static" ]; then
            print_status "OK" "静态资源目录存在"
        else
            print_status "WARNING" "未发现静态资源目录 (assets/ 或 static/)"
        fi
        
        # 列出部署目录内容
        print_status "INFO" "部署目录内容:"
        ls -la "$DEPLOY_PATH" | head -10
        
    else
        print_status "ERROR" "部署目录不存在: $DEPLOY_PATH"
        echo "💡 运行以下命令创建: sudo mkdir -p $DEPLOY_PATH && sudo chmod 755 $DEPLOY_PATH"
        return 1
    fi
}

# 检查日志文件
check_logs() {
    echo -e "\n${BLUE}6. 检查日志文件${NC}"
    echo "----------------------------------------"
    
    # 检查访问日志
    local access_log="/var/log/nginx/mendian-test-access.log"
    if [ -f "$access_log" ]; then
        local log_lines=$(wc -l < "$access_log")
        print_status "OK" "访问日志存在 ($log_lines 行)"
        
        if [ "$log_lines" -gt 0 ]; then
            print_status "INFO" "最近的访问记录:"
            tail -3 "$access_log" | sed 's/^/    /'
        fi
    else
        print_status "WARNING" "访问日志文件不存在: $access_log"
    fi
    
    # 检查错误日志
    local error_log="/var/log/nginx/mendian-test-error.log"
    if [ -f "$error_log" ]; then
        local error_lines=$(wc -l < "$error_log")
        if [ "$error_lines" -gt 0 ]; then
            print_status "WARNING" "发现 $error_lines 行错误日志"
            print_status "INFO" "最近的错误记录:"
            tail -5 "$error_log" | sed 's/^/    /'
        else
            print_status "OK" "错误日志存在但为空 (无错误)"
        fi
    else
        print_status "WARNING" "错误日志文件不存在: $error_log"
    fi
}

# HTTP连接测试
check_http_connectivity() {
    echo -e "\n${BLUE}7. HTTP连接测试${NC}"
    echo "----------------------------------------"
    
    # 本地连接测试
    echo "测试本地连接..."
    if curl -f -s --max-time 10 "$LOCAL_URL" >/dev/null; then
        print_status "OK" "本地HTTP连接正常 ($LOCAL_URL)"
        
        # 获取HTTP状态码和响应大小
        local http_status=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 "$LOCAL_URL")
        local response_size=$(curl -s --max-time 10 "$LOCAL_URL" | wc -c)
        print_status "INFO" "HTTP状态码: $http_status"
        print_status "INFO" "响应大小: $response_size 字节"
        
    else
        print_status "ERROR" "本地HTTP连接失败 ($LOCAL_URL)"
        echo "💡 检查nginx配置和服务状态"
    fi
    
    # 外部连接测试（如果不是在服务器上运行）
    if [ "$LOCAL_URL" != "$SITE_URL" ]; then
        echo -e "\n测试外部连接..."
        if curl -f -s --max-time 10 "$SITE_URL" >/dev/null; then
            print_status "OK" "外部HTTP连接正常 ($SITE_URL)"
        else
            print_status "ERROR" "外部HTTP连接失败 ($SITE_URL)"
            echo "💡 检查防火墙设置和网络配置"
        fi
    fi
}

# 系统信息
show_system_info() {
    echo -e "\n${BLUE}8. 系统信息${NC}"
    echo "----------------------------------------"
    
    # 操作系统信息
    if [ -f /etc/os-release ]; then
        local os_name=$(grep "^NAME=" /etc/os-release | cut -d'=' -f2 | tr -d '"')
        local os_version=$(grep "^VERSION=" /etc/os-release | cut -d'=' -f2 | tr -d '"')
        print_status "INFO" "操作系统: $os_name $os_version"
    else
        print_status "INFO" "操作系统: $(uname -s) $(uname -r)"
    fi
    
    # 内存使用情况
    if command -v free >/dev/null 2>&1; then
        local memory_usage=$(free -h | grep "^Mem:" | awk '{print $3 "/" $2}')
        print_status "INFO" "内存使用: $memory_usage"
    fi
    
    # 磁盘使用情况
    if command -v df >/dev/null 2>&1; then
        local disk_usage=$(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')
        print_status "INFO" "磁盘使用: $disk_usage"
    fi
    
    # 系统负载
    if [ -f /proc/loadavg ]; then
        local load_avg=$(cat /proc/loadavg | awk '{print $1 " " $2 " " $3}')
        print_status "INFO" "系统负载: $load_avg"
    fi
}

# 总结报告
show_summary() {
    echo -e "\n${BLUE}📋 检查总结${NC}"
    echo "============================================"
    
    local total_checks=7
    local passed_checks=$((total_checks - failed_checks))
    
    if [ $failed_checks -eq 0 ]; then
        print_status "OK" "所有检查通过 ($passed_checks/$total_checks)"
        echo -e "\n🎉 部署状态良好！网站应该可以正常访问。"
        echo "🌐 访问地址: $SITE_URL"
    else
        print_status "ERROR" "发现 $failed_checks 个问题 ($passed_checks/$total_checks 通过)"
        echo -e "\n⚠️ 请根据上述检查结果修复问题。"
        echo "💡 常用修复命令:"
        echo "   • 自动配置: sudo bash scripts/setup-nginx.sh"
        echo "   • 重启nginx: sudo systemctl restart nginx"
        echo "   • 查看详细错误: sudo tail -20 /var/log/nginx/mendian-test-error.log"
    fi
    
    echo -e "\n📚 更多帮助信息请参考: docs/nginx-troubleshooting.md"
}

# 主执行流程
main() {
    local failed_checks=0
    
    check_nginx_installation || ((failed_checks++))
    check_nginx_service || ((failed_checks++))
    check_nginx_config || ((failed_checks++))
    check_port_listening || ((failed_checks++))
    check_deployment_files || ((failed_checks++))
    check_logs || ((failed_checks++))
    check_http_connectivity || ((failed_checks++))
    show_system_info
    
    show_summary
    
    return $failed_checks
}

# 显示使用说明
show_usage() {
    echo "好饭碗门店管理系统 - 部署状态检查脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -v, --verbose  显示详细输出"
    echo ""
    echo "此脚本会检查以下项目:"
    echo "  1. Nginx 安装状态"
    echo "  2. Nginx 服务状态"
    echo "  3. Nginx 配置文件"
    echo "  4. 端口监听状态"
    echo "  5. 部署文件状态"
    echo "  6. 日志文件状态"
    echo "  7. HTTP连接测试"
    echo "  8. 系统信息"
    echo ""
    exit 0
}

# 检查命令行参数
case "$1" in
    -h|--help)
        show_usage
        ;;
    -v|--verbose)
        set -x
        main
        ;;
    "")
        main
        ;;
    *)
        echo "未知参数: $1"
        echo "使用 $0 --help 查看使用说明"
        exit 1
        ;;
esac