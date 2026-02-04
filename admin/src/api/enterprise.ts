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
  owner_agent?: AgentInfo // 所有者Agent信息（从enterprise_agent表role=owner获取）
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
}

/**
 * 更新企业请求参数
 */
export interface EnterpriseUpdateParams {
  id: number
  name: string
  status?: number
}

/**
 * 删除企业请求参数
 */
export interface EnterpriseDeleteParams {
  id: number
}

/**
 * 绑定或解绑Agent到企业请求参数
 */
export interface EnterpriseAgentBindParams {
  ent_id: number
  agent_id: number
  action?: 'bind' | 'unbind' // 操作类型：bind-绑定，unbind-解绑，默认为bind
  role?: 'owner' | 'admin' | 'member' // 角色：owner-所有者，admin-管理员，member-普通成员，默认为member
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
 * 企业下的Agent信息（包含角色）
 */
export interface EnterpriseAgentInfo extends AgentInfo {
  role: string  // 用户在企业中的角色: owner/admin/member
  join_at: string // 加入企业时间
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
 * 绑定或解绑Agent到企业
 * 
 * 根据call-api的接口设计，支持以下两种方式：
 * 1. 统一使用 POST 方法，通过 action 参数区分绑定和解绑（推荐）
 * 2. 绑定使用 POST，解绑使用 DELETE（如果后端支持）
 * 
 * @param params - 请求参数
 *   - ent_id: 企业ID
 *   - agent_id: Agent ID
 *   - action: 操作类型，'bind' 表示绑定，'unbind' 表示解绑，默认为 'bind'
 * @returns Promise<void>
 * 
 * @example
 * // 绑定Agent到企业
 * await bindAgentToEnterprise({ ent_id: 1, agent_id: 2 })
 * await bindAgentToEnterprise({ ent_id: 1, agent_id: 2, action: 'bind' })
 * 
 * // 解绑Agent从企业
 * await bindAgentToEnterprise({ ent_id: 1, agent_id: 2, action: 'unbind' })
 */
export const bindAgentToEnterprise = async (params: EnterpriseAgentBindParams): Promise<void> => {
  const { action = 'bind', ent_id, agent_id, role } = params

  // 统一使用 POST 方法，通过 action 参数区分绑定和解绑
  // 如果后端接口设计为：POST /admin/ent/agent，body: { ent_id, agent_id, action: 'bind'|'unbind', role }
  const body: any = {
    ent_id,
    agent_id,
    action
  }
  if (role) {
    body.role = role
  }
  return await request.post<void>('/admin/ent/agent', body)
}

/**
 * 绑定Agent到企业（便捷方法）
 * @param params - 请求参数，包含 ent_id、agent_id 和可选的 role
 * @returns Promise<void>
 */
export const bindAgent = async (params: Omit<EnterpriseAgentBindParams, 'action'>): Promise<void> => {
  return await bindAgentToEnterprise({ ...params, action: 'bind' })
}

/**
 * 解绑Agent从企业（便捷方法）
 * @param params - 请求参数，包含 ent_id 和 agent_id
 * @returns Promise<void>
 */
export const unbindAgent = async (params: Omit<EnterpriseAgentBindParams, 'action'>): Promise<void> => {
  return await bindAgentToEnterprise({ ...params, action: 'unbind' })
}

/**
 * 获取企业下的所有Agent（包含角色信息）
 * @param params - 请求参数，包含 ent_id
 * @returns Agent列表（包含角色）
 */
export const getEnterpriseAgents = async (params: EnterpriseAgentsParams): Promise<EnterpriseAgentInfo[]> => {
  return await request.get<EnterpriseAgentInfo[]>('/admin/ent/agents', params)
}

/**
 * 获取所有企业信息（不分页）
 * 用于下拉选择等场景
 */
export const getAllEnterprises = async (): Promise<EnterpriseInfo[]> => {
  return await request.get<EnterpriseInfo[]>('/admin/ent/all')
}

/**
 * 获取企业详情请求参数
 */
export interface EnterpriseDetailParams {
  id: number
}

/**
 * 获取企业详情
 */
export const getEnterpriseDetail = async (params: EnterpriseDetailParams): Promise<EnterpriseInfo> => {
  return await request.get<EnterpriseInfo>(`/admin/ent/${params.id}`)
}
