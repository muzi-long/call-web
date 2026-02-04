/**
 * 用户相关 API
 * workbench 专用的用户接口
 */
import request from '@common/utils/request'

/**
 * 企业信息类型
 */
export interface Enterprise {
  id: number
  name: string
  status: number
  owner_agent_id: number
  is_current: number
  join_at: string
  role: string // 用户在该企业中的角色: owner/admin/member
  created_at: string
  updated_at: string
}

/**
 * 用户信息类型
 */
export interface UserInfo {
  id: number
  username: string
  phone?: string
  email?: string
  display_name?: string
  answer_type?: string
  sip_id?: string
  sip_password?: string
  mobile?: string
  domain?: string
  enterprises?: Enterprise[]
}

/**
 * 用户角色信息
 */
export interface UserRoleInfo {
  user_id: number
  role: string // 用户在当前企业中的角色: owner/admin/member
}

/**
 * 获取当前登录用户信息
 * @returns 用户信息
 */
export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await request.get<UserInfo>('/api/user/profile')
  return response
}

/**
 * 切换当前企业
 * @param entId - 企业ID
 * @returns Promise<void>
 */
export const switchCurrentEnterprise = async (entId: number): Promise<void> => {
  await request.put<void>('/api/user/switch-enterprise', { ent_id: entId })
}

/**
 * 获取当前用户在当前企业中的角色
 * @returns 用户角色信息
 */
export const getUserRole = async (): Promise<UserRoleInfo> => {
  return await request.get<UserRoleInfo>('/api/user/roles-permissions')
}

/**
 * 更新用户设置
 * @param settings - 设置参数
 * @returns Promise<void>
 */
export interface UserSettings {
  answer_type?: string
  mobile?: string
  [key: string]: any
}

export const updateUserSettings = async (settings: UserSettings): Promise<void> => {
  await request.put<void>('/api/user/settings', settings)
}

