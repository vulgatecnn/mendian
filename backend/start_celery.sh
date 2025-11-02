#!/bin/bash
# Linux/Mac 下启动 Celery Worker 和 Beat 的脚本

echo "正在启动 Celery Worker 和 Beat..."
echo ""

# 检查 Redis 是否运行
if ! redis-cli ping > /dev/null 2>&1; then
    echo "[错误] Redis 未运行，请先启动 Redis 服务"
    echo "可以使用命令: redis-server"
    exit 1
fi

echo "Redis 服务正常运行"
echo ""

# 启动 Celery Worker 和 Beat
echo "启动 Celery Worker 和 Beat..."
celery -A store_lifecycle worker -l info --beat
