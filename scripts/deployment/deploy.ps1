# 好饭碗门店生命周期管理系统 - Windows PowerShell 部署脚本
# 支持多环境部署：开发、测试、预生产、生产

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "staging",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("docker", "local")]
    [string]$Method = "docker",
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest",
    
    [Parameter(Mandatory=$false)]
    [switch]$Build,
    
    [Parameter(Mandatory=$false)]
    [switch]$Cleanup,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# ============================================================================
# 配置和常量
# ============================================================================

$ScriptName = "Mendian Deployment Script (PowerShell)"
$ScriptVersion = "1.0.0"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Join-Path $ScriptDir "../.."

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

function Write-Step {
    param([string]$Message)
    Write-ColorLog "🚀 $Message" "Magenta"
}

function Show-Help {
    @"
$ScriptName v$ScriptVersion

使用方法:
  .\deploy.ps1 [参数]

参数:
  -Environment <ENV>     部署环境 (development|staging|production) [默认: staging]
  -Method <METHOD>       部署方式 (docker|local) [默认: docker]
  -Tag <TAG>            Docker 镜像标签 [默认: latest]
  -Build                强制重新构建镜像
  -Cleanup              部署前清理旧资源
  -DryRun               模拟运行，不执行实际部署
  -Verbose              详细输出
  -Help                 显示此帮助信息

示例:
  .\deploy.ps1 -Environment staging -Method docker
  .\deploy.ps1 -Environment production -Tag v1.2.3
  .\deploy.ps1 -DryRun -Verbose

环境变量:
  DOCKER_REGISTRY       Docker 镜像仓库地址

"@
}

function Test-Dependencies {
    $dependencies = @("docker", "node", "npm")
    $missing = @()

    foreach ($cmd in $dependencies) {
        try {
            $null = Get-Command $cmd -ErrorAction Stop
        }
        catch {
            $missing += $cmd
        }
    }

    if ($missing.Count -gt 0) {
        Write-Error "缺少必需的命令: $($missing -join ', ')"
        Write-Info "请安装缺少的命令后重试"
        exit 1
    }
}

function Test-Docker {
    try {
        $null = docker info 2>$null
        Write-Success "Docker 检查通过"
    }
    catch {
        Write-Error "Docker 未运行或无法访问"
        exit 1
    }
}

function Test-EnvironmentFile {
    param([string]$Environment)
    
    $envFile = Join-Path $ProjectRoot ".env.$Environment"
    
    if (-not (Test-Path $envFile)) {
        Write-Warning "环境文件不存在: $envFile"
        $exampleFile = Join-Path $ProjectRoot ".env.example"
        if (Test-Path $exampleFile) {
            Write-Info "请复制 .env.example 为 .env.$Environment 并配置相应环境变量"
        }
    } else {
        Write-Success "环境文件检查通过: $envFile"
    }
}

function Test-GitStatus {
    if (Test-Path (Join-Path $ProjectRoot ".git")) {
        try {
            $gitStatus = git -C $ProjectRoot status --porcelain
            if ($gitStatus) {
                Write-Warning "工作目录有未提交的更改"
                if (-not $DryRun) {
                    $response = Read-Host "是否继续部署? (y/N)"
                    if ($response -notmatch '^[Yy]$') {
                        Write-Info "部署已取消"
                        exit 0
                    }
                }
            }
            
            $currentBranch = git -C $ProjectRoot rev-parse --abbrev-ref HEAD
            $commitHash = git -C $ProjectRoot rev-parse HEAD
            
            Write-Info "当前分支: $currentBranch"
            Write-Info "提交哈希: $commitHash"
        }
        catch {
            Write-Warning "无法获取 Git 状态"
        }
    }
}

