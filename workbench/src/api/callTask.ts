/**
 * 外呼任务相关 API
 * workbench 专用的外呼任务接口
 */
import request from '@common/utils/request'

/**
 * 时间段配置
 */
export interface CallTaskTimeRange {
  start: string // HH:mm 格式
  end: string // HH:mm 格式
}

/**
 * 号码信息
 */
export interface CallTaskPhoneItem {
  phone_number: string
  custom_data?: string // JSON 格式的自定义数据
}

/**
 * 外呼任务概要信息（用于列表）
 */
export interface CallTaskSummary {
  id: number
  name: string
  status: string
  total_count: number
  called_count: number
  success_count: number
  success_rate: number
  completion_rate: number
  scheduled_start_time?: string
  actual_start_time?: string
  created_at: string
}

/**
 * 外呼任务详细信息
 */
export interface CallTaskInfo {
  id: number
  ent_id: number
  name: string
  description: string
  status: string
  trunk_number_id: number
  trunk_number?: string
  agent_id: number
  agent_name?: string
  queue_id: number
  queue_name?: string
  max_concurrent: number
  call_timeout: number
  retry_strategy: string
  max_retry_times: number
  retry_interval: number
  scheduled_start_time?: string
  scheduled_end_time?: string
  actual_start_time?: string
  actual_end_time?: string
  allowed_weekdays: number[]
  allowed_time_ranges: CallTaskTimeRange[]
  total_count: number
  called_count: number
  success_count: number
  failed_count: number
  no_answer_count: number
  busy_count: number
  rejected_count: number
  skipped_count: number
  success_rate: number
  completion_rate: number
  created_by: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

/**
 * 外呼任务明细信息
 */
export interface CallTaskDetailInfo {
  id: number
  task_id: number
  ent_id: number
  phone_number: string
  custom_data?: string
  status: string
  retry_times: number
  cdr_id?: number
  caller_number?: string
  call_start_time?: string
  call_answer_time?: string
  call_end_time?: string
  call_duration: number
  hangup_cause?: string
  remark?: string
  created_at: string
  updated_at: string
}

/**
 * 按小时统计
 */
export interface CallTaskHourlyStats {
  hour: number
  call_count: number
  success_count: number
  success_rate: number
}

/**
 * 外呼任务统计信息
 */
export interface CallTaskStats {
  task_id: number
  task_name: string
  status: string
  total_count: number
  called_count: number
  pending_count: number
  success_count: number
  failed_count: number
  no_answer_count: number
  busy_count: number
  rejected_count: number
  skipped_count: number
  success_rate: number
  completion_rate: number
  avg_call_duration: number
  total_call_duration: number
  status_distribution: Record<string, number>
  hourly_stats: CallTaskHourlyStats[]
}

/**
 * 任务列表响应
 */
export interface CallTaskListResponse {
  data: CallTaskSummary[]
  total: number
}

/**
 * 任务明细列表响应
 */
export interface CallTaskDetailListResponse {
  data: CallTaskDetailInfo[]
  total: number
}

/**
 * 创建任务请求参数
 */
export interface CreateCallTaskParams {
  name: string
  description?: string
  trunk_number_id?: number
  agent_id?: number
  queue_id?: number
  max_concurrent: number
  call_timeout: number
  retry_strategy: string
  max_retry_times?: number
  retry_interval?: number
  scheduled_start_time?: string
  scheduled_end_time?: string
  allowed_weekdays?: number[]
  allowed_time_ranges?: CallTaskTimeRange[]
  phone_list?: CallTaskPhoneItem[]
}

/**
 * 更新任务请求参数
 */
export interface UpdateCallTaskParams {
  id: number
  name?: string
  description?: string
  trunk_number_id?: number
  agent_id?: number
  queue_id?: number
  max_concurrent?: number
  call_timeout?: number
  retry_strategy?: string
  max_retry_times?: number
  retry_interval?: number
  scheduled_start_time?: string
  scheduled_end_time?: string
  allowed_weekdays?: number[]
  allowed_time_ranges?: CallTaskTimeRange[]
}

/**
 * 任务状态枚举
 */
export const CALL_TASK_STATUS = {
  PENDING: 'pending',       // 待执行
  RUNNING: 'running',       // 执行中
  PAUSED: 'paused',         // 已暂停
  COMPLETED: 'completed',   // 已完成
  CANCELLED: 'cancelled',   // 已取消
  FAILED: 'failed',         // 失败
} as const

/**
 * 任务状态显示配置
 */
export const CALL_TASK_STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  [CALL_TASK_STATUS.PENDING]: { text: '待执行', color: 'default' },
  [CALL_TASK_STATUS.RUNNING]: { text: '执行中', color: 'processing' },
  [CALL_TASK_STATUS.PAUSED]: { text: '已暂停', color: 'warning' },
  [CALL_TASK_STATUS.COMPLETED]: { text: '已完成', color: 'success' },
  [CALL_TASK_STATUS.CANCELLED]: { text: '已取消', color: 'default' },
  [CALL_TASK_STATUS.FAILED]: { text: '失败', color: 'error' },
}

