/**
 * Arco Design 图标导入验证测试
 * 
 * 此测试文件用于验证项目中使用的所有Arco Design图标能够成功导入
 * 在开发阶段提前发现图标导入问题，避免运行时错误
 */

import { describe, it, expect } from 'vitest'
import {
  validateIconImport,
  validateIconImports,
  findIconAlternative,
  getFailedIcons,
  generateIconReport,
  USED_ICONS,
  ICON_ALTERNATIVES,
} from './utils/icon-validator'

describe('Arco Design 图标导入验证', () => {
  /**
   * 测试所有项目中使用的图标能否成功导入
   */
  it('应该能够导入所有使用的图标', async () => {
    // 验证所有图标
    const results = await validateIconImports(USED_ICONS)
    
    // 获取失败的图标
    const failed = getFailedIcons(results)
    
    // 生成报告
    const report = generateIconReport(results)
    console.log(report)
    
    // 如果有失败的图标，显示详细信息
    if (failed.length > 0) {
      const failedNames = failed.map(r => r.iconName).join(', ')
      console.error(`以下图标导入失败: ${failedNames}`)
      
      // 显示替代方案
      failed.forEach(result => {
        const alternative = findIconAlternative(result.iconName)
        if (alternative) {
          console.log(`建议将 ${result.iconName} 替换为 ${alternative}`)
        }
      })
    }
    
    // 断言：所有图标都应该成功导入
    expect(failed.length).toBe(0)
  }, 10000) // 设置10秒超时，确保有足够时间完成所有导入

  /**
   * 测试常用图标能否导入
   */
  it('应该能够导入常用操作图标', async () => {
    const commonIcons = [
      'IconPlus',
      'IconEdit',
      'IconDelete',
      'IconSearch',
      'IconRefresh',
      'IconEye',
      'IconDownload',
      'IconUpload',
    ]
    
    const results = await validateIconImports(commonIcons)
    const failed = getFailedIcons(results)
    
    expect(failed.length).toBe(0)
  })

  /**
   * 测试状态图标能否导入
   */
  it('应该能够导入状态图标', async () => {
    const statusIcons = [
      'IconCheckCircle',
      'IconCloseCircle',
      'IconExclamation',
      'IconInfo',
    ]
    
    const results = await validateIconImports(statusIcons)
    const failed = getFailedIcons(results)
    
    expect(failed.length).toBe(0)
  })

  /**
   * 测试问题图标 - IconClock
   */
  it('应该能够导入IconClock或其替代图标', async () => {
    const result = await validateIconImport('IconClock')
    
    if (!result.success) {
      // 如果IconClock不存在，验证替代图标
      const alternative = findIconAlternative('IconClock')
      expect(alternative).toBeTruthy()
      
      if (alternative) {
        const alternativeResult = await validateIconImport(alternative)
        expect(alternativeResult.success).toBe(true)
        console.log(`IconClock 不可用，建议使用替代图标: ${alternative}`)
      }
    }
  })

  /**
   * 测试问题图标 - IconWechat
   */
  it('应该能够导入IconWechat或其替代图标', async () => {
    const result = await validateIconImport('IconWechat')
    
    if (!result.success) {
      // 如果IconWechat不存在，验证替代图标
      const alternative = findIconAlternative('IconWechat')
      expect(alternative).toBeTruthy()
      
      if (alternative) {
        const alternativeResult = await validateIconImport(alternative)
        expect(alternativeResult.success).toBe(true)
        console.log(`IconWechat 不可用，建议使用替代图标: ${alternative}`)
      }
    }
  })

  /**
   * 测试图标替代映射表
   */
  it('替代映射表中的所有替代图标都应该可用', async () => {
    const alternativeIcons = Object.values(ICON_ALTERNATIVES)
    const results = await validateIconImports(alternativeIcons)
    const failed = getFailedIcons(results)
    
    if (failed.length > 0) {
      console.error('以下替代图标不可用:', failed.map(r => r.iconName).join(', '))
    }
    
    expect(failed.length).toBe(0)
  })

  /**
   * 测试单个图标验证函数
   */
  it('validateIconImport 应该正确验证存在的图标', async () => {
    const result = await validateIconImport('IconPlus')
    
    expect(result.success).toBe(true)
    expect(result.iconName).toBe('IconPlus')
    expect(result.error).toBeUndefined()
  })

  /**
   * 测试单个图标验证函数 - 不存在的图标
   */
  it('validateIconImport 应该正确识别不存在的图标', async () => {
    const result = await validateIconImport('IconNotExist')
    
    expect(result.success).toBe(false)
    expect(result.iconName).toBe('IconNotExist')
    expect(result.error).toBeDefined()
  })

  /**
   * 测试报告生成功能
   */
  it('应该能够生成清晰的验证报告', async () => {
    const testIcons = ['IconPlus', 'IconNotExist', 'IconEdit']
    const results = await validateIconImports(testIcons)
    const report = generateIconReport(results)
    
    expect(report).toContain('图标导入验证报告')
    expect(report).toContain('总计')
    expect(report).toContain('成功')
    expect(report).toContain('失败')
  })
})

describe('图标替代方案', () => {
  /**
   * 测试查找替代图标功能
   */
  it('应该能够为已知问题图标找到替代方案', () => {
    const alternative = findIconAlternative('IconClock')
    expect(alternative).toBe('IconClockCircle')
  })

  /**
   * 测试未知图标的替代方案
   */
  it('对于未知图标应该返回null', () => {
    const alternative = findIconAlternative('IconUnknown')
    expect(alternative).toBeNull()
  })
})
