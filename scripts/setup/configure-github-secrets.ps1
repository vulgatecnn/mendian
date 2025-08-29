# GitHub Secrets 配置脚本 (PowerShell)
# 好饭碗门店生命周期管理系统 - GitHub 仓库密钥配置

param(
    [Parameter(Mandatory=$false)]
    [switch]$NonInteractive,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# ============================================================================
# 配置和常量
# ============================================================================

$ScriptName = "GitHub Secrets Configuration Script"
$ScriptVersion = "1.0.0"
$RepoOwner = "vulgatecnn"
$RepoName = "mendian"
$RepoUrl = "https://github.com/$RepoOwner/$RepoName"

# ============================================================================
# 工具函数
# ============================================================================

function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Info {
    param([string]$Message)
    Write-ColorLog "ℹ️  $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorLog "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorLog "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorLog "❌ $Message" "Red"
}

function Show-Help {
    @"
$ScriptName v$ScriptVersion

使用方法:
  .\configure-github-secrets.ps1 [参数]

参数:
  -NonInteractive    非交互模式（使用默认值）
  -Help             显示此帮助信息

示例:
  .\configure-github-secrets.ps1
  .\configure-github-secrets.ps1 -NonInteractive

说明:
  此脚本将帮助您配置 GitHub 仓库的必要 Secrets，包括：
  - 数据库连接配置
  - JWT 和会话密钥
  - 企业微信集成配置
  - Docker 镜像仓库配置
  - 邮件服务配置（可选）

前提条件:
  - 安装 GitHub CLI (gh)
  - 登录 GitHub 账户 (gh auth login)
  - 具有仓库管理权限

"@
}

function Test-GitHubCLI {
    try {
        $null = Get-Command gh -ErrorAction Stop
        Write-Success "GitHub CLI 已安装"
    }
    catch {
        Write-Error "GitHub CLI (gh) 未安装"
        Write-Info "请访问 https://cli.github.com/ 下载安装"
        Write-Info "或使用包管理器安装:"
        Write-Info "  - Chocolatey: choco install gh"
        Write-Info "  - Scoop: scoop install gh"
        exit 1
    }
    
    try {
        & gh auth status 2>$null
        Write-Success "GitHub CLI 已登录"
    }
    catch {
        Write-Error "请先登录 GitHub CLI"
        Write-Info "执行: gh auth login"
        exit 1
    }
}

function Generate-SecureKey {
    param(
        [int]$Length = 64
    )
    
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    [Convert]::ToBase64String($bytes) -replace '[+/=]', '' | ForEach-Object { $_.Substring(0, [Math]::Min($_.Length, $Length)) }
}

function Test-SecretExists {
    param([string]$SecretName)
    
    try {
        $secrets = & gh secret list --repo "$RepoOwner/$RepoName" 2>$null
        return $secrets -match "^$SecretName\s"
    }
    catch {
        return $false
    }
}

function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue,
        [string]$Description,
        [bool]$Force = $false
    )
    
    Write-Info "设置密钥: $SecretName"
    
    if ((Test-SecretExists $SecretName) -and -not $Force -and -not $NonInteractive) {
        $response = Read-Host "密钥 $SecretName 已存在，是否覆盖? (y/N)"
        if ($response -notmatch '^[Yy]$') {
            Write-Warning "跳过 $SecretName"
            return
        }
    }
    
    try {
        $SecretValue | & gh secret set $SecretName --repo "$RepoOwner/$RepoName"
        Write-Success "$SecretName 设置完成"
        Write-Info "描述: $Description"
    }
    catch {
        Write-Error "设置 $SecretName 失败: $($_.Exception.Message)"
    }
    
    Write-Host ""
}

function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$DefaultValue = "",
        [bool]$IsSecret = $false
    )
    
    if ($NonInteractive) {
        return $DefaultValue
    }
    
    if ($DefaultValue) {
        $fullPrompt = "$Prompt (默认: $DefaultValue)"
    } else {
        $fullPrompt = $Prompt
    }
    
    if ($IsSecret) {
        $input = Read-Host $fullPrompt -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($input)
        $result = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    } else {
        $result = Read-Host $fullPrompt
    }
    
    if ([string]::IsNullOrEmpty($result)) {
        return $DefaultValue
    }
    
    return $result
}

