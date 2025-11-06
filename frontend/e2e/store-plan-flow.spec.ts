/**
 * 开店计划完整流程E2E测试
 * 
 * 测试场景：
 * 1. 登录系统（admin账号）
 * 2. 创建开店计划并填写详情
 * 3. 提交计划审批
 * 4. 切换审批人账号审批通过
 * 5. 验证计划状态更新为"已审批"
 * 6. 验证数据保存正确
 * 7. 截图记录每个步骤
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { ApiHelper } from './helpers/api-helper';
import { testUsers, testPlanData } from './helpers/test-data';

test.describe('开店计划完整流程测试', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;
  let createdPlanId: number;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page, request);
  });

  test.afterEach(async () => {
    // 清理测试数据
    if (createdPlanId) {
      try {
        await apiHelper.deleteTestPlan(createdPlanId);
      } catch (error) {
        console.log('清理测试数据失败:', error);
      }
    }
  });

  test('完整的开店计划创建和审批流程', async ({ page }) => {
    // 步骤1: 登录系统（admin账号）
    await test.step('登录系统', async () => {
      await authHelper.login(testUsers.admin.username, testUsers.admin.password);
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/01-login-success.png',
        fullPage: true 
      });
      
      // 验证登录成功
      expect(await authHelper.isLoggedIn()).toBe(true);
    });

    // 步骤2: 导航到开店计划页面
    await test.step('导航到开店计划页面', async () => {
      // 点击菜单进入开店计划管理
      await page.click('text=开店计划');
      
      // 等待页面加载
      await page.waitForURL('**/store-planning/**', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/02-plan-list-page.png',
        fullPage: true 
      });
    });

    // 步骤3: 创建开店计划
    await test.step('创建开店计划', async () => {
      // 点击创建按钮
      await page.click('button:has-text("新建计划")');
      
      // 等待表单加载
      await page.waitForSelector('form', { timeout: 5000 });
      
      // 填写计划基本信息
      await page.fill('input[name="name"]', testPlanData.name);
      await page.selectOption('select[name="plan_type"]', testPlanData.plan_type);
      await page.fill('input[name="start_date"]', testPlanData.start_date);
      await page.fill('input[name="end_date"]', testPlanData.end_date);
      await page.fill('textarea[name="description"]', testPlanData.description);
      
      // 截图记录表单填写
      await page.screenshot({ 
        path: 'playwright-report/screenshots/03-plan-form-filled.png',
        fullPage: true 
      });
    });

    // 步骤4: 添加区域计划
    await test.step('添加区域计划', async () => {
      // 点击添加区域计划按钮
      await page.click('button:has-text("添加区域计划")');
      
      // 填写区域计划信息
      const regionalPlan = testPlanData.regional_plans[0];
      await page.selectOption('select[name="region_id"]', String(regionalPlan.region_id));
      await page.selectOption('select[name="store_type_id"]', String(regionalPlan.store_type_id));
      await page.fill('input[name="target_count"]', String(regionalPlan.target_count));
      await page.fill('input[name="contribution_rate"]', String(regionalPlan.contribution_rate));
      await page.fill('input[name="budget_amount"]', String(regionalPlan.budget_amount));
      
      // 截图记录区域计划填写
      await page.screenshot({ 
        path: 'playwright-report/screenshots/04-regional-plan-filled.png',
        fullPage: true 
      });
    });

    // 步骤5: 保存计划
    await test.step('保存计划', async () => {
      // 点击保存按钮
      await page.click('button[type="submit"]:has-text("保存")');
      
      // 等待保存成功提示
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 获取创建的计划ID（从URL或响应中）
      await page.waitForTimeout(1000);
      const url = page.url();
      const match = url.match(/\/plans\/(\d+)/);
      if (match) {
        createdPlanId = parseInt(match[1]);
      }
      
      // 截图记录保存成功
      await page.screenshot({ 
        path: 'playwright-report/screenshots/05-plan-saved.png',
        fullPage: true 
      });
      
      // 验证计划创建成功
      expect(createdPlanId).toBeGreaterThan(0);
    });

    // 步骤6: 提交审批
    await test.step('提交计划审批', async () => {
      // 点击提交审批按钮
      await page.click('button:has-text("提交审批")');
      
      // 确认提交
      await page.waitForSelector('.arco-modal', { timeout: 5000 });
      await page.click('.arco-modal button:has-text("确定")');
      
      // 等待提交成功
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录提交审批
      await page.screenshot({ 
        path: 'playwright-report/screenshots/06-approval-submitted.png',
        fullPage: true 
      });
    });

    // 步骤7: 切换到审批人账号
    await test.step('切换到审批人账号', async () => {
      // 登出当前用户
      await authHelper.logout();
      
      // 登录审批人账号
      await authHelper.login(testUsers.approver.username, testUsers.approver.password);
      
      // 截图记录审批人登录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/07-approver-logged-in.png',
        fullPage: true 
      });
    });

    // 步骤8: 审批通过
    await test.step('审批通过', async () => {
      // 导航到审批中心
      await page.click('text=审批中心');
      await page.waitForURL('**/approval/**', { timeout: 10000 });
      
      // 查找待审批的计划
      await page.fill('input[placeholder*="搜索"]', testPlanData.name);
      await page.click('button:has-text("搜索")');
      await page.waitForTimeout(1000);
      
      // 点击审批按钮
      await page.click(`tr:has-text("${testPlanData.name}") button:has-text("审批")`);
      
      // 填写审批意见
      await page.waitForSelector('.arco-modal', { timeout: 5000 });
      await page.fill('textarea[name="approval_notes"]', '审批通过，同意执行该计划');
      
      // 点击通过按钮
      await page.click('.arco-modal button:has-text("通过")');
      
      // 等待审批成功
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录审批通过
      await page.screenshot({ 
        path: 'playwright-report/screenshots/08-approval-approved.png',
        fullPage: true 
      });
    });

    // 步骤9: 验证计划状态
    await test.step('验证计划状态更新', async () => {
      // 切换回admin账号
      await authHelper.switchUser(testUsers.admin.username, testUsers.admin.password);
      
      // 导航到计划详情页
      await page.goto(`/pc/store-planning/plans/${createdPlanId}`);
      await page.waitForLoadState('networkidle');
      
      // 验证计划状态为"已审批"
      const statusElement = await page.locator('[data-testid="plan-status"]');
      const statusText = await statusElement.textContent();
      expect(statusText).toContain('已审批');
      
      // 截图记录最终状态
      await page.screenshot({ 
        path: 'playwright-report/screenshots/09-plan-approved-status.png',
        fullPage: true 
      });
    });

    // 步骤10: 验证数据完整性
    await test.step('验证数据保存正确', async () => {
      // 验证计划名称
      const nameElement = await page.locator('[data-testid="plan-name"]');
      const nameText = await nameElement.textContent();
      expect(nameText).toContain(testPlanData.name);
      
      // 验证计划类型
      const typeElement = await page.locator('[data-testid="plan-type"]');
      const typeText = await typeElement.textContent();
      expect(typeText).toContain('年度计划');
      
      // 验证日期范围
      const dateElement = await page.locator('[data-testid="plan-dates"]');
      const dateText = await dateElement.textContent();
      expect(dateText).toContain(testPlanData.start_date);
      expect(dateText).toContain(testPlanData.end_date);
      
      // 验证区域计划数据
      const regionalPlanElement = await page.locator('[data-testid="regional-plans"]');
      const regionalPlanText = await regionalPlanElement.textContent();
      expect(regionalPlanText).toContain(String(testPlanData.regional_plans[0].target_count));
      
      // 截图记录数据验证
      await page.screenshot({ 
        path: 'playwright-report/screenshots/10-data-verified.png',
        fullPage: true 
      });
    });
  });

  test('创建计划时的表单验证', async ({ page }) => {
    // 登录
    await authHelper.login(testUsers.admin.username, testUsers.admin.password);
    
    // 导航到创建页面
    await page.click('text=开店计划');
    await page.click('button:has-text("新建计划")');
    
    // 不填写任何信息直接提交
    await page.click('button[type="submit"]:has-text("保存")');
    
    // 验证显示错误提示
    const errorMessages = await page.locator('.arco-form-item-message').count();
    expect(errorMessages).toBeGreaterThan(0);
    
    // 截图记录验证错误
    await page.screenshot({ 
      path: 'playwright-report/screenshots/validation-errors.png',
      fullPage: true 
    });
  });

  test('计划审批驳回流程', async ({ page }) => {
    // 创建计划并提交审批（复用前面的步骤）
    await authHelper.login(testUsers.admin.username, testUsers.admin.password);
    
    // 使用API快速创建计划
    const planResponse = await apiHelper.createTestPlan(testPlanData);
    createdPlanId = planResponse.data.id;
    
    // 提交审批
    await apiHelper.submitApproval(createdPlanId, 'plan_publish');
    
    // 切换到审批人
    await authHelper.switchUser(testUsers.approver.username, testUsers.approver.password);
    
    // 导航到审批中心
    await page.goto('/pc/approval');
    
    // 查找并驳回审批
    await page.fill('input[placeholder*="搜索"]', testPlanData.name);
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);
    
    await page.click(`tr:has-text("${testPlanData.name}") button:has-text("审批")`);
    await page.waitForSelector('.arco-modal', { timeout: 5000 });
    
    // 填写驳回原因
    await page.fill('textarea[name="rejection_reason"]', '计划预算超出范围，需要重新调整');
    await page.click('.arco-modal button:has-text("驳回")');
    
    // 等待驳回成功
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/approval-rejected.png',
      fullPage: true 
    });
    
    // 验证状态
    await authHelper.switchUser(testUsers.admin.username, testUsers.admin.password);
    await page.goto(`/pc/store-planning/plans/${createdPlanId}`);
    
    const statusElement = await page.locator('[data-testid="plan-status"]');
    const statusText = await statusElement.textContent();
    expect(statusText).toContain('已驳回');
  });
});
