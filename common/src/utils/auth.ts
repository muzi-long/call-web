/**
 * 认证工具函数
 * 用于管理 token 和用户认证状态
 */

const TOKEN_KEY = 'auth_token'
const TOKEN_EXP_KEY = 'auth_token_exp'

/**
 * 保存 token
 * @param token - 认证 token
 * @param exp - 过期时间（秒）
 */
export const setToken = (token: string, exp?: number): void => {
  localStorage.setItem(TOKEN_KEY, token)
  if (exp) {
    // 计算过期时间戳（当前时间 + 过期秒数）
    const expTimestamp = Date.now() + exp * 1000
    localStorage.setItem(TOKEN_EXP_KEY, expTimestamp.toString())
  }
}

/**
 * 获取 token
 * @returns token 或 null
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 移除 token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXP_KEY)
}

/**
 * 检查 token 是否有效（未过期）
 * @returns token 是否有效
 */
export const isTokenValid = (): boolean => {
  const token = getToken()
  if (!token) {
    return false
  }

  const expTimestamp = localStorage.getItem(TOKEN_EXP_KEY)
  if (!expTimestamp) {
    // 如果没有过期时间，认为 token 有效（向后兼容）
    return true
  }

  // 检查是否过期
  const now = Date.now()
  return now < parseInt(expTimestamp, 10)
}

/**
 * 检查是否已登录
 * @returns 是否已登录
 */
export const isAuthenticated = (): boolean => {
  return isTokenValid()
}

