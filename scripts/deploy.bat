@echo off
REM 门店生命周期管理系统部署脚本 (Windows)

setlocal enabledelayedexpansion

REM 颜色定义 (Windows 10+)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 日志函数
:log_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:log_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:log_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:log_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM 检查必要的工具
:check_requirements
call :log_info "检查部署环境..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker 未安装"
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker Compose 未安装"
    exit /b 1
)

call :log_success "环境检查通过"
goto :eof

REM 构建镜像
:build_images
call :log_info "构建 Docker 镜像..."

call :log_info "构建后端镜像..."
docker build -t store-lifecycle-backend:latest ./backend
if errorlevel 1 (
    call :log_error "后端镜像构建失败"
    exit /b 1
)

call :log_info "构建前端镜像..."
docker build -t store-lifecycle-frontend:latest ./frontend
if errorlevel 1 (
    call :log_error "前端镜像构建失败"
    exit /b 1
)

call :log_success "镜像构建完成"
goto :eof

REM 部署到开发环境
:deploy_development
call :log_info "部署到开发环境..."

REM 停止现有服务
docker-compose down

REM 启动服务
docker-compose up -d
if errorlevel 1 (
    call :log_error "服务启动失败"
    exit /b 1
)

REM 等待服务启动
call :log_info "等待服务启动..."
timeout /t 30 /nobreak >nul

REM 健康检查
curl -f http://localhost:8000/api/health/ >nul 2>&1
if errorlevel 1 (
    call :log_error "后端服务启动失败"
    exit /b 1
) else (
    call :log_success "后端服务启动成功"
)

curl -f http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    call :log_warning "前端服务可能未完全启动"
) else (
    call :log_success "前端服务启动成功"
)

call :log_success "开发环境部署完成"
call :log_info "前端地址: http://localhost:3000"
call :log_info "后端地址: http://localhost:8000"
call :log_info "API文档: http://localhost:8000/api/docs/"
goto :eof

REM 部署到生产环境
:deploy_production
call :log_info "部署到生产环境..."

if "%DB_PASSWORD%"=="" (
    call :log_error "缺少 DB_PASSWORD 环境变量"
    exit /b 1
)

if "%SECRET_KEY%"=="" (
    call :log_error "缺少 SECRET_KEY 环境变量"
    exit /b 1
)

REM 拉取最新镜像
call :log_info "拉取最新镜像..."
docker-compose -f docker-compose.production.yml pull

REM 滚动更新
call :log_info "执行滚动更新..."
docker-compose -f docker-compose.production.yml up -d --no-deps backend
docker-compose -f docker-compose.production.yml up -d --no-deps frontend

REM 健康检查
call :log_info "执行健康检查..."
timeout /t 60 /nobreak >nul

curl -f https://your-domain.com/api/health/ >nul 2>&1
if errorlevel 1 (
    call :log_error "生产环境部署失败"
    exit /b 1
) else (
    call :log_success "生产环境部署成功"
)
goto :eof

REM 清理资源
:cleanup
call :log_info "清理未使用的资源..."

docker system prune -f
docker volume prune -f

call :log_success "清理完成"
goto :eof

REM 显示帮助信息
:show_help
echo 门店生命周期管理系统部署脚本
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   dev         部署到开发环境
echo   prod        部署到生产环境
echo   build       构建 Docker 镜像
echo   cleanup     清理未使用的资源
echo   help        显示此帮助信息
echo.
echo 示例:
echo   %~nx0 dev      # 部署到开发环境
echo   %~nx0 prod     # 部署到生产环境
echo   %~nx0 build    # 构建镜像
goto :eof

REM 主函数
:main
if "%1"=="dev" (
    call :check_requirements
    call :build_images
    call :deploy_development
) else if "%1"=="prod" (
    call :check_requirements
    call :deploy_production
) else if "%1"=="build" (
    call :check_requirements
    call :build_images
) else if "%1"=="cleanup" (
    call :cleanup
) else if "%1"=="help" (
    call :show_help
) else if "%1"=="-h" (
    call :show_help
) else if "%1"=="--help" (
    call :show_help
) else (
    call :log_error "未知选项: %1"
    call :show_help
    exit /b 1
)
goto :eof

REM 执行主函数
call :main %1