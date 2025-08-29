import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect } from 'vitest'
import type { UserEvent } from '@testing-library/user-event'

// 测试助手工具集合
export class TestHelpers {
  private user: UserEvent

  constructor() {
    this.user = userEvent.setup()
  }

  // 等待元素出现
  async waitForElement(selector: string, options?: { timeout?: number }) {
    return waitFor(
      () => {
        const element = document.querySelector(selector)
        expect(element).toBeInTheDocument()
        return element
      },
      { timeout: options?.timeout || 3000 }
    )
  }

  // 等待元素消失
  async waitForElementToDisappear(selector: string, options?: { timeout?: number }) {
    return waitFor(
      () => {
        const element = document.querySelector(selector)
        expect(element).not.toBeInTheDocument()
      },
      { timeout: options?.timeout || 3000 }
    )
  }

  // 等待加载完成
  async waitForLoadingToComplete(timeout = 5000) {
    await waitFor(
      () => {
        const loadingElements = document.querySelectorAll('.ant-spin-spinning, .loading')
        expect(loadingElements).toHaveLength(0)
      },
      { timeout }
    )
  }

  // 填写表单
  async fillForm(formData: Record<string, any>, formContainer?: HTMLElement) {
    const container = formContainer || document.body

    for (const [fieldName, value] of Object.entries(formData)) {
      if (value === null || value === undefined) continue

      // 尝试不同的选择器策略
      const selectors = [
        `[name="${fieldName}"]`,
        `[data-testid="${fieldName}"]`,
        `[placeholder*="${fieldName}"]`,
        `label:has-text("${fieldName}") + input`,
      ]

      let element: HTMLElement | null = null
      
      for (const selector of selectors) {
        element = container.querySelector(selector) as HTMLElement
        if (element) break
      }

      if (!element) {
        // 尝试通过label文本查找
        const labels = container.querySelectorAll('label')
        for (const label of Array.from(labels)) {
          if (label.textContent?.includes(fieldName)) {
            const labelFor = label.getAttribute('for')
            if (labelFor) {
              element = container.querySelector(`#${labelFor}`) as HTMLElement
            } else {
              element = label.querySelector('input, select, textarea') as HTMLElement
            }
            break
          }
        }
      }

      if (element) {
        await this.fillFormField(element, value)
      } else {
        console.warn(`Could not find form field: ${fieldName}`)
      }
    }
  }

  // 填写单个表单字段
  private async fillFormField(element: HTMLElement, value: any) {
    const tagName = element.tagName.toLowerCase()
    const type = element.getAttribute('type')
    const role = element.getAttribute('role')

    if (tagName === 'input') {
      if (type === 'checkbox' || type === 'radio') {
        if (value) {
          await this.user.click(element)
        }
      } else if (type === 'file') {
        // 文件上传需要特殊处理
        if (value instanceof File || Array.isArray(value)) {
          const input = element as HTMLInputElement
          const files = Array.isArray(value) ? value : [value]
          await this.user.upload(input, files)
        }
      } else {
        await this.user.clear(element)
        if (value !== '') {
          await this.user.type(element, String(value))
        }
      }
    } else if (tagName === 'select') {
      await this.user.selectOptions(element as HTMLSelectElement, String(value))
    } else if (tagName === 'textarea') {
      await this.user.clear(element)
      if (value !== '') {
        await this.user.type(element, String(value))
      }
    } else if (element.classList.contains('ant-select-selector')) {
      // Antd Select组件
      await this.user.click(element)
      await waitFor(() => {
        const dropdown = document.querySelector('.ant-select-dropdown')
        expect(dropdown).toBeInTheDocument()
      })
      
      const option = document.querySelector(`[title="${value}"]`) ||
                    document.querySelector(`.ant-select-item:has-text("${value}")`)
      if (option) {
        await this.user.click(option as HTMLElement)
      }
    } else if (element.classList.contains('ant-picker-input')) {
      // Antd DatePicker组件
      await this.user.click(element)
      if (typeof value === 'string') {
        await this.user.type(element, value)
      }
    } else if (role === 'combobox') {
      // 其他下拉组件
      await this.user.click(element)
      await this.user.type(element, String(value))
    }
  }

  // 提交表单
  async submitForm(formSelector: string = 'form') {
    const form = document.querySelector(formSelector) as HTMLFormElement
    expect(form).toBeInTheDocument()
    
    const submitButton = form.querySelector('[type="submit"], .ant-btn-primary')
    if (submitButton) {
      await this.user.click(submitButton as HTMLElement)
    } else {
      // 如果没有找到提交按钮，直接提交表单
      form.submit()
    }
  }

