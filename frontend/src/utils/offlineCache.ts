/**
 * 离线数据缓存工具
 * 使用 IndexedDB 存储关键数据，支持离线访问
 */

/**
 * 缓存配置
 */
interface CacheConfig {
  dbName: string
  version: number
  stores: {
    name: string
    keyPath: string
    indexes?: Array<{
      name: string
      keyPath: string
      unique?: boolean
    }>
  }[]
}

/**
 * 缓存项
 */
interface CacheItem<T = any> {
  key: string
  data: T
  timestamp: number
  expiresIn?: number // 过期时间（毫秒）
}

/**
 * 离线缓存管理器
 */
class OfflineCacheManager {
  private db: IDBDatabase | null = null
  private config: CacheConfig = {
    dbName: 'StorePlanningCache',
    version: 1,
    stores: [
      {
        name: 'plans',
        keyPath: 'key',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp' }
        ]
      },
      {
        name: 'regions',
        keyPath: 'key'
      },
      {
        name: 'storeTypes',
        keyPath: 'key'
      },
      {
        name: 'statistics',
        keyPath: 'key',
        indexes: [
          { name: 'timestamp', keyPath: 'timestamp' }
        ]
      }
    ]
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version)

      request.onerror = () => {
        console.error('打开IndexedDB失败:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB初始化成功')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        this.config.stores.forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath
            })

            // 创建索引
            storeConfig.indexes?.forEach(index => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique || false
              })
            })
          }
        })
      }
    })
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('数据库未初始化')
    }
    return this.db
  }

  /**
   * 保存数据到缓存
   */
  async set<T>(
    storeName: string,
    key: string,
    data: T,
    expiresIn?: number
  ): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)

      const cacheItem: CacheItem<T> = {
        key,
        data,
        timestamp: Date.now(),
        expiresIn
      }

      const request = store.put(cacheItem)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('保存缓存失败:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 从缓存获取数据
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const cacheItem = request.result as CacheItem<T> | undefined

        if (!cacheItem) {
          resolve(null)
          return
        }

        // 检查是否过期
        if (cacheItem.expiresIn) {
          const age = Date.now() - cacheItem.timestamp
          if (age > cacheItem.expiresIn) {
            // 已过期，删除并返回null
            this.delete(storeName, key)
            resolve(null)
            return
          }
        }

        resolve(cacheItem.data)
      }

      request.onerror = () => {
        console.error('读取缓存失败:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 删除缓存项
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('删除缓存失败:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 清空指定存储的所有数据
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        console.error('清空缓存失败:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 获取所有缓存项
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const items = request.result as CacheItem<T>[]
        const now = Date.now()

        // 过滤过期项
        const validItems = items.filter(item => {
          if (item.expiresIn) {
            const age = now - item.timestamp
            return age <= item.expiresIn
          }
          return true
        })

        resolve(validItems.map(item => item.data))
      }

      request.onerror = () => {
        console.error('读取所有缓存失败:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 清理过期缓存
   */
  async cleanExpired(storeName: string): Promise<number> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.openCursor()
      let deletedCount = 0
      const now = Date.now()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue

        if (cursor) {
          const item = cursor.value as CacheItem

          if (item.expiresIn) {
            const age = now - item.timestamp
            if (age > item.expiresIn) {
              cursor.delete()
              deletedCount++
            }
          }

          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = () => {
        console.error('清理过期缓存失败:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * 获取缓存大小（估算）
   */
  async getSize(storeName: string): Promise<number> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('获取缓存大小失败:', request.error)
        reject(request.error)
      }
    })
  }
}

/**
 * 全局缓存管理器实例
 */
export const offlineCache = new OfflineCacheManager()

/**
 * 缓存存储名称常量
 */
export const CACHE_STORES = {
  PLANS: 'plans',
  REGIONS: 'regions',
  STORE_TYPES: 'storeTypes',
  STATISTICS: 'statistics'
} as const

/**
 * 缓存过期时间常量（毫秒）
 */
export const CACHE_EXPIRY = {
  SHORT: 5 * 60 * 1000,      // 5分钟
  MEDIUM: 30 * 60 * 1000,    // 30分钟
  LONG: 24 * 60 * 60 * 1000, // 24小时
  NEVER: undefined            // 永不过期
} as const

export default offlineCache
