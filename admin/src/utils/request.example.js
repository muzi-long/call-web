/**
 * 请求工具使用示例
 * 
 * 这个文件仅作为示例，展示如何使用 request 工具
 * 实际使用时，请根据项目需求进行修改
 */

import request from '@common/utils/request'

// GET 请求示例
export const getUserList = async (params) => {
    try {
        const response = await request.get('/users', params)
        return response
    } catch (error) {
        // 错误已经被拦截器处理，这里可以做一些额外的错误处理
        throw error
    }
}

// POST 请求示例
export const createUser = async (userData) => {
    try {
        const response = await request.post('/users', userData)
        return response
    } catch (error) {
        throw error
    }
}

// PUT 请求示例
export const updateUser = async (id, userData) => {
    try {
        const response = await request.put(`/users/${id}`, userData)
        return response
    } catch (error) {
        throw error
    }
}

// DELETE 请求示例
export const deleteUser = async (id) => {
    try {
        const response = await request.delete(`/users/${id}`)
        return response
    } catch (error) {
        throw error
    }
}

// 在组件中使用示例：
/*
import { getUserList } from '@/utils/request.example'

function UserComponent() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    getUserList({ page: 1, pageSize: 10 })
      .then(data => {
        setUsers(data)
      })
      .catch(error => {
        // 错误信息已经通过 message.error 提示，这里可以做其他处理
        console.error('获取用户列表失败:', error)
      })
  }, [])
  
  return <div>...</div>
}
*/

