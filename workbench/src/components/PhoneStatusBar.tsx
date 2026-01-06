/**
 * 电话状态栏组件
 * 显示接听方式选择和通话状态
 */
import { useState } from 'react'
import { Card, Tag, Space, Typography, Button, Divider, Radio, message, Input } from 'antd'
import {
  PhoneOutlined,
  DisconnectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PhoneFilled,
  GlobalOutlined,
  MobileOutlined,
  DesktopOutlined,
} from '@ant-design/icons'
import { useWebRTC } from '../contexts/WebRTCContext'
import { useUser } from '../contexts/UserContext'
import { updateUserSettings } from '../api/user'
import type { CallInfo } from '../services/webrtc'

const { Text } = Typography

interface PhoneStatusBarProps {
  // 不再需要 onOpenDialer
}

function PhoneStatusBar({ }: PhoneStatusBarProps) {
  const { isRegistered, isConnected, currentCall, makeCall } = useWebRTC()
  const { userInfo, refreshUserInfo } = useUser()
  const [switching, setSwitching] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')

  // 切换接听方式
  const handleAnswerTypeChange = async (e: any) => {
    const newAnswerType = e.target.value

    try {
      setSwitching(true)
      await updateUserSettings({ answer_type: newAnswerType })
      await refreshUserInfo()
      message.success('接听方式已更新')
    } catch (error) {
      console.error('更新接听方式失败:', error)
      message.error('更新接听方式失败')
    } finally {
      setSwitching(false)
    }
  }

  // 拨打电话
  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      message.warning('请输入号码')
      return
    }
    await makeCall(phoneNumber.trim())
    setPhoneNumber('') // 拨号后清空输入框
  }

  // 按下 Enter 键拨号
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCall()
    }
  }

  // 获取通话状态文本
  const getCallStatusText = (call: CallInfo | null) => {
    if (!call) return null

    switch (call.status) {
      case 'ringing':
        return call.direction === 'incoming' ? '来电中' : '呼叫中'
      case 'connecting':
        return '连接中'
      case 'connected':
        return '通话中'
      case 'ended':
        return '通话结束'
      default:
        return null
    }
  }

  // 获取通话状态颜色
  const getCallStatusColor = (call: CallInfo | null) => {
    if (!call) return 'default'

    switch (call.status) {
      case 'ringing':
        return 'processing'
      case 'connecting':
        return 'processing'
      case 'connected':
        return 'success'
      case 'ended':
        return 'default'
      default:
        return 'default'
    }
  }

  const answerType = userInfo?.answer_type || 'webrtc'
  const isWebRTC = answerType === 'webrtc'

  return (
    <Card
      size="small"
      style={{
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        background: 'linear-gradient(to right, #fafafa, #ffffff)',
      }}
      styles={{ body: { padding: '12px 20px' } }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* 左侧：接听方式选择 */}
        <Space split={<Divider type="vertical" />} size="large">
          {/* 接听方式 */}
          <Space size="small">
            <Text strong style={{ fontSize: 13, color: '#595959' }}>
              接听方式:
            </Text>
            <Radio.Group
              value={answerType}
              onChange={handleAnswerTypeChange}
              disabled={switching}
              size="small"
            >
              <Radio.Button value="webrtc">
                <GlobalOutlined /> 网页接听
              </Radio.Button>
              <Radio.Button value="mobile">
                <MobileOutlined /> 手机接听
              </Radio.Button>
              <Radio.Button value="soft">
                <DesktopOutlined /> 软电话
              </Radio.Button>
            </Radio.Group>
          </Space>

          {/* 只有 webrtc 模式才显示连接和注册状态 */}
          {isWebRTC && (
            <>
              {/* WebSocket 连接状态 */}
              <Space size="small">
                <Text strong style={{ fontSize: 13, color: '#595959' }}>
                  连接:
                </Text>
                {isConnected ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    已连接
                  </Tag>
                ) : (
                  <Tag icon={<DisconnectOutlined />} color="error">
                    未连接
                  </Tag>
                )}
              </Space>

              {/* SIP 注册状态 */}
              <Space size="small">
                <Text strong style={{ fontSize: 13, color: '#595959' }}>
                  注册:
                </Text>
                {isRegistered ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    已注册
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="default">
                    未注册
                  </Tag>
                )}
              </Space>

              {/* 通话状态 */}
              <Space size="small">
                <Text strong style={{ fontSize: 13, color: '#595959' }}>
                  通话:
                </Text>
                {currentCall ? (
                  <Space size="small">
                    <Tag
                      icon={
                        currentCall.status === 'connected' ? (
                          <PhoneFilled />
                        ) : (
                          <SyncOutlined spin />
                        )
                      }
                      color={getCallStatusColor(currentCall)}
                      style={{ margin: 0 }}
                    >
                      {getCallStatusText(currentCall)}
                    </Tag>
                    {currentCall.status === 'connected' && (
                      <Text strong style={{ fontSize: 13 }}>
                        {currentCall.remoteName || currentCall.remoteNumber}
                      </Text>
                    )}
                  </Space>
                ) : (
                  <Tag color="default">空闲</Tag>
                )}
              </Space>
            </>
          )}
        </Space>

        {/* 右侧：快捷操作 */}
        {isWebRTC && (
          <Space size="middle">
            {/* 显示通话方向和号码 */}
            {currentCall && currentCall.status !== 'ended' && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentCall.direction === 'incoming' ? '📞 来电' : '📱 拨出'}
                {': '}
                {currentCall.remoteNumber}
              </Text>
            )}

            {isRegistered && !currentCall && (
              <Space.Compact>
                <Input
                  placeholder="输入号码"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{ width: 150 }}
                  size="small"
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<PhoneOutlined />}
                  onClick={handleCall}
                >
                  拨号
                </Button>
              </Space.Compact>
            )}
          </Space>
        )}
      </div>
    </Card>
  )
}

export default PhoneStatusBar

