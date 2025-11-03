/**
 * 文件上传服务
 * 
 * 功能特性：
 * - 图片上传（支持压缩和预览）
 * - 文档上传（支持多种格式）
 * - 上传进度跟踪
 * - 文件大小和类型验证
 * - 批量上传支持
 */
import axios, { AxiosProgressEvent } from 'axios'
import { Message } from '@arco-design/web-react'

// 上传配置
export interface UploadConfig {
  maxSize?: number // 最大文件大小（字节），默认 10MB
  allowedTypes?: string[] // 允许的文件类型
  compress?: boolean // 是否压缩图片
  compressQuality?: number // 压缩质量（0-1）
  onProgress?: (percent: number) => void // 上传进度回调
}

// 上传响应
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mime_type: string
}

// 默认配置
const DEFAULT_CONFIG: UploadConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  compress: false,
  compressQuality: 0.8,
}

// 图片类型
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

// 文档类型
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]

/**
 * 验证文件
 */
function validateFile(file: File, config: UploadConfig): boolean {
  // 检查文件大小
  if (config.maxSize && file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(2)
    Message.error(`文件大小不能超过 ${maxSizeMB}MB`)
    return false
  }
  
  // 检查文件类型
  if (config.allowedTypes && config.allowedTypes.length > 0) {
    if (!config.allowedTypes.includes(file.type)) {
      Message.error('不支持的文件类型')
      return false
    }
  }
  
  return true
}

/**
 * 压缩图片
 */
function compressImage(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'))
          return
        }
        
        // 计算压缩后的尺寸（最大宽度/高度 1920px）
        const maxSize = 1920
        let width = img.width
        let height = img.height
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 上传文件到服务器
 */
async function uploadToServer(
  file: File | Blob,
  filename: string,
  endpoint: string,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file, filename)
  
  const token = localStorage.getItem('access_token')
  
  try {
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : '',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    })
    
    return response.data
  } catch (error: any) {
    if (error.response?.data?.message) {
      Message.error(error.response.data.message)
    } else {
      Message.error('文件上传失败')
    }
    throw error
  }
}

/**
 * 文件上传服务类
 */
export class UploadService {
  /**
   * 上传图片
   */
  static async uploadImage(
    file: File,
    config: UploadConfig = {}
  ): Promise<UploadResponse> {
    const finalConfig = {
      ...DEFAULT_CONFIG,
      allowedTypes: IMAGE_TYPES,
      ...config,
    }
    
    // 验证文件
    if (!validateFile(file, finalConfig)) {
      throw new Error('文件验证失败')
    }
    
    let uploadFile: File | Blob = file
    let filename = file.name
    
    // 压缩图片
    if (finalConfig.compress && IMAGE_TYPES.includes(file.type)) {
      try {
        const compressedBlob = await compressImage(file, finalConfig.compressQuality)
        uploadFile = compressedBlob
        Message.success('图片压缩完成')
      } catch (error) {
        console.error('图片压缩失败:', error)
        Message.warning('图片压缩失败，将上传原图')
      }
    }
    
    // 上传到服务器
    return uploadToServer(
      uploadFile,
      filename,
      '/api/upload/image/',
      finalConfig.onProgress
    )
  }
  
  /**
   * 上传文档
   */
  static async uploadDocument(
    file: File,
    config: UploadConfig = {}
  ): Promise<UploadResponse> {
    const finalConfig = {
      ...DEFAULT_CONFIG,
      maxSize: 50 * 1024 * 1024, // 文档最大 50MB
      allowedTypes: DOCUMENT_TYPES,
      ...config,
    }
    
    // 验证文件
    if (!validateFile(file, finalConfig)) {
      throw new Error('文件验证失败')
    }
    
    // 上传到服务器
    return uploadToServer(
      file,
      file.name,
      '/api/upload/document/',
      finalConfig.onProgress
    )
  }
  
  /**
   * 批量上传文件
   */
  static async uploadMultiple(
    files: File[],
    uploadFn: (file: File, config?: UploadConfig) => Promise<UploadResponse>,
    config: UploadConfig = {}
  ): Promise<UploadResponse[]> {
    const results: UploadResponse[] = []
    const errors: Error[] = []
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFn(files[i], {
          ...config,
          onProgress: (percent) => {
            if (config.onProgress) {
              // 计算总体进度
              const totalPercent = Math.round(
                ((i + percent / 100) / files.length) * 100
              )
              config.onProgress(totalPercent)
            }
          },
        })
        results.push(result)
      } catch (error) {
        errors.push(error as Error)
      }
    }
    
    if (errors.length > 0) {
      Message.warning(`${files.length - errors.length}/${files.length} 个文件上传成功`)
    } else {
      Message.success('所有文件上传成功')
    }
    
    return results
  }
  
  /**
   * 批量上传图片
   */
  static async uploadImages(
    files: File[],
    config: UploadConfig = {}
  ): Promise<UploadResponse[]> {
    return this.uploadMultiple(files, this.uploadImage.bind(this), config)
  }
  
  /**
   * 批量上传文档
   */
  static async uploadDocuments(
    files: File[],
    config: UploadConfig = {}
  ): Promise<UploadResponse[]> {
    return this.uploadMultiple(files, this.uploadDocument.bind(this), config)
  }
  
  /**
   * 通用文件上传（自动判断类型）
   */
  static async upload(
    file: File,
    config: UploadConfig = {}
  ): Promise<UploadResponse> {
    if (IMAGE_TYPES.includes(file.type)) {
      return this.uploadImage(file, config)
    } else if (DOCUMENT_TYPES.includes(file.type)) {
      return this.uploadDocument(file, config)
    } else {
      Message.error('不支持的文件类型')
      throw new Error('不支持的文件类型')
    }
  }
  
  /**
   * 获取文件预览 URL（用于本地预览）
   */
  static getPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }
  
  /**
   * 释放预览 URL
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}

export default UploadService
