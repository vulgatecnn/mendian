# 数据库集成测试目录

本目录用于存放数据库集成测试文件。

## 目录结构

- `repositories/` - 数据访问层测试
- `migrations/` - 数据库迁移测试
- `models/` - 数据模型测试
- `transactions/` - 事务测试

## 命名规范

测试文件命名格式：`[EntityName].repository.integration.test.ts`

示例：
- `StorePlan.repository.integration.test.ts`
- `CandidateLocation.repository.integration.test.ts`
- `User.repository.integration.test.ts`

## 测试要求

- 使用测试数据库
- 测试数据库CRUD操作
- 验证数据一致性和约束
- 测试事务的正确性
- 清理测试数据
