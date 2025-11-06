# 端到端(E2E)测试文档

## 概述

本目录包含使用Playwright编写的端到端测试，用于验证门店生命周期管理系统的完整业务流程。

## 测试覆盖范围

### 1. 开店计划流程测试 (`store-plan-flow.spec.ts`)
- 创建开店计划
- 提交审批
- 审批通过/驳回
- 计划状态更新
- 数据完整性验证

### 2. 拓店流程测试 (`store-expansion-flow.spec.ts`)
- 添加候选位置
- 创建跟进记录
- 更新位置状态
- 上传合同文件
- 合同审批
- 签约流程

### 3. 施工管理流程测试 (`construction-flow.spec.ts`)
- 创建施工项目
- 分配供应商
- 记录施工进度
- 上传施工照片
- 工程验收
- 门店交接

### 4. 审批流程测试 (`approval-flow.spec.ts`)
- 单级审批
- 多级审批
- 会签审批
- 审批驳回
- 审批撤回
- 审批历史

### 5. 门店档案流程测试 (`store-archive-flow.spec.ts`)
- 创建门店档案
- 录入详细信息
- 关联各阶段记录
- 状态流转
- 生命周期追踪
- 数据导出

## 运行测试

### 前置条件

1. 确保后端服务已启动并运行在 `http://localhost:8000`
2. 确保前端开发服务器已启动并运行在 `http://localhost:5173`
3. 确保测试数据库已准备好测试数据

### 运行所有E2E测试

```bash
cd frontend
pnpm test:e2e
```

### 运行特定测试文件

```bash
# 只运行开店计划流程测试
pnpm test:e2e store-plan-flow.spec.ts

# 只运行审批流程测试
pnpm test:e2e approval-flow.spec.ts
```

### 使用UI模式运行测试

```bash
pnpm test:e2e:ui
```

### 查看测试报告

```bash
pnpm test:e2e:report
```

## 测试数据

测试使用的数据定义在 `helpers/test-data.ts` 中，包括：

- 测试用户账号
- 测试计划数据
- 测试位置数据
- 测试施工数据
- 测试门店数据

## 测试辅助工具

### AuthHelper (`helpers/auth-helper.ts`)
提供用户认证相关的辅助方法：
- `login()` - 登录系统
- `logout()` - 登出系统
- `switchUser()` - 切换用户
- `isLoggedIn()` - 检查登录状态

### ApiHelper (`helpers/api-helper.ts`)
提供API调用相关的辅助方法：
- `authenticatedRequest()` - 发送认证请求
- `createTestPlan()` - 创建测试计划
- `deleteTestPlan()` - 删除测试计划
- `submitApproval()` - 提交审批
- `approvePlan()` - 审批通过
- `rejectPlan()` - 审批拒绝

## 截图和视频

测试执行过程中会自动生成截图和视频：

- 截图保存在 `playwright-report/screenshots/`
- 视频保存在 `playwright-report/videos/`（仅失败时）

## 调试测试

### 使用调试模式

```bash
# 使用调试模式运行测试
pnpm test:e2e --debug
```

### 使用Playwright Inspector

```bash
# 使用Inspector运行特定测试
PWDEBUG=1 pnpm test:e2e store-plan-flow.spec.ts
```

### 查看浏览器操作

```bash
# 显示浏览器窗口
pnpm test:e2e --headed
```

## 最佳实践

1. **测试独立性**：每个测试应该独立运行，不依赖其他测试
2. **数据清理**：使用 `afterEach` 钩子清理测试数据
3. **等待策略**：使用明确的等待条件，避免使用固定延迟
4. **截图记录**：在关键步骤截图，便于问题排查
5. **错误处理**：使用 try-catch 处理可能的错误
6. **选择器稳定性**：优先使用 `data-testid` 属性

## 常见问题

### 测试超时

如果测试经常超时，可以在 `playwright.config.ts` 中增加超时时间：

```typescript
timeout: 60 * 1000, // 60秒
```

### 元素找不到

确保使用稳定的选择器，推荐使用：
- `data-testid` 属性
- 角色选择器 (`role`)
- 文本选择器 (`text`)

### 认证失败

检查：
1. 测试用户账号是否存在
2. 密码是否正确
3. 后端服务是否正常运行

## 持续集成

在CI环境中运行E2E测试：

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
      - name: Run E2E tests
        run: |
          cd frontend
          pnpm test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## 维护指南

### 添加新测试

1. 在 `e2e/` 目录创建新的 `.spec.ts` 文件
2. 导入必要的辅助工具
3. 编写测试用例
4. 添加适当的截图和断言
5. 更新本README文档

### 更新测试数据

修改 `helpers/test-data.ts` 文件中的测试数据定义。

### 更新辅助工具

根据需要更新 `helpers/` 目录中的辅助工具类。

## 参考资料

- [Playwright官方文档](https://playwright.dev/)
- [Playwright最佳实践](https://playwright.dev/docs/best-practices)
- [测试选择器指南](https://playwright.dev/docs/selectors)
