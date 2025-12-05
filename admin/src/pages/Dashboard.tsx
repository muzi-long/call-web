import { Layout, Menu, Typography, Button, Dropdown, MenuProps } from 'antd'
import { UserOutlined, DashboardOutlined, LogoutOutlined, BankOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { logout } from '../api/auth'
import { removeToken } from '@common/utils/auth'
import { message } from 'antd'
import Enterprise from './Enterprise'

const { Header, Content, Sider } = Layout
const { Title } = Typography

interface DashboardProps {
  onLogout?: () => void
}

function Dashboard({ onLogout }: DashboardProps) {
  const [selectedKey, setSelectedKey] = useState('2')

  const handleLogout = async () => {
    try {
      await logout()
      removeToken()
      message.success('已退出登录')
      onLogout?.()
    } catch (error) {
      // 即使登出失败，也清除本地 token
      removeToken()
      onLogout?.()
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
            onSelect={({ key }) => setSelectedKey(key)}
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
            {selectedKey === '1' && (
              <>
                <Title level={2}>欢迎使用 Admin 管理后台</Title>
                <p>这是 Admin 项目的首页</p>
              </>
            )}
            {selectedKey === '2' && <Enterprise />}
            {selectedKey === '3' && (
              <>
                <Title level={2}>用户管理</Title>
                <p>用户管理功能待开发</p>
              </>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default Dashboard

