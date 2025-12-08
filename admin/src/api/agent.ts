/**
 * Agent（用户）管理相关 API
 */
import request from '@common/utils/request'
import { PageParams, AgentInfo } from './enterprise'

/**
 * Agent 列表请求参数
 */
export interface AgentListParams extends PageParams {
  ent_id?: number
  username?: string
  email?: string
  phone?: string
  display_name?: string // 后端支持此字段搜索
}

/**
 * Agent 列表响应
 */
export interface AgentListResponse {
  data: AgentInfo[]
  total: number
}

/**
 * 创建 Agent 请求参数
 */
export interface AgentCreateParams {
  ent_id?: number // 企业ID（可选）
  username: string
  email?: string
  phone?: string
  password: string
  display_name: string
  answer_type?: string // 接听方式：手机接听、webrtc、soft
  mobile?: string // 接听手机号码
}

/**
 * 更新 Agent 请求参数
 */
export interface AgentUpdateParams {
  id: number
  username?: string
  email?: string
  phone?: string
  password?: string
  display_name?: string
  disabled?: number // 是否禁用：0未禁用，1禁用
  answer_type?: string
  sip_password?: string
  mobile?: string
}

/**
 * 删除 Agent 请求参数
 */
export interface AgentDeleteParams {
  id: number
}

/**
 * 获取 Agent 列表
 */
export const getAgentList = async (params: AgentListParams = {}): Promise<AgentListResponse> => {
  // 设置默认分页参数
  const requestParams: AgentListParams = {
    page: params.page || 1,
    page_size: params.page_size || 20,
    ...params,
  }
  return await request.get<AgentListResponse>('/admin/agent', requestParams)
}

/**
 * 创建 Agent
 */
export const createAgent = async (params: AgentCreateParams): Promise<{ id: number }> => {
  return await request.post<{ id: number }>('/admin/agent', params)
}

/**
 * 更新 Agent
 */
export const updateAgent = async (params: AgentUpdateParams): Promise<void> => {
  return await request.put<void>('/admin/agent', params)
}

/**
 * 删除 Agent
 * DELETE 请求 URL 格式：/admin/agent/:id
 */
export const deleteAgent = async (params: AgentDeleteParams): Promise<void> => {
  return await request.delete<void>('/admin/agent', params)
}

