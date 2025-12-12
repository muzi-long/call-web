import { RouteObject } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import TrunkNumber from '../pages/TrunkNumber'
import { ProtectedRoute } from '../components/ProtectedRoute'
import WorkbenchLayout from '../components/WorkbenchLayout'

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
        <WorkbenchLayout>
          <Dashboard />
        </WorkbenchLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <WorkbenchLayout>
          <Dashboard />
        </WorkbenchLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/trunk-number',
    element: (
      <ProtectedRoute>
        <WorkbenchLayout>
          <TrunkNumber />
        </WorkbenchLayout>
      </ProtectedRoute>
    ),
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
} as const

