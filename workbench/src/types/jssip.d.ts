/**
 * JsSIP 类型定义
 */
declare module 'jssip' {
  export class UA {
    constructor(configuration: UAConfiguration)
    start(): void
    stop(): void
    register(): void
    unregister(options?: any): void
    call(target: string, options?: any): RTCSession
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
    isRegistered(): boolean
    isConnected(): boolean
  }

  export interface UAConfiguration {
    sockets: WebSocketInterface[]
    uri: string
    password: string
    display_name?: string
    user_agent?: string
    register?: boolean
    session_timers?: boolean
    register_expires?: number
  }

  export interface WebSocketInterface {
    new (url: string): WebSocketInterface
    via_transport: string
  }

  export class WebSocketInterface {
    constructor(url: string)
  }

  export class RTCSession {
    id: string
    connection: RTCPeerConnection
    remote_identity: {
      uri: {
        user: string
        host: string
      }
      display_name: string
    }
    local_identity: {
      uri: {
        user: string
        host: string
      }
      display_name: string
    }
    start_time: Date
    end_time: Date
    
    answer(options?: any): void
    terminate(options?: any): void
    hold(options?: any): void
    unhold(options?: any): void
    renegotiate(options?: any): void
    sendDTMF(tone: string, options?: any): void
    mute(options?: any): void
    unmute(options?: any): void
    isMuted(): { audio: boolean; video: boolean }
    isOnHold(): { local: boolean; remote: boolean }
    on(event: string, callback: Function): void
    off(event: string, callback: Function): void
  }

  export const debug: {
    enable(namespace: string): void
    disable(): void
  }

  export const C: {
    causes: {
      [key: string]: string
    }
  }
}

