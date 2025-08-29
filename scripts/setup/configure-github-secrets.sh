#!/bin/bash

# GitHub Secrets 配置脚本
# 好饭碗门店生命周期管理系统 - GitHub 仓库密钥配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 仓库信息
REPO_OWNER="vulgatecnn"
REPO_NAME="mendian"
REPO_URL="https://github.com/$REPO_OWNER/$REPO_NAME"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GitHub Secrets 配置脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}仓库: $REPO_URL${NC}"
echo ""

# 检查 GitHub CLI 是否安装
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) 未安装${NC}"
    echo -e "${YELLOW}请先安装 GitHub CLI: https://cli.github.com/${NC}"
    echo ""
    echo "安装方法："
    echo "# macOS"
    echo "brew install gh"
    echo ""
    echo "# Windows (Chocolatey)"
    echo "choco install gh"
    echo ""
    echo "# Ubuntu/Debian"
    echo "sudo apt install gh"
    exit 1
fi

# 检查是否已登录
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  请先登录 GitHub CLI${NC}"
    echo "执行: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI 已就绪${NC}"
echo ""

# 生成安全的密钥
generate_jwt_secret() {
    openssl rand -base64 48 | tr -d "=+/" | cut -c1-64
}

generate_session_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# 检查密钥是否存在
check_secret_exists() {
    local secret_name=$1
    gh secret list --repo "$REPO_OWNER/$REPO_NAME" | grep -q "$secret_name" 2>/dev/null
}

# 设置密钥
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo -e "${BLUE}设置密钥: $secret_name${NC}"
    if check_secret_exists "$secret_name"; then
        echo -e "${YELLOW}  密钥已存在，是否覆盖? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}  跳过 $secret_name${NC}"
            return
        fi
    fi
    
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO_OWNER/$REPO_NAME"
    echo -e "${GREEN}  ✅ $secret_name 设置完成${NC}"
    echo -e "${YELLOW}  描述: $description${NC}"
    echo ""
}

