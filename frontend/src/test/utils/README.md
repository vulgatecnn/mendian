# 图标验证工具

这个目录包含用于验证 Arco Design 图标导入的工具函数。

## 文件说明

### icon-validator.ts

提供图标验证和扫描的核心功能。

## 主要功能

### 1. 验证图标导入

#### `validateIconImport(iconName: string)`

验证单个图标是否可以从 Arco Design 导入。

```typescript
import { validateIconImport } from './icon-validator'

const result = await validateIconImport('IconPlus')
console.log(result)
// { success: true, iconName: 'IconPlus' }
```

#### `validateIconImports(iconNames: string[])`

批量验证多个图标的导入。

```typescript
import { validateIconImports } from './icon-validator'

const icons = ['IconPlus', 'IconEdit', 'IconDelete']
const results = await validateIconImports(icons)
```

### 2. 图标替代方案

#### `findIconAlternative(iconName: string)`

查找不存在图标的替代方案。

```typescript
import { findIconAlternative } from './icon-validator'

const alternative = findIconAlternative('IconClock')
console.log(alternative) // 'IconClockCircle'
```

#### `ICON_ALTERNATIVES`

图标替代映射表，定义了已知问题图标的替代方案。

```typescript
export const ICON_ALTERNATIVES: Record<string, string> = {
  'IconClock': 'IconClockCircle',
  'IconWechat': 'IconWechatpay',
}
```

### 3. 扫描源代码中的图标使用

#### `getUsedIconsFromSource(sourceCode: string, filePath: string)`

从源代码文本中提取所有使用的图标。

```typescript
import { getUsedIconsFromSource } from './icon-validator'

const sourceCode = `
import { IconPlus, IconEdit } from '@arco-design/web-react/icon'

function MyComponent() {
  return <IconPlus />
}
`

const usages = getUsedIconsFromSource(sourceCode, 'MyComponent.tsx')
console.log(usages)
// [
//   { iconName: 'IconPlus', filePath: 'MyComponent.tsx', lineNumber: 2 },
//   { iconName: 'IconEdit', filePath: 'MyComponent.tsx', lineNumber: 2 }
// ]
```

#### `getUsedIconsFromSources(sources: Array<{ code: string; filePath: string }>)`

批量扫描多个源代码文件。

```typescript
import { getUsedIconsFromSources } from './icon-validator'

const sources = [
  { code: '...', filePath: 'Component1.tsx' },
  { code: '...', filePath: 'Component2.tsx' }
]

const allUsages = getUsedIconsFromSources(sources)
```

### 4. 报告生成

#### `generateIconReport(results: IconValidationResult[])`

生成图标验证报告。

```typescript
import { validateIconImports, generateIconReport } from './icon-validator'

const results = await validateIconImports(['IconPlus', 'IconClock'])
const report = generateIconReport(results)
console.log(report)
```

#### `generateIconUsageReport(usages: IconUsage[])`

生成图标使用情况报告。

```typescript
import { getUsedIconsFromSource, generateIconUsageReport } from './icon-validator'

const usages = getUsedIconsFromSource(sourceCode, 'file.tsx')
const report = generateIconUsageReport(usages)
console.log(report)
```

### 5. 辅助函数

#### `getFailedIcons(results: IconValidationResult[])`

从验证结果中筛选出失败的图标。

```typescript
import { validateIconImports, getFailedIcons } from './icon-validator'

const results = await validateIconImports(['IconPlus', 'IconClock'])
const failed = getFailedIcons(results)
```

#### `extractUniqueIconNames(usages: IconUsage[])`

从图标使用列表中提取唯一的图标名称。

```typescript
import { extractUniqueIconNames } from './icon-validator'

const uniqueIcons = extractUniqueIconNames(usages)
```

## 预定义常量

### `USED_ICONS`

项目中使用的所有图标列表。这个列表应该定期更新以反映项目中实际使用的图标。

```typescript
export const USED_ICONS = [
  'IconPlus',
  'IconEdit',
  'IconDelete',
  // ... 更多图标
]
```

### `PROBLEMATIC_ICONS`

已知可能不存在的问题图标列表。

```typescript
export const PROBLEMATIC_ICONS = [
  'IconClock',
  'IconWechat',
]
```

## 使用示例

### 在测试中使用

```typescript
import { describe, it, expect } from 'vitest'
import { validateIconImports, getFailedIcons, USED_ICONS } from './utils/icon-validator'

describe('图标导入测试', () => {
  it('应该能够导入所有使用的图标', async () => {
    const results = await validateIconImports(USED_ICONS)
    const failed = getFailedIcons(results)
    
    expect(failed.length).toBe(0)
  })
})
```

### 在构建脚本中使用

```typescript
import { getUsedIconsFromSource, extractUniqueIconNames } from './icon-validator'
import * as fs from 'fs'

// 读取所有组件文件
const files = ['Component1.tsx', 'Component2.tsx']
const allUsages = []

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf-8')
  const usages = getUsedIconsFromSource(code, file)
  allUsages.push(...usages)
})

// 获取所有唯一的图标名称
const uniqueIcons = extractUniqueIconNames(allUsages)
console.log('项目中使用的图标:', uniqueIcons)
```

## 注意事项

1. **环境限制**：`getUsedIconsFromSource` 函数可以在任何环境中使用，但如果需要扫描文件系统，需要在 Node.js 环境中运行。

2. **更新图标列表**：`USED_ICONS` 列表应该定期更新。可以使用 `getUsedIconsFromSource` 函数扫描项目代码来获取最新的图标列表。

3. **替代方案**：当发现新的问题图标时，应该更新 `ICON_ALTERNATIVES` 映射表。

4. **测试超时**：图标导入测试可能需要较长时间，建议设置合适的超时时间（如 10 秒）。

## 相关文件

- `icon-imports.test.ts` - 图标导入验证测试
- `../README.md` - 测试目录说明文档
