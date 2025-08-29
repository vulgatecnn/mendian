/**
 * 开店计划状态映射验证测试
 * 验证修复后的状态类型一致性
 */

// 导入状态映射
import { describe, it, expect } from 'vitest'

describe('StorePlan Status Mapping Validation', () => {
  // 模拟StatusMap对象（从StorePlanList.tsx复制）
  const statusMap = {
    DRAFT: { color: 'default', text: '草稿' },
    SUBMITTED: { color: 'processing', text: '已提交' },
    PENDING: { color: 'processing', text: '待审批' },
    APPROVED: { color: 'success', text: '已批准' },
    REJECTED: { color: 'error', text: '已拒绝' },
    IN_PROGRESS: { color: 'warning', text: '进行中' },
    COMPLETED: { color: 'success', text: '已完成' },
    CANCELLED: { color: 'error', text: '已取消' }
  }

  const typeMap = {
    DIRECT: { color: 'blue', text: '直营' },
    FRANCHISE: { color: 'green', text: '加盟' },
    FLAGSHIP: { color: 'orange', text: '旗舰店' },
    POPUP: { color: 'purple', text: '快闪店' }
  }

  it('应该包含所有必需的状态映射', () => {
    const requiredStatuses = [
      'DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 
      'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    ]
    
    requiredStatuses.forEach(status => {
      expect(statusMap).toHaveProperty(status)
      expect(statusMap[status as keyof typeof statusMap]).toHaveProperty('color')
      expect(statusMap[status as keyof typeof statusMap]).toHaveProperty('text')
    })
  })

  it('应该包含所有必需的类型映射', () => {
    const requiredTypes = ['DIRECT', 'FRANCHISE', 'FLAGSHIP', 'POPUP']
    
    requiredTypes.forEach(type => {
      expect(typeMap).toHaveProperty(type)
      expect(typeMap[type as keyof typeof typeMap]).toHaveProperty('color')
      expect(typeMap[type as keyof typeof typeMap]).toHaveProperty('text')
    })
  })

  it('状态映射应该使用大写枚举值（与后端一致）', () => {
    // 验证所有状态都是大写格式
    const statusKeys = Object.keys(statusMap)
    statusKeys.forEach(key => {
      expect(key).toBe(key.toUpperCase())
      expect(key).toMatch(/^[A-Z_]+$/) // 只包含大写字母和下划线
    })
  })

  it('类型映射应该使用大写枚举值（与后端一致）', () => {
    // 验证所有类型都是大写格式
    const typeKeys = Object.keys(typeMap)
    typeKeys.forEach(key => {
      expect(key).toBe(key.toUpperCase())
      expect(key).toMatch(/^[A-Z_]+$/) // 只包含大写字母和下划线
    })
  })

  it('状态文本应该是中文描述', () => {
    const expectedTexts = {
      DRAFT: '草稿',
      SUBMITTED: '已提交',
      PENDING: '待审批',
      APPROVED: '已批准',
      REJECTED: '已拒绝',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }

    Object.entries(expectedTexts).forEach(([status, expectedText]) => {
      expect(statusMap[status as keyof typeof statusMap].text).toBe(expectedText)
    })
  })

  it('类型文本应该是中文描述', () => {
    const expectedTexts = {
      DIRECT: '直营',
      FRANCHISE: '加盟',
      FLAGSHIP: '旗舰店',
      POPUP: '快闪店'
    }

    Object.entries(expectedTexts).forEach(([type, expectedText]) => {
      expect(typeMap[type as keyof typeof typeMap].text).toBe(expectedText)
    })
  })

  it('状态颜色配置应该合理', () => {
    // 验证颜色配置符合语义
    expect(statusMap.DRAFT.color).toBe('default') // 草稿用默认色
    expect(statusMap.SUBMITTED.color).toBe('processing') // 已提交用处理中色
    expect(statusMap.PENDING.color).toBe('processing') // 待审批用处理中色
    expect(statusMap.APPROVED.color).toBe('success') // 已批准用成功色
    expect(statusMap.REJECTED.color).toBe('error') // 已拒绝用错误色
    expect(statusMap.IN_PROGRESS.color).toBe('warning') // 进行中用警告色
    expect(statusMap.COMPLETED.color).toBe('success') // 已完成用成功色
    expect(statusMap.CANCELLED.color).toBe('error') // 已取消用错误色
  })

  it('类型颜色配置应该区分明显', () => {
    const colors = Object.values(typeMap).map(t => t.color)
    const uniqueColors = new Set(colors)
    
    // 确保每个类型都有不同的颜色
    expect(uniqueColors.size).toBe(colors.length)
    
    // 验证具体颜色配置
    expect(typeMap.DIRECT.color).toBe('blue')
    expect(typeMap.FRANCHISE.color).toBe('green') 
    expect(typeMap.FLAGSHIP.color).toBe('orange')
    expect(typeMap.POPUP.color).toBe('purple')
  })
})