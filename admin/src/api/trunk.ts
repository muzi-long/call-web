/**
 * 中继线路管理相关 API
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
 * 线路列表请求参数
 */
export interface TrunkListParams extends PageParams {
  ip?: string
  name?: string
}

/**
 * 线路信息
 */
export interface TrunkInfo {
  id: number
  name: string
  ip: string
  port: number
  status?: 'up' | 'down' // 状态：up-正常，down-异常
  last_ping_at?: string // 最后ping时间
  created_at: string
  updated_at: string
}

/**
 * 线路列表响应
 */
export interface TrunkListResponse {
  data: TrunkInfo[]
  total: number
}

/**
 * 创建线路请求参数
 */
export interface TrunkCreateParams {
  name: string
  ip: string
  port: number
}

/**
 * 更新线路请求参数
 */
export interface TrunkUpdateParams {
  id: number
  name: string
  ip: string
  port: number
}

/**
 * 删除线路请求参数
 */
export interface TrunkDeleteParams {
  id: number
}

/**
 * 获取线路列表
 */
export const getTrunkList = async (params: TrunkListParams = {}): Promise<TrunkListResponse> => {
  // 设置默认分页参数
  const requestParams: TrunkListParams = {
    page: params.page || 1,
    page_size: params.page_size || 20,
    ...params,
  }
  return await request.get<TrunkListResponse>('/admin/trunk', requestParams)
}

/**
 * 创建线路
 */
export const createTrunk = async (params: TrunkCreateParams): Promise<{ id: number }> => {
  return await request.post<{ id: number }>('/admin/trunk', params)
}

/**
 * 更新线路
 */
export const updateTrunk = async (params: TrunkUpdateParams): Promise<void> => {
  return await request.put<void>('/admin/trunk', params)
}

/**
 * 删除线路
 * DELETE 请求 URL 格式：/admin/trunk/:id
 */
export const deleteTrunk = async (params: TrunkDeleteParams): Promise<void> => {
  return await request.delete<void>('/admin/trunk', params)
}

/**
 * 获取所有中继线路信息（不分页）
 * 用于下拉选择等场景
 */
export const getAllTrunks = async (): Promise<TrunkInfo[]> => {
  return await request.get<TrunkInfo[]>('/admin/trunk/all')
}

