@echo off
REM 启动测试服务脚本
REM 用于启动后端和前端服务以进行测试

echo ====================================
echo 启动测试服务
echo ====================================

REM 检查 PostgreSQL 是否运行
echo.
echo [1/4] 检查 PostgreSQL 服务...
pg_isready -h 127.0.0.1 -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL 未运行，请先启动 PostgreSQL 服务
    echo    可以使用以下命令启动：
    echo    net start postgresql-x64-14
    pause
    exit /b 1
)
echo ✅ PostgreSQL 正在运行

REM 检查 Redis 是否运行（可选）
echo.
echo [2/4] 检查 Redis 服务...
redis-cli ping >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Redis 未运行（某些功能可能受限）
) else (
    echo ✅ Redis 正在运行
)

REM 准备后端测试环境
echo.
echo [3/4] 准备后端测试环境...
cd backend
call setup_test_env.bat
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 后端测试环境准备失败
    cd ..
    pause
    exit /b 1
)
cd ..

REM 检查前端依赖
echo.
echo [4/4] 检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call pnpm install
)
cd ..

echo.
echo ====================================
echo ✅ 测试服务准备完成
echo ====================================
echo.
echo 现在可以：
echo   1. 启动后端服务：cd backend ^&^& python manage.py runserver 5100
echo   2. 启动前端服务：cd frontend ^&^& pnpm dev
echo   3. 运行后端测试：cd backend ^&^& pytest
echo   4. 运行前端测试：cd frontend ^&^& pnpm test
echo   5. 运行 E2E 测试：cd frontend ^&^& pnpm test:e2e
echo.
pause
