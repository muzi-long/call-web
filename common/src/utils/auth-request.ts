/// <reference types="vite/client" />

/**
 * 认证相关的请求工具
 * 认证接口使用独立的 baseURL，因为 /auth/* 不在 /admin/ 或 /api/ 下
 */
import { createRequestInstance } from './request'

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_ADMIN_API_BASE_URL?: string
    readonly VITE_AUTH_API_BASE_URL?: string
    readonly VITE_API_DOMAIN?: string
}

// 获取认证接口的基础地址
const getAuthBaseURL = (): string => {
    // 优先使用认证接口的专用环境变量
    const authBaseURL = import.meta.env.VITE_AUTH_API_BASE_URL

    if (authBaseURL) {
        return authBaseURL
    }

    // 如果没有配置，使用主域名（不包含路径前缀）
    // 因为 /auth/login 和 /auth/logout 是直接在域名下的
    const domain = import.meta.env.VITE_API_DOMAIN || ''

    return domain
}

// 创建认证请求实例
export default createRequestInstance(getAuthBaseURL())

