import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Table,
  Button,
  Tag,
  Spin,
  message,
  Space,
  Modal,
  Form,
  Select,
  Popconfirm,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getEnterpriseDetail,
  getEnterpriseAgents,
  bindAgent,
  unbindAgent,
  type EnterpriseInfo,
  type AgentInfo,
} from '../api/enterprise'
import { getAgentList } from '../api/agent'
import { getTrunkNumberList, type TrunkNumberInfo } from '../api/trunkNumber'
import { getAllTrunks, type TrunkInfo } from '../api/trunk'
import { formatDateTime } from '@common/utils/date'
import { ROUTE_PATHS } from '../routes'

function EnterpriseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [enterpriseInfo, setEnterpriseInfo] = useState<EnterpriseInfo | null>(null)
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [bindModalVisible, setBindModalVisible] = useState(false)
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([])
  const [allAgentsLoading, setAllAgentsLoading] = useState(false)
  const [trunkNumbers, setTrunkNumbers] = useState<TrunkNumberInfo[]>([])
  const [trunkNumbersLoading, setTrunkNumbersLoading] = useState(false)
  const [trunkNumbersTotal, setTrunkNumbersTotal] = useState(0)
  const [trunkNumbersPagination, setTrunkNumbersPagination] = useState({ page: 1, page_size: 20 })
  const [allTrunks, setAllTrunks] = useState<TrunkInfo[]>([])

  // 用于防止重复请求
  const loadingRef = useRef(false)
  const agentsLoadingRef = useRef(false)
  const allAgentsLoadingRef = useRef(false)
  const trunkNumbersLoadingRef = useRef(false)
  const trunksLoadingRef = useRef(false)

  // 加载企业详情
  const loadEnterpriseDetail = useCallback(async () => {
    if (!id) {
      message.error('企业ID不存在')
      navigate(ROUTE_PATHS.ENTERPRISE)
      return
    }

    // 防止重复请求
    if (loadingRef.current) {
      return
    }

    try {
      loadingRef.current = true
      setLoading(true)
      const data = await getEnterpriseDetail({ id: Number(id) })
      setEnterpriseInfo(data)
    } catch (error) {
      console.error('加载企业详情失败:', error)
      message.error('加载企业详情失败')
      navigate(ROUTE_PATHS.ENTERPRISE)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [id, navigate])

  // 加载企业下的所有Agent
  const loadEnterpriseAgents = useCallback(async (force = false) => {
    if (!id) {
      return
    }

    // 防止重复请求
    if (agentsLoadingRef.current && !force) {
      return
    }

    try {
      agentsLoadingRef.current = true
      setAgentsLoading(true)
      const data = await getEnterpriseAgents({ ent_id: Number(id) })
      setAgents(data)
    } catch (error) {
      console.error('加载Agent列表失败:', error)
      message.error('加载Agent列表失败')
    } finally {
      setAgentsLoading(false)
      agentsLoadingRef.current = false
    }
  }, [id])

  // 加载所有可用的Agent（用于绑定选择）
  const loadAllAgents = useCallback(async () => {
    if (allAgentsLoadingRef.current) {
      return
    }

    try {
      allAgentsLoadingRef.current = true
      setAllAgentsLoading(true)
      // 获取所有Agent，不限制企业
      const response = await getAgentList({ page: 1, page_size: 1000 })
      setAllAgents(response.data)
    } catch (error) {
      console.error('加载Agent列表失败:', error)
      message.error('加载Agent列表失败')
    } finally {
      setAllAgentsLoading(false)
      allAgentsLoadingRef.current = false
    }
  }, [])

  // 加载企业下的所有中继号码
  const loadEnterpriseTrunkNumbers = useCallback(async (force = false) => {
    if (!id) {
      return
    }

    // 防止重复请求
    if (trunkNumbersLoadingRef.current && !force) {
      return
    }

    try {
      trunkNumbersLoadingRef.current = true
      setTrunkNumbersLoading(true)
      const response = await getTrunkNumberList({
        ent_id: Number(id),
        page: trunkNumbersPagination.page,
        page_size: trunkNumbersPagination.page_size,
      })
      setTrunkNumbers(response.data)
      setTrunkNumbersTotal(response.total)
    } catch (error) {
      console.error('加载中继号码列表失败:', error)
      message.error('加载中继号码列表失败')
    } finally {
      setTrunkNumbersLoading(false)
      trunkNumbersLoadingRef.current = false
    }
  }, [id, trunkNumbersPagination.page, trunkNumbersPagination.page_size])

  // 加载所有中继线路列表（用于显示名称）
  const loadAllTrunks = useCallback(async () => {
    if (trunksLoadingRef.current) {
      return
    }
    try {
      trunksLoadingRef.current = true
      const trunks = await getAllTrunks()
      setAllTrunks(trunks)
    } catch (error) {
      console.error('加载中继线路列表失败:', error)
      setAllTrunks([])
    } finally {
      trunksLoadingRef.current = false
    }
  }, [])

  // 打开绑定Modal
  const handleOpenBindModal = () => {
    loadAllAgents()
    setBindModalVisible(true)
    form.resetFields()
  }

  // 关闭绑定Modal
  const handleCloseBindModal = () => {
    setBindModalVisible(false)
    form.resetFields()
  }

  // 绑定Agent
  const handleBindAgent = async () => {
    try {
      const values = await form.validateFields()
      if (!id) {
        message.error('企业ID不存在')
        return
      }
      await bindAgent({ ent_id: Number(id), agent_id: values.agent_id })
      message.success('绑定成功')
      handleCloseBindModal()
      // 刷新Agent列表
      loadEnterpriseAgents(true)
    } catch (error) {
      console.error('绑定失败:', error)
    }
  }

  // 解绑Agent
  const handleUnbindAgent = async (agentId: number) => {
    try {
      if (!id) {
        message.error('企业ID不存在')
        return
      }
      await unbindAgent({ ent_id: Number(id), agent_id: agentId })
      message.success('解绑成功')
      // 刷新Agent列表
      loadEnterpriseAgents(true)
    } catch (error) {
      console.error('解绑失败:', error)
    }
  }

  useEffect(() => {
    if (id) {
      loadEnterpriseDetail()
      loadEnterpriseAgents()
      loadAllTrunks()
    }
  }, [id, loadEnterpriseDetail, loadEnterpriseAgents, loadAllTrunks])

  useEffect(() => {
    if (id) {
      loadEnterpriseTrunkNumbers()
    }
  }, [id, trunkNumbersPagination.page, trunkNumbersPagination.page_size, loadEnterpriseTrunkNumbers])

  const formatRate = (value?: number) => {
    if (value === undefined || value === null) return '-'
    const n = Number(value)
    if (Number.isNaN(n)) return '-'
    return n.toFixed(4).replace(/\.?0+$/, '')
  }

  // 中继号码表格列定义
  const trunkNumberColumns: ColumnsType<TrunkNumberInfo> = [
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
      width: 150,
      render: (trunkId: number) => {
        const trunk = allTrunks.find(t => t.id === trunkId)
        return trunk ? `${trunk.name} (${trunk.ip}:${trunk.port})` : trunkId || '-'
      },
    },
    {
      title: '号码名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '中继号码',
      dataIndex: 'number',
      key: 'number',
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
      render: (direction: 'inbound' | 'outbound' | 'all') => {
        const directionMap: Record<'inbound' | 'outbound' | 'all', { text: string; color: string }> = {
          inbound: { text: '呼入', color: 'blue' },
          outbound: { text: '呼出', color: 'green' },
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
  ]

  // Agent表格列定义
  const agentColumns: ColumnsType<AgentInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确定要解绑这个Agent吗？"
          onConfirm={() => handleUnbindAgent(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
          >
            解绑
          </Button>
        </Popconfirm>
      ),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!enterpriseInfo) {
    return null
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(ROUTE_PATHS.ENTERPRISE)}
        >
          返回列表
        </Button>
      </div>

      <Card title="企业详情" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="企业ID">{enterpriseInfo.id}</Descriptions.Item>
          <Descriptions.Item label="企业名称">{enterpriseInfo.name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {enterpriseInfo.status === 1 ? (
              <Tag color="success">正常</Tag>
            ) : enterpriseInfo.status === 2 ? (
              <Tag color="default">禁用</Tag>
            ) : (
              <Tag color="default">未知</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="所有者">
            {enterpriseInfo.owner_agent?.display_name || enterpriseInfo.owner_agent_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDateTime(enterpriseInfo.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {formatDateTime(enterpriseInfo.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="企业下的Agent列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenBindModal}
          >
            绑定Agent
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={agentColumns}
          dataSource={agents}
          loading={agentsLoading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Card title="企业下的中继号码列表">
        <Table
          columns={trunkNumberColumns}
          dataSource={trunkNumbers}
          loading={trunkNumbersLoading}
          rowKey="id"
          pagination={{
            current: trunkNumbersPagination.page,
            pageSize: trunkNumbersPagination.page_size,
            total: trunkNumbersTotal,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setTrunkNumbersPagination({ page, page_size: pageSize || 20 })
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="绑定Agent"
        open={bindModalVisible}
        onOk={handleBindAgent}
        onCancel={handleCloseBindModal}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="agent_id"
            label="选择Agent"
            rules={[{ required: true, message: '请选择Agent' }]}
          >
            <Select
              placeholder="请选择要绑定的Agent"
              style={{ width: '100%' }}
              showSearch
              loading={allAgentsLoading}
              filterOption={(input, option) => {
                const text = typeof option?.children === 'string' ? option.children : String(option?.children || '')
                return text.toLowerCase().includes(input.toLowerCase())
              }}
              notFoundContent={allAgentsLoading ? '加载中...' : '暂无数据'}
            >
              {allAgents
                .filter(agent => !agents.some(a => a.id === agent.id)) // 过滤掉已经绑定的Agent
                .map((agent) => (
                  <Select.Option key={agent.id} value={agent.id}>
                    {agent.display_name} ({agent.username})
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default EnterpriseDetail

