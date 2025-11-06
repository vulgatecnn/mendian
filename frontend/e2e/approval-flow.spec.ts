/**
 * 审批流程E2E测试
 * 
 * 测试场景：
 * 1. 配置单级审批模板并测试
 * 2. 配置多级审批模板并测试
 * 3. 配置会签审批模板并测试
 * 4. 测试审批驳回流程
 * 5. 测试审批撤回功能
 * 6. 验证审批历史记录
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { ApiHelper } from './helpers/api-helper';
import { testUsers } from './helpers/test-data';

test.describe('审批流程测试', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page, request);
    
    // 登录管理员账号
    await authHelper.login(testUsers.admin.username, testUsers.admin.password);
  });

  test('单级审批流程', async ({ page }) => {
    // 步骤1: 导航到审批模板配置
    await test.step('配置单级审批模板', async () => {
      await page.goto('/pc/approval/templates');
      
      // 点击创建模板
      await page.click('button:has-text("新建模板")');
      
      // 填写模板信息
      await page.fill('input[name="template_name"]', '单级审批模板-测试');
      await page.selectOption('select[name="approval_type"]', 'single_level');
      await page.fill('textarea[name="description"]', '用于测试的单级审批模板');
      
      // 配置审批人
      await page.click('button:has-text("添加审批人")');
      await page.selectOption('select[name="approver_id"]', '2'); // 选择审批人
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-01-single-template.png',
        fullPage: true 
      });
      
      // 保存模板
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤2: 使用单级审批模板提交审批
    await test.step('提交单级审批', async () => {
      // 创建一个测试计划
      await page.goto('/pc/store-planning/plans');
      await page.click('button:has-text("新建计划")');
      
      // 填写计划信息
      await page.fill('input[name="name"]', `单级审批测试计划-${Date.now()}`);
      await page.selectOption('select[name="plan_type"]', 'quarterly');
      await page.fill('input[name="start_date"]', '2024-04-01');
      await page.fill('input[name="end_date"]', '2024-06-30');
      
      // 保存计划
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 提交审批
      await page.click('button:has-text("提交审批")');
      await page.selectOption('select[name="template_id"]', '1'); // 选择单级审批模板
      await page.click('.arco-modal button:has-text("确定")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-02-single-submitted.png',
        fullPage: true 
      });
    });

    // 步骤3: 审批人审批
    await test.step('审批人处理单级审批', async () => {
      // 切换到审批人
      await authHelper.switchUser(testUsers.approver.username, testUsers.approver.password);
      
      // 进入审批中心
      await page.goto('/pc/approval');
      
      // 查看待审批列表
      const pendingCount = await page.locator('[data-testid="pending-count"]').textContent();
      expect(parseInt(pendingCount || '0')).toBeGreaterThan(0);
      
      // 点击第一个待审批项
      await page.click('.approval-item:first-child button:has-text("审批")');
      
      // 填写审批意见并通过
      await page.fill('textarea[name="approval_notes"]', '单级审批通过');
      await page.click('button:has-text("通过")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-03-single-approved.png',
        fullPage: true 
      });
    });
  });

  test('多级审批流程', async ({ page }) => {
    // 步骤1: 配置多级审批模板
    await test.step('配置多级审批模板', async () => {
      await page.goto('/pc/approval/templates');
      await page.click('button:has-text("新建模板")');
      
      // 填写模板信息
      await page.fill('input[name="template_name"]', '多级审批模板-测试');
      await page.selectOption('select[name="approval_type"]', 'multi_level');
      await page.fill('textarea[name="description"]', '用于测试的多级审批模板');
      
      // 添加第一级审批人
      await page.click('button:has-text("添加审批级别")');
      await page.fill('input[name="level_name"]', '部门经理审批');
      await page.selectOption('select[name="approver_id"]', '2');
      
      // 添加第二级审批人
      await page.click('button:has-text("添加审批级别")');
      await page.fill('input[name="level_name"]', '总经理审批');
      await page.selectOption('select[name="approver_id"]', '3');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-04-multi-template.png',
        fullPage: true 
      });
      
      // 保存模板
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤2: 提交多级审批
    await test.step('提交多级审批', async () => {
      // 创建测试计划
      await page.goto('/pc/store-planning/plans');
      await page.click('button:has-text("新建计划")');
      
      await page.fill('input[name="name"]', `多级审批测试计划-${Date.now()}`);
      await page.selectOption('select[name="plan_type"]', 'annual');
      await page.fill('input[name="start_date"]', '2024-01-01');
      await page.fill('input[name="end_date"]', '2024-12-31');
      
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 提交多级审批
      await page.click('button:has-text("提交审批")');
      await page.selectOption('select[name="template_id"]', '2'); // 选择多级审批模板
      await page.click('.arco-modal button:has-text("确定")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-05-multi-submitted.png',
        fullPage: true 
      });
    });

    // 步骤3: 第一级审批人审批
    await test.step('第一级审批人处理', async () => {
      await authHelper.switchUser(testUsers.approver.username, testUsers.approver.password);
      
      await page.goto('/pc/approval');
      await page.click('.approval-item:first-child button:has-text("审批")');
      
      // 验证当前审批级别
      const levelElement = await page.locator('[data-testid="approval-level"]');
      const levelText = await levelElement.textContent();
      expect(levelText).toContain('第1级');
      
      // 通过审批
      await page.fill('textarea[name="approval_notes"]', '第一级审批通过');
      await page.click('button:has-text("通过")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-06-level1-approved.png',
        fullPage: true 
      });
    });

    // 步骤4: 第二级审批人审批
    await test.step('第二级审批人处理', async () => {
      // 切换到第二级审批人（这里假设使用admin作为第二级审批人）
      await authHelper.switchUser(testUsers.admin.username, testUsers.admin.password);
      
      await page.goto('/pc/approval');
      await page.click('.approval-item:first-child button:has-text("审批")');
      
      // 验证当前审批级别
      const levelElement = await page.locator('[data-testid="approval-level"]');
      const levelText = await levelElement.textContent();
      expect(levelText).toContain('第2级');
      
      // 通过审批
      await page.fill('textarea[name="approval_notes"]', '第二级审批通过，最终批准');
      await page.click('button:has-text("通过")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-07-level2-approved.png',
        fullPage: true 
      });
    });

    // 步骤5: 验证审批完成
    await test.step('验证多级审批完成', async () => {
      // 查看审批历史
      await page.goto('/pc/approval/history');
      
      // 搜索刚才的审批
      await page.fill('input[placeholder*="搜索"]', '多级审批测试计划');
      await page.click('button:has-text("搜索")');
      
      // 验证审批状态
      const statusElement = await page.locator('.approval-item:first-child [data-testid="approval-status"]');
      const statusText = await statusElement.textContent();
      expect(statusText).toContain('已通过');
      
      // 查看审批详情
      await page.click('.approval-item:first-child button:has-text("详情")');
      
      // 验证审批流程记录
      const approvalSteps = await page.locator('.approval-step').count();
      expect(approvalSteps).toBe(2); // 应该有两级审批记录
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-08-multi-completed.png',
        fullPage: true 
      });
    });
  });

  test('会签审批流程', async ({ page }) => {
    // 步骤1: 配置会签审批模板
    await test.step('配置会签审批模板', async () => {
      await page.goto('/pc/approval/templates');
      await page.click('button:has-text("新建模板")');
      
      // 填写模板信息
      await page.fill('input[name="template_name"]', '会签审批模板-测试');
      await page.selectOption('select[name="approval_type"]', 'countersign');
      await page.fill('textarea[name="description"]', '用于测试的会签审批模板，需要所有审批人同意');
      
      // 添加多个会签审批人
      await page.click('button:has-text("添加会签人")');
      await page.selectOption('select[name="approver_id_1"]', '2');
      
      await page.click('button:has-text("添加会签人")');
      await page.selectOption('select[name="approver_id_2"]', '3');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-09-countersign-template.png',
        fullPage: true 
      });
      
      // 保存模板
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤2: 提交会签审批
    await test.step('提交会签审批', async () => {
      await page.goto('/pc/store-planning/plans');
      await page.click('button:has-text("新建计划")');
      
      await page.fill('input[name="name"]', `会签审批测试计划-${Date.now()}`);
      await page.selectOption('select[name="plan_type"]', 'annual');
      await page.fill('input[name="start_date"]', '2024-01-01');
      await page.fill('input[name="end_date"]', '2024-12-31');
      
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 提交会签审批
      await page.click('button:has-text("提交审批")');
      await page.selectOption('select[name="template_id"]', '3'); // 选择会签审批模板
      await page.click('.arco-modal button:has-text("确定")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-10-countersign-submitted.png',
        fullPage: true 
      });
    });

    // 步骤3: 第一个会签人审批
    await test.step('第一个会签人审批', async () => {
      await authHelper.switchUser(testUsers.approver.username, testUsers.approver.password);
      
      await page.goto('/pc/approval');
      await page.click('.approval-item:first-child button:has-text("审批")');
      
      // 验证会签标识
      const countersignBadge = await page.locator('[data-testid="countersign-badge"]');
      expect(await countersignBadge.isVisible()).toBe(true);
      
      // 通过审批
      await page.fill('textarea[name="approval_notes"]', '会签人1同意');
      await page.click('button:has-text("通过")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-11-countersign1-approved.png',
        fullPage: true 
      });
    });

    // 步骤4: 第二个会签人审批
    await test.step('第二个会签人审批', async () => {
      await authHelper.switchUser(testUsers.admin.username, testUsers.admin.password);
      
      await page.goto('/pc/approval');
      await page.click('.approval-item:first-child button:has-text("审批")');
      
      // 通过审批
      await page.fill('textarea[name="approval_notes"]', '会签人2同意');
      await page.click('button:has-text("通过")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-12-countersign2-approved.png',
        fullPage: true 
      });
    });

    // 步骤5: 验证会签完成
    await test.step('验证会签审批完成', async () => {
      await page.goto('/pc/approval/history');
      
      // 验证所有会签人都已审批
      const approvalDetail = await page.locator('.approval-item:first-child');
      await approvalDetail.click();
      
      const countersignCount = await page.locator('.countersign-record').count();
      expect(countersignCount).toBe(2);
      
      // 验证最终状态
      const statusElement = await page.locator('[data-testid="approval-status"]');
      const statusText = await statusElement.textContent();
      expect(statusText).toContain('已通过');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/approval-13-countersign-completed.png',
        fullPage: true 
      });
    });
  });

  test('审批驳回流程', async ({ page }) => {
    // 创建并提交审批
    await page.goto('/pc/store-planning/plans');
    await page.click('button:has-text("新建计划")');
    
    await page.fill('input[name="name"]', `驳回测试计划-${Date.now()}`);
    await page.selectOption('select[name="plan_type"]', 'quarterly');
    await page.fill('input[name="start_date"]', '2024-07-01');
    await page.fill('input[name="end_date"]', '2024-09-30');
    
    await page.click('button[type="submit"]:has-text("保存")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    await page.click('button:has-text("提交审批")');
    await page.click('.arco-modal button:has-text("确定")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 切换到审批人并驳回
    await authHelper.switchUser(testUsers.approver.username, testUsers.approver.password);
    await page.goto('/pc/approval');
    
    await page.click('.approval-item:first-child button:has-text("审批")');
    
    // 填写驳回原因
    await page.fill('textarea[name="rejection_reason"]', '计划时间安排不合理，需要重新规划');
    await page.click('button:has-text("驳回")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/approval-14-rejected.png',
      fullPage: true 
    });
    
    // 验证驳回状态
    await authHelper.switchUser(testUsers.admin.username, testUsers.admin.password);
    await page.goto('/pc/store-planning/plans');
    
    const rejectedPlan = await page.locator('tr:has-text("驳回测试计划")');
    const statusBadge = await rejectedPlan.locator('[data-testid="plan-status"]');
    const statusText = await statusBadge.textContent();
    expect(statusText).toContain('已驳回');
  });

  test('审批撤回功能', async ({ page }) => {
    // 创建并提交审批
    await page.goto('/pc/store-planning/plans');
    await page.click('button:has-text("新建计划")');
    
    await page.fill('input[name="name"]', `撤回测试计划-${Date.now()}`);
    await page.selectOption('select[name="plan_type"]', 'quarterly');
    await page.fill('input[name="start_date"]', '2024-10-01');
    await page.fill('input[name="end_date"]', '2024-12-31');
    
    await page.click('button[type="submit"]:has-text("保存")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    await page.click('button:has-text("提交审批")');
    await page.click('.arco-modal button:has-text("确定")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 撤回审批
    await page.click('button:has-text("撤回审批")');
    await page.fill('textarea[name="withdraw_reason"]', '发现计划有误，需要修改后重新提交');
    await page.click('.arco-modal button:has-text("确定")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/approval-15-withdrawn.png',
      fullPage: true 
    });
    
    // 验证撤回后状态
    const statusBadge = await page.locator('[data-testid="plan-status"]');
    const statusText = await statusBadge.textContent();
    expect(statusText).toContain('草稿');
  });

  test('审批历史记录查看', async ({ page }) => {
    // 导航到审批历史
    await page.goto('/pc/approval/history');
    
    // 验证历史记录列表
    const historyCount = await page.locator('.approval-history-item').count();
    expect(historyCount).toBeGreaterThan(0);
    
    // 查看第一条历史详情
    await page.click('.approval-history-item:first-child button:has-text("详情")');
    
    // 验证详情信息
    const detailModal = await page.locator('.arco-modal');
    expect(await detailModal.isVisible()).toBe(true);
    
    // 验证审批流程时间线
    const timeline = await page.locator('[data-testid="approval-timeline"]');
    expect(await timeline.isVisible()).toBe(true);
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/approval-16-history.png',
      fullPage: true 
    });
  });
});
