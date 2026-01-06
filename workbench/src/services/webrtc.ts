/**
 * WebRTC 客户端服务
 * 基于 JsSIP 封装
 */
import JsSIP from 'jssip'
import type { UA, RTCSession } from 'jssip'

export interface WebRTCConfig {
  sip_id: string
  sip_password: string
  domain: string
  display_name?: string
}

export interface CallInfo {
  sessionId: string
  remoteNumber: string
  remoteName: string
  direction: 'incoming' | 'outgoing'
  status: 'ringing' | 'connecting' | 'connected' | 'ended'
  startTime?: Date
  duration?: number
}

export type WebRTCEventType =
  | 'registered'
  | 'unregistered'
  | 'registrationFailed'
  | 'connected'
  | 'disconnected'
  | 'incomingCall'
  | 'outgoingCall'
  | 'callConnected'
  | 'callEnded'
  | 'callFailed'

export type WebRTCEventCallback = (data?: any) => void

class WebRTCService {
  private ua: UA | null = null
  private currentSession: RTCSession | null = null
  private config: WebRTCConfig | null = null
  private eventListeners: Map<WebRTCEventType, Set<WebRTCEventCallback>> = new Map()
  private remoteAudio: HTMLAudioElement | null = null
  private localStream: MediaStream | null = null

  constructor() {
    // 启用 JsSIP 调试日志（生产环境可以关闭）
    // JsSIP.debug.enable('JsSIP:*')
  }

  /**
   * 初始化 WebRTC 客户端
   */
  async init(config: WebRTCConfig): Promise<void> {
    if (this.ua) {
      console.warn('WebRTC client already initialized')
      return
    }

    this.config = config

    // 创建 WebSocket 连接
    const socket = new JsSIP.WebSocketInterface(`wss://${config.domain}`)

    // 配置 SIP UA
    const configuration = {
      sockets: [socket],
      uri: `sip:${config.sip_id}@${config.domain}`,
      password: config.sip_password,
      display_name: config.display_name || config.sip_id,
      user_agent: 'JsSIP',
      register: true,
      session_timers: false,
      register_expires: 600,
    }

    this.ua = new JsSIP.UA(configuration)

    // 设置事件监听
    this.setupUAEvents()

    // 启动 UA
    this.ua.start()

    // 创建音频元素
    this.createAudioElements()
  }

  /**
   * 创建音频元素
   */
  private createAudioElements(): void {
    // 创建远程音频元素（用于播放对方声音）
    if (!this.remoteAudio) {
      this.remoteAudio = document.createElement('audio')
      this.remoteAudio.autoplay = true
      document.body.appendChild(this.remoteAudio)
      console.log('Remote audio element created')
    }
  }

  /**
   * 设置 UA 事件监听
   */
  private setupUAEvents(): void {
    if (!this.ua) return

    // 注册成功
    this.ua.on('registered', () => {
      console.log('SIP registered')
      this.emit('registered')
    })

    // 注销成功
    this.ua.on('unregistered', () => {
      console.log('SIP unregistered')
      this.emit('unregistered')
    })

    // 注册失败
    this.ua.on('registrationFailed', (data: any) => {
      console.error('SIP registration failed:', data)
      this.emit('registrationFailed', data)
    })

    // WebSocket 连接
    this.ua.on('connected', () => {
      console.log('WebSocket connected')
      this.emit('connected')
    })

    // WebSocket 断开
    this.ua.on('disconnected', () => {
      console.log('WebSocket disconnected')
      this.emit('disconnected')
    })

    // 新的 RTC 会话（来电或去电）
    this.ua.on('newRTCSession', (data: any) => {
      const session: RTCSession = data.session

      console.log('New RTC Session, originator:', data.originator, 'current session:', !!this.currentSession)

      if (data.originator === 'remote') {
        // 来电
        console.log('Incoming call from:', session.remote_identity.uri.user)

        // 如果已经有通话，自动拒绝新来电
        if (this.currentSession) {
          console.log('Already in a call, rejecting incoming call')
          session.terminate()
          return
        }

        this.currentSession = session

        const callInfo: CallInfo = {
          sessionId: session.id,
          remoteNumber: session.remote_identity.uri.user,
          remoteName: session.remote_identity.display_name || session.remote_identity.uri.user,
          direction: 'incoming',
          status: 'ringing',
        }

        this.emit('incomingCall', callInfo)
        this.setupSessionEvents(session, 'incoming')
      } else {
        // 去电 (originator === 'local')
        console.log('Outgoing call to:', session.remote_identity.uri.user)

        this.currentSession = session

        const callInfo: CallInfo = {
          sessionId: session.id,
          remoteNumber: session.remote_identity.uri.user,
          remoteName: session.remote_identity.display_name || session.remote_identity.uri.user,
          direction: 'outgoing',
          status: 'connecting',
        }

        this.emit('outgoingCall', callInfo)
        this.setupSessionEvents(session, 'outgoing')
      }
    })
  }

