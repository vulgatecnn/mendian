#!/bin/sh
# 健康检查脚本 for 好饭碗门店管理系统

set -e

# 配置变量
HEALTH_CHECK_URL="http://localhost/health"
TIMEOUT=5
MAX_RETRIES=3

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 基础健康检查
basic_health_check() {
    log "执行基础健康检查..."
    
    # 检查 Nginx 进程
    if ! pgrep nginx > /dev/null; then
        log "${RED}❌ Nginx 进程未运行${NC}"
        return 1
    fi
    
    # 检查端口监听
    if ! netstat -ln | grep -q ':80.*LISTEN'; then
        log "${RED}❌ 端口 80 未监听${NC}"
        return 1
    fi
    
    log "${GREEN}✅ 基础检查通过${NC}"
    return 0
}

# HTTP 健康检查
http_health_check() {
    log "执行 HTTP 健康检查..."
    
    local retry=0
    while [ $retry -lt $MAX_RETRIES ]; do
        # 使用 curl 检查健康端点
        if curl -f -s --max-time $TIMEOUT "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "${GREEN}✅ HTTP 健康检查通过${NC}"
            return 0
        fi
        
        retry=$((retry + 1))
        log "${YELLOW}⚠️ HTTP 检查失败，重试 $retry/$MAX_RETRIES${NC}"
        
        if [ $retry -lt $MAX_RETRIES ]; then
            sleep 1
        fi
    done
    
    log "${RED}❌ HTTP 健康检查失败${NC}"
    return 1
}

# 静态资源检查
static_resource_check() {
    log "执行静态资源检查..."
    
    # 检查主要静态文件是否存在
    if [ ! -f "/usr/share/nginx/html/index.html" ]; then
        log "${RED}❌ 主页文件 index.html 不存在${NC}"
        return 1
    fi
    
    # 检查 assets 目录
    if [ ! -d "/usr/share/nginx/html/assets" ]; then
        log "${YELLOW}⚠️ assets 目录不存在${NC}"
    fi
    
    # 检查版本信息文件
    if [ -f "/usr/share/nginx/html/version.json" ]; then
        log "${GREEN}✅ 版本信息文件存在${NC}"
    else
        log "${YELLOW}⚠️ 版本信息文件不存在${NC}"
    fi
    
    log "${GREEN}✅ 静态资源检查通过${NC}"
    return 0
}

# 内存和磁盘检查
resource_check() {
    log "执行资源检查..."
    
    # 检查内存使用情况
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log "内存使用率: ${mem_usage}%"
    
    # 检查磁盘使用情况
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    log "磁盘使用率: ${disk_usage}%"
    
    # 警告阈值
    if [ "${mem_usage%.*}" -gt 90 ]; then
        log "${YELLOW}⚠️ 内存使用率过高: ${mem_usage}%${NC}"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        log "${YELLOW}⚠️ 磁盘使用率过高: ${disk_usage}%${NC}"
    fi
    
    return 0
}

# 配置文件检查
config_check() {
    log "执行配置文件检查..."
    
    # 检查 Nginx 配置语法
    if nginx -t > /dev/null 2>&1; then
        log "${GREEN}✅ Nginx 配置语法正确${NC}"
        return 0
    else
        log "${RED}❌ Nginx 配置语法错误${NC}"
        return 1
    fi
}

# 主健康检查函数
main() {
    log "开始健康检查..."
    
    # 执行所有检查
    if basic_health_check && \
       http_health_check && \
       static_resource_check && \
       config_check; then
        
        # 可选的资源检查（不影响健康状态）
        resource_check || true
        
        log "${GREEN}✅ 所有健康检查通过${NC}"
        exit 0
    else
        log "${RED}❌ 健康检查失败${NC}"
        exit 1
    fi
}

# 执行健康检查
main "$@"