/**
 * 任务明细状态枚举
 */
export const CALL_TASK_DETAIL_STATUS = {
  PENDING: 'pending',       // 待呼叫
  CALLING: 'calling',       // 呼叫中
  SUCCESS: 'success',       // 呼叫成功（已接听）
  FAILED: 'failed',         // 呼叫失败
  NO_ANSWER: 'no_answer',   // 无人接听
  BUSY: 'busy',             // 用户忙
  REJECTED: 'rejected',     // 用户拒绝
  SKIPPED: 'skipped',       // 已跳过
} as const

/**
 * 任务明细状态显示配置
 */
export const CALL_TASK_DETAIL_STATUS_CONFIG: Record<string, { text: string; color: string }> = {
  [CALL_TASK_DETAIL_STATUS.PENDING]: { text: '待呼叫', color: 'default' },
  [CALL_TASK_DETAIL_STATUS.CALLING]: { text: '呼叫中', color: 'processing' },
  [CALL_TASK_DETAIL_STATUS.SUCCESS]: { text: '已接听', color: 'success' },
  [CALL_TASK_DETAIL_STATUS.FAILED]: { text: '呼叫失败', color: 'error' },
  [CALL_TASK_DETAIL_STATUS.NO_ANSWER]: { text: '无人接听', color: 'warning' },
  [CALL_TASK_DETAIL_STATUS.BUSY]: { text: '用户忙', color: 'warning' },
  [CALL_TASK_DETAIL_STATUS.REJECTED]: { text: '已拒绝', color: 'error' },
  [CALL_TASK_DETAIL_STATUS.SKIPPED]: { text: '已跳过', color: 'default' },
}

/**
 * 重试策略枚举
 */
export const RETRY_STRATEGY = {
  NONE: 'none',             // 不重试
  ON_FAILED: 'on_failed',   // 失败时重试
  NO_ANSWER: 'no_answer',   // 无人接听时重试
  ALL: 'all',               // 失败或无人接听都重试
} as const

/**
 * 重试策略显示配置
 */
export const RETRY_STRATEGY_CONFIG: Record<string, string> = {
  [RETRY_STRATEGY.NONE]: '不重试',
  [RETRY_STRATEGY.ON_FAILED]: '失败时重试',
  [RETRY_STRATEGY.NO_ANSWER]: '无人接听时重试',
  [RETRY_STRATEGY.ALL]: '失败或无人接听都重试',
}

/**
 * 获取外呼任务列表
 */
export const getCallTaskList = async (params: {
  page?: number
  page_size?: number
  name?: string
  status?: string
}): Promise<CallTaskListResponse> => {
  const response = await request.get<CallTaskListResponse>('/api/call-task', params)
  return response
}

/**
 * 获取外呼任务详情
 */
export const getCallTaskDetail = async (id: number): Promise<CallTaskInfo> => {
  const response = await request.get<CallTaskInfo>(`/api/call-task/${id}`)
  return response
}

/**
 * 创建外呼任务
 */
export const createCallTask = async (data: CreateCallTaskParams): Promise<CallTaskInfo> => {
  const response = await request.post<CallTaskInfo>('/api/call-task', data)
  return response
}

/**
 * 更新外呼任务
 */
export const updateCallTask = async (data: UpdateCallTaskParams): Promise<CallTaskInfo> => {
  const response = await request.put<CallTaskInfo>('/api/call-task', data)
  return response
}

/**
 * 删除外呼任务
 */
export const deleteCallTask = async (id: number): Promise<void> => {
  await request.delete(`/api/call-task/${id}`)
}

/**
 * 控制外呼任务（启动/暂停/停止/取消）
 */
export const controlCallTask = async (id: number, action: 'start' | 'pause' | 'stop' | 'cancel'): Promise<void> => {
  await request.post('/api/call-task/control', { id, action })
}

/**
 * 获取外呼任务统计
 */
export const getCallTaskStats = async (taskId: number): Promise<CallTaskStats> => {
  const response = await request.get<CallTaskStats>('/api/call-task/stats', { task_id: taskId })
  return response
}

/**
 * 获取外呼任务明细列表
 */
export const getCallTaskDetailList = async (params: {
  task_id: number
  page?: number
  page_size?: number
  phone_number?: string
  status?: string
}): Promise<CallTaskDetailListResponse> => {
  const response = await request.get<CallTaskDetailListResponse>('/api/call-task-detail', params)
  return response
}

/**
 * 批量添加号码到外呼任务
 */
export const batchAddCallTaskDetail = async (taskId: number, phoneList: CallTaskPhoneItem[]): Promise<{ imported_count: number }> => {
  const response = await request.post<{ imported_count: number }>('/api/call-task-detail/batch-add', {
    task_id: taskId,
    phone_list: phoneList,
  })
  return response
}
