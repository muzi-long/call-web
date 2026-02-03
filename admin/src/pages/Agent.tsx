import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Checkbox,
  Spin,
  Tree,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import {
  getAgentList,
  createAgent,
  updateAgent,
  deleteAgent,
  type AgentListParams,
  type AgentCreateParams,
  type AgentUpdateParams,
} from '../api/agent'
import { type AgentInfo } from '../api/enterprise'
import { getAllEnterprises, type EnterpriseInfo } from '../api/enterprise'
import {
  getRoleList,
  getAgentRoles,
  assignRolesToAgent,
  getPermissionList,
  getAgentPermissions,
  assignPermissionsToAgent,
  type RoleInfo,
  type PermissionInfo,
} from '../api/role'
import { formatDateTime } from '@common/utils/date'

/**
 * 将权限树转换为 Tree 组件需要的数据格式
 */
const convertToTreeData = (permissions: PermissionInfo[]): DataNode[] => {
  return permissions.map((perm) => ({
    key: perm.id,
    title: `${perm.name} (${perm.code})`,
    children: perm.children && perm.children.length > 0 ? convertToTreeData(perm.children) : undefined,
  }))
}

/**
 * 从权限树中提取所有权限ID
 */
const extractAllPermissionIds = (permissions: PermissionInfo[]): number[] => {
  const ids: number[] = []
  const traverse = (perms: PermissionInfo[]) => {
    for (const perm of perms) {
      ids.push(perm.id)
      if (perm.children && perm.children.length > 0) {
        traverse(perm.children)
      }
    }
  }
  traverse(permissions)
  return ids
}

/**
 * 从已选权限中提取叶子节点ID（用于Tree组件回显）
 */
const extractLeafPermissionIds = (
  selectedIds: number[],
  allPermissions: PermissionInfo[]
): number[] => {
  const selectedSet = new Set(selectedIds)
  const leafIds: number[] = []

  const traverse = (perms: PermissionInfo[]) => {
    for (const perm of perms) {
      const hasChildren = perm.children && perm.children.length > 0
      if (hasChildren) {
        traverse(perm.children!)
      } else {
        if (selectedSet.has(perm.id)) {
          leafIds.push(perm.id)
        }
      }
    }
  }

  traverse(allPermissions)
  return leafIds
}

