/// <reference types="vite/client" />

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'antd'
import { getToken, removeToken } from './auth'

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ADMIN_API_BASE_URL?: string
  readonly VITE_AUTH_API_BASE_URL?: string
  readonly VITE_API_DOMAIN?: string
}

/**
 * 创建请求实例
 * @param baseURL - API 基础地址
 */
const createRequest = (baseURL: string): AxiosInstance => {
  const request: AxiosInstance = axios.create({
    baseURL,
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

// 获取 API 基础地址
// admin 项目使用 VITE_ADMIN_API_BASE_URL，workbench 使用 VITE_API_BASE_URL
// 如果没有配置，则根据环境自动判断
const getBaseURL = (): string => {
  // 优先使用项目特定的环境变量
  const adminBaseURL = import.meta.env.VITE_ADMIN_API_BASE_URL
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL

  if (adminBaseURL) {
    return adminBaseURL
  }

  if (apiBaseURL) {
    return apiBaseURL
  }

  // 默认值：根据当前路径判断（开发环境可以通过路径判断）
  // 生产环境建议明确配置环境变量
  return '/api'
}

// 创建默认请求实例（用于 workbench 或通用接口）
const defaultRequest = createRequest(getBaseURL())

// 请求方法类型定义
interface RequestMethods {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
}

// 创建请求方法
const createRequestMethods = (instance: AxiosInstance): RequestMethods => ({
  get<T = any>(url: string, params?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return instance.get<T>(url, { params, ...config }).then((response) => response as T)
  },
  post<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return instance.post<T>(url, data, config).then((response) => response as T)
  },
  put<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return instance.put<T>(url, data, config).then((response) => response as T)
  },
  delete<T = any>(url: string, params?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return instance.delete<T>(url, { params, ...config }).then((response) => response as T)
  },
  patch<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
    return instance.patch<T>(url, data, config).then((response) => response as T)
  },
})

// 导出默认请求方法（用于 workbench）
export default createRequestMethods(defaultRequest)

// 导出创建请求实例的函数，用于创建特定 baseURL 的请求
export const createRequestInstance = (baseURL: string) => {
  const instance = createRequest(baseURL)
  return createRequestMethods(instance)
}

// 也可以直接导出 axios 实例，以便需要更灵活的使用
export { defaultRequest as request }
