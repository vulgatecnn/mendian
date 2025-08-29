# 测试文件管理规范

## 概述

本文档定义了好饭碗门店生命周期管理系统的测试文件组织结构和管理规范。

## 目录结构

```
test/
├── unit/                    # 单元测试
│   ├── api/                 # API单元测试
│   ├── components/          # 组件单元测试
│   ├── services/            # 服务层单元测试
│   └── encoding/            # 编码相关测试
├── integration/             # 集成测试
│   ├── api/                 # API集成测试
│   └── database/            # 数据库集成测试
├── e2e/                     # 端到端测试
│   ├── user-flows/          # 用户流程测试
│   └── cross-platform/      # 跨平台测试
├── performance/             # 性能测试
│   ├── load-tests/          # 负载测试
│   └── memory-tests/        # 内存测试
├── fixtures/                # 测试数据
│   ├── test-scenarios/      # 测试场景数据
│   └── user-data/           # 用户测试数据
└── mocks/                   # Mock文件
    ├── apis/                # 外部API Mock
    ├── services/            # 内部服务Mock
    └── servers/             # 测试服务器Mock
```

## 文件命名规范

### 测试文件命名格式

1. **单元测试**: `[FileName].test.[ext]`
2. **集成测试**: `[FileName].integration.test.[ext]`
3. **E2E测试**: `[FileName].e2e.test.[ext]`
4. **性能测试**: `[FileName].perf.test.[ext]`
5. **Mock文件**: `[ServiceName].mock.[ext]`

### 示例

```
# 单元测试
expansion-api.unit.test.js
StorePlanList.test.tsx
auth.service.test.ts

# 集成测试
expansion-api.integration.test.js
StorePlan.repository.integration.test.ts

# E2E测试
store-plan-complete-workflow.e2e.test.ts
expansion-user-journey.e2e.test.ts

# Mock文件
wechatWork.api.mock.ts
expansion.service.mock.ts
express-test-server.mock.js
```

## 测试类型详解

### 1. 单元测试 (Unit Tests)

**目的**: 测试单个函数、类或组件的功能

**要求**:
- 隔离外部依赖，使用Mock
- 覆盖所有分支和边界条件
- 快速执行，单个测试 < 100ms
- 覆盖率要求 > 80%

**适用场景**:
- 业务逻辑函数
- 工具函数
- React组件
- 服务类方法

### 2. 集成测试 (Integration Tests)

**目的**: 测试多个模块之间的交互

**要求**:
- 测试真实的数据流向
- 使用测试数据库
- 验证数据一致性
- 自动清理测试数据

**适用场景**:
- API接口测试
- 数据库操作测试
- 第三方服务集成
- 微服务间通信

### 3. E2E测试 (End-to-End Tests)

**目的**: 测试完整的用户使用流程

**要求**:
- 模拟真实用户操作
- 跨浏览器兼容性
- 移动端适配测试
- 数据驱动测试

**适用场景**:
- 用户登录流程
- 开店计划创建流程
- 拓店管理完整流程
- 审批流程测试

### 4. 性能测试 (Performance Tests)

**目的**: 验证系统性能指标

**要求**:
- 负载测试
- 并发测试
- 内存泄漏检测
- 响应时间监控

**性能指标**:
- API响应时间 < 200ms
- 页面加载时间 < 3s
- 并发用户数 > 100
- 内存使用 < 512MB

## 测试数据管理

### 测试数据分类

1. **静态数据** (`fixtures/`)
   - 用户测试数据
   - 业务场景数据
   - 基础数据字典

2. **动态数据**
   - 测试过程中生成
   - 随机数据生成
   - API响应数据

### 数据管理原则

1. **数据独立性**: 每个测试用例使用独立数据
2. **数据清理**: 测试后自动清理临时数据
3. **数据隐私**: 不包含真实用户数据
4. **版本控制**: 测试数据随代码版本管理

## Mock服务管理

### Mock类型

1. **API Mock** (`mocks/apis/`)
   - 企业微信API
   - 支付接口
   - 短信服务
   - 地图API

2. **服务Mock** (`mocks/services/`)
   - 数据库访问层
   - 缓存服务
   - 文件服务
   - 通知服务

3. **服务器Mock** (`mocks/servers/`)
   - 测试API服务器
   - 模拟WebSocket服务
   - 文件上传服务

### Mock实现要求

1. **接口一致性**: Mock与真实服务接口保持一致
2. **场景覆盖**: 包含成功、失败、超时等场景
3. **数据真实**: 使用接近真实的测试数据
4. **可配置性**: 支持参数化配置

## 测试脚本命令

### 根目录测试命令

```bash
# 全部测试 (包含前端和后端)
pnpm test

# 测试覆盖率报告
pnpm test:coverage

# 单元测试
pnpm test:unit

# 集成测试
pnpm test:integration

# 编码测试
pnpm test:encoding

# E2E测试
pnpm test:e2e

# 测试服务器
pnpm test:mock-server
pnpm test:simple-server

# 旧版测试集合
pnpm test:all-legacy
```

### 包级别测试命令

```bash
# 前端测试
pnpm --filter @mendian/frontend test
pnpm --filter @mendian/frontend test:e2e
pnpm --filter @mendian/frontend test:component

# 后端测试
pnpm --filter @mendian/backend test
pnpm --filter @mendian/backend test:unit
pnpm --filter @mendian/backend test:integration
```

## 测试环境配置

### 环境变量

```bash
# 测试环境
NODE_ENV=test

# 数据库配置
DATABASE_URL=postgresql://test:test@localhost:5432/mendian_test

# Redis配置
REDIS_URL=redis://localhost:6379/1

# API基础路径
API_BASE_URL=http://localhost:8500

# 前端服务地址
FRONTEND_URL=http://localhost:8403
```

### CI/CD集成

```yaml
# GitHub Actions 示例
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 最佳实践

### 测试编写原则

1. **AAA模式**: Arrange(准备) - Act(执行) - Assert(断言)
2. **可读性**: 测试名称和描述清晰明了
3. **独立性**: 测试用例之间相互独立
4. **重复性**: 测试结果可重复
5. **快速性**: 单个测试快速执行

### 代码覆盖率目标

- **单元测试**: > 80%
- **集成测试**: > 70%
- **E2E测试**: 覆盖主要业务流程
- **关键业务**: > 90%

### 测试维护

1. **定期更新**: 随代码变更同步更新测试
2. **重构清理**: 定期清理废弃和重复测试
3. **性能监控**: 监控测试执行时间和资源消耗
4. **文档更新**: 保持测试文档的时效性

## 故障排查

### 常见问题

1. **测试失败**
   - 检查环境配置
   - 验证数据库连接
   - 查看日志输出

2. **性能问题**
   - 检查测试数据量
   - 优化数据库查询
   - 使用连接池

3. **数据问题**
   - 确认数据清理
   - 检查数据格式
   - 验证测试环境

### 日志和调试

```bash
# 启用详细日志
DEBUG=test:* npm test

# 查看测试输出
npm test -- --verbose

# 生成测试报告
npm test -- --reporter=json > test-results.json
```

## 参考资料

- [Jest 测试框架](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright E2E](https://playwright.dev/)
- [Vitest 测试工具](https://vitest.dev/)
- [企业级测试最佳实践](https://martinfowler.com/testing/)

---

*本规范随项目发展持续更新，所有开发人员应遵循此规范进行测试开发*
