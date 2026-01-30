import { RouteObject, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import TrunkNumber from '../pages/TrunkNumber'
import CallTask from '../pages/CallTask'
import { ProtectedRoute } from '../components/ProtectedRoute'
import WorkbenchLayout from '../components/WorkbenchLayout'
import { UserProvider } from '../contexts/UserContext'

/**
 * 路由配置
 * 所有路由定义都在此文件中管理
 */

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
        <UserProvider>
          <WorkbenchLayout />
        </UserProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'trunk-number',
        element: <TrunkNumber />,
      },
      {
        path: 'call-task',
        element: <CallTask />,
      },
    ],
  },
]

/**
 * 路由路径常量
 * 统一管理路由路径，避免硬编码
 */
export const ROUTE_PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HOME: '/',
  TRUNK_NUMBER: '/trunk-number',
  CALL_TASK: '/call-task',
} as const

