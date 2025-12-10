/**
 * 中继号码管理相关 API
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
 * 号码列表请求参数
 */
export interface TrunkNumberListParams extends PageParams {
  number?: string
  direction?: 'in' | 'out' | 'all'
  ent_id?: number
  trunk_id?: number
}

/**
 * 价格配置
 */
export interface TrunkNumberCost {
  call_out_rate?: number // 呼出费率
  call_out_cycle?: number // 呼出计费周期
  call_out_sale_rate?: number // 呼出售价费率
  call_out_sale_cycle?: number // 呼出售价计费周期
  call_in_rate?: number // 呼入费率
  call_in_cycle?: number // 呼入计费周期
  call_in_sale_rate?: number // 呼入售价费率
  call_in_sale_cycle?: number // 呼入售价计费周期
}

/**
 * 号码信息
 */
export interface TrunkNumberInfo {
  id: number
  trunk_id: number // 中继线路ID
  ent_id: number // 企业ID
  name: string // 号码名称
  number: string // 中继号码
  prefix?: string // 号码前缀
  direction: 'in' | 'out' | 'all' // 方向：in-呼入，out-呼出，all-呼入呼出
  cost?: TrunkNumberCost // 价格配置
  expiration_at?: string // 过期时间
  created_at: string
  updated_at: string
}

/**
 * 号码列表响应
 */
export interface TrunkNumberListResponse {
  data: TrunkNumberInfo[]
  total: number
}

/**
 * 创建号码请求参数
 */
export interface TrunkNumberCreateParams {
  trunk_id: number // 中继线路ID（必填）
  ent_id: number // 企业ID（必填）
  name: string // 号码名称（必填）
  number: string // 中继号码（必填）
  prefix?: string // 号码前缀
  direction: 'in' | 'out' | 'all' // 呼叫方向（必填）
  cost?: TrunkNumberCost // 价格配置
  expiration_at?: string // 过期时间
}

/**
 * 更新号码请求参数
 */
export interface TrunkNumberUpdateParams {
  id: number
  trunk_id: number // 中继线路ID（必填）
  ent_id: number // 企业ID（必填）
  name: string // 号码名称（必填）
  number: string // 中继号码（必填）
  prefix?: string // 号码前缀
  direction: 'in' | 'out' | 'all' // 呼叫方向（必填）
  cost?: TrunkNumberCost // 价格配置
  expiration_at?: string // 过期时间
}

/**
 * 删除号码请求参数
 */
export interface TrunkNumberDeleteParams {
  id: number
}

/**
 * 获取号码列表
 */
export const getTrunkNumberList = async (params: TrunkNumberListParams = {}): Promise<TrunkNumberListResponse> => {
  // 设置默认分页参数
  const requestParams: TrunkNumberListParams = {
    page: params.page || 1,
    page_size: params.page_size || 20,
    ...params,
  }
  return await request.get<TrunkNumberListResponse>('/admin/trunk-number', requestParams)
}

/**
 * 创建号码
 */
export const createTrunkNumber = async (params: TrunkNumberCreateParams): Promise<{ id: number }> => {
  return await request.post<{ id: number }>('/admin/trunk-number', params)
}

/**
 * 更新号码
 */
export const updateTrunkNumber = async (params: TrunkNumberUpdateParams): Promise<void> => {
  return await request.put<void>('/admin/trunk-number', params)
}

/**
 * 删除号码
 * DELETE 请求 URL 格式：/admin/trunk-number/:id
 */
export const deleteTrunkNumber = async (params: TrunkNumberDeleteParams): Promise<void> => {
  return await request.delete<void>('/admin/trunk-number', params)
}

