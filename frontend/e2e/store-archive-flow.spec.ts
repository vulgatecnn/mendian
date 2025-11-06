/**
 * 门店档案完整流程E2E测试
 * 
 * 测试场景：
 * 1. 创建门店档案
 * 2. 录入门店基本信息
 * 3. 关联施工和交接记录
 * 4. 更新门店状态为"营业中"
 * 5. 验证门店生命周期数据完整性
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { ApiHelper } from './helpers/api-helper';
import { testUsers, testStoreData } from './helpers/test-data';

test.describe('门店档案完整流程测试', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;
  let createdStoreId: number;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page, request);
    
    // 登录系统
    await authHelper.login(testUsers.admin.username, testUsers.admin.password);
  });

  test.afterEach(async () => {
    // 清理测试数据
    if (createdStoreId) {
      try {
        await apiHelper.authenticatedRequest(
          'DELETE',
          `/api/store-archive/stores/${createdStoreId}/`,
          null
        );
      } catch (error) {
        console.log('清理测试数据失败:', error);
      }
    }
  });

  test('完整的门店档案生命周期', async ({ page }) => {
    // 步骤1: 导航到门店档案页面
    await test.step('导航到门店档案页面', async () => {
      await page.click('text=门店档案');
      await page.waitForURL('**/store-archive/**', { timeout: 10000 });
      
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-01-list-page.png',
        fullPage: true 
      });
    });

    // 步骤2: 创建门店档案
    await test.step('创建门店档案', async () => {
      // 点击创建按钮
      await page.click('button:has-text("新建门店")');
      
      // 等待表单加载
      await page.waitForSelector('form', { timeout: 5000 });
      
      // 填写门店基本信息
      await page.fill('input[name="name"]', testStoreData.name);
      await page.fill('input[name="code"]', testStoreData.code);
      await page.fill('input[name="address"]', testStoreData.address);
      await page.selectOption('select[name="status"]', testStoreData.status);
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-02-basic-info.png',
        fullPage: true 
      });
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 获取门店ID
      await page.waitForTimeout(1000);
      const url = page.url();
      const match = url.match(/\/stores\/(\d+)/);
      if (match) {
        createdStoreId = parseInt(match[1]);
      }
      
      expect(createdStoreId).toBeGreaterThan(0);
    });

    // 步骤3: 录入详细信息
    await test.step('录入门店详细信息', async () => {
      // 点击详细信息标签
      await page.click('text=详细信息');
      
      // 填写经营信息
      await page.fill('input[name="business_area"]', '150');
      await page.fill('input[name="seating_capacity"]', '80');
      await page.selectOption('select[name="store_type"]', 'direct');
      await page.selectOption('select[name="region_id"]', '1');
      
      // 填写联系信息
      await page.fill('input[name="manager_name"]', '张经理');
      await page.fill('input[name="manager_phone"]', '13800138000');
      await page.fill('input[name="contact_email"]', 'manager@example.com');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-03-detailed-info.png',
        fullPage: true 
      });
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤4: 关联开店计划
    await test.step('关联开店计划', async () => {
      // 点击关联信息标签
      await page.click('text=关联信息');
      
      // 关联开店计划
      await page.click('button:has-text("关联计划")');
      await page.selectOption('select[name="plan_id"]', '1');
      await page.click('.arco-modal button:has-text("确定")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 验证关联成功
      const planLink = await page.locator('[data-testid="linked-plan"]');
      expect(await planLink.isVisible()).toBe(true);
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-04-plan-linked.png',
        fullPage: true 
      });
    });

    // 步骤5: 关联候选位置
    await test.step('关联候选位置', async () => {
      // 关联候选位置
      await page.click('button:has-text("关联位置")');
      await page.selectOption('select[name="location_id"]', '1');
      await page.click('.arco-modal button:has-text("确定")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 验证关联成功
      const locationLink = await page.locator('[data-testid="linked-location"]');
      expect(await locationLink.isVisible()).toBe(true);
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-05-location-linked.png',
        fullPage: true 
      });
    });

    // 步骤6: 关联施工项目
    await test.step('关联施工项目', async () => {
      // 关联施工项目
      await page.click('button:has-text("关联施工")');
      await page.selectOption('select[name="construction_id"]', '1');
      await page.click('.arco-modal button:has-text("确定")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 验证关联成功
      const constructionLink = await page.locator('[data-testid="linked-construction"]');
      expect(await constructionLink.isVisible()).toBe(true);
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-06-construction-linked.png',
        fullPage: true 
      });
    });

    // 步骤7: 关联交接记录
    await test.step('关联交接记录', async () => {
      // 关联交接记录
      await page.click('button:has-text("关联交接")');
      await page.selectOption('select[name="handover_id"]', '1');
      await page.click('.arco-modal button:has-text("确定")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 验证关联成功
      const handoverLink = await page.locator('[data-testid="linked-handover"]');
      expect(await handoverLink.isVisible()).toBe(true);
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-07-handover-linked.png',
        fullPage: true 
      });
    });

    // 步骤8: 更新门店状态为"营业中"
    await test.step('更新门店状态为营业中', async () => {
      // 点击状态更新按钮
      await page.click('button:has-text("更新状态")');
      
      // 选择营业中状态
      await page.selectOption('select[name="status"]', 'operating');
      await page.fill('input[name="opening_date"]', '2024-09-10');
      await page.fill('textarea[name="status_note"]', '门店已完成所有准备工作，正式开业');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-08-status-update.png',
        fullPage: true 
      });
      
      // 确认更新
      await page.click('button:has-text("确认")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 验证状态已更新
      const statusBadge = await page.locator('[data-testid="store-status"]');
      const statusText = await statusBadge.textContent();
      expect(statusText).toContain('营业中');
    });

    // 步骤9: 查看门店生命周期时间线
    await test.step('查看门店生命周期时间线', async () => {
      // 点击生命周期标签
      await page.click('text=生命周期');
      
      // 验证时间线存在
      const timeline = await page.locator('[data-testid="lifecycle-timeline"]');
      expect(await timeline.isVisible()).toBe(true);
      
      // 验证各个阶段的记录
      const stages = await page.locator('.lifecycle-stage').count();
      expect(stages).toBeGreaterThanOrEqual(4); // 至少应该有：计划、选址、施工、开业
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-09-lifecycle-timeline.png',
        fullPage: true 
      });
    });

    // 步骤10: 验证数据完整性
    await test.step('验证门店数据完整性', async () => {
      // 返回门店详情页
      await page.click('text=基本信息');
      
      // 验证基本信息
      const nameElement = await page.locator('[data-testid="store-name"]');
      const nameText = await nameElement.textContent();
      expect(nameText).toContain(testStoreData.name);
      
      const codeElement = await page.locator('[data-testid="store-code"]');
      const codeText = await codeElement.textContent();
      expect(codeText).toContain(testStoreData.code);
      
      // 验证关联信息
      await page.click('text=关联信息');
      
      const planLinked = await page.locator('[data-testid="linked-plan"]').isVisible();
      const locationLinked = await page.locator('[data-testid="linked-location"]').isVisible();
      const constructionLinked = await page.locator('[data-testid="linked-construction"]').isVisible();
      const handoverLinked = await page.locator('[data-testid="linked-handover"]').isVisible();
      
      expect(planLinked).toBe(true);
      expect(locationLinked).toBe(true);
      expect(constructionLinked).toBe(true);
      expect(handoverLinked).toBe(true);
      
      // 截图记录最终状态
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-10-final-verification.png',
        fullPage: true 
      });
    });

    // 步骤11: 导出门店档案
    await test.step('导出门店档案', async () => {
      // 点击导出按钮
      await page.click('button:has-text("导出档案")');
      
      // 选择导出格式
      await page.selectOption('select[name="export_format"]', 'pdf');
      await page.click('.arco-modal button:has-text("确定")');
      
      // 等待导出完成
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/archive-11-export.png',
        fullPage: true 
      });
    });
  });

  test('门店状态流转验证', async ({ page }) => {
    // 创建门店
    await page.goto('/pc/store-archive');
    await page.click('button:has-text("新建门店")');
    
    await page.fill('input[name="name"]', testStoreData.name);
    await page.fill('input[name="code"]', testStoreData.code);
    await page.fill('input[name="address"]', testStoreData.address);
    await page.selectOption('select[name="status"]', 'preparing');
    
    await page.click('button[type="submit"]:has-text("保存")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 测试状态流转：筹备中 -> 装修中
    await page.click('button:has-text("更新状态")');
    await page.selectOption('select[name="status"]', 'decorating');
    await page.click('button:has-text("确认")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    let statusBadge = await page.locator('[data-testid="store-status"]');
    let statusText = await statusBadge.textContent();
    expect(statusText).toContain('装修中');
    
    // 装修中 -> 试营业
    await page.click('button:has-text("更新状态")');
    await page.selectOption('select[name="status"]', 'trial_operation');
    await page.click('button:has-text("确认")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    statusBadge = await page.locator('[data-testid="store-status"]');
    statusText = await statusBadge.textContent();
    expect(statusText).toContain('试营业');
    
    // 试营业 -> 营业中
    await page.click('button:has-text("更新状态")');
    await page.selectOption('select[name="status"]', 'operating');
    await page.fill('input[name="opening_date"]', '2024-09-15');
    await page.click('button:has-text("确认")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    statusBadge = await page.locator('[data-testid="store-status"]');
    statusText = await statusBadge.textContent();
    expect(statusText).toContain('营业中');
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/archive-status-flow.png',
      fullPage: true 
    });
  });

  test('门店档案搜索和筛选', async ({ page }) => {
    // 导航到门店档案列表
    await page.goto('/pc/store-archive');
    
    // 按名称搜索
    await page.fill('input[placeholder*="搜索"]', testStoreData.name);
    await page.click('button:has-text("搜索")');
    await page.waitForTimeout(1000);
    
    // 验证搜索结果
    const searchResults = await page.locator('.store-item').count();
    expect(searchResults).toBeGreaterThan(0);
    
    // 按状态筛选
    await page.selectOption('select[name="status_filter"]', 'operating');
    await page.click('button:has-text("筛选")');
    await page.waitForTimeout(1000);
    
    // 验证筛选结果
    const filteredResults = await page.locator('.store-item').count();
    expect(filteredResults).toBeGreaterThan(0);
    
    // 按区域筛选
    await page.selectOption('select[name="region_filter"]', '1');
    await page.click('button:has-text("筛选")');
    await page.waitForTimeout(1000);
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/archive-search-filter.png',
      fullPage: true 
    });
  });

  test('门店档案批量操作', async ({ page }) => {
    // 导航到门店档案列表
    await page.goto('/pc/store-archive');
    
    // 选择多个门店
    await page.click('.store-item:nth-child(1) input[type="checkbox"]');
    await page.click('.store-item:nth-child(2) input[type="checkbox"]');
    
    // 批量导出
    await page.click('button:has-text("批量导出")');
    await page.selectOption('select[name="export_format"]', 'excel');
    await page.click('.arco-modal button:has-text("确定")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/archive-batch-export.png',
      fullPage: true 
    });
  });

  test('门店档案数据统计', async ({ page }) => {
    // 导航到门店档案统计页面
    await page.goto('/pc/store-archive/statistics');
    
    // 验证统计卡片
    const totalStores = await page.locator('[data-testid="total-stores"]');
    expect(await totalStores.isVisible()).toBe(true);
    
    const operatingStores = await page.locator('[data-testid="operating-stores"]');
    expect(await operatingStores.isVisible()).toBe(true);
    
    const preparingStores = await page.locator('[data-testid="preparing-stores"]');
    expect(await preparingStores.isVisible()).toBe(true);
    
    // 验证图表
    const statusChart = await page.locator('[data-testid="status-chart"]');
    expect(await statusChart.isVisible()).toBe(true);
    
    const regionChart = await page.locator('[data-testid="region-chart"]');
    expect(await regionChart.isVisible()).toBe(true);
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/archive-statistics.png',
      fullPage: true 
    });
  });
});
