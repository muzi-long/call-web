/**
 * 认证相关 API
 * 通用的认证接口，供 admin 和 workbench 共同使用
 */
import request from '../utils/request'

/**
 * 登录响应类型
 */
export interface LoginResponse {
  token: string
  exp: number
}

/**
 * 用户登录
 * @param username - 用户名
 * @param password - 密码
 * @returns 登录响应
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await request.post<LoginResponse>('/auth/login', {
    username,
    password,
  })
  return response
}

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  await request.get('/auth/logout')
}

