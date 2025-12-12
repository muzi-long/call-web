import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { isAuthenticated } from '@common/utils/auth'
import { ROUTE_PATHS } from '../routes'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * 受保护的路由组件
 * 用于保护需要认证才能访问的页面
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // 检查登录状态
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      setIsLoggedIn(authenticated)
      setLoading(false)
    }

    checkAuth()

    // 监听未授权事件（当 token 过期或被清除时）
    const handleUnauthorized = () => {
      setIsLoggedIn(false)
      setLoading(false)
      // 立即导航到登录页
      navigate(ROUTE_PATHS.LOGIN, { replace: true })
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [navigate])

  // 显示加载状态
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  // 未登录时重定向到登录页
  if (!isLoggedIn) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />
  }

  // 已登录时渲染子组件
  return <>{children}</>
}

