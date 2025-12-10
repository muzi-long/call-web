import { lazy } from 'react'
import { RouteObject } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Enterprise from '../pages/Enterprise'
import EnterpriseDetail from '../pages/EnterpriseDetail'
import Agent from '../pages/Agent'
import Trunk from '../pages/Trunk'
import TrunkNumber from '../pages/TrunkNumber'
import { ProtectedRoute } from '../components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'

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
        <AdminLayout>
          <Dashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <Dashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/enterprise',
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <Enterprise />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/enterprise/:id',
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <EnterpriseDetail />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/agent',
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <Agent />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/trunk',
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <Trunk />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/trunk-number',
    element: (
      <ProtectedRoute>
        <AdminLayout>
          <TrunkNumber />
        </AdminLayout>
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
  ENTERPRISE: '/enterprise',
  ENTERPRISE_DETAIL: (id: number) => `/enterprise/${id}`,
  AGENT: '/agent',
  TRUNK: '/trunk',
  TRUNK_NUMBER: '/trunk-number',
} as const

