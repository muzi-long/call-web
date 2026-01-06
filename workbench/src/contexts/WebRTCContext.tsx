/**
 * WebRTC 全局上下文
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { message, notification } from 'antd'
import { PhoneOutlined } from '@ant-design/icons'
import { webrtcService, CallInfo } from '../services/webrtc'
import type { UserInfo } from '../api/user'

interface WebRTCContextType {
  isRegistered: boolean
  isConnected: boolean
  currentCall: CallInfo | null
  incomingCall: CallInfo | null
  makeCall: (number: string) => Promise<void>
  answerCall: () => Promise<void>
  hangupCall: () => void
  toggleMute: () => void
  sendDTMF: (tone: string) => void
}

const WebRTCContext = createContext<WebRTCContextType | null>(null)

export const useWebRTC = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTC must be used within WebRTCProvider')
  }
  return context
}

interface WebRTCProviderProps {
  children: ReactNode
  userInfo: UserInfo | null
}

export function WebRTCProvider({ children, userInfo }: WebRTCProviderProps) {
  const [isRegistered, setIsRegistered] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null)
  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null)

  // 初始化 WebRTC
  useEffect(() => {
    if (!userInfo) {
      return
    }

    // 检查是否启用 WebRTC
    if (userInfo.answer_type !== 'webrtc') {
      console.log('WebRTC not enabled for this user')
      return
    }

    // 检查必需的配置
    if (!userInfo.sip_id || !userInfo.sip_password || !userInfo.domain) {
      console.error('Missing WebRTC configuration')
      message.error('WebRTC 配置不完整，无法启用通话功能')
      return
    }

    // 初始化 WebRTC 客户端
    const initWebRTC = async () => {
      try {
        await webrtcService.init({
          sip_id: userInfo.sip_id!,
          sip_password: userInfo.sip_password!,
          domain: userInfo.domain!,
          display_name: userInfo.display_name || userInfo.username,
        })

        message.success('WebRTC 客户端已启动')
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error)
        message.error('WebRTC 初始化失败')
      }
    }

    initWebRTC()

    // 清理
    return () => {
      webrtcService.destroy()
    }
  }, [userInfo])

  // 设置事件监听
  useEffect(() => {
    const handleRegistered = () => {
      console.log('WebRTC registered')
      setIsRegistered(true)
      message.success('SIP 注册成功')
    }

    const handleUnregistered = () => {
      console.log('WebRTC unregistered')
      setIsRegistered(false)
      message.info('SIP 已注销')
    }

    const handleRegistrationFailed = (data: any) => {
      console.error('WebRTC registration failed:', data)
      setIsRegistered(false)
      message.error('SIP 注册失败')
    }

    const handleConnected = () => {
      console.log('WebRTC connected')
      setIsConnected(true)
    }

    const handleDisconnected = () => {
      console.log('WebRTC disconnected')
      setIsConnected(false)
      message.warning('WebSocket 连接已断开')
    }

    const handleIncomingCall = (callInfo: CallInfo) => {
      console.log('Incoming call:', callInfo)
      setIncomingCall(callInfo)
      setCurrentCall(callInfo)

      // 显示通知
      notification.open({
        message: '来电提醒',
        description: `${callInfo.remoteName} (${callInfo.remoteNumber}) 来电`,
        icon: <PhoneOutlined style={{ color: '#52c41a' }} />,
        duration: 0, // 不自动关闭
        key: 'incoming-call',
      })

      // 播放铃声提示音
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRA0PVanh8K1aGAdAl9vzzX0wBSh+zfHZjToIGWi77OefTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606+upVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmUQND1Wp4fCtWhgHQJfb881+MAUofc3x2Y06CBlou+znn00QDFC')
        audio.play().catch(e => console.log('无法播放铃声:', e))
      } catch (error) {
        console.error('播放铃声失败:', error)
      }
    }

    const handleOutgoingCall = (callInfo: CallInfo) => {
      console.log('Outgoing call:', callInfo)
      setCurrentCall(callInfo)
      message.info(`正在呼叫 ${callInfo.remoteNumber}...`)
    }

    const handleCallConnected = (callInfo: CallInfo) => {
      console.log('Call connected:', callInfo)
      setCurrentCall(callInfo)
      setIncomingCall(null)
      
      // 关闭来电通知
      notification.destroy('incoming-call')
      
      message.success('通话已接通')
    }

    const handleCallEnded = (callInfo: CallInfo) => {
      console.log('Call ended:', callInfo)
      setCurrentCall(null)
      setIncomingCall(null)
      
      // 关闭来电通知
      notification.destroy('incoming-call')
      
      const duration = callInfo.duration ? `${callInfo.duration} 秒` : ''
      message.info(`通话已结束 ${duration}`)
    }

    const handleCallFailed = (data: any) => {
      console.error('Call failed:', data)
      setCurrentCall(null)
      setIncomingCall(null)
      
      // 关闭来电通知
      notification.destroy('incoming-call')
      
      message.error(`通话失败: ${data.message || data.cause}`)
    }

    // 注册事件监听
    webrtcService.on('registered', handleRegistered)
    webrtcService.on('unregistered', handleUnregistered)
    webrtcService.on('registrationFailed', handleRegistrationFailed)
    webrtcService.on('connected', handleConnected)
    webrtcService.on('disconnected', handleDisconnected)
    webrtcService.on('incomingCall', handleIncomingCall)
    webrtcService.on('outgoingCall', handleOutgoingCall)
    webrtcService.on('callConnected', handleCallConnected)
    webrtcService.on('callEnded', handleCallEnded)
    webrtcService.on('callFailed', handleCallFailed)

    // 清理事件监听
    return () => {
      webrtcService.off('registered', handleRegistered)
      webrtcService.off('unregistered', handleUnregistered)
      webrtcService.off('registrationFailed', handleRegistrationFailed)
      webrtcService.off('connected', handleConnected)
      webrtcService.off('disconnected', handleDisconnected)
      webrtcService.off('incomingCall', handleIncomingCall)
      webrtcService.off('outgoingCall', handleOutgoingCall)
      webrtcService.off('callConnected', handleCallConnected)
      webrtcService.off('callEnded', handleCallEnded)
      webrtcService.off('callFailed', handleCallFailed)
    }
  }, [])

  // 拨打电话
  const makeCall = useCallback(async (number: string) => {
    try {
      await webrtcService.call(number)
    } catch (error: any) {
      console.error('Make call error:', error)
      message.error(error.message || '拨打电话失败')
    }
  }, [])

  // 接听电话
  const answerCall = useCallback(async () => {
    try {
      await webrtcService.answer()
    } catch (error: any) {
      console.error('Answer call error:', error)
      message.error(error.message || '接听电话失败')
    }
  }, [])

  // 挂断电话
  const hangupCall = useCallback(() => {
    try {
      webrtcService.hangup()
      setCurrentCall(null)
      setIncomingCall(null)
      notification.destroy('incoming-call')
    } catch (error: any) {
      console.error('挂断电话失败:', error)
    }
  }, [])

  // 切换静音
  const toggleMute = useCallback(() => {
    try {
      const isMuted = webrtcService.toggleMute()
      message.info(isMuted ? '已静音' : '已取消静音')
    } catch (error: any) {
      message.error('切换静音失败')
    }
  }, [])

  // 发送 DTMF
  const sendDTMF = useCallback((tone: string) => {
    try {
      webrtcService.sendDTMF(tone)
    } catch (error: any) {
      console.error('发送 DTMF 失败:', error)
    }
  }, [])

  const value: WebRTCContextType = {
    isRegistered,
    isConnected,
    currentCall,
    incomingCall,
    makeCall,
    answerCall,
    hangupCall,
    toggleMute,
    sendDTMF,
  }

  return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
}

