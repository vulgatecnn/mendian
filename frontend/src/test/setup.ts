/**
 * Enhanced Test Setup File
 * 
 * This file configures the complete testing environment including:
 * - Global mocks and polyfills
 * - Test utilities
 * - Performance monitoring
 * - Error handling
 * - Clean up procedures
 */

import { beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Import all mocks and setup
import { setupAllMocks } from './mocks'
import { testHelpers } from './utils'
// Import services test setup for MSW
import '../services/tests/setup'

// Global test configuration
const GLOBAL_TEST_CONFIG = {
  TIMEOUT: 10000,
  MOCK_DELAY: 100,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_MEMORY_MONITORING: true,
  ENABLE_CONSOLE_MONITORING: true,
}

// Performance monitoring
let testStartTime: number
let memoryUsageStart: number

// Console monitoring
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log,
}

const consoleErrors: string[] = []
const consoleWarnings: string[] = []

// Enhanced console monitoring
const mockConsole = () => {
  console.error = vi.fn((...args) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    consoleErrors.push(message)
    
    // Still log to original console in development
    if (process.env.NODE_ENV === 'development') {
      originalConsole.error(...args)
    }
  })

  console.warn = vi.fn((...args) => {
    const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
    consoleWarnings.push(message)
    
    if (process.env.NODE_ENV === 'development') {
      originalConsole.warn(...args)
    }
  })

  console.log = vi.fn((...args) => {
    if (process.env.NODE_ENV === 'development') {
      originalConsole.log(...args)
    }
  })
}

// Restore console
const restoreConsole = () => {
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  console.log = originalConsole.log
}

// Setup global error handler
const setupErrorHandling = () => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
  })

  // Handle window errors (for jsdom)
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error)
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason)
    })
  }
}

// Memory monitoring utilities
const getMemoryUsage = (): number => {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

const checkMemoryUsage = (testName: string, threshold: number = 10 * 1024 * 1024) => {
  const currentUsage = getMemoryUsage()
  const memoryDiff = currentUsage - memoryUsageStart
  
  if (memoryDiff > threshold) {
    console.warn(`Memory usage increase detected in test "${testName}": ${memoryDiff} bytes`)
  }
  
  return memoryDiff
}

// Performance monitoring utilities
const checkPerformance = (testName: string, threshold: number = 1000) => {
  const testEndTime = performance.now()
  const duration = testEndTime - testStartTime
  
  if (duration > threshold) {
    console.warn(`Slow test detected: "${testName}" took ${duration}ms`)
  }
  
  return duration
}

// Test environment cleanup
const cleanupTestEnvironment = () => {
  // Clear all timers
  vi.clearAllTimers()
  
  // Cleanup React Testing Library
  cleanup()
  
  // Clear all mocks
  vi.clearAllMocks()
  
  // Clear console errors and warnings
  consoleErrors.length = 0
  consoleWarnings.length = 0
  
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  
  // Clear sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
  
  // Clear any remaining DOM elements
  if (typeof document !== 'undefined') {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
}

// Validate test environment
const validateTestEnvironment = () => {
  const errors: string[] = []
  
  // Check for required globals
  if (typeof window === 'undefined') {
    errors.push('window is not defined - jsdom environment not properly configured')
  }
  
  if (typeof document === 'undefined') {
    errors.push('document is not defined - jsdom environment not properly configured')
  }
  
  if (typeof HTMLElement === 'undefined') {
    errors.push('HTMLElement is not defined - jsdom environment not properly configured')
  }
  
  // Check for required testing libraries
  try {
    require('@testing-library/jest-dom')
  } catch (error) {
    errors.push('@testing-library/jest-dom not available')
  }
  
  if (errors.length > 0) {
    throw new Error(`Test environment validation failed:\n${errors.join('\n')}`)
  }
}

// Setup fake timers with enhanced configuration
const setupFakeTimers = () => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'Date',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ],
  })
}

