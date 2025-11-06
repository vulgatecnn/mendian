/**
 * 拓店完整流程E2E测试
 * 
 * 测试场景：
 * 1. 添加候选位置并填写信息
 * 2. 创建跟进记录
 * 3. 更新位置状态为"意向确定"
 * 4. 上传合同文件
 * 5. 提交合同审批
 * 6. 验证审批流转
 * 7. 验证位置状态更新为"已签约"
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { ApiHelper } from './helpers/api-helper';
import { testUsers, testLocationData } from './helpers/test-data';

test.describe('拓店完整流程测试', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;
  let createdLocationId: number;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page, request);
    
    // 登录系统
    await authHelper.login(testUsers.admin.username, testUsers.admin.password);
  });

  test.afterEach(async () => {
    // 清理测试数据
    if (createdLocationId) {
      try {
        // 删除创建的候选位置
        await apiHelper.authenticatedRequest(
          'DELETE',
          `/api/store-expansion/locations/${createdLocationId}/`,
          null
        );
      } catch (error) {
        console.log('清理测试数据失败:', error);
      }
    }
  });

  test('完整的拓店流程', async ({ page }) => {
    // 步骤1: 导航到拓店管理页面
    await test.step('导航到拓店管理页面', async () => {
      await page.click('text=拓店管理');
      await page.waitForURL('**/store-expansion/**', { timeout: 10000 });
      
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-01-list-page.png',
        fullPage: true 
      });
    });

    // 步骤2: 添加候选位置
    await test.step('添加候选位置', async () => {
      // 点击添加按钮
      await page.click('button:has-text("添加候选位置")');
      
      // 等待表单加载
      await page.waitForSelector('form', { timeout: 5000 });
      
      // 填写位置信息
      await page.fill('input[name="name"]', testLocationData.name);
      await page.fill('input[name="address"]', testLocationData.address);
      await page.fill('input[name="area"]', String(testLocationData.area));
      await page.fill('input[name="rent"]', String(testLocationData.rent));
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-02-location-form.png',
        fullPage: true 
      });
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 获取创建的位置ID
      await page.waitForTimeout(1000);
      const url = page.url();
      const match = url.match(/\/locations\/(\d+)/);
      if (match) {
        createdLocationId = parseInt(match[1]);
      }
      
      expect(createdLocationId).toBeGreaterThan(0);
    });

    // 步骤3: 创建跟进记录
    await test.step('创建跟进记录', async () => {
      // 点击跟进记录标签
      await page.click('text=跟进记录');
      
      // 点击添加跟进记录
      await page.click('button:has-text("添加跟进")');
      
      // 填写跟进信息
      await page.fill('textarea[name="content"]', '与房东进行了初步沟通，对方表示有意向合作');
      await page.selectOption('select[name="follow_type"]', 'communication');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-03-follow-up.png',
        fullPage: true 
      });
      
      // 保存跟进记录
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤4: 更新位置状态为"意向确定"
    await test.step('更新位置状态为意向确定', async () => {
      // 点击状态更新按钮
      await page.click('button:has-text("更新状态")');
      
      // 选择新状态
      await page.selectOption('select[name="status"]', 'intention_confirmed');
      await page.fill('textarea[name="status_note"]', '双方已达成初步意向，准备签订合同');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-04-status-update.png',
        fullPage: true 
      });
      
      // 确认更新
      await page.click('button:has-text("确认")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 验证状态已更新
      const statusBadge = await page.locator('[data-testid="location-status"]');
      const statusText = await statusBadge.textContent();
      expect(statusText).toContain('意向确定');
    });

    // 步骤5: 上传合同文件
    await test.step('上传合同文件', async () => {
      // 点击合同管理标签
      await page.click('text=合同管理');
      
      // 点击上传合同按钮
      await page.click('button:has-text("上传合同")');
      
      // 填写合同信息
      await page.fill('input[name="contract_name"]', '租赁合同');
      await page.fill('input[name="contract_amount"]', '1200000');
      await page.fill('input[name="contract_start_date"]', '2024-07-01');
      await page.fill('input[name="contract_end_date"]', '2029-06-30');
      
      // 模拟文件上传（注意：实际测试中需要准备测试文件）
      // const fileInput = await page.locator('input[type="file"]');
      // await fileInput.setInputFiles('path/to/test-contract.pdf');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-05-contract-upload.png',
        fullPage: true 
      });
      
      // 保存合同信息
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤6: 提交合同审批
    await test.step('提交合同审批', async () => {
      // 点击提交审批按钮
      await page.click('button:has-text("提交审批")');
      
      // 确认提交
      await page.waitForSelector('.arco-modal', { timeout: 5000 });
      await page.fill('textarea[name="approval_notes"]', '请审批租赁合同');
      await page.click('.arco-modal button:has-text("确定")');
      
      // 等待提交成功
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-06-approval-submitted.png',
        fullPage: true 
      });
    });

    // 步骤7: 切换审批人审批通过
    await test.step('审批人审批通过', async () => {
      // 切换到审批人账号
      await authHelper.switchUser(testUsers.approver.username, testUsers.approver.password);
      
      // 导航到审批中心
      await page.goto('/pc/approval');
      
      // 查找待审批的合同
      await page.fill('input[placeholder*="搜索"]', testLocationData.name);
      await page.click('button:has-text("搜索")');
      await page.waitForTimeout(1000);
      
      // 点击审批
      await page.click(`tr:has-text("${testLocationData.name}") button:has-text("审批")`);
      await page.waitForSelector('.arco-modal', { timeout: 5000 });
      
      // 填写审批意见并通过
      await page.fill('textarea[name="approval_notes"]', '合同条款合理，同意签约');
      await page.click('.arco-modal button:has-text("通过")');
      
      // 等待审批成功
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-07-approval-approved.png',
        fullPage: true 
      });
    });

    // 步骤8: 验证位置状态更新为"已签约"
    await test.step('验证位置状态更新为已签约', async () => {
      // 切换回admin账号
      await authHelper.switchUser(testUsers.admin.username, testUsers.admin.password);
      
      // 导航到位置详情页
      await page.goto(`/pc/store-expansion/locations/${createdLocationId}`);
      await page.waitForLoadState('networkidle');
      
      // 验证状态
      const statusBadge = await page.locator('[data-testid="location-status"]');
      const statusText = await statusBadge.textContent();
      expect(statusText).toContain('已签约');
      
      // 截图记录最终状态
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-08-final-status.png',
        fullPage: true 
      });
    });

    // 步骤9: 验证数据完整性
    await test.step('验证数据完整性', async () => {
      // 验证位置信息
      const nameElement = await page.locator('[data-testid="location-name"]');
      const nameText = await nameElement.textContent();
      expect(nameText).toContain(testLocationData.name);
      
      // 验证跟进记录存在
      await page.click('text=跟进记录');
      const followUpCount = await page.locator('.follow-up-item').count();
      expect(followUpCount).toBeGreaterThan(0);
      
      // 验证合同信息存在
      await page.click('text=合同管理');
      const contractElement = await page.locator('[data-testid="contract-info"]');
      expect(await contractElement.isVisible()).toBe(true);
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/expansion-09-data-verified.png',
        fullPage: true 
      });
    });
  });

  test('候选位置盈利分析', async ({ page }) => {
    // 创建候选位置
    await page.goto('/pc/store-expansion');
    await page.click('button:has-text("添加候选位置")');
    
    // 填写完整信息包括盈利分析数据
    await page.fill('input[name="name"]', testLocationData.name);
    await page.fill('input[name="address"]', testLocationData.address);
    await page.fill('input[name="area"]', String(testLocationData.area));
    await page.fill('input[name="rent"]', String(testLocationData.rent));
    
    // 填写盈利分析
    await page.click('text=盈利分析');
    await page.fill('input[name="expected_revenue"]', '500000');
    await page.fill('input[name="expected_cost"]', '300000');
    
    // 保存
    await page.click('button[type="submit"]:has-text("保存")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 验证盈利率计算
    const profitRateElement = await page.locator('[data-testid="profit-rate"]');
    const profitRateText = await profitRateElement.textContent();
    expect(profitRateText).toContain('40%');
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/expansion-profit-analysis.png',
      fullPage: true 
    });
  });
});
