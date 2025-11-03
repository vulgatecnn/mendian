# 测试代码迁移指南

## 概述

本文档记录了测试代码从旧结构迁移到新规范结构的过程。

## 迁移内容

### 1. 后端测试重组

#### 创建的新目录结构

```
backend/
├── tests/                          # 统一的测试目录
│   ├── __init__.py
│   ├── conftest.py                 # pytest配置和共享fixtures
│   ├── README.md                   # 测试文档
│   ├── unit/                       # 单元测试
│   │   └── __init__.py
│   ├── integration/                # 集成测试
│   │   ├── __init__.py
│   │   └── test_api_auth.py       # 重构后的认证API测试
│   ├── e2e/                        # 端到端测试
│   │   └── __init__.py
│   └── fixtures/                   # 测试数据
│       └── __init__.py
├── pytest.ini                      # pytest配置文件
├── run_tests.sh                    # Linux/Mac测试运行脚本
└── run_tests.bat                   # Windows测试运行脚本
```

#### 迁移的文件

| 旧位置 | 新位置 | 状态 |
|--------|--------|------|
| `backend/test_auth_api.py` | `backend/tests/integration/test_api_auth.py` | ✅ 已重构并迁移 |
| `backend/verify_migrations.py` | - | ⚠️ 空文件，已删除 |
| `backend/notification/tests.py` | - | ⚠️ 空文件，已删除 |

#### 重构内容

`test_api_auth.py` 的主要改进：
- 从脚本式测试改为pytest测试类
- 使用fixtures管理测试数据
- 遵循AAA模式（Arrange-Act-Assert）
- 添加了更多测试用例
- 改进了断言和错误处理

### 2. 连接测试脚本迁移

#### 创建的新目录

```
scripts/
└── testing/                        # 测试脚本目录
    ├── README.md                   # 脚本使用文档
    ├── test_connection.js          # Node.js连接测试
    ├── test_connection.ps1         # PowerShell连接测试
    └── api_test.html               # 浏览器端API测试
```

#### 迁移的文件

| 旧位置 | 新位置 | 状态 |
|--------|--------|------|
| `test_api.js` | `scripts/testing/test_connection.js` | ✅ 已迁移 |
| `test_connection.ps1` | `scripts/testing/test_connection.ps1` | ✅ 已迁移 |
| `api_test.html` | `scripts/testing/api_test.html` | ✅ 已迁移 |

### 3. 配置文件

#### 新增文件

- `backend/pytest.ini` - pytest配置
- `backend/tests/conftest.py` - 共享fixtures和测试配置
- `backend/run_tests.sh` - Linux/Mac测试运行脚本
- `backend/run_tests.bat` - Windows测试运行脚本

#### 更新文件

- `backend/requirements.txt` - 添加测试依赖：
  - pytest==7.4.3
  - pytest-django==4.7.0
  - pytest-cov==4.1.0
  - pytest-xdist==3.5.0
  - factory-boy==3.3.0
  - faker==20.1.0

### 4. 文档

#### 新增文档

- `backend/tests/README.md` - 后端测试使用文档
- `scripts/testing/README.md` - 测试脚本使用文档
- `.kiro/steering/testing.md` - 测试代码组织规范（steering规则）
- `TESTING_MIGRATION.md` - 本迁移指南

## 使用新的测试结构

### 安装测试依赖

```bash
cd backend
pip install -r requirements.txt
```

### 运行测试

#### Windows

```bash
# 运行所有测试
run_tests.bat

# 运行特定类型的测试
run_tests.bat unit
run_tests.bat integration
run_tests.bat e2e

# 生成覆盖率报告
run_tests.bat coverage

# 并行运行测试
run_tests.bat fast
```

#### Linux/Mac

```bash
# 添加执行权限
chmod +x run_tests.sh

# 运行所有测试
./run_tests.sh

# 运行特定类型的测试
./run_tests.sh unit
./run_tests.sh integration
./run_tests.sh e2e

# 生成覆盖率报告
./run_tests.sh coverage

# 并行运行测试
./run_tests.sh fast
```

#### 直接使用pytest

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/integration/test_api_auth.py

# 运行特定测试类
pytest tests/integration/test_api_auth.py::TestUserAuthentication

# 运行特定测试方法
pytest tests/integration/test_api_auth.py::TestUserAuthentication::test_login_with_username_and_password

# 查看详细输出
pytest -v

# 生成覆盖率报告
pytest --cov=. --cov-report=html
```

### 运行连接测试

#### Node.js脚本

```bash
# 安装依赖
npm install axios

# 运行测试
node scripts/testing/test_connection.js
```

#### PowerShell脚本

```powershell
.\scripts\testing\test_connection.ps1
```

#### 浏览器测试

在浏览器中打开 `scripts/testing/api_test.html`

## 后续工作

### 需要添加的测试

1. **单元测试**
   - 模型测试（test_models.py）
   - 序列化器测试（test_serializers.py）
   - 工具函数测试（test_utils.py）

2. **集成测试**
   - 审批API测试（test_api_approval.py）
   - 门店管理API测试（test_api_store.py）
   - 工作流测试（test_workflows.py）

3. **端到端测试**
   - 门店生命周期测试（test_store_lifecycle.py）
   - 完整业务流程测试

### 前端测试

前端测试结构已经部分就绪：
- `frontend/src/test/setup.ts` - 测试环境设置
- `frontend/src/components/__tests__/` - 组件测试目录

需要添加：
- 组件测试
- Hook测试
- 工具函数测试
- 页面集成测试

### CI/CD集成

建议在CI/CD流程中添加：
1. 自动运行测试
2. 生成覆盖率报告
3. 覆盖率阈值检查
4. 测试失败时阻止合并

## 注意事项

1. **旧测试文件已删除**：确保没有代码依赖旧的测试文件路径
2. **测试数据库**：pytest-django会自动创建测试数据库，不会影响开发数据库
3. **fixtures复用**：使用`conftest.py`中定义的fixtures来共享测试数据
4. **测试隔离**：每个测试应该独立运行，不依赖其他测试的状态
5. **持续更新**：随着项目发展，持续添加和更新测试用例

## 参考资料

- [pytest文档](https://docs.pytest.org/)
- [pytest-django文档](https://pytest-django.readthedocs.io/)
- [Django测试文档](https://docs.djangoproject.com/en/4.2/topics/testing/)
- [测试代码组织规范](.kiro/steering/testing.md)
