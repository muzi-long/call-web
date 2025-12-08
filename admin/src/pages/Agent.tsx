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
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
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
import { formatDateTime } from '@common/utils/date'

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

  // 用于防止重复请求
  const loadingRef = useRef(false)
  const prevParamsRef = useRef<string>('')
  const enterprisesLoadingRef = useRef(false)
  const enterprisesLoadedRef = useRef(false)

  // 加载 Agent 列表
  const loadData = useCallback(async () => {
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

    if (loadingRef.current || prevParamsRef.current === paramsKey) {
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

  useEffect(() => {
    loadData()
  }, [loadData])

  // 组件加载时获取所有企业列表
  useEffect(() => {
    loadAllEnterprises()
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
      loadData()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 删除 Agent
  const handleDelete = async (id: number) => {
    try {
      await deleteAgent({ id })
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
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
      title: '接听手机',
      dataIndex: 'mobile',
      key: 'mobile',
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
      width: 150,
      fixed: 'right',
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
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
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
    </div>
  )
}

export default Agent

