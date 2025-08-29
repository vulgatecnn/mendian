// 工具函数集合

import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

// 日期工具函数
export const dateUtils = {
  // 格式化日期
  format: (date: string | Date | Dayjs, format = 'YYYY-MM-DD') => {
    return dayjs(date || new Date()).format(format)
  },

  // 获取当前日期
  now: (format = 'YYYY-MM-DD HH:mm:ss') => {
    return dayjs().format(format)
  },

  // 判断是否是工作日
  isBusinessDay: (date: string | Date | Dayjs) => {
    const day = dayjs(date).day()
    return day >= 1 && day <= 5
  },

  // 获取季度
  getQuarter: (date: string | Date | Dayjs) => {
    return Math.floor(dayjs(date).month() / 3) + 1
  },

  // 计算两个日期的差值
  diff: (
    startDate: string | Date | Dayjs,
    endDate: string | Date | Dayjs,
    unit: 'day' | 'month' | 'year' = 'day'
  ) => {
    return dayjs(endDate).diff(dayjs(startDate), unit)
  },

  // 添加时间
  add: (date: string | Date | Dayjs, amount: number, unit: 'day' | 'month' | 'year') => {
    return dayjs(date).add(amount, unit)
  }
}

// 数字格式化工具
export const numberUtils = {
  // 格式化金额
  formatMoney: (amount: number, precision = 2) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(amount)
  },

  // 格式化千分位
  formatNumber: (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num)
  },

  // 格式化百分比
  formatPercent: (num: number, precision = 2) => {
    return `${(num * 100).toFixed(precision)}%`
  }
}

// 字符串工具函数
export const stringUtils = {
  // 生成随机字符串
  generateId: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // 截断文本
  truncate: (text: string, length: number, suffix = '...') => {
    if (text.length <= length) return text
    return text.slice(0, length) + suffix
  },

  // 首字母大写
  capitalize: (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },

  // 驼峰转下划线
  camelToSnake: (str: string) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  },

  // 下划线转驼峰
  snakeToCamel: (str: string) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}

// 验证工具函数
export const validateUtils = {
  // 验证手机号
  isPhone: (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone)
  },

  // 验证邮箱
  isEmail: (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  },

  // 验证身份证
  isIdCard: (idCard: string) => {
    return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(
      idCard
    )
  },

  // 验证用户名
  isUsername: (username: string) => {
    return /^[a-zA-Z0-9_]{4,16}$/.test(username)
  },

  // 验证密码强度
  isStrongPassword: (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password)
  }
}

// 本地存储工具
export const storageUtils = {
  // 设置localStorage
  setLocal: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('设置localStorage失败:', error)
    }
  },

  // 获取localStorage
  getLocal: <T = any>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('获取localStorage失败:', error)
      return null
    }
  },

  // 删除localStorage
  removeLocal: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除localStorage失败:', error)
    }
  },

  // 清空localStorage
  clearLocal: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('清空localStorage失败:', error)
    }
  },

  // 设置sessionStorage
  setSession: (key: string, value: any) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('设置sessionStorage失败:', error)
    }
  },

  // 获取sessionStorage
  getSession: <T = any>(key: string): T | null => {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('获取sessionStorage失败:', error)
      return null
    }
  }
}

// 数组工具函数
export const arrayUtils = {
  // 数组去重
  unique: <T>(arr: T[], key?: keyof T) => {
    if (key) {
      const seen = new Set()
      return arr.filter(item => {
        const value = item[key]
        if (seen.has(value)) {
          return false
        }
        seen.add(value)
        return true
      })
    }
    return [...new Set(arr)]
  },

  // 数组分组
  groupBy: <T>(arr: T[], key: keyof T) => {
    return arr.reduce(
      (groups, item) => {
        const group = String(item[key])
        groups[group] = groups[group] || []
        groups[group].push(item)
        return groups
      },
      {} as Record<string, T[]>
    )
  },

  // 数组排序
  sortBy: <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc') => {
    return [...arr].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  }
}

// URL工具函数
export const urlUtils = {
  // 解析URL参数
  parseQuery: (url?: string) => {
    const queryString = url ? url.split('?')[1] : window.location.search.slice(1)
    const params: Record<string, string> = {}

    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=')
        if (key) {
          params[decodeURIComponent(key)] = decodeURIComponent(value || '')
        }
      })
    }

    return params
  },

  // 构建URL参数
  buildQuery: (params: Record<string, any>) => {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    return query ? `?${query}` : ''
  }
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// 深拷贝
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T
  }

  if (typeof obj === 'object') {
    const cloned = {} as T
    Object.keys(obj).forEach(key => {
      cloned[key as keyof T] = deepClone((obj as any)[key])
    })
    return cloned
  }

  return obj
}
