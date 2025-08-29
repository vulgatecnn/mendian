# 好饭碗门店生命周期管理系统 - 后端服务

基于 Node.js + Fastify + PostgreSQL + Redis 的企业级门店管理系统后端 API 服务。

## 技术栈

- **框架**: Fastify 4.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis (ioredis)
- **认证**: JWT + 企业微信OAuth
- **文档**: Swagger/OpenAPI
- **测试**: Vitest + Supertest
- **代码规范**: ESLint + Prettier

## 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   ├── controllers/      # 控制器层
│   │   └── v1/          # API v1 版本
│   ├── services/        # 业务逻辑层
│   │   └── business/    # 业务服务
│   ├── repositories/    # 数据访问层
│   ├── middleware/      # 中间件
│   ├── plugins/         # Fastify 插件
│   ├── routes/          # 路由定义
│   │   └── v1/         # API v1 路由
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型
│   └── server.ts       # 服务器入口
├── prisma/
│   ├── schema.prisma   # 数据库架构
│   └── seed.ts         # 种子数据
├── tests/              # 测试文件
└── dist/               # 构建输出
```

## 核心功能模块

### 1. 认证授权系统
- JWT token 认证
- 企业微信OAuth集成 
- RBAC权限控制
- Redis会话管理

### 2. 业务模块
- **开店计划管理**: 年度/季度开店规划
- **拓店管理**: 候选点位、跟进记录
- **开店筹备**: 工程项目、验收管理
- **门店档案**: 门店主数据、证照管理
- **门店运营**: 付款项、资产管理
- **审批中心**: 可配置审批流程引擎
- **基础数据**: 区域、主体、供应商管理

### 3. 系统管理
- 用户角色权限管理
- 企业微信数据同步
- 系统审计日志
- API接口文档

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 12
- Redis >= 6.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量文件并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接、Redis、企业微信等参数。

### 数据库设置

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 运行数据库迁移
pnpm db:migrate

# 填充种子数据
pnpm db:seed
```

### 启动开发服务器

```bash
# 开发模式（带热重载）
pnpm dev

# 开发模式（带日志美化）
pnpm dev:bootstrap
```

服务启动后访问：
- API服务: http://localhost:7100
- API文档: http://localhost:7100/docs
- 健康检查: http://localhost:7100/health

## 开发脚本

```bash
# 开发
pnpm dev                    # 启动开发服务器
pnpm dev:bootstrap         # 启动服务器（带美化日志）

# 构建
pnpm build                 # 构建生产版本
pnpm start                 # 启动生产服务器

# 测试
pnpm test                  # 运行测试
pnpm test:coverage         # 运行测试并生成覆盖率报告
pnpm test:watch           # 监视模式运行测试

# 代码质量
pnpm lint                  # 检查代码规范
pnpm lint:fix             # 自动修复代码问题
pnpm format               # 格式化代码
pnpm typecheck            # TypeScript 类型检查

# 数据库
pnpm db:generate          # 生成 Prisma 客户端
pnpm db:migrate           # 运行数据库迁移
pnpm db:studio            # 打开 Prisma Studio
pnpm db:seed              # 运行种子数据
pnpm db:reset             # 重置数据库并重新填充数据
```

## API 文档

启动服务后，访问 http://localhost:7100/docs 查看完整的 API 文档。

### 主要 API 端点

```
# 认证相关
POST   /api/v1/auth/login              # 用户登录
POST   /api/v1/auth/wechat/callback    # 企业微信OAuth回调
POST   /api/v1/auth/refresh            # 刷新token
GET    /api/v1/auth/me                 # 获取当前用户信息

# 开店计划
GET    /api/v1/store-plans             # 获取开店计划列表
POST   /api/v1/store-plans             # 创建开店计划
GET    /api/v1/store-plans/:id         # 获取开店计划详情
PUT    /api/v1/store-plans/:id         # 更新开店计划
DELETE /api/v1/store-plans/:id         # 删除开店计划

# 拓店管理
GET    /api/v1/expansion/locations     # 获取候选点位列表
POST   /api/v1/expansion/locations     # 添加候选点位
GET    /api/v1/expansion/follow-ups    # 获取跟进记录列表
POST   /api/v1/expansion/follow-ups    # 添加跟进记录

# 其他业务模块 API...
```

## 部署

### 生产构建

```bash
pnpm build
```

### 环境变量

生产环境需要配置以下关键环境变量：

```bash
NODE_ENV=production
PORT=7100
DATABASE_URL="postgresql://user:password@host:5432/database"
REDIS_HOST=redis-host
JWT_SECRET=your-production-jwt-secret
WECHAT_WORK_CORP_ID=your-corp-id
WECHAT_WORK_CORP_SECRET=your-corp-secret
```

### Docker 部署

```bash
# 构建镜像
docker build -t mendian-backend .

# 运行容器
docker run -p 7100:7100 --env-file .env mendian-backend
```

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint + Prettier 规范
- 函数和类采用驼峰命名
- 常量采用大写下划线命名

### 目录规范
- controllers: 处理HTTP请求，调用service
- services: 业务逻辑实现
- repositories: 数据访问抽象
- middleware: 请求处理中间件
- utils: 纯函数工具类

### Git 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建配置等
```

## 测试

### 单元测试
```bash
pnpm test
```

### 集成测试
```bash
pnpm test:integration
```

### 测试覆盖率
```bash
pnpm test:coverage
```

## 许可证

MIT License

## 联系我们

- 项目负责人: 好饭碗开发团队
- 邮箱: dev@haofanwan.com