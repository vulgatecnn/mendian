@echo off
REM 后端启动脚本 (Windows)

echo 启动门店生命周期管理系统后端...

REM 激活虚拟环境（如果存在）
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM 运行数据库迁移
echo 运行数据库迁移...
python manage.py migrate

REM 启动开发服务器
echo 启动开发服务器...
REM 从 .env 文件读取端口号，默认为 5100
for /f "tokens=2 delims==" %%a in ('findstr "BACKEND_PORT" .env') do set BACKEND_PORT=%%a
if not defined BACKEND_PORT set BACKEND_PORT=5100
python manage.py runserver 0.0.0.0:%BACKEND_PORT%
