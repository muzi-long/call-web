/**
 * 来电弹窗组件
 */
import { Modal, Button, Space, Typography, Avatar } from 'antd'
import { PhoneOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

const { Title, Text } = Typography

interface IncomingCallModalProps {
  visible: boolean
  callerNumber: string
  callerName?: string
  onAnswer: () => void
  onReject: () => void
}

function IncomingCallModal({
  visible,
  callerNumber,
  callerName,
  onAnswer,
  onReject,
}: IncomingCallModalProps) {
  const [ringingTime, setRingingTime] = useState(0)

  useEffect(() => {
    if (!visible) {
      setRingingTime(0)
      return
    }

    const timer = setInterval(() => {
      setRingingTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [visible])

  // 播放铃声（可选）
  useEffect(() => {
    if (visible) {
      // 这里可以播放自定义铃声
      // const audio = new Audio('/path/to/ringtone.mp3')
      // audio.loop = true
      // audio.play()
      // return () => audio.pause()
    }
  }, [visible])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Modal
      open={visible}
      centered
      closable={false}
      footer={null}
      width={400}
      styles={{ body: { padding: '40px 24px' } }}
      maskClosable={false}
    >
      <div style={{ textAlign: 'center' }}>
        {/* 来电者头像 */}
        <Avatar
          size={80}
          icon={<UserOutlined />}
          style={{
            backgroundColor: '#1890ff',
            marginBottom: 20,
          }}
        />

        {/* 来电者信息 */}
        <Title level={4} style={{ marginBottom: 8 }}>
          {callerName || '未知来电'}
        </Title>
        <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
          {callerNumber}
        </Text>
        
        {/* 振铃时间 */}
        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 32 }}>
          振铃中... {formatTime(ringingTime)}
        </Text>

        {/* 操作按钮 */}
        <Space size="large">
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<CloseOutlined />}
            onClick={onReject}
            style={{
              width: 64,
              height: 64,
              fontSize: 24,
            }}
          />
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<PhoneOutlined />}
            onClick={onAnswer}
            style={{
              width: 64,
              height: 64,
              fontSize: 24,
              backgroundColor: '#52c41a',
              borderColor: '#52c41a',
            }}
          />
        </Space>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            拒接 / 接听
          </Text>
        </div>
      </div>
    </Modal>
  )
}

export default IncomingCallModal

