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
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Divider,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
// @ts-ignore - dayjs is installed at workspace root
import dayjs from 'dayjs'
import {
  getTrunkNumberList,
  createTrunkNumber,
  updateTrunkNumber,
  deleteTrunkNumber,
  type TrunkNumberListParams,
  type TrunkNumberCreateParams,
  type TrunkNumberUpdateParams,
  type TrunkNumberInfo,
} from '../api/trunkNumber'
import { getAllTrunks, type TrunkInfo } from '../api/trunk'
import { getAllEnterprises, type EnterpriseInfo } from '../api/enterprise'
import { formatDateTime } from '@common/utils/date'

const { Search } = Input

function TrunkNumber() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<TrunkNumberInfo[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, page_size: 20 })
  const [searchParams, setSearchParams] = useState<TrunkNumberListParams>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrunkNumberInfo | null>(null)
  const [allTrunks, setAllTrunks] = useState<TrunkInfo[]>([])
  const [allEnterprises, setAllEnterprises] = useState<EnterpriseInfo[]>([])

  // 用于防止重复请求
  const loadingRef = useRef(false)
  const prevParamsRef = useRef<string>('')
  const trunksLoadingRef = useRef(false)
  const enterprisesLoadingRef = useRef(false)

  // 加载号码列表
  const loadData = useCallback(async (force = false) => {
    const currentParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      number: searchParams.number,
      direction: searchParams.direction,
      ent_id: searchParams.ent_id,
      trunk_id: searchParams.trunk_id,
    }
    const paramsKey = JSON.stringify(currentParams)

    if (loadingRef.current || (!force && prevParamsRef.current === paramsKey)) {
      return
    }

    loadingRef.current = true
    prevParamsRef.current = paramsKey

    try {
      setLoading(true)
      const response = await getTrunkNumberList(currentParams)
      setDataSource(response.data)
      setTotal(response.total)
    } catch (error) {
      console.error('加载号码列表失败:', error)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [pagination.page, pagination.page_size, searchParams.number, searchParams.direction, searchParams.ent_id, searchParams.trunk_id])

  // 加载所有线路列表（不分页）
  const loadAllTrunks = useCallback(async () => {
    if (trunksLoadingRef.current) {
      return
    }
    try {
      trunksLoadingRef.current = true
      const trunks = await getAllTrunks()
      setAllTrunks(trunks)
    } catch (error) {
      console.error('加载线路列表失败:', error)
      setAllTrunks([])
    } finally {
      trunksLoadingRef.current = false
    }
  }, [])

  // 加载所有企业列表
  const loadAllEnterprises = useCallback(async () => {
    if (enterprisesLoadingRef.current) {
      return
    }
    try {
      enterprisesLoadingRef.current = true
      const enterprises = await getAllEnterprises()
      setAllEnterprises(enterprises)
    } catch (error) {
      console.error('加载企业列表失败:', error)
      setAllEnterprises([])
    } finally {
      enterprisesLoadingRef.current = false
    }
  }, [])

  useEffect(() => {
    loadData()
    loadAllTrunks()
    loadAllEnterprises()
  }, [loadData, loadAllTrunks, loadAllEnterprises])

  // 搜索 - 处理单个搜索字段的变化
  const handleSearchChange = (field: 'number' | 'direction' | 'ent_id' | 'trunk_id', value: string | number | undefined) => {
    const newValue = value === '' || value === undefined ? undefined : (typeof value === 'string' ? value.trim() || undefined : value)
    setSearchParams((prev) => ({
      ...prev,
      [field]: newValue as any,
    }))
    setPagination({ page: 1, page_size: 20 })
  }

  // 清空搜索
  const handleClearSearch = () => {
    setSearchParams({})
    setPagination({ page: 1, page_size: 20 })
  }

  // 打开创建/编辑弹窗
  const handleOpenModal = (record?: TrunkNumberInfo) => {
    if (record) {
      setEditingRecord(record)
      form.setFieldsValue({
        trunk_id: record.trunk_id,
        ent_id: record.ent_id,
        name: record.name,
        number: record.number,
        prefix: record.prefix,
        direction: record.direction,
        expiration_at: record.expiration_at ? dayjs(record.expiration_at) : undefined,
        // 设置价格配置，如果为空则使用默认值
        call_out_rate: record.cost?.call_out_rate ?? 0,
        call_out_cycle: record.cost?.call_out_cycle ?? 60,
        call_out_sale_rate: record.cost?.call_out_sale_rate ?? 0,
        call_out_sale_cycle: record.cost?.call_out_sale_cycle ?? 60,
        call_in_rate: record.cost?.call_in_rate ?? 0,
        call_in_cycle: record.cost?.call_in_cycle ?? 60,
        call_in_sale_rate: record.cost?.call_in_sale_rate ?? 0,
        call_in_sale_cycle: record.cost?.call_in_sale_cycle ?? 60,
      })
    } else {
      setEditingRecord(null)
      form.resetFields()
      form.setFieldsValue({
        direction: 'all', // 默认值
        // 设置价格配置默认值
        call_out_rate: 0,
        call_out_cycle: 60,
        call_out_sale_rate: 0,
        call_out_sale_cycle: 60,
        call_in_rate: 0,
        call_in_cycle: 60,
        call_in_sale_rate: 0,
        call_in_sale_cycle: 60,
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

      // 处理价格配置
      const cost: any = {}
      if (values.call_out_rate !== undefined && values.call_out_rate !== null && values.call_out_rate !== '') {
        cost.call_out_rate = Number(values.call_out_rate)
      }
      if (values.call_out_cycle !== undefined && values.call_out_cycle !== null && values.call_out_cycle !== '') {
        cost.call_out_cycle = Number(values.call_out_cycle)
      }
      if (values.call_out_sale_rate !== undefined && values.call_out_sale_rate !== null && values.call_out_sale_rate !== '') {
        cost.call_out_sale_rate = Number(values.call_out_sale_rate)
      }
      if (values.call_out_sale_cycle !== undefined && values.call_out_sale_cycle !== null && values.call_out_sale_cycle !== '') {
        cost.call_out_sale_cycle = Number(values.call_out_sale_cycle)
      }
      if (values.call_in_rate !== undefined && values.call_in_rate !== null && values.call_in_rate !== '') {
        cost.call_in_rate = Number(values.call_in_rate)
      }
      if (values.call_in_cycle !== undefined && values.call_in_cycle !== null && values.call_in_cycle !== '') {
        cost.call_in_cycle = Number(values.call_in_cycle)
      }
      if (values.call_in_sale_rate !== undefined && values.call_in_sale_rate !== null && values.call_in_sale_rate !== '') {
        cost.call_in_sale_rate = Number(values.call_in_sale_rate)
      }
      if (values.call_in_sale_cycle !== undefined && values.call_in_sale_cycle !== null && values.call_in_sale_cycle !== '') {
        cost.call_in_sale_cycle = Number(values.call_in_sale_cycle)
      }

      const costFiltered = Object.keys(cost).length > 0 ? cost : undefined

      // 处理过期时间
      let expiration_at: string | undefined = undefined
      if (values.expiration_at) {
        if (typeof values.expiration_at === 'string') {
          expiration_at = values.expiration_at
        } else {
          expiration_at = dayjs(values.expiration_at as any).format('YYYY-MM-DD HH:mm:ss')
        }
      }

      if (editingRecord) {
        // 更新
        const updateData: TrunkNumberUpdateParams = {
          id: editingRecord.id,
          trunk_id: values.trunk_id,
          ent_id: values.ent_id,
          name: values.name,
          number: values.number,
          prefix: values.prefix,
          direction: values.direction,
          cost: costFiltered,
          expiration_at,
        }
        await updateTrunkNumber(updateData)
        message.success('更新成功')
        handleCloseModal()
        loadData(true) // 强制刷新列表
        return
      } else {
        // 创建
        const createData: TrunkNumberCreateParams = {
          trunk_id: values.trunk_id,
          ent_id: values.ent_id,
          name: values.name,
          number: values.number,
          prefix: values.prefix,
          direction: values.direction,
          cost: costFiltered,
          expiration_at,
        }
        await createTrunkNumber(createData)
        message.success('创建成功')
      }
      handleCloseModal()
      loadData(true) // 强制刷新列表
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 删除号码
  const handleDelete = async (id: number) => {
    try {
      await deleteTrunkNumber({ id })
      message.success('删除成功')
      loadData(true) // 强制刷新列表
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const formatRate = (value?: number) => {
    if (value === undefined || value === null) return '-'
    const n = Number(value)
    if (Number.isNaN(n)) return '-'
    // 最多保留 4 位小数，同时去掉无意义的尾随 0
    return n.toFixed(4).replace(/\.?0+$/, '')
  }

  // 表格列定义
  const columns: ColumnsType<TrunkNumberInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '中继线路',
      dataIndex: 'trunk_id',
      key: 'trunk_id',
      width: 200,
      render: (trunkId: number) => {
        const trunk = allTrunks.find(t => t.id === trunkId)
        return trunk ? `${trunk.name} (${trunk.ip}:${trunk.port})` : trunkId || '-'
      },
    },
    {
      title: '企业',
      dataIndex: 'ent_id',
      key: 'ent_id',
      width: 200,
      render: (entId: number) => {
        const enterprise = allEnterprises.find(e => e.id === entId)
        return enterprise ? enterprise.name : entId || '-'
      },
    },
    {
      title: '号码名称',
      dataIndex: 'name',
      key: 'name',
      // 不设置宽度，自适应
    },
    {
      title: '中继号码',
      dataIndex: 'number',
      key: 'number',
      // 不设置宽度，自适应
    },
    {
      title: '号码前缀',
      dataIndex: 'prefix',
      key: 'prefix',
      width: 120,
      render: (prefix: string) => prefix || '-',
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      width: 120,
      render: (direction: 'in' | 'out' | 'all') => {
        const directionMap: Record<'in' | 'out' | 'all', { text: string; color: string }> = {
          in: { text: '呼入', color: 'blue' },
          out: { text: '呼出', color: 'green' },
          all: { text: '呼入呼出', color: 'purple' },
        }
        const config = directionMap[direction] || { text: direction, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '费用',
      key: 'cost',
      width: 260,
      render: (_, record) => {
        const cost = record.cost
        if (!cost) return '-'
        return (
          <Space direction="vertical" size={0}>
            <div>呼出：{formatRate(cost.call_out_rate)} 元 / {cost.call_out_cycle ?? '-'} 秒</div>
            <div>呼出售价：{formatRate(cost.call_out_sale_rate)} 元 / {cost.call_out_sale_cycle ?? '-'} 秒</div>
            <div>呼入：{formatRate(cost.call_in_rate)} 元 / {cost.call_in_cycle ?? '-'} 秒</div>
            <div>呼入售价：{formatRate(cost.call_in_sale_rate)} 元 / {cost.call_in_sale_cycle ?? '-'} 秒</div>
          </Space>
        )
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expiration_at',
      key: 'expiration_at',
      width: 180,
      render: (time: string) => time ? formatDateTime(time) : '-',
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
            title="确定要删除这个号码吗？"
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
            placeholder="搜索号码"
            allowClear
            style={{ width: 200 }}
            value={searchParams.number || ''}
            onChange={(e) => handleSearchChange('number', e.target.value)}
            onPressEnter={() => loadData(true)}
          />
          <Select
            placeholder="选择方向"
            allowClear
            style={{ width: 150 }}
            value={searchParams.direction}
            onChange={(value) => handleSearchChange('direction', value || '')}
          >
            <Select.Option value="in">呼入</Select.Option>
            <Select.Option value="out">呼出</Select.Option>
            <Select.Option value="all">呼入呼出</Select.Option>
          </Select>
          <Select
            placeholder="选择企业"
            allowClear
            style={{ width: 200 }}
            value={searchParams.ent_id}
            onChange={(value) => handleSearchChange('ent_id', value)}
            showSearch
            filterOption={(input, option) => {
              const text = typeof option?.children === 'string' ? option.children : String(option?.children || '')
              return text.toLowerCase().includes(input.toLowerCase())
            }}
          >
            {allEnterprises.map((ent) => (
              <Select.Option key={ent.id} value={ent.id}>
                {ent.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="选择中继线路"
            allowClear
            style={{ width: 200 }}
            value={searchParams.trunk_id}
            onChange={(value) => handleSearchChange('trunk_id', value)}
            showSearch
            filterOption={(input, option) => {
              const text = typeof option?.children === 'string' ? option.children : String(option?.children || '')
              return text.toLowerCase().includes(input.toLowerCase())
            }}
          >
            {allTrunks.map((trunk) => (
              <Select.Option key={trunk.id} value={trunk.id}>
                {trunk.name} ({trunk.ip}:{trunk.port})
              </Select.Option>
            ))}
          </Select>
          <Button onClick={handleClearSearch}>清空</Button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            创建号码
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
        title={editingRecord ? '编辑号码' : '创建号码'}
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
            name="trunk_id"
            label="中继线路"
            rules={[{ required: true, message: '请选择中继线路' }]}
          >
            <Select placeholder="请选择中继线路" style={{ width: '100%' }} showSearch>
              {allTrunks.map((trunk) => (
                <Select.Option key={trunk.id} value={trunk.id}>
                  {trunk.name} ({trunk.ip}:{trunk.port})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="ent_id"
            label="企业"
            rules={[{ required: true, message: '请选择企业' }]}
          >
            <Select placeholder="请选择企业" style={{ width: '100%' }} showSearch>
              {allEnterprises.map((ent) => (
                <Select.Option key={ent.id} value={ent.id}>
                  {ent.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="号码名称"
            rules={[{ required: true, message: '请输入号码名称' }]}
          >
            <Input placeholder="请输入号码名称" />
          </Form.Item>

          <Form.Item
            name="number"
            label="中继号码"
            rules={[{ required: true, message: '请输入中继号码' }]}
          >
            <Input placeholder="请输入中继号码" />
          </Form.Item>

          <Form.Item
            name="prefix"
            label="号码前缀"
          >
            <Input placeholder="请输入号码前缀（可选）" />
          </Form.Item>

          <Form.Item
            name="direction"
            label="呼叫方向"
            rules={[{ required: true, message: '请选择呼叫方向' }]}
          >
            <Select placeholder="请选择呼叫方向" style={{ width: '100%' }}>
              <Select.Option value="in">呼入</Select.Option>
              <Select.Option value="out">呼出</Select.Option>
              <Select.Option value="all">呼入呼出</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="expiration_at"
            label="过期时间"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder="请选择过期时间（可选）"
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
            />
          </Form.Item>

          <Divider>价格配置（可选）</Divider>

          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '80px', flexShrink: 0 }}>呼出：</span>
              <Input.Group compact style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Form.Item name="call_out_rate" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="0"
                    style={{ width: 100 }}
                    min={0}
                    precision={4}
                  />
                </Form.Item>
                <span style={{ margin: '0 4px', flexShrink: 0 }}>元 /</span>
                <Form.Item name="call_out_cycle" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="60"
                    style={{ width: 80 }}
                    min={1}
                  />
                </Form.Item>
                <span style={{ marginLeft: '4px', flexShrink: 0 }}>秒</span>
              </Input.Group>
            </div>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '80px', flexShrink: 0 }}>呼出售价：</span>
              <Input.Group compact style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Form.Item name="call_out_sale_rate" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="0"
                    style={{ width: 100 }}
                    min={0}
                    precision={4}
                  />
                </Form.Item>
                <span style={{ margin: '0 4px', flexShrink: 0 }}>元 /</span>
                <Form.Item name="call_out_sale_cycle" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="60"
                    style={{ width: 80 }}
                    min={1}
                  />
                </Form.Item>
                <span style={{ marginLeft: '4px', flexShrink: 0 }}>秒</span>
              </Input.Group>
            </div>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '80px', flexShrink: 0 }}>呼入：</span>
              <Input.Group compact style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Form.Item name="call_in_rate" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="0"
                    style={{ width: 100 }}
                    min={0}
                    precision={4}
                  />
                </Form.Item>
                <span style={{ margin: '0 4px', flexShrink: 0 }}>元 /</span>
                <Form.Item name="call_in_cycle" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="60"
                    style={{ width: 80 }}
                    min={1}
                  />
                </Form.Item>
                <span style={{ marginLeft: '4px', flexShrink: 0 }}>秒</span>
              </Input.Group>
            </div>
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '80px', flexShrink: 0 }}>呼入售价：</span>
              <Input.Group compact style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Form.Item name="call_in_sale_rate" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="0"
                    style={{ width: 100 }}
                    min={0}
                    precision={4}
                  />
                </Form.Item>
                <span style={{ margin: '0 4px', flexShrink: 0 }}>元 /</span>
                <Form.Item name="call_in_sale_cycle" noStyle style={{ marginBottom: 0, flexShrink: 0 }}>
                  <InputNumber
                    placeholder="60"
                    style={{ width: 80 }}
                    min={1}
                  />
                </Form.Item>
                <span style={{ marginLeft: '4px', flexShrink: 0 }}>秒</span>
              </Input.Group>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TrunkNumber

