/// <reference types="vite/client" />

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'antd'
import { getToken, removeToken } from './auth'

interface ImportMetaEnv {
  readonly VITE_API_DOMAIN?: string
}

/**
 * 获取 API 基础地址
 * 开发环境：返回空字符串，使用相对路径（通过 Vite 代理转发）
 * 生产环境：返回实际域名
 */
const getBaseURL = (): string => {
  // 开发环境使用代理，返回空字符串（使用相对路径）
  if (import.meta.env.DEV) {
    return ''
  }

  // 生产环境使用实际域名
  const domain = import.meta.env.VITE_API_DOMAIN

  if (!domain) {
    console.warn('[request] VITE_API_DOMAIN 未配置，请求将使用相对路径')
    return ''
  }

  return domain
}

/**
 * 创建请求实例
 */
const createRequest = (): AxiosInstance => {
  const request: AxiosInstance = axios.create({
    baseURL: getBaseURL(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  request.interceptors.request.use(
    (config) => {
      // 自动添加 token 到请求头
      const token = getToken()
      if (token && config.headers) {
        config.headers.Authorization = token
      }
      return config
    },
    (error: AxiosError) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  request.interceptors.response.use(
    (response: AxiosResponse) => {
      // 状态码为 200 时，直接返回数据
      if (response.status === 200) {
        return response.data
      }
      // 其他情况也返回数据（有些接口可能返回 201 等）
      return response.data
    },
    (error: AxiosError) => {
      // 处理 HTTP 状态码不等于 200 的情况
      if (error.response) {
        const { status, data } = error.response
        let errorMessage = '请求失败'

        // 根据状态码设置错误信息
        switch (status) {
          case 400:
            errorMessage = (data as any)?.message || (data as any)?.error || '请求参数错误'
            break
          case 401:
            errorMessage = (data as any)?.message || (data as any)?.error || '未授权，请重新登录'
            // 清除 token 并触发登录跳转
            removeToken()
            // 触发自定义事件，让应用知道需要跳转到登录页
            window.dispatchEvent(new CustomEvent('auth:unauthorized'))
            break
          case 403:
            errorMessage = (data as any)?.message || (data as any)?.error || '拒绝访问'
            break
          case 404:
            errorMessage = (data as any)?.message || (data as any)?.error || '请求的资源不存在'
            break
          case 500:
            errorMessage = (data as any)?.message || (data as any)?.error || '服务器内部错误'
            break
          case 502:
            errorMessage = (data as any)?.message || (data as any)?.error || '网关错误'
            break
          case 503:
            errorMessage = (data as any)?.message || (data as any)?.error || '服务不可用'
            break
          case 504:
            errorMessage = (data as any)?.message || (data as any)?.error || '网关超时'
            break
          default:
            errorMessage = (data as any)?.message || (data as any)?.error || `请求失败 (${status})`
        }

        // 使用 Ant Design 的 message 提示错误
        message.error(errorMessage)
      } else if (error.request) {
        // 请求已发出，但没有收到响应
        message.error('网络错误，请检查网络连接')
      } else {
        // 发送请求时出了点问题
        message.error(error.message || '请求配置错误')
      }

      return Promise.reject(error)
    }
  )

  return request
}

// 创建请求实例
const requestInstance = createRequest()

// 请求方法类型定义
interface RequestMethods {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
}

// 创建请求方法
// GET 请求：参数放在 query 中
// DELETE 请求：URL 格式为 xxx/:id，id 从 params 中提取
// POST/PUT/PATCH 请求：参数放在 body 中
const requestMethods: RequestMethods = {
  get<T = any>(url: string, params?: any, config: AxiosRequestConfig = {}): Promise<T> {
    // GET 请求参数放在 query 中
    return requestInstance.get<T>(url, { params, ...config }).then((response) => response as T)
  },
  post<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return requestInstance.post<T>(url, data, config).then((response) => response as T)
  },
  put<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return requestInstance.put<T>(url, data, config).then((response) => response as T)
  },
  delete<T = any>(url: string, params?: any, config: AxiosRequestConfig = {}): Promise<T> {
    // DELETE 请求：URL 格式为 xxx/:id
    // 如果 params 是对象且包含 id，则将 id 拼接到 URL 中
    let deleteUrl = url
    if (params && typeof params === 'object' && 'id' in params) {
      deleteUrl = `${url}/${params.id}`
    } else if (typeof params === 'number' || typeof params === 'string') {
      // 如果 params 直接是 id 值
      deleteUrl = `${url}/${params}`
    }
    return requestInstance.delete<T>(deleteUrl, config).then((response) => response as T)
  },
  patch<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return requestInstance.patch<T>(url, data, config).then((response) => response as T)
  },
}

// 导出请求方法
export default requestMethods

// 也可以直接导出 axios 实例，以便需要更灵活的使用
export { requestInstance as request }
