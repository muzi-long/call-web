import { useState, useEffect, useRef } from 'react'
import { Card, Table, Typography, Spin, message, Tag } from 'antd'
import { PhoneOutlined } from '@ant-design/icons'
import { getCurrentEnterpriseTrunkNumbers, type TrunkNumberInfo } from '../api/trunkNumber'
import { formatDateTime } from '@common/utils/date'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

function TrunkNumber() {
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<TrunkNumberInfo[]>([])
  const hasFetched = useRef(false)

  useEffect(() => {
    // 防止 React.StrictMode 导致的重复请求
    if (hasFetched.current) {
      return
    }

    const fetchData = async () => {
      try {
        hasFetched.current = true
        setLoading(true)
        const data = await getCurrentEnterpriseTrunkNumbers()
        setDataSource(data)
      } catch (error) {
        console.error('获取中继号码列表失败:', error)
        message.error('获取中继号码列表失败')
        hasFetched.current = false // 请求失败时重置，允许重试
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 方向映射
  const directionMap: Record<string, { text: string; color: string }> = {
    in: { text: '呼入', color: 'blue' },
    out: { text: '呼出', color: 'green' },
    all: { text: '呼入呼出', color: 'purple' },
  }

  // 表格列定义
  const columns: ColumnsType<TrunkNumberInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '号码名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '中继号码',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: '号码前缀',
      dataIndex: 'prefix',
      key: 'prefix',
      render: (prefix: string) => prefix || '-',
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      width: 120,
      render: (direction: 'in' | 'out' | 'all') => {
        const directionInfo = directionMap[direction] || { text: '未知', color: 'default' }
        return <Tag color={directionInfo.color}>{directionInfo.text}</Tag>
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expiration_at',
      key: 'expiration_at',
      width: 180,
      render: (expirationAt: string) => expirationAt ? formatDateTime(expirationAt) : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (updatedAt: string) => formatDateTime(updatedAt),
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
    <>
      <Title level={2}>中继号码</Title>
      <Card
        style={{ marginTop: 24 }}
        title={
          <span>
            <PhoneOutlined style={{ marginRight: 8 }} />
            当前企业的中继号码列表
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>
    </>
  )
}

export default TrunkNumber

