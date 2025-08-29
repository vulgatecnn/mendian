# 组件单元测试目录

本目录用于存放前端组件的单元测试文件。

## 目录结构

- `business/` - 业务组件测试
- `common/` - 通用组件测试
- `layout/` - 布局组件测试
- `expansion/` - 拓店相关组件测试
- `store-plan/` - 开店计划组件测试

## 命名规范

测试文件命名格式：`[ComponentName].test.tsx`

示例：
- `StorePlanList.test.tsx`
- `CandidateLocationForm.test.tsx`
- `FollowUpTimeline.test.tsx`

## 测试要求

- 使用 Testing Library 进行组件测试
- 覆盖主要用户交互场景
- 包含快照测试和功能测试
- 测试覆盖率要求 > 80%
