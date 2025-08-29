# 好饭碗门店管理系统 - 前端应用

基于 React 18 + TypeScript + Vite + Ant Design 5 的企业级门店管理系统前端应用。

## 功能特性

- 🚀 **现代化技术栈**: React 18, TypeScript, Vite, Ant Design 5
- 📱 **响应式设计**: 支持桌面端和移动端
- 🎨 **企业级 UI**: 基于 Ant Design 5 设计系统
- 🔐 **权限管理**: 细粒度权限控制
- 🏪 **业务模块**: 开店计划、拓店管理、门店运营等
- ⚡ **性能优化**: 代码分割、懒加载、缓存策略
- 🛠 **工程化**: ESLint, Prettier, Husky, TypeScript 严格模式

## 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 通用组件
│   │   ├── business/       # 业务组件
│   │   ├── common/         # 通用组件
│   │   └── layout/         # 布局组件
│   ├── pages/              # 页面组件
│   │   ├── dashboard/      # 系统首页
│   │   ├── store-plan/     # 开店计划
│   │   ├── expansion/      # 拓店管理
│   │   ├── preparation/    # 开店筹备
│   │   ├── store-files/    # 门店档案
│   │   ├── operation/      # 门店运营
│   │   ├── approval/       # 审批中心
│   │   └── basic-data/     # 基础数据
│   ├── services/           # API 服务层
│   ├── stores/             # 状态管理 (Zustand)
│   ├── hooks/              # 自定义 Hooks
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型定义
│   ├── constants/          # 常量定义
│   ├── styles/             # 全局样式和主题
│   └── assets/             # 静态资源
├── package.json
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── .env.development        # 环境变量
```

## 开发指南

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 在项目根目录
pnpm install
```

### 开发命令

```bash
# 启动开发服务器 (http://localhost:7000)
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 代码格式化
pnpm lint:fix

# 运行测试
pnpm test

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 技术栈

#### 核心技术

- **React 18**: 前端框架，支持并发特性
- **TypeScript 5**: 类型安全的 JavaScript
- **Vite 4**: 现代化构建工具
- **Ant Design 5**: 企业级 UI 组件库

#### 状态管理

- **Zustand 4**: 轻量级状态管理
- **React Query**: 服务端状态管理和缓存

#### 路由和导航

- **React Router 6**: 客户端路由

#### 样式方案

- **Sass/SCSS**: CSS 预处理器
- **Ant Design 主题定制**: 企业品牌适配

#### 开发工具

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Husky**: Git hooks 管理
- **Vitest**: 单元测试框架

### 开发规范

#### 组件开发

- 使用函数式组件和 Hooks
- 遵循单一职责原则
- 提供完整的 TypeScript 类型定义
- 使用 React.memo 优化性能

#### 状态管理

- 全局状态使用 Zustand
- 服务端状态使用 React Query
- 本地状态使用 useState

#### 样式规范

- 使用 Ant Design 组件优先
- 全局样式放在 `src/styles/`
- 组件样式使用 CSS Modules 或 styled-components
- 响应式设计遵循移动优先原则

#### 代码规范

- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件和文件使用 PascalCase 命名
- 变量和函数使用 camelCase 命名

### 环境配置

#### 环境变量

在 `.env.development` 中配置开发环境变量：

```bash
# API 配置
VITE_API_BASE_URL=http://localhost:7100
VITE_API_TIMEOUT=10000

# 企业微信配置
VITE_WECHAT_CORP_ID=your_corp_id
VITE_WECHAT_AGENT_ID=your_agent_id

# 功能开关
VITE_MOCK_ENABLED=true
VITE_DEBUG_MODE=true
```

#### 代理配置

开发环境 API 代理配置在 `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:7100',
      changeOrigin: true
    }
  }
}
```

### 部署

#### 构建生产版本

```bash
pnpm build
```

构建产物在 `dist/` 目录下。

#### Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 贡献指南

1. 遵循现有的代码风格和规范
2. 提交前运行 `pnpm lint` 和 `pnpm typecheck`
3. 为新功能编写测试用例
4. 提交信息遵循约定式提交规范

### 技术支持

如有问题，请联系开发团队或查看项目文档。