import { useState, useEffect, useCallback } from 'react'
import {
  Drawer,
  Descriptions,
  Tag,
  Table,
  Card,
  Statistic,
  Row,
  Col,
  Progress,
  Button,
  Space,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Tabs,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@common/utils/date'
import {
  getCallTaskDetail,
  getCallTaskDetailList,
  getCallTaskStats,
  batchAddCallTaskDetail,
  type CallTaskInfo,
  type CallTaskDetailInfo,
  type CallTaskStats,
  type CallTaskPhoneItem,
  CALL_TASK_STATUS_CONFIG,
  CALL_TASK_DETAIL_STATUS,
  CALL_TASK_DETAIL_STATUS_CONFIG,
  RETRY_STRATEGY_CONFIG,
} from '../../api/callTask'

const { TextArea } = Input
const { Search } = Input

interface DetailDrawerProps {
  visible: boolean
  taskId: number | null
  onClose: () => void
}

// 星期显示
const WEEKDAY_NAMES: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

function DetailDrawer({ visible, taskId, onClose }: DetailDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [taskInfo, setTaskInfo] = useState<CallTaskInfo | null>(null)
  const [taskStats, setTaskStats] = useState<CallTaskStats | null>(null)

  // 号码明细列表状态
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailList, setDetailList] = useState<CallTaskDetailInfo[]>([])
  const [detailTotal, setDetailTotal] = useState(0)
  const [detailPage, setDetailPage] = useState(1)
  const [detailPageSize, setDetailPageSize] = useState(10)
  const [detailSearchPhone, setDetailSearchPhone] = useState('')
  const [detailFilterStatus, setDetailFilterStatus] = useState<string>('')

  // 批量添加号码弹窗状态
  const [addPhoneModalVisible, setAddPhoneModalVisible] = useState(false)
  const [addPhoneText, setAddPhoneText] = useState('')
  const [addPhoneSubmitting, setAddPhoneSubmitting] = useState(false)

  // 获取任务详情和统计
  const fetchTaskData = useCallback(async () => {
    if (!taskId) return

    setLoading(true)
    try {
      // 先获取任务详情
      const info = await getCallTaskDetail(taskId)
      setTaskInfo(info)

      // 尝试获取统计信息，失败不影响详情显示
      try {
        const stats = await getCallTaskStats(taskId)
        setTaskStats(stats)
      } catch (statsError) {
        console.warn('获取任务统计失败，使用详情中的统计数据:', statsError)
        // 统计失败时不设置 taskStats，页面会使用 taskInfo 中的数据
      }
    } catch (error) {
      // request 拦截器已处理错误提示
      console.error('获取任务信息失败:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  // 获取号码明细列表
  const fetchDetailList = useCallback(async () => {
    if (!taskId) return

    setDetailLoading(true)
    try {
      const response = await getCallTaskDetailList({
        task_id: taskId,
        page: detailPage,
        page_size: detailPageSize,
        phone_number: detailSearchPhone || undefined,
        status: detailFilterStatus || undefined,
      })
      setDetailList(response.data || [])
      setDetailTotal(response.total || 0)
    } catch (error) {
      // request 拦截器已处理错误提示
      console.error('获取号码明细失败:', error)
    } finally {
      setDetailLoading(false)
    }
  }, [taskId, detailPage, detailPageSize, detailSearchPhone, detailFilterStatus])

  useEffect(() => {
    if (visible && taskId) {
      fetchTaskData()
      fetchDetailList()
    }
  }, [visible, taskId, fetchTaskData, fetchDetailList])

  // 关闭时重置状态
  useEffect(() => {
    if (!visible) {
      setTaskInfo(null)
      setTaskStats(null)
      setDetailList([])
      setDetailTotal(0)
      setDetailPage(1)
      setDetailSearchPhone('')
      setDetailFilterStatus('')
    }
  }, [visible])

  const handleDetailSearch = (value: string) => {
    setDetailSearchPhone(value)
    setDetailPage(1)
  }

  const handleDetailStatusChange = (value: string) => {
    setDetailFilterStatus(value)
    setDetailPage(1)
  }

  const handleAddPhoneSubmit = async () => {
    if (!taskId || !addPhoneText.trim()) {
      message.warning('请输入号码')
      return
    }

    const lines = addPhoneText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)

    if (lines.length === 0) {
      message.warning('请输入号码')
      return
    }

    const phoneList: CallTaskPhoneItem[] = lines.map((phone) => ({ phone_number: phone }))

    setAddPhoneSubmitting(true)
    try {
      const result = await batchAddCallTaskDetail(taskId, phoneList)
      message.success(`成功添加 ${result.imported_count} 个号码`)
      setAddPhoneModalVisible(false)
      setAddPhoneText('')
      fetchTaskData()
      fetchDetailList()
    } catch (error) {
      // request 拦截器已处理错误提示，这里不需要重复显示
      console.error('添加号码失败:', error)
    } finally {
      setAddPhoneSubmitting(false)
    }
  }

  // 号码明细表格列定义
  const detailColumns: ColumnsType<CallTaskDetailInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '被叫号码',
      dataIndex: 'phone_number',
      key: 'phone_number',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = CALL_TASK_DETAIL_STATUS_CONFIG[status] || { text: status, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '重试次数',
      dataIndex: 'retry_times',
      key: 'retry_times',
      width: 80,
    },
    {
      title: '呼叫时间',
      dataIndex: 'call_start_time',
      key: 'call_start_time',
      width: 180,
      render: (time: string) => (time ? formatDateTime(time) : '-'),
    },
    {
      title: '通话时长',
      dataIndex: 'call_duration',
      key: 'call_duration',
      width: 100,
      render: (duration: number) => (duration > 0 ? `${duration}秒` : '-'),
    },
    {
      title: '挂机原因',
      dataIndex: 'hangup_cause',
      key: 'hangup_cause',
      width: 120,
      render: (cause: string) => cause || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (remark: string) => remark || '-',
    },
  ]

  // 渲染基本信息标签页
  const renderBasicInfo = () => {
    if (!taskInfo) return null

    // 统计数据优先使用 taskStats，否则使用 taskInfo 中的数据
    const stats = taskStats || {
      total_count: taskInfo.total_count,
      pending_count: taskInfo.total_count - taskInfo.called_count,
      called_count: taskInfo.called_count,
      success_count: taskInfo.success_count,
      failed_count: taskInfo.failed_count,
      no_answer_count: taskInfo.no_answer_count,
      busy_count: taskInfo.busy_count,
      rejected_count: taskInfo.rejected_count,
      success_rate: taskInfo.success_rate,
      completion_rate: taskInfo.completion_rate,
    }

    return (
      <div>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic title="总号码数" value={stats.total_count} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="待呼叫" value={stats.pending_count} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="已呼叫" value={stats.called_count} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="已接听"
                value={stats.success_count}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="接通率"
                value={stats.success_rate.toFixed(1)}
                suffix="%"
                valueStyle={{ color: stats.success_rate > 50 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="完成率"
                value={stats.completion_rate.toFixed(1)}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        {/* 进度条 */}
        <Card title="执行进度" style={{ marginBottom: 24 }}>
          <Progress
            percent={Math.round(stats.completion_rate)}
            status={taskInfo.status === 'running' ? 'active' : undefined}
          />
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="无人接听"
                value={stats.no_answer_count}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="用户忙"
                value={stats.busy_count}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已拒绝"
                value={stats.rejected_count}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="呼叫失败"
                value={stats.failed_count}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 任务配置信息 */}
        <Card title="任务配置">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="任务名称">{taskInfo.name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => {
                const config = CALL_TASK_STATUS_CONFIG[taskInfo.status] || { text: taskInfo.status, color: 'default' }
                return <Tag color={config.color}>{config.text}</Tag>
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="任务描述" span={2}>
              {taskInfo.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="外显号码">
              {taskInfo.trunk_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最大并发数">
              {taskInfo.max_concurrent}
            </Descriptions.Item>
            <Descriptions.Item label="呼叫超时">
              {taskInfo.call_timeout}秒
            </Descriptions.Item>
            <Descriptions.Item label="重试策略">
              {RETRY_STRATEGY_CONFIG[taskInfo.retry_strategy] || taskInfo.retry_strategy}
            </Descriptions.Item>
            <Descriptions.Item label="最大重试次数">
              {taskInfo.max_retry_times}次
            </Descriptions.Item>
            <Descriptions.Item label="重试间隔">
              {taskInfo.retry_interval}秒
            </Descriptions.Item>
            <Descriptions.Item label="计划开始时间">
              {taskInfo.scheduled_start_time ? formatDateTime(taskInfo.scheduled_start_time) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="计划结束时间">
              {taskInfo.scheduled_end_time ? formatDateTime(taskInfo.scheduled_end_time) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际开始时间">
              {taskInfo.actual_start_time ? formatDateTime(taskInfo.actual_start_time) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际结束时间">
              {taskInfo.actual_end_time ? formatDateTime(taskInfo.actual_end_time) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="允许呼叫的星期" span={2}>
              {taskInfo.allowed_weekdays?.length > 0
                ? taskInfo.allowed_weekdays.map((d) => WEEKDAY_NAMES[d]).join('、')
                : '不限制'}
            </Descriptions.Item>
            <Descriptions.Item label="允许呼叫的时间段" span={2}>
              {taskInfo.allowed_time_ranges?.length > 0
                ? taskInfo.allowed_time_ranges.map((r) => `${r.start}-${r.end}`).join('、')
                : '不限制'}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">
              {taskInfo.created_by_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(taskInfo.created_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    )
  }

  // 渲染号码明细标签页
  const renderDetailList = () => {
    return (
      <div>
        {/* 筛选和操作栏 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Search
              placeholder="搜索号码"
              allowClear
              onSearch={handleDetailSearch}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleDetailStatusChange}
              options={Object.entries(CALL_TASK_DETAIL_STATUS_CONFIG).map(([value, config]) => ({
                value,
                label: config.text,
              }))}
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchDetailList}>
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddPhoneModalVisible(true)}
              >
                批量添加号码
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 号码明细表格 */}
        <Table
          columns={detailColumns}
          dataSource={detailList}
          rowKey="id"
          loading={detailLoading}
          scroll={{ x: 1000 }}
          pagination={{
            current: detailPage,
            pageSize: detailPageSize,
            total: detailTotal,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setDetailPage(page)
              setDetailPageSize(pageSize)
            },
          }}
        />
      </div>
    )
  }

  return (
    <>
      <Drawer
        title="任务详情"
        placement="right"
        width={1000}
        onClose={onClose}
        open={visible}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchTaskData}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: renderBasicInfo(),
              },
              {
                key: 'details',
                label: '号码明细',
                children: renderDetailList(),
              },
            ]}
          />
        </Spin>
      </Drawer>

      {/* 批量添加号码弹窗 */}
      <Modal
        title="批量添加号码"
        open={addPhoneModalVisible}
        onCancel={() => {
          setAddPhoneModalVisible(false)
          setAddPhoneText('')
        }}
        onOk={handleAddPhoneSubmit}
        confirmLoading={addPhoneSubmitting}
        okText="添加"
        cancelText="取消"
      >
        <TextArea
          rows={10}
          placeholder="请输入号码，每行一个，例如：&#10;13800138000&#10;13900139000"
          value={addPhoneText}
          onChange={(e) => setAddPhoneText(e.target.value)}
        />
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          提示：每行输入一个号码，系统会自动过滤空行
        </div>
      </Modal>
    </>
  )
}

export default DetailDrawer
