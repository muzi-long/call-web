import { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  TimePicker,
  Checkbox,
  Button,
  Space,
  Divider,
  message,
  Spin,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import {
  createCallTask,
  updateCallTask,
  getCallTaskDetail,
  type CreateCallTaskParams,
  type UpdateCallTaskParams,
  type CallTaskTimeRange,
  type CallTaskPhoneItem,
  RETRY_STRATEGY,
  RETRY_STRATEGY_CONFIG,
} from '../../api/callTask'
import { getCurrentEnterpriseTrunkNumbers, type TrunkNumberInfo } from '../../api/trunkNumber'

const { TextArea } = Input
const { RangePicker } = DatePicker

interface CreateEditModalProps {
  visible: boolean
  taskId: number | null // null 表示新建，有值表示编辑
  onClose: () => void
  onSuccess: () => void
}

// 星期选项
const WEEKDAY_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]

function CreateEditModal({ visible, taskId, onClose, onSuccess }: CreateEditModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [trunkNumbers, setTrunkNumbers] = useState<TrunkNumberInfo[]>([])

  const isEditing = taskId !== null

  // 获取中继号码列表
  useEffect(() => {
    if (visible) {
      getCurrentEnterpriseTrunkNumbers()
        .then((data) => {
          // 只获取可外呼的号码
          const outboundNumbers = data.filter((item) => item.direction === 'out' || item.direction === 'all')
          setTrunkNumbers(outboundNumbers)
        })
        .catch((error) => {
          console.error('获取中继号码失败:', error)
        })
    }
  }, [visible])

  // 编辑时获取任务详情
  useEffect(() => {
    if (visible && isEditing && taskId) {
      setLoading(true)
      getCallTaskDetail(taskId)
        .then((data) => {
          // 转换时间格式
          const scheduledTimeRange = data.scheduled_start_time && data.scheduled_end_time
            ? [dayjs(data.scheduled_start_time), dayjs(data.scheduled_end_time)]
            : undefined

          // 转换时间段格式
          const timeRanges = data.allowed_time_ranges?.map((range) => ({
            start: dayjs(range.start, 'HH:mm'),
            end: dayjs(range.end, 'HH:mm'),
          }))

          form.setFieldsValue({
            name: data.name,
            description: data.description,
            trunk_number_id: data.trunk_number_id || undefined,
            max_concurrent: data.max_concurrent,
            call_timeout: data.call_timeout,
            retry_strategy: data.retry_strategy,
            max_retry_times: data.max_retry_times,
            retry_interval: data.retry_interval,
            scheduled_time_range: scheduledTimeRange,
            allowed_weekdays: data.allowed_weekdays,
            allowed_time_ranges: timeRanges,
          })
        })
        .catch((error) => {
          // request 拦截器已处理错误提示
          console.error('获取任务详情失败:', error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (visible && !isEditing) {
      // 新建时设置默认值
      form.setFieldsValue({
        max_concurrent: 1,
        call_timeout: 30,
        retry_strategy: RETRY_STRATEGY.NONE,
        max_retry_times: 0,
        retry_interval: 60,
        allowed_weekdays: [1, 2, 3, 4, 5], // 默认工作日
      })
    }
  }, [visible, isEditing, taskId, form])

  // 关闭时重置表单
  useEffect(() => {
    if (!visible) {
      form.resetFields()
    }
  }, [visible, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      // 处理计划时间
      let scheduled_start_time: string | undefined
      let scheduled_end_time: string | undefined
      if (values.scheduled_time_range && values.scheduled_time_range.length === 2) {
        scheduled_start_time = values.scheduled_time_range[0].toISOString()
        scheduled_end_time = values.scheduled_time_range[1].toISOString()
      }

      // 处理时间段
      const allowed_time_ranges: CallTaskTimeRange[] | undefined = values.allowed_time_ranges?.map(
        (range: { start: Dayjs; end: Dayjs }) => ({
          start: range.start.format('HH:mm'),
          end: range.end.format('HH:mm'),
        })
      )

      // 处理号码列表（仅新建时，不做前端验证，由后端处理）
      let phone_list: CallTaskPhoneItem[] | undefined
      if (!isEditing && values.phone_text) {
        const lines = values.phone_text
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line)
        phone_list = lines.map((phone: string) => ({ phone_number: phone }))
      }

      if (isEditing && taskId) {
        const updateData: UpdateCallTaskParams = {
          id: taskId,
          name: values.name,
          description: values.description,
          trunk_number_id: values.trunk_number_id,
          max_concurrent: values.max_concurrent,
          call_timeout: values.call_timeout,
          retry_strategy: values.retry_strategy,
          max_retry_times: values.max_retry_times,
          retry_interval: values.retry_interval,
          scheduled_start_time,
          scheduled_end_time,
          allowed_weekdays: values.allowed_weekdays,
          allowed_time_ranges,
        }
        await updateCallTask(updateData)
        message.success('更新成功')
      } else {
        const createData: CreateCallTaskParams = {
          name: values.name,
          description: values.description,
          trunk_number_id: values.trunk_number_id,
          max_concurrent: values.max_concurrent,
          call_timeout: values.call_timeout,
          retry_strategy: values.retry_strategy,
          max_retry_times: values.max_retry_times,
          retry_interval: values.retry_interval,
          scheduled_start_time,
          scheduled_end_time,
          allowed_weekdays: values.allowed_weekdays,
          allowed_time_ranges,
          phone_list,
        }
        await createCallTask(createData)
        message.success('创建成功')
      }

      onSuccess()
    } catch (error: any) {
      if (error?.errorFields) {
        // 表单验证错误，不需要处理
        return
      }
      // request 拦截器已处理错误提示
      console.error('提交失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEditing ? '编辑外呼任务' : '新建外呼任务'}
      open={visible}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
          {isEditing ? '保存' : '创建'}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" autoComplete="off">
          <Divider orientation="left">基本信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="任务名称"
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input placeholder="请输入任务名称" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label="任务描述">
                <Input placeholder="请输入任务描述" maxLength={500} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">外呼配置</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="trunk_number_id" label="外显号码">
                <Select
                  placeholder="请选择外显号码"
                  allowClear
                  options={trunkNumbers.map((item) => ({
                    value: item.id,
                    label: `${item.name} (${item.number})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_concurrent"
                label="最大并发数"
                rules={[{ required: true, message: '请输入最大并发数' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="1-100" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="call_timeout"
                label="呼叫超时（秒）"
                rules={[{ required: true, message: '请输入呼叫超时时间' }]}
              >
                <InputNumber min={10} max={300} style={{ width: '100%' }} placeholder="10-300秒" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">重试策略</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="retry_strategy"
                label="重试策略"
                rules={[{ required: true, message: '请选择重试策略' }]}
              >
                <Select
                  placeholder="请选择重试策略"
                  options={Object.entries(RETRY_STRATEGY_CONFIG).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="max_retry_times" label="最大重试次数">
                <InputNumber min={0} max={10} style={{ width: '100%' }} placeholder="0-10次" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="retry_interval" label="重试间隔（秒）">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="单位：秒" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">时间配置</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="scheduled_time_range" label="计划执行时间">
                <RangePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="allowed_weekdays" label="允许呼叫的星期">
                <Checkbox.Group options={WEEKDAY_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="允许呼叫的时间段">
            <Form.List name="allowed_time_ranges">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'start']}
                        rules={[{ required: true, message: '请选择开始时间' }]}
                      >
                        <TimePicker format="HH:mm" placeholder="开始时间" />
                      </Form.Item>
                      <span>至</span>
                      <Form.Item
                        {...restField}
                        name={[name, 'end']}
                        rules={[{ required: true, message: '请选择结束时间' }]}
                      >
                        <TimePicker format="HH:mm" placeholder="结束时间" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加时间段
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          {/* 仅新建时显示号码导入 */}
          {!isEditing && (
            <>
              <Divider orientation="left">号码导入</Divider>
              <Form.Item
                name="phone_text"
                label="导入号码"
                extra="每行一个号码，后端会自动验证和去重。创建后也可以在详情页批量添加。"
              >
                <TextArea rows={6} placeholder="请输入号码，每行一个，例如：&#10;13800138000&#10;13900139000" />
              </Form.Item>
            </>
          )}
        </Form>
      </Spin>
    </Modal>
  )
}

export default CreateEditModal
