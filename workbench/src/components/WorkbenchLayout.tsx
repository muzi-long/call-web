import { Layout, Menu, Typography, Button, Dropdown, MenuProps } from 'antd'
import { UserOutlined, DashboardOutlined, LogoutOutlined, PhoneOutlined, SoundOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { logout } from '@common/api/auth'
import { removeToken } from '@common/utils/auth'
import { message } from 'antd'
import { ROUTE_PATHS } from '../routes'
import { useUser } from '../contexts/UserContext'
import { WebRTCProvider, useWebRTC } from '../contexts/WebRTCContext'
import IncomingCallModal from './IncomingCallModal'
import CallPanel from './CallPanel'
import PhoneStatusBar from './PhoneStatusBar'

const { Header, Content, Sider } = Layout
const { Title } = Typography

/**
 * 内部布局组件（使用 WebRTC Context）
 */
function WorkbenchLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    currentCall,
    incomingCall,
    answerCall,
    hangupCall,
    toggleMute,
    sendDTMF,
  } = useWebRTC()

  // 根据当前路由确定选中的菜单项
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/call-task')) {
      return '3'
    }
    if (location.pathname.startsWith('/trunk-number')) {
      return '2'
    }
    if (location.pathname.startsWith('/dashboard')) {
      return '1'
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
      navigate(ROUTE_PATHS.TRUNK_NUMBER)
    } else if (key === '3') {
      navigate(ROUTE_PATHS.CALL_TASK)
    }
  }

  const handleAnswerCall = () => {
    answerCall()
  }

  const handleRejectCall = () => {
    hangupCall()
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
          Workbench 工作台
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ color: '#fff' }}>
              <UserOutlined /> 用户
            </Button>
          </Dropdown>
        </div>
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
                icon: <PhoneOutlined />,
                label: '中继号码',
              },
              {
                key: '3',
                icon: <SoundOutlined />,
                label: '外呼任务',
              },
            ]}
          />
        </Sider>
        <Layout style={{ padding: '24px', background: '#f0f2f5' }}>
          {/* 电话状态栏和通话面板容器 */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            {/* 电话状态栏 */}
            <PhoneStatusBar />

            {/* 通话控制面板 - 悬浮在拨号按钮下方 */}
            <CallPanel
              visible={!!currentCall && currentCall.status !== 'ringing'}
              callInfo={currentCall}
              onHangup={hangupCall}
              onToggleMute={toggleMute}
              onSendDTMF={sendDTMF}
            />
          </div>

          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>

      {/* 来电弹窗 */}
      <IncomingCallModal
        visible={!!incomingCall && incomingCall.status === 'ringing'}
        callerNumber={incomingCall?.remoteNumber || ''}
        callerName={incomingCall?.remoteName}
        onAnswer={handleAnswerCall}
        onReject={handleRejectCall}
      />
    </Layout>
  )
}

/**
 * 外部布局组件（提供 WebRTC Context）
 */
function WorkbenchLayout() {
  const { userInfo } = useUser()

  return (
    <WebRTCProvider userInfo={userInfo}>
      <WorkbenchLayoutInner />
    </WebRTCProvider>
  )
}

export default WorkbenchLayout

