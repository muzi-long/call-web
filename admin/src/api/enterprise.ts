/**
 * 企业管理相关 API
 */
import request from '@common/utils/request'

/**
 * 分页请求参数
 */
export interface PageParams {
  page?: number
  page_size?: number
}

/**
 * 企业列表请求参数
 */
export interface EnterpriseListParams extends PageParams {
  name?: string
  status?: number
  agent_id?: number
}

/**
 * 企业信息
 */
export interface EnterpriseInfo {
  id: number
  name: string
  status: number
  owner_agent_id: number
  owner_agent?: AgentInfo // 所有者Agent信息（可选）
  created_at: string
  updated_at: string
}

/**
 * 企业列表响应
 */
export interface EnterpriseListResponse {
  data: EnterpriseInfo[]
  total: number
}

/**
 * 创建企业请求参数
 */
export interface EnterpriseCreateParams {
  name: string
  status?: number
  agent_id?: number
}

/**
 * 更新企业请求参数
 */
export interface EnterpriseUpdateParams {
  id: number
  name: string
  status?: number
  agent_id?: number
}

/**
 * 删除企业请求参数
 */
export interface EnterpriseDeleteParams {
  id: number
}

/**
 * 绑定Agent到企业请求参数
 */
export interface EnterpriseAgentBindParams {
  ent_id: number
  agent_id: number
}

/**
 * 获取企业Agent列表请求参数
 */
export interface EnterpriseAgentsParams {
  ent_id: number
}

/**
 * Agent信息
 */
export interface AgentInfo {
  id: number
  uuid: string
  username: string
  email: string
  phone: string
  display_name: string
  disabled: number
  is_super_user: number
  answer_type: string
  sip_id: string
  sip_password: string
  mobile: string
  created_at: string
  updated_at: string
}

/**
 * 获取企业列表
 */
export const getEnterpriseList = async (params: EnterpriseListParams = {}): Promise<EnterpriseListResponse> => {
  // 设置默认分页参数
  const requestParams: EnterpriseListParams = {
    page: params.page || 1,
    page_size: params.page_size || 20,
    ...params,
  }
  return await request.get<EnterpriseListResponse>('/admin/ent', requestParams)
}

/**
 * 创建企业
 */
export const createEnterprise = async (params: EnterpriseCreateParams): Promise<void> => {
  return await request.post<void>('/admin/ent', params)
}

/**
 * 更新企业
 */
export const updateEnterprise = async (params: EnterpriseUpdateParams): Promise<void> => {
  return await request.put<void>('/admin/ent', params)
}

/**
 * 删除企业
 * DELETE 请求 URL 格式：/admin/ent/:id
 */
export const deleteEnterprise = async (params: EnterpriseDeleteParams): Promise<void> => {
  return await request.delete<void>('/admin/ent', params)
}

/**
 * 绑定Agent到企业
 */
export const bindAgentToEnterprise = async (params: EnterpriseAgentBindParams): Promise<void> => {
  return await request.post<void>('/admin/ent/agent', params)
}

/**
 * 获取企业下的所有Agent
 * @param params - 请求参数，包含 ent_id
 * @returns Agent列表
 */
export const getEnterpriseAgents = async (params: EnterpriseAgentsParams): Promise<AgentInfo[]> => {
  return await request.get<AgentInfo[]>('/admin/ent/agents', params)
}

/**
 * 获取所有企业信息（不分页）
 * 用于下拉选择等场景
 */
export const getAllEnterprises = async (): Promise<EnterpriseInfo[]> => {
  return await request.get<EnterpriseInfo[]>('/admin/ent/all')
}
