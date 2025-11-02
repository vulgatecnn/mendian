#!/bin/bash
# 后端启动脚本

echo "启动门店生命周期管理系统后端..."

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 运行数据库迁移
echo "运行数据库迁移..."
python manage.py migrate

# 启动开发服务器
echo "启动开发服务器..."
# 从 .env 文件读取端口号，默认为 5100
BACKEND_PORT=$(grep BACKEND_PORT .env | cut -d '=' -f2)
BACKEND_PORT=${BACKEND_PORT:-5100}
python manage.py runserver 0.0.0.0:$BACKEND_PORT
