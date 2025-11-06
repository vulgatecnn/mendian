/**
 * 施工管理完整流程E2E测试
 * 
 * 测试场景：
 * 1. 创建施工项目
 * 2. 分配供应商
 * 3. 记录施工进度
 * 4. 上传施工照片
 * 5. 提交工程验收
 * 6. 审批验收
 * 7. 完成门店交接
 * 8. 验证整个流程的数据流转
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { ApiHelper } from './helpers/api-helper';
import { testUsers, testConstructionData } from './helpers/test-data';

test.describe('施工管理完整流程测试', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;
  let createdProjectId: number;

  test.beforeEach(async ({ page, request }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper(page, request);
    
    // 登录系统
    await authHelper.login(testUsers.admin.username, testUsers.admin.password);
  });

  test.afterEach(async () => {
    // 清理测试数据
    if (createdProjectId) {
      try {
        await apiHelper.authenticatedRequest(
          'DELETE',
          `/api/store-preparation/construction/${createdProjectId}/`,
          null
        );
      } catch (error) {
        console.log('清理测试数据失败:', error);
      }
    }
  });

  test('完整的施工管理流程', async ({ page }) => {
    // 步骤1: 导航到施工管理页面
    await test.step('导航到施工管理页面', async () => {
      await page.click('text=开店筹备');
      await page.click('text=施工管理');
      await page.waitForURL('**/construction/**', { timeout: 10000 });
      
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-01-list-page.png',
        fullPage: true 
      });
    });

    // 步骤2: 创建施工项目
    await test.step('创建施工项目', async () => {
      // 点击创建按钮
      await page.click('button:has-text("新建施工项目")');
      
      // 等待表单加载
      await page.waitForSelector('form', { timeout: 5000 });
      
      // 填写项目信息
      await page.fill('input[name="name"]', testConstructionData.name);
      await page.fill('input[name="start_date"]', testConstructionData.start_date);
      await page.fill('input[name="end_date"]', testConstructionData.end_date);
      await page.fill('input[name="budget"]', String(testConstructionData.budget));
      await page.fill('textarea[name="description"]', '测试施工项目描述');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-02-project-form.png',
        fullPage: true 
      });
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 获取项目ID
      await page.waitForTimeout(1000);
      const url = page.url();
      const match = url.match(/\/construction\/(\d+)/);
      if (match) {
        createdProjectId = parseInt(match[1]);
      }
      
      expect(createdProjectId).toBeGreaterThan(0);
    });

    // 步骤3: 分配供应商
    await test.step('分配供应商', async () => {
      // 点击供应商管理标签
      await page.click('text=供应商管理');
      
      // 点击添加供应商
      await page.click('button:has-text("添加供应商")');
      
      // 选择供应商
      await page.selectOption('select[name="supplier_id"]', '1');
      await page.selectOption('select[name="work_type"]', 'decoration');
      await page.fill('input[name="contract_amount"]', '200000');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-03-supplier-assign.png',
        fullPage: true 
      });
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤4: 记录施工进度
    await test.step('记录施工进度', async () => {
      // 点击施工进度标签
      await page.click('text=施工进度');
      
      // 点击添加进度记录
      await page.click('button:has-text("添加进度")');
      
      // 填写进度信息
      await page.fill('input[name="progress_date"]', '2024-06-15');
      await page.fill('input[name="progress_percentage"]', '30');
      await page.fill('textarea[name="progress_description"]', '基础施工已完成，开始装修工作');
      await page.selectOption('select[name="status"]', 'in_progress');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-04-progress-record.png',
        fullPage: true 
      });
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤5: 上传施工照片
    await test.step('上传施工照片', async () => {
      // 点击施工照片标签
      await page.click('text=施工照片');
      
      // 点击上传照片按钮
      await page.click('button:has-text("上传照片")');
      
      // 填写照片信息
      await page.fill('input[name="photo_title"]', '施工现场照片');
      await page.fill('textarea[name="photo_description"]', '装修进度30%时的现场照片');
      
      // 模拟文件上传
      // const fileInput = await page.locator('input[type="file"]');
      // await fileInput.setInputFiles('path/to/test-photo.jpg');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-05-photo-upload.png',
        fullPage: true 
      });
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤6: 继续记录进度直到完成
    await test.step('记录施工完成', async () => {
      // 返回施工进度标签
      await page.click('text=施工进度');
      
      // 添加完成进度
      await page.click('button:has-text("添加进度")');
      await page.fill('input[name="progress_date"]', '2024-08-30');
      await page.fill('input[name="progress_percentage"]', '100');
      await page.fill('textarea[name="progress_description"]', '施工全部完成，准备验收');
      await page.selectOption('select[name="status"]', 'completed');
      
      // 保存
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-06-completed.png',
        fullPage: true 
      });
    });

    // 步骤7: 提交工程验收
    await test.step('提交工程验收', async () => {
      // 点击工程验收标签
      await page.click('text=工程验收');
      
      // 点击提交验收
      await page.click('button:has-text("提交验收")');
      
      // 填写验收信息
      await page.fill('input[name="acceptance_date"]', '2024-09-01');
      await page.fill('textarea[name="acceptance_notes"]', '施工质量良好，符合验收标准');
      await page.selectOption('select[name="acceptance_result"]', 'qualified');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-07-acceptance-submit.png',
        fullPage: true 
      });
      
      // 提交
      await page.click('button[type="submit"]:has-text("提交")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤8: 切换审批人审批验收
    await test.step('审批人审批验收', async () => {
      // 切换到审批人账号
      await authHelper.switchUser(testUsers.approver.username, testUsers.approver.password);
      
      // 导航到审批中心
      await page.goto('/pc/approval');
      
      // 查找待审批的验收
      await page.fill('input[placeholder*="搜索"]', testConstructionData.name);
      await page.click('button:has-text("搜索")');
      await page.waitForTimeout(1000);
      
      // 点击审批
      await page.click(`tr:has-text("${testConstructionData.name}") button:has-text("审批")`);
      await page.waitForSelector('.arco-modal', { timeout: 5000 });
      
      // 填写审批意见并通过
      await page.fill('textarea[name="approval_notes"]', '验收合格，同意通过');
      await page.click('.arco-modal button:has-text("通过")');
      
      // 等待审批成功
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-08-acceptance-approved.png',
        fullPage: true 
      });
    });

    // 步骤9: 完成门店交接
    await test.step('完成门店交接', async () => {
      // 切换回admin账号
      await authHelper.switchUser(testUsers.admin.username, testUsers.admin.password);
      
      // 导航到交接管理
      await page.goto('/pc/store-preparation/handover');
      
      // 创建交接记录
      await page.click('button:has-text("新建交接")');
      
      // 关联施工项目
      await page.selectOption('select[name="construction_project_id"]', String(createdProjectId));
      await page.fill('input[name="handover_date"]', '2024-09-05');
      await page.fill('textarea[name="handover_notes"]', '门店交接完成，可以开始营业准备');
      
      // 填写交接清单
      await page.click('text=交接清单');
      await page.click('button:has-text("添加项目")');
      await page.fill('input[name="item_name"]', '装修设施');
      await page.selectOption('select[name="item_status"]', 'normal');
      
      // 截图记录
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-09-handover.png',
        fullPage: true 
      });
      
      // 保存交接记录
      await page.click('button[type="submit"]:has-text("保存")');
      await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    });

    // 步骤10: 验证整个流程的数据流转
    await test.step('验证数据流转完整性', async () => {
      // 返回施工项目详情页
      await page.goto(`/pc/store-preparation/construction/${createdProjectId}`);
      await page.waitForLoadState('networkidle');
      
      // 验证项目状态
      const statusElement = await page.locator('[data-testid="project-status"]');
      const statusText = await statusElement.textContent();
      expect(statusText).toContain('已完成');
      
      // 验证供应商信息
      await page.click('text=供应商管理');
      const supplierCount = await page.locator('.supplier-item').count();
      expect(supplierCount).toBeGreaterThan(0);
      
      // 验证施工进度记录
      await page.click('text=施工进度');
      const progressCount = await page.locator('.progress-item').count();
      expect(progressCount).toBeGreaterThanOrEqual(2);
      
      // 验证验收记录
      await page.click('text=工程验收');
      const acceptanceElement = await page.locator('[data-testid="acceptance-info"]');
      expect(await acceptanceElement.isVisible()).toBe(true);
      
      // 验证交接记录关联
      const handoverLink = await page.locator('[data-testid="handover-link"]');
      expect(await handoverLink.isVisible()).toBe(true);
      
      // 截图记录最终状态
      await page.screenshot({ 
        path: 'playwright-report/screenshots/construction-10-final-verification.png',
        fullPage: true 
      });
    });
  });

  test('施工进度异常处理', async ({ page }) => {
    // 创建施工项目
    await page.goto('/pc/store-preparation/construction');
    await page.click('button:has-text("新建施工项目")');
    
    // 填写基本信息
    await page.fill('input[name="name"]', testConstructionData.name);
    await page.fill('input[name="start_date"]', testConstructionData.start_date);
    await page.fill('input[name="end_date"]', testConstructionData.end_date);
    await page.fill('input[name="budget"]', String(testConstructionData.budget));
    
    await page.click('button[type="submit"]:has-text("保存")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 记录异常进度
    await page.click('text=施工进度');
    await page.click('button:has-text("添加进度")');
    
    await page.fill('input[name="progress_date"]', '2024-06-20');
    await page.fill('input[name="progress_percentage"]', '20');
    await page.fill('textarea[name="progress_description"]', '施工进度延误，遇到技术问题');
    await page.selectOption('select[name="status"]', 'delayed');
    await page.fill('textarea[name="delay_reason"]', '材料供应延迟，预计延期一周');
    
    // 保存
    await page.click('button[type="submit"]:has-text("保存")');
    await page.waitForSelector('.arco-message-success', { timeout: 10000 });
    
    // 验证延期标记
    const delayBadge = await page.locator('[data-testid="delay-badge"]');
    expect(await delayBadge.isVisible()).toBe(true);
    
    // 截图记录
    await page.screenshot({ 
      path: 'playwright-report/screenshots/construction-delay-handling.png',
      fullPage: true 
    });
  });
});
