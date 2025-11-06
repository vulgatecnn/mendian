import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 端到端测试配置
 * 用于测试完整的业务流程和用户场景
 */
export default defineConfig({
  testDir: './e2e',
  
  // 测试超时时间
  timeout: 30 * 1000,
  
  // 期望超时时间
  expect: {
    timeout: 5000
  },
  
  // 失败时重试次数
  retries: 0,
  
  // 并行执行的worker数量
  workers: undefined,
  
  // 报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list']
  ],
  
  // 全局配置
  use: {
    // 基础URL
    baseURL: 'http://localhost:5173',
    
    // 截图配置
    screenshot: 'only-on-failure',
    
    // 视频录制
    video: 'retain-on-failure',
    
    // 追踪
    trace: 'on-first-retry',
  },

  // 测试项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // 移动端测试
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // 开发服务器配置（可选）
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
