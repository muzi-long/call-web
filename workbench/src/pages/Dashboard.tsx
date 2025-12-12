import { useState, useEffect, useRef } from 'react'
import { Card, Descriptions, Typography, Spin, message, Table, Tag, Space, Button, Modal } from 'antd'
import { UserOutlined, BankOutlined, SwapOutlined } from '@ant-design/icons'
import { getUserInfo, switchCurrentEnterprise, type UserInfo, type Enterprise } from '../api/user'
import { formatDateTime } from '@common/utils/date'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [switchingIds, setSwitchingIds] = useState<Set<number>>(new Set())
  const hasFetched = useRef(false)

  const fetchUserInfo = async () => {
    try {
      setLoading(true)
      const data = await getUserInfo()
      setUserInfo(data)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      message.error('获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 防止 React.StrictMode 导致的重复请求
    if (hasFetched.current) {
      return
    }

    hasFetched.current = true
    fetchUserInfo()
  }, [])

  // 切换当前企业
  const handleSwitchEnterprise = async (entId: number, enterpriseName: string) => {
    Modal.confirm({
      title: '确认切换企业',
      content: `确定要切换到企业"${enterpriseName}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setSwitchingIds((prev) => new Set(prev).add(entId))
          await switchCurrentEnterprise(entId)
          message.success('切换企业成功')
          // 只更新企业列表的 is_current 状态，不更新个人信息
          if (userInfo && userInfo.enterprises) {
            setUserInfo({
              ...userInfo,
              enterprises: userInfo.enterprises.map((ent) => ({
                ...ent,
                is_current: ent.id === entId ? 1 : 0,
              })),
            })
          }
        } catch (error) {
          console.error('切换企业失败:', error)
          message.error('切换企业失败')
        } finally {
          setSwitchingIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(entId)
            return newSet
          })
        }
      },
    })
  }

  // 企业列表表格列定义
  const enterpriseColumns: ColumnsType<Enterprise> = [
    {
      title: '企业ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => {
        const statusMap: Record<number, { text: string; color: string }> = {
          1: { text: '正常', color: 'success' },
          2: { text: '禁用', color: 'error' },
        }
        const statusInfo = statusMap[status] || { text: '未知', color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: '是否当前企业',
      dataIndex: 'is_current',
      key: 'is_current',
      width: 120,
      render: (isCurrent: number) => (
        <Tag color={isCurrent === 1 ? 'success' : 'default'}>
          {isCurrent === 1 ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'join_at',
      key: 'join_at',
      width: 180,
      render: (joinAt: string) => formatDateTime(joinAt),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: Enterprise) => {
        const isCurrent = record.is_current === 1
        const isSwitching = switchingIds.has(record.id)
        return (
          <Button
            type={isCurrent ? 'default' : 'primary'}
            size="small"
            icon={<SwapOutlined />}
            loading={isSwitching}
            disabled={isCurrent || isSwitching}
            onClick={() => handleSwitchEnterprise(record.id, record.name)}
          >
            {isCurrent ? '当前企业' : '切换'}
          </Button>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>欢迎使用 Workbench 工作台</Title>
      
      {userInfo && (
        <>
          <Card
            title={
              <span>
                <UserOutlined style={{ marginRight: 8 }} />
                个人信息
              </span>
            }
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label="用户ID">{userInfo.id}</Descriptions.Item>
              <Descriptions.Item label="用户名">{userInfo.username}</Descriptions.Item>
              {userInfo.display_name && (
                <Descriptions.Item label="显示名称">{userInfo.display_name}</Descriptions.Item>
              )}
              {userInfo.email && (
                <Descriptions.Item label="邮箱">{userInfo.email}</Descriptions.Item>
              )}
              {userInfo.phone && (
                <Descriptions.Item label="手机号">{userInfo.phone}</Descriptions.Item>
              )}
              {userInfo.answer_type && (
                <Descriptions.Item label="接听方式">{userInfo.answer_type}</Descriptions.Item>
              )}
              <Descriptions.Item label="SIP帐号">{userInfo.sip_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="SIP密码">{userInfo.sip_password || '-'}</Descriptions.Item>
              {userInfo.mobile && (
                <Descriptions.Item label="接听手机">{userInfo.mobile}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {userInfo.enterprises && userInfo.enterprises.length > 0 && (
            <Card
              title={
                <span>
                  <BankOutlined style={{ marginRight: 8 }} />
                  企业列表
                </span>
              }
            >
              <Table
                columns={enterpriseColumns}
                dataSource={userInfo.enterprises}
                rowKey="id"
                pagination={false}
              />
            </Card>
          )}
        </>
      )}
    </Space>
  )
}

export default Dashboard

