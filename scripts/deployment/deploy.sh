#!/bin/bash

# 好饭碗门店生命周期管理系统 - 自动化部署脚本
# 支持多环境部署：开发、测试、预生产、生产

set -e

# ============================================================================
# 配置和常量
# ============================================================================

# 脚本信息
SCRIPT_NAME="Mendian Deployment Script"
SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 环境配置
ENVIRONMENTS=("development" "staging" "production")
DEPLOY_METHODS=("docker" "kubernetes" "aws" "local")

# 默认配置
DEFAULT_ENVIRONMENT="staging"
DEFAULT_METHOD="docker"
DEFAULT_TAG="latest"

# ============================================================================
# 工具函数
# ============================================================================

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_info() {
    log "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    log "${GREEN}✅ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    log "${RED}❌ $1${NC}"
}

log_step() {
    log "${PURPLE}🚀 $1${NC}"
}

show_help() {
    cat << EOF
${SCRIPT_NAME} v${SCRIPT_VERSION}

使用方法:
  $0 [选项]

选项:
  -e, --environment ENV    部署环境 (development|staging|production) [默认: ${DEFAULT_ENVIRONMENT}]
  -m, --method METHOD      部署方式 (docker|kubernetes|aws|local) [默认: ${DEFAULT_METHOD}]
  -t, --tag TAG           Docker 镜像标签 [默认: ${DEFAULT_TAG}]
  -b, --build             强制重新构建镜像
  -c, --cleanup           部署前清理旧资源
  -d, --dry-run           模拟运行，不执行实际部署
  -v, --verbose           详细输出
  -h, --help              显示此帮助信息

示例:
  $0 -e staging -m docker                   # 部署到 staging 环境使用 Docker
  $0 -e production -m kubernetes -t v1.2.3  # 部署到 production 环境使用 Kubernetes
  $0 --dry-run --verbose                    # 模拟运行并显示详细信息

环境变量:
  DOCKER_REGISTRY         Docker 镜像仓库地址
  KUBECONFIG             Kubernetes 配置文件路径
  AWS_PROFILE            AWS 配置文件名称

EOF
}

# 检查必需的命令
check_dependencies() {
    local deps=("docker" "curl" "jq")
    local missing=()

    for cmd in "${deps[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "缺少必需的命令: ${missing[*]}"
        log_info "请安装缺少的命令后重试"
        exit 1
    fi
}

# 验证环境参数
validate_environment() {
    local env="$1"
    for valid_env in "${ENVIRONMENTS[@]}"; do
        if [ "$env" = "$valid_env" ]; then
            return 0
        fi
    done
    log_error "无效的环境: $env"
    log_info "有效环境: ${ENVIRONMENTS[*]}"
    exit 1
}

# 验证部署方式
validate_method() {
    local method="$1"
    for valid_method in "${DEPLOY_METHODS[@]}"; do
        if [ "$method" = "$valid_method" ]; then
            return 0
        fi
    done
    log_error "无效的部署方式: $method"
    log_info "有效部署方式: ${DEPLOY_METHODS[*]}"
    exit 1
}

# ============================================================================
# 预检查函数
# ============================================================================

check_docker() {
    if ! docker info &> /dev/null; then
        log_error "Docker 未运行或无法访问"
        exit 1
    fi
    log_success "Docker 检查通过"
}

check_environment_file() {
    local env="$1"
    local env_file="$PROJECT_ROOT/.env.$env"
    
    if [ ! -f "$env_file" ]; then
        log_warning "环境文件不存在: $env_file"
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            log_info "请复制 .env.example 为 .env.$env 并配置相应环境变量"
        fi
    else
        log_success "环境文件检查通过: $env_file"
    fi
}

check_git_status() {
    if [ -d "$PROJECT_ROOT/.git" ]; then
        local git_status
        git_status=$(git -C "$PROJECT_ROOT" status --porcelain)
        if [ -n "$git_status" ]; then
            log_warning "工作目录有未提交的更改"
            if [ "$DRY_RUN" = "false" ]; then
                read -p "是否继续部署? (y/N): " -r
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    log_info "部署已取消"
                    exit 0
                fi
            fi
        fi
        
        local current_branch
        current_branch=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)
        local commit_hash
        commit_hash=$(git -C "$PROJECT_ROOT" rev-parse HEAD)
        
        log_info "当前分支: $current_branch"
        log_info "提交哈希: $commit_hash"
    fi
}

# ============================================================================
# 构建函数
# ============================================================================

