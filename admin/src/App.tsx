import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { isAuthenticated } from '@common/utils/auth'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

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
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  if (loading) {
    return null // 或者显示加载中
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return <Dashboard onLogout={handleLogout} />
}

export default App

