# 系统管理模块部署指南

## 概述

本文档详细说明了系统管理模块的部署流程，包括环境配置、数据库初始化、企业微信集成配置等。

## 系统要求

### 硬件要求

- **CPU**: 2核心以上
- **内存**: 4GB以上（推荐8GB）
- **存储**: 50GB以上可用空间
- **网络**: 稳定的互联网连接（用于企业微信API调用）

### 软件要求

- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+) 或 Windows Server 2019+
- **Python**: 3.9+
- **PostgreSQL**: 14.0+
- **Redis**: 6.0+ (可选，用于缓存和Celery)
- **Nginx**: 1.18+ (生产环境)

## 环境准备

### 1. 安装Python和依赖

#### Ubuntu/Debian

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装Python和相关工具
sudo apt install python3.9 python3.9-venv python3.9-dev python3-pip -y

# 安装系统依赖
sudo apt install build-essential libpq-dev nginx redis-server -y
```

#### CentOS/RHEL

```bash
# 安装EPEL仓库
sudo yum install epel-release -y

# 安装Python和相关工具
sudo yum install python39 python39-devel python39-pip gcc postgresql-devel nginx redis -y
```

#### Windows

1. 从 [Python官网](https://www.python.org/downloads/) 下载并安装Python 3.9+
2. 安装 [PostgreSQL](https://www.postgresql.org/download/windows/)
3. 安装 [Redis](https://redis.io/download) (可选)

### 2. 安装PostgreSQL

#### Ubuntu/Debian

```bash
# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库用户
sudo -u postgres createuser --interactive --pwprompt store_user
sudo -u postgres createdb -O store_user store_lifecycle
```

#### CentOS/RHEL

```bash
# 安装PostgreSQL
sudo yum install postgresql-server postgresql-contrib -y

# 初始化数据库
sudo postgresql-setup initdb

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库用户
sudo -u postgres createuser --interactive --pwprompt store_user
sudo -u postgres createdb -O store_user store_lifecycle
```

### 3. 配置PostgreSQL

编辑 PostgreSQL 配置文件：

```bash
# 编辑 pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 添加或修改以下行（允许本地连接）
local   all             store_user                              md5
host    all             store_user      127.0.0.1/32            md5
```

重启PostgreSQL服务：

```bash
sudo systemctl restart postgresql
```

## 项目部署

### 1. 获取项目代码

```bash
# 克隆项目（假设使用Git）
git clone <repository_url> /opt/store_lifecycle
cd /opt/store_lifecycle

# 或者解压项目包
tar -xzf store_lifecycle.tar.gz -C /opt/
cd /opt/store_lifecycle
```

### 2. 创建Python虚拟环境

```bash
# 创建虚拟环境
python3.9 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 升级pip
pip install --upgrade pip
```

### 3. 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

### 4. 环境配置

创建环境变量文件：

```bash
cp .env.example .env
nano .env
```

配置环境变量：

```bash
# .env 文件内容

# Django配置
SECRET_KEY=your-very-secret-key-here-change-in-production
DEBUG=False
ALLOWED_HOSTS=your-domain.com,127.0.0.1,localhost

# 数据库配置
DB_NAME=store_lifecycle
DB_USER=store_user
DB_PASSWORD=your_database_password
DB_HOST=127.0.0.1
DB_PORT=5432

# 前端URL配置
FRONTEND_URL=http://localhost:3000

# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_AGENT_ID=your_agent_id
WECHAT_SECRET=your_secret

# Celery配置（可选）
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# 邮件配置（可选）
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_email_password
EMAIL_USE_TLS=True
```

### 5. 数据库初始化

```bash
# 检查数据库连接
python manage.py dbshell

# 执行数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 初始化权限数据
python manage.py init_permissions

# 创建默认角色
python manage.py init_roles
```

### 6. 收集静态文件

```bash
# 收集静态文件
python manage.py collectstatic --noinput

# 创建日志目录
mkdir -p logs
chmod 755 logs
```

### 7. 测试运行

```bash
# 测试运行开发服务器
python manage.py runserver 0.0.0.0:8000

