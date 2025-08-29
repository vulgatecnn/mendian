# 好饭碗门店生命周期管理系统 - 数据库架构文档

## 概述

本文档描述了好饭碗门店生命周期管理系统的PostgreSQL数据库架构，包括数据模型设计、索引策略、关系约束和迁移指南。

## 技术栈

- **数据库**: PostgreSQL 14+
- **ORM**: Prisma 5.7+
- **语言**: TypeScript
- **连接池**: 推荐使用 PgBouncer

## 数据库架构概览

### 核心业务模块

1. **用户权限模块** - 企业微信集成的RBAC系统
2. **开店计划管理** - 年度/季度开店计划
3. **拓店管理** - 候选点位和跟进管理
4. **开店筹备** - 工程项目和供应商管理
5. **门店档案** - 门店主数据管理
6. **门店运营** - 付款项和资产管理
7. **审批中心** - 可配置的工作流引擎
8. **基础数据** - 地区、公司主体等主数据

## 数据模型设计原则

### 命名规范

- **表名**: 使用小写+下划线，如 `store_plans`, `candidate_locations`
- **字段名**: 使用驼峰命名法，如 `createdAt`, `updatedAt`
- **枚举值**: 使用大写+下划线，如 `DIRECT`, `FRANCHISE`
- **索引名**: 自动生成，遵循Prisma约定

### 数据类型优化

```prisma
// 字符串长度优化
String @db.VarChar(50)    // ID编号、代码
String @db.VarChar(100)   // 名称、标题
String @db.VarChar(200)   // 地址、描述
String @db.VarChar(500)   // 长文本
String @db.Text           // 大文本内容

// 数值类型优化
Int @db.SmallInt          // 小整数 (-32,768 to 32,767)
Decimal @db.Decimal(15,2) // 金额 (最大13位整数+2位小数)
Decimal @db.Decimal(12,2) // 一般金额
Decimal @db.Decimal(10,2) // 面积等小数值
Decimal @db.Decimal(3,1)  // 评分 (0.0-10.0)
```

## 关键枚举类型

```prisma
enum Status {
  ACTIVE
  INACTIVE 
  SUSPENDED
  DELETED
}

enum StoreType {
  DIRECT      // 直营店
  FRANCHISE   // 加盟店
  FLAGSHIP    // 旗舰店
  POPUP       // 快闪店
}

enum ApprovalStatus {
  DRAFT       // 草稿
  SUBMITTED   // 已提交
  PENDING     // 待审批
  APPROVED    // 已批准
  REJECTED    // 已拒绝
  CANCELLED   // 已取消
  RETURNED    // 已退回
}

enum Priority {
  URGENT      // 紧急
  HIGH        // 高
  MEDIUM      // 中
  LOW         // 低
}
```

## 关系设计

### 外键约束策略

```prisma
// 软删除 - 保留历史数据
fields: [parentId], references: [id], onDelete: SetNull

// 限制删除 - 保护重要数据
fields: [regionId], references: [id], onDelete: Restrict

// 级联删除 - 子记录跟随主记录删除
fields: [storeFileId], references: [id], onDelete: Cascade
```

### 多对多关系

```prisma
// 用户角色关系
model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, roleId])
}

// 角色权限关系
model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, permissionId])
}
```

## 索引策略

### 主要查询索引

```prisma
// 复合索引 - 支持常用查询组合
@@index([status, createdAt])
@@index([regionId, status])  
@@index([storeType, status])

// 单列索引 - 支持频繁过滤
@@index([userId])
@@index([createdAt])
@@index([status])

// 唯一复合索引 - 业务约束
@@unique([year, quarter, regionId, entityId, storeType])

// 全文搜索索引
@@fulltext([name, address])
@@fulltext([storeName, brandName])
```

### 性能优化建议

1. **分页查询**: 使用 `cursor-based pagination` 替代 `offset-based`
2. **日期范围查询**: 为时间字段创建索引
3. **JSON字段**: 使用 GIN 索引支持 JSON 查询
4. **统计查询**: 考虑创建物化视图

## 企业微信集成

### 用户同步字段

