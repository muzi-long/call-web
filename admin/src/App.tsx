import { useRoutes } from 'react-router-dom'
import { routes } from './routes'

/**
 * App 组件
 * 使用 React Router 管理路由
 */
function App() {
  const element = useRoutes(routes)
  return <>{element}</>
}

export default App

