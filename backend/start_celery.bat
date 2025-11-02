@echo off
REM Windows 下启动 Celery Worker 和 Beat 的脚本

echo 正在启动 Celery Worker 和 Beat...
echo.

REM 检查 Redis 是否运行
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [错误] Redis 未运行，请先启动 Redis 服务
    echo 可以使用命令: redis-server
    pause
    exit /b 1
)

echo Redis 服务正常运行
echo.

REM 启动 Celery Worker 和 Beat
echo 启动 Celery Worker 和 Beat...
celery -A store_lifecycle worker -l info --pool=solo --beat

pause