  // 搜索表格
  async searchTable(searchTerm: string, searchInputSelector: string = '.ant-input') {
    const searchInput = document.querySelector(searchInputSelector) as HTMLInputElement
    expect(searchInput).toBeInTheDocument()
    
    await this.user.clear(searchInput)
    await this.user.type(searchInput, searchTerm)
    
    // 查找搜索按钮
    const searchButton = document.querySelector('.ant-btn:has-text("搜索"), [data-testid="search-button"]')
    if (searchButton) {
      await this.user.click(searchButton as HTMLElement)
    }
    
    // 等待搜索结果加载
    await this.waitForLoadingToComplete()
  }

  // 操作表格行
  async operateTableRow(rowIndex: number, operation: string) {
    const tableBody = document.querySelector('.ant-table-tbody')
    expect(tableBody).toBeInTheDocument()
    
    const rows = tableBody!.querySelectorAll('tr')
    expect(rows.length).toBeGreaterThan(rowIndex)
    
    const row = rows[rowIndex]
    const operationButton = row.querySelector(`button:has-text("${operation}"), a:has-text("${operation}")`)
    
    if (operationButton) {
      await this.user.click(operationButton as HTMLElement)
    } else {
      // 尝试通过下拉菜单查找操作
      const moreButton = row.querySelector('.ant-dropdown-trigger, [data-testid="more-actions"]')
      if (moreButton) {
        await this.user.click(moreButton as HTMLElement)
        
        await waitFor(() => {
          const dropdown = document.querySelector('.ant-dropdown-menu')
          expect(dropdown).toBeInTheDocument()
        })
        
        const menuItem = document.querySelector(`.ant-dropdown-menu-item:has-text("${operation}")`)
        if (menuItem) {
          await this.user.click(menuItem as HTMLElement)
        }
      }
    }
  }

  // 操作分页
  async navigateToPage(page: number) {
    const pagination = document.querySelector('.ant-pagination')
    if (!pagination) return
    
    const pageButton = pagination.querySelector(`[title="${page}"]`)
    if (pageButton) {
      await this.user.click(pageButton as HTMLElement)
      await this.waitForLoadingToComplete()
    }
  }

  // 更改页面大小
  async changePageSize(pageSize: number) {
    const pageSizeSelector = document.querySelector('.ant-pagination-options-size-changer')
    if (pageSizeSelector) {
      await this.user.click(pageSizeSelector as HTMLElement)
      
      const option = document.querySelector(`[title="${pageSize}条/页"]`)
      if (option) {
        await this.user.click(option as HTMLElement)
        await this.waitForLoadingToComplete()
      }
    }
  }

  // 处理模态框
  async openModal(triggerSelector: string) {
    const trigger = document.querySelector(triggerSelector)
    expect(trigger).toBeInTheDocument()
    
    await this.user.click(trigger as HTMLElement)
    
    await waitFor(() => {
      const modal = document.querySelector('.ant-modal')
      expect(modal).toBeInTheDocument()
    })
  }

  async closeModal(method: 'cancel' | 'close' | 'mask' = 'cancel') {
    const modal = document.querySelector('.ant-modal')
    expect(modal).toBeInTheDocument()
    
    let closeElement: HTMLElement | null = null
    
    switch (method) {
      case 'cancel':
        closeElement = modal!.querySelector('.ant-btn:not(.ant-btn-primary)')
        break
      case 'close':
        closeElement = modal!.querySelector('.ant-modal-close')
        break
      case 'mask':
        closeElement = document.querySelector('.ant-modal-mask')
        break
    }
    
    if (closeElement) {
      await this.user.click(closeElement)
    }
    
    await this.waitForElementToDisappear('.ant-modal')
  }

  async confirmModal() {
    const modal = document.querySelector('.ant-modal')
    expect(modal).toBeInTheDocument()
    
    const confirmButton = modal!.querySelector('.ant-btn-primary')
    expect(confirmButton).toBeInTheDocument()
    
    await this.user.click(confirmButton as HTMLElement)
  }

  // 处理消息提示
  async waitForMessage(type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    await waitFor(() => {
      const message = document.querySelector(`.ant-message-${type}`)
      expect(message).toBeInTheDocument()
    })
  }

  async waitForNotification(type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    await waitFor(() => {
      const notification = document.querySelector(`.ant-notification-notice-${type}`)
      expect(notification).toBeInTheDocument()
    })
  }

  // 切换Tab
  async switchTab(tabTitle: string) {
    const tabElement = screen.getByRole('tab', { name: tabTitle })
    await this.user.click(tabElement)
    
    await waitFor(() => {
      expect(tabElement).toHaveAttribute('aria-selected', 'true')
    })
  }

