# 服务层单元测试目录

本目录用于存放后端服务层的单元测试文件。

## 目录结构

- `business/` - 业务逻辑服务测试
- `auth/` - 认证相关服务测试
- `wechat/` - 企业微信服务测试
- `redis/` - Redis服务测试
- `permission/` - 权限服务测试

## 命名规范

测试文件命名格式：`[ServiceName].service.test.ts`

示例：
- `storePlan.service.test.ts`
- `expansion.service.test.ts`
- `auth.service.test.ts`
- `wechatWork.service.test.ts`

## 测试要求

- 测试所有公共方法
- Mock 数据库和外部依赖
- 覆盖异常情况和边界条件
- 测试覆盖率要求 > 85%
