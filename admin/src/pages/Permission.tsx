import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getPermissionList,
  createPermission,
  updatePermission,
  deletePermission,
  type PermissionInfo,
} from '../api/role'
import { formatDateTime } from '@common/utils/date'

/**
 * 将权限树扁平化，用于父权限选择器
 */
const flattenPermissions = (
  permissions: PermissionInfo[],
  level = 0,
  result: { id: number; name: string; code: string; level: number }[] = []
) => {
  for (const perm of permissions) {
    result.push({
      id: perm.id,
      name: perm.name,
      code: perm.code,
      level,
    })
    if (perm.children && perm.children.length > 0) {
      flattenPermissions(perm.children, level + 1, result)
    }
  }
  return result
}

function Permission() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<PermissionInfo[]>([])
  const [flatPermissions, setFlatPermissions] = useState<
    { id: number; name: string; code: string; level: number }[]
  >([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PermissionInfo | null>(null)

  // 用于防止重复请求
  const loadingRef = useRef(false)

  // 加载权限列表
  const loadData = useCallback(async (force = false) => {
    if (loadingRef.current && !force) {
      return
    }
    loadingRef.current = true
    try {
      setLoading(true)
      const data = await getPermissionList()
      setDataSource(data || [])
      // 扁平化权限用于父权限选择
      setFlatPermissions(flattenPermissions(data || []))
    } catch (error) {
      console.error('加载权限列表失败:', error)
      setDataSource([])
      setFlatPermissions([])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 打开创建/编辑弹窗
  const handleOpenModal = (record?: PermissionInfo) => {
    if (record) {
      setEditingRecord(record)
      form.setFieldsValue({
        code: record.code,
        name: record.name,
        description: record.description,
        parent_id: record.parent_id || undefined,
        sort: record.sort,
      })
    } else {
      setEditingRecord(null)
      form.resetFields()
      form.setFieldsValue({
        sort: 0,
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
        await updatePermission({
          id: editingRecord.id,
          code: values.code,
          name: values.name,
          description: values.description,
          parent_id: values.parent_id || 0,
          sort: values.sort || 0,
        })
        message.success('更新成功')
      } else {
        await createPermission({
          code: values.code,
          name: values.name,
          description: values.description,
          parent_id: values.parent_id || 0,
          sort: values.sort || 0,
        })
        message.success('创建成功')
      }
      handleCloseModal()
      loadData(true)
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 删除权限
  const handleDelete = async (id: number) => {
    try {
      await deletePermission(id)
      message.success('删除成功')
      loadData(true)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 获取父权限选项（排除自身及子权限）
  const getParentOptions = () => {
    if (!editingRecord) {
      return flatPermissions
    }
    // 编辑时，排除自身
    return flatPermissions.filter((p) => p.id !== editingRecord.id)
  }

  // 表格列定义
  const columns: ColumnsType<PermissionInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '权限代码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '权限名称',
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
      title: '父权限ID',
      dataIndex: 'parent_id',
      key: 'parent_id',
      width: 100,
      render: (parentId: number) =>
        parentId > 0 ? parentId : <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个权限吗？"
            description="删除后，相关的角色权限关联也会被删除"
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
        <h2 style={{ margin: 0 }}>权限管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          创建权限
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey="id"
        pagination={false}
        defaultExpandAllRows
      />

      {/* 创建/编辑权限弹窗 */}
      <Modal
        title={editingRecord ? '编辑权限' : '创建权限'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="权限代码"
            rules={[
              { required: true, message: '请输入权限代码' },
              {
                pattern: /^[a-z][a-z0-9_:]*$/,
                message: '权限代码只能包含小写字母、数字、下划线和冒号，且以字母开头',
              },
            ]}
            extra="例如: agent:view, agent:create, system:admin"
          >
            <Input placeholder="请输入权限代码" />
          </Form.Item>

          <Form.Item
            name="name"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="请输入权限名称" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入权限描述" rows={2} />
          </Form.Item>

          <Form.Item name="parent_id" label="父权限">
            <Select
              placeholder="请选择父权限（可选）"
              allowClear
              showSearch
              filterOption={(input, option) => {
                const text = String(option?.children || '')
                return text.toLowerCase().includes(input.toLowerCase())
              }}
            >
              {getParentOptions().map((perm) => (
                <Select.Option key={perm.id} value={perm.id}>
                  {'　'.repeat(perm.level)}
                  {perm.name} ({perm.code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sort"
            label="排序"
            extra="数字越小越靠前"
          >
            <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Permission
