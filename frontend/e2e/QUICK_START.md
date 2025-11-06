# E2E测试快速启动指南

## 快速开始

### 1. 准备环境

确保以下服务正在运行：

```bash
# 终端1: 启动后端服务
cd backend
python manage.py runserver

# 终端2: 启动前端服务
cd frontend
pnpm dev
```

### 2. 准备测试数据

确保数据库中存在以下测试数据：

**测试用户**:
- 用户名: `admin`, 密码: `admin123` (管理员)
- 用户名: `approver`, 密码: `approver123` (审批人)
- 用户名: `planner`, 密码: `planner123` (计划员)

**基础数据**:
- 至少1个经营区域
- 至少1个门店类型
- 至少1个供应商

### 3. 运行测试

```bash
# 进入前端目录
cd frontend

# 运行所有E2E测试
pnpm test:e2e

# 或者运行特定测试
pnpm test:e2e store-plan-flow.spec.ts
```

### 4. 查看结果

测试完成后，查看报告：

```bash
pnpm test:e2e:report
```

截图保存在: `playwright-report/screenshots/`

## 常见问题

### Q: 测试失败，提示"登录失败"

**A**: 检查测试用户是否存在，密码是否正确。可以在 `helpers/test-data.ts` 中修改测试用户信息。

### Q: 测试超时

**A**: 确保前后端服务都在运行，网络连接正常。可以在 `playwright.config.ts` 中增加超时时间。

### Q: 找不到元素

**A**: 前端组件可能还没有添加 `data-testid` 属性。需要在对应的组件中添加这些属性。

### Q: 如何调试测试

**A**: 使用以下命令以调试模式运行：

```bash
# 显示浏览器窗口
pnpm test:e2e --headed

# 使用调试模式
pnpm test:e2e --debug

# 使用UI模式
pnpm test:e2e:ui
```

## 下一步

1. 根据实际的前端实现，调整测试中的选择器
2. 在前端组件中添加 `data-testid` 属性
3. 根据实际的API响应，调整测试数据
4. 运行测试并修复发现的问题
5. 将测试集成到CI/CD流程

## 需要帮助？

查看详细文档: [README.md](./README.md)
