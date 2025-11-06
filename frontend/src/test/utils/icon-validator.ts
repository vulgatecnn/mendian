/**
 * 图标验证工具函数
 * 用于验证Arco Design图标的导入和使用
 */

/**
 * 验证图标导入结果
 */
export interface IconValidationResult {
  success: boolean
  iconName: string
  error?: Error
}

/**
 * 图标使用信息
 */
export interface IconUsage {
  iconName: string
  filePath: string
  lineNumber: number
}

/**
 * 图标替代映射表
 * 当某个图标不存在时，提供替代方案
 * 
 * 格式：{ '不存在的图标名': '替代图标名' }
 * 
 * 已验证的问题图标（2025-11-04）：
 * - IconClock: ❌ 不存在于 Arco Design 图标库
 *   替代方案: IconClockCircle ✅ 已验证可用
 *   验证方法: 检查 node_modules/@arco-design/web-react/icon/react-icon 目录
 *            检查 index.d.ts 类型定义文件
 *            运行动态导入测试
 * 
 * - IconWechat: ✅ 实际可用（保留替代方案以防未来版本变化）
 *   替代方案: IconWechatpay ✅ 已验证可用
 * 
 * 详细验证报告: 参见 frontend/ICON_VERIFICATION_REPORT.md
 */
export const ICON_ALTERNATIVES: Record<string, string> = {
  'IconClock': 'IconClockCircle',  // ✅ 已验证：IconClock 不存在，IconClockCircle 可用
  'IconWechat': 'IconWechatpay',   // ✅ 已验证：两者都可用，保留作为备选
  // 可以根据实际情况添加更多替代方案
}

/**
 * 项目中使用的所有图标列表
 * 从代码扫描中提取
 * 
 * 注意：此列表应定期更新以反映项目中实际使用的图标
 * 可以使用 getUsedIcons() 函数自动扫描项目获取最新列表
 * 
 * 最后更新: 2025-11-04
 * 扫描方法: 运行 node scripts/scan-icons.js
 */
export const USED_ICONS = [
  'IconApps',
  'IconArchive',
  'IconArrowLeft',
  'IconBook',
  'IconBranch',
  'IconCalendar',
  'IconCamera',
  'IconCheck',
  'IconCheckCircle',
  'IconCheckCircleFill',
  'IconClockCircle',
  'IconClose',
  'IconCloseCircle',
  'IconCloseCircleFill',
  'IconCopy',
  'IconDashboard',
  'IconDelete',
  'IconDesktop',
  'IconDown',
  'IconDownload',
  'IconEdit',
  'IconEmail',
  'IconEmpty',
  'IconExclamation',
  'IconExclamationCircleFill',
  'IconExport',
  'IconEye',
  'IconFile',
  'IconFilter',
  'IconFullscreen',
  'IconHistory',
  'IconHome',
  'IconImport',
  'IconInfo',
  'IconInfoCircle',
  'IconInfoCircleFill',
  'IconLanguage',
  'IconLeft',
  'IconLink',
  'IconLocation',
  'IconLock',
  'IconMessage',
  'IconMobile',
  'IconMore',
  'IconNotification',
  'IconPhone',
  'IconPlus',
  'IconPoweroff',
  'IconRefresh',
  'IconRight',
  'IconSafe',
  'IconSave',
  'IconSearch',
  'IconSettings',
  'IconStar',
  'IconStarFill',
  'IconStorage',
  'IconSwap',
  'IconSync',
  'IconTool',
  'IconUnlock',
  'IconUp',
  'IconUpload',
  'IconUser',
  'IconUserAdd',
  'IconUserGroup',
  'IconWechat',
  'IconWifi',
]

/**
 * 需要特别验证的问题图标
 * 这些图标可能不存在，需要使用替代方案
 * 
 * 验证状态（2025-11-04）：
 * - IconClock: ❌ 确认不存在，必须使用 IconClockCircle
 * - IconWechat: ✅ 确认可用，但保留在列表中以监控未来版本
 */
export const PROBLEMATIC_ICONS = [
  'IconClock',    // ❌ 不存在
  'IconWechat',   // ✅ 可用（监控中）
]

/**
 * 已确认不存在的图标列表
 * 这些图标在 Arco Design 当前版本中不存在
 * 必须使用 ICON_ALTERNATIVES 中的替代方案
 * 
 * 验证日期: 2025-11-04
 * 验证版本: @arco-design/web-react (当前安装版本)
 */
export const UNAVAILABLE_ICONS = [
  'IconClock',  // 使用 IconClockCircle 替代
]

/**
 * 验证单个图标是否可以从Arco Design导入
 */
export async function validateIconImport(iconName: string): Promise<IconValidationResult> {
  try {
    // 动态导入图标模块
    const iconModule = await import('@arco-design/web-react/icon')
    
    // 检查图标是否存在
    if (iconName in iconModule) {
      return {
        success: true,
        iconName,
      }
    } else {
      throw new Error(`图标 ${iconName} 在 @arco-design/web-react/icon 中不存在`)
    }
  } catch (error) {
    return {
      success: false,
      iconName,
      error: error as Error,
    }
  }
}