build_images() {
    local env="$1"
    local tag="$2"
    local force_build="$3"
    
    log_step "构建 Docker 镜像..."
    
    # 设置构建参数
    local build_args=(
        "--build-arg" "NODE_ENV=$env"
        "--build-arg" "BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        "--build-arg" "VCS_REF=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo 'unknown')"
        "--build-arg" "VERSION=$tag"
    )
    
    # 构建前端镜像
    local frontend_image="mendian-frontend:$tag"
    if [ "$force_build" = "true" ] || ! docker images -q "$frontend_image" | grep -q .; then
        log_info "构建前端镜像: $frontend_image"
        if [ "$DRY_RUN" = "false" ]; then
            docker build "${build_args[@]}" \
                -t "$frontend_image" \
                -f "$PROJECT_ROOT/frontend/Dockerfile" \
                "$PROJECT_ROOT"
        fi
        log_success "前端镜像构建完成"
    else
        log_info "前端镜像已存在，跳过构建"
    fi
    
    # 如果有后端 Dockerfile，构建后端镜像
    if [ -f "$PROJECT_ROOT/backend/Dockerfile" ]; then
        local backend_image="mendian-backend:$tag"
        if [ "$force_build" = "true" ] || ! docker images -q "$backend_image" | grep -q .; then
            log_info "构建后端镜像: $backend_image"
            if [ "$DRY_RUN" = "false" ]; then
                docker build "${build_args[@]}" \
                    -t "$backend_image" \
                    -f "$PROJECT_ROOT/backend/Dockerfile" \
                    "$PROJECT_ROOT"
            fi
            log_success "后端镜像构建完成"
        else
            log_info "后端镜像已存在，跳过构建"
        fi
    fi
}

# ============================================================================
# 部署函数
# ============================================================================

deploy_docker() {
    local env="$1"
    local tag="$2"
    local cleanup="$3"
    
    log_step "使用 Docker Compose 部署到 $env 环境..."
    
    # 设置环境变量
    export BUILD_TARGET="production"
    export VCS_REF="$tag"
    export NODE_ENV="$env"
    
    # 停止和清理旧容器 (如果需要)
    if [ "$cleanup" = "true" ]; then
        log_info "清理旧的部署..."
        if [ "$DRY_RUN" = "false" ]; then
            docker-compose -f "$PROJECT_ROOT/docker-compose.yml" down --remove-orphans
        fi
    fi
    
    # 选择合适的 docker-compose 文件
    local compose_files=("-f" "$PROJECT_ROOT/docker-compose.yml")
    if [ -f "$PROJECT_ROOT/docker-compose.$env.yml" ]; then
        compose_files+=("-f" "$PROJECT_ROOT/docker-compose.$env.yml")
    fi
    
    # 部署服务
    log_info "启动服务..."
    if [ "$DRY_RUN" = "false" ]; then
        docker-compose "${compose_files[@]}" up -d --build
    else
        log_info "模拟执行: docker-compose ${compose_files[*]} up -d --build"
    fi
    
    log_success "Docker 部署完成"
}

deploy_kubernetes() {
    local env="$1"
    local tag="$2"
    
    log_step "使用 Kubernetes 部署到 $env 环境..."
    
    # 检查 kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl 命令未找到"
        exit 1
    fi
    
    # 检查 Kubernetes 连接
    if ! kubectl cluster-info &> /dev/null; then
        log_error "无法连接到 Kubernetes 集群"
        exit 1
    fi
    
    local k8s_dir="$PROJECT_ROOT/k8s"
    if [ ! -d "$k8s_dir" ]; then
        log_error "Kubernetes 配置目录不存在: $k8s_dir"
        exit 1
    fi
    
    # 设置命名空间
    local namespace="mendian-$env"
    
    log_info "创建或更新命名空间: $namespace"
    if [ "$DRY_RUN" = "false" ]; then
        kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
    fi
    
    # 应用配置
    local config_files=("$k8s_dir/base" "$k8s_dir/overlays/$env")
    for config_dir in "${config_files[@]}"; do
        if [ -d "$config_dir" ]; then
            log_info "应用配置: $config_dir"
            if [ "$DRY_RUN" = "false" ]; then
                kubectl apply -k "$config_dir" -n "$namespace"
            else
                log_info "模拟执行: kubectl apply -k $config_dir -n $namespace"
            fi
        fi
    done
    
    # 更新镜像标签
    log_info "更新镜像标签为: $tag"
    if [ "$DRY_RUN" = "false" ]; then
        kubectl set image deployment/mendian-frontend frontend="mendian-frontend:$tag" -n "$namespace"
        kubectl set image deployment/mendian-backend backend="mendian-backend:$tag" -n "$namespace"
        
        # 等待部署完成
        kubectl rollout status deployment/mendian-frontend -n "$namespace" --timeout=300s
        kubectl rollout status deployment/mendian-backend -n "$namespace" --timeout=300s
    fi
    
    log_success "Kubernetes 部署完成"
}

deploy_aws() {
    local env="$1"
    local tag="$2"
    
    log_step "使用 AWS 部署到 $env 环境..."
    
    # 检查 AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI 未找到"
        exit 1
    fi
    
    # 检查 AWS 配置
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS 凭证未配置或无效"
        exit 1
    fi
    
    # 推送镜像到 ECR (如果配置了)
    if [ -n "$ECR_REGISTRY" ]; then
        log_info "推送镜像到 ECR..."
        local frontend_image="$ECR_REGISTRY/mendian-frontend:$tag"
        local backend_image="$ECR_REGISTRY/mendian-backend:$tag"
        
        if [ "$DRY_RUN" = "false" ]; then
            # 登录 ECR
            aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
            
            # 标记并推送镜像
            docker tag "mendian-frontend:$tag" "$frontend_image"
            docker tag "mendian-backend:$tag" "$backend_image"
            docker push "$frontend_image"
            docker push "$backend_image"
        fi
    fi
    
    # 部署到 ECS (如果配置了)
    if [ -n "$ECS_CLUSTER" ] && [ -n "$ECS_SERVICE" ]; then
        log_info "更新 ECS 服务..."
        if [ "$DRY_RUN" = "false" ]; then
            aws ecs update-service --cluster "$ECS_CLUSTER" --service "$ECS_SERVICE" --force-new-deployment
        fi
    fi
    
    log_success "AWS 部署完成"
}

