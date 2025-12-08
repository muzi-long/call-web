import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import { ProtectedRoute } from '../components/ProtectedRoute'

/**
 * 路由配置
 * 所有路由定义都在此文件中管理
 */

// 懒加载组件（可选，用于代码分割）
// const Dashboard = lazy(() => import('../pages/Dashboard'))
// const Enterprise = lazy(() => import('../pages/Enterprise'))

/**
 * 路由配置列表
 */
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  // 后续可以在这里添加更多路由
  // {
  //   path: '/enterprise',
  //   element: (
  //     <ProtectedRoute>
  //       <Enterprise />
  //     </ProtectedRoute>
  //   ),
  // },
]

/**
 * 路由路径常量
 * 统一管理路由路径，避免硬编码
 */
export const ROUTE_PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HOME: '/',
  // 后续可以添加更多路径
  // ENTERPRISE: '/enterprise',
} as const

