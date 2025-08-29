/**
 * 输入验证工具
 * 提供安全的输入验证和清理功能
 */

export interface ValidationResult {
  isValid: boolean
  message?: string
  sanitized?: string
}

/**
 * 验证规则类型
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => boolean | string
}

/**
 * 基础验证器类
 */
export class Validator {
  /**
   * 验证必填项
   */
  static required(value: string): ValidationResult {
    const isValid = value !== undefined && value !== null && value.trim() !== ''
    return {
      isValid,
      message: isValid ? undefined : '此字段为必填项',
      sanitized: value?.trim()
    }
  }

  /**
   * 验证长度范围
   */
  static length(value: string, min?: number, max?: number): ValidationResult {
    const trimmed = value?.trim() || ''
    let isValid = true
    let message: string | undefined

    if (min !== undefined && trimmed.length < min) {
      isValid = false
      message = `长度不能少于${min}个字符`
    } else if (max !== undefined && trimmed.length > max) {
      isValid = false
      message = `长度不能超过${max}个字符`
    }

    return { isValid, message, sanitized: trimmed }
  }

  /**
   * 验证邮箱格式
   */
  static email(value: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmed = value?.trim() || ''
    const isValid = emailRegex.test(trimmed)

    return {
      isValid,
      message: isValid ? undefined : '请输入有效的邮箱地址',
      sanitized: trimmed.toLowerCase()
    }
  }

  /**
   * 验证手机号格式（中国大陆）
   */
  static phone(value: string): ValidationResult {
    const phoneRegex = /^1[3-9]\d{9}$/
    const cleaned = value?.replace(/\D/g, '') || ''
    const isValid = phoneRegex.test(cleaned)

    return {
      isValid,
      message: isValid ? undefined : '请输入有效的手机号码',
      sanitized: cleaned
    }
  }

  /**
   * 验证身份证号码
   */
  static idCard(value: string): ValidationResult {
    const idCardRegex = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    const cleaned = value?.trim().replace(/\s/g, '') || ''
    const isValid = idCardRegex.test(cleaned)

    return {
      isValid,
      message: isValid ? undefined : '请输入有效的身份证号码',
      sanitized: cleaned.toUpperCase()
    }
  }

  /**
   * 验证密码强度
   */
  static password(value: string, level: 'weak' | 'medium' | 'strong' = 'medium'): ValidationResult {
    let isValid = true
    let message: string | undefined

    const rules = {
      weak: {
        minLength: 6,
        pattern: /^.{6,}$/
      },
      medium: {
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
      },
      strong: {
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&].{8,}$/
      }
    }

    const rule = rules[level]
    if (value.length < rule.minLength) {
      isValid = false
      message = `密码长度不能少于${rule.minLength}位`
    } else if (!rule.pattern.test(value)) {
      isValid = false
      switch (level) {
        case 'weak':
          message = '密码格式不正确'
          break
        case 'medium':
          message = '密码必须包含大小写字母和数字'
          break
        case 'strong':
          message = '密码必须包含大小写字母、数字和特殊字符'
          break
      }
    }

    return { isValid, message }
  }

  /**
   * 验证URL格式
   */
  static url(value: string): ValidationResult {
    try {
      const url = new URL(value)
      const isValid = ['http:', 'https:'].includes(url.protocol)
      return {
        isValid,
        message: isValid ? undefined : '请输入有效的URL地址',
        sanitized: value.trim()
      }
    } catch {
      return {
        isValid: false,
        message: '请输入有效的URL地址',
        sanitized: value.trim()
      }
    }
  }

  /**
   * 验证数字格式
   */
  static number(value: string, options?: { min?: number; max?: number; integer?: boolean }): ValidationResult {
    const trimmed = value?.trim() || ''
    const num = Number(trimmed)
    let isValid = !isNaN(num) && isFinite(num)
    let message: string | undefined

    if (!isValid) {
      message = '请输入有效的数字'
    } else {
      if (options?.integer && !Number.isInteger(num)) {
        isValid = false
        message = '请输入整数'
      } else if (options?.min !== undefined && num < options.min) {
        isValid = false
        message = `数值不能小于${options.min}`
      } else if (options?.max !== undefined && num > options.max) {
        isValid = false
        message = `数值不能大于${options.max}`
      }
    }

    return { isValid, message, sanitized: trimmed }
  }

  /**
   * 通用验证方法
   */
  static validate(value: string, rules: ValidationRule): ValidationResult {
    let result: ValidationResult = { isValid: true, sanitized: value }

    // 必填验证
    if (rules.required) {
      result = this.required(value)
      if (!result.isValid) return result
    }

    // 如果不是必填且值为空，则跳过其他验证
    if (!rules.required && (!value || value.trim() === '')) {
      return { isValid: true, sanitized: '' }
    }

    // 长度验证
    if (rules.minLength !== undefined || rules.maxLength !== undefined) {
      result = this.length(value, rules.minLength, rules.maxLength)
      if (!result.isValid) return result
    }

    // 正则验证
    if (rules.pattern) {
      const isValid = rules.pattern.test(result.sanitized || value)
      if (!isValid) {
        return { isValid: false, message: '格式不正确' }
      }
    }

    // 自定义验证
    if (rules.custom) {
      const customResult = rules.custom(result.sanitized || value)
      if (typeof customResult === 'string') {
        return { isValid: false, message: customResult }
      } else if (!customResult) {
        return { isValid: false, message: '验证失败' }
      }
    }

    return result
  }
}

/**
 * HTML 清理工具
 * 防止 XSS 攻击
 */
export class Sanitizer {
  /**
   * 转义HTML字符
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 清理HTML标签
   */
  static stripHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  /**
   * 清理JavaScript代码
   */
  static removeScript(text: string): string {
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  /**
   * 清理SQL注入字符
   */
  static sanitizeSql(text: string): string {
    const sqlKeywords = ['select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'exec', 'union', 'script']
    let sanitized = text
    
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      sanitized = sanitized.replace(regex, '')
    })
    
    return sanitized
  }

  /**
   * 综合清理方法
   */
  static clean(text: string, options?: {
    escapeHtml?: boolean
    stripHtml?: boolean
    removeScript?: boolean
    sanitizeSql?: boolean
  }): string {
    let cleaned = text

    if (options?.removeScript !== false) {
      cleaned = this.removeScript(cleaned)
    }

    if (options?.stripHtml) {
      cleaned = this.stripHtml(cleaned)
    }

    if (options?.escapeHtml) {
      cleaned = this.escapeHtml(cleaned)
    }

    if (options?.sanitizeSql) {
      cleaned = this.sanitizeSql(cleaned)
    }

    return cleaned
  }
}

/**
 * 表单验证 Hook
 */
export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  rules: Record<keyof T, ValidationRule>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback((name: keyof T, value: string) => {
    const rule = rules[name]
    if (!rule) return { isValid: true }

    return Validator.validate(value, rule)
  }, [rules])

  const setFieldValue = useCallback((name: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // 实时验证
    const validation = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: validation.isValid ? undefined : validation.message
    }))
  }, [validateField])

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(values).forEach((key) => {
      const name = key as keyof T
      const validation = validateField(name, values[name])
      if (!validation.isValid) {
        newErrors[name] = validation.message
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validateField])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

// 导出
export { Validator, Sanitizer }
export default Validator