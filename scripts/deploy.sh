#!/bin/bash

# 门店生命周期管理系统部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_requirements() {
    log_info "检查部署环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker build -t store-lifecycle-backend:latest ./backend
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -t store-lifecycle-frontend:latest ./frontend
    
    log_success "镜像构建完成"
}

# 部署到开发环境
deploy_development() {
    log_info "部署到开发环境..."
    
    # 停止现有服务
    docker-compose down
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 健康检查
    if curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
        log_success "后端服务启动成功"
    else
        log_error "后端服务启动失败"
        exit 1
    fi
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "前端服务启动成功"
    else
        log_error "前端服务启动失败"
        exit 1
    fi
    
    log_success "开发环境部署完成"
    log_info "前端地址: http://localhost:3000"
    log_info "后端地址: http://localhost:8000"
    log_info "API文档: http://localhost:8000/api/docs/"
}

# 部署到生产环境
deploy_production() {
    log_info "部署到生产环境..."
    
    # 检查环境变量
    if [[ -z "$DB_PASSWORD" || -z "$SECRET_KEY" ]]; then
        log_error "缺少必要的环境变量"
        exit 1
    fi
    
    # 备份数据库
    log_info "备份数据库..."
    docker-compose -f docker-compose.production.yml exec db pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql
    
    # 拉取最新镜像
    log_info "拉取最新镜像..."
    docker-compose -f docker-compose.production.yml pull
    
    # 滚动更新
    log_info "执行滚动更新..."
    docker-compose -f docker-compose.production.yml up -d --no-deps backend
    docker-compose -f docker-compose.production.yml up -d --no-deps frontend
    
    # 健康检查
    log_info "执行健康检查..."
    sleep 60
    
    if curl -f https://your-domain.com/api/health/ > /dev/null 2>&1; then
        log_success "生产环境部署成功"
    else
        log_error "生产环境部署失败，正在回滚..."
        # 这里添加回滚逻辑
        exit 1
    fi
}

# 回滚部署
rollback() {
    log_warning "执行回滚操作..."
    
    # 获取上一个版本的镜像标签
    PREVIOUS_TAG=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep store-lifecycle-backend | sed -n '2p' | cut -d':' -f2)
    
    if [[ -z "$PREVIOUS_TAG" ]]; then
        log_error "找不到上一个版本"
        exit 1
    fi
    
    log_info "回滚到版本: $PREVIOUS_TAG"
    
    # 更新镜像标签并重新部署
    export IMAGE_TAG=$PREVIOUS_TAG
    docker-compose -f docker-compose.production.yml up -d
    
    log_success "回滚完成"
}

# 清理资源
cleanup() {
    log_info "清理未使用的资源..."
    
    docker system prune -f
    docker volume prune -f
    
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "门店生命周期管理系统部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  dev         部署到开发环境"
    echo "  prod        部署到生产环境"
    echo "  build       构建 Docker 镜像"
    echo "  rollback    回滚到上一个版本"
    echo "  cleanup     清理未使用的资源"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 dev      # 部署到开发环境"
    echo "  $0 prod     # 部署到生产环境"
    echo "  $0 build    # 构建镜像"
}

# 主函数
main() {
    case "$1" in
        "dev")
            check_requirements
            build_images
            deploy_development
            ;;
        "prod")
            check_requirements
            deploy_production
            ;;
        "build")
            check_requirements
            build_images
            ;;
        "rollback")
            rollback
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"