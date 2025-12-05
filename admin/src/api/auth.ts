/**
 * 认证相关 API
 * 认证接口使用独立的请求工具，因为 /auth/* 不在 /admin/ 路径下
 */
import authRequest from '@common/utils/auth-request'

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
  const response = await authRequest.post<LoginResponse>('/auth/login', {
    username,
    password,
  })
  return response
}

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  await authRequest.get('/auth/logout')
}