  /**
   * 设置会话事件监听
   */
  private setupSessionEvents(session: RTCSession, direction: 'incoming' | 'outgoing'): void {
    // 通话建立
    session.on('accepted', () => {
      console.log('Call accepted')

      const callInfo: CallInfo = {
        sessionId: session.id,
        remoteNumber: session.remote_identity.uri.user,
        remoteName: session.remote_identity.display_name || session.remote_identity.uri.user,
        direction: direction,
        status: 'connected',
        startTime: session.start_time,
      }

      this.emit('callConnected', callInfo)
    })

    // 通话确认（对方接听）
    session.on('confirmed', () => {
      console.log('Call confirmed')
    })

    // 处理 PeerConnection 来获取远程音频流
    session.on('peerconnection', (data: any) => {
      console.log('PeerConnection event in setupSessionEvents', data)
      const pc = data.peerconnection
      this.handlePeerConnection(pc)
    })

    // 通话结束
    session.on('ended', () => {
      console.log('Call ended')
      this.handleCallEnded(session, direction)
    })

    // 通话失败
    session.on('failed', (data: any) => {
      console.error('Call failed:', data)
      this.emit('callFailed', {
        cause: data.cause,
        message: data.message,
      })
      this.handleCallEnded(session, direction)
    })

    // 对方正在振铃
    session.on('progress', () => {
      console.log('Call progress (ringing)')
      // 可以在这里播放回铃音
    })
  }

  /**
   * 处理 PeerConnection
   */
  private handlePeerConnection(pc: RTCPeerConnection): void {
    console.log('Handling peerconnection:', pc)

    // 处理远程音频流
    if ('ontrack' in pc) {
      pc.ontrack = (event: RTCTrackEvent) => {
        console.log('Got remote track:', event)
        if (event.streams && event.streams.length > 0 && event.streams[0].active) {
          console.log('Setting remote audio stream')
          if (this.remoteAudio) {
            this.remoteAudio.srcObject = event.streams[0]
          }
        }
      }
    } else {
      // 兼容老版本浏览器
      (pc as any).onaddstream = (event: any) => {
        console.log('Got remote stream (legacy):', event)
        const remoteStream = event.stream
        if (remoteStream && remoteStream.active) {
          console.log('Setting remote audio stream (legacy)')
          if (this.remoteAudio) {
            this.remoteAudio.srcObject = remoteStream
          }
        }
      }
    }
  }

  /**
   * 处理通话结束
   */
  private handleCallEnded(session: RTCSession, direction: 'incoming' | 'outgoing' = 'incoming'): void {
    if (this.currentSession === session) {
      this.currentSession = null
    }

    // 清理音频流
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null
    }

