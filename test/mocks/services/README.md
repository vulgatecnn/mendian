# 服务Mock目录

本目录用于存放内部服务的Mock实现。

## 目录结构

- `business/` - 业务服务Mock
- `auth/` - 认证服务Mock
- `notification/` - 通知服务Mock
- `file/` - 文件服务Mock
- `email/` - 邮件服务Mock

## 命名规范

Mock文件命名格式：`[ServiceName].service.mock.ts`

示例：
- `storePlan.service.mock.ts`
- `expansion.service.mock.ts`
- `auth.service.mock.ts`
- `notification.service.mock.ts`

## Mock 要求

- 实现与真实服务相同的接口
- 支持各种测试场景
- 提供可配置的响应数据
- 包含详细的注释和使用说明
