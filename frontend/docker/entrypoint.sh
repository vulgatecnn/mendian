#!/bin/sh
# 入口脚本 for 好饭碗门店管理系统

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 打印启动信息
print_startup_info() {
    log "${BLUE}=================================${NC}"
    log "${BLUE}好饭碗门店生命周期管理系统${NC}"
    log "${BLUE}Frontend Container Starting...${NC}"
    log "${BLUE}=================================${NC}"
    
    # 显示版本信息
    if [ -f "/usr/share/nginx/html/version.json" ]; then
        log "${GREEN}Version Info:${NC}"
        cat /usr/share/nginx/html/version.json | jq . 2>/dev/null || cat /usr/share/nginx/html/version.json
    fi
    
    # 显示环境信息
    log "${GREEN}Environment Info:${NC}"
    log "  Node ENV: ${NODE_ENV:-production}"
    log "  User: $(whoami)"
    log "  Working Dir: $(pwd)"
    log "  PID: $$"
}

# 环境变量验证
validate_environment() {
    log "${YELLOW}Validating environment...${NC}"
    
    # 检查必要的目录
    local required_dirs="/usr/share/nginx/html /var/log/nginx /var/run/nginx"
    for dir in $required_dirs; do
        if [ ! -d "$dir" ]; then
            log "${RED}❌ Required directory missing: $dir${NC}"
            exit 1
        fi
    done
    
    # 检查权限
    if [ ! -w "/var/log/nginx" ] || [ ! -w "/var/run/nginx" ]; then
        log "${RED}❌ Insufficient permissions for nginx directories${NC}"
        exit 1
    fi
    
    log "${GREEN}✅ Environment validation passed${NC}"
}

# 配置文件处理
setup_configuration() {
    log "${YELLOW}Setting up configuration...${NC}"
    
    # 验证 Nginx 配置
    if ! nginx -t > /dev/null 2>&1; then
        log "${RED}❌ Nginx configuration test failed${NC}"
        nginx -t
        exit 1
    fi
    
    # 动态配置替换 (如果有环境变量)
    if [ -n "${BACKEND_URL}" ]; then
        log "Setting backend URL to: ${BACKEND_URL}"
        sed -i "s|server backend:7900;|server ${BACKEND_URL};|g" /etc/nginx/conf.d/default.conf
    fi
    
    if [ -n "${API_PREFIX}" ]; then
        log "Setting API prefix to: ${API_PREFIX}"
        sed -i "s|location /api/|location ${API_PREFIX}/|g" /etc/nginx/conf.d/default.conf
    fi
    
    log "${GREEN}✅ Configuration setup completed${NC}"
}

# 静态文件检查
verify_static_files() {
    log "${YELLOW}Verifying static files...${NC}"
    
    local html_root="/usr/share/nginx/html"
    
    # 检查主要文件
    if [ ! -f "$html_root/index.html" ]; then
        log "${RED}❌ Main index.html file is missing${NC}"
        exit 1
    fi
    
    # 统计文件数量
    local file_count=$(find "$html_root" -type f | wc -l)
    local dir_size=$(du -sh "$html_root" 2>/dev/null | cut -f1)
    
    log "${GREEN}✅ Static files verified${NC}"
    log "  Files count: $file_count"
    log "  Total size: $dir_size"
    
    # 列出主要文件
    log "Main files:"
    ls -la "$html_root"/ | head -10 || true
}

# 日志目录设置
setup_logging() {
    log "${YELLOW}Setting up logging...${NC}"
    
    # 确保日志目录存在且有正确权限
    mkdir -p /var/log/nginx
    
    # 创建日志文件如果不存在
    touch /var/log/nginx/access.log /var/log/nginx/error.log
    
    # 设置权限
    chown nginx:nginx /var/log/nginx/access.log /var/log/nginx/error.log 2>/dev/null || true
    
    log "${GREEN}✅ Logging setup completed${NC}"
}

# 性能优化设置
optimize_performance() {
    log "${YELLOW}Applying performance optimizations...${NC}"
    
    # 设置工作进程数 (基于 CPU 核心数)
    local cpu_cores=$(nproc)
    sed -i "s/worker_processes auto;/worker_processes $cpu_cores;/" /etc/nginx/nginx.conf 2>/dev/null || true
    
    # 调整工作连接数 (基于可用内存)
    local mem_mb=$(free -m | awk 'NR==2{printf "%d", $2}')
    if [ "$mem_mb" -gt 1024 ]; then
        local worker_connections=$((mem_mb * 2))
        if [ "$worker_connections" -gt 4096 ]; then
            worker_connections=4096
        fi
        sed -i "s/worker_connections 1024;/worker_connections $worker_connections;/" /etc/nginx/nginx.conf 2>/dev/null || true
    fi
    
    log "${GREEN}✅ Performance optimizations applied${NC}"
    log "  CPU cores: $cpu_cores"
    log "  Memory: ${mem_mb}MB"
}

# 健康检查预热
warmup_health_check() {
    log "${YELLOW}Warming up health check...${NC}"
    
    # 启动 nginx 在后台
    nginx -g "daemon on;" 2>/dev/null || true
    
    # 等待 nginx 启动
    sleep 2
    
    # 预热健康检查
    local retry=0
    while [ $retry -lt 5 ]; do
        if curl -f -s --max-time 5 "http://localhost/health" > /dev/null 2>&1; then
            log "${GREEN}✅ Health check warmup successful${NC}"
            break
        fi
        retry=$((retry + 1))
        sleep 1
    done
    
    # 停止后台 nginx
    nginx -s quit 2>/dev/null || true
    sleep 1
}

# 信号处理
setup_signal_handlers() {
    log "${YELLOW}Setting up signal handlers...${NC}"
    
    # 优雅关闭处理
    trap 'log "Received SIGTERM, shutting down gracefully..."; nginx -s quit; exit 0' TERM
    trap 'log "Received SIGINT, shutting down..."; nginx -s quit; exit 0' INT
    trap 'log "Received SIGHUP, reloading configuration..."; nginx -s reload' HUP
    
    log "${GREEN}✅ Signal handlers setup completed${NC}"
}

# 安全检查
security_check() {
    log "${YELLOW}Performing security checks...${NC}"
    
    # 检查是否以 root 运行
    if [ "$(id -u)" = "0" ]; then
        log "${YELLOW}⚠️ Running as root user${NC}"
    fi
    
    # 检查敏感文件权限
    find /usr/share/nginx/html -name "*.env*" -o -name "*.key" -o -name "*.pem" 2>/dev/null | while read -r file; do
        if [ -f "$file" ]; then
            log "${YELLOW}⚠️ Sensitive file detected: $file${NC}"
        fi
    done
    
    log "${GREEN}✅ Security checks completed${NC}"
}

# 主启动函数
main() {
    print_startup_info
    validate_environment
    setup_configuration
    verify_static_files
    setup_logging
    optimize_performance
    setup_signal_handlers
    security_check
    
    # 可选的预热
    if [ "${WARMUP_ENABLED:-true}" = "true" ]; then
        warmup_health_check
    fi
    
    log "${GREEN}=================================${NC}"
    log "${GREEN}🚀 Starting Nginx...${NC}"
    log "${GREEN}Container is ready to serve traffic${NC}"
    log "${GREEN}=================================${NC}"
    
    # 执行传入的命令
    exec "$@"
}

# 错误处理
set -e
trap 'log "${RED}❌ Error occurred at line $LINENO${NC}"; exit 1' ERR

# 执行主函数
main "$@"