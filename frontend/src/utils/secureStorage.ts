/**
 * 安全存储工具
 * 提供加密的本地存储，避免敏感信息明文存储
 */

import { md5 } from 'js-md5'

interface SecureStorageConfig {
  prefix?: string
  encryptionKey?: string
  useSessionStorage?: boolean
}

class SecureStorage {
  private storage: Storage
  private prefix: string
  private encryptionKey: string

  constructor(config: SecureStorageConfig = {}) {
    this.storage = config.useSessionStorage ? sessionStorage : localStorage
    this.prefix = config.prefix || 'app_secure_'
    this.encryptionKey = config.encryptionKey || this.generateDefaultKey()
  }

  /**
   * 生成默认加密密钥（基于环境信息）
   */
  private generateDefaultKey(): string {
    const baseKey = `${window.location.hostname}_${navigator.userAgent.slice(0, 50)}`
    return md5(baseKey).slice(0, 16)
  }

  /**
   * 简单的XOR加密（适用于客户端存储）
   */
  private encrypt(text: string): string {
    let result = ''
    const key = this.encryptionKey
    
    for (let i = 0; i < text.length; i++) {
      const keyChar = key.charCodeAt(i % key.length)
      const textChar = text.charCodeAt(i)
      result += String.fromCharCode(textChar ^ keyChar)
    }
    
    return btoa(result)
  }

  /**
   * XOR解密
   */
  private decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText)
      let result = ''
      const key = this.encryptionKey
      
      for (let i = 0; i < decoded.length; i++) {
        const keyChar = key.charCodeAt(i % key.length)
        const decodedChar = decoded.charCodeAt(i)
        result += String.fromCharCode(decodedChar ^ keyChar)
      }
      
      return result
    } catch (error) {
      console.warn('解密失败:', error)
      return ''
    }
  }

  /**
   * 生成存储键名
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * 存储加密数据
   */
  setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value)
      const encrypted = this.encrypt(serialized)
      const storageKey = this.getKey(key)
      
      this.storage.setItem(storageKey, encrypted)
    } catch (error) {
      console.error('安全存储失败:', error)
    }
  }

  /**
   * 获取并解密数据
   */
  getItem<T>(key: string): T | null {
    try {
      const storageKey = this.getKey(key)
      const encrypted = this.storage.getItem(storageKey)
      
      if (!encrypted) {
        return null
      }
      
      const decrypted = this.decrypt(encrypted)
      if (!decrypted) {
        return null
      }
      
      return JSON.parse(decrypted) as T
    } catch (error) {
      console.error('安全读取失败:', error)
      return null
    }
  }

  /**
   * 删除存储项
   */
  removeItem(key: string): void {
    const storageKey = this.getKey(key)
    this.storage.removeItem(storageKey)
  }

  /**
   * 清除所有带前缀的存储项
   */
  clear(): void {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => this.storage.removeItem(key))
  }

  /**
   * 检查存储项是否存在
   */
  hasItem(key: string): boolean {
    const storageKey = this.getKey(key)
    return this.storage.getItem(storageKey) !== null
  }
}

// 默认实例（localStorage）
export const secureStorage = new SecureStorage({
  prefix: 'mendian_',
  useSessionStorage: false
})

// 会话存储实例（sessionStorage）
export const secureSessionStorage = new SecureStorage({
  prefix: 'mendian_session_',
  useSessionStorage: true
})

export { SecureStorage }
export default secureStorage