```prisma
model User {
  wechatId      String  @unique @db.VarChar(100) // 企业微信用户ID
  wechatUnionId String? @unique @db.VarChar(100) // 微信UnionID
  employeeId    String? @unique @db.VarChar(50)  // 工号
  syncedAt      DateTime? // 最后同步时间
}

model Department {
  wechatId    String @unique @db.VarChar(100) // 企业微信部门ID
  fullPath    String? @db.VarChar(500)        // 完整路径
  managerIds  String[] @default([])           // 部门负责人ID数组
  syncedAt    DateTime? // 最后同步时间
}
```

### 同步策略

- **增量同步**: 基于 `syncedAt` 时间戳
- **数据映射**: 企业微信字段到系统字段的映射
- **冲突处理**: 企业微信数据优先，保留本地扩展字段

## 审批流程设计

### 审批模板配置

```json
{
  "steps": [
    {
      "step": 1,
      "name": "部门主管审批",
      "roles": ["OPERATIONS_STAFF"],
      "required": true,
      "timeoutDays": 3
    },
    {
      "step": 2,
      "name": "总监审批", 
      "roles": ["BUSINESS_STAFF"],
      "required": true,
      "timeoutDays": 2
    }
  ],
  "conditions": {
    "amount": {
      "min": 0,
      "max": 100000
    }
  }
}
```

### 审批状态流转

```
DRAFT → SUBMITTED → PENDING → (APPROVED | REJECTED | RETURNED)
                              ↓
                          CANCELLED (任何状态都可取消)
```

## 数据完整性约束

### 业务规则约束

```sql
-- 开店计划约束：已完成数量不能超过计划数量
ALTER TABLE store_plans 
ADD CONSTRAINT chk_completed_count 
CHECK (completed_count <= planned_count);

-- 工程进度约束：进度百分比在0-100之间
ALTER TABLE construction_projects 
ADD CONSTRAINT chk_progress_percentage 
CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- 评分约束：评分在0-10之间
ALTER TABLE candidate_locations 
ADD CONSTRAINT chk_evaluation_score 
CHECK (evaluation_score >= 0 AND evaluation_score <= 10);
```

### 数据一致性检查

```sql
-- 检查孤立记录
SELECT COUNT(*) FROM candidate_locations cl
LEFT JOIN store_plans sp ON cl.store_plan_id = sp.id
WHERE cl.store_plan_id IS NOT NULL AND sp.id IS NULL;

-- 检查数据完整性
SELECT COUNT(*) FROM users u
LEFT JOIN departments d ON u.department_id = d.id  
WHERE u.department_id IS NOT NULL AND d.id IS NULL;
```

## 迁移和部署

### 迁移命令

```bash
# 生成迁移文件
pnpm db:generate

# 开发环境迁移
pnpm db:migrate

# 生产环境迁移
pnpm db:migrate:prod

# 重置数据库（开发环境）
pnpm db:reset

# 执行种子数据
pnpm db:seed

# 打开数据库管理界面
pnpm db:studio
```

### 迁移最佳实践

1. **版本控制**: 所有迁移文件纳入版本控制
2. **备份策略**: 生产环境迁移前必须备份
3. **回滚计划**: 准备回滚脚本和数据恢复方案
4. **测试验证**: 在测试环境充分验证后再应用到生产
5. **分步部署**: 大型迁移分批进行，避免长时间锁表

### 性能监控

```sql
-- 查看慢查询
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC;

-- 查看索引使用情况  
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- 查看表大小
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 安全注意事项

### 数据敏感性

1. **PII数据**: 用户手机号、邮箱等个人信息
2. **商业机密**: 租金价格、合同金额等商业信息  
3. **审计日志**: 完整记录数据变更历史

### 访问控制

```sql
-- 创建只读用户
CREATE USER app_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mendian TO app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

-- 创建应用用户
CREATE USER app_user WITH PASSWORD 'secure_password';  
GRANT CONNECT ON DATABASE mendian TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### 数据加密

- 敏感字段使用应用层加密
- 传输层使用SSL/TLS加密
- 备份文件加密存储

## 总结

本数据库架构设计充分考虑了：

- **业务完整性**: 支持7个核心业务模块的完整数据流转
- **性能优化**: 合理的索引策略和查询优化
- **数据安全**: 完整的权限控制和审计机制  
- **可扩展性**: 支持企业级应用的并发访问需求
- **维护性**: 清晰的命名规范和文档说明

通过Prisma ORM和PostgreSQL的强大功能，为好饭碗门店生命周期管理系统提供了坚实的数据基础。