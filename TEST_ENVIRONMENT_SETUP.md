# 测试环境设置指南

本文档描述如何准备和配置全面测试所需的环境。

## 前置要求

### 必需软件

1. **Python 3.11+**
   - 当前版本：3.14.0 ✅
   - 验证：`python --version`

2. **Node.js 18+**
   - 当前版本：24.10.0 ✅
   - 验证：`node --version`

3. **pnpm 8+**
   - 当前版本：10.19.0 ✅
   - 验证：`pnpm --version`
   - 安装：`npm install -g pnpm`

4. **PostgreSQL 14+**
   - 用于数据库测试
   - 验证：检查服务是否运行
   - Windows：`net start postgresql-x64-14`

5. **Redis（可选）**
   - 用于 Celery 任务队列测试
   - 某些测试可能需要 Redis

### 已安装的测试工具

#### 后端测试工具 ✅

- **pytest 8.4.2** - 测试框架
- **pytest-django 4.7.0** - Django 集成
- **pytest-cov 4.1.0** - 代码覆盖率
- **factory-boy 3.3.0** - 测试数据工厂
- **faker 20.1.0** - 假数据生成

#### 代码质量工具 ✅

- **pylint 3.0.3** - 代码规范检查
- **flake8 7.0.0** - 代码风格检查
- **bandit 1.7.6** - 安全问题扫描
- **radon 6.0.1** - 代码复杂度分析

#### 安全扫描工具 ✅

- **pip-audit 2.7.3** - Python 依赖安全扫描
  - 注：safety 与 Python 3.14 不兼容，已替换为 pip-audit

#### 性能测试工具

- **locust** - 负载测试工具
  - 注：需要 Microsoft Visual C++ 14.0 编译工具
  - 替代方案：Apache Bench (ab) 或 wrk

#### 前端测试工具 ✅

- **vitest 4.0.6** - 测试运行器
- **@testing-library/react 16.3.0** - React 组件测试
- **@testing-library/user-event 14.6.1** - 用户交互模拟
- **@playwright/test 1.56.1** - E2E 测试
- **lighthouse 13.0.1** - 性能测试
- **@vitest/coverage-v8 4.0.6** - 代码覆盖率

## 环境准备步骤

### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 安装前端依赖

```bash
cd frontend
pnpm install
```

### 3. 配置测试数据库

#### 方式 1：使用自动化脚本（推荐）

```bash
cd backend
python setup_test_env.py
```

这个脚本会：
- 创建测试数据库 `store_lifecycle_test`
- 运行所有数据库迁移
- 生成测试数据（如果存在测试数据脚本）

#### 方式 2：手动配置

1. 创建测试数据库：
```sql
CREATE DATABASE store_lifecycle_test;
```

2. 运行迁移：
```bash
cd backend
python manage.py migrate
```

3. 创建测试数据：
```bash
python quick_test_data.py
```

### 4. 配置环境变量

测试环境使用 `.env.test` 文件（已创建）：

```env
DB_NAME=store_lifecycle_test
DB_USER=postgres
DB_PASSWORD=111111
DB_HOST=127.0.0.1
DB_PORT=5432
```

### 5. 安装 Playwright 浏览器

```bash
cd frontend
pnpm playwright install chromium
```

## 启动测试服务

### 启动后端服务

```bash
cd backend
python manage.py runserver 5100
```

### 启动前端服务

```bash
cd frontend
pnpm dev
```

前端服务将在 `http://localhost:5173` 运行

## 运行测试

### 后端测试

```bash
cd backend

# 运行所有测试
pytest

# 运行特定模块测试
pytest tests/unit/
pytest tests/integration/

# 生成覆盖率报告
pytest --cov=. --cov-report=html

# 详细输出
pytest -v

# 并行运行测试
pytest -n auto
```

### 前端测试

```bash
cd frontend

# 运行单元测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e

# E2E 测试 UI 模式
pnpm test:e2e:ui
```

### 代码质量检查

```bash
cd backend

# 代码规范检查
pylint **/*.py

# 代码风格检查
flake8 .

# 安全问题扫描
bandit -r .

# 代码复杂度分析
radon cc . -a
```

```bash
cd frontend

# ESLint 检查
pnpm lint
```

### 安全扫描

```bash
cd backend
# Python 依赖安全扫描
pip-audit

cd frontend
# Node.js 依赖安全扫描
pnpm audit
```

### 性能测试

```bash
cd frontend

# Lighthouse 性能测试
pnpm lighthouse http://localhost:5173 --output html --output-path ./lighthouse-report.html
```

## 快速启动脚本

### Windows

```bash
# 检查环境
check_test_env.bat

# 准备测试服务
start_test_services.bat
```

## 测试目录结构

### 后端测试结构

```
backend/
├── tests/                      # 统一测试目录
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   ├── e2e/                    # 端到端测试
│   ├── fixtures/               # 测试数据
│   └── conftest.py             # pytest 配置
```

### 前端测试结构

```
frontend/
├── src/
│   └── components/
│       └── __tests__/          # 组件测试
├── e2e/                        # E2E 测试
└── playwright.config.ts        # Playwright 配置
```

## 常见问题

### 1. PostgreSQL 连接失败

- 确保 PostgreSQL 服务正在运行
- 检查 `.env.test` 中的数据库配置
- 验证数据库用户权限

### 2. 前端测试失败

- 确保已安装所有依赖：`pnpm install`
- 清除缓存：`pnpm store prune`
- 重新安装：`rm -rf node_modules && pnpm install`

### 3. E2E 测试失败

- 确保前端服务正在运行（http://localhost:5173）
- 确保后端服务正在运行（http://localhost:5100）
- 检查 Playwright 浏览器是否已安装

### 4. 性能测试工具安装失败

- locust 需要 C++ 编译工具，可以使用替代方案
- 使用 Apache Bench 或 wrk 进行性能测试

## 下一步

环境准备完成后，可以开始执行测试任务：

1. 静态代码分析和依赖扫描（任务 2）
2. 后端单元测试和集成测试（任务 3）
3. 前端组件和路由测试（任务 4）
4. 端到端业务流程测试（任务 5）
5. 性能测试和负载测试（任务 6）
6. 安全性测试（任务 7）
7. 错误处理和边界条件测试（任务 8）

## 参考资料

- [pytest 文档](https://docs.pytest.org/)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [Lighthouse 文档](https://developer.chrome.com/docs/lighthouse/)
