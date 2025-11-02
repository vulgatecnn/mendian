# PostgreSQL 迁移指南

本项目已从 MySQL 迁移到 PostgreSQL。本文档说明迁移的变更和设置步骤。

## 主要变更

### 1. 依赖包变更

**之前 (MySQL)**:
```
pymysql==1.1.0
```

**现在 (PostgreSQL)**:
```
psycopg2-binary==2.9.9
```

### 2. 数据库配置变更

**环境变量 (.env)**:
- 默认端口从 `3306` 改为 `5432`
- 默认用户从 `root` 改为 `postgres`

**Django 设置 (settings.py)**:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # 从 mysql 改为 postgresql
        'NAME': os.environ.get('DB_NAME', 'store_lifecycle'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '111111'),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

### 3. 项目初始化文件变更

**backend/store_lifecycle/__init__.py**:
- 移除了 `pymysql` 的初始化代码
- PostgreSQL 不需要额外的初始化

### 4. SQL 语法差异

主要差异包括：

| 特性 | MySQL | PostgreSQL |
|------|-------|------------|
| 自增主键 | `BIGINT AUTO_INCREMENT` | `BIGSERIAL` |
| 日期时间 | `DATETIME` | `TIMESTAMP` |
| JSON 字段 | `JSON` | `JSONB` (更高效) |
| IP 地址 | `VARCHAR(45)` | `INET` (原生类型) |
| 注释 | `COMMENT '...'` | `COMMENT ON ...` |
| 索引创建 | `INDEX idx_name (col)` | `CREATE INDEX idx_name ON table(col)` |
| 唯一约束 | `UNIQUE KEY uk_name (cols)` | `UNIQUE (cols)` |

## 设置步骤

### 1. 安装 PostgreSQL

**Windows**:
- 下载并安装 PostgreSQL 14.0 或更高版本
- 从 https://www.postgresql.org/download/windows/

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS**:
```bash
brew install postgresql@14
brew services start postgresql@14
```

### 2. 创建数据库

连接到 PostgreSQL:
```bash
# Linux/macOS
sudo -u postgres psql

# Windows (使用 pgAdmin 或 psql)
psql -U postgres
```

创建数据库和用户:
```sql
-- 创建数据库
CREATE DATABASE store_lifecycle 
    ENCODING 'UTF8' 
    LC_COLLATE='zh_CN.UTF-8' 
    LC_CTYPE='zh_CN.UTF-8';

-- 创建用户（可选）
CREATE USER store_user WITH PASSWORD 'your_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE store_lifecycle TO store_user;
```

### 3. 更新 Python 依赖

```bash
cd backend
pip install -r requirements.txt
```

### 4. 配置环境变量

编辑 `backend/.env` 文件:
```env
# 数据库配置（PostgreSQL）
DB_NAME=store_lifecycle
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=5432
```

### 5. 运行数据库迁移

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 6. 创建超级用户

```bash
python manage.py createsuperuser
```

### 7. 启动服务

```bash
# Windows
start.bat

# Linux/macOS
./start.sh
```

## 数据迁移（从 MySQL 迁移现有数据）

如果你有现有的 MySQL 数据需要迁移到 PostgreSQL：

### 方法 1: 使用 Django 导出/导入

```bash
# 1. 从 MySQL 导出数据
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > data.json

# 2. 切换到 PostgreSQL 配置

# 3. 导入数据到 PostgreSQL
python manage.py loaddata data.json
```

### 方法 2: 使用 pgloader

```bash
# 安装 pgloader
sudo apt install pgloader  # Linux
brew install pgloader      # macOS

# 创建迁移配置文件 migration.load
cat > migration.load << EOF
LOAD DATABASE
    FROM mysql://root:password@localhost/store_lifecycle
    INTO postgresql://postgres:password@localhost/store_lifecycle
    WITH include drop, create tables, create indexes, reset sequences
    SET maintenance_work_mem to '128MB', work_mem to '12MB';
EOF

# 执行迁移
pgloader migration.load
```

## 常见问题

### 问题 1: psycopg2 安装失败

**解决方案**:
- Windows: 使用 `psycopg2-binary` (已在 requirements.txt 中)
- Linux: `sudo apt-get install python3-dev libpq-dev`
- macOS: `brew install postgresql`

### 问题 2: 数据库连接失败

**解决方案**:
1. 检查 PostgreSQL 服务是否运行:
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   
   # Windows
   # 在服务管理器中检查 PostgreSQL 服务
   ```

2. 检查 `pg_hba.conf` 配置:
   ```
   # 允许本地连接
   host    all             all             127.0.0.1/32            md5
   ```

3. 重启 PostgreSQL 服务:
   ```bash
   # Linux
   sudo systemctl restart postgresql
   
   # macOS
   brew services restart postgresql@14
   ```

### 问题 3: 字符编码问题

**解决方案**:
确保数据库使用 UTF-8 编码:
```sql
-- 检查数据库编码
SELECT datname, pg_encoding_to_char(encoding) FROM pg_database WHERE datname = 'store_lifecycle';

-- 如果编码不正确，重新创建数据库
DROP DATABASE store_lifecycle;
CREATE DATABASE store_lifecycle ENCODING 'UTF8';
```

## PostgreSQL 优势

相比 MySQL，PostgreSQL 提供了以下优势：

1. **更强大的 JSON 支持**: JSONB 类型提供更高效的 JSON 存储和查询
2. **原生 IP 地址类型**: INET 和 CIDR 类型用于存储 IP 地址
3. **更好的并发控制**: MVCC (多版本并发控制) 提供更好的并发性能
4. **丰富的数据类型**: 数组、范围类型、全文搜索等
5. **强大的扩展性**: 支持自定义函数、触发器、扩展等
6. **更好的标准兼容性**: 更符合 SQL 标准

## 性能优化建议

### 1. 连接池配置

在生产环境中使用连接池（如 pgBouncer）:
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
        },
        'CONN_MAX_AGE': 600,  # 连接池
    }
}
```

### 2. 索引优化

```sql
-- 为常用查询创建索引
CREATE INDEX idx_user_department_active ON sys_user(department_id, is_active);
CREATE INDEX idx_audit_log_user_time ON sys_audit_log(user_id, created_at DESC);

-- 为 JSONB 字段创建 GIN 索引
CREATE INDEX idx_audit_log_details ON sys_audit_log USING GIN (details);
```

### 3. 查询优化

```python
# 使用 select_related 和 prefetch_related
users = User.objects.select_related('department').prefetch_related('roles')

# 使用 only() 和 defer() 减少字段查询
users = User.objects.only('id', 'username', 'phone')
```

## 参考资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Django PostgreSQL 文档](https://docs.djangoproject.com/en/4.2/ref/databases/#postgresql-notes)
- [从 MySQL 迁移到 PostgreSQL](https://wiki.postgresql.org/wiki/Converting_from_other_Databases_to_PostgreSQL)