    // 停止并释放本地媒体流
    if (this.localStream) {
      console.log('Stopping local media stream...')
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track.kind)
      })
      this.localStream = null
      console.log('Local media stream released')
    }

    const callInfo: CallInfo = {
      sessionId: session.id,
      remoteNumber: session.remote_identity.uri.user,
      remoteName: session.remote_identity.display_name || session.remote_identity.uri.user,
      direction: direction,
      status: 'ended',
      startTime: session.start_time,
      duration: session.end_time && session.start_time
        ? Math.floor((session.end_time.getTime() - session.start_time.getTime()) / 1000)
        : 0,
    }

    this.emit('callEnded', callInfo)
  }

  /**
   * 拨打电话
   */
  async call(number: string): Promise<void> {
    if (!this.ua) {
      throw new Error('WebRTC client not initialized')
    }

    if (!this.ua.isRegistered()) {
      throw new Error('SIP not registered')
    }

    if (this.currentSession) {
      throw new Error('Already in a call')
    }

    console.log('Calling:', number)

    try {
      // 获取本地媒体流
      console.log('Getting local media stream for call...')
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })
      console.log('Got local media stream:', this.localStream)

      // 配置呼叫选项
      const options = {
        eventHandlers: {
          peerconnection: (e: any) => {
            console.log('Peerconnection event in call:', e)
            const pc = e.peerconnection
            this.handlePeerConnection(pc)
          }
        },
        mediaConstraints: {
          audio: true,
          video: false,
        },
        mediaStream: this.localStream,
        sessionTimersExpires: 120,
      }

      // 拨打电话 - JsSIP 会自动触发 newRTCSession 事件
      // 不需要在这里手动设置 currentSession
      console.log('Calling number:', number)
      this.ua.call(number, options)
    } catch (error) {
      console.error('Failed to make call:', error)
      throw new Error('拨打电话失败')
    }
  }

  /**
   * 接听电话
   */
  async answer(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No incoming call')
    }

    console.log('Answering call...')

    try {
      // 获取本地媒体流
      console.log('Getting local media stream for answer...')
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })
      console.log('Got local media stream:', this.localStream)

      const options = {
        mediaConstraints: {
          audio: true,
          video: false,
        },
        mediaStream: this.localStream,
      }

      this.currentSession.answer(options)
    } catch (error) {
      console.error('Failed to answer call:', error)
      throw new Error('接听电话失败')
    }
  }

  /**
   * 挂断电话
   */
  hangup(): void {
    if (!this.currentSession) {
      return
    }

    this.currentSession.terminate()
    this.currentSession = null
  }

  /**
   * 静音/取消静音
   */
  toggleMute(): boolean {
    if (!this.currentSession) {
      return false
    }

    const isMuted = this.currentSession.isMuted().audio

    if (isMuted) {
      this.currentSession.unmute({ audio: true })
    } else {
      this.currentSession.mute({ audio: true })
    }

    return !isMuted
  }

  /**
   * 发送 DTMF
   */
  sendDTMF(tone: string): void {
    if (!this.currentSession) {
      return
    }

    this.currentSession.sendDTMF(tone)
  }

  /**
   * 获取当前通话状态
   */
  getCurrentCall(): CallInfo | null {
    if (!this.currentSession) {
      return null
    }

    return {
      sessionId: this.currentSession.id,
      remoteNumber: this.currentSession.remote_identity.uri.user,
      remoteName: this.currentSession.remote_identity.display_name || this.currentSession.remote_identity.uri.user,
      direction: 'incoming',
      status: 'connected',
      startTime: this.currentSession.start_time,
    }
  }

  /**
   * 是否已注册
   */
  isRegistered(): boolean {
    return this.ua?.isRegistered() || false
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.ua?.isConnected() || false
  }

  /**
   * 销毁客户端
   */
  destroy(): void {
    if (this.currentSession) {
      this.currentSession.terminate()
      this.currentSession = null
    }

    if (this.ua) {
      this.ua.stop()
      this.ua = null
    }

    // 停止本地媒体流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // 清理音频元素
    if (this.remoteAudio) {
      this.remoteAudio.remove()
      this.remoteAudio = null
    }

    this.eventListeners.clear()
    this.config = null
  }

  /**
   * 添加事件监听
   */
  on(event: WebRTCEventType, callback: WebRTCEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  /**
   * 移除事件监听
   */
  off(event: WebRTCEventType, callback: WebRTCEventCallback): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 触发事件
   */
  private emit(event: WebRTCEventType, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }
}

// 导出单例
export const webrtcService = new WebRTCService()

