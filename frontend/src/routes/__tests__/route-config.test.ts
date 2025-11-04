/**
 * 路由配置测试
 */
import { describe, it, expect } from 'vitest'
import { 
  PCRoutes, 
  MobileRoutes,
  SystemRoutes,
  StoreExpansionRoutes,
  StorePreparationRoutes,
  StoreArchiveRoutes,
  ApprovalRoutes,
  BaseDataRoutes,
  BusinessDashboardRoutes,
  StorePlanningRoutes,
  StoreOperationRoutes,
  MobileExpansionRoutes,
  MobilePreparationRoutes,
  MobileApprovalRoutes
} from '../index'

describe('路由配置测试', () => {
  it('应该正确导出PC端路由组件', () => {
    expect(PCRoutes).toBeDefined()
    expect(SystemRoutes).toBeDefined()
    expect(StoreExpansionRoutes).toBeDefined()
    expect(StorePreparationRoutes).toBeDefined()
    expect(StoreArchiveRoutes).toBeDefined()
    expect(ApprovalRoutes).toBeDefined()
    expect(BaseDataRoutes).toBeDefined()
    expect(BusinessDashboardRoutes).toBeDefined()
    expect(StorePlanningRoutes).toBeDefined()
    expect(StoreOperationRoutes).toBeDefined()
  })

  it('应该正确导出移动端路由组件', () => {
    expect(MobileRoutes).toBeDefined()
    expect(MobileExpansionRoutes).toBeDefined()
    expect(MobilePreparationRoutes).toBeDefined()
    expect(MobileApprovalRoutes).toBeDefined()
  })

  it('PC端路由组件应该是React组件', () => {
    expect(typeof PCRoutes).toBe('function')
    expect(typeof SystemRoutes).toBe('function')
    expect(typeof StoreExpansionRoutes).toBe('function')
    expect(typeof StorePreparationRoutes).toBe('function')
    expect(typeof StoreArchiveRoutes).toBe('function')
    expect(typeof ApprovalRoutes).toBe('function')
    expect(typeof BaseDataRoutes).toBe('function')
    expect(typeof BusinessDashboardRoutes).toBe('function')
    expect(typeof StorePlanningRoutes).toBe('function')
    expect(typeof StoreOperationRoutes).toBe('function')
  })

  it('移动端路由组件应该是React组件', () => {
    expect(typeof MobileRoutes).toBe('function')
    expect(typeof MobileExpansionRoutes).toBe('function')
    expect(typeof MobilePreparationRoutes).toBe('function')
    expect(typeof MobileApprovalRoutes).toBe('function')
  })
})