# 在另一个终端测试API
curl http://localhost:8000/api/docs/
```

## 企业微信集成配置

### 1. 创建企业微信应用

1. 登录企业微信管理后台
2. 进入"应用管理" -> "自建应用"
3. 创建新应用，记录以下信息：
   - **CorpID**: 企业ID
   - **AgentID**: 应用ID
   - **Secret**: 应用密钥

### 2. 配置应用权限

在企业微信应用设置中配置以下权限：

- **通讯录管理权限**: 读取通讯录
- **API权限**: 
  - 获取部门列表
  - 获取部门成员
  - 获取成员详情

### 3. 设置可信域名

在应用设置中添加系统域名到可信域名列表。

### 4. 测试企业微信集成

```bash
# 进入Django shell
python manage.py shell

# 测试企业微信连接
from system_management.services.wechat_department import department_service
result = department_service.get_department_list()
print(result)
```

### 5. 企业微信配置文档

创建企业微信配置说明文档：

```bash
# 创建配置文档
cat > WECHAT_CONFIG.md << 'EOF'
# 企业微信集成配置说明

## 1. 获取企业微信凭证

### 步骤1：获取CorpID
1. 登录企业微信管理后台 (https://work.weixin.qq.com/)
2. 进入"我的企业" -> "企业信息"
3. 复制"企业ID"

### 步骤2：创建自建应用
1. 进入"应用管理" -> "自建应用"
2. 点击"创建应用"
3. 填写应用信息：
   - 应用名称：门店生命周期管理系统
   - 应用介绍：门店管理系统
   - 应用logo：上传系统logo
4. 创建完成后记录"AgentID"和"Secret"

### 步骤3：配置应用权限
1. 在应用详情页面，点击"企业微信授权登录"
2. 设置授权回调域：your-domain.com
3. 在"功能设置"中启用以下权限：
   - 通讯录管理：读取通讯录
   - 基础接口：获取access_token

### 步骤4：设置通讯录权限
1. 进入"管理工具" -> "通讯录同步"
2. 添加新的同步规则
3. 选择应用：刚创建的应用
4. 设置权限：
   - 可获取的信息：姓名、部门、手机号、职位
   - 可获取的范围：全公司或指定部门

## 2. 环境变量配置

将获取的凭证配置到环境变量：

```bash
WECHAT_CORP_ID=ww1234567890abcdef
WECHAT_AGENT_ID=1000001
WECHAT_SECRET=your_secret_key_here
```

## 3. 测试配置

使用以下命令测试配置是否正确：

```bash
python manage.py shell
>>> from system_management.services.wechat_department import department_service
>>> result = department_service.get_access_token()
>>> print(result)  # 应该返回access_token
```

## 4. 常见问题

### 问题1：获取access_token失败
- 检查CorpID和Secret是否正确
- 确认应用状态为"已启用"
- 检查网络连接

### 问题2：获取部门列表为空
- 确认应用有通讯录读取权限
- 检查部门权限范围设置
- 确认企业微信中有部门数据

### 问题3：同步用户失败
- 确认用户在权限范围内
- 检查用户信息是否完整（姓名、手机号等）
- 确认用户状态为"已激活"

## 5. 安全建议

1. 定期更新Secret
2. 限制应用权限范围
3. 监控API调用频率
4. 记录同步日志
5. 设置访问IP白名单（如果支持）
EOF
```

## 生产环境部署

### 1. 使用Gunicorn运行Django

创建Gunicorn配置文件：

```bash
# 创建gunicorn配置
cat > gunicorn.conf.py << 'EOF'
# Gunicorn配置文件

# 绑定地址和端口
bind = "127.0.0.1:8000"

# 工作进程数（建议为CPU核心数的2倍）
workers = 4

# 工作进程类型
worker_class = "sync"

# 每个工作进程的线程数
threads = 2

# 最大客户端连接数
max_requests = 1000
max_requests_jitter = 100

# 超时设置
timeout = 30
keepalive = 2

# 日志配置
accesslog = "/opt/store_lifecycle/logs/gunicorn_access.log"
errorlog = "/opt/store_lifecycle/logs/gunicorn_error.log"
loglevel = "info"

# 进程管理
preload_app = True
daemon = False

# 用户和组
user = "www-data"
group = "www-data"
EOF
```

创建systemd服务文件：

```bash
# 创建systemd服务
sudo cat > /etc/systemd/system/store-lifecycle.service << 'EOF'
[Unit]
Description=Store Lifecycle Management System
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/store_lifecycle/backend
Environment=PATH=/opt/store_lifecycle/venv/bin
ExecStart=/opt/store_lifecycle/venv/bin/gunicorn store_lifecycle.wsgi:application -c gunicorn.conf.py
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable store-lifecycle
sudo systemctl start store-lifecycle
```

### 2. 配置Nginx

创建Nginx配置：

```bash
# 创建Nginx站点配置
sudo cat > /etc/nginx/sites-available/store-lifecycle << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # 日志配置
    access_log /var/log/nginx/store-lifecycle.access.log;
    error_log /var/log/nginx/store-lifecycle.error.log;
    
    # 客户端上传限制
    client_max_body_size 100M;
    
    # 静态文件
    location /static/ {
        alias /opt/store_lifecycle/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /opt/store_lifecycle/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # API请求
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 管理后台
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 前端应用（如果部署在同一服务器）
    location / {
        try_files $uri $uri/ /index.html;
        root /opt/store_lifecycle/frontend/dist;
        index index.html;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/store-lifecycle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. 配置Celery（可选）

如果需要异步任务处理，配置Celery：

```bash
# 创建Celery服务
sudo cat > /etc/systemd/system/celery.service << 'EOF'
[Unit]
Description=Celery Service
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/opt/store_lifecycle/backend
Environment=PATH=/opt/store_lifecycle/venv/bin
ExecStart=/opt/store_lifecycle/venv/bin/celery -A store_lifecycle worker --loglevel=info --detach
ExecStop=/bin/kill -s TERM $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 创建Celery Beat服务（定时任务）
sudo cat > /etc/systemd/system/celerybeat.service << 'EOF'
[Unit]
Description=Celery Beat Service
After=network.target redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/store_lifecycle/backend
Environment=PATH=/opt/store_lifecycle/venv/bin
ExecStart=/opt/store_lifecycle/venv/bin/celery -A store_lifecycle beat --loglevel=info
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable celery celerybeat
sudo systemctl start celery celerybeat
```

### 4. 设置文件权限

```bash
# 设置项目目录权限
sudo chown -R www-data:www-data /opt/store_lifecycle
sudo chmod -R 755 /opt/store_lifecycle
sudo chmod -R 775 /opt/store_lifecycle/backend/logs
sudo chmod -R 775 /opt/store_lifecycle/backend/media

# 设置敏感文件权限
sudo chmod 600 /opt/store_lifecycle/backend/.env
```

## 数据库维护

### 1. 备份数据库

创建备份脚本：

```bash
# 创建备份脚本
cat > /opt/store_lifecycle/scripts/backup_db.sh << 'EOF'
#!/bin/bash

# 数据库备份脚本
BACKUP_DIR="/opt/store_lifecycle/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="store_lifecycle"
DB_USER="store_user"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: backup_$DATE.sql.gz"
EOF

chmod +x /opt/store_lifecycle/scripts/backup_db.sh
```

设置定时备份：

```bash
# 添加到crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/store_lifecycle/scripts/backup_db.sh") | crontab -
```

### 2. 恢复数据库

```bash
# 恢复数据库
gunzip -c /opt/store_lifecycle/backups/backup_20241102_020000.sql.gz | psql -U store_user -h localhost store_lifecycle
```

## 监控和日志

### 1. 日志配置

确保日志目录存在并有正确权限：

```bash
mkdir -p /opt/store_lifecycle/backend/logs
chown www-data:www-data /opt/store_lifecycle/backend/logs
chmod 775 /opt/store_lifecycle/backend/logs
```

### 2. 日志轮转

配置logrotate：

```bash
sudo cat > /etc/logrotate.d/store-lifecycle << 'EOF'
/opt/store_lifecycle/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload store-lifecycle
    endscript
}
EOF
```

### 3. 系统监控

创建健康检查脚本：

```bash
cat > /opt/store_lifecycle/scripts/health_check.sh << 'EOF'
#!/bin/bash

# 健康检查脚本
API_URL="http://localhost:8000/api/departments/"
LOG_FILE="/opt/store_lifecycle/logs/health_check.log"

# 检查API响应
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -eq 200 ]; then
    echo "$(date): API健康检查通过" >> $LOG_FILE
else
    echo "$(date): API健康检查失败，状态码: $response" >> $LOG_FILE
    # 可以在这里添加告警通知
fi

# 检查数据库连接
cd /opt/store_lifecycle/backend
source ../venv/bin/activate
python manage.py dbshell --command="SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "$(date): 数据库连接正常" >> $LOG_FILE
else
    echo "$(date): 数据库连接失败" >> $LOG_FILE
fi
EOF

chmod +x /opt/store_lifecycle/scripts/health_check.sh

# 添加到crontab（每5分钟检查一次）
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/store_lifecycle/scripts/health_check.sh") | crontab -
```

## 安全配置

### 1. 防火墙配置

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL证书配置

使用Let's Encrypt获取免费SSL证书：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 数据库安全

```bash
# 修改PostgreSQL配置
sudo nano /etc/postgresql/14/main/postgresql.conf

# 添加或修改以下配置
listen_addresses = 'localhost'
ssl = on
password_encryption = scram-sha-256

# 重启PostgreSQL
sudo systemctl restart postgresql
```

## 性能优化

### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX CONCURRENTLY idx_user_department ON system_management_user(department_id);
CREATE INDEX CONCURRENTLY idx_audit_log_created_at ON system_management_auditlog(created_at);
CREATE INDEX CONCURRENTLY idx_audit_log_user ON system_management_auditlog(user_id);

-- 分析表统计信息
ANALYZE;
```

### 2. Redis缓存配置

```bash
# 编辑Redis配置
sudo nano /etc/redis/redis.conf

# 修改以下配置
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# 重启Redis
sudo systemctl restart redis
```

## 故障排除

### 1. 常见问题

#### 问题1：Django应用无法启动

```bash
# 检查日志
sudo journalctl -u store-lifecycle -f

# 检查Python环境
source /opt/store_lifecycle/venv/bin/activate
python manage.py check

# 检查数据库连接
python manage.py dbshell
```

#### 问题2：企业微信同步失败

```bash
# 检查网络连接
curl -I https://qyapi.weixin.qq.com

# 检查配置
python manage.py shell
>>> from django.conf import settings
>>> print(settings.WECHAT_CORP_ID)

# 查看同步日志
tail -f /opt/store_lifecycle/backend/logs/django.log | grep wechat
```

#### 问题3：静态文件无法访问

```bash
# 重新收集静态文件
python manage.py collectstatic --clear --noinput

# 检查文件权限
ls -la /opt/store_lifecycle/backend/staticfiles/

# 检查Nginx配置
sudo nginx -t
```

### 2. 性能问题排查

```bash
# 检查系统资源使用
top
htop
iotop

# 检查数据库性能
sudo -u postgres psql store_lifecycle
\x
SELECT * FROM pg_stat_activity WHERE state = 'active';

# 检查慢查询
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## 更新和维护

### 1. 应用更新流程

```bash
# 1. 备份数据库
/opt/store_lifecycle/scripts/backup_db.sh

# 2. 停止服务
sudo systemctl stop store-lifecycle celery celerybeat

# 3. 更新代码
cd /opt/store_lifecycle
git pull origin main
# 或解压新版本

# 4. 更新依赖
source venv/bin/activate
pip install -r backend/requirements.txt

# 5. 执行数据库迁移
cd backend
python manage.py migrate

# 6. 收集静态文件
python manage.py collectstatic --noinput

# 7. 重启服务
sudo systemctl start store-lifecycle celery celerybeat

# 8. 验证更新
curl http://localhost:8000/api/docs/
```

### 2. 定期维护任务

创建维护脚本：

```bash
cat > /opt/store_lifecycle/scripts/maintenance.sh << 'EOF'
#!/bin/bash

echo "开始系统维护..."

# 清理过期会话
cd /opt/store_lifecycle/backend
source ../venv/bin/activate
python manage.py clearsessions

# 清理过期审计日志（保留365天）
python manage.py shell << 'PYTHON'
from system_management.models import AuditLog
from django.utils import timezone
from datetime import timedelta

cutoff_date = timezone.now() - timedelta(days=365)
deleted_count = AuditLog.objects.filter(created_at__lt=cutoff_date).delete()[0]
print(f"清理了 {deleted_count} 条过期审计日志")
PYTHON

# 优化数据库
sudo -u postgres psql store_lifecycle -c "VACUUM ANALYZE;"

# 清理日志文件（保留30天）
find /opt/store_lifecycle/backend/logs -name "*.log" -mtime +30 -delete

echo "系统维护完成"
EOF

chmod +x /opt/store_lifecycle/scripts/maintenance.sh

# 设置每周执行一次
(crontab -l 2>/dev/null; echo "0 3 * * 0 /opt/store_lifecycle/scripts/maintenance.sh") | crontab -
```

## 前端部署

### 1. 前端环境准备

```bash
# 安装Node.js (推荐使用LTS版本)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装pnpm
npm install -g pnpm

# 验证安装
node --version
pnpm --version
```

### 2. 前端项目部署

```bash
# 进入前端目录
cd /opt/store_lifecycle/frontend

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
nano .env

# .env 文件内容
VITE_API_BASE_URL=https://your-domain.com/api
VITE_APP_TITLE=门店生命周期管理系统
```

### 3. 构建前端项目

```bash
# 构建生产版本
pnpm build

# 验证构建结果
ls -la dist/
```

### 4. 配置Nginx服务前端

前端文件已经在Nginx配置中设置，构建后的文件会自动通过Nginx提供服务。

## 容器化部署（Docker）

### 1. 创建Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["gunicorn", "store_lifecycle.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### 2. 创建docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: store_lifecycle
      POSTGRES_USER: store_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=db
      - DB_NAME=store_lifecycle
      - DB_USER=store_user
      - DB_PASSWORD=your_password
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media

  celery:
    build: ./backend
    command: celery -A store_lifecycle worker --loglevel=info
    environment:
      - DB_HOST=db
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/var/www/static
      - media_volume:/var/www/media
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### 3. 启动容器

```bash
# 构建并启动服务
docker-compose up -d

# 执行数据库迁移
docker-compose exec backend python manage.py migrate

# 创建超级用户
docker-compose exec backend python manage.py createsuperuser

# 初始化数据
docker-compose exec backend python manage.py init_permissions
docker-compose exec backend python manage.py init_roles
```

## 高可用部署

### 1. 负载均衡配置

```nginx
# /etc/nginx/conf.d/upstream.conf
upstream backend_servers {
    server 127.0.0.1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8002 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 健康检查
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

### 2. 数据库主从复制

```bash
# 主数据库配置 (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

# 从数据库配置
standby_mode = 'on'
primary_conninfo = 'host=master_ip port=5432 user=replicator'
```

## 监控和告警

### 1. 系统监控

安装和配置Prometheus + Grafana：

```bash
# 安装Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
sudo mv prometheus-2.40.0.linux-amd64 /opt/prometheus

# 配置Prometheus
cat > /opt/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'store-lifecycle'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
EOF
```

### 2. 应用监控

添加Django监控中间件：

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'django_prometheus',
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # ... 其他中间件
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

# 添加监控URL
# urls.py
urlpatterns = [
    # ...
    path('metrics/', include('django_prometheus.urls')),
]
```

### 3. 告警配置

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@example.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@example.com'
    subject: '系统告警: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      告警: {{ .Annotations.summary }}
      详情: {{ .Annotations.description }}
      {{ end }}
```

## 性能调优

### 1. Django性能优化

```python
# settings.py

# 数据库连接池
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'store_lifecycle',
        'USER': 'store_user',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 5,
        }
    }
}