function Configure-BasicSecrets {
    Write-Info "=== 基础配置 ==="
    
    # NODE_ENV
    Set-GitHubSecret "NODE_ENV" "production" "Node.js 运行环境"
    
    # JWT Secret
    $jwtSecret = Generate-SecureKey 64
    Set-GitHubSecret "JWT_SECRET" $jwtSecret "JWT 令牌签名密钥"
    
    # Session Secret
    $sessionSecret = Generate-SecureKey 32
    Set-GitHubSecret "SESSION_SECRET" $sessionSecret "会话加密密钥"
    
    # BCRYPT Rounds
    Set-GitHubSecret "BCRYPT_ROUNDS" "12" "密码加密轮数"
}

function Configure-DatabaseSecrets {
    Write-Info "=== 数据库配置 ==="
    
    $dbPassword = Get-UserInput "请输入数据库密码" "mendian2024!@#" $true
    $databaseUrl = "postgresql://mendian_user:$dbPassword@localhost:5432/mendian"
    
    Set-GitHubSecret "DATABASE_URL" $databaseUrl "数据库连接 URL"
    Set-GitHubSecret "POSTGRES_PASSWORD" $dbPassword "PostgreSQL 数据库密码"
    Set-GitHubSecret "POSTGRES_USER" "mendian_user" "PostgreSQL 用户名"
    Set-GitHubSecret "POSTGRES_DB" "mendian" "PostgreSQL 数据库名"
}

function Configure-RedisSecrets {
    Write-Info "=== Redis 配置 ==="
    
    Set-GitHubSecret "REDIS_URL" "redis://localhost:6379" "Redis 连接 URL"
    Set-GitHubSecret "REDIS_PREFIX" "mendian:" "Redis 键前缀"
}

function Configure-WeChatSecrets {
    Write-Info "=== 企业微信配置 ==="
    
    $corpId = Get-UserInput "请输入企业微信 Corp ID (可选)"
    if (-not [string]::IsNullOrEmpty($corpId)) {
        Set-GitHubSecret "WECHAT_WORK_CORP_ID" $corpId "企业微信企业 ID"
        
        $agentId = Get-UserInput "请输入企业微信 Agent ID"
        Set-GitHubSecret "WECHAT_WORK_AGENT_ID" $agentId "企业微信应用 ID"
        
        $secret = Get-UserInput "请输入企业微信 Secret" "" $true
        Set-GitHubSecret "WECHAT_WORK_SECRET" $secret "企业微信应用密钥"
        
        $token = Get-UserInput "请输入回调 Token (可选)"
        if (-not [string]::IsNullOrEmpty($token)) {
            Set-GitHubSecret "WECHAT_WORK_TOKEN" $token "企业微信回调 Token"
        }
        
        $aesKey = Get-UserInput "请输入编码 AES Key (可选)"
        if (-not [string]::IsNullOrEmpty($aesKey)) {
            Set-GitHubSecret "WECHAT_WORK_ENCODING_AES_KEY" $aesKey "企业微信编码 AES Key"
        }
        
        $redirectUri = Get-UserInput "请输入重定向 URI" "https://your-domain.com/auth/wechat/callback"
        Set-GitHubSecret "WECHAT_WORK_REDIRECT_URI" $redirectUri "企业微信 OAuth 重定向 URI"
    }
}

function Configure-DockerSecrets {
    Write-Info "=== Docker 配置 ==="
    
    Set-GitHubSecret "DOCKER_REGISTRY" "ghcr.io" "Docker 镜像仓库"
    Set-GitHubSecret "DOCKER_USERNAME" $RepoOwner "Docker 用户名"
    
    Write-Info "Docker Registry Token 将使用 GitHub Token (自动设置)"
}

