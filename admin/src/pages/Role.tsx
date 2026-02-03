import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tree,
  Spin,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DataNode } from 'antd/es/tree'
import {
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  getPermissionList,
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
 * 从权限树中提取所有权限ID（扁平化）
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
 * Tree 组件在非 checkStrictly 模式下，checkedKeys 只需要传叶子节点
 * 父节点会根据子节点状态自动计算
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
        // 叶子节点
        if (selectedSet.has(perm.id)) {
          leafIds.push(perm.id)
        }
      }
    }
  }

  traverse(allPermissions)
  return leafIds
}

function Role() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<RoleInfo[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RoleInfo | null>(null)

  // 权限分配相关状态
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleInfo | null>(null)
  const [allPermissions, setAllPermissions] = useState<PermissionInfo[]>([])
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<number[]>([])
  const [permissionLoading, setPermissionLoading] = useState(false)

  // 用于防止重复请求
  const loadingRef = useRef(false)
  const permissionsLoadedRef = useRef(false)

  // 加载角色列表
  const loadData = useCallback(async (force = false) => {
    if (loadingRef.current && !force) {
      return
    }
    loadingRef.current = true
    try {
      setLoading(true)
      const data = await getRoleList()
      setDataSource(data || [])
    } catch (error) {
      console.error('加载角色列表失败:', error)
      setDataSource([])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  // 加载所有权限（用于权限分配弹窗）
  const loadAllPermissions = useCallback(async () => {
    if (permissionsLoadedRef.current) {
      return
    }
    try {
      const data = await getPermissionList()
      setAllPermissions(data || [])
      permissionsLoadedRef.current = true
    } catch (error) {
      console.error('加载权限列表失败:', error)
      setAllPermissions([])
    }
  }, [])

  useEffect(() => {
    loadData()
    loadAllPermissions()
  }, [loadData, loadAllPermissions])

  // 打开创建/编辑弹窗
  const handleOpenModal = (record?: RoleInfo) => {
    if (record) {
      setEditingRecord(record)
      form.setFieldsValue({
        name: record.name,
        description: record.description,
      })
    } else {
      setEditingRecord(null)
      form.resetFields()
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
        await updateRole({
          id: editingRecord.id,
          name: values.name,
          description: values.description,
        })
        message.success('更新成功')
      } else {
        await createRole({
          name: values.name,
          description: values.description,
        })
        message.success('创建成功')
      }
      handleCloseModal()
      loadData(true)
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 删除角色
  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id)
      message.success('删除成功')
      loadData(true)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 打开权限分配弹窗
  const handleOpenPermissionModal = async (record: RoleInfo) => {
    setSelectedRole(record)
    setPermissionLoading(true)
    setPermissionModalVisible(true)

    try {
      // 获取角色详情（包含已分配的权限）
      const detail = await getRoleDetail(record.id)
      // 提取已分配的权限ID
      const assignedIds = extractAllPermissionIds(detail.permissions || [])
      // 只传叶子节点ID给Tree组件，父节点会自动计算状态
      const leafIds = extractLeafPermissionIds(assignedIds, allPermissions)
      setCheckedPermissionIds(leafIds)
    } catch (error) {
      console.error('加载角色权限失败:', error)
      setCheckedPermissionIds([])
    } finally {
      setPermissionLoading(false)
    }
  }

  // 关闭权限分配弹窗
  const handleClosePermissionModal = () => {
    setPermissionModalVisible(false)
    setSelectedRole(null)
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

  // 保存权限分配 - 保存时加上半选中的父节点
  const handleSavePermissions = async () => {
    if (!selectedRole) return
    try {
      // 获取当前Tree组件中半选中的节点
      // 通过遍历权限树，找出哪些父节点的子节点被部分选中
      const allIds = getAllCheckedAndHalfCheckedIds(checkedPermissionIds, allPermissions)
      await assignPermissionsToRole({
        role_id: selectedRole.id,
        permission_ids: allIds,
      })
      message.success('权限分配成功')
      handleClosePermissionModal()
    } catch (error) {
      console.error('权限分配失败:', error)
    }
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
            result.add(perm.id) // 子节点有选中的，父节点也要加入
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

  // 表格列定义
  const columns: ColumnsType<RoleInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleOpenPermissionModal(record)}
          >
            分配权限
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
            title="确定要删除这个角色吗？"
            description="删除后，相关的用户角色关联也会被删除"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>角色管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          创建角色
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        pagination={false}
      />

      {/* 创建/编辑角色弹窗 */}
      <Modal
        title={editingRecord ? '编辑角色' : '创建角色'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限分配弹窗 */}
      <Modal
        title={`分配权限 - ${selectedRole?.name || ''}`}
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

export default Role