// Global test hooks
beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  
  try {
    // Validate environment
    validateTestEnvironment()
    
    // Setup error handling
    setupErrorHandling()
    
    // Setup all mocks
    setupAllMocks()
    
    // Setup console monitoring
    if (GLOBAL_TEST_CONFIG.ENABLE_CONSOLE_MONITORING) {
      mockConsole()
    }
    
    // Setup fake timers
    setupFakeTimers()
    
    console.log('✅ Test environment setup complete')
  } catch (error) {
    console.error('❌ Test environment setup failed:', error)
    throw error
  }
})

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  
  // Restore console
  if (GLOBAL_TEST_CONFIG.ENABLE_CONSOLE_MONITORING) {
    restoreConsole()
  }
  
  // Restore real timers
  vi.useRealTimers()
  
  // Final cleanup
  cleanupTestEnvironment()
  
  // Report any remaining console errors
  if (consoleErrors.length > 0) {
    console.warn(`⚠️ ${consoleErrors.length} console errors occurred during tests:`)
    consoleErrors.forEach((error, index) => {
      console.warn(`  ${index + 1}. ${error}`)
    })
  }
  
  if (consoleWarnings.length > 0) {
    console.warn(`⚠️ ${consoleWarnings.length} console warnings occurred during tests:`)
    consoleWarnings.forEach((warning, index) => {
      console.warn(`  ${index + 1}. ${warning}`)
    })
  }
  
  console.log('✅ Test environment cleanup complete')
})

beforeEach(() => {
  // Reset performance monitoring
  if (GLOBAL_TEST_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
    testStartTime = performance.now()
  }
  
  // Reset memory monitoring
  if (GLOBAL_TEST_CONFIG.ENABLE_MEMORY_MONITORING) {
    memoryUsageStart = getMemoryUsage()
  }
  
  // Clear console tracking
  consoleErrors.length = 0
  consoleWarnings.length = 0
})

afterEach(({ meta }) => {
  const testName = meta?.name || 'unknown test'
  
  // Performance check
  if (GLOBAL_TEST_CONFIG.ENABLE_PERFORMANCE_MONITORING) {
    checkPerformance(testName)
  }
  
  // Memory check
  if (GLOBAL_TEST_CONFIG.ENABLE_MEMORY_MONITORING) {
    checkMemoryUsage(testName)
  }
  
  // Check for console errors in this test
  if (consoleErrors.length > 0) {
    console.warn(`Test "${testName}" generated ${consoleErrors.length} console errors`)
  }
  
  // Cleanup environment
  cleanupTestEnvironment()
})

// Export configuration for tests
export const testConfig = GLOBAL_TEST_CONFIG

// Export utilities for advanced testing
export const testUtilities = {
  getMemoryUsage,
  checkMemoryUsage,
  checkPerformance,
  cleanupTestEnvironment,
  getConsoleErrors: () => [...consoleErrors],
  getConsoleWarnings: () => [...consoleWarnings],
}

// Global test helpers
declare global {
  var testHelpers: typeof testHelpers
  var testConfig: typeof GLOBAL_TEST_CONFIG
  var testUtilities: typeof testUtilities
}

// Make utilities globally available
globalThis.testHelpers = testHelpers
globalThis.testConfig = GLOBAL_TEST_CONFIG
globalThis.testUtilities = testUtilities

// Additional custom matchers
expect.extend({
  // Custom matcher to check if an element is accessible
  toBeAccessible(received: HTMLElement) {
    const issues = testHelpers.checkA11y(received)
    
    return {
      message: () => 
        issues.length === 0
          ? `Expected element to have accessibility issues, but none were found`
          : `Expected element to be accessible, but found ${issues.length} issues: ${issues.join(', ')}`,
      pass: issues.length === 0,
    }
  },
  
  // Custom matcher to check performance
  toBePerformant(received: number, threshold: number = 100) {
    return {
      message: () => 
        received <= threshold
          ? `Expected operation to be slow (>${threshold}ms), but it took ${received}ms`
          : `Expected operation to be fast (<=${threshold}ms), but it took ${received}ms`,
      pass: received <= threshold,
    }
  },
  
  // Custom matcher to check memory usage
  toNotLeakMemory(received: number, threshold: number = 1024 * 1024) {
    return {
      message: () => 
        received <= threshold
          ? `Expected memory leak (>${threshold} bytes), but usage increased by ${received} bytes`
          : `Expected no memory leak (<=${threshold} bytes), but usage increased by ${received} bytes`,
      pass: received <= threshold,
    }
  }
})

// TypeScript declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeAccessible(): T
    toBePerformant(threshold?: number): T
    toNotLeakMemory(threshold?: number): T
  }
  interface AsymmetricMatchersContaining {
    toBeAccessible(): any
    toBePerformant(threshold?: number): any
    toNotLeakMemory(threshold?: number): any
  }
}

// Export setup complete indicator
export const setupComplete = true