deploy_local() {
    local env="$1"
    local tag="$2"
    
    log_step "本地部署到 $env 环境..."
    
    # 构建前端
    log_info "构建前端应用..."
    if [ "$DRY_RUN" = "false" ]; then
        cd "$PROJECT_ROOT/frontend"
        npm install
        npm run build
    fi
    
    # 如果有后端，构建后端
    if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
        log_info "构建后端应用..."
        if [ "$DRY_RUN" = "false" ]; then
            cd "$PROJECT_ROOT/backend"
            npm install
            npm run build
        fi
    fi
    
    log_success "本地构建完成"
    log_info "请手动将构建产物部署到目标服务器"
}

# ============================================================================
# 健康检查函数
# ============================================================================

health_check() {
    local env="$1"
    local max_attempts=30
    local attempt=1
    
    log_step "执行健康检查..."
    
    # 确定健康检查 URL
    local health_url
    case "$env" in
        "development")
            health_url="http://localhost:7801/health"
            ;;
        "staging")
            health_url="http://localhost/health"
            ;;
        "production")
            health_url="https://mendian.example.com/health"
            ;;
        *)
            health_url="http://localhost/health"
            ;;
    esac
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "$health_url" > /dev/null 2>&1; then
            log_success "健康检查通过 ($health_url)"
            return 0
        fi
        
        log_info "健康检查失败，重试 $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done
    
    log_error "健康检查失败，服务可能未正常启动"
    return 1
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    # 解析命令行参数
    local environment="$DEFAULT_ENVIRONMENT"
    local method="$DEFAULT_METHOD"
    local tag="$DEFAULT_TAG"
    local force_build="false"
    local cleanup="false"
    DRY_RUN="false"
    local verbose="false"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                environment="$2"
                shift 2
                ;;
            -m|--method)
                method="$2"
                shift 2
                ;;
            -t|--tag)
                tag="$2"
                shift 2
                ;;
            -b|--build)
                force_build="true"
                shift
                ;;
            -c|--cleanup)
                cleanup="true"
                shift
                ;;
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            -v|--verbose)
                verbose="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 启用详细输出
    if [ "$verbose" = "true" ]; then
        set -x
    fi
    
    # 显示部署信息
    log_info "${SCRIPT_NAME} v${SCRIPT_VERSION}"
    log_info "环境: $environment"
    log_info "部署方式: $method"
    log_info "镜像标签: $tag"
    log_info "强制构建: $force_build"
    log_info "清理旧资源: $cleanup"
    log_info "模拟运行: $DRY_RUN"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "这是模拟运行，不会执行实际操作"
    fi
    
    echo "----------------------------------------"
    
    # 验证参数
    validate_environment "$environment"
    validate_method "$method"
    
    # 检查依赖
    check_dependencies
    
    # 预检查
    log_step "执行预检查..."
    check_docker
    check_environment_file "$environment"
    check_git_status
    
    # 构建镜像 (Docker 和 Kubernetes 部署需要)
    if [ "$method" = "docker" ] || [ "$method" = "kubernetes" ] || [ "$method" = "aws" ]; then
        build_images "$environment" "$tag" "$force_build"
    fi
    
    # 执行部署
    case "$method" in
        "docker")
            deploy_docker "$environment" "$tag" "$cleanup"
            ;;
        "kubernetes")
            deploy_kubernetes "$environment" "$tag"
            ;;
        "aws")
            deploy_aws "$environment" "$tag"
            ;;
        "local")
            deploy_local "$environment" "$tag"
            ;;
    esac
    
    # 健康检查 (非本地部署)
    if [ "$method" != "local" ] && [ "$DRY_RUN" = "false" ]; then
        if health_check "$environment"; then
            log_success "🎉 部署成功完成！"
        else
            log_warning "部署完成，但健康检查失败，请检查服务状态"
            exit 1
        fi
    else
        log_success "🎉 部署完成！"
    fi
    
    # 显示访问信息
    case "$environment" in
        "development")
            log_info "🌐 访问地址: http://localhost:7801"
            log_info "📊 管理面板: http://localhost:8081 (数据库), http://localhost:8082 (Redis)"
            ;;
        "staging")
            log_info "🌐 访问地址: http://localhost (或配置的域名)"
            ;;
        "production")
            log_info "🌐 访问地址: https://mendian.example.com (或配置的域名)"
            ;;
    esac
    
    log_info "📝 查看日志: docker-compose logs -f"
    log_info "🔧 停止服务: docker-compose down"
}

# 执行主函数
main "$@"