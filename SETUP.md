# 项目设置指南

## 环境要求

### 后端
- Python 3.10 或更高版本
- PostgreSQL 14.0 或更高版本
- pip (Python 包管理器)

### 前端
- Node.js 18.0 或更高版本
- npm 或 yarn

## 详细设置步骤

### 1. 数据库设置

1. 安装 PostgreSQL 14.0 或更高版本
2. 创建数据库：

```sql
CREATE DATABASE store_lifecycle ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8';
```

3. 创建数据库用户（可选）：

```sql
CREATE USER store_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE store_lifecycle TO store_user;
```

### 2. 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 创建 Python 虚拟环境：
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. 安装 Python 依赖：
```bash
pip install -r requirements.txt
```

4. 配置环境变量：
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置以下内容：
# - 数据库连接信息
# - Django SECRET_KEY
# - 企业微信配置（如果需要）
```

5. 运行数据库迁移：
```bash
python manage.py makemigrations
python manage.py migrate
```

6. 创建超级管理员账号：
```bash
python manage.py createsuperuser
```

7. 启动开发服务器：
```bash
# 方式 1：使用 Django 命令
python manage.py runserver

# 方式 2：使用启动脚本
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

后端服务将运行在：http://localhost:8000

### 3. 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装 Node.js 依赖：
```bash
pnpm install
# 或使用 yarn
yarn install
```

3. 启动开发服务器：
```bash
npm run dev
# 或使用 yarn
yarn dev
```

前端应用将运行在：http://localhost:3000

### 4. 验证安装

1. 访问前端应用：http://localhost:3000
2. 访问后端 API 文档：http://localhost:8000/api/docs/
3. 访问 Django 管理后台：http://localhost:8000/admin/

## 常见问题

### 后端问题

**问题：psycopg2 安装失败**

解决方案：
- Windows: 使用 `psycopg2-binary` 包（已在 requirements.txt 中配置）
- Linux: `sudo apt-get install python3-dev libpq-dev`
- Mac: `brew install postgresql`

**问题：数据库连接失败**

解决方案：
1. 检查 PostgreSQL 服务是否运行
2. 验证 .env 文件中的数据库配置
3. 确认数据库用户权限
4. 检查 pg_hba.conf 文件中的认证配置

**问题：端口 8000 已被占用**

解决方案：
```bash
# 使用其他端口
python manage.py runserver 8001
```

### 前端问题

**问题：npm install 失败**

解决方案：
1. 清除 npm 缓存：`npm cache clean --force`
2. 删除 node_modules 和 package-lock.json
3. 重新运行 `npm install`

**问题：端口 3000 已被占用**

解决方案：
- 修改 `vite.config.ts` 中的端口配置

**问题：API 请求失败**

解决方案：
1. 确认后端服务正在运行
2. 检查 vite.config.ts 中的代理配置
3. 查看浏览器控制台的错误信息

## 开发工具推荐

### IDE
- **后端**: PyCharm / VS Code (Python 扩展)
- **前端**: VS Code (React/TypeScript 扩展)

### VS Code 扩展推荐
- Python
- Pylance
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)

### 浏览器扩展
- React Developer Tools
- Redux DevTools (如果使用 Redux)

## 下一步

项目基础架构已搭建完成，接下来可以：

1. 实现数据模型（任务 2）
2. 集成企业微信服务（任务 3）
3. 开发 API 接口（任务 6-9）
4. 构建前端页面（任务 10-15）

详细的实施计划请参考：`.kiro/specs/system-management/tasks.md`