# 缓存配置
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        }
    }
}

# 会话缓存
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### 2. PostgreSQL性能优化

```sql
-- postgresql.conf 优化配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 3. Nginx性能优化

```nginx
# nginx.conf 性能优化
worker_processes auto;
worker_connections 1024;

# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# 缓存配置
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;
```

## 灾难恢复

### 1. 备份策略

```bash
# 创建完整备份脚本
cat > /opt/store_lifecycle/scripts/full_backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/store_lifecycle/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR/{db,files,config}

# 数据库备份
pg_dump -U store_user -h localhost store_lifecycle > $BACKUP_DIR/db/backup_$DATE.sql

# 文件备份
tar -czf $BACKUP_DIR/files/media_$DATE.tar.gz /opt/store_lifecycle/backend/media/
tar -czf $BACKUP_DIR/files/static_$DATE.tar.gz /opt/store_lifecycle/backend/staticfiles/

# 配置文件备份
cp /opt/store_lifecycle/backend/.env $BACKUP_DIR/config/env_$DATE
cp -r /etc/nginx/sites-available/store-lifecycle $BACKUP_DIR/config/nginx_$DATE

# 压缩整个备份
tar -czf $BACKUP_DIR/full_backup_$DATE.tar.gz $BACKUP_DIR/{db,files,config}

