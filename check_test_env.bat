@echo off
REM 测试环境状态检查脚本
echo ====================================
echo 测试环境状态检查
echo ====================================

echo.
echo [检查 1/7] Python 版本
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python 未安装或未添加到 PATH
    goto :error
)

echo.
echo [检查 2/7] Node.js 版本
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js 未安装或未添加到 PATH
    goto :error
)

echo.
echo [检查 3/7] pnpm 版本
pnpm --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pnpm 未安装
    echo    安装命令：npm install -g pnpm
    goto :error
)

echo.
echo [检查 4/7] PostgreSQL 服务
pg_isready -h 127.0.0.1 -p 5432 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL 未运行
    echo    启动命令：net start postgresql-x64-14
) else (
    echo ✅ PostgreSQL 正在运行
)

echo.
echo [检查 5/7] Redis 服务（可选）
redis-cli ping >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Redis 未运行（某些功能可能受限）
) else (
    echo ✅ Redis 正在运行
)

echo.
echo [检查 6/7] 后端测试工具
cd backend
echo   - pytest:
pytest --version 2>nul
echo   - pylint:
pylint --version 2>nul | findstr "pylint"
echo   - flake8:
flake8 --version 2>nul
echo   - bandit:
bandit --version 2>nul | findstr "bandit"
cd ..

echo.
echo [检查 7/7] 前端测试工具
cd frontend
echo   - vitest:
pnpm vitest --version 2>nul
echo   - playwright:
pnpm playwright --version 2>nul
echo   - lighthouse:
pnpm lighthouse --version 2>nul
cd ..

echo.
echo ====================================
echo ✅ 环境检查完成
echo ====================================
goto :end

:error
echo.
echo ====================================
echo ❌ 环境检查失败
echo ====================================
pause
exit /b 1

:end
pause
