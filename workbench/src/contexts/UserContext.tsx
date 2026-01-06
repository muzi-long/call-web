/**
 * 用户信息全局上下文
 * 避免重复请求用户信息
 */
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { getUserInfo, type UserInfo } from '../api/user'
import { message } from 'antd'

interface UserContextType {
  userInfo: UserInfo | null
  loading: boolean
  refreshUserInfo: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      const info = await getUserInfo()
      setUserInfo(info)
    } catch (error) {
      console.error('Failed to get user info:', error)
      message.error('获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  // 只在首次挂载时获取用户信息
  useEffect(() => {
    if (hasFetched.current) {
      return
    }
    hasFetched.current = true
    fetchUserInfo()
  }, [])

  const refreshUserInfo = async () => {
    await fetchUserInfo()
  }

  const value: UserContextType = {
    userInfo,
    loading,
    refreshUserInfo,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

