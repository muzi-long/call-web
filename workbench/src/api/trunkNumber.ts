/**
 * 中继号码相关 API
 * workbench 专用的中继号码接口
 */
import request from '@common/utils/request'

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
  direction: 'inbound' | 'outbound' | 'all' // 方向：inbound-呼入，outbound-呼出，all-呼入呼出
  cost?: TrunkNumberCost // 价格配置
  expiration_at?: string // 过期时间
  created_at: string
  updated_at: string
}

/**
 * 获取当前用户所选企业的所有中继号码（不分页）
 * @returns 中继号码列表
 */
export const getCurrentEnterpriseTrunkNumbers = async (): Promise<TrunkNumberInfo[]> => {
  const response = await request.get<TrunkNumberInfo[]>('/api/trunk-number')
  return response
}

