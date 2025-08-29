/**
 * 开店计划完整业务流程E2E测试
 * 测试从计划创建到完成的整个生命周期
 */
import { test, expect, Page } from '@playwright/test'

// 测试数据
const testPlan = {
  name: 'E2E完整流程测试计划',
  type: '直营',
  priority: '中等',
  region: '华东区域',
  targetOpenDate: '2024-12-31',
  budget: '50',  // 50万
  description: '这是一个E2E测试用的完整流程开店计划',
}

// 页面对象模式 - 开店计划相关操作
class StorePlanPage {
  constructor(private page: Page) {}

  // 导航到开店计划列表页
  async goto() {
    await this.page.goto('/store-plan')
    await this.page.waitForLoadState('networkidle')
  }

  // 点击新建计划按钮
  async clickCreateButton() {
    await this.page.getByRole('button', { name: '新建计划' }).click()
    await this.page.waitForLoadState('networkidle')
  }

  // 填写计划表单
  async fillPlanForm(plan: typeof testPlan) {
    await this.page.getByLabel('计划名称').fill(plan.name)
    
    // 选择门店类型
    await this.page.getByLabel('门店类型').click()
    await this.page.getByText(plan.type).click()
    
    // 选择优先级
    await this.page.getByLabel('优先级').click()
    await this.page.getByText(plan.priority).click()
    
    // 填写地区
    await this.page.getByLabel('目标地区').fill(plan.region)
    
    // 填写目标开店日期
    await this.page.getByLabel('目标开店日期').fill(plan.targetOpenDate)
    
    // 填写预算
    await this.page.getByLabel('预算（万元）').fill(plan.budget)
    
    // 填写描述
    await this.page.getByLabel('计划描述').fill(plan.description)
  }

  // 保存为草稿
  async saveDraft() {
    await this.page.getByRole('button', { name: '保存草稿' }).click()
    await this.page.waitForSelector('.ant-message-success')
  }

  // 提交审批
  async submitForApproval() {
    await this.page.getByRole('button', { name: '提交审批' }).click()
    
    // 确认提交对话框
    await this.page.getByRole('button', { name: '确定' }).click()
    await this.page.waitForSelector('.ant-message-success')
  }

  // 查找计划在列表中
  async findPlanInList(planName: string) {
    await this.goto()
    return this.page.getByText(planName).first()
  }

  // 点击计划查看详情
  async viewPlanDetail(planName: string) {
    const planRow = await this.findPlanInList(planName)
    await planRow.click()
    await this.page.waitForLoadState('networkidle')
  }

  // 编辑计划
  async editPlan(planName: string) {
    await this.findPlanInList(planName)
    
    // 找到对应行的编辑按钮
    const row = this.page.locator(`tr:has-text("${planName}")`)
    await row.getByRole('button', { name: '更多' }).click()
    await this.page.getByText('编辑').click()
    
    await this.page.waitForLoadState('networkidle')
  }

  // 审批计划（管理员操作）
  async approvePlan(planName: string, comments?: string) {
    await this.findPlanInList(planName)
    
    const row = this.page.locator(`tr:has-text("${planName}")`)
    await row.getByRole('button', { name: '更多' }).click()
    await this.page.getByText('审批').click()
    
    // 填写审批意见
    if (comments) {
      await this.page.getByLabel('审批意见').fill(comments)
    }
    
    await this.page.getByRole('button', { name: '批准' }).click()
    await this.page.waitForSelector('.ant-message-success')
  }

  // 开始执行计划
  async startExecution(planName: string) {
    await this.findPlanInList(planName)
    
    const row = this.page.locator(`tr:has-text("${planName}")`)
    await row.getByRole('button', { name: '更多' }).click()
    await this.page.getByText('开始执行').click()
    
    await this.page.getByRole('button', { name: '确定' }).click()
    await this.page.waitForSelector('.ant-message-success')
  }

