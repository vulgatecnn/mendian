# 端到端测试文档

## 概述

本目录包含门店生命周期管理系统的端到端（E2E）测试，覆盖了从拓店到门店档案的完整业务流程。

## 测试文件

### 1. test_store_expansion_flow.py
**拓店流程端到端测试**

测试场景：
- 创建候选点位 → 创建跟进单 → 录入调研信息 → 执行盈利测算 → 发起报店审批 → 录入签约信息
- 放弃跟进流程

覆盖的功能：
- 候选点位管理
- 跟进单管理
- 盈利测算引擎
- 报店审批流程
- 签约信息录入
- 合同提醒设置

### 2. test_store_preparation_flow.py
**开店筹备流程端到端测试**

测试场景：
- 创建工程单 → 添加里程碑 → 更新里程碑状态 → 执行验收 → 标记整改项 → 创建交付清单 → 上传交付文档 → 完成交付
- 里程碑提醒功能测试

覆盖的功能：
- 工程单管理
- 里程碑管理
- 验收操作
- 整改项管理
- 交付清单管理
- 文档上传
- 里程碑提醒服务

### 3. test_approval_flow.py
**审批流程端到端测试**

测试场景：
- 串行审批流程（审批通过）
- 串行审批流程（审批拒绝）
- 审批撤销
- 审批转交
- 审批关注和评论
- 审批列表查询

覆盖的功能：
- 审批发起
- 审批节点流转
- 审批通过/拒绝
- 审批撤销
- 审批转交
- 审批关注
- 审批评论
- 审批列表查询（待办、已办、抄送、关注、全部）

### 4. test_store_archive_flow.py
**门店档案流程端到端测试**

测试场景：
- 创建完整门店档案（包含跟进单、工程单、交付清单）
- 查看门店完整档案
- 更新门店状态
- 查询和筛选门店档案
- 创建简单门店档案（无关联业务数据）
- 数据权限控制测试
- 门店生命周期状态流转

覆盖的功能：
- 门店档案创建
- 业务数据关联
- 完整档案查询
- 门店状态管理
- 数据权限过滤
- 门店生命周期管理

## 运行测试

### 运行所有端到端测试

```bash
pytest backend/tests/e2e/ -v
```

### 运行特定测试文件

```bash
# 拓店流程测试
pytest backend/tests/e2e/test_store_expansion_flow.py -v

# 筹备流程测试
pytest backend/tests/e2e/test_store_preparation_flow.py -v

# 审批流程测试
pytest backend/tests/e2e/test_approval_flow.py -v

# 门店档案测试
pytest backend/tests/e2e/test_store_archive_flow.py -v
```

### 运行特定测试类

```bash
pytest backend/tests/e2e/test_store_expansion_flow.py::TestStoreExpansionFlow -v
```

### 运行特定测试方法

```bash
pytest backend/tests/e2e/test_store_expansion_flow.py::TestStoreExpansionFlow::test_complete_expansion_flow -v
```

### 使用标记运行测试

```bash
# 只运行端到端测试
pytest -m e2e -v

# 运行端到端测试并显示详细输出
pytest -m e2e -v -s
```

## 测试数据

所有测试使用 pytest fixtures 创建测试数据，测试完成后自动清理。主要 fixtures 包括：

- `test_user`: 普通测试用户
- `admin_user`: 管理员测试用户
- `test_department`: 测试部门
- `test_role`: 测试角色
- `authenticated_client`: 已认证的 API 客户端
- `admin_client`: 管理员 API 客户端

## 测试覆盖率

运行测试并生成覆盖率报告：

```bash
pytest backend/tests/e2e/ --cov=backend --cov-report=html
```

查看覆盖率报告：

```bash
# Windows
start htmlcov/index.html

# Linux/Mac
open htmlcov/index.html
```

## 注意事项

1. **数据库隔离**：每个测试使用独立的数据库事务，测试之间互不影响
2. **测试顺序**：测试可以以任意顺序运行，不依赖其他测试
3. **API 认证**：测试使用真实的 JWT 认证流程
4. **异步任务**：涉及 Celery 任务的测试使用同步执行模式
5. **外部服务**：企业微信等外部服务使用 Mock 数据

## 调试测试

### 查看详细输出

```bash
pytest backend/tests/e2e/ -v -s
```

### 在失败时进入调试器

```bash
pytest backend/tests/e2e/ --pdb
```

### 只运行失败的测试

```bash
pytest backend/tests/e2e/ --lf
```

### 显示最慢的测试

```bash
pytest backend/tests/e2e/ --durations=10
```

## 持续集成

这些测试应该在 CI/CD 流程中自动运行：

```yaml
# .github/workflows/test.yml 示例
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Run E2E tests
        run: |
          pytest backend/tests/e2e/ -v --cov=backend
```

## 测试维护

### 添加新测试

1. 在相应的测试文件中添加新的测试方法
2. 使用描述性的测试方法名（以 `test_` 开头）
3. 遵循 AAA 模式（Arrange, Act, Assert）
4. 添加必要的注释说明测试目的

### 更新测试

当业务逻辑变更时：

1. 更新相关的测试用例
2. 确保测试仍然覆盖关键业务流程
3. 运行所有测试确保没有破坏现有功能

### 测试最佳实践

1. **独立性**：每个测试应该独立运行，不依赖其他测试
2. **可重复性**：测试结果应该是确定的，每次运行结果一致
3. **清晰性**：测试代码应该易读，清楚表达测试意图
4. **完整性**：测试应该覆盖正常流程和异常情况
5. **性能**：避免不必要的数据库查询和外部调用

## 问题排查

### 测试失败常见原因

1. **数据库状态**：确保测试数据库是干净的
2. **认证问题**：检查 JWT Token 是否正确生成
3. **权限问题**：确保测试用户有足够的权限
4. **数据依赖**：检查测试数据是否正确创建
5. **API 变更**：确保测试代码与最新的 API 接口一致

### 获取帮助

如果遇到测试问题：

1. 查看测试输出的错误信息
2. 使用 `-v -s` 参数查看详细输出
3. 使用 `--pdb` 进入调试器
4. 查看相关的业务代码
5. 咨询团队成员
