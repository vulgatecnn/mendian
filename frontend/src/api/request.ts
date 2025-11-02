/**
 * Axios 请求封装
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { Message } from '@arco-design/web-react'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true, // 携带 cookie
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          Message.error('未授权，请登录')
          // 可以跳转到登录页
          break
        case 403:
          Message.error('权限不足')
          break
        case 404:
          Message.error('请求的资源不存在')
          break
        case 500:
          Message.error('服务器错误')
          break
        default:
          Message.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      Message.error('网络错误，请检查网络连接')
    } else {
      Message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default request