function Configure-EmailSecrets {
    Write-Info "=== 邮件配置 (可选) ==="
    
    if ($NonInteractive) {
        Write-Info "非交互模式，跳过邮件配置"
        return
    }
    
    $configureEmail = Get-UserInput "是否配置邮件服务? (y/N)" "N"
    if ($configureEmail -match '^[Yy]$') {
        $smtpHost = Get-UserInput "SMTP 服务器"
        Set-GitHubSecret "SMTP_HOST" $smtpHost "SMTP 服务器地址"
        
        $smtpPort = Get-UserInput "SMTP 端口" "587"
        Set-GitHubSecret "SMTP_PORT" $smtpPort "SMTP 服务器端口"
        
        $smtpUser = Get-UserInput "SMTP 用户名"
        Set-GitHubSecret "SMTP_USER" $smtpUser "SMTP 用户名"
        
        $smtpPassword = Get-UserInput "SMTP 密码" "" $true
        Set-GitHubSecret "SMTP_PASSWORD" $smtpPassword "SMTP 密码"
        
        $fromName = Get-UserInput "发件人名称" "好饭碗门店管理系统"
        Set-GitHubSecret "SMTP_FROM_NAME" $fromName "邮件发件人名称"
        
        $fromEmail = Get-UserInput "发件人邮箱" "noreply@your-domain.com"
        Set-GitHubSecret "SMTP_FROM_EMAIL" $fromEmail "邮件发件人地址"
    }
}

function Configure-SecuritySecrets {
    Write-Info "=== 安全配置 ==="
    
    Set-GitHubSecret "CORS_ORIGIN" "http://localhost:7800,http://localhost:7000" "CORS 允许来源"
    Set-GitHubSecret "CORS_CREDENTIALS" "true" "CORS 允许凭据"
    
    Set-GitHubSecret "RATE_LIMIT_WINDOW" "900000" "速率限制时间窗口 (15分钟)"
    Set-GitHubSecret "RATE_LIMIT_MAX" "100" "速率限制最大请求数"
    
    Set-GitHubSecret "SESSION_MAX_AGE" "86400000" "会话最大有效期 (24小时)"
}

function Configure-AppSecrets {
    Write-Info "=== 应用配置 ==="
    
    Set-GitHubSecret "FRONTEND_PORT" "7800" "前端服务端口"
    Set-GitHubSecret "BACKEND_PORT" "7900" "后端服务端口"
    
    Set-GitHubSecret "LOG_LEVEL" "info" "日志级别"
    Set-GitHubSecret "LOG_FORMAT" "combined" "日志格式"
    
    Set-GitHubSecret "TZ" "Asia/Shanghai" "时区设置"
    Set-GitHubSecret "DEFAULT_LOCALE" "zh-CN" "默认语言"
}

function Show-CompletionInfo {
    Write-Host ""
    Write-Success "========================================"
    Write-Success "  🎉 GitHub Secrets 配置完成!"
    Write-Success "========================================"
    Write-Host ""
    Write-Info "仓库地址: $RepoUrl"
    Write-Info "Secrets 管理: $RepoUrl/settings/secrets/actions"
    Write-Info "Actions 状态: $RepoUrl/actions"
    Write-Host ""
    Write-Warning "下一步操作:"
    Write-Host "1. 检查 GitHub Actions 运行状态"
    Write-Host "2. 本地测试开发环境"
    Write-Host "3. 配置生产环境部署"
    Write-Host ""
    Write-Info "本地开发启动:"
    Write-Host "npm run dev"
    Write-Host ""
    Write-Info "Docker 环境启动:"
    Write-Host "docker-compose -f docker-compose.dev.yml up"
    Write-Host ""
}

# ============================================================================
# 主函数
# ============================================================================

function Main {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    Write-Info "$ScriptName v$ScriptVersion"
    Write-Info "仓库: $RepoUrl"
    Write-Host ""
    
    if (-not $NonInteractive) {
        Write-Warning "开始配置 GitHub Secrets..."
        Write-Warning "这将为您的仓库设置必要的环境变量和密钥"
        Write-Host ""
        $confirm = Read-Host "继续? (y/N)"
        
        if ($confirm -notmatch '^[Yy]$') {
            Write-Warning "配置已取消"
            exit 0
        }
    }
    
    # 检查依赖
    Test-GitHubCLI
    
    # 配置各类密钥
    Configure-BasicSecrets
    Configure-DatabaseSecrets
    Configure-RedisSecrets
    Configure-WeChatSecrets
    Configure-DockerSecrets
    Configure-SecuritySecrets
    Configure-AppSecrets
    Configure-EmailSecrets
    
    # 显示完成信息
    Show-CompletionInfo
}

# 错误处理
$ErrorActionPreference = "Stop"

try {
    Main
}
catch {
    Write-Error "配置过程中发生错误: $($_.Exception.Message)"
    exit 1
}