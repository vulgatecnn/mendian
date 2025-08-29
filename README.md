# 好饭碗门店生命周期管理系统

一个现代化的企业级门店管理平台，提供开店计划、拓店管理、筹备管理、门店档案等全生命周期管理功能。

## 🚀 项目特性

- **现代化技术栈**: React 18 + TypeScript + Vite + Ant Design
- **企业级架构**: 微前端架构，支持pnpm workspace
- **完整的权限系统**: RBAC权限控制，支持细粒度权限管理
- **响应式设计**: 支持PC和移动端，适配企业微信
- **完善的测试**: 单元测试 + 集成测试 + E2E测试
- **开发者友好**: 完整的开发工具链和规范

## 📦 项目结构

```
mendian/
├── frontend/           # 前端应用
│   ├── src/
│   │   ├── components/ # 可复用组件
│   │   ├── pages/      # 业务页面
│   │   ├── services/   # 服务层
│   │   ├── stores/     # 状态管理
│   │   └── types/      # 类型定义
│   └── ...
├── shared/             # 共享代码
├── test/              # 测试目录
├── scripts/           # 工具脚本
└── DOCS/              # 项目文档
```

## 🛠 技术栈

### 前端技术
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5.x
- **UI组件库**: Ant Design 5.x
- **状态管理**: Zustand + React Query
- **路由**: React Router 6
- **样式**: Sass + CSS Module
- **测试**: Vitest + Testing Library + MSW

### 开发工具
- **包管理**: pnpm (workspace)
- **代码规范**: ESLint + Prettier
- **Git规范**: Husky + lint-staged + commitlint
- **类型检查**: TypeScript 5.x (strict mode)

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd mendian

# 安装依赖
pnpm install

# 运行开发环境检查
pnpm setup
```

### 开发

```bash
# 启动开发服务器 (前端: http://localhost:7000)
pnpm dev

# 仅启动前端
pnpm --filter frontend dev

# 代码检查和格式化
pnpm lint        # 检查代码规范
pnpm lint:fix    # 自动修复代码规范问题
pnpm format      # 格式化代码
pnpm typecheck   # TypeScript类型检查
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试UI
pnpm --filter frontend test:ui
```

### 构建

```bash
# 构建生产版本
pnpm build

# 预览生产版本
pnpm --filter frontend preview
```

## 📋 开发规范

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint + Prettier配置
- 组件使用函数式组件 + Hooks
- 统一的命名规范 (camelCase, PascalCase)

### Git规范

```bash
# 提交格式
type(scope): description

# 类型说明
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式化
refactor: 重构
test:     测试相关
chore:    其他修改
```

### 目录规范

```
src/
├── components/       # 可复用组件
│   ├── business/    # 业务组件
│   ├── common/      # 通用组件
│   └── layout/      # 布局组件
├── pages/           # 页面组件
├── services/        # 服务层
│   ├── api/        # API服务
│   ├── http/       # HTTP客户端
│   └── mock/       # Mock数据
├── stores/          # 状态管理
├── types/           # 类型定义
└── utils/           # 工具函数
```

## 🏗 架构设计

### 核心业务模块

1. **开店计划管理** - 年度/季度开店规划
2. **拓店管理** - 候选点位管理和商务条件谈判
3. **开店筹备管理** - 工程施工和验收确认
4. **门店档案** - 门店主数据管理
5. **门店运营** - 付款项和资产管理
6. **审批中心** - 全流程审批引擎
7. **基础数据** - 主数据管理

### 权限系统

- **RBAC模型**: 角色-权限-资源三层架构
- **动态权限**: 支持页面级和操作级权限控制
- **权限继承**: 支持角色权限继承和组合

### 状态管理

- **Zustand**: 轻量级全局状态管理
- **React Query**: 服务端状态管理和缓存
- **本地状态**: useState/useReducer处理局部状态

## 🧪 测试策略

### 测试分层

- **单元测试**: 组件和工具函数测试 (>80%覆盖率)
- **集成测试**: API和数据流测试
- **E2E测试**: 用户关键流程测试

### Mock策略

- **MSW**: HTTP请求拦截和Mock
- **Faker.js**: 测试数据生成
- **分层Mock**: API层、数据层分离

## 📝 文档

- [项目需求文档](./DOCS/01-需求分析/)
- [系统架构设计](./DOCS/02-设计阶段/)
- [开发实施计划](./DOCS/03-开发阶段/)
- [API文档](./DOCS/03-开发阶段/API文档/)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📄 许可证

MIT License - 详情请查看 [LICENSE](LICENSE) 文件

## 👥 团队

好饭碗开发团队

---

**项目版本**: v1.0.0  
**最后更新**: 2025-08-28  
**技术支持**: 开发团队