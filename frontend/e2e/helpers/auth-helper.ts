/**
 * E2E测试认证辅助函数
 */

import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * 登录系统
   */
  async login(username: string, password: string) {
    // 访问登录页
    await this.page.goto('/pc/login');

    // 等待登录表单加载
    await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });

    // 填写登录信息
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);

    // 点击登录按钮
    await this.page.click('button[type="submit"]');

    // 等待登录成功，跳转到首页
    await this.page.waitForURL('/pc', { timeout: 10000 });
  }

  /**
   * 登出系统
   */
  async logout() {
    // 点击用户菜单
    await this.page.click('[data-testid="user-menu"]');

    // 点击登出按钮
    await this.page.click('[data-testid="logout-button"]');

    // 等待跳转到登录页
    await this.page.waitForURL('/pc/login', { timeout: 10000 });
  }

  /**
   * 检查是否已登录
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // 检查是否存在用户菜单元素
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 切换用户（先登出再登录）
   */
  async switchUser(username: string, password: string) {
    const loggedIn = await this.isLoggedIn();
    if (loggedIn) {
      await this.logout();
    }
    await this.login(username, password);
  }
}
