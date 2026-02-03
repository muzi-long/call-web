/**
 * 角色权限管理相关 API
 */
import request from '@common/utils/request'

// ========== 角色管理 ==========

/**
 * 角色信息
 */
export interface RoleInfo {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

/**
 * 角色详情响应（包含权限列表）
 */
export interface RoleDetailResponse {
  role: RoleInfo
  permissions: PermissionInfo[]
}

/**
 * 创建角色参数
 */
export interface RoleCreateParams {
  name: string
  description?: string
}

/**
 * 更新角色参数
 */
export interface RoleUpdateParams {
  id: number
  name?: string
  description?: string
}

/**
 * 获取角色列表
 */
export const getRoleList = async (): Promise<RoleInfo[]> => {
  return await request.get<RoleInfo[]>('/admin/role')
}

/**
 * 获取角色详情（包含权限列表）
 */
export const getRoleDetail = async (id: number): Promise<RoleDetailResponse> => {
  return await request.get<RoleDetailResponse>(`/admin/role/${id}`)
}

/**
 * 创建角色
 */
export const createRole = async (params: RoleCreateParams): Promise<{ id: number }> => {
  return await request.post<{ id: number }>('/admin/role', params)
}

/**
 * 更新角色
 */
export const updateRole = async (params: RoleUpdateParams): Promise<void> => {
  return await request.put<void>('/admin/role', params)
}

/**
 * 删除角色
 */
export const deleteRole = async (id: number): Promise<void> => {
  return await request.delete<void>('/admin/role', id)
}

/**
 * 为角色分配权限
 */
export interface RoleAssignPermissionsParams {
  role_id: number
  permission_ids: number[]
}

export const assignPermissionsToRole = async (params: RoleAssignPermissionsParams): Promise<void> => {
  return await request.post<void>('/admin/role/permissions', params)
}

// ========== 权限管理 ==========

/**
 * 权限信息
 */
export interface PermissionInfo {
  id: number
  code: string
  name: string
  description: string
  parent_id: number
  sort: number
  children?: PermissionInfo[]
  created_at: string
  updated_at: string
}

/**
 * 创建权限参数
 */
export interface PermissionCreateParams {
  code: string
  name: string
  description?: string
  parent_id?: number
  sort?: number
}

/**
 * 更新权限参数
 */
export interface PermissionUpdateParams {
  id: number
  code?: string
  name?: string
  description?: string
  parent_id?: number
  sort?: number
}

/**
 * 获取权限树
 */
export const getPermissionList = async (): Promise<PermissionInfo[]> => {
  return await request.get<PermissionInfo[]>('/admin/permission')
}

/**
 * 获取权限详情
 */
export const getPermissionDetail = async (id: number): Promise<PermissionInfo> => {
  return await request.get<PermissionInfo>(`/admin/permission/${id}`)
}

/**
 * 创建权限
 */
export const createPermission = async (params: PermissionCreateParams): Promise<{ id: number }> => {
  return await request.post<{ id: number }>('/admin/permission', params)
}

/**
 * 更新权限
 */
export const updatePermission = async (params: PermissionUpdateParams): Promise<void> => {
  return await request.put<void>('/admin/permission', params)
}

/**
 * 删除权限
 */
export const deletePermission = async (id: number): Promise<void> => {
  return await request.delete<void>('/admin/permission', id)
}

// ========== 用户角色分配 ==========

/**
 * 用户角色信息响应
 */
export interface AgentRolesResponse {
  agent_id: number
  roles: RoleInfo[]
}

/**
 * 用户权限信息响应
 */
export interface AgentPermissionsResponse {
  agent_id: number
  permissions: PermissionInfo[]
}

/**
 * 获取用户的角色列表
 */
export const getAgentRoles = async (agentId: number): Promise<AgentRolesResponse> => {
  return await request.get<AgentRolesResponse>('/admin/agent/roles', { agent_id: agentId })
}

/**
 * 获取用户的权限列表（包括通过角色获得的和直接分配的）
 */
export const getAgentPermissions = async (agentId: number): Promise<AgentPermissionsResponse> => {
  return await request.get<AgentPermissionsResponse>('/admin/agent/permissions', { agent_id: agentId })
}

/**
 * 为用户分配角色
 */
export interface AgentAssignRolesParams {
  agent_id: number
  role_ids: number[]
}

export const assignRolesToAgent = async (params: AgentAssignRolesParams): Promise<void> => {
  return await request.post<void>('/admin/agent/roles', params)
}

/**
 * 为用户直接分配权限
 */
export interface AgentAssignPermissionsParams {
  agent_id: number
  permission_ids: number[]
}

export const assignPermissionsToAgent = async (params: AgentAssignPermissionsParams): Promise<void> => {
  return await request.post<void>('/admin/agent/permissions', params)
}
