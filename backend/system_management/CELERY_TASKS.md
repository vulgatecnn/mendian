# Celery 定时任务配置指南

## 概述

系统使用 Celery 来执行异步任务和定时任务。目前实现的定时任务包括：
- 审计日志清理任务：每天凌晨2点自动清理365天前的审计日志

## 环境要求

### 1. 安装 Redis

Celery 需要消息代理（Message Broker），推荐使用 Redis。

**Windows 安装：**
```bash
# 下载 Redis for Windows
# https://github.com/microsoftarchive/redis/releases

# 或使用 Chocolatey 安装
choco install redis-64
```

**Linux/Mac 安装：**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# CentOS/RHEL
sudo yum install redis

# Mac
brew install redis
```

### 2. 安装 Python 依赖

```bash
pip install celery redis
```

更新 `requirements.txt`：
```
celery==5.3.4
redis==5.0.1
```

### 3. 配置环境变量

在 `.env` 文件中添加 Celery 配置：

```env
# Celery 配置
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## 启动 Celery

### 开发环境

**启动 Celery Worker（处理异步任务）：**
```bash
# Windows
celery -A store_lifecycle worker -l info --pool=solo

# Linux/Mac
celery -A store_lifecycle worker -l info
```

**启动 Celery Beat（定时任务调度器）：**
```bash
celery -A store_lifecycle beat -l info
```

**同时启动 Worker 和 Beat：**
```bash
# Windows
celery -A store_lifecycle worker -l info --pool=solo --beat

# Linux/Mac
celery -A store_lifecycle worker -l info --beat
```

### 生产环境

使用 Supervisor 或 systemd 管理 Celery 进程。

**Supervisor 配置示例：**

创建 `/etc/supervisor/conf.d/celery.conf`：

```ini
[program:celery-worker]
command=/path/to/venv/bin/celery -A store_lifecycle worker -l info
directory=/path/to/backend
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600

[program:celery-beat]
command=/path/to/venv/bin/celery -A store_lifecycle beat -l info
directory=/path/to/backend
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/beat.log
stderr_logfile=/var/log/celery/beat.log
autostart=true
autorestart=true
startsecs=10
```

启动服务：
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery-worker
sudo supervisorctl start celery-beat
```

## 定时任务配置

### 当前定时任务

定时任务在 `store_lifecycle/celery.py` 中配置：

```python
app.conf.beat_schedule = {
    # 每天凌晨2点清理过期审计日志
    'cleanup-expired-audit-logs': {
        'task': 'system_management.tasks.cleanup_expired_audit_logs',
        'schedule': crontab(hour=2, minute=0),
    },
}
```

### 修改定时任务时间

使用 `crontab` 表达式配置执行时间：

```python
from celery.schedules import crontab

# 每天凌晨2点
crontab(hour=2, minute=0)

# 每周一凌晨3点
crontab(hour=3, minute=0, day_of_week=1)

# 每月1号凌晨4点
crontab(hour=4, minute=0, day_of_month=1)

# 每小时执行
crontab(minute=0)

# 每30分钟执行
crontab(minute='*/30')
```

### 添加新的定时任务

1. 在 `system_management/tasks.py` 中定义任务：

```python
@shared_task
def my_scheduled_task():
    """我的定时任务"""
    # 任务逻辑
    pass
```

2. 在 `store_lifecycle/celery.py` 中注册定时任务：

```python
app.conf.beat_schedule = {
    'my-task': {
        'task': 'system_management.tasks.my_scheduled_task',
        'schedule': crontab(hour=0, minute=0),
    },
}
```

## 审计日志清理任务

### 自动清理（定时任务）

系统会在每天凌晨2点自动执行清理任务，删除365天前的审计日志。

### 手动清理（管理命令）

使用 Django 管理命令手动清理：

```bash
# 清理365天前的日志（默认）
python manage.py cleanup_audit_logs

# 清理指定天数前的日志
python manage.py cleanup_audit_logs --days 180

# 模拟运行（不实际删除）
python manage.py cleanup_audit_logs --dry-run

# 清理90天前的日志（模拟运行）
python manage.py cleanup_audit_logs --days 90 --dry-run
```

### 手动触发 Celery 任务

在 Python shell 中手动触发任务：

```python
from system_management.tasks import cleanup_expired_audit_logs

# 同步执行
result = cleanup_expired_audit_logs()
print(result)

# 异步执行
task = cleanup_expired_audit_logs.delay()
print(f"任务ID: {task.id}")

# 检查任务状态
print(f"任务状态: {task.status}")

# 获取任务结果
print(f"任务结果: {task.result}")
```

### 按数量清理日志

如果需要按记录数量清理（而不是按时间）：

```python
from system_management.tasks import cleanup_audit_logs_by_count

# 保留最近100万条日志
result = cleanup_audit_logs_by_count.delay(max_records=1000000)
```

## 监控和调试

### 查看 Celery 任务状态

```bash
# 查看活动任务
celery -A store_lifecycle inspect active

# 查看已注册的任务
celery -A store_lifecycle inspect registered

# 查看定时任务
celery -A store_lifecycle inspect scheduled

# 查看统计信息
celery -A store_lifecycle inspect stats
```

### 查看任务日志

Celery 任务的日志会输出到：
- 控制台（开发环境）
- Django 日志文件：`backend/logs/django.log`
- Celery 日志文件（生产环境）

### 使用 Flower 监控

Flower 是 Celery 的 Web 监控工具：

```bash
# 安装 Flower
pip install flower

# 启动 Flower
celery -A store_lifecycle flower

# 访问 http://localhost:5555
```

## 常见问题

### 1. Celery 无法连接 Redis

**错误信息：**
```
Error: Error 111 connecting to localhost:6379. Connection refused.
```

**解决方法：**
- 确认 Redis 服务已启动：`redis-cli ping`（应返回 PONG）
- 检查 Redis 配置和端口
- 检查防火墙设置

### 2. 定时任务不执行

**检查步骤：**
1. 确认 Celery Beat 已启动
2. 查看 Beat 日志，确认任务已调度
3. 查看 Worker 日志，确认任务已执行
4. 检查时区配置是否正确

### 3. Windows 下 Celery 报错

**错误信息：**
```
ValueError: not enough values to unpack
```

**解决方法：**
使用 `--pool=solo` 参数：
```bash
celery -A store_lifecycle worker -l info --pool=solo
```

### 4. 任务执行超时

**解决方法：**
在 `settings.py` 中调整超时时间：
```python
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30分钟
```

## 最佳实践

1. **生产环境使用 Redis**：Redis 性能好，稳定可靠
2. **使用 Supervisor 管理进程**：确保 Celery 进程自动重启
3. **监控任务执行**：使用 Flower 或日志监控任务状态
4. **合理设置定时任务时间**：避免在业务高峰期执行耗时任务
5. **定期检查日志**：及时发现和处理任务执行错误
6. **设置任务超时**：防止任务无限期执行
7. **使用幂等任务**：确保任务可以安全重试

## 参考资料

- [Celery 官方文档](https://docs.celeryproject.org/)
- [Django Celery 集成](https://docs.celeryproject.org/en/stable/django/first-steps-with-django.html)
- [Celery Beat 定时任务](https://docs.celeryproject.org/en/stable/userguide/periodic-tasks.html)
- [Flower 监控工具](https://flower.readthedocs.io/)