function Build-Images {
    param(
        [string]$Environment,
        [string]$Tag,
        [bool]$ForceBuild
    )
    
    Write-Step "构建 Docker 镜像..."
    
    # 设置构建参数
    $buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $vcsRef = try { git -C $ProjectRoot rev-parse HEAD } catch { "unknown" }
    
    $buildArgs = @(
        "--build-arg", "NODE_ENV=$Environment",
        "--build-arg", "BUILD_DATE=$buildDate",
        "--build-arg", "VCS_REF=$vcsRef",
        "--build-arg", "VERSION=$Tag"
    )
    
    # 构建前端镜像
    $frontendImage = "mendian-frontend:$Tag"
    $imageExists = docker images -q $frontendImage
    
    if ($ForceBuild -or -not $imageExists) {
        Write-Info "构建前端镜像: $frontendImage"
        if (-not $DryRun) {
            $frontendDockerfile = Join-Path $ProjectRoot "frontend/Dockerfile"
            & docker build @buildArgs -t $frontendImage -f $frontendDockerfile $ProjectRoot
            if ($LASTEXITCODE -ne 0) {
                Write-Error "前端镜像构建失败"
                exit 1
            }
        }
        Write-Success "前端镜像构建完成"
    } else {
        Write-Info "前端镜像已存在，跳过构建"
    }
    
    # 如果有后端 Dockerfile，构建后端镜像
    $backendDockerfile = Join-Path $ProjectRoot "backend/Dockerfile"
    if (Test-Path $backendDockerfile) {
        $backendImage = "mendian-backend:$Tag"
        $backendImageExists = docker images -q $backendImage
        
        if ($ForceBuild -or -not $backendImageExists) {
            Write-Info "构建后端镜像: $backendImage"
            if (-not $DryRun) {
                & docker build @buildArgs -t $backendImage -f $backendDockerfile $ProjectRoot
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "后端镜像构建失败"
                    exit 1
                }
            }
            Write-Success "后端镜像构建完成"
        } else {
            Write-Info "后端镜像已存在，跳过构建"
        }
    }
}

function Deploy-Docker {
    param(
        [string]$Environment,
        [string]$Tag,
        [bool]$Cleanup
    )
    
    Write-Step "使用 Docker Compose 部署到 $Environment 环境..."
    
    # 设置环境变量
    $env:BUILD_TARGET = "production"
    $env:VCS_REF = $Tag
    $env:NODE_ENV = $Environment
    
    # 停止和清理旧容器 (如果需要)
    if ($Cleanup) {
        Write-Info "清理旧的部署..."
        if (-not $DryRun) {
            $composeFile = Join-Path $ProjectRoot "docker-compose.yml"
            & docker-compose -f $composeFile down --remove-orphans
        }
    }
    
    # 选择合适的 docker-compose 文件
    $composeFiles = @("-f", (Join-Path $ProjectRoot "docker-compose.yml"))
    $envComposeFile = Join-Path $ProjectRoot "docker-compose.$Environment.yml"
    if (Test-Path $envComposeFile) {
        $composeFiles += @("-f", $envComposeFile)
    }
    
    # 部署服务
    Write-Info "启动服务..."
    if (-not $DryRun) {
        & docker-compose @composeFiles up -d --build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Docker Compose 部署失败"
            exit 1
        }
    } else {
        Write-Info "模拟执行: docker-compose $($composeFiles -join ' ') up -d --build"
    }
    
    Write-Success "Docker 部署完成"
}

