/**
 * 通话控制面板组件
 */
import { useState, useEffect } from 'react'
import { Card, Button, Space, Typography, Row, Col, Input, Divider, Avatar } from 'antd'
import {
  PhoneOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { CallInfo } from '../services/webrtc'

const { Text } = Typography

interface CallPanelProps {
  visible: boolean
  callInfo: CallInfo | null
  onHangup: () => void
  onToggleMute: () => void
  onSendDTMF?: (tone: string) => void
}

function CallPanel({
  visible,
  callInfo,
  onHangup,
  onToggleMute,
  onSendDTMF,
}: CallPanelProps) {
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [dtmfInput, setDtmfInput] = useState('')

  // 通话计时
  useEffect(() => {
    if (!visible || !callInfo || callInfo.status !== 'connected') {
      setDuration(0)
      return
    }

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [visible, callInfo])

  // 清空按键输入（新通话或通话结束时）
  useEffect(() => {
    if (!visible || !callInfo) {
      setDtmfInput('')
      setIsMuted(false)
    }
  }, [visible, callInfo?.sessionId])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    onToggleMute()
  }

  const handleDTMFClick = (digit: string) => {
    setDtmfInput((prev) => prev + digit)
    onSendDTMF?.(digit)
  }

  const handleClearDTMF = () => {
    setDtmfInput('')
  }

  const getStatusText = () => {
    if (!callInfo) return ''
    
    switch (callInfo.status) {
      case 'ringing':
        return callInfo.direction === 'incoming' ? '来电中...' : '呼叫中...'
      case 'connecting':
        return '连接中...'
      case 'connected':
        return formatDuration(duration)
      case 'ended':
        return '通话结束'
      default:
        return ''
    }
  }

  if (!visible || !callInfo) {
    return null
  }

  return (
    <Card
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        width: 320,
        marginTop: 8,
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: 100,
      }}
      styles={{ body: { padding: 16 } }}
    >
      {/* 通话信息 */}
      <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 12 }}>
        <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="small">
            <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{callInfo.remoteName}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{callInfo.remoteNumber}</Text>
            </div>
          </Space>
          <Text
            strong
            style={{
              fontSize: 14,
              color: callInfo.status === 'connected' ? '#52c41a' : '#1890ff',
            }}
          >
            {getStatusText()}
          </Text>
        </Space>
      </Space>

      {/* 控制按钮 */}
      {callInfo.status === 'connected' && (
        <>
          <Row gutter={8} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Button
                block
                size="small"
                icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                onClick={handleToggleMute}
                type={isMuted ? 'primary' : 'default'}
                danger={isMuted}
              >
                {isMuted ? '取消静音' : '静音'}
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                size="small"
                danger
                type="primary"
                icon={<PhoneOutlined rotate={135} />}
                onClick={onHangup}
              >
                挂断
              </Button>
            </Col>
          </Row>

          {/* DTMF 拨号盘 */}
          <Divider style={{ margin: '12px 0 8px 0', fontSize: 12 }}>按键</Divider>
          
          <div style={{ marginBottom: 8 }}>
            <Input
              size="small"
              value={dtmfInput}
              placeholder="按键输入"
              readOnly
              suffix={
                <DeleteOutlined
                  onClick={handleClearDTMF}
                  style={{
                    cursor: dtmfInput ? 'pointer' : 'default',
                    opacity: dtmfInput ? 1 : 0,
                    visibility: dtmfInput ? 'visible' : 'hidden',
                    pointerEvents: dtmfInput ? 'auto' : 'none',
                  }}
                />
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <Button
                key={digit}
                size="small"
                onClick={() => handleDTMFClick(digit)}
                style={{ height: 32 }}
              >
                {digit}
              </Button>
            ))}
          </div>
        </>
      )}

      {/* 非通话中状态只显示挂断按钮 */}
      {callInfo.status !== 'connected' && (
        <Button
          block
          danger
          type="primary"
          icon={<PhoneOutlined rotate={135} />}
          onClick={onHangup}
        >
          取消
        </Button>
      )}
      </Card>
  )
}

export default CallPanel