function Agent() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<AgentInfo[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, page_size: 20 })
  const [searchParams, setSearchParams] = useState<AgentListParams>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AgentInfo | null>(null)
  // 所有企业列表（用于新增时的下拉选择）
  const [allEnterprises, setAllEnterprises] = useState<EnterpriseInfo[]>([])

  // 角色分配相关状态
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null)
  const [allRoles, setAllRoles] = useState<RoleInfo[]>([])
  const [checkedRoleIds, setCheckedRoleIds] = useState<number[]>([])
  const [roleLoading, setRoleLoading] = useState(false)

  // 权限分配相关状态
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [permissionAgent, setPermissionAgent] = useState<AgentInfo | null>(null)
  const [allPermissions, setAllPermissions] = useState<PermissionInfo[]>([])
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<number[]>([])
  const [permissionLoading, setPermissionLoading] = useState(false)

  // 用于防止重复请求
  const loadingRef = useRef(false)
  const prevParamsRef = useRef<string>('')
  const enterprisesLoadingRef = useRef(false)
  const enterprisesLoadedRef = useRef(false)
  const rolesLoadedRef = useRef(false)
  const permissionsLoadedRef = useRef(false)

  // 加载 Agent 列表
  const loadData = useCallback(async (force = false) => {
    const currentParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      ent_id: searchParams.ent_id,
      username: searchParams.username,
      email: searchParams.email,
      phone: searchParams.phone,
      display_name: searchParams.display_name,
    }
    const paramsKey = JSON.stringify(currentParams)

    if (loadingRef.current || (!force && prevParamsRef.current === paramsKey)) {
      return
    }

    loadingRef.current = true
    prevParamsRef.current = paramsKey

    try {
      setLoading(true)
      const response = await getAgentList(currentParams)
      setDataSource(response.data)
      setTotal(response.total)
    } catch (error) {
      console.error('加载 Agent 列表失败:', error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [
    pagination.page,
    pagination.page_size,
    searchParams.ent_id,
    searchParams.username,
    searchParams.email,
    searchParams.phone,
    searchParams.display_name,
  ])

  // 加载所有企业列表（用于新增时的下拉选择）
  const loadAllEnterprises = useCallback(async () => {
    if (enterprisesLoadingRef.current || enterprisesLoadedRef.current) {
      return
    }
    try {
      enterprisesLoadingRef.current = true
      const enterprises = await getAllEnterprises()
      setAllEnterprises(enterprises)
      enterprisesLoadedRef.current = true
    } catch (error) {
      console.error('加载企业列表失败:', error)
      setAllEnterprises([])
    } finally {
      enterprisesLoadingRef.current = false
    }
  }, [])

  // 加载所有角色列表（用于角色分配）
  const loadAllRoles = useCallback(async () => {
    if (rolesLoadedRef.current) {
      return
    }
    try {
      const roles = await getRoleList()
      setAllRoles(roles || [])
      rolesLoadedRef.current = true
    } catch (error) {
      console.error('加载角色列表失败:', error)
      setAllRoles([])
    }
  }, [])

  // 加载所有权限列表（用于权限分配）
  const loadAllPermissions = useCallback(async () => {
    if (permissionsLoadedRef.current) {
      return
    }
    try {
      const permissions = await getPermissionList()
      setAllPermissions(permissions || [])
      permissionsLoadedRef.current = true
    } catch (error) {
      console.error('加载权限列表失败:', error)
      setAllPermissions([])
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 组件加载时获取所有企业列表
  useEffect(() => {
    loadAllEnterprises()
    loadAllRoles()
    loadAllPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 搜索 - 处理单个搜索字段的变化
  const handleSearchChange = (field: 'username' | 'email' | 'phone' | 'display_name', value: string) => {
    const newValue = value.trim() || undefined
    setSearchParams((prev) => ({
      ...prev,
      [field]: newValue,
    }))
    setPagination({ page: 1, page_size: 20 })
  }

  // 清空所有搜索
  const handleClearSearch = () => {
    setSearchParams({})
    setPagination({ page: 1, page_size: 20 })
  }

  // 打开创建/编辑弹窗
  const handleOpenModal = (record?: AgentInfo) => {
    if (record) {
      setEditingRecord(record)
      form.setFieldsValue({
        username: record.username,
        email: record.email,
        phone: record.phone,
        display_name: record.display_name,
        disabled: record.disabled,
        answer_type: record.answer_type,
        mobile: record.mobile,
        // 编辑时不处理 ent_id
      })
    } else {
      setEditingRecord(null)
      form.resetFields()
      form.setFieldsValue({
        answer_type: 'webrtc', // 默认值
        disabled: 0,
      })
    }
    setModalVisible(true)
  }

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingRecord(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        // 更新
        const updateData: AgentUpdateParams = {
          id: editingRecord.id,
          username: values.username,
          email: values.email,
          phone: values.phone,
          display_name: values.display_name,
          disabled: values.disabled,
          answer_type: values.answer_type,
          mobile: values.mobile,
        }
        // 如果提供了密码，才更新密码
        if (values.password) {
          updateData.password = values.password
        }
        // 如果提供了 sip_password，才更新
        if (values.sip_password) {
          updateData.sip_password = values.sip_password
        }
        await updateAgent(updateData)
        message.success('更新成功')
        handleCloseModal()
        loadData(true) // 强制刷新列表
        return
      } else {
        // 创建
        const createData: AgentCreateParams = {
          username: values.username,
          email: values.email,
          phone: values.phone,
          password: values.password,
          display_name: values.display_name,
          answer_type: values.answer_type || 'webrtc',
          mobile: values.mobile,
        }
        // 如果选择了企业，添加到请求中
        if (values.ent_id) {
          createData.ent_id = values.ent_id
        }
        await createAgent(createData)
        message.success('创建成功')
      }
      handleCloseModal()
      loadData(true) // 强制刷新列表
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 删除 Agent
  const handleDelete = async (id: number) => {
    try {
      await deleteAgent({ id })
      message.success('删除成功')
      loadData(true) // 强制刷新列表
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 打开角色分配弹窗
  const handleOpenRoleModal = async (record: AgentInfo) => {
    setSelectedAgent(record)
    setRoleLoading(true)
    setRoleModalVisible(true)

    try {
      // 获取用户当前的角色
      const response = await getAgentRoles(record.id)
      const assignedRoleIds = (response.roles || []).map((r) => r.id)
      setCheckedRoleIds(assignedRoleIds)
    } catch (error) {
      console.error('加载用户角色失败:', error)
      setCheckedRoleIds([])
    } finally {
      setRoleLoading(false)
    }
  }

  // 关闭角色分配弹窗
  const handleCloseRoleModal = () => {
    setRoleModalVisible(false)
    setSelectedAgent(null)
    setCheckedRoleIds([])
  }

  // 角色选择变更
  const handleRoleChange = (roleId: number, checked: boolean) => {
    if (checked) {
      setCheckedRoleIds([...checkedRoleIds, roleId])
    } else {
      setCheckedRoleIds(checkedRoleIds.filter((id) => id !== roleId))
    }
  }

  // 保存角色分配
  const handleSaveRoles = async () => {
    if (!selectedAgent) return
    try {
      await assignRolesToAgent({
        agent_id: selectedAgent.id,
        role_ids: checkedRoleIds,
      })
      message.success('角色分配成功')
      handleCloseRoleModal()
    } catch (error) {
      console.error('角色分配失败:', error)
    }
  }

  // 打开权限分配弹窗
  const handleOpenPermissionModal = async (record: AgentInfo) => {
    setPermissionAgent(record)
    setPermissionLoading(true)
    setPermissionModalVisible(true)

    try {
      // 获取用户当前的权限
      const response = await getAgentPermissions(record.id)
      const assignedPermissionIds = extractAllPermissionIds(response.permissions || [])
      // 只传叶子节点ID给Tree组件，父节点会自动计算状态
      const leafIds = extractLeafPermissionIds(assignedPermissionIds, allPermissions)
      setCheckedPermissionIds(leafIds)
    } catch (error) {
      console.error('加载用户权限失败:', error)
      setCheckedPermissionIds([])
    } finally {
      setPermissionLoading(false)
    }
  }

  // 关闭权限分配弹窗
  const handleClosePermissionModal = () => {
    setPermissionModalVisible(false)
    setPermissionAgent(null)
    setCheckedPermissionIds([])
  }

  // 权限选择变更
  const handlePermissionCheck = (
    checkedKeys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
    info: any
  ) => {
    // 获取选中的节点（不包括半选中）
    const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked
    setCheckedPermissionIds(keys.map((k) => Number(k)))
  }

  /**
   * 根据选中的叶子节点，计算所有需要保存的权限ID（包括半选中的父节点）
   */
  const getAllCheckedAndHalfCheckedIds = (checkedIds: number[], permissions: PermissionInfo[]): number[] => {
    const checkedSet = new Set(checkedIds)
    const result = new Set<number>(checkedIds)

    const traverse = (perms: PermissionInfo[]): boolean => {
      let hasCheckedChild = false
      for (const perm of perms) {
        const hasChildren = perm.children && perm.children.length > 0
        if (hasChildren) {
          const childHasChecked = traverse(perm.children!)
          if (childHasChecked) {
            result.add(perm.id)
            hasCheckedChild = true
          }
        } else {
          if (checkedSet.has(perm.id)) {
            hasCheckedChild = true
          }
        }
      }
      return hasCheckedChild
    }

    traverse(permissions)
    return Array.from(result)
  }

  // 保存权限分配
  const handleSavePermissions = async () => {
    if (!permissionAgent) return
    try {
      // 保存时加上半选中的父节点
      const allIds = getAllCheckedAndHalfCheckedIds(checkedPermissionIds, allPermissions)
      await assignPermissionsToAgent({
        agent_id: permissionAgent.id,
        permission_ids: allIds,
      })
      message.success('权限分配成功')
      handleClosePermissionModal()
    } catch (error) {
      console.error('权限分配失败:', error)
    }
  }

  // 表格列定义
  const columns: ColumnsType<AgentInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '显示名称',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'disabled',
      key: 'disabled',
      render: (disabled: number) => {
        if (disabled === 0) {
          return <Tag color="success">正常</Tag>
        } else if (disabled === 1) {
          return <Tag color="default">禁用</Tag>
        }
        return <Tag color="default">未知</Tag>
      },
    },
    {
      title: '接听方式',
      dataIndex: 'answer_type',
      key: 'answer_type',
      render: (answerType: string) => {
        const typeMap: Record<string, string> = {
          webrtc: 'WebRTC',
          mobile: '手机接听',
          soft: '软电话',
        }
        return typeMap[answerType] || answerType
      },
    },
    {
      title: '接听手机',
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: 'SIP ID',
      dataIndex: 'sip_id',
      key: 'sip_id',
    },
    {
      title: 'SIP密码',
      dataIndex: 'sip_password',
      key: 'sip_password',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 220,
      fixed: 'right',
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 220,
      fixed: 'right',
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => handleOpenRoleModal(record)}
          >
            角色
          </Button>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleOpenPermissionModal(record)}
          >
            权限
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Input
            placeholder="搜索用户名"
            allowClear
            style={{ width: 200 }}
            value={searchParams.username || ''}
            onChange={(e) => handleSearchChange('username', e.target.value)}
            onPressEnter={() => loadData()}
          />
          <Input
            placeholder="搜索邮箱"
            allowClear
            style={{ width: 200 }}
            value={searchParams.email || ''}
            onChange={(e) => handleSearchChange('email', e.target.value)}
            onPressEnter={() => loadData()}
          />
          <Input
            placeholder="搜索手机号"
            allowClear
            style={{ width: 200 }}
            value={searchParams.phone || ''}
            onChange={(e) => handleSearchChange('phone', e.target.value)}
            onPressEnter={() => loadData()}
          />
          <Input
            placeholder="搜索显示名称"
            allowClear
            style={{ width: 200 }}
            value={searchParams.display_name || ''}
            onChange={(e) => handleSearchChange('display_name', e.target.value)}
            onPressEnter={() => loadData()}
          />
          <Button onClick={handleClearSearch}>清空</Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            创建用户
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.page_size,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({ page, page_size: pageSize || 20 })
          },
        }}
        scroll={{ x: 1500 }}
      />

      <Modal
        title={editingRecord ? '编辑用户' : '创建用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          {!editingRecord && (
            <Form.Item
              name="ent_id"
              label="企业"
            >
              <Select
                placeholder="请选择企业（可选）"
                style={{ width: '100%' }}
                showSearch
                allowClear
                filterOption={(input, option) => {
                  const text = typeof option?.children === 'string' ? option.children : String(option?.children || '')
                  return text.toLowerCase().includes(input.toLowerCase())
                }}
                notFoundContent={allEnterprises.length === 0 ? '加载中...' : '暂无数据'}
              >
                {allEnterprises.map((ent) => (
                  <Select.Option key={ent.id} value={ent.id}>
                    {ent.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="display_name"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="请输入显示名称" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          {!editingRecord && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          {editingRecord && (
            <>
              <Form.Item
                name="password"
                label="密码"
                help="留空则不修改密码"
              >
                <Input.Password placeholder="留空则不修改密码" />
              </Form.Item>

              <Form.Item
                name="disabled"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态" style={{ width: '100%' }}>
                  <Select.Option value={0}>正常</Select.Option>
                  <Select.Option value={1}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Form.Item
            name="answer_type"
            label="接听方式"
            rules={[{ required: true, message: '请选择接听方式' }]}
          >
            <Select placeholder="请选择接听方式" style={{ width: '100%' }}>
              <Select.Option value="webrtc">WebRTC</Select.Option>
              <Select.Option value="mobile">手机接听</Select.Option>
              <Select.Option value="soft">软电话</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="mobile"
            label="接听手机号码"
          >
            <Input placeholder="请输入接听手机号码" />
          </Form.Item>

          {editingRecord && (
            <Form.Item
              name="sip_password"
              label="SIP密码"
              help="留空则不修改SIP密码"
            >
              <Input.Password placeholder="留空则不修改SIP密码" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 角色分配弹窗 */}
      <Modal
        title={`分配角色 - ${selectedAgent?.display_name || selectedAgent?.username || ''}`}
        open={roleModalVisible}
        onOk={handleSaveRoles}
        onCancel={handleCloseRoleModal}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        {roleLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="加载中..." />
          </div>
        ) : allRoles.length > 0 ? (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {allRoles.map((role) => (
              <div key={role.id} style={{ marginBottom: 12 }}>
                <Checkbox
                  checked={checkedRoleIds.includes(role.id)}
                  onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                >
                  <span style={{ fontWeight: 500 }}>{role.name}</span>
                  {role.description && (
                    <span style={{ color: '#999', marginLeft: 8 }}>
                      {role.description}
                    </span>
                  )}
                </Checkbox>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无角色数据，请先在角色管理中创建角色
          </div>
        )}
      </Modal>

      {/* 权限分配弹窗 */}
      <Modal
        title={`分配权限 - ${permissionAgent?.display_name || permissionAgent?.username || ''}`}
        open={permissionModalVisible}
        onOk={handleSavePermissions}
        onCancel={handleClosePermissionModal}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        {permissionLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="加载中..." />
          </div>
        ) : allPermissions.length > 0 ? (
          <Tree
            checkable
            defaultExpandAll
            checkedKeys={checkedPermissionIds}
            onCheck={handlePermissionCheck}
            treeData={convertToTreeData(allPermissions)}
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无权限数据，请先在权限管理中创建权限
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Agent