  // 更新进度
  async updateProgress(planName: string, progress: number, notes?: string) {
    await this.viewPlanDetail(planName)
    
    await this.page.getByRole('button', { name: '更新进度' }).click()
    
    // 设置进度值
    await this.page.getByLabel('进度百分比').fill(progress.toString())
    
    if (notes) {
      await this.page.getByLabel('进度说明').fill(notes)
    }
    
    await this.page.getByRole('button', { name: '确定' }).click()
    await this.page.waitForSelector('.ant-message-success')
  }

  // 完成计划
  async completePlan(planName: string) {
    await this.findPlanInList(planName)
    
    const row = this.page.locator(`tr:has-text("${planName}")`)
    await row.getByRole('button', { name: '更多' }).click()
    await this.page.getByText('标记完成').click()
    
    await this.page.getByRole('button', { name: '确定' }).click()
    await this.page.waitForSelector('.ant-message-success')
  }

  // 验证计划状态
  async verifyPlanStatus(planName: string, expectedStatus: string) {
    await this.goto()
    const row = this.page.locator(`tr:has-text("${planName}")`)
    await expect(row.getByText(expectedStatus)).toBeVisible()
  }

  // 删除计划
  async deletePlan(planName: string) {
    await this.findPlanInList(planName)
    
    const row = this.page.locator(`tr:has-text("${planName}")`)
    await row.getByRole('button', { name: '更多' }).click()
    await this.page.getByText('删除').click()
    
    // 确认删除对话框
    await this.page.getByRole('button', { name: '确定' }).click()
    await this.page.waitForSelector('.ant-message-success')
  }
}

// 登录辅助类
class AuthHelper {
  constructor(private page: Page) {}

  async loginAsAdmin() {
    await this.page.goto('/login')
    await this.page.getByLabel('用户名').fill('e2e-admin')
    await this.page.getByLabel('密码').fill('password123')
    await this.page.getByRole('button', { name: '登录' }).click()
    await this.page.waitForURL('/dashboard')
  }

  async loginAsPlanner() {
    await this.page.goto('/login')
    await this.page.getByLabel('用户名').fill('e2e-planner')
    await this.page.getByLabel('密码').fill('password123')
    await this.page.getByRole('button', { name: '登录' }).click()
    await this.page.waitForURL('/dashboard')
  }

  async loginAsApprover() {
    await this.page.goto('/login')
    await this.page.getByLabel('用户名').fill('e2e-approver')
    await this.page.getByLabel('密码').fill('password123')
    await this.page.getByRole('button', { name: '登录' }).click()
    await this.page.waitForURL('/dashboard')
  }

  async logout() {
    await this.page.getByRole('button', { name: '退出登录' }).click()
    await this.page.waitForURL('/login')
  }
}

