import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '@common/api/auth'
import { setToken } from '@common/utils/auth'
import { ROUTE_PATHS } from '../routes'

const { Title } = Typography

function Login() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      setLoading(true)
      const { username, password } = values
      const response = await login(username, password)

      // 保存 token
      setToken(response.token, response.exp)

      message.success('登录成功')
      // 登录成功后跳转到 Dashboard
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true })
    } catch (error) {
      // 错误已经在 request 拦截器中处理了
      console.error('登录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Workbench 工作台</Title>
          <p style={{ color: '#666', marginTop: 8 }}>请登录您的账户</p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login

