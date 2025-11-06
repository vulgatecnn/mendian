# 图标导入验证测试

## 概述

本测试套件用于验证项目中使用的所有Arco Design图标能够成功导入，在开发阶段提前发现图标导入问题，避免运行时错误。

## 文件结构

```
frontend/src/test/
├── icon-imports.test.ts          # 图标导入验证测试
├── utils/
│   └── icon-validator.ts         # 图标验证工具函数
└── README.md                      # 本文档
```

## 运行测试

### 运行图标导入测试

```bash
# 进入前端目录
cd frontend

# 运行图标导入测试
pnpm test icon-imports.test.ts

# 或使用npm
npm test icon-imports.test.ts
```

### 运行所有测试

```bash
pnpm test
```

## 测试内容

### 1. 主要测试

- **所有使用的图标导入测试**：验证项目中使用的所有图标都能成功导入
- **常用操作图标测试**：验证常用的操作图标（增删改查等）
- **状态图标测试**：验证状态相关的图标
- **问题图标测试**：专门测试已知可能存在问题的图标（如IconClock）

### 2. 工具函数测试

- **单个图标验证**：测试validateIconImport函数
- **批量图标验证**：测试validateIconImports函数
- **替代方案查找**：测试findIconAlternative函数
- **报告生成**：测试generateIconReport函数

## 测试报告示例

测试运行后会生成清晰的报告：

```
图标导入验证报告
==================
总计: 37 个图标
成功: 37 个
失败: 0 个
```

如果有失败的图标，报告会显示：

```
图标导入验证报告
==================
总计: 39 个图标
成功: 38 个
失败: 1 个

失败的图标:
  - IconClock: 图标 IconClock 在 @arco-design/web-react/icon 中不存在
    建议替代: IconClockCircle
```

## 图标替代方案

当某个图标不存在时，系统会自动提供替代方案。当前已知的替代映射：

| 原图标 | 替代图标 | 说明 |
|--------|---------|------|
| IconClock | IconClockCircle | IconClock在当前版本不存在 |
| IconWechat | IconWechatpay | 名称拼写差异 |

## 添加新图标

如果项目中使用了新的图标，需要将其添加到 `icon-validator.ts` 的 `USED_ICONS` 数组中：

```typescript
export const USED_ICONS = [
  // ... 现有图标
  'IconNewIcon', // 添加新图标
]
```

## 添加替代方案

如果发现某个图标不存在，可以在 `ICON_ALTERNATIVES` 中添加替代方案：

```typescript
export const ICON_ALTERNATIVES: Record<string, string> = {
  'IconOldName': 'IconNewName',
  // 添加新的替代方案
}
```

## 故障排查

### 测试失败

如果测试失败，检查以下内容：

1. **图标名称拼写**：确认图标名称拼写正确
2. **Arco Design版本**：检查package.json中的@arco-design/web-react版本
3. **图标是否存在**：查看[Arco Design图标文档](https://arco.design/react/components/icon)
4. **使用替代方案**：如果图标不存在，使用测试报告中建议的替代图标

### 导入错误

如果在代码中遇到图标导入错误：

1. 运行图标导入测试查看详细报告
2. 根据报告中的建议替换问题图标
3. 确保使用正确的导入语法：

```typescript
import { IconName } from '@arco-design/web-react/icon'
```

## 最佳实践

1. **在提交代码前运行测试**：确保新添加的图标能够正确导入
2. **定期更新图标列表**：当添加新组件时，更新USED_ICONS列表
3. **使用替代方案**：对于不存在的图标，优先使用系统建议的替代方案
4. **统一导入风格**：使用命名导入，避免使用通配符导入

## 相关文档

- [Arco Design 图标文档](https://arco.design/react/components/icon)
- [Vitest 测试框架](https://vitest.dev/)
- [项目测试规范](../../../.kiro/steering/testing.md)
