import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tag,
  Progress,
  message,
  Popconfirm,
  Input,
  Select,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@common/utils/date'
import {
  getCallTaskList,
  deleteCallTask,
  controlCallTask,
  type CallTaskSummary,
  CALL_TASK_STATUS,
  CALL_TASK_STATUS_CONFIG,
} from '../../api/callTask'
import CreateEditModal from './CreateEditModal'
import DetailDrawer from './DetailDrawer'

const { Title } = Typography
const { Search } = Input

function CallTask() {
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<CallTaskSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchName, setSearchName] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const hasFetched = useRef(false)

  // 弹窗状态
  const [createEditModalVisible, setCreateEditModalVisible] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)

  // 详情抽屉状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
  const [viewingTaskId, setViewingTaskId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getCallTaskList({
        page,
        page_size: pageSize,
        name: searchName || undefined,
        status: filterStatus || undefined,
      })
      setDataSource(response.data || [])
      setTotal(response.total || 0)
    } catch (error) {
      // request 拦截器已处理错误提示
      console.error('获取外呼任务列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchName, filterStatus])

  useEffect(() => {
    if (hasFetched.current) {
      fetchData()
      return
    }
    hasFetched.current = true
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    fetchData()
  }

  const handleSearch = (value: string) => {
    setSearchName(value)
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setFilterStatus(value)
    setPage(1)
  }

  const handleCreate = () => {
    setEditingTaskId(null)
    setCreateEditModalVisible(true)
  }

  const handleEdit = (record: CallTaskSummary) => {
    setEditingTaskId(record.id)
    setCreateEditModalVisible(true)
  }

  const handleViewDetail = (record: CallTaskSummary) => {
    setViewingTaskId(record.id)
    setDetailDrawerVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCallTask(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      // request 拦截器已处理错误提示
      console.error('删除任务失败:', error)
    }
  }

  const handleControl = async (id: number, action: 'start' | 'pause' | 'stop' | 'cancel') => {
    const actionText: Record<string, string> = {
      start: '启动',
      pause: '暂停',
      stop: '停止',
      cancel: '取消',
    }
    try {
      await controlCallTask(id, action)
      message.success(`${actionText[action]}成功`)
      fetchData()
    } catch (error) {
      // request 拦截器已处理错误提示
      console.error(`${actionText[action]}任务失败:`, error)
    }
  }

  const handleModalClose = () => {
    setCreateEditModalVisible(false)
    setEditingTaskId(null)
  }

  const handleModalSuccess = () => {
    setCreateEditModalVisible(false)
    setEditingTaskId(null)
    fetchData()
  }

  const handleDetailDrawerClose = () => {
    setDetailDrawerVisible(false)
    setViewingTaskId(null)
  }

  // 渲染操作按钮
  const renderActions = (record: CallTaskSummary) => {
    const { status, id } = record
    const buttons: React.ReactNode[] = []

    // 查看详情按钮始终显示
    buttons.push(
      <Button
        key="view"
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(record)}
      >
        详情
      </Button>
    )

    // 根据状态显示不同的控制按钮
    if (status === CALL_TASK_STATUS.PENDING) {
      buttons.push(
        <Button
          key="start"
          type="link"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleControl(id, 'start')}
        >
          启动
        </Button>
      )
      buttons.push(
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      )
    }

    if (status === CALL_TASK_STATUS.RUNNING) {
      buttons.push(
        <Button
          key="pause"
          type="link"
          size="small"
          icon={<PauseCircleOutlined />}
          onClick={() => handleControl(id, 'pause')}
        >
          暂停
        </Button>
      )
      buttons.push(
        <Popconfirm
          key="stop"
          title="确定要停止该任务吗？"
          description="停止后任务将无法继续执行"
          onConfirm={() => handleControl(id, 'stop')}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" icon={<StopOutlined />} danger>
            停止
          </Button>
        </Popconfirm>
      )
    }

    if (status === CALL_TASK_STATUS.PAUSED) {
      buttons.push(
        <Button
          key="start"
          type="link"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleControl(id, 'start')}
        >
          继续
        </Button>
      )
      buttons.push(
        <Popconfirm
          key="stop"
          title="确定要停止该任务吗？"
          description="停止后任务将无法继续执行"
          onConfirm={() => handleControl(id, 'stop')}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" icon={<StopOutlined />} danger>
            停止
          </Button>
        </Popconfirm>
      )
    }

    // 待执行、已完成、已取消、失败状态下可以删除
    if ([CALL_TASK_STATUS.PENDING, CALL_TASK_STATUS.COMPLETED, CALL_TASK_STATUS.CANCELLED, CALL_TASK_STATUS.FAILED].includes(status as any)) {
      buttons.push(
        <Popconfirm
          key="delete"
          title="确定要删除该任务吗？"
          description="删除后无法恢复"
          onConfirm={() => handleDelete(id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" icon={<DeleteOutlined />} danger>
            删除
          </Button>
        </Popconfirm>
      )
    }

    return <Space size={0}>{buttons}</Space>
  }

  // 表格列定义
  const columns: ColumnsType<CallTaskSummary> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = CALL_TASK_STATUS_CONFIG[status] || { text: status, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '进度',
      key: 'progress',
      width: 200,
      render: (_: any, record: CallTaskSummary) => {
        const percent = record.total_count > 0
          ? Math.round((record.called_count / record.total_count) * 100)
          : 0
        return (
          <div>
            <Progress percent={percent} size="small" />
            <span style={{ fontSize: 12, color: '#999' }}>
              {record.called_count} / {record.total_count}
            </span>
          </div>
        )
      },
    },
    {
      title: '接通率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      width: 100,
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
    },
    {
      title: '成功数',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
    },
    {
      title: '计划开始时间',
      dataIndex: 'scheduled_start_time',
      key: 'scheduled_start_time',
      width: 180,
      render: (time: string) => (time ? formatDateTime(time) : '-'),
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
      width: 280,
      fixed: 'right',
      render: (_: any, record: CallTaskSummary) => renderActions(record),
    },
  ]

  return (
    <>
      <Title level={2}>外呼任务</Title>
      <Card
        style={{ marginTop: 24 }}
        title={
          <span>
            <PhoneOutlined style={{ marginRight: 8 }} />
            外呼任务列表
          </span>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建任务
            </Button>
          </Space>
        }
      >
        {/* 筛选区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索任务名称"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleStatusChange}
              options={[
                { value: CALL_TASK_STATUS.PENDING, label: '待执行' },
                { value: CALL_TASK_STATUS.RUNNING, label: '执行中' },
                { value: CALL_TASK_STATUS.PAUSED, label: '已暂停' },
                { value: CALL_TASK_STATUS.COMPLETED, label: '已完成' },
                { value: CALL_TASK_STATUS.CANCELLED, label: '已取消' },
                { value: CALL_TASK_STATUS.FAILED, label: '失败' },
              ]}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page)
              setPageSize(pageSize)
            },
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <CreateEditModal
        visible={createEditModalVisible}
        taskId={editingTaskId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailDrawerVisible}
        taskId={viewingTaskId}
        onClose={handleDetailDrawerClose}
      />
    </>
  )
}

export default CallTask
