import { Layout, Menu, Typography, Button, Dropdown, MenuProps } from 'antd'
import { UserOutlined, DashboardOutlined, LogoutOutlined, BankOutlined, ApiOutlined, PhoneOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../api/auth'
import { removeToken } from '@common/utils/auth'
import { message } from 'antd'
import { ROUTE_PATHS } from '../routes'

const { Header, Content, Sider } = Layout
const { Title } = Typography

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // 根据当前路由确定选中的菜单项
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/enterprise')) {
      return '2'
    }
    if (location.pathname.startsWith('/agent')) {
      return '3'
    }
    if (location.pathname.startsWith('/trunk-number')) {
      return '4-2'
    }
    if (location.pathname.startsWith('/trunk')) {
      return '4-1'
    }
    return '1'
  }

  const selectedKey = getSelectedKey()

  const handleLogout = async () => {
    try {
      await logout()
      removeToken()
      message.success('已退出登录')
      navigate(ROUTE_PATHS.LOGIN, { replace: true })
    } catch (error) {
      removeToken()
      navigate(ROUTE_PATHS.LOGIN, { replace: true })
    }
  }

  const handleMenuSelect = ({ key }: { key: string }) => {
    if (key === '1') {
      navigate(ROUTE_PATHS.DASHBOARD)
    } else if (key === '2') {
      navigate(ROUTE_PATHS.ENTERPRISE)
    } else if (key === '3') {
      navigate(ROUTE_PATHS.AGENT)
    } else if (key === '4-1') {
      navigate(ROUTE_PATHS.TRUNK)
    } else if (key === '4-2') {
      navigate(ROUTE_PATHS.TRUNK_NUMBER)
    }
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          Admin 管理后台
        </Title>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" style={{ color: '#fff' }}>
            <UserOutlined /> 用户
          </Button>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            onSelect={handleMenuSelect}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: '1',
                icon: <DashboardOutlined />,
                label: '仪表盘',
              },
              {
                key: '2',
                icon: <BankOutlined />,
                label: '企业管理',
              },
              {
                key: '3',
                icon: <UserOutlined />,
                label: '用户管理',
              },
              {
                key: '4',
                icon: <ApiOutlined />,
                label: '线路管理',
                children: [
                  {
                    key: '4-1',
                    icon: <ApiOutlined />,
                    label: '线路管理',
                  },
                  {
                    key: '4-2',
                    icon: <PhoneOutlined />,
                    label: '号码管理',
                  },
                ],
              },
            ]}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default AdminLayout