# 交互式密钥配置
configure_secrets() {
    echo -e "${BLUE}开始配置 GitHub Secrets...${NC}"
    echo ""
    
    # 基础配置
    echo -e "${BLUE}=== 基础配置 ===${NC}"
    
    # NODE_ENV
    set_secret "NODE_ENV" "production" "Node.js 运行环境"
    
    # JWT Secret (自动生成)
    JWT_SECRET=$(generate_jwt_secret)
    set_secret "JWT_SECRET" "$JWT_SECRET" "JWT 令牌签名密钥"
    
    # Session Secret (自动生成)
    SESSION_SECRET=$(generate_session_secret)
    set_secret "SESSION_SECRET" "$SESSION_SECRET" "会话加密密钥"
    
    # 数据库配置
    echo -e "${BLUE}=== 数据库配置 ===${NC}"
    
    echo -e "${YELLOW}请输入数据库密码 (或按回车使用默认值):${NC}"
    read -r -s db_password
    db_password=${db_password:-"mendian2024!@#"}
    
    DATABASE_URL="postgresql://mendian_user:$db_password@localhost:5432/mendian"
    set_secret "DATABASE_URL" "$DATABASE_URL" "数据库连接 URL"
    set_secret "POSTGRES_PASSWORD" "$db_password" "PostgreSQL 数据库密码"
    
    # Redis 配置
    echo -e "${BLUE}=== Redis 配置 ===${NC}"
    set_secret "REDIS_URL" "redis://localhost:6379" "Redis 连接 URL"
    
    # 企业微信配置
    echo -e "${BLUE}=== 企业微信配置 ===${NC}"
    echo -e "${YELLOW}请输入企业微信 Corp ID (或按回车跳过):${NC}"
    read -r wechat_corp_id
    if [[ -n "$wechat_corp_id" ]]; then
        set_secret "WECHAT_WORK_CORP_ID" "$wechat_corp_id" "企业微信企业 ID"
        
        echo -e "${YELLOW}请输入企业微信 Agent ID:${NC}"
        read -r wechat_agent_id
        set_secret "WECHAT_WORK_AGENT_ID" "$wechat_agent_id" "企业微信应用 ID"
        
        echo -e "${YELLOW}请输入企业微信 Secret:${NC}"
        read -r -s wechat_secret
        set_secret "WECHAT_WORK_SECRET" "$wechat_secret" "企业微信应用密钥"
        
        echo -e "${YELLOW}请输入回调 Token (可选):${NC}"
        read -r wechat_token
        if [[ -n "$wechat_token" ]]; then
            set_secret "WECHAT_WORK_TOKEN" "$wechat_token" "企业微信回调 Token"
        fi
        
        echo -e "${YELLOW}请输入编码 AES Key (可选):${NC}"
        read -r wechat_aes_key
        if [[ -n "$wechat_aes_key" ]]; then
            set_secret "WECHAT_WORK_ENCODING_AES_KEY" "$wechat_aes_key" "企业微信编码 AES Key"
        fi
    fi
    
    # Docker 配置
    echo -e "${BLUE}=== Docker 配置 ===${NC}"
    set_secret "DOCKER_REGISTRY" "ghcr.io" "Docker 镜像仓库"
    set_secret "DOCKER_USERNAME" "$REPO_OWNER" "Docker 用户名"
    
    echo -e "${YELLOW}Docker Registry Token 将使用 GitHub Token${NC}"
    
    # 邮件配置 (可选)
    echo -e "${BLUE}=== 邮件配置 (可选) ===${NC}"
    echo -e "${YELLOW}是否配置邮件服务? (y/N):${NC}"
    read -r configure_email
    if [[ "$configure_email" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}SMTP 服务器:${NC}"
        read -r smtp_host
        set_secret "SMTP_HOST" "$smtp_host" "SMTP 服务器地址"
        
        echo -e "${YELLOW}SMTP 端口 (默认 587):${NC}"
        read -r smtp_port
        smtp_port=${smtp_port:-"587"}
        set_secret "SMTP_PORT" "$smtp_port" "SMTP 服务器端口"
        
        echo -e "${YELLOW}SMTP 用户名:${NC}"
        read -r smtp_user
        set_secret "SMTP_USER" "$smtp_user" "SMTP 用户名"
        
        echo -e "${YELLOW}SMTP 密码:${NC}"
        read -r -s smtp_password
        set_secret "SMTP_PASSWORD" "$smtp_password" "SMTP 密码"
    fi
}

# 显示配置完成信息
show_completion_info() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  🎉 GitHub Secrets 配置完成!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}仓库地址:${NC} $REPO_URL"
    echo -e "${BLUE}Secrets 管理:${NC} $REPO_URL/settings/secrets/actions"
    echo -e "${BLUE}Actions 状态:${NC} $REPO_URL/actions"
    echo ""
    echo -e "${YELLOW}下一步操作:${NC}"
    echo "1. 检查 GitHub Actions 运行状态"
    echo "2. 本地测试开发环境"
    echo "3. 配置生产环境部署"
    echo ""
    echo -e "${BLUE}本地开发启动:${NC}"
    echo "npm run dev"
    echo ""
    echo -e "${BLUE}Docker 环境启动:${NC}"
    echo "docker-compose -f docker-compose.dev.yml up"
}

# 主执行流程
main() {
    echo -e "${YELLOW}开始配置 GitHub Secrets...${NC}"
    echo -e "${YELLOW}这将为您的仓库设置必要的环境变量和密钥${NC}"
    echo ""
    echo -e "${YELLOW}继续? (y/N):${NC}"
    read -r confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}配置已取消${NC}"
        exit 0
    fi
    
    configure_secrets
    show_completion_info
}

# 错误处理
trap 'echo -e "\n${RED}❌ 配置过程中发生错误${NC}"; exit 1' ERR

# 执行主函数
main "$@"