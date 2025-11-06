# 门店生命周期管理系统 - 测试指南

## 目录
1. [环境准备](#环境准备)
2. [后端测试](#后端测试)
3. [前端测试](#前端测试)
4. [端到端测试](#端到端测试)
5. [性能测试](#性能测试)
6. [常见问题](#常见问题)

---

## 环境准备

### 1. 启动服务

```bash
# 启动后端（在 backend 目录）
python manage.py runserver

# 启动前端（在 frontend 目录）
pnpm dev
```

### 2. 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 超级管理员，拥有所有权限 |
| CEO | ceo | test123 | 总裁办人员 |
| 拓展经理 | exp_manager | test123 | 拓展部经理 |
| 测试用户 | test_user | test123 | 普通测试用户 |

### 3. 访问地址

- **PC 端**: http://localhost:5000/pc
- **移动端**: http://localhost:5000/mobile
- **后端 API**: http://localhost:8000/api/
- **API 文档**: http://localhost:8000/api/docs/
- **Django 管理后台**: http://localhost:8000/admin/

---

## 后端测试

### 1. API 健康检查

```bash
# 检查后端服务是否运行
curl http://localhost:8000/api/

# 检查数据库连接
cd backend
python manage.py check
```

### 2. 单元测试

```bash
cd backend

# 运行所有测试
pytest

# 运行特定模块测试
pytest system_management/tests/
pytest store_planning/tests/
pytest store_expansion/tests/

# 运行带覆盖率的测试
pytest --cov=. --cov-report=html

# 查看覆盖率报告
# 打开 htmlcov/index.html
```

### 3. API 功能测试

#### 3.1 认证测试

```bash
# 登录测试
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "login_type": "username_password",
    "username": "admin",
    "password": "admin123"
  }'

# 预期返回：
# {
#   "code": 0,
#   "message": "登录成功",
#   "data": {
#     "access_token": "...",
#     "refresh_token": "...",
#     "user": {...}
#   }
# }
```

#### 3.2 用户管理测试

```bash
# 获取用户列表（需要 token）
curl http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 创建用户
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "test123",
    "first_name": "新用户",
    "phone": "13800138888"
  }'
```

#### 3.3 业务模块测试

```bash
# 获取经营区域列表
curl http://localhost:8000/api/base-data/regions/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 获取门店计划列表
curl http://localhost:8000/api/store-planning/plans/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 获取候选位置列表
curl http://localhost:8000/api/expansion/locations/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 数据库测试

```bash
cd backend

# 检查数据库迁移状态
python manage.py showmigrations

# 检查数据完整性
python manage.py check --database default

# 查看数据统计
python manage.py shell -c "
from system_management.models import User, Department
from base_data.models import BusinessRegion, LegalEntity
print(f'用户数: {User.objects.count()}')
print(f'部门数: {Department.objects.count()}')
print(f'区域数: {BusinessRegion.objects.count()}')
print(f'法人主体数: {LegalEntity.objects.count()}')
"
```

### 5. 性能测试

```bash
# 使用 Django Debug Toolbar 查看 SQL 查询
# 在 settings.py 中启用 DEBUG_TOOLBAR

# 检查慢查询
python manage.py shell -c "
from django.db import connection
from django.db import reset_queries
from system_management.models import User

# 执行查询
users = list(User.objects.select_related('department').all())

# 查看 SQL 查询
for query in connection.queries:
    print(f'{query[\"time\"]}s: {query[\"sql\"]}')
"
```

---

## 前端测试

### 1. 开发环境检查

```bash
cd frontend

# 检查依赖
pnpm list

# 类型检查
pnpm tsc --noEmit

# 代码检查
pnpm eslint src/

# 构建测试
pnpm build
```

### 2. 单元测试

```bash
cd frontend

# 运行所有测试
pnpm test

# 运行特定测试
pnpm test Login.test.tsx

# 运行带覆盖率的测试
pnpm test:coverage

# 查看覆盖率报告
# 打开 coverage/index.html
```

### 3. 组件测试

创建测试文件 `frontend/src/pages/auth/__tests__/Login.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'

describe('Login Component', () => {
  it('应该渲染登录表单', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    expect(screen.getByPlaceholderText('用户名 / 手机号')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
    expect(screen.getByText('登录')).toBeInTheDocument()
  })

  it('应该显示验证错误', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    const loginButton = screen.getByText('登录')
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('请输入用户名或手机号')).toBeInTheDocument()
    })
  })
})
```

### 4. 浏览器测试清单

#### 4.1 PC 端测试

**登录功能**
- [ ] 使用用户名密码登录
- [ ] 使用手机号密码登录
- [ ] 使用手机号验证码登录
- [ ] 记住登录状态
- [ ] 登录失败提示
- [ ] 退出登录

**首页功能**
- [ ] 待办事项显示
- [ ] 消息通知显示
- [ ] 常用功能快捷入口
- [ ] 数据统计卡片

**导航功能**
- [ ] 左侧菜单展开/收起
- [ ] 菜单项点击跳转
- [ ] 面包屑导航
- [ ] 顶部用户菜单

**业务功能**
- [ ] 开店计划列表查询
- [ ] 开店计划创建/编辑
- [ ] 候选位置列表查询
- [ ] 跟进记录创建
- [ ] 审批流程提交
- [ ] 数据导出功能

#### 4.2 移动端测试

**登录功能**
- [ ] 企业微信登录
- [ ] 非企业微信环境提示

**工作台功能**
- [ ] 待办事项列表
- [ ] 快捷功能入口
- [ ] 消息通知

**业务功能**
- [ ] 候选位置列表（移动端）
- [ ] 跟进记录创建（移动端）
- [ ] 审批处理（移动端）

### 5. 兼容性测试

**浏览器兼容性**
- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Edge (最新版)
- [ ] Safari (最新版)

**响应式测试**
- [ ] 桌面端 (1920x1080)
- [ ] 笔记本 (1366x768)
- [ ] 平板 (768x1024)
- [ ] 手机 (375x667)

---

## 端到端测试

### 1. 完整业务流程测试

#### 流程1: 开店计划到门店开业

```
1. 登录系统 (admin/admin123)
2. 创建开店计划
   - 进入"开店计划管理"
   - 点击"新建计划"
   - 填写计划信息（区域、门店类型、数量）
   - 提交审批
3. 审批计划
   - 进入"审批中心"
   - 查看待审批项
   - 审批通过
4. 添加候选位置
   - 进入"拓店管理" > "候选点位"
   - 添加新位置
   - 填写位置信息
5. 跟进候选位置
   - 创建跟进记录
   - 更新位置状态
6. 签订合同
   - 上传合同文件
   - 提交审批
7. 创建施工项目
   - 进入"开店筹备" > "工程管理"
   - 创建施工项目
   - 分配供应商
8. 工程验收
   - 记录施工进度
   - 提交验收
9. 门店交接
   - 创建交接单
   - 完成交接
10. 创建门店档案
    - 进入"门店档案"
    - 录入门店信息
    - 标记为"营业中"
```

#### 流程2: 审批流程测试

```
1. 创建审批模板
   - 进入"审批中心" > "审批模板"
   - 设计表单
   - 配置流程
2. 发起审批
   - 选择审批类型
   - 填写表单
   - 提交
3. 审批处理
   - 审批人登录
   - 查看待办
   - 审批通过/驳回
4. 查看审批结果
   - 发起人查看审批状态
   - 查看审批历史
```

### 2. 使用 Playwright 进行 E2E 测试

创建 `e2e/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('完整登录流程', async ({ page }) => {
  // 访问登录页
  await page.goto('http://localhost:5000/pc/login')
  
  // 填写表单
  await page.fill('input[placeholder="用户名 / 手机号"]', 'admin')
  await page.fill('input[placeholder="密码"]', 'admin123')
  
  // 点击登录
  await page.click('button:has-text("登录")')
  
  // 等待跳转到首页
  await page.waitForURL('http://localhost:5000/pc')
  
  // 验证登录成功
  await expect(page.locator('text=下午好')).toBeVisible()
  await expect(page.locator('text=待办事项')).toBeVisible()
})

test('创建开店计划', async ({ page }) => {
  // 先登录
  await page.goto('http://localhost:5000/login')
  await page.fill('input[placeholder="用户名 / 手机号"]', 'admin')
  await page.fill('input[placeholder="密码"]', 'admin123')
  await page.click('button:has-text("登录")')
  await page.waitForURL('http://localhost:5000/')
  
  // 进入开店计划页面
  await page.click('text=开店计划管理')
  await page.click('text=计划列表')
  
  // 点击新建
  await page.click('button:has-text("新建计划")')
  
  // 填写表单
  await page.selectOption('select[name="region"]', '华东区')
  await page.selectOption('select[name="store_type"]', '标准店')
  await page.fill('input[name="planned_count"]', '5')
  
  // 提交
  await page.click('button:has-text("提交")')
  
  // 验证成功
  await expect(page.locator('text=创建成功')).toBeVisible()
})
```

---

## 性能测试

### 1. 前端性能测试

```bash
# 使用 Lighthouse 测试
# 在 Chrome DevTools 中运行 Lighthouse

# 或使用命令行
npm install -g lighthouse
lighthouse http://localhost:5000 --view
```

**关注指标**:
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.8s
- Cumulative Layout Shift (CLS) < 0.1

### 2. API 性能测试

使用 Apache Bench:

```bash
# 测试登录 API
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:8000/api/auth/login/

# login.json 内容:
# {
#   "login_type": "username_password",
#   "username": "admin",
#   "password": "admin123"
# }
```

使用 Locust:

```python
# locustfile.py
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # 登录
        response = self.client.post("/api/auth/login/", json={
            "login_type": "username_password",
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()['data']['access_token']
    
    @task
    def get_users(self):
        self.client.get("/api/users/", headers={
            "Authorization": f"Bearer {self.token}"
        })
    
    @task
    def get_regions(self):
        self.client.get("/api/base-data/regions/", headers={
            "Authorization": f"Bearer {self.token}"
        })
```

运行:
```bash
locust -f locustfile.py --host=http://localhost:8000
# 访问 http://localhost:8089 查看结果
```

---

## 常见问题

### 1. 后端问题

**Q: 数据库连接失败**
```bash
# 检查 PostgreSQL 是否运行
# 检查 .env 配置
# 运行数据库迁移
python manage.py migrate
```

**Q: Token 过期**
```bash
# 使用 refresh_token 刷新
curl -X POST http://localhost:8000/api/auth/refresh-token/ \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

### 2. 前端问题

**Q: 页面空白**
```bash
# 清除缓存
rm -rf node_modules/.vite
# 重启开发服务器
pnpm dev
```

**Q: API 请求失败**
```
# 检查后端是否运行
# 检查 CORS 配置
# 查看浏览器控制台错误
```

### 3. 测试数据

**重新生成测试数据**:
```bash
cd backend
python quick_test_data.py
```

**清除所有数据**:
```bash
python manage.py flush
python manage.py createsuperuser
python quick_test_data.py
```

---

## 测试报告模板

### 测试执行记录

| 测试项 | 测试结果 | 问题描述 | 优先级 |
|--------|---------|---------|--------|
| 登录功能 | ✅ 通过 | - | - |
| 用户管理 | ✅ 通过 | - | - |
| 开店计划 | ⚠️ 部分通过 | 导出功能异常 | P1 |
| 审批流程 | ❌ 失败 | 多级审批不生效 | P0 |

### 性能测试结果

| 指标 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| 首页加载时间 | < 2s | 1.5s | ✅ |
| API 响应时间 | < 200ms | 150ms | ✅ |
| 并发用户数 | > 100 | 150 | ✅ |

---

## 自动化测试脚本

创建 `test_all.sh`:

```bash
#!/bin/bash

echo "=== 开始完整测试 ==="

# 1. 后端测试
echo "1. 运行后端测试..."
cd backend
pytest --cov=. --cov-report=html
if [ $? -ne 0 ]; then
    echo "❌ 后端测试失败"
    exit 1
fi
echo "✅ 后端测试通过"

# 2. 前端测试
echo "2. 运行前端测试..."
cd ../frontend
pnpm test:coverage
if [ $? -ne 0 ]; then
    echo "❌ 前端测试失败"
    exit 1
fi
echo "✅ 前端测试通过"

# 3. 类型检查
echo "3. 运行类型检查..."
pnpm tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ 类型检查失败"
    exit 1
fi
echo "✅ 类型检查通过"

# 4. 代码检查
echo "4. 运行代码检查..."
pnpm eslint src/
if [ $? -ne 0 ]; then
    echo "⚠️ 代码检查有警告"
fi

echo "=== 测试完成 ==="
```

---

## 持续集成配置

创建 `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest --cov=.
  
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 18
      - name: Install pnpm
        run: npm install -g pnpm
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      - name: Run tests
        run: |
          cd frontend
          pnpm test
```

---

## 总结

完整的测试流程应该包括：

1. **单元测试** - 测试独立的函数和组件
2. **集成测试** - 测试模块之间的交互
3. **端到端测试** - 测试完整的用户流程
4. **性能测试** - 确保系统性能达标
5. **兼容性测试** - 确保跨浏览器兼容

定期执行测试，确保系统质量！
