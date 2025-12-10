import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getTrunkList,
  createTrunk,
  updateTrunk,
  deleteTrunk,
  type TrunkListParams,
  type TrunkCreateParams,
  type TrunkUpdateParams,
  type TrunkInfo,
} from '../api/trunk'
import { formatDateTime } from '@common/utils/date'

const { Search } = Input

function Trunk() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<TrunkInfo[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, page_size: 20 })
  const [searchParams, setSearchParams] = useState<TrunkListParams>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrunkInfo | null>(null)

  // 用于防止重复请求
  const loadingRef = useRef(false)
  const prevParamsRef = useRef<string>('')

  // 加载线路列表
  const loadData = useCallback(async (force = false) => {
    const currentParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      ip: searchParams.ip,
      name: searchParams.name,
    }
    const paramsKey = JSON.stringify(currentParams)

    if (loadingRef.current || (!force && prevParamsRef.current === paramsKey)) {
      return
    }

    loadingRef.current = true
    prevParamsRef.current = paramsKey

    try {
      setLoading(true)
      const response = await getTrunkList(currentParams)
      setDataSource(response.data)
      setTotal(response.total)
    } catch (error) {
      console.error('加载线路列表失败:', error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [pagination.page, pagination.page_size, searchParams.ip, searchParams.name])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 搜索 - 根据IP或名称查询
  const handleSearch = (value: string) => {
    const newValue = value.trim() || undefined
    setSearchParams((prev) => ({
      ...prev,
      ip: newValue,
      name: newValue,
    }))
    setPagination({ page: 1, page_size: 20 })
  }

  // 搜索 - 处理单个搜索字段的变化
  const handleSearchChange = (field: 'name' | 'ip', value: string) => {
    const newValue = value.trim() || undefined
    setSearchParams((prev) => ({
      ...prev,
      [field]: newValue,
    }))
    setPagination({ page: 1, page_size: 20 })
  }

  // 清空搜索
  const handleClearSearch = () => {
    setSearchParams({})
    setPagination({ page: 1, page_size: 20 })
  }

  // 打开创建/编辑弹窗
  const handleOpenModal = (record?: TrunkInfo) => {
    if (record) {
      setEditingRecord(record)
      form.setFieldsValue({
        name: record.name,
        ip: record.ip,
        port: record.port,
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
        const updateData: TrunkUpdateParams = {
          id: editingRecord.id,
          name: values.name,
          ip: values.ip,
          port: values.port,
        }
        await updateTrunk(updateData)
        message.success('更新成功')
        handleCloseModal()
        loadData(true) // 强制刷新列表
        return
      } else {
        // 创建
        const createData: TrunkCreateParams = {
          name: values.name,
          ip: values.ip,
          port: values.port,
        }
        await createTrunk(createData)
        message.success('创建成功')
      }
      handleCloseModal()
      loadData(true) // 强制刷新列表
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 删除线路
  const handleDelete = async (id: number) => {
    try {
      await deleteTrunk({ id })
      message.success('删除成功')
      loadData(true) // 强制刷新列表
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  // 表格列定义
  const columns: ColumnsType<TrunkInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      // 不设置宽度，自适应
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      // 不设置宽度，自适应
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 'up' | 'down' | undefined) => {
        if (status === 'up') {
          return <Tag color="success">正常</Tag>
        } else if (status === 'down') {
          return <Tag color="error">异常</Tag>
        }
        return <Tag color="default">未知</Tag>
      },
    },
    {
      title: '最后ping时间',
      dataIndex: 'last_ping_at',
      key: 'last_ping_at',
      width: 180,
      render: (time: string) => {
        if (!time) {
          return '-'
        }
        return formatDateTime(time)
      },
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
            title="确定要删除这条线路吗？"
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
          <Search
            placeholder="搜索名称"
            allowClear
            style={{ width: 200 }}
            value={searchParams.name || ''}
            onChange={(e) => handleSearchChange('name', e.target.value)}
            onPressEnter={() => loadData(true)}
          />
          <Search
            placeholder="搜索IP地址"
            allowClear
            style={{ width: 200 }}
            value={searchParams.ip || ''}
            onChange={(e) => handleSearchChange('ip', e.target.value)}
            onPressEnter={() => loadData(true)}
          />
          <Button onClick={handleClearSearch}>清空</Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            创建线路
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
      />

      <Modal
        title={editingRecord ? '编辑线路' : '创建线路'}
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
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>

          <Form.Item
            name="ip"
            label="IP地址"
            rules={[
              { required: true, message: '请输入IP地址' },
              {
                pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
                message: '请输入正确的IP地址格式',
              },
            ]}
          >
            <Input placeholder="请输入IP地址，例如：192.168.1.1" />
          </Form.Item>

          <Form.Item
            name="port"
            label="端口"
            rules={[
              { required: true, message: '请输入端口' },
              { type: 'number', min: 1, max: 65535, message: '端口范围：1-65535' },
            ]}
          >
            <InputNumber
              placeholder="请输入端口"
              style={{ width: '100%' }}
              min={1}
              max={65535}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Trunk

