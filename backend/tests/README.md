# 测试文档

## 目录结构

```
tests/
├── __init__.py
├── conftest.py              # pytest配置和共享fixtures
├── README.md                # 本文件
├── unit/                    # 单元测试
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_serializers.py
│   └── test_utils.py
├── integration/             # 集成测试
│   ├── __init__.py
│   ├── test_api_auth.py    # 认证API测试
│   ├── test_api_approval.py
│   └── test_workflows.py
├── e2e/                     # 端到端测试
│   ├── __init__.py
│   └── test_store_lifecycle.py
└── fixtures/                # 测试数据
    ├── __init__.py
    ├── users.json
    └── stores.json
```

## 运行测试

### 安装依赖

首先确保安装了测试相关的依赖：

```bash
pip install pytest pytest-django pytest-cov factory-boy faker
```

### 运行所有测试

```bash
# 在backend目录下运行
pytest
```

### 运行特定类型的测试

```bash
# 只运行单元测试
pytest -m unit

# 只运行集成测试
pytest -m integration

# 只运行端到端测试
pytest -m e2e
```

### 运行特定文件或测试

```bash
# 运行特定文件
pytest tests/integration/test_api_auth.py

# 运行特定测试类
pytest tests/integration/test_api_auth.py::TestUserAuthentication

# 运行特定测试方法
pytest tests/integration/test_api_auth.py::TestUserAuthentication::test_login_with_username_and_password
```

### 查看详细输出

```bash
# 显示详细输出
pytest -v

# 显示print语句
pytest -s

# 显示详细输出和print语句
pytest -vs
```

### 生成覆盖率报告

```bash
# 生成终端覆盖率报告
pytest --cov=. --cov-report=term

# 生成HTML覆盖率报告
pytest --cov=. --cov-report=html

# 查看HTML报告
# 打开 htmlcov/index.html
```

### 并行运行测试

```bash
# 安装pytest-xdist
pip install pytest-xdist

# 使用多个CPU核心运行测试
pytest -n auto
```

## 编写测试

### 测试命名规范

- 测试文件：`test_*.py`
- 测试类：`Test*`
- 测试方法：`test_*`

### 使用fixtures

```python
def test_example(test_user, api_client):
    """使用共享的fixtures"""
    response = api_client.get('/api/profile/')
    assert response.status_code == 200
```

### 标记测试

```python
import pytest

@pytest.mark.unit
def test_model_creation():
    """单元测试示例"""
    pass

@pytest.mark.integration
def test_api_endpoint():
    """集成测试示例"""
    pass

@pytest.mark.slow
def test_long_running_process():
    """慢速测试示例"""
    pass
```

### AAA模式

```python
def test_user_login(api_client, test_user):
    """测试用户登录"""
    # Arrange - 准备测试数据
    login_data = {
        'username': 'testuser',
        'password': 'testpass123'
    }
    
    # Act - 执行操作
    response = api_client.post('/api/auth/login/', login_data)
    
    # Assert - 验证结果
    assert response.status_code == 200
    assert 'access_token' in response.json()['data']
```

## 可用的Fixtures

### 数据库相关

- `db`: Django数据库访问
- `test_department`: 测试部门
- `test_role`: 测试角色
- `test_user`: 普通测试用户
- `admin_user`: 管理员测试用户

### 客户端相关

- `api_client`: 未认证的API客户端
- `authenticated_client`: 已认证的API客户端（普通用户）
- `admin_client`: 已认证的API客户端（管理员）

## 持续集成

测试应该在以下情况下自动运行：

1. 提交代码前（pre-commit hook）
2. 创建Pull Request时
3. 合并到主分支前

## 最佳实践

1. 每个测试应该独立运行
2. 使用描述性的测试名称
3. 遵循AAA模式（Arrange-Act-Assert）
4. 不要在测试中使用真实的外部服务
5. 使用fixtures来共享测试数据
6. 保持测试简单和专注
7. 定期运行测试并保持绿色状态
8. 为核心业务逻辑编写测试
9. 测试边界条件和错误情况
10. 保持测试代码的可维护性

## 故障排查

### 测试失败

```bash
# 查看详细的失败信息
pytest -vv --tb=long

# 在第一个失败时停止
pytest -x

# 重新运行失败的测试
pytest --lf
```

### 数据库问题

```bash
# 使用新的测试数据库
pytest --create-db

# 重用测试数据库
pytest --reuse-db
```

### 调试测试

```python
def test_example():
    import pdb; pdb.set_trace()  # 设置断点
    # 测试代码
```

或使用pytest的调试选项：

```bash
pytest --pdb  # 在失败时进入调试器
```