  // 处理抽屉
  async openDrawer(triggerSelector: string) {
    const trigger = document.querySelector(triggerSelector)
    expect(trigger).toBeInTheDocument()
    
    await this.user.click(trigger as HTMLElement)
    
    await waitFor(() => {
      const drawer = document.querySelector('.ant-drawer')
      expect(drawer).toBeInTheDocument()
    })
  }

  async closeDrawer() {
    const closeButton = document.querySelector('.ant-drawer-close')
    if (closeButton) {
      await this.user.click(closeButton as HTMLElement)
    }
    
    await this.waitForElementToDisappear('.ant-drawer')
  }

  // 文件上传助手
  async uploadFile(files: File[], inputSelector: string = 'input[type="file"]') {
    const fileInput = document.querySelector(inputSelector) as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    
    await this.user.upload(fileInput, files)
  }

  // 创建测试文件
  createTestFile(name: string, content: string = 'test content', type: string = 'text/plain'): File {
    return new File([content], name, { type })
  }

  // 断言助手
  expectElementToBeVisible(selector: string) {
    const element = document.querySelector(selector)
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
  }

  expectElementToHaveText(selector: string, text: string) {
    const element = document.querySelector(selector)
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent(text)
  }

  expectTableToHaveRows(count: number) {
    const rows = document.querySelectorAll('.ant-table-tbody tr:not(.ant-table-placeholder)')
    expect(rows).toHaveLength(count)
  }

  expectFormToHaveError(fieldName: string, errorMessage?: string) {
    const errorElement = document.querySelector(`[data-testid="${fieldName}-error"], .ant-form-item-explain-error`)
    expect(errorElement).toBeInTheDocument()
    
    if (errorMessage) {
      expect(errorElement).toHaveTextContent(errorMessage)
    }
  }

  // 性能测试助手
  async measureRenderTime(renderFn: () => Promise<void>): Promise<number> {
    const startTime = performance.now()
    await renderFn()
    const endTime = performance.now()
    return endTime - startTime
  }

  // 内存泄漏检测助手
  checkForMemoryLeaks(componentName: string) {
    // 简单的内存泄漏检测
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    return {
      finish: () => {
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
        const memoryDiff = finalMemory - initialMemory
        
        if (memoryDiff > 1024 * 1024) { // 1MB threshold
          console.warn(`Potential memory leak in ${componentName}: ${memoryDiff} bytes`)
        }
        
        return memoryDiff
      }
    }
  }

  // 可访问性测试助手
  async checkA11y(container: HTMLElement = document.body) {
    // 检查基本的可访问性
    const issues: string[] = []
    
    // 检查是否有alt属性
    const images = container.querySelectorAll('img:not([alt])')
    if (images.length > 0) {
      issues.push(`Found ${images.length} images without alt text`)
    }
    
    // 检查是否有表单标签
    const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id')
      return !id || !container.querySelector(`label[for="${id}"]`)
    })
    if (unlabeledInputs.length > 0) {
      issues.push(`Found ${unlabeledInputs.length} inputs without labels`)
    }
    
    // 检查按钮是否有可访问的名称
    const buttons = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])')
    const unlabeledButtons = Array.from(buttons).filter(button => 
      !button.textContent?.trim()
    )
    if (unlabeledButtons.length > 0) {
      issues.push(`Found ${unlabeledButtons.length} buttons without accessible names`)
    }
    
    return issues
  }

  // 获取内存使用情况
  getMemoryUsage() {
    const memory = (performance as any).memory
    return memory?.usedJSHeapSize || 0
  }
}

// 创建单例实例
export const testHelpers = new TestHelpers()

// 导出便捷函数
export const waitForElement = (selector: string, options?: { timeout?: number }) => 
  testHelpers.waitForElement(selector, options)

export const waitForLoadingToComplete = (timeout?: number) => 
  testHelpers.waitForLoadingToComplete(timeout)

export const fillForm = (formData: Record<string, any>, formContainer?: HTMLElement) => 
  testHelpers.fillForm(formData, formContainer)

export const submitForm = (formSelector?: string) => 
  testHelpers.submitForm(formSelector)

export const searchTable = (searchTerm: string, searchInputSelector?: string) => 
  testHelpers.searchTable(searchTerm, searchInputSelector)

export const operateTableRow = (rowIndex: number, operation: string) => 
  testHelpers.operateTableRow(rowIndex, operation)

export const openModal = (triggerSelector: string) => 
  testHelpers.openModal(triggerSelector)

export const closeModal = (method?: 'cancel' | 'close' | 'mask') => 
  testHelpers.closeModal(method)

export const confirmModal = () => 
  testHelpers.confirmModal()

// 全局测试工具导出
export default testHelpers