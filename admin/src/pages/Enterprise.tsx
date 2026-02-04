import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getEnterpriseList,
  createEnterprise,
  updateEnterprise,
  deleteEnterprise,
  type EnterpriseInfo,
  type EnterpriseListParams,
  type AgentInfo,
} from '../api/enterprise'
import { formatDateTime } from '@common/utils/date'

const { Search } = Input

function Enterprise() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<EnterpriseInfo[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, page_size: 20 })
  const [searchParams, setSearchParams] = useState<EnterpriseListParams>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EnterpriseInfo | null>(null)
  // 用于防止重复请求
  const loadingRef = useRef(false)

  // 加载企业列表
  const loadData = useCallback(async () => {
    // 如果正在加载，直接返回
    if (loadingRef.current) {
      return
    }
    try {
      loadingRef.current = true
      setLoading(true)
      const params: EnterpriseListParams = {
        page: pagination.page,
        page_size: pagination.page_size,
        name: searchParams.name,
        status: searchParams.status,
      }
      const response = await getEnterpriseList(params)
      setDataSource(response.data)
      setTotal(response.total)
    } catch (error) {
      console.error('加载企业列表失败:', error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [pagination.page, pagination.page_size, searchParams.name, searchParams.status])

  // 使用 useRef 存储上一次的请求参数，避免重复请求
  const prevParamsRef = useRef<string>('')

  useEffect(() => {
    const paramsKey = JSON.stringify({
      page: pagination.page,
      page_size: pagination.page_size,
      name: searchParams.name,
      status: searchParams.status,
    })

    // 如果参数没有变化，不重复请求
    if (prevParamsRef.current === paramsKey) {
      return
    }

    prevParamsRef.current = paramsKey
    loadData()
  }, [loadData, pagination.page, pagination.page_size, searchParams.name, searchParams.status])

  // 搜索
  const handleSearch = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      name: value || undefined,
    }))
    setPagination({ page: 1, page_size: 20 })
  }

  // 打开创建/编辑弹窗
  const handleOpenModal = (record?: EnterpriseInfo) => {
    if (record) {
      setEditingRecord(record)
      form.setFieldsValue({
        name: record.name,
        status: record.status,
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
        // 更新
        await updateEnterprise({
          id: editingRecord.id,
          ...values,
        })
        message.success('更新成功')
      } else {
        // 创建
        await createEnterprise(values)
        message.success('创建成功')
      }
      handleCloseModal()
      loadData()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 删除企业
  const handleDelete = async (id: number) => {
    try {
      await deleteEnterprise({ id })
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 表格列定义
  const columns: ColumnsType<EnterpriseInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        if (status === 1) {
          return <Tag color="success">正常</Tag>
        } else if (status === 2) {
          return <Tag color="default">禁用</Tag>
        }
        return <Tag color="default">未知</Tag>
      },
    },
    {
      title: '所有者',
      dataIndex: 'owner_agent',
      key: 'owner_agent',
      render: (ownerAgent: AgentInfo | undefined) => {
        return ownerAgent?.display_name || '-'
      },
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/enterprise/${record.id}`)}
          >
            查看详情
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
            title="确定要删除这个企业吗？"
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="搜索企业名称"
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          创建企业
        </Button>
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
      />

      <Modal
        title={editingRecord ? '编辑企业' : '创建企业'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="企业名称"
            rules={[{ required: true, message: '请输入企业名称' }]}
          >
            <Input placeholder="请输入企业名称" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue={1}
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态" style={{ width: '100%' }}>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={2}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Enterprise
