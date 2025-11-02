# 门店生命周期管理系统

好饭碗门店生命周期管理系统 - 从门店规划到运营的全流程管理平台

## 项目结构

```
.
├── backend/                 # Django 后端
│   ├── store_lifecycle/    # Django 项目配置
│   ├── system_management/  # 系统管理模块
│   ├── manage.py           # Django 管理脚本
│   └── requirements.txt    # Python 依赖
│
├── frontend/               # React 前端
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   ├── package.json       # Node.js 依赖
│   └── vite.config.ts     # Vite 配置
│
└── README.md              # 项目说明
```

## 技术栈

### 后端
- Python 3.10+
- Django 4.2
- Django REST Framework
- PostgreSQL 14.0+

### 前端
- React 18
- TypeScript 5
- Arco Design
- Vite

## 快速开始

### 后端设置

1. 创建虚拟环境并安装依赖：
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和企业微信信息
```

3. 创建数据库：
```sql
-- 在 PostgreSQL 中创建数据库
CREATE DATABASE store_lifecycle ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8';
```

4. 运行数据库迁移：
```bash
python manage.py makemigrations
python manage.py migrate
```

5. 创建超级用户：
```bash
python manage.py createsuperuser
```

6. 启动开发服务器：
```bash
python manage.py runserver
```

后端服务将运行在 http://localhost:8000

### 前端设置

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

前端应用将运行在 http://localhost:3000

## API 文档

启动后端服务后，访问以下地址查看 API 文档：
- Swagger UI: http://localhost:8000/api/docs/
- OpenAPI Schema: http://localhost:8000/api/schema/

## 开发指南

### 后端开发

- 模型定义：`backend/system_management/models.py`
- API 视图：`backend/system_management/views.py`
- 序列化器：`backend/system_management/serializers.py`
- URL 路由：`backend/system_management/urls.py`

### 前端开发

- 组件：`frontend/src/components/`
- 页面：`frontend/src/pages/`
- API 服务：`frontend/src/api/`
- 类型定义：`frontend/src/types/`

## 模块说明

### 系统管理模块

- 部门管理：企业微信部门同步、部门树形展示
- 用户管理：用户账号管理、角色分配、启用/停用
- 角色管理：角色创建、权限配置、成员管理
- 审计日志：操作日志记录和查询

## 许可证

私有项目