test.describe('开店计划完整业务流程', () => {
  let storePlanPage: StorePlanPage
  let authHelper: AuthHelper

  test.beforeEach(async ({ page }) => {
    storePlanPage = new StorePlanPage(page)
    authHelper = new AuthHelper(page)
  })

  test('完整的计划生命周期流程', async ({ page }) => {
    // Step 1: 计划员登录并创建计划
    await test.step('计划员创建新计划', async () => {
      await authHelper.loginAsPlanner()
      await storePlanPage.goto()
      
      // 验证页面加载
      await expect(page.getByText('开店计划管理')).toBeVisible()
      
      await storePlanPage.clickCreateButton()
      
      // 验证创建页面
      await expect(page.getByText('新建开店计划')).toBeVisible()
      
      await storePlanPage.fillPlanForm(testPlan)
      await storePlanPage.saveDraft()
      
      // 验证创建成功
      await expect(page.getByText('保存成功')).toBeVisible()
    })

    // Step 2: 验证草稿状态
    await test.step('验证计划为草稿状态', async () => {
      await storePlanPage.verifyPlanStatus(testPlan.name, '草稿')
    })

    // Step 3: 提交审批
    await test.step('提交计划审批', async () => {
      await storePlanPage.editPlan(testPlan.name)
      await storePlanPage.submitForApproval()
      
      // 验证状态变更
      await storePlanPage.verifyPlanStatus(testPlan.name, '已提交')
    })

    // Step 4: 审批员审批
    await test.step('审批员审批计划', async () => {
      await authHelper.logout()
      await authHelper.loginAsApprover()
      
      await storePlanPage.approvePlan(testPlan.name, '计划合理，同意执行')
      
      // 验证审批成功
      await storePlanPage.verifyPlanStatus(testPlan.name, '已批准')
    })

    // Step 5: 开始执行
    await test.step('开始执行计划', async () => {
      await authHelper.logout()
      await authHelper.loginAsAdmin()
      
      await storePlanPage.startExecution(testPlan.name)
      
      // 验证状态变更
      await storePlanPage.verifyPlanStatus(testPlan.name, '进行中')
    })

    // Step 6: 更新执行进度
    await test.step('更新执行进度', async () => {
      // 更新进度到30%
      await storePlanPage.updateProgress(testPlan.name, 30, '选址阶段完成')
      
      // 验证进度更新
      await storePlanPage.viewPlanDetail(testPlan.name)
      await expect(page.getByText('30%')).toBeVisible()
      
      // 继续更新到80%
      await storePlanPage.updateProgress(testPlan.name, 80, '装修阶段基本完成')
    })

    // Step 7: 完成计划
    await test.step('完成计划', async () => {
      await storePlanPage.completePlan(testPlan.name)
      
      // 验证最终状态
      await storePlanPage.verifyPlanStatus(testPlan.name, '已完成')
    })

    // Step 8: 验证完整数据
    await test.step('验证完整计划数据', async () => {
      await storePlanPage.viewPlanDetail(testPlan.name)
      
      // 验证基本信息
      await expect(page.getByText(testPlan.name)).toBeVisible()
      await expect(page.getByText(testPlan.description)).toBeVisible()
      await expect(page.getByText('已完成')).toBeVisible()
      await expect(page.getByText('100%')).toBeVisible()
    })

    // Step 9: 清理测试数据
    await test.step('清理测试数据', async () => {
      // 注意：已完成的计划通常不能删除，这里仅做演示
      // 实际项目中需要根据业务规则调整
      await storePlanPage.goto()
      
      // 验证计划仍然存在
      await expect(storePlanPage.findPlanInList(testPlan.name)).toBeVisible()
    })
  })

  test('计划审批被拒绝的流程', async ({ page }) => {
    const rejectedPlan = {
      ...testPlan,
      name: 'E2E拒绝流程测试计划',
    }

    // Step 1: 创建并提交计划
    await test.step('创建并提交计划', async () => {
      await authHelper.loginAsPlanner()
      await storePlanPage.goto()
      await storePlanPage.clickCreateButton()
      await storePlanPage.fillPlanForm(rejectedPlan)
      await storePlanPage.saveDraft()
      await storePlanPage.editPlan(rejectedPlan.name)
      await storePlanPage.submitForApproval()
    })

    // Step 2: 审批员拒绝计划
    await test.step('审批员拒绝计划', async () => {
      await authHelper.logout()
      await authHelper.loginAsApprover()
      
      await storePlanPage.findPlanInList(rejectedPlan.name)
      const row = page.locator(`tr:has-text("${rejectedPlan.name}")`)
      await row.getByRole('button', { name: '更多' }).click()
      await page.getByText('审批').click()
      
      // 填写拒绝原因
      await page.getByLabel('审批意见').fill('预算超出限制，需要重新规划')
      await page.getByRole('button', { name: '拒绝' }).click()
      
      await expect(page.getByText('拒绝成功')).toBeVisible()
    })

    // Step 3: 验证拒绝状态
    await test.step('验证拒绝状态', async () => {
      await storePlanPage.verifyPlanStatus(rejectedPlan.name, '已拒绝')
    })

    // Step 4: 计划员修改并重新提交
    await test.step('修改并重新提交', async () => {
      await authHelper.logout()
      await authHelper.loginAsPlanner()
      
      await storePlanPage.editPlan(rejectedPlan.name)
      
      // 修改预算
      await page.getByLabel('预算（万元）').clear()
      await page.getByLabel('预算（万元）').fill('30')  // 降低预算
      
      await storePlanPage.submitForApproval()
      
      // 验证重新提交成功
      await storePlanPage.verifyPlanStatus(rejectedPlan.name, '已提交')
    })

    // 清理数据
    await storePlanPage.deletePlan(rejectedPlan.name)
  })

  test('批量操作流程', async ({ page }) => {
    const batchPlans = [
      { ...testPlan, name: 'E2E批量测试计划1' },
      { ...testPlan, name: 'E2E批量测试计划2' },
      { ...testPlan, name: 'E2E批量测试计划3' },
    ]

    // Step 1: 创建多个计划
    await test.step('批量创建计划', async () => {
      await authHelper.loginAsPlanner()
      
      for (const plan of batchPlans) {
        await storePlanPage.goto()
        await storePlanPage.clickCreateButton()
        await storePlanPage.fillPlanForm(plan)
        await storePlanPage.saveDraft()
      }
    })

    // Step 2: 批量选择和删除
    await test.step('批量选择和删除', async () => {
      await storePlanPage.goto()
      
      // 选择所有测试计划
      for (const plan of batchPlans) {
        const row = page.locator(`tr:has-text("${plan.name}")`)
        await row.getByRole('checkbox').check()
      }
      
      // 验证选中数量
      await expect(page.getByText(`已选择 ${batchPlans.length} 项`)).toBeVisible()
      
      // 执行批量删除
      await page.getByRole('button', { name: '批量删除' }).click()
      await page.getByRole('button', { name: '确定' }).click()
      
      await expect(page.getByText('删除成功')).toBeVisible()
      
      // 验证计划已被删除
      for (const plan of batchPlans) {
        await expect(page.getByText(plan.name)).not.toBeVisible()
      }
    })
  })

  test('数据筛选和搜索功能', async ({ page }) => {
    await test.step('测试筛选和搜索', async () => {
      await authHelper.loginAsPlanner()
      await storePlanPage.goto()
      
      // 测试状态筛选
      await page.getByLabel('状态').click()
      await page.getByText('草稿').click()
      await page.getByRole('button', { name: '搜索' }).click()
      
      // 验证筛选结果
      await expect(page.getByText('草稿')).toBeVisible()
      
      // 测试搜索功能
      await page.getByPlaceholder('请输入计划名称').fill('测试')
      await page.getByRole('button', { name: '搜索' }).click()
      
      // 重置筛选
      await page.getByRole('button', { name: '重置' }).click()
    })
  })

  test('导出功能', async ({ page }) => {
    await test.step('测试Excel导出', async () => {
      await authHelper.loginAsPlanner()
      await storePlanPage.goto()
      
      // 开始下载监听
      const downloadPromise = page.waitForEvent('download')
      
      // 点击导出按钮
      await page.getByRole('button', { name: '导出' }).click()
      
      // 等待下载完成
      const download = await downloadPromise
      
      // 验证下载文件
      expect(download.suggestedFilename()).toMatch(/开店计划列表_\d+\.xlsx/)
      
      // 验证成功消息
      await expect(page.getByText('导出成功')).toBeVisible()
    })
  })

  test('移动端响应式测试', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }

    await test.step('移动端界面适配', async () => {
      await authHelper.loginAsPlanner()
      await storePlanPage.goto()
      
      // 验证移动端界面元素
      await expect(page.getByText('开店计划管理')).toBeVisible()
      
      // 验证表格在移动端的显示
      await expect(page.locator('.ant-table-scroll')).toBeVisible()
      
      // 测试移动端的操作菜单
      if (await page.getByRole('button', { name: '更多' }).first().isVisible()) {
        await page.getByRole('button', { name: '更多' }).first().click()
        await expect(page.getByText('查看详情')).toBeVisible()
      }
    })
  })
});