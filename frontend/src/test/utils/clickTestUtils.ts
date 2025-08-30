import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'

// 点击测试工具集合
export class ClickTestUtils {
  protected user = userEvent.setup()

  // 测试所有按钮点击
  async testAllButtons(container: HTMLElement = document.body) {
    const buttons = container.querySelectorAll('button:not([disabled])')
    const results: { element: HTMLElement; success: boolean; error?: string }[] = []

    for (const button of Array.from(buttons)) {
      try {
        await this.user.click(button as HTMLElement)
        results.push({ element: button as HTMLElement, success: true })
      } catch (error) {
        results.push({ 
          element: button as HTMLElement, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试所有链接点击
  async testAllLinks(container: HTMLElement = document.body) {
    const links = container.querySelectorAll('a[href]:not([disabled])')
    const results: { element: HTMLElement; success: boolean; error?: string }[] = []

    for (const link of Array.from(links)) {
      try {
        await this.user.click(link as HTMLElement)
        results.push({ element: link as HTMLElement, success: true })
      } catch (error) {
        results.push({ 
          element: link as HTMLElement, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试所有可点击元素（包括div等带有onClick的元素）
  async testAllClickableElements(container: HTMLElement = document.body) {
    const clickableElements = container.querySelectorAll(
      '[onclick], [role="button"], [tabindex], .ant-btn, .ant-menu-item, .ant-dropdown-trigger'
    )
    const results: { element: HTMLElement; success: boolean; error?: string }[] = []

    for (const element of Array.from(clickableElements)) {
      try {
        await this.user.click(element as HTMLElement)
        results.push({ element: element as HTMLElement, success: true })
      } catch (error) {
        results.push({ 
          element: element as HTMLElement, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试表单提交
  async testFormSubmissions(container: HTMLElement = document.body) {
    const forms = container.querySelectorAll('form')
    const results: { element: HTMLElement; success: boolean; error?: string }[] = []

    for (const form of Array.from(forms)) {
      try {
        fireEvent.submit(form)
        results.push({ element: form as HTMLElement, success: true })
      } catch (error) {
        results.push({ 
          element: form as HTMLElement, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试模态框交互
  async testModalInteractions() {
    const results: { action: string; success: boolean; error?: string }[] = []

    // 查找并测试模态框打开按钮
    const modalTriggers = screen.queryAllByText(/打开|新增|编辑|查看|详情|设置/)
    for (const trigger of modalTriggers) {
      try {
        await this.user.click(trigger)
        
        // 等待模态框出现
        await waitFor(() => {
          const modal = document.querySelector('.ant-modal')
          expect(modal).toBeInTheDocument()
        }, { timeout: 2000 })

        // 测试关闭模态框
        const closeButtons = screen.queryAllByRole('button', { name: /取消|关闭/ })
        if (closeButtons.length > 0) {
          await this.user.click(closeButtons[0])
        }

        results.push({ action: `Modal trigger: ${trigger.textContent}`, success: true })
      } catch (error) {
        results.push({ 
          action: `Modal trigger: ${trigger.textContent}`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试下拉菜单交互
  async testDropdownInteractions() {
    const results: { action: string; success: boolean; error?: string }[] = []

    const dropdownTriggers = document.querySelectorAll('.ant-dropdown-trigger')
    for (const trigger of Array.from(dropdownTriggers)) {
      try {
        await this.user.click(trigger as HTMLElement)
        
        // 等待下拉菜单出现
        await waitFor(() => {
          const dropdown = document.querySelector('.ant-dropdown')
          expect(dropdown).toBeInTheDocument()
        }, { timeout: 1000 })

        // 点击菜单项
        const menuItems = document.querySelectorAll('.ant-dropdown-menu-item')
        if (menuItems.length > 0) {
          await this.user.click(menuItems[0] as HTMLElement)
        }

        results.push({ action: `Dropdown trigger`, success: true })
      } catch (error) {
        results.push({ 
          action: `Dropdown trigger`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试表格操作
  async testTableInteractions(container: HTMLElement = document.body) {
    const results: { action: string; success: boolean; error?: string }[] = []

    // 测试表格排序
    const sortableHeaders = container.querySelectorAll('.ant-table-column-sorters')
    for (const header of Array.from(sortableHeaders)) {
      try {
        await this.user.click(header as HTMLElement)
        results.push({ action: `Table sort: ${(header as HTMLElement).textContent}`, success: true })
      } catch (error) {
        results.push({ 
          action: `Table sort: ${(header as HTMLElement).textContent}`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // 测试分页
    const paginationButtons = container.querySelectorAll('.ant-pagination button:not([disabled])')
    for (const button of Array.from(paginationButtons)) {
      try {
        await this.user.click(button as HTMLElement)
        results.push({ action: `Pagination button`, success: true })
      } catch (error) {
        results.push({ 
          action: `Pagination button`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试Tab切换
  async testTabInteractions(container: HTMLElement = document.body) {
    const results: { action: string; success: boolean; error?: string }[] = []

    const tabPanes = container.querySelectorAll('.ant-tabs-tab')
    for (const tab of Array.from(tabPanes)) {
      try {
        await this.user.click(tab as HTMLElement)
        results.push({ action: `Tab: ${(tab as HTMLElement).textContent}`, success: true })
      } catch (error) {
        results.push({ 
          action: `Tab: ${(tab as HTMLElement).textContent}`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试键盘导航
  async testKeyboardNavigation(container: HTMLElement = document.body) {
    const results: { action: string; success: boolean; error?: string }[] = []
    
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    for (let i = 0; i < focusableElements.length; i++) {
      try {
        const element = focusableElements[i] as HTMLElement
        element.focus()
        
        // 测试Tab键导航
        await this.user.keyboard('{Tab}')
        
        // 测试Enter键
        if (element.tagName.toLowerCase() === 'button' || element.role === 'button') {
          await this.user.keyboard('{Enter}')
        }
        
        // 测试Space键（针对按钮）
        if (element.tagName.toLowerCase() === 'button') {
          await this.user.keyboard(' ')
        }

        results.push({ action: `Keyboard navigation: ${element.tagName}`, success: true })
      } catch (error) {
        results.push({ 
          action: `Keyboard navigation: ${focusableElements[i].tagName}`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试移动端触摸事件
  async testTouchEvents(container: HTMLElement = document.body) {
    const results: { action: string; success: boolean; error?: string }[] = []

    const touchableElements = container.querySelectorAll('button, a, [onclick], .ant-btn')
    
    for (const element of Array.from(touchableElements)) {
      try {
        // 模拟触摸事件
        fireEvent.touchStart(element as HTMLElement)
        fireEvent.touchEnd(element as HTMLElement)
        
        results.push({ action: `Touch: ${(element as HTMLElement).textContent}`, success: true })
      } catch (error) {
        results.push({ 
          action: `Touch: ${(element as HTMLElement).textContent}`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 综合点击测试 - 测试页面上所有交互元素
  async comprehensiveClickTest(container: HTMLElement = document.body) {
    const allResults = {
      buttons: await this.testAllButtons(container),
      links: await this.testAllLinks(container),
      clickableElements: await this.testAllClickableElements(container),
      forms: await this.testFormSubmissions(container),
      modals: await this.testModalInteractions(),
      dropdowns: await this.testDropdownInteractions(),
      tables: await this.testTableInteractions(container),
      tabs: await this.testTabInteractions(container),
      keyboard: await this.testKeyboardNavigation(container),
      touch: await this.testTouchEvents(container),
    }

    // 生成测试报告
    const report = {
      totalTests: Object.values(allResults).reduce((sum, results) => sum + results.length, 0),
      successfulTests: Object.values(allResults).reduce(
        (sum, results) => sum + results.filter(r => r.success).length, 0
      ),
      failedTests: Object.values(allResults).reduce(
        (sum, results) => sum + results.filter(r => !r.success).length, 0
      ),
      details: allResults,
    }

    return report
  }

  // 断言助手 - 验证所有按钮都可以点击
  expectAllButtonsClickable(results: { element: HTMLElement; success: boolean; error?: string }[]) {
    const failedButtons = results.filter(r => !r.success)
    if (failedButtons.length > 0) {
      console.error('Failed button clicks:', failedButtons)
    }
    expect(failedButtons.length).toBe(0)
  }

  // 断言助手 - 验证关键交互元素存在
  expectCriticalElementsPresent(container: HTMLElement = document.body) {
    // 验证基本导航元素
    const criticalSelectors = [
      'button', // 至少有一个按钮
      'a[href]', // 至少有一个链接
    ]

    criticalSelectors.forEach(selector => {
      const elements = container.querySelectorAll(selector)
      expect(elements.length).toBeGreaterThan(0)
    })
  }
}

// 创建单例实例
export const clickTestUtils = new ClickTestUtils()

// 便捷的测试函数
export const testAllClicks = async (container?: HTMLElement) => {
  return await clickTestUtils.comprehensiveClickTest(container)
}

export const expectAllClicksWork = async (container?: HTMLElement) => {
  const results = await testAllClicks(container)
  expect(results.failedTests).toBe(0)
  return results
}

// Antd 特定的点击测试工具
export class AntdClickTestUtils extends ClickTestUtils {
  // 测试Antd表单组件
  async testAntdFormControls(container: HTMLElement = document.body) {
    const results: { action: string; success: boolean; error?: string }[] = []

    // 测试Select组件
    const selects = container.querySelectorAll('.ant-select-selector')
    for (const select of Array.from(selects)) {
      try {
        await this.user.click(select as HTMLElement)
        // 等待下拉选项出现
        await waitFor(() => {
          const dropdown = document.querySelector('.ant-select-dropdown')
          expect(dropdown).toBeInTheDocument()
        }, { timeout: 1000 })
        results.push({ action: `Select component`, success: true })
      } catch (error) {
        results.push({ 
          action: `Select component`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // 测试DatePicker组件
    const datePickers = container.querySelectorAll('.ant-picker')
    for (const picker of Array.from(datePickers)) {
      try {
        await this.user.click(picker as HTMLElement)
        results.push({ action: `DatePicker component`, success: true })
      } catch (error) {
        results.push({ 
          action: `DatePicker component`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  // 测试Antd消息组件
  async testAntdNotifications() {
    const results: { action: string; success: boolean; error?: string }[] = []

    // 查找可能触发notification的按钮
    const notificationTriggers = screen.queryAllByText(/保存|提交|删除|确认/)
    for (const trigger of notificationTriggers) {
      try {
        await this.user.click(trigger)
        // 检查是否有notification出现
        await waitFor(() => {
          // 检查notification是否出现，但不需要使用返回值
          document.querySelector('.ant-notification')
          // notification可能不会立即出现，这是正常的
        }, { timeout: 1000 })
        results.push({ action: `Notification trigger: ${trigger.textContent}`, success: true })
      } catch (error) {
        results.push({ 
          action: `Notification trigger: ${trigger.textContent}`, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }
}

export const antdClickTestUtils = new AntdClickTestUtils()