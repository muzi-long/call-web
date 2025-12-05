/// <reference types="vite/client" />

/**
 * Admin 项目专用的请求工具
 * Admin 接口使用 /admin/* 路径
 */
import { createRequestInstance } from './request'

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_ADMIN_API_BASE_URL?: string
    readonly VITE_AUTH_API_BASE_URL?: string
    readonly VITE_API_DOMAIN?: string
}

// 获取 Admin API 基础地址
const getAdminBaseURL = (): string => {
    // 优先使用 Admin 专用的环境变量
    const adminBaseURL = import.meta.env.VITE_ADMIN_API_BASE_URL

    if (adminBaseURL) {
        return adminBaseURL
    }

    // 如果没有配置，使用默认值
    return '/admin'
}

// 创建 Admin 请求实例
export default createRequestInstance(getAdminBaseURL())