# 清理临时文件
rm -rf $BACKUP_DIR/{db,files,config}

# 上传到远程存储（可选）
# aws s3 cp $BACKUP_DIR/full_backup_$DATE.tar.gz s3://your-backup-bucket/

echo "完整备份完成: full_backup_$DATE.tar.gz"
EOF
```

### 2. 恢复流程

```bash
# 恢复脚本
cat > /opt/store_lifecycle/scripts/restore.sh << 'EOF'
#!/bin/bash

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
    echo "使用方法: $0 <backup_file>"
    exit 1
fi

# 解压备份文件
mkdir -p $RESTORE_DIR
tar -xzf $BACKUP_FILE -C $RESTORE_DIR

# 停止服务
sudo systemctl stop store-lifecycle celery celerybeat

# 恢复数据库
sudo -u postgres dropdb store_lifecycle
sudo -u postgres createdb -O store_user store_lifecycle
psql -U store_user -h localhost store_lifecycle < $RESTORE_DIR/db/backup_*.sql

# 恢复文件
tar -xzf $RESTORE_DIR/files/media_*.tar.gz -C /
tar -xzf $RESTORE_DIR/files/static_*.tar.gz -C /

# 恢复配置
cp $RESTORE_DIR/config/env_* /opt/store_lifecycle/backend/.env