/**
 * 批量验证图标导入
 */
export async function validateIconImports(iconNames: string[]): Promise<IconValidationResult[]> {
  const results = await Promise.all(
    iconNames.map(iconName => validateIconImport(iconName))
  )
  return results
}

/**
 * 查找图标的替代方案
 */
export function findIconAlternative(iconName: string): string | null {
  return ICON_ALTERNATIVES[iconName] || null
}

/**
 * 获取所有失败的图标
 */
export function getFailedIcons(results: IconValidationResult[]): IconValidationResult[] {
  return results.filter(result => !result.success)
}

/**
 * 生成图标验证报告
 */
export function generateIconReport(results: IconValidationResult[]): string {
  const failed = getFailedIcons(results)
  const total = results.length
  const successCount = total - failed.length
  
  let report = `\n图标导入验证报告\n`
  report += `==================\n`
  report += `总计: ${total} 个图标\n`
  report += `成功: ${successCount} 个\n`
  report += `失败: ${failed.length} 个\n\n`
  
  if (failed.length > 0) {
    report += `失败的图标:\n`
    failed.forEach(result => {
      report += `  - ${result.iconName}: ${result.error?.message}\n`
      const alternative = findIconAlternative(result.iconName)
      if (alternative) {
        report += `    建议替代: ${alternative}\n`
      }
    })
  }
  
  return report
}

/**
 * 扫描项目中所有使用的图标
 * 从源代码文本中提取图标导入语句
 * 
 * 注意：此函数需要在 Node.js 环境中运行（如构建脚本或测试预处理）
 * 在浏览器测试环境中，请使用预定义的 USED_ICONS 列表
 * 
 * @param sourceCode - 源代码文本内容
 * @param filePath - 文件路径（用于报告）
 * @returns 图标使用信息数组
 */
export function getUsedIconsFromSource(sourceCode: string, filePath: string = 'unknown'): IconUsage[] {
  const iconUsages: IconUsage[] = []
  const iconPattern = /Icon[A-Z][a-zA-Z]+/g
  const importPattern = /import\s+{([^}]+)}\s+from\s+['"]@arco-design\/web-react\/icon['"]/g
  
  const lines = sourceCode.split('\n')
  
  // 方法1: 从 import 语句中提取图标
  let match: RegExpExecArray | null
  while ((match = importPattern.exec(sourceCode)) !== null) {
    const imports = match[1]
    const icons = imports.split(',').map(s => s.trim())
    
    icons.forEach((iconName: string) => {
      if (iconName.startsWith('Icon')) {
        // 找到图标所在的行号
        const lineNumber = sourceCode.substring(0, match!.index).split('\n').length
        iconUsages.push({
          iconName,
          filePath,
          lineNumber
        })
      }
    })
  }
  
  // 方法2: 从代码中提取所有 Icon 组件使用
  lines.forEach((line: string, index: number) => {
    const matches = line.match(iconPattern)
    if (matches) {
      matches.forEach((iconName: string) => {
        // 避免重复添加（如果已经从 import 中提取过）
        const exists = iconUsages.some(
          usage => usage.iconName === iconName && usage.filePath === filePath
        )
        if (!exists) {
          iconUsages.push({
            iconName,
            filePath,
            lineNumber: index + 1
          })
        }
      })
    }
  })
  
  // 去重：同一个图标在同一个文件中只记录一次
  const uniqueUsages = iconUsages.reduce((acc, usage) => {
    const key = `${usage.iconName}:${usage.filePath}`
    if (!acc.has(key)) {
      acc.set(key, usage)
    }
    return acc
  }, new Map<string, IconUsage>())
  
  return Array.from(uniqueUsages.values())
}

/**
 * 从图标使用列表中提取唯一的图标名称
 */
export function extractUniqueIconNames(usages: IconUsage[]): string[] {
  const iconNames = new Set<string>()
  usages.forEach(usage => iconNames.add(usage.iconName))
  return Array.from(iconNames).sort()
}

/**
 * 生成图标使用报告
 */
export function generateIconUsageReport(usages: IconUsage[]): string {
  const uniqueIcons = extractUniqueIconNames(usages)
  
  let report = `\n图标使用情况报告\n`
  report += `==================\n`
  report += `总计: ${uniqueIcons.length} 个不同的图标\n`
  report += `使用次数: ${usages.length} 次\n\n`
  
  report += `图标列表:\n`
  uniqueIcons.forEach(iconName => {
    const count = usages.filter(u => u.iconName === iconName).length
    report += `  - ${iconName} (使用 ${count} 次)\n`
  })
  
  return report
}

/**
 * 批量扫描多个源代码文件
 * 
 * @param sources - 源代码数组，每个元素包含 { code: string, filePath: string }
 * @returns 所有文件的图标使用信息
 */
export function getUsedIconsFromSources(sources: Array<{ code: string; filePath: string }>): IconUsage[] {
  const allUsages: IconUsage[] = []
  
  sources.forEach(source => {
    const usages = getUsedIconsFromSource(source.code, source.filePath)
    allUsages.push(...usages)
  })
  
  return allUsages
}