function Deploy-Local {
    param(
        [string]$Environment,
        [string]$Tag
    )
    
    Write-Step "本地部署到 $Environment 环境..."
    
    # 构建前端
    Write-Info "构建前端应用..."
    if (-not $DryRun) {
        $frontendDir = Join-Path $ProjectRoot "frontend"
        Push-Location $frontendDir
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install 失败"
            }
            
            npm run build
            if ($LASTEXITCODE -ne 0) {
                throw "npm run build 失败"
            }
        }
        finally {
            Pop-Location
        }
    }
    
    # 如果有后端，构建后端
    $backendPackageJson = Join-Path $ProjectRoot "backend/package.json"
    if (Test-Path $backendPackageJson) {
        Write-Info "构建后端应用..."
        if (-not $DryRun) {
            $backendDir = Join-Path $ProjectRoot "backend"
            Push-Location $backendDir
            try {
                npm install
                if ($LASTEXITCODE -ne 0) {
                    throw "npm install 失败"
                }
                
                npm run build
                if ($LASTEXITCODE -ne 0) {
                    throw "npm run build 失败"
                }
            }
            finally {
                Pop-Location
            }
        }
    }
    
    Write-Success "本地构建完成"
    Write-Info "请手动将构建产物部署到目标服务器"
}

function Test-Health {
    param([string]$Environment)
    
    Write-Step "执行健康检查..."
    
    # 确定健康检查 URL
    $healthUrl = switch ($Environment) {
        "development" { "http://localhost:7801/health" }
        "staging" { "http://localhost/health" }
        "production" { "https://mendian.example.com/health" }
        default { "http://localhost/health" }
    }
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "健康检查通过 ($healthUrl)"
                return $true
            }
        }
        catch {
            # 忽略错误，继续重试
        }
        
        Write-Info "健康检查失败，重试 $attempt/$maxAttempts..."
        Start-Sleep -Seconds 10
        $attempt++
    }
    
    Write-Error "健康检查失败，服务可能未正常启动"
    return $false
}

# ============================================================================
# 主函数
# ============================================================================

function Main {
    # 显示帮助
    if ($Help) {
        Show-Help
        exit 0
    }
    
    # 启用详细输出
    if ($Verbose) {
        $VerbosePreference = "Continue"
    }
    
    # 显示部署信息
    Write-Info "$ScriptName v$ScriptVersion"
    Write-Info "环境: $Environment"
    Write-Info "部署方式: $Method"
    Write-Info "镜像标签: $Tag"
    Write-Info "强制构建: $Build"
    Write-Info "清理旧资源: $Cleanup"
    Write-Info "模拟运行: $DryRun"
    
    if ($DryRun) {
        Write-Warning "这是模拟运行，不会执行实际操作"
    }
    
    Write-Host "----------------------------------------"
    
    # 检查依赖
    Test-Dependencies
    
    # 预检查
    Write-Step "执行预检查..."
    Test-Docker
    Test-EnvironmentFile $Environment
    Test-GitStatus
    
    # 构建镜像 (Docker 部署需要)
    if ($Method -eq "docker") {
        Build-Images $Environment $Tag $Build
    }
    
    # 执行部署
    switch ($Method) {
        "docker" {
            Deploy-Docker $Environment $Tag $Cleanup
        }
        "local" {
            Deploy-Local $Environment $Tag
        }
    }
    
    # 健康检查 (非本地部署)
    if ($Method -ne "local" -and -not $DryRun) {
        if (Test-Health $Environment) {
            Write-Success "🎉 部署成功完成！"
        } else {
            Write-Warning "部署完成，但健康检查失败，请检查服务状态"
            exit 1
        }
    } else {
        Write-Success "🎉 部署完成！"
    }
    
    # 显示访问信息
    switch ($Environment) {
        "development" {
            Write-Info "🌐 访问地址: http://localhost:7801"
            Write-Info "📊 管理面板: http://localhost:8081 (数据库), http://localhost:8082 (Redis)"
        }
        "staging" {
            Write-Info "🌐 访问地址: http://localhost (或配置的域名)"
        }
        "production" {
            Write-Info "🌐 访问地址: https://mendian.example.com (或配置的域名)"
        }
    }
    
    Write-Info "📝 查看日志: docker-compose logs -f"
    Write-Info "🔧 停止服务: docker-compose down"
}

# 错误处理
$ErrorActionPreference = "Stop"

try {
    Main
}
catch {
    Write-Error "部署过程中发生错误: $($_.Exception.Message)"
    exit 1
}