# 重启服务
sudo systemctl start store-lifecycle celery celerybeat

# 清理临时文件
rm -rf $RESTORE_DIR

echo "系统恢复完成"
EOF
```

## 总结

本部署指南涵盖了系统管理模块的完整部署流程，包括：

1. **环境准备**: Python、PostgreSQL、Redis等基础环境
2. **项目部署**: 代码部署、依赖安装、配置文件设置
3. **企业微信集成**: 详细的配置步骤和测试方法
4. **生产环境**: Gunicorn、Nginx、SSL证书配置
5. **前端部署**: Node.js环境和前端项目构建
6. **容器化部署**: Docker和docker-compose配置
7. **高可用部署**: 负载均衡和数据库主从复制
8. **监控告警**: Prometheus、Grafana监控配置
9. **性能调优**: Django、PostgreSQL、Nginx优化
10. **数据库维护**: 备份、恢复、优化策略
11. **安全配置**: 防火墙、SSL、数据库安全
12. **灾难恢复**: 完整的备份和恢复策略
13. **故障排除**: 常见问题的诊断和解决方法
14. **更新维护**: 应用更新流程和定期维护任务

按照本指南操作，可以成功部署一个稳定、安全、高性能的系统管理模块。

### 部署检查清单

部署完成后，请确认以下项目：

- [ ] 所有服务正常启动（Django、PostgreSQL、Redis、Nginx）
- [ ] 数据库连接正常，迁移已执行
- [ ] 静态文件正确收集和提供
- [ ] API接口可以正常访问
- [ ] 企业微信集成配置正确，同步功能正常
- [ ] SSL证书配置正确，HTTPS访问正常
- [ ] 日志文件正常写入，权限设置正确
- [ ] 备份脚本配置并测试成功
- [ ] 监控和告警系统正常工作
- [ ] 防火墙和安全配置已应用
- [ ] 性能优化配置已生效

如有问题，请查看相关日志文件或联系技术支持团队。